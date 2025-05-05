import mongoose, { Schema, Document } from "mongoose";

export interface IFavorite extends Document {
  customerId: mongoose.Types.ObjectId;
  businessId?: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FavoriteSchema: Schema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
    },
  },
  { timestamps: true }
);

// Ensure a user can only favorite a business or service once
FavoriteSchema.index({ customerId: 1, businessId: 1 }, { unique: true, sparse: true });
FavoriteSchema.index({ customerId: 1, serviceId: 1 }, { unique: true, sparse: true });

// Validate that either businessId or serviceId is provided, but not both
FavoriteSchema.pre("validate", function(next) {
  if (this.businessId && this.serviceId) {
    next(new Error("A favorite can only reference either a business or a service, not both"));
  } else if (!this.businessId && !this.serviceId) {
    next(new Error("A favorite must reference either a business or a service"));
  } else {
    next();
  }
});

export const Favorite = mongoose.model<IFavorite>("Favorite", FavoriteSchema);
