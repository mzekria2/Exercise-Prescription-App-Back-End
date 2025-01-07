const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticateMiddleware = require('../middleware/authenticateMiddleware')

const router = express.Router();

const nodemailer = require('nodemailer');

//using gmail as transporter
const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,       
    pass: process.env.EMAIL_PASS
  },
  secure: false,
});

// Register for stuff
router.post('/register', async (req, res) => {
  const { email, password, name} = req.body;

  try {
    //check if user already registered
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({ email, password: hashedPassword, name });
    await user.save();

     // Send email
     const mailIt = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Success',
      text: `Hello ${name},\n\nThank you for registering for HTC.\n\nRegards,\nThe HTC Team`,
    };

    console.log('EMAIL:', process.env.EMAIL);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS);

    mailer.sendMail(mailIt, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

//Login 
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    //Seeing if user exists
    const user = await User.findOne({ email }); 
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    //Checking the password stuff
    const passMatch = await bcrypt.compare(password, user.password);
    if (!passMatch) return res.status(400).json({ message: 'Invalid credentials' });

    //JWT token
    const token = jwt.sign({ userId: user._id, email: user.email}, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/profile
router.get('/profile', authenticateMiddleware, async (req, res) => {
  try {
    // Fetch user by ID, excluding password
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateMiddleware, async (req, res) => {
  const { email, name } = req.body;

  try {
    // Update user fields
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { email, name },
      { new: true, runValidators: true } // Return the updated user
    ).select('-password'); // Exclude the password

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
