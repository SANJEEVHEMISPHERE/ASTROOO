const Astrologer = require("../models/astro.model");

const createAstrologer = async (data) => {
    const astrologer = await Astrologer.create(data);
    return await Astrologer.findById(astrologer._id)
        .populate("user")
        .populate("astrologerLogin");
};

const getAllAstrologers = async () => {
    return await Astrologer.find()
        .populate("user")
        .populate("astrologerLogin");
};

const getAstrologerById = async (id) => {
    return await Astrologer.findById(id)
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
    getAstrologerById,
    updateAstrologer,
    deleteAstrologer
};