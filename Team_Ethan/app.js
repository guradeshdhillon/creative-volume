const knob = document.getElementById('knob');
const fill = document.getElementById('fill');
const sliderArea = document.getElementById('slider-area');
const display = document.getElementById('volume-display');
const instruction = document.getElementById('instruction');

let currentVolume = 0;
let isDragging = false;
let lastX = 0;
let lastTime = 0;
let audioCtx = null;
let tensionOsc = null;
let tensionGain = null;
let isPanicking = false;

// The maximum pixels per millisecond allowed before snapping
const SPEED_LIMIT = 0.2; 

// Initialize Web Audio API on first interaction
function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create the low, rumbling "tension" sound
    tensionOsc = audioCtx.createOscillator();
    tensionOsc.type = 'sawtooth';
    tensionOsc.frequency.value = 40; 
    
    tensionGain = audioCtx.createGain();
    tensionGain.gain.value = 0;
    
    tensionOsc.connect(tensionGain);
    tensionGain.connect(audioCtx.destination);
    tensionOsc.start();
}

knob.addEventListener('mousedown', (e) => {
    if (isPanicking) return;
    isDragging = true;
    lastX = e.clientX;
    lastTime = performance.now();
    initAudio();
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging || isPanicking) return;
    
    const currentTime = performance.now();
    const dt = currentTime - lastTime;
    
    if (dt === 0) return;

    const dx = Math.abs(e.clientX - lastX);
    const speed = dx / dt; // pixels per millisecond

    // Update tension audio based on speed
    if (audioCtx && tensionGain) {
        // Map speed to volume of the rumble. Faster = louder.
        let volumeRumble = Math.min(speed / SPEED_LIMIT, 1);
        tensionGain.gain.setTargetAtTime(volumeRumble * 0.3, audioCtx.currentTime, 0.1);
        tensionOsc.frequency.setTargetAtTime(40 + (volumeRumble * 40), audioCtx.currentTime, 0.1);
    }

    // Did they move too fast?
    if (speed > SPEED_LIMIT) {
        triggerJumpScare();
        return;
    }

    // Normal dragging logic
    const sliderRect = sliderArea.getBoundingClientRect();
    let newLeft = e.clientX - sliderRect.left;
    const maxLeft = sliderArea.clientWidth - knob.clientWidth;
    
    if (newLeft < 0) newLeft = 0;
    if (newLeft > maxLeft) newLeft = maxLeft;
    
    currentVolume = Math.round((newLeft / maxLeft) * 100);
    
    knob.style.left = `${newLeft}px`;
    fill.style.width = `${(newLeft / maxLeft) * 100}%`;
    display.innerText = `${currentVolume}%`;
    
    lastX = e.clientX;
    lastTime = currentTime;
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    if (tensionGain && !isPanicking) {
        tensionGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
    }
});

function triggerJumpScare() {
    isDragging = false;
    isPanicking = true;
    
    // UI Punishment
    document.body.classList.add('panic');
    instruction.innerText = "YOU MOVED TOO FAST.";
    
    // Audio Punishment: Synthesize a horrific loud SNAP/SCREAM
    tensionGain.gain.setValueAtTime(0, audioCtx.currentTime);
    
    // 1. High pitched discordant oscillator
    const screamOsc = audioCtx.createOscillator();
    screamOsc.type = 'square';
    screamOsc.frequency.setValueAtTime(800, audioCtx.currentTime);
    screamOsc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.5);
    
    const screamGain = audioCtx.createGain();
    screamGain.gain.setValueAtTime(1, audioCtx.currentTime);
    screamGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    screamOsc.connect(screamGain);
    screamGain.connect(audioCtx.destination);
    screamOsc.start();
    screamOsc.stop(audioCtx.currentTime + 0.5);
    
    // 2. Burst of white noise
    const bufferSize = audioCtx.sampleRate * 0.5; // half a second of noise
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(2, audioCtx.currentTime); // LOUD
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    noise.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    noise.start();

    // Reset volume to 0
    setTimeout(() => {
        document.body.classList.remove('panic');
        currentVolume = 0;
        knob.style.left = `0px`;
        fill.style.width = `0%`;
        display.innerText = `0%`;
        instruction.innerText = "Drag slowly. Do not wake it up.";
        isPanicking = false;
    }, 600);
}