import { Request, Response } from "express";
import { Business } from "../models/business";
import { Review } from "../models/review";
import axios from "axios";

interface AuthRequest extends Request {
  user: {
    id: string;
    role: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
}

export const getFeaturedBusinesses = async (
  req: AuthRequest,
  res: Response
) => {
  const userLocation = req.user?.location;

  if (!userLocation) {
    return res.status(400).json({ message: "User location not provided" });
  }

  try {
    const businesses = await Business.find({
      approved: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [userLocation.lng, userLocation.lat],
          },
          $maxDistance: 30000, // 30 km radius
        },
      },
    }).limit(4);

    res.json(businesses);
  } catch (err) {
    console.error("❌ Featured businesses error:", err);
    res.status(500).json({ message: "Failed to load featured businesses" });
  }
};

export const getTopBusinesses = async (_req: Request, res: Response) => {
  try {
    const businesses = await Business.aggregate([
      { $match: { approved: true } },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "businessId",
          as: "reviews",
        },
      },
      {
        $addFields: {
          avgRating: { $avg: "$reviews.rating" },
        },
      },
      { $sort: { avgRating: -1 } },
      { $limit: 10 },
    ]);

    res.json(businesses);
  } catch (err) {
    console.error("❌ Top businesses error:", err);
    res.status(500).json({ message: "Failed to load top businesses" });
  }
};

export const getRecommendedBusinesses = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user.id;
    const RECOMMENDATION_SERVICE_URL =
      process.env.RECOMMENDATION_SERVICE_URL || "http://ai.khanut.online";
    const method = (req.query.method as string) || "hybrid";
    const limit = parseInt(req.query.limit as string) || 5;

    try {
      // Try to get recommendations from the recommendation service
      console.log(
        `Calling recommendation service at: ${RECOMMENDATION_SERVICE_URL}/api/v1/recommendations/${userId}?limit=${limit}&method=${method}`
      );

      const response = await axios.get(
        `${RECOMMENDATION_SERVICE_URL}/api/v1/recommendations/${userId}?limit=${limit}&method=${method}`
      );

      console.log("Recommendation service response:", response.data);

      // If successful, fetch the full business details from our database
      if (response.data && response.data.recommendations) {
        const businessIds = response.data.recommendations.map(
          (rec: any) => rec.business_id
        );

        console.log("Business IDs from recommendations:", businessIds);

        const businesses = await Business.find({
          _id: { $in: businessIds },
          approved: true,
        });

        console.log(`Found ${businesses.length} businesses in database`);

        // Sort businesses in the same order as recommendations
        const sortedBusinesses = businessIds
          .map((id: string) =>
            businesses.find((b: any) => b._id.toString() === id)
          )
          .filter(Boolean);

        console.log(`Sorted ${sortedBusinesses.length} businesses`);

        // Add prediction scores to the response
        const enhancedBusinesses = sortedBusinesses.map(
          (business: any, index: number) => {
            const recommendation = response.data.recommendations[index];
            return {
              ...business.toObject(),
              predictionScore: recommendation.predicted_rating,
              recommendationMethod: method,
            };
          }
        );

        console.log("Returning enhanced businesses with prediction scores");
        return res.json({
          recommendations: enhancedBusinesses,
        });
      }
    } catch (recError) {
      console.log(
        `Recommendation service error (method=${method}), falling back to default recommendations:`,
        recError
      );
      // If recommendation service fails, fall back to default recommendations
    }

    // Fallback: Get businesses with highest ratings
    const topRatedBusinesses = await Business.aggregate([
      { $match: { approved: true } },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "businessId",
          as: "reviews",
        },
      },
      {
        $addFields: {
          avgRating: { $avg: "$reviews.rating" },
          reviewCount: { $size: "$reviews" },
        },
      },
      { $sort: { avgRating: -1, reviewCount: -1 } },
      { $limit: limit },
    ]);

    console.log(
      `Returning ${topRatedBusinesses.length} top-rated businesses as fallback`
    );

    // Return in the same format as the recommendation service response
    res.json({
      recommendations: topRatedBusinesses.map((business) => ({
        ...business,
        predictionScore: business.avgRating || 4.5,
        recommendationMethod: "fallback",
      })),
    });
  } catch (err) {
    console.error("❌ Recommended businesses error:", err);
    res.status(500).json({ message: "Failed to load recommendations" });
  }
};
