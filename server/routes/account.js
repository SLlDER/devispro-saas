import express from 'express';
import { deleteAccount, exportAccount } from '../controllers/accountController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.get('/account/export', requireAuth, asyncHandler(exportAccount));
router.delete('/account', requireAuth, asyncHandler(deleteAccount));

export default router;
