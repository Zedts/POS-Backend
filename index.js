import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { checkDatabaseConnection } from "./src/config/dbConnection.js";
import loginRoutes from "./src/routes/login.js";
import dashboardRoutes from "./src/routes/dashboard.js";
import productsRoutes from "./src/routes/products.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT;
const HOSTNAME = process.env.HOSTNAME;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/auth", loginRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/products", productsRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "POS Backend API is running" });
});

// Start server with database check
app.listen(PORT, async () => {
  console.log(`Server running on http://${HOSTNAME}:${PORT}`);
  await checkDatabaseConnection();
});