const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  fcmToken: { type: String, required: true },
  notifications: [
    {
      time: { type: Date, required: true },
      message: { type: String, default: 'Time for your hand therapy exercise!' },
    },
  ],
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
