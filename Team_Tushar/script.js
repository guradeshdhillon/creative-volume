const audio = document.getElementById('audioTrack');
const memeAudio = document.getElementById('memeAudio');
const container = document.getElementById('dvd-container');
const logo = document.getElementById('dvd-logo');
const volDisplay = document.getElementById('vol-display');
const startScreen = document.getElementById('start-screen');
const missCounterDisplay = document.getElementById('miss-counter');

const adOverlay = document.getElementById('ad-overlay');
const adTitle = document.getElementById('ad-title');
const adGif = document.getElementById('ad-gif');
const skipAdBtn = document.getElementById('skip-ad-btn');

const tosModal = document.getElementById('tos-modal');
const acceptTosBtn = document.getElementById('accept-tos-btn');

let hasStarted = false;
let isAdPlaying = false;
let misses = 0;
let totalTimeouts = 0; // Tracks how many times they watched an ad
const MAX_MISSES = 5;

// The Meme Database (Replace audio links with local MP3s for better results)
const memes = [
    {
        title: "RICKROLLED",
        gif: "https://media.giphy.com/media/Ju7l5y9osyymQ/giphy.gif",
        sound: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" // Replace with "rickroll.mp3"
    },
    {
        title: "SIREN OF SHAME",
        gif: "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
        sound: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" // Loud alarm
    },
    {
        title: "YOU DIED",
        gif: "https://media.giphy.com/media/TbONGqAd4KI2W2n5cj/giphy.gif",
        sound: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" // Replace with Dark Souls sound
    }
];

audio.volume = 0.5;
memeAudio.volume = 1.0; 

startScreen.addEventListener('click', () => {
    startScreen.style.display = 'none';
    audio.play().catch(() => {});
    hasStarted = true;
});

let entities = [{ el: logo, x: 200, y: 150, dx: 4, dy: 4, isReal: true }];
const colors = ['#ff0055', '#00ffaa', '#00aaff', '#ffaa00', '#aa00ff'];
let colorIndex = 0;
const logoWidth = 80;
const logoHeight = 50;

function animate() {
    if (!hasStarted || isAdPlaying) { requestAnimationFrame(animate); return; }

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const time = Date.now();

    entities.forEach(ent => {
        let swingX = Math.sin(time / 300) * 5;
        let swingY = Math.cos(time / 200) * 5;

        if (Math.abs(ent.dx) > 4) ent.dx *= 0.98;
        if (Math.abs(ent.dy) > 4) ent.dy *= 0.98;

        ent.x += ent.dx + swingX;
        ent.y += ent.dy + swingY;

        if (ent.x + logoWidth >= containerWidth) { ent.x = containerWidth - logoWidth; ent.dx = -Math.abs(ent.dx); if(ent.isReal) changeColor(); }
        if (ent.x <= 0) { ent.x = 0; ent.dx = Math.abs(ent.dx); if(ent.isReal) changeColor(); }
        if (ent.y + logoHeight >= containerHeight) { ent.y = containerHeight - logoHeight; ent.dy = -Math.abs(ent.dy); if(ent.isReal) changeColor(); }
        if (ent.y <= 0) { ent.y = 0; ent.dy = Math.abs(ent.dy); if(ent.isReal) changeColor(); }

        ent.el.style.left = ent.x + 'px';
        ent.el.style.top = ent.y + 'px';
    });

    requestAnimationFrame(animate);
}

function changeColor() {
    colorIndex = (colorIndex + 1) % colors.length;
    const newColor = colors[colorIndex];
    entities.forEach(ent => {
        ent.el.style.backgroundColor = newColor;
        ent.el.style.boxShadow = `0 4px 15px ${newColor}80`; 
    });
}
animate();

// EVASIVE MANEUVERS
container.addEventListener('mousemove', (e) => {
    if (!hasStarted || isAdPlaying) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    entities.forEach(ent => {
        const centerX = ent.x + (logoWidth / 2);
        const centerY = ent.y + (logoHeight / 2);
        const dist = Math.hypot(mouseX - centerX, mouseY - centerY);

        if (dist < 120) {
            const angle = Math.atan2(centerY - mouseY, centerX - mouseX);
            ent.dx += Math.cos(angle) * 7;
            ent.dy += Math.sin(angle) * 7;
            ent.dx = Math.max(-25, Math.min(25, ent.dx));
            ent.dy = Math.max(-25, Math.min(25, ent.dy));
        }
    });
});

