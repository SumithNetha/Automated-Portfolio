import mongoose, { Schema, Document } from 'mongoose';

export interface IModuleCache extends Document {
  repoFullName: string;
  moduleName: string;
  files: string[];
  contentHash: string;
  summary: string;
  keyComponents: string[];
  apisExposed: string[];
  databaseInteractions: string[];
  evidenceClaims: Array<{ claim: string; filePath: string; lineSnippet?: string }>;
  status: 'implemented' | 'in_progress' | 'planned';
  commitSha: string;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleCacheSchema = new Schema<IModuleCache>(
  {
    repoFullName: { type: String, required: true, index: true },
    moduleName: { type: String, required: true },
    files: [{ type: String }],
    contentHash: { type: String, required: true },
    summary: { type: String, default: '' },
    keyComponents: [{ type: String }],
    apisExposed: [{ type: String }],
    databaseInteractions: [{ type: String }],
    evidenceClaims: [
      {
        claim: { type: String, required: true },
        filePath: { type: String, required: true },
        lineSnippet: { type: String },
      },
    ],
    status: { type: String, enum: ['implemented', 'in_progress', 'planned'], default: 'implemented' },
    commitSha: { type: String, required: true },
  },
  { timestamps: true }
);

ModuleCacheSchema.index({ repoFullName: 1, moduleName: 1 });
ModuleCacheSchema.index({ repoFullName: 1, contentHash: 1 });

export const ModuleCache = mongoose.models.ModuleCache || mongoose.model<IModuleCache>('ModuleCache', ModuleCacheSchema);

