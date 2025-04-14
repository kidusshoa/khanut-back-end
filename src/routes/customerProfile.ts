import express from "express";
import {
  getCustomerProfile,
  updateCustomerProfile,
  updateProfilePicture,
} from "../controllers/customerProfileController";
import { isCustomer } from "../middleware/isCustomer";
import { upload } from "../utils/multer";

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

/**
 * @swagger
 * /api/customer/profile/picture:
 *   patch:
 *     summary: Update customer profile picture
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 */
router.patch(
  "/profile/picture",
  isCustomer,
  upload.single("image"),
  (req, res) => updateProfilePicture(req as any, res)
);

export default router;
