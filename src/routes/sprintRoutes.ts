import express from 'express';
import { createSprint, joinSprint, getSprintFeedbacks, getMyJoinedSprints, banParticipant, kickParticipant, updateExpiredSprints } from '../controllers/sprintController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/create', authenticateToken, createSprint);
router.post('/join', authenticateToken, joinSprint);
router.get('/:sprintId/feedbacks', authenticateToken, getSprintFeedbacks);
router.get("/my-joined", authenticateToken, getMyJoinedSprints);
router.post("/:sprintId/kick", authenticateToken, kickParticipant);
router.post("/:sprintId/ban", authenticateToken, banParticipant);
router.get('/update-expired', updateExpiredSprints);

export default router;