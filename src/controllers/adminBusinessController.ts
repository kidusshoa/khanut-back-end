import { Request, Response } from "express";
import { ActivityLog } from "../models/activityLog";
import { Business } from "../models/business";

export const getPendingBusinesses = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [businesses, total] = await Promise.all([
      Business.find({ approved: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Business.countDocuments({ approved: false }),
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
    console.error("❌ Fetch pending businesses:", err);
    res.status(500).json({ message: "Failed to fetch pending approvals" });
  }
};

export const approveBusiness = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const business = await Business.findById(id);
    if (!business)
      return res.status(404).json({ message: "Business not found" });

    business.approved = true;
    business.status = "approved";
    await business.save();

    await ActivityLog.create({
      message: `Business "${business.name}" approved`,
    });

    res.json({ message: "Business approved" });
  } catch (err) {
    console.error("❌ Approve business error:", err);
    res.status(500).json({ message: "Failed to approve business" });
  }
};

export const getApprovedBusinesses = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [businesses, total] = await Promise.all([
      Business.find({ approved: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Business.countDocuments({ approved: true }),
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
    console.error("❌ Fetch pending businesses:", err);
    res.status(500).json({ message: "Failed to fetch pending approvals" });
  }
};

export const rejectBusiness = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const business = await Business.findById(id);
    if (!business)
      return res.status(404).json({ message: "Business not found" });

    // Mark as rejected (we keep it in the database but with rejected status)
    business.approved = false;
    business.status = "rejected";
    await business.save();

    await ActivityLog.create({
      message: `Business "${business.name}" rejected`,
    });

    res.json({ message: "Business rejected" });
  } catch (err) {
    console.error("❌ Reject business error:", err);
    res.status(500).json({ message: "Failed to reject business" });
  }
};
