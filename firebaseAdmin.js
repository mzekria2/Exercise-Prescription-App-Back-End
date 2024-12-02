const admin = require("firebase-admin");
const path = require("path");

// Prevent multiple initializations
if (!admin.apps.length) {
  const serviceAccount = require(path.resolve("/Users/mithila/Documents/Projects/2024/Exercise-Prescription-App-Back-End/firebaseServiceAccountKey.json")); // Adjust the path to your key

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("Firebase Admin initialized successfully");
} else {
  console.log("Firebase Admin already initialized");
}

module.exports = admin;
