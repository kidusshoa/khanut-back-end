import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Cart } from "../models/Cart";
import { Service } from "../models/service";
import mongoose from "mongoose";

/**
 * @desc    Get cart items for a customer
 * @route   GET /api/customer/cart
 * @access  Private (Customer)
 */
export const getCartItems = async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.id;

    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find cart for the customer
    const cart = await Cart.findOne({ customerId }).populate({
      path: "items.serviceId",
      select: "name price description businessId image",
      populate: {
        path: "businessId",
        select: "name",
      },
    });

    if (!cart) {
      return res.status(200).json({ items: [], totalAmount: 0 });
    }

    // Format the response
    const formattedItems = cart.items.map((item: any) => {
      const service = item.serviceId as any;
      return {
        serviceId: service._id,
        businessId: service.businessId._id,
        name: service.name,
        price: service.price,
        quantity: item.quantity,
        image: service.image,
        businessName: service.businessId.name,
      };
    });

    // Calculate total amount
    const totalAmount = formattedItems.reduce(
      (total: number, item: any) => total + item.price * item.quantity,
      0
    );

    res.status(200).json({
      items: formattedItems,
      totalAmount,
    });
  } catch (error) {
    console.error("Error fetching cart items:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/customer/cart
 * @access  Private (Customer)
 */
export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.id;
    const { serviceId, quantity = 1 } = req.body;

    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!serviceId) {
      return res.status(400).json({ message: "Service ID is required" });
    }

    // Validate service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Check if service is a product
    if (service.serviceType !== "product") {
      return res
        .status(400)
        .json({ message: "Only product type services can be added to cart" });
    }

    // Check inventory if available
    if (
      service.inventory !== undefined &&
      service.inventory !== null &&
      service.inventory < quantity
    ) {
      return res.status(400).json({
        message: `Not enough inventory. Only ${service.inventory} items available.`,
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ customerId });

    if (!cart) {
      cart = new Cart({
        customerId,
        items: [{ serviceId, quantity }],
      });
    } else {
      // Check if item already exists in cart
      const itemIndex = cart.items.findIndex(
        (item: any) => item.serviceId.toString() === serviceId
      );

      if (itemIndex > -1) {
        // Update quantity if item exists
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Add new item if it doesn't exist
        cart.items.push({ serviceId, quantity });
      }
    }

    await cart.save();

    // Return updated cart
    const updatedCart = await Cart.findOne({ customerId }).populate({
      path: "items.serviceId",
      select: "name price description businessId image",
      populate: {
        path: "businessId",
        select: "name",
      },
    });

    // Format the response
    const formattedItems =
      updatedCart?.items.map((item: any) => {
        const service = item.serviceId as any;
        return {
          serviceId: service._id,
          businessId: service.businessId._id,
          name: service.name,
          price: service.price,
          quantity: item.quantity,
          image: service.image,
          businessName: service.businessId.name,
        };
      }) || [];

    // Calculate total amount
    const totalAmount = formattedItems.reduce(
      (total: number, item: any) => total + item.price * item.quantity,
      0
    );

    res.status(200).json({
      message: "Item added to cart",
      items: formattedItems,
      totalAmount,
    });
  } catch (error) {
    console.error("Error adding item to cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Update cart item quantity
 * @route   PATCH /api/customer/cart/:serviceId
 * @access  Private (Customer)
 */
export const updateCartItemQuantity = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const customerId = req.user?.id;
    const { serviceId } = req.params;
    const { quantity } = req.body;

    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!serviceId) {
      return res.status(400).json({ message: "Service ID is required" });
    }

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ message: "Quantity is required" });
    }

    // Find cart
    const cart = await Cart.findOne({ customerId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(
      (item: any) => item.serviceId.toString() === serviceId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Validate service exists and check inventory
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Check inventory if available
    if (
      service.inventory !== undefined &&
      service.inventory !== null &&
      service.inventory < quantity
    ) {
      return res.status(400).json({
        message: `Not enough inventory. Only ${service.inventory} items available.`,
      });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    // Return updated cart
    const updatedCart = await Cart.findOne({ customerId }).populate({
      path: "items.serviceId",
      select: "name price description businessId image",
      populate: {
        path: "businessId",
        select: "name",
      },
    });

    // Format the response
    const formattedItems =
      updatedCart?.items.map((item: any) => {
        const service = item.serviceId as any;
        return {
          serviceId: service._id,
          businessId: service.businessId._id,
          name: service.name,
          price: service.price,
          quantity: item.quantity,
          image: service.image,
          businessName: service.businessId.name,
        };
      }) || [];

    // Calculate total amount
    const totalAmount = formattedItems.reduce(
      (total: number, item: any) => total + item.price * item.quantity,
      0
    );

    res.status(200).json({
      message: "Cart updated",
      items: formattedItems,
      totalAmount,
    });
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/customer/cart/:serviceId
 * @access  Private (Customer)
 */
export const removeFromCart = async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.id;
    const { serviceId } = req.params;

    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!serviceId) {
      return res.status(400).json({ message: "Service ID is required" });
    }

    // Find cart
    const cart = await Cart.findOne({ customerId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(
      (item: any) => item.serviceId.toString() === serviceId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Remove item
    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Return updated cart
    const updatedCart = await Cart.findOne({ customerId }).populate({
      path: "items.serviceId",
      select: "name price description businessId image",
      populate: {
        path: "businessId",
        select: "name",
      },
    });

    // Format the response
    const formattedItems =
      updatedCart?.items.map((item: any) => {
        const service = item.serviceId as any;
        return {
          serviceId: service._id,
          businessId: service.businessId._id,
          name: service.name,
          price: service.price,
          quantity: item.quantity,
          image: service.image,
          businessName: service.businessId.name,
        };
      }) || [];

    // Calculate total amount
    const totalAmount = formattedItems.reduce(
      (total: number, item: any) => total + item.price * item.quantity,
      0
    );

    res.status(200).json({
      message: "Item removed from cart",
      items: formattedItems,
      totalAmount,
    });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Clear cart
 * @route   DELETE /api/customer/cart
 * @access  Private (Customer)
 */
export const clearCart = async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.id;

    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find and update cart
    await Cart.findOneAndUpdate(
      { customerId },
      { $set: { items: [] } },
      { new: true }
    );

    res.status(200).json({
      message: "Cart cleared",
      items: [],
      totalAmount: 0,
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};
