import mongoose from "mongoose";
import { Business } from "../models/business";
import { User } from "../models/user";
import dotenv from "dotenv";

dotenv.config();

async function seedBusinesses() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/khanut";
    await mongoose.connect(uri);
    console.log("🛢️ Connected to MongoDB");

    // Find a business owner user
    const businessOwner = await User.findOne({ role: "business" });
    
    if (!businessOwner) {
      console.error("❌ No business owner found. Please create a business owner user first.");
      process.exit(1);
    }

    // Sample businesses with proper geospatial data
    const businesses = [
      {
        name: "Addis Coffee House",
        description: "A cozy cafe with great coffee and pastries",
        category: "Cafe",
        city: "Addis Ababa",
        ownerId: businessOwner._id,
        location: {
          type: "Point",
          coordinates: [38.7578, 9.0222], // Addis Ababa
        },
        approved: true,
        profilePicture: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=1000&auto=format&fit=crop",
        rating: 4.5,
      },
      {
        name: "Habesha Restaurant",
        description: "Traditional Ethiopian cuisine in a beautiful setting",
        category: "Restaurant",
        city: "Addis Ababa",
        ownerId: businessOwner._id,
        location: {
          type: "Point",
          coordinates: [38.7630, 9.0265], // Addis Ababa
        },
        approved: true,
        profilePicture: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000&auto=format&fit=crop",
        rating: 4.8,
      },
      {
        name: "Sheger Tech Solutions",
        description: "IT services and computer repairs",
        category: "Technology",
        city: "Addis Ababa",
        ownerId: businessOwner._id,
        location: {
          type: "Point",
          coordinates: [38.7700, 9.0300], // Addis Ababa
        },
        approved: true,
        profilePicture: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1000&auto=format&fit=crop",
        rating: 4.2,
      },
      {
        name: "Abyssinia Spa",
        description: "Relaxing spa treatments and massages",
        category: "Health & Beauty",
        city: "Addis Ababa",
        ownerId: businessOwner._id,
        location: {
          type: "Point",
          coordinates: [38.7550, 9.0180], // Addis Ababa
        },
        approved: true,
        profilePicture: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?q=80&w=1000&auto=format&fit=crop",
        rating: 4.7,
      },
      {
        name: "Merkato Market Shop",
        description: "Traditional crafts and souvenirs",
        category: "Retail",
        city: "Addis Ababa",
        ownerId: businessOwner._id,
        location: {
          type: "Point",
          coordinates: [38.7400, 9.0350], // Addis Ababa
        },
        approved: true,
        profilePicture: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=1000&auto=format&fit=crop",
        rating: 4.3,
      }
    ];

    // Clear existing businesses
    await Business.deleteMany({});
    
    // Insert new businesses
    await Business.insertMany(businesses);
    
    console.log("✅ Businesses seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding businesses:", error);
    process.exit(1);
  }
}

seedBusinesses();
