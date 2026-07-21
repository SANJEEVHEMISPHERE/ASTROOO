const mongoose = require("mongoose");

const AstroSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        specialization: {
            type: [String],
            required: true,
            default: []
        },

        experience: {
            type: Number,
            required: true,
            min: 0
        },

        languages: {
            type: [String],
            required: true,
            default: []
        },

        consultationFee: {
            type: Number,
            required: true,
            min: 0
        },

        about: {
            type: String,
            trim: true,
            default: null
        },

        profileImage: {
            type: String,
            default: null
        },

        consultationMode: {
            type: [String],
            enum: ["chat", "call", "video"],
            default: ["chat"]
        },

        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },

        totalReviews: {
            type: Number,
            default: 0,
            min: 0
        },

        totalConsultations: {
            type: Number,
            default: 0,
            min: 0
        },

        averageResponseTime: {
            type: Number,
            default: 0,
            min: 0
        },

        walletBalance: {
            type: Number,
            default: 0,
            min: 0
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        isAvailable: {
            type: Boolean,
            default: true
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Astrologer", AstroSchema);