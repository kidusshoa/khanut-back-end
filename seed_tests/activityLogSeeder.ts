import { ActivityLog } from "./../src/models/activityLog";

export const seedActivityLogs = async () => {
  await ActivityLog.deleteMany({});

  await ActivityLog.insertMany([
    { message: "New business submitted" },
    { message: "Admin approved a business" },
    { message: "User left a review" },
  ]);

  console.log("✅ Activity Logs seeded");
};
