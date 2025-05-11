import express, { Request, Response } from "express";
import {
  getBusinessNotifications,
  markNotificationAsRead,
  getUnreadCount,
  markAllAsRead,
} from "../controllers/businessNotificationController";
import { isBusiness } from "../middleware/isBusiness";

const router = express.Router();

interface AuthRequest extends Request {
  user: {
    id: string;
    role: string;
    businessId?: string;
  };
}

/**
 * @swagger
 * tags:
 *   name: Business Notifications
 *   description: Business notifications management
 */

/**
 * @swagger
 * /api/business/notifications:
 *   get:
 *     summary: Get all notifications for the logged-in business
 *     tags: [Business Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.get("/", isBusiness, (req, res) =>
  getBusinessNotifications(req as AuthRequest, res)
);

/**
 * @swagger
 * /api/business/notifications/unread:
 *   get:
 *     summary: Get unread notifications count for the logged-in business
 *     tags: [Business Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Count of unread notifications
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.get("/unread", isBusiness, (req, res) =>
  getUnreadCount(req as AuthRequest, res)
);

/**
 * @swagger
 * /api/business/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Business Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/read", isBusiness, (req, res) =>
  markNotificationAsRead(req as AuthRequest, res)
);

/**
 * @swagger
 * /api/business/notifications/mark-all-read:
 *   patch:
 *     summary: Mark all notifications as read for the logged-in business
 *     tags: [Business Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.patch("/mark-all-read", isBusiness, (req, res) =>
  markAllAsRead(req as AuthRequest, res)
);

export default router;
