const Reminder = require("../models/Reminder");
const User = require("../models/User");
const whatsappService = require("./whatsappService");
const parseReminderMessage = require("./nlpReminderParser");
const activityService = require("./activityService");

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

async function createReminder({ userPhone, sourceMessage, user = null }) {
  const parsed = parseReminderMessage(sourceMessage);

  let userId = user;
  if (!userId) {
    const existingUser = await User.findOne({ phone: normalizePhone(userPhone) }).select("_id");
    userId = existingUser?._id || null;
  }

  const reminder = await Reminder.create({
    user: userId,
    userPhone: normalizePhone(userPhone),
    message: parsed.message,
    reminderTime: parsed.reminderTime,
    repeatType: parsed.repeatType,
    repeatDay: parsed.repeatDay,
    status: "pending",
    sourceMessage,
  });

  await activityService.logActivity({
    actionType: "Reminder created",
    description: `Reminder created: ${reminder.message}`,
    userPhone: reminder.userPhone,
  });

  return reminder;
}

async function scheduleReminder(reminderId) {
  const reminder = await Reminder.findById(reminderId);
  if (!reminder) throw new Error("Reminder not found");

  reminder.status = "pending";
  await reminder.save();
  return reminder;
}

async function sendReminder(reminder) {
  await whatsappService.sendReminderMessage(reminder.userPhone, reminder);

  if (reminder.repeatType === "daily") {
    const next = new Date(reminder.reminderTime);
    next.setDate(next.getDate() + 1);
    reminder.reminderTime = next;
    reminder.lastSentAt = new Date();
    reminder.status = "pending";
  } else if (reminder.repeatType === "weekly") {
    const next = new Date(reminder.reminderTime);
    next.setDate(next.getDate() + 7);
    reminder.reminderTime = next;
    reminder.lastSentAt = new Date();
    reminder.status = "pending";
  } else {
    reminder.lastSentAt = new Date();
    reminder.status = "sent";
  }

  await reminder.save();
  return reminder;
}

async function getPendingReminders(referenceDate = new Date()) {
  return Reminder.find({ status: "pending", reminderTime: { $lte: referenceDate } });
}

async function getRemindersForUser(userPhone) {
  return Reminder.find({ userPhone: normalizePhone(userPhone), status: "pending" })
    .sort({ reminderTime: 1 })
    .lean();
}

async function deleteReminder(reminderId, userPhone = null) {
  const query = { _id: reminderId };
  if (userPhone) query.userPhone = normalizePhone(userPhone);

  const reminder = await Reminder.findOne(query);
  if (!reminder) throw new Error("Reminder not found");

  await Reminder.deleteOne({ _id: reminder._id });
  return reminder;
}

module.exports = {
  createReminder,
  parseReminderMessage,
  scheduleReminder,
  sendReminder,
  getPendingReminders,
  getRemindersForUser,
  deleteReminder,
};
