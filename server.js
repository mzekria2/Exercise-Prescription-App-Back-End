const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authMiddleware = require('./middleware/authenticateMiddleware');
const videoRoutes = require('./routes/videos');
const authRoutes = require('./userRoutes/authentication');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const mongoURI = process.env.MONGODB_URI;

// Middleware
app.use(cors({ origin: '*' })); // Allow all origins
app.use(express.json()); // Parse incoming JSON

// MongoDB connection
if (!mongoURI) {
  console.error('Error: MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });

// Root endpoint
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Protected route example
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({
    message: 'This is a protected route.',
    user: req.user, // This will contain the user information from the token
  });
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/videos', videoRoutes);

// Fallback route for undefined endpoints
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  console.log(`Ensure you are using the ngrok URL for external access.`);
});
