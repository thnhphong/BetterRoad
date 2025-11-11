import express from 'express';
import authRoutes from './auth.js';
const router = express.Router();
router.use('/auth', authRoutes)
// Welcome route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to BetterRoad API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

// Placeholder routes (to be implemented)
router.get('/enterprises', (req, res) => {
  res.json({ success: true, message: 'Enterprises endpoint', data: [] });
});

router.get('/staff', (req, res) => {
  res.json({ success: true, message: 'Staff endpoint', data: [] });
});

router.get('/surveys', (req, res) => {
  res.json({ success: true, message: 'Surveys endpoint', data: [] });
});

router.get('/potholes', (req, res) => {
  res.json({ success: true, message: 'Potholes endpoint', data: [] });
});

export default router;