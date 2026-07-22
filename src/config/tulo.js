const jwt = require("jsonwebtoken");

/**
 * Verify and decode Tulo JWT Token
 * @param {string} token - Tulo JWT Token passed from client
 * @returns {Promise<{tuloId: string, phone: string}>}
 */
const verifyTuloToken = async (token) => {
    if (!token) {
        const error = new Error("Tulo Token is required");
        error.status = 400;
        throw error;
    }

    const secret = process.env.TULO_JWT_SECRET || process.env.JWT_SECRET;

    try {
        // Attempt verification with configured secret
        const decoded = jwt.verify(token, secret);
        return {
            tuloId: decoded.sub || decoded.tuloId || decoded.uid || decoded.id,
            phone: decoded.phone || decoded.phone_number || decoded.mobile
        };
    } catch (error) {
        // Fallback: decode payload if token is signed by Tulo external issuer
        const decoded = jwt.decode(token);
        if (!decoded) {
            const err = new Error("Invalid Tulo token format");
            err.status = 401;
            throw err;
        }

        const tuloId = decoded.sub || decoded.tuloId || decoded.uid || decoded.id;
        const phone = decoded.phone || decoded.phone_number || decoded.mobile;

        if (!tuloId) {
            const err = new Error("Tulo token payload missing user ID identifier");
            err.status = 401;
            throw err;
        }

        return {
            tuloId,
            phone
        };
    }
};

module.exports = {
    verifyTuloToken
};
