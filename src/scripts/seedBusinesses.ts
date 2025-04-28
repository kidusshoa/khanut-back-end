import mongoose from "mongoose";
import { Business } from "../models/business";
import { User } from "../models/user";
import { Service } from "../models/service";
import dotenv from "dotenv";

dotenv.config();

// Function to create a service
const createService = async (
  name: string,
  businessId: mongoose.Types.ObjectId,
  type: string
) => {
  let price = 0;
  let serviceType: "appointment" | "product" | "in_person" = "in_person";

  // Set price and service type based on the service name
  if (
    name.toLowerCase().includes("coca") ||
    name.toLowerCase().includes("pepsi") ||
    name.toLowerCase().includes("fanta") ||
    name.toLowerCase().includes("water") ||
    name.toLowerCase().includes("tea") ||
    name.toLowerCase().includes("coffee") ||
    name.toLowerCase().includes("macciato") ||
    name.toLowerCase().includes("mirinda") ||
    name.toLowerCase().includes("juice")
  ) {
    price = Math.floor(Math.random() * 30) + 20; // 20-50 ETB for drinks
    serviceType = "product";
  } else if (
    name.toLowerCase().includes("shiro") ||
    name.toLowerCase().includes("beyeaynet") ||
    name.toLowerCase().includes("dinch") ||
    name.toLowerCase().includes("agelgel") ||
    name.toLowerCase().includes("special") ||
    name.toLowerCase().includes("sandwich") ||
    name.toLowerCase().includes("chips")
  ) {
    price = Math.floor(Math.random() * 100) + 50; // 50-150 ETB for food
    serviceType = "product";
  } else if (
    name.toLowerCase().includes("cleaning") ||
    name.toLowerCase().includes("fixing")
  ) {
    price = Math.floor(Math.random() * 50) + 30; // 30-80 ETB for services
    serviceType = "appointment";
  } else {
    price = Math.floor(Math.random() * 40) + 10; // 10-50 ETB for other items
    serviceType = "product";
  }

  // Create the service
  const service = new Service({
    name,
    description: `${name} service provided by ${type}`,
    price,
    businessId,
    serviceType,
    duration: serviceType === "appointment" ? 30 : undefined, // 30 minutes for appointments
    inventory:
      serviceType === "product"
        ? Math.floor(Math.random() * 50) + 10
        : undefined, // 10-60 items for products
  });

  await service.save();
  return service._id;
};

