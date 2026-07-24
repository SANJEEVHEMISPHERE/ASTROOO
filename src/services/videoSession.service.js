const VideoSession = require("../models/videoSession.model");
const Appointment = require("../models/appointment.model");
const User = require("../models/user.model");
const Astrologer = require("../models/astro.model");
const agoraService = require("./agora.service");

const generateRoomId = (prefix = "room") => {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
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

/**
 * Generate standalone Agora RTC Token
 */
const generateAgoraToken = (channelName, uid = 0, role = "publisher") => {
    return agoraService.generateRtcToken(channelName, uid, role);
};

/**
 * Initiate an Audio or Video Call Request (User -> Astrologer)
 */
const requestCallSession = async ({ userId, astrologerId, callType = "VIDEO" }) => {
    const user = await findUserByIdOrRef(userId);
    if (!user) throw new Error(`User not found for ID: ${userId}`);

    const astrologer = await findAstrologerByIdOrRef(astrologerId);
    if (!astrologer) throw new Error(`Astrologer not found for ID: ${astrologerId}`);

    const perMinuteRate = astrologer.consultationFee || 0;

    if ((user.walletBalance || 0) < perMinuteRate) {
        throw new Error(`Insufficient wallet balance. Minimum ₹${perMinuteRate} required to request call.`);
    }

    const typeStr = String(callType).toUpperCase();
    const normalizedCallType = (typeStr === "AUDIO" || typeStr === "CALL" || typeStr === "VOICE" || typeStr === "PHONE") ? "AUDIO" : "VIDEO";

    let session = await VideoSession.findOne({
        user: user._id,
        astrologer: astrologer._id,
        status: { $in: ["PENDING", "ACTIVE", "live"] }
    });

    if (!session) {
        const roomId = generateRoomId(normalizedCallType === "AUDIO" ? "audio" : "video");
        const channelName = roomId;

        session = await VideoSession.create({
            user: user._id,
            astrologer: astrologer._id,
            callType: normalizedCallType,
            provider: "Agora",
            roomId,
            channelName,
            perMinuteRate,
            status: "PENDING"
        });
    }

    const populatedSession = await VideoSession.findById(session._id)
        .populate("user", "firstname lastname phone profileImage walletBalance")
        .populate("astrologer", "name profileImage consultationFee specialization");

    return populatedSession;
};

/**
 * Accept Call Session & Generate Agora RTC Token (Astrologer -> User)
 */
const acceptCallSession = async (sessionId) => {
    let session = await VideoSession.findById(sessionId);
    if (!session) {
        // Try searching by roomId or channelName
        session = await VideoSession.findOne({
            $or: [{ roomId: sessionId }, { channelName: sessionId }]
        });
    }
    if (!session) throw new Error("Call session not found");

    if (session.status !== "PENDING" && session.status !== "ACTIVE" && session.status !== "live") {
        throw new Error(`Call session is no longer pending (current status: ${session.status})`);
    }

    const channelName = session.channelName || session.roomId;
    const agoraData = agoraService.generateRtcToken(channelName, 0, "publisher");

    session.status = "ACTIVE";
    if (!session.startTime) session.startTime = new Date();
    await session.save();

    const updatedSession = await VideoSession.findById(session._id)
        .populate("user", "firstname lastname phone profileImage walletBalance")
        .populate("astrologer", "name profileImage consultationFee");

    return {
        session: updatedSession,
        agora: agoraData
    };
};

/**
 * Reject Call Session (Astrologer -> User)
 */
const rejectCallSession = async (sessionId, reason = "Astrologer unavailable") => {
    let session = await VideoSession.findById(sessionId);
    if (!session) {
        session = await VideoSession.findOne({
            $or: [{ roomId: sessionId }, { channelName: sessionId }]
        });
    }
    if (!session) throw new Error("Call session not found");

    session.status = "REJECTED";
    session.rejectionReason = reason;
    session.endTime = new Date();
    await session.save();

    return session;
};

/**
 * End Active Call Session
 */
const endCallSession = async (sessionId) => {
    let session = await VideoSession.findById(sessionId);
    if (!session) {
        session = await VideoSession.findOne({
            $or: [{ roomId: sessionId }, { channelName: sessionId }]
        });
    }
    if (!session) throw new Error("Call session not found");

    const endTime = new Date();
    const startTime = session.startTime || session.createdAt || endTime;
    const durationMs = endTime.getTime() - new Date(startTime).getTime();
    const durationMinutes = Math.max(1, Math.ceil(durationMs / 60000));

    session.status = "COMPLETED";
    session.endTime = endTime;
    session.totalDurationMinutes = durationMinutes;
    session.duration = durationMinutes;
    await session.save();

    return session;
};

/**
 * Get Call Session Details by ID
 */
const getVideoSessionById = async (id) => {
    return await VideoSession.findById(id)
        .populate("appointment")
        .populate("user", "firstname lastname phone profileImage walletBalance")
        .populate("astrologer", "name profileImage consultationFee specialization");
};

/**
 * Get Call History for User or Astrologer
 */
const getCallHistory = async (userId, role = "user") => {
    const userObj = await findUserByIdOrRef(userId);
    const astroObj = await findAstrologerByIdOrRef(userId);

    const targetId = role === "astrologer" 
        ? (astroObj ? astroObj._id : userId)
        : (userObj ? userObj._id : userId);

    const query = role === "astrologer" ? { astrologer: targetId } : { user: targetId };
    return await VideoSession.find(query)
        .sort({ createdAt: -1 })
        .populate("user", "firstname lastname phone profileImage")
        .populate("astrologer", "name profileImage consultationFee");
};

// Legacy compatibility functions
const createVideoSession = async (videoData) => {
    const roomId = videoData.roomId || generateRoomId();
    const agoraData = agoraService.generateRtcToken(roomId, 0, "publisher");

    const sessionData = {
        appointment: videoData.appointment || null,
        user: videoData.user,
        astrologer: videoData.astrologer,
        callType: videoData.callType || "VIDEO",
        provider: "Agora",
        roomId: roomId,
        channelName: roomId,
        joinUrl: `https://kalpjoytish-app.com/video/${roomId}`,
        startTime: videoData.startTime ? new Date(videoData.startTime) : new Date(),
        endTime: videoData.endTime ? new Date(videoData.endTime) : new Date(Date.now() + 30 * 60 * 1000),
        duration: videoData.duration || 30,
        status: "scheduled"
    };

    const session = await VideoSession.create(sessionData);

    return {
        session,
        agora: agoraData
    };
};

const getAllVideoSessions = async () => {
    return await VideoSession.find()
        .populate("appointment")
        .populate("user")
        .populate("astrologer");
};

const startVideoSession = async (id) => {
    const session = await VideoSession.findById(id);
    if (!session) throw new Error("Video session not found");

    session.status = "live";
    session.startTime = new Date();
    await session.save();

    const agoraData = agoraService.generateRtcToken(session.roomId, 0, "publisher");

    return {
        session,
        agora: agoraData
    };
};

const endVideoSession = async (id) => {
    return await endCallSession(id);
};

const updateVideoSession = async (id, updateData) => {
    return await VideoSession.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

const deleteVideoSession = async (id) => {
    return await VideoSession.findByIdAndDelete(id);
};

module.exports = {
    generateAgoraToken,
    requestCallSession,
    acceptCallSession,
    rejectCallSession,
    endCallSession,
    getCallHistory,
    createVideoSession,
    getAllVideoSessions,
    getVideoSessionById,
    startVideoSession,
    endVideoSession,
    updateVideoSession,
    deleteVideoSession
};