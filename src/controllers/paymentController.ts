import { Request, Response } from "express";
import { AuthRequest } from "../types/express";
import { Payment } from "../models/payment";
import { Order } from "../models/order";
import { Appointment } from "../models/appointment";
import { PlatformFee } from "../models/platformFee";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import {
  initializePayment,
  verifyPayment,
  handlePaymentWebhook,
} from "../services/paymentService";
import { chapaConfig } from "../config/chapa";

// Chapa API configuration
const CHAPA_API_URL = process.env.CHAPA_API_URL || "https://api.chapa.co";
const CHAPA_SECRET_KEY = chapaConfig.secretKey;
const CHAPA_WEBHOOK_SECRET = process.env.CHAPA_WEBHOOK_SECRET || "";

// Initialize payment for an order
export const initializeOrderPayment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    // Get the order
    const order = await Order.findById(orderId)
      .populate("customerId", "name email")
      .populate("businessId", "name");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending_payment") {
      return res.status(400).json({
        message: `Cannot process payment for order with status: ${order.status}`,
      });
    }

    // Generate a unique transaction reference
    const txRef = `ORDER-${uuidv4()}`;

    // Create payment record
    const payment = new Payment({
      customerId: order.customerId,
      businessId: order.businessId,
      amount: order.totalAmount,
      currency: "ETB",
      paymentType: "order",
      referenceId: order._id,
      chapaReference: txRef,
      status: "pending",
      paymentMethod: order.paymentMethod,
    });

    await payment.save();

    // Initialize Chapa payment
    const customer = order.customerId as any;
    const business = order.businessId as any;

    // Ensure we have the business ID as a string
    const businessId =
      typeof business === "object" && business._id
        ? business._id.toString()
        : business.toString();

    // Ensure we have the business name
    const businessName =
      typeof business === "object" && business.name
        ? business.name
        : "Business";

    // Ensure we have the customer ID as a string
    const customerId =
      typeof customer === "object" && customer._id
        ? customer._id.toString()
        : customer.toString();

    const chapaPayload = {
      amount: order.totalAmount.toString(),
      currency: "ETB",
      email: customer.email,
      first_name: customer.name.split(" ")[0],
      last_name: customer.name.split(" ").slice(1).join(" "),
      tx_ref: txRef,
      callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
      return_url: `${process.env.FRONTEND_URL}/customer/${customerId}/orders/${order._id}`,
      customization: {
        title: `Payment for order at ${businessName}`,
        description: `Order #${order._id}`,
      },
      // Add metadata to ensure we have the correct IDs
      meta: {
        businessId: businessId,
        customerId: customerId,
        orderId: order._id ? order._id.toString() : "",
      },
    };

    const chapaResponse = await axios.post(
      `${CHAPA_API_URL}/v1/transaction/initialize`,
      chapaPayload,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Update payment with Chapa transaction ID
    payment.chapaTransactionId = chapaResponse.data.data.transaction_id;
    await payment.save();

    return res.status(200).json({
      paymentId: payment._id,
      checkoutUrl: chapaResponse.data.data.checkout_url,
      txRef,
    });
  } catch (error) {
    console.error("Error initializing payment:", error);
    return res.status(500).json({ message: "Payment initialization failed" });
  }
};

