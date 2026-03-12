const mongoose = require("mongoose");

const messageLogSchema = new mongoose.Schema(
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
    direction: {
      type: String,
      enum: ["incoming", "outgoing"],
      required: true,
      index: true,
    },
    messageType: {
      type: String,
      enum: ["text", "task", "announcement", "reminder", "system"],
      default: "text",
    },
    whatsappMessageId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    deliveryStatus: {
      type: String,
      enum: ["queued", "sent", "delivered", "read", "failed", "received"],
      default: "received",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

module.exports = mongoose.model("MessageLog", messageLogSchema);
