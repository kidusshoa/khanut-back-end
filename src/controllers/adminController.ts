import { NextFunction, Request, Response } from "express";
import { User } from "../models/user";
import { ActivityLog } from "../models/activityLog";
import { Review } from "../models/review";
import { Business } from "../models/business";

interface AuthRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ message: "Access denied" });
    return;
  }
  next();
};

export const getAdminDashboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const [
      totalBusinesses,
      totalUsers,
      pendingApprovals,
      pendingReviews,
      recentActivity,
    ] = await Promise.all([
      Business.countDocuments(),
      User.countDocuments({ role: { $in: ["customer", "business"] } }),
      Business.countDocuments({ approved: false }),
      Review.countDocuments({ status: "pending" }),
      ActivityLog.find().sort({ createdAt: -1 }).limit(5),
    ]);

    // Process activity logs to include user and business names
    const processedActivity = await Promise.all(
      recentActivity.map(async (log) => {
        const logObj = log.toObject();

        // Extract user IDs from the message
        const userIdMatch = logObj.message.match(/[0-9a-fA-F]{24}/g);

        if (userIdMatch) {
          for (const potentialId of userIdMatch) {
            // Check if this is a user ID
            const user = await User.findById(potentialId);
            if (user) {
              logObj.userId = potentialId;
              logObj.userName = user.name;
            }

            // Check if this is a business ID
            const business = await Business.findById(potentialId);
            if (business) {
              logObj.businessId = potentialId;
              logObj.businessName = business.name;
            }
          }
        }

        return logObj;
      })
    );

    res.json({
      totalBusinesses,
      totalUsers,
      pendingApprovals,
      pendingReviews,
      recentActivity: processedActivity,
    });
  } catch (err) {
    console.error("❌ Dashboard fetch error:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
};
