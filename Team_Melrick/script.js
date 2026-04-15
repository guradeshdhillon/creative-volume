const audio = document.getElementById('mainAudio');
const volDisplay = document.getElementById('volLevel');

// THE MAGIC FUNCTION
function setSystemVolume(value) {
    let cleanValue = Math.max(0, Math.min(100, value)); // Keeps it 0-100
    audio.volume = cleanValue / 100;
    volDisplay.innerText = Math.round(cleanValue);
}

// Set initial volume to 50%
audio.volume = 0.5;
