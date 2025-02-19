const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Ensure "uploads" directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Define the path to texts.json in the root folder
const textFile = path.join(__dirname, "texts.json");

// API endpoint to serve texts from texts.json
app.get("/get-texts", (req, res) => {
  if (!fs.existsSync(textFile)) {
    return res.status(404).json({ error: "texts.json file not found" });
  }
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
  console.log("Received file upload:", req.file);
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({ message: "File uploaded successfully", filename: req.file.filename });
});

// (Optional) Endpoint to retrieve recorded audio files
app.get("/get-recordings", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Error reading files" });
    }
    res.json(files);
  });
});

// Catch-all: Serve index.html for any unknown route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
