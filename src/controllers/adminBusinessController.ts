import { Request, Response } from "express";
import { ActivityLog } from "../models/activityLog";
import { Business } from "../models/business";

export const getPendingBusinesses = async (req: Request, res: Response) => {
  try {
    const businesses = await Business.find({ approved: false }).sort({
      createdAt: -1,
    });
    res.json(businesses);
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
    const businesses = await Business.find({ approved: true }).sort({
      createdAt: -1,
    });
    res.json(businesses);
  } catch (err) {
    console.error("❌ Fetch approved businesses:", err);
    res.status(500).json({ message: "Failed to fetch businesses" });
  }
};
