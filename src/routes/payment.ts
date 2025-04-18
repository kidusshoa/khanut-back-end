import { Router } from "express";
import { 
  initializeOrderPayment,
  initializeAppointmentPayment,
  verifyPayment,
  chapaWebhook,
  getCustomerPayments,
  getBusinessPayments
} from "../controllers/paymentController";
import { auth } from "../middleware/auth";
import { isBusiness } from "../middleware/isBusiness";
import { isCustomer } from "../middleware/isCustomer";

const router = Router();

// Initialize payment for an order
router.post(
  "/order/:orderId/initialize", 
  auth, 
  isCustomer, 
  initializeOrderPayment
);

// Initialize payment for an appointment
router.post(
  "/appointment/:appointmentId/initialize", 
  auth, 
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
  auth, 
  isCustomer, 
  getCustomerPayments
);

// Get payment history for a business
router.get(
  "/business/:businessId", 
  auth, 
  isBusiness, 
  getBusinessPayments
);

export default router;
