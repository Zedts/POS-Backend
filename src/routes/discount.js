import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getDiscountStats,
  validateDiscountCode
} from '../controllers/discount.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Discount routes
router.get('/', getDiscounts);
router.get('/stats', getDiscountStats);
router.post('/validate', validateDiscountCode);
router.get('/:id', getDiscountById);
router.post('/', createDiscount);
router.put('/:id', updateDiscount);
router.delete('/:id', deleteDiscount);

export default router;
