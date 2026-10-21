import express from 'express';
import {
  createRoom,
  getRooms,
  getRoomById,
  joinRoom,
  endRoom,
} from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All room routes require authentication
router.use(protect);

router.route('/')
  .post(createRoom)
  .get(getRooms);

router.route('/:roomId')
  .get(getRoomById);

router.route('/:roomId/join')
  .post(joinRoom);

router.route('/:roomId/end')
  .post(endRoom);

export default router;
