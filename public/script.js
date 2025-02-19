let currentIndex = 0;
let textData = [];
let mediaRecorder;
let audioChunks = [];
let audioBlob = null;
let isRecording = false;

document.addEventListener("DOMContentLoaded", async () => {
    await loadTexts();
    await loadAudioFiles();
    updateText();
});

async function loadTexts() {
    try {
        const response = await fetch("http://localhost:5000/get-texts"); // ✅ Fetch from server
        textData = await response.json();
        updateText();
    } catch (error) {
        console.error("Error loading texts:", error);
    }
}

async function loadAudioFiles() {
    try {
        const response = await fetch("http://localhost:5000/get-recordings");
        const audioFiles = await response.json();

        const audioList = document.getElementById("audio-list");
        audioList.innerHTML = "";
        audioFiles.forEach(file => {
            const audioElement = document.createElement("audio");
            audioElement.src = `http://localhost:5000/${file}`;
            audioElement.controls = true;

            const fileLabel = document.createElement("p");
            fileLabel.textContent = file;

            const container = document.createElement("div");
            container.appendChild(fileLabel);
            container.appendChild(audioElement);
            audioList.appendChild(container);
        });
    } catch (error) {
        console.error("Error loading recordings:", error);
    }
}

function updateText() {
    document.getElementById("text-display").textContent = textData[currentIndex]?.text || "No more text.";
}

// Handle recording button click
document.getElementById("record-btn").addEventListener("click", async () => {
    if (!isRecording) {
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
        isRecording = true;
        document.getElementById("record-btn").textContent = "⏹️ Stop Recording";
    } else {
        mediaRecorder.stop();
        isRecording = false;
        document.getElementById("record-btn").textContent = "🎤 Start Recording";
    }
});

// Play recorded audio before saving
document.getElementById("play-btn").addEventListener("click", () => {
    if (audioBlob) {
        const audioURL = URL.createObjectURL(audioBlob);
        document.getElementById("audio-player").src = audioURL;
        document.getElementById("audio-player").hidden = false;
        document.getElementById("audio-player").play();
    }
});

// Save audio and delete text
document.getElementById("save-btn").addEventListener("click", async () => {
    if (!audioBlob) return console.error("No recorded audio found!");

    const formData = new FormData();
    const fileName = `${textData[currentIndex].id}.wav`;
    formData.append("file", audioBlob, fileName);

    try {
        const response = await fetch("http://localhost:5000/upload", {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            await fetch("http://localhost:5000/delete-text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ textId: textData[currentIndex].id }),
            });

            textData.splice(currentIndex, 1);
            updateText();
            await loadAudioFiles();
        } else {
            console.error("Upload failed.");
        }
    } catch (error) {
        console.error("Error uploading file:", error);
    }
});

// Move to next text
document.getElementById("next-btn").addEventListener("click", () => {
    if (currentIndex < textData.length - 1) {
        currentIndex++;
        updateText();
    }
});

// Move to previous text
document.getElementById("prev-btn").addEventListener("click", () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateText();
    }
});
