const path = require("path");
const multer = require("multer");
const express = require("express");
const fileController = require("../controllers/fileController");
const { requireAuth, allowTeacherOrAdmin } = require("../middleware/authMiddleware");

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads", "files"));
  },
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, safeName);
  },
});
const upload = multer({ storage });

router.use(requireAuth, allowTeacherOrAdmin);

router.get("/", fileController.getFiles);
router.post("/", upload.single("file"), fileController.uploadFile);

module.exports = router;
