// ============================================
// server/src/routes/damage.routes.js
// ============================================
import express from 'express';
import {
  createDamage,
  getDamages,
  getRoads
} from '../controllers/damage.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Create new damage (requires authentication)
router.post('/', authenticate, createDamage);

// Get list of damages (requires authentication)
router.get('/', authenticate, getDamages);

// Get list of roads for dropdown (requires authentication)
router.get('/roads', authenticate, getRoads);

export default router;

