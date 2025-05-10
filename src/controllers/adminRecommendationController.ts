import { Request, Response } from "express";
import { runManualRecommendationSync } from "../jobs/recommendationSync";
import logger from "../utils/logger";
import axios from "axios";

// Define interfaces for type safety
interface RecommendationServiceHealth {
  status: string;
  data_files_exist: boolean;
  model_files_exist: boolean;
  mongodb_connected: boolean;
  version: string;
}

interface RecommendationStats {
  totalReviews: number;
  totalBusinesses: number;
  lastTrainingDate: string | null;
  modelStatus: string;
  serviceHealth: RecommendationServiceHealth | null;
}

/**
 * Manually trigger a sync of recommendation data and retraining of the model
 */
export const syncRecommendationData = async (_req: Request, res: Response) => {
  try {
    logger.info("Admin triggered recommendation data sync");

    // Run manual sync
    const success = await runManualRecommendationSync();

    if (success) {
      return res.status(200).json({
        message:
          "Recommendation data sync and model retraining completed successfully",
      });
    } else {
      return res.status(500).json({
        message: "Recommendation data sync and model retraining failed",
      });
    }
  } catch (error: any) {
    logger.error("Error in admin recommendation sync:", error);
    return res.status(500).json({
      message: "Error in recommendation data sync",
      error: error.message || "Unknown error",
    });
  }
};

/**
 * Get recommendation service health status
 */
export const getRecommendationHealth = async (_req: Request, res: Response) => {
  try {
    logger.info("Checking recommendation service health");

    const RECOMMENDATION_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL;

    try {
      const response = await axios.get(
        `${RECOMMENDATION_SERVICE_URL}/api/v1/health`
      );
      return res.status(200).json(response.data);
    } catch (error: any) {
      logger.error("Error checking recommendation service health:", error);
      return res.status(503).json({
        status: "unhealthy",
        error: error.message || "Could not connect to recommendation service",
      });
    }
  } catch (error: any) {
    logger.error("Error in recommendation health check:", error);
    return res.status(500).json({
      message: "Error checking recommendation service health",
      error: error.message || "Unknown error",
    });
  }
};

/**
 * Get recommendation system statistics
 */
export const getRecommendationStats = async (_req: Request, res: Response) => {
  try {
    logger.info("Fetching recommendation system statistics");

    const RECOMMENDATION_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL;

    // Get service health
    let serviceHealth: RecommendationServiceHealth | null = null;
    try {
      const healthResponse = await axios.get(
        `${RECOMMENDATION_SERVICE_URL}/api/v1/health`
      );
      serviceHealth = healthResponse.data;
    } catch (error) {
      logger.error("Could not fetch recommendation service health:", error);
    }

    // Get counts from database
    const totalReviews = await Promise.all([
      import("../models/review").then((module) =>
        module.Review.countDocuments({ status: "approved" })
      ),
      import("../models/serviceReview").then((module) =>
        module.ServiceReview.countDocuments({})
      ),
    ]).then((counts) => counts.reduce((a, b) => a + b, 0));

    const totalBusinesses = await import("../models/business").then((module) =>
      module.Business.countDocuments({ approved: true })
    );

    // Get last training date from file system if available
    let lastTrainingDate = null;
    let modelStatus = "unknown";

    if (serviceHealth) {
      modelStatus = serviceHealth.model_files_exist ? "trained" : "untrained";
    }

    const stats: RecommendationStats = {
      totalReviews,
      totalBusinesses,
      lastTrainingDate,
      modelStatus,
      serviceHealth,
    };

    return res.status(200).json(stats);
  } catch (error: any) {
    logger.error("Error fetching recommendation stats:", error);
    return res.status(500).json({
      message: "Error fetching recommendation statistics",
      error: error.message || "Unknown error",
    });
  }
};
