/* ============================================================
   MULTIPLAY – Klockan
   Övning + Test (analog & digital). Renderar i #clock-root.
   DESIGN.md: himmelsblå/solguld, drömhimmel-känsla.
   ============================================================ */
'use strict';

const ClockGame = (() => {

  /* ── Tillstånd ─────────────────────────────────────── */
  let profile    = null;
  let practiceH  = 12;
  let practiceM  = 0;
  let clockType  = 'analog';   // 'analog' | 'digital'

  const LOG_KEY  = id => `clock_log_${id}`;

  /* ── Logg ──────────────────────────────────────────── */
  function sessionLog() {
    return MP.createLog(LOG_KEY(profile.id), 40);
  }

  function getLog() { return sessionLog().get(); }

  function addLog(entry) { sessionLog().add(entry); }

  // Resultatnivå → befintlig CSS-klass
  const RESULT_CLS = {
    excellent: 'result-excellent',
    good:      'result-good',
    ok:        'result-ok',
    practice:  'result-tryagain',
  };

  /* ══════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════ */
  function init(p) {
    profile   = p;
    practiceH = 12;
    practiceM = 0;
    renderPractice();
  }

  /* ══════════════════════════════════════════════════════
     ÖVNINGSLÄGE
  ══════════════════════════════════════════════════════ */
  function renderPractice() {
    const root = document.getElementById('clock-root');
    root.innerHTML = `
      <div class="app-header" style="border-bottom-color:rgba(59,130,246,0.2)">
        <button class="btn-back" style="background:var(--clock-light);color:var(--clock-primary)" onclick="App.goBackToGameSelect()">Tillbaka</button>
        <span class="header-title" style="color:var(--clock-primary)">🕐 Klockan</span>
        <button class="btn btn-ghost btn-sm" style="border-color:var(--clock-primary);color:var(--clock-primary)" onclick="ClockGame.showHistory()">🕐 Historik</button>
      </div>

      <div style="padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-5);align-items:center">

        <!-- Tidsperiod-indikator -->
        <div id="time-period" style="
          width:100%;padding:var(--space-3) var(--space-5);
          border-radius:var(--radius-full);
          font-size:var(--text-lg);font-weight:800;
          text-align:center;
          transition:all 0.5s var(--ease-smooth);
        "></div>

        <!-- Analog klocka -->
        <div style="position:relative;width:clamp(200px,40vw,400px);height:clamp(200px,40vw,400px);margin:0 auto">
          <svg id="clock-svg" width="100%" height="100%" viewBox="0 0 220 220" style="filter:drop-shadow(0 8px 24px rgba(59,130,246,0.3))">
            <!-- Urtavla -->
            <circle cx="110" cy="110" r="105" fill="white" stroke="var(--clock-primary)" stroke-width="6"/>
            <circle cx="110" cy="110" r="100" fill="white" stroke="rgba(59,130,246,0.15)" stroke-width="1"/>
            <!-- Timmarssiffror -->
            ${[12,1,2,3,4,5,6,7,8,9,10,11].map((n,i) => {
              const angle = (i * 30 - 90) * Math.PI / 180;
              const x = 110 + 82 * Math.cos(angle);
              const y = 110 + 82 * Math.sin(angle);
              return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="central"
                font-family="Nunito,sans-serif" font-size="14" font-weight="900" fill="var(--clock-primary)">${n}</text>`;
            }).join('')}
            <!-- Minutmarkeringar -->
            ${Array.from({length:60},(_,i) => {
              const angle = (i * 6 - 90) * Math.PI / 180;
              const r1 = i%5===0 ? 90 : 95;
              const r2 = 100;
              return `<line x1="${(110+r1*Math.cos(angle)).toFixed(1)}" y1="${(110+r1*Math.sin(angle)).toFixed(1)}"
                x2="${(110+r2*Math.cos(angle)).toFixed(1)}" y2="${(110+r2*Math.sin(angle)).toFixed(1)}"
                stroke="${i%5===0?'var(--clock-primary)':'rgba(59,130,246,0.3)'}" stroke-width="${i%5===0?2.5:1}" stroke-linecap="round"/>`;
            }).join('')}
            <!-- Timvisare -->
            <line id="hand-hour" x1="110" y1="110" x2="110" y2="60"
              stroke="var(--clock-primary)" stroke-width="7" stroke-linecap="round"
              transform-origin="110 110"/>
            <!-- Minutvisare -->
            <line id="hand-minute" x1="110" y1="110" x2="110" y2="40"
              stroke="#ef4444" stroke-width="4" stroke-linecap="round"
              transform-origin="110 110"/>
            <!-- Mittpunkt -->
            <circle cx="110" cy="110" r="7" fill="var(--clock-primary)"/>
            <circle cx="110" cy="110" r="3" fill="white"/>
          </svg>
        </div>

        <!-- Digital klocka & text -->
        <div style="text-align:center">
          <div id="digital-display" style="
            font-family:var(--font-heading);font-size:var(--text-5xl);
            color:var(--clock-primary);letter-spacing:0.05em;
          ">12:00</div>
          <div id="text-display" style="
            font-size:var(--text-xl);font-weight:800;
            color:var(--clock-secondary);margin-top:var(--space-2);
          ">tolv</div>
        </div>

        <!-- Kontroller -->
        <div class="card-glass w-full" style="padding:var(--space-4);max-width:360px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
            <!-- Timmar -->
            <div style="display:flex;flex-direction:column;align-items:center;gap:var(--space-2)">
              <span style="font-size:var(--text-xs);font-weight:800;color:var(--clock-primary);text-transform:uppercase">Timmar</span>
              <button class="btn" style="background:var(--clock-light);color:var(--clock-primary);min-height:48px;width:48px;padding:0;border-radius:var(--radius-full);font-size:var(--text-xl)" onclick="ClockGame.adjustTime('h',1)">▲</button>
              <div id="ctrl-h" style="font-size:var(--text-3xl);font-weight:900;color:var(--clock-primary)">12</div>
              <button class="btn" style="background:var(--clock-light);color:var(--clock-primary);min-height:48px;width:48px;padding:0;border-radius:var(--radius-full);font-size:var(--text-xl)" onclick="ClockGame.adjustTime('h',-1)">▼</button>
            </div>
            <!-- Minuter -->
            <div style="display:flex;flex-direction:column;align-items:center;gap:var(--space-2)">
              <span style="font-size:var(--text-xs);font-weight:800;color:var(--clock-secondary);text-transform:uppercase">Minuter</span>
              <button class="btn" style="background:#fef3c7;color:var(--clock-secondary);min-height:48px;width:48px;padding:0;border-radius:var(--radius-full);font-size:var(--text-xl)" onclick="ClockGame.adjustTime('m',5)">▲</button>
              <div id="ctrl-m" style="font-size:var(--text-3xl);font-weight:900;color:var(--clock-secondary)">00</div>
              <button class="btn" style="background:#fef3c7;color:var(--clock-secondary);min-height:48px;width:48px;padding:0;border-radius:var(--radius-full);font-size:var(--text-xl)" onclick="ClockGame.adjustTime('m',-5)">▼</button>
            </div>
          </div>
          <div style="display:flex;gap:var(--space-3);margin-top:var(--space-4)">
            <button class="btn btn-ghost btn-sm w-full" style="border-color:var(--clock-primary);color:var(--clock-primary)" onclick="ClockGame.resetTime()">↺ Återställ</button>
            <button class="btn btn-sm w-full" style="background:var(--clock-light);color:var(--clock-primary);border:none" onclick="ClockGame.randomTime()">🎲 Slumpa</button>
          </div>
        </div>

        <!-- Starta test -->
        <button class="btn btn-lg w-full" style="background:linear-gradient(135deg,var(--clock-primary),var(--clock-accent));color:white;box-shadow:0 4px 15px var(--clock-glow);max-width:360px" onclick="ClockGame.showTestSetup()">
          🎯 Starta test →
        </button>

      </div>
    `;

    updateClock();
  }

  /* ── Klockuppdatering ──────────────────────────────── */
  function updateClock() {
    const h = practiceH;
    const m = practiceM;

    // Visare-vinklar
    const hourAngle   = (h % 12) * 30 + m * 0.5 - 90;
    const minuteAngle = m * 6 - 90;

    const hRad  = hourAngle   * Math.PI / 180;
    const mRad  = minuteAngle * Math.PI / 180;

    const handH = document.getElementById('hand-hour');
    const handM = document.getElementById('hand-minute');

    if (handH) {
      const hx = 110 + 55 * Math.cos(hRad);
      const hy = 110 + 55 * Math.sin(hRad);
      handH.setAttribute('x2', hx.toFixed(1));
      handH.setAttribute('y2', hy.toFixed(1));
    }
    if (handM) {
      const mx = 110 + 75 * Math.cos(mRad);
      const my = 110 + 75 * Math.sin(mRad);
      handM.setAttribute('x2', mx.toFixed(1));
      handM.setAttribute('y2', my.toFixed(1));
    }

    // Digital
    const digitalEl = document.getElementById('digital-display');
    if (digitalEl) digitalEl.innerHTML = colorizeTimeText(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);

    // Text
    const textEl = document.getElementById('text-display');
    if (textEl) textEl.innerHTML = colorizeTimeText(MP.timeToSwedish(h, m));

    // Kontroller
    const ch = document.getElementById('ctrl-h');
    const cm = document.getElementById('ctrl-m');
    if (ch) ch.textContent = String(h).padStart(2,'0');
    if (cm) cm.textContent = String(m).padStart(2,'0');

    // Tidsperiod
    updateTimePeriod(h);
  }

  function updateTimePeriod(h) {
    const el = document.getElementById('time-period');
    if (!el) return;
    let emoji, label, bg, color;
    if (h >= 0 && h < 6)       { emoji='🌙'; label='Natt';       bg='linear-gradient(135deg,#1e1b4b,#312e81)'; color='#c7d2fe'; }
    else if (h < 12)            { emoji='🌅'; label='Förmiddag';  bg='linear-gradient(135deg,#fef3c7,#fde68a)'; color='#92400e'; }
    else if (h < 18)            { emoji='☀️'; label='Eftermiddag'; bg='linear-gradient(135deg,#dbeafe,#bfdbfe)'; color='#1e3a8a'; }
    else                        { emoji='🌆'; label='Kväll';      bg='linear-gradient(135deg,#fce7f3,#f3e8ff)'; color='#7e22ce'; }
    el.style.background = bg;
    el.style.color = color;
    el.textContent = `${emoji} ${label}`;
  }

  function adjustTime(part, delta) {
    if (part === 'h') {
      practiceH = ((practiceH + delta) + 24) % 24;
    } else {
      practiceM = ((practiceM + delta) + 60) % 60;
    }
    App.Sound.play('click');
    updateClock();
  }

  function resetTime() {
    practiceH = 12; practiceM = 0;
    App.Sound.play('click');
    updateClock();
  }

  function randomTime() {
    practiceH = Math.floor(Math.random() * 24);
    practiceM = [0,5,10,15,20,25,30,35,40,45,50,55][Math.floor(Math.random()*12)];
    App.Sound.play('click');
    updateClock();
  }

  /* ══════════════════════════════════════════════════════
     TESTKONFIGURATION
  ══════════════════════════════════════════════════════ */
  function showTestSetup() {
    const root = document.getElementById('clock-root');
    App.Sound.play('click');
    root.innerHTML = `
      <div class="app-header">
        <button class="btn-back" style="background:var(--clock-light);color:var(--clock-primary)" onclick="ClockGame.renderPractice()">Tillbaka</button>
        <span class="header-title" style="color:var(--clock-primary)">🎯 Välj klocktyp</span>
        <div style="width:64px"></div>
      </div>
      <div style="padding:var(--space-8) var(--space-4);display:flex;flex-direction:column;gap:var(--space-5);align-items:center">
        <div style="font-size:4rem;animation:bounce-in 0.5s var(--ease-bounce)">⏰</div>
        <h2 style="font-family:var(--font-heading);color:var(--clock-primary);text-align:center">Vilket test vill du göra?</h2>
        <div style="display:flex;flex-direction:column;gap:var(--space-4);width:100%">
          <button class="card-game" style="background:linear-gradient(135deg,#eff6ff,#dbeafe)" onclick="ClockGame.startTestWithType('analog')">
            <div style="font-size:3rem;background:#dbeafe;border-radius:var(--radius-lg);width:64px;height:64px;display:flex;align-items:center;justify-content:center">🕐</div>
            <div>
              <div style="font-family:var(--font-heading);font-size:var(--text-2xl);color:var(--clock-primary)">Analog klocka</div>
              <div style="font-size:var(--text-sm);color:var(--color-text-muted);font-weight:700">Urtavla med visare</div>
            </div>
            <div style="font-size:var(--text-2xl);opacity:0.4">›</div>
          </button>
          <button class="card-game" style="background:linear-gradient(135deg,#fef3c7,#fde68a)" onclick="ClockGame.startTestWithType('digital')">
            <div style="font-size:3rem;background:#fde68a;border-radius:var(--radius-lg);width:64px;height:64px;display:flex;align-items:center;justify-content:center">⏰</div>
            <div>
              <div style="font-family:var(--font-heading);font-size:var(--text-2xl);color:var(--clock-secondary)">Digital klocka</div>
              <div style="font-size:var(--text-sm);color:var(--color-text-muted);font-weight:700">24-timmars format</div>
            </div>
            <div style="font-size:var(--text-2xl);opacity:0.4">›</div>
          </button>
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════
     TEST – DEL 1: LÄSA KLOCKAN (5 frågor)
  ══════════════════════════════════════════════════════ */
  function startTestWithType(type) {
    clockType = type;
    App.Sound.play('click');
    // Förgenerera frågorna så samma fråga kan ställas om vid fel
    runReadingTest(type, generateQuestions(type, 5), generateQuestions(type, 5));
  }

  /* Slumpa frågetider (fem-minutersintervall).
     Digital: 0–23 (svensk digital standard). Analog: 1–12. */
  function generateQuestions(type, count) {
    const minutes = [0,5,10,15,20,25,30,35,40,45,50,55];
    const qs = [];
    for (let i = 0; i < count; i++) {
      const h = type === 'digital'
        ? Math.floor(Math.random() * 24)
        : Math.floor(Math.random() * 12) + 1;
      const m = minutes[Math.floor(Math.random() * minutes.length)];
      qs.push({ h, m });
    }
    return qs;
  }

  function runReadingTest(type, questions, settingQuestions) {
    const TOTAL = questions.length;
    const quiz = MP.createRetryQuiz(questions);
    const results = [];          // första försöket per fråga (avgör poängen)
    const firstTried = new Set();

    function render() {
      const q = quiz.current();
      if (q === null) { runSettingTest(type, results, settingQuestions); return; }

      const correct = MP.timeToSwedish(q.h, q.m);
      const options = generateTimeOptions(q.h, q.m, correct);

      const root = document.getElementById('clock-root');
      const prog = quiz.progress();
      const progress = prog.answered / TOTAL;

      root.innerHTML = `
        <div class="app-header">
          <button class="btn-back" style="background:var(--clock-light);color:var(--clock-primary)" onclick="ClockGame.showTestSetup()">Avbryt</button>
          <span class="header-title" style="color:var(--clock-primary)">Del 1 – Läsa klockan</span>
          <div style="width:64px"></div>
        </div>
        <div style="padding:var(--space-4) var(--space-4) var(--space-2)">
          <div class="progress-label" style="color:var(--clock-primary)">
            <span>Fråga ${Math.min(prog.answered+1,TOTAL)} av ${TOTAL}</span>
          </div>
          <div class="progress-container" style="background:var(--clock-light)">
            <div class="progress-fill" style="width:${Math.round(progress*100)}%;background:linear-gradient(90deg,var(--clock-primary),var(--clock-accent))"></div>
          </div>
        </div>
        <div style="padding:var(--space-4);display:flex;flex-direction:column;align-items:center;gap:var(--space-5)">
          <p style="font-weight:800;color:var(--clock-primary);font-size:var(--text-lg)">Vad visar klockan?</p>

          ${type === 'analog'
            ? drawAnalogClock(q.h, q.m, 180)
            : `<div style="font-family:var(--font-heading);font-size:var(--text-6xl);color:var(--clock-primary);letter-spacing:0.08em;padding:var(--space-6) var(--space-8);background:white;border-radius:var(--radius-xl);box-shadow:var(--shadow-md)">${String(q.h).padStart(2,'0')}:${String(q.m).padStart(2,'0')}</div>`
          }

          <div style="display:flex;flex-direction:column;gap:var(--space-3);width:100%">
            ${options.map((opt, i) => {
              const colors = ['#eff6ff','#fef3c7','#f0fdf4','#fdf4ff'];
              return `
                <button class="answer-option" id="opt-${i}"
                  style="border-color:rgba(59,130,246,0.3);background:${colors[i]}"
                  onclick="ClockGame._handleReadChoice(${i})">
                  ${colorizeTimeText(opt)}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;

      ClockGame._handleReadChoice = (idx) => {
        const chosen = options[idx];
        const wasCorrect = chosen === correct;
        App.Sound.play(wasCorrect ? 'correct' : 'wrong');

        document.querySelectorAll('.answer-option').forEach((btn, i) => {
          btn.disabled = true;
          if (options[i] === correct)   btn.classList.add('correct');
          if (i === idx && !wasCorrect) btn.classList.add('wrong');
        });

        // Första försöket på denna fråga avgör poängen
        if (!firstTried.has(q)) {
          firstTried.add(q);
          results.push({ h: q.h, m: q.m, chosen, correct: wasCorrect });
        }
        quiz.answer(wasCorrect);

        setTimeout(render, wasCorrect ? 700 : 1400);
      };
    }

    render();
  }

  /* ══════════════════════════════════════════════════════
     TEST – DEL 2: STÄLLA KLOCKAN (5 frågor)
  ══════════════════════════════════════════════════════ */
  function runSettingTest(type, part1Results, questions) {
    const TOTAL = questions.length;
    const quiz = MP.createRetryQuiz(questions);
    const results = [];          // första försöket per fråga (avgör poängen)
    const firstTried = new Set();

    let settingH = 12, settingM = 0;

    function render() {
      const q = quiz.current();
      if (q === null) { showTestResult(type, part1Results, results); return; }

      // Nollställ inställningen inför varje fråga (även omfråga efter fel)
      settingH = 12; settingM = 0;

      const text = MP.timeToSwedish(q.h, q.m);
      const root = document.getElementById('clock-root');
      const prog = quiz.progress();
      const progress = (5 + prog.answered) / 10;

      root.innerHTML = `
        <div class="app-header">
          <button class="btn-back" style="background:var(--clock-light);color:var(--clock-primary)" onclick="ClockGame.showTestSetup()">Avbryt</button>
          <span class="header-title" style="color:var(--clock-primary)">Del 2 – Ställ klockan</span>
          <div style="width:64px"></div>
        </div>
        <div style="padding:var(--space-4) var(--space-4) var(--space-2)">
          <div class="progress-label" style="color:var(--clock-primary)">
            <span>Fråga ${Math.min(prog.answered+1,TOTAL)+5} av 10</span>
          </div>
          <div class="progress-container" style="background:var(--clock-light)">
            <div class="progress-fill" style="width:${Math.round(progress*100)}%;background:linear-gradient(90deg,var(--clock-primary),var(--clock-accent))"></div>
          </div>
        </div>
        <div style="padding:var(--space-4);display:flex;flex-direction:column;align-items:center;gap:var(--space-5)">
          <p style="font-weight:800;color:var(--clock-primary);font-size:var(--text-lg);text-align:center">Ställ klockan till:</p>
          <div style="font-family:var(--font-heading);font-size:var(--text-4xl);padding:var(--space-4) var(--space-8);background:white;border-radius:var(--radius-xl);box-shadow:var(--shadow-md)">
            ${colorizeTimeText(text)}
          </div>

          ${type === 'analog'
            ? `<div id="setting-clock-wrap">${drawSettingClock(settingH, settingM)}</div>`
            : `<div id="digital-setting-wrap">${drawDigitalSetting(settingH, settingM)}</div>`
          }

          <!-- Kontroller -->
          ${type === 'analog'
            ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);width:100%">
                <div style="display:flex;flex-direction:column;align-items:center;gap:var(--space-2)">
                  <span style="font-size:var(--text-xs);font-weight:800;color:var(--clock-primary)">Timmar</span>
                  <button class="btn" style="background:var(--clock-light);color:var(--clock-primary);width:48px;height:48px;min-height:48px;padding:0;border-radius:var(--radius-full);font-size:var(--text-xl)" onclick="ClockGame._adjustSetting('h',1)">▲</button>
                  <button class="btn" style="background:var(--clock-light);color:var(--clock-primary);width:48px;height:48px;min-height:48px;padding:0;border-radius:var(--radius-full);font-size:var(--text-xl)" onclick="ClockGame._adjustSetting('h',-1)">▼</button>
                </div>
                <div style="display:flex;flex-direction:column;align-items:center;gap:var(--space-2)">
                  <span style="font-size:var(--text-xs);font-weight:800;color:var(--clock-secondary)">Minuter</span>
                  <button class="btn" style="background:#fef3c7;color:var(--clock-secondary);width:48px;height:48px;min-height:48px;padding:0;border-radius:var(--radius-full);font-size:var(--text-xl)" onclick="ClockGame._adjustSetting('m',5)">▲</button>
                  <button class="btn" style="background:#fef3c7;color:var(--clock-secondary);width:48px;height:48px;min-height:48px;padding:0;border-radius:var(--radius-full);font-size:var(--text-xl)" onclick="ClockGame._adjustSetting('m',-5)">▼</button>
                </div>
              </div>`
            : `<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);width:100%">
                <div style="display:flex;flex-direction:column;align-items:center;gap:var(--space-2)">
                  <span style="font-size:var(--text-xs);font-weight:800;color:var(--clock-primary)">Timmar</span>
                  <button class="btn" style="background:var(--clock-light);color:var(--clock-primary);width:48px;height:48px;min-height:48px;padding:0;border-radius:var(--radius-full)" onclick="ClockGame._adjustSetting('h',1)">▲</button>
                  <button class="btn" style="background:var(--clock-light);color:var(--clock-primary);width:48px;height:48px;min-height:48px;padding:0;border-radius:var(--radius-full)" onclick="ClockGame._adjustSetting('h',-1)">▼</button>
                </div>
                <div style="display:flex;flex-direction:column;align-items:center;gap:var(--space-2)">
                  <span style="font-size:var(--text-xs);font-weight:800;color:var(--clock-secondary)">Minuter</span>
                  <button class="btn" style="background:#fef3c7;color:var(--clock-secondary);width:48px;height:48px;min-height:48px;padding:0;border-radius:var(--radius-full)" onclick="ClockGame._adjustSetting('m',5)">▲</button>
                  <button class="btn" style="background:#fef3c7;color:var(--clock-secondary);width:48px;height:48px;min-height:48px;padding:0;border-radius:var(--radius-full)" onclick="ClockGame._adjustSetting('m',-5)">▼</button>
                </div>
              </div>`
          }

          <button class="btn btn-lg w-full" style="background:linear-gradient(135deg,var(--clock-primary),var(--clock-accent));color:white" onclick="ClockGame._lockSetting()">
            ✅ OK – Lås svar
          </button>
        </div>
      `;

      ClockGame._adjustSetting = (part, delta) => {
        if (part === 'h') {
          // Digital: 0–23 (svensk digital standard). Analog: 1–12.
          if (type === 'digital') settingH = ((settingH + delta) + 24) % 24;
          else settingH = ((settingH - 1 + delta) + 12) % 12 + 1;
        } else {
          settingM = ((settingM + delta) + 60) % 60;
        }
        App.Sound.play('click');
        if (type === 'analog') {
          document.getElementById('setting-clock-wrap').innerHTML = drawSettingClock(settingH, settingM);
        } else {
          document.getElementById('digital-setting-wrap').innerHTML = drawDigitalSetting(settingH, settingM);
        }
      };

      let lockGuard = false; // återställs vid varje render — blockerar dubbeltryck under feedback
      ClockGame._lockSetting = () => {
        if (lockGuard) return;
        lockGuard = true;
        // Tidtexten skiljer inte på fm/em – jämför timmen modulo 12
        const wasCorrect = (settingH % 12) === (q.h % 12) && settingM === q.m;
        App.Sound.play(wasCorrect ? 'correct' : 'wrong');

        if (!firstTried.has(q)) {
          firstTried.add(q);
          results.push({ h: q.h, m: q.m, setH: settingH, setM: settingM, correct: wasCorrect });
        }
        quiz.answer(wasCorrect);

        if (!wasCorrect) {
          // Visa korrekt svar kort, ställ sedan om SAMMA fråga
          if (type === 'analog') {
            document.getElementById('setting-clock-wrap').innerHTML = drawSettingClock(q.h, q.m, '#ef4444', '#22c55e');
          } else {
            document.getElementById('digital-setting-wrap').innerHTML = drawDigitalSetting(q.h, q.m);
          }
          setTimeout(render, 1500);
        } else {
          setTimeout(render, 700);
        }
      };
    }

    render();
  }

  /* ══════════════════════════════════════════════════════
     TESTRESULTAT
  ══════════════════════════════════════════════════════ */
  function showTestResult(type, part1, part2) {
    const totalCorrect = part1.filter(r=>r.correct).length + part2.filter(r=>r.correct).length;
    const total = 10;
    const pct   = Math.round((totalCorrect / total) * 100);

    App.Sound.play(pct >= 80 ? 'fanfare' : 'correct');
    if (pct === 100) App.Confetti.burst(80);

    addLog({ type: clockType, totalCorrect, total, pct, part1, part2 });

    const cls = RESULT_CLS[MP.resultTier(pct)];
    const { emoji, msg } = MP.feedbackMessage(pct);

    const root = document.getElementById('clock-root');
    root.innerHTML = `
      <div class="app-header">
        <button class="btn-back" style="background:var(--clock-light);color:var(--clock-primary)" onclick="ClockGame.renderPractice()">Tillbaka</button>
        <span class="header-title" style="color:var(--clock-primary)">🏆 Resultat</span>
        <div style="width:64px"></div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;padding:var(--space-8) var(--space-4);gap:var(--space-6)">
        <div class="result-display ${cls} w-full">
          <div style="font-size:4rem;margin-bottom:var(--space-3)">${emoji}</div>
          <div class="result-score">${totalCorrect} / ${total}</div>
          <div class="result-message">${msg}</div>
          <div class="result-sub">${pct}% rätt</div>
        </div>

        <!-- Detaljvy -->
        <div class="card w-full" style="padding:var(--space-4)">
          <div style="font-weight:800;color:var(--clock-primary);margin-bottom:var(--space-3)">Detaljresultat</div>
          <div style="margin-bottom:var(--space-2);font-size:var(--text-sm);font-weight:800;color:var(--color-text-muted)">Del 1 – Läsa klockan</div>
          ${part1.slice(0,5).map(r => `
            <div class="stat-row">
              <span>${String(r.h).padStart(2,'0')}:${String(r.m).padStart(2,'0')}</span>
              <span style="color:${r.correct?'var(--color-success)':'var(--color-error)'}">${r.correct?'✓':'✗'} ${MP.timeToSwedish(r.h,r.m)}</span>
            </div>
          `).join('')}
          <div style="margin-top:var(--space-3);margin-bottom:var(--space-2);font-size:var(--text-sm);font-weight:800;color:var(--color-text-muted)">Del 2 – Ställa klockan</div>
          ${part2.slice(0,5).map(r => `
            <div class="stat-row">
              <span>${MP.timeToSwedish(r.h,r.m)}</span>
              <span style="color:${r.correct?'var(--color-success)':'var(--color-error)'}">${r.correct?'✓ Rätt':'✗ '+String(r.setH).padStart(2,'0')+':'+String(r.setM).padStart(2,'0')}</span>
            </div>
          `).join('')}
        </div>

        <div style="display:flex;flex-direction:column;gap:var(--space-3);width:100%">
          <button class="btn btn-lg w-full" style="background:linear-gradient(135deg,var(--clock-primary),var(--clock-accent));color:white" onclick="ClockGame.startTestWithType('${type}')">
            🔄 Spela igen
          </button>
          <button class="btn btn-ghost w-full" style="border-color:var(--clock-primary);color:var(--clock-primary)" onclick="ClockGame.renderPractice()">
            ↩ Tillbaka till övning
          </button>
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════
     HISTORIK
  ══════════════════════════════════════════════════════ */
  function showHistory() {
    const log = getLog();
    App.Sound.play('click');
    const root = document.getElementById('clock-root');

    if (log.length === 0) {
      root.innerHTML = `
        <div class="app-header">
          <button class="btn-back" style="background:var(--clock-light);color:var(--clock-primary)" onclick="ClockGame.renderPractice()">Tillbaka</button>
          <span class="header-title" style="color:var(--clock-primary)">📜 Historik</span>
          <div style="width:64px"></div>
        </div>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:var(--space-4);padding:var(--space-8)">
          <div style="font-size:4rem">📭</div>
          <p style="color:var(--color-text-muted);font-weight:700">Inga test gjorda ännu!</p>
          <button class="btn w-full" style="background:linear-gradient(135deg,var(--clock-primary),var(--clock-accent));color:white" onclick="ClockGame.showTestSetup()">Gör ett test nu!</button>
        </div>
      `;
      return;
    }

    root.innerHTML = `
      <div class="app-header">
        <button class="btn-back" style="background:var(--clock-light);color:var(--clock-primary)" onclick="ClockGame.renderPractice()">Tillbaka</button>
        <span class="header-title" style="color:var(--clock-primary)">📜 Historik</span>
        <div style="width:64px"></div>
      </div>
      <div style="padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-3)">
        ${log.map((e, i) => {
          const d = new Date(e.date);
          const dateStr = d.toLocaleDateString('sv-SE', { weekday:'short', day:'numeric', month:'short' });
          const timeStr = d.toLocaleTimeString('sv-SE', { hour:'2-digit', minute:'2-digit' });
          return `
            <div class="card" style="padding:var(--space-4)">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div>
                  <div style="font-weight:800">${e.type==='analog'?'🕐 Analog':'⏰ Digital'} ${i===0?'<span style="background:var(--clock-primary);color:white;font-size:10px;padding:2px 8px;border-radius:999px">NY!</span>':''}</div>
                  <div style="font-size:var(--text-xs);color:var(--color-text-muted)">${dateStr} kl. ${timeStr}</div>
                </div>
                <div style="font-size:var(--text-2xl);font-weight:900;color:${e.pct>=80?'var(--color-success)':e.pct>=60?'var(--color-accent)':'var(--color-error)'}">${e.totalCorrect}/10</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════
     SVG-HJÄLPARE
  ══════════════════════════════════════════════════════ */
  function drawAnalogClock(h, m, size = 180) {
    const hourAngle   = (h % 12) * 30 + m * 0.5 - 90;
    const minuteAngle = m * 6 - 90;
    const hr = hourAngle   * Math.PI / 180;
    const mr = minuteAngle * Math.PI / 180;
    const cx = size / 2, cy = size / 2, r = size / 2 - 5;
    const hx = cx + (r*0.5) * Math.cos(hr), hy = cy + (r*0.5) * Math.sin(hr);
    const mx = cx + (r*0.7) * Math.cos(mr), my = cy + (r*0.7) * Math.sin(mr);

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"
        style="filter:drop-shadow(0 6px 20px rgba(59,130,246,0.3));display:block;margin:0 auto">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="var(--clock-primary)" stroke-width="5"/>
        ${[12,1,2,3,4,5,6,7,8,9,10,11].map((n,i) => {
          const a = (i*30-90)*Math.PI/180;
          const tx = cx + (r-16)*Math.cos(a), ty = cy + (r-16)*Math.sin(a);
          return `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="central"
            font-family="Nunito,sans-serif" font-size="11" font-weight="900" fill="var(--clock-primary)">${n}</text>`;
        }).join('')}
        <line x1="${cx}" y1="${cy}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}"
          stroke="var(--clock-primary)" stroke-width="5" stroke-linecap="round"/>
        <line x1="${cx}" y1="${cy}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}"
          stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
        <circle cx="${cx}" cy="${cy}" r="5" fill="var(--clock-primary)"/>
        <circle cx="${cx}" cy="${cy}" r="2" fill="white"/>
      </svg>
    `;
  }

  function drawSettingClock(h, m, hColor = '#3b82f6', mColor = '#ef4444') {
    return drawAnalogClockColored(h, m, 180, hColor, mColor);
  }

  function drawAnalogClockColored(h, m, size, hColor, mColor) {
    const hourAngle   = (h % 12) * 30 + m * 0.5 - 90;
    const minuteAngle = m * 6 - 90;
    const hr = hourAngle   * Math.PI / 180;
    const mr = minuteAngle * Math.PI / 180;
    const cx = size/2, cy = size/2, r = size/2 - 5;
    const hx = cx + (r*0.5)*Math.cos(hr), hy = cy + (r*0.5)*Math.sin(hr);
    const mx = cx + (r*0.7)*Math.cos(mr), my = cy + (r*0.7)*Math.sin(mr);

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"
        style="display:block;margin:0 auto;filter:drop-shadow(0 4px 12px rgba(59,130,246,0.25))">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="var(--clock-primary)" stroke-width="4"/>
        ${[12,1,2,3,4,5,6,7,8,9,10,11].map((n,i)=>{
          const a=(i*30-90)*Math.PI/180;
          const tx=cx+(r-15)*Math.cos(a), ty=cy+(r-15)*Math.sin(a);
          return `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="central"
            font-family="Nunito,sans-serif" font-size="10" font-weight="900" fill="var(--clock-primary)">${n}</text>`;
        }).join('')}
        <line x1="${cx}" y1="${cy}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}"
          stroke="${hColor}" stroke-width="5" stroke-linecap="round"/>
        <line x1="${cx}" y1="${cy}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}"
          stroke="${mColor}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="${cx}" cy="${cy}" r="5" fill="var(--clock-primary)"/>
      </svg>
    `;
  }

  function drawDigitalSetting(h, m) {
    return `
      <div id="digital-setting-display" style="
        font-family:var(--font-heading);font-size:var(--text-5xl);
        color:var(--clock-primary);letter-spacing:0.08em;
        padding:var(--space-5) var(--space-8);
        background:white;border-radius:var(--radius-xl);
        box-shadow:var(--shadow-md);
        border:3px solid var(--clock-light);
      ">${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}</div>
    `;
  }

  /* ── Generera svarsalternativ ─────────────────────── */
  function generateTimeOptions(h, m, correctText) {
    const opts = [correctText];
    const minutes = [0,5,10,15,20,25,30,35,40,45,50,55];
    let attempts = 0;
    while (opts.length < 4 && attempts < 30) {
      attempts++;
      const rh = Math.floor(Math.random() * 12) + 1;
      const rm = minutes[Math.floor(Math.random() * minutes.length)];
      const txt = MP.timeToSwedish(rh, rm);
      if (!opts.includes(txt)) opts.push(txt);
    }
    return opts.sort(() => Math.random() - 0.5);
  }

  /* ── Färgkoda tidstext pedagogiskt ─────────────────── */
  function colorizeTimeText(text) {
    const b = s => `<span style="color:#3b82f6;font-weight:900">${s}</span>`;
    const r = s => `<span style="color:#ef4444;font-weight:900">${s}</span>`;
    const k = s => `<span style="color:#1e293b;font-weight:800">${s}</span>`;

    // Digital: "23:45" → timme blå, kolon svart, minut röd
    if (/^\d{2}:\d{2}$/.test(text)) {
      const [hh, mm] = text.split(':');
      return b(hh) + k(':') + r(mm);
    }
    // "halv X" (30 min) → "halv" röd (minutbeskrivning), timme blå
    let match = text.match(/^halv (.+)$/);
    if (match) return r('halv ') + b(match[1]);

    // "X över halv Y" → minut röd, "över" svart, "halv" röd, timme blå
    match = text.match(/^(.+?) över halv (.+)$/);
    if (match) return r(match[1]) + k(' över ') + r('halv ') + b(match[2]);

    // "X i halv Y" → minut röd, "i" svart, "halv" röd, timme blå
    match = text.match(/^(.+?) i halv (.+)$/);
    if (match) return r(match[1]) + k(' i ') + r('halv ') + b(match[2]);

    // "X över Y"
    match = text.match(/^(.+?) över (.+)$/);
    if (match) return r(match[1]) + k(' över ') + b(match[2]);

    // "X i Y"
    match = text.match(/^(.+?) i (.+)$/);
    if (match) return r(match[1]) + k(' i ') + b(match[2]);

    // Bara timme (m=0); tål även äldre "tolv (tolv)"-format
    const hourOnly = text.replace(/\s*\(.*\)$/, '');
    return b(hourOnly);
  }

  /* ── Publik API ────────────────────────────────────── */
  return {
    init,
    renderPractice,
    adjustTime,
    resetTime,
    randomTime,
    showTestSetup,
    startTestWithType,
    showHistory,

    // Dynamiska handlers
    _handleReadChoice: null,
    _adjustSetting: null,
    _lockSetting: null,
  };
})();
