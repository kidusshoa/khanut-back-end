import express from "express";
import {
  getCustomerProfile,
  updateCustomerProfile,
} from "../controllers/customerProfileController";
import { isCustomer } from "../middleware/isCustomer";

const router = express.Router();

/**
 * @swagger
 * /api/customer/profile:
 *   get:
 *     summary: Get customer profile
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile
 */
router.get("/profile", isCustomer, (req, res) =>
  getCustomerProfile(req as any, res)
);

/**
 * @swagger
 * /api/customer/profile:
 *   patch:
 *     summary: Update customer profile (name or password)
 *     tags: [Customer]
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
router.patch("/profile", isCustomer, (req, res) =>
  updateCustomerProfile(req as any, res)
);

export default router;
