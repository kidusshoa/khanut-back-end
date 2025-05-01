import mongoose from "mongoose";
import { User } from "../src/models/user";
import { Business } from "../src/models/business";
import { Service } from "../src/models/service";
import { Review } from "../src/models/review";
import bcrypt from "bcryptjs";
import "dotenv/config";

async function seedTestData() {
  try {
    // Connect to MongoDB
    const uri =
      process.env.MONGO_URI ||
      "mongodb+srv://captainkevin2008:A1ajXd7vDsiRsD1S@clustera.9x1ecan.mongodb.net/khanut?retryWrites=true&w=majority&appName=ClusterA";
    await mongoose.connect(uri);
    console.log("🛢️ Connected to MongoDB");

    // Create test users
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Create business owner with unique email
    const timestamp = Date.now();
    const businessOwner = new User({
      name: "Business Owner",
      email: `business_${timestamp}@example.com`,
      password: hashedPassword,
      role: "business",
      phone: "+251911223344",
      verified: true,
    });
    await businessOwner.save();
    console.log("Created business owner:", businessOwner._id);

    // Create customer with unique email
    const customer = new User({
      name: "Test Customer",
      email: `customer_${timestamp}@example.com`,
      password: hashedPassword,
      role: "customer",
      phone: "+251922334455",
      verified: true,
    });
    await customer.save();
    console.log("Created customer:", customer._id);

    // Create test business
    const business = new Business({
      name: "Test Business",
      description: "This is a test business with various services",
      category: "Technology",
      city: "Addis Ababa",
      email: "contact@testbusiness.com",
      phone: "+251911223344",
      ownerId: businessOwner._id,
      location: {
        type: "Point",
        coordinates: [38.7578, 9.0222], // Addis Ababa coordinates
      },
      profilePicture: "https://placehold.co/600x400?text=Test+Business",
      approved: true,
      status: "approved",
    });
    await business.save();
    console.log("Created business:", business._id);

    // Create test services
    const services = [
      // Appointment service
      new Service({
        name: "Tech Consultation",
        description: "One-on-one consultation for your tech needs",
        price: 500,
        businessId: business._id,
        serviceType: "appointment",
        duration: 60, // 60 minutes
        images: ["https://placehold.co/600x400?text=Tech+Consultation"],
        availability: {
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          startTime: "09:00",
          endTime: "17:00",
        },
      }),
      // Product service
      new Service({
        name: "Laptop Bag",
        description: "High-quality laptop bag with multiple compartments",
        price: 1200,
        businessId: business._id,
        serviceType: "product",
        inventory: 15,
        images: ["https://placehold.co/600x400?text=Laptop+Bag"],
      }),
      // In-person service
      new Service({
        name: "Computer Repair",
        description: "On-site computer repair service",
        price: 800,
        businessId: business._id,
        serviceType: "in_person",
        images: ["https://placehold.co/600x400?text=Computer+Repair"],
      }),
    ];

    for (const service of services) {
      await service.save();
      console.log(`Created service: ${service.name} (${service._id})`);

      // Add service to business
      business.services.push(service._id as any);
    }

    await business.save();

    // Create test reviews
    const reviews = [
      new Review({
        businessId: business._id,
        authorId: customer._id,
        rating: 5,
        comment: "Excellent service! Highly recommended.",
      }),
      new Review({
        businessId: business._id,
        authorId: customer._id,
        rating: 4,
        comment: "Good service but a bit expensive.",
      }),
    ];

    for (const review of reviews) {
      await review.save();
      console.log(`Created review: ${review._id}`);
    }

    console.log("✅ Test data seeded successfully!");
    console.log(`Business ID: ${business._id}`);
    console.log(`Business Owner ID: ${businessOwner._id}`);
    console.log(`Customer ID: ${customer._id}`);
  } catch (error) {
    console.error("❌ Error seeding test data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedTestData();
