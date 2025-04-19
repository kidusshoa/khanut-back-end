import { Router } from "express";
import {
  getBusinessOrders,
  getCustomerOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateShippingInfo,
} from "../controllers/orderController";
import { protect } from "../middleware/auth";
import { isBusiness } from "../middleware/isBusiness";
import { isCustomer } from "../middleware/isCustomer";

const router = Router();

/**
 * @swagger
 * /api/orders/business/{businessId}:
 *   get:
 *     summary: Get all orders for a business
 *     tags: [Orders]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending_payment, payment_received, processing, shipped, delivered, cancelled, refunded]
 *         description: Filter orders by status
 *     responses:
 *       200:
 *         description: List of orders for the business
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a business owner)
 */
router.get(
  "/business/:businessId",
  protect(["business"]),
  isBusiness,
  getBusinessOrders
);

/**
 * @swagger
 * /api/orders/customer/{customerId}:
 *   get:
 *     summary: Get all orders for a customer
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending_payment, payment_received, processing, shipped, delivered, cancelled, refunded]
 *         description: Filter orders by status
 *     responses:
 *       200:
 *         description: List of orders for the customer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the customer)
 */
router.get(
  "/customer/:customerId",
  protect(["customer"]),
  isCustomer,
  getCustomerOrders
);

/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.get("/:orderId", protect([]), getOrderById);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessId
 *               - items
 *               - totalAmount
 *               - paymentMethod
 *             properties:
 *               businessId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - serviceId
 *                     - quantity
 *                     - price
 *                   properties:
 *                     serviceId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                       minimum: 1
 *                     price:
 *                       type: number
 *               totalAmount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a customer)
 */
router.post("/", protect(["customer"]), isCustomer, createOrder);

/**
 * @swagger
 * /api/orders/{orderId}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending_payment, payment_received, processing, shipped, delivered, cancelled, refunded]
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the business owner)
 *       404:
 *         description: Order not found
 */
router.patch(
  "/:orderId/status",
  protect(["business"]),
  isBusiness,
  updateOrderStatus
);

/**
 * @swagger
 * /api/orders/{orderId}/shipping:
 *   patch:
 *     summary: Update shipping information
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trackingNumber:
 *                 type: string
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       200:
 *         description: Shipping information updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the business owner)
 *       404:
 *         description: Order not found
 */
router.patch(
  "/:orderId/shipping",
  protect(["business"]),
  isBusiness,
  updateShippingInfo
);

export default router;
