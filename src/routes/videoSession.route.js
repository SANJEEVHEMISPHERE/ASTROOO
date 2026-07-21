const express = require("express");

const router = express.Router();

const videoSessionController = require("../controllers/videoSession.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post(
    "/create",
    videoSessionController.createVideoSession
);

router.get(
    "/all",
    videoSessionController.getAllVideoSessions
);

router.get(
    "/:id",
    videoSessionController.getVideoSessionById
);

router.put(
    "/update/:id",
    authMiddleware,
    videoSessionController.updateVideoSession
);

router.delete(
    "/delete/:id",
    authMiddleware,
    videoSessionController.deleteVideoSession
);

module.exports = router;