const classService = require("../services/classService");

async function createClass(req, res, next) {
  try {
    const classDoc = await classService.createClass(req.body);
    return res.status(201).json({ success: true, message: "Class created successfully", data: classDoc });
  } catch (error) {
    return next(error);
  }
}

async function getClasses(req, res, next) {
  try {
    const classes = await classService.getClasses();
    return res.status(200).json({ success: true, data: classes });
  } catch (error) {
    return next(error);
  }
}

async function getClassById(req, res, next) {
  try {
    const classDoc = await classService.getClassById(req.params.id);
    return res.status(200).json({ success: true, data: classDoc });
  } catch (error) {
    return next(error);
  }
}

async function updateClass(req, res, next) {
  try {
    const classDoc = await classService.updateClass(req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Class updated successfully", data: classDoc });
  } catch (error) {
    return next(error);
  }
}

async function deleteClass(req, res, next) {
  try {
    const result = await classService.deleteClass(req.params.id);
    return res.status(200).json({ success: true, message: "Class deleted successfully", data: result });
  } catch (error) {
    return next(error);
  }
}

async function addStudentToClass(req, res, next) {
  try {
    const classDoc = await classService.addStudentToClass(req.params.id, req.body.userId);
    return res.status(200).json({ success: true, message: "Student added to class", data: classDoc });
  } catch (error) {
    return next(error);
  }
}

async function removeStudentFromClass(req, res, next) {
  try {
    const classDoc = await classService.removeStudentFromClass(req.params.id, req.body.userId);
    return res.status(200).json({ success: true, message: "Student removed from class", data: classDoc });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
};
