const express = require("express");
const router = express.Router();
const Video = require("../models/video_model");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Set up Multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Limit file size to 50 MB
});

// Route for uploading videos
router.post("/upload", upload.single("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  try {
    const video = new Video({
      title: req.body.title || "Untitled Video",
      description: req.body.description || "",
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      format: req.file.mimetype.split("/")[1],
    });

    const savedVideo = await video.save();
    res.status(201).json({
      message: "Video uploaded successfully!",
      video: savedVideo,
    });
  } catch (err) {
    res.status(500).json({ message: "Error saving video", error: err.message });
  }
});

// Route for fetching a specific video by ID
router.get("/video/:id", async (req, res) => {
  try {
    const videoId = req.params.id;
    console.log(`Fetching video with ID: ${videoId}`);
    const video = await Video.findById(videoId);

    if (!video) {
      console.error("Video not found:", videoId);
      return res.status(404).json({ message: "Video not found" });
    }

    const videoPath = path.resolve(video.path);
    console.log(`Video path resolved to: ${videoPath}`);

    if (!fs.existsSync(videoPath)) {
      console.error("Video file not found on server:", videoPath);
      return res
        .status(404)
        .json({ message: "Video file not found on server" });
    }

    res.sendFile(videoPath); // Serve the video file
  } catch (error) {
    console.error("Error fetching video:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// New route for fetching all video metadata
router.get("/allVideos", async (req, res) => {
  try {
    const videos = await Video.find(); // Fetch all video documents from the database
    res.status(200).json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const videoId = req.params.id;
    const video = await Video.findByIdAndDelete(videoId);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Delete the video file from the server
    const videoPath = path.resolve(video.path);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
