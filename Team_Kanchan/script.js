document.addEventListener('DOMContentLoaded', () => {

    // ============ GLOBAL STATE ============
    let totalVolume = 0;     // 0-100 (the REAL volume)
    let totalClicks = 0;
    let startTime = Date.now();

    const audio = document.getElementById('audio');
    audio.volume = 0;

    // DOM refs
    const hudVol    = document.getElementById('hud-vol');
    const hudFill   = document.getElementById('hud-fill');
    const statClicks= document.getElementById('stat-clicks');
    const statTime  = document.getElementById('stat-time');
    const commText  = document.getElementById('comm-text');
    const toastEl   = document.getElementById('toast');
    const achEl     = document.getElementById('achievement');
    const achIcon   = document.getElementById('ach-icon');
    const achTitle  = document.getElementById('ach-title');
    const achDesc   = document.getElementById('ach-desc');
    const fxCanvas  = document.getElementById('fx-canvas');
    const fxCtx     = fxCanvas.getContext('2d');
    const body      = document.getElementById('body');

    const neonColors = ['#ff2d95','#00e5ff','#39ff14','#ffd700','#b24dff','#ff6d00','#ff1744'];

    // ============ VOLUME SYNC ============
    function setVolume(newVol) {
        totalVolume = Math.max(0, Math.min(100, Math.round(newVol * 10) / 10));
        audio.volume = totalVolume / 100;
        hudVol.textContent = Math.round(totalVolume);
        hudFill.style.width = totalVolume + '%';

        // Color changes at thresholds
        if (totalVolume > 80) {
            hudVol.style.color = '#ff1744';
            hudVol.style.textShadow = '0 0 20px #ff1744';
        } else if (totalVolume > 50) {
            hudVol.style.color = '#ffd700';
            hudVol.style.textShadow = '0 0 20px #ffd700';
        } else {
            hudVol.style.color = '#39ff14';
            hudVol.style.textShadow = '0 0 20px #39ff14';
        }

        checkMilestones();
    }

    function addVolume(amount) {
        setVolume(totalVolume + amount);
    }

    // ============ TIMER ============
    setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const m = Math.floor(elapsed / 60);
        const s = elapsed % 60;
        statTime.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    }, 1000);

    // ============ HELPERS ============
    function toast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toastEl._t);
        toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 3000);
    }

    function comment(msg) {
        commText.style.opacity = '0';
        setTimeout(() => { commText.textContent = msg; commText.style.opacity = '1'; }, 150);
        commText.style.transition = 'opacity 0.15s';
    }

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function shakeEl(el) {
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 350);
    }

    function showAchievement(icon, title, desc) {
        achIcon.textContent = icon;
        achTitle.textContent = title;
        achDesc.textContent = desc;
        achEl.classList.add('show');
        setTimeout(() => achEl.classList.remove('show'), 3500);
    }

    // ============ CONFETTI ============
    let confetti = [];

    function resizeCanvas() {
        fxCanvas.width = window.innerWidth;
        fxCanvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class ConfettiPiece {
        constructor(x, y) {
            this.x = x || Math.random() * fxCanvas.width;
            this.y = y || fxCanvas.height + 10;
            this.size = Math.random() * 7 + 3;
            this.speedY = -(Math.random() * 14 + 6);
            this.speedX = (Math.random() - 0.5) * 10;
            this.gravity = 0.3;
            this.rotation = Math.random() * 360;
            this.rotSpeed = (Math.random() - 0.5) * 15;
            this.color = pick(neonColors);
            this.opacity = 1;
        }
        update() {
            this.speedY += this.gravity;
            this.y += this.speedY;
            this.x += this.speedX;
            this.rotation += this.rotSpeed;
            this.opacity -= 0.008;
        }
        draw() {
            fxCtx.save();
            fxCtx.translate(this.x, this.y);
            fxCtx.rotate(this.rotation * Math.PI / 180);
            fxCtx.globalAlpha = Math.max(0, this.opacity);
            fxCtx.fillStyle = this.color;
            fxCtx.fillRect(-this.size/2, -this.size/3, this.size, this.size * 0.5);
            fxCtx.restore();
        }
    }

    function burstConfetti(x, y, count = 60) {
        for (let i = 0; i < count; i++) confetti.push(new ConfettiPiece(x, y));
    }

    function animateFx() {
        fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
        confetti = confetti.filter(c => c.opacity > 0);
        confetti.forEach(c => { c.update(); c.draw(); });
        requestAnimationFrame(animateFx);
    }
    animateFx();

    // ===========================================================
    //  STATION 1: THE GRIND (CLICKER)
    // ===========================================================
    const bigClicker   = document.getElementById('big-clicker');
    const clickCount   = document.getElementById('click-count');
    const clickEarned  = document.getElementById('click-earned');
    const clickerEmoji = document.getElementById('clicker-emoji');
    const clickMulti   = document.getElementById('click-multi');

    let sessionClicks = 0;
    let sessionEarned = 0;
    let multiplier = 1;
    let clickStreak = 0;
    let lastClickTime = 0;

    // Multiplier: fast clicking = higher multiplier (up to 5x)
    bigClicker.addEventListener('click', (e) => {
        const now = Date.now();
        totalClicks++;
        sessionClicks++;
        statClicks.textContent = totalClicks;
        clickCount.textContent = sessionClicks;

        // Speed multiplier
        if (now - lastClickTime < 300) {
            clickStreak++;
            multiplier = Math.min(5, 1 + clickStreak * 0.2);
        } else {
            clickStreak = 0;
            multiplier = 1;
        }
        lastClickTime = now;
        clickMulti.textContent = multiplier.toFixed(1) + 'x Multiplier' + (multiplier >= 3 ? ' 🔥' : multiplier >= 2 ? ' ⚡' : '');

        // Earn amount: 0.1-0.5 * multiplier, but 15% chance of LOSING
        let earned;
        if (Math.random() < 0.15) {
            earned = -(Math.random() * 0.5 + 0.1) * multiplier;
            createFloatNum(e, earned);
            comment(pick([
                "OUCH! Negative click! The machine giveth and taketh away! 😂",
                "Bad click! You just LOST volume! How does that even work?!",
                "The click gods are angry! You lose volume! ⚡",
                "Critical miss! Volume DECREASED! 💀",
            ]));
        } else {
            earned = (Math.random() * 0.4 + 0.1) * multiplier;
            createFloatNum(e, earned);
        }

        sessionEarned += earned;
        clickEarned.textContent = sessionEarned.toFixed(1);
        addVolume(earned);

        // Visual feedback
        const emojis = ['🔨','⚒️','🔧','💪','👊','🤜','⛏️'];
        clickerEmoji.textContent = pick(emojis);

        // Achievements
        if (totalClicks === 1) showAchievement('🖱️', 'FIRST CLICK', 'Every journey begins with a single click.');
        if (totalClicks === 50) showAchievement('💪', '50 CLICKS', 'Your finger is getting tired. Keep going.');
        if (totalClicks === 100) showAchievement('🔥', 'CENTURY!', '100 clicks! You really want this volume, huh?');
        if (totalClicks === 250) showAchievement('😰', '250 CLICKS', 'At this point, it\'s not about volume. It\'s about principle.');
        if (totalClicks === 500) showAchievement('💀', '500 CLICKS!', 'You need help. Seriously. Call someone.');
        if (totalClicks === 1000) showAchievement('👑', 'CLICK MONARCH', '1000 clicks. You are now royalty of suffering.');
    });

    function createFloatNum(e, value) {
        const btn = bigClicker;
        const rect = btn.getBoundingClientRect();
        const el = document.createElement('div');
        el.className = 'float-num ' + (value >= 0 ? 'positive' : 'negative');
        el.textContent = (value >= 0 ? '+' : '') + value.toFixed(1) + '%';
        el.style.left = (e.clientX - rect.left) + 'px';
        el.style.top = (e.clientY - rect.top) + 'px';
        btn.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }

    // ===========================================================
    //  STATION 2: BRAIN TAX (MATH)
    // ===========================================================
    const mathQ      = document.getElementById('math-q');
    const mathInput  = document.getElementById('math-input');
    const mathSubmit = document.getElementById('math-submit');
    const mathStreak = document.getElementById('math-streak');
    const mathProblem= document.getElementById('math-problem');

    let mathAnswer = 0;
    let streak = 0;
    let mathDifficulty = 1;

    function generateMath() {
        let a, b, op, q;
        
        if (mathDifficulty <= 2) {
            // Easy: simple multiply/add
            a = Math.floor(Math.random() * 12) + 2;
            b = Math.floor(Math.random() * 12) + 2;
            op = pick(['+', '-', '×']);
        } else if (mathDifficulty <= 4) {
            // Medium: bigger numbers
            a = Math.floor(Math.random() * 50) + 10;
            b = Math.floor(Math.random() * 30) + 5;
            op = pick(['+', '-', '×', '÷']);
        } else {
            // Hard: big math
            a = Math.floor(Math.random() * 100) + 20;
            b = Math.floor(Math.random() * 50) + 10;
            op = pick(['+', '-', '×', '÷', '²']);
        }

        if (op === '÷') {
            mathAnswer = a;
            a = a * b;
            q = `${a} ÷ ${b} = ?`;
        } else if (op === '²') {
            a = Math.floor(Math.random() * 15) + 2;
            mathAnswer = a * a;
            q = `${a}² = ?`;
        } else if (op === '×') {
            mathAnswer = a * b;
            q = `${a} × ${b} = ?`;
        } else if (op === '-') {
            if (a < b) [a, b] = [b, a];
            mathAnswer = a - b;
            q = `${a} - ${b} = ?`;
        } else {
            mathAnswer = a + b;
            q = `${a} + ${b} = ?`;
        }

        mathQ.textContent = q;
        mathInput.value = '';
    }

    generateMath();

    function submitMath() {
        const answer = parseFloat(mathInput.value);
        if (isNaN(answer)) return;

        totalClicks++;
        statClicks.textContent = totalClicks;

        if (answer === mathAnswer) {
            // Correct!
            streak++;
            mathStreak.textContent = streak;
            mathDifficulty = 1 + Math.floor(streak / 3);

            const reward = 2 + Math.min(streak, 5); // 2-7% based on streak
            addVolume(reward);

            mathProblem.classList.remove('wrong');
            mathProblem.classList.add('correct');
            setTimeout(() => mathProblem.classList.remove('correct'), 500);

            toast(`✅ Correct! +${reward}% volume! Streak: ${streak}🔥`);
            comment(pick([
                `Big brain energy! +${reward}%! Streak ${streak}! 🧠`,
                `They actually did the math! ${reward}% earned! 📐`,
                `${streak} in a row! This person STUDIED! 🤓`,
                streak >= 5 ? `FIVE STREAK! This person is a CALCULATOR! 🔢` : `Keep it going! The math never stops! ➕`,
            ]));

            if (streak === 3) showAchievement('🧮', 'MATH STREAK 3', 'Your math teacher would be proud.');
            if (streak === 5) showAchievement('🤓', 'MATH STREAK 5', 'You should be doing homework, not this.');
            if (streak === 10) showAchievement('🏆', 'MATH GOD', '10 streak! Were you a mathlete?');

            burstConfetti(fxCanvas.width / 2, fxCanvas.height / 2, 30);
        } else {
            // Wrong!
            streak = 0;
            mathStreak.textContent = 0;
            mathDifficulty = 1;

            const penalty = Math.random() * 3 + 1; // Lose 1-4%
            addVolume(-penalty);

            mathProblem.classList.remove('correct');
            mathProblem.classList.add('wrong');
            setTimeout(() => mathProblem.classList.remove('wrong'), 500);

            toast(`❌ Wrong! Answer was ${mathAnswer}. -${penalty.toFixed(1)}% volume!`);
            comment(pick([
                `WRONG! The answer was ${mathAnswer}! Back to school! 📚`,
                `Math said NO! -${penalty.toFixed(1)}%! Your volume weeps! 😭`,
                `That's not even close! Did you guess?! 🙄`,
                `Incorrect! The volume gods are displeased! ⚡`,
            ]));

            shakeEl(mathProblem);
        }

        generateMath();
    }

    mathSubmit.addEventListener('click', submitMath);
    mathInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitMath(); });

    // ===========================================================
    //  STATION 3: TYPE TRIAL
    // ===========================================================
    const typePhrase  = document.getElementById('type-phrase');
    const typeInput   = document.getElementById('type-input');
    const typeFill    = document.getElementById('type-fill');
    const typeStatus  = document.getElementById('type-status');

    const phrases = [
        "I deserve zero volume",
        "My ears are not worthy",
        "Volume is a privilege not a right",
        "Please sir may I have some decibels",
        "I solemnly swear my ears can handle this",
        "The quick brown fox hates this UI",
        "Error 404: Good Design Not Found",
        "This is fine. Everything is fine.",
        "I click therefore I suffer",
        "To volume or not to volume",
        "All work and no volume makes Jack sad",
        "Houston we have a volume problem",
        "Winter is coming for my eardrums",
        "I used to be a volume controller like you",
        "The cake is a lie but the volume is real",
        "Do you even volume bro?",
        "Keep calm and click harder",
        "99 problems and volume is all of them",
        "It's not a bug it's a feature",
        "sudo give me volume please",
    ];

    let currentPhrase = '';

    function newPhrase() {
        currentPhrase = pick(phrases);
        typePhrase.textContent = `"${currentPhrase}"`;
        typeInput.value = '';
        typeInput.classList.remove('error', 'success');
        typeFill.style.width = '0%';
        typeStatus.textContent = `0 / ${currentPhrase.length} characters`;
    }

    newPhrase();

    typeInput.addEventListener('input', () => {
        const val = typeInput.value;
        const target = currentPhrase;

        totalClicks++;
        statClicks.textContent = totalClicks;

        // Check if what's typed so far matches
        if (target.startsWith(val)) {
            typeInput.classList.remove('error');
            typeFill.style.width = (val.length / target.length * 100) + '%';
            typeStatus.textContent = `${val.length} / ${target.length} characters`;

            // Complete!
            if (val === target) {
                typeInput.classList.add('success');
                addVolume(5);
                toast('✅ Typed perfectly! +5% volume!');
                comment(pick([
                    "PERFECT TYPING! +5%! Those fingers are FAST! ⌨️🔥",
                    "Flawless typing! The keyboard bows to you! 👑",
                    "Not a single typo! Are you a robot?! 🤖",
                ]));
                burstConfetti(fxCanvas.width / 2, fxCanvas.height / 2, 40);
                showAchievement('⌨️', 'TYPIST', `Typed "${target.substring(0, 15)}..." perfectly!`);
                setTimeout(newPhrase, 1500);
            }
        } else {
            // WRONG! Reset!
            typeInput.classList.add('error');
            shakeEl(typeInput);

            const penalty = Math.random() * 1 + 0.5;
            addVolume(-penalty);

            toast(`❌ Typo detected! Restarting... -${penalty.toFixed(1)}%`);
            comment(pick([
                "ONE TYPO! Start over! No mercy! 🔄",
                "Your fingers betrayed you! Reset! 💀",
                "So close... yet so far. Typo penalty! 😤",
            ]));

            setTimeout(() => {
                typeInput.value = '';
                typeInput.classList.remove('error');
                typeFill.style.width = '0%';
                typeStatus.textContent = `0 / ${target.length} characters`;
            }, 500);
        }
    });

    // ===========================================================
    //  STATION 4: DOUBLE OR NOTHING (GAMBLE)
    // ===========================================================
    const gambleSlider  = document.getElementById('gamble-slider');
    const gambleBetVal  = document.getElementById('gamble-bet-val');
    const gambleBtn     = document.getElementById('gamble-btn');
    const coinDisplay   = document.getElementById('coin-display');
    const gambleHistory = document.getElementById('gamble-history');

    let isFlipping = false;

    gambleSlider.addEventListener('input', () => {
        gambleBetVal.textContent = gambleSlider.value + '%';
    });

    gambleBtn.addEventListener('click', () => {
        if (isFlipping) return;

        const bet = parseInt(gambleSlider.value);
        if (bet > totalVolume) {
            toast('❌ You can\'t bet more volume than you have!');
            comment("Trying to bet volume you don't have? That's called FRAUD! 🚔");
            return;
        }
        if (totalVolume === 0) {
            toast('❌ You have 0% volume. Nothing to gamble!');
            comment("You literally have nothing. Click the grind button first! 🔨");
            return;
        }

        isFlipping = true;
        totalClicks++;
        statClicks.textContent = totalClicks;

        // Animate coin
        coinDisplay.classList.add('flip');
        coinDisplay.textContent = '🪙';

        setTimeout(() => {
            const win = Math.random() > 0.5;
            coinDisplay.classList.remove('flip');

            // Add history dot
            const dot = document.createElement('span');
            dot.className = 'gamble-dot ' + (win ? 'win' : 'lose');
            gambleHistory.appendChild(dot);

            if (win) {
                addVolume(bet);
                coinDisplay.textContent = '✅';
                toast(`🎉 WIN! +${bet}% volume! You lucky dog!`);
                comment(pick([
                    `WINNER! +${bet}%! The odds were in your favor! 🎲`,
                    `JACKPOT ENERGY! +${bet}%! Double or nothing DOUBLED! 💰`,
                    `The coin lands heads! You WIN ${bet}%! 🪙✨`,
                ]));
                burstConfetti(fxCanvas.width / 2, fxCanvas.height / 2, 50);
            } else {
                addVolume(-bet);
                coinDisplay.textContent = '💀';
                toast(`💀 LOSS! -${bet}% volume! Gone forever!`);
                comment(pick([
                    `BUST! -${bet}%! The house ALWAYS wins! 🏠`,
                    `GONE! ${bet}% volume vanished into the void! 💨`,
                    `The coin said NO! -${bet}%! Should've walked away! 😭`,
                    bet >= 20 ? `${bet}%?! You BET ${bet}%?! AND LOST?! MADNESS! 🤡` : `Better luck next time... if there is a next time. ☠️`,
                ]));
                shakeEl(document.querySelector('.station-gamble'));
            }

            setTimeout(() => { coinDisplay.textContent = '🪙'; isFlipping = false; }, 1000);
        }, 800);
    });

    // ===========================================================
    //  STATION 5: CURSED SLIDER
    // ===========================================================
    const cursedRange  = document.getElementById('cursed-range');
    const sliderTarget = document.getElementById('slider-target');
    const sliderVal    = document.getElementById('slider-val');
    const sliderLock   = document.getElementById('slider-lock');
    const sliderWrap   = document.getElementById('slider-wrap');
    const newTargetBtn = document.getElementById('new-target-btn');

    let target = 50;
    let sliderChaosInterval;

    // The slider FIGHTS BACK
    function startSliderChaos() {
        clearInterval(sliderChaosInterval);
        sliderChaosInterval = setInterval(() => {
            // Random nudge
            let val = parseInt(cursedRange.value);
            const nudge = Math.floor(Math.random() * 10) - 5;
            cursedRange.value = Math.max(0, Math.min(100, val + nudge));
            sliderVal.textContent = cursedRange.value;

            // Sometimes invert the slider direction (flip the wrapper)
            if (Math.random() > 0.95) {
                sliderWrap.style.transform = sliderWrap.style.transform === 'scaleX(-1)' ? '' : 'scaleX(-1)';
            }

            // Sometimes change the target
            if (Math.random() > 0.98) {
                target = Math.floor(Math.random() * 101);
                sliderTarget.textContent = target;
                toast('🎯 Target changed! The slider has no mercy!');
            }
        }, 500);
    }

    startSliderChaos();

    cursedRange.addEventListener('input', () => {
        sliderVal.textContent = cursedRange.value;
    });

    newTargetBtn.addEventListener('click', () => {
        target = Math.floor(Math.random() * 101);
        sliderTarget.textContent = target;
        toast(`🎯 New target: ${target}%`);
    });

    sliderLock.addEventListener('click', () => {
        const val = parseInt(cursedRange.value);
        const diff = Math.abs(val - target);
        totalClicks++;
        statClicks.textContent = totalClicks;

        if (diff <= 15) {
            // Close enough!
            setVolume(target);
            toast(`✅ Volume set to ${target}%! Close enough! (off by ${diff})`);
            comment(pick([
                `The slider COOPERATED?! ${target}% locked! Only ${diff} off! 🎯`,
                `Against all odds, the cursed slider was tamed! ${target}%! 🎚️`,
                diff === 0 ? `PERFECT! DEAD CENTER! You are a SLIDER GOD! 👑` : `${diff} off... close enough for government work!`,
            ]));
            burstConfetti(fxCanvas.width / 2, fxCanvas.height / 2, 40);

            if (diff === 0) showAchievement('🎯', 'PERFECT AIM', 'Hit the exact target on the cursed slider!');
        } else {
            // Too far!
            const penalty = diff / 10;
            addVolume(-penalty);
            toast(`❌ Off by ${diff}! Need ±15. -${penalty.toFixed(1)}% penalty!`);
            comment(pick([
                `Off by ${diff}?! The slider wins again! -${penalty.toFixed(1)}%! 🎚️💀`,
                `NOT EVEN CLOSE! The slider is laughing at you! 😂`,
                `${diff} away from target! The curse is STRONG! ⚡`,
            ]));
            shakeEl(document.querySelector('.station-slider'));
        }

        // Generate new target
        target = Math.floor(Math.random() * 101);
        sliderTarget.textContent = target;
    });

    // ===========================================================
    //  STATION 6: THE SACRIFICE
    // ===========================================================
    const sacrificeInput  = document.getElementById('sacrifice-input');
    const sacrificeBtn    = document.getElementById('sacrifice-btn');
    const sacrificeResult = document.getElementById('sacrifice-result');
    const godMood         = document.getElementById('god-mood');

    const moods = [
        { emoji: '😐', name: 'Indifferent' },
        { emoji: '😊', name: 'Pleased' },
        { emoji: '😡', name: 'Angry' },
        { emoji: '🥱', name: 'Bored' },
        { emoji: '😈', name: 'Mischievous' },
        { emoji: '🤑', name: 'Greedy' },
        { emoji: '😇', name: 'Generous' },
        { emoji: '🤪', name: 'Chaotic' },
    ];

    let currentMood = moods[0];

    sacrificeBtn.addEventListener('click', () => {
        const amount = parseInt(sacrificeInput.value) || 0;
        if (amount <= 0) return;
        if (amount > totalVolume) {
            toast('❌ You can\'t sacrifice more than you have!');
            return;
        }

        totalClicks++;
        statClicks.textContent = totalClicks;

        // Take the sacrifice
        addVolume(-amount);

        // Gods decide...
        currentMood = pick(moods);
        godMood.textContent = `${currentMood.emoji} ${currentMood.name}`;

        const roll = Math.random();
        let result;

        if (roll < 0.15) {
            // TRIPLE! 
            result = amount * 3;
            addVolume(result);
            sacrificeResult.textContent = `🌟 THE GODS ARE GENEROUS! +${result}% RETURNED! (3x!)`;
            comment(`TRIPLE RETURN! The gods blessed you with ${result}%! Miracles DO happen! 🌟`);
            burstConfetti(fxCanvas.width / 2, fxCanvas.height / 2, 80);
            showAchievement('🌟', 'DIVINE FAVOR', `The gods returned 3x your sacrifice!`);
        } else if (roll < 0.40) {
            // Double!
            result = amount * 2;
            addVolume(result);
            sacrificeResult.textContent = `✨ Doubled! +${result}% returned!`;
            comment(`Double return! ${result}% flows back! The gods approve! ✨`);
            burstConfetti(fxCanvas.width / 2, fxCanvas.height / 2, 40);
        } else if (roll < 0.55) {
            // Return same
            addVolume(amount);
            sacrificeResult.textContent = `😐 The gods shrug. ${amount}% returned unchanged.`;
            comment('The gods are indifferent. You get your volume back. Wow. Exciting. 😐');
        } else if (roll < 0.70) {
            // Half back
            result = Math.ceil(amount / 2);
            addVolume(result);
            sacrificeResult.textContent = `📉 Only ${result}% returned. The gods kept the rest.`;
            comment(`The gods pocketed ${amount - result}%. Corrupt deities! 💰`);
        } else if (roll < 0.85) {
            // Nothing!
            sacrificeResult.textContent = `💀 The gods consumed your ${amount}%. Gone forever.`;
            comment(`GONE! ${amount}% devoured by the void! The gods give NOTHING! 💀`);
            shakeEl(document.querySelector('.station-sacrifice'));
        } else {
            // CURSE! Lose EXTRA
            const extra = Math.ceil(amount * 0.5);
            addVolume(-extra);
            sacrificeResult.textContent = `🔥 CURSED! Lost ${amount}% + ${extra}% penalty! The gods are angry!`;
            comment(`THE GODS ARE FURIOUS! You lost your sacrifice AND ${extra}% extra! 🔥😡`);
            shakeEl(document.querySelector('.station-sacrifice'));
            body.classList.add('flipped');
            setTimeout(() => body.classList.remove('flipped'), 2000);
        }
    });

    // ===========================================================
    //  MILESTONES & RANDOM EVENTS
    // ===========================================================
    const milestoneHit = {};

    function checkMilestones() {
        const vol = Math.round(totalVolume);

        if (vol >= 10 && !milestoneHit[10]) {
            milestoneHit[10] = true;
            showAchievement('📢', '10% VOLUME', 'You can now hear a whisper. Keep grinding.');
            comment("10%! You can now hear a pin drop... if you listen REALLY hard! 📌");
        }
        if (vol >= 25 && !milestoneHit[25]) {
            milestoneHit[25] = true;
            showAchievement('🔉', 'QUARTER VOLUME', '25%! Only 75% more suffering to go!');
            comment("25%! Quarter of the way! Only three-quarters of infinity left! 📊");
        }
        if (vol >= 50 && !milestoneHit[50]) {
            milestoneHit[50] = true;
            showAchievement('🔊', 'HALF VOLUME', '50%! The halfway point of madness!');
            comment("FIFTY PERCENT! Halfway to full volume! The crowd goes MILD! 👏");
            burstConfetti(fxCanvas.width/2, fxCanvas.height/2, 80);
        }
        if (vol >= 75 && !milestoneHit[75]) {
            milestoneHit[75] = true;
            showAchievement('📣', '75% VOLUME', 'Almost there! Your ears are sweating!');
            comment("75%! The home stretch! Your neighbors are already writing complaints! 📝");
        }
        if (vol >= 100 && !milestoneHit[100]) {
            milestoneHit[100] = true;
            showAchievement('🏆', 'MAX VOLUME!!!', 'You actually did it. You absolute legend.');
            comment("🏆 ONE HUNDRED PERCENT! YOU ACTUALLY DID IT! THE MADMAN! THE LEGEND! 🏆🎉🔊");
            burstConfetti(fxCanvas.width/2, fxCanvas.height/2, 150);
            // Victory confetti burst from multiple points
            setTimeout(() => burstConfetti(100, 100, 50), 200);
            setTimeout(() => burstConfetti(fxCanvas.width - 100, 100, 50), 400);
            setTimeout(() => burstConfetti(fxCanvas.width/2, 200, 50), 600);
        }
    }

    // Random commentary every 20-40 seconds
    function randomCommentary() {
        setTimeout(() => {
            const vol = Math.round(totalVolume);
            const lines = [
                `🎙️ Current volume: ${vol}%. Total clicks: ${totalClicks}. Was it worth it?`,
                `🎙️ ${totalClicks} clicks and ${vol}% volume. That's ${(totalClicks / Math.max(1,vol)).toFixed(1)} clicks per percent.`,
                '🎙️ Fun fact: a normal volume slider takes ONE drag. This takes your entire afternoon.',
                '🎙️ Remember: nobody forced you to do this. This was YOUR choice.',
                '🎙️ Your mouse is filing a workplace complaint right now.',
                '🎙️ Other people are listening to music. You\'re playing math games for volume privileges.',
                '🎙️ Plot twist: what if I told you the audio player has its own volume slider? 😈',
                `🎙️ You've been at this for ${statTime.textContent}. Time well spent? Debatable.`,
                '🎙️ The developers of this UI are watching. They\'re eating popcorn. 🍿',
                '🎙️ Some say the last person to reach 100% volume went mad. Others say they were ALREADY mad.',
            ];
            comment(pick(lines));
            randomCommentary();
        }, 20000 + Math.random() * 20000);
    }
    randomCommentary();

    // Random volume decay (volume slowly decreases every 30s)
    setInterval(() => {
        if (totalVolume > 0) {
            const decay = Math.random() * 0.5 + 0.1;
            addVolume(-decay);
            if (Math.random() > 0.8) {
                comment(pick([
                    `📉 Volume naturally decayed by ${decay.toFixed(1)}%... entropy is real.`,
                    `📉 Volume leak detected! -${decay.toFixed(1)}%. Nothing lasts forever. ⏳`,
                    `📉 Your volume evaporated slightly. Did you notice? Probably not. 🌫️`,
                ]));
            }
        }
    }, 30000);

    // ===========================================================
    //  🌀 CHAOS EVENTS SYSTEM — RANDOM MADNESS EVERY 12-25s
    // ===========================================================
    let chaosActive = false;

    // Helper: show chaos banner
    function showChaosBanner(text, color, duration) {
        const banner = document.createElement('div');
        banner.className = 'chaos-banner';
        banner.textContent = text;
        banner.style.background = color;
        banner.style.textShadow = `0 0 20px ${color}`;
        document.body.appendChild(banner);
        setTimeout(() => banner.remove(), duration || 3000);
    }

    // Helper: apply body class for duration
    function bodyChaos(className, duration) {
        if (chaosActive) return false;
        chaosActive = true;
        body.classList.add(className);
        setTimeout(() => {
            body.classList.remove(className);
            chaosActive = false;
        }, duration);
        return true;
    }

    // THE CHAOS EVENTS
    const chaosEvents = [

        // 1. PAGE TILTS LEFT
        () => {
            if (!bodyChaos('tilt-left', 4000)) return;
            showChaosBanner('⬅️ GRAVITY SHIFT LEFT ⬅️', '#ff2d95', 3000);
            comment('🌀 GRAVITY SHIFTED! The page is leaning left! Try clicking NOW! 😂');
            toast('🌀 Gravity malfunction detected!');
        },

        // 2. PAGE TILTS RIGHT
        () => {
            if (!bodyChaos('tilt-right', 4000)) return;
            showChaosBanner('➡️ GRAVITY SHIFT RIGHT ➡️', '#00e5ff', 3000);
            comment('🌀 The page is tilting RIGHT! Good luck with those buttons! 😈');
            toast('🌀 Who tilted the screen?!');
        },

        // 3. FULL 180° FLIP
        () => {
            if (!bodyChaos('upside-down', 5000)) return;
            showChaosBanner('🙃 UPSIDE DOWN MODE 🙃', '#ff6d00', 4000);
            comment('🙃 EVERYTHING IS UPSIDE DOWN! Your brain hurts yet? Enjoy! 🙃');
            toast('🙃 The page flipped upside down!');
        },

        // 4. SIDEWAYS (90°)
        () => {
            if (!bodyChaos('sideways', 4000)) return;
            showChaosBanner('↩️ SIDEWAYS MODE ↩️', '#b24dff', 3000);
            comment('🔄 The page went SIDEWAYS! Tilt your head and keep grinding! 😂');
            toast('🔄 Who rotated the monitor?!');
        },

        // 5. MIRROR MODE
        () => {
            if (!bodyChaos('mirror', 5000)) return;
            showChaosBanner('🪞 MIRROR MODE 🪞', '#ffd700', 4000);
            comment('🪞 Everything is MIRRORED! Your mouse goes the wrong way now! 😈');
            toast('🪞 Mirror mirror on the wall...');
        },

        // 6. DRUNK MODE
        () => {
            if (!bodyChaos('drunk', 5000)) return;
            showChaosBanner('🍺 DRUNK MODE ACTIVATED 🍺', '#39ff14', 4000);
            comment('🍺 The page had too many drinks! Everything is wobbling! Try to click ANYTHING! 🤣');
            toast('🍺 *hic* ...the page is drunk!');
        },

        // 7. EARTHQUAKE
        () => {
            if (!bodyChaos('earthquake', 3000)) return;
            showChaosBanner('🌍 EARTHQUAKE! 🌍', '#ff1744', 2500);
            comment('🌍 EARTHQUAKE!! Hold onto your volume! Nothing is safe! 😱');
            toast('🌍 The ground is shaking!');
            // Also wobble all station cards
            document.querySelectorAll('.station').forEach((s, i) => {
                setTimeout(() => { s.classList.add('jelly'); setTimeout(() => s.classList.remove('jelly'), 600); }, i * 100);
            });
        },

        // 8. DISCO MODE
        () => {
            if (!bodyChaos('disco', 4000)) return;
            showChaosBanner('🕺 DISCO INFERNO 🕺', '#ff2d95', 3500);
            comment('🕺💃 DISCO MODE! The 70s called, they want their volume back! 🪩');
            toast('🪩 Dance while you click!');
            burstConfetti(fxCanvas.width / 2, fxCanvas.height / 2, 60);
        },

        // 9. ZOOM IN (everything gets huge)
        () => {
            if (!bodyChaos('zoom-in', 4000)) return;
            showChaosBanner('🔍 MEGA ZOOM 🔍', '#00e5ff', 3000);
            comment('🔍 ZOOMED IN! Everything is HUGE! Can you even find the buttons? 😂');
            toast('🔍 Who touched the zoom?!');
        },

        // 10. ZOOM OUT (everything tiny)
        () => {
            if (!bodyChaos('zoom-out', 4000)) return;
            showChaosBanner('🔬 TINY MODE 🔬', '#b24dff', 3000);
            comment('🔬 Everything shrunk! What is this, a volume control for ANTS?! 🐜');
            toast('🐜 So tiny!');
        },

        // 11. INVERTED COLORS
        () => {
            if (!bodyChaos('inverted', 5000)) return;
            showChaosBanner('🎨 INVERTED COLORS 🎨', '#ffffff', 4000);
            comment('🎨 COLORS INVERTED! Welcome to the negative zone! Your eyes love this! (They don\'t.) 😵');
            toast('🎨 Reality has been inverted!');
        },

        // 12. GRAYSCALE
        () => {
            if (!bodyChaos('grayscale', 5000)) return;
            showChaosBanner('⬛ NO COLOR MODE ⬛', '#888888', 4000);
            comment('⬛ ALL COLOR HAS BEEN REMOVED. You are now in a sad movie. 🎬😢');
            toast('⬛ All color has left the chat.');
        },

        // 13. SLOW 360° SPIN
        () => {
            if (!bodyChaos('spin-slow', 3000)) return;
            showChaosBanner('🌀 FULL ROTATION 🌀', '#ff2d95', 3000);
            comment('🌀 THE ENTIRE PAGE IS DOING A 360! WHEEEEE! 🎢');
            toast('🌀 Round and round we go!');
        },

        // 14. BOUNCE MODE
        () => {
            if (!bodyChaos('bounce', 4000)) return;
            showChaosBanner('🏀 BOUNCE MODE 🏀', '#ff6d00', 3500);
            comment('🏀 BOING! BOING! Everything is bouncing! Try to click something! 😂');
            toast('🏀 Boing boing boing!');
        },

        // 15. HUE SHIFT
        () => {
            if (!bodyChaos('hue-shift', 4000)) return;
            showChaosBanner('🌈 COLOR SHIFT 🌈', '#39ff14', 3500);
            comment('🌈 All colors have shifted! Is that button red or green?! WHO KNOWS! 🤷');
            toast('🌈 Colors went on vacation!');
        },

        // 16. WAVE EFFECT
        () => {
            if (!bodyChaos('wave', 5000)) return;
            showChaosBanner('🌊 WAVE MODE 🌊', '#00e5ff', 4000);
            comment('🌊 The page is doing WAVES! Surf\'s up! 🏄');
            toast('🌊 Cowabunga!');
        },

        // 17. SEPIA (old timey)
        () => {
            if (!bodyChaos('sepia', 4000)) return;
            showChaosBanner('📜 OLD TIMEY MODE 📜', '#8B7355', 3500);
            comment('📜 Welcome to 1920! Volume control in the olden days! 🎩');
            toast('📜 Back in my day...');
        },

        // 18. VOLUME THEFT - randomly steal some volume
        () => {
            if (totalVolume > 2) {
                const stolen = Math.round(Math.random() * 5 + 1);
                addVolume(-stolen);
                showChaosBanner(`🦹 VOLUME THIEF! -${stolen}% STOLEN! 🦹`, '#ff1744', 3500);
                comment(`🦹 A VOLUME THIEF appeared and stole ${stolen}%! Your hard work... GONE! 😭`);
                toast(`🦹 Someone stole ${stolen}% of your volume!`);
                shakeEl(document.querySelector('.vol-hud'));
            }
        },

        // 19. RANDOM GIFT - give some free volume
        () => {
            const gift = Math.round(Math.random() * 3 + 1);
            addVolume(gift);
            showChaosBanner(`🎁 FREE VOLUME! +${gift}%! 🎁`, '#39ff14', 3500);
            comment(`🎁 The Volume Fairy visited! +${gift}% for FREE! Don't get used to it! 🧚`);
            toast(`🎁 Free volume! +${gift}%!`);
            burstConfetti(fxCanvas.width / 2, fxCanvas.height / 2, 40);
        },

        // 20. SPIN A RANDOM CARD
        () => {
            const stations = document.querySelectorAll('.station');
            const randomStation = stations[Math.floor(Math.random() * stations.length)];
            randomStation.classList.add('card-spin');
            setTimeout(() => randomStation.classList.remove('card-spin'), 1500);
            showChaosBanner('🎡 CARD SPIN! 🎡', '#b24dff', 2000);
            comment('🎡 One of the stations just did a backflip! Did you see it?! 😂');
            toast('🎡 That card just SPUN!');
        },

        // 21. JELLY ALL CARDS
        () => {
            document.querySelectorAll('.station').forEach((s, i) => {
                setTimeout(() => {
                    s.classList.add('jelly');
                    setTimeout(() => s.classList.remove('jelly'), 600);
                }, i * 150);
            });
            showChaosBanner('🍮 JELLY MODE 🍮', '#ff6d00', 2500);
            comment('🍮 All the cards turned into JELLY! Wibbly wobbly! 🤣');
            toast('🍮 Everything is jelly!');
        },

        // 22. CONTRAST NUKE
        () => {
            if (!bodyChaos('contrast-nuke', 3000)) return;
            showChaosBanner('☢️ CONTRAST NUKE ☢️', '#ffd700', 2500);
            comment('☢️ CONTRAST NUKED! Everything is blindingly bright! Your retinas say hello! 👁️🔥');
            toast('☢️ My eyes!!');
        },

        // 23. FAKE VIRUS ALERT
        () => {
            showChaosBanner('🦠 VOLUME VIRUS DETECTED! Quarantining... 🦠', '#ff1744', 4000);
            comment('🦠 WARNING: Your volume has been infected with VolumeVirus.exe! Symptoms: random chaos! 💀');
            toast('🦠 Virus detected! (not really)');
            // Glitch effect
            let glitchCount = 0;
            const glitchInt = setInterval(() => {
                body.style.transform = `translate(${Math.random()*8-4}px, ${Math.random()*8-4}px)`;
                glitchCount++;
                if (glitchCount > 30) {
                    clearInterval(glitchInt);
                    body.style.transform = '';
                }
            }, 50);
        },

        // 24. EVERYTHING GETS BIG THEN SMALL
        () => {
            showChaosBanner('📏 SIZE CHAOS 📏', '#00e5ff', 3000);
            comment('📏 SIZE IS AN ILLUSION! Big... small... big... your brain is confused! 🤯');
            toast('📏 Make up your mind, page!');
            body.style.transition = 'transform 0.5s';
            body.style.transform = 'scale(1.3)';
            setTimeout(() => { body.style.transform = 'scale(0.7)'; }, 700);
            setTimeout(() => { body.style.transform = 'scale(1.5)'; }, 1400);
            setTimeout(() => { body.style.transform = 'scale(0.5)'; }, 2100);
            setTimeout(() => { body.style.transform = 'scale(1)'; }, 2800);
            setTimeout(() => { body.style.transition = ''; }, 3200);
        },
    ];

    // CHAOS LOOP — triggers random events every 12-25 seconds
    function chaosLoop() {
        const delay = 12000 + Math.random() * 13000;
        setTimeout(() => {
            // Pick a random chaos event
            const event = pick(chaosEvents);
            event();
            chaosLoop();
        }, delay);
    }

    // Start the chaos after 8 seconds (let user settle in first)
    setTimeout(chaosLoop, 8000);

    // Track chaos events for achievements
    let chaosCount = 0;
    const origBodyChaos = bodyChaos;
    // We already defined bodyChaos, but we increment chaos count in each event via the functions directly

    // Extra: First chaos event achievement
    let firstChaosShown = false;
    const origShowChaosBanner = showChaosBanner;

    // Monkey-patch to track chaos count
    const _origShowChaosBanner = showChaosBanner;
    // Let's just use a simpler approach
    setInterval(() => {
        // Count chaos events by checking if any chaos class is active
        const chaosClasses = ['tilt-left', 'tilt-right', 'upside-down', 'sideways', 'mirror', 'drunk',
            'earthquake', 'disco', 'zoom-in', 'zoom-out', 'inverted', 'grayscale', 'spin-slow',
            'bounce', 'hue-shift', 'wave', 'sepia', 'contrast-nuke'];
        const hasAny = chaosClasses.some(c => body.classList.contains(c));
        if (hasAny && !firstChaosShown) {
            firstChaosShown = true;
            showAchievement('🌀', 'FIRST CHAOS EVENT', 'Welcome to the chaos. It only gets worse.');
        }
    }, 2000);
});