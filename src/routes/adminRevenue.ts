import { Router } from "express";
import { isAdmin } from "../middleware/isAdmin";
import {
  getPlatformRevenue,
  getPlatformFeeTransactions,
} from "../controllers/adminRevenueController";

const router = Router();

/**
 * @swagger
 * /api/admin/revenue:
 *   get:
 *     summary: Get platform revenue statistics
 *     tags: [Admin - Revenue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform revenue statistics
 *       401:
 *         description: Unauthorized (no token)
 *       403:
 *         description: Forbidden (not an admin)
 */
router.get("/revenue", isAdmin, getPlatformRevenue);

/**
 * @swagger
 * /api/admin/revenue/transactions:
 *   get:
 *     summary: Get platform fee transactions with pagination
 *     tags: [Admin - Revenue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of platform fee transactions
 *       401:
 *         description: Unauthorized (no token)
 *       403:
 *         description: Forbidden (not an admin)
 */
router.get("/revenue/transactions", isAdmin, getPlatformFeeTransactions);

export default router;
