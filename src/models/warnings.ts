import mongoose, { Schema, Document } from "mongoose";

export interface IWarning extends Document {
  userId: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  reason: string;
  createdAt: Date;
}

const WarningSchema = new Schema<IWarning>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
  },
  { timestamps: true }
);

export const Warning = mongoose.model<IWarning>("Warning", WarningSchema);
