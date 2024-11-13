const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authMiddleware = require('./middleware/authenticateMiddleware');

dotenv.config();

const app = express();

//parse JSON
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({
    message: 'This is a protected route.',
    user: req.user, // This will contain the user information from the token
  });
});



// Import routes
const authRoutes = require('./userRoutes/authentication');

// Use routes
app.use('/api/auth', authRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start the server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  })
  .catch((err) => console.error('Could not connect to MongoDB:', err));
