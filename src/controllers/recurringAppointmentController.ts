import { Request, Response } from "express";
import { RecurringAppointment } from "../models/recurringAppointment";
import { Appointment } from "../models/appointment";
import { Service } from "../models/service";
import { Business } from "../models/business";
import { User } from "../models/user";
import { Staff } from "../models/staff";
import { AuthRequest } from "../types/express";
import mongoose from "mongoose";
import {
  addDays,
  addWeeks,
  addMonths,
  setDate,
  getDay,
  format,
  parse,
  isAfter,
  isBefore,
  isSameDay,
} from "date-fns";

// Create a recurring appointment
export const createRecurringAppointment = async (
  req: AuthRequest,
  res: Response
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      customerId,
      businessId,
      serviceId,
      staffId,
      recurrencePattern,
      startDate,
      endDate,
      dayOfWeek,
      dayOfMonth,
      startTime,
      endTime,
      notes,
      occurrences,
    } = req.body;

    // Validate required fields
    if (
      !customerId ||
      !businessId ||
      !serviceId ||
      !recurrencePattern ||
      !startDate ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate recurrence pattern
    const validPatterns = ["daily", "weekly", "biweekly", "monthly"];
    if (!validPatterns.includes(recurrencePattern)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recurrence pattern",
      });
    }

    // Validate customer exists
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Validate business exists
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Validate service exists and belongs to the business
    const service = await Service.findOne({
      _id: serviceId,
      businessId,
    });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or does not belong to this business",
      });
    }

    // Validate staff if provided
    if (staffId) {
      const staff = await Staff.findOne({
        _id: staffId,
        businessId,
      });
      if (!staff) {
        return res.status(404).json({
          success: false,
          message: "Staff not found or does not belong to this business",
        });
      }
    }

    // Validate pattern-specific requirements
    if (recurrencePattern === "weekly" || recurrencePattern === "biweekly") {
      if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
        return res.status(400).json({
          success: false,
          message:
            "Day of week is required for weekly and biweekly patterns (0-6)",
        });
      }
    }

    if (recurrencePattern === "monthly") {
      if (dayOfMonth === undefined || dayOfMonth < 1 || dayOfMonth > 31) {
        return res.status(400).json({
          success: false,
          message: "Day of month is required for monthly pattern (1-31)",
        });
      }
    }

    // Determine end date based on occurrences or provided end date
    let calculatedEndDate = endDate ? new Date(endDate) : null;
    if (!calculatedEndDate && occurrences) {
      calculatedEndDate = calculateEndDateFromOccurrences(
        new Date(startDate),
        recurrencePattern,
        occurrences,
        dayOfWeek,
        dayOfMonth
      );
    }

    // Create recurring appointment
    const recurringAppointment = new RecurringAppointment({
      customerId,
      businessId,
      serviceId,
      staffId,
      recurrencePattern,
      startDate,
      endDate: calculatedEndDate,
      dayOfWeek,
      dayOfMonth,
      startTime,
      endTime,
      notes,
      status: "active",
      appointmentIds: [],
    });

    await recurringAppointment.save({ session });

    // Generate individual appointments
    const appointments = await generateAppointments(
      recurringAppointment,
      session
    );

    // Update recurring appointment with appointment IDs
    recurringAppointment.appointmentIds = appointments.map(
      (appointment) => appointment._id
    ) as mongoose.Types.ObjectId[];
    await recurringAppointment.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      recurringAppointment,
      appointments,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("❌ Create recurring appointment error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get recurring appointments for a business
export const getBusinessRecurringAppointments = async (
  req: Request,
  res: Response
) => {
  try {
    const { businessId } = req.params;
    const { status, customerId } = req.query;

    // Build query
    const query: any = { businessId };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add customer filter if provided
    if (customerId) {
      query.customerId = customerId;
    }

    const recurringAppointments = await RecurringAppointment.find(query)
      .populate("customerId", "name email")
      .populate("serviceId", "name price duration")
      .populate("staffId", "name position")
      .sort({ startDate: -1 });

    return res.status(200).json({
      success: true,
      count: recurringAppointments.length,
      recurringAppointments,
    });
  } catch (error) {
    console.error("❌ Get business recurring appointments error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get recurring appointments for a customer
export const getCustomerRecurringAppointments = async (
  req: Request,
  res: Response
) => {
  try {
    const { customerId } = req.params;
    const { status, businessId } = req.query;

    // Build query
    const query: any = { customerId };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add business filter if provided
    if (businessId) {
      query.businessId = businessId;
    }

    const recurringAppointments = await RecurringAppointment.find(query)
      .populate("businessId", "name")
      .populate("serviceId", "name price duration")
      .populate("staffId", "name position")
      .sort({ startDate: -1 });

    return res.status(200).json({
      success: true,
      count: recurringAppointments.length,
      recurringAppointments,
    });
  } catch (error) {
    console.error("❌ Get customer recurring appointments error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get a single recurring appointment
export const getRecurringAppointmentById = async (
  req: Request,
  res: Response
) => {
  try {
    const { recurringId } = req.params;

    const recurringAppointment = await RecurringAppointment.findById(
      recurringId
    )
      .populate("customerId", "name email")
      .populate("businessId", "name")
      .populate("serviceId", "name price duration")
      .populate("staffId", "name position");

    if (!recurringAppointment) {
      return res.status(404).json({
        success: false,
        message: "Recurring appointment not found",
      });
    }

    // Get all individual appointments
    const appointments = await Appointment.find({
      recurringId,
    })
      .populate("customerId", "name email")
      .populate("serviceId", "name price duration")
      .populate("staffId", "name position")
      .sort({ date: 1 });

    return res.status(200).json({
      success: true,
      recurringAppointment,
      appointments,
    });
  } catch (error) {
    console.error("❌ Get recurring appointment by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update recurring appointment status
export const updateRecurringAppointmentStatus = async (
  req: AuthRequest,
  res: Response
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { recurringId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["active", "paused", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Find the recurring appointment
    const recurringAppointment =
      await RecurringAppointment.findById(recurringId);
    if (!recurringAppointment) {
      return res.status(404).json({
        success: false,
        message: "Recurring appointment not found",
      });
    }

    // Check authorization
    if (req.user.role === "business") {
      const business = await Business.findById(recurringAppointment.businessId);
      if (!business || business.ownerId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this recurring appointment",
        });
      }
    } else if (req.user.role === "customer") {
      if (recurringAppointment.customerId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this recurring appointment",
        });
      }
    }

    // Update recurring appointment status
    recurringAppointment.status = status;
    await recurringAppointment.save({ session });

    // Update future individual appointments if cancelled
    if (status === "cancelled") {
      await Appointment.updateMany(
        {
          recurringId,
          date: { $gte: new Date() },
          status: { $in: ["pending", "confirmed"] },
        },
        { status: "cancelled" },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: `Recurring appointment ${status}`,
      recurringAppointment,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("❌ Update recurring appointment status error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete a recurring appointment
export const deleteRecurringAppointment = async (
  req: AuthRequest,
  res: Response
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { recurringId } = req.params;
    const { deleteFutureAppointments } = req.query;

    // Find the recurring appointment
    const recurringAppointment =
      await RecurringAppointment.findById(recurringId);
    if (!recurringAppointment) {
      return res.status(404).json({
        success: false,
        message: "Recurring appointment not found",
      });
    }

    // Check authorization
    if (req.user.role === "business") {
      const business = await Business.findById(recurringAppointment.businessId);
      if (!business || business.ownerId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this recurring appointment",
        });
      }
    } else if (req.user.role === "customer") {
      if (recurringAppointment.customerId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this recurring appointment",
        });
      }
    }

    // Delete future individual appointments if requested
    if (deleteFutureAppointments === "true") {
      await Appointment.deleteMany(
        {
          recurringId,
          date: { $gte: new Date() },
        },
        { session }
      );
    }

    // Delete the recurring appointment
    await RecurringAppointment.findByIdAndDelete(recurringId, { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Recurring appointment deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("❌ Delete recurring appointment error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Preview recurring appointment dates
export const previewRecurringAppointmentDates = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      recurrencePattern,
      startDate,
      endDate,
      dayOfWeek,
      dayOfMonth,
      occurrences,
    } = req.body;

    // Validate required fields
    if (!recurrencePattern || !startDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate recurrence pattern
    const validPatterns = ["daily", "weekly", "biweekly", "monthly"];
    if (!validPatterns.includes(recurrencePattern)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recurrence pattern",
      });
    }

    // Validate pattern-specific requirements
    if (recurrencePattern === "weekly" || recurrencePattern === "biweekly") {
      if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
        return res.status(400).json({
          success: false,
          message:
            "Day of week is required for weekly and biweekly patterns (0-6)",
        });
      }
    }

    if (recurrencePattern === "monthly") {
      if (dayOfMonth === undefined || dayOfMonth < 1 || dayOfMonth > 31) {
        return res.status(400).json({
          success: false,
          message: "Day of month is required for monthly pattern (1-31)",
        });
      }
    }

    // Determine end date based on occurrences or provided end date
    let calculatedEndDate = endDate ? new Date(endDate) : null;
    if (!calculatedEndDate && occurrences) {
      calculatedEndDate = calculateEndDateFromOccurrences(
        new Date(startDate),
        recurrencePattern,
        occurrences,
        dayOfWeek,
        dayOfMonth
      );
    }

    // Generate dates
    const dates = generateRecurringDates(
      new Date(startDate),
      calculatedEndDate,
      recurrencePattern,
      dayOfWeek,
      dayOfMonth,
      occurrences
    );

    return res.status(200).json({
      success: true,
      count: dates.length,
      dates,
    });
  } catch (error) {
    console.error("❌ Preview recurring appointment dates error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Helper function to generate individual appointments
async function generateAppointments(
  recurringAppointment: any,
  session: mongoose.ClientSession
) {
  const {
    customerId,
    businessId,
    serviceId,
    staffId,
    recurrencePattern,
    startDate,
    endDate,
    dayOfWeek,
    dayOfMonth,
    startTime,
    endTime,
    notes,
  } = recurringAppointment;

  // Generate dates
  const dates = generateRecurringDates(
    new Date(startDate),
    endDate ? new Date(endDate) : null,
    recurrencePattern,
    dayOfWeek,
    dayOfMonth
  );

  // Create appointments
  const appointments = [];
  for (const date of dates) {
    const appointment = new Appointment({
      serviceId,
      businessId,
      customerId,
      staffId,
      date,
      startTime,
      endTime,
      status: "pending",
      notes,
      isRecurring: true,
      recurringId: recurringAppointment._id,
    });

    await appointment.save({ session });
    appointments.push(appointment);
  }

  return appointments;
}

// Helper function to generate recurring dates
function generateRecurringDates(
  startDate: Date,
  endDate: Date | null,
  recurrencePattern: string,
  dayOfWeek?: number,
  dayOfMonth?: number,
  maxOccurrences?: number
) {
  const dates = [];
  let currentDate = new Date(startDate);
  let occurrences = 0;
  const maxDate = endDate || addMonths(new Date(), 12); // Default to 1 year if no end date

  // Adjust start date for weekly and monthly patterns
  if (recurrencePattern === "weekly" || recurrencePattern === "biweekly") {
    if (dayOfWeek !== undefined && getDay(currentDate) !== dayOfWeek) {
      // Find the next occurrence of the specified day of week
      while (getDay(currentDate) !== dayOfWeek) {
        currentDate = addDays(currentDate, 1);
      }
    }
  } else if (recurrencePattern === "monthly" && dayOfMonth !== undefined) {
    // Set to the specified day of month
    currentDate = setDate(currentDate, dayOfMonth);

    // If the resulting date is before the start date, move to next month
    if (isBefore(currentDate, startDate)) {
      currentDate = addMonths(currentDate, 1);
    }
  }

  // Generate dates
  while (
    (endDate === null ||
      isBefore(currentDate, maxDate) ||
      isSameDay(currentDate, maxDate)) &&
    (maxOccurrences === undefined || occurrences < maxOccurrences)
  ) {
    dates.push(new Date(currentDate));
    occurrences++;

    // Calculate next date based on pattern
    switch (recurrencePattern) {
      case "daily":
        currentDate = addDays(currentDate, 1);
        break;
      case "weekly":
        currentDate = addWeeks(currentDate, 1);
        break;
      case "biweekly":
        currentDate = addWeeks(currentDate, 2);
        break;
      case "monthly":
        currentDate = addMonths(currentDate, 1);
        break;
    }
  }

  return dates;
}

// Helper function to calculate end date from occurrences
function calculateEndDateFromOccurrences(
  startDate: Date,
  recurrencePattern: string,
  occurrences: number,
  dayOfWeek?: number,
  dayOfMonth?: number
) {
  let currentDate = new Date(startDate);

  // Adjust start date for weekly and monthly patterns
  if (recurrencePattern === "weekly" || recurrencePattern === "biweekly") {
    if (dayOfWeek !== undefined && getDay(currentDate) !== dayOfWeek) {
      // Find the next occurrence of the specified day of week
      while (getDay(currentDate) !== dayOfWeek) {
        currentDate = addDays(currentDate, 1);
      }
    }
  } else if (recurrencePattern === "monthly" && dayOfMonth !== undefined) {
    // Set to the specified day of month
    currentDate = setDate(currentDate, dayOfMonth);

    // If the resulting date is before the start date, move to next month
    if (isBefore(currentDate, startDate)) {
      currentDate = addMonths(currentDate, 1);
    }
  }

  // Calculate end date
  for (let i = 1; i < occurrences; i++) {
    switch (recurrencePattern) {
      case "daily":
        currentDate = addDays(currentDate, 1);
        break;
      case "weekly":
        currentDate = addWeeks(currentDate, 1);
        break;
      case "biweekly":
        currentDate = addWeeks(currentDate, 2);
        break;
      case "monthly":
        currentDate = addMonths(currentDate, 1);
        break;
    }
  }

  return currentDate;
}
