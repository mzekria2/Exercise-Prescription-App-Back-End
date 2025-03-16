require("dotenv").config(); // Load environment variables first

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

// Secret Manager Client
const secretManager = new SecretManagerServiceClient();

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

// Function to Fetch Google Cloud Credentials from Secret Manager
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

// ✅ Trust Proxy for Load Balancer to get real client IP
app.set("trust proxy", true);

// ✅ Force HTTPS (Redirect non-HTTPS traffic to HTTPS)
app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] !== "https" && process.env.NODE_ENV === "production") {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// ✅ CORS Middleware
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

app.use(express.json());

// ✅ MongoDB Connection
mongoose.connect(mongoURI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// ✅ Load Balancer Health Check Route
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

// ✅ Root Endpoint
app.get("/", (req, res) => res.send("Server is running!"));

// ✅ Protected Route Example
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: "This is a protected route.", user: req.user });
});

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/videos", videoRoutes);
app.use("/progress", progressTrackerRoutes);
app.use("/api/translation", translationService);
app.use("/api/captions", captionServices);

// ✅ Handle Undefined Routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ✅ Start Server After Fetching Credentials
getGoogleCredentials().then((credentials) => {
  process.env.GOOGLE_APPLICATION_CREDENTIALS_CONTENT = JSON.stringify(credentials);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
});
