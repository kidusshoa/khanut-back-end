import { Router } from "express";
import { 
  getServiceReviews,
  getBusinessReviews,
  getCustomerReviews,
  createReview,
  updateReview,
  deleteReview,
  getServiceRatingStats
} from "../controllers/serviceReviewController";
import { auth } from "../middleware/auth";
import { isCustomer } from "../middleware/isCustomer";

const router = Router();

// Get all reviews for a service
router.get("/service/:serviceId", getServiceReviews);

// Get all reviews for a business
router.get("/business/:businessId", getBusinessReviews);

// Get all reviews by a customer
router.get("/customer/:customerId", getCustomerReviews);

// Get service rating statistics
router.get("/stats/service/:serviceId", getServiceRatingStats);

// Create a new review (customer only)
router.post("/", auth, isCustomer, createReview);

// Update a review (owner only)
router.put("/:reviewId", auth, updateReview);

// Delete a review (owner or admin only)
router.delete("/:reviewId", auth, deleteReview);

export default router;
