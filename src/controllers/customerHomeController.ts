import { Request, Response } from "express";
import { Business } from "../models/business";
import { Review } from "../models/review";

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
      process.env.RECOMMENDATION_SERVICE_URL || "http://localhost:5000";

    try {
      // Try to get recommendations from the recommendation service
      const response = await axios.get(
        `${RECOMMENDATION_SERVICE_URL}/api/v1/recommendations/${userId}?limit=5`
      );

      // If successful, fetch the full business details from our database
      if (response.data && response.data.recommendations) {
        const businessIds = response.data.recommendations.map(
          (rec: any) => rec.business_id
        );

        const businesses = await Business.find({
          _id: { $in: businessIds },
          approved: true,
        });

        // Sort businesses in the same order as recommendations
        const sortedBusinesses = businessIds
          .map((id) => businesses.find((b) => b._id.toString() === id))
          .filter(Boolean);

        return res.json(sortedBusinesses);
      }
    } catch (recError) {
      console.log(
        "Recommendation service error, falling back to default recommendations:",
        recError
      );
      // If recommendation service fails, fall back to default recommendations
    }

    // Fallback: Get businesses with highest ratings
    const recommendations = await Business.find({
      approved: true,
    })
      .sort({ rating: -1 })
      .limit(5);

    res.json(recommendations);
  } catch (err) {
    console.error("❌ Recommended businesses error:", err);
    res.status(500).json({ message: "Failed to load recommendations" });
  }
};
