const express = require("express");

const router = express.Router();

const {
    createAstrologerLogin
}=require("../controllers/astrologerLogin.controller");


router.post(
    "/register",
    createAstrologerLogin
);


module.exports = router;