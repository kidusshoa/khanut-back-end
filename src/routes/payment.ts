import { Router } from "express";
import {
  initializeOrderPayment,
  initializeAppointmentPayment,
  verifyPayment,
  chapaWebhook,
  getCustomerPayments,
  getBusinessPayments,
} from "../controllers/paymentController";
import { protect } from "../middleware/auth";
import { isBusiness } from "../middleware/isBusiness";
import { isCustomer } from "../middleware/isCustomer";

const router = Router();

// Initialize payment for an order
router.post(
  "/order/:orderId/initialize",
  protect(["customer"]),
  isCustomer,
  initializeOrderPayment
);

// Initialize payment for an appointment
router.post(
  "/appointment/:appointmentId/initialize",
  protect(["customer"]),
  isCustomer,
  initializeAppointmentPayment
);

// Verify payment status
router.get("/verify/:txRef", verifyPayment);

// Chapa webhook handler
router.post("/webhook", chapaWebhook);

// Get payment history for a customer
router.get(
  "/customer/:customerId",
  protect(["customer"]),
  isCustomer,
  getCustomerPayments
);

// Get payment history for a business
router.get(
  "/business/:businessId",
  protect(["business"]),
  isBusiness,
  getBusinessPayments
);

export default router;
