import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { checkDatabaseConnection } from "./src/config/dbConnection.js";
import loginRoutes from "./src/routes/login.js";
import dashboardRoutes from "./src/routes/dashboard.js";
import productsRoutes from "./src/routes/products.js";
import categoryRoutes from "./src/routes/category.js";
import discountRoutes from "./src/routes/discount.js";
import ordersRoutes from "./src/routes/orders.js";
import invoicesRoutes from "./src/routes/invoices.js";
import studentsRoutes from "./src/routes/students.js";
import customersRoutes from "./src/routes/customers.js";
import reportsRoutes from "./src/routes/reports.js";
import priceHistoryRoutes from "./src/routes/priceHistory.js";
import auditLogsRoutes from "./src/routes/auditLogs.js";
import settingsRoutes from "./src/routes/settings.js";

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
app.use("/api/categories", categoryRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/price-history", priceHistoryRoutes);
app.use("/api/audit-logs", auditLogsRoutes);
app.use("/api/settings", settingsRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "POS Backend API is running" });
});

// Start server with database check
app.listen(PORT, async () => {
  console.log(`Server running on http://${HOSTNAME}:${PORT}`);
  await checkDatabaseConnection();
});