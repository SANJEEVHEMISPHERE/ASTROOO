const AstroInterview = require("../models/astroInterview.model");
const Astrologer = require("../models/astro.model");
const mongoose = require("mongoose");

const isValidObjectId = (id) => typeof id === "string" && mongoose.Types.ObjectId.isValid(id) && id.length === 24;

/**
 * Astrologer Requests an Interview
 */
const requestInterview = async (astrologerIdOrEmail, requestNotes = "") => {
    let astrologer = null;

    if (astrologerIdOrEmail && typeof astrologerIdOrEmail === "string" && astrologerIdOrEmail.includes("@")) {
        astrologer = await Astrologer.findOne({ email: astrologerIdOrEmail.toLowerCase() });
    } else if (astrologerIdOrEmail && isValidObjectId(astrologerIdOrEmail)) {
        astrologer = await Astrologer.findById(astrologerIdOrEmail);
    }

    if (!astrologer) {
        // Fallback: Latest registered astrologer
        astrologer = await Astrologer.findOne().sort({ createdAt: -1 });
    }

    if (!astrologer) {
        throw new Error("Astrologer account not found for interview request");
    }

    // Check if an interview record already exists for this astrologer
    let interview = await AstroInterview.findOne({ astrologer: astrologer._id });

    if (interview) {
        interview.status = "requested";
        interview.result = "pending";
        interview.requestNotes = requestNotes || interview.requestNotes;
        await interview.save();
    } else {
        interview = await AstroInterview.create({
            astrologer: astrologer._id,
            status: "requested",
            result: "pending",
            requestNotes
        });
    }

    return await AstroInterview.findById(interview._id).populate("astrologer");
};

/**
 * Admin Schedules Interview with Date, Time, and Google Meet Link
 */
const scheduleInterview = async (identifier, interviewDate, meetingLink, interviewerNotes = "") => {
    let interview = null;

    // Try finding by interview ID
    if (identifier && isValidObjectId(identifier)) {
        try {
            interview = await AstroInterview.findById(identifier);
        } catch (e) {}
    }

    // Try finding by astrologer ID or Email
    if (!interview && identifier) {
        let astrologerId = null;
        if (typeof identifier === "string" && identifier.includes("@")) {
            const astro = await Astrologer.findOne({ email: identifier.toLowerCase() });
            if (astro) astrologerId = astro._id;
        } else if (isValidObjectId(identifier)) {
            astrologerId = identifier;
        }

        if (astrologerId) {
            interview = await AstroInterview.findOne({ astrologer: astrologerId });

            // If no interview record exists yet, create one
            if (!interview) {
                interview = await AstroInterview.create({
                    astrologer: astrologerId,
                    status: "requested"
                });
            }
        }
    }

    if (!interview) {
        // Fallback to latest requested interview
        interview = await AstroInterview.findOne({ status: "requested" }).sort({ createdAt: -1 });
    }

    if (!interview) {
        throw new Error("No pending interview request found to schedule");
    }

    if (!interviewDate) {
        throw new Error("interviewDate is required for scheduling");
    }

    interview.interviewDate = new Date(interviewDate);
    interview.meetingLink = meetingLink || "https://meet.google.com/new";
    interview.status = "scheduled";
    interview.scheduledAt = new Date();
    if (interviewerNotes) interview.interviewerNotes = interviewerNotes;

    await interview.save();

    return await AstroInterview.findById(interview._id).populate("astrologer");
};

/**
 * Admin Evaluates Interview Result (Pass or Fail)
 */
const evaluateInterview = async (identifier, result, interviewerNotes = "") => {
    const evalResult = String(result).toLowerCase();
    if (!["pass", "fail", "passed", "failed"].includes(evalResult)) {
        throw new Error("Result must be either 'pass' or 'fail'");
    }

    const isPass = evalResult === "pass" || evalResult === "passed";

    let interview = null;
    if (identifier && isValidObjectId(identifier)) {
        try {
            interview = await AstroInterview.findById(identifier);
        } catch (e) {}
    }

    if (!interview && identifier) {
        let astrologerId = null;
        if (typeof identifier === "string" && identifier.includes("@")) {
            const astro = await Astrologer.findOne({ email: identifier.toLowerCase() });
            if (astro) astrologerId = astro._id;
        } else if (isValidObjectId(identifier)) {
            astrologerId = identifier;
        }

        if (astrologerId) {
            interview = await AstroInterview.findOne({ astrologer: astrologerId });
        }
    }

    if (!interview) {
        interview = await AstroInterview.findOne().sort({ updatedAt: -1 });
    }

    if (!interview) {
        throw new Error("Interview session not found for evaluation");
    }

    interview.result = isPass ? "pass" : "fail";
    interview.status = isPass ? "passed" : "failed";
    interview.completedAt = new Date();
    if (interviewerNotes) interview.interviewerNotes = interviewerNotes;

    await interview.save();

    // Automatically update Astrologer Status in DB
    if (interview.astrologer) {
        const astroStatus = isPass ? "approved" : "rejected";
        await Astrologer.findByIdAndUpdate(interview.astrologer, {
            status: astroStatus,
            isVerified: isPass
        });
    }

    return await AstroInterview.findById(interview._id).populate("astrologer");
};

/**
 * Get All Interviews for Admin
 */
const getAllInterviews = async (filter = {}) => {
    return await AstroInterview.find(filter)
        .populate("astrologer")
        .sort({ createdAt: -1 });
};

/**
 * Get Interview Details for a Specific Astrologer
 */
const getAstrologerInterview = async (astrologerIdOrEmail) => {
    let astrologerId = astrologerIdOrEmail;
    if (astrologerIdOrEmail && astrologerIdOrEmail.includes("@")) {
        const astro = await Astrologer.findOne({ email: astrologerIdOrEmail.toLowerCase() });
        if (astro) astrologerId = astro._id;
    }

    return await AstroInterview.findOne({ astrologer: astrologerId })
        .populate("astrologer")
        .sort({ createdAt: -1 });
};

module.exports = {
    requestInterview,
    scheduleInterview,
    evaluateInterview,
    getAllInterviews,
    getAstrologerInterview
};
