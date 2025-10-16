import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { checkDatabaseConnection } from "./src/config/dbConnection.js";
import loginRoutes from "./src/routes/login.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const HOSTNAME = process.env.HOSTNAME;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", loginRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "POS Backend API is running" });
});

// Start server with database check
app.listen(PORT, async () => {
  console.log(`Server running on http://${HOSTNAME}:${PORT}`);
  await checkDatabaseConnection();
});