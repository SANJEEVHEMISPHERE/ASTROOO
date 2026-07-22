const AstrologerLogin = require("../models/astrologerLogin.model");
const Astrologer = require("../models/astro.model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");

// 1. REGISTER ASTROLOGER (Saves ALL signup & profile details directly into Astrologer collection)
exports.createAstrologerLogin = async (req, res) => {
    try {
        const body = req.body || {};
        const { name, email, password } = body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Check if email already registered in Astrologer collection
        const existingAstrologer = await Astrologer.findOne({ email: email.toLowerCase() });

        if (existingAstrologer) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Extract all optional profile fields sent during signup
        const profileImage = body.profilePhoto || body.profileImage || null;
        const introduction = body.introduction || body.about || null;
        const about = body.introduction || body.about || null;
        const experience = body.experience ? String(body.experience) : "0";
        const strengths = body.selectedStrengths || body.strengths || [];
        const specialization = body.selectedSpecializations || body.specialization || [];
        const languages = body.languages || [];
        const approach = body.approach || null;
        const motivation = body.motivation || null;
        const toolsTechniques = body.toolsTechniques || null;
        const certificateFile = body.certificateFile || null;
        const certificateName = body.certificateName || null;
        const achievements = body.achievements || null;

        // Save ALL astrologer details directly in Astrologer collection
        const astrologer = await Astrologer.create({
            name: name || body.fullName || body.astrologerName || null,
            email: email.toLowerCase(),
            password: hashedPassword,
            profileImage,
            introduction,
            about,
            experience,
            strengths,
            specialization,
            languages,
            approach,
            motivation,
            toolsTechniques,
            certificateFile,
            certificateName,
            achievements,
            isAvailable: true,
            status: "pending"
        });

        // Generate JWT token
        const token = generateToken({
            userId: astrologer._id,
            role: "astrologer"
        });

        res.status(201).json({
            success: true,
            message: "Astrologer registered successfully",
            token,
            astrologer
        });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

// 2. LOGIN ASTROLOGER (Only saves in AstrologerLogin collection upon SUCCESSFUL login)
exports.loginAstrologer = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find registered astrologer in Astrologer collection by email
        const astrologer = await Astrologer.findOne({ email: email.toLowerCase() });

        if (!astrologer || !astrologer.password) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Compare bcrypt password
        const isPasswordValid = await bcrypt.compare(password, astrologer.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // UPON SUCCESSFUL LOGIN: Save login record in AstrologerLogin collection
        const loginRecord = await AstrologerLogin.create({
            astrologer: astrologer._id,
            name: astrologer.name,
            email: astrologer.email,
            password: astrologer.password,
            lastLoginAt: new Date()
        });

        // Link AstrologerLogin reference in Astrologer document
        astrologer.astrologerLogin = loginRecord._id;
        await astrologer.save();

        // Generate JWT token
        const token = generateToken({
            userId: astrologer._id,
            role: "astrologer"
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            astrologer,
            loginRecord
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};