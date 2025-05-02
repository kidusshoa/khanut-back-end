import { Request, Response } from 'express';
import { Review } from '../models/review';
import { ServiceReview } from '../models/serviceReview';
import { Business } from '../models/business';
import { runManualRecommendationSync } from '../jobs/recommendationSync';
import logger from '../utils/logger';

/**
 * Handle webhooks for real-time recommendation updates
 */
export const handleReviewWebhook = async (req: Request, res: Response) => {
  try {
    const { event, data } = req.body;
    
    if (!event || !data) {
      return res.status(400).json({ message: 'Invalid webhook payload' });
    }
    
    logger.info(`Received webhook: ${event}`);
    
    // Process different event types
    switch (event) {
      case 'review.created':
      case 'review.updated':
      case 'review.deleted':
      case 'serviceReview.created':
      case 'serviceReview.updated':
      case 'serviceReview.deleted':
        // Trigger recommendation sync
        await runManualRecommendationSync();
        break;
        
      default:
        logger.info(`Ignoring unhandled webhook event: ${event}`);
    }
    
    return res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    return res.status(500).json({ message: 'Error processing webhook' });
  }
};

/**
 * Emit a webhook event when a review is created or updated
 */
export const emitReviewWebhook = async (event: string, data: any) => {
  try {
    const RECOMMENDATION_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:5000';
    
    // Send webhook to recommendation service
    const response = await fetch(`${RECOMMENDATION_SERVICE_URL}/api/v1/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.WEBHOOK_SECRET || 'default-webhook-secret'
      },
      body: JSON.stringify({ event, data })
    });
    
    if (!response.ok) {
      logger.error(`Failed to send webhook: ${response.statusText}`);
    } else {
      logger.info(`Webhook sent: ${event}`);
    }
  } catch (error) {
    logger.error('Error sending webhook:', error);
  }
};
