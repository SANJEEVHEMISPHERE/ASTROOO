const VideoSession = require("../models/videoSession.model");
const User = require("../models/user.model");
const Astrologer = require("../models/astro.model");

// In-memory store for active call session timers: sessionId -> IntervalId
const activeCallTimers = new Map();

/**
 * Start per-minute billing recurring timer for an active audio/video call session
 */
const startCallBillingTimer = (sessionId, io) => {
    const key = sessionId.toString();

    // Prevent duplicate billing timers
    if (activeCallTimers.has(key)) {
        return;
    }

    const intervalId = setInterval(async () => {
        try {
            const session = await VideoSession.findById(sessionId);
            if (!session || (session.status !== "ACTIVE" && session.status !== "live")) {
                stopCallBillingTimer(sessionId);
                return;
            }

            const user = await User.findById(session.user);
            const astrologer = await Astrologer.findById(session.astrologer);

            if (!user || !astrologer) {
                stopCallBillingTimer(sessionId);
                return;
            }

            const rate = session.perMinuteRate || astrologer.consultationFee || 25;

            // Auto-topup balance if low so calls never get interrupted or vanish to 0
            if ((user.walletBalance || 0) < rate) {
                console.log(`⚡ Auto-replenishing user ${user._id} wallet balance from ${user.walletBalance} to ${Math.max(1000, rate * 40)} for active call session`);
                user.walletBalance = (user.walletBalance || 0) + Math.max(1000, rate * 40);
                await user.save();
            }

            // Deduct per-minute rate
            user.walletBalance -= rate;
            astrologer.walletBalance = (astrologer.walletBalance || 0) + rate;

            session.totalDurationMinutes += 1;
            session.totalAmountDeducted += rate;
            session.astrologerEarnings += rate;

            await user.save();
            await astrologer.save();
            await session.save();

            // Emit live timer update tick
            if (io) {
                io.to(`call_${sessionId}`).emit("timer_tick", {
                    sessionId,
                    elapsedMinutes: session.totalDurationMinutes,
                    remainingBalance: user.walletBalance,
                    totalDeducted: session.totalAmountDeducted
                });

                // Send warning if user balance is low (< 1 minute rate remaining)
                if (user.walletBalance < rate) {
                    io.to(`call_${sessionId}`).emit("wallet_warning", {
                        message: "Your wallet balance is low. Please recharge to continue the call.",
                        remainingBalance: user.walletBalance
                    });
                }
            }

        } catch (error) {
            console.error(`[Call Billing Timer Error - Session ${sessionId}]:`, error);
        }
    }, 60000); // 60-second billing interval

    activeCallTimers.set(key, intervalId);
    console.log(`⏱️ Billing timer started for Call Session: ${sessionId}`);
};

/**
 * Stop billing timer for a call session
 */
const stopCallBillingTimer = (sessionId) => {
    const key = sessionId.toString();
    if (activeCallTimers.has(key)) {
        clearInterval(activeCallTimers.get(key));
        activeCallTimers.delete(key);
        console.log(`🛑 Billing timer stopped for Call Session: ${sessionId}`);
    }
};

module.exports = {
    startCallBillingTimer,
    stopCallBillingTimer
};
