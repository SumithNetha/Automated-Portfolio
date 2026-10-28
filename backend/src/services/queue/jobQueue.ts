import crypto from 'crypto';
import { ProcessingJob, IProcessingJob } from '../../models/ProcessingJob';
import { MonitoredRepository } from '../../models/MonitoredRepository';
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
   * Enqueue a job with deduplication and stale marking
   */
  async enqueueJob(params: {
    triggerType: 'webhook_push' | 'manual_initial' | 'manual_reanalysis' | 'retry';
    repoId: any;
    repoFullName: string;
    commitSha: string;
    previousCommitSha?: string;
    branch?: string;
  }): Promise<IProcessingJob> {
    const jobId = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Mark any existing queued jobs for the same repository as stale
    await ProcessingJob.updateMany(
      {
        repoId: params.repoId,
        status: 'queued',
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
      status: 'queued',
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
   * Process pending jobs in FIFO order
   */
  async processNextJobs(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (true) {
        const nextJob = await ProcessingJob.findOne({ status: 'queued' }).sort({ createdAt: 1 });
        if (!nextJob) break;

        console.log(`[JobQueue] Processing job ${nextJob.jobId} for ${nextJob.repoFullName} (${nextJob.commitSha.substring(0, 7)})`);

        try {
          await this.pipeline.processJob(nextJob.jobId);
          console.log(`[JobQueue] Job ${nextJob.jobId} completed successfully`);
        } catch (err: any) {
          console.error(`[JobQueue] Job ${nextJob.jobId} failed:`, err.message);

          if (nextJob.attempts < nextJob.maxAttempts && !nextJob.isStale) {
            console.log(`[JobQueue] Retrying job ${nextJob.jobId} (attempt ${nextJob.attempts}/${nextJob.maxAttempts})...`);
            nextJob.status = 'queued';
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
