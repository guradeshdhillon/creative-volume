const audio = document.getElementById('mainAudio');
const volDisplay = document.getElementById('volLevel');

let flashTimeout;

function setSystemVolume(value) {
    let cleanValue = Math.max(0, Math.min(100, value));
    audio.volume = cleanValue / 100;
    if (volDisplay) volDisplay.innerText = Math.round(cleanValue);

    if (volumeFlash) {
        volumeFlash.innerText = Math.round(cleanValue) + "%";
        volumeFlash.style.opacity = '1';
        clearTimeout(flashTimeout);
        flashTimeout = setTimeout(() => {
            volumeFlash.style.opacity = '0';
        }, 500);
    }
}

audio.volume = 0.5;

const overlay = document.createElement('div');
overlay.id = "volume-overlay";
Object.assign(overlay.style, {
    position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
    display: 'flex', flexWrap: 'wrap', zIndex: '9999',
    backgroundImage: 'url("weirdcore-hypnotic-collage-art-wave-epd3wb4jouoaowos.gif")',
    backgroundSize: 'cover', backgroundPosition: 'center', margin: '0', padding: '0'
});

const volumeFlash = document.createElement('h1');
Object.assign(volumeFlash.style, {
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    color: '#ffffff', fontSize: '8rem', zIndex: '10000', pointerEvents: 'none',
    opacity: '0', transition: 'opacity 0.2s', margin: '0', fontFamily: 'sans-serif'
});

// Phase Logic
const urlParams = new URLSearchParams(window.location.search);
const phase = parseInt(urlParams.get('phase')) || 1;
const originalVolume = parseInt(urlParams.get('vol')) || 50;

let activeCats = [];
let catsCaught = 0;
let totalCatsToCatch = phase >= 3 ? 3 : 1;

let gameEnded = false;

// The hint text
const hint = document.createElement('div');
Object.assign(hint.style, {
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    color: '#ffffff', zIndex: '10000', pointerEvents: 'none',
    fontFamily: 'sans-serif', fontSize: '26px', fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.9)', padding: '25px 45px', borderRadius: '15px',
    textAlign: 'center', boxShadow: '0px 10px 30px rgba(0,0,0,0.8)', transition: 'opacity 0.3s'
});

if (phase === 1) {
    // Objective is short, small (relative to screen), clear, centered, and does not reveal the cat!
    hint.innerText = "Hover to find a volume.\nClick to confirm.";
} else {
    hint.style.display = 'none'; // No central hint in later phases needed according to req
}
document.body.appendChild(hint);

function createCat() {
    let catContainer = document.createElement('div');
    Object.assign(catContainer.style, {
        position: 'fixed', width: '200px', zIndex: '10001',
        display: 'block', pointerEvents: 'auto', cursor: 'pointer'
    });

    let dvdCat = document.createElement('img');
    dvdCat.src = "cat-oiiaoiia-cat.gif";
    Object.assign(dvdCat.style, { width: '100%', pointerEvents: 'none' });

    let catText = document.createElement('div');
    if (phase === 1) catText.innerText = "Catch me!";
    else if (phase === 2) catText.innerText = "TOO SLOW!";
    else catText.innerText = "Catch us!";
    
    Object.assign(catText.style, {
        position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.9)', color: '#ffffff', padding: '5px 10px',
        borderRadius: '8px', fontWeight: 'bold', fontSize: '18px', whiteSpace: 'nowrap',
        border: '3px solid white', pointerEvents: 'none'
    });

    catContainer.appendChild(dvdCat);
    catContainer.appendChild(catText);
    document.body.appendChild(catContainer);

    let speed = phase === 1 ? 5 : (phase === 2 ? 14 : 9); // phase 3 slightly more physically manageable individually because there are 3 acting in tandem

    let catObj = {
        element: catContainer,
        textElement: catText,
        x: Math.random() * (window.innerWidth - 200),
        y: Math.random() * (window.innerHeight - 200),
        vx: speed * (Math.random() > 0.5 ? 1 : -1),
        vy: speed * (Math.random() > 0.5 ? 1 : -1),
        moving: true
    };

    catContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!catObj.moving || gameEnded) return;

        catObj.moving = false;
        catsCaught++;

        if (phase < 3) {
            catObj.textElement.innerText = "ESCAPED!";
            catObj.textElement.style.backgroundColor = 'darkred';
            
            let newUrl = new URL(window.location.href);
            newUrl.searchParams.set('phase', phase + 1);
            if (phase === 1) {
                // Save the volume they selected initially before cats
                newUrl.searchParams.set('vol', Math.round(audio.volume * 100));
            }
            audio.muted = true; // Mute this tab when the next one opens
            window.open(newUrl.href, '_blank');
        } else {
            catObj.textElement.innerText = "CAPTURED";
            catObj.textElement.style.backgroundColor = 'darkgreen';

            if (catsCaught === totalCatsToCatch) {
                gameEnded = true;
                setTimeout(() => {
                    const happyText = document.createElement('div');
                    happyText.innerText = "The cats are happy :)";
                    Object.assign(happyText.style, {
                        position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
                        fontSize: '3.5rem', color: 'white', backgroundColor: 'rgba(0,0,0,0.9)', 
                        padding: '30px 50px', borderRadius: '20px', zIndex: '10005', textAlign: 'center',
                        boxShadow: '0 0 40px rgba(0,0,0,1)', fontWeight: 'bold'
                    });
                    document.body.appendChild(happyText);

                    // Restore original volume from Phase 1 configuration via URL parameter!
                    setSystemVolume(originalVolume);
                    
                    // Display it permanently across the screen
                    volumeFlash.innerText = `Volume Locked at ${originalVolume}%`;
                    volumeFlash.style.opacity = '1';
                    volumeFlash.style.zIndex = '10006';
                    volumeFlash.style.fontSize = '4.5rem';
                    clearTimeout(flashTimeout); // prevent flash from hiding it
                }, 500);
            }
        }
    });

    activeCats.push(catObj);
}

