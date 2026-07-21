const authService = require("../services/auth.service");

const login = async (req, res, next) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: "Firebase ID Token is required"
            });
        }

        const data = await authService.login(idToken);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    login
};