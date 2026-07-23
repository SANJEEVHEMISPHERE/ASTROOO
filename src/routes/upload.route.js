const express = require("express");
const multer = require("multer");
const uploadController = require("../controllers/upload.controller");

const router = express.Router();

// Memory storage for Multer file buffer uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

// Upload Single Image (Supports file upload in field "file" or "image", as well as Base64 JSON body)
router.post("/image", upload.single("file"), uploadController.uploadImage);
router.post("/base64", uploadController.uploadImage);

module.exports = router;
