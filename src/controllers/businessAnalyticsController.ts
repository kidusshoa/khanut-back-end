import { Request, Response } from "express";
import { AuthRequest } from "../types/express";
import { Business } from "../models/business";
import { Order } from "../models/order";
import { Appointment } from "../models/appointment";
import { User } from "../models/user";
import { Service } from "../models/service";
import mongoose from "mongoose";

/**
 * Get dashboard statistics for a business
 */
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const { businessId } = req.params;

    // Verify business exists and user has access
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Check if user owns this business
    if (
      req.user.role === "business" &&
      business.ownerId.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this business" });
    }

    // Get current date and date 30 days ago
    const currentDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(currentDate.getDate() - 60);

    // Get total revenue for current month
    const currentMonthOrders = await Order.find({
      businessId,
      createdAt: { $gte: thirtyDaysAgo, $lte: currentDate },
      status: {
        $in: ["payment_received", "processing", "shipped", "delivered"],
      },
    });

    const totalRevenue = currentMonthOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // Get total revenue for previous month for comparison
    const previousMonthOrders = await Order.find({
      businessId,
      createdAt: { $gte: sixtyDaysAgo, $lte: thirtyDaysAgo },
      status: {
        $in: ["payment_received", "processing", "shipped", "delivered"],
      },
    });

    const previousMonthRevenue = previousMonthOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // Calculate revenue change percentage
    const revenueChange =
      previousMonthRevenue === 0
        ? 100
        : ((totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

    // Get total orders for current month
    const totalOrders = currentMonthOrders.length;

    // Get total orders for previous month for comparison
    const previousMonthOrdersCount = previousMonthOrders.length;

    // Calculate orders change percentage
    const ordersChange =
      previousMonthOrdersCount === 0
        ? 100
        : ((totalOrders - previousMonthOrdersCount) /
            previousMonthOrdersCount) *
          100;

    // Get total appointments for current month
    const currentMonthAppointments = await Appointment.find({
      businessId,
      createdAt: { $gte: thirtyDaysAgo, $lte: currentDate },
    });

    const totalAppointments = currentMonthAppointments.length;

    // Get total appointments for previous month for comparison
    const previousMonthAppointments = await Appointment.find({
      businessId,
      createdAt: { $gte: sixtyDaysAgo, $lte: thirtyDaysAgo },
    });

    const previousMonthAppointmentsCount = previousMonthAppointments.length;

    // Calculate appointments change percentage
    const appointmentsChange =
      previousMonthAppointmentsCount === 0
        ? 100
        : ((totalAppointments - previousMonthAppointmentsCount) /
            previousMonthAppointmentsCount) *
          100;

    // Get total unique customers for current month
    const currentMonthCustomerIds = new Set([
      ...currentMonthOrders.map((order) => order.customerId.toString()),
      ...currentMonthAppointments.map((appointment) =>
        appointment.customerId.toString()
      ),
    ]);

    const totalCustomers = currentMonthCustomerIds.size;

    // Get total unique customers for previous month for comparison
    const previousMonthCustomerIds = new Set([
      ...previousMonthOrders.map((order) => order.customerId.toString()),
      ...previousMonthAppointments.map((appointment) =>
        appointment.customerId.toString()
      ),
    ]);

    const previousMonthCustomersCount = previousMonthCustomerIds.size;

    // Calculate customers change percentage
    const customersChange =
      previousMonthCustomersCount === 0
        ? 100
        : ((totalCustomers - previousMonthCustomersCount) /
            previousMonthCustomersCount) *
          100;

    return res.status(200).json({
      totalRevenue,
      totalOrders,
      totalAppointments,
      totalCustomers,
      revenueChange,
      ordersChange,
      appointmentsChange,
      customersChange,
    });
  } catch (error) {
    console.error("❌ Get dashboard stats error:", error);
    return res
      .status(500)
      .json({ message: "Failed to get dashboard statistics" });
  }
};

/**
 * Get revenue data for a business
 */
