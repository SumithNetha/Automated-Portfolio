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
    ownerName: { type: String, required: true, default: 'Sumith Mittapelli' },
    headline: { type: String, required: true, default: 'Software Engineer | Cloud & Networking' },
    bio: {
      type: String,
      required: true,
      default:
        'Computer Science graduate with professional experience as an Associate Software Engineer at Tech Mahindra. Interested in building software applications, working with AWS cloud infrastructure, exploring computer networking, and developing practical cybersecurity skills.',
    },
    avatarUrl: { type: String, default: '' },
    location: { type: String, default: 'Hyderabad, India' },
    email: { type: String, default: 'm.sumith231@gmail.com' },
    githubUsername: { type: String, default: 'SumithNetha' },
    linkedinUrl: { type: String, default: 'https://www.linkedin.com/in/sumith-mittapelli-6aa6a0200' },
    twitterUrl: { type: String, default: '' },
    websiteUrl: { type: String, default: 'https://github.com/SumithNetha' },
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
