const { Server } = require("socket.io");
const ChatSession = require("../models/chatSession.model");
const ChatMessage = require("../models/chatMessage.model");
const { startBillingTimer, stopBillingTimer } = require("../services/chatBilling.service");

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`🔌 New Socket Connection Established: ${socket.id}`);

        // 1. Join Chat Session Room
        socket.on("join_session", async ({ sessionId }) => {
            if (!sessionId) return;
            const roomName = `session_${sessionId}`;
            socket.join(roomName);
            console.log(`👤 Socket ${socket.id} joined room: ${roomName}`);

            // Send past message history or session state if needed
            try {
                const session = await ChatSession.findById(sessionId);
                socket.emit("session_state", { session });
            } catch (err) {
                console.error("Error fetching session on join:", err);
            }
        });

        // 2. Real-Time Instant Messaging
        socket.on("send_message", async ({ sessionId, senderId, senderType, messageType = "text", text, mediaUrl }) => {
            try {
                if (!sessionId || !senderId || (!text && !mediaUrl)) {
                    socket.emit("error", { message: "Invalid message payload" });
                    return;
                }

                const session = await ChatSession.findById(sessionId);
                if (!session || session.status !== "ACTIVE") {
                    socket.emit("error", { message: "Cannot send message. Session is not ACTIVE." });
                    return;
                }

                // Save message to database
                const newMessage = await ChatMessage.create({
                    session: sessionId,
                    senderId,
                    senderType,
                    messageType,
                    text,
                    mediaUrl
                });

                // Broadcast to all clients in this session room
                io.to(`session_${sessionId}`).emit("receive_message", newMessage);
            } catch (error) {
                console.error("Socket send_message error:", error);
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        // 3. Typing Indicator Status
        socket.on("typing_status", ({ sessionId, senderType, isTyping }) => {
            if (!sessionId) return;
            socket.to(`session_${sessionId}`).emit("user_typing", { senderType, isTyping });
        });

        // 4. Astrologer Accepts Chat Request
        socket.on("accept_chat_request", async ({ sessionId }) => {
            try {
                const session = await ChatSession.findById(sessionId);
                if (!session || session.status !== "PENDING") {
                    socket.emit("error", { message: "Session is no longer pending." });
                    return;
                }

                session.status = "ACTIVE";
                session.startTime = new Date();
                await session.save();

                // Start per-minute recurring timer
                startBillingTimer(sessionId, io);

                io.to(`session_${sessionId}`).emit("chat_accepted", {
                    success: true,
                    message: "Astrologer accepted chat request. Live session started!",
                    session
                });
            } catch (err) {
                console.error("accept_chat_request socket error:", err);
            }
        });

        // 5. Astrologer Rejects Chat Request
        socket.on("reject_chat_request", async ({ sessionId, reason }) => {
            try {
                const session = await ChatSession.findById(sessionId);
                if (session) {
                    session.status = "REJECTED";
                    session.rejectionReason = reason || "Astrologer unavailable";
                    await session.save();

                    io.to(`session_${sessionId}`).emit("chat_rejected", {
                        success: false,
                        message: "Astrologer rejected chat request.",
                        reason: session.rejectionReason,
                        session
                    });
                }
            } catch (err) {
                console.error("reject_chat_request socket error:", err);
            }
        });

        // 6. End Chat Session Manually (User or Astrologer)
        socket.on("end_chat_session", async ({ sessionId }) => {
            try {
                const session = await ChatSession.findById(sessionId);
                if (session && session.status === "ACTIVE") {
                    stopBillingTimer(sessionId);

                    session.status = "COMPLETED";
                    session.endTime = new Date();
                    const durationMs = session.endTime.getTime() - new Date(session.startTime).getTime();
                    session.totalDurationMinutes = Math.max(1, Math.ceil(durationMs / 60000));
                    await session.save();

                    io.to(`session_${sessionId}`).emit("chat_ended", {
                        success: true,
                        message: "Chat session ended successfully.",
                        session
                    });
                }
            } catch (err) {
                console.error("end_chat_session socket error:", err);
            }
        });

        // Disconnect Handler
        socket.on("disconnect", () => {
            console.log(`🔌 Socket Disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = {
    initSocket,
    getIO
};
