const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      default: null,
      trim: true,
    },

    middlename: {
      type: String,
      default: null,
      trim: true,
    },

    lastname: {
      type: String,
      default: null,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: null,
      lowercase: true,
      trim: true,
    },

    dateofbirth: {
      type: Date,
      default: null,
    },

    timeofbirth: {
      type: String,
      default: null,
      trim: true,
    },

    placeofbirth: {
      type: String,
      default: null,
      trim: true,
    },

    city: {
      type: String,
      default: null,
      trim: true,
    },

    state: {
      type: String,
      default: null,
      trim: true,
    },

    country: {
      type: String,
      default: null,
      trim: true,
    },

    address: {
      type: String,
      default: null,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true,
    },

    tuloId: {
      type: String,
      unique: true,
      sparse: true,
    },

    role: {
      type: String,
      enum: ["user", "astrologer", "admin"],
      default: "user",
    },

    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);