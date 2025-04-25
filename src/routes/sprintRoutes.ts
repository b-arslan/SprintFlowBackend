import express from 'express';
import { createSprint, getSprintFeedbacks, getTeamSprints } from '../controllers/sprintController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/create', authenticateToken, createSprint);
router.get('/:sprintId/feedbacks', authenticateToken, getSprintFeedbacks);
router.get('/team/:teamId', authenticateToken, getTeamSprints);

export default router;