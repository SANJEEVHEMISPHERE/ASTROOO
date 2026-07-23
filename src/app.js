const express = require("express");
const cors = require("cors");

const routes = require("./routes");

const app = express();

// Middlewares - Increased payload size limit to 50mb for image uploads
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use("/api", routes);

// Health Check
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Astro Backend Running Successfully"
    });
});

const astroRoutes = require("./routes/astro.route");
app.use("/api/astro", astroRoutes);

const astrologerLoginRoute = require("./routes/astrologerLogin.route");
app.use("/api/astrologer", astrologerLoginRoute);

// 404 Handler for unmatched routes
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route Not Found - ${req.method} ${req.originalUrl}. Make sure you are using POST method for OTP APIs.`
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

module.exports = app;