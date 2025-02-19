let textData = [];
let mediaRecorder;
let audioChunks = [];
let audioBlob = null;
let isRecording = false;

document.addEventListener("DOMContentLoaded", async () => {
  await loadTexts();
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

// Update the displayed text (always show the first text)
function updateText() {
  if (textData.length > 0) {
    document.getElementById("text-display").textContent = textData[0].text;
  } else {
    document.getElementById("text-display").textContent = "No text available.";
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

// Save recorded audio (uploads the audio using the first text's id)
document.getElementById("save-btn").addEventListener("click", async () => {
  if (!audioBlob) return console.error("No recorded audio found!");
  const formData = new FormData();
  const fileName = `${textData[0].id}.wav`;
  formData.append("file", audioBlob, fileName);
  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData
    });
    if (response.ok) {
      // Reset audio-related UI after saving
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
