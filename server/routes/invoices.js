import express from 'express';
import { createInvoice, getInvoices } from '../controllers/invoiceController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.post('/invoice', requireAuth, asyncHandler(createInvoice));
router.get('/invoices/:user_id', requireAuth, asyncHandler(getInvoices));

export default router;
