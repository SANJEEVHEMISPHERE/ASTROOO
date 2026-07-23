const mongoose = require("mongoose");

const ChatSessionSchema = new mongoose.Schema(
    {
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

        status: {
            type: String,
            enum: ["PENDING", "ACCEPTED", "REJECTED", "ACTIVE", "COMPLETED", "CANCELLED"],
            default: "PENDING"
        },

        perMinuteRate: {
            type: Number,
            required: true,
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

        totalDurationMinutes: {
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

        rejectionReason: {
            type: String,
            default: null
        },

        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        },

        review: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("ChatSession", ChatSessionSchema);
