const SystemLog = require("../models/SystemLog");
const analyticsService = require("../services/analyticsService");

const CRON_SCHEDULE = "0 0 * * *";

async function runReportJob() {
  const report = await analyticsService.generateSummaryReport();

  await SystemLog.create({
    level: "info",
    category: "analytics",
    message: "Daily analytics summary generated",
    source: "reportJob",
    details: report,
    timestamp: new Date(),
  });

  return {
    success: true,
    schedule: CRON_SCHEDULE,
    report,
  };
}

module.exports = {
  name: "reportJob",
  schedule: CRON_SCHEDULE,
  run: runReportJob,
};
