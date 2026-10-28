import { Router, Response } from 'express';
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
    if (featuredSkills !== undefined) profile.featuredSkills = featuredSkills;
    if (publicationSettings !== undefined) profile.publicationSettings = publicationSettings;

    await profile.save();

    res.json({ success: true, data: profile, message: 'Profile settings updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
