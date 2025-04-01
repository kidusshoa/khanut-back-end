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
 *       401:
 *         description: No or invalid token
 *       403:
 *         description: Forbidden (not admin)
 */
router.get("/dashboard", isAdmin, getAdminDashboard);
export default router;
