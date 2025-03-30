// seedAdmin.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { User } from "./src/models/user"; // adjust path as needed

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);
  const hashed = await bcrypt.hash("password123", 10);

  const user = await User.create({
    name: "Test Admin",
    email: "test@example.com",
    password: hashed,
    role: "admin",
    verified: true,
  });

  console.log("✅ Seeded user:", user.email);
  process.exit();
}

seed();
