import mongoose, { Schema, Document } from "mongoose";

export type RecurrencePattern = "daily" | "weekly" | "biweekly" | "monthly";
export type RecurringStatus = "active" | "paused" | "completed" | "cancelled";

export interface IRecurringAppointment extends Document {
  customerId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  staffId?: mongoose.Types.ObjectId;
  recurrencePattern: RecurrencePattern;
  startDate: Date;
  endDate?: Date;
  dayOfWeek?: number; // 0-6 for Sunday-Saturday
  dayOfMonth?: number; // 1-31
  startTime: string;
  endTime: string;
  status: RecurringStatus;
  notes?: string;
  appointmentIds: mongoose.Types.ObjectId[]; // IDs of individual appointments created from this recurring appointment
  createdAt: Date;
  updatedAt: Date;
}

const RecurringAppointmentSchema: Schema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
    },
    recurrencePattern: {
      type: String,
      enum: ["daily", "weekly", "biweekly", "monthly"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
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
      enum: ["active", "paused", "completed", "cancelled"],
      default: "active",
    },
    notes: {
      type: String,
    },
    appointmentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Appointment",
      },
    ],
  },
  { timestamps: true }
);

// Create indexes for efficient querying
RecurringAppointmentSchema.index({ businessId: 1, status: 1 });
RecurringAppointmentSchema.index({ customerId: 1, status: 1 });

export const RecurringAppointment = mongoose.model<IRecurringAppointment>(
  "RecurringAppointment",
  RecurringAppointmentSchema
);
