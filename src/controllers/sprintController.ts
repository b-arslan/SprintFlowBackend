import { Request, Response } from 'express';
import { db } from '../utils/firebase';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const createSprint = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  const schema = z.object({
    teamId: z.string().min(3),
    title: z.string().min(3),
    description: z.string().optional(),
    expiresAt: z.string().datetime()
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { teamId, title, description, expiresAt } = result.data;
  const createdBy = req.userEmail || 'unknown';

  const sprintId = uuidv4();

  await db.collection('sprints').doc(sprintId).set({
    id: sprintId,
    teamId,
    title,
    description: description || '',
    createdBy,
    createdAt: new Date().toISOString(),
    expiresAt,
    status: 'active'
  });

  res.status(201).json({ message: 'Sprint created', sprintId });
};

export const getSprintFeedbacks = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<any> => {
    const { sprintId } = req.params;
    const { sort } = req.query;
  
    if (!sprintId) {
      return res.status(400).json({ error: 'Sprint ID gerekli' });
    }
  
    const snapshot = await db
      .collection('feedbacks')
      .where('sprintId', '==', sprintId)
      .get();
  
    const feedbacks = snapshot.docs.map(doc => doc.data());
  
    let sorted = feedbacks;
    if (sort === 'upvotes') {
      sorted = feedbacks.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else {
      sorted = feedbacks.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
  
    return res.status(200).json({ feedbacks: sorted });
};

export const getTeamSprints = async (req: Request, res: Response): Promise<any> => {
    const { teamId } = req.params;
  
    const snapshot = await db
      .collection('sprints')
      .where('teamId', '==', teamId)
      .where('status', '==', 'active')
      .get();
  
    const sprints = snapshot.docs.map(doc => doc.data());
  
    res.status(200).json({ sprints });
};  