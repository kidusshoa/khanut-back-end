import { Request, Response } from "express";
import { AuthRequest } from "../types/express";
import { Service, IService } from "../models/service";
import { Business } from "../models/business";
import { ActivityLog } from "../models/activityLog";
import mongoose from "mongoose";

// Update the interface to extend IService instead of mongoose.Document
interface ServiceWithInventory extends IService {
  type: string;
  stock?: number;
}

/**
 * Get inventory for a business
 */
export const getBusinessInventory = async (req: AuthRequest, res: Response) => {
  try {
    const { businessId } = req.params;
    const { search, lowStock } = req.query;

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

    // Build query for product services
    let query: any = {
      businessId,
      serviceType: "product", // Changed from type to serviceType
    };

    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Add low stock filter if provided
    if (lowStock === "true") {
      query.inventory = { $lte: 10 }; // Changed from stock to inventory
    }

    // Get product services
    const products = await Service.find(query).sort({ name: 1 });

    return res.status(200).json(products);
  } catch (error) {
    console.error("❌ Get business inventory error:", error);
    return res
      .status(500)
      .json({ message: "Failed to get business inventory" });
  }
};

/**
 * Update product stock
 */
export const updateProductStock = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const { stock, reason } = req.body;

    // Validate input
    if (stock === undefined || stock === null) {
      return res.status(400).json({ message: "Stock quantity is required" });
    }

    // Find the product
    const product = await Service.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Verify product is of type 'product'
    if (product.serviceType !== "product") {
      // Changed from type to serviceType
      return res.status(400).json({ message: "Service is not a product" });
    }

    // Verify business ownership
    const business = await Business.findById(product.businessId);
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
        .json({ message: "Not authorized to update this product" });
    }

    // Get previous stock for logging
    const previousStock = product.inventory || 0; // Changed from stock to inventory

    // Update product stock
    product.inventory = parseInt(stock as string); // Changed from stock to inventory
    await product.save();

    // Create activity log
    await ActivityLog.create({
      action: "INVENTORY_UPDATE",
      userId: req.user.id,
      businessId: product.businessId,
      details: `Stock for "${product.name}" updated from ${previousStock} to ${product.inventory}. Reason: ${reason || "Not specified"}`, // Changed from stock to inventory
    });

    return res.status(200).json({
      message: "Product stock updated successfully",
      product,
    });
  } catch (error) {
    console.error("❌ Update product stock error:", error);
    return res.status(500).json({ message: "Failed to update product stock" });
  }
};

/**
 * Batch update product stock
 */
export const batchUpdateStock = async (req: AuthRequest, res: Response) => {
  try {
    const { businessId } = req.params;
    const { products, reason } = req.body;

    // Validate input
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Products array is required" });
    }

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

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const updatedProducts = [];
      const activityLogs = [];

      // Process each product
      for (const item of products) {
        const { productId, stock } = item;

        // Find the product
        const product = await Service.findById(productId).session(session);
        if (!product) {
          throw new Error(`Product with ID ${productId} not found`);
        }

        // Verify product is of type 'product'
        if (product.serviceType !== "product") {
          // Changed from type to serviceType
          throw new Error(`Service with ID ${productId} is not a product`);
        }

        // Verify product belongs to the business
        if (product.businessId.toString() !== businessId) {
          throw new Error(
            `Product with ID ${productId} does not belong to this business`
          );
        }

        // Get previous stock for logging
        const previousStock = product.inventory || 0; // Changed from stock to inventory

        // Update product stock
        product.inventory = parseInt(stock as string); // Changed from stock to inventory
        await product.save({ session });

        updatedProducts.push(product);

        // Create activity log
        activityLogs.push({
          action: "INVENTORY_UPDATE",
          userId: req.user.id,
          businessId: product.businessId,
          details: `Stock for "${product.name}" updated from ${previousStock} to ${product.inventory}. Reason: ${reason || "Not specified"}`, // Changed from stock to inventory
        });
      }

      // Create all activity logs
      await ActivityLog.insertMany(activityLogs, { session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        message: "Product stock updated successfully",
        products: updatedProducts,
      });
    } catch (error) {
      // Abort the transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error: unknown) {
    console.error("❌ Batch update stock error:", error);
    return res.status(500).json({
      message: "Failed to update product stock",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get stock history for a product
 */
export const getStockHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;

    // Find the product
    const product = await Service.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Verify product is of type 'product'
    if (product.serviceType !== "product") {
      // Changed from type to serviceType
      return res.status(400).json({ message: "Service is not a product" });
    }

    // Verify business ownership
    const business = await Business.findById(product.businessId);
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
        .json({ message: "Not authorized to view this product's history" });
    }

    // Get stock history from activity logs
    const stockHistory = await ActivityLog.find({
      action: "INVENTORY_UPDATE",
      businessId: product.businessId,
      details: { $regex: product.name, $options: "i" },
    }).sort({ createdAt: -1 });

    return res.status(200).json(stockHistory);
  } catch (error) {
    console.error("❌ Get stock history error:", error);
    return res.status(500).json({ message: "Failed to get stock history" });
  }
};
