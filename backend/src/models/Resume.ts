import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  filename: string;
  contentType: string;
  data: Buffer;
  size: number;
  updatedAt: Date;
  createdAt: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    filename: { type: String, required: true, default: 'Sumith_Mittapelli_Resume.pdf' },
    contentType: { type: String, required: true, default: 'application/pdf' },
    data: { type: Buffer, required: true },
    size: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Resume = mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);

