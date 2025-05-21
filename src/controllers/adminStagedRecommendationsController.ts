/**
 * Admin controller for managing staged recommendations
 */
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { 
  stagedRecommendationsService, 
  CustomerPreferenceCategory 
} from "../services/stagedRecommendations";
import { User, IUser } from "../models/user";
import logger from "../utils/logger";

/**
 * @desc    Get all customer preferences
 * @route   GET /api/admin/recommendations/staged
 * @access  Private (Admin)
 */
export const getAllCustomerPreferences = async (req: Request, res: Response) => {
  try {
    const preferences = stagedRecommendationsService.getAllCustomerPreferences();
    
    // Enhance with user details
    const enhancedPreferences = await Promise.all(
      preferences.map(async (pref) => {
        try {
          const user = await User.findById(pref.customerId).select("name email");
          return {
            ...pref,
            user: user ? { name: user.name, email: user.email } : null
          };
        } catch (error) {
          return {
            ...pref,
            user: null
          };
        }
      })
    );
    
    return res.status(200).json(enhancedPreferences);
  } catch (error) {
    logger.error("Error getting customer preferences:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Get customer preference by ID
 * @route   GET /api/admin/recommendations/staged/:customerId
 * @access  Private (Admin)
 */
export const getCustomerPreference = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    
    const preference = stagedRecommendationsService.getCustomerPreferences(customerId);
    
    if (!preference) {
      return res.status(404).json({ message: "Customer preference not found" });
    }
    
    // Get user details
    const user = await User.findById(customerId).select("name email");
    
    return res.status(200).json({
      ...preference,
      user: user ? { name: user.name, email: user.email } : null
    });
  } catch (error) {
    logger.error(`Error getting customer preference for ${req.params.customerId}:`, error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Update customer preference
 * @route   PUT /api/admin/recommendations/staged/:customerId
 * @access  Private (Admin)
 */
export const updateCustomerPreference = async (req: AuthRequest, res: Response) => {
  try {
    const { customerId } = req.params;
    const { preferredCategories, description } = req.body;
    
    // Validate input
    if (!preferredCategories || !Array.isArray(preferredCategories) || preferredCategories.length === 0) {
      return res.status(400).json({ message: "Preferred categories are required" });
    }
    
    if (!description) {
      return res.status(400).json({ message: "Description is required" });
    }
    
    // Validate categories
    const validCategories = Object.values(CustomerPreferenceCategory);
    const invalidCategories = preferredCategories.filter(
      (cat) => !validCategories.includes(cat as CustomerPreferenceCategory)
    );
    
    if (invalidCategories.length > 0) {
      return res.status(400).json({ 
        message: `Invalid categories: ${invalidCategories.join(", ")}`,
        validCategories
      });
    }
    
    // Check if user exists
    const user = await User.findById(customerId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Update preference
    stagedRecommendationsService.addCustomerPreference(
      customerId,
      preferredCategories as CustomerPreferenceCategory[],
      description
    );
    
    return res.status(200).json({ 
      message: "Customer preference updated successfully",
      preference: stagedRecommendationsService.getCustomerPreferences(customerId)
    });
  } catch (error) {
    logger.error(`Error updating customer preference for ${req.params.customerId}:`, error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Get all available categories
 * @route   GET /api/admin/recommendations/staged/categories
 * @access  Private (Admin)
 */
export const getAvailableCategories = async (req: Request, res: Response) => {
  try {
    const categories = Object.values(CustomerPreferenceCategory);
    return res.status(200).json(categories);
  } catch (error) {
    logger.error("Error getting available categories:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Get all customers without preferences
 * @route   GET /api/admin/recommendations/staged/available-customers
 * @access  Private (Admin)
 */
export const getAvailableCustomers = async (req: Request, res: Response) => {
  try {
    // Fetch all customers and select only necessary fields
    const customers: IUser[] = await User.find({ role: "customer" })
      .select("_id name email")
      .sort({ name: 1 });
    
    // Get all customers with preferences
    const preferences = stagedRecommendationsService.getAllCustomerPreferences();
    const customerIdsWithPreferences = preferences.map(pref => pref.customerId);
    
    // Filter out customers that already have preferences
    const availableCustomers = customers.filter(
      (customer: IUser) => !customerIdsWithPreferences.includes((customer._id as any).toString())
    );
    
    return res.status(200).json(availableCustomers);
  } catch (error) {
    logger.error("Error getting available customers:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Test recommendations for a customer
 * @route   GET /api/admin/recommendations/staged/test/:customerId
 * @access  Private (Admin)
 */
export const testCustomerRecommendations = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { limit = 5 } = req.query;
    
    const limitNum = parseInt(limit as string) || 5;
    
    // Check if customer has preferences
    if (!stagedRecommendationsService.hasCustomerStagedRecommendations(customerId)) {
      return res.status(404).json({ message: "Customer has no staged preferences" });
    }
    
    // Get recommendations
    const recommendations = await stagedRecommendationsService.getStagedRecommendations(
      customerId,
      limitNum
    );
    
    return res.status(200).json(recommendations);
  } catch (error) {
    logger.error(`Error testing recommendations for ${req.params.customerId}:`, error);
    return res.status(500).json({ message: "Server error" });
  }
};
