// schedule.js
const mongoose = require("mongoose");

// Schema for individual notifications
const NotificationSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, required: true }, // e.g., Monday=1, Tuesday=2
  times: [String],      // single time string, e.g. "10:00"
  messages: [String]   // single message
});

// Schema for user schedules
const ScheduleSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  expoPushTokens: [{ type: String, required: true }],
  notifications: [NotificationSchema],
});

module.exports = mongoose.model("Schedule", ScheduleSchema);
