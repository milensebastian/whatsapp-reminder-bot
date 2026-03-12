const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    userPhone: {
      type: String,
      trim: true,
      required: true,
    },
    selectedOption: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const pollSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      trim: true,
      required: true,
    },
    options: {
      type: [String],
      required: true,
      validate: [(value) => Array.isArray(value) && value.length >= 2, "At least two options are required"],
    },
    targetClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    votes: {
      type: [voteSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Poll", pollSchema);
