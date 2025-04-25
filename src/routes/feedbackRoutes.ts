import express from 'express';
import { submitFeedback } from '../controllers/feedbackController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/submit', authenticateToken, submitFeedback);

export default router;