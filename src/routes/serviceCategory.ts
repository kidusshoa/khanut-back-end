import { Router } from "express";
import { 
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getServicesByCategory
} from "../controllers/serviceCategoryController";
import { auth } from "../middleware/auth";
import { isAdmin } from "../middleware/isAdmin";

const router = Router();

// Get all categories
router.get("/", getAllCategories);

// Get category by ID
router.get("/:categoryId", getCategoryById);

// Get services by category
router.get("/:categoryId/services", getServicesByCategory);

// Create a new category (admin only)
router.post("/", auth, isAdmin, createCategory);

// Update a category (admin only)
router.put("/:categoryId", auth, isAdmin, updateCategory);

// Delete a category (admin only)
router.delete("/:categoryId", auth, isAdmin, deleteCategory);

export default router;
