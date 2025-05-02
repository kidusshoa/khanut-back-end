import { Router } from "express";
import {
  getDashboardStats,
  getRevenueData,
  getServiceDistribution,
  getRecentOrders,
  getUpcomingAppointments
} from "../controllers/businessAnalyticsController";
import { protect } from "../middleware/auth";
import { isBusiness } from "../middleware/isBusiness";

const router = Router();

/**
 * @swagger
 * /api/analytics/business/{businessId}/stats:
 *   get:
 *     summary: Get dashboard statistics for a business
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the business owner)
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.get(
  "/business/:businessId/stats",
  protect(["business"]),
  isBusiness,
  getDashboardStats
);

/**
 * @swagger
 * /api/analytics/business/{businessId}/revenue:
 *   get:
 *     summary: Get revenue data for a business
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *         description: Time period for data (default is week)
 *     responses:
 *       200:
 *         description: Revenue data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the business owner)
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.get(
  "/business/:businessId/revenue",
  protect(["business"]),
  isBusiness,
  getRevenueData
);

/**
 * @swagger
 * /api/analytics/business/{businessId}/services:
 *   get:
 *     summary: Get service distribution data for a business
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
 *     responses:
 *       200:
 *         description: Service distribution data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the business owner)
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.get(
  "/business/:businessId/services",
  protect(["business"]),
  isBusiness,
  getServiceDistribution
);

/**
 * @swagger
 * /api/analytics/business/{businessId}/recent-orders:
 *   get:
 *     summary: Get recent orders for a business
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Number of orders to return (default is 5)
 *     responses:
 *       200:
 *         description: Recent orders
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the business owner)
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.get(
  "/business/:businessId/recent-orders",
  protect(["business"]),
  isBusiness,
  getRecentOrders
);

/**
 * @swagger
 * /api/analytics/business/{businessId}/upcoming-appointments:
 *   get:
 *     summary: Get upcoming appointments for a business
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Number of appointments to return (default is 5)
 *     responses:
 *       200:
 *         description: Upcoming appointments
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the business owner)
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.get(
  "/business/:businessId/upcoming-appointments",
  protect(["business"]),
  isBusiness,
  getUpcomingAppointments
);

export default router;
