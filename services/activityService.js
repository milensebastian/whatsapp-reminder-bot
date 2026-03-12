const ActivityLog = require("../models/ActivityLog");

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

async function logActivity({ actionType, description, userPhone = "" }) {
  return ActivityLog.create({
    actionType,
    description,
    userPhone: userPhone ? normalizePhone(userPhone) : "",
    timestamp: new Date(),
  });
}

async function getRecentActivity(limit = 20) {
  return ActivityLog.find({})
    .sort({ timestamp: -1, createdAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = {
  logActivity,
  getRecentActivity,
};
