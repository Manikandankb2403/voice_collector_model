const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Sample text data (You can replace it with a file read operation)
const textData = { text: "Read this sentence for voice collection." };

// Serve static files from "public"
app.use(express.static(path.join(__dirname, "public")));

// API to send text data
app.get("/api/get-text", (req, res) => {
    res.json(textData);
});

// Serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
