import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getOrders,
  getOrderByNumber,
  getOrderStats,
  updateOrderStatus
} from '../controllers/orders.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Order routes
router.get('/', getOrders);
router.get('/stats', getOrderStats);
router.get('/:orderNumber', getOrderByNumber);
router.put('/:orderNumber/status', updateOrderStatus);

export default router;
