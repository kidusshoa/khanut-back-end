import { Router, Request, Response } from "express";
import {
  login,
  logout,
  refresh,
  register,
  request2FA,
  requestVerification,
  verify2FA,
  verifyEmail,
} from "../controllers/authController";

const router = Router();

router.post("/login", login as (req: Request, res: Response) => void);
router.post("/register", register as (req: Request, res: Response) => void);
router.post("/refresh", refresh as (req: Request, res: Response) => void);
router.post(
  "/request-verification",
  requestVerification as (req: Request, res: Response) => void
);
router.get(
  "/verify-email",
  verifyEmail as (req: Request, res: Response) => void
);
router.post("/logout", logout as (req: Request, res: Response) => void);
router.post(
  "/request-2fa",
  request2FA as (req: Request, res: Response) => void
);
router.post("/verify-2fa", verify2FA as (req: Request, res: Response) => void);

export default router;
