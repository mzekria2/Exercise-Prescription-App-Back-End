const express = require("express");
const router = express.Router();
const Video = require("../models/videoModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const OpenAI = require("openai");
const ffmpeg = require("fluent-ffmpeg");

// OpenAI API Setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Set up Multer for video uploads
const storage = multer.diskStorage({
  destination: "uploads/videos/",
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Limit file size to 50 MB
});

// Function to Convert Subtitles to `.vtt`
const convertToVTT = (text, outputPath) => {
  const vttContent = "WEBVTT\n\n" + text;
  fs.writeFileSync(outputPath, vttContent);
};

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
    // Transcribe Video using Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1",
      response_format: "text",
    });

    // Convert transcription to VTT format
    const subtitlePath = `uploads/subtitles/${savedVideo._id}.vtt`;
    convertToVTT(transcription.text, subtitlePath);

    // Update Video Model with Subtitle Path
    savedVideo.subtitles = subtitlePath;
    await savedVideo.save();

    res.status(201).json({
      message: "Video uploaded successfully with subtitles!",
      video: savedVideo,
    });
  } catch (err) {
    res.status(500).json({ message: "Error processing video", error: err.message });
  }
});

// Route for fetching a specific video by ID
router.get("/video/:id", async (req, res) => {
  console.log("Fetching) video");
  try {
    const videoId = req.params.id;
    console.log(`Fetching video with ID: ${videoId}`);
    const video = await Video.findById(videoId);

    if (!video) {
      console.error("Video not found:", videoId);
      return res.status(404).json({ message: "Video not found" });
    }

    res.json({
      videoPath: `http://localhost:3000/${video.path}`,
      subtitlePath: video.subtitles ? `http://localhost:3000/${video.subtitles}` : null,
    });
  } catch (error) {
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
  console.log("Deleting video");
  try {
    console.log("Deleting video");
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