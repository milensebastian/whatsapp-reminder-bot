const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const { requireAuth, allowTeacherOrAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, allowTeacherOrAdmin);

router.get("/stats", dashboardController.getDashboardStats);
router.get("/report", dashboardController.getSummaryReport);

module.exports = router;
