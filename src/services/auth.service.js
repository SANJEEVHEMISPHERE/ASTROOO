const admin = require("../config/firebase");
const User = require("../models/user.model");
const { generateToken } = require("../utils/jwt");

const login = async (idToken) => {

    // Verify Firebase Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const firebaseUid = decodedToken.uid;
    const phone = decodedToken.phone_number;

    // Find Existing User
    let user = await User.findOne({ firebaseUid });

    // Create User if not found
    if (!user) {

        user = await User.create({
            firebaseUid,
            phone,
            role: "user",
            isProfileCompleted: false
        });

    }

    // Generate Backend JWT
    const token = generateToken({
        userId: user._id,
        role: user.role
    });

    return {
        user,
        token
    };

};

module.exports = {
    login
};