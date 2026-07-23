const videoSessionService = require("../services/videoSession.service");

// 1. GENERATE AGORA RTC TOKEN
const generateAgoraToken = async (req, res) => {
    try {
        const { channelName, uid, role } = req.body;

        if (!channelName) {
            return res.status(400).json({
                success: false,
                message: "channelName is required"
            });
        }

        const tokenData = videoSessionService.generateAgoraToken(channelName, uid, role);

        return res.status(200).json({
            success: true,
            message: "Agora RTC Token generated successfully",
            data: tokenData
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// 2. CREATE VIDEO SESSION
const createVideoSession = async (req, res) => {
    try {
        const result = await videoSessionService.createVideoSession(req.body);

        return res.status(201).json({
            success: true,
            message: "Video Session Created Successfully",
            data: result
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// 3. START VIDEO SESSION
const startVideoSession = async (req, res) => {
    try {
        const sessionId = req.params.id || req.body.sessionId;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Session ID is required"
            });
        }

        const result = await videoSessionService.startVideoSession(sessionId);

        return res.status(200).json({
            success: true,
            message: "Video Session started (Status: live)",
            data: result
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// 4. END VIDEO SESSION
const endVideoSession = async (req, res) => {
    try {
        const sessionId = req.params.id || req.body.sessionId;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Session ID is required"
            });
        }

        const session = await videoSessionService.endVideoSession(sessionId);

        return res.status(200).json({
            success: true,
            message: "Video Session ended (Status: completed)",
            data: session
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// 5. GET ALL SESSIONS
const getAllVideoSessions = async (req, res) => {
    try {
        const sessions = await videoSessionService.getAllVideoSessions();

        return res.status(200).json({
            success: true,
            count: sessions.length,
            data: sessions
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 6. GET SESSION BY ID
const getVideoSessionById = async (req, res) => {
    try {
        const session = await videoSessionService.getVideoSessionById(req.params.id);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Video Session Not Found"
            });
        }

        return res.status(200).json({
            success: true,
            data: session
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 7. UPDATE SESSION
const updateVideoSession = async (req, res) => {
    try {
        const session = await videoSessionService.updateVideoSession(
            req.params.id,
            req.body
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Video Session Not Found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Video Session Updated Successfully",
            data: session
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 8. DELETE SESSION
const deleteVideoSession = async (req, res) => {
    try {
        const session = await videoSessionService.deleteVideoSession(req.params.id);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Video Session Not Found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Video Session Deleted Successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    generateAgoraToken,
    createVideoSession,
    startVideoSession,
    endVideoSession,
    getAllVideoSessions,
    getVideoSessionById,
    updateVideoSession,
    deleteVideoSession
};