// Initialize payment for an appointment
export const initializeAppointmentPayment = async (
  req: Request,
  res: Response
) => {
  try {
    const { appointmentId } = req.params;

    // Get the appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate("customerId", "name email")
      .populate("businessId", "name")
      .populate("serviceId", "name price");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status !== "pending") {
      return res.status(400).json({
        message: `Cannot process payment for appointment with status: ${appointment.status}`,
      });
    }

    const service = appointment.serviceId as any;

    // Generate a unique transaction reference
    const txRef = `APPT-${uuidv4()}`;

    // Create payment record
    const payment = new Payment({
      customerId: appointment.customerId,
      businessId: appointment.businessId,
      amount: service.price,
      currency: "ETB",
      paymentType: "appointment",
      referenceId: appointment._id,
      chapaReference: txRef,
      status: "pending",
      paymentMethod: "card", // Default to card for appointments
    });

    await payment.save();

    // Initialize Chapa payment
    const customer = appointment.customerId as any;
    const business = appointment.businessId as any;

    // Ensure we have the business ID as a string
    const businessId =
      typeof business === "object" && business._id
        ? business._id.toString()
        : business.toString();

    // Ensure we have the business name
    const businessName =
      typeof business === "object" && business.name
        ? business.name
        : "Business";

    // Ensure we have the customer ID as a string
    const customerId =
      typeof customer === "object" && customer._id
        ? customer._id.toString()
        : customer.toString();

    // Ensure we have the appointment ID as a string
    const appointmentIdStr = appointment._id ? appointment._id.toString() : "";

    const chapaPayload = {
      amount: service.price.toString(),
      currency: "ETB",
      email: customer.email,
      first_name: customer.name.split(" ")[0],
      last_name: customer.name.split(" ").slice(1).join(" "),
      tx_ref: txRef,
      callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
      return_url: `${process.env.FRONTEND_URL}/customer/${customerId}/appointments/${appointmentIdStr}`,
      customization: {
        title: `Payment for appointment at ${businessName}`,
        description: `Service: ${service.name}`,
      },
      // Add metadata to ensure we have the correct IDs
      meta: {
        businessId: businessId,
        customerId: customerId,
        appointmentId: appointmentIdStr,
      },
    };

    const chapaResponse = await axios.post(
      `${CHAPA_API_URL}/v1/transaction/initialize`,
      chapaPayload,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Update payment with Chapa transaction ID
    payment.chapaTransactionId = chapaResponse.data.data.transaction_id;
    await payment.save();

    return res.status(200).json({
      paymentId: payment._id,
      checkoutUrl: chapaResponse.data.data.checkout_url,
      txRef,
    });
  } catch (error) {
    console.error("Error initializing appointment payment:", error);
    return res.status(500).json({ message: "Payment initialization failed" });
  }
};

// Verify payment status
export const verifyPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { transactionRef } = req.params;

    // Check if payment exists
    const payment = await Payment.findOne({ chapaReference: transactionRef });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Verify with Chapa
    const chapaResponse = await axios.get(
      `${CHAPA_API_URL}/v1/transaction/verify/${transactionRef}`,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        },
      }
    );

    const { status } = chapaResponse.data.data;

    // Update payment status
    payment.status = status === "success" ? "completed" : "failed";
    await payment.save();

    // Update order or appointment status if payment is successful
    if (status === "success") {
      if (payment.paymentType === "order") {
        await Order.findByIdAndUpdate(payment.referenceId, {
          status: "payment_received",
        });

        // Calculate and save platform fee (5%)
        const feePercentage = 5;
        const feeAmount = (payment.amount * feePercentage) / 100;

        await new PlatformFee({
          paymentId: payment._id,
          orderId: payment.referenceId,
          businessId: payment.businessId,
          originalAmount: payment.amount,
          feePercentage: feePercentage,
          feeAmount: feeAmount,
        }).save();
      } else if (payment.paymentType === "appointment") {
        await Appointment.findByIdAndUpdate(payment.referenceId, {
          status: "confirmed",
          paymentStatus: "paid",
          paymentId: payment._id,
        });

        // Calculate and save platform fee (5%)
        const feePercentage = 5;
        const feeAmount = (payment.amount * feePercentage) / 100;

        await new PlatformFee({
          paymentId: payment._id,
          appointmentId: payment.referenceId,
          businessId: payment.businessId,
          originalAmount: payment.amount,
          feePercentage: feePercentage,
          feeAmount: feeAmount,
        }).save();
      }
    }

    return res.status(200).json({
      status: payment.status,
      paymentId: payment._id,
      referenceId: payment.referenceId,
      paymentType: payment.paymentType,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ message: "Payment verification failed" });
  }
};

