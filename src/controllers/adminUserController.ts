import { Request, Response } from "express";
import { User } from "../models/user";

interface AuthRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ role: { $in: ["customer", "business"] } })
      .select("-password -twoFactorCode -twoFactorCodeExpiry")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error("❌ Fetch users error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select(
      "-password -twoFactorCode -twoFactorCodeExpiry"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("❌ Get user by ID error:", err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};
