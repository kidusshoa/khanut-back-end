import express from 'express';
import { isAdmin } from '../middleware/auth';
import { syncRecommendationData } from '../controllers/adminRecommendationController';

const router = express.Router();

/**
 * @swagger
 * /api/admin/recommendations/sync:
 *   post:
 *     summary: Manually trigger a sync of recommendation data and retraining of the model
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommendation data sync and model retraining completed successfully
 *       500:
 *         description: Error in recommendation data sync
 */
router.post('/sync', isAdmin, syncRecommendationData);

export default router;
