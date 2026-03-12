const mongoose = require("mongoose");

const systemLogSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ["info", "warn", "error"],
      default: "info",
      index: true,
    },
    category: {
      type: String,
      enum: ["system", "webhook", "task", "announcement", "reminder", "analytics", "database", "emergency"],
      default: "system",
      index: true,
    },
    message: {
      type: String,
      trim: true,
      required: true,
    },
    source: {
      type: String,
      trim: true,
      default: "server",
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    resolved: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model("SystemLog", systemLogSchema);
