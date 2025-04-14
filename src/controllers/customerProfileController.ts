import { Request, Response } from "express";
import { User } from "../models/user";

interface AuthRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

export const getCustomerProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    console.error("❌ getCustomerProfile error:", err);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateCustomerProfile = async (
  req: AuthRequest,
  res: Response
) => {
  const { name, currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (name) user.name = name;

  if (currentPassword && newPassword) {
    const match = await user.comparePassword(currentPassword);
    if (!match)
      return res.status(400).json({ message: "Incorrect current password" });
    user.password = newPassword;
  }

  await user.save();
  return res.json({ message: "Profile updated successfully" });
};

export const updateProfilePicture = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update profile picture URL
    user.profilePicture = (req.file as any).location;
    await user.save();

    return res.json({
      message: "Profile picture updated successfully",
      profilePicture: user.profilePicture,
    });
  } catch (err) {
    console.error("❌ Update profile picture error:", err);
    return res
      .status(500)
      .json({ message: "Failed to update profile picture" });
  }
};
