import express from "express";
import {
  searchBusinesses,
  searchByDescription,
  searchByServices,
} from "../controllers/searchController";

const router = express.Router();

/**
 * @swagger
 * /api/search/business:
 *   get:
 *     summary: Search businesses by name
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         description: Business name
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         required: false
 *         description: Filter by city
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         required: false
 *         description: Filter by business category
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         required: false
 *         description: Sort results by "rating" or "location"
 *         schema:
 *           type: string
 *           enum: [rating, location]
 *       - in: query
 *         name: lat
 *         required: false
 *         description: Latitude (required if sort=location)
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: false
 *         description: Longitude (required if sort=location)
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of matching businesses
 */
router.get("/business", searchBusinesses);

/**
 * @swagger
 * /api/search/description:
 *   get:
 *     summary: Search businesses by description
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         description: Description keyword
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         required: false
 *         description: Sort results by "rating" or "location"
 *         schema:
 *           type: string
 *           enum: [rating, location]
 *       - in: query
 *         name: lat
 *         required: false
 *         description: Latitude (required if sort=location)
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: false
 *         description: Longitude (required if sort=location)
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of matching businesses
 */
router.get("/description", searchByDescription);

/**
 * @swagger
 * /api/search/services:
 *   get:
 *     summary: Search businesses by their services
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         description: Service keyword
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         required: false
 *         description: Sort results by "rating" or "location"
 *         schema:
 *           type: string
 *           enum: [rating, location]
 *       - in: query
 *         name: lat
 *         required: false
 *         description: Latitude (required if sort=location)
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: false
 *         description: Longitude (required if sort=location)
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of businesses offering matching services
 */
router.get("/services", searchByServices);

export default router;
