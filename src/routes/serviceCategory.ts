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

// Get all categories
router.get("/", getAllCategories);

// Get category by ID
router.get("/:categoryId", getCategoryById);

// Get services by category
router.get("/:categoryId/services", getServicesByCategory);

// Create a new category (admin only)
router.post("/", protect(["admin"]), isAdmin, createCategory);

// Update a category (admin only)
router.put("/:categoryId", protect(["admin"]), isAdmin, updateCategory);

// Delete a category (admin only)
router.delete("/:categoryId", protect(["admin"]), isAdmin, deleteCategory);

export default router;
