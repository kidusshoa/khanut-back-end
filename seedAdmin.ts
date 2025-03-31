import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "./src/models/user";

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);
  await User.deleteMany({ email: "test@example.com" });

  const user = await User.create({
    name: "Test Admin",
    email: "test@example.com",
    password: "password123", // raw password
    role: "admin",
    verified: true,
    notify: true,
  });

  console.log("✅ Seeded:", user.email);
  mongoose.disconnect();
}

seed();
