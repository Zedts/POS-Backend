import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getProductsByCategory,
  getCategoryStats,
} from "../controllers/category.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Category CRUD routes
router.get("/", getAllCategories);
router.get("/stats", getCategoryStats);
router.get("/:id", getCategoryById);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

// Get products by category
router.get("/:id/products", getProductsByCategory);

export default router;
