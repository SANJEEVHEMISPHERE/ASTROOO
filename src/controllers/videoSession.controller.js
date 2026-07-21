const videoSessionService = require("../services/videoSession.service");

const createVideoSession = async (req, res) => {
    try {

        const session = await videoSessionService.createVideoSession(req.body);

        return res.status(201).json({
            success: true,
            message: "Video Session Created Successfully",
            data: session
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }
};

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
    createVideoSession,
    getAllVideoSessions,
    getVideoSessionById,
    updateVideoSession,
    deleteVideoSession
};