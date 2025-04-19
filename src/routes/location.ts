import express from "express";
import { getNearbyBusinesses } from "../controllers/locationController";

const router = express.Router();

/**
 * @swagger
 * /api/businesses/nearby:
 *   get:
 *     summary: Get businesses near a specific location
 *     tags: [Business]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         description: Latitude of the location
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         description: Longitude of the location
 *         schema:
 *           type: number
 *       - in: query
 *         name: distance
 *         required: false
 *         description: Maximum distance in meters (default 5000)
 *         schema:
 *           type: number
 *       - in: query
 *         name: category
 *         required: false
 *         description: Filter by business category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of nearby businesses with distance
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Server error
 */
router.get("/nearby", getNearbyBusinesses);

export default router;
