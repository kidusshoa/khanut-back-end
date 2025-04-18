import { Request, Response } from "express";
import { Appointment, AppointmentStatus } from "../models/appointment";
import { Service } from "../models/service";
import { User } from "../models/user";
import { Business } from "../models/business";
import mongoose from "mongoose";

// Get all appointments for a business
export const getBusinessAppointments = async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    const { status, date } = req.query;
    
    const query: any = { businessId };
    
    // Filter by status if provided
    if (status && ["pending", "confirmed", "cancelled", "completed"].includes(status as string)) {
      query.status = status;
    }
    
    // Filter by date if provided
    if (date) {
      const startDate = new Date(date as string);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date as string);
      endDate.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    const appointments = await Appointment.find(query)
      .populate("serviceId", "name price duration")
      .populate("customerId", "name email")
      .sort({ date: 1, startTime: 1 });
    
    return res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching business appointments:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all appointments for a customer
export const getCustomerAppointments = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { status } = req.query;
    
    const query: any = { customerId };
    
    // Filter by status if provided
    if (status && ["pending", "confirmed", "cancelled", "completed"].includes(status as string)) {
      query.status = status;
    }
    
    const appointments = await Appointment.find(query)
      .populate("serviceId", "name price duration")
      .populate("businessId", "name")
      .sort({ date: -1, startTime: 1 });
    
    return res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching customer appointments:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findById(appointmentId)
      .populate("serviceId", "name price duration")
      .populate("businessId", "name")
      .populate("customerId", "name email");
    
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    return res.status(200).json(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Create a new appointment
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { 
      serviceId, 
      businessId, 
      customerId, 
      date, 
      startTime, 
      endTime, 
      notes 
    } = req.body;
    
    // Validate service exists and is appointment type
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    
    if (service.serviceType !== "appointment") {
      return res.status(400).json({ message: "Service is not appointment type" });
    }
    
    // Validate business exists
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }
    
    // Validate customer exists
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    // Check if the time slot is available
    const appointmentDate = new Date(date);
    const existingAppointment = await Appointment.findOne({
      businessId,
      serviceId,
      date: {
        $gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
        $lte: new Date(appointmentDate.setHours(23, 59, 59, 999))
      },
      startTime,
      status: { $in: ["pending", "confirmed"] }
    });
    
    if (existingAppointment) {
      return res.status(400).json({ message: "Time slot is already booked" });
    }
    
    // Create the appointment
    const newAppointment = new Appointment({
      serviceId,
      businessId,
      customerId,
      date,
      startTime,
      endTime,
      notes,
      status: "pending"
    });
    
    await newAppointment.save();
    
    return res.status(201).json(newAppointment);
  } catch (error) {
    console.error("Error creating appointment:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;
    
    if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    appointment.status = status as AppointmentStatus;
    await appointment.save();
    
    return res.status(200).json(appointment);
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update appointment details
export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { date, startTime, endTime, notes } = req.body;
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    // Only allow updates if appointment is not cancelled or completed
    if (["cancelled", "completed"].includes(appointment.status)) {
      return res.status(400).json({ 
        message: `Cannot update a ${appointment.status} appointment` 
      });
    }
    
    if (date) appointment.date = new Date(date);
    if (startTime) appointment.startTime = startTime;
    if (endTime) appointment.endTime = endTime;
    if (notes !== undefined) appointment.notes = notes;
    
    await appointment.save();
    
    return res.status(200).json(appointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete appointment
export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    // Only allow deletion if appointment is pending
    if (appointment.status !== "pending") {
      return res.status(400).json({ 
        message: `Cannot delete a ${appointment.status} appointment` 
      });
    }
    
    await Appointment.findByIdAndDelete(appointmentId);
    
    return res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get available time slots for a service on a specific date
export const getAvailableTimeSlots = async (req: Request, res: Response) => {
  try {
    const { serviceId, date } = req.params;
    
    // Get the service to check its availability and duration
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    
    if (service.serviceType !== "appointment") {
      return res.status(400).json({ message: "Service is not appointment type" });
    }
    
    if (!service.availability || !service.duration) {
      return res.status(400).json({ message: "Service does not have availability settings" });
    }
    
    // Check if the requested date is available based on service's availability days
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    if (!service.availability.days.includes(dayOfWeek)) {
      return res.status(200).json({ 
        available: false,
        message: "Service is not available on this day",
        timeSlots: []
      });
    }
    
    // Get business hours for the service
    const startTime = service.availability.startTime || "09:00";
    const endTime = service.availability.endTime || "17:00";
    
    // Convert times to minutes for easier calculation
    const startMinutes = convertTimeToMinutes(startTime);
    const endMinutes = convertTimeToMinutes(endTime);
    const duration = service.duration;
    
    // Generate all possible time slots
    const timeSlots = [];
    for (let time = startMinutes; time <= endMinutes - duration; time += duration) {
      timeSlots.push({
        startTime: convertMinutesToTime(time),
        endTime: convertMinutesToTime(time + duration)
      });
    }
    
    // Get booked appointments for this service on this date
    const appointmentDate = new Date(date);
    const bookedAppointments = await Appointment.find({
      serviceId,
      date: {
        $gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
        $lte: new Date(appointmentDate.setHours(23, 59, 59, 999))
      },
      status: { $in: ["pending", "confirmed"] }
    });
    
    // Filter out booked time slots
    const bookedTimes = bookedAppointments.map(app => app.startTime);
    const availableTimeSlots = timeSlots.filter(slot => !bookedTimes.includes(slot.startTime));
    
    return res.status(200).json({
      available: true,
      timeSlots: availableTimeSlots
    });
  } catch (error) {
    console.error("Error getting available time slots:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Helper functions
function convertTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function convertMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