// SUCCESS CATCH
logo.addEventListener('mousedown', (e) => {
    if (isAdPlaying) return;
    e.stopPropagation(); 

    const containerWidth = container.clientWidth;
    const logoCenterX = entities[0].x + (logoWidth / 2); 
    
    let percentage = Math.round((logoCenterX / containerWidth) * 100);
    percentage = Math.max(0, Math.min(100, percentage));

    audio.volume = percentage / 100;
    volDisplay.textContent = `Volume: ${percentage}%`;
    
    entities[0].x = Math.random() * (containerWidth - logoWidth);
    entities[0].y = Math.random() * (container.clientHeight - logoHeight);
    
    clearFakes();
});

// MISS LOGIC
container.addEventListener('mousedown', (e) => {
    if (!hasStarted || isAdPlaying) return;

    misses++;
    missCounterDisplay.textContent = `Misses: ${misses} / ${MAX_MISSES}`;

    if (misses >= MAX_MISSES) {
        triggerPunishment();
    } else {
        spawnFake();
        showMissTaunt(e.clientX, e.clientY);
    }
});

function spawnFake() {
    const fakeEl = document.createElement('div');
    fakeEl.className = 'fake-logo';
    fakeEl.textContent = 'VOL';
    fakeEl.style.backgroundColor = colors[colorIndex];
    let startX = Math.random() * (container.clientWidth - logoWidth);
    let startY = Math.random() * (container.clientHeight - logoHeight);
    container.appendChild(fakeEl);
    entities.push({ el: fakeEl, x: startX, y: startY, dx: 5, dy: 5, isReal: false });
}

function showMissTaunt(clientX, clientY) {
    const missAlert = document.createElement('div');
    missAlert.className = 'miss-text';
    missAlert.textContent = 'MISSED! (+1 CLONE)';
    missAlert.style.left = (clientX - 60) + 'px';
    missAlert.style.top = (clientY - container.getBoundingClientRect().top - 20) + 'px';
    container.appendChild(missAlert);
    setTimeout(() => { missAlert.remove(); }, 800);
}

// THE TIMEOUT AD OR PRANK
function triggerPunishment() {
    isAdPlaying = true;
    totalTimeouts++;

    audio.pause();

    // The Ultimate Prank Trigger (Happens on 3rd timeout)
    if (totalTimeouts === 3) {
        tosModal.classList.remove('hidden');
        return;
    }

    // Otherwise, play a random meme ad
    const randomMeme = memes[Math.floor(Math.random() * memes.length)];
    adTitle.textContent = `⚠️ ${randomMeme.title} ⚠️`;
    adGif.src = randomMeme.gif;
    memeAudio.src = randomMeme.sound;

    adOverlay.classList.remove('hidden');
    skipAdBtn.classList.remove('active');
    skipAdBtn.disabled = true;
    memeAudio.play().catch(() => {});

    let timeLeft = 10;
    skipAdBtn.textContent = `Skip Ad in ${timeLeft}...`;

    const countdown = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            skipAdBtn.textContent = `Skip Ad in ${timeLeft}...`;
        } else {
            clearInterval(countdown);
            skipAdBtn.textContent = "Skip Ad";
            skipAdBtn.classList.add('active');
            skipAdBtn.disabled = false;
        }
    }, 1000);
}

// Skip Ad Logic
skipAdBtn.addEventListener('click', () => {
    isAdPlaying = false;
    misses = 0;
    missCounterDisplay.textContent = `Misses: 0 / ${MAX_MISSES}`;
    adOverlay.classList.add('hidden');
    clearFakes();
    
    memeAudio.pause();
    memeAudio.currentTime = 0;
    audio.play().catch(() => {});
});

// Accept Prank Logic
acceptTosBtn.addEventListener('click', () => {
    tosModal.classList.add('hidden');
    
    // Apply the cursed mode to flip the screen and invert colors
    document.body.classList.add('cursed-mode');
    
    // Resume game but with the prank active
    isAdPlaying = false;
    misses = 0;
    missCounterDisplay.textContent = `Misses: 0 / ∞`; 
    clearFakes();
    audio.play().catch(() => {});
    
    // Sneaky alert to rub it in
    setTimeout(() => alert("Easy Mode Enabled. Your mouse controls are now inverted. Have fun!"), 500);
});

function clearFakes() {
    entities.forEach(ent => { if (!ent.isReal) ent.el.remove(); });
    entities = [entities[0]];
}