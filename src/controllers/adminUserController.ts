import { Request, Response } from "express";
import { User } from "../models/user";
import { ActivityLog } from "../models/activityLog";
import { Warning } from "../models/warnings";

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

export const warnUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    res.status(400).json({ message: "Reason is required" });
    return;
  }

  const user = await User.findById(id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  await Warning.create({
    userId: id,
    adminId: req.user.id,
    reason,
  });

  await ActivityLog.create({
    message: `User ${user.name} warned: ${reason}`,
  });

  res.json({ message: "User warned successfully" });
};

export const deleteUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  await ActivityLog.create({
    message: `User ${user.name} deleted by admin`,
  });

  res.json({ message: "User deleted successfully" });
};
