import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IManualOverrides {
  title?: boolean;
  overview?: boolean;
  detailedDescription?: boolean;
  primaryCategory?: boolean;
  technologies?: boolean;
  publicationStatus?: boolean;
  isFeatured?: boolean;
  demoUrl?: boolean;
}

export interface IPortfolioEntry extends Document {
  repoId: Types.ObjectId;
  sourceRepoFullName: string;
  sourceRepoHtmlUrl: string;
  slug: string;
  title: string;
  overview: string;
  detailedDescription: string;
  entryType: 'project' | 'lab_collection' | 'learning_notes' | 'tool' | 'certification';
  primaryCategory: string;
  secondaryCategories: string[];
  technologies: string[];
  features: Array<{ name: string; description?: string; evidenceFile?: string }>;
  practicalLabs: Array<{ title: string; topics: string[]; evidenceFiles: string[] }>;
  existingModules: string[];
  recentPushUpdates: Array<{ commitSha: string; message: string; date: Date; addedInfo: string }>;
  technicalConcepts: string[];
  architectureSummary?: string;
  demonstratedContributions: string[];
  demoUrl?: string;
  completionStatus: 'completed' | 'in_progress' | 'experimental' | 'archived';
  isFeatured: boolean;
  publicationStatus: 'published' | 'draft' | 'needs_review' | 'archived';
  reviewReason?: string;
  sensitiveContentBlocked: boolean;
  sensitiveWarnings: string[];
  manualOverrides: IManualOverrides;
  lastAnalysedCommitSha: string;
  contentVersion: number;
  lastPublishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioEntrySchema = new Schema<IPortfolioEntry>(
  {
    repoId: { type: Schema.Types.ObjectId, ref: 'MonitoredRepository', required: true, index: true },
    sourceRepoFullName: { type: String, required: true, index: true },
    sourceRepoHtmlUrl: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    overview: { type: String, required: true },
    detailedDescription: { type: String, required: true },
    entryType: {
      type: String,
      enum: ['project', 'lab_collection', 'learning_notes', 'tool', 'certification'],
      default: 'project',
      index: true,
    },
    primaryCategory: { type: String, required: true, index: true },
    secondaryCategories: { type: [String], default: [] },
    technologies: { type: [String], default: [], index: true },
    features: [
      {
        name: { type: String, required: true },
        description: { type: String },
        evidenceFile: { type: String },
      },
    ],
    practicalLabs: [
      {
        title: { type: String, required: true },
        topics: { type: [String], default: [] },
        evidenceFiles: { type: [String], default: [] },
      },
    ],
    existingModules: { type: [String], default: [] },
    recentPushUpdates: [
      {
        commitSha: { type: String },
        message: { type: String },
        date: { type: Date, default: Date.now },
        addedInfo: { type: String },
      },
    ],
    technicalConcepts: { type: [String], default: [] },
    architectureSummary: { type: String },
    demonstratedContributions: { type: [String], default: [] },
    demoUrl: { type: String },
    completionStatus: {
      type: String,
      enum: ['completed', 'in_progress', 'experimental', 'archived'],
      default: 'in_progress',
    },
    isFeatured: { type: Boolean, default: false, index: true },
    publicationStatus: {
      type: String,
      enum: ['published', 'draft', 'needs_review', 'archived'],
      default: 'published',
      index: true,
    },
    reviewReason: { type: String },
    sensitiveContentBlocked: { type: Boolean, default: false },
    sensitiveWarnings: { type: [String], default: [] },
    manualOverrides: {
      title: { type: Boolean, default: false },
      overview: { type: Boolean, default: false },
      detailedDescription: { type: Boolean, default: false },
      primaryCategory: { type: Boolean, default: false },
      technologies: { type: Boolean, default: false },
      publicationStatus: { type: Boolean, default: false },
      isFeatured: { type: Boolean, default: false },
    },
    lastAnalysedCommitSha: { type: String, default: '' },
    contentVersion: { type: Number, default: 1 },
    lastPublishedAt: { type: Date },
  },
  { timestamps: true }
);

PortfolioEntrySchema.index({ primaryCategory: 1, publicationStatus: 1 });
PortfolioEntrySchema.index({ isFeatured: 1, publicationStatus: 1 });

export const PortfolioEntry = mongoose.model<IPortfolioEntry>('PortfolioEntry', PortfolioEntrySchema);
