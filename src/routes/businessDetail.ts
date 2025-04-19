import express from "express";
import { getBusinessDetail } from "../controllers/businessDetailController";

const router = express.Router();

/**
 * @swagger
 * /api/businesses/{id}:
 *   get:
 *     summary: Get business details by ID
 *     tags: [Business]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
 *     responses:
 *       200:
 *         description: Business details including services and reviews
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.get("/:id", getBusinessDetail);

export default router;
