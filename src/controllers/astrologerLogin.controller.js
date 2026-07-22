const AstrologerLogin = require("../models/astrologerLogin.model");
const Astrologer = require("../models/astro.model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");

// Create Astrologer Login (Register)
exports.createAstrologerLogin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Check existing email in AstrologerLogin
        const existingAstrologer = await AstrologerLogin.findOne({ email });

        if (existingAstrologer) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const astrologerLogin = await AstrologerLogin.create({
            name: name || null,
            email,
            password: hashedPassword
        });

        // Automatically create initial Astrologer profile entry so it shows in GET /api/astro/all
        let astroProfile = await Astrologer.findOne({ email });
        if (!astroProfile) {
            astroProfile = await Astrologer.create({
                astrologerLogin: astrologerLogin._id,
                name: astrologerLogin.name,
                email: astrologerLogin.email,
                isAvailable: true,
                status: "pending"
            });
        } else {
            astroProfile.astrologerLogin = astrologerLogin._id;
            if (astrologerLogin.name) astroProfile.name = astrologerLogin.name;
            await astroProfile.save();
        }

        const token = generateToken({
            userId: astrologerLogin._id,
            role: "astrologer"
        });

        res.status(201).json({
            success: true,
            message: "Astrologer registered successfully",
            token,
            astrologerLogin: {
                id: astrologerLogin._id,
                name: astrologerLogin.name,
                email: astrologerLogin.email
            },
            astrologerProfile: astroProfile
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

// Login Astrologer
exports.loginAstrologer = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find astrologer by email
        const astrologer = await AstrologerLogin.findOne({ email });

        if (!astrologer) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, astrologer.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Ensure Astrologer profile entry exists
        let astroProfile = await Astrologer.findOne({
            $or: [
                { astrologerLogin: astrologer._id },
                { email: astrologer.email }
            ]
        });

        if (!astroProfile) {
            astroProfile = await Astrologer.create({
                astrologerLogin: astrologer._id,
                name: astrologer.name,
                email: astrologer.email,
                isAvailable: true,
                status: "pending"
            });
        }

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
            astrologerProfile: astroProfile
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};