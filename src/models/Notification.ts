import mongoose, { Document, Model } from 'mongoose';

export interface NotificationBase {
  userId?: string;
  // contacts?: { user: string }[];
  notifications?: { user: string }[];
}

type NotificationSchema = NotificationBase & Document;

interface NotificationModel extends Model<NotificationSchema> {}

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notifications: [
      {
        senderUserId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        module: {
          type: String,
          required: true,
        },
        action: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        dateSent: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: Boolean,
        },
      },
      { timestamps: true },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<NotificationSchema, NotificationModel>(
  'Notification',
  NotificationSchema
);
