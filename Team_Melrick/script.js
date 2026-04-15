const audio = document.getElementById('mainAudio');
const knob = document.getElementById('knob');
const statusText = document.getElementById('status');

let currentPos = 0; // Position in pixels
const maxPos = 250; // Height of the track
const gravity = 1.2; // Speed of the fall

// 1. THE "FUNCTIONAL" CORE: This changes the actual audio
function setSystemVolume(percent) {
    let volume = percent / 100;
    audio.volume = Math.max(0, Math.min(1, volume)); 
    statusText.innerText = "Volume: " + Math.round(percent) + "%";
}

// 2. GRAVITY ENGINE: Constantly pulling volume down
setInterval(() => {
    if (currentPos > 0) {
        currentPos -= gravity;
        updateUI();
    }
}, 20);

// 3. INTERACTION: Dragging the knob
knob.onmousedown = function(e) {
    document.onmousemove = function(e) {
        let trackRect = document.getElementById('track').getBoundingClientRect();
        let y = trackRect.bottom - e.clientY;
        currentPos = Math.max(0, Math.min(maxPos, y));
        updateUI();
    };
    document.onmouseup = function() {
        document.onmousemove = null;
    };
};

function updateUI() {
    knob.style.bottom = currentPos + "px";
    let percent = (currentPos / maxPos) * 100;
    setSystemVolume(percent);
}