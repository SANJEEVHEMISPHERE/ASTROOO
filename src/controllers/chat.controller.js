const ChatSession = require("../models/chatSession.model");
const ChatMessage = require("../models/chatMessage.model");
const User = require("../models/user.model");
const Astrologer = require("../models/astro.model");
const { startBillingTimer, stopBillingTimer } = require("../services/chatBilling.service");

/**
 * 1. Initiate Chat Request (User side)
 */
exports.initiateChat = async (req, res, next) => {
    try {
        const { userId, astrologerId } = req.body;
        const currentUserId = userId || (req.user ? req.user.id || req.user._id : null);

        if (!currentUserId || !astrologerId) {
            return res.status(400).json({
                success: false,
                message: "userId and astrologerId are required."
            });
        }

        const user = await User.findById(currentUserId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const astrologer = await Astrologer.findById(astrologerId);
        if (!astrologer) {
            return res.status(404).json({
                success: false,
                message: "Astrologer not found."
            });
        }

        const perMinuteRate = astrologer.consultationFee || 0;
        const minBalanceRequired = perMinuteRate * 2; // Minimum 2 minutes balance required to initiate chat

        if ((user.walletBalance || 0) < minBalanceRequired) {
            return res.status(400).json({
                success: false,
                message: `Insufficient wallet balance. Minimum ₹${minBalanceRequired} (2 mins) required to initiate chat. Current Balance: ₹${user.walletBalance || 0}`
            });
        }

        // Check if there is already an ACTIVE or PENDING session
        const existingSession = await ChatSession.findOne({
            user: currentUserId,
            astrologer: astrologerId,
            status: { $in: ["PENDING", "ACTIVE"] }
        });

        if (existingSession) {
            return res.status(200).json({
                success: true,
                message: "Existing session found.",
                data: existingSession
            });
        }

        // Create new PENDING chat session
        const session = await ChatSession.create({
            user: currentUserId,
            astrologer: astrologerId,
            perMinuteRate,
            status: "PENDING"
        });

        // Broadcast to astrologer socket if IO available
        try {
            const { getIO } = require("../config/socket");
            const io = getIO();
            if (io) {
                io.to(`session_${session._id}`).emit("incoming_chat_request", {
                    message: "New incoming chat request!",
                    session
                });
            }
        } catch (e) {
            // socket IO might not be attached during pure REST calls
        }

        return res.status(201).json({
            success: true,
            message: "Chat request initiated successfully. Waiting for astrologer acceptance.",
            data: session
        });

    } catch (error) {
        next(error);
    }
};

/**
 * 2. Accept Chat Request (Astrologer side)
 */
exports.acceptChat = async (req, res, next) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "sessionId is required."
            });
        }

        const session = await ChatSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Chat session not found."
            });
        }

        if (session.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: `Session is currently '${session.status}', cannot accept.`
            });
        }

        session.status = "ACTIVE";
        session.startTime = new Date();
        await session.save();

        // Start per-minute billing recurring timer
        try {
            const { getIO } = require("../config/socket");
            const io = getIO();
            startBillingTimer(sessionId, io);
        } catch (e) {
            startBillingTimer(sessionId, null);
        }

        return res.status(200).json({
            success: true,
            message: "Chat request accepted. Session is now ACTIVE.",
            data: session
        });

    } catch (error) {
        next(error);
    }
};

/**
 * 3. Reject Chat Request (Astrologer side)
 */
exports.rejectChat = async (req, res, next) => {
    try {
        const { sessionId, reason } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "sessionId is required."
            });
        }

        const session = await ChatSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Chat session not found."
            });
        }

        session.status = "REJECTED";
        session.rejectionReason = reason || "Astrologer rejected the request.";
        await session.save();

        return res.status(200).json({
            success: true,
            message: "Chat request rejected successfully.",
            data: session
        });

    } catch (error) {
        next(error);
    }
};

/**
 * 4. End Active Chat Session (User or Astrologer)
 */
exports.endChat = async (req, res, next) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "sessionId is required."
            });
        }

        const session = await ChatSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Chat session not found."
            });
        }

        if (session.status === "ACTIVE") {
            stopBillingTimer(sessionId);

            session.status = "COMPLETED";
            session.endTime = new Date();
            const durationMs = session.endTime.getTime() - new Date(session.startTime).getTime();
            session.totalDurationMinutes = Math.max(1, Math.ceil(durationMs / 60000));
            await session.save();
        }

        return res.status(200).json({
            success: true,
            message: "Chat session ended successfully.",
            data: session
        });

    } catch (error) {
        next(error);
    }
};

/**
 * 5. Get Messages History for a Chat Session
 */
exports.getChatHistory = async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "sessionId param is required."
            });
        }

        const messages = await ChatMessage.find({ session: sessionId })
            .sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            count: messages.length,
            data: messages
        });

    } catch (error) {
        next(error);
    }
};

/**
 * 6. Get User or Astrologer's Chat Sessions List
 */
exports.getMySessions = async (req, res, next) => {
    try {
        const { userId, astrologerId, status } = req.query;

        let query = {};
        if (userId) query.user = userId;
        if (astrologerId) query.astrologer = astrologerId;
        if (status) query.status = status;

        const sessions = await ChatSession.find(query)
            .populate("user", "firstname lastname email phone profileImage")
            .populate("astrologer", "name profileImage consultationFee rating")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: sessions.length,
            data: sessions
        });

    } catch (error) {
        next(error);
    }
};

/**
 * 7. Rate & Review completed Chat Session
 */
exports.rateChat = async (req, res, next) => {
    try {
        const { sessionId, rating, review } = req.body;

        if (!sessionId || !rating) {
            return res.status(400).json({
                success: false,
                message: "sessionId and rating are required."
            });
        }

        const session = await ChatSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Chat session not found."
            });
        }

        session.rating = rating;
        if (review) session.review = review;
        await session.save();

        // Update Astrologer overall rating
        const astrologer = await Astrologer.findById(session.astrologer);
        if (astrologer) {
            const allRatings = await ChatSession.find({ astrologer: session.astrologer, rating: { $ne: null } });
            const total = allRatings.reduce((sum, item) => sum + item.rating, 0);
            astrologer.rating = Number((total / allRatings.length).toFixed(1));
            astrologer.totalReviews = allRatings.length;
            await astrologer.save();
        }

        return res.status(200).json({
            success: true,
            message: "Chat rating and review submitted successfully.",
            data: session
        });

    } catch (error) {
        next(error);
    }
};
