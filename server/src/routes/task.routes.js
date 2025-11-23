import express from 'express';
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getStaffForTasks,
  getDamagesForTasks
} from '../controllers/task.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, createTask);
router.get('/', authenticate, getTasks);
// Important: Put specific routes before parameterized routes
router.get('/staff', authenticate, getStaffForTasks);
router.get('/damages', authenticate, getDamagesForTasks);
router.put('/:id', authenticate, updateTask);
router.delete('/:id', authenticate, deleteTask);

export default router;

