const express = require("express");
const router = express.Router();
const upload = require("../middlewares/uploadMiddleware");
const { analyzeInspection, deleteBulkHistory } = require("../controllers/inspectionController");

router.post("/analyze", upload.single("file"), analyzeInspection);
router.delete("/history/delete", deleteBulkHistory);

module.exports = router;