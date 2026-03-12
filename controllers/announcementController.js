const scheduledMessageService = require("../services/scheduledMessageService");
const announcementService = require("../services/announcementService");

function combineSchedule(sendDate, sendTime) {
  if (!sendDate || !sendTime) return null;
  return new Date(`${sendDate}T${sendTime}:00`);
}

async function createAnnouncement(req, res, next) {
  try {
    const scheduledAt = combineSchedule(req.body.scheduleDate, req.body.scheduleTime);

    if (scheduledAt) {
      const scheduledMessage = await scheduledMessageService.createScheduledMessage({
        title: req.body.title,
        message: req.body.message,
        priority: req.body.priority,
        targetScope: req.body.targetScope,
        targetDepartment: req.body.targetDepartment,
        targetYear: req.body.targetYear,
        targetClass: req.body.targetClassId || req.body.targetClass,
        targetClassName: req.body.targetClassName || "",
        targetUsers: req.body.targetUsers || [],
        sendTime: scheduledAt,
        type: "announcement",
      });

      return res.status(201).json({
        success: true,
        message: "Announcement scheduled successfully",
        data: scheduledMessage,
      });
    }

    const announcement = await announcementService.createAnnouncement(req.body);

    if (req.body.autoSend !== false) {
      await announcementService.broadcastAnnouncement(announcement._id);
    }

    return res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      data: announcement,
    });
  } catch (error) {
    return next(error);
  }
}

async function broadcastAnnouncement(req, res, next) {
  try {
    const announcement = await announcementService.broadcastAnnouncement(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Announcement broadcast completed",
      data: announcement,
    });
  } catch (error) {
    return next(error);
  }
}

async function getUserAnnouncements(req, res, next) {
  try {
    const phone = req.query.phone || req.params.phone;
    const announcements = phone
      ? await announcementService.getAnnouncementsForUser(phone)
      : await announcementService.listAnnouncements();

    return res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    return next(error);
  }
}

async function getScheduledAnnouncements(req, res, next) {
  try {
    const scheduledMessages = await scheduledMessageService.getScheduledMessages();
    return res.status(200).json({
      success: true,
      data: scheduledMessages,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createAnnouncement,
  broadcastAnnouncement,
  getUserAnnouncements,
  getScheduledAnnouncements,
};
