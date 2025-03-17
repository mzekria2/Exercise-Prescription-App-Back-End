const mongoose = require("mongoose");

// Store user progress and video access
const userVideoSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true,
  },
  videoId: {
    type: String,
    required: true,
    trim: true,
  },
  dateCompleted: {
    type: [Date],
    default: [], // List of completion dates
  },
});

module.exports = mongoose.model("UserVideo", userVideoSchema);
