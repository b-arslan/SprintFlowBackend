import express from 'express';
import { createTeam } from '../controllers/teamController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/create', authenticateToken, createTeam);

export default router;