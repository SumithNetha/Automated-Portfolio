import mongoose, { Schema, Document } from 'mongoose';

export interface IProfile extends Document {
  ownerName: string;
  headline: string;
  bio: string;
  avatarUrl?: string;
  location?: string;
  email?: string;
  githubUsername?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  resumeUrl?: string;
  resumeDownloadUrl?: string;
  resumeFileName?: string;
  resumeUpdatedAt?: Date;
  resumeFileSize?: number;
  featuredSkills: string[];
  publicationSettings: {
    autoPublishConfident: boolean;
    requireReviewOnSensitive: boolean;
    blockPrivateByDefault: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    ownerName: { type: String, required: true, default: 'Portfolio Owner' },
    headline: { type: String, required: true, default: 'Senior Software Engineer & Network Architect' },
    bio: {
      type: String,
      required: true,
      default: 'Building high-performance software, cloud architectures, and practical networking laboratories with an evidence-driven approach.',
    },
    avatarUrl: { type: String, default: '' },
    location: { type: String, default: '' },
    email: { type: String, default: '' },
    githubUsername: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
    twitterUrl: { type: String, default: '' },
    websiteUrl: { type: String, default: '' },
    resumeUrl: { type: String, default: '/resume.html' },
    resumeDownloadUrl: { type: String, default: '/resume.pdf' },
    resumeFileName: { type: String, default: 'Sumith_Mittapelli_Resume.pdf' },
    resumeUpdatedAt: { type: Date, default: Date.now },
    resumeFileSize: { type: Number, default: 98203 },
    featuredSkills: {
      type: [String],
      default: ['TypeScript', 'Node.js', 'React', 'Python', 'AWS', 'Cisco IOS', 'Docker', 'MongoDB'],
    },
    publicationSettings: {
      autoPublishConfident: { type: Boolean, default: true },
      requireReviewOnSensitive: { type: Boolean, default: true },
      blockPrivateByDefault: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const Profile = mongoose.model<IProfile>('Profile', ProfileSchema);
