import { Business } from "../src/models/business";
import { User } from "../src/models/user";

// Seed businesses with geolocation and valid ownerId
export const seedBusinesses = async () => {
  await Business.deleteMany({});

  // 1. Create a dummy business owner
  const owner = await User.create({
    name: "Kidus Shoa",
    email: "owner@khanut.com",
    password: "secure123", // will be hashed
    role: "business",
  });

  // 2. Seed businesses with coordinates (longitude, latitude)
  await Business.insertMany([
    {
      name: "Ethiopia Coffee House",
      location: {
        type: "Point",
        coordinates: [38.7578, 8.9806], // Addis Ababa
      },
      ownerId: owner._id,
      approved: true,
    },
    {
      name: "Sheger Tech Solutions",
      location: {
        type: "Point",
        coordinates: [41.9391, 9.4075], // Haramaya
      },
      ownerId: owner._id,
      approved: false,
    },
    {
      name: "Injera Restaurant",
      location: {
        type: "Point",
        coordinates: [37.3833, 11.5936], // Bahir Dar
      },
      ownerId: owner._id,
      approved: true,
    },
  ]);

  console.log("✅ Businesses seeded with geolocation");
};
