import express from "express";
import {
  toggleFavorite,
  getFavorites,
} from "../controllers/favoriteController";
import { isCustomer } from "../middleware/isCustomer";

const router = express.Router();

/**
 * @swagger
 * /api/customer/favorites:
 *   get:
 *     summary: Get all favorite businesses
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite businesses
 */
router.get("/", isCustomer, (req, res) => getFavorites(req as any, res));

/**
 * @swagger
 * /api/customer/favorites/{businessId}:
 *   patch:
 *     summary: Toggle favorite status for a business
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Added or removed from favorites
 */
router.patch("/:businessId", isCustomer, (req, res) =>
  toggleFavorite(req as any, res)
);

export default router;
