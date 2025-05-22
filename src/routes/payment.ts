import { Router } from "express";
import {
  payAppointment,
  webHook,
} from "../controllers/paymentController";
import { protect } from "../middleware/auth";

import { isCustomer } from "../middleware/isCustomer";

const router = Router();


router.post(
  "/appointment/:appointmentId/pay",
  protect(["customer"]),
  isCustomer,
  payAppointment
);

router.post("/webhook", webHook)





export default router;
