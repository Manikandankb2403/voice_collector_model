const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ensure "texts.json" file exists in the root folder
const textFile = path.join(__dirname, "texts.json");
if (!fs.existsSync(textFile)) {
    fs.writeFileSync(textFile, JSON.stringify([]));
}

// Serve texts.json via an API endpoint
app.get("/get-texts", (req, res) => {
    try {
        const texts = JSON.parse(fs.readFileSync(textFile, "utf-8"));
        res.json(texts);
    } catch (error) {
        res.status(500).json({ error: "Failed to load texts" });
    }
});

// Serve audio files from GitHub (no need to store them locally, just serve GitHub URLs)
app.get("/get-recordings", (req, res) => {
    res.json([
        // Provide URLs of audio files stored on GitHub
        {
            name: "audio1.wav",
            url: "https://raw.githubusercontent.com/username/repository/branch/audio/audio1.wav"
        },
        {
            name: "audio2.wav",
            url: "https://raw.githubusercontent.com/username/repository/branch/audio/audio2.wav"
        }
    ]);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
