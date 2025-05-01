import mongoose, { Schema, Document } from "mongoose";

export interface IStaffUnavailability extends Document {
  staffId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StaffUnavailabilitySchema: Schema = new Schema(
  {
    staffId: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
    },
  },
  { timestamps: true }
);

export const StaffUnavailability = mongoose.model<IStaffUnavailability>(
  "StaffUnavailability",
  StaffUnavailabilitySchema
);
