const Announcement = require("../models/Announcement");
const User = require("../models/User");
const ClassModel = require("../models/Class");
const SystemLog = require("../models/SystemLog");
const whatsappService = require("./whatsappService");
const activityService = require("./activityService");

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

function mapUsers(users = []) {
  const seen = new Set();

  return users
    .filter((user) => user && user.phone)
    .map((user) => ({
      user: user._id || user.user || null,
      name: user.name,
      phone: normalizePhone(user.phone),
      deliveryStatus: "pending",
    }))
    .filter((entry) => {
      if (!entry.phone || seen.has(entry.phone)) return false;
      seen.add(entry.phone);
      return true;
    });
}

async function resolveTargets(announcementData) {
  const targetScope =
    announcementData.targetScope ||
    (announcementData.targetClass || announcementData.targetClassId ? "class" : null) ||
    (announcementData.targetDepartment ? "department" : null) ||
    (announcementData.targetYear ? "year" : null) ||
    "manual";

  let users = [];
  let targetClass = null;

  if (targetScope === "all") {
    users = await User.find({ role: "student", status: "active" }).select("_id name phone");
  } else if (targetScope === "department") {
    users = await User.find({ role: "student", status: "active", department: announcementData.targetDepartment }).select("_id name phone");
  } else if (targetScope === "year") {
    users = await User.find({ role: "student", status: "active", year: Number(announcementData.targetYear) }).select("_id name phone");
  } else if (targetScope === "class") {
    if (announcementData.targetClassId) {
      targetClass = await ClassModel.findById(announcementData.targetClassId).populate("members", "_id name phone");
    } else if (announcementData.targetClass) {
      targetClass = await ClassModel.findOne({ name: announcementData.targetClass }).populate("members", "_id name phone");
    }

    if (!targetClass) throw new Error("Target class not found");
    users = targetClass.members || [];
  } else {
    return {
      targetScope: "manual",
      targetDepartment: "",
      targetYear: null,
      targetClassId: null,
      targetClassName: "",
      targetUsers: mapUsers(announcementData.targetUsers || []),
    };
  }

  return {
    targetScope,
    targetDepartment: announcementData.targetDepartment || (targetClass ? targetClass.department : ""),
    targetYear: announcementData.targetYear ? Number(announcementData.targetYear) : targetClass ? targetClass.year : null,
    targetClassId: targetClass?._id || announcementData.targetClassId || null,
    targetClassName: targetClass?.name || announcementData.targetClass || "",
    targetUsers: mapUsers(users),
  };
}

async function createAnnouncement(announcementData) {
  const resolvedTargets = await resolveTargets(announcementData);

  return Announcement.create({
    title: announcementData.title,
    message: announcementData.message,
    priority: String(announcementData.priority || "medium").toLowerCase(),
    targetScope: resolvedTargets.targetScope,
    targetDepartment: resolvedTargets.targetDepartment,
    targetYear: resolvedTargets.targetYear,
    targetClassId: resolvedTargets.targetClassId,
    targetClassName: resolvedTargets.targetClassName,
    targetUsers: resolvedTargets.targetUsers,
    createdBy: announcementData.createdBy || null,
    status: "draft",
  });
}

async function broadcastAnnouncement(announcementId) {
  const announcement = await Announcement.findById(announcementId);
  if (!announcement) throw new Error("Announcement not found");

  for (const targetUser of announcement.targetUsers) {
    try {
      await whatsappService.sendAnnouncement(targetUser.phone, announcement);
      targetUser.deliveryStatus = "sent";
      targetUser.deliveredAt = new Date();
    } catch (error) {
      targetUser.deliveryStatus = "failed";
      await SystemLog.create({
        level: "error",
        category: "announcement",
        message: "Failed to send announcement",
        source: "announcementService",
        details: { announcementId, phone: targetUser.phone, error: error.message },
      });
    }
  }

  announcement.status = "sent";
  announcement.sentAt = new Date();
  await announcement.save();

  await activityService.logActivity({
    actionType: "Announcement sent",
    description: `${announcement.title} was broadcast to ${announcement.targetUsers.length} users`,
  });

  return announcement;
}

async function getAnnouncementsForUser(phone) {
  const normalizedPhone = normalizePhone(phone);
  return Announcement.find({ "targetUsers.phone": normalizedPhone, status: "sent" })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
}

async function listAnnouncements() {
  return Announcement.find({}).sort({ createdAt: -1 }).limit(50).lean();
}

module.exports = {
  createAnnouncement,
  broadcastAnnouncement,
  getAnnouncementsForUser,
  listAnnouncements,
};
