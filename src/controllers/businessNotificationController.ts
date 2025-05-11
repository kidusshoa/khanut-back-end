import { Request, Response } from "express";
import { Notification } from "../models/notification";
import { Business } from "../models/business";

interface AuthRequest extends Request {
  user: {
    id: string;
    role: string;
    businessId?: string;
  };
}

/**
 * Get all notifications for a business
 */
export const getBusinessNotifications = async (req: AuthRequest, res: Response) => {
  try {
    // Get the business ID from the authenticated user
    const userId = req.user.id;
    const businessId = req.user.businessId;

    if (!businessId) {
      // Find the business owned by this user
      const business = await Business.findOne({ ownerId: userId });
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      
      // Use the business ID to find notifications
      const notifications = await Notification.find({ 
        businessId: business._id 
      }).sort({ createdAt: -1 });
      
      return res.json(notifications);
    }
    
    // If businessId is available in the token, use it directly
    const notifications = await Notification.find({ 
      businessId 
    }).sort({ createdAt: -1 });
    
    return res.json(notifications);
  } catch (error) {
    console.error("Error fetching business notifications:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const businessId = req.user.businessId;
    
    // Find the notification
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    // If businessId is not in the token, verify ownership
    if (!businessId) {
      const business = await Business.findOne({ ownerId: userId });
      
      if (!business || notification.businessId?.toString() !== business._id.toString()) {
        return res.status(403).json({ message: "Not authorized to access this notification" });
      }
    } else if (notification.businessId?.toString() !== businessId) {
      return res.status(403).json({ message: "Not authorized to access this notification" });
    }
    
    // Mark as read
    notification.read = true;
    await notification.save();
    
    return res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const businessId = req.user.businessId;
    
    // If businessId is not in the token, find the business
    if (!businessId) {
      const business = await Business.findOne({ ownerId: userId });
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      
      // Count unread notifications for this business
      const count = await Notification.countDocuments({
        businessId: business._id,
        read: false,
      });
      
      return res.json({ count });
    }
    
    // If businessId is available in the token, use it directly
    const count = await Notification.countDocuments({
      businessId,
      read: false,
    });
    
    return res.json({ count });
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const businessId = req.user.businessId;
    
    // If businessId is not in the token, find the business
    if (!businessId) {
      const business = await Business.findOne({ ownerId: userId });
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      
      // Mark all notifications as read for this business
      await Notification.updateMany(
        { businessId: business._id, read: false },
        { read: true }
      );
      
      return res.json({ message: "All notifications marked as read" });
    }
    
    // If businessId is available in the token, use it directly
    await Notification.updateMany(
      { businessId, read: false },
      { read: true }
    );
    
    return res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create a notification for a business
 */
export const createBusinessNotification = async (
  businessId: string,
  title: string,
  message: string,
  type: string = "info",
  link?: string
): Promise<void> => {
  try {
    await Notification.create({
      businessId,
      title,
      message,
      type,
      link,
      read: false,
    });
  } catch (error) {
    console.error("Error creating business notification:", error);
  }
};
