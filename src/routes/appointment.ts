import { Router } from "express";
import { 
  getBusinessAppointments,
  getCustomerAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  updateAppointment,
  deleteAppointment,
  getAvailableTimeSlots
} from "../controllers/appointmentController";
import { auth } from "../middleware/auth";
import { isBusiness } from "../middleware/isBusiness";
import { isCustomer } from "../middleware/isCustomer";

const router = Router();

// Get all appointments for a business (business owner only)
router.get(
  "/business/:businessId", 
  auth, 
  isBusiness, 
  getBusinessAppointments
);

// Get all appointments for a customer (customer only)
router.get(
  "/customer/:customerId", 
  auth, 
  isCustomer, 
  getCustomerAppointments
);

// Get appointment by ID
router.get("/:appointmentId", auth, getAppointmentById);

// Create a new appointment (customer only)
router.post("/", auth, isCustomer, createAppointment);

// Update appointment status (business owner only)
router.patch(
  "/:appointmentId/status", 
  auth, 
  isBusiness, 
  updateAppointmentStatus
);

// Update appointment details (both customer and business)
router.put("/:appointmentId", auth, updateAppointment);

// Delete appointment (customer only, and only if pending)
router.delete(
  "/:appointmentId", 
  auth, 
  isCustomer, 
  deleteAppointment
);

// Get available time slots for a service on a specific date
router.get(
  "/available/:serviceId/:date", 
  getAvailableTimeSlots
);

export default router;
