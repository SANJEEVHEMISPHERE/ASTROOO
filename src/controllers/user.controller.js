const User = require("../models/user.model");
const { generateToken } = require("../utils/jwt");

const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        next(error);
    }
};

// Register New User directly
const registerUser = async (req, res, next) => {
    try {
        const {
            firstname,
            middlename,
            lastname,
            phone,
            email,
            dateofbirth,
            placeofbirth,
            state,
            country,
            address,
            tuloId
        } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
            });
        }

        // Check existing user by phone
        let existingUser = await User.findOne({ phone });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this phone number already exists"
            });
        }

        const generatedTuloId = tuloId || `tulo_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        const user = await User.create({
            firstname,
            middlename,
            lastname,
            phone,
            email: email || null,
            dateofbirth,
            placeofbirth,
            state,
            country,
            address,
            tuloId: generatedTuloId,
            role: "user",
            isProfileCompleted: true
        });

        const token = generateToken({
            userId: user._id,
            role: user.role
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user,
                token
            }
        });

    } catch (error) {
        next(error);
    }
};

// Update / Complete User Profile
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const updates = req.body;

        updates.isProfileCompleted = true;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: user
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    registerUser,
    updateProfile
};