import express from 'express';
import { voteFeedback } from '../controllers/voteController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', authenticateToken, voteFeedback);

export default router;