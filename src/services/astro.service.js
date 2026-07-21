const Astrologer = require("../models/astro.model");

const createAstrologer = async (data) => {
    const astrologer = await Astrologer.create(data);
    return astrologer;
};

const getAllAstrologers = async () => {
    return await Astrologer.find().populate("user");
};

const getAstrologerById = async (id) => {
    return await Astrologer.findById(id).populate("user");
};

const updateAstrologer = async (id, data) => {
    return await Astrologer.findByIdAndUpdate(
        id,
        data,
        {
            new: true,
            runValidators: true
        }
    );
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