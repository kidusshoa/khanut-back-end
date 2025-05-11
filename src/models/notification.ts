import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  userId?: mongoose.Types.ObjectId;
  businessId?: mongoose.Types.ObjectId;
  type:
    | "warning"
    | "update"
    | "info"
    | "appointment"
    | "order"
    | "payment"
    | "review";
  title?: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: false,
    },
    type: {
      type: String,
      enum: [
        "warning",
        "update",
        "info",
        "appointment",
        "order",
        "payment",
        "review",
      ],
      required: true,
    },
    title: { type: String },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
);

// Add validation to ensure at least one of userId or businessId is provided
NotificationSchema.pre("validate", function (next) {
  if (!this.userId && !this.businessId) {
    this.invalidate("userId", "Either userId or businessId must be provided");
  }
  next();
});

export const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
