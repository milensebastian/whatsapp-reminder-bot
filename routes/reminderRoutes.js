const express = require("express");
const reminderController = require("../controllers/reminderController");
const { requireAuth, allowTeacherOrAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, allowTeacherOrAdmin);

router.get("/", reminderController.getUserReminders);
router.get("/:phone", reminderController.getUserReminders);
router.post("/", reminderController.createReminder);
router.delete("/:id", reminderController.deleteReminder);

module.exports = router;
