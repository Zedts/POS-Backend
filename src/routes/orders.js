import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getOrders,
  getOrderByNumber,
  getOrderStats,
  updateOrderStatus,
  createOrder
} from '../controllers/orders.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Order routes
router.get('/', getOrders);
router.get('/stats', getOrderStats);
router.post('/', createOrder);
router.get('/:orderNumber', getOrderByNumber);
router.put('/:orderNumber/status', updateOrderStatus);

export default router;
