const express = require("express");

const router = express.Router();

const authRoutes = require("./auth.route");
const userRoutes = require("./user.route");
const astroRoutes = require("./astro.route");
const astrologerLoginRoute = require("./astrologerLogin.route");
const appointmentRoutes = require("./appointment.route");
const paymentRoutes = require("./payment.route");
const videoSessionRoutes = require("./videoSession.route");
const uploadRoutes = require("./upload.route");
const adminRoutes = require("./admin.route");
const astroInterviewRoutes = require("./astroInterview.route");

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/astro", astroRoutes);
router.use("/astrologer", astrologerLoginRoute);
router.use("/appointment", appointmentRoutes);
router.use("/payment", paymentRoutes);
router.use("/video-session", videoSessionRoutes);
router.use("/upload", uploadRoutes);
router.use("/admin", adminRoutes);
router.use("/interview", astroInterviewRoutes);

module.exports = router;