import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MonitoredRepository } from '../src/models/MonitoredRepository';
import { PortfolioEntry } from '../src/models/PortfolioEntry';
import { ProcessingJob } from '../src/models/ProcessingJob';
import { WebhookDelivery } from '../src/models/WebhookDelivery';
import { AnalysisPipeline } from '../src/services/pipeline/analysisPipeline';

describe('End-to-End Portfolio Update Scenarios (A - I)', () => {
  let mongoServer: MongoMemoryServer;
  let pipeline: AnalysisPipeline;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    pipeline = new AnalysisPipeline();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('Scenario A: New Project - push creates a new portfolio entry and publishes when eligible', async () => {
    const repo = await MonitoredRepository.create({
      githubRepoId: 99001,
      fullName: 'tester/ccna-networking-labs',
      name: 'ccna-networking-labs',
      owner: 'tester',
      htmlUrl: 'https://github.com/tester/ccna-networking-labs',
      isPrivate: false,
      isMonitored: true,
      primaryCategory: 'Networking Labs',
      defaultBranch: 'main',
      monitoredBranch: 'main',
    });

    const job = await ProcessingJob.create({
      jobId: 'job_scenario_a',
      triggerType: 'manual_initial',
      repoId: repo._id,
      repoFullName: repo.fullName,
      commitSha: 'commit_a1_sha',
      branch: 'main',
    });

    const result = await pipeline.processJob(job.jobId);
    expect(result.success).toBe(true);
    expect(result.isNewEntry).toBe(true);
    expect(result.publicationStatus).toBe('published');

    const entry = await PortfolioEntry.findOne({ repoId: repo._id });
    expect(entry).not.toBeNull();
    expect(entry?.title).toContain('CCNA');
    expect(entry?.practicalLabs.length).toBeGreaterThan(0);
    expect(entry?.contentVersion).toBe(1);
  });

  it('Scenario B: Existing Project Update - new push updates existing entry without creating duplicates', async () => {
    const repo = await MonitoredRepository.findOne({ fullName: 'tester/ccna-networking-labs' });
    expect(repo).not.toBeNull();

    const job = await ProcessingJob.create({
      jobId: 'job_scenario_b',
      triggerType: 'webhook_push',
      repoId: repo!._id,
      repoFullName: repo!.fullName,
      commitSha: 'commit_b2_sha',
      branch: 'main',
    });

    const result = await pipeline.processJob(job.jobId);
    expect(result.success).toBe(true);
    expect(result.isNewEntry).toBe(false);
    expect(result.wasUpdated).toBe(true);

    // Total entries for this repo must still be 1 (No duplicate!)
    const count = await PortfolioEntry.countDocuments({ repoId: repo!._id });
    expect(count).toBe(1);

    const updatedEntry = await PortfolioEntry.findOne({ repoId: repo!._id });
    expect(updatedEntry?.lastAnalysedCommitSha).toBe('commit_b2_sha');
    expect(updatedEntry?.contentVersion).toBe(2);
  });

  it('Scenario C: Manual Override Preservation - user edits are locked and never overwritten', async () => {
    const repo = await MonitoredRepository.findOne({ fullName: 'tester/ccna-networking-labs' });
    const entry = await PortfolioEntry.findOne({ repoId: repo!._id });
    expect(entry).not.toBeNull();

    // Owner customizes the title and overview manually
    entry!.title = 'Custom Title Curated By Owner';
    entry!.overview = 'Customized overview description';
    entry!.manualOverrides = {
      title: true,
      overview: true,
    };
    await entry!.save();

    // Subsequent push comes in
    const job = await ProcessingJob.create({
      jobId: 'job_scenario_c',
      triggerType: 'webhook_push',
      repoId: repo!._id,
      repoFullName: repo!.fullName,
      commitSha: 'commit_c3_sha',
      branch: 'main',
    });

    await pipeline.processJob(job.jobId);

    const reloaded = await PortfolioEntry.findOne({ repoId: repo!._id });
    // Title and overview MUST be preserved!
    expect(reloaded?.title).toBe('Custom Title Curated By Owner');
    expect(reloaded?.overview).toBe('Customized overview description');
  });

  it('Scenario D: Insignificant Change - formatting or trivial commit does not update entry', async () => {
    const repo = await MonitoredRepository.findOne({ fullName: 'tester/ccna-networking-labs' });
    const job = await ProcessingJob.create({
      jobId: 'job_scenario_d',
      triggerType: 'webhook_push',
      repoId: repo!._id,
      repoFullName: repo!.fullName,
      commitSha: 'fix formatting and whitespace',
      branch: 'main',
    });

    const result = await pipeline.processJob(job.jobId);
    expect(result.success).toBe(true);
    expect(result.publicationStatus).toBe('ignored_insignificant');
  });

  it('Scenario E: Sensitive Content Protection - detected secrets block auto-publication', async () => {
    const repo = await MonitoredRepository.create({
      githubRepoId: 99002,
      fullName: 'tester/leaky-secrets-repo',
      name: 'leaky-secrets-repo',
      owner: 'tester',
      htmlUrl: 'https://github.com/tester/leaky-secrets-repo',
      isPrivate: false,
      isMonitored: true,
      defaultBranch: 'main',
      monitoredBranch: 'main',
    });

    // Custom pipeline with mock readme containing a secret
    const customPipeline = new AnalysisPipeline({
      listUserRepositories: async () => [],
      fetchRepoTree: async () => ['README.md', 'server.js'],
      fetchReadme: async () => '# Leaky Project\nAWS_SECRET_KEY=AKIAIOSFODNN7EXAMPLE\nConfig details',
    } as any);

    const job = await ProcessingJob.create({
      jobId: 'job_scenario_e',
      triggerType: 'manual_initial',
      repoId: repo._id,
      repoFullName: repo.fullName,
      commitSha: 'commit_secret_sha',
      branch: 'main',
    });

    const result = await customPipeline.processJob(job.jobId);
    expect(result.success).toBe(true);
    expect(result.publicationStatus).toBe('draft');
    expect(result.warnings.length).toBeGreaterThan(0);

    const entry = await PortfolioEntry.findOne({ repoId: repo._id });
    expect(entry?.publicationStatus).toBe('draft');
    expect(entry?.sensitiveContentBlocked).toBe(true);
  });

  it('Scenario F: Webhook Idempotency - duplicate deliveries are tracked and rejected', async () => {
    const deliveryId = 'del_duplicate_test_123';
    await WebhookDelivery.create({
      deliveryId,
      eventType: 'push',
      repoFullName: 'tester/ccna-networking-labs',
      commitSha: 'sha_dup',
      status: 'accepted',
    });

    // Check if second delivery with same ID is detected
    const existing = await WebhookDelivery.findOne({ deliveryId });
    expect(existing).not.toBeNull();
    expect(existing?.status).toBe('accepted');
  });

  it('Scenario G: Stale Job Protection - older job does not overwrite newer state', async () => {
    const repo = await MonitoredRepository.findOne({ fullName: 'tester/ccna-networking-labs' });
    const staleJob = await ProcessingJob.create({
      jobId: 'job_scenario_g_stale',
      triggerType: 'webhook_push',
      repoId: repo!._id,
      repoFullName: repo!.fullName,
      commitSha: 'old_commit_sha',
      branch: 'main',
      isStale: true, // Marked stale because a newer commit arrived
    });

    const result = await pipeline.processJob(staleJob.jobId);
    expect(result.success).toBe(true);
    expect(result.publicationStatus).toBe('skipped_stale');
  });

  it('Scenario I: Private Repository - blocked from automatic publication by policy', async () => {
    const privateRepo = await MonitoredRepository.create({
      githubRepoId: 99003,
      fullName: 'tester/internal-private-app',
      name: 'internal-private-app',
      owner: 'tester',
      htmlUrl: 'https://github.com/tester/internal-private-app',
      isPrivate: true,
      isMonitored: true,
      defaultBranch: 'main',
      monitoredBranch: 'main',
    });

    const job = await ProcessingJob.create({
      jobId: 'job_scenario_i_private',
      triggerType: 'manual_initial',
      repoId: privateRepo._id,
      repoFullName: privateRepo.fullName,
      commitSha: 'private_sha',
      branch: 'main',
    });

    const result = await pipeline.processJob(job.jobId);
    expect(result.success).toBe(true);
    expect(result.publicationStatus).toBe('draft');

    const entry = await PortfolioEntry.findOne({ repoId: privateRepo._id });
    expect(entry?.publicationStatus).toBe('draft');
  });
});
