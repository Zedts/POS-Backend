import express from "express";
import { login, register } from "../controllers/login.js";

const router = express.Router();

// Login route
router.post("/login", login);

// Register route (Student only)
router.post("/register", register);

export default router;
