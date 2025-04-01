import mongoose, { Schema, Document } from "mongoose";

export interface IBusiness extends Document {
  name: string;
  description: string;
  ownerId: mongoose.Types.ObjectId;
  approved: boolean;
  category?: string;
  location?: string;
}

const BusinessSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approved: { type: Boolean, default: false },
    category: String,
    location: {
      type: { type: String, default: "Point" },
      coordinates: [Number], // [longitude, latitude]
    },
  },
  { timestamps: true }
);

export const Business = mongoose.model<IBusiness>("Business", BusinessSchema);
