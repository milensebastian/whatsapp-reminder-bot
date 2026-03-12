const multer = require("multer");
const express = require("express");
const userController = require("../controllers/userController");
const userImportController = require("../controllers/userImportController");
const { requireAuth, allowTeacherOrAdmin } = require("../middleware/authMiddleware");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);

router.get("/", allowTeacherOrAdmin, userController.getUsers);
router.get("/:phone", allowTeacherOrAdmin, userController.getUserByPhone);
router.post("/", allowTeacherOrAdmin, userImportController.createUser);
router.post("/upload", allowTeacherOrAdmin, upload.single("file"), userImportController.uploadUsers);

module.exports = router;

