const mongoose = require('mongoose');

  // Save video metadata to MongoDB
  const videoSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    filename: {
      type: String,
      required: true // The name of the uploaded video file
    },
    path: {
      type: String,
      required: true // File storage path
    },
    size: {
      type: Number, // File size in bytes
      required: true
    },
    format: {
      type: String, // Format of the video (e.g., mp4, mkv)
    },
    uploadedAt: {
      type: Date,
      default: Date.now // Automatically set to the current date
    },
    tags: {
      type: [String], // Array of tags for categorizing videos
      default: [] 
    },
  });

module.exports = mongoose.model('Video',videoSchema);