import { Request, Response } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import { User } from "../models/user";
import { TokenBlacklist } from "../models/tokebBlacklist";
import { sendVerificationEmail } from "../utils/sendVerificationEmail";
import { send2FACode } from "../utils/send2FACode";

export const refresh = async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: "No token" });

  const isBlacklisted = await TokenBlacklist.findOne({ token });
  if (isBlacklisted)
    return res.status(403).json({ message: "Blacklisted token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;

    const { id, role } = payload;

    const newAccess = jwt.sign({ id, role }, process.env.JWT_SECRET!, {
      expiresIn: "15m",
    });

    return res.json({ accessToken: newAccess });
  } catch (err) {
    console.error("❌ Token error:", err);
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};

export const requestVerification = async (
  req: Request<{}, {}, { email: string }>,
  res: Response
) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const token = crypto.randomBytes(32).toString("hex");
  user.verificationToken = token;
  await user.save();

  await sendVerificationEmail(email, token);
  return res.json({ message: "Verification email sent" });
};

export const verifyEmail = async (req: Request, res: Response) => {
  const token = req.query.token as string;

  if (!token) return res.status(400).json({ message: "Token missing" });

  const user = await User.findOne({ verificationToken: token });
  if (!user)
    return res.status(400).json({ message: "Invalid or expired token" });

  user.verified = true;
  user.verificationToken = undefined;
  await user.save();

  return res.json({ message: "Email verified successfully" });
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.verified) {
    return res.status(403).json({ message: "Email not verified" });
  }

  const payload = { id: user._id, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "7d",
  });

  return res.json({
    accessToken,
    refreshToken,
    role: user.role,
    userId: user._id,
  });
};

export const logout = async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: "Token required" });

  const decoded = jwt.decode(token) as any;
  const expiresAt = new Date(decoded?.exp * 1000);

  await TokenBlacklist.create({ token, expiresAt });
  return res.json({ message: "Logged out" });
};

export const request2FA = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  user.twoFactorCode = code;
  user.twoFactorCodeExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min
  await user.save();

  await send2FACode(user.email, code);
  return res.json({ message: "2FA code sent" });
};

export const verify2FA = async (req: Request, res: Response) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email });

  if (
    !user ||
    user.twoFactorCode !== code ||
    !user.twoFactorCodeExpiry ||
    user.twoFactorCodeExpiry < new Date()
  ) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }

  user.twoFactorCode = undefined;
  user.twoFactorCodeExpiry = undefined;
  await user.save();

  return res.json({ verified: true });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, name, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already in use" });

    if (!["admin", "business", "customer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = new User({
      email,
      name,
      password,
      role,
      verificationToken,
      verified: false,
    });

    await newUser.save();

    await sendVerificationEmail(email, verificationToken);

    return res.status(201).json({
      message: "Account created. Please check your email to verify.",
    });
  } catch (err: any) {
    console.error("❌ Registration error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
