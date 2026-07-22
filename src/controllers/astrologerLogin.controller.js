const AstrologerLogin = require("../models/astrologerLogin.model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");

// Create Astrologer Login (Register)
exports.createAstrologerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // check existing email
        const existingAstrologer = await AstrologerLogin.findOne({ email });

        if (existingAstrologer) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const astrologerLogin = await AstrologerLogin.create({
            email,
            password: hashedPassword
        });

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
                email: astrologerLogin.email
            }
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
                email: astrologer.email
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};