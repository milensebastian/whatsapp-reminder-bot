const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    userPhone: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);
