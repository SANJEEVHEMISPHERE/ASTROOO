const VideoSession = require("../models/videoSession.model");
const Appointment = require("../models/appointment.model");
const User = require("../models/user.model");
const Astrologer = require("../models/astro.model");
const agoraService = require("./agora.service");

const generateRoomId = () => {
    return "room_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
};

/**
 * Generate standalone Agora RTC Token
 */
const generateAgoraToken = (channelName, uid = 0, role = "publisher") => {
    return agoraService.generateRtcToken(channelName, uid, role);
};

/**
 * Create a new Video Session with generated Room ID and Agora Tokens
 */
const createVideoSession = async (videoData) => {
    const roomId = videoData.roomId || generateRoomId();

    let appointmentObj = null;
    let userObj = null;
    let astrologerObj = null;

    if (videoData.appointment) {
        appointmentObj = await Appointment.findById(videoData.appointment);
    }
    if (videoData.user) {
        userObj = await User.findById(videoData.user);
    }
    if (videoData.astrologer) {
        astrologerObj = await Astrologer.findById(videoData.astrologer);
    }

    // Generate Agora RTC Token for this session
    const agoraData = agoraService.generateRtcToken(roomId, 0, "publisher");

    const sessionData = {
        appointment: videoData.appointment || null,
        user: videoData.user,
        astrologer: videoData.astrologer,
        provider: "Agora",
        roomId: roomId,
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

const getVideoSessionById = async (id) => {
    return await VideoSession.findById(id)
        .populate("appointment")
        .populate("user")
        .populate("astrologer");
};

const startVideoSession = async (id) => {
    const session = await VideoSession.findById(id);
    if (!session) {
        throw new Error("Video session not found");
    }

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
    const session = await VideoSession.findById(id);
    if (!session) {
        throw new Error("Video session not found");
    }

    const endTime = new Date();
    const durationInMs = endTime - (session.startTime || endTime);
    const durationInMinutes = Math.max(1, Math.ceil(durationInMs / (1000 * 60)));

    session.status = "completed";
    session.endTime = endTime;
    session.duration = durationInMinutes;
    await session.save();

    return session;
};

const updateVideoSession = async (id, updateData) => {
    return await VideoSession.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
            runValidators: true
        }
    );
};

const deleteVideoSession = async (id) => {
    return await VideoSession.findByIdAndDelete(id);
};

module.exports = {
    generateAgoraToken,
    createVideoSession,
    getAllVideoSessions,
    getVideoSessionById,
    startVideoSession,
    endVideoSession,
    updateVideoSession,
    deleteVideoSession
};