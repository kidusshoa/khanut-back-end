import { Request, Response } from "express";
import { Staff } from "../models/staff";
import { StaffUnavailability } from "../models/staffUnavailability";
import { StaffAssignment } from "../models/staffAssignment";
import { Appointment } from "../models/appointment";
import { Business } from "../models/business";
import mongoose from "mongoose";
import { AuthRequest } from "../types/express";

// Get all staff for a business
export const getBusinessStaff = async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    const { search, isActive } = req.query;

    // Build query
    const query: any = { businessId };

    // Add active filter if provided
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { position: { $regex: search, $options: "i" } },
      ];
    }

    const staff = await Staff.find(query).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: staff.length,
      staff,
    });
  } catch (error) {
    console.error("❌ Get business staff error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get a single staff member
export const getStaffById = async (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;

    const staff = await Staff.findById(staffId);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    return res.status(200).json({
      success: true,
      staff,
    });
  } catch (error) {
    console.error("❌ Get staff by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Create a new staff member
export const createStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { businessId } = req.params;
    const {
      name,
      email,
      phone,
      position,
      specialties,
      bio,
      availability,
      profilePicture,
    } = req.body;

    // Verify the business exists
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Verify the user is the business owner
    if (business.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add staff to this business",
      });
    }

    // Check if staff with the same email already exists for this business
    const existingStaff = await Staff.findOne({ businessId, email });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: "Staff with this email already exists for this business",
      });
    }

    // Create new staff member
    const newStaff = new Staff({
      name,
      email,
      phone,
      position,
      businessId,
      specialties,
      bio,
      availability,
      profilePicture,
      isActive: true,
    });

    await newStaff.save();

    return res.status(201).json({
      success: true,
      staff: newStaff,
    });
  } catch (error) {
    console.error("❌ Create staff error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update a staff member
export const updateStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { staffId } = req.params;
    const updateData = req.body;

    // Find the staff member
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // Verify the user is the business owner
    const business = await Business.findById(staff.businessId);
    if (!business || business.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this staff member",
      });
    }

    // If email is being updated, check for duplicates
    if (updateData.email && updateData.email !== staff.email) {
      const existingStaff = await Staff.findOne({
        businessId: staff.businessId,
        email: updateData.email,
        _id: { $ne: staffId },
      });

      if (existingStaff) {
        return res.status(400).json({
          success: false,
          message: "Staff with this email already exists for this business",
        });
      }
    }

    // Update the staff member
    const updatedStaff = await Staff.findByIdAndUpdate(staffId, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      staff: updatedStaff,
    });
  } catch (error) {
    console.error("❌ Update staff error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete a staff member
export const deleteStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { staffId } = req.params;

    // Find the staff member
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // Verify the user is the business owner
    const business = await Business.findById(staff.businessId);
    if (!business || business.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this staff member",
      });
    }

    // Check if staff has any upcoming appointments
    const upcomingAppointments = await Appointment.find({
      staffId,
      date: { $gte: new Date() },
      status: { $in: ["pending", "confirmed"] },
    });

    if (upcomingAppointments.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete staff member with upcoming appointments. Please reassign or cancel the appointments first.",
      });
    }

    // Delete staff unavailability records
    await StaffUnavailability.deleteMany({ staffId });

    // Delete staff assignments
    await StaffAssignment.deleteMany({ staffId });

    // Delete the staff member
    await Staff.findByIdAndDelete(staffId);

    return res.status(200).json({
      success: true,
      message: "Staff member deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete staff error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get staff availability for a specific date
export const getStaffAvailability = async (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    // Find the staff member
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // Parse the date
    const requestedDate = new Date(date as string);
    const dayOfWeek = requestedDate.getDay();
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayName = dayNames[dayOfWeek];

    // Check if staff works on this day
    if (
      !staff.availability ||
      !staff.availability.days.includes(dayName)
    ) {
      return res.status(200).json({
        success: true,
        available: false,
        message: "Staff does not work on this day",
        timeSlots: [],
      });
    }

    // Check if staff has any unavailability for this date
    const unavailability = await StaffUnavailability.findOne({
      staffId,
      startDate: { $lte: requestedDate },
      endDate: { $gte: requestedDate },
    });

    if (unavailability) {
      return res.status(200).json({
        success: true,
        available: false,
        message: "Staff is unavailable on this date",
        reason: unavailability.reason,
        timeSlots: [],
      });
    }

    // Get staff's working hours
    const { startTime, endTime } = staff.availability;

    // Generate time slots (30-minute intervals)
    const timeSlots = generateTimeSlots(startTime, endTime);

    // Get staff's appointments for this date
    const appointments = await Appointment.find({
      staffId,
      date: {
        $gte: new Date(requestedDate.setHours(0, 0, 0, 0)),
        $lte: new Date(requestedDate.setHours(23, 59, 59, 999)),
      },
      status: { $in: ["pending", "confirmed"] },
    });

    // Mark booked time slots
    appointments.forEach((appointment) => {
      timeSlots.forEach((slot) => {
        if (
          slot.startTime >= appointment.startTime &&
          slot.endTime <= appointment.endTime
        ) {
          slot.isAvailable = false;
        }
      });
    });

    return res.status(200).json({
      success: true,
      available: true,
      date: requestedDate,
      timeSlots,
    });
  } catch (error) {
    console.error("❌ Get staff availability error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Set staff unavailable dates
export const setStaffUnavailableDates = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate, reason } = req.body;

    // Validate input
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    // Find the staff member
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // Verify the user is the business owner
    const business = await Business.findById(staff.businessId);
    if (!business || business.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this staff member's availability",
      });
    }

    // Parse dates
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    // Check if there are any appointments during this period
    const conflictingAppointments = await Appointment.find({
      staffId,
      date: {
        $gte: new Date(parsedStartDate.setHours(0, 0, 0, 0)),
        $lte: new Date(parsedEndDate.setHours(23, 59, 59, 999)),
      },
      status: { $in: ["pending", "confirmed"] },
    });

    if (conflictingAppointments.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot set staff as unavailable during this period as there are existing appointments. Please reschedule or cancel the appointments first.",
        appointments: conflictingAppointments,
      });
    }

    // Create new unavailability record
    const newUnavailability = new StaffUnavailability({
      staffId,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      reason,
    });

    await newUnavailability.save();

    return res.status(201).json({
      success: true,
      unavailability: newUnavailability,
    });
  } catch (error) {
    console.error("❌ Set staff unavailable dates error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get staff unavailable dates
export const getStaffUnavailableDates = async (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate } = req.query;

    // Find the staff member
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // Build query
    const query: any = { staffId };

    // Add date range filter if provided
    if (startDate && endDate) {
      query.startDate = { $lte: new Date(endDate as string) };
      query.endDate = { $gte: new Date(startDate as string) };
    }

    const unavailableDates = await StaffUnavailability.find(query).sort({
      startDate: 1,
    });

    return res.status(200).json({
      success: true,
      count: unavailableDates.length,
      unavailableDates,
    });
  } catch (error) {
    console.error("❌ Get staff unavailable dates error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete staff unavailable dates
export const deleteStaffUnavailableDates = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { unavailabilityId } = req.params;

    // Find the unavailability record
    const unavailability = await StaffUnavailability.findById(unavailabilityId);
    if (!unavailability) {
      return res.status(404).json({
        success: false,
        message: "Unavailability record not found",
      });
    }

    // Find the staff member
    const staff = await Staff.findById(unavailability.staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // Verify the user is the business owner
    const business = await Business.findById(staff.businessId);
    if (!business || business.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this staff member's availability",
      });
    }

    // Delete the unavailability record
    await StaffUnavailability.findByIdAndDelete(unavailabilityId);

    return res.status(200).json({
      success: true,
      message: "Unavailability record deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete staff unavailable dates error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Assign staff to appointment
export const assignStaffToAppointment = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { appointmentId } = req.params;
    const { staffId, notes } = req.body;

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Verify the user is the business owner
    const business = await Business.findById(appointment.businessId);
    if (!business || business.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to assign staff to this appointment",
      });
    }

    // Find the staff member
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // Verify staff belongs to the same business
    if (staff.businessId.toString() !== appointment.businessId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Staff does not belong to the business of this appointment",
      });
    }

    // Check if staff is available on the appointment date
    const appointmentDate = new Date(appointment.date);
    const dayOfWeek = appointmentDate.getDay();
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayName = dayNames[dayOfWeek];

    // Check if staff works on this day
    if (
      !staff.availability ||
      !staff.availability.days.includes(dayName)
    ) {
      return res.status(400).json({
        success: false,
        message: "Staff does not work on this day",
      });
    }

    // Check if staff has any unavailability for this date
    const unavailability = await StaffUnavailability.findOne({
      staffId,
      startDate: { $lte: appointmentDate },
      endDate: { $gte: appointmentDate },
    });

    if (unavailability) {
      return res.status(400).json({
        success: false,
        message: "Staff is unavailable on this date",
        reason: unavailability.reason,
      });
    }

    // Check if staff has any conflicting appointments
    const conflictingAppointments = await Appointment.find({
      staffId,
      date: {
        $gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
        $lte: new Date(appointmentDate.setHours(23, 59, 59, 999)),
      },
      status: { $in: ["pending", "confirmed"] },
      $or: [
        {
          startTime: { $lt: appointment.endTime },
          endTime: { $gt: appointment.startTime },
        },
      ],
    });

    if (conflictingAppointments.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Staff has conflicting appointments during this time",
        conflictingAppointments,
      });
    }

    // Check if there's an existing assignment
    const existingAssignment = await StaffAssignment.findOne({
      appointmentId,
    });

    if (existingAssignment) {
      // Update existing assignment
      existingAssignment.staffId = new mongoose.Types.ObjectId(staffId);
      existingAssignment.status = "assigned";
      existingAssignment.notes = notes;
      await existingAssignment.save();

      // Update appointment
      appointment.staffId = new mongoose.Types.ObjectId(staffId);
      await appointment.save();

      return res.status(200).json({
        success: true,
        message: "Staff reassigned to appointment successfully",
        assignment: existingAssignment,
      });
    } else {
      // Create new assignment
      const newAssignment = new StaffAssignment({
        staffId,
        appointmentId,
        status: "assigned",
        notes,
      });

      await newAssignment.save();

      // Update appointment
      appointment.staffId = new mongoose.Types.ObjectId(staffId);
      await appointment.save();

      return res.status(201).json({
        success: true,
        message: "Staff assigned to appointment successfully",
        assignment: newAssignment,
      });
    }
  } catch (error) {
    console.error("❌ Assign staff to appointment error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update staff assignment status
export const updateStaffAssignmentStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { assignmentId } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ["assigned", "confirmed", "declined", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Find the assignment
    const assignment = await StaffAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Find the staff member
    const staff = await Staff.findById(assignment.staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // Verify the user is the business owner
    const business = await Business.findById(staff.businessId);
    if (!business || business.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this assignment",
      });
    }

    // Update the assignment
    assignment.status = status;
    if (notes) {
      assignment.notes = notes;
    }
    await assignment.save();

    // If status is declined, remove staff from appointment
    if (status === "declined") {
      await Appointment.findByIdAndUpdate(assignment.appointmentId, {
        $unset: { staffId: 1 },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assignment status updated successfully",
      assignment,
    });
  } catch (error) {
    console.error("❌ Update staff assignment status error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Helper function to generate time slots
function generateTimeSlots(startTime: string, endTime: string) {
  const timeSlots = [];
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  let currentHour = startHour;
  let currentMinute = startMinute;

  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMinute < endMinute)
  ) {
    const nextMinute = (currentMinute + 30) % 60;
    const nextHour =
      currentMinute + 30 >= 60
        ? (currentHour + 1) % 24
        : currentHour;

    const slotStartTime = `${currentHour.toString().padStart(2, "0")}:${currentMinute
      .toString()
      .padStart(2, "0")}`;
    const slotEndTime = `${nextHour.toString().padStart(2, "0")}:${nextMinute
      .toString()
      .padStart(2, "0")}`;

    timeSlots.push({
      startTime: slotStartTime,
      endTime: slotEndTime,
      isAvailable: true,
    });

    currentHour = nextHour;
    currentMinute = nextMinute;
  }

  return timeSlots;
}
