import { Request, Response } from "express";
import { Business } from "../models/business";
import { Service } from "../models/service";
import { SortOrder } from "mongoose";

const getSortOptions = (
  sortBy: string | undefined,
  lat?: number,
  lng?: number
): { [key: string]: any } => {
  if (sortBy === "rating") return { rating: "desc" };
  if (sortBy === "location" && lat && lng) {
    return {
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
        },
      },
    };
  }
  return {};
};

const buildFilters = (query: any) => {
  const filters: any = { approved: true };
  if (query.city) filters.city = query.city;
  if (query.category) filters.category = query.category;
  return filters;
};

export const searchBusinesses = async (req: Request, res: Response) => {
  try {
    const { query, city, category, sortBy, lat, lng } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filters = buildFilters({ city, category });
    if (query) filters.name = { $regex: query, $options: "i" };

    const sort = getSortOptions(
      sortBy as string,
      parseFloat(lat as string),
      parseFloat(lng as string)
    );

    const [businesses, total] = await Promise.all([
      Business.find(filters).sort(sort).skip(skip).limit(limit),
      Business.countDocuments(filters),
    ]);

    res.json({
      businesses,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error("❌ Search businesses error:", err);
    res.status(500).json({ message: "Failed to search businesses" });
  }
};

export const searchByDescription = async (req: Request, res: Response) => {
  try {
    const { query, sortBy, lat, lng } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filters: any = { approved: true };
    if (query) filters.description = { $regex: query, $options: "i" };

    const sort = getSortOptions(
      sortBy as string,
      parseFloat(lat as string),
      parseFloat(lng as string)
    );

    const [businesses, total] = await Promise.all([
      Business.find(filters).sort(sort).skip(skip).limit(limit),
      Business.countDocuments(filters),
    ]);

    res.json({
      businesses,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error("❌ Search by description error:", err);
    res.status(500).json({ message: "Failed to search by description" });
  }
};

export const searchByServices = async (req: Request, res: Response) => {
  try {
    const { query, sortBy, lat, lng } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const serviceMatches = await Service.find({
      name: { $regex: query as string, $options: "i" },
    });

    const businessIds = [
      ...new Set(serviceMatches.map((s) => s.businessId.toString())),
    ];
    const filters = { _id: { $in: businessIds }, approved: true };

    const sort = getSortOptions(
      sortBy as string,
      parseFloat(lat as string),
      parseFloat(lng as string)
    );

    const [businesses, total] = await Promise.all([
      Business.find(filters).sort(sort).skip(skip).limit(limit),
      Business.countDocuments(filters),
    ]);

    res.json({
      businesses,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error("❌ Search by services error:", err);
    res.status(500).json({ message: "Failed to search by services" });
  }
};
