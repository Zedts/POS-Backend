import express from "express";
import { getAllAuditLogs } from "../controllers/auditLogs.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Audit Logs Route
router.get("/", verifyToken, getAllAuditLogs);

export default router;
