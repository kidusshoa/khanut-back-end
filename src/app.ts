import express from "express";
import { corsMiddleware } from "./config/cors";
import cors from "cors";
import { requestLogger } from "./utils/logger";
import adminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";
import adminBusinessRoutes from "./routes/adminBusiness";
import adminUserRoutes from "./routes/adminUser";
import adminReviewRoutes from "./routes/adminReview";
import adminReportRoutes from "./routes/adminReport";
import adminSettingRoutes from "./routes/adminSetting";
import adminRecommendationRoutes from "./routes/adminRecommendation";
import adminRevenueRoutes from "./routes/adminRevenue";
import webhookRoutes from "./routes/webhook";
import customerHomeRoutes from "./routes/customerHome";
import customerDashboardRoutes from "./routes/customerDashboard";
import cartRoutes from "./routes/cart";
import businessAnalyticsRoutes from "./routes/businessAnalytics";
import inventoryRoutes from "./routes/inventory";
import businessRoutes from "./routes/business";
import businessDetailRoutes from "./routes/businessDetail";
import businessStatusRoutes from "./routes/businessStatus";
import businessNotificationRoutes from "./routes/businessNotification";
import searchRoutes from "./routes/search";
import customerProfileRoutes from "./routes/customerProfile";
import favoriteRoutes from "./routes/favorites";
import customerTransactionRoutes from "./routes/customerTransaction";
import notificationRoutes from "./routes/notification";
import uploadRoutes from "./routes/upload";
import locationRoutes from "./routes/location";

// New service type routes
import serviceRoutes from "./routes/service";
import appointmentRoutes from "./routes/appointment";
import orderRoutes from "./routes/order";
import paymentRoutes from "./routes/payment";
import serviceReviewRoutes from "./routes/serviceReview";
import reviewRoutes from "./routes/reviews";
import serviceCategoryRoutes from "./routes/serviceCategory";

// Staff management routes
import staffRoutes from "./routes/staff";
import recurringAppointmentRoutes from "./routes/recurringAppointment";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Enable preflight requests for all routes
app.options("*", corsMiddleware);

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Admin routes
app.use("/api/admin", adminRoutes);
app.use("/api/admin/businesses", adminBusinessRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/reviews", adminReviewRoutes);
app.use("/api/admin/reports", adminReportRoutes);
app.use("/api/admin/settings", adminSettingRoutes);
app.use("/api/admin/recommendations", adminRecommendationRoutes);
app.use("/api/admin", adminRevenueRoutes);
app.use("/api/webhook", webhookRoutes);

// Auth routes
app.use("/api/auth", authRoutes);

// Business routes
app.use("/api/businesses", businessRoutes);
app.use("/api/businesses", locationRoutes); // Put location routes before detail routes
app.use("/api/businesses", businessDetailRoutes);
app.use("/api/business", businessStatusRoutes);
app.use("/api/business/notifications", businessNotificationRoutes);

// Customer routes
app.use("/api/customer", customerHomeRoutes);
app.use("/api/customer", customerProfileRoutes);
app.use("/api/customer", customerTransactionRoutes);
app.use("/api/customer/favorites", favoriteRoutes);
app.use("/api/customer/dashboard", customerDashboardRoutes);
app.use("/api/customer/cart", cartRoutes);

// Other routes
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/upload", uploadRoutes);

// Service type routes
app.use("/api/services", serviceRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/service-reviews", serviceReviewRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/categories", serviceCategoryRoutes);

// Staff management routes
app.use("/api/staff", staffRoutes);
app.use("/api/recurring-appointments", recurringAppointmentRoutes);

// Analytics and inventory routes
app.use("/api/analytics", businessAnalyticsRoutes);
app.use("/api/inventory", inventoryRoutes);

export default app;
