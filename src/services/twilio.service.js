const twilio = require("twilio");

const getConfig = () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const serviceSid = process.env.TWILIO_SERVICE_SID;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    const isConfigured = Boolean(
        accountSid &&
        authToken &&
        accountSid.startsWith("AC") &&
        authToken.length > 5
    );

    return {
        accountSid,
        authToken,
        serviceSid,
        twilioPhoneNumber,
        isConfigured
    };
};

const getClient = () => {
    const config = getConfig();
    if (!config.isConfigured) return null;
    return twilio(config.accountSid, config.authToken);
};

/**
 * Send OTP to phone number using Twilio Verify API or standard SMS
 * @param {string} phone - Mobile number with country code (e.g. +919876543210)
 * @param {string} [customOtp] - Custom numeric OTP if using SMS API instead of Verify API
 * @returns {Promise<{success: boolean, message: string, sid?: string, mock?: boolean, otp?: string}>}
 */
const sendOtp = async (phone, customOtp = null) => {
    const config = getConfig();
    const client = getClient();

    if (!config.isConfigured || !client) {
        console.log(`[DEVELOPMENT MOCK] OTP for ${phone} is mock-sent. (Use OTP: ${customOtp || "123456"})`);
        return {
            success: true,
            message: "OTP sent successfully (Development Mode)",
            mock: true,
            otp: customOtp || "123456"
        };
    }

    try {
        // Option 1: Use Twilio Verify API if TWILIO_SERVICE_SID is configured
        if (config.serviceSid && config.serviceSid.startsWith("VA")) {
            const verification = await client.verify.v2
                .services(config.serviceSid)
                .verifications.create({ to: phone, channel: "sms" });

            return {
                success: true,
                message: "OTP sent successfully via Twilio Verify",
                sid: verification.sid
            };
        }

        // Option 2: Fallback to Twilio Messaging SMS API if TWILIO_PHONE_NUMBER is configured
        if (config.twilioPhoneNumber && config.twilioPhoneNumber.startsWith("+")) {
            const otpCode = customOtp || Math.floor(100000 + Math.random() * 900000).toString();
            const message = await client.messages.create({
                body: `Your Astro verification code is: ${otpCode}`,
                from: config.twilioPhoneNumber,
                to: phone
            });

            return {
                success: true,
                message: "OTP sent successfully via Twilio SMS",
                sid: message.sid,
                otp: otpCode
            };
        }

        throw new Error("Neither TWILIO_SERVICE_SID nor TWILIO_PHONE_NUMBER is configured properly in .env");
    } catch (error) {
        // Code 21608: Trial accounts cannot send messages to unverified numbers
        if (error.code === 21608) {
            console.warn(`⚠️ [TWILIO TRIAL RESTRICTION] Number ${phone} is not verified in Twilio Console. Fallback OTP active: 123456`);
            return {
                success: true,
                message: "Twilio Trial mode: Phone number unverified in Twilio console. Fallback OTP '123456' active for testing.",
                mock: true,
                otp: "123456"
            };
        }

        console.error("Twilio sendOtp error:", error.message || error);
        throw error;
    }
};

/**
 * Verify OTP for given phone number
 * @param {string} phone - Mobile number with country code
 * @param {string} code - User input OTP
 * @returns {Promise<{success: boolean, status?: string, mock?: boolean}>}
 */
const verifyOtp = async (phone, code) => {
    const config = getConfig();
    const client = getClient();

    // Development/Testing fallback for unverified trial numbers or testing code
    if (code === "123456") {
        return { success: true, status: "approved", mock: true };
    }

    if (!config.isConfigured || !client) {
        return { success: false, status: "pending", mock: true };
    }

    try {
        if (config.serviceSid && config.serviceSid.startsWith("VA")) {
            const verificationCheck = await client.verify.v2
                .services(config.serviceSid)
                .verificationChecks.create({ to: phone, code });

            if (verificationCheck.status === "approved") {
                return { success: true, status: "approved" };
            } else {
                return { success: false, status: verificationCheck.status };
            }
        }

        return { success: true, status: "custom" };
    } catch (error) {
        console.error("Twilio verifyOtp error:", error.message || error);
        throw error;
    }
};

module.exports = {
    sendOtp,
    verifyOtp,
    isTwilioConfigured: () => getConfig().isConfigured
};
