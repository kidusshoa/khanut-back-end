import { Router } from "express";
import {
  initializeOrderPayment,
  initializeAppointmentPayment,
  verifyPaymentStatus,
  chapaWebhook,
  handlePaymentCallback,
  getOrderPaymentStatus,
  getCustomerPayments,
  getBusinessPayments,
} from "../controllers/paymentController";
import { protect } from "../middleware/auth";
import { isBusiness } from "../middleware/isBusiness";
import { isCustomer } from "../middleware/isCustomer";

const router = Router();

/**
 * @swagger
 * /api/payments/order/{orderId}/initialize:
 *   post:
 *     summary: Initialize payment for an order
 *     tags: [Payments]
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
 *         description: Payment initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentId:
 *                   type: string
 *                 checkoutUrl:
 *                   type: string
 *                   description: URL to redirect the user for payment
 *                 txRef:
 *                   type: string
 *                   description: Transaction reference
 *       400:
 *         description: Invalid order or order already paid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the customer who placed the order)
 *       404:
 *         description: Order not found
 *       500:
 *         description: Payment initialization failed
 */
router.post(
  "/order/:orderId/initialize",
  protect(["customer"]),
  isCustomer,
  initializeOrderPayment
);

/**
 * @swagger
 * /api/payments/appointment/{appointmentId}/initialize:
 *   post:
 *     summary: Initialize payment for an appointment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentId:
 *                   type: string
 *                 checkoutUrl:
 *                   type: string
 *                   description: URL to redirect the user for payment
 *                 txRef:
 *                   type: string
 *                   description: Transaction reference
 *       400:
 *         description: Invalid appointment or appointment already paid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the customer who booked the appointment)
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Payment initialization failed
 */
router.post(
  "/appointment/:appointmentId/initialize",
  protect(["customer"]),
  isCustomer,
  initializeAppointmentPayment
);

/**
 * @swagger
 * /api/payments/verify/{transactionRef}:
 *   get:
 *     summary: Verify payment status
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: transactionRef
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction reference
 *     responses:
 *       200:
 *         description: Payment verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 payment:
 *                   type: object
 *                 paymentDetails:
 *                   type: object
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Verification failed
 */
router.get("/verify/:transactionRef", verifyPaymentStatus);

/**
 * @swagger
 * /api/payments/callback:
 *   get:
 *     summary: Handle payment callback from Chapa
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: tx_ref
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction reference
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Payment status
 *     responses:
 *       302:
 *         description: Redirects to the appropriate page based on payment status
 *       400:
 *         description: Missing transaction reference
 *       500:
 *         description: Callback processing failed
 */
router.get("/callback", handlePaymentCallback);

/**
 * @swagger
 * /api/payments/order/{orderId}/status:
 *   get:
 *     summary: Get payment status for an order
 *     tags: [Payments]
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
 *         description: Payment status for the order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 paymentStatus:
 *                   type: string
 *                   enum: [not_initiated, pending, completed, failed, cancelled]
 *                 orderStatus:
 *                   type: string
 *                 transactionRef:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the customer who placed the order)
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get(
  "/order/:orderId/status",
  protect(["customer"]),
  isCustomer,
  getOrderPaymentStatus
);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Chapa payment webhook handler
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook payload
 *       500:
 *         description: Webhook processing failed
 */
router.post("/webhook", chapaWebhook);

/**
 * @swagger
 * /api/payments/customer/{customerId}:
 *   get:
 *     summary: Get payment history for a customer
 *     tags: [Payments]
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
 *           enum: [pending, completed, failed, refunded, cancelled]
 *         description: Filter payments by status
 *     responses:
 *       200:
 *         description: List of payments for the customer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the customer)
 */
router.get(
  "/customer/:customerId",
  protect(["customer"]),
  isCustomer,
  getCustomerPayments
);

/**
 * @swagger
 * /api/payments/business/{businessId}:
 *   get:
 *     summary: Get payment history for a business
 *     tags: [Payments]
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
 *           enum: [pending, completed, failed, refunded, cancelled]
 *         description: Filter payments by status
 *     responses:
 *       200:
 *         description: List of payments for the business
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the business owner)
 */
router.get(
  "/business/:businessId",
  protect(["business"]),
  isBusiness,
  getBusinessPayments
);

export default router;
