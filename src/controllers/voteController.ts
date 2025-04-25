import { Response } from 'express';
import { db } from '../utils/firebase';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const voteFeedback = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  const schema = z.object({
    sprintId: z.string().min(5),
    feedbackId: z.string().min(5),
    vote: z.union([z.literal(1), z.literal(-1)])
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { sprintId, feedbackId, vote } = result.data;
  const email = req.userEmail;

  if (!email) {
    return res.status(403).json({ error: 'Auth error' });
  }

  const voteInt = typeof vote === 'string' ? parseInt(vote) : vote;
  const voteId = `${sprintId}__${email}__${feedbackId}`;
  const voteRef = db.collection('votes').doc(voteId);
  const feedbackRef = db.collection('feedbacks').doc(feedbackId);

  const prevVoteDoc = await voteRef.get();
  const feedbackDoc = await feedbackRef.get();

  if (!feedbackDoc.exists) {
    return res.status(404).json({ error: 'Feedback not found' });
  }

  const feedback = feedbackDoc.data();
  const prevVote = prevVoteDoc.exists ? prevVoteDoc.data()?.vote : 0;

  if (prevVote === voteInt) {
    return res.status(400).json({ error: 'You already voted this way' });
  }

  const upvotes = (feedback?.upvotes || 0) + (voteInt === 1 ? 1 : 0) - (prevVote === 1 ? 1 : 0);
  const downvotes = (feedback?.downvotes || 0) + (voteInt === -1 ? 1 : 0) - (prevVote === -1 ? 1 : 0);

  await voteRef.set({ sprintId, voter: email, feedbackId, vote: voteInt });
  await feedbackRef.update({ upvotes, downvotes });

  res.status(200).json({ message: 'Vote registered', upvotes, downvotes });
};