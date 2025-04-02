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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({ role: { $in: ["customer", "business"] } })
        .select("-password -twoFactorCode -twoFactorCodeExpiry")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: { $in: ["customer", "business"] } }),
    ]);

    res.json({
      users,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
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
