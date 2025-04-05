import express, { Request } from "express";
import { getCustomerTransactions } from "../controllers/customerTransactionController";
import { isCustomer } from "../middleware/isCustomer";

const router = express.Router();

interface AuthRequest extends Request {
  user: {
    id: string;
  };
}

/**
 * @swagger
 * /api/customer/transactions:
 *   get:
 *     summary: Get customer transaction history with pagination
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Paginated list of customer transactions
 */
router.get("/transactions", isCustomer, (req, res) => {
  return getCustomerTransactions(req as AuthRequest, res);
});

export default router;
