const mongoose = require("mongoose");

const targetUserSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      required: true,
    },
  },
  { _id: false }
);

const scheduledMessageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    message: {
      type: String,
      trim: true,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    deadline: {
      type: Date,
      default: null,
    },
    targetScope: {
      type: String,
      enum: ["manual", "all", "department", "year", "class"],
      default: "manual",
      index: true,
    },
    targetDepartment: {
      type: String,
      trim: true,
      default: "",
    },
    targetYear: {
      type: Number,
      default: null,
    },
    targetClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
      index: true,
    },
    targetClassName: {
      type: String,
      trim: true,
      default: "",
    },
    targetUsers: {
      type: [targetUserSchema],
      default: [],
    },
    sendTime: {
      type: Date,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["announcement", "task"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ScheduledMessage", scheduledMessageSchema);
