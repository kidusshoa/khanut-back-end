/**
 * Chatbot Routes
 * Routes for AI-powered chat functionality
 */

import express from 'express';
import { processCustomerChat, getChatbotStatus } from '../controllers/chatbotController';
import { protect } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/chatbot/customer:
 *   post:
 *     summary: Process a customer chat message
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: The message from the customer
 *               history:
 *                 type: array
 *                 description: Optional chat history for context
 *     responses:
 *       200:
 *         description: Chat response generated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/customer', protect(['customer']), processCustomerChat as any);

/**
 * @swagger
 * /api/chatbot/status:
 *   get:
 *     summary: Check if the chatbot service is available
 *     tags: [Chatbot]
 *     responses:
 *       200:
 *         description: Status check successful
 *       500:
 *         description: Server error
 */
router.get('/status', getChatbotStatus);

export default router;
