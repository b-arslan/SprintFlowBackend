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
    transports: ["websocket", "polling"],
    allowEIO3: true,
});

const activeUsers: Record<string, Set<string>> = {};
const socketEmailMap: Record<string, { email: string; retroId: string }> = {};

io.on("connection", (socket) => {
    console.log(`Bir kullanıcı bağlandı: ${socket.id}`);

    socket.on("join_retro", ({ retroId, email }) => {
        if (!retroId || !email) return;

        socket.join(retroId);

        socketEmailMap[socket.id] = { email, retroId };

        if (!activeUsers[retroId]) {
            activeUsers[retroId] = new Set();
        }
        activeUsers[retroId].add(email);

        console.log(`${email} retrosuna katıldı: ${retroId}`);
        io.to(retroId).emit(
            "active_participants",
            Array.from(activeUsers[retroId])
        );
    });

    socket.on("leave_retro", ({ retroId, email }) => {
        if (!retroId || !email) return;

        socket.leave(retroId);

        if (activeUsers[retroId]) {
            activeUsers[retroId].delete(email);

            console.log(`${email} retrosundan ayrıldı: ${retroId}`);

            io.to(retroId).emit(
                "active_participants",
                Array.from(activeUsers[retroId])
            );
        }

        delete socketEmailMap[socket.id];
    });

    socket.on("complete_retro", ({ retroId }) => {
        if (!retroId) return;

        console.log(`Retro tamamlandı: ${retroId}`);

        io.to(retroId).emit("retro_completed", { retroId });
    });

    socket.on("disconnecting", () => {
        for (const room of socket.rooms) {
            if (activeUsers[room]) {
                console.log(`Socket rooms'dan ayrılıyor: ${room}`);
            }
        }
    });

    socket.on("disconnect", () => {
        console.log(`Kullanıcı ayrıldı: ${socket.id}`);

        const userInfo = socketEmailMap[socket.id];
        if (userInfo) {
            const { email, retroId } = userInfo;

            if (activeUsers[retroId]) {
                activeUsers[retroId].delete(email);

                console.log(
                    `${email} retrosundan bağlantı kesildi: ${retroId}`
                );

                io.to(retroId).emit(
                    "active_participants",
                    Array.from(activeUsers[retroId])
                );
            }
            delete socketEmailMap[socket.id];
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});