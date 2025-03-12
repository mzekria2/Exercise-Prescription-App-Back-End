const express = require("express");
const { Translate } = require("@google-cloud/translate").v2;
const router = express.Router();

// Initialize Google Translate API
const translate = new Translate({
  key: "AIzaSyBVNe1Zp9243BXZLe6Q0Kz6oVBKjfI1u84", // Replace with your actual API key
});

router.post("/translate", async (req, res) => {
  try {
    const { text, targetLang } = req.body;

    if (!text || !targetLang) {
      return res.status(400).json({ message: "text and targetLang are required" });
    }

    console.log(`🔵 Translating "${text}" to ${targetLang} using Google Cloud...`);

    const [translation] = await translate.translate(text, targetLang);

    console.log(`✅ Translated: ${translation}`);
    res.status(200).json({ translatedText: translation });

  } catch (err) {
    console.error("❌ Error in translation:", err.message);
    res.status(500).json({ message: "Error translating text", error: err.message });
  }
});

module.exports = router;
