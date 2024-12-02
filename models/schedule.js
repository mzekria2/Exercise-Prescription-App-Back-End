const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  daysOfWeek: [{ type: String, required: true }], // Days of the week, e.g., ["Monday", "Wednesday"]
  time: { type: String, required: true }, // Time in HH:MM format
  message: { type: String, required: true }, // Notification message
});

const ScheduleSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  fcmTokens: [{ type: String, required: true }], // Array of tokens
  notifications: [
    {
      daysOfWeek: [{ type: String, required: true }],
      time: { type: String, required: true },
      message: { type: String, required: true },
    },
  ],
});


module.exports = mongoose.model('Schedule', ScheduleSchema);
