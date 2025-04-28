import express, { Response } from "express";
import { getBusinessStatus } from "../controllers/businessStatusController";
import { isBusiness } from "../middleware/isBusiness";
import { AuthRequest } from "../types/express";
import { RequestHandler } from "express";

const router = express.Router();

const typedHandler = (
  fn: (req: AuthRequest, res: Response) => Promise<Response>
) => {
  return (async (req, res) => fn(req as AuthRequest, res)) as RequestHandler;
};

/**
 * @swagger
 * /api/business/status:
 *   get:
 *     summary: Get the status of the business owned by the authenticated user
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business status retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.get("/status", isBusiness, typedHandler(getBusinessStatus));

export default router;
