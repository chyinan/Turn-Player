import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { getCurrent } from "@tauri-apps/api/window";

// Elements
const selectFileBtn = document.getElementById("select-file-btn");
const uploadContainer = document.getElementById("upload-container");
const playerWrapper = document.getElementById("player-wrapper");
const dropZone = document.getElementById("drop-zone");
const jacketArtImg = document.getElementById("jacket-art");
const albumJacket = document.getElementById("album-jacket");
const recordDiv = document.getElementById("record");
const tonearmDiv = document.getElementById("tonearm");
const audioPlayer = document.getElementById("audio-player");
const timeDisplay = document.getElementById("time-display");

// Settings Panel Elements
// const settingsBtn = document.getElementById("settings-btn"); // Removed
const settingsPanel = document.getElementById("settings-panel");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const bgColorPicker = document.getElementById("bg-color-picker");

// Label customization elements
const selectLabelBtn = document.getElementById("select-label-btn");
const labelInput = document.getElementById("label-input");
const labelPreview = document.getElementById("label-preview");
const labelPreviewImg = document.getElementById("label-preview-img");
const removeLabelBtn = document.getElementById("remove-label-btn");
const recordLabelImg = document.getElementById("record-label");

// --- Settings Panel Logic ---
/* settingsBtn removed
settingsBtn.addEventListener("click", () => {
  settingsPanel.classList.remove("hidden");
});
*/

if (closeSettingsBtn) {
  closeSettingsBtn.addEventListener("click", () => {
    settingsPanel.classList.add("hidden");
  });
}

if (bgColorPicker) {
  bgColorPicker.addEventListener("input", (e) => {
    const newColor = e.target.value;
    document.body.style.backgroundColor = newColor;
    localStorage.setItem("backgroundColor", newColor);
  });
}

// Function to load settings from local storage
function loadSettings() {
  const savedColor = localStorage.getItem("backgroundColor");
  if (savedColor) {
    document.body.style.backgroundColor = savedColor;
    if (bgColorPicker) bgColorPicker.value = savedColor;
  }
}

// Load settings when the app starts
document.addEventListener("DOMContentLoaded", loadSettings);

// Store selected label image
let selectedLabelImage = null;

// --- Upload interactions ---
if (selectFileBtn) {
  selectFileBtn.addEventListener("click", selectFile);
}

// Label customization interactions
if (selectLabelBtn) {
  selectLabelBtn.addEventListener("click", () => {
    labelInput.click();
  });
}

if (labelInput) {
  labelInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      handleLabelImage(file);
    }
  });
}

if (removeLabelBtn) {
  removeLabelBtn.addEventListener("click", () => {
    selectedLabelImage = null;
    labelPreview.classList.add("hidden");
    labelInput.value = "";
  });
}

function handleLabelImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    selectedLabelImage = e.target.result;
    labelPreviewImg.src = selectedLabelImage;
    labelPreview.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

// 使用 Tauri v2 原生文件拖放事件
const currentWindow = getCurrent();

currentWindow.onDragDropEvent((evt) => {
  console.log("DragDropEvent", evt);
  switch (evt.payload.type) {
    case "enter":
      dropZone.classList.add("drag-over");
      break;
    case "leave":
      dropZone.classList.remove("drag-over");
      break;
    case "drop":
      dropZone.classList.remove("drag-over");
      if (evt.payload.paths && evt.payload.paths.length > 0) {
        console.log("Dropped paths", evt.payload.paths);
        handleFile(evt.payload.paths[0]);
      }
      break;
  }
});

async function selectFile() {
  const selected = await openDialog({
    multiple: false,
    filters: [
      {
        name: "Audio",
        extensions: ["mp3", "flac", "wav", "m4a"],
      },
    ],
  });
  if (typeof selected === "string") {
    handleFile(selected);
  }
}

