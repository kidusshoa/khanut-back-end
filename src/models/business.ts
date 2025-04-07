import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBusiness extends Document {
  name: string;
  email: string;
  phone: string;
  city: string;
  description: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  ownerId: Types.ObjectId;
  services: mongoose.Types.ObjectId[];
  reviews: mongoose.Types.ObjectId[];
  approved: boolean;
  profilePicture?: string;
}

const BusinessSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    description: { type: String },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approved: { type: Boolean, default: false },
    category: { type: String },
    city: { type: String },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    services: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
    profilePicture: String,
  },
  { timestamps: true }
);

export const Business = mongoose.model<IBusiness>("Business", BusinessSchema);
