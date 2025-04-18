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

// Get all orders for a business (business owner only)
router.get(
  "/business/:businessId",
  protect(["business"]),
  isBusiness,
  getBusinessOrders
);

// Get all orders for a customer (customer only)
router.get(
  "/customer/:customerId",
  protect(["customer"]),
  isCustomer,
  getCustomerOrders
);

// Get order by ID
router.get("/:orderId", protect([]), getOrderById);

// Create a new order (customer only)
router.post("/", protect(["customer"]), isCustomer, createOrder);

// Update order status (business owner only)
router.patch(
  "/:orderId/status",
  protect(["business"]),
  isBusiness,
  updateOrderStatus
);

// Update shipping information (business owner only)
router.patch(
  "/:orderId/shipping",
  protect(["business"]),
  isBusiness,
  updateShippingInfo
);

export default router;
