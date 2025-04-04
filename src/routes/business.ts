import express from "express";
import { getBusinessDetail } from "../controllers/businessDetailController";

const router = express.Router();

/**
 * @swagger
 * /api/businesses/{id}:
 *   get:
 *     summary: Get detailed info of a business
 *     tags: [Business]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB ObjectId of the business
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business detail with profile, services, reviews, and location
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     city:
 *                       type: string
 *                 description:
 *                   type: string
 *                 location:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     coordinates:
 *                       type: array
 *                       items:
 *                         type: number
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Business not found
 *       500:
 *         description: Failed to load business detail
 */
router.get("/:id", getBusinessDetail);

export default router;
