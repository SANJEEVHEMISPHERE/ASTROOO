const mongoose = require("mongoose");

const VideoSessionSchema = new mongoose.Schema(
{
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
        required: true,
        unique: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    astrologer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Astrologer",
        required: true
    },

    provider: {
        type: String,
        enum: ["Agora", "ZegoCloud", "100ms", "Google Meet"],
        default: "Agora"
    },

    roomId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    joinUrl: {
        type: String,
        default: null
    },

    meetingId: {
        type: String,
        default: null
    },

    meetingPassword: {
        type: String,
        default: null
    },

    startTime: {
        type: Date,
        required: true
    },

    endTime: {
        type: Date,
        required: true
    },

    duration: {
        type: Number,
        default: 30
    },

    status: {
        type: String,
        enum: [
            "scheduled",
            "live",
            "completed",
            "cancelled"
        ],
        default: "scheduled"
    }

},
{
    timestamps: true
});

module.exports = mongoose.model("VideoSession", VideoSessionSchema);