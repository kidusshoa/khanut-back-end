import { Request, Response } from "express";
import { AuthRequest } from "../types/express";
import { Business } from "../models/business";
import { Order } from "../models/order";
import { Appointment } from "../models/appointment";
import { User } from "../models/user";
import { Service } from "../models/service";
import mongoose from "mongoose";

// Helper function to get date ranges based on period
const getDateRanges = (period: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  const endOfLastWeek = new Date(endOfWeek);
  endOfLastWeek.setDate(endOfLastWeek.getDate() - 7);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31);

  const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
  const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);

  return {
    today: {
      start: today,
      end: now,
    },
    yesterday: {
      start: yesterday,
      end: today,
    },
    thisWeek: {
      start: startOfWeek,
      end: endOfWeek,
    },
    lastWeek: {
      start: startOfLastWeek,
      end: endOfLastWeek,
    },
    thisMonth: {
      start: startOfMonth,
      end: endOfMonth,
    },
    lastMonth: {
      start: startOfLastMonth,
      end: endOfLastMonth,
    },
    thisYear: {
      start: startOfYear,
      end: endOfYear,
    },
    lastYear: {
      start: startOfLastYear,
      end: endOfLastYear,
    },
  };
};

// Helper function to return empty analytics data
const getEmptyAnalyticsData = () => {
  return {
    revenue: {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
    },
    orders: {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      pending: 0,
      completed: 0,
    },
    customers: {
      total: 0,
      new: 0,
      returning: 0,
    },
    appointments: {
      total: 0,
      today: 0,
      thisWeek: 0,
      upcoming: 0,
      completed: 0,
    },
  };
};

