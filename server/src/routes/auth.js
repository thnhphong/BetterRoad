import express from 'express';
import {
  register,
  login,
  refreshToken,
  getMe,
  logout,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import authMiddleware from '../middlewares/auth.js';  // ✅ middlewares (số nhiều)

console.log('🔵 Auth routes loading...');
console.log('Controllers imported:', { register, login });
console.log('Middleware imported:', typeof authMiddleware);

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Auth routes working!' });
});

// Public routes
router.post('/register', (req, res, next) => {
  console.log('📝 Register route hit');
  next();
}, register);

router.post('/login', (req, res, next) => {
  console.log('🔐 Login route hit');
  next();
}, login);

router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);

// Protected routes
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);
router.post('/reset-password', authMiddleware, resetPassword);

console.log('✅ Auth routes configured');

export default router;