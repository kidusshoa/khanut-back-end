import { Request, Response } from "express";
import { Business } from "../models/business";

export const getNearbyBusinesses = async (req: Request, res: Response) => {
  try {
    const { lat, lng, distance, category } = req.query;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    // Validate lat and lng are valid numbers
    const latNum = parseFloat(lat as string);
    const lngNum = parseFloat(lng as string);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res
        .status(400)
        .json({ message: "Invalid latitude or longitude values" });
    }

    // Validate lat and lng are within valid ranges
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return res
        .status(400)
        .json({
          message:
            "Latitude must be between -90 and 90, longitude must be between -180 and 180",
        });
    }

    const maxDistance = parseInt(distance as string) || 5000; // Default to 5km

    console.log(
      `Searching for businesses near [${lngNum}, ${latNum}] within ${maxDistance}m`
    );

    const query: any = {
      approved: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lngNum, latNum],
          },
          $maxDistance: maxDistance,
        },
      },
    };

    // Add category filter if provided
    if (category && category !== "all") {
      query.category = { $regex: new RegExp(category as string, "i") };
    }

    console.log("Query:", JSON.stringify(query));

    const businesses = await Business.find(query);
    console.log(`Found ${businesses.length} businesses`);

    // Calculate distance for each business
    const businessesWithDistance = businesses.map((business) => {
      const businessObj = business.toObject();

      // Calculate distance in kilometers
      const businessLng = business.location.coordinates[0];
      const businessLat = business.location.coordinates[1];
      const distance = calculateDistance(
        latNum,
        lngNum,
        businessLat,
        businessLng
      );

      return {
        ...businessObj,
        distance: parseFloat(distance.toFixed(1)),
      };
    });

    // Sort by distance
    businessesWithDistance.sort((a, b) => a.distance - b.distance);

    res.json(businessesWithDistance);
  } catch (err) {
    console.error("❌ Nearby businesses error:", err);
    res.status(500).json({
      message: "Failed to load nearby businesses",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
