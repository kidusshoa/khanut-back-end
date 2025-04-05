import mongoose from "mongoose";
import { Notification } from "./src/models/notification"; // adjust path if needed
import dotenv from "dotenv";

dotenv.config();

async function seedNotifications() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "", {
      dbName: "khanut", // optional
    });

    const userId = new mongoose.Types.ObjectId("67ebdd048a24e306093ac663");

    const notifications = [
      {
        userId,
        type: "warning",
        message: "Please update your profile information.",
        read: false,
        createdAt: new Date("2024-12-10"),
      },
      {
        userId,
        type: "update",
        message: "Your review has been rejected by admin.",
        read: false,
        createdAt: new Date("2025-01-05"),
      },
      {
        userId,
        type: "update",
        message:
          "New feature added to Khanut — explore nearby businesses easily!",
        read: false,
        createdAt: new Date("2025-03-15"),
      },
    ];

    await Notification.insertMany(notifications);
    console.log("✅ Notifications seeded successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seedNotifications();
