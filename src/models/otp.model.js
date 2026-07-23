const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema(
    {
        phone: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        otp: {
            type: String,
            required: true
        },
        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes TTL
            index: { expires: 0 } // Automatic removal after expiration
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Otp", OtpSchema);
