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

    socket.on("join_retro", ({ sprintId, userEmail }) => {
        if (!sprintId || !userEmail) return;

        socket.data.userEmail = userEmail;
        socket.data.sprintId = sprintId;

        if (!activeUsers[sprintId]) {
            activeUsers[sprintId] = new Set();
        }
        activeUsers[sprintId].add(userEmail);

        console.log(`${userEmail} retrosuna katıldı: ${sprintId}`);

        socket.join(sprintId);
        io.to(sprintId).emit(
            "active_participants",
            Array.from(activeUsers[sprintId])
        );
    });

    socket.on("leave_retro", ({ sprintId, userEmail }) => {
        if (!sprintId || !userEmail) return;

        if (activeUsers[sprintId]) {
            activeUsers[sprintId].delete(userEmail);
            console.log(`${userEmail} retrosundan ayrıldı: ${sprintId}`);

            io.to(sprintId).emit(
                "active_participants",
                Array.from(activeUsers[sprintId])
            );
        }

        socket.leave(sprintId);
    });

    socket.on("disconnect", () => {
        const sprintId = socket.data.sprintId;
        const userEmail = socket.data.userEmail;

        if (sprintId && userEmail && activeUsers[sprintId]) {
            activeUsers[sprintId].delete(userEmail);
            console.log(`${userEmail} retrosundan disconnect ile ayrıldı.`);

            io.to(sprintId).emit(
                "active_participants",
                Array.from(activeUsers[sprintId])
            );
        }

        console.log(`Kullanıcı ayrıldı: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});