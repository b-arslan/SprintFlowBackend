import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import teamRoutes from './routes/teamRoutes';
import sprintRoutes from './routes/sprintRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import voteRoutes from './routes/voteRoutes';
import { requestLogger } from "./middlewares/requestLogger";

dotenv.config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use(requestLogger);

app.get('/', (_, res) => {
  res.json({ message: 'SprintFlow backend is running!' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/sprints', sprintRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/vote', voteRoutes);

export default app;