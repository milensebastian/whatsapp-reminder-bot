const Poll = require("../models/Poll");
const User = require("../models/User");
const ClassModel = require("../models/Class");
const whatsappService = require("./whatsappService");

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

function buildPollMessage(poll) {
  return [
    `Poll: ${poll.question}`,
    "",
    ...poll.options.map((option, index) => `${index + 1}. ${option}`),
    "",
    "Reply with the option number to vote.",
  ].join("\n");
}

async function createPoll(payload) {
  const poll = await Poll.create({
    question: payload.question,
    options: payload.options,
    targetClass: payload.targetClass,
    votes: [],
  });

  const classDoc = await ClassModel.findById(payload.targetClass).populate("members", "phone");
  if (!classDoc) {
    throw new Error("Target class not found");
  }

  const message = buildPollMessage(poll);
  for (const member of classDoc.members || []) {
    if (!member.phone) continue;
    await whatsappService.sendTextMessage(member.phone, message, {
      messageType: "poll",
      pollId: poll._id,
    });
  }

  return Poll.findById(poll._id).populate("targetClass", "name department year").lean();
}

async function recordVote(userPhone, selectedOption) {
  const normalizedPhone = normalizePhone(userPhone);
  const user = await User.findOne({ phone: normalizedPhone }).lean();
  if (!user || !user.classId) {
    throw new Error("No class found for this user");
  }

  const poll = await Poll.findOne({ targetClass: user.classId }).sort({ createdAt: -1 });
  if (!poll) {
    throw new Error("No poll available for this class");
  }

  const optionNumber = Number(selectedOption);
  if (!Number.isInteger(optionNumber) || optionNumber < 1 || optionNumber > poll.options.length) {
    throw new Error("Invalid poll option");
  }

  const existingVote = poll.votes.find((vote) => vote.userPhone === normalizedPhone);
  if (existingVote) {
    existingVote.selectedOption = optionNumber;
  } else {
    poll.votes.push({
      userPhone: normalizedPhone,
      selectedOption: optionNumber,
    });
  }

  await poll.save();
  return getPollResults(poll._id);
}

async function getPollResults(pollId = null) {
  const poll = pollId
    ? await Poll.findById(pollId).populate("targetClass", "name department year")
    : await Poll.findOne({}).populate("targetClass", "name department year").sort({ createdAt: -1 });

  if (!poll) {
    return null;
  }

  const totalVotes = poll.votes.length;
  const results = poll.options.map((option, index) => {
    const optionNumber = index + 1;
    const count = poll.votes.filter((vote) => vote.selectedOption === optionNumber).length;
    const percentage = totalVotes ? Number(((count / totalVotes) * 100).toFixed(2)) : 0;

    return {
      optionNumber,
      option,
      count,
      percentage,
    };
  });

  return {
    _id: poll._id,
    question: poll.question,
    targetClass: poll.targetClass,
    totalVotes,
    results,
    createdAt: poll.createdAt,
  };
}

async function getPolls() {
  return Poll.find({}).populate("targetClass", "name department year").sort({ createdAt: -1 }).lean();
}

module.exports = {
  createPoll,
  recordVote,
  getPollResults,
  getPolls,
};
