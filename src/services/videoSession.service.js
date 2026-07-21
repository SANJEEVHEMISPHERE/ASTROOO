const VideoSession = require("../models/videoSession.model");
const Appointment = require("../models/appointment.model");
const User = require("../models/user.model");
const Astrologer = require("../models/astro.model");

const generateRoomId = () => {
    return "ROOM_" + Date.now();
};

const createVideoSession = async (videoData) => {

    // Check Appointment
    const appointment = await Appointment.findById(videoData.appointment);

    if (!appointment) {
        throw new Error("Appointment not found");
    }

    // Appointment must be confirmed
    if (appointment.appointmentStatus !== "confirmed") {
        throw new Error("Appointment is not confirmed");
    }

    // Check User
    const user = await User.findById(videoData.user);

    if (!user) {
        throw new Error("User not found");
    }

    // Check Astrologer
    const astrologer = await Astrologer.findById(videoData.astrologer);

    if (!astrologer) {
        throw new Error("Astrologer not found");
    }

    // Prevent duplicate video session
    const existingSession = await VideoSession.findOne({
        appointment: videoData.appointment
    });

    if (existingSession) {
        throw new Error("Video session already exists");
    }

    videoData.roomId = generateRoomId();

    return await VideoSession.create(videoData);
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
    createVideoSession,
    getAllVideoSessions,
    getVideoSessionById,
    updateVideoSession,
    deleteVideoSession
};