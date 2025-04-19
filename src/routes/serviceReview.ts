import { Router } from "express";
import {
  getServiceReviews,
  getBusinessReviews,
  getCustomerReviews,
  createReview,
  updateReview,
  deleteReview,
  getServiceRatingStats,
} from "../controllers/serviceReviewController";
import { protect } from "../middleware/auth";
import { isCustomer } from "../middleware/isCustomer";

const router = Router();

/**
 * @swagger
 * /api/reviews/service/{serviceId}:
 *   get:
 *     summary: Get all reviews for a service
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, highest, lowest]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of reviews for the service
 *       404:
 *         description: Service not found
 */
router.get("/service/:serviceId", getServiceReviews);

/**
 * @swagger
 * /api/reviews/business/{businessId}:
 *   get:
 *     summary: Get all reviews for a business
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, highest, lowest]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of reviews for the business
 *       404:
 *         description: Business not found
 */
router.get("/business/:businessId", getBusinessReviews);

/**
 * @swagger
 * /api/reviews/customer/{customerId}:
 *   get:
 *     summary: Get all reviews by a customer
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of reviews by the customer
 *       404:
 *         description: Customer not found
 */
router.get("/customer/:customerId", getCustomerReviews);

/**
 * @swagger
 * /api/reviews/stats/service/{serviceId}:
 *   get:
 *     summary: Get service rating statistics
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Rating statistics for the service
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageRating:
 *                   type: number
 *                 totalReviews:
 *                   type: integer
 *                 ratingDistribution:
 *                   type: object
 *                   properties:
 *                     1:
 *                       type: integer
 *                     2:
 *                       type: integer
 *                     3:
 *                       type: integer
 *                     4:
 *                       type: integer
 *                     5:
 *                       type: integer
 *       404:
 *         description: Service not found
 */
router.get("/stats/service/:serviceId", getServiceRatingStats);

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review
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
 *               - serviceId
 *               - rating
 *               - comment
 *             properties:
 *               serviceId:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               title:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid input or user has already reviewed this service
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a customer)
 *       404:
 *         description: Service not found
 */
router.post("/", protect(["customer"]), isCustomer, createReview);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the review owner)
 *       404:
 *         description: Review not found
 */
router.put("/:reviewId", protect([]), updateReview);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the review owner or admin)
 *       404:
 *         description: Review not found
 */
router.delete("/:reviewId", protect([]), deleteReview);

export default router;
