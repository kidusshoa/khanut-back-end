import express, { Response, RequestHandler } from "express";
import { protect } from "../middleware/auth";
import { isCustomer } from "../middleware/isCustomer";
import { AuthRequest } from "../types/express";
import { Review } from "../models/review";
import { Business } from "../models/business";
import { Types } from "mongoose";

const router = express.Router();

const typedHandler = (
  fn: (req: AuthRequest, res: Response) => Promise<Response>
) => {
  return (async (req, res) => fn(req as AuthRequest, res)) as RequestHandler;
};

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Submit a review for a business
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessId
 *               - rating
 *               - comment
 *             properties:
 *               businessId:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review submitted successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  protect(["customer"]),
  isCustomer,
  typedHandler(async (req: AuthRequest, res: Response) => {
    try {
      const { businessId, rating, comment } = req.body;

      // Validate input
      if (!businessId || !rating || !comment) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ message: "Rating must be between 1 and 5" });
      }

      // Check if business exists
      const business = await Business.findById(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Create review
      const review = new Review({
        businessId,
        authorId: req.user.id,
        rating,
        comment,
      });

      await review.save();

      // Add review to business
      business.reviews.push(review._id as Types.ObjectId);
      await business.save();

      return res.status(201).json({
        message: "Review submitted successfully",
        review,
      });
    } catch (err) {
      console.error("❌ Submit review error:", err);
      return res.status(500).json({ message: "Failed to submit review" });
    }
  })
);

/**
 * @swagger
 * /api/reviews/business/{businessId}:
 *   get:
 *     summary: Get reviews for a business
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
 *     responses:
 *       200:
 *         description: List of reviews for the business
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.get("/business/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;

    // Check if business exists
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Get reviews
    const reviews = await Review.find({ businessId })
      .populate("authorId", "name email profilePicture")
      .sort({ createdAt: -1 });

    return res.json(reviews);
  } catch (err) {
    console.error("❌ Get business reviews error:", err);
    return res.status(500).json({ message: "Failed to get reviews" });
  }
});

export default router;