// Chapa webhook handler
export const chapaWebhook = async (req: Request, res: Response) => {
  try {
    // Verify webhook signature
    const signature = req.headers["chapa-signature"];
    if (!signature || signature !== CHAPA_WEBHOOK_SECRET) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const { event, data } = req.body;

    // Handle different event types
    if (event === "charge.completed") {
      const { tx_ref, status } = data;

      // Find the payment
      const payment = await Payment.findOne({ chapaReference: tx_ref });
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Update payment status
      payment.status = status === "success" ? "completed" : "failed";
      payment.metadata = data;
      await payment.save();

      // Update order or appointment status
      if (status === "success") {
        if (payment.paymentType === "order") {
          await Order.findByIdAndUpdate(payment.referenceId, {
            status: "payment_received",
          });

          // Calculate and save platform fee (5%)
          const feePercentage = 5;
          const feeAmount = (payment.amount * feePercentage) / 100;

          // Check if platform fee already exists for this payment
          const existingFee = await PlatformFee.findOne({
            paymentId: payment._id,
          });
          if (!existingFee) {
            await new PlatformFee({
              paymentId: payment._id,
              orderId: payment.referenceId,
              businessId: payment.businessId,
              originalAmount: payment.amount,
              feePercentage: feePercentage,
              feeAmount: feeAmount,
            }).save();
          }
        } else if (payment.paymentType === "appointment") {
          await Appointment.findByIdAndUpdate(payment.referenceId, {
            status: "confirmed",
            paymentStatus: "paid",
            paymentId: payment._id,
          });

          // Calculate and save platform fee (5%)
          const feePercentage = 5;
          const feeAmount = (payment.amount * feePercentage) / 100;

          // Check if platform fee already exists for this payment
          const existingFee = await PlatformFee.findOne({
            paymentId: payment._id,
          });
          if (!existingFee) {
            await new PlatformFee({
              paymentId: payment._id,
              appointmentId: payment.referenceId,
              businessId: payment.businessId,
              originalAmount: payment.amount,
              feePercentage: feePercentage,
              feeAmount: feeAmount,
            }).save();
          }
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
};

// Handle payment callback from Chapa
export const handlePaymentCallback = async (req: Request, res: Response) => {
  try {
    const { tx_ref, status } = req.query;

    if (!tx_ref) {
      return res
        .status(400)
        .json({ message: "Transaction reference is required" });
    }

    // Find the payment
    const payment = await Payment.findOne({ chapaReference: tx_ref });

    if (!payment) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment/status?status=error&message=Payment not found`
      );
    }

    // Determine redirect URL based on payment type
    let redirectUrl = "";

    if (payment.paymentType === "order") {
      redirectUrl = `${process.env.FRONTEND_URL}/customer/${payment.customerId}/orders/${payment.referenceId}?status=${status || "pending"}`;
    } else if (payment.paymentType === "appointment") {
      redirectUrl = `${process.env.FRONTEND_URL}/customer/${payment.customerId}/appointments/${payment.referenceId}?status=${status || "pending"}`;
    } else {
      redirectUrl = `${process.env.FRONTEND_URL}/payment/status?status=${status || "pending"}`;
    }

    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("❌ Payment callback error:", error);
    // Redirect to frontend with error status
    return res.redirect(
      `${process.env.FRONTEND_URL}/payment/status?status=error`
    );
  }
};

// Get order payment status
export const getOrderPaymentStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { orderId } = req.params;

    // Check if order exists and belongs to the authenticated user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify order belongs to the authenticated user
    if (order.customerId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to view this order" });
    }

    // Return payment status
    return res.status(200).json({
      message: "Payment status retrieved successfully",
      paymentStatus: order.paymentDetails?.paymentStatus || "not_initiated",
      orderStatus: order.status,
      transactionRef: order.paymentDetails?.transactionRef || null,
    });
  } catch (error) {
    console.error("❌ Get payment status error:", error);
    return res.status(500).json({
      message: "Failed to get payment status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get payment history for a customer with pagination and filtering
export const getCustomerPayments = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const {
      page = "1",
      limit = "10",
      status,
      startDate,
      endDate,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    // Convert page and limit to numbers
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { customerId };

    // Add status filter if provided
    if (
      status &&
      ["pending", "completed", "failed", "refunded", "cancelled"].includes(
        status as string
      )
    ) {
      query.status = status;
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const endDateObj = new Date(endDate as string);
        endDateObj.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateObj;
      }
    }

    // Determine sort order
    const sortOrder = order === "asc" ? 1 : -1;
    const sortOptions: any = {};
    sortOptions[sort as string] = sortOrder;

    // Execute query with pagination
    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("businessId", "name")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Payment.countDocuments(query),
    ]);

    return res.status(200).json({
      transactions: payments,
      pagination: {
        totalItems: total,
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching customer payments:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get payment history for a business with pagination and filtering
export const getBusinessPayments = async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    const {
      page = "1",
      limit = "10",
      status,
      startDate,
      endDate,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    // Convert page and limit to numbers
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { businessId };

    // Add status filter if provided
    if (
      status &&
      ["pending", "completed", "failed", "refunded", "cancelled"].includes(
        status as string
      )
    ) {
      query.status = status;
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const endDateObj = new Date(endDate as string);
        endDateObj.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateObj;
      }
    }

    // Determine sort order
    const sortOrder = order === "asc" ? 1 : -1;
    const sortOptions: any = {};
    sortOptions[sort as string] = sortOrder;

    // Execute query with pagination
    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("customerId", "name email")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Payment.countDocuments(query),
    ]);

    return res.status(200).json({
      transactions: payments,
      pagination: {
        totalItems: total,
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching business payments:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
