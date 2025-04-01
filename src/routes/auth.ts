import { Router, Request, Response } from "express";
import {
  login,
  logout,
  refresh,
  register,
  request2FA,
  verify2FA,
} from "../controllers/authController";

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Email not verified
 */
router.post("/login", login as (req: Request, res: Response) => void);
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, business, customer]
 *     responses:
 *       201:
 *         description: User registered, check email
 *       400:
 *         description: Email already exists or invalid role
 *       500:
 *         description: Server error
 */
router.post("/register", register as (req: Request, res: Response) => void);
/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token
 *       401:
 *         description: No token
 *       403:
 *         description: Invalid or blacklisted token
 */
router.post("/refresh", refresh as (req: Request, res: Response) => void);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out and blacklist refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out
 *       400:
 *         description: Token required
 */
router.post("/logout", logout as (req: Request, res: Response) => void);
/**
 * @swagger
 * /api/auth/request-2fa:
 *   post:
 *     summary: Request a 2FA code via email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: 2FA code sent
 *       404:
 *         description: User not found
 */
router.post(
  "/request-2fa",
  request2FA as (req: Request, res: Response) => void
);
/**
 * @swagger
 * /api/auth/verify-2fa:
 *   post:
 *     summary: Verify a 2FA code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: 2FA verified
 *       400:
 *         description: Invalid or expired code
 */
router.post("/verify-2fa", verify2FA as (req: Request, res: Response) => void);

export default router;
