/**
 * Staged recommendations service
 * 
 * This service provides pre-defined recommendations for specific customer IDs
 * to demonstrate the personalization capabilities of the recommendation system.
 */

import { Business } from "../models/business";
import logger from "../utils/logger";

// Define customer preference categories
export enum CustomerPreferenceCategory {
  ELECTRONICS = "electronics",
  BEAUTY = "beauty",
  RESTAURANTS = "restaurant",
  FASHION = "clothing",
  HEALTH = "health",
  EDUCATION = "education",
  ENTERTAINMENT = "entertainment",
  HOME = "home"
}

// Define customer preferences
interface CustomerPreference {
  customerId: string;
  preferredCategories: CustomerPreferenceCategory[];
  description: string;
}

// Map of customer IDs to their preferences
// You can add the actual customer IDs here
const customerPreferences: CustomerPreference[] = [
  {
    customerId: "$2b$10$ruFuSi7wSs9FN3RgU78zTeGVZj5z5MhLikEmUkwCVgVwZGwhxNYFu", // Electronics Customer ID
    preferredCategories: [CustomerPreferenceCategory.ELECTRONICS],
    description: "User interested in electronics - Admin Pick"
  },
  {
    customerId: "$2b$10$OWRkKjbsiubsYs6YqgP3G.oPI6GMkL0LkvQiMVZeub6OgN2X1Duha", // Health/Beauty Customer ID
    preferredCategories: [CustomerPreferenceCategory.HEALTH], // Using HEALTH as per provided ID, can be changed to BEAUTY
    description: "User interested in health & beauty - Admin Pick"
  },
  {
    customerId: "PLEASE_REPLACE_RESTAURANT_CUSTOMER_ID", // Placeholder for Restaurant Customer ID
    preferredCategories: [CustomerPreferenceCategory.RESTAURANTS],
    description: "User interested in restaurants - Admin Pick"
  }
  // Add other specific customer preferences here if needed
];

/**
 * Staged recommendations service
 */
export class StagedRecommendationsService {
  /**
   * Check if a customer has staged recommendations
   * @param customerId Customer ID
   * @returns True if the customer has staged recommendations
   */
  hasCustomerStagedRecommendations(customerId: string): boolean {
    return customerPreferences.some(pref => pref.customerId === customerId);
  }

  /**
   * Update customer ID in the preferences map
   * @param index Index of the customer in the preferences array
   * @param customerId New customer ID
   */
  updateCustomerId(index: number, customerId: string): void {
    if (index >= 0 && index < customerPreferences.length) {
      customerPreferences[index].customerId = customerId;
      logger.info(`Updated customer ID at index ${index} to ${customerId}`);
    } else {
      logger.error(`Invalid index: ${index}`);
    }
  }

  /**
   * Get customer preferences
   * @param customerId Customer ID
   * @returns Customer preferences or null if not found
   */
  getCustomerPreferences(customerId: string): CustomerPreference | null {
    const preferences = customerPreferences.find(pref => pref.customerId === customerId);
    return preferences || null;
  }

  /**
   * Get staged recommendations for a customer
   * @param customerId Customer ID
   * @param limit Number of recommendations to return
   * @returns Promise resolving to recommended businesses
   */
  async getStagedRecommendations(customerId: string, limit: number = 5): Promise<any[]> {
    try {
      const preferences = this.getCustomerPreferences(customerId);
      
      if (!preferences) {
        logger.info(`No staged preferences found for customer ${customerId}`);
        return [];
      }
      
      logger.info(`Getting staged recommendations for customer ${customerId} with preferences: ${preferences.preferredCategories.join(', ')}`);
      
      // Find businesses matching the customer's preferred categories
      const businesses = await Business.find({
        category: { $in: preferences.preferredCategories },
        status: "active"
      })
      .limit(limit * 2) // Get more than needed to ensure we have enough after filtering
      .select("_id name description logo coverImage category rating");
      
      if (businesses.length === 0) {
        logger.info(`No businesses found matching preferences for customer ${customerId}`);
        return [];
      }
      
      // Add prediction scores and recommendation method
      const recommendedBusinesses = businesses.slice(0, limit).map(business => ({
        ...business.toObject(),
        predictionScore: (4 + Math.random()).toFixed(1), // High score between 4 and 5
        recommendationMethod: "personalized",
        recommendationReason: `Based on your interest in ${business.category}`
      }));
      
      logger.info(`Returning ${recommendedBusinesses.length} staged recommendations for customer ${customerId}`);
      
      return recommendedBusinesses;
    } catch (error) {
      logger.error(`Error getting staged recommendations for customer ${customerId}:`, error);
      return [];
    }
  }

  /**
   * Get all customer preferences
   * @returns Array of customer preferences
   */
  getAllCustomerPreferences(): CustomerPreference[] {
    return [...customerPreferences];
  }

  /**
   * Add a new customer preference
   * @param customerId Customer ID
   * @param preferredCategories Preferred categories
   * @param description Description of the customer's preferences
   */
  addCustomerPreference(
    customerId: string,
    preferredCategories: CustomerPreferenceCategory[],
    description: string
  ): void {
    // Check if customer already exists
    const existingIndex = customerPreferences.findIndex(pref => pref.customerId === customerId);
    
    if (existingIndex >= 0) {
      // Update existing preference
      customerPreferences[existingIndex] = {
        customerId,
        preferredCategories,
        description
      };
      logger.info(`Updated preferences for customer ${customerId}`);
    } else {
      // Add new preference
      customerPreferences.push({
        customerId,
        preferredCategories,
        description
      });
      logger.info(`Added new preferences for customer ${customerId}`);
    }
  }
}

// Export singleton instance
export const stagedRecommendationsService = new StagedRecommendationsService();
