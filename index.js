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

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error: ', err));


// Allow requests from http://localhost:8081
app.use(cors({
  origin: 'http://localhost:8081'
}));

app.use('/videos', videoRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
