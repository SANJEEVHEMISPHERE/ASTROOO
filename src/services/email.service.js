const nodemailer = require("nodemailer");
const dns = require("dns");

// Custom DNS lookup to strictly force IPv4 resolution on cloud platforms like Render
const ipv4Lookup = (hostname, options, callback) => {
    return dns.lookup(hostname, { family: 4 }, callback);
};

const isEmailConfigured = () => {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    return Boolean(user && pass && user !== "your_email@gmail.com" && pass !== "your_gmail_app_password");
};

const getTransporter = () => {
    if (!isEmailConfigured()) return null;

    const host = process.env.SMTP_HOST || "smtp.gmail.com";

    // Use Nodemailer's native 'gmail' service preset if using Gmail
    if (host.includes("gmail")) {
        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    return nodemailer.createTransport({
        host: host,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_PORT === "465",
        lookup: ipv4Lookup,
        family: 4,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

/**
 * Send OTP to user email
 * @param {string} toEmail - Recipient email
 * @param {string} otpCode - 6 digit OTP code
 * @returns {Promise<{success: boolean, message: string, mock?: boolean}>}
 */
const sendOtpEmail = async (toEmail, otpCode) => {
    const transporter = getTransporter();

    if (!isEmailConfigured() || !transporter) {
        console.log(`[DEVELOPMENT MOCK EMAIL] Password Reset OTP for ${toEmail} is: ${otpCode}`);
        return {
            success: true,
            message: "OTP sent to email (Development Mode)",
            mock: true,
            otp: otpCode
        };
    }

    try {
        const fromAddress = process.env.EMAIL_FROM || `Astro App <${process.env.SMTP_USER}>`;

        const mailOptions = {
            from: fromAddress,
            to: toEmail,
            subject: "Astro App - Password Reset Verification Code",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #6200ee; text-align: center;">Password Reset Request</h2>
                    <p>Hello,</p>
                    <p>You requested a password reset for your Astrologer account. Use the verification code below to complete your reset:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #6200ee; background: #f3e8ff; padding: 10px 25px; border-radius: 8px;">${otpCode}</span>
                    </div>
                    <p style="font-size: 13px; color: #666;">This code is valid for 5 minutes. If you did not request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #999; text-align: center;">© Astro App Team</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ Email OTP sent successfully to ${toEmail} (MessageId: ${info.messageId})`);

        return {
            success: true,
            message: "OTP sent successfully to your email address",
            messageId: info.messageId
        };
    } catch (error) {
        console.error("Error sending email OTP:", error.message || error);
        throw error;
    }
};

module.exports = {
    sendOtpEmail,
    isEmailConfigured
};
