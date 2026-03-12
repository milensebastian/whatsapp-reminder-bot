const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function setTimeParts(date, hour, minute = 0) {
  const value = new Date(date);
  value.setHours(hour, minute, 0, 0);
  return value;
}

function getNextWeekdayDate(weekdayName, hour = 9, minute = 0) {
  const now = new Date();
  const current = new Date(now);
  const targetIndex = WEEKDAYS.indexOf(weekdayName);
  const offset = (targetIndex - current.getDay() + 7) % 7 || 7;
  current.setDate(current.getDate() + offset);
  return setTimeParts(current, hour, minute);
}

function parseTimeExpression(input) {
  const lowered = String(input || "").toLowerCase();
  const namedTimes = {
    morning: { hour: 9, minute: 0 },
    afternoon: { hour: 15, minute: 0 },
    evening: { hour: 18, minute: 0 },
    night: { hour: 21, minute: 0 },
    noon: { hour: 12, minute: 0 },
  };

  for (const [label, time] of Object.entries(namedTimes)) {
    if (lowered.includes(label)) {
      return time;
    }
  }

  const match = lowered.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) {
    return { hour: 9, minute: 0 };
  }

  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3] ? match[3].toLowerCase() : null;

  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;

  return { hour, minute };
}

function extractReminderMessage(rawText) {
  const normalized = String(rawText || "")
    .trim()
    .replace(/^remind me(?: to)?\s+/i, "");

  const separators = [
    /\s+tomorrow\b/i,
    /\s+in\s+\d+\s+(minute|minutes|hour|hours|day|days)\b/i,
    /\s+every\s+(day|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\s+at\s+\d{1,2}(?::\d{2})?\s*(am|pm)?/i,
    /\s+(morning|afternoon|evening|night|noon)\b/i,
  ];

  let message = normalized;
  for (const separator of separators) {
    const parts = message.split(separator);
    if (parts[0] && parts[0] !== message) {
      message = parts[0];
      break;
    }
  }

  return message.trim().replace(/\s+/g, " ");
}

function parseReminderMessage(text) {
  const input = String(text || "").trim();
  const lowered = input.toLowerCase();

  if (!/^remind me\b/i.test(input)) {
    return {
      isReminder: false,
      error: "Message is not a reminder command",
    };
  }

  const message = extractReminderMessage(input);
  const now = new Date();

  if (!message) {
    return {
      isReminder: false,
      error: "Reminder message could not be determined",
    };
  }

  const relativeMatch = lowered.match(/in\s+(\d+)\s+(minute|minutes|hour|hours|day|days)/i);
  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2].toLowerCase();
    const reminderTime = new Date(now);

    if (unit.startsWith("minute")) reminderTime.setMinutes(reminderTime.getMinutes() + amount);
    if (unit.startsWith("hour")) reminderTime.setHours(reminderTime.getHours() + amount);
    if (unit.startsWith("day")) reminderTime.setDate(reminderTime.getDate() + amount);

    return {
      message,
      reminderTime,
      repeatType: "none",
      repeatDay: null,
    };
  }

  if (lowered.includes("every day")) {
    const time = parseTimeExpression(lowered);
    const reminderTime = setTimeParts(now, time.hour, time.minute);
    if (reminderTime <= now) reminderTime.setDate(reminderTime.getDate() + 1);

    return {
      message,
      reminderTime,
      repeatType: "daily",
      repeatDay: null,
    };
  }

  for (const weekday of WEEKDAYS) {
    if (lowered.includes(`every ${weekday}`)) {
      const time = parseTimeExpression(lowered);
      return {
        message,
        reminderTime: getNextWeekdayDate(weekday, time.hour, time.minute),
        repeatType: "weekly",
        repeatDay: weekday,
      };
    }
  }

  if (lowered.includes("tomorrow")) {
    const time = parseTimeExpression(lowered);
    const reminderTime = new Date(now);
    reminderTime.setDate(reminderTime.getDate() + 1);
    reminderTime.setHours(time.hour, time.minute, 0, 0);

    return {
      message,
      reminderTime,
      repeatType: "none",
      repeatDay: null,
    };
  }

  const timeOnlyMatch = lowered.match(/\bat\s+\d{1,2}(?::\d{2})?\s*(am|pm)?\b/i);
  if (timeOnlyMatch || /\b(morning|afternoon|evening|night|noon)\b/i.test(lowered)) {
    const time = parseTimeExpression(lowered);
    const reminderTime = setTimeParts(now, time.hour, time.minute);
    if (reminderTime <= now) reminderTime.setDate(reminderTime.getDate() + 1);

    return {
      message,
      reminderTime,
      repeatType: "none",
      repeatDay: null,
    };
  }

  throw new Error("Unsupported reminder format");
}

module.exports = parseReminderMessage;
module.exports.parseReminderMessage = parseReminderMessage;
