import express from "express";
import { corsMiddleware } from "./config/cors";
import adminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";
import adminBusinessRoutes from "./routes/adminBusiness";
import adminUserRoutes from "./routes/adminUser";
import adminReviewRoutes from "./routes/adminReview";
import adminReportRoutes from "./routes/adminReport";
import adminSettingRoutes from "./routes/adminSetting";
import customerHomeRoutes from "./routes/customerHome";
import businessRoutes from "./routes/business";
import businessDetailRoutes from "./routes/businessDetail";
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

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

const app = express();
app.use(corsMiddleware);
app.use(express.json());

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

// Auth routes
app.use("/api/auth", authRoutes);

// Business routes
app.use("/api/businesses", businessRoutes);
app.use("/api/businesses", locationRoutes); // Put location routes before detail routes
app.use("/api/businesses", businessDetailRoutes);

// Customer routes
app.use("/api/customer", customerHomeRoutes);
app.use("/api/customer", customerProfileRoutes);
app.use("/api/customer", customerTransactionRoutes);
app.use("/api/customer/favorites", favoriteRoutes);

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

export default app;