function animateCats() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    for (let cat of activeCats) {
        if (!cat.moving) continue;

        let catWidth = cat.element.offsetWidth || 200;
        let catHeight = cat.element.offsetHeight || 200;

        cat.x += cat.vx;
        cat.y += cat.vy;

        if (cat.x + catWidth >= width) { cat.x = width - catWidth; cat.vx = -Math.abs(cat.vx); }
        else if (cat.x <= 0) { cat.x = 0; cat.vx = Math.abs(cat.vx); }

        if (cat.y + catHeight >= height) { cat.y = height - catHeight; cat.vy = -Math.abs(cat.vy); }
        else if (cat.y <= 0) { cat.y = 0; cat.vy = Math.abs(cat.vy); }

        cat.element.style.left = cat.x + 'px';
        cat.element.style.top = cat.y + 'px';

        // Phase 1 dynamically tracks tiles. 2 and 3 use setInterval independently.
        if (phase === 1) {
            cat.element.style.pointerEvents = 'none';
            let under = document.elementFromPoint(cat.x + catWidth / 2, cat.y + catHeight / 2);
            cat.element.style.pointerEvents = 'auto';

            if (under && under.dataset.volume !== undefined) {
                setSystemVolume(Number(under.dataset.volume));
            }
        }
    }

    requestAnimationFrame(animateCats);
}

// Generate the invisible grid
for (let i = 0; i < 100; i++) {
    const section = document.createElement('div');
    Object.assign(section.style, {
        flexGrow: '1', width: `${Math.random() * 30 + 1}vw`, height: `${Math.random() * 30 + 1}vh`,
        cursor: 'crosshair'
    });

    const randomVolume = Math.floor(Math.random() * 101);
    section.dataset.volume = randomVolume;

    section.addEventListener('mouseenter', () => {
        if (phase === 1 && activeCats.length === 0) {
            setSystemVolume(randomVolume);
        }
    });

    section.addEventListener('click', () => {
        if (audio.paused) audio.play().catch(e => console.log(e));

        if (phase === 1 && activeCats.length === 0) {
            hint.style.opacity = '0'; // instantly hide the initial hint
            setSystemVolume(randomVolume);
            createCat();
            animateCats();
        }
    });

    overlay.appendChild(section);
}

document.body.appendChild(overlay);
document.body.appendChild(volumeFlash);

document.addEventListener('click', () => {
    if (audio.paused) audio.play().catch(e => console.log(e));
});

// Phase 2 or 3 Auto Initialization
if (phase > 1) {
    if (phase >= 3) {
        for(let i = 0; i < 3; i++) createCat();
    } else {
        createCat(); // Phase 2
    }
    
    animateCats();

    setInterval(() => {
        if (!gameEnded) {
            setSystemVolume(Math.floor(Math.random() * 101));
        }
    }, 3000);
}
