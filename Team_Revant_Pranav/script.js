const initOverlay = document.getElementById('init-overlay');
const initBtn = document.getElementById('init-btn');
const bgAudio = document.getElementById('bg-audio');

const track = document.getElementById('slider-track');
const thumb = document.getElementById('slider-thumb');
const volValue = document.getElementById('vol-value');
const statusText = document.getElementById('status-text');
const wrapper = document.getElementById('reactor-wrapper');
const lockGrid = document.getElementById('lock-grid');
const alertBox = document.getElementById('alert-box');
const reactorPanel = document.getElementById('reactor-panel');
const face = document.querySelector('.face');

const humiliationModal = document.getElementById('humiliation-modal');
const tauntImg = document.getElementById('taunt-img');
const tauntText = document.getElementById('taunt-text');

let isDragging = false;
let currentVolume = 0;
let isLocked = false;
let trackRect;
let isPanelHovered = false;

// LEVEL DEVIL ADMIN
let isAdminMode = false;
let secretCode = "";

document.addEventListener('keydown', (e) => {
    secretCode += e.key.toLowerCase();
    if (secretCode.length > 5) secretCode = secretCode.slice(-5);
    
    if (secretCode === "admin" && !isAdminMode) {
        isAdminMode = true;
        currentVolume = 50; 
        isLocked = false; 
        
        wrapper.style.transform = `translate(-50%, -50%)`;
        statusText.innerText = "DEVIL DEFEATED (ADMIN)";
        statusText.style.color = "#00ff00";
        face.innerText = "^_^";
        
        renderVolume();
        showAlert("GOD MODE");
        
        buttons.forEach(btn => {
            btn.innerText = "SAFE TILE";
            btn.style.color = "#00ff00";
        });
    }
});

// --- HUMILIATION ARSENAL (POP OUT LIST NO REPEATS) ---
let humiliations = [
    { img: "https://media.tenor.com/7A2I51_R-5IAAAAC/emotional-damage.gif", text: "BLOODLINE DISAPPOINTED!" },
    { img: "https://media.giphy.com/media/x0npYExCGOZeo/giphy.gif", text: "CLOWN ACTIVITY 🤡" },
    { img: "https://media.giphy.com/media/mcH0upG1TeEak/giphy.gif", text: "HOW ARE YOU THIS BAD?" },
    { img: "https://media.giphy.com/media/l4pSWeeS3QW01xLMc/giphy.gif", text: "ABSOLUTE TRASH!" },
    { img: "https://media.giphy.com/media/3o85xnoIXebk3xYx4Q/giphy.gif", text: "WHAT AN IDIOT SANDWICH!" },
    { img: "https://media.tenor.com/FwG24wLCHf8AAAAC/teasing-spongebob.gif", text: "PATHETIC SKILL ISSUE!" },
    { img: "https://media.giphy.com/media/VdWnBa31M6BeY1Iv11/giphy.gif", text: "IM UNINSTALLING..." },
    { img: "https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif", text: "CRY ABOUT IT" }
];

let lastHumiliationTime = 0;

function triggerHumiliation() {
    if (isAdminMode) return; 
    if (Date.now() - lastHumiliationTime < 5000) return;
    
    // If array is empty, we don't humiliate, or we just say "IM OUT OF MEMES"
    if (humiliations.length === 0) {
        tauntImg.src = "https://media.giphy.com/media/3o7aTskHEUjdyaEQQO/giphy.gif";
        tauntText.innerText = "I'M RUNNING OUT OF INSULTS FOR YOU.";
    } else {
        // Pick random insult and SPLICE it out so it never repeats in this session
        const randIndex = Math.floor(Math.random() * humiliations.length);
        const h = humiliations.splice(randIndex, 1)[0];
        
        tauntImg.src = h.img;
        tauntText.innerText = h.text;
    }

    lastHumiliationTime = Date.now();
    humiliationModal.classList.add('active');
    setTimeout(() => {
        humiliationModal.classList.remove('active');
    }, 2500);
}

function showAlert(msg) {
    alertBox.innerText = msg;
    alertBox.classList.remove('show');
    void alertBox.offsetWidth; 
    alertBox.classList.add('show');
}

// --- INITIALIZATION ---
initBtn.addEventListener('click', () => {
    bgAudio.volume = 0;
    bgAudio.play().catch(e => console.log(e));
    initOverlay.style.display = 'none';
    spawnButtons();
    startHostileMovement();
});

function renderVolume() {
    if (currentVolume < 0) currentVolume = 0;
    if (currentVolume > 100) currentVolume = 100;
    
    thumb.style.bottom = `${currentVolume}%`;
    volValue.innerText = Math.floor(currentVolume);

    if (bgAudio) {
        bgAudio.volume = currentVolume / 100;
    }
}

