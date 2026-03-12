const express = require("express");
const emergencyAlertController = require("../controllers/emergencyAlertController");
const { requireAuth, allowAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, allowAdmin);

router.get("/", emergencyAlertController.getEmergencyAlerts);
router.post("/", emergencyAlertController.createEmergencyAlert);

module.exports = router;
