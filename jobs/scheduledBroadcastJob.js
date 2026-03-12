const scheduledMessageService = require("../services/scheduledMessageService");

const CRON_SCHEDULE = "* * * * *";

async function runScheduledBroadcastJob(referenceDate = new Date()) {
  const result = await scheduledMessageService.processScheduledMessages(referenceDate);

  return {
    ...result,
    schedule: CRON_SCHEDULE,
  };
}

module.exports = {
  name: "scheduledBroadcastJob",
  schedule: CRON_SCHEDULE,
  run: runScheduledBroadcastJob,
};
