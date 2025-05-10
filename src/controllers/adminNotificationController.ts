// controllers/adminNotificationController.ts
import { Request, Response } from "express";
import { Notification } from "../models/notification";
import { User } from "../models/user";

export const sendNotificationToUser = async (req: Request, res: Response) => {
  const { userId, type, message, title } = req.body;
  if (!userId || !type || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const notification = await Notification.create({
      userId,
      type,
      message,
      title,
    });

    return res.status(201).json({ message: "Notification sent", notification });
  } catch (err) {
    console.error("❌ Send notification error:", err);
    return res.status(500).json({ message: "Failed to send notification" });
  }
};

// Create a notification for all admin users
export const createAdminNotification = async (
  title: string,
  message: string,
  type: string = "update"
): Promise<void> => {
  try {
    // Find all admin users
    const adminUsers = await User.find({ role: "admin" });

    // Create a notification for each admin
    const notifications = adminUsers.map((admin) => ({
      userId: admin._id,
      type,
      title,
      message,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error("Failed to create admin notifications:", error);
  }
};

// Send a system notification to all admins
export const sendSystemNotification = async (req: Request, res: Response) => {
  const { title, message, type } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: "Title and message are required" });
  }

  try {
    await createAdminNotification(title, message, type || "update");
    return res
      .status(201)
      .json({ message: "System notification sent to all admins" });
  } catch (error) {
    console.error("Error sending system notification:", error);
    return res
      .status(500)
      .json({ message: "Failed to send system notification" });
  }
};
