const nodemailer = require("nodemailer");
const dns = require("dns").promises;

const isEmailConfigured = () => {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const brevoKey = process.env.BREVO_API_KEY;
    return Boolean(
        brevoKey ||
        (user && pass && user !== "your_email@gmail.com" && pass !== "your_gmail_app_password")
    );
};

/**
 * Send Email via Brevo HTTP REST API (Bypasses all cloud SMTP firewall blocks)
 */
const sendViaBrevoApi = async (apiKey, toEmail, otpCode, fromAddress) => {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": apiKey,
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            sender: {
                name: "Astro App",
                email: process.env.SMTP_USER || "noreply@astroapp.com"
            },
            to: [{ email: toEmail }],
            subject: "Astro App - Password Reset Verification Code",
            htmlContent: `
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
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `Brevo API HTTP Error ${response.status}`);
    }

    console.log(`✉️ Brevo HTTP API Email sent successfully to ${toEmail} (MessageId: ${data.messageId})`);
    return {
        success: true,
        message: "OTP sent successfully via Brevo Email API",
        messageId: data.messageId
    };
};

/**
 * Creates Nodemailer transporter using direct IPv4 resolution to prevent ENETUNREACH on Render
 */
const getTransporter = async () => {
    if (!isEmailConfigured()) return null;

    let targetHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "587");
    const isSecure = port === 465;

    try {
        const addresses = await dns.resolve4(targetHost);
        if (addresses && addresses.length > 0) {
            targetHost = addresses[0];
        }
    } catch (err) {
        console.warn("IPv4 DNS resolution fallback:", err.message);
    }

    return nodemailer.createTransport({
        host: targetHost,
        port: port,
        secure: isSecure,
        requireTLS: !isSecure,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: {
            servername: process.env.SMTP_HOST || "smtp.gmail.com",
            rejectUnauthorized: false
        },
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
 * @returns {Promise<{success: boolean, message: string, mock?: boolean, messageId?: string}>}
 */
const sendOtpEmail = async (toEmail, otpCode) => {
    const brevoKey = process.env.BREVO_API_KEY || (process.env.SMTP_PASS && process.env.SMTP_PASS.startsWith("xkeysib-") ? process.env.SMTP_PASS : null);

    // 1. If Brevo HTTP API Key is available, use HTTPS REST API (Bypasses all cloud firewall limits)
    if (brevoKey) {
        try {
            return await sendViaBrevoApi(brevoKey, toEmail, otpCode);
        } catch (err) {
            console.warn("Brevo API fallback to SMTP:", err.message);
        }
    }

    // 2. Fallback to Nodemailer SMTP
    const transporter = await getTransporter();

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
