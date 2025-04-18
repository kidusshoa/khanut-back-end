import { Router } from "express";
import { 
  getBusinessOrders,
  getCustomerOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateShippingInfo
} from "../controllers/orderController";
import { auth } from "../middleware/auth";
import { isBusiness } from "../middleware/isBusiness";
import { isCustomer } from "../middleware/isCustomer";

const router = Router();

// Get all orders for a business (business owner only)
router.get(
  "/business/:businessId", 
  auth, 
  isBusiness, 
  getBusinessOrders
);

// Get all orders for a customer (customer only)
router.get(
  "/customer/:customerId", 
  auth, 
  isCustomer, 
  getCustomerOrders
);

// Get order by ID
router.get("/:orderId", auth, getOrderById);

// Create a new order (customer only)
router.post("/", auth, isCustomer, createOrder);

// Update order status (business owner only)
router.patch(
  "/:orderId/status", 
  auth, 
  isBusiness, 
  updateOrderStatus
);

// Update shipping information (business owner only)
router.patch(
  "/:orderId/shipping", 
  auth, 
  isBusiness, 
  updateShippingInfo
);

export default router;
