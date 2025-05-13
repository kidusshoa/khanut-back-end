import { Request, Response } from "express";
import { Service, ServiceType } from "../models/service";
import { Product } from "../models/product";
import { Business } from "../models/business";
import mongoose from "mongoose";

// Get all services
export const getAllServices = async (req: Request, res: Response) => {
  try {
    const services = await Service.find()
      .populate("businessId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all services for a business
export const getBusinessServices = async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    const { serviceType } = req.query;

    console.log("Fetching business services with params:", {
      businessId,
      serviceType,
      query: req.query,
    });

    // Build the query
    const query: any = { businessId };

    // Add serviceType filter if provided
    if (
      serviceType &&
      ["appointment", "product", "in_person"].includes(serviceType as string)
    ) {
      query.serviceType = serviceType;
    }

    const services = await Service.find(query);

    console.log(`Found ${services.length} services for business ${businessId}`);

    // Log service types for debugging
    const serviceTypes = services.reduce(
      (acc: Record<string, number>, service) => {
        acc[service.serviceType] = (acc[service.serviceType] || 0) + 1;
        return acc;
      },
      {}
    );

    console.log("Service types distribution:", serviceTypes);

    return res.status(200).json(services);
  } catch (error) {
    console.error("Error fetching business services:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get service by ID
export const getServiceById = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // If it's a product, get additional product details
    if (service.serviceType === "product") {
      const product = await Product.findOne({ serviceId: service._id });
      if (product) {
        return res
          .status(200)
          .json({ ...service.toObject(), productDetails: product });
      }
    }

    return res.status(200).json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Create a new service
export const createService = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name,
      description,
      price,
      businessId,
      serviceType,
      availability,
      duration,
      inventory,
      // Product specific fields
      sku,
      weight,
      dimensions,
      shippingInfo,
    } = req.body;

    // Check if business exists
    const business = await Business.findById(businessId);
    if (!business) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Business not found" });
    }

    // Create the service
    const newService = new Service({
      name,
      description,
      price,
      businessId,
      serviceType,
      availability,
      duration: serviceType === "appointment" ? duration : undefined,
      inventory: serviceType === "product" ? inventory : undefined,
      images: req.files
        ? (req.files as Express.Multer.File[]).map((file) => file.path)
        : [],
    });

    await newService.save({ session });

    // If it's a product, create product details
    if (serviceType === "product" && sku) {
      const newProduct = new Product({
        serviceId: newService._id,
        sku,
        inventory: inventory || 0,
        weight,
        dimensions,
        shippingInfo,
      });

      await newProduct.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(newService);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error creating service:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update a service
export const updateService = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { serviceId } = req.params;
    const {
      name,
      description,
      price,
      serviceType,
      availability,
      duration,
      inventory,
      // Product specific fields
      sku,
      weight,
      dimensions,
      shippingInfo,
    } = req.body;

    // Find the service
    const service = await Service.findById(serviceId);
    if (!service) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Service not found" });
    }

    // Update service fields
    if (name) service.name = name;
    if (description) service.description = description;
    if (price) service.price = price;
    if (serviceType) service.serviceType = serviceType as ServiceType;
    if (availability) service.availability = availability;

    if (serviceType === "appointment" && duration) {
      service.duration = duration;
    }

    if (serviceType === "product" && inventory !== undefined) {
      service.inventory = inventory;
    }

    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      service.images = (req.files as Express.Multer.File[]).map(
        (file) => file.path
      );
    }

    await service.save({ session });

    // If it's a product, update product details
    if (serviceType === "product") {
      let product = await Product.findOne({ serviceId: service._id });

      if (product) {
        // Update existing product
        if (sku) product.sku = sku;
        if (inventory !== undefined) product.inventory = inventory;
        if (weight) product.weight = weight;
        if (dimensions) product.dimensions = dimensions;
        if (shippingInfo) product.shippingInfo = shippingInfo;

        await product.save({ session });
      } else if (sku) {
        // Create new product if it doesn't exist
        const newProduct = new Product({
          serviceId: service._id,
          sku,
          inventory: inventory || 0,
          weight,
          dimensions,
          shippingInfo,
        });

        await newProduct.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(service);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error updating service:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete a service
export const deleteService = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { serviceId } = req.params;

    // Find the service
    const service = await Service.findById(serviceId);
    if (!service) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Service not found" });
    }

    // If it's a product, delete product details
    if (service.serviceType === "product") {
      await Product.findOneAndDelete({ serviceId: service._id }, { session });
    }

    // Delete the service
    await Service.findByIdAndDelete(serviceId, { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error deleting service:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get services by type
export const getServicesByType = async (req: Request, res: Response) => {
  try {
    const { businessId, type } = req.params;

    if (!["appointment", "product", "in_person"].includes(type)) {
      return res.status(400).json({ message: "Invalid service type" });
    }

    const services = await Service.find({
      businessId,
      serviceType: type as ServiceType,
    });

    return res.status(200).json(services);
  } catch (error) {
    console.error("Error fetching services by type:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
