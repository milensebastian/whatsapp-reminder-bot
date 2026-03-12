const emergencyAlertService = require("../services/emergencyAlertService");

async function createEmergencyAlert(req, res, next) {
  try {
    const result = await emergencyAlertService.createEmergencyAlert({
      title: req.body.title,
      message: req.body.message,
      sentBy: req.body.sentBy || null,
    });

    return res.status(201).json({
      success: true,
      message: "Emergency alert sent instantly",
      data: result.alert,
      delivered: result.delivered,
    });
  } catch (error) {
    return next(error);
  }
}

async function getEmergencyAlerts(req, res, next) {
  try {
    const alerts = await emergencyAlertService.getEmergencyAlerts();
    return res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createEmergencyAlert,
  getEmergencyAlerts,
};
