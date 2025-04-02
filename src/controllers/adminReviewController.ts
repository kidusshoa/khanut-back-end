import { Request, Response } from "express";
import { Review } from "../models/review";
import { ActivityLog } from "../models/activityLog";

export const getPendingReviews = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ status: "pending" })
        .populate("businessId", "name")
        .populate("authorId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ status: "pending" }),
    ]);

    return res.json({
      reviews,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    });
  } catch (err) {
    console.error("❌ Fetch pending reviews error:", err);
    return res.status(500).json({ message: "Failed to load pending reviews" });
  }
};

export const approveReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) return res.status(404).json({ message: "Review not found" });

    review.status = "approved";
    await review.save();

    await ActivityLog.create({
      message: `Review by ${review.authorId} approved.`,
    });

    return res.json({ message: "Review approved" });
  } catch (err) {
    console.error("❌ Approve review error:", err);
    return res.status(500).json({ message: "Failed to approve review" });
  }
};

export const rejectReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) return res.status(404).json({ message: "Review not found" });

    review.status = "rejected";
    await review.save();

    await ActivityLog.create({
      message: `Review by ${review.authorId} rejected.`,
    });

    return res.json({ message: "Review rejected" });
  } catch (err) {
    console.error("❌ Reject review error:", err);
    return res.status(500).json({ message: "Failed to reject review" });
  }
};
