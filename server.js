require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

const secretManager = new SecretManagerServiceClient();
const path = require("path");
const fs = require("fs");


const authMiddleware = require("./middleware/authenticateMiddleware");
const videoRoutes = require("./routes/videos");
const authRoutes = require("./userRoutes/authentication");
const progressTrackerRoutes = require("./routes/progressTracker");
const translationService = require("./routes/translationService");
const captionServices = require("./routes/captionService");
const scheduleRoutes = require("./routes/schedule-routes"); 

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection String
const mongoURI = process.env.MONGODB_URI || `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@${process.env.MONGODB_URL}/`;

// 🔹 Get Google Cloud credentials from Secret Manager
async function getGoogleCredentials() {
  try {
    const [version] = await secretManager.accessSecretVersion({
      name: `projects/capstone-449213/secrets/GOOGLE_APPLICATION_CREDENTIALS/versions/latest`,
    });
    return JSON.parse(version.payload.data.toString());
  } catch (error) {
    console.error("❌ Error retrieving credentials from Secret Manager:", error);
// Middleware
app.use(cors({ origin: "http://localhost:8081", credentials: true })); // Change in production
app.use(cookieParser());
app.use(express.json()); // Parse incoming JSON

// Check MongoDB Connection
if (!mongoURI) {
  console.error("Error: MONGODB_URI is missing in environment variables.");
  process.exit(1);
}

// MongoDB Connection
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
  }
)}

// 🔹 CORS Configuration (Allow Multiple Frontend Origins)
const allowedOrigins = ["http://localhost:3000", "http://localhost:8081"]; // Add more if needed

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: "GET, POST, PUT, DELETE, OPTIONS",
    allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  })
);

// 🔹 Global Middleware to Set CORS Headers (Fixes Preflight Issues)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
});

// CORS Middleware (Handles allowed origins)
app.use(cors({
  origin: (origin, callback) => {
    console.log("Incoming origin:", origin);
    if (!origin) return callback(null, true); // Allow server-to-server requests
    if (origin.includes("yourfrontend.com") || origin.includes("localhost")) {
      return callback(null, origin);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/videos", videoRoutes);
app.use("/progress", progressTrackerRoutes);
app.use("/api/translation", translationService);
app.use("/api/captions", captionServices);
app.use("/api/schedule", scheduleRoutes); 

// Health Check Route for Load Balancer
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

// Root Endpoint
app.get("/", (req, res) => res.send("Server is running!"));


app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: "This is a protected route.", user: req.user });
});

// 🔹 API Routes
app.use("/api/auth", authRoutes);
app.use("/videos", videoRoutes);
app.use("/progress", progressTrackerRoutes);
app.use("/api/translation", translationService);
app.use("/api/captions", captionServices);

// 🔹 Handle Undefined Routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

async function getGoogleCredentials() {
  try {
    const [version] = await secretManager.accessSecretVersion({
      name: `projects/capstone-449213/secrets/GOOGLE_APPLICATION_CREDENTIALS/versions/latest`,
    });

    return JSON.parse(version.payload.data.toString());
  } catch (error) {
    console.error("Error retrieving credentials from Secret Manager:", error);
    process.exit(1);
  }
}

getGoogleCredentials().then((credentials) => {
  process.env.GOOGLE_APPLICATION_CREDENTIALS_CONTENT = JSON.stringify(credentials);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
});

module.exports = app;
} 
