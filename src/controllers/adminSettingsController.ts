import { Request, Response } from "express";
import { User } from "../models/user";
import { ActivityLog } from "../models/activityLog";
import bcrypt from "bcrypt";

interface AuthRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

export const getAdminProfile = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const admin = await User.findById(req.user.id).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.json(admin);
  } catch (err) {
    console.error("❌ Get admin profile error:", err);
    return res.status(500).json({ message: "Failed to fetch admin profile" });
  }
};

export const updateAdminProfile = async (req: AuthRequest, res: Response) => {
  const { name, currentPassword, newPassword } = req.body;

  const admin = await User.findById(req.user.id);
  if (!admin || admin.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  if (name) {
    admin.name = name;
  }

  if (currentPassword && newPassword) {
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }
    admin.password = newPassword;
  }

  await admin.save(); // password will be hashed if modified
  return res.json({ message: "Profile updated successfully" });
};

export const addNewAdmin = async (req: AuthRequest, res: Response) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const newAdmin = await User.create({
    email,
    name,
    password: hashed,
    role: "admin",
    verified: true, // You can mark verified directly if needed
  });

  await ActivityLog.create({
    message: `Admin "${req.user.id}" added a new admin: ${newAdmin.email}`,
  });

  return res.status(201).json({
    message: "New admin added successfully",
    adminId: newAdmin._id,
  });
};
