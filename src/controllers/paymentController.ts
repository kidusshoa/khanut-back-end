import { Request, Response } from "express";
import axios from "axios";
import { Payment } from "../models/payment";
import { Order } from "../models/order";
import { Appointment } from "../models/appointment";
import { v4 as uuidv4 } from "uuid";

// Chapa API configuration
const CHAPA_API_URL = process.env.CHAPA_API_URL || "https://api.chapa.co";
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
const CHAPA_WEBHOOK_SECRET = process.env.CHAPA_WEBHOOK_SECRET;

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
        message: `Cannot process payment for order with status: ${order.status}` 
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
    
    const chapaPayload = {
      amount: order.totalAmount.toString(),
      currency: "ETB",
      email: customer.email,
      first_name: customer.name.split(" ")[0],
      last_name: customer.name.split(" ").slice(1).join(" "),
      tx_ref: txRef,
      callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
      return_url: `${process.env.FRONTEND_URL}/customer/${customer._id}/orders/${order._id}`,
      customization: {
        title: `Payment for order at ${business.name}`,
        description: `Order #${order._id}`
      }
    };
    
    const chapaResponse = await axios.post(
      `${CHAPA_API_URL}/v1/transaction/initialize`, 
      chapaPayload,
      {
        headers: {
          "Authorization": `Bearer ${CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    // Update payment with Chapa transaction ID
    payment.chapaTransactionId = chapaResponse.data.data.transaction_id;
    await payment.save();
    
    return res.status(200).json({
      paymentId: payment._id,
      checkoutUrl: chapaResponse.data.data.checkout_url,
      txRef
    });
  } catch (error) {
    console.error("Error initializing payment:", error);
    return res.status(500).json({ message: "Payment initialization failed" });
  }
};

// Initialize payment for an appointment
export const initializeAppointmentPayment = async (req: Request, res: Response) => {
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
        message: `Cannot process payment for appointment with status: ${appointment.status}` 
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
    
    const chapaPayload = {
      amount: service.price.toString(),
      currency: "ETB",
      email: customer.email,
      first_name: customer.name.split(" ")[0],
      last_name: customer.name.split(" ").slice(1).join(" "),
      tx_ref: txRef,
      callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
      return_url: `${process.env.FRONTEND_URL}/customer/${customer._id}/appointments/${appointment._id}`,
      customization: {
        title: `Payment for appointment at ${business.name}`,
        description: `Service: ${service.name}`
      }
    };
    
    const chapaResponse = await axios.post(
      `${CHAPA_API_URL}/v1/transaction/initialize`, 
      chapaPayload,
      {
        headers: {
          "Authorization": `Bearer ${CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    // Update payment with Chapa transaction ID
    payment.chapaTransactionId = chapaResponse.data.data.transaction_id;
    await payment.save();
    
    return res.status(200).json({
      paymentId: payment._id,
      checkoutUrl: chapaResponse.data.data.checkout_url,
      txRef
    });
  } catch (error) {
    console.error("Error initializing appointment payment:", error);
    return res.status(500).json({ message: "Payment initialization failed" });
  }
};

// Verify payment status
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { txRef } = req.params;
    
    // Check if payment exists
    const payment = await Payment.findOne({ chapaReference: txRef });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    
    // Verify with Chapa
    const chapaResponse = await axios.get(
      `${CHAPA_API_URL}/v1/transaction/verify/${txRef}`,
      {
        headers: {
          "Authorization": `Bearer ${CHAPA_SECRET_KEY}`
        }
      }
    );
    
    const { status } = chapaResponse.data.data;
    
    // Update payment status
    payment.status = status === "success" ? "completed" : "failed";
    await payment.save();
    
    // Update order or appointment status if payment is successful
    if (status === "success") {
      if (payment.paymentType === "order") {
        await Order.findByIdAndUpdate(
          payment.referenceId,
          { status: "payment_received" }
        );
      } else if (payment.paymentType === "appointment") {
        await Appointment.findByIdAndUpdate(
          payment.referenceId,
          { status: "confirmed" }
        );
      }
    }
    
    return res.status(200).json({
      status: payment.status,
      paymentId: payment._id,
      referenceId: payment.referenceId,
      paymentType: payment.paymentType
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
          await Order.findByIdAndUpdate(
            payment.referenceId,
            { status: "payment_received" }
          );
        } else if (payment.paymentType === "appointment") {
          await Appointment.findByIdAndUpdate(
            payment.referenceId,
            { status: "confirmed" }
          );
        }
      }
    }
    
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
};

// Get payment history for a customer
export const getCustomerPayments = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    
    const payments = await Payment.find({ customerId })
      .populate("businessId", "name")
      .sort({ createdAt: -1 });
    
    return res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching customer payments:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get payment history for a business
export const getBusinessPayments = async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    
    const payments = await Payment.find({ businessId })
      .populate("customerId", "name email")
      .sort({ createdAt: -1 });
    
    return res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching business payments:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
