import app from './app';
import { Server } from 'socket.io';
import { createServer } from 'http';

const PORT = process.env.PORT || 5000;

const server = createServer(app);

export const io = new Server(server, {
    cors: {
        origin: "https://sprint-flow-frontend.vercel.app/",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`Bir kullanıcı bağlandı: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`Kullanıcı ayrıldı: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});