import cron from 'node-cron';
import { syncRecommendationData } from '../services/recommendationDataExport';
import logger from '../utils/logger';

/**
 * Schedule a job to sync recommendation data and retrain the model
 * Runs every day at 3:00 AM
 */
export const scheduleRecommendationSync = () => {
  // Schedule the job to run at 3:00 AM every day
  cron.schedule('0 3 * * *', async () => {
    try {
      logger.info('Starting recommendation data sync and model retraining...');
      
      // Sync data and retrain model
      const success = await syncRecommendationData();
      
      if (success) {
        logger.info('Recommendation data sync and model retraining completed successfully');
      } else {
        logger.error('Recommendation data sync and model retraining failed');
      }
    } catch (error) {
      logger.error('Error in recommendation sync job:', error);
    }
  });
  
  logger.info('Recommendation sync job scheduled');
};

/**
 * Run a manual sync of recommendation data and retrain the model
 */
export const runManualRecommendationSync = async (): Promise<boolean> => {
  try {
    logger.info('Starting manual recommendation data sync and model retraining...');
    
    // Sync data and retrain model
    const success = await syncRecommendationData();
    
    if (success) {
      logger.info('Manual recommendation data sync and model retraining completed successfully');
    } else {
      logger.error('Manual recommendation data sync and model retraining failed');
    }
    
    return success;
  } catch (error) {
    logger.error('Error in manual recommendation sync:', error);
    return false;
  }
};
