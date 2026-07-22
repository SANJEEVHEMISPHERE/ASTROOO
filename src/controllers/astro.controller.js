const AstrologerLogin = require("../models/astrologerLogin.model");
const Astrologer = require("../models/astro.model");
const astroService = require("../services/astro.service");

const normalizeAstroData = async (req) => {
    const body = req.body || {};
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

    let name = body.name || body.fullName || body.astrologerName || undefined;
    let email = body.email || undefined;

    // Auto-fetch name and email from AstrologerLogin record if ID is provided
    if (astrologerLoginId && (!name || !email)) {
        try {
            const loginInfo = await AstrologerLogin.findById(astrologerLoginId);
            if (loginInfo) {
                name = name || loginInfo.name;
                email = email || loginInfo.email;
            }
        } catch (err) {}
    }

    const payload = {};

    if (astrologerLoginId) payload.astrologerLogin = astrologerLoginId;
    if (userId) payload.user = userId;
    if (name) payload.name = name;
    if (email) payload.email = email;

    const profileImage = body.profilePhoto || body.profileImage;
    if (profileImage) payload.profileImage = profileImage;

    const introduction = body.introduction || body.about;
    if (introduction) {
        payload.introduction = introduction;
        payload.about = introduction;
    }

    if (body.experience !== undefined && body.experience !== null) payload.experience = String(body.experience);
    if (body.approach !== undefined && body.approach !== null) payload.approach = body.approach;
    if (body.motivation !== undefined && body.motivation !== null) payload.motivation = body.motivation;
    if (body.toolsTechniques !== undefined && body.toolsTechniques !== null) payload.toolsTechniques = body.toolsTechniques;
    if (body.achievements !== undefined && body.achievements !== null) payload.achievements = body.achievements;
    if (body.certificateName !== undefined && body.certificateName !== null) payload.certificateName = body.certificateName;
    if (body.certificateFile !== undefined && body.certificateFile !== null) payload.certificateFile = body.certificateFile;
    if (body.consultationFee !== undefined && body.consultationFee !== null) payload.consultationFee = body.consultationFee;

    const strengths = body.selectedStrengths || body.strengths;
    if (strengths && Array.isArray(strengths) && strengths.length > 0) {
        payload.strengths = strengths;
    }

    const specialization = body.selectedSpecializations || body.specialization;
    if (specialization && Array.isArray(specialization) && specialization.length > 0) {
        payload.specialization = specialization;
    }

    const languages = body.languages;
    if (languages && Array.isArray(languages) && languages.length > 0) {
        payload.languages = languages;
    }

    return payload;
};

const createAstrologer = async (req, res, next) => {
    try {
        const payload = await normalizeAstroData(req);

        let astrologer = null;

        // Upsert if profile already exists for astrologerLogin or email
        if (payload.astrologerLogin || payload.email) {
            const queryConditions = [];
            if (payload.astrologerLogin) queryConditions.push({ astrologerLogin: payload.astrologerLogin });
            if (payload.email) queryConditions.push({ email: payload.email });

            const existing = await Astrologer.findOne({ $or: queryConditions });

            if (existing) {
                astrologer = await astroService.updateAstrologer(existing._id, payload);
            }
        }

        if (!astrologer) {
            astrologer = await astroService.createAstrologer(payload);
        }

        return res.status(201).json({
            success: true,
            message: "Astrologer Profile Saved Successfully",
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