import express from "express";
import cors from "cors";
import adminRoutes from "./routes/admin";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/admin", adminRoutes);

export default app;
