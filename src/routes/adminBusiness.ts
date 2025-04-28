import { Router, Request, Response } from "express";
import { isAdmin } from "../middleware/isAdmin";
import {
  getPendingBusinesses,
  approveBusiness,
  getApprovedBusinesses,
  rejectBusiness,
} from "../controllers/adminBusinessController";

const router = Router();

/**
 * @swagger
 * /api/admin/businesses/approval:
 *   get:
 *     summary: Get businesses pending approval
 *     tags: [Admin - Businesses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of unapproved businesses
 *       401:
 *         description: Unauthorized (no token)
 *       403:
 *         description: Forbidden (not an admin)
 */
router.get(
  "/approval",
  isAdmin,
  getPendingBusinesses as (req: Request, res: Response) => void
);

/**
 * @swagger
 * /api/admin/businesses/{id}/approve:
 *   patch:
 *     summary: Approve a business by ID
 *     tags: [Admin - Businesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Business ID to approve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business approved successfully
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/:id/approve",
  isAdmin,
  approveBusiness as (req: Request, res: Response) => void
);

/**
 * @swagger
 * /api/admin/businesses/list:
 *   get:
 *     summary: Get list of approved businesses
 *     tags: [Admin - Businesses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of approved businesses
 *       401:
 *         description: Unauthorized (no token)
 *       403:
 *         description: Forbidden (not an admin)
 */
router.get(
  "/list",
  isAdmin,
  getApprovedBusinesses as (req: Request, res: Response) => void
);

/**
 * @swagger
 * /api/admin/businesses/{id}/reject:
 *   patch:
 *     summary: Reject a business by ID
 *     tags: [Admin - Businesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Business ID to reject
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business rejected successfully
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/:id/reject",
  isAdmin,
  rejectBusiness as (req: Request, res: Response) => void
);

export default router;
