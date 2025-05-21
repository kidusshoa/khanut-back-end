import { Request, Response } from "express";
import { Appointment } from "../models/appointment";
import { Order } from "../models/order";
import { Favorite } from "../models/favorite";
import { Business } from "../models/business";
import { Service } from "../models/service";
import { User } from "../models/user";
import { AuthRequest } from "../middleware/auth";
import { stagedRecommendationsService } from "../services/stagedRecommendations";

/**
 * @desc    Get customer dashboard statistics
 * @route   GET /api/customer/dashboard/stats
 * @access  Private (Customer)
 */
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.id;

    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get total appointments count
    const totalAppointments = await Appointment.countDocuments({
      customerId,
    });

    // Get upcoming appointments count (confirmed appointments with future dates)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingAppointments = await Appointment.countDocuments({
      customerId,
      status: "confirmed",
      date: { $gte: today },
    });

    // Get total orders count
    const totalOrders = await Order.countDocuments({
      customerId,
    });

    // Get pending orders count
    const pendingOrders = await Order.countDocuments({
      customerId,
      status: { $in: ["pending", "processing"] },
    });

    // Get favorite services/businesses count
    const favoriteServices = await Favorite.countDocuments({
      customerId,
    });

    // Return the statistics
    res.status(200).json({
      totalAppointments,
      upcomingAppointments,
      totalOrders,
      pendingOrders,
      favoriteServices,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Get recommended businesses for a customer
 * @route   GET /api/customer/recommended
 * @access  Private (Customer)
 */
export const getRecommendedBusinesses = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const customerId = req.user?.id;
    const { limit = 4, method = "hybrid" } = req.query;

    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let recommendedBusinesses: any[] = [];
    const limitNum = parseInt(limit as string) || 4;
    let primaryRecommendationsAttempted = false;
    let primaryRecommendationsFound = false;

    // --- Primary Recommendation Logic --- 
    try {
      primaryRecommendationsAttempted = true;
      console.log(`Attempting primary recommendations for customer ${customerId} using method: ${method}`);
      // This would be the call to your recommendation engine (e.g., "Esti")
      // For now, we'll use the existing placeholder logic

      if (method === "collaborative") {
        // Collaborative filtering based recommendations would go here
        recommendedBusinesses = await Business.find({ status: "active" })
          .sort({ rating: -1 })
          .limit(limitNum)
          .select("_id name description logo coverImage category rating");
        if (recommendedBusinesses.length > 0) {
            recommendedBusinesses = recommendedBusinesses.map((business) => ({
              ...business.toObject(),
              predictionScore: (Math.random() * 2 + 3).toFixed(1), // Random score between 3 and 5
              recommendationMethod: "collaborative",
            }));
            primaryRecommendationsFound = true;
        }
      } else if (method === "content") {
        // Content-based recommendations would go here
        const favorites = await Favorite.find({ customerId }).populate(
          "businessId"
        );
        const categories = favorites
          .map((fav) => (fav.businessId as any).category)
          .filter(Boolean);

        if (categories.length > 0) {
          recommendedBusinesses = await Business.find({
            status: "active",
            category: { $in: categories },
          })
            .limit(limitNum)
            .select("_id name description logo coverImage category rating");
        } else {
          // Fallback to new businesses if no favorites/categories
          recommendedBusinesses = await Business.find({ status: "active" })
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .select("_id name description logo coverImage category rating");
        }
        if (recommendedBusinesses.length > 0) {
            recommendedBusinesses = recommendedBusinesses.map((business) => ({
              ...business.toObject(),
              predictionScore: (Math.random() * 2 + 3).toFixed(1),
              recommendationMethod: "content",
            }));
            primaryRecommendationsFound = true;
        }
      } else { // Hybrid approach (default)
        const popularBusinesses = await Business.find({ status: "active" })
          .sort({ rating: -1 })
          .limit(Math.ceil(limitNum / 2))
          .select("_id name description logo coverImage category rating");

        const newBusinesses = await Business.find({ status: "active" })
          .sort({ createdAt: -1 })
          .limit(Math.floor(limitNum / 2))
          .select("_id name description logo coverImage category rating");

        recommendedBusinesses = [...popularBusinesses, ...newBusinesses];
        if (recommendedBusinesses.length > 0) {
            recommendedBusinesses = recommendedBusinesses.map((business) => ({
              ...business.toObject(),
              predictionScore: (Math.random() * 2 + 3).toFixed(1),
              recommendationMethod: "hybrid",
            }));
            primaryRecommendationsFound = true;
        }
      }

      if (primaryRecommendationsFound) {
        console.log(`Found ${recommendedBusinesses.length} primary recommendations for customer ${customerId}`);
        return res.status(200).json({ recommendations: recommendedBusinesses });
      }

    } catch (error) {
      console.error("Primary recommendation engine error:", error);
      // Proceed to staged/fallback logic if primary fails
    }

    // --- Fallback to Staged Recommendations --- 
    if (!primaryRecommendationsFound) {
      console.log(`Primary recommendations not found or failed for ${customerId}. Attempting staged recommendations.`);
      if (stagedRecommendationsService.hasCustomerStagedRecommendations(customerId)) {
        console.log(`Using staged recommendations for customer ${customerId}`);
        const stagedRecs = await stagedRecommendationsService.getStagedRecommendations(
            customerId,
            limitNum
          );
        if (stagedRecs.length > 0) {
          return res.status(200).json({ recommendations: stagedRecs }); // Note: stagedRecs already has 'recommendationMethod'
        }
      }
    }

    // --- Final Fallback (e.g., Top Rated if all else fails) --- 
    if (recommendedBusinesses.length === 0) {
      console.log(`No primary or staged recommendations found for ${customerId}. Falling back to top-rated.`);
      recommendedBusinesses = await Business.find({ status: "active" })
        .sort({ rating: -1 })
        .limit(limitNum)
        .select("_id name description logo coverImage category rating");
      
      // Add a generic recommendation method if not already present
      recommendedBusinesses = recommendedBusinesses.map((business) => ({
        ...business.toObject(),
        predictionScore: (business.toObject().rating || (Math.random()*2+3)).toFixed(1),
        recommendationMethod: "general-fallback",
      }));
    }

    res.status(200).json({ recommendations: recommendedBusinesses });

  } catch (error) {
    console.error("Error fetching recommended businesses:", error);
    res.status(500).json({ message: "Server error" });
  }
};
