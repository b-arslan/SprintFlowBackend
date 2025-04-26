import app from './app';
import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  }
});

httpServer.listen(PORT, () => {
  console.log(`Server and WebSocket running on port ${PORT}`);
});