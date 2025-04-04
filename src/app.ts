import express from "express";
import cors from "cors";
import adminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";
import adminBusinessRoutes from "./routes/adminBusiness";
import adminUserRoutes from "./routes/adminUser";
import adminReviewRoutes from "./routes/adminReview";
import adminReportRoutes from "./routes/adminReport";
import adminSettingRoutes from "./routes/adminSetting";
import customerHomeRoutes from "./routes/customerHome";
import businessRoutes from "./routes/business";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin/businesses", adminBusinessRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/reviews", adminReviewRoutes);
app.use("/api/admin/reports", adminReportRoutes);
app.use("/api/admin/settings", adminSettingRoutes);
app.use("/api/customer", customerHomeRoutes);
app.use("/api/businesses", businessRoutes);

export default app;
