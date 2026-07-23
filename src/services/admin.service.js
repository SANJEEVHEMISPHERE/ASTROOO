const Admin = require("../models/admin.model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");

/**
 * Register / Create new Admin
 */
const createAdmin = async (data) => {
    const { name, email, password, role } = data;

    if (!name || !email || !password) {
        throw new Error("Name, email and password are required for admin creation");
    }

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
        throw new Error("Admin with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || "admin"
    });

    const token = generateToken({
        userId: admin._id,
        role: admin.role
    });

    return {
        admin: {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            createdAt: admin.createdAt
        },
        token
    };
};

/**
 * Login Admin with Email and Password
 */
const loginAdmin = async (email, password) => {
    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
        throw new Error("Invalid admin email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
        throw new Error("Invalid admin email or password");
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = generateToken({
        userId: admin._id,
        role: admin.role
    });

    return {
        admin: {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            lastLoginAt: admin.lastLoginAt
        },
        token
    };
};

/**
 * Get Admin Details by ID
 */
const getAdminById = async (id) => {
    const admin = await Admin.findById(id).select("-password");
    if (!admin) {
        throw new Error("Admin account not found");
    }
    return admin;
};

module.exports = {
    createAdmin,
    loginAdmin,
    getAdminById
};
