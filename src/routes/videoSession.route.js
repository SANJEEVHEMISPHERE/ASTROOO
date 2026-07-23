const express = require("express");

const router = express.Router();

const videoSessionController = require("../controllers/videoSession.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Agora Token Generation
router.post("/generate-token", videoSessionController.generateAgoraToken);

// Create Session & Tokens
router.post("/create", videoSessionController.createVideoSession);

// Session Lifecycle (Start & End)
router.post("/start", videoSessionController.startVideoSession);
router.post("/start/:id", videoSessionController.startVideoSession);
router.post("/end", videoSessionController.endVideoSession);
router.post("/end/:id", videoSessionController.endVideoSession);

// Listing & Details
router.get("/all", videoSessionController.getAllVideoSessions);
router.get("/:id", videoSessionController.getVideoSessionById);

// Update & Delete
router.put("/update/:id", authMiddleware, videoSessionController.updateVideoSession);
router.delete("/delete/:id", authMiddleware, videoSessionController.deleteVideoSession);

module.exports = router;