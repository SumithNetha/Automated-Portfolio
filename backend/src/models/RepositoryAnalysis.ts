import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEvidenceItem {
  claim: string;
  filePath: string;
  commitSha?: string;
  lineSnippet?: string;
}

export interface IFeatureItem {
  name: string;
  status: 'implemented' | 'in_progress' | 'planned';
  evidenceFile?: string;
}

export interface IPracticalLabItem {
  title: string;
  topics: string[];
  evidenceFiles: string[];
}

export interface IRepositoryAnalysis extends Document {
  repoId: Types.ObjectId;
  repoFullName: string;
  commitSha: string;
  previousCommitSha?: string;
  branch: string;
  analyzedAt: Date;
  coverage: string;
  overallPurpose: string;
  repositoryType: string;
  primaryCategory: string;
  secondaryCategories: string[];
  detectedTechnologies: string[];
  features: IFeatureItem[];
  practicalLabs: IPracticalLabItem[];
  technicalConcepts: string[];
  architectureSummary?: string;
  demonstratedContributions: string[];
  evidence: IEvidenceItem[];
  warnings: string[];
  sensitiveContentBlocked: boolean;
  sensitiveWarnings: string[];
  confidenceScore: number;
  rawOutput?: any;
  createdAt: Date;
  updatedAt: Date;
}

const RepositoryAnalysisSchema = new Schema<IRepositoryAnalysis>(
  {
    repoId: { type: Schema.Types.ObjectId, ref: 'MonitoredRepository', required: true, index: true },
    repoFullName: { type: String, required: true, index: true },
    commitSha: { type: String, required: true, index: true },
    previousCommitSha: { type: String },
    branch: { type: String, default: 'main' },
    analyzedAt: { type: Date, default: Date.now },
    coverage: { type: String, default: 'full_repo' },
    overallPurpose: { type: String, required: true },
    repositoryType: { type: String, default: 'software_project' },
    primaryCategory: { type: String, required: true },
    secondaryCategories: { type: [String], default: [] },
    detectedTechnologies: { type: [String], default: [] },
    features: [
      {
        name: { type: String, required: true },
        status: { type: String, enum: ['implemented', 'in_progress', 'planned'], default: 'implemented' },
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
    technicalConcepts: { type: [String], default: [] },
    architectureSummary: { type: String },
    demonstratedContributions: { type: [String], default: [] },
    evidence: [
      {
        claim: { type: String, required: true },
        filePath: { type: String, required: true },
        commitSha: { type: String },
        lineSnippet: { type: String },
      },
    ],
    warnings: { type: [String], default: [] },
    sensitiveContentBlocked: { type: Boolean, default: false },
    sensitiveWarnings: { type: [String], default: [] },
    confidenceScore: { type: Number, default: 0.9 },
    rawOutput: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const RepositoryAnalysis = mongoose.model<IRepositoryAnalysis>('RepositoryAnalysis', RepositoryAnalysisSchema);
