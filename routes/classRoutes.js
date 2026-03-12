const express = require("express");
const classController = require("../controllers/classController");
const { requireAuth, allowTeacherOrAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, allowTeacherOrAdmin);

router.post("/", classController.createClass);
router.get("/", classController.getClasses);
router.get("/:id", classController.getClassById);
router.put("/:id", classController.updateClass);
router.delete("/:id", classController.deleteClass);
router.post("/:id/add-student", classController.addStudentToClass);
router.post("/:id/remove-student", classController.removeStudentFromClass);

module.exports = router;
