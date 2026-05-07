import express from 'express';
import { createCheckoutSession } from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.post('/create-checkout-session', requireAuth, asyncHandler(createCheckoutSession));

export default router;
