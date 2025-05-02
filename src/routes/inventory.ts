import { Router } from "express";
import {
  getBusinessInventory,
  updateProductStock,
  batchUpdateStock,
  getStockHistory
} from "../controllers/inventoryController";
import { protect } from "../middleware/auth";
import { isBusiness } from "../middleware/isBusiness";

const router = Router();

/**
 * @swagger
 * /api/inventory/business/{businessId}:
 *   get:
 *     summary: Get inventory for a business
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product name or description
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filter for low stock products
 *     responses:
 *       200:
 *         description: List of products in inventory
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the business owner)
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.get(
  "/business/:businessId",
  protect(["business"]),
  isBusiness,
  getBusinessInventory
);

/**
 * @swagger
 * /api/inventory/product/{productId}:
 *   patch:
 *     summary: Update product stock
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stock
 *             properties:
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product stock updated successfully
 *       400:
 *         description: Invalid input or service is not a product
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the business owner)
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/product/:productId",
  protect(["business"]),
  isBusiness,
  updateProductStock
);

/**
 * @swagger
 * /api/inventory/business/{businessId}/batch:
 *   post:
 *     summary: Batch update product stock
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - products
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - stock
 *                   properties:
 *                     productId:
 *                       type: string
 *                     stock:
 *                       type: integer
 *                       minimum: 0
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product stock updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the business owner)
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.post(
  "/business/:businessId/batch",
  protect(["business"]),
  isBusiness,
  batchUpdateStock
);

/**
 * @swagger
 * /api/inventory/product/{productId}/history:
 *   get:
 *     summary: Get stock history for a product
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Stock history for the product
 *       400:
 *         description: Service is not a product
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the business owner)
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.get(
  "/product/:productId/history",
  protect(["business"]),
  isBusiness,
  getStockHistory
);

export default router;
