const mongoose = require("mongoose");

const assignedUserSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "completed", "failed"],
      default: "pending",
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "active", "completed", "archived"],
      default: "active",
      index: true,
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
    targetClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },
    targetClassName: {
      type: String,
      trim: true,
      default: "",
    },
    assignedUsers: {
      type: [assignedUserSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    source: {
      type: String,
      enum: ["manual", "csv", "api"],
      default: "manual",
    },
    completionCount: {
      type: Number,
      default: 0,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Task", taskSchema);