// --- DRAG MECHANICS (SPIKES) ---
thumb.addEventListener('mousedown', (e) => {
    if (isLocked) return;
    isDragging = true;
    face.innerText = "O_O";
    trackRect = track.getBoundingClientRect();
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        let trackCenterX = trackRect.left + (trackRect.width / 2);
        
        if (!isAdminMode) {
            // Level devil: Track is extremely narrow, touching the sides hits SPIKES
            if (Math.abs(e.clientX - trackCenterX) > 10) {
                isDragging = false;
                face.innerText = "X_X";
                currentVolume = 0; // Spike hits you, fall to bottom
                if (currentVolume > 20) {
                    triggerHumiliation();
                }
                showAlert("IMPALED!");
                return;
            }
        }

        let yPos = e.clientY - trackRect.top;
        let percentage = 100 - ((yPos / trackRect.height) * 100);
        
        currentVolume = percentage;
        renderVolume();
    }
});

document.addEventListener('mouseup', () => {
    if (isDragging) face.innerText = "-_-";
    isDragging = false;
});

// --- PHYSICS ENGINE ---
function applyPhysics() {
    if (!isLocked && !isDragging) {
        let gravity = Math.pow((currentVolume / 25), 2) * 0.8 + 0.5;
        currentVolume -= gravity;
        renderVolume();
    }
    if (!isLocked && isDragging) {
        currentVolume -= 0.2;
        renderVolume();
    }
    
    requestAnimationFrame(applyPhysics);
}
applyPhysics();

// --- HOSTILE MOVEMENT ---
let time = 0;
reactorPanel.addEventListener('mouseenter', () => isPanelHovered = true);
reactorPanel.addEventListener('mouseleave', () => isPanelHovered = false);

function startHostileMovement() {
    setInterval(() => {
        if (!isLocked && !isAdminMode && isPanelHovered) {
            time += 0.1;
            // Spastic Level Devil movements
            let offsetX = Math.sin(time * 2) * 200 * Math.sin(time);
            let offsetY = Math.cos(time * 3) * 100;
            wrapper.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
            trackRect = track.getBoundingClientRect();
        }
    }, 16);
}

// --- TRAP TILES ---
let buttons = [];
let correctIndex = Math.floor(Math.random() * 9);

function spawnButtons() {
    lockGrid.innerHTML = '';
    buttons = [];
    for (let i = 0; i < 9; i++) {
        let btn = document.createElement('div');
        btn.className = 'lock-btn';
        btn.innerText = 'TILE';
        
        btn.addEventListener('mouseenter', () => {
            if (!isAdminMode && !isLocked && i !== correctIndex) {
               if (!humiliationModal.classList.contains('active')) {
                   triggerHumiliation();
                   btn.classList.add('trap-kill');
                   btn.innerText = "TRAP";
               }
            }

            if (!isLocked && !isAdminMode && Math.random() > 0.3) {
                correctIndex = Math.floor(Math.random() * 9);
                shuffleGrid();
            }
        });

        btn.addEventListener('click', () => {
            if (isAdminMode) {
                isLocked = !isLocked;
                showAlert(isLocked ? "SAVED" : "UNLOCKED");
                return;
            }

            if (isLocked) {
                unlockVolume();
                return;
            }
            if (i === correctIndex) {
                lockVolume();
            } else {
                currentVolume = 0; 
                face.innerText = "X_X";
                showAlert("DIED");
                triggerHumiliation();
            }
        });
        
        lockGrid.appendChild(btn);
        buttons.push(btn);
    }
    flashCorrect();
}

function shuffleGrid() {
    buttons.forEach(btn => {
        btn.style.order = Math.floor(Math.random() * 9);
        btn.classList.remove('trap-kill');
        btn.innerText = 'TILE';
    });
}

function flashCorrect() {
    setInterval(() => {
        if(!isLocked && !isAdminMode) {
            buttons[correctIndex].innerText = "SAFE";
            setTimeout(() => {
                buttons[correctIndex].innerText = "TILE";
            }, 100);
        }
    }, 1000);
}

function lockVolume() {
    isLocked = true;
    statusText.innerText = "CHECKPOINT REACHED";
    statusText.style.color = "#00ff00";
    face.innerText = "^_^";
    showAlert("CHECKPOINT!");
}

function unlockVolume() {
    isLocked = false;
    statusText.innerText = "DEATH IMMINENT..";
    statusText.style.color = "var(--blood-red)";
    face.innerText = "-_-";
    showAlert("RESTART");
}
