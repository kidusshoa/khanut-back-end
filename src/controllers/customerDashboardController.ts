import { Request, Response } from "express";
import { Appointment } from "../models/appointment";
import { Order } from "../models/order";
import { Favorite } from "../models/favorite";
import { Business } from "../models/business";
import { Service } from "../models/service";
import { User } from "../models/user";
import { AuthRequest } from "../middleware/auth";

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

    let recommendedBusinesses = [];
    const limitNum = parseInt(limit as string) || 4;

    // If recommendation engine is not available or fails, fall back to popular businesses
    try {
      // This would be the call to your recommendation engine
      // For now, we'll just get some random businesses as a placeholder

      // Different recommendation methods
      if (method === "collaborative") {
        // Collaborative filtering based recommendations would go here
        // For now, just get some random businesses
        recommendedBusinesses = await Business.find({ status: "active" })
          .sort({ rating: -1 })
          .limit(limitNum)
          .select("_id name description logo coverImage category rating");

        // Add a mock prediction score
        recommendedBusinesses = recommendedBusinesses.map((business) => ({
          ...business.toObject(),
          predictionScore: (Math.random() * 2 + 3).toFixed(1), // Random score between 3 and 5
          recommendationMethod: "collaborative",
        }));
      } else if (method === "content") {
        // Content-based recommendations would go here
        // For now, just get businesses in categories the user has interacted with

        // Get user's favorite businesses
        const favorites = await Favorite.find({ customerId }).populate(
          "businessId"
        );

        // Extract categories
        const categories = favorites
          .map((fav) => (fav.businessId as any).category)
          .filter(Boolean);

        if (categories.length > 0) {
          // Find businesses in those categories
          recommendedBusinesses = await Business.find({
            status: "active",
            category: { $in: categories },
          })
            .limit(limitNum)
            .select("_id name description logo coverImage category rating");
        } else {
          // Fallback to new businesses
          recommendedBusinesses = await Business.find({ status: "active" })
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .select("_id name description logo coverImage category rating");
        }

        // Add a mock prediction score
        recommendedBusinesses = recommendedBusinesses.map((business) => ({
          ...business.toObject(),
          predictionScore: (Math.random() * 2 + 3).toFixed(1), // Random score between 3 and 5
          recommendationMethod: "content",
        }));
      } else {
        // Hybrid approach (default)
        // For now, just get a mix of popular and new businesses
        const popularBusinesses = await Business.find({ status: "active" })
          .sort({ rating: -1 })
          .limit(Math.ceil(limitNum / 2))
          .select("_id name description logo coverImage category rating");

        const newBusinesses = await Business.find({ status: "active" })
          .sort({ createdAt: -1 })
          .limit(Math.floor(limitNum / 2))
          .select("_id name description logo coverImage category rating");

        recommendedBusinesses = [...popularBusinesses, ...newBusinesses];

        // Add a mock prediction score
        recommendedBusinesses = recommendedBusinesses.map((business) => ({
          ...business.toObject(),
          predictionScore: (Math.random() * 2 + 3).toFixed(1), // Random score between 3 and 5
          recommendationMethod: "hybrid",
        }));
      }
    } catch (error) {
      console.error("Recommendation engine error:", error);

      // Fallback to popular businesses
      recommendedBusinesses = await Business.find({ status: "active" })
        .sort({ rating: -1 })
        .limit(limitNum)
        .select("_id name description logo coverImage category rating");
    }

    res.status(200).json({ recommendations: recommendedBusinesses });
  } catch (error) {
    console.error("Error fetching recommended businesses:", error);
    res.status(500).json({ message: "Server error" });
  }
};
