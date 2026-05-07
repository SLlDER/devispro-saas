import express from 'express';
import { createCheckoutSession, createPortalSession } from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.post('/create-checkout-session', requireAuth, asyncHandler(createCheckoutSession));
router.post('/create-portal-session', requireAuth, asyncHandler(createPortalSession));

export default router;
