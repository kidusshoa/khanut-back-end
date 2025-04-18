import { Router } from "express";
import {
  getAllServices,
  getBusinessServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServicesByType,
} from "../controllers/serviceController";
import { protect } from "../middleware/auth";
import { isBusiness } from "../middleware/isBusiness";
import { upload } from "../middleware/upload";

const router = Router();

// Get all services
router.get("/", getAllServices);

// Get all services for a business
router.get("/business/:businessId", getBusinessServices);

// Get service by ID
router.get("/:serviceId", getServiceById);

// Get services by type for a business
router.get("/business/:businessId/type/:type", getServicesByType);

// Create a new service (business owner only)
router.post(
  "/",
  protect(["business"]),
  isBusiness,
  upload.array("images", 5),
  createService
);

// Update a service (business owner only)
router.put(
  "/:serviceId",
  protect(["business"]),
  isBusiness,
  upload.array("images", 5),
  updateService
);

// Delete a service (business owner only)
router.delete("/:serviceId", protect(["business"]), isBusiness, deleteService);

export default router;
