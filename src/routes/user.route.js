const express = require("express");

const router = express.Router();

const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Public & Registration routes
router.post("/register", userController.registerUser);
router.post("/create", userController.registerUser);

// Admin & Listing routes
router.get("/all", userController.getAllUsers);
router.get("/profile", authMiddleware, userController.getProfile);
router.get("/:id", userController.getUserById);

// Update & Delete routes
router.put("/profile", authMiddleware, userController.updateProfile);
router.put("/update/:id", userController.updateProfile);
router.put("/:id", userController.updateProfile);
router.delete("/delete/:id", userController.deleteUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;