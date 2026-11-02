import { MonitoredRepository, IMonitoredRepository } from '../../models/MonitoredRepository';
import { PortfolioEntry, IPortfolioEntry } from '../../models/PortfolioEntry';
import { RepositoryAnalysis } from '../../models/RepositoryAnalysis';
import { ProcessingJob, IProcessingJob } from '../../models/ProcessingJob';
import { GitHubService } from '../github/githubService';
import { getAIProvider } from '../ai/aiService';
import { scanForSecrets } from '../security/secretScanner';
import { evaluateChangeSignificance, extractDemoUrl } from '../classifier/deterministicClassifier';
import { selectFilesForAnalysis } from '../analysis/fileSelector';
import { persistModuleSummaries } from '../analysis/moduleCache';
import { runStageBModuleAnalysis } from '../analysis/codeAnalyzer';
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

      const [owner, name] = repo.fullName.split('/');

      // 2. Fetch Actual Commit Metadata & Changed Files
      let commitMessage = job.commitSha;
      let changedFiles: string[] = [];

      try {
        if (typeof this.githubService.fetchCommitDetails === 'function') {
          const commitInfo = await this.githubService.fetchCommitDetails(owner, name, job.commitSha);
          if (commitInfo) {
            commitMessage = commitInfo.message;
            changedFiles = commitInfo.changedFiles;
          }
        }
      } catch (err) {
        console.warn(`[AnalysisPipeline] Could not fetch commit details for ${job.commitSha}:`, err);
      }

      if (job.previousCommitSha && changedFiles.length === 0) {
        try {
          if (typeof this.githubService.fetchChangedFilesBetweenCommits === 'function') {
            changedFiles = await this.githubService.fetchChangedFilesBetweenCommits(
              owner,
              name,
              job.previousCommitSha,
              job.commitSha
            );
          }
        } catch (err) {
          console.warn('[AnalysisPipeline] Could not diff commits:', err);
        }
      }

      // 3. Change Significance Check (for pushes, not initial sync)
      if (job.triggerType === 'webhook_push') {
        const significance = evaluateChangeSignificance(changedFiles, [commitMessage, job.commitSha]);
        if (!significance.isSignificant && significance.category === 'insignificant_formatting') {
          job.status = 'completed';
          job.progress = 100;
          job.completedAt = new Date();
          await job.save();

          repo.lastProcessedCommitSha = job.commitSha;
          repo.lastProcessedCommitMessage = commitMessage;
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

      job.progress = 25;
      await job.save();

      // 4. Context & Source File Retrieval
      const [tree, readme] = await Promise.all([
        this.githubService.fetchRepoTree(owner, name, repo.monitoredBranch),
        this.githubService.fetchReadme(owner, name, repo.monitoredBranch),
      ]);

      job.progress = 40;
      await job.save();

      // Select top architecturally significant source files
      const selectedFilePaths = selectFilesForAnalysis(tree, repo.name, {
        changedFiles,
        maxFiles: config.analysis?.maxSourceFiles || 25,
      });

      let fetchedFilesMap = new Map<string, string>();
      if (typeof this.githubService.fetchMultipleFiles === 'function') {
        fetchedFilesMap = await this.githubService.fetchMultipleFiles(
          owner,
          name,
          selectedFilePaths,
          repo.monitoredBranch,
          config.analysis?.maxConcurrency || 5
        );
      } else if (typeof (this.githubService as any).fetchFileContent === 'function') {
        for (const p of selectedFilePaths) {
          const content = await (this.githubService as any).fetchFileContent(owner, name, p, repo.monitoredBranch);
          if (content !== null && typeof content === 'string') {
            fetchedFilesMap.set(p, content);
          }
        }
      }
      const sourceFilesObj = Object.fromEntries(fetchedFilesMap.entries());

      // 5. Secret & Sensitive Data Scanning (Source files + README)
      const warnings: string[] = [];
      let sensitiveBlocked = false;

      const readmeSecretCheck = scanForSecrets(readme, 'README.md');
      if (readmeSecretCheck.hasSecret) {
        warnings.push(...readmeSecretCheck.redactedWarnings);
        sensitiveBlocked = true;
      }

      for (const [filePath, fileContent] of fetchedFilesMap.entries()) {
        const fileSecretCheck = scanForSecrets(fileContent, filePath);
        if (fileSecretCheck.hasSecret) {
          warnings.push(...fileSecretCheck.redactedWarnings);
          sensitiveBlocked = true;
        }
      }

      job.progress = 60;
      await job.save();

      // 6. AI Multi-Stage Synthesis
      const coverageMode =
        fetchedFilesMap.size > 0
          ? changedFiles.length > 0
            ? 'incremental_diff'
            : 'full_code'
          : 'readme_and_tree';

      const aiProvider = getAIProvider();
      const aiOutput = await aiProvider.analyzeRepository({
        repoName: repo.name,
        repoOwner: repo.owner,
        repoUrl: repo.htmlUrl,
        isPrivate: repo.isPrivate,
        defaultBranch: repo.defaultBranch,
        fileTree: tree,
        readmeContent: readme,
        sourceFiles: sourceFilesObj,
        changedFiles,
        actualCommitMessages: [commitMessage],
        commitMessages: [commitMessage],
        coverageMode,
      });

      // 7. Persist Module Cache for Incremental Analysis
      if (Object.keys(sourceFilesObj).length > 0) {
        try {
          const modAnalysis = runStageBModuleAnalysis(sourceFilesObj, repo.name);
          await persistModuleSummaries(repo.fullName, job.commitSha, modAnalysis.modules, sourceFilesObj);
        } catch (err) {
          console.warn('[AnalysisPipeline] Error caching module summaries:', err);
        }
      }

      job.progress = 75;
      await job.save();

      // 8. Persist RepositoryAnalysis record
      const analysisRecord = await RepositoryAnalysis.create({
        repoId: repo._id,
        repoFullName: repo.fullName,
        commitSha: job.commitSha,
        previousCommitSha: job.previousCommitSha,
        branch: job.branch,
        coverage: aiOutput.analysisCoverage || coverageMode,
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

      job.progress = 85;
      await job.save();

      // 9. Portfolio Matching & Updating
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

      // Determine live demonstration / implementation link
      const detectedDemoUrl = aiOutput.demoUrl || extractDemoUrl(readme, (repo as any).homepage);

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
          existingModules: aiOutput.existingModules,
          recentPushUpdates: [],
          technicalConcepts: aiOutput.suggestedTags,
          architectureSummary: aiOutput.architectureSummary,
          demonstratedContributions: aiOutput.demonstratedContributions,
          completionStatus: aiOutput.currentDevelopmentStatus,
          demoUrl: detectedDemoUrl,
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
            demoUrl: false,
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
        if (!overrides.demoUrl && detectedDemoUrl) {
          entry.demoUrl = detectedDemoUrl;
        }

        // Keep features, labs, and existing modules updated
        if (aiOutput.existingModules && aiOutput.existingModules.length > 0) {
          entry.existingModules = aiOutput.existingModules;
        }

        // Record push event update info with real commit message
        if (job.triggerType === 'webhook_push') {
          const displayMsg =
            commitMessage.length > 100 ? commitMessage.substring(0, 97) + '...' : commitMessage;
          entry.recentPushUpdates.unshift({
            commitSha: job.commitSha.substring(0, 7),
            message: displayMsg || `Push update on branch ${job.branch}`,
            date: new Date(),
            addedInfo: `Updated ${entry.primaryCategory} with verified code analysis.`,
          });
          // Limit history to 10
          if (entry.recentPushUpdates.length > 10) {
            entry.recentPushUpdates = entry.recentPushUpdates.slice(0, 10);
          }
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

      // 10. Update Repository state
      repo.lastProcessedCommitSha = job.commitSha;
      repo.lastProcessedCommitMessage = commitMessage;
      repo.lastAnalysisStatus = sensitiveBlocked ? 'needs_review' : 'success';
      repo.lastError = sensitiveBlocked ? 'Sensitive content blocked' : undefined;
      await repo.save();

      // 11. Complete Job
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
