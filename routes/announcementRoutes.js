const express = require("express");
const announcementController = require("../controllers/announcementController");
const { requireAuth, allowTeacherOrAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, allowTeacherOrAdmin);

router.get("/", announcementController.getUserAnnouncements);
router.get("/scheduled", announcementController.getScheduledAnnouncements);
router.post("/", announcementController.createAnnouncement);
router.post("/:id/broadcast", announcementController.broadcastAnnouncement);

module.exports = router;
