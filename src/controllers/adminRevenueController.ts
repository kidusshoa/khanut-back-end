import { Request, Response } from "express";
import { PlatformFee } from "../models/platformFee";

/**
 * Get platform revenue statistics
 */
export const getPlatformRevenue = async (_req: Request, res: Response) => {
  try {
    // Get date ranges
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Get platform fees
    const [totalFees, todayFees, weekFees, monthFees] = await Promise.all([
      PlatformFee.aggregate([
        { $group: { _id: null, total: { $sum: "$feeAmount" } } }
      ]),
      PlatformFee.aggregate([
        { $match: { createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: "$feeAmount" } } }
      ]),
      PlatformFee.aggregate([
        { $match: { createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: "$feeAmount" } } }
      ]),
      PlatformFee.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$feeAmount" } } }
      ])
    ]);
    
    // Get monthly revenue data for chart
    const monthlyRevenue = await PlatformFee.aggregate([
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          total: { $sum: "$feeAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    // Get revenue by business
    const revenueByBusiness = await PlatformFee.aggregate([
      {
        $group: {
          _id: "$businessId",
          total: { $sum: "$feeAmount" },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "businesses",
          localField: "_id",
          foreignField: "_id",
          as: "business"
        }
      },
      {
        $project: {
          businessId: "$_id",
          businessName: { $arrayElemAt: ["$business.name", 0] },
          total: 1,
          count: 1
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      totalRevenue: totalFees[0]?.total || 0,
      todayRevenue: todayFees[0]?.total || 0,
      weekRevenue: weekFees[0]?.total || 0,
      monthRevenue: monthFees[0]?.total || 0,
      monthlyRevenueData: monthlyRevenue.map(item => ({
        month: `${item._id.year}-${item._id.month}`,
        revenue: item.total
      })),
      topBusinesses: revenueByBusiness
    });
  } catch (error) {
    console.error("Error fetching platform revenue:", error);
    res.status(500).json({ message: "Failed to fetch platform revenue data" });
  }
};

/**
 * Get detailed platform fee transactions with pagination
 */
export const getPlatformFeeTransactions = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "10",
      startDate,
      endDate,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    // Convert page and limit to numbers
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};

    // Add date range filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const endDateObj = new Date(endDate as string);
        endDateObj.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateObj;
      }
    }

    // Determine sort order
    const sortOrder = order === "asc" ? 1 : -1;
    const sortOptions: any = {};
    sortOptions[sort as string] = sortOrder;

    // Execute query with pagination
    const [fees, total] = await Promise.all([
      PlatformFee.find(query)
        .populate("businessId", "name")
        .populate("paymentId")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      PlatformFee.countDocuments(query),
    ]);

    return res.status(200).json({
      transactions: fees,
      pagination: {
        totalItems: total,
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching platform fee transactions:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
