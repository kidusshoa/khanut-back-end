import express from "express";
import {
  getCartItems,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
} from "../controllers/cartController";
import { protect } from "../middleware/auth";
import { isCustomer } from "../middleware/isCustomer";

const router = express.Router();

/**
 * @swagger
 * /api/customer/cart:
 *   get:
 *     summary: Get cart items for a customer
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       serviceId:
 *                         type: string
 *                       businessId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       quantity:
 *                         type: number
 *                       image:
 *                         type: string
 *                       businessName:
 *                         type: string
 *                 totalAmount:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", protect(["customer"]), isCustomer, getCartItems);

/**
 * @swagger
 * /api/customer/cart:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
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
 *             properties:
 *               serviceId:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 default: 1
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 *       400:
 *         description: Invalid input or not enough inventory
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.post("/", protect(["customer"]), isCustomer, addToCart);

/**
 * @swagger
 * /api/customer/cart/{serviceId}:
 *   patch:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cart updated successfully
 *       400:
 *         description: Invalid input or not enough inventory
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart or item not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/:serviceId",
  protect(["customer"]),
  isCustomer,
  updateCartItemQuantity
);

/**
 * @swagger
 * /api/customer/cart/{serviceId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed from cart successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart or item not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/:serviceId",
  protect(["customer"]),
  isCustomer,
  removeFromCart
);

/**
 * @swagger
 * /api/customer/cart:
 *   delete:
 *     summary: Clear cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete("/", protect(["customer"]), isCustomer, clearCart);

export default router;
