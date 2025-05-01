import { Router } from "express";
import {
  getBusinessStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffAvailability,
  setStaffUnavailableDates,
  getStaffUnavailableDates,
  deleteStaffUnavailableDates,
  assignStaffToAppointment,
  updateStaffAssignmentStatus,
} from "../controllers/staffController";
import { protect } from "../middleware/auth";
import { isBusiness } from "../middleware/isBusiness";

const router = Router();

/**
 * @swagger
 * /api/staff/business/{businessId}:
 *   get:
 *     summary: Get all staff for a business
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of staff members
 *       500:
 *         description: Server error
 */
router.get("/business/:businessId", getBusinessStaff);

/**
 * @swagger
 * /api/staff/{staffId}:
 *   get:
 *     summary: Get a staff member by ID
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff member details
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Server error
 */
router.get("/:staffId", getStaffById);

/**
 * @swagger
 * /api/staff/business/{businessId}:
 *   post:
 *     summary: Create a new staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
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
 *               - name
 *               - email
 *               - position
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               position:
 *                 type: string
 *               specialties:
 *                 type: array
 *                 items:
 *                   type: string
 *               bio:
 *                 type: string
 *               availability:
 *                 type: object
 *                 properties:
 *                   days:
 *                     type: array
 *                     items:
 *                       type: string
 *                   startTime:
 *                     type: string
 *                   endTime:
 *                     type: string
 *                   breakStart:
 *                     type: string
 *                   breakEnd:
 *                     type: string
 *               profilePicture:
 *                 type: string
 *     responses:
 *       201:
 *         description: Staff member created
 *       400:
 *         description: Invalid input or staff with email already exists
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.post(
  "/business/:businessId",
  protect(["business"]),
  isBusiness,
  createStaff
);

/**
 * @swagger
 * /api/staff/{staffId}:
 *   put:
 *     summary: Update a staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               position:
 *                 type: string
 *               specialties:
 *                 type: array
 *                 items:
 *                   type: string
 *               bio:
 *                 type: string
 *               availability:
 *                 type: object
 *                 properties:
 *                   days:
 *                     type: array
 *                     items:
 *                       type: string
 *                   startTime:
 *                     type: string
 *                   endTime:
 *                     type: string
 *                   breakStart:
 *                     type: string
 *                   breakEnd:
 *                     type: string
 *               profilePicture:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Staff member updated
 *       400:
 *         description: Invalid input or staff with email already exists
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Server error
 */
router.put("/:staffId", protect(["business"]), isBusiness, updateStaff);

/**
 * @swagger
 * /api/staff/{staffId}:
 *   delete:
 *     summary: Delete a staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff member deleted
 *       400:
 *         description: Cannot delete staff with upcoming appointments
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Server error
 */
router.delete("/:staffId", protect(["business"]), isBusiness, deleteStaff);

/**
 * @swagger
 * /api/staff/{staffId}/availability:
 *   get:
 *     summary: Get staff availability for a specific date
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Staff availability
 *       400:
 *         description: Date is required
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Server error
 */
router.get("/:staffId/availability", getStaffAvailability);

/**
 * @swagger
 * /api/staff/{staffId}/unavailable:
 *   post:
 *     summary: Set staff unavailable dates
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
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
 *               - startDate
 *               - endDate
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Unavailability record created
 *       400:
 *         description: Invalid input or conflicting appointments
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Server error
 */
router.post(
  "/:staffId/unavailable",
  protect(["business"]),
  isBusiness,
  setStaffUnavailableDates
);

/**
 * @swagger
 * /api/staff/{staffId}/unavailable:
 *   get:
 *     summary: Get staff unavailable dates
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Staff unavailable dates
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Server error
 */
router.get("/:staffId/unavailable", getStaffUnavailableDates);

/**
 * @swagger
 * /api/staff/unavailable/{unavailabilityId}:
 *   delete:
 *     summary: Delete staff unavailable dates
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unavailabilityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unavailability record deleted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Unavailability record not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/unavailable/:unavailabilityId",
  protect(["business"]),
  isBusiness,
  deleteStaffUnavailableDates
);

/**
 * @swagger
 * /api/staff/appointment/{appointmentId}/assign:
 *   post:
 *     summary: Assign staff to appointment
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
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
 *               - staffId
 *             properties:
 *               staffId:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Staff reassigned to appointment
 *       201:
 *         description: Staff assigned to appointment
 *       400:
 *         description: Invalid input or staff unavailable
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Appointment or staff not found
 *       500:
 *         description: Server error
 */
router.post(
  "/appointment/:appointmentId/assign",
  protect(["business"]),
  isBusiness,
  assignStaffToAppointment
);

/**
 * @swagger
 * /api/staff/assignment/{assignmentId}/status:
 *   patch:
 *     summary: Update staff assignment status
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
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
 *                 enum: [assigned, confirmed, declined, completed]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assignment status updated
 *       400:
 *         description: Invalid status
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Assignment not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/assignment/:assignmentId/status",
  protect(["business"]),
  isBusiness,
  updateStaffAssignmentStatus
);

export default router;
