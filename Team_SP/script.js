const mainAudio = document.getElementById("mainAudio");
const volumeDisplay = document.getElementById("volumeDisplay");
const healthDisplay = document.getElementById("healthDisplay");
const pointsDisplay = document.getElementById("pointsDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const memeTicker = document.getElementById("memeTicker");

const btnDamage = document.getElementById("btn-damage");
const btnPowerup = document.getElementById("btn-powerup");
const btnLevelup = document.getElementById("btn-levelup");

const songs = [
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
];

const memeLines = {
    damage: [
        "Skill issue: volume got nerfed.",
        "POV: boss fight, no headphones buff.",
        "Reddit says: just dont get hit, bro.",
        "Chat: L + ratio + take damage."
    ],
    point: [
        "Sigma grindset unlocked: +1 point.",
        "Main character arc: volume is healing.",
        "Insta reel energy: another tiny W.",
        "POV: found loot in a suspicious barrel."
    ],
    level: [
        "LEVEL UP: soundtrack swapped for maximum confusion.",
        "Patch notes: new stage, worse vibes.",
        "Speedrun strat: level first, ask questions later.",
        "POV: cutscene skipped, chaos retained."
    ]
};

const state = {
    volume: 0.5,
    health: 100,
    points: 0,
    level: 1,
    currentSongIndex: 0,
    unlockedAudio: false
};

function clampVolume(value) {
    return Math.min(1, Math.max(0, value));
}

function randomLine(type) {
    const lines = memeLines[type];
    return lines[Math.floor(Math.random() * lines.length)];
}

function updateHud() {
    const percent = Math.round(state.volume * 100);
    volumeDisplay.textContent = `${percent}%`;
    healthDisplay.textContent = String(state.health);
    pointsDisplay.textContent = String(state.points);
    levelDisplay.textContent = String(state.level);
    mainAudio.volume = clampVolume(state.volume);
}

function tickVisualFeedback() {
    document.body.classList.remove("flash");
    // Force reflow so the flash animation can replay on each action.
    void document.body.offsetWidth;
    document.body.classList.add("flash");
}

function tryPlayAudio() {
    if (state.unlockedAudio) {
        return;
    }
    state.unlockedAudio = true;
    mainAudio.play().catch(() => {
        memeTicker.textContent = "Tap again to allow audio playback in your browser.";
        state.unlockedAudio = false;
    });
}

function setSong(index) {
    state.currentSongIndex = (index + songs.length) % songs.length;
    mainAudio.src = songs[state.currentSongIndex];

    if (state.unlockedAudio) {
        mainAudio.play().catch(() => {
            memeTicker.textContent = "Browser blocked autoplay. Keep clicking buttons to begin music.";
            state.unlockedAudio = false;
        });
    }
}

function cycleSongForAction(type) {
    if (type === "damage") {
        setSong(state.currentSongIndex - 1);
        return;
    }

    if (type === "point") {
        setSong(state.currentSongIndex + 1);
        return;
    }

    setSong(state.currentSongIndex + 2);
}

btnDamage.addEventListener("click", () => {
    tryPlayAudio();
    state.health = Math.max(0, state.health - 20);
    state.volume = clampVolume(state.volume - 0.2);
    cycleSongForAction("damage");
    memeTicker.textContent = randomLine("damage");
    updateHud();
    tickVisualFeedback();
});

btnPowerup.addEventListener("click", () => {
    tryPlayAudio();
    state.points += 1;
    state.volume = clampVolume(state.volume + 0.2);
    cycleSongForAction("point");
    memeTicker.textContent = randomLine("point");
    updateHud();
    tickVisualFeedback();
});

btnLevelup.addEventListener("click", () => {
    tryPlayAudio();
    state.level += 1;
    cycleSongForAction("level");
    memeTicker.textContent = randomLine("level");
    updateHud();
    tickVisualFeedback();
});

setSong(0);
updateHud();
