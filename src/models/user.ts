import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  email: string;
  name: string;
  password: string;
  phone?: string;
  role: "admin" | "business" | "customer";
  notify: boolean;
  profilePicture?: string;
  twoFactorCode?: string;
  twoFactorCodeExpiry?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  favorites: mongoose.Types.ObjectId[];
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: {
      type: String,
      enum: ["admin", "business", "customer"],
      default: "customer",
    },
    notify: { type: Boolean, default: false },
    profilePicture: String,
    twoFactorCode: String,
    twoFactorCodeExpiry: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    favorites: [{ type: Schema.Types.ObjectId, ref: "Business" }],
  },
  { timestamps: true }
);

// 🔐 Hash password before saving
UserSchema.pre("save", async function (this: IUser, next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
UserSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>("User", UserSchema);
