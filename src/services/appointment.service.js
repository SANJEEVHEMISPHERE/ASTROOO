const Appointment = require("../models/appointment.model");
const User = require("../models/user.model");
const Astrologer = require("../models/astro.model");

const createAppointment = async (appointmentData) => {

    // Check User
    const user = await User.findById(appointmentData.user);

    if (!user) {
        throw new Error("User not found");
    }

    // Check Astrologer
    const astrologer = await Astrologer.findById(appointmentData.astrologer);

    if (!astrologer) {
        throw new Error("Astrologer not found");
    }

    // Check Verification
    if (!astrologer.isVerified) {
        throw new Error("Astrologer is not verified");
    }

    // Check Availability
    if (!astrologer.isAvailable) {
        throw new Error("Astrologer is currently unavailable");
    }

    // Check Duplicate Slot
    const existingAppointment = await Appointment.findOne({
        astrologer: appointmentData.astrologer,
        appointmentDate: appointmentData.appointmentDate,
        appointmentTime: appointmentData.appointmentTime,
        appointmentStatus: {
            $in: ["pending", "confirmed"]
        }
    });

    if (existingAppointment) {
        throw new Error("This slot is already booked");
    }

    return await Appointment.create(appointmentData);
};

const getAllAppointments = async () => {
    return await Appointment.find()
        .populate("user")
        .populate("astrologer");
};

const getAppointmentById = async (id) => {
    return await Appointment.findById(id)
        .populate("user")
        .populate("astrologer");
};

const updateAppointment = async (id, updateData) => {
    return await Appointment.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
            runValidators: true
        }
    );
};

const deleteAppointment = async (id) => {
    return await Appointment.findByIdAndDelete(id);
};

module.exports = {
    createAppointment,
    getAllAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment
};