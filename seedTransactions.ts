import mongoose from "mongoose";
import { Transaction } from "./src/models/transaction";
import dotenv from "dotenv";

dotenv.config();

async function seedTransactions() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "", {
      dbName: "khanut",
    });

    const customerId = new mongoose.Types.ObjectId("67ebdd048a24e306093ac663");
    const businessId = new mongoose.Types.ObjectId("67ebe05157f9c08221cfd60f");

    const sampleTransactions = [
      {
        customerId,
        businessId,
        amount: 120.5,
        method: "telebirr",
        status: "completed",
        description: "Black Coffee",
        createdAt: new Date("2024-12-20"),
      },
      {
        customerId,
        businessId,
        amount: 250,
        method: "cbe birr",
        status: "completed",
        description: "Macchiato",
        createdAt: new Date("2025-01-15"),
      },
      {
        customerId,
        businessId,
        amount: 75,
        method: "amole",
        status: "pending",
        description: "Vanilla Cream",
        createdAt: new Date("2025-03-01"),
      },
    ];

    await Transaction.insertMany(sampleTransactions);
    console.log("✅ Sample transactions added.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seedTransactions();
