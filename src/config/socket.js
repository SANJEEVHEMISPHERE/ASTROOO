const { Server } = require("socket.io");
const ChatSession = require("../models/chatSession.model");
const ChatMessage = require("../models/chatMessage.model");
const VideoSession = require("../models/videoSession.model");
const User = require("../models/user.model");
const Astrologer = require("../models/astro.model");
const { startBillingTimer, stopBillingTimer } = require("../services/chatBilling.service");
const { startCallBillingTimer, stopCallBillingTimer } = require("../services/callBilling.service");
const videoSessionService = require("../services/videoSession.service");

let io;

const extractSessionId = (data) => {
    if (!data) return null;
    if (typeof data === "string") return data;
    return data.sessionId || data.chatId || data.callId || data._id || data.id || (data.session && (data.session._id || data.session.id)) || null;
};

const findUserByIdOrRef = async (id) => {
    if (!id) return null;
    let user = await User.findById(id);
    if (!user) user = await User.findOne({ userLogin: id });
    return user;
};

const findAstrologerByIdOrRef = async (id) => {
    if (!id) return null;
    let astro = await Astrologer.findById(id);
    if (!astro) {
        astro = await Astrologer.findOne({
            $or: [{ user: id }, { astrologerLogin: id }]
        });
    }
    return astro;
};

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`🔌 New Socket Connection Established: ${socket.id}`);

        // Register User or Astrologer to their personal notification room (user_<id>)
        socket.on("register_user", (data) => {
            const userId = data ? (data.userId || data.id || data._id) : null;
            if (userId) {
                const userRoom = `user_${userId}`;
                socket.join(userRoom);
                console.log(`👤 Socket ${socket.id} registered in personal room: ${userRoom}`);
            }
        });

        // =====================================
        // CHAT SESSION SOCKET EVENTS
        // =====================================

        // 1. Initiate Chat Request via Socket
        const handleChatRequest = async (data) => {
            try {
                const userId = data ? (data.userId || data.user) : null;
                const astrologerId = data ? (data.astrologerId || data.astrologer) : null;

                if (!userId || !astrologerId) {
                    socket.emit("error", { message: "userId and astrologerId are required." });
                    return;
                }

                const userObj = await findUserByIdOrRef(userId);
                if (!userObj) {
                    socket.emit("error", { message: `User not found for ID: ${userId}` });
                    return;
                }

                const astroObj = await findAstrologerByIdOrRef(astrologerId);
                if (!astroObj) {
                    socket.emit("error", { message: `Astrologer not found for ID: ${astrologerId}` });
                    return;
                }

                const perMinuteRate = astroObj.consultationFee || 0;
                const minBalanceRequired = perMinuteRate * 2;

                if ((userObj.walletBalance || 0) < minBalanceRequired) {
                    socket.emit("error", {
                        message: `Insufficient wallet balance. Minimum ₹${minBalanceRequired} (2 mins) required to initiate chat. Current Balance: ₹${userObj.walletBalance || 0}`
                    });
                    return;
                }

                let session = await ChatSession.findOne({
                    user: userObj._id,
                    astrologer: astroObj._id,
                    status: { $in: ["PENDING", "ACTIVE"] }
                });

                if (!session) {
                    session = await ChatSession.create({
                        user: userObj._id,
                        astrologer: astroObj._id,
                        perMinuteRate,
                        status: "PENDING"
                    });
                }

                const responseData = {
                    ...session.toObject(),
                    sessionId: session._id,
                    chatId: session._id,
                    _id: session._id,
                    id: session._id
                };

                socket.join(`session_${session._id}`);

                const payload = {
                    message: "New incoming chat request!",
                    session: responseData,
                    sessionId: session._id,
                    _id: session._id
                };

                io.to(`user_${astroObj._id}`).emit("incoming_chat_request", payload);
                if (astroObj.user) io.to(`user_${astroObj.user}`).emit("incoming_chat_request", payload);
                if (astroObj.astrologerLogin) io.to(`user_${astroObj.astrologerLogin}`).emit("incoming_chat_request", payload);
                io.to(`session_${session._id}`).emit("incoming_chat_request", payload);

                socket.emit("chat_request_created", {
                    success: true,
                    message: "Chat request initiated successfully.",
                    session: responseData
                });

            } catch (err) {
                console.error("handleChatRequest error:", err);
                socket.emit("error", { message: err.message || "Failed to initiate chat request." });
            }
        };

        socket.on("request_chat", handleChatRequest);
        socket.on("initiate_chat", handleChatRequest);

        // 2. Join Chat Session Room
        socket.on("join_session", async (data) => {
            const sessionId = extractSessionId(data);
            if (!sessionId) return;

            const roomName = `session_${sessionId}`;
            socket.join(roomName);
            console.log(`👤 Socket ${socket.id} joined chat room: ${roomName}`);

            try {
                const session = await ChatSession.findById(sessionId);
                socket.emit("session_state", { 
                    session,
                    sessionId: session ? session._id : sessionId,
                    _id: session ? session._id : sessionId
                });
            } catch (err) {
                console.error("Error fetching session on join:", err);
            }
        });

        // 3. Real-Time Instant Messaging
        socket.on("send_message", async (data) => {
            try {
                const sessionId = extractSessionId(data);
                const senderId = data ? (data.senderId || data.userId || data.astrologerId) : null;
                const senderType = data ? data.senderType : null;
                const messageType = (data && data.messageType) || "text";
                const text = data ? data.text : "";
                const mediaUrl = data ? data.mediaUrl : null;

                if (!sessionId || !senderId || (!text && !mediaUrl)) {
                    socket.emit("error", { message: "Invalid message payload: missing sessionId, senderId, or content." });
                    return;
                }

                const session = await ChatSession.findById(sessionId);
                if (!session || session.status !== "ACTIVE") {
                    socket.emit("error", { message: "Cannot send message. Session is not ACTIVE." });
                    return;
                }

                const newMessage = await ChatMessage.create({
                    session: sessionId,
                    senderId,
                    senderType,
                    messageType,
                    text,
                    mediaUrl
                });

                const formattedMsg = {
                    ...newMessage.toObject(),
                    sessionId: newMessage.session,
                    _id: newMessage._id,
                    id: newMessage._id
                };

                io.to(`session_${sessionId}`).emit("receive_message", formattedMsg);
            } catch (error) {
                console.error("Socket send_message error:", error);
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        // 4. Typing Indicator Status
        socket.on("typing_status", (data) => {
            const sessionId = extractSessionId(data);
            if (!sessionId) return;
            socket.to(`session_${sessionId}`).emit("user_typing", { 
                senderType: data.senderType, 
                isTyping: Boolean(data.isTyping),
                sessionId,
                _id: sessionId
            });
        });

        // 5. Astrologer Accepts Chat Request
        socket.on("accept_chat_request", async (data) => {
            try {
                const sessionId = extractSessionId(data);
                if (!sessionId) return;

                const session = await ChatSession.findById(sessionId);
                if (!session || session.status !== "PENDING") {
                    socket.emit("error", { message: "Session is no longer pending or not found." });
                    return;
                }

                session.status = "ACTIVE";
                session.startTime = new Date();
                await session.save();

                startBillingTimer(sessionId, io);

                const responsePayload = {
                    success: true,
                    message: "Astrologer accepted chat request. Live session started!",
                    session,
                    sessionId: session._id,
                    _id: session._id,
                    id: session._id
                };

                io.to(`session_${sessionId}`).emit("chat_accepted", responsePayload);
                io.to(`user_${session.user}`).emit("chat_accepted", responsePayload);
            } catch (err) {
                console.error("accept_chat_request socket error:", err);
            }
        });

        // 6. Astrologer Rejects Chat Request
        socket.on("reject_chat_request", async (data) => {
            try {
                const sessionId = extractSessionId(data);
                if (!sessionId) return;

                const session = await ChatSession.findById(sessionId);
                if (session) {
                    session.status = "REJECTED";
                    session.rejectionReason = data.reason || "Astrologer unavailable";
                    await session.save();

                    const responsePayload = {
                        success: false,
                        message: "Astrologer rejected chat request.",
                        reason: session.rejectionReason,
                        session,
                        sessionId: session._id,
                        _id: session._id
                    };

                    io.to(`session_${sessionId}`).emit("chat_rejected", responsePayload);
                    io.to(`user_${session.user}`).emit("chat_rejected", responsePayload);
                }
            } catch (err) {
                console.error("reject_chat_request socket error:", err);
            }
        });

        // 7. End Chat Session Manually
        socket.on("end_chat_session", async (data) => {
            try {
                const sessionId = extractSessionId(data);
                if (!sessionId) return;

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
                        session,
                        sessionId: session._id,
                        _id: session._id
                    });
                }
            } catch (err) {
                console.error("end_chat_session socket error:", err);
            }
        });


        // =====================================
        // AUDIO & VIDEO CALL SOCKET EVENTS
        // =====================================

        // 1. Join Audio/Video Call Room
        socket.on("join_call_room", async (data) => {
            const sessionId = extractSessionId(data);
            if (!sessionId) return;

            const roomName = `call_${sessionId}`;
            socket.join(roomName);
            console.log(`📞 Socket ${socket.id} joined call room: ${roomName}`);

            try {
                const session = await VideoSession.findById(sessionId);
                socket.emit("call_state", {
                    session,
                    sessionId: session ? session._id : sessionId
                });
            } catch (err) {
                console.error("Error fetching call session on join:", err);
            }
        });

        // 2. User Requests Audio or Video Call
        socket.on("request_call", async (data) => {
            try {
                const userId = data ? (data.userId || data.user) : null;
                const astrologerId = data ? (data.astrologerId || data.astrologer) : null;
                const callType = (data && data.callType) ? data.callType : "VIDEO";

                if (!userId || !astrologerId) {
                    socket.emit("error", { message: "Invalid payload: missing userId or astrologerId." });
                    return;
                }

                const session = await videoSessionService.requestCallSession({
                    userId,
                    astrologerId,
                    callType
                });

                socket.join(`call_${session._id}`);

                const payload = {
                    sessionId: session._id,
                    callType: session.callType,
                    user: session.user,
                    astrologer: session.astrologer,
                    perMinuteRate: session.perMinuteRate,
                    channelName: session.channelName
                };

                io.to(`user_${astrologerId}`).emit("incoming_call_request", payload);
                if (session.astrologer && session.astrologer.user) {
                    io.to(`user_${session.astrologer.user}`).emit("incoming_call_request", payload);
                }

                socket.emit("call_request_sent", {
                    success: true,
                    message: "Call request sent to astrologer. Waiting for response...",
                    session
                });

            } catch (error) {
                console.error("request_call socket error:", error);
                socket.emit("error", { message: error.message || "Failed to initiate call request." });
            }
        });

        // 3. Astrologer Accepts Call Request
        socket.on("accept_call_request", async (data) => {
            try {
                const sessionId = extractSessionId(data);
                if (!sessionId) return;

                const result = await videoSessionService.acceptCallSession(sessionId);

                socket.join(`call_${sessionId}`);

                startCallBillingTimer(sessionId, io);

                const responsePayload = {
                    success: true,
                    message: "Call request accepted! Agora RTC token generated.",
                    sessionId: result.session._id,
                    channelName: result.session.channelName,
                    agora: result.agora,
                    session: result.session
                };

                io.to(`call_${sessionId}`).emit("call_accepted", responsePayload);

            } catch (err) {
                console.error("accept_call_request socket error:", err);
                socket.emit("error", { message: err.message || "Failed to accept call request." });
            }
        });

        // 4. Astrologer Rejects Call Request
        socket.on("reject_call_request", async (data) => {
            try {
                const sessionId = extractSessionId(data);
                if (!sessionId) return;

                const reason = data ? (data.reason || "Astrologer busy") : "Astrologer busy";
                const session = await videoSessionService.rejectCallSession(sessionId, reason);

                io.to(`call_${sessionId}`).emit("call_rejected", {
                    success: false,
                    message: "Call request was rejected.",
                    reason: session.rejectionReason,
                    session
                });

            } catch (err) {
                console.error("reject_call_request socket error:", err);
            }
        });

        // 5. End Audio/Video Call Session
        socket.on("end_call_session", async (data) => {
            try {
                const sessionId = extractSessionId(data);
                if (!sessionId) return;

                stopCallBillingTimer(sessionId);
                const session = await videoSessionService.endCallSession(sessionId);

                io.to(`call_${sessionId}`).emit("call_ended", {
                    success: true,
                    message: "Call session ended successfully.",
                    session
                });

            } catch (err) {
                console.error("end_call_session socket error:", err);
            }
        });

        // 6. Mute / Camera Toggle State Sync
        socket.on("media_state_change", (data) => {
            const sessionId = extractSessionId(data);
            if (!sessionId) return;

            socket.to(`call_${sessionId}`).emit("peer_media_state_changed", {
                isAudioMuted: Boolean(data.isAudioMuted),
                isVideoMuted: Boolean(data.isVideoMuted),
                senderType: data.senderType
            });
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