export const getRevenueData = async (req: AuthRequest, res: Response) => {
  try {
    const { businessId } = req.params;
    const { period = "week" } = req.query;

    // Verify business exists and user has access
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Check if user owns this business
    if (
      req.user.role === "business" &&
      business.ownerId.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this business" });
    }

    let labels: string[] = [];
    let currentPeriodData: number[] = [];
    let previousPeriodData: number[] = [];

    const currentDate = new Date();

    if (period === "week") {
      // Get data for current week and previous week
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start of current week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // End of current week (Saturday)
      endOfWeek.setHours(23, 59, 59, 999);

      const startOfPreviousWeek = new Date(startOfWeek);
      startOfPreviousWeek.setDate(startOfWeek.getDate() - 7); // Start of previous week

      const endOfPreviousWeek = new Date(endOfWeek);
      endOfPreviousWeek.setDate(endOfWeek.getDate() - 7); // End of previous week

      // Generate labels for days of the week
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      labels = days;

      // Get orders for current week
      const currentWeekOrders = await Order.find({
        businessId,
        createdAt: { $gte: startOfWeek, $lte: endOfWeek },
        status: {
          $in: ["payment_received", "processing", "shipped", "delivered"],
        },
      });

      // Get orders for previous week
      const previousWeekOrders = await Order.find({
        businessId,
        createdAt: { $gte: startOfPreviousWeek, $lte: endOfPreviousWeek },
        status: {
          $in: ["payment_received", "processing", "shipped", "delivered"],
        },
      });

      // Calculate daily revenue for current week
      currentPeriodData = Array(7).fill(0);
      for (const order of currentWeekOrders) {
        const dayOfWeek = new Date(order.createdAt).getDay();
        currentPeriodData[dayOfWeek] += order.totalAmount;
      }

      // Calculate daily revenue for previous week
      previousPeriodData = Array(7).fill(0);
      for (const order of previousWeekOrders) {
        const dayOfWeek = new Date(order.createdAt).getDay();
        previousPeriodData[dayOfWeek] += order.totalAmount;
      }
    } else if (period === "month") {
      // Get data for current month and previous month
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const startOfPreviousMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      );
      const endOfPreviousMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        0
      );

      // Generate labels for weeks of the month
      labels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];

      // Get orders for current month
      const currentMonthOrders = await Order.find({
        businessId,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        status: {
          $in: ["payment_received", "processing", "shipped", "delivered"],
        },
      });

      // Get orders for previous month
      const previousMonthOrders = await Order.find({
        businessId,
        createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth },
        status: {
          $in: ["payment_received", "processing", "shipped", "delivered"],
        },
      });

      // Calculate weekly revenue for current month
      currentPeriodData = Array(5).fill(0);
      for (const order of currentMonthOrders) {
        const day = new Date(order.createdAt).getDate();
        const weekIndex = Math.min(Math.floor((day - 1) / 7), 4);
        currentPeriodData[weekIndex] += order.totalAmount;
      }

      // Calculate weekly revenue for previous month
      previousPeriodData = Array(5).fill(0);
      for (const order of previousMonthOrders) {
        const day = new Date(order.createdAt).getDate();
        const weekIndex = Math.min(Math.floor((day - 1) / 7), 4);
        previousPeriodData[weekIndex] += order.totalAmount;
      }
    } else if (period === "year") {
      // Get data for current year and previous year
      const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
      const endOfYear = new Date(currentDate.getFullYear(), 11, 31);

      const startOfPreviousYear = new Date(currentDate.getFullYear() - 1, 0, 1);
      const endOfPreviousYear = new Date(currentDate.getFullYear() - 1, 11, 31);

      // Generate labels for months of the year
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      labels = months;

      // Get orders for current year
      const currentYearOrders = await Order.find({
        businessId,
        createdAt: { $gte: startOfYear, $lte: endOfYear },
        status: {
          $in: ["payment_received", "processing", "shipped", "delivered"],
        },
      });

      // Get orders for previous year
      const previousYearOrders = await Order.find({
        businessId,
        createdAt: { $gte: startOfPreviousYear, $lte: endOfPreviousYear },
        status: {
          $in: ["payment_received", "processing", "shipped", "delivered"],
        },
      });

      // Calculate monthly revenue for current year
      currentPeriodData = Array(12).fill(0);
      for (const order of currentYearOrders) {
        const month = new Date(order.createdAt).getMonth();
        currentPeriodData[month] += order.totalAmount;
      }

      // Calculate monthly revenue for previous year
      previousPeriodData = Array(12).fill(0);
      for (const order of previousYearOrders) {
        const month = new Date(order.createdAt).getMonth();
        previousPeriodData[month] += order.totalAmount;
      }
    }

    return res.status(200).json({
      labels,
      datasets: [
        {
          label:
            period === "week"
              ? "This Week"
              : period === "month"
                ? "This Month"
                : "This Year",
          data: currentPeriodData,
          borderColor: "hsl(24, 100%, 50%)",
          backgroundColor: "hsla(24, 100%, 50%, 0.5)",
        },
        {
          label:
            period === "week"
              ? "Last Week"
              : period === "month"
                ? "Last Month"
                : "Last Year",
          data: previousPeriodData,
          borderColor: "hsl(210, 100%, 50%)",
          backgroundColor: "hsla(210, 100%, 50%, 0.5)",
        },
      ],
    });
  } catch (error) {
    console.error("❌ Get revenue data error:", error);
    return res.status(500).json({ message: "Failed to get revenue data" });
  }
};

