const express = require("express");
const router = express.Router();
const { createBatch } = require("../controllers/batchController");

router.post("/create", createBatch);

module.exports = router;
