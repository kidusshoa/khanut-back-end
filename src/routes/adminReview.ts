import { Router } from "express";
import { isAdmin } from "../middleware/isAdmin";
import {
  getPendingReviews,
  approveReview,
  rejectReview,
} from "../controllers/adminReviewController";

const router = Router();

/**
 * @swagger
 * /api/admin/reviews/pending:
 *   get:
 *     summary: Get all pending reviews (paginated)
 *     tags: [Admin Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default is 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of reviews per page (default is 10)
 *     responses:
 *       200:
 *         description: List of pending reviews
 *       500:
 *         description: Failed to load pending reviews
 */

router.get("/pending", isAdmin, getPendingReviews);

/**
 * @swagger
 * /api/admin/reviews/{id}/approve:
 *   patch:
 *     summary: Approve a review
 *     tags: [Admin Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the review
 *     responses:
 *       200:
 *         description: Review approved
 *       404:
 *         description: Review not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch("/:id/approve", isAdmin, approveReview);

/**
 * @swagger
 * /api/admin/reviews/{id}/reject:
 *   patch:
 *     summary: Reject a review
 *     tags: [Admin Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the review
 *     responses:
 *       200:
 *         description: Review rejected
 *       404:
 *         description: Review not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch("/:id/reject", isAdmin, rejectReview);

export default router;
