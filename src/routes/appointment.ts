import { Router } from "express";
import {
  getBusinessAppointments,
  getCustomerAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  updateAppointment,
  deleteAppointment,
  getAvailableTimeSlots,
} from "../controllers/appointmentController";
import { protect } from "../middleware/auth";
import { isBusiness } from "../middleware/isBusiness";
import { isCustomer } from "../middleware/isCustomer";

const router = Router();

/**
 * @swagger
 * /api/appointments/business/{businessId}:
 *   get:
 *     summary: Get all appointments for a business
 *     tags: [Appointments]
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
 *           enum: [pending, confirmed, cancelled, completed]
 *         description: Filter appointments by status
 *     responses:
 *       200:
 *         description: List of appointments for the business
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a business owner)
 */
router.get(
  "/business/:businessId",
  protect(["business"]),
  isBusiness,
  getBusinessAppointments
);

/**
 * @swagger
 * /api/appointments/customer/{customerId}:
 *   get:
 *     summary: Get all appointments for a customer
 *     tags: [Appointments]
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
 *           enum: [pending, confirmed, cancelled, completed]
 *         description: Filter appointments by status
 *     responses:
 *       200:
 *         description: List of appointments for the customer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the customer)
 */
router.get(
  "/customer/:customerId",
  protect(["customer"]),
  isCustomer,
  getCustomerAppointments
);

/**
 * @swagger
 * /api/appointments/{appointmentId}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
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
 *         description: Appointment details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 */
router.get("/:appointmentId", protect([]), getAppointmentById);

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
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
 *               - businessId
 *               - date
 *               - startTime
 *               - endTime
 *             properties:
 *               serviceId:
 *                 type: string
 *               businessId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a customer)
 */
router.post("/", protect(["customer"]), isCustomer, createAppointment);

/**
 * @swagger
 * /api/appointments/{appointmentId}/status:
 *   patch:
 *     summary: Update appointment status
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
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
 *                 enum: [pending, confirmed, cancelled, completed]
 *     responses:
 *       200:
 *         description: Appointment status updated
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the business owner)
 *       404:
 *         description: Appointment not found
 */
router.patch(
  "/:appointmentId/status",
  protect(["business"]),
  isBusiness,
  updateAppointmentStatus
);

/**
 * @swagger
 * /api/appointments/{appointmentId}:
 *   put:
 *     summary: Update appointment details
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 */
router.put("/:appointmentId", protect([]), updateAppointment);

/**
 * @swagger
 * /api/appointments/{appointmentId}:
 *   delete:
 *     summary: Delete an appointment
 *     tags: [Appointments]
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
 *         description: Appointment deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the customer or appointment not in pending status)
 *       404:
 *         description: Appointment not found
 */
router.delete(
  "/:appointmentId",
  protect(["customer"]),
  isCustomer,
  deleteAppointment
);

/**
 * @swagger
 * /api/appointments/available/{serviceId}/{date}:
 *   get:
 *     summary: Get available time slots for a service on a specific date
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: List of available time slots
 *       404:
 *         description: Service not found
 */
router.get("/available/:serviceId/:date", getAvailableTimeSlots);

export default router;
