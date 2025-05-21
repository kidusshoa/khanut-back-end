import express from "express";
import { protect } from "../middleware/auth";
import {
  syncRecommendationData,
  getRecommendationHealth,
  getRecommendationStats,
} from "../controllers/adminRecommendationController";
import stagedRecommendationsRouter from "./adminStagedRecommendations";

const router = express.Router();

// Mount staged recommendations routes
router.use("/staged", stagedRecommendationsRouter);

/**
 * @swagger
 * /api/admin/recommendations/sync:
 *   post:
 *     summary: Manually trigger a sync of recommendation data and retraining of the model
 *     tags: [Admin, Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommendation data sync and model retraining completed successfully
 *       500:
 *         description: Error in recommendation data sync
 */
router.post("/sync", protect(["admin"]), syncRecommendationData);

/**
 * @swagger
 * /api/admin/recommendations/health:
 *   get:
 *     summary: Check the health of the recommendation service
 *     tags: [Admin, Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommendation service health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 data_files_exist:
 *                   type: boolean
 *                   example: true
 *                 model_files_exist:
 *                   type: boolean
 *                   example: true
 *                 mongodb_connected:
 *                   type: boolean
 *                   example: true
 *                 version:
 *                   type: string
 *                   example: 1.1.0
 *       503:
 *         description: Recommendation service is unhealthy or unavailable
 *       500:
 *         description: Error checking recommendation service health
 */
router.get("/health", protect(["admin"]), getRecommendationHealth);

/**
 * @swagger
 * /api/admin/recommendations/stats:
 *   get:
 *     summary: Get recommendation system statistics
 *     tags: [Admin, Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommendation system statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalReviews:
 *                   type: number
 *                   example: 120
 *                 totalBusinesses:
 *                   type: number
 *                   example: 45
 *                 lastTrainingDate:
 *                   type: string
 *                   nullable: true
 *                   example: "2023-06-15T10:30:00Z"
 *                 modelStatus:
 *                   type: string
 *                   example: trained
 *                 serviceHealth:
 *                   type: object
 *                   nullable: true
 *       500:
 *         description: Error fetching recommendation statistics
 */
router.get("/stats", protect(["admin"]), getRecommendationStats);

export default router;
