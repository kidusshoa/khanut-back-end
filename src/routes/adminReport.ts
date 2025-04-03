import express from "express";
import { isAdmin } from "../middleware/isAdmin";
import {
  getAdminReports,
  exportAdminReports,
} from "../controllers/adminReportController";

const router = express.Router();
/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     summary: Get admin report data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard-level stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 totalBusinesses:
 *                   type: integer
 *                 totalReviews:
 *                   type: integer
 *                 pendingApprovals:
 *                   type: integer
 *                 pendingReviews:
 *                   type: integer
 *                 monthlyUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 monthlyBusinesses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                       count:
 *                         type: integer
 */
router.get("/", isAdmin, getAdminReports);

/**
 * @swagger
 * /api/admin/reports/export:
 *   get:
 *     summary: Export admin report data to Excel
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel file exported
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/export", isAdmin, exportAdminReports);

export default router;
