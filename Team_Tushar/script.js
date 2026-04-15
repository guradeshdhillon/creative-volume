const audio = document.getElementById('audioTrack');
const output = document.getElementById('output');
const cmdInput = document.getElementById('cmd');
const promptSpan = document.getElementById('prompt');
const volDisplay = document.getElementById('vol-display');

let state = 0; // 0: idle, 1: await confirm
let pendingVolume = 0;
let currentVolume = 0;

function printToTerminal(text, className = 'system') {
    const p = document.createElement('p');
    p.textContent = text;
    if (className) p.className = className;
    output.appendChild(p);
    output.scrollTop = output.scrollHeight;
}

function updateVolumeDisplay() {
    // A helpful visual indicator made entirely of middle fingers
    let fingers = '🖕'.repeat(Math.ceil(currentVolume / 10));
    if (currentVolume === 0) fingers = "🔇";
    volDisplay.textContent = `Current Volume: ${fingers} [ ${currentVolume}% ]`;
}

cmdInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const input = this.value.trim();
        this.value = '';
        
        if (state === 0) {
            printToTerminal(`C:\\Users\\Guest> ${input}`, 'system');
        } else if (state === 1) {
            printToTerminal(`Confirm: ${input}`, 'system');
        }

        if (!input && state === 0) return;

        handleCommand(input);
    }
});

function handleCommand(input) {
    if (state === 1) {
        if (input === "I am a filthy little bitch") {
            currentVolume = pendingVolume;
            audio.volume = currentVolume / 100;
            if (audio.paused) audio.play();
            updateVolumeDisplay();
            printToTerminal(`SUCCESS: Volume forced to ${currentVolume}%. Hope it blows your fucking eardrums out.`, "success");
        } else {
            printToTerminal("Can't even type a simple sentence properly? Aborting. Get the fuck out.", "error");
        }
        state = 0;
        promptSpan.textContent = "C:\\Users\\Guest>";
        return;
    }

    const lowerInput = input.toLowerCase();

    // The trap for users used to working in Linux shells
    if (lowerInput.includes('apt-get') || lowerInput.includes('sudo')) {
        printToTerminal("ERROR: Are you fucking retarded? Linux-based package management commands like 'apt-get' would not function natively in a Windows Command Prompt environment. Stop embarrassing yourself and use 'set-vol'.", "error");
        return;
    }

    if (lowerInput === 'help') {
        printToTerminal("Oh, you need help? Boo fucking hoo. The command is: set-vol <0-100>", "system");
        return;
    }

    if (lowerInput.startsWith('set-vol')) {
        const parts = lowerInput.split(' ');
        if (parts.length === 2) {
            const vol = parseInt(parts[1]);
            if (!isNaN(vol) && vol >= 0 && vol <= 100) {
                pendingVolume = vol;
                state = 1;
                promptSpan.textContent = "Confirm > ";
                printToTerminal(`You want to set the volume to ${vol}%, huh?`, "system");
                printToTerminal("Type exactly: 'I am a filthy little bitch' to confirm you want to change the volume.", "error");
            } else {
                printToTerminal(`"${parts[1]}" is not a valid number between 0-100, you absolute moron.`, "error");
            }
        } else {
            printToTerminal("Syntax error, dickhead. Format: set-vol <number>", "error");
        }
        return;
    }

    printToTerminal(`'${input}' is not recognized as an internal or external command, operable program or batch file. Do you even know how to use a keyboard?`, "error");
}