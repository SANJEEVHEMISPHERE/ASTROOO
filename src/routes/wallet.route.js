const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * GET /api/wallet/balance
 * Returns the current wallet balance for the authenticated user.
 * Also supports ?userId=<id> query param for unauthenticated/legacy requests.
 */
router.get("/balance", async (req, res) => {
    try {
        let userId = null;

        // Try auth token first
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            try {
                const { verifyToken } = require("../utils/jwt");
                const decoded = verifyToken(authHeader.split(" ")[1]);
                userId = decoded.userId || decoded.id || decoded._id;
            } catch (err) {
                // Token invalid — fall back to query param
            }
        }

        // Fall back to query param
        if (!userId) {
            userId = req.query.userId || req.query.user_id;
        }

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID required" });
        }

        const user = await User.findById(userId).select("walletBalance name");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            data: {
                walletBalance: user.walletBalance || 0,
                name: user.name
            }
        });
    } catch (error) {
        console.error("GET /api/wallet/balance error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/wallet/add
 * Dummy payment: adds funds to user wallet (no real payment gateway).
 * Body: { amount: Number, userId: String (optional if token present) }
 */
router.post("/add", async (req, res) => {
    try {
        let userId = null;

        // Try auth token first
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            try {
                const { verifyToken } = require("../utils/jwt");
                const decoded = verifyToken(authHeader.split(" ")[1]);
                userId = decoded.userId || decoded.id || decoded._id;
            } catch (err) {
                // Token invalid — fall back to body
            }
        }

        // Fall back to body param
        if (!userId) {
            userId = req.body.userId || req.body.user_id;
        }

        const { amount } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID required" });
        }

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount. Must be a positive number." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const previousBalance = user.walletBalance || 0;
        user.walletBalance = previousBalance + numericAmount;
        await user.save();

        return res.status(200).json({
            success: true,
            message: `₹${numericAmount.toFixed(2)} added to wallet successfully`,
            data: {
                previousBalance,
                addedAmount: numericAmount,
                newBalance: user.walletBalance,
                transactionId: `TXN_${Date.now()}`
            }
        });
    } catch (error) {
        console.error("POST /api/wallet/add error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/wallet/transactions
 * Returns a mock transaction history (built from what the DB session records show).
 * For now, returns empty array since sessions store totals, not line-item txns.
 */
router.get("/transactions", async (req, res) => {
    try {
        let userId = null;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            try {
                const { verifyToken } = require("../utils/jwt");
                const decoded = verifyToken(authHeader.split(" ")[1]);
                userId = decoded.userId || decoded.id || decoded._id;
            } catch (err) {}
        }
        if (!userId) userId = req.query.userId;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID required" });
        }

        // Pull completed video/call sessions for this user as transaction records
        const VideoSession = require("../models/videoSession.model");
        const ChatSession = require("../models/chatSession.model");

        const [callSessions, chatSessions] = await Promise.all([
            VideoSession.find({ user: userId, status: { $in: ["COMPLETED", "ACTIVE"] } })
                .sort({ updatedAt: -1 })
                .limit(20)
                .populate("astrologer", "name")
                .lean(),
            ChatSession.find({ user: userId, status: { $in: ["COMPLETED", "ACTIVE"] } })
                .sort({ updatedAt: -1 })
                .limit(20)
                .populate("astrologer", "name")
                .lean()
        ]);

        const txns = [];

        callSessions.forEach(s => {
            if (s.totalAmountDeducted > 0) {
                txns.push({
                    id: String(s._id),
                    title: `${s.callType === "VIDEO" ? "Video" : "Audio"} Call with ${s.astrologer?.name || "Astrologer"}`,
                    date: new Date(s.updatedAt || s.endTime || s.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }),
                    amount: `- ₹${(s.totalAmountDeducted || 0).toFixed(2)}`,
                    amountClass: "text-gray-800",
                    status: "Completed",
                    statusClass: "text-gray-400",
                    iconBg: "bg-pink-50 text-pink-500",
                    iconType: s.callType === "VIDEO" ? "video" : "phone",
                    type: "debit"
                });
            }
        });

        chatSessions.forEach(s => {
            if (s.totalAmountDeducted > 0) {
                txns.push({
                    id: String(s._id),
                    title: `Chat with ${s.astrologer?.name || "Astrologer"}`,
                    date: new Date(s.updatedAt || s.endTime || s.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }),
                    amount: `- ₹${(s.totalAmountDeducted || 0).toFixed(2)}`,
                    amountClass: "text-gray-800",
                    status: "Completed",
                    statusClass: "text-gray-400",
                    iconBg: "bg-pink-50 text-pink-500",
                    iconType: "message",
                    type: "debit"
                });
            }
        });

        // Sort by date desc
        txns.sort((a, b) => new Date(b.date) - new Date(a.date));

        return res.status(200).json({
            success: true,
            count: txns.length,
            data: txns
        });
    } catch (error) {
        console.error("GET /api/wallet/transactions error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
