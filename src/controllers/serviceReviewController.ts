import { Request, Response } from "express";
import { ServiceReview } from "../models/serviceReview";
import { Service } from "../models/service";
import { User } from "../models/user";
import mongoose from "mongoose";

// Get all reviews for a service
export const getServiceReviews = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    
    const reviews = await ServiceReview.find({ serviceId })
      .populate("customerId", "name profilePicture")
      .sort({ createdAt: -1 });
    
    return res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching service reviews:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all reviews for a business
export const getBusinessReviews = async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    
    const reviews = await ServiceReview.find({ businessId })
      .populate("customerId", "name profilePicture")
      .populate("serviceId", "name")
      .sort({ createdAt: -1 });
    
    return res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching business reviews:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all reviews by a customer
export const getCustomerReviews = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    
    const reviews = await ServiceReview.find({ customerId })
      .populate("serviceId", "name")
      .populate("businessId", "name")
      .sort({ createdAt: -1 });
    
    return res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching customer reviews:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Create a new review
export const createReview = async (req: Request, res: Response) => {
  try {
    const { serviceId, businessId, customerId, rating, comment } = req.body;
    
    // Validate service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    
    // Validate customer exists
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    // Check if customer has already reviewed this service
    const existingReview = await ServiceReview.findOne({
      serviceId,
      customerId,
    });
    
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this service" });
    }
    
    // Create the review
    const newReview = new ServiceReview({
      serviceId,
      businessId,
      customerId,
      rating,
      comment,
    });
    
    await newReview.save();
    
    // Calculate new average rating for the service
    const allReviews = await ServiceReview.find({ serviceId });
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / allReviews.length;
    
    // Update service with new rating (if we decide to add rating field to service model)
    // await Service.findByIdAndUpdate(serviceId, { rating: averageRating });
    
    return res.status(201).json(newReview);
  } catch (error) {
    console.error("Error creating review:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update a review
export const updateReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    
    const review = await ServiceReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    // Check if the user is the owner of the review
    if (review.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    // Update the review
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    
    await review.save();
    
    // Recalculate average rating for the service
    const allReviews = await ServiceReview.find({ serviceId: review.serviceId });
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / allReviews.length;
    
    // Update service with new rating (if we decide to add rating field to service model)
    // await Service.findByIdAndUpdate(review.serviceId, { rating: averageRating });
    
    return res.status(200).json(review);
  } catch (error) {
    console.error("Error updating review:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete a review
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    
    const review = await ServiceReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    // Check if the user is the owner of the review or an admin
    if (review.customerId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    await ServiceReview.findByIdAndDelete(reviewId);
    
    // Recalculate average rating for the service
    const allReviews = await ServiceReview.find({ serviceId: review.serviceId });
    
    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / allReviews.length;
      
      // Update service with new rating (if we decide to add rating field to service model)
      // await Service.findByIdAndUpdate(review.serviceId, { rating: averageRating });
    }
    
    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get service rating statistics
export const getServiceRatingStats = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    
    const reviews = await ServiceReview.find({ serviceId });
    
    if (reviews.length === 0) {
      return res.status(200).json({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
      });
    }
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    // Calculate rating distribution
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    
    reviews.forEach((review) => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });
    
    return res.status(200).json({
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution,
    });
  } catch (error) {
    console.error("Error fetching service rating stats:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
