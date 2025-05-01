import mongoose, { Schema, Document } from "mongoose";

export type AssignmentStatus = "assigned" | "confirmed" | "declined" | "completed";

export interface IStaffAssignment extends Document {
  staffId: mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  status: AssignmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StaffAssignmentSchema: Schema = new Schema(
  {
    staffId: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    status: {
      type: String,
      enum: ["assigned", "confirmed", "declined", "completed"],
      default: "assigned",
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

// Create a compound index to ensure a staff member can only be assigned once to an appointment
StaffAssignmentSchema.index({ staffId: 1, appointmentId: 1 }, { unique: true });

export const StaffAssignment = mongoose.model<IStaffAssignment>(
  "StaffAssignment",
  StaffAssignmentSchema
);
