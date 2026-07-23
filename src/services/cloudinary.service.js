const cloudinary = require("cloudinary").v2;

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || ""
});

const isCloudinaryConfigured = () => {
    return Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
};

/**
 * Upload Base64 data string or Image URL to Cloudinary
 * @param {string} fileInput - Base64 image data string or URL
 * @param {string} folder - Destination folder on Cloudinary
 */
const uploadBase64OrUrl = async (fileInput, folder = "astro_app") => {
    if (!fileInput) return null;

    // If input is already an http/https Cloudinary URL, return as is
    if (typeof fileInput === "string" && (fileInput.startsWith("http://") || fileInput.startsWith("https://"))) {
        return fileInput;
    }

    if (!isCloudinaryConfigured()) {
        console.log("[MOCK CLOUDINARY UPLOAD] Cloudinary credentials not set. Returning data URL fallback.");
        return fileInput;
    }

    try {
        const result = await cloudinary.uploader.upload(fileInput, {
            folder: folder,
            resource_type: "auto"
        });

        return result.secure_url;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error.message || error);
        throw error;
    }
};

/**
 * Upload Buffer (from Multer file upload) to Cloudinary
 * @param {Buffer} fileBuffer - Multer file buffer
 * @param {string} folder - Destination folder on Cloudinary
 */
const uploadBuffer = async (fileBuffer, folder = "astro_app") => {
    if (!fileBuffer) return null;

    if (!isCloudinaryConfigured()) {
        console.log("[MOCK CLOUDINARY UPLOAD] Cloudinary credentials not set. Returning mock upload URL.");
        return `https://res.cloudinary.com/demo/image/upload/sample.jpg`;
    }

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: folder, resource_type: "auto" },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Buffer Upload Error:", error);
                    return reject(error);
                }
                resolve(result.secure_url);
            }
        );
        uploadStream.end(fileBuffer);
    });
};

module.exports = {
    isCloudinaryConfigured,
    uploadBase64OrUrl,
    uploadBuffer
};
