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

 // Route for uploading videos
router.post('/upload', upload.single('file'), async (req, res) => {
    console.log('in backend ',req.file)
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