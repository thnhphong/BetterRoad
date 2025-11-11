import express from 'express';
import {
  getAllTasks,
  createTask,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask
} from '../controllers/taskController.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

router.get('/', getAllTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);

export default router;