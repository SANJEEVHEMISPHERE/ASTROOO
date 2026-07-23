const mongoose = require("mongoose");

const AstroInterviewSchema = new mongoose.Schema(
    {
        astrologer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Astrologer",
            required: true
        },

        status: {
            type: String,
            enum: ["requested", "scheduled", "passed", "failed", "cancelled"],
            default: "requested"
        },

        result: {
            type: String,
            enum: ["pending", "pass", "fail"],
            default: "pending"
        },

        interviewDate: {
            type: Date,
            default: null
        },

        meetingLink: {
            type: String,
            default: null,
            trim: true
        },

        requestNotes: {
            type: String,
            default: null,
            trim: true
        },

        interviewerNotes: {
            type: String,
            default: null,
            trim: true
        },

        scheduledAt: {
            type: Date,
            default: null
        },

        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("AstroInterview", AstroInterviewSchema);
