// This code runs only on the client-side (browser)
document.addEventListener("DOMContentLoaded", async () => {
    // Fetch and update the text for voice recording
    await loadTexts();
    updateText();
});

let currentIndex = 0;
let textData = [];
let mediaRecorder;
let audioChunks = [];
let audioBlob = null;

async function loadTexts() {
    try {
        const response = await fetch("texts.json");
        textData = await response.json();
    } catch (error) {
        console.error("Error loading texts:", error);
    }
}

function updateText() {
    const textDisplay = document.getElementById("text-display");
    textDisplay.textContent = textData[currentIndex]?.text || "No more text.";
}

document.getElementById("start-btn").addEventListener("click", async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
    mediaRecorder.onstop = () => {
        audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        document.getElementById("play-btn").disabled = false;
        document.getElementById("save-btn").disabled = false;
    };

    mediaRecorder.start();
    document.getElementById("start-btn").textContent = "⏹️ Stop Recording";
    document.getElementById("start-btn").disabled = false;
});

document.getElementById("play-btn").addEventListener("click", () => {
    if (audioBlob) {
        const audioURL = URL.createObjectURL(audioBlob);
        document.getElementById("audio-player").src = audioURL;
        document.getElementById("audio-player").hidden = false;
        document.getElementById("audio-player").play();
    }
});

document.getElementById("save-btn").addEventListener("click", async () => {
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append("file", audioBlob, `${textData[currentIndex].id}.wav`);

    // Upload audio file to the server
    await fetch("/upload", {
        method: "POST",
        body: formData,
    });

    // Remove the text after saving the audio
    textData.splice(currentIndex, 1);
    updateText();

    document.getElementById("play-btn").disabled = true;
    document.getElementById("save-btn").disabled = true;
    document.getElementById("audio-player").hidden = true;
});

document.getElementById("next-btn").addEventListener("click", () => {
    if (currentIndex < textData.length - 1) {
        currentIndex++;
        updateText();
    }
});

document.getElementById("prev-btn").addEventListener("click", () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateText();
    }
});
