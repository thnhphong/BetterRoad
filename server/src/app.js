// ============================================
// server/src/app.js
// ============================================
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import staffRoutes from './routes/staff.routes.js';
import damageRoutes from './routes/damage.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads (relative to server root directory)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BetterRoad API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/damages', damageRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

export default app;