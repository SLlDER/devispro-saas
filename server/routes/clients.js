import express from 'express';
import { createClient, deleteClient, getClients, updateClient } from '../controllers/clientController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.post('/client', requireAuth, asyncHandler(createClient));
router.get('/clients/:user_id', requireAuth, asyncHandler(getClients));
router.patch('/client/:id', requireAuth, asyncHandler(updateClient));
router.delete('/client/:id', requireAuth, asyncHandler(deleteClient));

export default router;
