import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "business" | "customer";
  notify: boolean;
  verified: boolean;
  verificationToken?: string;
  twoFactorCode?: string;
  twoFactorCodeExpiry?: Date;

  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "business", "customer"],
      required: true,
    },
    notify: { type: Boolean, default: true },
    verified: { type: Boolean, default: false },
    verificationToken: { type: String },
    twoFactorCode: { type: String },
    twoFactorCodeExpiry: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);
