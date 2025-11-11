import express from 'express';
import {
  getAllDamages,
  createDamage,
  getDamage,
  updateDamage,
  deleteDamage,
  uploadDamageImage
} from '../controllers/damageController.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

router.get('/', getAllDamages);
router.post('/', createDamage);
router.get('/:id', getDamage);
router.put('/:id', updateDamage);
router.delete('/:id', deleteDamage);
router.post('/:id/upload', uploadDamageImage);

export default router;
