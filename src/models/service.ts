import mongoose, { Schema, Document } from "mongoose";

export type ServiceType = "appointment" | "product" | "in_person";

export interface IService extends Document {
  name: string;
  description: string;
  price: number;
  businessId: mongoose.Types.ObjectId;
  images: string[];
  serviceType: ServiceType;
  categoryId?: mongoose.Types.ObjectId;
  availability?: {
    days: string[];
    startTime?: string;
    endTime?: string;
  };
  duration?: number; // in minutes, for appointment-based services
  inventory?: number; // for product-based services
  rating?: number; // average rating
  reviewCount?: number; // number of reviews
  txRef?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    serviceType: {
      type: String,
      enum: ["appointment", "product", "in_person"],
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceCategory",
    },
    availability: {
      days: [{ type: String }],
      startTime: { type: String },
      endTime: { type: String },
    },
    duration: { type: Number }, // in minutes, for appointment-based services
    inventory: { type: Number }, // for product-based services
    rating: { type: Number, default: 0 }, // average rating
    reviewCount: { type: Number, default: 0 }, // number of reviews
    images: [{ type: String }],
  },
  { timestamps: true }
);

export const Service = mongoose.model<IService>("Service", ServiceSchema);
