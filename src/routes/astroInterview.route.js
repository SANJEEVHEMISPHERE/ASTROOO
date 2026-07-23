const express = require("express");

const router = express.Router();

const astroInterviewController = require("../controllers/astroInterview.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// 1. Astrologer Requests Interview
router.post("/request", astroInterviewController.requestInterview);

// 2. Admin Schedules Interview (Date, Time, Google Meet Link)
router.put("/schedule/:id", astroInterviewController.scheduleInterview);
router.put("/schedule", astroInterviewController.scheduleInterview);
router.post("/schedule", astroInterviewController.scheduleInterview);

// 3. Admin Evaluates Interview Result (Pass / Fail)
router.put("/result/:id", astroInterviewController.evaluateInterview);
router.put("/result", astroInterviewController.evaluateInterview);
router.post("/result", astroInterviewController.evaluateInterview);

// 4. Listing & Filtering
router.get("/all", astroInterviewController.getAllInterviews);
router.get("/pending", astroInterviewController.getPendingInterviews);
router.get("/my-interview", astroInterviewController.getMyInterview);
router.get("/astrologer/:id", astroInterviewController.getMyInterview);

module.exports = router;
