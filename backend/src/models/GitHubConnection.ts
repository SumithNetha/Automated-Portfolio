import mongoose, { Schema, Document } from 'mongoose';

export interface IGitHubConnection extends Document {
  connected: boolean;
  username: string;
  avatarUrl: string;
  authMethod: 'pat' | 'oauth';
  accessTokenEncrypted?: string;
  scopes: string[];
  lastSyncAt?: Date;
  statusMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GitHubConnectionSchema = new Schema<IGitHubConnection>(
  {
    connected: { type: Boolean, default: false },
    username: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    authMethod: { type: String, enum: ['pat', 'oauth'], default: 'pat' },
    accessTokenEncrypted: { type: String, select: false }, // Hidden by default for security
    scopes: { type: [String], default: [] },
    lastSyncAt: { type: Date },
    statusMessage: { type: String, default: '' },
  },
  { timestamps: true }
);

export const GitHubConnection = mongoose.model<IGitHubConnection>('GitHubConnection', GitHubConnectionSchema);
