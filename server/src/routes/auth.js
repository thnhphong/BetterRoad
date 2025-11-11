import express from 'express';
import { 
  register, 
  login, 
  getMe, 
  logout,
  forgotPassword,
  resetPassword 
} from '../controllers/authController.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);

export default router;