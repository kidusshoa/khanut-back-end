import { ActivityLog } from "../models/activityLog";
import { User } from "../models/user";
import { Business } from "../models/business";

interface ActivityLogData {
  message: string;
  userId?: string;
  businessId?: string;
  type?: string;
}

export const logActivity = async (data: ActivityLogData | string) => {
  // Handle the case where data is just a string (for backward compatibility)
  if (typeof data === "string") {
    await ActivityLog.create({ message: data });
    return;
  }

  // Create the activity log with the provided data
  const { message, userId, businessId, type } = data;
  const logData: any = { message };

  // Add type if provided
  if (type) {
    logData.type = type;
  }

  // Store user and business names if IDs are provided
  if (userId) {
    const user = await User.findById(userId);
    if (user) {
      logData.userId = userId;
      logData.userName = user.name;
    }
  }

  if (businessId) {
    const business = await Business.findById(businessId);
    if (business) {
      logData.businessId = businessId;
      logData.businessName = business.name;
    }
  }

  await ActivityLog.create(logData);
};
