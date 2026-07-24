const mongoose = require("mongoose");

const VideoSessionSchema = new mongoose.Schema(
{
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
        required: false,
        default: null
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

    callType: {
        type: String,
        enum: ["AUDIO", "VIDEO"],
        default: "VIDEO"
    },

    provider: {
        type: String,
        enum: ["Agora", "ZegoCloud", "100ms", "Google Meet"],
        default: "Agora"
    },

    roomId: {
        type: String,
        required: true,
        trim: true
    },

    channelName: {
        type: String,
        trim: true,
        default: null
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

    perMinuteRate: {
        type: Number,
        default: 0,
        min: 0
    },

    totalAmountDeducted: {
        type: Number,
        default: 0,
        min: 0
    },

    astrologerEarnings: {
        type: Number,
        default: 0,
        min: 0
    },

    totalDurationMinutes: {
        type: Number,
        default: 0,
        min: 0
    },

    startTime: {
        type: Date,
        default: null
    },

    endTime: {
        type: Date,
        default: null
    },

    duration: {
        type: Number,
        default: 0
    },

    rejectionReason: {
        type: String,
        default: null
    },

    status: {
        type: String,
        enum: [
            "PENDING",
            "ACTIVE",
            "COMPLETED",
            "REJECTED",
            "MISSED",
            "CANCELLED",
            "scheduled",
            "live",
            "completed",
            "cancelled"
        ],
        default: "PENDING"
    }

},
{
    timestamps: true
});

module.exports = mongoose.model("VideoSession", VideoSessionSchema);