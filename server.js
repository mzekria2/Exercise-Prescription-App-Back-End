require("dotenv").config(); // Load environment variables first

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authMiddleware = require("./middleware/authenticateMiddleware");
const videoRoutes = require("./routes/videos");
const authRoutes = require("./userRoutes/authentication");
const progressTrackerRoutes = require("./routes/progressTracker");
const translationService = require("./routes/translationService");
const captionServices = require("./routes/captionService"); 
const app = express();
const PORT = process.env.PORT || 3000;
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error("Error: MONGODB_URI is missing in environment variables.");
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    console.log("Incoming origin:", origin);
    if (!origin) {
      // Allow requests with no origin (e.g. non-browser clients)
      return callback(null, true);
    }
    // If the origin includes "localhost" or "ngrok-free.app", allow it
    if (origin.includes("localhost") || origin.includes("ngrok-free.app")) {
      return callback(null, origin);
    }
    // Otherwise, block
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());

// MongoDB Connection
mongoose
  .connect(mongoURI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// Root Endpoint
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Protected Route Example
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "This is a protected route.",
    user: req.user,
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/videos", videoRoutes);
app.use("/progress", progressTrackerRoutes);
app.use("/api/translation", translationService);
app.use("/api/captions", captionServices); 

// Handle Undefined Routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
