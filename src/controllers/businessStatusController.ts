import { Request, Response } from "express";
import { Business } from "../models/business";

interface AuthRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

export const getBusinessStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Find the business owned by the user
    const business = await Business.findOne({ ownerId: userId });
    
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }
    
    // Return the business status
    return res.json({
      status: business.status,
      approved: business.approved,
      businessId: business._id
    });
  } catch (err) {
    console.error("❌ Get business status error:", err);
    return res.status(500).json({ message: "Failed to get business status" });
  }
};
