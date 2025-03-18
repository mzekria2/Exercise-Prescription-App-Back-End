require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

const authMiddleware = require("./middleware/authenticateMiddleware");
const videoRoutes = require("./routes/videos");
const authRoutes = require("./userRoutes/authentication");
const progressTrackerRoutes = require("./routes/progressTracker");
const translationService = require("./routes/translationService");
const captionServices = require("./routes/captionService");

const app = express();
const PORT = process.env.PORT || 3000;
const mongoURI = process.env.MONGODB_URI;

const secretManager = new SecretManagerServiceClient();

// 🔹 Get Google Cloud credentials from Secret Manager
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

// 🔹 Secure CORS Configuration (Allow Frontend Origin)
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// 🔹 Prevent Caching for Authentication Routes
const disableCache = (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
};

// 🔹 Retry MongoDB Connection if it Fails
const connectWithRetry = () => {
  mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => {
      console.error("❌ MongoDB Connection Error:", err.message);
      setTimeout(connectWithRetry, 5000); // Retry connection after 5s
    });
};
connectWithRetry();

// 🔹 Load Balancer Health Check Route
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
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

// 🔹 Start Server After Fetching Credentials
getGoogleCredentials().then((credentials) => {
  process.env.GOOGLE_APPLICATION_CREDENTIALS_CONTENT = JSON.stringify(credentials);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
});
