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

// Load texts from the server (from texts.json in the root)
async function loadTexts() {
  try {
    const response = await fetch("/get-texts");
    textData = await response.json();
    updateText();
  } catch (error) {
    console.error("Error loading texts:", error);
    document.getElementById("text-display").textContent = "Error loading texts.";
  }
}

// Load recorded audio files from the server
async function loadAudioFiles() {
  try {
    const response = await fetch("/get-recordings");
    const audioFiles = await response.json();
    const audioList = document.getElementById("audio-list");
    audioList.innerHTML = "";
    audioFiles.forEach(file => {
      const container = document.createElement("div");
      const fileLabel = document.createElement("p");
      fileLabel.textContent = file;
      const audioElement = document.createElement("audio");
      audioElement.src = `/${file}`;
      audioElement.controls = true;
      container.appendChild(fileLabel);
      container.appendChild(audioElement);
      audioList.appendChild(container);
    });
  } catch (error) {
    console.error("Error loading recordings:", error);
  }
}

// Update the displayed text
function updateText() {
  if (textData.length > 0) {
    document.getElementById("text-display").textContent = textData[currentIndex].text;
  } else {
    document.getElementById("text-display").textContent = "No more text available.";
  }
}

// Automatically delete the current text from the server and update the list
async function deleteCurrentText() {
  if (textData.length === 0) return;
  const textId = textData[currentIndex].id;
  try {
    const response = await fetch("/delete-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textId })
    });
    if (response.ok) {
      textData.splice(currentIndex, 1);
      if (currentIndex >= textData.length) {
        currentIndex = 0; // Reset to the start if we've reached the end
      }
      updateText();
    } else {
      console.error("Failed to delete text.");
    }
  } catch (error) {
    console.error("Error deleting text:", error);
  }
}

// Handle recording functionality
document.getElementById("record-btn").addEventListener("click", async () => {
  if (!isRecording) {
    // Start recording
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
    // Stop recording
    mediaRecorder.stop();
    isRecording = false;
    document.getElementById("record-btn").textContent = "🎤 Start Recording";
  }
});

// Play recorded audio
document.getElementById("play-btn").addEventListener("click", () => {
  if (audioBlob) {
    const audioURL = URL.createObjectURL(audioBlob);
    const audioPlayer = document.getElementById("audio-player");
    audioPlayer.src = audioURL;
    audioPlayer.hidden = false;
    audioPlayer.play();
  }
});

// Save recorded audio and then automatically delete the current text
document.getElementById("save-btn").addEventListener("click", async () => {
  if (!audioBlob) return console.error("No recorded audio found!");
  const formData = new FormData();
  const fileName = `${textData[currentIndex].id}.wav`;
  formData.append("file", audioBlob, fileName);
  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData
    });
    if (response.ok) {
      // After uploading, delete the current text automatically
      await deleteCurrentText();
      await loadAudioFiles(); // Refresh the list of recordings
      // Reset audio-related UI
      audioBlob = null;
      document.getElementById("play-btn").disabled = true;
      document.getElementById("save-btn").disabled = true;
      document.getElementById("audio-player").hidden = true;
    } else {
      console.error("Failed to upload audio.");
    }
  } catch (error) {
    console.error("Error uploading file:", error);
  }
});
