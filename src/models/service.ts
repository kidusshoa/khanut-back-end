import mongoose, { Schema, Document } from "mongoose";

export interface IService extends Document {
  name: string;
  description: string;
  price: number;
  businessId: mongoose.Types.ObjectId;
  images: string[];
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
    images: [{ type: String }],
  },
  { timestamps: true }
);

export const Service = mongoose.model<IService>("Service", ServiceSchema);
