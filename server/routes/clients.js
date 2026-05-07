import express from 'express';
import { createClient, getClients } from '../controllers/clientController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.post('/client', requireAuth, asyncHandler(createClient));
router.get('/clients/:user_id', requireAuth, asyncHandler(getClients));

export default router;
