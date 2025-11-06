import express from 'express';
import * as invoiceController from '../controllers/invoices.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes with authentication
router.use(verifyToken);

// Invoice routes
router.get('/', invoiceController.getInvoices);
router.get('/stats', invoiceController.getInvoiceStats);
router.post('/', invoiceController.createInvoice);
router.get('/:invoiceNumber', invoiceController.getInvoiceByNumber);

export default router;
