const Task = require("../models/Task");
const User = require("../models/User");
const ClassModel = require("../models/Class");
const SystemLog = require("../models/SystemLog");
const whatsappService = require("./whatsappService");
const activityService = require("./activityService");

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

function mapUsersToAssignments(users = []) {
  const seen = new Set();

  return users
    .filter((user) => user && user.phone)
    .map((user) => ({
      user: user._id || user.user || null,
      name: user.name,
      phone: normalizePhone(user.phone),
      status: "pending",
    }))
    .filter((entry) => {
      if (!entry.phone || seen.has(entry.phone)) return false;
      seen.add(entry.phone);
      return true;
    });
}

async function resolveTargetUsers(taskData) {
  const targetScope =
    taskData.targetScope ||
    (taskData.targetClass || taskData.targetClassId ? "class" : null) ||
    (taskData.targetDepartment ? "department" : null) ||
    (taskData.targetYear ? "year" : null) ||
    "manual";

  let users = [];
  let targetClass = null;

  if (targetScope === "all") {
    users = await User.find({ role: "student", status: "active" }).select("_id name phone");
  } else if (targetScope === "department") {
    users = await User.find({ role: "student", status: "active", department: taskData.targetDepartment }).select("_id name phone");
  } else if (targetScope === "year") {
    users = await User.find({ role: "student", status: "active", year: Number(taskData.targetYear) }).select("_id name phone");
  } else if (targetScope === "class") {
    if (taskData.targetClassId) {
      targetClass = await ClassModel.findById(taskData.targetClassId).populate("members", "_id name phone");
    } else if (taskData.targetClass) {
      targetClass = await ClassModel.findOne({ name: taskData.targetClass }).populate("members", "_id name phone");
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
      assignedUsers: mapUsersToAssignments(taskData.assignedUsers || []),
    };
  }

  return {
    targetScope,
    targetDepartment: taskData.targetDepartment || (targetClass ? targetClass.department : ""),
    targetYear: taskData.targetYear ? Number(taskData.targetYear) : targetClass ? targetClass.year : null,
    targetClassId: targetClass?._id || taskData.targetClassId || null,
    targetClassName: targetClass?.name || taskData.targetClass || "",
    assignedUsers: mapUsersToAssignments(users),
  };
}

async function createTask(taskData) {
  const resolvedTargets = await resolveTargetUsers(taskData);

  return Task.create({
    title: taskData.title,
    description: taskData.description,
    deadline: taskData.deadline,
    priority: String(taskData.priority || "medium").toLowerCase(),
    assignedUsers: resolvedTargets.assignedUsers,
    targetScope: resolvedTargets.targetScope,
    targetDepartment: resolvedTargets.targetDepartment,
    targetYear: resolvedTargets.targetYear,
    targetClassId: resolvedTargets.targetClassId,
    targetClassName: resolvedTargets.targetClassName,
    createdBy: taskData.createdBy || null,
    source: taskData.source || "manual",
    status: "active",
  });
}

async function assignTaskToUsers(taskId, assignedUsers) {
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  const preparedUsers = [];

  for (const assignedUser of assignedUsers) {
    const phone = normalizePhone(assignedUser.phone);
    const existingUser = assignedUser.user || (await User.findOne({ phone }).select("_id"));

    preparedUsers.push({
      user: existingUser?._id || assignedUser.user || null,
      name: assignedUser.name,
      phone,
      status: "pending",
      assignedAt: new Date(),
    });
  }

  task.assignedUsers = preparedUsers;
  task.targetScope = "manual";
  await task.save();

  return task;
}

async function sendTaskNotification(taskId) {
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  for (const assignedUser of task.assignedUsers) {
    try {
      await whatsappService.sendTaskNotification(assignedUser.phone, task);
      assignedUser.status = "sent";
      assignedUser.deliveredAt = new Date();

      await activityService.logActivity({
        actionType: "Task assigned",
        description: `${task.title} assigned to ${assignedUser.name || assignedUser.phone}`,
        userPhone: assignedUser.phone,
      });
    } catch (error) {
      assignedUser.status = "failed";
      await SystemLog.create({
        level: "error",
        category: "task",
        message: "Failed to send task notification",
        source: "taskService",
        details: { taskId, phone: assignedUser.phone, error: error.message },
      });
    }
  }

  await task.save();
  return task;
}

async function markTaskCompleted({ phone, taskId, title }) {
  const normalizedPhone = normalizePhone(phone);
  let task = null;

  if (taskId) task = await Task.findById(taskId);

  if (!task && title) {
    task = await Task.findOne({
      title: new RegExp(`^${title.trim()}$`, "i"),
      "assignedUsers.phone": normalizedPhone,
    });
  }

  if (!task) {
    task = await Task.findOne({ "assignedUsers.phone": normalizedPhone, status: "active" }).sort({ createdAt: -1 });
  }

  if (!task) throw new Error("No matching task found for completion");

  const assignedUser = task.assignedUsers.find((entry) => entry.phone === normalizedPhone);
  if (!assignedUser) throw new Error("User is not assigned to this task");
  if (assignedUser.status === "completed") {
    throw new Error("Task already completed");
  }

  assignedUser.status = "completed";
  assignedUser.completedAt = new Date();
  task.completionCount += 1;

  const allCompleted = task.assignedUsers.every((entry) => entry.status === "completed");
  if (allCompleted) task.status = "completed";

  await task.save();

  await activityService.logActivity({
    actionType: "Student completed task",
    description: `${assignedUser.name || normalizedPhone} completed ${task.title}`,
    userPhone: normalizedPhone,
  });

  return task;
}

async function getTasksForUser(phone) {
  const normalizedPhone = normalizePhone(phone);
  return Task.find({ "assignedUsers.phone": normalizedPhone, status: { $in: ["active", "draft"] } })
    .sort({ deadline: 1 })
    .lean();
}

async function listTasks() {
  return Task.find({}).sort({ createdAt: -1 }).limit(50).lean();
}

module.exports = {
  createTask,
  assignTaskToUsers,
  sendTaskNotification,
  markTaskCompleted,
  getTasksForUser,
  listTasks,
};
