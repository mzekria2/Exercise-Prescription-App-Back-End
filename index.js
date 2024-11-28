const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();
const videoRoutes = require('./routes/videos');


// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
const mongoURI = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@${process.env.MONGODB_URL}/`

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error: ', err));


// Allow requests from http://localhost:8081
app.use(cors({
  
  origin: 'http://localhost:8081'
  //origin: 'exp://172.30.15.219:8081'
 // origin: 'exp://10.21.28.107:8081'
}));

app.use('/videos', videoRoutes);

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
