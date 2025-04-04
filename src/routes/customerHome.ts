import express, { Request } from "express";
import { isCustomer } from "../middleware/isCustomer";
import {
  getFeaturedBusinesses,
  getTopBusinesses,
  getRecommendedBusinesses,
} from "../controllers/customerHomeController";

interface AuthRequest extends Request {
  user: {
    id: string;
    role: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
}

const router = express.Router();

/**
 * @swagger
 * /api/customer/featured:
 *   get:
 *     summary: Get featured businesses near the customer
 *     tags: [Customer Home]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of nearby featured businesses
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not a customer)
 */
router.get("/featured", isCustomer, (req, res) => {
  return getFeaturedBusinesses(req as AuthRequest, res);
});

/**
 * @swagger
 * /api/customer/top:
 *   get:
 *     summary: Get top businesses across Ethiopia
 *     tags: [Customer Home]
 *     responses:
 *       200:
 *         description: List of top businesses
 */
router.get("/top", getTopBusinesses);

/**
 * @swagger
 * /api/customer/recommended:
 *   get:
 *     summary: Get recommended businesses based on user's past activity
 *     tags: [Customer Home]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recommended businesses
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not a customer)
 */
router.get("/recommended", isCustomer, (req, res) => {
  return getRecommendedBusinesses(req as AuthRequest, res);
});

export default router;
