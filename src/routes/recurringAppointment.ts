import { Router } from "express";
import {
  createRecurringAppointment,
  getBusinessRecurringAppointments,
  getCustomerRecurringAppointments,
  getRecurringAppointmentById,
  updateRecurringAppointmentStatus,
  deleteRecurringAppointment,
  previewRecurringAppointmentDates,
} from "../controllers/recurringAppointmentController";
import { protect } from "../middleware/auth";
import { isBusiness } from "../middleware/isBusiness";
import { isCustomer } from "../middleware/isCustomer";

const router = Router();

/**
 * @swagger
 * /api/recurring-appointments:
 *   post:
 *     summary: Create a new recurring appointment
 *     tags: [Recurring Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - businessId
 *               - serviceId
 *               - recurrencePattern
 *               - startDate
 *               - startTime
 *               - endTime
 *             properties:
 *               customerId:
 *                 type: string
 *               businessId:
 *                 type: string
 *               serviceId:
 *                 type: string
 *               staffId:
 *                 type: string
 *               recurrencePattern:
 *                 type: string
 *                 enum: [daily, weekly, biweekly, monthly]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               dayOfWeek:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 6
 *               dayOfMonth:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 31
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               notes:
 *                 type: string
 *               occurrences:
 *                 type: number
 *     responses:
 *       201:
 *         description: Recurring appointment created
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Customer, business, service, or staff not found
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  protect(["business", "customer"]),
  createRecurringAppointment
);

/**
 * @swagger
 * /api/recurring-appointments/business/{businessId}:
 *   get:
 *     summary: Get all recurring appointments for a business
 *     tags: [Recurring Appointments]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, paused, completed, cancelled]
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of recurring appointments
 *       500:
 *         description: Server error
 */
router.get("/business/:businessId", getBusinessRecurringAppointments);

/**
 * @swagger
 * /api/recurring-appointments/customer/{customerId}:
 *   get:
 *     summary: Get all recurring appointments for a customer
 *     tags: [Recurring Appointments]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, paused, completed, cancelled]
 *       - in: query
 *         name: businessId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of recurring appointments
 *       500:
 *         description: Server error
 */
router.get("/customer/:customerId", getCustomerRecurringAppointments);

/**
 * @swagger
 * /api/recurring-appointments/{recurringId}:
 *   get:
 *     summary: Get a recurring appointment by ID
 *     tags: [Recurring Appointments]
 *     parameters:
 *       - in: path
 *         name: recurringId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recurring appointment details
 *       404:
 *         description: Recurring appointment not found
 *       500:
 *         description: Server error
 */
router.get("/:recurringId", getRecurringAppointmentById);

/**
 * @swagger
 * /api/recurring-appointments/{recurringId}/status:
 *   patch:
 *     summary: Update recurring appointment status
 *     tags: [Recurring Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recurringId
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, paused, completed, cancelled]
 *     responses:
 *       200:
 *         description: Recurring appointment status updated
 *       400:
 *         description: Invalid status
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Recurring appointment not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/:recurringId/status",
  protect(["business", "customer"]),
  updateRecurringAppointmentStatus
);

/**
 * @swagger
 * /api/recurring-appointments/{recurringId}:
 *   delete:
 *     summary: Delete a recurring appointment
 *     tags: [Recurring Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recurringId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: deleteFutureAppointments
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Recurring appointment deleted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Recurring appointment not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/:recurringId",
  protect(["business", "customer"]),
  deleteRecurringAppointment
);

/**
 * @swagger
 * /api/recurring-appointments/preview:
 *   post:
 *     summary: Preview recurring appointment dates
 *     tags: [Recurring Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recurrencePattern
 *               - startDate
 *             properties:
 *               recurrencePattern:
 *                 type: string
 *                 enum: [daily, weekly, biweekly, monthly]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               dayOfWeek:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 6
 *               dayOfMonth:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 31
 *               occurrences:
 *                 type: number
 *     responses:
 *       200:
 *         description: List of recurring dates
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post("/preview", previewRecurringAppointmentDates);

export default router;
