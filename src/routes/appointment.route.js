const express = require("express");

const router = express.Router();

const appointmentController = require("../controllers/appointment.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post(
    "/create",
    appointmentController.createAppointment
);

router.get(
    "/all",
    appointmentController.getAllAppointments
);

router.get(
    "/:id",
    appointmentController.getAppointmentById
);

router.put(
    "/update/:id",
    authMiddleware,
    appointmentController.updateAppointment
);

router.delete(
    "/delete/:id",
    authMiddleware,
    appointmentController.deleteAppointment
);

module.exports = router;