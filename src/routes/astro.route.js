const express = require("express");

const router = express.Router();

const astroController = require("../controllers/astro.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Profile & Creation
router.post("/create", astroController.createAstrologer);

// Listing & Filtering
router.get("/all", astroController.getAllAstrologers);
router.get("/online", astroController.getOnlineAstrologers);

// Online/Offline Status Toggle
router.put("/toggle-online", astroController.toggleOnlineStatus);
router.put("/toggle-online/:id", astroController.toggleOnlineStatus);

// Details by ID
router.get("/:id", astroController.getAstrologerById);

// Update & Delete
router.put("/update/:id", authMiddleware, astroController.updateAstrologer);
router.delete("/delete/:id", authMiddleware, astroController.deleteAstrologer);

module.exports = router;