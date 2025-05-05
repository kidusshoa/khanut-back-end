import express from "express";
import {
  getDashboardStats,
  getRecommendedBusinesses,
} from "../controllers/customerDashboardController";
import { protect } from "../middleware/auth";
import { isCustomer } from "../middleware/isCustomer";

const router = express.Router();

/**
 * @swagger
 * /api/customer/dashboard/stats:
 *   get:
 *     summary: Get customer dashboard statistics
 *     tags: [Customer Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAppointments:
 *                   type: number
 *                 upcomingAppointments:
 *                   type: number
 *                 totalOrders:
 *                   type: number
 *                 pendingOrders:
 *                   type: number
 *                 favoriteServices:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/stats",
  protect(["customer"]),
  isCustomer,
  getDashboardStats
);

/**
 * @swagger
 * /api/customer/dashboard/recommended:
 *   get:
 *     summary: Get recommended businesses for a customer
 *     tags: [Customer Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *         description: Number of recommendations to return
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [hybrid, collaborative, content]
 *           default: hybrid
 *         description: Recommendation method to use
 *     responses:
 *       200:
 *         description: List of recommended businesses
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/recommended",
  protect(["customer"]),
  isCustomer,
  getRecommendedBusinesses
);

export default router;
