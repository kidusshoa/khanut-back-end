import { ActivityLog } from "../models/activityLog";

export const logActivity = async (message: string) => {
  await ActivityLog.create({ message });
};
