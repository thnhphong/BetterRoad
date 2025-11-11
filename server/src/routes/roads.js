import express from 'express';
import {
  getAllRoads,
  createRoad,
  getRoad,
  updateRoad,
  deleteRoad
} from '../controllers/roadController.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// Routes
router.get('/', getAllRoads);
router.post('/', createRoad);
router.get('/:id', getRoad);
router.put('/:id', updateRoad);
router.delete('/:id', deleteRoad);

export default router;