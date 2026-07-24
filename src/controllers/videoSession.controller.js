const videoSessionService = require("../services/videoSession.service");
const { getIO } = require("../config/socket");
const { startCallBillingTimer, stopCallBillingTimer } = require("../services/callBilling.service");

// 1. GENERATE AGORA RTC TOKEN
const generateAgoraToken = async (req, res) => {
    try {
        const { channelName, uid, role } = req.body;

        if (!channelName) {
            return res.status(400).json({
                success: false,
                message: "channelName is required"
            });
        }

        const tokenData = videoSessionService.generateAgoraToken(channelName, uid, role);

        return res.status(200).json({
            success: true,
            message: "Agora RTC Token generated successfully",
            data: tokenData
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// 2. REQUEST CALL (USER -> ASTROLOGER)
const requestCall = async (req, res) => {
    try {
        const { userId, astrologerId, callType } = req.body;

        if (!userId || !astrologerId) {
            return res.status(400).json({
                success: false,
                message: "userId and astrologerId are required"
            });
        }

        const session = await videoSessionService.requestCallSession({
            userId,
            astrologerId,
            callType: callType || "VIDEO"
        });

        // Notify Astrologer via Socket.io if available
        try {
            const io = getIO();
            io.to(`user_${astrologerId}`).emit("incoming_call_request", {
                sessionId: session._id,
                callType: session.callType,
                user: session.user,
                astrologer: session.astrologer,
                perMinuteRate: session.perMinuteRate,
                channelName: session.channelName
            });
        } catch (socketErr) {
            console.log("Socket notification skipped (not connected or server initializing):", socketErr.message);
        }

        return res.status(201).json({
            success: true,
            message: "Call request created and sent to astrologer",
            data: session
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// 3. ACCEPT CALL (ASTROLOGER -> USER)
const acceptCall = async (req, res) => {
    try {
        const { sessionId } = req.params.id ? { sessionId: req.params.id } : req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "sessionId is required"
            });
        }

        const result = await videoSessionService.acceptCallSession(sessionId);

        // Start Call Billing Timer
        try {
            const io = getIO();
            startCallBillingTimer(sessionId, io);

            // Notify call room
            io.to(`call_${sessionId}`).emit("call_accepted", {
                success: true,
                message: "Astrologer accepted call request",
                sessionId: result.session._id,
                channelName: result.session.channelName,
                agora: result.agora,
                session: result.session
            });
        } catch (socketErr) {
            console.log("Socket broadcast skipped:", socketErr.message);
        }

        return res.status(200).json({
            success: true,
            message: "Call request accepted. Live call started!",
            data: result
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// 4. REJECT CALL
const rejectCall = async (req, res) => {
    try {
        const { sessionId, reason } = req.body;
        const targetId = req.params.id || sessionId;

        if (!targetId) {
            return res.status(400).json({
                success: false,
                message: "sessionId is required"
            });
        }

        const session = await videoSessionService.rejectCallSession(targetId, reason);

        try {
            const io = getIO();
            io.to(`call_${targetId}`).emit("call_rejected", {
                success: false,
                message: "Call request was rejected",
                reason: session.rejectionReason,
                session
            });
        } catch (socketErr) {}

        return res.status(200).json({
            success: true,
            message: "Call request rejected",
            data: session
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// 5. END CALL SESSION
const endCall = async (req, res) => {
    try {
        const sessionId = req.params.id || req.body.sessionId;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "sessionId is required"
            });
        }

        stopCallBillingTimer(sessionId);
        const session = await videoSessionService.endCallSession(sessionId);

        try {
            const io = getIO();
            io.to(`call_${sessionId}`).emit("call_ended", {
                success: true,
                message: "Call session ended",
                session
            });
        } catch (socketErr) {}

        return res.status(200).json({
            success: true,
            message: "Call session ended successfully",
            data: session
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// 6. GET CALL HISTORY
const getCallHistory = async (req, res) => {
    try {
        const { userId, role } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId query parameter is required"
            });
        }

        const history = await videoSessionService.getCallHistory(userId, role || "user");

        return res.status(200).json({
            success: true,
            count: history.length,
            data: history
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Legacy compatibility endpoints
const createVideoSession = async (req, res) => {
    try {
        const result = await videoSessionService.createVideoSession(req.body);
        return res.status(201).json({ success: true, message: "Video Session Created", data: result });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const startVideoSession = async (req, res) => {
    try {
        const sessionId = req.params.id || req.body.sessionId;
        const result = await videoSessionService.startVideoSession(sessionId);
        return res.status(200).json({ success: true, message: "Video Session started", data: result });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const endVideoSession = async (req, res) => {
    return await endCall(req, res);
};

const getAllVideoSessions = async (req, res) => {
    try {
        const sessions = await videoSessionService.getAllVideoSessions();
        return res.status(200).json({ success: true, count: sessions.length, data: sessions });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getVideoSessionById = async (req, res) => {
    try {
        const session = await videoSessionService.getVideoSessionById(req.params.id);
        if (!session) return res.status(404).json({ success: false, message: "Video Session Not Found" });
        return res.status(200).json({ success: true, data: session });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateVideoSession = async (req, res) => {
    try {
        const session = await videoSessionService.updateVideoSession(req.params.id, req.body);
        if (!session) return res.status(404).json({ success: false, message: "Video Session Not Found" });
        return res.status(200).json({ success: true, message: "Updated", data: session });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteVideoSession = async (req, res) => {
    try {
        const session = await videoSessionService.deleteVideoSession(req.params.id);
        if (!session) return res.status(404).json({ success: false, message: "Video Session Not Found" });
        return res.status(200).json({ success: true, message: "Deleted" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    generateAgoraToken,
    requestCall,
    acceptCall,
    rejectCall,
    endCall,
    getCallHistory,
    createVideoSession,
    startVideoSession,
    endVideoSession,
    getAllVideoSessions,
    getVideoSessionById,
    updateVideoSession,
    deleteVideoSession
};