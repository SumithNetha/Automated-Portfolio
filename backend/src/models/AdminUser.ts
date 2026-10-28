import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminUser extends Document {
  email: string;
  passwordHash: string;
  role: 'owner';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['owner'], default: 'owner' },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const AdminUser = mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);
