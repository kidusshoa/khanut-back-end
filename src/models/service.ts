// models/service.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IService extends Document {
  name: string;
  description?: string;
  price?: number;
  businessId: mongoose.Types.ObjectId;
}

const ServiceSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
  },
  { timestamps: true }
);

export const Service = mongoose.model<IService>("Service", ServiceSchema);