/**
 * Get service distribution data for a business
 */
export const getServiceDistribution = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { businessId } = req.params;

    // Verify business exists and user has access
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Check if user owns this business
    if (
      req.user.role === "business" &&
      business.ownerId.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this business" });
    }

    // Get all services for the business
    const services = await Service.find({ businessId });

    // Count services by type
    const appointmentServices = services.filter(
      (service) => service.get("type") === "appointment"
    ).length;
    const productServices = services.filter(
      (service) => service.get("type") === "product"
    ).length;
    const uniformServices = services.filter(
      (service) => service.get("type") === "uniform"
    ).length;

    return res.status(200).json({
      labels: ["Appointments", "Products", "In-Person"],
      datasets: [
        {
          label: "Service Types",
          data: [appointmentServices, productServices, uniformServices],
          backgroundColor: [
            "hsla(210, 100%, 50%, 0.7)",
            "hsla(24, 100%, 50%, 0.7)",
            "hsla(130, 100%, 40%, 0.7)",
          ],
          borderColor: [
            "hsl(210, 100%, 50%)",
            "hsl(24, 100%, 50%)",
            "hsl(130, 100%, 40%)",
          ],
          borderWidth: 1,
        },
      ],
    });
  } catch (error) {
    console.error("❌ Get service distribution error:", error);
    return res
      .status(500)
      .json({ message: "Failed to get service distribution data" });
  }
};

/**
 * Get recent orders for a business
 */
export const getRecentOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { businessId } = req.params;
    const { limit = 5 } = req.query;

    // Verify business exists and user has access
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Check if user owns this business
    if (
      req.user.role === "business" &&
      business.ownerId.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this business" });
    }

    // Get recent orders
    const recentOrders = await Order.find({ businessId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate("customerId", "name");

    // Format orders for response
    const formattedOrders = recentOrders.map((order) => ({
      id: order._id,
      customer: order.customerId
        ? (order.customerId as any).name
        : "Unknown Customer",
      date: order.createdAt,
      amount: order.totalAmount,
      status: order.status,
    }));

    return res.status(200).json(formattedOrders);
  } catch (error) {
    console.error("❌ Get recent orders error:", error);
    return res.status(500).json({ message: "Failed to get recent orders" });
  }
};

/**
 * Get upcoming appointments for a business
 */
export const getUpcomingAppointments = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { businessId } = req.params;
    const { limit = 5 } = req.query;

    // Verify business exists and user has access
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Check if user owns this business
    if (
      req.user.role === "business" &&
      business.ownerId.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this business" });
    }

    // Get current date
    const currentDate = new Date();

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.find({
      businessId,
      date: { $gte: currentDate },
      status: { $in: ["pending", "confirmed"] },
    })
      .sort({ date: 1, startTime: 1 })
      .limit(Number(limit))
      .populate("customerId", "name")
      .populate("serviceId", "name");

    // Format appointments for response
    const formattedAppointments = upcomingAppointments.map((appointment) => {
      // Parse date and time
      const appointmentDate = new Date(appointment.date);
      const [hours, minutes] = appointment.startTime.split(":").map(Number);
      appointmentDate.setHours(hours, minutes);

      return {
        id: appointment._id,
        customer: appointment.customerId
          ? (appointment.customerId as any).name
          : "Unknown Customer",
        service: appointment.serviceId
          ? (appointment.serviceId as any).name
          : "Unknown Service",
        date: appointmentDate,
        duration: appointment.duration || 60,
      };
    });

    return res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error("❌ Get upcoming appointments error:", error);
    return res
      .status(500)
      .json({ message: "Failed to get upcoming appointments" });
  }
};
