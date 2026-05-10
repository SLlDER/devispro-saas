import express from 'express';
import { getBusinessProfile, upsertBusinessProfile } from '../controllers/profileController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.get('/business-profile', requireAuth, asyncHandler(getBusinessProfile));
router.put('/business-profile', requireAuth, asyncHandler(upsertBusinessProfile));

export default router;
