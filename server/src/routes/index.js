import express from 'express';
import authRoutes from './auth.js';

console.log('🔵 Routes index.js loading...');
console.log('authRoutes type:', typeof authRoutes);

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  console.log('✅ Health check endpoint hit');
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount routes
console.log('🔵 Mounting /auth routes...');
router.use('/auth', authRoutes);
console.log('✅ Auth routes mounted');

export default router;