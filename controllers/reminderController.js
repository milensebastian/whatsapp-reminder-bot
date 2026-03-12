const reminderService = require("../services/reminderService");

async function createReminder(req, res, next) {
  try {
    const reminder = await reminderService.createReminder({
      userPhone: req.body.userPhone,
      sourceMessage:
        req.body.sourceMessage ||
        `remind me to ${req.body.message} at ${req.body.reminderTime}`,
      user: req.body.user || null,
    });

    return res.status(201).json({
      success: true,
      message: "Reminder created successfully",
      data: reminder,
    });
  } catch (error) {
    return next(error);
  }
}

async function getUserReminders(req, res, next) {
  try {
    const reminders = await reminderService.getRemindersForUser(
      req.query.phone || req.params.phone || req.body.userPhone
    );

    return res.status(200).json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteReminder(req, res, next) {
  try {
    const reminder = await reminderService.deleteReminder(
      req.params.id,
      req.body.userPhone || req.query.phone || null
    );

    return res.status(200).json({
      success: true,
      message: "Reminder deleted successfully",
      data: reminder,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createReminder,
  getUserReminders,
  deleteReminder,
};
