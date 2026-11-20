(() => {
    'use strict';

    /* ============================================================
       EDIT THESE
       ============================================================ */
    const CONFIG = {
        bride: 'Sana',
        groom: 'Farukh',
        eventLine: 'Saturday, 05 December 2026 · Bride & Groom Marquee, Hassan Petroleum Serices Bypass road Near Masjid Fatima, Pakpattan',
        shareUrl: ''            // optional; defaults to the current page when served over http(s)
    };

    const QUESTIONS = [
        {
            text: 'How excited are you for my wedding? 💌', options: [
                { label: 'So excited!', score: 3 },
                { label: "Can't wait!", score: 3 },
                { label: "I'm really excited for the food.", score: 2 },
                { label: 'Open bar?', score: 1 },
                { label: 'I forgot you were getting married!', score: 0, flag: 'forgot' }
            ]
        },
        {
            text: 'Are you going to cry during the ceremony? 🥹', options: [   // brief said "try" – change here if intended
                { label: 'Obviously!', score: 3 },
                { label: 'Absolutely slaying.', score: 2 },
                { label: "I'll try my best.", score: 2 },
                { label: 'Only if everyone else does.', score: 1 },
                { label: 'YES! ❤️', score: 3 }
            ]
        },
        {
            text: 'What are you bringing as a wedding gift? 🎁', options: [
                { label: 'Cash, definitely.', score: 2 },
                { label: 'Something for the newlyweds.', score: 3 },
                { label: 'Something fun.', score: 2 },
                { label: "I'll probably be opening my wallet.", score: 1 },
                { label: 'My presence is the gift.', score: 1 }
            ]
        },
        {
            text: 'What colour dress will you wear to my wedding? 👗', options: [
                { label: 'White.', score: 0, flag: 'white' },
                { label: 'Red.', score: 2 },
                { label: 'Black.', score: 1 },
                { label: 'Bright pink.', score: 3 },
                { label: 'Whatever you want me to wear.', score: 3 }
            ]
        }
    ];

    const RESULTS = {
        vip: {
            cls: 'vip', share: 'VIP GUEST!',
            title: 'VIP GUEST! 👑',
            sub: 'You have officially earned a special place at our wedding!',
            note: 'Front-row seat, reserved just for you.'
        },
        invited: {
            cls: 'invited', share: "YOU'RE INVITED!",
            title: "YOU'RE INVITED! ❤️",
            sub: 'You passed the wedding guest test!',
            note: "We can't wait to celebrate with you."
        },
        fail: {
            cls: 'fail', share: 'YOU FAILED.',
            title: 'YOU FAILED. ❌',
            sub: "You're uninvited.",
            note: "What's wrong with you? 😂"
        }
    };

    function verdict(answers) {
        const total = answers.reduce((s, a) => s + a.score, 0);
        const max = QUESTIONS.length * 3;
        if (answers.some(a => a.flag === 'white')) return { key: 'fail', total, max, note: 'You wore white to a wedding. Bold move. Uninvited. 😂' };
        if (answers.some(a => a.flag === 'forgot')) return { key: 'fail', total, max, note: 'You forgot I was getting married?! Uninvited. 😂' };
        if (total >= 11) return { key: 'vip', total, max };
        if (total >= 6) return { key: 'invited', total, max };
        return { key: 'fail', total, max };
    }

    /* ============================================================
       HELPERS
       ============================================================ */
    const $ = s => document.querySelector(s);
    const rand = (a, b) => a + Math.random() * (b - a);
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const T = ms => RM ? ms * 0.15 : ms;
    const wait = ms => new Promise(r => setTimeout(r, ms));

    /* personalise text */
    document.title = `${CONFIG.bride} & ${CONFIG.groom} — You're Invited`;
    document.querySelectorAll('[data-bride]').forEach(el => el.textContent = CONFIG.bride);
    document.querySelectorAll('[data-groom]').forEach(el => el.textContent = CONFIG.groom);
    document.querySelectorAll('[data-mono]').forEach(el => el.textContent = `${CONFIG.bride[0]}&${CONFIG.groom[0]}`);

    /* ============================================================
       PARTICLES — ambient petals + gold dust (back), bursts + confetti (front)
       ============================================================ */
    const FX = (() => {
        const cb = $('#fxBack'), cf = $('#fxFront');
        const xb = cb.getContext('2d'), xf = cf.getContext('2d');
        let W = 0, H = 0, dpr = 1, dirty = false;
        const amb = [], parts = [];

        const GOLD = [[43, 68, 60], [40, 75, 55], [46, 80, 72], [38, 65, 50]];
        const PINK = [[346, 62, 80], [350, 58, 72], [340, 55, 86], [355, 65, 76], [20, 70, 86]];
        const CONF = [...GOLD, ...PINK, [100, 18, 72], [0, 0, 100]];
        const pick = a => a[(Math.random() * a.length) | 0];
        const hsl = (c, a = 1) => `hsla(${c[0]},${c[1]}%,${c[2]}%,${a})`;

        function petalPath(c, s) {
            c.beginPath(); c.moveTo(0, -s);
            c.bezierCurveTo(s * .95, -s * .55, s * .8, s * .7, 0, s);
            c.bezierCurveTo(-s * .8, s * .7, -s * .95, -s * .55, 0, -s);
            c.closePath();
        }
        function starPath(c, s) {
            c.beginPath();
            for (let i = 0; i < 8; i++) {
                const r = i % 2 ? s * .28 : s, a = i * Math.PI / 4;
                c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
            }
            c.closePath();
        }

        const newPetal = y => ({
            k: 'petal', x: rand(0, W), y, vy: rand(.35, 1), vx: rand(-.25, .35), size: rand(5, 10),
            rot: rand(0, 6.28), vr: rand(-.02, .02), ph: rand(0, 6.28), c: pick(PINK), a: rand(.45, .8), t: 0
        });
        const newDust = () => ({
            k: 'dust', x: rand(0, W), y: rand(0, H), vy: rand(.1, .4), size: rand(1, 2.8),
            ph: rand(0, 6.28), a: rand(.3, .9), t: 0
        });

        function resize() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            W = innerWidth; H = innerHeight;
            for (const [c, x] of [[cb, xb], [cf, xf]]) {
                c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
                x.setTransform(dpr, 0, 0, dpr, 0, 0);
            }
        }
        function seed() {
            amb.length = 0;
            const np = RM ? 0 : (W < 600 ? 12 : 22), nd = W < 600 ? 24 : 46;
            for (let i = 0; i < np; i++) amb.push(newPetal(rand(-20, H)));
            for (let i = 0; i < nd; i++) amb.push(newDust());
        }

        function stepAmbient() {
            xb.clearRect(0, 0, W, H);
            for (const p of amb) {
                p.t++;
                if (p.k === 'petal') {
                    p.x += p.vx + Math.sin(p.t * .012 + p.ph) * .5; p.y += p.vy; p.rot += p.vr;
                    if (p.y > H + 20) Object.assign(p, newPetal(-20));
                    xb.save(); xb.translate(p.x, p.y); xb.rotate(p.rot);
                    xb.scale(1, .35 + .65 * Math.abs(Math.cos(p.t * .02 + p.ph)));
                    xb.globalAlpha = p.a; xb.fillStyle = hsl(p.c); petalPath(xb, p.size); xb.fill(); xb.restore();
                } else {
                    if (!RM) { p.y -= p.vy; p.x += Math.sin(p.t * .01 + p.ph) * .15; if (p.y < -5) { p.y = H + 5; p.x = rand(0, W); } }
                    const tw = .5 + .5 * Math.sin(p.t * .03 + p.ph);
                    xb.globalAlpha = p.a * tw * .25; xb.fillStyle = 'rgb(222,184,100)';
                    xb.beginPath(); xb.arc(p.x, p.y, p.size * 2.6, 0, 6.283); xb.fill();
                    xb.globalAlpha = p.a * tw; xb.beginPath(); xb.arc(p.x, p.y, p.size, 0, 6.283); xb.fill();
                }
            }
            xb.globalAlpha = 1;
        }

        function stepParts() {
            if (!parts.length) { if (dirty) { xf.clearRect(0, 0, W, H); dirty = false; } return; }
            dirty = true; xf.clearRect(0, 0, W, H);
            for (let i = parts.length - 1; i >= 0; i--) {
                const p = parts[i]; p.life++;
                if (p.life > p.max) { parts.splice(i, 1); continue; }
                p.vx *= p.fr; p.vy = p.vy * p.fr + p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
                const k = 1 - p.life / p.max, a = Math.min(1, k * 1.8);
                if (p.k === 'spark') {
                    xf.strokeStyle = hsl(p.c, a); xf.lineWidth = p.size * k + .6; xf.lineCap = 'round';
                    xf.beginPath(); xf.moveTo(p.x - p.vx * 2, p.y - p.vy * 2); xf.lineTo(p.x, p.y); xf.stroke();
                } else if (p.k === 'star') {
                    xf.save(); xf.translate(p.x, p.y); xf.rotate(p.rot);
                    xf.fillStyle = hsl(p.c, a); xf.shadowColor = hsl(p.c, a); xf.shadowBlur = 8;
                    starPath(xf, p.size * 3 * (.4 + k * .6)); xf.fill(); xf.restore();
                } else if (p.k === 'petal') {
                    xf.save(); xf.translate(p.x + Math.sin(p.life * .08 + p.ph) * 5, p.y); xf.rotate(p.rot);
                    xf.scale(1, .35 + .65 * Math.abs(Math.cos(p.life * .1 + p.ph)));
                    xf.fillStyle = hsl(p.c, a * .9); petalPath(xf, p.size); xf.fill(); xf.restore();
                } else {
                    xf.save(); xf.translate(p.x, p.y); xf.rotate(p.rot); xf.scale(1, Math.cos(p.life * .18 + p.ph));
                    xf.fillStyle = hsl(p.c, a); xf.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * .66); xf.restore();
                }
            }
        }

        function burst(x, y, n = 60, power = 1) {
            n = Math.round(n * (RM ? .25 : 1));
            for (let i = 0; i < n; i++) {
                const a = rand(0, 6.283), s = rand(2, 10) * power, r = Math.random();
                const k = r < .45 ? 'spark' : r < .7 ? 'star' : 'petal';
                parts.push({
                    k, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5,
                    g: k === 'petal' ? .06 : .1, fr: k === 'petal' ? .97 : .965, life: 0,
                    max: k === 'petal' ? rand(110, 180) : rand(45, 100),
                    size: k === 'petal' ? rand(5, 9) : rand(1.5, 3.5),
                    rot: rand(0, 6.28), vr: rand(-.12, .12), ph: rand(0, 6.28),
                    c: k === 'petal' ? pick(PINK) : pick(GOLD)
                });
            }
        }
        const sparkle = (x, y) => burst(x, y, 16, .5);
        function confetti(n = 110) {
            n = RM ? 24 : n;
            for (let b = 0; b < 6; b++) setTimeout(() => {
                for (let i = 0; i < n / 6; i++) parts.push({
                    k: 'conf', x: rand(0, W), y: rand(-40, -5), vx: rand(-1.2, 1.2), vy: rand(1.5, 4),
                    g: .04, fr: .995, life: 0, max: rand(170, 260), size: rand(5, 9),
                    rot: rand(0, 6.28), vr: rand(-.1, .1), ph: rand(0, 6.28), c: pick(CONF)
                });
            }, b * 220);
        }

        function loop() { stepAmbient(); stepParts(); requestAnimationFrame(loop); }
        resize(); seed(); loop();
        addEventListener('resize', () => { resize(); if (!amb.length) seed(); });
        return { burst, sparkle, confetti };
    })();

    /* ============================================================
       PARALLAX + ENVELOPE TILT (mouse; gentle idle sway on touch)
       ============================================================ */
    const tiltEl = $('#tilt');
    const pxEls = [...document.querySelectorAll('.px')];
    const mouse = { x: 0, y: 0, tx: 0, ty: 0, k: 1 };
    let tiltOn = true, lastMove = -1e9;

    addEventListener('pointermove', e => {
        if (e.pointerType === 'touch') return;
        lastMove = performance.now();
        mouse.tx = (e.clientX / innerWidth - .5) * 2;
        mouse.ty = (e.clientY / innerHeight - .5) * 2;
    });
    (function motion(now) {
        if (!RM) {
            if (now - lastMove > 2500) { mouse.tx = Math.sin(now / 1800) * .35; mouse.ty = Math.cos(now / 2300) * .2; }
            mouse.x += (mouse.tx - mouse.x) * .07;
            mouse.y += (mouse.ty - mouse.y) * .07;
            mouse.k += ((tiltOn ? 1 : 0) - mouse.k) * .08;
            tiltEl.style.transform = `perspective(1000px) rotateX(${(-mouse.y * 9 * mouse.k).toFixed(2)}deg) rotateY(${(mouse.x * 14 * mouse.k).toFixed(2)}deg)`;
            for (const el of pxEls) {
                const d = +el.dataset.depth;
                el.style.translate = `${(-mouse.x * d).toFixed(1)}px ${(-mouse.y * d).toFixed(1)}px`;
            }
        }
        requestAnimationFrame(motion);
    })(performance.now());

    /* hover tilt for question + result cards */
    function attachTilt(el, max = 8) {
        if (RM) return;
        const base = 'perspective(1100px)';
        const rest = () => { el.style.transform = `${base} rotateX(0deg) rotateY(0deg)`; };
        rest();
        el.addEventListener('pointermove', e => {
            if (e.pointerType === 'touch') return;
            const r = el.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
            el.style.transform = `${base} rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max * 1.3).toFixed(2)}deg)`;
        });
        el.addEventListener('pointerleave', rest);
        el.addEventListener('pointercancel', rest);
    }
    attachTilt($('#qTilt'), 7);
    attachTilt($('#rTilt'), 9);

    /* ============================================================
       STAGE MANAGER
       ============================================================ */
    const stages = { landing: $('#s-landing'), quiz: $('#s-quiz'), result: $('#s-result') };
    function showStage(name) {
        for (const [k, el] of Object.entries(stages)) {
            el.classList.toggle('active', k === name);
            el.inert = k !== name;
        }
        document.body.dataset.stage = name;
    }
    showStage('landing');

    /* ============================================================
       LANDING — the envelope sequence
       ============================================================ */
    const landing = $('#s-landing'), cardEl = $('#card'), openBtn = $('#openBtn'), sealEl = $('#seal');
    const PHASES = ['p-crack', 'p-flap', 'p-flapback', 'p-slide', 'p-front', 'p-unfold', 'p-expand'];
    let opening = false;

    async function openInvitation() {
        if (opening) return;
        opening = true; openBtn.disabled = true; tiltOn = false;

        const sr = sealEl.getBoundingClientRect();
        const sx = sr.left + sr.width / 2, sy = sr.top + sr.height / 2;

        // 1) the wax seal cracks
        sealEl.classList.add('cracked');
        landing.classList.add('p-crack');
        await wait(T(350));
        FX.burst(sx, sy, 60, 1);

        // 2) the flap swings open in 3D
        await wait(T(450));
        landing.classList.add('p-flap');
        await wait(T(550));
        landing.classList.add('p-flapback');       // flap now sits behind the card

        // 3) the folded card slides up out of the envelope
        await wait(T(650));
        const er = $('.env').getBoundingClientRect();
        landing.classList.add('p-slide');
        FX.burst(er.left + er.width / 2, er.top, 50, .9);
        await wait(T(1350));
        landing.classList.add('p-front');

        // 4) the card unfolds
        await wait(T(100));
        landing.classList.add('p-unfold');
        await wait(T(1250));

        // 5) it floats to the centre and grows while the envelope falls away
        const r = cardEl.getBoundingClientRect();
        const vw = innerWidth, vh = innerHeight;
        const s = Math.min((vw * .9) / r.width, (vh * .62) / r.height, 2.1);
        cardEl.style.setProperty('--dx', (vw / 2 - (r.left + r.width / 2)) + 'px');
        cardEl.style.setProperty('--dy', (vh / 2 - (r.top + r.height / 2)) + 'px');
        cardEl.style.setProperty('--s', s.toFixed(3));
        landing.classList.add('p-expand');
        await wait(T(1400));
        FX.burst(vw / 2, vh / 2, 110, 1.2);

        // 6) into the questionnaire
        await wait(T(700));
        startQuiz();
    }
    openBtn.addEventListener('click', openInvitation);
    sealEl.addEventListener('click', openInvitation);

    function resetLanding() {
        landing.classList.add('no-anim');
        PHASES.forEach(c => landing.classList.remove(c));
        sealEl.classList.remove('cracked');
        ['--dx', '--dy', '--s'].forEach(p => cardEl.style.removeProperty(p));
        void landing.offsetWidth;
        landing.classList.remove('no-anim');
        // replay the entrance animations
        for (const el of [$('.l-head'), $('.float'), $('.shadow'), openBtn]) {
            el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
        }
        openBtn.disabled = false; opening = false; tiltOn = true;
    }

    /* ============================================================
       QUESTIONNAIRE
       ============================================================ */
    const qCard = $('#qCard'), pLabel = $('#pLabel'), pFill = $('#pFill'), pSteps = $('#pSteps');
    let qi = 0, answers = [], qLock = false;

    pSteps.innerHTML = QUESTIONS.map((_, i) => `<span class="step">${i + 1}</span>`).join('');

    function updateProgress(answered = false) {
        const n = QUESTIONS.length, done = answered ? qi + 1 : qi;
        pLabel.textContent = `Question ${Math.min(qi + 1, n)} of ${n}`;
        pFill.style.width = (done / n * 100) + '%';
        [...pSteps.children].forEach((s, i) => {
            s.classList.toggle('done', i < done);
            s.classList.toggle('now', i === qi && !answered);
        });
    }

    function renderQuestion() {
        const q = QUESTIONS[qi];
        qCard.className = 'q-card';
        qCard.innerHTML = `
    <p class="q-kicker">Question ${qi + 1} <span>of ${QUESTIONS.length}</span></p>
    <h2 class="q-text" tabindex="-1">${esc(q.text)}</h2>
    <div class="opts" role="group" aria-label="Answers">
      ${q.options.map((o, i) => `
        <button class="opt" type="button" data-i="${i}" style="--i:${i}">
          <span class="badge">${'ABCDE'[i]}</span><span class="lbl">${esc(o.label)}</span>
        </button>`).join('')}
    </div>`;
        void qCard.offsetWidth;
        qCard.classList.add('enter');
        qLock = false;
        updateProgress(false);
        qCard.querySelector('.q-text').focus({ preventScroll: true });
    }

    function startQuiz() {
        qi = 0; answers = [];
        renderQuestion();
        showStage('quiz');
    }

    qCard.addEventListener('click', async e => {
        const b = e.target.closest('.opt');
        if (!b || qLock) return;
        qLock = true;

        const o = QUESTIONS[qi].options[+b.dataset.i];
        answers.push(o);

        const r = b.getBoundingClientRect();
        const px = e.detail ? e.clientX : r.left + r.width / 2;
        const py = e.detail ? e.clientY : r.top + r.height / 2;
        b.style.setProperty('--cx', (px - r.left) + 'px');
        b.style.setProperty('--cy', (py - r.top) + 'px');
        b.classList.add('selected');
        b.querySelector('.badge').textContent = '✓';
        qCard.querySelector('.opts').classList.add('locked');
        FX.sparkle(px, py);
        updateProgress(true);

        await wait(T(900));
        qCard.classList.remove('enter');
        qCard.classList.add('leave');
        await wait(T(480));

        qi++;
        if (qi < QUESTIONS.length) renderQuestion(); else showResult();
    });

    /* ============================================================
       VERDICT
       ============================================================ */
    const rCard = $('#rCard'), rMsg = $('#rMsg'), acceptBtn = $('#acceptBtn'),
        retryBtn = $('#retryBtn'), shareBtn = $('#shareBtn'), rBar = $('#rBar');
    let current = null, accepted = false;

    /* floating hearts */
    (() => {
        const host = $('#hearts');
        for (let i = 0; i < 18; i++) {
            const s = document.createElement('span');
            s.className = 'h'; s.textContent = '♥';
            s.style.cssText = `--x:${rand(2, 98).toFixed(1)}%;--sz:${rand(12, 30).toFixed(0)}px;--o:${rand(.25, .7).toFixed(2)};` +
                `--d:${rand(9, 18).toFixed(1)}s;--dl:${(-rand(0, 14)).toFixed(1)}s;--dx:${rand(-60, 60).toFixed(0)}px`;
            host.appendChild(s);
        }
    })();

    function showResult() {
        const v = verdict(answers), R = RESULTS[v.key];
        current = { v, R };
        accepted = false;

        $('#rTitle').textContent = R.title;
        $('#rSub').textContent = R.sub;
        $('#rNote').textContent = v.note || R.note;
        $('#rScoreTxt').textContent = `Guest score ${v.total} / ${v.max}`;
        rMsg.textContent = '';
        acceptBtn.textContent = 'Accept invitation';
        acceptBtn.classList.remove('done');
        retryBtn.classList.remove('nudge');

        rCard.className = `r-card ${R.cls}`;
        void rCard.offsetWidth;
        rCard.classList.add('in');

        rBar.style.transition = 'none'; rBar.style.width = '0%'; void rBar.offsetWidth; rBar.style.transition = '';
        requestAnimationFrame(() => requestAnimationFrame(() => { rBar.style.width = (v.total / v.max * 100) + '%'; }));

        showStage('result');

        if (v.key !== 'fail') {
            setTimeout(() => {
                FX.confetti(v.key === 'vip' ? 170 : 110);
                FX.burst(innerWidth / 2, innerHeight * .35, 90, 1.2);
            }, T(500));
        }
    }

    acceptBtn.addEventListener('click', () => {
        if (!current) return;
        if (current.v.key === 'fail') {
            rCard.classList.remove('in', 'shake'); void rCard.offsetWidth; rCard.classList.add('shake');
            rMsg.textContent = "Nice try! You can't accept an invitation you failed to earn 😂 Try again!";
            retryBtn.classList.remove('nudge'); void retryBtn.offsetWidth; retryBtn.classList.add('nudge');
            return;
        }
        if (accepted) return;
        accepted = true;
        acceptBtn.textContent = 'Accepted ✓';
        acceptBtn.classList.add('done');
        rMsg.textContent = `Wonderful! ${CONFIG.eventLine} — see you there 💌`;
        const r = acceptBtn.getBoundingClientRect();
        FX.burst(r.left + r.width / 2, r.top + r.height / 2, 90, 1.1);
        FX.confetti(150);
    });

    retryBtn.addEventListener('click', () => { startQuiz(); });

    /* share */
    const toastEl = $('#toast'); let toastTimer;
    function toast(msg) {
        toastEl.textContent = msg; toastEl.classList.add('show');
        clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
    }
    async function copyText(text) {
        try { await navigator.clipboard.writeText(text); return true; }
        catch {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta);
            ta.select();
            let ok = false; try { ok = document.execCommand('copy'); } catch { }
            ta.remove(); return ok;
        }
    }
    shareBtn.addEventListener('click', async () => {
        if (!current) return;
        const text = `I got "${current.R.share}" on ${CONFIG.bride} & ${CONFIG.groom}'s wedding guest test! Can you beat my score?`;
        const url = CONFIG.shareUrl || (/^https?:/.test(location.href) ? location.href : '');
        if (navigator.share) {
            try { await navigator.share({ title: 'Wedding Guest Test', text, url: url || undefined }); return; }
            catch (err) { if (err && err.name === 'AbortError') return; }
        }
        const ok = await copyText(url ? `${text} ${url}` : text);
        toast(ok ? 'Result copied to clipboard ✓' : 'Could not copy — please share manually');
    });

    /* ============================================================
       RESTART (back to the sealed envelope)
       ============================================================ */
    $('#restartBtn').addEventListener('click', () => {
        qLock = true; answers = []; current = null; accepted = false;
        resetLanding();
        showStage('landing');
    });

})();
