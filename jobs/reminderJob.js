const Reminder = require("../models/Reminder");
const SystemLog = require("../models/SystemLog");
const reminderService = require("../services/reminderService");

const CRON_SCHEDULE = "* * * * *";

async function runReminderJob(referenceDate = new Date()) {
  const dueReminders = await Reminder.find({
    status: "pending",
    reminderTime: { $lte: referenceDate },
  });

  let processed = 0;
  let failed = 0;

  for (const reminder of dueReminders) {
    try {
      await reminderService.sendReminder(reminder);
      processed += 1;
    } catch (error) {
      failed += 1;
      reminder.status = "failed";
      await reminder.save();

      await SystemLog.create({
        level: "error",
        category: "reminder",
        message: "Reminder job failed to send reminder",
        source: "reminderJob",
        details: {
          reminderId: reminder._id,
          userPhone: reminder.userPhone,
          error: error.message,
        },
        timestamp: new Date(),
      });
    }
  }

  return {
    success: true,
    schedule: CRON_SCHEDULE,
    processed,
    failed,
    checkedAt: referenceDate,
  };
}

module.exports = {
  name: "reminderJob",
  schedule: CRON_SCHEDULE,
  run: runReminderJob,
};
