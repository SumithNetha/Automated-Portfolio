import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProcessingJob extends Document {
  jobId: string;
  triggerType: 'webhook_push' | 'manual_initial' | 'manual_reanalysis' | 'retry';
  repoId: Types.ObjectId;
  repoFullName: string;
  commitSha: string;
  previousCommitSha?: string;
  branch: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'blocked_sensitive';
  progress: number;
  attempts: number;
  maxAttempts: number;
  errorMessage?: string;
  isStale: boolean;
  createdAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}

const ProcessingJobSchema = new Schema<IProcessingJob>(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    triggerType: {
      type: String,
      enum: ['webhook_push', 'manual_initial', 'manual_reanalysis', 'retry'],
      required: true,
    },
    repoId: { type: Schema.Types.ObjectId, ref: 'MonitoredRepository', required: true, index: true },
    repoFullName: { type: String, required: true, index: true },
    commitSha: { type: String, required: true },
    previousCommitSha: { type: String },
    branch: { type: String, default: 'main' },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed', 'blocked_sensitive'],
      default: 'queued',
      index: true,
    },
    progress: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    errorMessage: { type: String },
    isStale: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const ProcessingJob = mongoose.model<IProcessingJob>('ProcessingJob', ProcessingJobSchema);
