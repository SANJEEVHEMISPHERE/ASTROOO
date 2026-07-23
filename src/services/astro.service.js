const Astrologer = require("../models/astro.model");

const createAstrologer = async (data) => {
    const astrologer = await Astrologer.create(data);
    return await Astrologer.findById(astrologer._id)
        .populate("user")
        .populate("astrologerLogin");
};

const getAllAstrologers = async (filter = {}) => {
    return await Astrologer.find(filter)
        .populate("user")
        .populate("astrologerLogin");
};

const getOnlineAstrologers = async () => {
    return await Astrologer.find({
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
    getOnlineAstrologers,
    getAstrologerById,
    toggleOnlineStatus,
    updateAstrologer,
    deleteAstrologer
};