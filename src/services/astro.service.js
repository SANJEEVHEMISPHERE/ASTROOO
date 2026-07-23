const Astrologer = require("../models/astro.model");

const createAstrologer = async (data) => {
    const astrologer = await Astrologer.create(data);
    return await Astrologer.findById(astrologer._id)
        .populate("user")
        .populate("astrologerLogin");
};

const getAllAstrologers = async (filter = {}) => {
    // Default to status: "approved" for public listing unless custom status filter is requested
    const query = { ...filter };
    if (!query.status && query.status !== "all") {
        query.status = "approved";
    } else if (query.status === "all") {
        delete query.status;
    }

    return await Astrologer.find(query)
        .populate("user")
        .populate("astrologerLogin");
};

const getPendingAstrologers = async () => {
    return await Astrologer.find({ status: "pending" })
        .populate("user")
        .populate("astrologerLogin");
};

const getOnlineAstrologers = async () => {
    return await Astrologer.find({
        status: "approved",
        $or: [
            { isOnline: true },
            { isAvailable: true }
        ]
    })
    .populate("user")
    .populate("astrologerLogin");
};

const getAstrologerById = async (id) => {
    return await Astrologer.findById(id)
        .populate("user")
        .populate("astrologerLogin");
};

const approveAstrologer = async (id) => {
    return await Astrologer.findByIdAndUpdate(
        id,
        {
            $set: {
                status: "approved",
                isVerified: true
            }
        },
        { new: true }
    )
    .populate("user")
    .populate("astrologerLogin");
};

const rejectAstrologer = async (id) => {
    return await Astrologer.findByIdAndUpdate(
        id,
        {
            $set: {
                status: "rejected",
                isOnline: false,
                isAvailable: false
            }
        },
        { new: true }
    )
    .populate("user")
    .populate("astrologerLogin");
};

const toggleOnlineStatus = async (id, isOnline, isAvailable) => {
    const updateData = {};
    if (isOnline !== undefined) updateData.isOnline = Boolean(isOnline);
    if (isAvailable !== undefined) updateData.isAvailable = Boolean(isAvailable);

    return await Astrologer.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
    )
    .populate("user")
    .populate("astrologerLogin");
};

const updateAstrologer = async (id, data) => {
    return await Astrologer.findByIdAndUpdate(
        id,
        data,
        {
            new: true,
            runValidators: true
        }
    ).populate("user").populate("astrologerLogin");
};

const deleteAstrologer = async (id) => {
    return await Astrologer.findByIdAndDelete(id);
};

module.exports = {
    createAstrologer,
    getAllAstrologers,
    getPendingAstrologers,
    getOnlineAstrologers,
    getAstrologerById,
    approveAstrologer,
    rejectAstrologer,
    toggleOnlineStatus,
    updateAstrologer,
    deleteAstrologer
};