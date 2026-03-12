const MessageLog = require("../models/MessageLog");
const SystemLog = require("../models/SystemLog");
const Task = require("../models/Task");
const Announcement = require("../models/Announcement");
const Reminder = require("../models/Reminder");

const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || "v20.0";
const TASK_ICON = "\u{1F4CC}";
const ANNOUNCEMENT_ICON = "\u{1F4E2}";
const REMINDER_ICON = "\u{23F0}";

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

function capitalize(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDateTime(value) {
  if (!value) return "Not specified";

  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTaskMessage(task) {
  return [
    `${TASK_ICON} New Task Assigned`,
    "",
    `Title: ${task.title}`,
    `Deadline: ${formatDateTime(task.deadline)}`,
    `Priority: ${capitalize(task.priority) || "Medium"}`,
    "",
    task.description,
    "",
    'Reply "DONE" after completing the task.',
  ].join("\n");
}

function formatAnnouncementMessage(announcement) {
  return [
    `${ANNOUNCEMENT_ICON} ${capitalize(announcement.priority) || "General"} Announcement`,
    "",
    announcement.title,
    "",
    announcement.message,
  ].join("\n");
}

function formatReminderMessage(reminder) {
  return [`${REMINDER_ICON} Reminder`, "", reminder.message].join("\n");
}

function getMenuText() {
  return [
    "Welcome to Notify",
    "",
    "1 My Tasks",
    "2 My Reminders",
    "3 Announcements",
    "4 Help",
  ].join("\n");
}

function getHelpText() {
  return [
    "Notify Help",
    "",
    "menu - show main menu",
    "1 - view your tasks",
    "2 - view your reminders",
    "3 - view announcements",
    "4 - show help",
    "",
    'You can also say: "remind me to buy milk tomorrow at 6pm"',
    'To complete a task, reply with: "DONE <task title>" or simply "DONE" in a task thread.',
  ].join("\n");
}

async function logMessage({
  userPhone,
  message,
  direction,
  messageType = "text",
  deliveryStatus,
  metadata = {},
}) {
  return MessageLog.create({
    userPhone: normalizePhone(userPhone),
    message,
    direction,
    messageType,
    deliveryStatus:
      deliveryStatus || (direction === "outgoing" ? "sent" : "received"),
    metadata,
    timestamp: new Date(),
  });
}

async function logSystem(level, category, message, details = {}) {
  try {
    await SystemLog.create({
      level,
      category,
      message,
      details,
      source: "whatsappService",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("[system-log] failed", error.message);
  }
}

async function sendTextMessage(to, body, metadata = {}) {
  const phone = normalizePhone(to);
  const payload = {
    messaging_product: "whatsapp",
    to: phone,
    type: "text",
    text: {
      preview_url: false,
      body,
    },
  };

  const endpoint = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const hasCredentials =
    process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!hasCredentials) {
    await logMessage({
      userPhone: phone,
      message: body,
      direction: "outgoing",
      messageType: metadata.messageType || "text",
      deliveryStatus: "queued",
      metadata: {
        ...metadata,
        mode: "mock",
      },
    });

    await logSystem("warn", "webhook", "WhatsApp credentials missing, message mocked", {
      to: phone,
      body,
    });

    return {
      success: true,
      mocked: true,
      payload,
    };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  await logMessage({
    userPhone: phone,
    message: body,
    direction: "outgoing",
    messageType: metadata.messageType || "text",
    deliveryStatus: response.ok ? "sent" : "failed",
    metadata: {
      ...metadata,
      whatsappResponse: data,
    },
  });

  if (!response.ok) {
    await logSystem("error", "webhook", "Failed to send WhatsApp message", {
      to: phone,
      response: data,
    });

    const error = new Error(data.error?.message || "Failed to send WhatsApp message");
    error.statusCode = response.status;
    throw error;
  }

  return {
    success: true,
    data,
  };
}

async function sendTaskNotification(phone, task) {
  const body = formatTaskMessage(task);

  return sendTextMessage(phone, body, {
    messageType: "task",
    taskId: task._id,
  });
}

async function sendTaskReminder(phone, task) {
  return sendTaskNotification(phone, task);
}

async function sendAnnouncement(phone, announcement) {
  const body = formatAnnouncementMessage(announcement);

  return sendTextMessage(phone, body, {
    messageType: "announcement",
    announcementId: announcement._id,
  });
}

async function sendReminder(phone, reminder) {
  const body = formatReminderMessage(reminder);

  return sendTextMessage(phone, body, {
    messageType: "reminder",
    reminderId: reminder._id,
  });
}

async function sendReminderMessage(phone, reminder) {
  return sendReminder(phone, reminder);
}

async function handleBotCommand(userPhone, rawCommand) {
  const command = String(rawCommand || "").trim().toLowerCase();
  const phone = normalizePhone(userPhone);
  const aliasMap = {
    "1": "tasks",
    "2": "reminders",
    "3": "announcements",
    "4": "help",
  };
  const normalizedCommand = aliasMap[command] || command;

  const commandMap = {
    menu: async () => getMenuText(),
    help: async () => getHelpText(),
    tasks: async () => {
      const tasks = await Task.find({
        status: { $in: ["active", "draft"] },
        "assignedUsers.phone": phone,
      })
        .sort({ deadline: 1 })
        .limit(5)
        .lean();

      if (!tasks.length) {
        return "You have no active tasks right now.";
      }

      return [
        "Your Tasks",
        "",
        ...tasks.map(
          (task, index) =>
            `${index + 1}. ${task.title} - ${new Date(task.deadline).toLocaleDateString()}`
        ),
      ].join("\n");
    },
    announcements: async () => {
      const announcements = await Announcement.find({
        "targetUsers.phone": phone,
        status: { $in: ["sent", "scheduled"] },
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      if (!announcements.length) {
        return "No announcements found for your account.";
      }

      return [
        "Recent Announcements",
        "",
        ...announcements.map(
          (item, index) => `${index + 1}. ${item.title} (${item.priority})`
        ),
      ].join("\n");
    },
    reminders: async () => {
      const reminders = await Reminder.find({
        userPhone: phone,
        status: "pending",
      })
        .sort({ reminderTime: 1 })
        .limit(5)
        .lean();

      if (!reminders.length) {
        return "You do not have any pending reminders.";
      }

      return [
        "Your Reminders",
        "",
        ...reminders.map(
          (item, index) =>
            `${index + 1}. ${item.message} - ${new Date(item.reminderTime).toLocaleString()}`
        ),
      ].join("\n");
    },
  };

  const handler = commandMap[normalizedCommand];

  if (!handler) {
    return {
      recognized: false,
      command: null,
      response: 'Unknown command. Type "menu" to see available options.',
    };
  }

  return {
    recognized: true,
    command: normalizedCommand,
    response: await handler(),
  };
}

module.exports = {
  getMenuText,
  getHelpText,
  handleBotCommand,
  sendTextMessage,
  sendTaskNotification,
  sendTaskReminder,
  sendAnnouncement,
  sendReminder,
  sendReminderMessage,
  logMessage,
};
