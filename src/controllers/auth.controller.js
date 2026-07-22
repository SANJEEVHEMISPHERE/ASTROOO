const authService = require("../services/auth.service");

const login = async (req, res, next) => {
    try {
        const tuloToken = req.body.tuloToken || req.body.idToken || req.body.token;

        if (!tuloToken) {
            return res.status(400).json({
                success: false,
                message: "Tulo Token is required"
            });
        }

        const data = await authService.login(tuloToken);

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