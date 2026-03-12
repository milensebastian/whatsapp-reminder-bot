const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    userPhone: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },
    message: {
      type: String,
      trim: true,
      required: true,
    },
    reminderTime: {
      type: Date,
      required: true,
      index: true,
    },
    repeatType: {
      type: String,
      enum: ["none", "daily", "weekly"],
      default: "none",
      index: true,
    },
    repeatDay: {
      type: String,
      enum: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", null],
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "cancelled", "failed"],
      default: "pending",
      index: true,
    },
    sourceMessage: {
      type: String,
      trim: true,
      default: "",
    },
    lastSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Reminder", reminderSchema);
