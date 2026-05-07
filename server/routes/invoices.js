import express from 'express';
import {
  createInvoice,
  deleteInvoice,
  getInvoices,
  getInvoiceUsageForUser,
  updateInvoice
} from '../controllers/invoiceController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.post('/invoice', requireAuth, asyncHandler(createInvoice));
router.get('/invoices/:user_id', requireAuth, asyncHandler(getInvoices));
router.get('/invoice-usage/:user_id', requireAuth, asyncHandler(getInvoiceUsageForUser));
router.patch('/invoice/:id', requireAuth, asyncHandler(updateInvoice));
router.delete('/invoice/:id', requireAuth, asyncHandler(deleteInvoice));

export default router;
