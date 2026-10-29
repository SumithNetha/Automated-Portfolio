import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { MonitoredRepository } from '../models/MonitoredRepository';
import { PortfolioEntry } from '../models/PortfolioEntry';
import { ProcessingJob } from '../models/ProcessingJob';
import { WebhookDelivery } from '../models/WebhookDelivery';
import { RepositoryAnalysis } from '../models/RepositoryAnalysis';
import { Profile } from '../models/Profile';
import { GitHubService } from '../services/github/githubService';
import { jobQueue } from '../services/queue/jobQueue';

const router = Router();
const githubService = new GitHubService();
router.use(requireAdmin);

/**
 * GET /api/admin/dashboard/stats
 */
router.get('/dashboard/stats', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      monitoredCount,
      totalEntries,
      publishedCount,
      reviewCount,
      activeJobsCount,
      failedJobsCount,
      recentPushes,
    ] = await Promise.all([
      MonitoredRepository.countDocuments({ isMonitored: true }),
      PortfolioEntry.countDocuments(),
      PortfolioEntry.countDocuments({ publicationStatus: 'published' }),
      PortfolioEntry.countDocuments({ publicationStatus: 'needs_review' }),
      ProcessingJob.countDocuments({ status: { $in: ['queued', 'processing'] } }),
      ProcessingJob.countDocuments({ status: 'failed' }),
      WebhookDelivery.find().sort({ receivedAt: -1 }).limit(10),
    ]);

    res.json({
      success: true,
      data: {
        monitoredCount,
        totalEntries,
        publishedCount,
        reviewCount,
        activeJobsCount,
        failedJobsCount,
        recentPushes,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/github/repos
 * Lists accessible repositories with their monitoring state
 */
router.get('/github/repos', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const githubService = new GitHubService();
    const remoteRepos = await githubService.listUserRepositories();

    // Fetch existing records from DB
    const dbRepos = await MonitoredRepository.find();
    const dbMap = new Map(dbRepos.map((r) => [r.githubRepoId, r]));

    const merged = remoteRepos.map((r) => {
      const existing = dbMap.get(r.id);
      return {
        id: r.id,
        name: r.name,
        fullName: r.fullName,
        owner: r.owner,
        isPrivate: r.isPrivate,
        htmlUrl: r.htmlUrl,
        description: r.description,
        defaultBranch: r.defaultBranch,
        starsCount: r.starsCount,
        forksCount: r.forksCount,
        language: r.language,
        isMonitored: existing ? existing.isMonitored : false,
        primaryCategory: existing ? existing.primaryCategory : 'Software Projects',
        lastAnalysisStatus: existing ? existing.lastAnalysisStatus : 'idle',
        lastPushDetectedAt: existing?.lastPushDetectedAt,
        lastProcessedCommitSha: existing?.lastProcessedCommitSha,
        dbId: existing?._id,
      };
    });

    res.json({ success: true, data: merged });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/github/monitor
 * Enable or disable monitoring for a repository
 */
router.post('/github/monitor', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      githubRepoId,
      fullName,
      name,
      owner,
      htmlUrl,
      isPrivate,
      defaultBranch,
      isMonitored,
      primaryCategory,
    } = req.body;

    if (!githubRepoId || !fullName) {
      res.status(400).json({ success: false, error: 'githubRepoId and fullName are required' });
      return;
    }

    let repo = await MonitoredRepository.findOne({ githubRepoId });

    if (!repo) {
      repo = new MonitoredRepository({
        githubRepoId,
        fullName,
        name,
        owner,
        htmlUrl,
        isPrivate: Boolean(isPrivate),
        defaultBranch: defaultBranch || 'main',
        monitoredBranch: defaultBranch || 'main',
        isMonitored: Boolean(isMonitored),
        primaryCategory: primaryCategory || 'Software Projects',
        lastAnalysisStatus: 'idle',
      });
    } else {
      repo.isMonitored = Boolean(isMonitored);
      if (primaryCategory) repo.primaryCategory = primaryCategory;
    }

    await repo.save();

    // If monitoring was enabled and never analyzed before, trigger initial analysis
    let initialJobId = null;
    if (repo.isMonitored && repo.lastAnalysisStatus === 'idle') {
      const job = await jobQueue.enqueueJob({
        triggerType: 'manual_initial',
        repoId: repo._id,
        repoFullName: repo.fullName,
        commitSha: 'initial_head',
        branch: repo.defaultBranch,
      });
      initialJobId = job.jobId;
      repo.lastAnalysisStatus = 'pending';
      await repo.save();
    }

    res.json({
      success: true,
      data: repo,
      initialJobId,
      message: repo.isMonitored
        ? `Monitoring enabled for ${repo.fullName}${initialJobId ? ' and initial analysis started' : ''}`
        : `Monitoring disabled for ${repo.fullName}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/github/sync/:repoId
 * Trigger manual reanalysis of a monitored repository
 */
router.post('/github/sync/:repoId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const repo = await MonitoredRepository.findById(req.params.repoId);
    if (!repo) {
      res.status(404).json({ success: false, error: 'Monitored repository not found' });
      return;
    }

    const job = await jobQueue.enqueueJob({
      triggerType: 'manual_reanalysis',
      repoId: repo._id,
      repoFullName: repo.fullName,
      commitSha: repo.lastProcessedCommitSha || 'manual_sync_head',
      branch: repo.monitoredBranch,
    });

    repo.lastAnalysisStatus = 'pending';
    await repo.save();

    res.json({
      success: true,
      message: `Full re-analysis enqueued for ${repo.fullName}`,
      jobId: job.jobId,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/github/reconcile
 * Queries GitHub in real time, auto-adds newly discovered repos, and auto-removes any repos deleted from GitHub!
 */
router.post('/github/reconcile', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const liveRepos = await githubService.listUserRepositories();
    const liveRepoFullNames = new Set(liveRepos.map((r: any) => r.fullName.toLowerCase()));
    const liveRepoIds = new Set(liveRepos.map((r: any) => r.id));

    // 1. Detect and remove repositories that were deleted on GitHub
    const existingRepos = await MonitoredRepository.find();
    const removed: string[] = [];

    for (const repo of existingRepos) {
      const isStillAlive = liveRepoFullNames.has(repo.fullName.toLowerCase()) || liveRepoIds.has(repo.githubRepoId);
      if (!isStillAlive) {
        console.log(`[Reconcile] Repository ${repo.fullName} no longer exists on GitHub. Auto-removing from portfolio...`);
        await PortfolioEntry.deleteMany({ repoId: repo._id });
        await MonitoredRepository.findByIdAndDelete(repo._id);
        removed.push(repo.fullName);
      }
    }

    // 2. Detect and auto-add any new repositories found on GitHub
    const added: string[] = [];
    for (const r of liveRepos) {
      let existing = await MonitoredRepository.findOne({
        $or: [{ githubRepoId: r.id }, { fullName: r.fullName.toLowerCase() }],
      });

      if (!existing) {
        const primaryCat = /ccna/i.test(r.name)
          ? 'Networking Labs'
          : /carcare/i.test(r.name)
          ? 'Web Development'
          : /intrusion|iot/i.test(r.name)
          ? 'Cybersecurity Projects'
          : /aws/i.test(r.name)
          ? 'Cloud Projects'
          : 'Software Projects';

        existing = await MonitoredRepository.create({
          githubRepoId: r.id,
          fullName: r.fullName,
          name: r.name,
          owner: r.owner,
          isPrivate: r.isPrivate,
          htmlUrl: r.htmlUrl,
          description: r.description,
          defaultBranch: r.defaultBranch,
          monitoredBranch: r.defaultBranch,
          isMonitored: true,
          primaryCategory: primaryCat,
          lastAnalysisStatus: 'idle',
        });

        await jobQueue.enqueueJob({
          triggerType: 'manual_initial',
          repoId: existing._id,
          repoFullName: existing.fullName,
          commitSha: 'initial_reconcile_sha',
          branch: existing.defaultBranch,
        });

        added.push(r.fullName);
      }
    }

    res.json({
      success: true,
      data: {
        totalLiveOnGitHub: liveRepos.length,
        addedRepos: added,
        removedDeletedRepos: removed,
      },
      message: `Reconciliation complete. Added ${added.length} new repos, removed ${removed.length} deleted repos.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/portfolio
 * List all entries for management
 */
router.get('/portfolio', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, category, search } = req.query;
    const query: any = {};

    if (status) query.publicationStatus = status;
    if (category) query.primaryCategory = category;
    if (search && typeof search === 'string') {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { overview: new RegExp(search, 'i') },
        { sourceRepoFullName: new RegExp(search, 'i') },
      ];
    }

    const entries = await PortfolioEntry.find(query).sort({ updatedAt: -1 });
    res.json({ success: true, count: entries.length, data: entries });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/portfolio/:id
 */
router.get('/portfolio/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entry = await PortfolioEntry.findById(req.params.id);
    if (!entry) {
      res.status(404).json({ success: false, error: 'Portfolio entry not found' });
      return;
    }
    res.json({ success: true, data: entry });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/admin/portfolio/:id
 * Edit portfolio entry with MANUAL OVERRIDE LOCKS
 */
router.put('/portfolio/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entry = await PortfolioEntry.findById(req.params.id);
    if (!entry) {
      res.status(404).json({ success: false, error: 'Portfolio entry not found' });
      return;
    }

    const {
      title,
      overview,
      detailedDescription,
      primaryCategory,
      technologies,
      publicationStatus,
      isFeatured,
      demoUrl,
    } = req.body;

    const overrides = entry.manualOverrides || {};

    if (title !== undefined && title !== entry.title) {
      entry.title = title;
      overrides.title = true;
    }
    if (overview !== undefined && overview !== entry.overview) {
      entry.overview = overview;
      overrides.overview = true;
    }
    if (detailedDescription !== undefined && detailedDescription !== entry.detailedDescription) {
      entry.detailedDescription = detailedDescription;
      overrides.detailedDescription = true;
    }
    if (primaryCategory !== undefined && primaryCategory !== entry.primaryCategory) {
      entry.primaryCategory = primaryCategory;
      overrides.primaryCategory = true;
    }
    if (technologies !== undefined) {
      entry.technologies = Array.isArray(technologies) ? technologies : entry.technologies;
      overrides.technologies = true;
    }
    if (publicationStatus !== undefined && publicationStatus !== entry.publicationStatus) {
      entry.publicationStatus = publicationStatus;
      overrides.publicationStatus = true;
      if (publicationStatus === 'published' && !entry.lastPublishedAt) {
        entry.lastPublishedAt = new Date();
      }
    }
    if (isFeatured !== undefined) {
      entry.isFeatured = Boolean(isFeatured);
      overrides.isFeatured = true;
    }
    if (demoUrl !== undefined) {
      entry.demoUrl = demoUrl;
      overrides.demoUrl = true;
    }

    entry.manualOverrides = overrides;
    await entry.save();

    res.json({
      success: true,
      data: entry,
      message: 'Portfolio entry updated with manual override protections preserved',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/portfolio/:id/approve
 */
router.post('/portfolio/:id/approve', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entry = await PortfolioEntry.findById(req.params.id);
    if (!entry) {
      res.status(404).json({ success: false, error: 'Portfolio entry not found' });
      return;
    }

    entry.publicationStatus = 'published';
    entry.sensitiveContentBlocked = false;
    entry.lastPublishedAt = new Date();
    await entry.save();

    res.json({
      success: true,
      data: entry,
      message: `Entry "${entry.title}" approved and published to portfolio.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/admin/portfolio/:id
 * Delete a portfolio entry completely from the portfolio
 */
router.delete('/portfolio/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entry = await PortfolioEntry.findByIdAndDelete(req.params.id);
    if (!entry) {
      res.status(404).json({ success: false, error: 'Portfolio entry not found' });
      return;
    }

    res.json({
      success: true,
      message: `Portfolio entry "${entry.title}" deleted successfully.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/admin/repositories/:id
 * Delete a monitored repository and its associated portfolio entry
 */
router.delete('/repositories/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const repo = await MonitoredRepository.findById(req.params.id);
    if (!repo) {
      res.status(404).json({ success: false, error: 'Repository not found' });
      return;
    }

    // Delete linked portfolio entries and processing jobs
    await PortfolioEntry.deleteMany({ repoId: repo._id });
    await ProcessingJob.deleteMany({ repoId: repo._id });
    await MonitoredRepository.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Repository "${repo.fullName}" and its portfolio entries removed.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/jobs
 */
router.get('/jobs', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const jobs = await ProcessingJob.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/jobs/:jobId/retry
 */
router.post('/jobs/:jobId/retry', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const job = await ProcessingJob.findOne({ jobId: req.params.jobId });
    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }

    job.status = 'queued';
    job.isStale = false;
    job.attempts = 0;
    job.errorMessage = undefined;
    await job.save();

    // Trigger queue loop
    setImmediate(() => {
      jobQueue.processNextJobs().catch((e) => console.error(e));
    });

    res.json({ success: true, message: `Job ${job.jobId} enqueued for retry` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/profile
 */
router.get('/profile', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    let profile = await Profile.findOne();
    if (!profile) {
      profile = await Profile.create({});
    }
    res.json({ success: true, data: profile });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/admin/profile
 */
router.put('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    let profile = await Profile.findOne();
    if (!profile) {
      profile = new Profile();
    }

    const {
      ownerName,
      headline,
      bio,
      avatarUrl,
      location,
      email,
      githubUsername,
      linkedinUrl,
      twitterUrl,
      websiteUrl,
      featuredSkills,
      resumeUrl,
      publicationSettings,
    } = req.body;

    if (ownerName !== undefined) profile.ownerName = ownerName;
    if (headline !== undefined) profile.headline = headline;
    if (bio !== undefined) profile.bio = bio;
    if (avatarUrl !== undefined) profile.avatarUrl = avatarUrl;
    if (location !== undefined) profile.location = location;
    if (email !== undefined) profile.email = email;
    if (githubUsername !== undefined) profile.githubUsername = githubUsername;
    if (linkedinUrl !== undefined) profile.linkedinUrl = linkedinUrl;
    if (twitterUrl !== undefined) profile.twitterUrl = twitterUrl;
    if (websiteUrl !== undefined) profile.websiteUrl = websiteUrl;
    if (resumeUrl !== undefined) profile.resumeUrl = resumeUrl;
    if (featuredSkills !== undefined) profile.featuredSkills = featuredSkills;
    if (publicationSettings !== undefined) profile.publicationSettings = publicationSettings;

    await profile.save();

    res.json({ success: true, data: profile, message: 'Profile settings updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/resume/upload
 * Upload and persist an updated resume file (PDF)
 */
router.post('/resume/upload', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { fileName, fileData } = req.body;
    if (!fileData) {
      res.status(400).json({ success: false, error: 'No file data provided' });
      return;
    }

    // Strip data URL scheme prefix if present
    const cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    // Destinations to write to ensure availability in both dev and production
    const frontendPublicPath = path.resolve(__dirname, '../../../frontend/public');
    const uploadsDir = path.resolve(__dirname, '../../uploads');

    if (!fs.existsSync(frontendPublicPath)) {
      fs.mkdirSync(frontendPublicPath, { recursive: true });
    }
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const publicFilePath = path.join(frontendPublicPath, 'resume.pdf');
    const uploadsFilePath = path.join(uploadsDir, 'resume.pdf');

    fs.writeFileSync(publicFilePath, buffer);
    fs.writeFileSync(uploadsFilePath, buffer);

    let profile = await Profile.findOne();
    if (!profile) {
      profile = new Profile();
    }

    const safeFileName = fileName ? path.basename(fileName) : 'Sumith_Mittapelli_Resume.pdf';
    profile.resumeFileName = safeFileName;
    profile.resumeUpdatedAt = new Date();
    profile.resumeFileSize = buffer.length;
    profile.resumeDownloadUrl = '/resume.pdf';
    await profile.save();

    res.json({
      success: true,
      message: 'Resume file uploaded successfully! The updated resume is now active for preview and download.',
      data: {
        fileName: profile.resumeFileName,
        fileSize: profile.resumeFileSize,
        updatedAt: profile.resumeUpdatedAt,
        downloadUrl: '/resume.pdf',
        previewUrl: '/resume.html',
      },
    });
  } catch (err: any) {
    console.error('[Resume Upload Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to upload resume file' });
  }
});

export default router;
