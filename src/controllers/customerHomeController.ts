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

    // Dummy logic for now
    const recommendations = await Business.find({ approved: true }).limit(5);

    // Later: Use ML model based on user's past favorites/reviews
    res.json(recommendations);
  } catch (err) {
    console.error("❌ Recommended businesses error:", err);
    res.status(500).json({ message: "Failed to load recommendations" });
  }
};
