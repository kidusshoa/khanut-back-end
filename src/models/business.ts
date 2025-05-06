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
  status: "pending" | "approved" | "rejected";
  profilePicture?: string;
  category?: string;
  rating?: number;
  website?: string;
  businessType?: string;
  address?: string;
  openingHours?: any; // Define a more specific type if needed
  socialMedia?: any; // Define a more specific type if needed
}

const BusinessSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    description: { type: String },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approved: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    category: { type: String },
    city: { type: String },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    services: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
    profilePicture: String,
    website: { type: String },
    businessType: { type: String },
    address: { type: String },
    openingHours: { type: Schema.Types.Mixed },
    socialMedia: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Create a 2dsphere index for geospatial queries
BusinessSchema.index({ location: "2dsphere" });

export const Business = mongoose.model<IBusiness>("Business", BusinessSchema);
