const adminService = require("../services/admin.service");

// 1. REGISTER / CREATE ADMIN
const registerAdmin = async (req, res, next) => {
    try {
        const result = await adminService.createAdmin(req.body);

        return res.status(201).json({
            success: true,
            message: "Admin account registered successfully",
            data: result
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// 2. LOGIN ADMIN
const loginAdmin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await adminService.loginAdmin(email, password);

        return res.status(200).json({
            success: true,
            message: "Admin login successful",
            data: result
        });

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

// 3. GET LOGGED-IN ADMIN PROFILE
const getProfile = async (req, res, next) => {
    try {
        const adminId = req.user.userId;
        const admin = await adminService.getAdminById(adminId);

        return res.status(200).json({
            success: true,
            data: admin
        });

    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    registerAdmin,
    loginAdmin,
    getProfile
};
