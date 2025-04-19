import { Router } from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getServicesByCategory,
} from "../controllers/serviceCategoryController";
import { protect } from "../middleware/auth";
import { isAdmin } from "../middleware/isAdmin";

const router = Router();

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all service categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of all service categories
 */
router.get("/", getAllCategories);

/**
 * @swagger
 * /api/categories/{categoryId}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
 */
router.get("/:categoryId", getCategoryById);

/**
 * @swagger
 * /api/categories/{categoryId}/services:
 *   get:
 *     summary: Get services by category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [appointment, product, uniform]
 *         description: Filter by service type
 *     responses:
 *       200:
 *         description: List of services in the category
 *       404:
 *         description: Category not found
 */
router.get("/:categoryId/services", getServicesByCategory);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not an admin)
 */
router.post("/", protect(["admin"]), isAdmin, createCategory);

/**
 * @swagger
 * /api/categories/{categoryId}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not an admin)
 *       404:
 *         description: Category not found
 */
router.put("/:categoryId", protect(["admin"]), isAdmin, updateCategory);

/**
 * @swagger
 * /api/categories/{categoryId}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not an admin)
 *       404:
 *         description: Category not found
 */
router.delete("/:categoryId", protect(["admin"]), isAdmin, deleteCategory);

export default router;
