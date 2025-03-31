import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  email: string;
  name: string;
  password: string;
  role: "admin" | "business" | "customer";
  notify: boolean;
  verified: boolean;
  verificationToken?: string;
  twoFactorCode?: string;
  twoFactorCodeExpiry?: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "business", "customer"],
      default: "customer",
    },
    notify: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    verificationToken: String,
    twoFactorCode: String,
    twoFactorCodeExpiry: Date,
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

// ✅ Compare passwords
UserSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>("User", UserSchema);
