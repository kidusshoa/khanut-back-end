import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
  message: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export const ActivityLog = mongoose.model<IActivityLog>(
  "ActivityLog",
  ActivityLogSchema
);