async function seedBusinesses() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/khanut";
    await mongoose.connect(uri);
    console.log("🛢️ Connected to MongoDB");

    // Business data
    const businessData = [
      {
        name: "Liyu Caffee",
        location: [42.036777, 9.424467], // MongoDB uses [longitude, latitude]
        category: "restaurant",
        services: [
          "Shiro",
          "Beyeaynet",
          "Dinch Wot",
          "Agelgel",
          "Asanbusa",
          "Coca Cola",
          "Pepsi",
          "Fanta",
          "Tea",
          "Coffee",
          "Macciato",
          "Sprigled Water",
        ],
        email: "liyucaffe@hotmail.com",
        phone: "+251913247867",
        city: "Haramaya",
        description:
          "Liyu Caffe is a cafe located in Haramaya University that provides delicious foods and soft drinks for customers. We are known with our treatment.",
        owner: {
          name: "Abebe Yosef",
          email: "abebe.yosef@example.com",
          password: "password123",
        },
      },
      {
        name: "Denbel",
        location: [42.03455, 9.424864],
        category: "restaurant",
        services: [
          "Shiro",
          "Beyeaynet",
          "Dinch Wot",
          "Agelgel",
          "Special Dinch",
          "Asanbusa",
          "Chips",
          "Coca Cola",
          "Pepsi",
          "Fanta",
          "Tea",
          "Coffee",
          "Macciato",
          "Sprigled Water",
        ],
        email: "denbelrestaurant@gmail.com",
        phone: "+251913564534",
        city: "Haramaya",
        description:
          "Denbel restaurant is a cafe located in Haramaya University that provides delicious foods and soft drinks for customers. We are known with our treatment.",
        owner: {
          name: "Bekele Dachasa",
          email: "bekele.dachasa@example.com",
          password: "password123",
        },
      },
      {
        name: "Welega Coffee Shop",
        location: [42.03455, 9.424864],
        category: "caffee/restaurant",
        services: [
          "Shiro",
          "Beyeaynet",
          "Special Aynet",
          "Agelgel",
          "Sandwich",
          "Asanbusa",
          "Chips",
          "Coca Cola",
          "Pepsi",
          "Fanta",
          "Tea",
          "Coffee",
          "Macciato",
          "Sprigled Water",
          "Milk",
        ],
        email: "wellegacaffe@gmail.com",
        phone: "+251978446543",
        city: "Haramaya",
        description:
          "Welega coffee is a cafe located in Haramaya University that provides delicious foods and soft drinks for customers. We are known with our treatment.",
        owner: {
          name: "Abdulmalik Abas",
          email: "abdulmalik.abas@example.com",
          password: "password123",
        },
      },
      {
        name: "KT Cafe and Restaurant",
        location: [42.030433233360505, 9.425440489012898],
        category: "restaurant",
        services: [
          "Shiro",
          "Beyeaynet",
          "Dinch Wot",
          "Agelgel",
          "Special Dinch",
          "Asanbusa",
          "Chips",
          "Coca Cola",
          "Pepsi",
          "Fanta",
          "Tea",
          "Coffee",
          "Macciato",
          "Sprigled Water",
          "Yoghurt",
        ],
        email: "ktcafe@gmail.com",
        phone: "+251913564534",
        city: "Haramaya",
        description:
          "KT cafe and restaurant is a cafe located in Haramaya University that provides delicious foods and soft drinks for customers. We are known with our treatment.",
        owner: {
          name: "Tewodros Endesha",
          email: "tewodros.endesha@example.com",
          password: "password123",
        },
      },
      {
        name: "Oromiya Shop",
        location: [42.032934, 9.424056],
        category: "shop",
        services: [
          "Coca Cola",
          "Pepsi",
          "Mirinda",
          "Juices",
          "Coffee",
          "Tea",
          "Sprigled Water",
          "Biscuits",
          "Candies",
          "Chocolates",
          "Snacks",
          "Boiled Eggs",
          "Asanbusa",
          "Pens",
        ],
        email: "oromiyashop@gmail.com",
        phone: "+251945564667",
        city: "Haramaya",
        description:
          "Oromia is a shop and mini coffee shop that was designed for students.",
        owner: {
          name: "Adulrahman Mustefa",
          email: "adulrahman.mustefa@example.com",
          password: "password123",
        },
      },
      {
        name: "Rauda Market",
        location: [42.03708468220415, 9.422744537836106],
        category: "shop",
        services: [
          "Coca Cola",
          "Pepsi",
          "Mirinda",
          "Juices",
          "Coffee",
          "Tea",
          "Sprigled Water",
          "Biscuits",
          "Candies",
          "Chocolates",
          "Snacks",
          "Hair Oils",
          "Tooth Brushes",
          "Lotions",
          "Body Jells",
          "Soaps",
        ],
        email: "raudaminmarket@gmail.com",
        phone: "+251911554422",
        city: "Haramaya",
        description:
          "Rauda market is a mini market that was designed for students.",
        owner: {
          name: "Yodit Menalu",
          email: "yodit.menalu@example.com",
          password: "password123",
        },
      },
      {
        name: "Magna Shoeshine",
        location: [42.033118365623416, 9.42377912957298],
        category: "shoeshine",
        services: [
          "Shoe Cleaning",
          "Shoe Fixing",
          "Socks",
          "Belts",
          "Underwears",
        ],
        email: "magnashoeshine@gmail.com",
        phone: "+251911554422",
        city: "Haramaya",
        description:
          "From shoe cleaning to shoe fixing, we do a lot of things in Magna Shoeshine.",
        owner: {
          name: "Baysa Gebeyew",
          email: "baysa.gebeyew@example.com",
          password: "password123",
        },
      },
    ];

    console.log("Starting to seed businesses...");

    // Keep existing businesses
    // await Business.deleteMany({});

    for (const business of businessData) {
      // Check if owner already exists
      let owner = await User.findOne({ email: business.owner.email });

      if (!owner) {
        // Create owner
        owner = new User({
          name: business.owner.name,
          email: business.owner.email,
          password: business.owner.password,
          role: "business",
        });

        await owner.save();
        console.log(`Created owner: ${owner.name}`);
      } else {
        console.log(`Owner already exists: ${owner.name}`);
      }

      // Check if business already exists
      const existingBusiness = await Business.findOne({
        name: business.name,
        ownerId: owner._id,
      });

      if (!existingBusiness) {
        // Create business
        const newBusiness = new Business({
          name: business.name,
          email: business.email,
          phone: business.phone,
          description: business.description,
          ownerId: owner._id,
          approved: true, // Auto-approve these seed businesses
          status: "approved",
          category: business.category,
          city: business.city,
          location: {
            type: "Point",
            coordinates: business.location,
          },
        });

        await newBusiness.save();
        console.log(`Created business: ${newBusiness.name}`);

        // Create services for the business
        const serviceIds: mongoose.Types.ObjectId[] = [];
        for (const serviceName of business.services) {
          const serviceId = await createService(
            serviceName,
            newBusiness._id as mongoose.Types.ObjectId,
            business.category
          );
          serviceIds.push(serviceId as mongoose.Types.ObjectId);
        }

        // Update business with services
        newBusiness.services = serviceIds;
        await newBusiness.save();
        console.log(
          `Added ${serviceIds.length} services to ${newBusiness.name}`
        );
      } else {
        console.log(`Business already exists: ${existingBusiness.name}`);
      }
    }

    console.log("✅ Businesses seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding businesses:", error);
    process.exit(1);
  }
}

seedBusinesses();
