import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  businessId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
}

const ReviewSchema: Schema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Review = mongoose.model<IReview>("Review", ReviewSchema);
