const express = require("express");
const { Storage } = require("@google-cloud/storage");
const speech = require("@google-cloud/speech");

const router = express.Router();

// Load Google Cloud credentials dynamically
const client = new speech.SpeechClient();
const storage = new Storage();

// Process audio from video and transcribe it
router.post("/generate-captions", async (req, res) => {
  try {
    const { audioUrl } = req.body;
    if (!audioUrl) return res.status(400).json({ error: "Audio URL is required." });

    console.log("Processing audio from:", audioUrl);

    // Set up Google Speech-to-Text request
    const audio = { uri: audioUrl };
    const config = {
      encoding: "MP3",
      sampleRateHertz: 16000,
      languageCode: "en-US",
    };

    const [response] = await client.recognize({ audio, config });
    const transcription = response.results.map((result) => result.alternatives[0].transcript).join("\n");

    console.log("Generated Captions:", transcription);
    res.json({ captions: transcription });
  } catch (error) {
    console.error("Error generating captions:", error);
    res.status(500).json({ error: "Failed to process audio." });
  }
});

module.exports = router;
