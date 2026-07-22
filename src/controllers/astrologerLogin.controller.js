const AstrologerLogin = require("../models/astrologerLogin.model");
const Astrologer = require("../models/astro.model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");

// 1. REGISTER ASTROLOGER (Saves ONLY in Astrologer collection, NOT in AstrologerLogin)
exports.createAstrologerLogin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

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

        // Save ONLY in Astrologer collection (Cluster)
        const astrologer = await Astrologer.create({
            name: name || null,
            email: email.toLowerCase(),
            password: hashedPassword,
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
            astrologer: {
                id: astrologer._id,
                name: astrologer.name,
                email: astrologer.email
            }
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
            astrologer: {
                id: astrologer._id,
                name: astrologer.name,
                email: astrologer.email
            },
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