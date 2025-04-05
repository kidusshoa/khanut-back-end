import express, { Request, Response } from "express";
import {
  getNotifications,
  markNotificationAsRead,
  getUnreadCount,
  getBusinessUpdates,
} from "../controllers/customerNotificationController";
import { sendNotificationToUser } from "../controllers/adminNotificationController";
import { isCustomer } from "../middleware/isCustomer";
import { isAdmin } from "../middleware/isAdmin";

const router = express.Router();

interface AuthRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}
/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Customer and Admin notifications
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for the logged-in customer
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get("/", isCustomer, (req, res) =>
  getNotifications(req as AuthRequest, res)
);

/**
 * @swagger
 * /api/notifications/unread:
 *   get:
 *     summary: Get unread notifications count for the logged-in customer
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Count of unread notifications
 */
router.get("/unread", isCustomer, (req, res) =>
  getUnreadCount(req as AuthRequest, res)
);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
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
 */
router.patch("/:id/read", isCustomer, (req, res) =>
  markNotificationAsRead(req as AuthRequest, res)
);

/**
 * @swagger
 * /api/notifications/business-updates:
 *   get:
 *     summary: Get updates from favorite businesses
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of updates/news from favorite businesses
 */
router.get("/business-updates", isCustomer, (req, res) =>
  getBusinessUpdates(req as AuthRequest, res)
);

/**
 * @swagger
 * /api/notifications/admin/send:
 *   post:
 *     summary: Admin sends a notification to a specific user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [warning, update]
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification sent
 */
// Admin internal
router.post("/admin/send", isAdmin, sendNotificationToUser);

export default router;
