import mongoose, { Schema, Document } from "mongoose";

export interface CartItem {
  serviceId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface CartDocument extends Document {
  customerId: mongoose.Types.ObjectId;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartSchema: Schema = new Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create a compound index on customerId and "items.serviceId" to ensure uniqueness
CartSchema.index({ customerId: 1, "items.serviceId": 1 });

export const Cart = mongoose.model<CartDocument>("Cart", CartSchema);
