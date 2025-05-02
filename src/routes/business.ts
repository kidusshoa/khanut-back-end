import express, { Response } from "express";
import { upload } from "../utils/multer";
import {
  registerBusiness,
  updateBusinessPicture,
  addBusinessService,
  updateBusinessProfile,
} from "../controllers/businessController";
import { isBusiness } from "../middleware/isBusiness";
import { AuthRequest } from "../types/express";
import { RequestHandler } from "express";

const router = express.Router();

const typedHandler = (
  fn: (req: AuthRequest, res: Response) => Promise<Response>
) => {
  return (async (req, res) => fn(req as AuthRequest, res)) as RequestHandler;
};

/**
 * @swagger
 * /api/businesses/register:
 *   post:
 *     summary: Register a new business
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - category
 *               - city
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               city:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Business registered successfully
 *       400:
 *         description: Invalid input or business already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  "/register",
  isBusiness,
  upload.single("profilePicture"),
  typedHandler(registerBusiness)
);

/**
 * @swagger
 * /api/businesses/picture:
 *   patch:
 *     summary: Update business profile picture
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture updated successfully
 *       400:
 *         description: No image uploaded
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/picture",
  isBusiness,
  upload.single("image"),
  typedHandler(updateBusinessPicture)
);

/**
 * @swagger
 * /api/businesses/services:
 *   post:
 *     summary: Add a new service/product
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - images
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *     responses:
 *       201:
 *         description: Service added successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.post(
  "/services",
  isBusiness,
  upload.array("images", 5),
  typedHandler(addBusinessService)
);

/**
 * @swagger
 * /api/businesses/profile:
 *   put:
 *     summary: Update business profile
 *     tags: [Business]
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
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               city:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               website:
 *                 type: string
 *               openingHours:
 *                 type: object
 *               socialMedia:
 *                 type: object
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               address:
 *                 type: string
 *               businessType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Business profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.put("/profile", isBusiness, typedHandler(updateBusinessProfile));

export default router;
