import { Request, Response } from 'express';
import { runManualRecommendationSync } from '../jobs/recommendationSync';
import logger from '../utils/logger';

/**
 * Manually trigger a sync of recommendation data and retraining of the model
 */
export const syncRecommendationData = async (_req: Request, res: Response) => {
  try {
    logger.info('Admin triggered recommendation data sync');
    
    // Run manual sync
    const success = await runManualRecommendationSync();
    
    if (success) {
      return res.status(200).json({
        message: 'Recommendation data sync and model retraining completed successfully'
      });
    } else {
      return res.status(500).json({
        message: 'Recommendation data sync and model retraining failed'
      });
    }
  } catch (error) {
    logger.error('Error in admin recommendation sync:', error);
    return res.status(500).json({
      message: 'Error in recommendation data sync',
      error: error.message
    });
  }
};
