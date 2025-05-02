import app from "./app";
import { connectDB } from "./config/db";
import "dotenv/config";
import { scheduleRecommendationSync } from "./jobs/recommendationSync";
import logger from "./utils/logger";

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);

    // Initialize scheduled jobs
    if (process.env.ENABLE_RECOMMENDATION_SYNC !== "false") {
      scheduleRecommendationSync();
      logger.info("📊 Recommendation sync job scheduled");
    }
  });
});
