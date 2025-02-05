const mongoose = require("mongoose");

// Save video metadata to MongoDB
const progressSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true,
    trim: true,
  },
  videoTitle: {
    type: String,
    required: true,
    trim: true,
  },
  dateCompleted: {
    type: [Date],
    default: [], // Automatically set to the current date
  },
});

module.exports = mongoose.model("Progress", progressSchema);
