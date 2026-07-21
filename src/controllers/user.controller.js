const User = require("../models/user.model");

const getProfile = async (req, res, next) => {

    try {

        const user = await User.findById(req.user.userId);

        return res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {

        next(error);

    }

};

module.exports = {
    getProfile
};