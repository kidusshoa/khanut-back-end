import { Router } from "express";
import { getAdminDashboard } from "../controllers/adminController";
import { isAdmin } from "../middleware/isAdmin";

const router = Router();

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats with activity logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalBusinesses:
 *                   type: integer
 *                   example: 23
 *                 totalUsers:
 *                   type: integer
 *                   example: 103
 *                 pendingApprovals:
 *                   type: integer
 *                   example: 7
 *                 pendingReviews:
 *                   type: integer
 *                   example: 4
 *                 recentActivity:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "65fe8a3..."
 *                       message:
 *                         type: string
 *                         example: "Business 'Fast Clean' approved"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-03-30T10:45:00.123Z"
 *       401:
 *         description: No or invalid token
 *       403:
 *         description: Forbidden (not admin)
 */
router.get("/dashboard", isAdmin, getAdminDashboard);
export default router;
