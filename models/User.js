const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      index: true,
    },
    department: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    year: {
      type: Number,
      default: null,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
      index: true,
    },
    whatsappName: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
      index: true,
      set: (value) => String(value || "student").trim().toLowerCase(),
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
    isRegistered: {
      type: Boolean,
      default: false,
      index: true,
    },
    registration: {
      step: {
        type: String,
        enum: ["none", "name", "department", "year", "completed"],
        default: "none",
      },
      completedAt: {
        type: Date,
        default: null,
      },
    },
    botState: {
      menuExpiresAt: {
        type: Date,
        default: null,
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    preferences: {
      language: {
        type: String,
        default: "en",
      },
      timezone: {
        type: String,
        default: "Asia/Calcutta",
      },
      remindersEnabled: {
        type: Boolean,
        default: true,
      },
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
