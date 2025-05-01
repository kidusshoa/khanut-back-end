import mongoose, { Schema, Document } from "mongoose";

export interface IStaff extends Document {
  name: string;
  email: string;
  phone?: string;
  position: string;
  businessId: mongoose.Types.ObjectId;
  specialties?: string[];
  bio?: string;
  profilePicture?: string;
  availability?: {
    days: string[];
    startTime: string;
    endTime: string;
    breakStart?: string;
    breakEnd?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    position: { type: String, required: true },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    specialties: [{ type: String }],
    bio: { type: String },
    profilePicture: { type: String },
    availability: {
      days: [{ type: String }],
      startTime: { type: String },
      endTime: { type: String },
      breakStart: { type: String },
      breakEnd: { type: String },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Staff = mongoose.model<IStaff>("Staff", StaffSchema);
