import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getAllProductsWithPriceHistory,
  getPriceHistoryByProduct
} from '../controllers/priceHistory.js';

const router = express.Router();

// Price History routes
router.get('/products', verifyToken, getAllProductsWithPriceHistory);
router.get('/product/:id', verifyToken, getPriceHistoryByProduct);

export default router;
