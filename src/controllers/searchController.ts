import { Request, Response } from "express";
import { Business } from "../models/business";
import { Service } from "../models/service";
import { SortOrder } from "mongoose";

const getSortOptions = (
  sortBy: string | undefined,
  order: string | undefined,
  lat?: number,
  lng?: number
): { [key: string]: any } => {
  const sortOrder = order === "asc" ? 1 : -1;

  if (sortBy === "rating") return { rating: sortOrder };
  if (sortBy === "name") return { name: sortOrder };
  if (sortBy === "price") return { price: sortOrder }; // For services
  if (sortBy === "createdAt") return { createdAt: sortOrder };
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
  return { createdAt: -1 }; // Default sort by newest
};

const buildFilters = (query: any) => {
  const filters: any = { approved: true };

  // Basic filters
  if (query.city) filters.city = query.city;
  if (query.category) filters.category = query.category;

  // Service type filters
  if (query.serviceTypes) {
    const types = Array.isArray(query.serviceTypes)
      ? query.serviceTypes
      : [query.serviceTypes];
    filters.serviceTypes = { $in: types };
  }

  // Rating filter
  if (query.minRating) {
    filters.rating = {
      ...filters.rating,
      $gte: parseFloat(query.minRating as string),
    };
  }
  if (query.maxRating) {
    filters.rating = {
      ...filters.rating,
      $lte: parseFloat(query.maxRating as string),
    };
  }

  return filters;
};

export const searchBusinesses = async (req: Request, res: Response) => {
  try {
    const {
      query,
      city,
      category,
      sortBy,
      order,
      lat,
      lng,
      serviceTypes,
      minRating,
      maxRating,
    } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filters = buildFilters({
      city,
      category,
      serviceTypes,
      minRating,
      maxRating,
    });

    if (query) filters.name = { $regex: query, $options: "i" };

    const sort = getSortOptions(
      sortBy as string,
      order as string,
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
    const {
      query,
      sortBy,
      order,
      lat,
      lng,
      city,
      category,
      serviceTypes,
      minRating,
      maxRating,
    } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filters = buildFilters({
      city,
      category,
      serviceTypes,
      minRating,
      maxRating,
    });

    if (query) filters.description = { $regex: query, $options: "i" };

    const sort = getSortOptions(
      sortBy as string,
      order as string,
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
    const { query, sortBy, order, lat, lng, minPrice, maxPrice, serviceType } =
      req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build service filters
    const serviceFilters: any = {
      name: { $regex: query as string, $options: "i" },
    };

    // Add service type filter
    if (serviceType) {
      serviceFilters.serviceType = serviceType;
    }

    // Add price range filter
    if (minPrice) {
      serviceFilters.price = {
        ...serviceFilters.price,
        $gte: parseFloat(minPrice as string),
      };
    }
    if (maxPrice) {
      serviceFilters.price = {
        ...serviceFilters.price,
        $lte: parseFloat(maxPrice as string),
      };
    }

    // Find matching services
    const serviceMatches = await Service.find(serviceFilters);

    // Extract business IDs from matching services
    const businessIds = [
      ...new Set(serviceMatches.map((s) => s.businessId.toString())),
    ];

    // Build business filters
    const businessFilters = { _id: { $in: businessIds }, approved: true };

    // Apply sorting
    const sort = getSortOptions(
      sortBy as string,
      order as string,
      parseFloat(lat as string),
      parseFloat(lng as string)
    );

    // Fetch businesses and count
    const [businesses, total] = await Promise.all([
      Business.find(businessFilters).sort(sort).skip(skip).limit(limit),
      Business.countDocuments(businessFilters),
    ]);

    // Return services along with businesses
    res.json({
      businesses,
      services: serviceMatches,
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

// New endpoint for advanced search
export const advancedSearch = async (req: Request, res: Response) => {
  try {
    const {
      query,
      city,
      category,
      sortBy,
      order,
      lat,
      lng,
      serviceTypes,
      minRating,
      maxRating,
      minPrice,
      maxPrice,
      serviceType,
    } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build business filters
    const businessFilters = buildFilters({
      city,
      category,
      serviceTypes,
      minRating,
      maxRating,
    });

    // Add name and description search
    if (query) {
      businessFilters.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    // Build service filters
    const serviceFilters: any = {};

    if (query) {
      serviceFilters.name = { $regex: query, $options: "i" };
    }

    // Add service type filter
    if (serviceType) {
      serviceFilters.serviceType = serviceType;
    }

    // Add price range filter
    if (minPrice) {
      serviceFilters.price = {
        ...serviceFilters.price,
        $gte: parseFloat(minPrice as string),
      };
    }
    if (maxPrice) {
      serviceFilters.price = {
        ...serviceFilters.price,
        $lte: parseFloat(maxPrice as string),
      };
    }

    // Apply sorting
    const sort = getSortOptions(
      sortBy as string,
      order as string,
      parseFloat(lat as string),
      parseFloat(lng as string)
    );

    // Parallel queries for businesses and services
    const [businessResults, serviceResults] = await Promise.all([
      // Business search
      Promise.all([
        Business.find(businessFilters).sort(sort).skip(skip).limit(limit),
        Business.countDocuments(businessFilters),
      ]),

      // Service search
      Promise.all([
        Service.find(serviceFilters)
          .limit(limit)
          .populate("businessId", "name logo"),
        Service.countDocuments(serviceFilters),
      ]),
    ]);

    // Extract results
    const [businesses, totalBusinesses] = businessResults;
    const [services, totalServices] = serviceResults;

    // Get business IDs from services for additional business results
    const serviceBusinessIds = services.map((s) => s.businessId.toString());

    // Find additional businesses from services that weren't in the original business results
    // Use proper typing for the business document
    const businessIdsFromResults = businesses.map((b) => {
      // Ensure b._id is properly typed by checking if it exists
      return b._id ? b._id.toString() : "";
    });

    const additionalBusinessIds = serviceBusinessIds.filter(
      (id) => !businessIdsFromResults.includes(id)
    );

    // Define the type for additionalBusinesses
    let additionalBusinesses: typeof businesses = [];
    if (additionalBusinessIds.length > 0) {
      additionalBusinesses = await Business.find({
        _id: { $in: additionalBusinessIds },
        approved: true,
      }).limit(Math.max(0, limit - businesses.length));
    }

    // Combine business results
    const allBusinesses = [...businesses, ...additionalBusinesses];

    res.json({
      businesses: allBusinesses,
      services,
      pagination: {
        totalItems: totalBusinesses + additionalBusinessIds.length,
        totalServices,
        currentPage: page,
        totalPages: Math.ceil(
          (totalBusinesses + additionalBusinessIds.length) / limit
        ),
        hasNextPage:
          page <
          Math.ceil((totalBusinesses + additionalBusinessIds.length) / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error("❌ Advanced search error:", err);
    res.status(500).json({ message: "Failed to perform advanced search" });
  }
};
