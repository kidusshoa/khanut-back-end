import { Router } from "express";
import {
  getSettings,
  updateSettings,
  addAdmin,
  changePassword,
} from "../controllers/adminController";

const router = Router();

router.get("/settings", getSettings);
router.patch("/settings", updateSettings);
router.post("/users", addAdmin);
router.post("/change-password", changePassword);

export default router;
