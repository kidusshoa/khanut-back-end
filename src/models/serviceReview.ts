import mongoose, { Schema, Document } from "mongoose";

export interface IServiceReview extends Document {
  serviceId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceReviewSchema: Schema = new Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Create indexes for efficient querying
ServiceReviewSchema.index({ serviceId: 1 });
ServiceReviewSchema.index({ businessId: 1 });
ServiceReviewSchema.index({ customerId: 1 });

export const ServiceReview = mongoose.model<IServiceReview>(
  "ServiceReview",
  ServiceReviewSchema
);
