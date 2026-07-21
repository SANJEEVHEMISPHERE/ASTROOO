const appointmentService = require("../services/appointment.service");

const createAppointment = async (req, res, next) => {
    try {
        const appointment = await appointmentService.createAppointment(req.body);

        res.status(201).json({
            success: true,
            message: "Appointment Created Successfully",
            data: appointment
        });
    } catch (error) {
        next(error);
    }
};

const getAllAppointments = async (req, res, next) => {
    try {
        const appointments = await appointmentService.getAllAppointments();

        res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments
        });
    } catch (error) {
        next(error);
    }
};

const getAppointmentById = async (req, res, next) => {
    try {
        const appointment = await appointmentService.getAppointmentById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment Not Found"
            });
        }

        res.status(200).json({
            success: true,
            data: appointment
        });
    } catch (error) {
        next(error);
    }
};

const updateAppointment = async (req, res, next) => {
    try {
        const appointment = await appointmentService.updateAppointment(
            req.params.id,
            req.body
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment Not Found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Appointment Updated Successfully",
            data: appointment
        });
    } catch (error) {
        next(error);
    }
};

const deleteAppointment = async (req, res, next) => {
    try {
        const appointment = await appointmentService.deleteAppointment(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment Not Found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Appointment Deleted Successfully"
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createAppointment,
    getAllAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment
};