const taskService = require("../services/taskService");
const scheduledMessageService = require("../services/scheduledMessageService");

function combineSchedule(sendDate, sendTime) {
  if (!sendDate || !sendTime) return null;
  return new Date(`${sendDate}T${sendTime}:00`);
}

async function createTask(req, res, next) {
  try {
    const scheduledAt = combineSchedule(req.body.scheduleDate, req.body.scheduleTime);

    if (scheduledAt) {
      const scheduledMessage = await scheduledMessageService.createScheduledMessage({
        title: req.body.title,
        message: req.body.description,
        priority: req.body.priority,
        deadline: req.body.deadline,
        targetScope: req.body.targetScope,
        targetDepartment: req.body.targetDepartment,
        targetYear: req.body.targetYear,
        targetClass: req.body.targetClassId || req.body.targetClass,
        targetClassName: req.body.targetClassName || "",
        targetUsers: req.body.assignedUsers || [],
        sendTime: scheduledAt,
        type: "task",
      });

      return res.status(201).json({
        success: true,
        message: "Task scheduled successfully",
        data: scheduledMessage,
      });
    }

    const task = await taskService.createTask(req.body);

    if (req.body.autoSend !== false) {
      await taskService.sendTaskNotification(task._id);
    }

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    return next(error);
  }
}

async function assignTaskToUsers(req, res, next) {
  try {
    const task = await taskService.assignTaskToUsers(req.params.id, req.body.assignedUsers || []);

    if (req.body.sendNotifications !== false) {
      await taskService.sendTaskNotification(task._id);
    }

    return res.status(200).json({
      success: true,
      message: "Task assigned successfully",
      data: task,
    });
  } catch (error) {
    return next(error);
  }
}

async function markTaskCompleted(req, res, next) {
  try {
    const task = await taskService.markTaskCompleted({
      phone: req.body.phone,
      taskId: req.params.id || req.body.taskId,
      title: req.body.title,
    });

    return res.status(200).json({
      success: true,
      message: "Task marked as completed",
      data: task,
    });
  } catch (error) {
    return next(error);
  }
}

async function getUserTasks(req, res, next) {
  try {
    const phone = req.query.phone || req.params.phone;
    const tasks = phone ? await taskService.getTasksForUser(phone) : await taskService.listTasks();

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createTask,
  assignTaskToUsers,
  markTaskCompleted,
  getUserTasks,
};
