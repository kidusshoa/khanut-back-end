import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { seedUsers } from "./userSeeders";
import { seedBusinesses } from "./businessSeeder";
import { seedReviews } from "./reviewSeeder";
import { seedActivityLogs } from "./activityLogSeeder";
import { Business } from "../src/models/business";

async function seed() {
  try {
    // const uri = process.env.MONGO_URI;
    // if (!uri) throw new Error("MONGO_URI is missing from environment");

    const uri =
      "mongodb+srv://captainkevin2008:A1ajXd7vDsiRsD1S@clustera.9x1ecan.mongodb.net/khanut?retryWrites=true&w=majority&appName=ClusterA";
    await mongoose.connect(uri);
    console.log("🛢️ Connected to MongoDB");

    //await seedUsers();
    //await seedBusinesses();
    //await seedReviews();
    //await seedActivityLogs();
    
     await Business.insertMany([
    {
      name: "Awash Bank",
      ownerId: someOwnerId, // You need to assign valid user _id
      location: {
        type: "Point",
        coordinates: [38.75, 9.03],
      },
      address: "Bole, Addis Ababa",
      approved: true,
      rating: 4.8,
      description: "One of the leading banks in Ethiopia",
    },
    {
      name: "Addis Mart",
      ownerId: someOwnerId,
      location: {
        type: "Point",
        coordinates: [39.2, 9.1],
      },
      address: "Megenagna, Addis Ababa",
      approved: true,
      rating: 4.5,
      description: "A modern supermarket for everyday needs",
    },
    {
      name: "Sholla Cafe",
      ownerId: someOwnerId,
      location: {
        type: "Point",
        coordinates: [38.7, 9.02],
      },
      address: "4 Kilo, Addis Ababa",
      approved: true,
      rating: 4.7,
      description: "Best traditional coffee and fast Wi-Fi",
    },
    {
      name: "Dire Electronics",
      ownerId: someOwnerId,
      location: {
        type: "Point",
        coordinates: [41.86, 9.6],
      },
      address: "Dire Dawa Center",
      approved: true,
      rating: 4.6,
      description: "Your go-to for gadgets and repairs",
    },
    {
      name: "Gonder Bookstore",
      ownerId: someOwnerId,
      location: {
        type: "Point",
        coordinates: [37.46, 12.6],
      },
      address: "Piassa, Gonder",
      approved: true,
      rating: 4.9,
      description: "Books, stationery, and coffee in one place",
    },
  ]);

  console.log("✅ Seeded top-rated businesses");

    console.log("🌱 All data seeded successfully");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

seed();
