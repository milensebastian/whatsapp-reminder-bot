const EmergencyAlert = require("../models/EmergencyAlert");
const SystemLog = require("../models/SystemLog");
const User = require("../models/User");
const whatsappService = require("./whatsappService");

function buildEmergencyMessage(alert) {
  return [
    "\uD83D\uDEA8 EMERGENCY ALERT",
    "",
    alert.title,
    "",
    alert.message,
  ].join("\n");
}

async function createEmergencyAlert(payload) {
  const alert = await EmergencyAlert.create({
    title: payload.title,
    message: payload.message,
    sentBy: payload.sentBy || null,
  });

  const users = await User.find({ status: "active" }).select("phone name").lean();
  const body = buildEmergencyMessage(alert);
  let delivered = 0;

  for (const user of users) {
    if (!user.phone) continue;
    await whatsappService.sendTextMessage(user.phone, body, {
      messageType: "emergency",
      emergencyAlertId: alert._id,
    });
    delivered += 1;
  }

  await SystemLog.create({
    level: "warn",
    category: "emergency",
    message: "Emergency alert broadcast sent",
    source: "emergencyAlertService",
    details: {
      alertId: alert._id,
      title: alert.title,
      delivered,
    },
    timestamp: new Date(),
  });

  return {
    alert,
    delivered,
  };
}

async function getEmergencyAlerts() {
  return EmergencyAlert.find({}).sort({ createdAt: -1 }).lean();
}

module.exports = {
  createEmergencyAlert,
  getEmergencyAlerts,
};
