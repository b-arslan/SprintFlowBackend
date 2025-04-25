import { Response } from 'express';
import { db } from '../utils/firebase';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const submitFeedback = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  const schema = z.object({
    sprintId: z.string().min(5),
    start: z.string().min(5),
    stop: z.string().min(5),
    continue: z.string().min(5)
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { sprintId, start, stop, continue: continueDoing } = result.data;
  const email = req.userEmail;

  if (!email) {
    return res.status(403).json({ error: 'Auth error' });
  }

  const participantMapId = `${sprintId}_${email}`;
  const participantMapRef = db.collection('participantMap').doc(participantMapId);
  const existingMap = await participantMapRef.get();

  if (existingMap.exists) {
    return res.status(400).json({ error: 'You already submitted feedback for this sprint.' });
  }

  const participantId = `anon_${uuidv4().slice(0, 6)}`;
  await participantMapRef.set({ email, sprintId, participantId });

  const feedbackId = `fdb_${uuidv4().slice(0, 8)}`;
  await db.collection('feedbacks').doc(feedbackId).set({
    id: feedbackId,
    sprintId,
    participantId,
    start,
    stop,
    continue: continueDoing,
    upvotes: 0,
    downvotes: 0,
    createdAt: new Date().toISOString()
  });

  res.status(201).json({ message: 'Feedback submitted', participantId });
};