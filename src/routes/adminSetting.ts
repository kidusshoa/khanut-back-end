import { Router, Request, Response } from "express";
import { isAdmin } from "../middleware/isAdmin";
import {
  updateAdminProfile,
  addNewAdmin,
  getAdminProfile,
} from "../controllers/adminSettingsController";

const router = Router();

/**
 * @swagger
 * /api/admin/settings/profile:
 *   get:
 *     summary: Get current admin profile
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile data
 *       404:
 *         description: Admin not found
 */
router.get(
  "/profile",
  isAdmin,
  getAdminProfile as unknown as (
    req: Request,
    res: Response
  ) => Promise<Response>
);

/**
 * @swagger
 * /api/admin/settings/profile:
 *   patch:
 *     summary: Update admin profile
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch(
  "/profile",
  isAdmin,
  updateAdminProfile as unknown as (
    req: Request,
    res: Response
  ) => Promise<Response>
);

/**
 * @swagger
 * /api/admin/settings/add-admin:
 *   post:
 *     summary: Add a new admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, password]
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: New admin created
 *       400:
 *         description: Email already exists
 */
router.post(
  "/add-admin",
  isAdmin,
  addNewAdmin as unknown as (req: Request, res: Response) => Promise<Response>
);

export default router;
