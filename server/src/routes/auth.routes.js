// ============================================
// server/src/routes/auth.routes.js
// ============================================
import express from 'express';
import { register, login, getProfile, getMe } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.get('/me', authenticate, getMe);

export default router;