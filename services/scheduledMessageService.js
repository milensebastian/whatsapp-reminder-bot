const ScheduledMessage = require("../models/ScheduledMessage");
const ClassModel = require("../models/Class");
const User = require("../models/User");
const SystemLog = require("../models/SystemLog");
const whatsappService = require("./whatsappService");

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

function mapManualTargets(users = []) {
  const seen = new Set();

  return users
    .filter((user) => user && user.phone)
    .map((user) => ({
      user: user._id || user.user || null,
      name: String(user.name || "").trim(),
      phone: normalizePhone(user.phone),
    }))
    .filter((user) => {
      if (!user.phone || seen.has(user.phone)) return false;
      seen.add(user.phone);
      return true;
    });
}

function buildTaskPayload(messageDoc) {
  return {
    title: messageDoc.title,
    description: messageDoc.message,
    deadline: messageDoc.deadline || messageDoc.sendTime,
    priority: messageDoc.priority || "medium",
  };
}

function buildAnnouncementPayload(messageDoc) {
  return {
    title: messageDoc.title,
    message: messageDoc.message,
    priority: messageDoc.priority || "medium",
  };
}

async function resolveRecipients(messageDoc) {
  if (messageDoc.targetScope === "all") {
    return User.find({ role: "student", status: "active" }).select("_id name phone").lean();
  }

  if (messageDoc.targetScope === "department") {
    return User.find({
      role: "student",
      status: "active",
      department: messageDoc.targetDepartment,
    }).select("_id name phone").lean();
  }

  if (messageDoc.targetScope === "year") {
    return User.find({
      role: "student",
      status: "active",
      year: Number(messageDoc.targetYear),
    }).select("_id name phone").lean();
  }

  if (messageDoc.targetScope === "class") {
    const classDoc = await ClassModel.findById(messageDoc.targetClass).populate("members", "_id name phone");
    if (!classDoc) {
      throw new Error("Target class not found");
    }

    return classDoc.members || [];
  }

  return messageDoc.targetUsers || [];
}

async function createScheduledMessage(payload) {
  const sendTime = new Date(payload.sendTime);
  if (Number.isNaN(sendTime.getTime())) {
    throw new Error("Valid sendTime is required");
  }

  return ScheduledMessage.create({
    title: payload.title,
    message: payload.message,
    priority: String(payload.priority || "medium").toLowerCase(),
    deadline: payload.deadline || null,
    targetScope: payload.targetScope || "manual",
    targetDepartment: payload.targetDepartment || "",
    targetYear: payload.targetYear ? Number(payload.targetYear) : null,
    targetClass: payload.targetClass || null,
    targetClassName: payload.targetClassName || "",
    targetUsers: mapManualTargets(payload.targetUsers || []),
    sendTime,
    type: payload.type,
    status: payload.status || "pending",
  });
}

async function getScheduledMessages() {
  return ScheduledMessage.find({})
    .populate("targetClass", "name department year")
    .sort({ sendTime: 1 })
    .lean();
}

async function processScheduledMessages(referenceDate = new Date()) {
  const scheduledMessages = await ScheduledMessage.find({
    sendTime: { $lte: referenceDate },
    status: "pending",
  }).populate("targetClass", "name department year");

  let processed = 0;
  let failed = 0;

  for (const scheduledMessage of scheduledMessages) {
    try {
      const recipients = await resolveRecipients(scheduledMessage);
      if (!recipients.length) {
        throw new Error("No recipients resolved for scheduled message");
      }

      for (const recipient of recipients) {
        if (!recipient.phone) continue;

        if (scheduledMessage.type === "announcement") {
          await whatsappService.sendAnnouncement(recipient.phone, buildAnnouncementPayload(scheduledMessage));
        } else {
          await whatsappService.sendTaskNotification(recipient.phone, buildTaskPayload(scheduledMessage));
        }
      }

      scheduledMessage.status = "sent";
      await scheduledMessage.save();
      processed += 1;
    } catch (error) {
      scheduledMessage.status = "failed";
      await scheduledMessage.save();
      failed += 1;

      await SystemLog.create({
        level: "error",
        category: "announcement",
        message: "Scheduled broadcast failed",
        source: "scheduledMessageService",
        details: {
          scheduledMessageId: scheduledMessage._id,
          error: error.message,
        },
        timestamp: new Date(),
      });
    }
  }

  return {
    success: true,
    processed,
    failed,
    checkedAt: referenceDate,
  };
}

module.exports = {
  createScheduledMessage,
  getScheduledMessages,
  processScheduledMessages,
};
