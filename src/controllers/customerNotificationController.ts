import { Request, Response } from "express";
import { Notification } from "../models/notification";
import { User } from "../models/user";
import { Business } from "../models/business";

interface AuthRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

export const getNotifications = async (req: AuthRequest, res: Response) => {
  const notifications = await Notification.find({ userId: req.user.id }).sort({
    createdAt: -1,
  });

  res.json(notifications);
};

export const markNotificationAsRead = async (
  req: AuthRequest,
  res: Response
) => {
  const { id } = req.params;
  await Notification.findByIdAndUpdate(id, { read: true });
  res.json({ message: "Marked as read" });
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  const count = await Notification.countDocuments({
    userId: req.user.id,
    read: false,
  });
  res.json({ count });
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  await Notification.updateMany(
    { userId: req.user.id, read: false },
    { read: true }
  );
  res.json({ message: "All notifications marked as read" });
};

export const getBusinessUpdates = async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user.id);
  if (!user || !user.favorites)
    return res.status(404).json({ message: "User or favorites not found" });

  const updates = await Notification.find({
    userId: { $in: user.favorites },
    type: "update",
  }).sort({ createdAt: -1 });

  res.json(updates);
};
