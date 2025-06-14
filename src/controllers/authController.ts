import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import { User } from "../models/user";
import { TokenBlacklist } from "../models/tokebBlacklist";
import { send2FACode } from "../utils/send2FACode";
import { sendResetEmail } from "../utils/sendResetEmail";
import { authLogger, emailLogger } from "../utils/logger";

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
      expiresIn: "30d", // Increased from 10h to 30 days
    });

    return res.json({ accessToken: newAccess });
  } catch (err) {
    console.error("❌ Token error:", err);
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};

// export const requestVerification = async (
//   req: Request<{}, {}, { email: string }>,
//   res: Response
// ) => {
//   const { email } = req.body;

//   const user = await User.findOne({ email });
//   if (!user) return res.status(404).json({ message: "User not found" });

//   const token = crypto.randomBytes(32).toString("hex");
//   user.verificationToken = token;
//   await user.save();

//   await sendVerificationEmail(email, token);
//   return res.json({ message: "Verification email sent" });
// };

// export const verifyEmail = async (req: Request, res: Response) => {
//   const token = req.query.token as string;

//   if (!token) return res.status(400).json({ message: "Token missing" });

//   const user = await User.findOne({ verificationToken: token });
//   if (!user)
//     return res.status(400).json({ message: "Invalid or expired token" });

//   user.verified = true;
//   user.verificationToken = undefined;
//   await user.save();

//   return res.json({ message: "Email verified successfully" });
// };

export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (user.twoFactorCode || user.twoFactorCodeExpiry) {
    return res.status(403).json({
      message: "2FA verification required before login",
    });
  }

  const payload = { id: user._id, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "30d", // Increased from 10h to 30 days
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "60d", // Increased from 7d to 60 days
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

  // Clear 2FA fields
  user.twoFactorCode = undefined;
  user.twoFactorCodeExpiry = undefined;
  await user.save();

  // Generate authentication tokens (similar to login)
  const payload = { id: user._id, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "30d",
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "60d",
  });

  // Return user data and tokens
  return res.json({
    verified: true,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    accessToken,
    refreshToken,
  });
};

/**
 * Get user role by email
 * Used for redirecting unverified users to the correct verification page
 */
export const getUserRole = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email }).select("role");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ role: user.role });
  } catch (error) {
    console.error("Get user role error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, name, password, phone, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    if (!["admin", "business", "customer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const newUser = new User({ email, name, password, phone, role });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    newUser.twoFactorCode = code;
    newUser.twoFactorCodeExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await newUser.save();

    await send2FACode(email, code);

    return res.status(201).json({
      message: "Account created. Check your email for 2FA code.",
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Request a password reset
 * Generates a token and sends an email with a reset link
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const clientIp = req.ip || "unknown";

    authLogger.info("Password reset requested", { email, ip: clientIp });

    if (!email) {
      authLogger.warn("Password reset attempt without email", { ip: clientIp });
      return res.status(400).json({ message: "Email is required" });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, don't reveal that the email doesn't exist
      authLogger.info("Password reset requested for non-existent email", {
        email,
        ip: clientIp,
      });
      return res.status(200).json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate a random token
    const token = crypto.randomBytes(32).toString("hex");

    // Set token and expiry on the user document
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.save();
    authLogger.info("Password reset token generated", {
      userId: user._id,
      email,
      tokenExpiry: user.resetPasswordExpires,
    });

    // Send the reset email
    const userId = user._id as unknown as string;
    try {
      await sendResetEmail(email, token, userId);
      emailLogger.info("Password reset email sent", { userId, email });
    } catch (emailError) {
      emailLogger.error("Failed to send password reset email", {
        userId,
        email,
        error: emailError,
      });
      // We don't want to expose email sending failures to the client
      // Still return success to prevent email enumeration
    }

    return res.status(200).json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    authLogger.error("Forgot password error", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Validate a password reset token
 * Checks if the token is valid and not expired
 */
export const validateResetToken = async (req: Request, res: Response) => {
  try {
    const { token, userId } = req.body;
    const clientIp = req.ip || "unknown";

    authLogger.info("Reset token validation attempt", { userId, ip: clientIp });

    if (!token || !userId) {
      authLogger.warn("Reset token validation missing parameters", {
        hasToken: !!token,
        hasUserId: !!userId,
        ip: clientIp,
      });
      return res
        .status(400)
        .json({ message: "Token and user ID are required" });
    }

    // Find the user by ID and token
    const user = await User.findOne({
      _id: userId,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      authLogger.warn("Invalid or expired reset token", {
        userId,
        ip: clientIp,
        tokenExists: !!token,
      });
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    authLogger.info("Reset token validated successfully", {
      userId,
      email: user.email,
    });
    return res.status(200).json({ valid: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    authLogger.error("Validate reset token error", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Reset password using a valid token
 * Updates the user's password and clears the reset token
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, userId, password } = req.body;
    const clientIp = req.ip || "unknown";

    authLogger.info("Password reset attempt", { userId, ip: clientIp });

    if (!token || !userId || !password) {
      authLogger.warn("Password reset missing parameters", {
        hasToken: !!token,
        hasUserId: !!userId,
        hasPassword: !!password,
        ip: clientIp,
      });
      return res
        .status(400)
        .json({ message: "Token, user ID, and password are required" });
    }

    // Find the user by ID and token
    const user = await User.findOne({
      _id: userId,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      authLogger.warn("Invalid or expired token for password reset", {
        userId,
        ip: clientIp,
        tokenExists: !!token,
      });
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Update the password
    user.password = password;

    // Clear the reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    authLogger.info("Password reset successful", {
      userId,
      email: user.email,
      ip: clientIp,
    });

    return res
      .status(200)
      .json({ message: "Password has been reset successfully" });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    authLogger.error("Reset password error", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return res.status(500).json({ message: "Server error" });
  }
};
