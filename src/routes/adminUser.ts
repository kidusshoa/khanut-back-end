import { Router, Request, Response, RequestHandler } from "express";
import { isAdmin } from "../middleware/isAdmin";
import {
  deleteUser,
  getAllUsers,
  getUserById,
  warnUser,
} from "../controllers/adminUserController";

const router = Router();

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (excluding admins)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", isAdmin, getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile
 *       404:
 *         description: User not found
 */
router.get("/:id", isAdmin, getUserById);

/**
 * @swagger
 * /api/admin/users/{id}/warn:
 *   post:
 *     summary: Warn a user with a reason
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user to warn
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Violation of community guidelines
 *     responses:
 *       200:
 *         description: User warned successfully
 *       400:
 *         description: Reason is required
 *       404:
 *         description: User not found
 */
router.post(
  "/:id/warn",
  isAdmin,
  warnUser as unknown as (req: Request, res: Response) => void
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete (remove) a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete(
  "/:id",
  isAdmin,
  deleteUser as unknown as (req: Request, res: Response) => void
);
export default router;
