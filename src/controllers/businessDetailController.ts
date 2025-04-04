import { HydratedDocument, Types } from "mongoose";
import { IUser } from "../models/user"; // if you have a user interface
import { Service } from "../models/service";
import { Business } from "../models/business";
import { Review } from "../models/review";
import { Request, Response } from "express";

export const getBusinessDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const business = await Business.findById(id)
      .populate<{
        ownerId: { name: string; email: string; phone: string };
      }>("ownerId", "name email phone")
      .lean();

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const services = await Service.find({ businessId: business._id });
    const reviews = await Review.find({ businessId: business._id })
      .populate("authorId", "name email")
      .sort({ createdAt: -1 });

    return res.json({
      profile: {
        name: business.name,
        email: (business.ownerId as any)?.email || "",
        phone: (business.ownerId as any)?.phone || "",
        city: business.city || "",
      },
      description: business.description,
      location: business.location,
      services,
      reviews,
    });
  } catch (err) {
    console.error("❌ Get business detail error:", err);
    return res.status(500).json({ message: "Failed to load business detail" });
  }
};
