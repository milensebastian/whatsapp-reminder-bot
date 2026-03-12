const User = require("../models/User");
const Task = require("../models/Task");
const Announcement = require("../models/Announcement");
const MessageLog = require("../models/MessageLog");
const pollService = require("./pollService");
const activityService = require("./activityService");

async function getTotalUsers() {
  return User.countDocuments();
}

async function getTotalTasks() {
  return Task.countDocuments();
}

async function getCompletedTasks() {
  return Task.countDocuments({ status: "completed" });
}

async function getAnnouncementsSent() {
  return Announcement.countDocuments({ status: "sent" });
}

async function getMessageCount() {
  return MessageLog.countDocuments();
}

async function getLatestPollResults() {
  return pollService.getPollResults();
}

async function getDashboardStats() {
  const [totalUsers, tasksAssigned, tasksCompleted, announcementsSent, messagesDelivered] = await Promise.all([
    getTotalUsers(),
    getTotalTasks(),
    getCompletedTasks(),
    getAnnouncementsSent(),
    getMessageCount(),
  ]);

  return {
    totalUsers,
    tasksAssigned,
    tasksCompleted,
    announcementsSent,
    messagesDelivered,
  };
}

async function getRecentActivity(limit = 20) {
  return activityService.getRecentActivity(limit);
}

async function generateSummaryReport() {
  const [stats, recentActivity, latestPollResults] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(20),
    getLatestPollResults(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    stats,
    recentActivity,
    latestPollResults,
  };
}

module.exports = {
  getTotalUsers,
  getTotalTasks,
  getCompletedTasks,
  getAnnouncementsSent,
  getMessageCount,
  getLatestPollResults,
  getDashboardStats,
  getRecentActivity,
  generateSummaryReport,
};
