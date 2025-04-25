import express from 'express';
import { createSprint, getSprintFeedbacks } from '../controllers/sprintController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/create', authenticateToken, createSprint);
router.get('/:sprintId/feedbacks', authenticateToken, getSprintFeedbacks);

export default router;