const express = require("express");

const router = express.Router();

const {
    createAstrologerLogin,
    loginAstrologer,
    forgotPasswordSendOtp,
    forgotPasswordReset
} = require("../controllers/astrologerLogin.controller");

router.post("/register", createAstrologerLogin);
router.post("/login", loginAstrologer);
router.post("/forgot-password/send-otp", forgotPasswordSendOtp);
router.post("/forgot-password/reset", forgotPasswordReset);

module.exports = router;