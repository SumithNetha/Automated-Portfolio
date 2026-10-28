import mongoose, { Schema, Document } from 'mongoose';

export interface IMonitoredRepository extends Document {
  githubRepoId: number;
  fullName: string; // e.g. "octocat/ccna-labs"
  name: string;
  owner: string;
  isPrivate: boolean;
  htmlUrl: string;
  description?: string;
  defaultBranch: string;
  monitoredBranch: string;
  isMonitored: boolean;
  primaryCategory: string;
  lastPushDetectedAt?: Date;
  lastProcessedCommitSha?: string;
  lastProcessedCommitMessage?: string;
  lastAnalysisStatus: 'idle' | 'pending' | 'success' | 'failed' | 'needs_review';
  lastError?: string;
  starsCount: number;
  forksCount: number;
  language?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MonitoredRepositorySchema = new Schema<IMonitoredRepository>(
  {
    githubRepoId: { type: Number, required: true, unique: true, index: true },
    fullName: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    owner: { type: String, required: true },
    isPrivate: { type: Boolean, default: false },
    htmlUrl: { type: String, required: true },
    description: { type: String, default: '' },
    defaultBranch: { type: String, default: 'main' },
    monitoredBranch: { type: String, default: 'main' },
    isMonitored: { type: Boolean, default: false, index: true },
    primaryCategory: { type: String, default: 'Software Projects' },
    lastPushDetectedAt: { type: Date },
    lastProcessedCommitSha: { type: String },
    lastProcessedCommitMessage: { type: String },
    lastAnalysisStatus: {
      type: String,
      enum: ['idle', 'pending', 'success', 'failed', 'needs_review'],
      default: 'idle',
      index: true,
    },
    lastError: { type: String },
    starsCount: { type: Number, default: 0 },
    forksCount: { type: Number, default: 0 },
    language: { type: String, default: '' },
  },
  { timestamps: true }
);

export const MonitoredRepository = mongoose.model<IMonitoredRepository>('MonitoredRepository', MonitoredRepositorySchema);
