import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
  message: string;
  type?: string;
  userId?: string;
  userName?: string;
  businessId?: string;
  businessName?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    message: { type: String, required: true },
    type: { type: String },
    userId: { type: String },
    userName: { type: String },
    businessId: { type: String },
    businessName: { type: String },
  },
  { timestamps: true }
);

export const ActivityLog = mongoose.model<IActivityLog>(
  "ActivityLog",
  ActivityLogSchema
);
