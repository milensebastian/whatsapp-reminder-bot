const Task = require("../models/Task");
const SystemLog = require("../models/SystemLog");
const whatsappService = require("../services/whatsappService");

const CRON_SCHEDULE = "0 * * * *";
const DEFAULT_WINDOW_HOURS = Number(process.env.TASK_DEADLINE_REMINDER_HOURS || 24);

async function runDeadlineJob(options = {}) {
  const now = options.referenceDate ? new Date(options.referenceDate) : new Date();
  const hoursAhead = Number(options.hoursAhead || DEFAULT_WINDOW_HOURS);
  const deadlineCutoff = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  const tasks = await Task.find({
    status: "active",
    reminderSent: false,
    deadline: {
      $lte: deadlineCutoff,
      $gte: now,
    },
  });

  let processed = 0;
  let failed = 0;

  for (const task of tasks) {
    let taskHadFailure = false;

    for (const assignedUser of task.assignedUsers) {
      if (assignedUser.status === "completed") {
        continue;
      }

      try {
        const message = [
          "Task Deadline Reminder",
          "",
          `Title: ${task.title}`,
          `Deadline: ${new Date(task.deadline).toLocaleString()}`,
          `Priority: ${task.priority}`,
          "",
          task.description,
        ].join("\n");

        await whatsappService.sendTextMessage(assignedUser.phone, message, {
          messageType: "task",
          taskId: task._id,
          notificationType: "deadline-reminder",
        });

        processed += 1;
      } catch (error) {
        taskHadFailure = true;
        failed += 1;

        await SystemLog.create({
          level: "error",
          category: "task",
          message: "Deadline job failed to notify assigned user",
          source: "deadlineJob",
          details: {
            taskId: task._id,
            userPhone: assignedUser.phone,
            error: error.message,
          },
          timestamp: new Date(),
        });
      }
    }

    if (!taskHadFailure) {
      task.reminderSent = true;
      await task.save();
    }
  }

  return {
    success: true,
    schedule: CRON_SCHEDULE,
    processed,
    failed,
    checkedAt: now,
    hoursAhead,
  };
}

module.exports = {
  name: "deadlineJob",
  schedule: CRON_SCHEDULE,
  run: runDeadlineJob,
};
