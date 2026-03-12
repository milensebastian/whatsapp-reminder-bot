const express = require("express");
const taskController = require("../controllers/taskController");
const { requireAuth, allowTeacherOrAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, allowTeacherOrAdmin);

router.get("/", taskController.getUserTasks);
router.post("/", taskController.createTask);
router.post("/:id/assign", taskController.assignTaskToUsers);
router.post("/:id/complete", taskController.markTaskCompleted);

module.exports = router;
