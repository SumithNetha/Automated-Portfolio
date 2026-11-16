import crypto from 'crypto';
import { ProcessingJob, IProcessingJob } from '../../models/ProcessingJob';
import { AnalysisPipeline } from '../pipeline/analysisPipeline';

export class JobQueue {
  private static instance: JobQueue;
  private isProcessing: boolean = false;
  private pipeline: AnalysisPipeline;

  private constructor() {
    this.pipeline = new AnalysisPipeline();
  }

  public static getInstance(): JobQueue {
    if (!JobQueue.instance) {
      JobQueue.instance = new JobQueue();
    }
    return JobQueue.instance;
  }

  /**
   * Enqueue a job with rapid commit debouncing and stale marking
   */
  async enqueueJob(params: {
    triggerType: 'webhook_push' | 'manual_initial' | 'manual_reanalysis' | 'retry';
    repoId: any;
    repoFullName: string;
    commitSha: string;
    previousCommitSha?: string;
    branch?: string;
  }): Promise<IProcessingJob> {
    // Rapid Commit Debouncing:
    // When enqueueing a new webhook push for a repository that already has a pending job,
    // coalesce/update the existing pending job with the latest commit SHA instead of duplicating AI analysis.
    if (params.triggerType === 'webhook_push') {
      const existingPendingJob = await ProcessingJob.findOne({
        repoId: params.repoId,
        status: { $in: ['pending', 'queued'] },
        isStale: false,
      }).sort({ createdAt: -1 });

      if (existingPendingJob) {
        console.log(
          `[JobQueue] Debouncing rapid commit push for ${params.repoFullName}: coalescing job ${existingPendingJob.jobId} with latest commit ${params.commitSha.substring(0, 7)}`
        );
        existingPendingJob.commitSha = params.commitSha;
        if (params.previousCommitSha && !existingPendingJob.previousCommitSha) {
          existingPendingJob.previousCommitSha = params.previousCommitSha;
        }
        if (params.branch) {
          existingPendingJob.branch = params.branch;
        }
        await existingPendingJob.save();

        setImmediate(() => {
          this.processNextJobs().catch((err) => {
            console.error('[JobQueue] Error during job loop:', err);
          });
        });

        return existingPendingJob;
      }
    }

    const jobId = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Mark any existing pending/queued jobs for the same repository as stale
    await ProcessingJob.updateMany(
      {
        repoId: params.repoId,
        status: { $in: ['pending', 'queued'] },
      },
      {
        isStale: true,
      }
    );

    const job = await ProcessingJob.create({
      jobId,
      triggerType: params.triggerType,
      repoId: params.repoId,
      repoFullName: params.repoFullName,
      commitSha: params.commitSha,
      previousCommitSha: params.previousCommitSha,
      branch: params.branch || 'main',
      status: 'pending',
      progress: 0,
      attempts: 0,
      maxAttempts: 3,
    });

    // Asynchronously kick off processing without blocking the caller
    setImmediate(() => {
      this.processNextJobs().catch((err) => {
        console.error('[JobQueue] Error during job loop:', err);
      });
    });

    return job;
  }

  /**
   * Process pending jobs in FIFO order with atomic job claiming
   */
  async processNextJobs(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (true) {
        // Atomic Job Claiming:
        // Use findOneAndUpdate to atomically claim the next pending job and mark it as processing,
        // preventing race conditions between concurrent worker loops or instances.
        const nextJob = await ProcessingJob.findOneAndUpdate(
          { status: { $in: ['pending', 'queued'] }, isStale: false },
          { $set: { status: 'processing', startedAt: new Date() } },
          { sort: { createdAt: 1 }, new: true }
        );

        if (!nextJob) break;

        console.log(
          `[JobQueue] Processing job ${nextJob.jobId} for ${nextJob.repoFullName} (${nextJob.commitSha.substring(0, 7)})`
        );

        try {
          await this.pipeline.processJob(nextJob.jobId);
          console.log(`[JobQueue] Job ${nextJob.jobId} completed successfully`);
        } catch (err: any) {
          console.error(`[JobQueue] Job ${nextJob.jobId} failed:`, err.message);

          if (nextJob.attempts < nextJob.maxAttempts && !nextJob.isStale) {
            console.log(
              `[JobQueue] Retrying job ${nextJob.jobId} (attempt ${nextJob.attempts}/${nextJob.maxAttempts})...`
            );
            nextJob.status = 'pending';
            await nextJob.save();
          } else {
            nextJob.status = 'failed';
            nextJob.errorMessage = err.message || 'Exceeded maximum retry attempts';
            await nextJob.save();
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
}

export const jobQueue = JobQueue.getInstance();
