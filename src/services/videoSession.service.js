const VideoSession = require("../models/videoSession.model");
const Appointment = require("../models/appointment.model");
const User = require("../models/user.model");
const Astrologer = require("../models/astro.model");
const agoraService = require("./agora.service");

const generateRoomId = (prefix = "room") => {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
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
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const astrologer = await Astrologer.findById(astrologerId);
    if (!astrologer) throw new Error("Astrologer not found");

    const perMinuteRate = astrologer.consultationFee || 0;

    if (user.walletBalance < perMinuteRate) {
        throw new Error(`Insufficient wallet balance. Minimum ₹${perMinuteRate} required to request call.`);
    }

    const roomId = generateRoomId(callType === "AUDIO" ? "audio" : "video");
    const channelName = roomId;

    const newSession = await VideoSession.create({
        user: userId,
        astrologer: astrologerId,
        callType: callType.toUpperCase(),
        provider: "Agora",
        roomId,
        channelName,
        perMinuteRate,
        status: "PENDING"
    });

    const populatedSession = await VideoSession.findById(newSession._id)
        .populate("user", "firstname lastname phone profileImage walletBalance")
        .populate("astrologer", "name profileImage consultationFee specialization");

    return populatedSession;
};

/**
 * Accept Call Session & Generate Agora RTC Token (Astrologer -> User)
 */
const acceptCallSession = async (sessionId) => {
    const session = await VideoSession.findById(sessionId);
    if (!session) throw new Error("Call session not found");

    if (session.status !== "PENDING") {
        throw new Error(`Call session is no longer pending (current status: ${session.status})`);
    }

    const channelName = session.channelName || session.roomId;
    const agoraData = agoraService.generateRtcToken(channelName, 0, "publisher");

    session.status = "ACTIVE";
    session.startTime = new Date();
    await session.save();

    const updatedSession = await VideoSession.findById(sessionId)
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
    const session = await VideoSession.findById(sessionId);
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
    const session = await VideoSession.findById(sessionId);
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
    const query = role === "astrologer" ? { astrologer: userId } : { user: userId };
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