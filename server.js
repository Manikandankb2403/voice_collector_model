const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Ensure "uploads" directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Ensure "texts.json" file exists
const textFile = path.join(__dirname, "texts.json");
if (!fs.existsSync(textFile)) {
    fs.writeFileSync(textFile, JSON.stringify([]));
}

// ✅ Serve texts.json via an API endpoint
app.get("/get-texts", (req, res) => {
    try {
        const texts = JSON.parse(fs.readFileSync(textFile, "utf-8"));
        res.json(texts);
    } catch (error) {
        res.status(500).json({ error: "Failed to load texts" });
    }
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});
const upload = multer({ storage });

// Endpoint to upload recorded audio
app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    res.json({ message: "File uploaded successfully", filename: req.file.filename });
});

// Endpoint to retrieve recorded audio files
app.get("/get-recordings", (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Error reading files" });
        }
        res.json(files);
    });
});

// Endpoint to delete text from texts.json
app.post("/delete-text", (req, res) => {
    const { textId } = req.body;

    let texts = JSON.parse(fs.readFileSync(textFile, "utf-8"));
    texts = texts.filter(text => text.id !== textId);

    fs.writeFileSync(textFile, JSON.stringify(texts, null, 2));
    res.json({ message: "Text deleted successfully" });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
