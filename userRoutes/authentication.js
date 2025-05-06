const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");
const authenticateMiddleware = require("../middleware/authenticateMiddleware");
const dotenv = require("dotenv");
dotenv.config();
const TOKEN_TIME = 3600;
const router = express.Router();

const nodemailer = require("nodemailer");

//using gmail as transporter
const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
  secure: false,
});

// Register for stuff
router.post("/register", async (req, res) => {
  const { index, emailCipher, password, plainEmail } = req.body;
  console.log(req.body);

  try {
    //check if user already registered
    if (await User.findOne({ index }))
      return res.status(400).json({ message: "Already exists" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    await new User({ index, emailCipher, password: hashedPassword }).save();

    // Send email
    const mailIt = {
      from: process.env.EMAIL,
      to: plainEmail,
      subject: "Success",
      text: `Hello,\n\nThank you for registering for HTC.\n\nRegards,\nThe HTC Team`,
    };

    mailer.sendMail(mailIt, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

//Login
router.post("/login", async (req, res) => {
  const { index, password } = req.body;

  try {
    //Seeing if user exists
    const user = await User.findOne({ index });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    //Checking the password stuff
    const passMatch = await bcrypt.compare(password, user.password);
    if (!passMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    console.log("User:", user);
    //JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Set the cookie with httpOnly, secure, and sameSite options
    res.cookie("token", token, {
      httpOnly: true, // Prevents JavaScript access
      secure: false, // change to true in production
      sameSite: "Lax", // Protects against CSRF
      maxAge: 60 * 60 * 1000, // 1 expiration
    });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/auth/profile
router.get("/profile", authenticateMiddleware, async (req, res) => {
  try {
    // Fetch user by ID, excluding password
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/auth/profile
router.put("/profile", authenticateMiddleware, async (req, res) => {
  const { index, emailCipher } = req.body;

  try {
    // Build an update object
    const updates = {};
    if (index && emailCipher) {
      updates.index = index;
      updates.emailCipher = {
        iv: emailCipher.iv,
        ct: emailCipher.ct,
        tag: emailCipher.tag,
      };
    }
    // Update user fields
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true, runValidators: true } // Return the updated user
    ).select("-password"); // Exclude the password

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { index, plainEmail } = req.body;
  try {
    const userFound = await User.findOne({ index });
    if (!userFound) {
      return res.status(404).json({ message: "User not found" });
    }
    const newToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(newToken, 10);
    userFound.newPasswordToken = hashedToken;
    userFound.newPasswordExpires = Date.now() + TOKEN_TIME * 1000;
    await userFound.save();

    const resetLink = `http://10.0.0.86:8081/reset-password/resetPassword?token=${newToken}&index=${index}`;

    const mailer = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailIt = {
      from: process.env.EMAIL,
      to: plainEmail,
      subject: "Password Reset Request",
      html: `<p>You requested a password reset. Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`,
    };
    await mailer.sendMail(mailIt);
    res.json({ message: "Password reset email sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { password } = req.body; // Extract the new password from the body
  const { token, index } = req.query; // Extract token and email from the query parameters

  try {
    const user = await User.findOne({ index });
    if (!user || !user.newPasswordToken || !user.newPasswordExpires) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Check if token has expired
    if (Date.now() > user.newPasswordExpires) {
      return res.status(400).json({ message: "Token has expired" });
    }

    const isTokenValid = await bcrypt.compare(token, user.newPasswordToken);
    if (!isTokenValid) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Clear reset token and expiration fields
    user.newPasswordToken = undefined;
    user.newPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
