const express = require('express');
const router = express.Router();
const Video = require('../models/video_model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up Multer for video uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = 'uploads/';

      // Check if the folder exists
      if (!fs.existsSync(uploadPath)) {
        // If it doesn't exist, create it
        fs.mkdirSync(uploadPath, { recursive: true }); // 'recursive' ensures nested folders are created if needed
      }
  
      // Set the folder path
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });


router.get('/allVideos', async (req,res) => {
    try{
        //retrieving all videos
        const all_videos = await Video.find();
        console.log("in all videos")
        //sending back response
        res.status(200).json(all_videos);
    } catch(error){
        console.error("Error fetching videos:", error);
        res.status(500).json({ message: "Failed to fetch videos", error });
    }
});


// Endpoint to stream the video by ID
router.get('/video/:id', async (req, res) => {
  const videoId = req.params.id;

  const one_vid = await Video.findOne({_id: videoId});

  const videoPath = one_vid.path;
  // Check if the file exists
  if (!fs.existsSync(videoPath)) {
    return res.status(404).send('Video not found');
  } 
  // Stream the video
  const videoStream = fs.createReadStream(videoPath);
  res.setHeader('Content-Type', 'video/mp4'); // Set the video content type
  videoStream.pipe(res); // Pipe the video to the response
});

//Route for uploading videos
router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
  
    try {
      const video = new Video({
        title: req.body.title || 'Untitled Video',
        description: req.body.description || '',
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        format: req.file.mimetype.split('/')[1]
      });
  
      const savedVideo = await video.save();
      res.status(201).json({ message: 'Video uploaded successfully!', video: savedVideo });
    } catch (err) {
      res.status(500).json({ message: 'Error saving video', error: err });
    }
  });
  
  module.exports = router;