const { verifyTuloToken } = require("../config/tulo");
const User = require("../models/user.model");
const { generateToken } = require("../utils/jwt");

const login = async (tuloToken) => {

    // Verify Tulo Token
    const { tuloId, phone } = await verifyTuloToken(tuloToken);

    // Find Existing User by tuloId or phone
    let user = await User.findOne({
        $or: [
            { tuloId },
            ...(phone ? [{ phone }] : [])
        ]
    });

    // Create User if not found
    if (!user) {

        user = await User.create({
            tuloId,
            phone: phone || `+0000000000_${tuloId}`,
            role: "user",
            isProfileCompleted: false
        });

    } else if (!user.tuloId) {
        // Link tuloId if user previously existed by phone
        user.tuloId = tuloId;
        await user.save();
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