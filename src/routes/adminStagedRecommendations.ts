/**
 * Routes for admin staged recommendations
 */
import express from "express";
import { protect } from "../middleware/auth";
import {
  getAllCustomerPreferences,
  getCustomerPreference,
  updateCustomerPreference,
  getAvailableCategories,
  getAvailableCustomers,
  testCustomerRecommendations
} from "../controllers/adminStagedRecommendationsController";

const router = express.Router();

/**
 * @swagger
 * /api/admin/recommendations/staged:
 *   get:
 *     summary: Get all customer preferences for staged recommendations
 *     tags: [Admin, Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customer preferences
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", protect(["admin"]), getAllCustomerPreferences);

/**
 * @swagger
 * /api/admin/recommendations/staged/categories:
 *   get:
 *     summary: Get all available categories for staged recommendations
 *     tags: [Admin, Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available categories
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/categories", protect(["admin"]), getAvailableCategories);

/**
 * @swagger
 * /api/admin/recommendations/staged/available-customers:
 *   get:
 *     summary: Get all customers without preferences
 *     tags: [Admin, Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available customers
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/available-customers", protect(["admin"]), getAvailableCustomers);

/**
 * @swagger
 * /api/admin/recommendations/staged/{customerId}:
 *   get:
 *     summary: Get customer preference by ID
 *     tags: [Admin, Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer preference
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer preference not found
 *       500:
 *         description: Server error
 */
router.get("/:customerId", protect(["admin"]), getCustomerPreference);

/**
 * @swagger
 * /api/admin/recommendations/staged/{customerId}:
 *   put:
 *     summary: Update customer preference
 *     tags: [Admin, Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - preferredCategories
 *               - description
 *             properties:
 *               preferredCategories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of preferred categories
 *               description:
 *                 type: string
 *                 description: Description of the customer's preferences
 *     responses:
 *       200:
 *         description: Customer preference updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put("/:customerId", protect(["admin"]), updateCustomerPreference);

/**
 * @swagger
 * /api/admin/recommendations/staged/test/{customerId}:
 *   get:
 *     summary: Test recommendations for a customer
 *     tags: [Admin, Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Customer ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of recommendations to return
 *     responses:
 *       200:
 *         description: List of recommended businesses
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer has no staged preferences
 *       500:
 *         description: Server error
 */
router.get("/test/:customerId", protect(["admin"]), testCustomerRecommendations);

export default router;
