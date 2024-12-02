const admin = require("../firebaseAdmin");
const express = require('express');
const { getSchedules, createSchedule, deleteSchedule } = require('../controllers/scheduleController');

const router = express.Router();

router.get('/:userId', getSchedules);
router.post('/', createSchedule);
router.delete('/:userId', deleteSchedule);

// test route
router.post("/test-notification", async (req, res) => {
    const { fcmToken, message } = req.body;
  
    if (!fcmToken || !message) {
      return res.status(400).json({ error: "fcmToken and message are required." });
    }
  
    try {
      const response = await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: "Test Notification",
          body: message,
        },
      });
  
      console.log("Test notification sent:", response);
      res.status(200).json({ message: "Test notification sent successfully.", response });
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ error: "Failed to send test notification.", details: error.message });
    }
  });

module.exports = router;
