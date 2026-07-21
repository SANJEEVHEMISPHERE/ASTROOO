const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema(
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

    appointmentDate: {
        type: Date,
        required: true
    },

    appointmentTime: {
        type: String,
        required: true
    },

    consultationMode: {
        type: String,
        enum: ["chat", "call", "video"],
        required: true
    },

    duration: {
        type: Number,
        default: 30,
        min: 5
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    },

    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
    },

    appointmentStatus: {
        type: String,
        enum: [
            "pending",
            "confirmed",
            "completed",
            "cancelled"
        ],
        default: "pending"
    },

    notes: {
        type: String,
        trim: true,
        default: null
    }

},
{
    timestamps: true
});

module.exports = mongoose.model("Appointment", AppointmentSchema);