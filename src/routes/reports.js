import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getSalesReport,
  getTopProducts,
  getDiscountUsage,
  getStockStatus,
  getStudentRevenueByClass,
  getStudentRevenueByMajor
} from '../controllers/reports.js';

const router = express.Router();

// All routes protected with JWT
router.get('/sales', verifyToken, getSalesReport);

// Report Routes
router.get('/top-products', verifyToken, getTopProducts);
router.get('/discount-usage', verifyToken, getDiscountUsage);
router.get('/stock-status', verifyToken, getStockStatus);
router.get('/student-revenue/class', verifyToken, getStudentRevenueByClass);
router.get('/student-revenue/major', verifyToken, getStudentRevenueByMajor);

export default router;
