// ============================================
// server/src/routes/staff.routes.js
// ============================================
import express from 'express';
import {
  registerStaff,
  getStaffList,
  updateStaffStatus,
  deleteStaff
} from '../controllers/staff.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register new staff member (requires authentication - company admin)
router.post('/register', authenticate, registerStaff);

// Get list of staff (requires authentication - company admin)
router.get('/', authenticate, getStaffList);

// Update staff status (requires authentication - company admin)
router.patch('/:id/status', authenticate, updateStaffStatus);

// Delete staff (requires authentication - company admin)
router.delete('/:id', authenticate, deleteStaff);

export default router;

