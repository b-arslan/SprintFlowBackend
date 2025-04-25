import { Request, Response } from 'express';
import { db } from '../utils/firebase';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

export const createTeam = async (req: Request, res: Response): Promise<any> => {
  const schema = z.object({
    teamName: z.string().min(2),
    members: z.array(z.string().email()).min(1)
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { teamName, members } = result.data;

  const teamId = uuidv4();

  await db.collection('teams').doc(teamId).set({
    id: teamId,
    name: teamName,
    members
  });

  const batch = db.batch();
  for (const email of members) {
    const userRef = db.collection('users').doc(email);
    batch.update(userRef, { teamId });
  }
  await batch.commit();

  res.status(201).json({ message: 'Team created', teamId });
};