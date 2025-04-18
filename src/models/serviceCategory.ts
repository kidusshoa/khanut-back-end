import mongoose, { Schema, Document } from "mongoose";

export interface IServiceCategory extends Document {
  name: string;
  description?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceCategorySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    icon: {
      type: String,
    },
  },
  { timestamps: true }
);

export const ServiceCategory = mongoose.model<IServiceCategory>(
  "ServiceCategory",
  ServiceCategorySchema
);
