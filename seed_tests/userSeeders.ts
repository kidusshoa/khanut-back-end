import { User } from "./../src/models/user";
import bcrypt from "bcrypt";

export const seedUsers = async () => {
  await User.deleteMany({});

  const hashed = await bcrypt.hash("password123", 10);

  await User.insertMany([
    {
      name: "Admin",
      email: "admin@example.com",
      password: hashed,
      role: "admin",
    },
    {
      name: "Customer A",
      email: "customer@example.com",
      password: hashed,
      role: "customer",
    },
    {
      name: "Biz Owner",
      email: "biz@example.com",
      password: hashed,
      role: "business",
    },
  ]);

  console.log("✅ Users seeded");
};
