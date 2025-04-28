import app from "./app";
import { Server } from "socket.io";
import { createServer } from "http";

const PORT = process.env.PORT || 5000;
const server = createServer(app);

export const io = new Server(server, {
    cors: {
        origin: "https://sprint-flow-frontend.vercel.app",
        methods: ["GET", "POST"],
    },
});

const activeUsers: Record<string, Set<string>> = {};

io.on("connection", (socket) => {
    console.log(`Bir kullanıcı bağlandı: ${socket.id}`);

    socket.on("join_retro", ({ retroId, email }) => {
        if (!retroId || !email) return;

        socket.join(retroId);

        if (!activeUsers[retroId]) {
            activeUsers[retroId] = new Set();
        }
        activeUsers[retroId].add(email);

        console.log(`${email} retrosuna katıldı: ${retroId}`);

        const activeList = Array.from(activeUsers[retroId]);

        io.to(retroId).emit("active_participants", activeList);

        socket.emit("active_participants", activeList);
    });

    socket.on("leave_retro", ({ retroId, email }) => {
        if (!retroId || !email) return;

        if (activeUsers[retroId]) {
            activeUsers[retroId].delete(email);

            console.log(`${email} retrosundan ayrıldı: ${retroId}`);

            const activeList = Array.from(activeUsers[retroId]);
            io.to(retroId).emit("active_participants", activeList);
        }

        socket.leave(retroId);
    });

    socket.on("disconnect", () => {
        console.log(`Kullanıcı ayrıldı: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});