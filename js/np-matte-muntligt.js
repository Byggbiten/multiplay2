/* ============================================================
   MULTIPLAY – NP Matte Muntligt
   10 kategorier, slumpad frågegenering, canvas, belöningar
   ============================================================ */
'use strict';

const NpMatteMuntligt = (() => {

  /* ══════════════════════════════════════════════════════
     STATE
  ══════════════════════════════════════════════════════ */
  let profile      = null;
  let questions    = [];
  let currentIdx   = 0;
  let score        = 0;
  let attempts     = 0;         // per fråga
  let lastTableData = null;     // för återanvändning i oral-frågor

  const MAX_ATTEMPTS = 2;
  const NP_STATS_KEY = id => `np_matte_muntligt_stats_${id}`;

  /* ── Data-pooler ────────────────────────────────────── */
  const NAMES = ['Mira','Ali','Noah','Iris','Elsa','Nova','Ahmed','Vera','Gabriel','Troj','Mika','Liam','Saga','Wilma','Yusuf','Nora'];

  const TABLE_THEMES = [
    { name:'böcker',      unit:'böcker',  emoji:'📚', range:[3,15]   },
    { name:'hopp',        unit:'cm',      emoji:'🏃', range:[100,200]},
    { name:'glassar',     unit:'glassar', emoji:'🍦', range:[2,12]   },
    { name:'djurröster',  unit:'röster',  emoji:'🐾', range:[5,25]   },
    { name:'poäng',       unit:'poäng',   emoji:'🏅', range:[10,50]  },
    { name:'klossar',     unit:'klossar', emoji:'🧱', range:[8,30]   },
    { name:'frukter',     unit:'frukter', emoji:'🍎', range:[4,18]   },
    { name:'längder',     unit:'cm',      emoji:'📏', range:[80,180] },
  ];

  const CHART_THEMES = [
    { name:'glassmak',    items:['Vanilj','Choklad','Jordgubb','Päron'],   emoji:'🍦' },
    { name:'favoritfrukt',items:['Äpple','Banan','Apelsin','Kiwi'],        emoji:'🍎' },
    { name:'favoritdjur', items:['Katt','Hund','Häst','Kanin'],            emoji:'🐾' },
    { name:'sportgrenar', items:['Fotboll','Simning','Basket','Dans'],      emoji:'⚽' },
    { name:'favoritfärg', items:['Blå','Röd','Grön','Lila'],               emoji:'🎨' },
  ];

  const CONTEXTS = ['kulor','klossar','äpplen','stjärnor','godisbitar','kort'];
  const EVEN_NUMS = [6,8,10,12,14,16,18,20,24,30,40,50];
  const BAR_COLORS = ['#7c3aed','#f472b6','#fbbf24','#4ade80','#60a5fa','#fb923c'];

  /* ── Fråge-ordning ──────────────────────────────────── */
  const QUESTION_ORDER = [
    'table',         // 1. Läsa av tabell
    'chart',         // 2. Läsa av diagram
    'mostleast',     // 3. Flest eller färst
    'moreorfewer',   // 4. Fler eller färre
    'oral',          // 5. Berätta hur du tänker (mitt i)
    'probability',   // 6. Sannolikhet och chans
    'together',      // 7. Tillsammans
    'double',        // 8. Dubblering
    'half',          // 9. Halvering
    'oral',          // 10. Berätta hur du tänker (avslutning)
  ];

  /* ══════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════ */
  function init(p) {
    profile  = p;
    questions = [];
    currentIdx = 0;
    score = 0;
    attempts = 0;
    lastTableData = null;
    showStartScreen();
  }

  /* ══════════════════════════════════════════════════════
     STARTSKÄRM
  ══════════════════════════════════════════════════════ */
  function showStartScreen() {
    const root = document.getElementById('np-matte-muntligt-root');
    root.innerHTML = `
      <div class="app-header" style="border-bottom-color:rgba(124,58,237,0.2)">
        <button class="btn-back" style="background:var(--np-light);color:var(--np-primary)"
          onclick="NationellaHub.showMatteSelect()">Tillbaka</button>
        <span class="header-title" style="color:var(--np-primary)">🗣️ Matte Muntligt</span>
        <div style="width:80px"></div>
      </div>

      <div style="
        flex:1;display:flex;flex-direction:column;align-items:center;
        justify-content:center;padding:var(--space-8) var(--space-4);
        gap:var(--space-6);text-align:center;
        background:var(--np-bg);
      ">
        <div style="animation:bounce-in 0.6s var(--ease-bounce)">
          <div style="font-size:5rem;margin-bottom:var(--space-3)">🗣️✨</div>
          <h1 style="
            font-family:var(--font-heading);
            font-size:var(--text-4xl);
            color:var(--np-primary);
            margin:0 0 var(--space-3);
          ">Matteprat!</h1>
          <div class="card" style="text-align:left;padding:var(--space-5);max-width:400px">
            <p style="font-weight:700;color:var(--color-text);font-size:var(--text-base);margin:0 0 var(--space-3)">
              Du kommer få <strong>10 uppgifter</strong>. Titta på tabeller och diagram, räkna, och berätta hur du tänker!
            </p>
            <p style="font-weight:700;color:var(--np-secondary);font-size:var(--text-sm);margin:0">
              👨‍👩‍👧 En vuxen sitter bredvid dig.
            </p>
          </div>
        </div>

        <button class="btn btn-lg" style="
          background:linear-gradient(135deg,var(--np-primary),var(--np-secondary));
          color:white;
          box-shadow:0 6px 24px var(--np-glow);
          width:100%;max-width:400px;
          font-size:var(--text-xl);
          animation:pulse-glow 2s infinite;
        " onclick="NpMatteMuntligt.startGame()">
          Starta muntlig matte ▶️
        </button>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════
     SPELET – GENERERA FRÅGOR OCH VISA
  ══════════════════════════════════════════════════════ */
  function startGame() {
    App.Sound.play('click');
    questions = QUESTION_ORDER.map(type => generateQuestion(type));
    currentIdx = 0;
    score = 0;
    showQuestion();
  }

  function showQuestion() {
    attempts = 0;
    const q = questions[currentIdx];
    renderQuestion(q);
  }

  /* ══════════════════════════════════════════════════════
     FRÅGEKORT-RENDERING
  ══════════════════════════════════════════════════════ */
  function renderQuestion(q) {
    const root = document.getElementById('np-matte-muntligt-root');
    const progress = currentIdx / 10;
    const progressPct = Math.round(progress * 100);

    root.innerHTML = `
      <div class="app-header" style="border-bottom-color:rgba(124,58,237,0.2)">
        <button class="btn-back" style="background:var(--np-light);color:var(--np-primary)"
          onclick="NpMatteMuntligt.confirmAbort()">Avbryt</button>
        <span class="header-title" style="color:var(--np-primary)">${q.emoji} ${q.category}</span>
        <div style="width:80px"></div>
      </div>

      <!-- Progress -->
      <div style="padding:var(--space-3) var(--space-4) 0">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-weight:800;font-size:var(--text-sm);color:var(--np-primary)">
            Fråga ${currentIdx + 1} av 10
          </span>
          <span style="font-size:var(--text-sm);color:var(--color-text-muted);font-weight:700">
            ${q.category}
          </span>
        </div>
        <div class="progress-container" style="background:rgba(124,58,237,0.15)">
          <div class="progress-fill" style="
            width:${progressPct}%;
            background:linear-gradient(90deg,var(--np-primary),var(--np-secondary));
          "></div>
        </div>
      </div>

      <!-- Scrollable content -->
      <div style="flex:1;overflow-y:auto;padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-4)">

        <!-- Visuellt stöd -->
        ${q.visual ? `<div id="np-visual" style="
          background:rgba(255,255,255,0.85);
          border-radius:var(--radius-lg);
          padding:var(--space-4);
          border:2px solid rgba(124,58,237,0.15);
          overflow-x:auto;
        ">${renderVisual(q.visual)}</div>` : ''}

        <!-- Frågetext -->
        <div style="
          background:rgba(255,255,255,0.9);
          border-radius:var(--radius-lg);
          padding:var(--space-5);
          border-left:4px solid var(--np-primary);
          font-size:var(--text-xl);
          font-weight:800;
          color:var(--color-text);
          animation:slide-up 0.4s var(--ease-smooth);
        ">${q.question}</div>

        <!-- Svaryta -->
        <div id="np-answer-area">
          ${renderAnswerArea(q)}
        </div>

        <!-- Kladdyta -->
        <div style="
          background:rgba(255,255,255,0.85);
          border-radius:var(--radius-lg);
          padding:var(--space-3);
          border:2px solid rgba(124,58,237,0.15);
        ">
          <div style="
            font-size:var(--text-xs);font-weight:800;
            color:var(--np-primary);margin-bottom:var(--space-2);
            text-transform:uppercase;letter-spacing:0.06em;
          ">✏️ Kladd</div>
          <canvas id="np-canvas" style="
            width:100%;height:200px;display:block;
            touch-action:none;
            border-radius:var(--radius-md);
            border:2px dashed rgba(124,58,237,0.3);
            background:rgba(255,255,255,0.7);
            cursor:crosshair;
          "></canvas>
          <div style="display:flex;gap:var(--space-2);margin-top:var(--space-2)">
            <button style="
              flex:1;height:40px;border-radius:var(--radius-md);
              background:var(--np-light);color:var(--np-primary);
              border:none;font-weight:800;font-size:var(--text-sm);
              cursor:pointer;
            " onclick="NpMatteMuntligt.clearCanvas()">🗑️ Sudda allt</button>
          </div>
        </div>

        <!-- Ledtråd & Vuxenstöd -->
        <div style="display:flex;flex-direction:column;gap:var(--space-2)">
          <button style="
            width:100%;padding:var(--space-3);
            border-radius:var(--radius-md);
            background:rgba(251,191,36,0.15);
            border:2px solid rgba(251,191,36,0.4);
            color:#92400e;font-weight:800;font-size:var(--text-sm);
            cursor:pointer;text-align:left;
          " onclick="NpMatteMuntligt.toggleHint('hint-box')">
            💡 Visa ledtråd
          </button>
          <div id="hint-box" style="
            display:none;
            padding:var(--space-4);
            background:rgba(251,191,36,0.1);
            border-radius:var(--radius-md);
            border:2px solid rgba(251,191,36,0.3);
            font-weight:700;color:#92400e;
            font-size:var(--text-sm);
          ">${q.hint}</div>

          <button style="
            width:100%;padding:var(--space-3);
            border-radius:var(--radius-md);
            background:rgba(96,165,250,0.1);
            border:2px solid rgba(96,165,250,0.3);
            color:#1d4ed8;font-weight:800;font-size:var(--text-sm);
            cursor:pointer;text-align:left;
          " onclick="NpMatteMuntligt.toggleHint('adult-box')">
            👨‍👩‍👧 Tips till vuxen
          </button>
          <div id="adult-box" style="
            display:none;
            padding:var(--space-4);
            background:rgba(96,165,250,0.08);
            border-radius:var(--radius-md);
            border:2px solid rgba(96,165,250,0.25);
            font-weight:700;color:#1d4ed8;
            font-size:var(--text-sm);
          ">${q.adultTip}</div>
        </div>

        <!-- Feedback-yta -->
        <div id="np-feedback" style="display:none"></div>

        <!-- Extra padding i botten -->
        <div style="height:var(--space-8)"></div>
      </div>
    `;

    setupCanvas();
  }

  /* ── Renderera svarsyta beroende på typ ─────────────── */
  function renderAnswerArea(q) {
    if (q.answerType === 'choice') {
      return `
        <div style="display:flex;flex-direction:column;gap:var(--space-3)">
          ${q.options.map((opt, i) => `
            <button id="np-opt-${i}" class="btn" style="
              width:100%;min-height:64px;
              background:rgba(255,255,255,0.9);
              border:2.5px solid rgba(124,58,237,0.25);
              color:var(--np-primary);
              font-size:var(--text-xl);
              font-weight:800;
              border-radius:var(--radius-lg);
              text-align:left;
              padding:var(--space-4) var(--space-5);
              cursor:pointer;
              transition:all 0.15s var(--ease-smooth);
            "
              onmouseenter="this.style.background='rgba(124,58,237,0.08)'"
              onmouseleave="this.style.background='rgba(255,255,255,0.9)'"
              onclick="NpMatteMuntligt.handleChoice(${i},'${escStr(String(opt))}')">
              ${escHtml(String(opt))}
            </button>
          `).join('')}
        </div>
      `;
    }

    if (q.answerType === 'free') {
      return `
        <div style="display:flex;flex-direction:column;align-items:center;gap:var(--space-3)">
          <div id="np-free-display" style="
            font-size:var(--text-5xl);
            font-weight:900;
            color:var(--np-primary);
            min-height:72px;
            display:flex;align-items:center;justify-content:center;
            background:rgba(255,255,255,0.9);
            border-radius:var(--radius-lg);
            border:3px solid rgba(124,58,237,0.3);
            width:100%;letter-spacing:0.05em;
          ">_</div>
          ${renderNumpad()}
        </div>
      `;
    }

    if (q.answerType === 'oral') {
      return `
        <div style="
          background:linear-gradient(135deg,rgba(124,58,237,0.08),rgba(244,114,182,0.08));
          border-radius:var(--radius-lg);
          padding:var(--space-6);
          text-align:center;
          border:2px solid rgba(124,58,237,0.15);
        ">
          <div style="font-size:3rem;margin-bottom:var(--space-3)">🗣️</div>
          <p style="font-weight:800;color:var(--np-primary);font-size:var(--text-lg);margin:0 0 var(--space-2)">
            Berätta för den vuxna!
          </p>
          <p style="font-weight:700;color:var(--color-text-muted);font-size:var(--text-sm);margin:0 0 var(--space-6)">
            Ta din tid. Den vuxna trycker på knappen när ni är klara.
          </p>
          <button class="btn btn-lg" style="
            background:linear-gradient(135deg,var(--np-primary),var(--np-secondary));
            color:white;width:100%;
            box-shadow:0 4px 16px var(--np-glow);
          " onclick="NpMatteMuntligt.handleOral()">
            Vi har pratat klart ✅
          </button>
        </div>
      `;
    }
    return '';
  }

  /* ── Numpad ─────────────────────────────────────────── */
  let freeInput = '';

  function renderNumpad() {
    freeInput = '';
    const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','OK'];
    return `
      <div style="
        display:grid;grid-template-columns:repeat(3,72px);
        gap:var(--space-2);justify-content:center;
      ">
        ${keys.map(k => `
          <button style="
            width:72px;height:72px;
            border-radius:var(--radius-full);
            background:${k==='OK'?'linear-gradient(135deg,var(--np-primary),var(--np-secondary))':k==='⌫'?'linear-gradient(135deg,#fca5a5,#f87171)':'rgba(255,255,255,0.9)'};
            color:${k==='OK'||k==='⌫'?'white':'var(--np-primary)'};
            border:2px solid ${k==='OK'?'var(--np-primary)':k==='⌫'?'#ef4444':'rgba(124,58,237,0.2)'};
            font-size:var(--text-2xl);
            font-weight:900;
            cursor:pointer;
            box-shadow:var(--shadow-sm);
            transition:transform 0.1s;
          "
            onmousedown="this.style.transform='scale(0.93)'"
            onmouseup="this.style.transform=''"
            onclick="NpMatteMuntligt.numpadPress('${k}')">
            ${k}
          </button>
        `).join('')}
      </div>
    `;
  }

  function numpadPress(key) {
    App.Sound.play('click');
    if (key === '⌫') {
      freeInput = freeInput.slice(0, -1);
    } else if (key === 'OK') {
      if (freeInput !== '') handleFreeInput();
      return;
    } else {
      if (freeInput.length < 5) freeInput += key;
    }
    const disp = document.getElementById('np-free-display');
    if (disp) disp.textContent = freeInput || '_';
  }

  /* ══════════════════════════════════════════════════════
     CANVAS – KLADDYTA
  ══════════════════════════════════════════════════════ */
  let drawing = false;
  let canvasCtx = null;
  let lastX = 0;
  let lastY = 0;

  function setupCanvas() {
    const canvas = document.getElementById('np-canvas');
    if (!canvas) return;

    // Sätt faktisk pixelstorlek
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  || 300;
    canvas.height = 200;
    canvasCtx = canvas.getContext('2d');

    canvas.addEventListener('pointerdown',  startDraw);
    canvas.addEventListener('pointermove',  doDraw);
    canvas.addEventListener('pointerup',    endDraw);
    canvas.addEventListener('pointercancel',endDraw);
  }

  function startDraw(e) {
    drawing = true;
    const rect = e.target.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
    canvasCtx.beginPath();
    canvasCtx.moveTo(lastX, lastY);
    e.preventDefault();
  }

  function doDraw(e) {
    if (!drawing) return;
    e.preventDefault();
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure || 0.5;
    canvasCtx.lineWidth   = 2 + pressure * 4;
    canvasCtx.lineCap     = 'round';
    canvasCtx.lineJoin    = 'round';
    canvasCtx.strokeStyle = '#7c3aed';
    canvasCtx.lineTo(x, y);
    canvasCtx.stroke();
    canvasCtx.beginPath();
    canvasCtx.moveTo(x, y);
    lastX = x; lastY = y;
  }

  function endDraw() { drawing = false; }

  function clearCanvas() {
    if (canvasCtx) {
      const canvas = document.getElementById('np-canvas');
      if (canvas) canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  /* ══════════════════════════════════════════════════════
     SVAR-HANTERING
  ══════════════════════════════════════════════════════ */
  function handleChoice(idx, chosen) {
    const q = questions[currentIdx];
    const correct = String(q.correctAnswer);
    const isCorrect = chosen === correct;
    handleAnswer(isCorrect, chosen, correct, 'choice', idx);
  }

  function handleFreeInput() {
    const q = questions[currentIdx];
    const correct = String(q.correctAnswer);
    const isCorrect = freeInput === correct;
    handleAnswer(isCorrect, freeInput, correct, 'free', null);
  }

  function handleOral() {
    // Oral räknas alltid som rätt
    handleAnswer(true, 'oral', 'oral', 'oral', null);
  }

  function handleAnswer(isCorrect, chosen, correct, type, optIdx) {
    attempts++;

    if (isCorrect) {
      score++;
      showCorrectFeedback(type, optIdx);
      setTimeout(() => {
        currentIdx++;
        if (currentIdx >= 10) {
          showResults();
        } else {
          showQuestion();
        }
      }, 1600);
    } else {
      if (attempts >= MAX_ATTEMPTS) {
        showWrongFinal(correct, type, optIdx);
        setTimeout(() => {
          currentIdx++;
          if (currentIdx >= 10) {
            showResults();
          } else {
            showQuestion();
          }
        }, 2500);
      } else {
        showWrongRetry(type, optIdx);
      }
    }
  }

  /* ── Feedback: rätt ─────────────────────────────────── */
  function showCorrectFeedback(type, optIdx) {
    App.Sound.play('correct');
    celebrationBurst();

    if (type === 'choice' && optIdx !== null) {
      const btn = document.getElementById(`np-opt-${optIdx}`);
      if (btn) {
        btn.style.background = 'linear-gradient(135deg,#dcfce7,#bbf7d0)';
        btn.style.borderColor = '#22c55e';
        btn.style.color = '#166534';
      }
      document.querySelectorAll('[id^="np-opt-"]').forEach(b => { b.disabled = true; });
    }

    const fb = document.getElementById('np-feedback');
    if (fb) {
      fb.style.display = 'block';
      const msgs = ['Fantastiskt! 🌟','Super! 🎉','Rätt! 💖','Toppen! ✨','Ja! 🎊'];
      fb.innerHTML = `
        <div style="
          background:linear-gradient(135deg,#dcfce7,#bbf7d0);
          border:2px solid #22c55e;
          border-radius:var(--radius-lg);
          padding:var(--space-4);
          text-align:center;
          font-weight:900;
          color:#166534;
          font-size:var(--text-xl);
          animation:bounce-in 0.4s var(--ease-bounce);
        ">✅ ${msgs[Math.floor(Math.random()*msgs.length)]}</div>
      `;
    }
  }

  /* ── Feedback: fel, försök igen ─────────────────────── */
  function showWrongRetry(type, optIdx) {
    App.Sound.play('wrong');

    if (type === 'choice' && optIdx !== null) {
      const btn = document.getElementById(`np-opt-${optIdx}`);
      if (btn) {
        btn.style.background = 'linear-gradient(135deg,#fee2e2,#fecaca)';
        btn.style.borderColor = '#ef4444';
        btn.style.animation = 'wiggle 0.4s var(--ease-smooth)';
        setTimeout(() => {
          if (btn) {
            btn.style.background = 'rgba(255,255,255,0.9)';
            btn.style.borderColor = 'rgba(124,58,237,0.25)';
            btn.style.animation = '';
            btn.disabled = true;
          }
        }, 800);
      }
    }

    const fb = document.getElementById('np-feedback');
    if (fb) {
      fb.style.display = 'block';
      const msgs = ['Bra försök! 💪','Nästan! Prova igen 🌟','Titta en gång till 👀'];
      fb.innerHTML = `
        <div style="
          background:linear-gradient(135deg,#fff7ed,#fef3c7);
          border:2px solid #f59e0b;
          border-radius:var(--radius-lg);
          padding:var(--space-4);
          text-align:center;
          font-weight:800;
          color:#92400e;
          font-size:var(--text-lg);
        ">${msgs[Math.floor(Math.random()*msgs.length)]}</div>
      `;
    }
  }

  /* ── Feedback: max försök, visa rätt svar ───────────── */
  function showWrongFinal(correct, type, optIdx) {
    App.Sound.play('wrong');

    if (type === 'choice') {
      document.querySelectorAll('[id^="np-opt-"]').forEach(btn => {
        btn.disabled = true;
        const val = btn.textContent.trim();
        if (val === correct) {
          btn.style.background = 'linear-gradient(135deg,#dcfce7,#bbf7d0)';
          btn.style.borderColor = '#22c55e';
        }
      });
    }

    const fb = document.getElementById('np-feedback');
    if (fb) {
      fb.style.display = 'block';
      fb.innerHTML = `
        <div style="
          background:rgba(255,255,255,0.95);
          border:2px solid rgba(124,58,237,0.3);
          border-radius:var(--radius-lg);
          padding:var(--space-4);
          text-align:center;
        ">
          <div style="font-weight:700;color:var(--color-text-muted);font-size:var(--text-sm);margin-bottom:var(--space-2)">
            Rätt svar var:
          </div>
          <div style="font-weight:900;font-size:var(--text-3xl);color:var(--np-primary)">
            ${escHtml(correct)}
          </div>
          <div style="font-weight:700;color:var(--color-text-muted);font-size:var(--text-sm);margin-top:var(--space-2)">
            Fortsätt – du lär dig! 💪
          </div>
        </div>
      `;
    }
  }

  /* ── Ledtråd toggle ─────────────────────────────────── */
  function toggleHint(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
    App.Sound.play('click');
  }

  /* ── Avbryt-bekräftelse ─────────────────────────────── */
  function confirmAbort() {
    if (confirm('Avbryt spelet och gå tillbaka?')) {
      NationellaHub.showMatteSelect();
    }
  }

  /* ══════════════════════════════════════════════════════
     BELÖNINGSSYSTEM
  ══════════════════════════════════════════════════════ */
  function celebrationBurst(type) {
    const types = ['confetti','hearts','stars','emoji','rainbow','balls'];
    const chosen = type || types[Math.floor(Math.random() * types.length)];

    if (chosen === 'confetti') {
      App.Confetti.burst(80);
      return;
    }

    const container = document.getElementById('confetti-container');
    container.innerHTML = '';

    const sets = {
      hearts:  ['💖','💕','❤️','💗','💝'],
      stars:   ['⭐','🌟','✨','💫'],
      emoji:   ['🎉','🦄','🌈','🎊','🐱','🐶','🦋','🍭'],
      rainbow: ['🔴','🟠','🟡','🟢','🔵','🟣'],
      balls:   ['🔴','🟠','🟡','🟢','🔵','🟣','⚪'],
    };

    const pool = sets[chosen] || sets.stars;
    const count = chosen === 'balls' ? 20 : 35;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'confetti-piece';
      el.textContent = pool[Math.floor(Math.random() * pool.length)];
      el.style.cssText = `
        left:${Math.random()*100}%;
        font-size:${14 + Math.random()*18}px;
        animation-duration:${1.2 + Math.random()*2}s;
        animation-delay:${Math.random()*0.4}s;
      `;
      container.appendChild(el);
    }
    setTimeout(() => { container.innerHTML = ''; }, 3000);
  }

  /* ══════════════════════════════════════════════════════
     RESULTATSKÄRM
  ══════════════════════════════════════════════════════ */
  function showResults() {
    App.Sound.play('fanfare');
    App.Confetti.burst(100);
    saveStats();

    const root = document.getElementById('np-matte-muntligt-root');
    const categories = QUESTION_ORDER.map((t, i) => ({
      type: t,
      label: getCategoryLabel(t, i),
      emoji: getCategoryEmoji(t, i),
    }));

    root.innerHTML = `
      <div class="app-header" style="border-bottom-color:rgba(124,58,237,0.2)">
        <div style="width:80px"></div>
        <span class="header-title" style="color:var(--np-primary)">🏆 Resultat</span>
        <div style="width:80px"></div>
      </div>

      <div style="flex:1;overflow-y:auto;padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-4)">

        <!-- Huvudresultat -->
        <div style="
          background:linear-gradient(135deg,var(--np-primary),var(--np-secondary));
          border-radius:var(--radius-xl);
          padding:var(--space-8) var(--space-5);
          text-align:center;
          color:white;
          animation:bounce-in 0.6s var(--ease-bounce);
        ">
          <div style="font-size:4rem;margin-bottom:var(--space-3);animation:sparkle 1.5s infinite">🌟</div>
          <div style="font-family:var(--font-heading);font-size:var(--text-4xl);margin-bottom:var(--space-2)">
            Fantastiskt jobbat!
          </div>
          <div style="font-size:var(--text-6xl);font-weight:900;margin:var(--space-3) 0">
            ${score} <span style="font-size:var(--text-2xl);opacity:0.8">av 10</span>
          </div>
          <div style="opacity:0.9;font-weight:700;font-size:var(--text-lg)">
            Du klarade ${score} frågor! 🎊
          </div>
        </div>

        <!-- Tränade områden -->
        <div class="card" style="padding:var(--space-4)">
          <div style="font-weight:800;color:var(--np-primary);margin-bottom:var(--space-3);font-size:var(--text-base)">
            Du tränade på:
          </div>
          <div style="display:flex;flex-direction:column;gap:var(--space-2)">
            ${categories.map(c => `
              <div style="
                display:flex;align-items:center;gap:var(--space-3);
                padding:var(--space-2) var(--space-3);
                border-radius:var(--radius-md);
                background:linear-gradient(135deg,rgba(124,58,237,0.06),rgba(244,114,182,0.06));
              ">
                <span style="font-size:1.2rem">${c.emoji}</span>
                <span style="font-weight:700;color:var(--color-text);flex:1">${c.label}</span>
                <span style="color:var(--np-primary)">✅</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Knappar -->
        <div style="display:flex;flex-direction:column;gap:var(--space-3)">
          <button class="btn btn-lg" style="
            background:linear-gradient(135deg,var(--np-primary),var(--np-secondary));
            color:white;
            box-shadow:0 4px 20px var(--np-glow);
          " onclick="NpMatteMuntligt.startGame()">
            Spela igen 🔄
          </button>
          <button class="btn btn-ghost" style="
            border-color:var(--np-primary);
            color:var(--np-primary);
          " onclick="NationellaHub.showMatteSelect()">
            Tillbaka 🏠
          </button>
        </div>

        <div style="height:var(--space-8)"></div>
      </div>
    `;
  }

  function getCategoryLabel(type, idx) {
    const map = {
      table: 'Läsa av tabell',
      chart: 'Läsa av diagram',
      mostleast: 'Flest eller färst',
      moreorfewer: 'Fler eller färre',
      oral: idx === 4 ? 'Berätta hur du tänker (mitten)' : 'Berätta hur du tänker (avslut)',
      probability: 'Sannolikhet och chans',
      together: 'Tillsammans',
      double: 'Dubblering',
      half: 'Halvering',
    };
    return map[type] || type;
  }

  function getCategoryEmoji(type, idx) {
    const map = {
      table: '📊', chart: '📈', mostleast: '🏆',
      moreorfewer: '➕', oral: '🗣️', probability: '🎲',
      together: '🤝', double: '✖️', half: '➗',
    };
    return map[type] || '📝';
  }

  /* ══════════════════════════════════════════════════════
     LOCALSTORAGE
  ══════════════════════════════════════════════════════ */
  function saveStats() {
    if (!profile) return;
    const key = NP_STATS_KEY(profile.id);
    let data = { totalSessions:0, totalCorrect:0, totalQuestions:0, lastPlayed:'', sessions:[] };
    try { data = JSON.parse(localStorage.getItem(key)) || data; } catch(_) {}

    data.totalSessions++;
    data.totalCorrect   += score;
    data.totalQuestions += 10;
    data.lastPlayed = new Date().toISOString();

    const sessionEntry = {
      date: new Date().toISOString(),
      correct: score,
      total: 10,
    };
    data.sessions.unshift(sessionEntry);
    if (data.sessions.length > 30) data.sessions = data.sessions.slice(0, 30);

    localStorage.setItem(key, JSON.stringify(data));
  }

  /* ══════════════════════════════════════════════════════
     VISUELLA KOMPONENTER
  ══════════════════════════════════════════════════════ */
  function renderVisual(v) {
    if (!v) return '';
    if (v.type === 'table')    return renderTable(v.data);
    if (v.type === 'bar_chart') return renderBarChart(v.data);
    if (v.type === 'bags')     return renderBags(v.data);
    if (v.type === 'spinner')  return renderSpinner(v.data);
    return '';
  }

  /* ── HTML-tabell ────────────────────────────────────── */
  function renderTable(data) {
    return `
      <table class="np-table" style="
        width:100%;border-collapse:separate;border-spacing:0;
        border-radius:var(--radius-md);overflow:hidden;
        font-size:var(--text-base);font-weight:700;
      ">
        <thead>
          <tr style="background:linear-gradient(135deg,var(--np-primary),var(--np-secondary))">
            <th style="padding:12px 16px;text-align:left;color:white;font-weight:800">${escHtml(data.col1)}</th>
            <th style="padding:12px 16px;text-align:right;color:white;font-weight:800">${escHtml(data.col2)}</th>
          </tr>
        </thead>
        <tbody>
          ${data.rows.map((r, i) => `
            <tr style="background:${i%2===0?'rgba(255,255,255,0.9)':'rgba(124,58,237,0.05)'}">
              <td style="padding:12px 16px;color:var(--color-text);border-bottom:1px solid rgba(124,58,237,0.1)">${escHtml(r.label)}</td>
              <td style="padding:12px 16px;text-align:right;font-weight:900;color:var(--np-primary);border-bottom:1px solid rgba(124,58,237,0.1)">${r.value}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /* ── SVG-stapeldiagram ──────────────────────────────── */
  function renderBarChart(data) {
    const W = 360, H = 180, PAD = 40, BAR_PAD = 10;
    const maxVal = Math.max(...data.bars.map(b => b.value));
    const barW = Math.max(40, (W - PAD*2 - BAR_PAD*(data.bars.length-1)) / data.bars.length);
    const chartH = H - 60;

    const bars = data.bars.map((bar, i) => {
      const bh = Math.round((bar.value / maxVal) * chartH);
      const x  = PAD + i * (barW + BAR_PAD);
      const y  = (H - 30) - bh;
      return `
        <rect x="${x}" y="${y}" width="${barW}" height="${bh}"
          fill="${BAR_COLORS[i % BAR_COLORS.length]}"
          rx="6"
          style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.15))"/>
        <text x="${x + barW/2}" y="${y - 6}"
          text-anchor="middle" font-size="13" font-weight="900"
          fill="${BAR_COLORS[i % BAR_COLORS.length]}">${bar.value}</text>
        <text x="${x + barW/2}" y="${H - 10}"
          text-anchor="middle" font-size="12" font-weight="700"
          fill="#555">${escHtml(bar.label)}</text>
      `;
    });

    // Y-axel streck
    const steps = 3;
    const yTicks = Array.from({length:steps+1}, (_,i) => {
      const val = Math.round(maxVal * i / steps);
      const y   = (H - 30) - Math.round((val/maxVal)*chartH);
      return `
        <line x1="${PAD-5}" y1="${y}" x2="${W-PAD+5}" y2="${y}"
          stroke="rgba(0,0,0,0.1)" stroke-dasharray="4,3"/>
        <text x="${PAD-8}" y="${y+4}" text-anchor="end" font-size="11" fill="#888">${val}</text>
      `;
    });

    return `
      <div style="font-weight:800;color:var(--np-primary);margin-bottom:var(--space-2);font-size:var(--text-sm)">
        ${escHtml(data.title)} ${data.emoji}
      </div>
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:400px;display:block;margin:0 auto">
        ${yTicks.join('')}
        ${bars.join('')}
        <line x1="${PAD}" y1="${H-30}" x2="${W-PAD}" y2="${H-30}" stroke="#ccc" stroke-width="2"/>
      </svg>
    `;
  }

  /* ── Kulpåsar (SVG) ─────────────────────────────────── */
  function renderBags(data) {
    const bagLabels = ['Påse A','Påse B','Påse C'];
    const bagColors = ['#a78bfa','#f9a8d4','#fcd34d'];

    return `
      <div style="display:flex;gap:var(--space-4);justify-content:center;flex-wrap:wrap">
        ${data.bags.map((bag, bi) => {
          const total = bag.balls.reduce((s, b) => s + b.count, 0);
          let circles = '';
          let idx = 0;
          bag.balls.forEach(b => {
            for (let k = 0; k < b.count; k++) {
              const cx = 20 + (idx % 4) * 22;
              const cy = 20 + Math.floor(idx / 4) * 22;
              circles += `<circle cx="${cx}" cy="${cy}" r="9" fill="${b.color}" stroke="white" stroke-width="1.5"/>`;
              idx++;
            }
          });
          const rows = Math.ceil(total / 4);
          const svgH = rows * 22 + 16;

          return `
            <div style="text-align:center">
              <div style="font-weight:800;color:var(--np-primary);font-size:var(--text-sm);margin-bottom:6px">
                ${bagLabels[bi]}
              </div>
              <svg width="110" height="${Math.max(60, svgH + 20)}"
                style="border-radius:var(--radius-lg);border:2.5px solid ${bagColors[bi]};background:rgba(255,255,255,0.9);overflow:visible">
                <rect x="5" y="5" width="100" height="${Math.max(50, svgH+10)}"
                  rx="12" fill="${bagColors[bi]}22" stroke="${bagColors[bi]}" stroke-width="2"/>
                <g transform="translate(5,10)">${circles}</g>
              </svg>
              <div style="font-size:var(--text-xs);color:var(--color-text-muted);font-weight:700;margin-top:4px">
                ${bag.balls.map(b => `${b.count} ${b.colorName}`).join(', ')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /* ── Snurra/paj (SVG) ───────────────────────────────── */
  function renderSpinner(data) {
    const R = 90, CX = 110, CY = 110;
    const total = data.sectors.reduce((s, sec) => s + sec.count, 0);
    let startAngle = -Math.PI / 2;
    const paths = [];
    const labels = [];

    data.sectors.forEach((sec, i) => {
      const angle = (sec.count / total) * 2 * Math.PI;
      const endAngle = startAngle + angle;
      const x1 = CX + R * Math.cos(startAngle);
      const y1 = CY + R * Math.sin(startAngle);
      const x2 = CX + R * Math.cos(endAngle);
      const y2 = CY + R * Math.sin(endAngle);
      const large = angle > Math.PI ? 1 : 0;

      paths.push(`
        <path d="M ${CX},${CY} L ${x1},${y1} A ${R},${R} 0 ${large} 1 ${x2},${y2} Z"
          fill="${BAR_COLORS[i % BAR_COLORS.length]}"
          stroke="white" stroke-width="2"/>
      `);

      const midAngle = startAngle + angle / 2;
      const lx = CX + (R * 0.65) * Math.cos(midAngle);
      const ly = CY + (R * 0.65) * Math.sin(midAngle);
      labels.push(`
        <text x="${lx}" y="${ly}" text-anchor="middle"
          dominant-baseline="middle" font-size="18">${sec.emoji}</text>
        <text x="${lx}" y="${ly + 18}" text-anchor="middle"
          font-size="11" font-weight="700" fill="white">${sec.count}</text>
      `);

      startAngle = endAngle;
    });

    return `
      <div style="text-align:center">
        <div style="font-weight:800;color:var(--np-primary);margin-bottom:var(--space-2);font-size:var(--text-sm)">Snurra</div>
        <svg width="220" height="220" style="display:block;margin:0 auto">
          ${paths.join('')}
          ${labels.join('')}
          <circle cx="${CX}" cy="${CY}" r="8" fill="white" stroke="#ccc" stroke-width="2"/>
        </svg>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════
     FRÅGE-GENERATORER
  ══════════════════════════════════════════════════════ */
  function generateQuestion(type) {
    switch (type) {
      case 'table':      return genTable();
      case 'chart':      return genChart();
      case 'mostleast':  return genMostLeast();
      case 'moreorfewer':return genMoreOrFewer();
      case 'oral':       return genOral();
      case 'probability':return genProbability();
      case 'together':   return genTogether();
      case 'double':     return genDouble();
      case 'half':       return genHalf();
      default:           return genOral();
    }
  }

  /* ── Slump-hjälp ────────────────────────────────────── */
  function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length-1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i+1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function pickN(arr, n) { return shuffle(arr).slice(0, n); }

  /* ── 1. Tabell ──────────────────────────────────────── */
  function genTable() {
    const theme = pick(TABLE_THEMES);
    const names = pickN(NAMES, 4);
    const vals  = names.map(() => rnd(theme.range[0], theme.range[1]));
    const rows  = names.map((n, i) => ({ label: n, value: vals[i] }));

    const tableData = {
      col1: 'Namn',
      col2: `Antal ${theme.unit}`,
      rows,
    };
    lastTableData = { theme, names, vals };

    const maxI = vals.indexOf(Math.max(...vals));
    const minI = vals.indexOf(Math.min(...vals));

    // Slumpa frågetyp
    const qType = pick(['most','least','sum2']);

    let question, correctAnswer, options;

    if (qType === 'most') {
      question = `Vem hade flest ${theme.name}?`;
      correctAnswer = names[maxI];
      options = shuffle(names);
    } else if (qType === 'least') {
      question = `Vem hade färst ${theme.name}?`;
      correctAnswer = names[minI];
      options = shuffle(names);
    } else {
      // sum2: två slumpade
      const [i1, i2] = pickN([0,1,2,3], 2);
      const sum = vals[i1] + vals[i2];
      question = `Hur många ${theme.unit} hade ${names[i1]} och ${names[i2]} tillsammans?`;
      correctAnswer = String(sum);
      options = null; // fri inmatning
    }

    return {
      category: 'Läsa av tabell',
      emoji: '📊',
      visual: { type: 'table', data: tableData },
      question,
      answerType: options ? 'choice' : 'free',
      options: options || null,
      correctAnswer,
      hint: 'Titta efter det största (eller minsta) talet i tabellen.',
      adultTip: `Barnet tränar att jämföra värden i en tabell. Fråga: "Hur visste du det?" Tema: ${theme.name}.`,
    };
  }

  /* ── 2. Diagram ─────────────────────────────────────── */
  function genChart() {
    const theme = pick(CHART_THEMES);
    const items = [...theme.items];
    const vals  = items.map(() => rnd(2, 20));
    const bars  = items.map((label, i) => ({ label, value: vals[i] }));

    const chartData = {
      title: `Favoritröster: ${theme.name}`,
      emoji: theme.emoji,
      bars,
    };

    const maxI = vals.indexOf(Math.max(...vals));
    const minI = vals.indexOf(Math.min(...vals));
    const qType = pick(['most','least','diff']);

    let question, correctAnswer, options;

    if (qType === 'most') {
      question = `Vilket alternativ fick flest röster för ${theme.name}?`;
      correctAnswer = items[maxI];
      options = shuffle([...items]);
    } else if (qType === 'least') {
      question = `Vilket alternativ fick färst röster?`;
      correctAnswer = items[minI];
      options = shuffle([...items]);
    } else {
      const [i1, i2] = pickN([0,1,2,3], 2);
      const diff = Math.abs(vals[i1] - vals[i2]);
      question = `Hur många fler röster fick ${items[i1]} än ${items[i2]}?`;
      correctAnswer = String(diff);
      options = null;
    }

    return {
      category: 'Läsa av diagram',
      emoji: '📈',
      visual: { type: 'bar_chart', data: chartData },
      question,
      answerType: options ? 'choice' : 'free',
      options: options || null,
      correctAnswer,
      hint: 'Titta på staplarna – vilken är högst eller lägst?',
      adultTip: `Barnet tränar att tolka stapeldiagram om ${theme.name}. Fråga: "Hur läste du av stapeln?"`,
    };
  }

  /* ── 3. Flest eller färst ───────────────────────────── */
  function genMostLeast() {
    const theme = pick(TABLE_THEMES);
    const names = pickN(NAMES, 4);
    const vals  = names.map(() => rnd(theme.range[0], theme.range[1]));
    const rows  = names.map((n, i) => ({ label: n, value: vals[i] }));
    const tableData = { col1: 'Namn', col2: `Antal ${theme.unit}`, rows };

    const maxI = vals.indexOf(Math.max(...vals));
    const minI = vals.indexOf(Math.min(...vals));
    const qType = pick(['most','least']);
    const correctAnswer = qType === 'most' ? names[maxI] : names[minI];
    const question = qType === 'most'
      ? `Vem hade FLEST ${theme.name}?`
      : `Vem hade FÄRST ${theme.name}?`;

    return {
      category: 'Flest eller färst',
      emoji: '🏆',
      visual: { type: 'table', data: tableData },
      question,
      answerType: 'choice',
      options: shuffle([...names]),
      correctAnswer,
      hint: `Jämför talen i tabellen – vilket är ${qType==='most'?'störst':'minst'}?`,
      adultTip: `Barnet tränar att jämföra och ordna tal. Fråga: "Vad är skillnaden mellan störst och minst?"`,
    };
  }

  /* ── 4. Fler eller färre ────────────────────────────── */
  function genMoreOrFewer() {
    const theme = pick(TABLE_THEMES);
    const names = pickN(NAMES, 4);
    const vals  = names.map(() => rnd(theme.range[0], theme.range[1]));
    const rows  = names.map((n, i) => ({ label: n, value: vals[i] }));
    const tableData = { col1: 'Namn', col2: `Antal ${theme.unit}`, rows };

    const [i1, i2] = pickN([0,1,2,3], 2);
    const diff = Math.abs(vals[i1] - vals[i2]);
    const [bigger, smaller] = vals[i1] >= vals[i2]
      ? [names[i1], names[i2]]
      : [names[i2], names[i1]];

    return {
      category: 'Fler eller färre',
      emoji: '➕',
      visual: { type: 'table', data: tableData },
      question: `Hur många fler ${theme.unit} hade ${bigger} än ${smaller}?`,
      answerType: 'free',
      correctAnswer: String(diff),
      hint: `Räkna skillnaden: dra ifrån det mindre talet från det större.`,
      adultTip: `Barnet tränar subtraktionsstrategier. Fråga: "Hur räknade du? Räknade du baklänges eller tog du bort?"`,
    };
  }

  /* ── 5. Oral (Berätta hur du tänker) ───────────────── */
  function genOral() {
    const prompts = [
      { q: 'Berätta för den vuxna hur du tänkte när du löste det.', hint: 'Tänk högt! Det finns inget fel sätt.', adult: 'Låt barnet förklara med egna ord. Ställ följdfrågor: "Hur tänkte du?" "Kan du räkna på ett annat sätt?"' },
      { q: 'Förklara med ord hur du räknade.', hint: 'Berätta steg för steg – det är magiskt att kunna förklara!', adult: 'Uppmuntra barnet att använda matematiska ord. Fråga: "Vad räknade du först? Vad kom sen?"' },
      { q: 'Kan du visa med ord hur du löste uppgiften?', hint: 'Tänk på stegen: Vad visste du? Vad behövde du räkna?', adult: 'Lyssna aktivt. Om barnet fastnar, fråga: "Vad stod det i frågan?" Räknas alltid som rätt.' },
    ];
    const p = pick(prompts);
    return {
      category: 'Berätta hur du tänker',
      emoji: '🗣️',
      visual: null,
      question: p.q,
      answerType: 'oral',
      correctAnswer: 'oral',
      hint: p.hint,
      adultTip: p.adult,
    };
  }

  /* ── 6. Sannolikhet och chans ───────────────────────── */
  function genProbability() {
    const type = pick(['bags','spinner']);

    if (type === 'bags') {
      // 3 påsar med blåa och röda kulor
      const bags = [
        { balls: [{ count: rnd(1,3), color:'#60a5fa', colorName:'blå' }, { count: rnd(4,7), color:'#f87171', colorName:'röda' }] },
        { balls: [{ count: rnd(3,5), color:'#60a5fa', colorName:'blå' }, { count: rnd(2,5), color:'#f87171', colorName:'röda' }] },
        { balls: [{ count: rnd(5,8), color:'#60a5fa', colorName:'blå' }, { count: rnd(1,3), color:'#f87171', colorName:'röda' }] },
      ];

      // Rätta svaret: påsen med flest blåa relativt totalt
      const probs = bags.map(bag => {
        const blue = bag.balls[0].count;
        const total = bag.balls.reduce((s, b) => s + b.count, 0);
        return blue / total;
      });
      const maxProbIdx = probs.indexOf(Math.max(...probs));
      const labels = ['Påse A','Påse B','Påse C'];

      return {
        category: 'Sannolikhet och chans',
        emoji: '🎲',
        visual: { type: 'bags', data: { bags } },
        question: 'I vilken påse är det störst chans att dra en BLÅ kula?',
        answerType: 'choice',
        options: labels,
        correctAnswer: labels[maxProbIdx],
        hint: 'Titta i vilken påse de blåa kulorna är flest jämfört med de röda.',
        adultTip: 'Barnet tränar sannolikhet. Fråga: "Om det finns fler blåa – är det lättare eller svårare att dra blå?" Prata om chans som bråktal.',
      };
    }

    // Snurra
    const symbols = [
      { emoji:'⭐', label:'stjärna' },
      { emoji:'💖', label:'hjärta' },
      { emoji:'🌙', label:'måne' },
      { emoji:'🌈', label:'regnbåge' },
    ];
    const chosen = pickN(symbols, pick([2,3]));
    const sectors = chosen.map((s, i) => ({
      ...s,
      count: i === 0 ? rnd(4, 6) : rnd(1, 3),
    }));

    const maxSec = sectors.reduce((a, b) => a.count > b.count ? a : b);

    return {
      category: 'Sannolikhet och chans',
      emoji: '🎲',
      visual: { type: 'spinner', data: { sectors } },
      question: 'Vilken symbol är det STÖRST chans att landa på?',
      answerType: 'choice',
      options: sectors.map(s => s.emoji + ' ' + s.label),
      correctAnswer: maxSec.emoji + ' ' + maxSec.label,
      hint: 'Den symbol som tar störst del av snurran har störst chans.',
      adultTip: 'Barnet tränar sannolikhet med paj-diagram. Fråga: "Vilken del är störst?" Koppla till bråk: hälften, en fjärdedel.',
    };
  }

  /* ── 7. Tillsammans ─────────────────────────────────── */
  function genTogether() {
    const theme = pick(TABLE_THEMES);
    const count = rnd(2, 4);
    const names = pickN(NAMES, count);
    const vals  = names.map(() => rnd(theme.range[0], Math.min(theme.range[1], theme.range[0]+20)));
    const rows  = names.map((n, i) => ({ label: n, value: vals[i] }));
    const tableData = { col1: 'Namn', col2: `Antal ${theme.unit}`, rows };
    const sum = vals.reduce((s, v) => s + v, 0);

    return {
      category: 'Tillsammans',
      emoji: '🤝',
      visual: { type: 'table', data: tableData },
      question: `Hur många ${theme.unit} hade alla tillsammans?`,
      answerType: 'free',
      correctAnswer: String(sum),
      hint: `Lägg ihop alla tal i tabellen: ${vals.join(' + ')} = ?`,
      adultTip: `Barnet tränar addition av flera tal. Fråga: "Vilka tal la du ihop?" Prata om strategier: ta de stora talen först.`,
    };
  }

  /* ── 8. Dubblering ──────────────────────────────────── */
  function genDouble() {
    const name = pick(NAMES);
    const ctx  = pick(CONTEXTS);
    const val  = rnd(3, 25);
    const ans  = val * 2;

    return {
      category: 'Dubblering',
      emoji: '✖️',
      visual: null,
      question: `${name} har ${val} ${ctx}. Om hen får dubbelt så många, hur många har hen då?`,
      answerType: 'free',
      correctAnswer: String(ans),
      hint: `Dubbelt = två gånger. ${val} + ${val} = ?`,
      adultTip: `Barnet tränar dubblering (×2). Fråga: "Vad är dubbelt med 6? Och med 10?" Koppla till gångertabellen.`,
    };
  }

  /* ── 9. Halvering ───────────────────────────────────── */
  function genHalf() {
    const ctx = pick(CONTEXTS);
    const val = pick(EVEN_NUMS);
    const ans = val / 2;

    return {
      category: 'Halvering',
      emoji: '➗',
      visual: null,
      question: `Det finns ${val} ${ctx}. Om de delas lika i två grupper, hur många blir det i varje grupp?`,
      answerType: 'free',
      correctAnswer: String(ans),
      hint: `Hälften = dela i två lika delar. ${val} ÷ 2 = ?`,
      adultTip: `Barnet tränar halvering (÷2). Fråga: "Hur visste du att de är lika?" Koppla till dubblering: "Om hälften av 12 är 6 – vad är dubbelt med 6?"`,
    };
  }

  /* ══════════════════════════════════════════════════════
     HJÄLPFUNKTIONER
  ══════════════════════════════════════════════════════ */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escStr(str) {
    return str.replace(/'/g, "\\'");
  }

  /* ── Publik API ─────────────────────────────────────── */
  return {
    init,
    startGame,
    numpadPress,
    handleChoice,
    handleFreeInput,
    handleOral,
    toggleHint,
    clearCanvas,
    confirmAbort,
  };
})();
