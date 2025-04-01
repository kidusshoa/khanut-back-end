import express from "express";
import cors from "cors";
import adminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";
import adminBusinessRoutes from "./routes/adminBusiness";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin/businesses", adminBusinessRoutes);

export default app;
