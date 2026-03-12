const Task = require("../models/Task");
const Reminder = require("../models/Reminder");
const Announcement = require("../models/Announcement");

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

function detectIntent(message) {
  const text = String(message || "").trim().toLowerCase();

  if (!text || !/[?]|\bwhat\b|\bwhen\b|\bdo i have\b|\bwhich\b/.test(text)) {
    return { intent: "unknown", confidence: 0 };
  }

  if (text.includes("task") || text.includes("deadline") || text.includes("assignment")) {
    return { intent: "task_query", confidence: 0.9 };
  }

  if (text.includes("reminder") || text.includes("today") && text.includes("remind")) {
    return { intent: "reminder_query", confidence: 0.85 };
  }

  if (text.includes("announcement") || text.includes("notice") || text.includes("update")) {
    return { intent: "announcement_query", confidence: 0.8 };
  }

  return { intent: "unknown", confidence: 0.2 };
}

async function answerTaskQueries(userPhone, message) {
  const phone = normalizePhone(userPhone);
  const text = String(message || "").toLowerCase();

  const tasks = await Task.find({
    "assignedUsers.phone": phone,
    status: { $in: ["active", "draft"] },
  })
    .sort({ deadline: 1 })
    .lean();

  if (!tasks.length) {
    return "You have no pending tasks right now.";
  }

  if (text.includes("what is my pending task") || text.includes("what are my pending tasks")) {
    return [
      "Your pending tasks:",
      "",
      ...tasks.map((task) => `${task.title}\nDeadline: ${new Date(task.deadline).toLocaleDateString()}`),
    ].join("\n\n");
  }

  const matchingTask = tasks.find((task) => {
    const title = String(task.title || "").toLowerCase();
    return title && text.includes(title.split(" ")[0]);
  }) || tasks.find((task) => text.includes(String(task.title || "").toLowerCase()));

  if (matchingTask && (text.includes("when") || text.includes("deadline"))) {
    return `${matchingTask.title}\nDeadline: ${new Date(matchingTask.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}`;
  }

  const nextTask = tasks[0];
  return [
    "Your pending tasks:",
    "",
    `${nextTask.title}`,
    `Deadline: ${new Date(nextTask.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}`,
  ].join("\n");
}

async function answerReminderQueries(userPhone, message) {
  const phone = normalizePhone(userPhone);
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const text = String(message || "").toLowerCase();
  const query = {
    userPhone: phone,
    status: "pending",
  };

  if (text.includes("today")) {
    query.reminderTime = {
      $gte: startOfDay,
      $lte: endOfDay,
    };
  }

  const reminders = await Reminder.find(query).sort({ reminderTime: 1 }).lean();

  if (!reminders.length) {
    return text.includes("today")
      ? "You do not have any reminders scheduled for today."
      : "You do not have any pending reminders.";
  }

  return [
    text.includes("today") ? "Your reminders for today:" : "Your reminders:",
    "",
    ...reminders.map(
      (reminder) => `${reminder.message}\nTime: ${new Date(reminder.reminderTime).toLocaleString()}`
    ),
  ].join("\n\n");
}

async function answerAnnouncementQueries(userPhone) {
  const phone = normalizePhone(userPhone);
  const announcements = await Announcement.find({
    "targetUsers.phone": phone,
    status: { $in: ["sent", "scheduled"] },
  })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

  if (!announcements.length) {
    return "There are no recent announcements for your account.";
  }

  return [
    "Recent announcements:",
    "",
    ...announcements.map((item) => `${item.title}\nPriority: ${item.priority}`),
  ].join("\n\n");
}

module.exports = {
  detectIntent,
  answerTaskQueries,
  answerReminderQueries,
  answerAnnouncementQueries,
};
