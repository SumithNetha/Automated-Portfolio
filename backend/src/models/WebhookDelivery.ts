import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookDelivery extends Document {
  deliveryId: string;
  eventType: string;
  repoFullName: string;
  commitSha: string;
  status: 'accepted' | 'duplicate_ignored' | 'unmonitored_ignored' | 'failed';
  receivedAt: Date;
  summary?: string;
}

const WebhookDeliverySchema = new Schema<IWebhookDelivery>(
  {
    deliveryId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true },
    repoFullName: { type: String, required: true, index: true },
    commitSha: { type: String, required: true },
    status: {
      type: String,
      enum: ['accepted', 'duplicate_ignored', 'unmonitored_ignored', 'failed'],
      required: true,
      index: true,
    },
    receivedAt: { type: Date, default: Date.now },
    summary: { type: String },
  },
  { timestamps: true }
);

export const WebhookDelivery = mongoose.model<IWebhookDelivery>('WebhookDelivery', WebhookDeliverySchema);
