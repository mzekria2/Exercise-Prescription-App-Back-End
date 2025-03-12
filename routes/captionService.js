const express = require("express");
const { Storage } = require("@google-cloud/storage");
const speech = require("@google-cloud/speech");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Load Google Cloud credentials
const client = new speech.SpeechClient({
  keyFilename: path.join(__dirname, "../config/capstone-449213-185033637ed0.json"),
});

const storage = new Storage({
  keyFilename: path.join(__dirname, "../config/capstone-449213-185033637ed0.json"),
});

// Process audio from video and transcribe it
router.post("/generate-captions", async (req, res) => {
  try {
    const { audioUrl } = req.body;

    if (!audioUrl) {
      return res.status(400).json({ error: "Audio URL is required." });
    }

    console.log("Processing audio from:", audioUrl);

    // Set up Google Speech-to-Text request
    const audio = { uri: audioUrl };
    const config = {
      encoding: "MP3",
      sampleRateHertz: 16000,
      languageCode: "en-US", // Change based on your default language
    };

    const [response] = await client.recognize({ audio, config });
    const transcription = response.results
      .map((result) => result.alternatives[0].transcript)
      .join("\n");

    console.log("Generated Captions:", transcription);

    res.json({ captions: transcription });
  } catch (error) {
    console.error("Error generating captions:", error);
    res.status(500).json({ error: "Failed to process audio." });
  }
});

module.exports = router;
