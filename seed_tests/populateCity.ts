// scripts/populateCity.ts

import mongoose from "mongoose";
import { Business } from "../src/models/business"; // adjust if needed
import dotenv from "dotenv";

dotenv.config();

async function updateCities() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log("🛢️ Connected to MongoDB");

  const updates = [
    { name: "Awash Bank", city: "Addis Ababa" },
    { name: "Sholla Cafe", city: "Hawassa" },
    { name: "Addis Mart", city: "Addis Ababa" },
    { name: "Dire Electronics", city: "Dire Dawa" },
    { name: "Gonder Bookstore", city: "Gondar" },
  ];

  for (const item of updates) {
    const updated = await Business.findOneAndUpdate(
      { name: item.name },
      { $set: { city: item.city } },
      { new: true }
    );

    if (updated) {
      console.log(`✅ Updated ${item.name} with city: ${item.city}`);
    } else {
      console.warn(`⚠️ Could not find ${item.name}`);
    }
  }

  await mongoose.disconnect();
  console.log("✅ Done and disconnected");
}

updateCities().catch((err) => {
  console.error("❌ Error updating cities:", err);
});
