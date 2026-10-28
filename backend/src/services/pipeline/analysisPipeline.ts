import { MonitoredRepository, IMonitoredRepository } from '../../models/MonitoredRepository';
import { PortfolioEntry, IPortfolioEntry } from '../../models/PortfolioEntry';
import { RepositoryAnalysis } from '../../models/RepositoryAnalysis';
import { ProcessingJob, IProcessingJob } from '../../models/ProcessingJob';
import { GitHubService } from '../github/githubService';
import { getAIProvider } from '../ai/aiService';
import { scanForSecrets } from '../security/secretScanner';
import { evaluateChangeSignificance } from '../classifier/deterministicClassifier';
import { config } from '../../config';

export interface AnalysisPipelineResult {
  success: boolean;
  portfolioEntryId?: string;
  isNewEntry: boolean;
  wasUpdated: boolean;
  publicationStatus: string;
  warnings: string[];
  message: string;
}

export class AnalysisPipeline {
  private githubService: GitHubService;

  constructor(githubService?: GitHubService) {
    this.githubService = githubService || new GitHubService();
  }

  /**
   * Run end-to-end analysis for a repository push or initial scan
   */
  async processJob(jobId: string): Promise<AnalysisPipelineResult> {
    const job = await ProcessingJob.findOne({ jobId });
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Mark job in-progress
    job.status = 'processing';
    job.progress = 10;
    job.attempts += 1;
    await job.save();

    const repo = await MonitoredRepository.findById(job.repoId);
    if (!repo) {
      job.status = 'failed';
      job.errorMessage = 'Associated repository record not found';
      await job.save();
      throw new Error(job.errorMessage);
    }

    try {
      // 1. Stale-Job Protection
      if (job.isStale) {
        job.status = 'completed';
        job.errorMessage = 'Skipped because a newer commit has already been processed';
        await job.save();
        return {
          success: true,
          isNewEntry: false,
          wasUpdated: false,
          publicationStatus: 'skipped_stale',
          warnings: ['Stale job skipped'],
          message: 'Stale job protected: older commit did not overwrite newer state',
        };
      }

      // 2. Change Significance Check (for pushes, not initial sync)
      if (job.triggerType === 'webhook_push') {
        const significance = evaluateChangeSignificance([], [job.commitSha]);
        if (!significance.isSignificant && significance.category === 'insignificant_formatting') {
          job.status = 'completed';
          job.progress = 100;
          job.completedAt = new Date();
          await job.save();

          repo.lastProcessedCommitSha = job.commitSha;
          repo.lastAnalysisStatus = 'success';
          await repo.save();

          return {
            success: true,
            isNewEntry: false,
            wasUpdated: false,
            publicationStatus: 'ignored_insignificant',
            warnings: [],
            message: `Insignificant change ignored: ${significance.reason}`,
          };
        }
      }

      job.progress = 30;
      await job.save();

      // 3. Context Retrieval
      const [owner, name] = repo.fullName.split('/');
      const [tree, readme] = await Promise.all([
        this.githubService.fetchRepoTree(owner, name, repo.monitoredBranch),
        this.githubService.fetchReadme(owner, name, repo.monitoredBranch),
      ]);

      // 4. Secret & Sensitive Data Scanning
      const secretCheck = scanForSecrets(readme);
      const warnings = [...secretCheck.redactedWarnings];
      const sensitiveBlocked = secretCheck.hasSecret;

      job.progress = 60;
      await job.save();

      // 5. AI Synthesis
      const aiProvider = getAIProvider();
      const aiOutput = await aiProvider.analyzeRepository({
        repoName: repo.name,
        repoOwner: repo.owner,
        repoUrl: repo.htmlUrl,
        isPrivate: repo.isPrivate,
        defaultBranch: repo.defaultBranch,
        fileTree: tree,
        readmeContent: readme,
        commitMessages: [job.commitSha],
      });

      // 6. Persist RepositoryAnalysis record
      const analysisRecord = await RepositoryAnalysis.create({
        repoId: repo._id,
        repoFullName: repo.fullName,
        commitSha: job.commitSha,
        previousCommitSha: job.previousCommitSha,
        branch: job.branch,
        coverage: job.triggerType === 'webhook_push' ? 'incremental_push' : 'full_repo',
        overallPurpose: aiOutput.purposeOfTheProject,
        repositoryType: aiOutput.primaryCategory,
        primaryCategory: aiOutput.primaryCategory,
        secondaryCategories: aiOutput.secondaryCategories,
        detectedTechnologies: aiOutput.technologiesAndLanguages,
        features: aiOutput.mainFeatures,
        practicalLabs: aiOutput.practicalLabs,
        technicalConcepts: aiOutput.suggestedTags,
        architectureSummary: aiOutput.architectureSummary,
        demonstratedContributions: aiOutput.demonstratedContributions,
        evidence: aiOutput.evidence,
        warnings: warnings,
        sensitiveContentBlocked: sensitiveBlocked,
        sensitiveWarnings: warnings,
        confidenceScore: aiOutput.confidenceScore,
        rawOutput: aiOutput,
      });

      job.progress = 80;
      await job.save();

      // 7. Portfolio Matching & Updating
      let entry = await PortfolioEntry.findOne({ repoId: repo._id });
      let isNew = false;

      // Determine publication policy
      let targetPubStatus: 'published' | 'draft' | 'needs_review' | 'archived' = 'published';
      if (sensitiveBlocked) {
        targetPubStatus = 'draft';
      } else if (repo.isPrivate && config.publication.blockPrivateByDefault) {
        targetPubStatus = 'draft';
      } else if (aiOutput.confidenceScore < config.publication.confidenceThreshold) {
        targetPubStatus = 'needs_review';
      }

      if (!entry) {
        isNew = true;
        const cleanSlug = repo.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        entry = new PortfolioEntry({
          repoId: repo._id,
          sourceRepoFullName: repo.fullName,
          sourceRepoHtmlUrl: repo.htmlUrl,
          slug: cleanSlug,
          title: aiOutput.projectTitle,
          overview: aiOutput.shortSummary,
          detailedDescription: aiOutput.detailedDescription,
          entryType: aiOutput.practicalLabs.length > 0 ? 'lab_collection' : 'project',
          primaryCategory: aiOutput.primaryCategory,
          secondaryCategories: aiOutput.secondaryCategories,
          technologies: aiOutput.technologiesAndLanguages,
          features: aiOutput.mainFeatures.map((f) => ({
            name: f.name,
            description: f.status,
            evidenceFile: f.evidenceFile,
          })),
          practicalLabs: aiOutput.practicalLabs,
          technicalConcepts: aiOutput.suggestedTags,
          architectureSummary: aiOutput.architectureSummary,
          demonstratedContributions: aiOutput.demonstratedContributions,
          completionStatus: aiOutput.currentDevelopmentStatus,
          isFeatured: false,
          publicationStatus: targetPubStatus,
          sensitiveContentBlocked: sensitiveBlocked,
          sensitiveWarnings: warnings,
          manualOverrides: {
            title: false,
            overview: false,
            detailedDescription: false,
            primaryCategory: false,
            technologies: false,
            publicationStatus: false,
            isFeatured: false,
          },
          lastAnalysedCommitSha: job.commitSha,
          contentVersion: 1,
          lastPublishedAt: targetPubStatus === 'published' ? new Date() : undefined,
        });
      } else {
        // Update existing entry with MANUAL OVERRIDE PROTECTION
        const overrides = entry.manualOverrides || {};

        if (!overrides.title) {
          entry.title = aiOutput.projectTitle;
        }
        if (!overrides.overview) {
          entry.overview = aiOutput.shortSummary;
        }
        if (!overrides.detailedDescription) {
          entry.detailedDescription = aiOutput.detailedDescription;
        }
        if (!overrides.primaryCategory) {
          entry.primaryCategory = aiOutput.primaryCategory;
          entry.secondaryCategories = aiOutput.secondaryCategories;
        }
        if (!overrides.technologies) {
          entry.technologies = aiOutput.technologiesAndLanguages;
        }

        // Keep features and labs updated
        if (aiOutput.mainFeatures.length > 0) {
          entry.features = aiOutput.mainFeatures.map((f) => ({
            name: f.name,
            description: f.status,
            evidenceFile: f.evidenceFile,
          }));
        }
        if (aiOutput.practicalLabs.length > 0) {
          entry.practicalLabs = aiOutput.practicalLabs;
        }

        if (aiOutput.architectureSummary) {
          entry.architectureSummary = aiOutput.architectureSummary;
        }
        if (aiOutput.demonstratedContributions.length > 0) {
          entry.demonstratedContributions = aiOutput.demonstratedContributions;
        }

        // Sensitive blocks always enforce safe status
        if (sensitiveBlocked) {
          entry.publicationStatus = 'draft';
          entry.sensitiveContentBlocked = true;
          entry.sensitiveWarnings = warnings;
        } else if (!overrides.publicationStatus) {
          entry.publicationStatus = targetPubStatus;
          if (targetPubStatus === 'published' && !entry.lastPublishedAt) {
            entry.lastPublishedAt = new Date();
          }
        }

        entry.lastAnalysedCommitSha = job.commitSha;
        entry.contentVersion += 1;
      }

      await entry.save();

      // 8. Update Repository state
      repo.lastProcessedCommitSha = job.commitSha;
      repo.lastAnalysisStatus = sensitiveBlocked ? 'needs_review' : 'success';
      repo.lastError = sensitiveBlocked ? 'Sensitive content blocked' : undefined;
      await repo.save();

      // 9. Complete Job
      job.status = sensitiveBlocked ? 'blocked_sensitive' : 'completed';
      job.progress = 100;
      job.completedAt = new Date();
      await job.save();

      return {
        success: true,
        portfolioEntryId: entry._id.toString(),
        isNewEntry: isNew,
        wasUpdated: !isNew,
        publicationStatus: entry.publicationStatus,
        warnings,
        message: isNew
          ? `Created new portfolio entry "${entry.title}" (${entry.publicationStatus})`
          : `Updated existing portfolio entry "${entry.title}" (version ${entry.contentVersion})`,
      };
    } catch (err: any) {
      console.error(`[AnalysisPipeline] Failure in job ${jobId}:`, err);
      job.status = 'failed';
      job.errorMessage = err.message || 'Unknown analysis pipeline error';
      await job.save();

      repo.lastAnalysisStatus = 'failed';
      repo.lastError = job.errorMessage;
      await repo.save();

      throw err;
    }
  }
}
