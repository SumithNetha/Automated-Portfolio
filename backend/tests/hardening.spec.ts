import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Resume } from '../src/models/Resume';
import { MonitoredRepository } from '../src/models/MonitoredRepository';
import { PortfolioEntry } from '../src/models/PortfolioEntry';
import { RepositoryAnalysis } from '../src/models/RepositoryAnalysis';
import { ProcessingJob } from '../src/models/ProcessingJob';
import resumeRouter from '../src/routes/resume';
import adminRouter from '../src/routes/admin';
import { jobQueue } from '../src/services/queue/jobQueue';
import { scanForSecrets } from '../src/services/security/secretScanner';
import { connectDatabase } from '../src/db/connection';
import { config } from '../src/config';

describe('Architectural Hardening & Bug Fixes Specification', { timeout: 30000 }, () => {
  let mongoServer: MongoMemoryServer;
  let app: express.Express;
  let adminAuthHeader: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ binary: { version: '6.0.13' } });
    await mongoose.connect(mongoServer.getUri());

    const token = jwt.sign(
      { id: 'admin_id_123', email: 'admin@portfolio.local', role: 'admin' },
      config.sessionSecret,
      { expiresIn: '1h' }
    );
    adminAuthHeader = `Bearer ${token}`;

    app = express();
    app.set('trust proxy', 1);
    app.use(express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = Buffer.from(buf);
      },
    }));

    app.use('/api/resume', resumeRouter);
    app.use('/api/admin', adminRouter);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('Part 1.2: Database-Backed Resume Storage', () => {
    it('stores PDF buffer in MongoDB and serves /view (inline) and /download (attachment)', async () => {
      const samplePdf = Buffer.from('%PDF-1.4 test resume content');
      await Resume.findOneAndUpdate(
        {},
        {
          filename: 'Sumith_Mittapelli_Resume.pdf',
          contentType: 'application/pdf',
          data: samplePdf,
          size: samplePdf.length,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      // Test GET /api/resume/view -> Content-Disposition: inline
      const viewRes = await request(app).get('/api/resume/view');
      expect(viewRes.status).toBe(200);
      expect(viewRes.headers['content-type']).toContain('application/pdf');
      expect(viewRes.headers['content-disposition']).toContain('inline');

      // Test GET /api/resume/download -> Content-Disposition: attachment
      const downloadRes = await request(app).get('/api/resume/download');
      expect(downloadRes.status).toBe(200);
      expect(downloadRes.headers['content-type']).toContain('application/pdf');
      expect(downloadRes.headers['content-disposition']).toContain('attachment');
      expect(downloadRes.headers['content-disposition']).toContain('Sumith_Mittapelli_Resume.pdf');
    });
  });

  describe('Part 1.3: Production DB Memory Startup Guard', () => {
    it('throws fatal error if NODE_ENV is production and MONGODB_URI is memory', async () => {
      const origEnv = process.env.NODE_ENV;
      const origUri = process.env.MONGODB_URI;

      await mongoose.disconnect();

      try {
        process.env.NODE_ENV = 'production';
        process.env.MONGODB_URI = 'memory';

        await expect(connectDatabase()).rejects.toThrow(
          /Fatal Startup Configuration Error/i
        );
      } finally {
        process.env.NODE_ENV = origEnv;
        process.env.MONGODB_URI = origUri;
        // Reconnect for subsequent tests
        await mongoose.connect(mongoServer.getUri());
      }
    });
  });

  describe('Part 1.4: Atomic Job Queue Claiming & Commit Debouncing', () => {
    it('coalesces rapid commits into pending job instead of creating duplicates', async () => {
      const repoId = new mongoose.Types.ObjectId();
      const pendingJob = await ProcessingJob.create({
        jobId: 'pending_debounce_job_1',
        triggerType: 'webhook_push',
        repoId,
        repoFullName: 'SumithNetha/rapid-push-repo',
        commitSha: 'commit_sha_1',
        branch: 'main',
        status: 'pending',
        isStale: false,
      });

      // Rapid follow-up commit while pendingJob is still pending
      const coalescedJob = await jobQueue.enqueueJob({
        triggerType: 'webhook_push',
        repoId,
        repoFullName: 'SumithNetha/rapid-push-repo',
        commitSha: 'commit_sha_2',
        branch: 'main',
      });

      expect(coalescedJob.jobId).toBe(pendingJob.jobId);
      expect(coalescedJob.commitSha).toBe('commit_sha_2');

      const dbJob = await ProcessingJob.findOne({ jobId: pendingJob.jobId });
      expect(dbJob?.commitSha).toBe('commit_sha_2');
    });
  });

  describe('Part 1.5: Secret Scanner ReDoS Protection', () => {
    it('ignores lockfiles and minified files', () => {
      const lockfileResult = scanForSecrets('password = "12345"', 'package-lock.json');
      expect(lockfileResult.hasSecret).toBe(false);

      const pnpmResult = scanForSecrets('secret_token = "abc"', 'pnpm-lock.yaml');
      expect(pnpmResult.hasSecret).toBe(false);

      const minifiedResult = scanForSecrets('apiKey: "test-secret"', 'bundle.min.js');
      expect(minifiedResult.hasSecret).toBe(false);
    });

    it('safely handles lines exceeding 1,000 characters without ReDoS hanging', () => {
      const hugeLine = 'a'.repeat(20000);
      const start = Date.now();
      const result = scanForSecrets(hugeLine, 'large_file.js');
      const elapsed = Date.now() - start;

      expect(result.hasSecret).toBe(false);
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('Part 1.6 & 3.2: Re-Analyze Endpoint and Diff View', () => {
    it('enqueues fresh analysis on POST /api/admin/repositories/:id/reanalyze', async () => {
      const repo = await MonitoredRepository.create({
        githubRepoId: 887711,
        fullName: 'SumithNetha/reanalyze-test-repo',
        name: 'reanalyze-test-repo',
        owner: 'SumithNetha',
        htmlUrl: 'https://github.com/SumithNetha/reanalyze-test-repo',
        isPrivate: false,
        isMonitored: true,
        primaryCategory: 'Software Projects',
        defaultBranch: 'main',
        monitoredBranch: 'main',
        lastAnalysisStatus: 'idle',
      });

      const res = await request(app)
        .post(`/api/admin/repositories/${repo._id}/reanalyze`)
        .set('Authorization', adminAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.jobId).toBeDefined();

      const updatedRepo = await MonitoredRepository.findById(repo._id);
      expect(['pending', 'processing', 'idle', 'success']).toContain(updatedRepo?.lastAnalysisStatus);
    });

    it('returns side-by-side diff comparison on GET /api/admin/portfolio/:id/analysis-diff', async () => {
      const repo = await MonitoredRepository.create({
        githubRepoId: 887722,
        fullName: 'SumithNetha/diff-test-repo',
        name: 'diff-test-repo',
        owner: 'SumithNetha',
        htmlUrl: 'https://github.com/SumithNetha/diff-test-repo',
        isPrivate: false,
        isMonitored: true,
        primaryCategory: 'Web Development',
        defaultBranch: 'main',
      });

      const entry = await PortfolioEntry.create({
        repoId: repo._id,
        sourceRepoFullName: repo.fullName,
        sourceRepoHtmlUrl: repo.htmlUrl,
        slug: 'diff-test-repo',
        title: 'Original Title',
        overview: 'Original overview description.',
        detailedDescription: 'Original detailed description.',
        primaryCategory: 'Web Development',
        technologies: ['React', 'JavaScript'],
        features: [{ name: 'Feature 1' }],
        lastAnalysedCommitSha: 'sha_v1',
        contentVersion: 1,
      });

      await RepositoryAnalysis.create({
        repoId: repo._id,
        repoFullName: repo.fullName,
        commitSha: 'sha_v2',
        branch: 'main',
        overallPurpose: 'Proposed AI updated summary.',
        primaryCategory: 'Web Development',
        detectedTechnologies: ['React', 'TypeScript', 'Tailwind'],
        features: [{ name: 'Feature 1' }, { name: 'Feature 2 (New)' }],
        rawOutput: {
          projectTitle: 'Proposed AI Title',
          shortSummary: 'Proposed AI updated summary.',
        },
      });

      const res = await request(app)
        .get(`/api/admin/portfolio/${entry._id}/analysis-diff`)
        .set('Authorization', adminAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.current.title).toBe('Original Title');
      expect(res.body.data.proposed.title).toBe('Proposed AI Title');
      expect(res.body.data.proposed.overview).toBe('Proposed AI updated summary.');
      expect(res.body.data.proposed.technologies).toContain('TypeScript');
    });
  });
});