/**
 * Get dashboard statistics for a business
 */
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const { businessId } = req.params;

    // Verify business exists and user has access
    const business = await Business.findById(businessId);
    if (!business) {
      // Return empty stats instead of 404 for new businesses
      return res.status(200).json({
        totalRevenue: 0,
        totalOrders: 0,
        totalAppointments: 0,
        totalCustomers: 0,
        revenueChange: 0,
        ordersChange: 0,
        appointmentsChange: 0,
        customersChange: 0,
      });
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
      // Return empty revenue data instead of 404 for new businesses
      const emptyData = {
        labels:
          period === "week"
            ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
            : period === "month"
              ? ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"]
              : [
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
                ],
        datasets: [
          {
            label:
              period === "week"
                ? "This Week"
                : period === "month"
                  ? "This Month"
                  : "This Year",
            data:
              period === "week"
                ? Array(7).fill(0)
                : period === "month"
                  ? Array(5).fill(0)
                  : Array(12).fill(0),
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
            data:
              period === "week"
                ? Array(7).fill(0)
                : period === "month"
                  ? Array(5).fill(0)
                  : Array(12).fill(0),
            borderColor: "hsl(210, 100%, 50%)",
            backgroundColor: "hsla(210, 100%, 50%, 0.5)",
          },
        ],
      };
      return res.status(200).json(emptyData);
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
      // Return empty service distribution data instead of 404 for new businesses
      const emptyData = {
        labels: ["Appointments", "Products", "In-Person"],
        datasets: [
          {
            label: "Service Types",
            data: [0, 0, 0],
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
      };
      return res.status(200).json(emptyData);
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
      (service) => service.serviceType === "appointment"
    ).length;
    const productServices = services.filter(
      (service) => service.serviceType === "product"
    ).length;
    const inPersonServices = services.filter(
      (service) => service.serviceType === "in_person"
    ).length;

    return res.status(200).json({
      labels: ["Appointments", "Products", "In-Person"],
      datasets: [
        {
          label: "Service Types",
          data: [appointmentServices, productServices, inPersonServices],
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
      // Return empty orders array instead of 404 for new businesses
      return res.status(200).json([]);
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
 * Get comprehensive analytics data for a business
 */
export const getComprehensiveAnalytics = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { businessId } = req.params;
    const { period = "month" } = req.query;

    // Verify business exists and user has access
    const business = await Business.findById(businessId);
    if (!business) {
      // Return empty analytics data instead of 404 for new businesses
      return res.status(200).json(getEmptyAnalyticsData());
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

    // Get date ranges based on the requested period
    const dateRanges = getDateRanges(period as string);

    // Get all orders for the business
    const allOrders = await Order.find({
      businessId,
      status: {
        $in: [
          "payment_received",
          "processing",
          "shipped",
          "delivered",
          "pending_payment",
        ],
      },
    });

    // Get orders for today
    const todayOrders = allOrders.filter(
      (order) =>
        order.createdAt >= dateRanges.today.start &&
        order.createdAt <= dateRanges.today.end
    );

    // Get orders for this week
    const thisWeekOrders = allOrders.filter(
      (order) =>
        order.createdAt >= dateRanges.thisWeek.start &&
        order.createdAt <= dateRanges.thisWeek.end
    );

    // Get orders for this month
    const thisMonthOrders = allOrders.filter(
      (order) =>
        order.createdAt >= dateRanges.thisMonth.start &&
        order.createdAt <= dateRanges.thisMonth.end
    );

    // Calculate revenue data
    const revenueData = {
      total: allOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      today: todayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      thisWeek: thisWeekOrders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      ),
      thisMonth: thisMonthOrders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      ),
    };

    // Get all appointments for the business
    const allAppointments = await Appointment.find({ businessId });

    // Get current date
    const currentDate = new Date();

    // Get appointments for today
    const todayAppointments = allAppointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      return (
        appointmentDate.getFullYear() === currentDate.getFullYear() &&
        appointmentDate.getMonth() === currentDate.getMonth() &&
        appointmentDate.getDate() === currentDate.getDate()
      );
    });

    // Get appointments for this week
    const thisWeekAppointments = allAppointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      return (
        appointmentDate >= dateRanges.thisWeek.start &&
        appointmentDate <= dateRanges.thisWeek.end
      );
    });

    // Get upcoming appointments
    const upcomingAppointments = allAppointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      return (
        appointmentDate >= currentDate && appointment.status !== "completed"
      );
    });

    // Get completed appointments
    const completedAppointments = allAppointments.filter(
      (appointment) => appointment.status === "completed"
    );

    // Calculate appointments data
    const appointmentsData = {
      total: allAppointments.length,
      today: todayAppointments.length,
      thisWeek: thisWeekAppointments.length,
      upcoming: upcomingAppointments.length,
      completed: completedAppointments.length,
    };

    // Get pending orders
    const pendingOrders = allOrders.filter(
      (order) =>
        order.status === "pending_payment" || order.status === "processing"
    );

    // Get completed orders
    const completedOrders = allOrders.filter(
      (order) => order.status === "delivered"
    );

    // Calculate orders data
    const ordersData = {
      total: allOrders.length,
      today: todayOrders.length,
      thisWeek: thisWeekOrders.length,
      thisMonth: thisMonthOrders.length,
      pending: pendingOrders.length,
      completed: completedOrders.length,
    };

    // Get all unique customer IDs from orders and appointments
    const customerIds = new Set([
      ...allOrders.map((order) => order.customerId.toString()),
      ...allAppointments.map((appointment) =>
        appointment.customerId.toString()
      ),
    ]);

    // Get new customers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);

    const recentOrders = allOrders.filter(
      (order) => order.createdAt >= thirtyDaysAgo
    );
    const recentAppointments = allAppointments.filter(
      (appointment) => appointment.createdAt >= thirtyDaysAgo
    );

    const recentCustomerIds = new Set([
      ...recentOrders.map((order) => order.customerId.toString()),
      ...recentAppointments.map((appointment) =>
        appointment.customerId.toString()
      ),
    ]);

    // Calculate returning customers (total - new)
    const totalCustomers = customerIds.size;
    const newCustomers = recentCustomerIds.size;
    const returningCustomers = Math.max(0, totalCustomers - newCustomers);

    // Calculate customers data
    const customersData = {
      total: totalCustomers,
      new: newCustomers,
      returning: returningCustomers,
    };

    // Combine all data into a single response
    const analyticsData = {
      revenue: revenueData,
      orders: ordersData,
      customers: customersData,
      appointments: appointmentsData,
    };

    return res.status(200).json(analyticsData);
  } catch (error) {
    console.error("❌ Get comprehensive analytics error:", error);
    return res
      .status(500)
      .json({ message: "Failed to get comprehensive analytics data" });
  }
};

