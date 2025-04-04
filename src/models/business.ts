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
  services: mongoose.Types.ObjectId[]; // update this if you have a Service model
  reviews: mongoose.Types.ObjectId[]; // same for reviews
  approved: boolean;
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
    services: [{ type: Schema.Types.ObjectId, ref: "Service" }], // ✅ add this
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }], // ✅ add this
  },
  { timestamps: true }
);

export const Business = mongoose.model<IBusiness>("Business", BusinessSchema);
