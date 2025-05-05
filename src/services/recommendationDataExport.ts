import fs from "fs";
import path from "path";
import { Review } from "../models/review";
import { ServiceReview } from "../models/serviceReview";
import { Business } from "../models/business";
import { User } from "../models/user";
import { Service } from "../models/service";
import axios from "axios";
import FormData from "form-data";

const RECOMMENDATION_SERVICE_URL =
  process.env.RECOMMENDATION_SERVICE_URL || "http://localhost:5000";

/**
 * Exports review data to CSV for the recommendation engine
 */
export const exportReviewsToCSV = async (): Promise<string> => {
  try {
    // Get all reviews from the database
    const reviews = await Review.find({ status: "approved" })
      .select("authorId businessId rating createdAt")
      .lean();

    // Get all service reviews
    const serviceReviews = await ServiceReview.find({})
      .select("customerId businessId rating createdAt")
      .lean();

    // Combine and format the reviews
    const formattedReviews = [
      // Header row
      "user_id,business_id,rating,timestamp",
      // Regular business reviews
      ...reviews.map(
        (review) =>
          `${review.authorId},${review.businessId},${review.rating},${new Date(review.createdAt).toISOString()}`
      ),
      // Service reviews (grouped by business)
      ...serviceReviews.map(
        (review) =>
          `${review.customerId},${review.businessId},${review.rating},${new Date(review.createdAt).toISOString()}`
      ),
    ];

    // Create the export directory if it doesn't exist
    const exportDir = path.join(__dirname, "../../exports");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Write to CSV file
    const filePath = path.join(exportDir, "reviews.csv");
    fs.writeFileSync(filePath, formattedReviews.join("\n"));

    console.log(
      `✅ Exported ${reviews.length + serviceReviews.length} reviews to ${filePath}`
    );
    return filePath;
  } catch (error) {
    console.error("❌ Error exporting reviews:", error);
    throw error;
  }
};

/**
 * Exports business data to CSV for the recommendation engine
 */
export const exportBusinessesToCSV = async (): Promise<string> => {
  try {
    // Get all businesses from the database
    const businesses = await Business.find({ approved: true })
      .select("_id name category city rating")
      .lean();

    // Format the businesses
    const formattedBusinesses = [
      // Header row
      "business_id,name,category,city,rating",
      // Business data
      ...businesses.map(
        (business) =>
          `${business._id},${business.name.replace(/,/g, " ")},${business.category || "Unknown"},${business.city || "Unknown"},${business.rating || 0}`
      ),
    ];

    // Create the export directory if it doesn't exist
    const exportDir = path.join(__dirname, "../../exports");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Write to CSV file
    const filePath = path.join(exportDir, "businesses.csv");
    fs.writeFileSync(filePath, formattedBusinesses.join("\n"));

    console.log(`✅ Exported ${businesses.length} businesses to ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("❌ Error exporting businesses:", error);
    throw error;
  }
};

/**
 * Uploads exported data to the recommendation service
 */
export const uploadDataToRecommendationService = async (
  reviewsPath: string,
  businessesPath: string
): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append("reviews", fs.createReadStream(reviewsPath), {
      filename: "reviews.csv",
      contentType: "text/csv",
    });
    formData.append("businesses", fs.createReadStream(businessesPath), {
      filename: "businesses.csv",
      contentType: "text/csv",
    });

    const response = await axios.post(
      `${RECOMMENDATION_SERVICE_URL}/api/v1/data/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    console.log("✅ Data uploaded to recommendation service:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Error uploading data to recommendation service:", error);
    return false;
  }
};

/**
 * Triggers retraining of the recommendation model
 */
export const triggerModelRetraining = async (): Promise<boolean> => {
  try {
    const response = await axios.post(
      `${RECOMMENDATION_SERVICE_URL}/api/v1/retrain`
    );
    console.log("✅ Model retraining triggered:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Error triggering model retraining:", error);
    return false;
  }
};

/**
 * Exports data, uploads it to the recommendation service, and triggers retraining
 */
export const syncRecommendationData = async (): Promise<boolean> => {
  try {
    // Export data to CSV
    const reviewsPath = await exportReviewsToCSV();
    const businessesPath = await exportBusinessesToCSV();

    // Upload data to recommendation service
    const uploadSuccess = await uploadDataToRecommendationService(
      reviewsPath,
      businessesPath
    );

    // Trigger model retraining if upload was successful
    if (uploadSuccess) {
      await triggerModelRetraining();
    }

    return true;
  } catch (error) {
    console.error("❌ Error syncing recommendation data:", error);
    return false;
  }
};
