import mongoose, { Schema, Document } from "mongoose";

export type PaymentStatus = 
  | "pending" 
  | "completed" 
  | "failed" 
  | "refunded" 
  | "cancelled";

export type PaymentType = "order" | "appointment";

export interface IPayment extends Document {
  customerId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentType: PaymentType;
  referenceId: mongoose.Types.ObjectId; // Order ID or Appointment ID
  chapaTransactionId?: string;
  chapaReference?: string;
  status: PaymentStatus;
  paymentMethod: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
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
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "ETB",
    },
    paymentType: {
      type: String,
      enum: ["order", "appointment"],
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "paymentType",
    },
    chapaTransactionId: {
      type: String,
    },
    chapaReference: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Create indexes for efficient querying
PaymentSchema.index({ customerId: 1 });
PaymentSchema.index({ businessId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ chapaTransactionId: 1 }, { unique: true, sparse: true });

export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);
