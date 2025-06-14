import { Request, Response } from "express";
import { Business } from "../models/business";
import { Service } from "../models/service";
import { Types } from "mongoose";
import { ActivityLog } from "../models/activityLog";

interface AuthRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

export const registerBusiness = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      category,
      city,
      latitude,
      longitude,
      email,
      phone,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !description ||
      !category ||
      !city ||
      !latitude ||
      !longitude
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user already has a business
    const existingBusiness = await Business.findOne({ ownerId: req.user.id });
    if (existingBusiness) {
      return res.status(400).json({
        message: "You already have a registered business",
      });
    }

    const business = new Business({
      name,
      description,
      category,
      city,
      email,
      phone,
      ownerId: req.user.id,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      profilePicture: req.file ? (req.file as any).location : undefined,
    });

    await business.save();

    // Create activity log
    await ActivityLog.create({
      action: "BUSINESS_REGISTRATION",
      userId: req.user.id,
      details: `New business "${name}" registered`,
    });

    return res.status(201).json({
      message: "Business registered successfully. Pending approval.",
      business,
    });
  } catch (err) {
    console.error("❌ Business registration error:", err);
    return res.status(500).json({ message: "Failed to register business" });
  }
};

export const updateBusinessPicture = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    business.profilePicture = (req.file as any).location;
    await business.save();

    return res.json({
      message: "Business profile picture updated successfully",
      profilePicture: business.profilePicture,
    });
  } catch (err) {
    console.error("❌ Update business picture error:", err);
    return res
      .status(500)
      .json({ message: "Failed to update business picture" });
  }
};

export const addBusinessService = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, price, serviceType } = req.body;
    const images = req.files as Express.MulterS3.File[];

    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Determine if this is being called from the Products page
    const isProduct =
      req.originalUrl.includes("/products") ||
      req.get("Referer")?.includes("/products");

    // Log the request information for debugging
    console.log("Service creation request:", {
      body: req.body,
      originalUrl: req.originalUrl,
      referer: req.get("Referer"),
      isProduct,
    });

    const service = new Service({
      name,
      description,
      price: parseFloat(price),
      businessId: business._id,
      // Set serviceType based on explicit parameter, URL context, or default to "product"
      serviceType: serviceType || (isProduct ? "product" : "appointment"),
      images: images.map((file) => (file as any).location),
    });

    await service.save();
    business.services.push(service._id as Types.ObjectId);
    await business.save();

    return res.status(201).json({
      message: "Service added successfully",
      service,
    });
  } catch (err) {
    console.error("❌ Add service error:", err);
    return res.status(500).json({ message: "Failed to add service" });
  }
};

export const updateBusinessProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      name,
      description,
      category,
      city,
      email,
      phone,
      website,
      openingHours,
      socialMedia,
      latitude,
      longitude,
      address,
      businessType,
    } = req.body;

    // Find the business by owner ID
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Create a business document with the correct type
    const businessDoc = business as any;

    // Update business fields if provided
    if (name) businessDoc.name = name;
    if (description) businessDoc.description = description;
    if (category) businessDoc.category = category;
    if (city) businessDoc.city = city;
    if (email) businessDoc.email = email;
    if (phone) businessDoc.phone = phone;
    if (website) businessDoc.website = website;
    if (businessType) businessDoc.businessType = businessType;
    if (address) businessDoc.address = address;

    // Update location if both latitude and longitude are provided
    if (latitude && longitude) {
      businessDoc.location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    // Update opening hours if provided
    if (openingHours) {
      businessDoc.openingHours = openingHours;
    }

    // Update social media links if provided
    if (socialMedia) {
      businessDoc.socialMedia = socialMedia;
    }

    await businessDoc.save();

    // Create activity log
    await ActivityLog.create({
      action: "BUSINESS_UPDATE",
      userId: req.user.id,
      details: `Business "${businessDoc.name}" profile updated`,
    });

    return res.status(200).json({
      message: "Business profile updated successfully",
      business: businessDoc,
    });
  } catch (err) {
    console.error("❌ Update business profile error:", err);
    return res
      .status(500)
      .json({ message: "Failed to update business profile" });
  }
};
