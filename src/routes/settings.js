import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getAdminProfile,
  updateAdminProfile,
  downloadBackup,
  resetDatabase,
  restoreDatabase
} from "../controllers/settings.js";

const router = express.Router();

// Settings Routes
router.get("/profile", verifyToken, getAdminProfile);
router.put("/profile", verifyToken, updateAdminProfile);
router.get("/backup", verifyToken, downloadBackup);
router.post("/reset", verifyToken, resetDatabase);
router.post("/restore", verifyToken, restoreDatabase);

export default router;