/**
 * Get customer analytics data for a business
 */
export const getCustomerAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { businessId } = req.params;

    // Verify business exists and user has access
    const business = await Business.findById(businessId);
    if (!business) {
      // Return empty customer analytics data instead of 404 for new businesses
      return res.status(200).json({
        total: 0,
        new: 0,
        returning: 0,
        sources: [],
        retention: [],
      });
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

    // Get all orders and appointments for the business
    const allOrders = await Order.find({ businessId });
    const allAppointments = await Appointment.find({ businessId });

    // Get all unique customer IDs from orders and appointments
    const customerIds = new Set([
      ...allOrders.map((order) => order.customerId.toString()),
      ...allAppointments.map((appointment) =>
        appointment.customerId.toString()
      ),
    ]);

    // Get current date
    const currentDate = new Date();

    // Get new customers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);

    const recentOrders = allOrders.filter(
      (order) => order.createdAt >= thirtyDaysAgo
    );
    const recentAppointments = allAppointments.filter(
      (appointment) => appointment.createdAt >= thirtyDaysAgo
    );

    const recentCustomerIds = new Set([
      ...recentOrders.map((order) => order.customerId.toString()),
      ...recentAppointments.map((appointment) =>
        appointment.customerId.toString()
      ),
    ]);

    // Calculate returning customers (total - new)
    const totalCustomers = customerIds.size;
    const newCustomers = recentCustomerIds.size;
    const returningCustomers = Math.max(0, totalCustomers - newCustomers);

    // Get customer sources (mock data for now)
    const sources = [
      { name: "Direct", value: Math.floor(totalCustomers * 0.4) },
      { name: "Referral", value: Math.floor(totalCustomers * 0.3) },
      { name: "Social Media", value: Math.floor(totalCustomers * 0.2) },
      { name: "Search", value: Math.floor(totalCustomers * 0.1) },
    ];

    // Get customer retention data (mock data for now)
    const retention = [
      { name: "1-time", value: Math.floor(totalCustomers * 0.5) },
      { name: "2-3 times", value: Math.floor(totalCustomers * 0.3) },
      { name: "4-6 times", value: Math.floor(totalCustomers * 0.15) },
      { name: "7+ times", value: Math.floor(totalCustomers * 0.05) },
    ];

    return res.status(200).json({
      total: totalCustomers,
      new: newCustomers,
      returning: returningCustomers,
      sources,
      retention,
    });
  } catch (error) {
    console.error("❌ Get customer analytics error:", error);
    return res
      .status(500)
      .json({ message: "Failed to get customer analytics data" });
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
      // Return empty appointments array instead of 404 for new businesses
      return res.status(200).json([]);
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
        duration: 60,
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

/**
 * Get performance metrics for a business
 */
export const getPerformanceMetrics = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { businessId } = req.params;

    // Verify business exists and user has access
    const business = await Business.findById(businessId);
    if (!business) {
      // Return empty performance metrics instead of 404 for new businesses
      return res.status(200).json({
        kpi: [
          { subject: "Revenue", A: 50 },
          { subject: "Orders", A: 50 },
          { subject: "Customers", A: 50 },
          { subject: "Retention", A: 50 },
          { subject: "Satisfaction", A: 50 },
          { subject: "Growth", A: 50 },
        ],
        goals: {
          revenue: { target: 1000, current: 0 },
          orders: { target: 10, current: 0 },
          customers: { target: 20, current: 0 },
        },
      });
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

    // Get all orders and appointments for the business
    const allOrders = await Order.find({
      businessId,
      status: {
        $in: [
          "payment_received",
          "processing",
          "shipped",
          "delivered",
          "pending_payment",
        ],
      },
    });
    const allAppointments = await Appointment.find({ businessId });

    // Get current date
    const currentDate = new Date();

    // Get date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);

    // Get date 60 days ago
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(currentDate.getDate() - 60);

    // Get orders for current month
    const currentMonthOrders = allOrders.filter(
      (order) =>
        order.createdAt >= thirtyDaysAgo && order.createdAt <= currentDate
    );

    // Get orders for previous month
    const previousMonthOrders = allOrders.filter(
      (order) =>
        order.createdAt >= sixtyDaysAgo && order.createdAt <= thirtyDaysAgo
    );

    // Calculate revenue metrics
    const currentMonthRevenue = currentMonthOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
    const previousMonthRevenue = previousMonthOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
    const totalRevenue = allOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // Calculate revenue score (0-100)
    const revenueScore = Math.min(
      100,
      Math.max(10, (currentMonthRevenue / (totalRevenue || 1)) * 100)
    );

    // Calculate order metrics
    const currentMonthOrderCount = currentMonthOrders.length;
    const previousMonthOrderCount = previousMonthOrders.length;
    const totalOrders = allOrders.length;

    // Calculate order score (0-100)
    const orderScore = Math.min(
      100,
      Math.max(10, (currentMonthOrderCount / (totalOrders || 1)) * 100)
    );

    // Get all unique customer IDs from orders and appointments
    const customerIds = new Set([
      ...allOrders.map((order) => order.customerId.toString()),
      ...allAppointments.map((appointment) =>
        appointment.customerId.toString()
      ),
    ]);

    // Get new customers (last 30 days)
    const recentOrders = allOrders.filter(
      (order) => order.createdAt >= thirtyDaysAgo
    );
    const recentAppointments = allAppointments.filter(
      (appointment) => appointment.createdAt >= thirtyDaysAgo
    );

    const recentCustomerIds = new Set([
      ...recentOrders.map((order) => order.customerId.toString()),
      ...recentAppointments.map((appointment) =>
        appointment.customerId.toString()
      ),
    ]);

    // Calculate customer metrics
    const totalCustomers = customerIds.size;
    const newCustomers = recentCustomerIds.size;

    // Calculate customer score (0-100)
    const customerScore = Math.min(
      100,
      Math.max(10, (newCustomers / (totalCustomers || 1)) * 100)
    );

    // Calculate retention score (mock data for now)
    const retentionScore = Math.min(100, Math.max(10, 60 + Math.random() * 20));

    // Calculate satisfaction score (mock data for now)
    const satisfactionScore = Math.min(
      100,
      Math.max(10, 70 + Math.random() * 20)
    );

    // Calculate growth score (mock data for now)
    const growthScore = Math.min(100, Math.max(10, 50 + Math.random() * 30));

    // Create KPI data
    const kpiData = [
      { subject: "Revenue", A: Math.round(revenueScore) },
      { subject: "Orders", A: Math.round(orderScore) },
      { subject: "Customers", A: Math.round(customerScore) },
      { subject: "Retention", A: Math.round(retentionScore) },
      { subject: "Satisfaction", A: Math.round(satisfactionScore) },
      { subject: "Growth", A: Math.round(growthScore) },
    ];

    // Create goals data (mock data for now)
    const goalsData = {
      revenue: {
        target: Math.max(1000, Math.round(totalRevenue * 1.2)),
        current: Math.round(totalRevenue),
      },
      orders: {
        target: Math.max(10, Math.round(totalOrders * 1.2)),
        current: totalOrders,
      },
      customers: {
        target: Math.max(20, Math.round(totalCustomers * 1.2)),
        current: totalCustomers,
      },
    };

    return res.status(200).json({
      kpi: kpiData,
      goals: goalsData,
    });
  } catch (error) {
    console.error("❌ Get performance metrics error:", error);
    return res
      .status(500)
      .json({ message: "Failed to get performance metrics data" });
  }
};