async function handleFile(filePath) {
  try {
    console.log("handleFile path", filePath);
    const metadata = await invoke("get_audio_metadata", { path: filePath });
    console.log("metadata", metadata);

    // Handle Album Art
    let currentArtSrc = null;
    if (metadata.album_art_base64) {
      currentArtSrc = `data:image/jpeg;base64,${metadata.album_art_base64}`;
      jacketArtImg.src = currentArtSrc;
      albumJacket.classList.remove("hidden");
    } else {
      jacketArtImg.src = "";
      albumJacket.classList.add("hidden");
    }

    const audioUrl = convertFileSrc(filePath);
    audioPlayer.src = audioUrl;

    // Handle Record Label (Custom Label > Album Art > Default)
    if (selectedLabelImage) {
      recordLabelImg.src = selectedLabelImage;
      recordLabelImg.style.display = "block";
      recordDiv.classList.add('custom-label-active');
    } else if (currentArtSrc) {
      recordLabelImg.src = currentArtSrc;
      recordLabelImg.style.display = "block";
      recordDiv.classList.add('custom-label-active');
    } else {
      recordLabelImg.style.display = "none";
      recordDiv.classList.remove('custom-label-active');
    }

    // Switch UI
    uploadContainer.classList.add("hidden");
    playerWrapper.classList.remove("hidden");
    console.log("UI switched to player");

    // Start playback with animation
    playMusic();
  } catch (e) {
    console.error(e);
  }
}

// Player page animations & Controls
const START_ANGLE = 0;   // Play Start: Horizontal (Outer edge)
const END_ANGLE = -30;   // Play End: Angled Down (Inner edge)
const REST_ANGLE = 0;   // Resting: Angled Up (Off record)

let playTimeout = null;

// --- Main Playback Logic ---

function playMusic() {
    if (playTimeout) clearTimeout(playTimeout);
    
    // Move arm to position
    recordDiv.style.animation = "spin 4s linear infinite";
    updateTonearmPosition();
    
    // Update button state immediately for feedback
    playerWrapper.classList.add('playing');
    
    // Delay actual audio start to simulate needle drop (0.8s matches CSS transition)
    playTimeout = setTimeout(() => {
        audioPlayer.play().catch(e => console.error("Playback failed", e));
    }, 800);
}

function pauseMusic() {
    if (playTimeout) clearTimeout(playTimeout);
    
    audioPlayer.pause();
    recordDiv.style.animationPlayState = "paused";
    tonearmDiv.style.transform = `rotate(${REST_ANGLE}deg)`;
    
    playerWrapper.classList.remove('playing');
}

function togglePlay() {
    if (audioPlayer.paused && !playerWrapper.classList.contains('playing')) {
        playMusic();
    } else {
        pauseMusic();
    }
}

// Update arm position based on track progress
function updateTonearmPosition() {
    const duration = audioPlayer.duration || 1;
    // If audio hasn't started yet (duration is NaN or 0), default to start
    const currentTime = audioPlayer.currentTime || 0;
    
    const progress = currentTime / duration;
    const currentAngle = START_ANGLE + (END_ANGLE - START_ANGLE) * progress;
    tonearmDiv.style.transform = `rotate(${currentAngle}deg)`;
}

// --- Helper Functions ---
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

function updateTimeDisplay() {
    const current = audioPlayer.currentTime || 0;
    const duration = audioPlayer.duration || 0;
    timeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
}

// --- Event Listeners ---

audioPlayer.addEventListener("ended", () => {
  recordDiv.style.animation = "none";
  tonearmDiv.style.transform = `rotate(${REST_ANGLE}deg)`;
  playerWrapper.classList.remove('playing');
  updateTimeDisplay();
});

audioPlayer.addEventListener("timeupdate", () => {
    // Always update time display
    updateTimeDisplay();
    
    // Only update tonearm if we consider it "playing" (arm is on record)
    if (!audioPlayer.paused) {
        updateTonearmPosition();
    }
});

audioPlayer.addEventListener("loadedmetadata", updateTimeDisplay);

// Keyboard controls
window.addEventListener('keydown', async (event) => {
    // console.log('Key pressed:', event.key); 
    switch (event.key.toLowerCase()) {
        case ' ':
            event.preventDefault();
            togglePlay();
            break;
        case 'r':
            audioPlayer.currentTime = 0;
            if (!audioPlayer.paused) updateTonearmPosition();
            break;
        case 'f':
            try {
                const isFullscreen = await currentWindow.isFullscreen();
                // console.log('Toggling fullscreen, current:', isFullscreen);
                await currentWindow.setFullscreen(!isFullscreen);
            } catch (err) {
                console.error('Failed to toggle fullscreen:', err);
            }
            break;
        case 'escape':
            try {
                // console.log('Exiting fullscreen');
                await currentWindow.setFullscreen(false);
            } catch (err) {
                console.error('Failed to exit fullscreen:', err);
            }
            break;
    }
});
