const express = require("express");

const router = express.Router();

const {
    createAstrologerLogin,
    loginAstrologer
} = require("../controllers/astrologerLogin.controller");

router.post("/register", createAstrologerLogin);
router.post("/login", loginAstrologer);

module.exports = router;