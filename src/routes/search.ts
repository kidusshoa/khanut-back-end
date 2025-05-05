import express from "express";
import {
  searchBusinesses,
  searchByDescription,
  searchByServices,
  advancedSearch,
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

/**
 * @swagger
 * /api/search/advanced:
 *   get:
 *     summary: Advanced search across businesses and services
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         description: Search term
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
 *         name: serviceTypes
 *         required: false
 *         description: Filter by service types (appointment, product, in_person)
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [appointment, product, in_person]
 *       - in: query
 *         name: serviceType
 *         required: false
 *         description: Filter services by type
 *         schema:
 *           type: string
 *           enum: [appointment, product, in_person]
 *       - in: query
 *         name: minRating
 *         required: false
 *         description: Minimum rating
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxRating
 *         required: false
 *         description: Maximum rating
 *         schema:
 *           type: number
 *       - in: query
 *         name: minPrice
 *         required: false
 *         description: Minimum price (for services)
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         required: false
 *         description: Maximum price (for services)
 *         schema:
 *           type: number
 *       - in: query
 *         name: sortBy
 *         required: false
 *         description: Sort results by field
 *         schema:
 *           type: string
 *           enum: [rating, name, price, createdAt, location]
 *       - in: query
 *         name: order
 *         required: false
 *         description: Sort order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
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
 *         description: Combined search results
 */
router.get("/advanced", advancedSearch);

export default router;
