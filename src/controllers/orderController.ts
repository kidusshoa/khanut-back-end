import { Request, Response } from "express";
import { Order, OrderStatus } from "../models/order";
import { Service } from "../models/service";
import { Product } from "../models/product";
import { User } from "../models/user";
import { Business } from "../models/business";
import mongoose from "mongoose";

// Get all orders for a business
export const getBusinessOrders = async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    const { status } = req.query;

    const query: any = { businessId };

    // Filter by status if provided
    if (
      status &&
      [
        "pending_payment",
        "payment_received",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ].includes(status as string)
    ) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("customerId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching business orders:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all orders for a customer
export const getCustomerOrders = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { status } = req.query;

    // Check if customerId is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(customerId);

    // If not a valid ObjectId, return empty array instead of throwing an error
    if (!isValidObjectId) {
      console.log(`Invalid ObjectId format for customerId: ${customerId}`);
      return res.status(200).json([]);
    }

    const query: any = { customerId };

    // Filter by status if provided
    if (
      status &&
      [
        "pending_payment",
        "payment_received",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ].includes(status as string)
    ) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("businessId", "name")
      .sort({ createdAt: -1 });

    // Populate service details for each order item
    const populatedOrders = await Promise.all(
      orders.map(async (order) => {
        const orderObj = order.toObject();

        const itemsWithDetails = await Promise.all(
          orderObj.items.map(async (item: any) => {
            const service = await Service.findById(item.serviceId);
            return {
              ...item,
              serviceName: service?.name,
              serviceDescription: service?.description,
            };
          })
        );

        return {
          ...orderObj,
          items: itemsWithDetails,
        };
      })
    );

    return res.status(200).json(populatedOrders);
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get order by ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("customerId", "name email")
      .populate("businessId", "name");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Populate service details for each order item
    const orderObj = order.toObject();
    const itemsWithDetails = await Promise.all(
      orderObj.items.map(async (item: any) => {
        const service = await Service.findById(item.serviceId);
        return {
          ...item,
          serviceName: service?.name,
          serviceDescription: service?.description,
        };
      })
    );

    return res.status(200).json({
      ...orderObj,
      items: itemsWithDetails,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Create a new order
export const createOrder = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      customerId,
      businessId,
      items,
      shippingAddress,
      paymentMethod,
      notes,
    } = req.body;

    // Validate customer exists
    const customer = await User.findById(customerId);
    if (!customer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Customer not found" });
    }

    // Validate business exists
    const business = await Business.findById(businessId);
    if (!business) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Business not found" });
    }

    // Validate items and calculate total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const { serviceId, quantity } = item;

      // Validate service exists and is a product
      const service = await Service.findById(serviceId);
      if (!service) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(404)
          .json({ message: `Service ${serviceId} not found` });
      }

      if (service.serviceType !== "product") {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json({ message: `Service ${serviceId} is not a product` });
      }

      // Check inventory
      const product = await Product.findOne({ serviceId });
      if (!product || product.inventory < quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: `Not enough inventory for product ${service.name}`,
        });
      }

      // Update inventory
      product.inventory -= quantity;
      await product.save({ session });

      // Add to validated items and calculate total
      const itemTotal = service.price * quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        serviceId,
        quantity,
        price: service.price,
      });
    }

    // Create the order
    const newOrder = new Order({
      customerId,
      businessId,
      items: validatedItems,
      totalAmount,
      status: "pending_payment",
      paymentMethod,
      shippingAddress,
      notes,
    });

    await newOrder.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(newOrder);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error creating order:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (
      ![
        "pending_payment",
        "payment_received",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ].includes(status)
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Order not found" });
    }

    // Handle inventory changes for cancellations or refunds
    if (
      (status === "cancelled" || status === "refunded") &&
      order.status !== "cancelled" &&
      order.status !== "refunded"
    ) {
      // Return items to inventory
      for (const item of order.items) {
        const product = await Product.findOne({ serviceId: item.serviceId });
        if (product) {
          product.inventory += item.quantity;
          await product.save({ session });
        }
      }
    }

    order.status = status as OrderStatus;
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(order);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error updating order status:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update shipping information
export const updateShippingInfo = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber, shippingAddress } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    if (shippingAddress) {
      order.shippingAddress = shippingAddress;
    }

    await order.save();

    return res.status(200).json(order);
  } catch (error) {
    console.error("Error updating shipping info:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
