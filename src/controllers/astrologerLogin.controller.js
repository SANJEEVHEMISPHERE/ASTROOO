const AstrologerLogin = require("../models/astrologerLogin.model");
const Astrologer = require("../models/astro.model");
const Otp = require("../models/otp.model");
const twilioService = require("../services/twilio.service");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");

// 1. REGISTER ASTROLOGER
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

        // Check if email already registered
        const existingAstrologer = await Astrologer.findOne({ email: email.toLowerCase() });

        if (existingAstrologer) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Extract optional profile fields if provided during signup
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

        // Save Astrologer record
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

        return res.status(201).json({
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

// 2. LOGIN ASTROLOGER (Only email & password required)
exports.loginAstrologer = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find registered astrologer by email
        const astrologer = await Astrologer.findOne({ email: email.toLowerCase() });

        if (!astrologer || !astrologer.password) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Verify bcrypt password
        const isPasswordValid = await bcrypt.compare(password, astrologer.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Save login timestamp & audit record in AstrologerLogin
        try {
            const loginRecord = await AstrologerLogin.create({
                astrologer: astrologer._id,
                name: astrologer.name,
                email: astrologer.email,
                password: astrologer.password,
                lastLoginAt: new Date()
            });

            astrologer.astrologerLogin = loginRecord._id;
            await astrologer.save();
        } catch (e) {}

        // Generate JWT token
        const token = generateToken({
            userId: astrologer._id,
            role: "astrologer"
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            astrologer
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

// 3. FORGOT PASSWORD - SEND OTP
exports.forgotPasswordSendOtp = async (req, res) => {
    try {
        const identifier = req.body.email || req.body.phone || req.body.identifier;

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: "Email or phone number is required"
            });
        }

        const query = identifier.includes("@")
            ? { email: identifier.toLowerCase() }
            : { phone: identifier };

        const astrologer = await Astrologer.findOne(query);

        if (!astrologer) {
            return res.status(404).json({
                success: false,
                message: "Astrologer account not found with this email/phone"
            });
        }

        // Generate custom 6 digit OTP for fallback / custom SMS mode
        const targetPhone = astrologer.phone || identifier;
        const customOtp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP in DB
        await Otp.deleteMany({ phone: targetPhone });
        await Otp.create({
            phone: targetPhone,
            otp: customOtp
        });

        // Trigger Twilio service if phone is available, or fallback
        const result = await twilioService.sendOtp(targetPhone, customOtp);

        return res.status(200).json({
            success: true,
            message: result.message || "OTP sent successfully to registered phone/email",
            data: {
                phone: targetPhone,
                mock: result.mock || false,
                ...(result.otp ? { otp: result.otp } : {})
            }
        });

    } catch (error) {
        console.error("Forgot Password Send OTP Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

// 4. FORGOT PASSWORD - RESET PASSWORD
exports.forgotPasswordReset = async (req, res) => {
    try {
        const identifier = req.body.email || req.body.phone || req.body.identifier;
        const { otp, newPassword } = req.body;

        if (!identifier || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email/Phone, OTP code, and new password are required"
            });
        }

        if (newPassword.length < 4) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 4 characters long"
            });
        }

        const query = identifier.includes("@")
            ? { email: identifier.toLowerCase() }
            : { phone: identifier };

        const astrologer = await Astrologer.findOne(query);

        if (!astrologer) {
            return res.status(404).json({
                success: false,
                message: "Astrologer account not found"
            });
        }

        const targetPhone = astrologer.phone || identifier;

        let isVerified = false;

        // 1. Check Twilio Verify Service if configured
        const twilioResult = await twilioService.verifyOtp(targetPhone, otp);
        if (twilioResult.success && twilioResult.status === "approved") {
            isVerified = true;
        } else if (twilioResult.mock && twilioResult.success) {
            isVerified = true;
        } else {
            // 2. Fallback: Check local DB Otp model
            const existingOtp = await Otp.findOne({ phone: targetPhone, otp });
            if (existingOtp) {
                isVerified = true;
            }
        }

        if (!isVerified) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        // Clean up OTP record
        await Otp.deleteMany({ phone: targetPhone });

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in Astrologer model
        astrologer.password = hashedPassword;
        await astrologer.save();

        // Update password in AstrologerLogin audit model if email exists
        if (astrologer.email) {
            try {
                await AstrologerLogin.updateMany(
                    { email: astrologer.email.toLowerCase() },
                    { $set: { password: hashedPassword } }
                );
            } catch (e) {}
        }

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now login with your new password."
        });

    } catch (error) {
        console.error("Forgot Password Reset Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};