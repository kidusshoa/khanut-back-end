import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  serviceId: mongoose.Types.ObjectId;
  sku: string;
  inventory: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  shippingInfo?: {
    freeShipping: boolean;
    shippingCost: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      unique: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
    },
    inventory: {
      type: Number,
      required: true,
      default: 0,
    },
    weight: {
      type: Number,
    },
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
    shippingInfo: {
      freeShipping: { type: Boolean, default: false },
      shippingCost: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
