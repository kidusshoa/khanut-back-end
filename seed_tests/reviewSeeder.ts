import { Review } from "../src/models/review";
import { User } from "../src/models/user";
import { Business } from "../src/models/business";

export const seedReviews = async () => {
  await Review.deleteMany({});

  // Get a sample user and business
  const author = await User.findOne({ role: "customer" });
  const business = await Business.findOne();

  if (!author || !business) {
    throw new Error("Missing author or business to seed reviews.");
  }

  await Review.insertMany([
    {
      authorId: author._id,
      businessId: business._id,
      rating: 5,
      comment: "Amazing experience!",
      status: "approved",
    },
    {
      authorId: author._id,
      businessId: business._id,
      rating: 4,
      comment: "Great service, will come again.",
      status: "pending",
    },
    {
      authorId: author._id,
      businessId: business._id,
      rating: 2,
      comment: "Service was slow but food was good.",
      status: "pending",
    },
  ]);

  console.log("✅ Reviews seeded");
};
