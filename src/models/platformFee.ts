import mongoose, { Schema, Document } from "mongoose";

export interface IPlatformFee extends Document {
  paymentId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  originalAmount: number;
  feePercentage: number;
  feeAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformFeeSchema: Schema = new Schema(
  {
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    originalAmount: {
      type: Number,
      required: true,
    },
    feePercentage: {
      type: Number,
      required: true,
      default: 5,
    },
    feeAmount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// Create indexes for efficient querying
PlatformFeeSchema.index({ paymentId: 1 }, { unique: true });
PlatformFeeSchema.index({ businessId: 1 });
PlatformFeeSchema.index({ createdAt: 1 });

export const PlatformFee = mongoose.model<IPlatformFee>("PlatformFee", PlatformFeeSchema);
