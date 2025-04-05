// controllers/adminNotificationController.ts
import { Request, Response } from "express";
import { Notification } from "../models/notification";

export const sendNotificationToUser = async (req: Request, res: Response) => {
  const { userId, type, message } = req.body;
  if (!userId || !type || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const notification = await Notification.create({
      userId,
      type,
      message,
    });

    return res.status(201).json({ message: "Notification sent", notification });
  } catch (err) {
    console.error("❌ Send notification error:", err);
    return res.status(500).json({ message: "Failed to send notification" });
  }
};
