const express = require("express");
const router = express.Router();
// const ProgressModel = require("../models/ProgressTrackerModel"); // Adjust path as needed
const authMiddleware = require("../middleware/authenticateMiddleware");
const userVidModel = require("../models/userVideo");
//route to mark a video as completed
router.post("/markCompletedVideo", authMiddleware, async (req, res) => {
  try {
    const { videoId, videoTitle } = req.body; // Get video details from request

    if (!videoId || !videoTitle) {
      return res
        .status(400)
        .json({ message: "videoId and videoTitle are required" });
    }
    const userId = req.user.userId;
    // Find existing progress record for this video
    let progressInfo = await userVidModel.findOne({ userId, videoId });

    if (!progressInfo) {
      // If no progress exists for this video, create a new entry
      progressInfo = new userVidModel({
        userId,
        videoId,
        videoTitle,
        dateCompleted: [new Date()], // Start with the current date
      });

      await progressInfo.save();
    } else {
      // If progress exists, add a new completion date
      progressInfo.dateCompleted.push(new Date());
      await progressInfo.save();
    }

    res
      .status(200)
      .json({ message: "Video marked as completed", progress: progressInfo });
  } catch (err) {
    res.status(500).json({ message: "Error saving video", error: err.message });
  }
});

//route to get progress data
router.get("/progressData", authMiddleware, async (req, res) => {
  try {
    // Find existing progress record for this video
    let progressInfo = await userVidModel.find({
      userId: req.user.userId,
    });

    res.status(200).json(progressInfo);
  } catch (err) {
    res.status(500).json({ message: "Error saving video", error: err.message });
  }
});

//Delete a video from progress tracker
router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    const videoIdParam = req.params.id;
    console.log(`Deleting progress video with ID: ${videoIdParam}`);

    // Find the video by ID
    const video = await userVidModel.findOne({ videoId: videoIdParam });
    console.log("Video found:", video);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Check if the logged-in user owns the video
    if (video.userId.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this video" });
    }
    console.log("Video finally delete");
    // Delete the video from the database
    await userVidModel.findByIdAndDelete(video._id);

    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
