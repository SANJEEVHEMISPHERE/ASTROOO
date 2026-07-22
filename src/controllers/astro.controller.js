const AstrologerLogin = require("../models/astrologerLogin.model");
const astroService = require("../services/astro.service");

const normalizeAstroData = async (req) => {
    const body = req.body;
    let astrologerLoginId = body.astrologerLogin || body.astrologerLoginId || body.astrologerId || null;
    let userId = body.user || body.userId || null;

    // If request has JWT user from authMiddleware
    if (req.user) {
        if (req.user.role === "astrologer") {
            astrologerLoginId = astrologerLoginId || req.user.userId;
        } else {
            userId = userId || req.user.userId;
        }
    }

    let name = body.name || body.fullName || body.astrologerName || null;
    let email = body.email || null;

    // Auto-fetch name and email from AstrologerLogin record if ID is provided
    if (astrologerLoginId) {
        try {
            const loginInfo = await AstrologerLogin.findById(astrologerLoginId);
            if (loginInfo) {
                name = name || loginInfo.name;
                email = email || loginInfo.email;
            }
        } catch (err) {}
    }

    return {
        ...body,
        name,
        email,
        astrologerLogin: astrologerLoginId,
        user: userId,
        profileImage: body.profilePhoto || body.profileImage || null,
        introduction: body.introduction || body.about || null,
        about: body.introduction || body.about || null,
        strengths: body.selectedStrengths || body.strengths || [],
        specialization: body.selectedSpecializations || body.specialization || [],
        certificateName: body.certificateName || null,
        certificateFile: body.certificateFile || null
    };
};

const createAstrologer = async (req, res, next) => {
    try {
        const payload = await normalizeAstroData(req);
        const astrologer = await astroService.createAstrologer(payload);

        return res.status(201).json({
            success: true,
            message: "Astrologer Created Successfully",
            data: astrologer
        });

    } catch (error) {
        next(error);
    }
};

const getAllAstrologers = async (req, res, next) => {
    try {
        const astrologers = await astroService.getAllAstrologers();

        return res.status(200).json({
            success: true,
            count: astrologers.length,
            data: astrologers
        });

    } catch (error) {
        next(error);
    }
};

const getAstrologerById = async (req, res, next) => {
    try {
        const astrologer = await astroService.getAstrologerById(req.params.id);

        return res.status(200).json({
            success: true,
            data: astrologer
        });

    } catch (error) {
        next(error);
    }
};

const updateAstrologer = async (req, res, next) => {
    try {
        const payload = await normalizeAstroData(req);
        const astrologer = await astroService.updateAstrologer(
            req.params.id,
            payload
        );

        return res.status(200).json({
            success: true,
            message: "Astrologer Updated Successfully",
            data: astrologer
        });

    } catch (error) {
        next(error);
    }
};

const deleteAstrologer = async (req, res, next) => {
    try {
        await astroService.deleteAstrologer(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Astrologer Deleted Successfully"
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createAstrologer,
    getAllAstrologers,
    getAstrologerById,
    updateAstrologer,
    deleteAstrologer
};