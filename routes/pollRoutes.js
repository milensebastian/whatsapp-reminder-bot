const express = require("express");
const pollController = require("../controllers/pollController");
const { requireAuth, allowTeacherOrAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, allowTeacherOrAdmin);

router.get("/", pollController.getPolls);
router.get("/:id/results", pollController.getPollResults);
router.post("/", pollController.createPoll);

module.exports = router;
