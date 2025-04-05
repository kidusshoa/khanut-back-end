import { Request, Response } from "express";
import { User } from "../models/user";
import { Business } from "../models/business";
import mongoose from "mongoose";

interface AuthRequest extends Request {
  user: {
    id: string;
  };
}

export const toggleFavorite = async (req: AuthRequest, res: Response) => {
  const { businessId } = req.params;

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const businessObjectId = new mongoose.Types.ObjectId(businessId);

  const isFavorited = user.favorites.some((fav) =>
    fav.equals(businessObjectId)
  );

  if (isFavorited) {
    user.favorites = user.favorites.filter(
      (fav) => !fav.equals(businessObjectId)
    );
    await user.save();
    return res.json({ message: "Removed from favorites" });
  }

  user.favorites.push(businessObjectId);
  await user.save();
  return res.json({ message: "Added to favorites" });
};

export const getFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user.id).populate("favorites");
    return res.json(user?.favorites || []);
  } catch (err) {
    console.error("❌ getFavorites error:", err);
    return res.status(500).json({ message: "Failed to fetch favorites" });
  }
};
