const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config();
const videoRoutes = require('./routes/videos');


const scheduleRoutes = require('./routes/schedule-routes'); // Schedule routes
// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/schedule', scheduleRoutes);

// MongoDB connection
const mongoURI = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@${process.env.MONGODB_URL}/`

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error: ', err));




app.use('/videos', videoRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
