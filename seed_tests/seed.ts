import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { seedUsers } from "./userSeeders";
import { seedBusinesses } from "./businessSeeder";
import { seedReviews } from "./reviewSeeder";
import { seedActivityLogs } from "./activityLogSeeder";

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
    await seedReviews();
    await seedActivityLogs();

    console.log("🌱 All data seeded successfully");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

seed();
