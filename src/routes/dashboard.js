import express from "express";
import DashboardController from "../controllers/dashboard.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Get dashboard data (protected route)
router.get("/data", verifyToken, DashboardController.getDashboardData);

export default router;
