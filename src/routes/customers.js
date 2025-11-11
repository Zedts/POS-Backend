import express from "express";
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  searchCustomers,
  getCustomerOrders,
  getCustomerOrderDetails,
  getTopSellingProducts,
  getActiveDiscounts,
} from "../controllers/customers.js";

const router = express.Router();

// Customer routes
router.get("/", getCustomers);
router.get("/search", searchCustomers);
router.get("/top-products", getTopSellingProducts);
router.get("/active-discounts", getActiveDiscounts);
router.get("/:id", getCustomerById);
router.post("/register", createCustomer);
router.put("/:id", updateCustomer);
router.get("/:id/orders", getCustomerOrders);
router.get("/:id/orders/:orderNumber", getCustomerOrderDetails);

export default router;
