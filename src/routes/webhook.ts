import express from 'express';
import { handleReviewWebhook } from '../controllers/webhookController';

const router = express.Router();

/**
 * @swagger
 * /api/webhook:
 *   post:
 *     summary: Handle webhooks for real-time recommendation updates
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *               - data
 *             properties:
 *               event:
 *                 type: string
 *                 description: The event type
 *               data:
 *                 type: object
 *                 description: The event data
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook payload
 *       500:
 *         description: Error processing webhook
 */
router.post('/', handleReviewWebhook);

export default router;
