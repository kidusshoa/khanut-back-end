import mongoose, { Schema, Document } from "mongoose";

export type OrderStatus = 
  | "pending_payment" 
  | "payment_received" 
  | "processing" 
  | "shipped" 
  | "delivered" 
  | "cancelled" 
  | "refunded";

export interface OrderItem {
  serviceId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  customerId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentId?: string;
  paymentMethod: string;
  shippingAddress?: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    items: [
      {
        serviceId: {
          type: Schema.Types.ObjectId,
          ref: "Service",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending_payment",
        "payment_received",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending_payment",
    },
    paymentId: {
      type: String,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    shippingAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
    },
    trackingNumber: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

// Create indexes for efficient querying
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ businessId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
