// const express = require('express');
// const multer = require('multer');
// const mongoose = require('mongoose');
// const path = require('path');
// const fs = require('fs');
// require('dotenv').config();
// const cors = require('cors');

// const videoRoutes = require('./routes/videos');

// // Initialize express app
// const app = express();
// const PORT = process.env.PORT || 3000;
// app.use(cors());
// // MongoDB connection
// const mongoURI = process.env.MONGODB_URI;

// mongoose.connect(mongoURI)
//   .then(() => console.log('MongoDB connected'))
//   .catch((err) => console.log('MongoDB connection error:', err.message));

// app.use('/videos', videoRoutes);

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });
