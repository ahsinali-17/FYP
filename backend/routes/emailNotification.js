const express = require("express");
const router = express.Router();
const { sendNotification } = require('../controllers/emailNotifController.js');

router.post('/notify', sendNotification);

module.exports = router;