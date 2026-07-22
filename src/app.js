const express = require("express");
const cors = require("cors");

const routes = require("./routes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", routes);

// Health Check
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Astro Backend Running Successfully"
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
const astroRoutes = require("./routes/astro.route");

app.use("/api/astro", astroRoutes);
const astrologerLoginRoute = require("./routes/astrologerLogin.route");


app.use(
    "/api/astrologer",
    astrologerLoginRoute
);

module.exports = app;