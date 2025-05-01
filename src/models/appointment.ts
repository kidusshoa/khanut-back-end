import mongoose, { Schema, Document } from "mongoose";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface IAppointment extends Document {
  serviceId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  staffId?: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  isRecurring?: boolean;
  recurringId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    notes: {
      type: String,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringId: {
      type: Schema.Types.ObjectId,
      ref: "RecurringAppointment",
    },
  },
  { timestamps: true }
);

// Create index for efficient querying
AppointmentSchema.index({ businessId: 1, date: 1 });
AppointmentSchema.index({ customerId: 1, date: 1 });
AppointmentSchema.index({ serviceId: 1 });

export const Appointment = mongoose.model<IAppointment>(
  "Appointment",
  AppointmentSchema
);
