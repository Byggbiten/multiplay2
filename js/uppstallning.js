/* ============================================================
   MULTIPLAY – Uppställd addition & subtraktion
   Demo-läge (steg-för-steg) + Övningsläge (kolumn för kolumn)
   ============================================================ */
'use strict';

const UppstallningGame = (() => {

  /* ── State ─────────────────────────────────────────────── */
  let profile     = null;
  let mode        = 'addition'; // 'addition' | 'subtraction'
  let subMode     = 'demo';     // 'demo' | 'exercise'
  let difficulty  = 'medium';   // 'easy' | 'medium' | 'hard'

  /* Current problem */
  let numA = 0, numB = 0, result = 0;
  let carries = [];   // carries[col] for addition: 0 or 1
  let borrows = [];   // borrows[col] for subtraction
  let colCount = 3;   // 2 or 3 columns

  /* Demo state */
  let demoStep    = 0;
  let demoSteps   = [];

  /* Exercise state */
  let exerciseIdx    = 0;
  let exScore        = 0;
  let exAttempts     = 0;   // per column
  let exCurrentCol   = 0;   // which column (right=0=ental)
  let exInputLocked  = false;
  let exAnswers      = [];  // filled answers per col (index 0=ental)
  let exBorrowed     = [];  // borrow applied per col
  let exEffA         = [];  // effective digits of A (after borrows)
  let exEffB         = [];  // effective digits of B
  let exCarries      = [];  // carries[col]

  /* Canvas */
  let upCanvas = null, upCtx = null;
  let upDrawing = false, upErasing = false;
  let upLastX = 0, upLastY = 0;

  /* ── Konstanter ─────────────────────────────────────────── */
  const PV_COLORS = { ental: '#22c55e', tiotal: '#3b82f6', hundratal: '#ef4444' };
  const COL_KEYS  = ['ental', 'tiotal', 'hundratal'];
  const COL_LABELS = ['E', 'T', 'H'];
  const LOG_KEY = id => `uppstallning_log_${id}`;

  /* ── Init ───────────────────────────────────────────────── */
  function init(p, m) {
    profile = p;
    mode    = m || 'addition';
    showModeSelect();
  }

  /* ══════════════════════════════════════════════════════════
     VÄLJ-SKÄRM: Demo vs Övning + Svårighetsgrad
  ══════════════════════════════════════════════════════════ */
  function showModeSelect() {
    const root = document.getElementById('uppstallning-root');
    const modeLabel = mode === 'addition' ? 'Addition ➕' : 'Subtraktion ➖';
    const modeColor = mode === 'addition' ? '#d97706' : '#dc2626';
    const modeBg    = mode === 'addition'
      ? 'linear-gradient(135deg,#fef9c3,#eff6ff)'
      : 'linear-gradient(135deg,#fdf4ff,#fef3c7)';

    root.innerHTML = `
      <style id="up-base">
        #uppstallning-root { display:flex; flex-direction:column; height:100vh; overflow:hidden; }
        .up-btn { cursor:pointer; border:none; border-radius:var(--radius-md); font-weight:800;
          transition:transform 0.15s, box-shadow 0.15s; }
        .up-btn:hover { transform:translateY(-2px); box-shadow:var(--shadow-md); }
        .up-card { background:rgba(255,255,255,0.92); border-radius:var(--radius-lg); padding:var(--space-5);
          border:2px solid rgba(37,99,235,0.15); cursor:pointer;
          transition:transform 0.2s var(--ease-bounce), box-shadow 0.2s; }
        .up-card:hover { transform:translateY(-3px); box-shadow:var(--shadow-lg); }
        .diff-btn { padding:8px 18px; border-radius:var(--radius-full); font-weight:800; font-size:13px;
          cursor:pointer; border:2px solid rgba(37,99,235,0.3);
          background:var(--pv-light); color:var(--pv-primary); transition:all 0.15s; }
        .diff-btn.active { background:var(--pv-primary); color:#fff; border-color:var(--pv-primary); }
        @keyframes carry-over {
          0%   { transform: translate(0,0) scale(1); opacity:1; }
          30%  { transform: translate(0,-30px) scale(1.3); opacity:1; }
          70%  { transform: translate(-64px,-60px) scale(0.9); opacity:1; }
          100% { transform: translate(-64px,-80px) scale(0.7); opacity:0; }
        }
        @keyframes drop-down {
          0%   { transform: translateY(-22px); opacity:0; }
          60%  { transform: translateY(4px); opacity:1; }
          100% { transform: translateY(0); opacity:1; }
        }
        @keyframes land-bounce {
          0%   { transform: scale(0.4); opacity:0; }
          65%  { transform: scale(1.25); opacity:1; }
          100% { transform: scale(1); opacity:1; }
        }
        @keyframes glow-green {
          0%,100% { box-shadow: 0 0 8px rgba(34,197,94,0.3); }
          50%      { box-shadow: 0 0 22px rgba(34,197,94,0.7); }
        }
        @keyframes glow-blue {
          0%,100% { box-shadow: 0 0 8px rgba(59,130,246,0.3); }
          50%      { box-shadow: 0 0 22px rgba(59,130,246,0.7); }
        }
        @keyframes glow-red {
          0%,100% { box-shadow: 0 0 8px rgba(239,68,68,0.3); }
          50%      { box-shadow: 0 0 22px rgba(239,68,68,0.7); }
        }
        @keyframes borrow-lift {
          0%   { transform: translate(0,0) scale(1); opacity:1; }
          40%  { transform: translate(0,-22px) scale(1.3); opacity:1; }
          100% { transform: translate(64px,36px) scale(0.8); opacity:0; }
        }
        @keyframes digit-shrink-swap {
          0%   { transform: scale(1); opacity:1; }
          50%  { transform: scale(0.4); opacity:0.4; }
          100% { transform: scale(1); opacity:1; }
        }
        @keyframes digit-grow-swap {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.5); }
          100% { transform: scale(1); }
        }
        @keyframes problem-pulse {
          0%,100% { border-color: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.3); }
          50%      { border-color: #ef4444; box-shadow: 0 0 18px rgba(239,68,68,0.7); }
        }
        @keyframes bubble-in {
          0%   { transform: scale(0.7) translateY(8px); opacity:0; }
          100% { transform: scale(1) translateY(0); opacity:1; }
        }
        .thought-bubble { background:#fff; border-radius:12px; padding:10px 16px;
          box-shadow: 0 4px 18px rgba(0,0,0,0.14); font-weight:800; font-size:15px;
          animation: bubble-in 0.35s var(--ease-bounce);
          border:2px solid rgba(37,99,235,0.18); }
        .col-cell { width:60px; height:60px; border-radius:10px; display:flex;
          align-items:center; justify-content:center; font-size:1.9rem;
          font-weight:900; border:2px solid rgba(0,0,0,0.08); background:rgba(255,255,255,0.92); }
        .col-cell.active-glow-ental    { animation: glow-green 1s ease-in-out infinite; border-color:#22c55e; }
        .col-cell.active-glow-tiotal   { animation: glow-blue  1s ease-in-out infinite; border-color:#3b82f6; }
        .col-cell.active-glow-hundratal{ animation: glow-red   1s ease-in-out infinite; border-color:#ef4444; }
        .col-cell.problem-cell { animation: problem-pulse 0.6s ease-in-out infinite; }
        .carry-cell { width:60px; height:28px; border-radius:6px; display:flex;
          align-items:center; justify-content:center; font-size:0.85rem;
          font-weight:900; color:#d97706; background:rgba(251,191,36,0.15); }
        .answer-input-cell { width:60px; height:60px; border-radius:10px; display:flex;
          align-items:center; justify-content:center; font-size:1.9rem;
          font-weight:900; border:2.5px dashed rgba(37,99,235,0.3);
          background:rgba(255,255,255,0.7); }
        .answer-input-cell.active-col { border-style:solid; border-color:var(--pv-primary);
          background:rgba(37,99,235,0.07); }
        .answer-input-cell.filled { border-style:solid; background:rgba(255,255,255,0.95); }
        .numpad-grid { display:grid; grid-template-columns:repeat(5,44px); gap:5px; justify-content:center; }
        .nk { width:44px; height:44px; border-radius:50%; font-size:var(--text-base); font-weight:900;
          cursor:pointer; background:rgba(255,255,255,0.92); border:1.5px solid rgba(37,99,235,0.3);
          color:var(--pv-primary); transition:transform 0.1s; }
        .nk:hover { transform:scale(1.12); }
        .up-scratch { background:rgba(255,255,255,0.85); border-radius:var(--radius-lg);
          border:1.5px solid rgba(37,99,235,0.15); display:flex; flex-direction:column;
          gap:5px; height:100%; min-height:0; padding:8px; }
        .up-canvas { flex:1; width:100%; display:block; touch-action:none; cursor:crosshair;
          border-radius:var(--radius-md); border:1.5px dashed rgba(37,99,235,0.25);
          background:rgba(255,255,255,0.7); }
      </style>

      <div class="app-header" style="border-bottom-color:rgba(37,99,235,0.2)">
        <button class="btn-back up-btn" style="background:var(--pv-light);color:var(--pv-primary)"
          onclick="UppstallningGame.goBack()">Tillbaka</button>
        <span class="header-title" style="color:${modeColor}">${modeLabel}</span>
        <div style="width:80px"></div>
      </div>

      <div style="padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-4);overflow-y:auto">
        <div class="player-banner">
          <div class="avatar avatar-lg">${profile.avatar}</div>
          <div class="player-info">
            <div class="player-name">${escHtml(profile.name)}</div>
            <div class="player-tagline">Välj läge och svårighetsgrad 🎯</div>
          </div>
        </div>

        <!-- Svårighetsgrad -->
        <div style="background:rgba(255,255,255,0.9);border-radius:var(--radius-lg);padding:var(--space-4);border:2px solid rgba(37,99,235,0.1)">
          <div style="font-weight:800;font-size:13px;color:var(--pv-primary);margin-bottom:var(--space-3);text-transform:uppercase;letter-spacing:0.05em">Svårighetsgrad</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="diff-btn ${difficulty==='easy'?'active':''}" onclick="UppstallningGame.setDifficulty('easy',this)">Lätt</button>
            <button class="diff-btn ${difficulty==='medium'?'active':''}" onclick="UppstallningGame.setDifficulty('medium',this)">Medium</button>
            <button class="diff-btn ${difficulty==='hard'?'active':''}" onclick="UppstallningGame.setDifficulty('hard',this)">Svårt</button>
          </div>
        </div>

        <!-- Demo -->
        <div class="up-card" style="background:${modeBg}" onclick="UppstallningGame.startDemo()">
          <div style="display:flex;align-items:center;gap:var(--space-4)">
            <div style="font-size:2.5rem;width:64px;height:64px;display:flex;align-items:center;justify-content:center;
              border-radius:var(--radius-lg);background:rgba(255,255,255,0.7)">👀</div>
            <div style="flex:1">
              <div style="font-family:var(--font-heading);font-size:var(--text-xl);color:${modeColor}">Titta och lär</div>
              <div style="font-size:var(--text-sm);color:var(--color-text-muted);font-weight:700;margin-top:4px">Se varje steg animerat</div>
            </div>
            <div style="font-size:var(--text-2xl);opacity:0.4">›</div>
          </div>
        </div>

        <!-- Övning -->
        <div class="up-card" onclick="UppstallningGame.startExercise()">
          <div style="display:flex;align-items:center;gap:var(--space-4)">
            <div style="font-size:2.5rem;width:64px;height:64px;display:flex;align-items:center;justify-content:center;
              border-radius:var(--radius-lg);background:rgba(255,255,255,0.7)">✏️</div>
            <div style="flex:1">
              <div style="font-family:var(--font-heading);font-size:var(--text-xl);color:var(--pv-primary)">Räkna själv</div>
              <div style="font-size:var(--text-sm);color:var(--color-text-muted);font-weight:700;margin-top:4px">Fyll i svar kolumn för kolumn</div>
            </div>
            <div style="font-size:var(--text-2xl);opacity:0.4">›</div>
          </div>
        </div>
      </div>
    `;
    Router.show('screen-uppstallning');
  }

  function setDifficulty(d, btn) {
    difficulty = d;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    App.Sound.play('click');
  }

  /* ══════════════════════════════════════════════════════════
     TAL-GENERERING
  ══════════════════════════════════════════════════════════ */
  function generatePair() {
    let a, b;
    if (mode === 'addition') {
      if (difficulty === 'easy') {
        // 2-siffriga, summa < 100, ibland minnessiffra
        do { a = 10 + Math.floor(Math.random()*40); b = 10 + Math.floor(Math.random()*40); }
        while (a + b >= 100);
      } else if (difficulty === 'medium') {
        a = 100 + Math.floor(Math.random()*400);
        b = 100 + Math.floor(Math.random()*300);
      } else {
        // Svårt: garantera minst 1 minnessiffra
        do {
          a = 200 + Math.floor(Math.random()*400);
          b = 200 + Math.floor(Math.random()*300);
        } while (!hasCarry(a, b));
      }
    } else {
      // Subtraktion: a > b alltid
      if (difficulty === 'easy') {
        do { a = 30 + Math.floor(Math.random()*70); b = 10 + Math.floor(Math.random()*20); }
        while (a <= b);
      } else if (difficulty === 'medium') {
        do { a = 200 + Math.floor(Math.random()*400); b = 100 + Math.floor(Math.random()*200); }
        while (a <= b);
      } else {
        // Svårt: garantera minst 1 lån
        do {
          a = 300 + Math.floor(Math.random()*600);
          b = 150 + Math.floor(Math.random()*300);
        } while (a <= b || !hasBorrow(a, b));
      }
    }
    numA = a; numB = b;
    result = mode === 'addition' ? a + b : a - b;

    // Avgör antal kolumner
    colCount = (numA >= 100 || numB >= 100 || result >= 100) ? 3 : 2;

    // Beräkna carries (addition)
    carries = [0, 0, 0];
    if (mode === 'addition') {
      const da = digits(numA), db = digits(numB);
      for (let c = 0; c < 3; c++) {
        const sum = da[c] + db[c] + (c > 0 ? carries[c-1] : 0);
        carries[c] = sum > 9 ? 1 : 0;
      }
    }

    // Beräkna borrows (subtraktion)
    borrows = [0, 0, 0];
    if (mode === 'subtraction') {
      const da = digits(numA), db = digits(numB);
      let effA = [...da];
      for (let c = 0; c < 3; c++) {
        if (effA[c] < db[c]) {
          borrows[c] = 1;
          effA[c] += 10;
          if (c + 1 < 3) effA[c + 1]--;
        }
      }
    }
  }

  function hasCarry(a, b) {
    const da = digits(a), db = digits(b);
    for (let c = 0; c < 3; c++) {
      if (da[c] + db[c] > 9) return true;
    }
    return false;
  }

  function hasBorrow(a, b) {
    const da = digits(a), db = digits(b);
    return da[0] < db[0] || da[1] < db[1];
  }

  // Returns [ental, tiotal, hundratal]
  function digits(n) {
    return [n % 10, Math.floor(n / 10) % 10, Math.floor(n / 100) % 10];
  }

  function getMaxCol() {
    return colCount; // 2 or 3
  }

  /* ══════════════════════════════════════════════════════════
     DEMO-LÄGE
  ══════════════════════════════════════════════════════════ */
  function startDemo() {
    App.Sound.play('click');
    subMode = 'demo';
    generatePair();
    demoStep  = 0;
    demoSteps = buildDemoSteps();
    renderDemo();
  }

  function buildDemoSteps() {
    const steps = [];
    const da = digits(numA), db = digits(numB);

    if (mode === 'addition') {
      let carryVal = 0;
      for (let c = 0; c < getMaxCol(); c++) {
        const colKey = COL_KEYS[c];
        const sum = da[c] + db[c] + carryVal;
        const ans = sum % 10;
        const nextCarry = sum > 9 ? 1 : 0;
        steps.push({ col: c, colKey, da: da[c], db: db[c], carry_in: carryVal, sum, ans, next_carry: nextCarry, type: 'addition' });
        carryVal = nextCarry;
      }
      if (carryVal) {
        steps.push({ col: getMaxCol(), colKey: 'extra', da: 0, db: 0, carry_in: carryVal, sum: carryVal, ans: carryVal, next_carry: 0, type: 'addition_carry_final' });
      }
    } else {
      // Subtraction — compute with borrows
      let effA = [...da];
      let effB = [...db];
      const borrowDone = [false, false, false];

      for (let c = 0; c < getMaxCol(); c++) {
        const colKey = COL_KEYS[c];
        const needsBorrow = effA[c] < effB[c];
        if (needsBorrow) {
          steps.push({ col: c, colKey, effA: effA[c], effB: effB[c], type: 'borrow', origA: effA[c] });
          effA[c] += 10;
          effA[c + 1]--;
          borrowDone[c] = true;
        }
        const diff = effA[c] - effB[c];
        steps.push({ col: c, colKey, effA: effA[c], effB: effB[c], diff, type: 'subtraction', hasBorrow: borrowDone[c] });
      }
    }

    steps.push({ type: 'done' });
    return steps;
  }

  function renderDemo() {
    const root = document.getElementById('uppstallning-root');
    const modeLabel = mode === 'addition' ? 'Addition ➕' : 'Subtraktion ➖';
    const modeColor = mode === 'addition' ? '#d97706' : '#dc2626';

    // Build answer display (which cols are filled so far)
    const answersSoFar = computeAnswersSoFar();

    root.innerHTML = `
      <div class="app-header" style="border-bottom-color:rgba(37,99,235,0.2)">
        <button class="btn-back up-btn" style="background:var(--pv-light);color:var(--pv-primary)"
          onclick="UppstallningGame.goBack()">Avsluta</button>
        <span class="header-title" style="color:${modeColor}">${modeLabel} – Demo</span>
        <div style="width:80px"></div>
      </div>

      <div style="flex:1;display:grid;grid-template-columns:55fr 45fr;gap:8px;padding:8px;overflow:hidden;min-height:0">
        <div style="display:flex;flex-direction:column;gap:8px;overflow-y:auto;min-height:0;padding-bottom:8px">
          ${renderUpstallningTable(answersSoFar)}
          <div id="up-bubble-area"></div>
          <div id="up-step-btn-area">
            ${renderStepButton()}
          </div>
        </div>
        <div class="up-scratch">
          <div style="font-size:10px;font-weight:800;color:var(--pv-primary);text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0">✏️ Kladd</div>
          <canvas id="up-canvas" class="up-canvas"></canvas>
          <div style="display:flex;gap:5px;flex-shrink:0">
            <button onclick="UppstallningGame.upToggleEraser(false)" id="up-draw"
              style="flex:1;height:30px;border-radius:var(--radius-md);font-weight:800;font-size:11px;
              cursor:pointer;background:var(--pv-primary);color:#fff;border:1.5px solid var(--pv-primary)">🖊️ Rita</button>
            <button onclick="UppstallningGame.upToggleEraser(true)" id="up-erase"
              style="flex:1;height:30px;border-radius:var(--radius-md);font-weight:800;font-size:11px;
              cursor:pointer;background:var(--pv-light);color:var(--pv-primary);border:1.5px solid rgba(37,99,235,0.3)">🧹 Sudd</button>
            <button onclick="UppstallningGame.upClearCanvas()"
              style="flex:1;height:30px;border-radius:var(--radius-md);font-weight:800;font-size:11px;
              cursor:pointer;background:var(--pv-light);color:var(--pv-primary);border:1.5px solid rgba(37,99,235,0.3)">🗑️ Rensa</button>
          </div>
        </div>
      </div>
    `;

    setupCanvas('up-canvas');
    highlightDemoColumn();
  }

  function computeAnswersSoFar() {
    // Figure out which answer cells are filled based on demoStep
    const ans = [null, null, null, null]; // 4 slots max
    if (mode === 'addition') {
      let stepIdx = 0, carryVal = 0;
      const da = digits(numA), db = digits(numB);
      for (let c = 0; c < getMaxCol(); c++) {
        const sum = da[c] + db[c] + carryVal;
        if (stepIdx < demoStep) {
          ans[c] = sum % 10;
        }
        carryVal = sum > 9 ? 1 : 0;
        stepIdx++;
      }
      if (carryVal && stepIdx < demoStep) ans[getMaxCol()] = carryVal;
    } else {
      const da = digits(numA), db = digits(numB);
      let effA = [...da];
      let stepIdx = 0;
      for (let c = 0; c < getMaxCol(); c++) {
        const needsBorrow = effA[c] < db[c];
        if (needsBorrow) { stepIdx++; effA[c] += 10; effA[c+1]--; }
        if (stepIdx < demoStep) {
          ans[c] = effA[c] - db[c];
        }
        stepIdx++;
      }
    }
    return ans;
  }

  function renderStepButton() {
    const step = demoSteps[demoStep];
    if (!step) return '';
    if (step.type === 'done') {
      return `
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="up-btn" onclick="UppstallningGame.startDemo()"
            style="flex:1;height:48px;background:var(--pv-primary);color:#fff;font-size:var(--text-base)">🔄 Ny uppgift</button>
          <button class="up-btn" onclick="UppstallningGame.goBack()"
            style="flex:1;height:48px;background:var(--pv-light);color:var(--pv-primary);border:2px solid rgba(37,99,235,0.3);font-size:var(--text-base)">↩ Tillbaka</button>
        </div>`;
    }
    return `
      <button class="up-btn" onclick="UppstallningGame.demoNextStep()"
        style="width:100%;height:52px;background:var(--pv-primary);color:#fff;font-size:var(--text-lg);
        border-radius:var(--radius-lg)">Nästa steg ▶️</button>`;
  }

  function highlightDemoColumn() {
    const step = demoSteps[demoStep];
    if (!step || step.type === 'done') return;
    const colKey = step.colKey;
    if (!colKey || colKey === 'extra') return;

    // Add glow to cells in this column
    ['row-a','row-b','row-ans'].forEach(row => {
      const cell = document.getElementById(`cell-${row}-${colKey}`);
      if (cell) {
        // Dim others
        ['ental','tiotal','hundratal'].forEach(ck => {
          const c2 = document.getElementById(`cell-${row}-${ck}`);
          if (c2) c2.style.opacity = ck === colKey ? '1' : '0.3';
        });
        // Glow on active
        if (step.type !== 'borrow') {
          cell.classList.add(`active-glow-${colKey}`);
        } else {
          cell.classList.add('problem-cell');
        }
      }
    });

    showThoughtBubble(step);
  }

  function showThoughtBubble(step) {
    const area = document.getElementById('up-bubble-area');
    if (!area) return;
    let text = '';
    if (step.type === 'addition') {
      const ci = step.carry_in;
      if (step.sum > 9) {
        const extra = ci ? ` + ${ci} (minne)` : '';
        text = `${step.da} + ${step.db}${extra} = ${step.sum}<br>
          Skriv <strong style="color:${PV_COLORS[step.colKey]}">${step.ans}</strong>, minns
          <strong style="color:#d97706">1</strong> till nästa kolumn 💭`;
      } else {
        const extra = ci ? ` + ${ci} (minne)` : '';
        text = `${step.da} + ${step.db}${extra} = <strong style="color:${PV_COLORS[step.colKey]}">${step.sum}</strong>`;
      }
    } else if (step.type === 'borrow') {
      text = `<span style="color:#ef4444">⚠️ ${step.origA} &lt; ${step.effB}!</span><br>Vi behöver låna från nästa kolumn.`;
    } else if (step.type === 'subtraction') {
      text = step.hasBorrow
        ? `(Lånade: ${step.effA}) − ${step.effB} = <strong style="color:${PV_COLORS[step.colKey]}">${step.diff}</strong>`
        : `${step.effA} − ${step.effB} = <strong style="color:${PV_COLORS[step.colKey]}">${step.diff}</strong>`;
    } else if (step.type === 'addition_carry_final') {
      text = `Minnessiffran blir <strong style="color:${PV_COLORS.hundratal}">${step.ans}</strong> — skriv den i svaret!`;
    }

    area.innerHTML = text
      ? `<div class="thought-bubble">${text}</div>`
      : '';
  }

  function demoNextStep() {
    const step = demoSteps[demoStep];
    if (!step) return;

    if (step.type === 'addition') {
      if (step.next_carry) {
        playCarrySound();
        animateCarry(step.colKey, step.ans, () => {
          demoStep++;
          refreshDemoTable();
        });
      } else {
        App.Sound.play('correct');
        animateDropDown(step.colKey, step.ans, () => {
          demoStep++;
          refreshDemoTable();
        });
      }
    } else if (step.type === 'addition_carry_final') {
      App.Sound.play('correct');
      demoStep++;
      refreshDemoTable();
    } else if (step.type === 'borrow') {
      playBorrowSound();
      animateBorrow(step.col, () => {
        demoStep++;
        refreshDemoTable();
      });
    } else if (step.type === 'subtraction') {
      App.Sound.play('correct');
      animateDropDown(step.colKey, step.diff, () => {
        demoStep++;
        refreshDemoTable();
      });
    } else if (step.type === 'done') {
      App.Confetti.burst(80);
      App.Sound.play('fanfare');
      refreshDemoTable();
    }
  }

  function refreshDemoTable() {
    const answersSoFar = computeAnswersSoFar();
    const tableEl = document.getElementById('up-table-wrap');
    if (tableEl) tableEl.innerHTML = buildTableHTML(answersSoFar);

    const btnArea = document.getElementById('up-step-btn-area');
    if (btnArea) btnArea.innerHTML = renderStepButton();

    highlightDemoColumn();

    const step = demoSteps[demoStep];
    if (step && step.type === 'done') {
      App.Confetti.burst(80);
      App.Sound.play('fanfare');
    }
  }

  /* ── Animationer ────────────────────────────────────────── */
  function animateCarry(fromColKey, ansDigit, cb) {
    // Drop the answer digit first
    const ansCell = document.getElementById(`cell-row-ans-${fromColKey}`);
    if (ansCell) {
      ansCell.innerHTML = `<span style="color:${PV_COLORS[fromColKey]};animation:drop-down 0.5s ease-out both">${ansDigit}</span>`;
    }
    // Animate carry label
    const carryCell = document.getElementById(`carry-cell-${fromColKey}`);
    if (carryCell) {
      setTimeout(() => {
        carryCell.innerHTML = `<span style="animation:land-bounce 0.5s var(--ease-bounce) both;display:inline-block">1</span>`;
      }, 400);
    }
    setTimeout(cb, 1200);
  }

  function animateDropDown(colKey, digit, cb) {
    const ansCell = document.getElementById(`cell-row-ans-${colKey}`);
    if (ansCell) {
      ansCell.innerHTML = `<span style="color:${PV_COLORS[colKey]};animation:drop-down 0.6s ease-out both;display:inline-block">${digit}</span>`;
    }
    setTimeout(cb, 900);
  }

  function animateBorrow(col, cb) {
    const colKey  = COL_KEYS[col];
    const srcKey  = COL_KEYS[col + 1]; // column we borrow from
    const da = digits(numA);

    // Flash the source cell
    const srcCell = document.getElementById(`cell-row-a-${srcKey}`);
    if (srcCell) {
      srcCell.style.animation = 'digit-shrink-swap 0.6s ease-in-out';
      setTimeout(() => {
        if (srcCell) {
          srcCell.innerHTML = `<span style="color:${PV_COLORS[srcKey]}">${da[col+1]-1}</span>`;
          srcCell.style.animation = '';
        }
      }, 500);
    }

    // Grow the destination cell
    setTimeout(() => {
      const dstCell = document.getElementById(`cell-row-a-${colKey}`);
      if (dstCell) {
        dstCell.style.animation = 'digit-grow-swap 0.5s ease-in-out';
        setTimeout(() => {
          if (dstCell) {
            dstCell.innerHTML = `<span style="color:${PV_COLORS[colKey]}">${da[col]+10}</span>`;
            dstCell.style.animation = '';
          }
        }, 400);
      }
    }, 300);

    setTimeout(cb, 1100);
  }

  /* ── Tabell-rendering ───────────────────────────────────── */
  function renderUpstallningTable(answersSoFar) {
    return `<div id="up-table-wrap" style="background:rgba(255,255,255,0.9);border-radius:var(--radius-lg);
      padding:var(--space-4);border:2px solid rgba(37,99,235,0.12)">
      ${buildTableHTML(answersSoFar)}
    </div>`;
  }

  function buildTableHTML(answersSoFar) {
    const da = digits(numA), db = digits(numB);
    const maxC = getMaxCol();
    // Columns shown: for 2-digit use tiotal+ental, for 3-digit use all 3
    const cols = maxC === 2
      ? [{ key:'tiotal', label:'T', idx:1 }, { key:'ental', label:'E', idx:0 }]
      : [{ key:'hundratal', label:'H', idx:2 }, { key:'tiotal', label:'T', idx:1 }, { key:'ental', label:'E', idx:0 }];

    const opSymbol = mode === 'addition' ? '+' : '−';

    // Carry row (addition only)
    let carryRowHTML = '';
    if (mode === 'addition') {
      carryRowHTML = `
        <tr>
          <td style="padding-right:6px;font-size:11px;color:#d97706;font-weight:800;text-align:right">minne:</td>
          ${cols.map(c => {
            const showCarry = c.idx < maxC - 1 && carries[c.idx];
            return `<td style="text-align:center">
              <div class="carry-cell" id="carry-cell-${c.key}">${showCarry ? '1' : ''}</div>
            </td>`;
          }).join('')}
          <td></td>
        </tr>`;
    }

    // Build answer cells
    const answerCells = cols.map(c => {
      const val = answersSoFar[c.idx];
      return `<td style="text-align:center">
        <div class="col-cell" id="cell-row-ans-${c.key}" style="border-color:${PV_COLORS[c.key]}">
          <span style="color:${PV_COLORS[c.key]}">${val !== null ? val : ''}</span>
        </div>
      </td>`;
    }).join('');

    return `
      <table style="border-collapse:separate;border-spacing:6px;margin:0 auto">
        <thead>
          <tr>
            <td></td>
            ${cols.map(c => `<th style="text-align:center;font-size:13px;font-weight:900;color:${PV_COLORS[c.key]};padding-bottom:4px">${c.label}</th>`).join('')}
            <td></td>
          </tr>
        </thead>
        <tbody>
          ${carryRowHTML}
          <tr>
            <td style="padding-right:6px;font-size:13px;color:var(--color-text-muted);text-align:right"></td>
            ${cols.map(c => `<td style="text-align:center">
              <div class="col-cell" id="cell-row-a-${c.key}" style="border-color:${PV_COLORS[c.key]}">
                <span style="color:${PV_COLORS[c.key]}">${c.idx < String(numA).length ? da[c.idx] : ''}</span>
              </div>
            </td>`).join('')}
            <td></td>
          </tr>
          <tr>
            <td style="padding-right:6px;font-size:1.5rem;font-weight:900;color:#666;text-align:right">${opSymbol}</td>
            ${cols.map(c => `<td style="text-align:center">
              <div class="col-cell" id="cell-row-b-${c.key}" style="border-color:${PV_COLORS[c.key]}">
                <span style="color:${PV_COLORS[c.key]}">${c.idx < String(numB).length ? db[c.idx] : ''}</span>
              </div>
            </td>`).join('')}
            <td></td>
          </tr>
          <tr>
            <td colspan="${cols.length+2}" style="padding:2px 0">
              <div style="height:3px;background:linear-gradient(90deg,transparent,#374151,transparent);border-radius:2px"></div>
            </td>
          </tr>
          <tr>
            <td style="padding-right:6px"></td>
            ${answerCells}
            <td></td>
          </tr>
        </tbody>
      </table>
    `;
  }

  /* ══════════════════════════════════════════════════════════
     ÖVNINGSLÄGE
  ══════════════════════════════════════════════════════════ */
  function startExercise() {
    App.Sound.play('click');
    subMode      = 'exercise';
    exerciseIdx  = 0;
    exScore      = 0;
    newExerciseProblem();
  }

  function newExerciseProblem() {
    generatePair();
    exAttempts    = 0;
    exCurrentCol  = 0; // start with ental (rightmost)
    exInputLocked = false;
    exAnswers     = [null, null, null];
    exBorrowed    = [false, false, false];
    exCarries     = [0, 0, 0];

    // For subtraction pre-compute effective values & borrows
    const da = digits(numA), db = digits(numB);
    exEffA = [...da];
    exEffB = [...db];

    renderExercise();
  }

  function renderExercise() {
    const root = document.getElementById('uppstallning-root');
    const modeLabel = mode === 'addition' ? 'Addition ➕' : 'Subtraktion ➖';
    const modeColor = mode === 'addition' ? '#d97706' : '#dc2626';

    root.innerHTML = `
      <div class="app-header" style="border-bottom-color:rgba(37,99,235,0.2)">
        <button class="btn-back up-btn" style="background:var(--pv-light);color:var(--pv-primary)"
          onclick="UppstallningGame.goBack()">Avsluta</button>
        <span class="header-title" style="color:${modeColor}">${modeLabel} – Övning</span>
        <div style="font-size:12px;font-weight:800;color:var(--color-text-muted)">${exerciseIdx+1}/5</div>
      </div>

      <div style="flex:1;display:grid;grid-template-columns:55fr 45fr;gap:8px;padding:8px;overflow:hidden;min-height:0">
        <div style="display:flex;flex-direction:column;gap:8px;overflow-y:auto;min-height:0;padding-bottom:8px">
          ${renderExTable()}
          <div id="ex-bubble"></div>
          <div id="ex-numpad-area">
            ${renderNumpad()}
          </div>
          <div id="ex-feedback"></div>
          ${mode === 'subtraction' && !exBorrowed[exCurrentCol] && exEffA[exCurrentCol] < exEffB[exCurrentCol]
            ? `<button class="up-btn" onclick="UppstallningGame.exDoBorrow()"
                style="width:100%;height:46px;background:#fef3c7;color:#d97706;border:2px solid #f59e0b;font-size:var(--text-base)">
                💡 Låna från nästa kolumn</button>`
            : ''}
        </div>
        <div class="up-scratch">
          <div style="font-size:10px;font-weight:800;color:var(--pv-primary);text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0">✏️ Kladd</div>
          <canvas id="up-canvas" class="up-canvas"></canvas>
          <div style="display:flex;gap:5px;flex-shrink:0">
            <button onclick="UppstallningGame.upToggleEraser(false)" id="up-draw"
              style="flex:1;height:30px;border-radius:var(--radius-md);font-weight:800;font-size:11px;
              cursor:pointer;background:var(--pv-primary);color:#fff;border:1.5px solid var(--pv-primary)">🖊️ Rita</button>
            <button onclick="UppstallningGame.upToggleEraser(true)" id="up-erase"
              style="flex:1;height:30px;border-radius:var(--radius-md);font-weight:800;font-size:11px;
              cursor:pointer;background:var(--pv-light);color:var(--pv-primary);border:1.5px solid rgba(37,99,235,0.3)">🧹 Sudd</button>
            <button onclick="UppstallningGame.upClearCanvas()"
              style="flex:1;height:30px;border-radius:var(--radius-md);font-weight:800;font-size:11px;
              cursor:pointer;background:var(--pv-light);color:var(--pv-primary);border:1.5px solid rgba(37,99,235,0.3)">🗑️ Rensa</button>
          </div>
        </div>
      </div>
    `;

    setupCanvas('up-canvas');
    updateExBubble();
  }

  function renderExTable() {
    const maxC = getMaxCol();
    const cols = maxC === 2
      ? [{ key:'tiotal', label:'T', idx:1 }, { key:'ental', label:'E', idx:0 }]
      : [{ key:'hundratal', label:'H', idx:2 }, { key:'tiotal', label:'T', idx:1 }, { key:'ental', label:'E', idx:0 }];

    const opSymbol = mode === 'addition' ? '+' : '−';
    const da = digits(numA), db = digits(numB);

    const answerCells = cols.map(c => {
      const val = exAnswers[c.idx];
      const isActive = c.idx === exCurrentCol && val === null;
      const isFilled = val !== null;
      let cls = 'answer-input-cell';
      if (isActive) cls += ' active-col';
      if (isFilled) cls += ' filled';
      return `<td style="text-align:center">
        <div class="${cls}" id="ex-ans-${c.key}" style="${isFilled?'border-color:'+PV_COLORS[c.key]:isActive?'':''}">
          <span style="color:${PV_COLORS[c.key]}">${val !== null ? val : (isActive ? '?' : '')}</span>
        </div>
      </td>`;
    }).join('');

    // Carry row for addition
    let carryRowHTML = '';
    if (mode === 'addition') {
      carryRowHTML = `<tr>
        <td style="font-size:11px;color:#d97706;font-weight:800;text-align:right;padding-right:6px">minne:</td>
        ${cols.map(c => {
          const show = exCarries[c.idx];
          return `<td style="text-align:center">
            <div class="carry-cell" id="ex-carry-${c.key}">${show ? '1' : ''}</div>
          </td>`;
        }).join('')}
        <td></td>
      </tr>`;
    }

    // Effective A (after borrows for subtraction)
    const showEffA = (idx) => {
      if (mode === 'subtraction' && exBorrowed[idx]) return exEffA[idx];
      return digits(numA)[idx];
    };

    return `<div style="background:rgba(255,255,255,0.9);border-radius:var(--radius-lg);
      padding:var(--space-4);border:2px solid rgba(37,99,235,0.12)">
      <table style="border-collapse:separate;border-spacing:6px;margin:0 auto">
        <thead>
          <tr>
            <td></td>
            ${cols.map(c => `<th style="text-align:center;font-size:13px;font-weight:900;color:${PV_COLORS[c.key]};padding-bottom:4px">${c.label}</th>`).join('')}
            <td></td>
          </tr>
        </thead>
        <tbody>
          ${carryRowHTML}
          <tr>
            <td></td>
            ${cols.map(c => `<td style="text-align:center">
              <div class="col-cell ${c.idx===exCurrentCol?'active-glow-'+c.key:''}"
                style="border-color:${PV_COLORS[c.key]};opacity:${c.idx===exCurrentCol?1:c.idx<exCurrentCol?0.5:1}">
                <span style="color:${PV_COLORS[c.key]}" id="ex-a-${c.key}">${c.idx < String(numA).length ? showEffA(c.idx) : ''}</span>
              </div>
            </td>`).join('')}
            <td></td>
          </tr>
          <tr>
            <td style="font-size:1.5rem;font-weight:900;color:#666;text-align:right;padding-right:6px">${opSymbol}</td>
            ${cols.map(c => `<td style="text-align:center">
              <div class="col-cell" style="border-color:${PV_COLORS[c.key]};opacity:${c.idx===exCurrentCol?1:c.idx<exCurrentCol?0.5:1}">
                <span style="color:${PV_COLORS[c.key]}">${c.idx < String(numB).length ? db[c.idx] : ''}</span>
              </div>
            </td>`).join('')}
            <td></td>
          </tr>
          <tr>
            <td colspan="${cols.length+2}" style="padding:2px 0">
              <div style="height:3px;background:linear-gradient(90deg,transparent,#374151,transparent);border-radius:2px"></div>
            </td>
          </tr>
          <tr>
            <td></td>
            ${answerCells}
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>`;
  }

  function renderNumpad() {
    const colKey = COL_KEYS[exCurrentCol];
    return `
      <div style="background:rgba(255,255,255,0.9);border-radius:var(--radius-lg);padding:var(--space-3);border:2px solid rgba(37,99,235,0.1)">
        <div style="font-size:11px;font-weight:800;color:${PV_COLORS[colKey]};text-align:center;margin-bottom:6px;text-transform:uppercase">
          Fyll i ${COL_LABELS[exCurrentCol] === 'E' ? 'entalet' : COL_LABELS[exCurrentCol] === 'T' ? 'tiotalet' : 'hundratalet'}
        </div>
        <div class="numpad-grid">
          ${[1,2,3,4,5,6,7,8,9,'⌫',0,''].map(k => k === ''
            ? '<div></div>'
            : `<button class="nk" onclick="UppstallningGame.exNumpadPress(${JSON.stringify(String(k))})">${k}</button>`
          ).join('')}
        </div>
      </div>`;
  }

  function updateExBubble() {
    const area = document.getElementById('ex-bubble');
    if (!area) return;
    const colKey = COL_KEYS[exCurrentCol];
    const da = exEffA, db = exEffB;

    let msg = '';
    if (mode === 'addition') {
      const ci = exCarries[exCurrentCol] || 0;
      const extra = ci ? ` + ${ci} (minne)` : '';
      msg = `Vad är <strong style="color:${PV_COLORS[colKey]}">${da[exCurrentCol]}</strong> + <strong style="color:${PV_COLORS[colKey]}">${db[exCurrentCol]}</strong>${extra}?`;
    } else {
      if (da[exCurrentCol] < db[exCurrentCol] && !exBorrowed[exCurrentCol]) {
        msg = `<span style="color:#ef4444">⚠️ ${da[exCurrentCol]} är mindre än ${db[exCurrentCol]}!</span><br>Tryck "Låna" för att låna från nästa kolumn.`;
      } else {
        msg = `Vad är <strong style="color:${PV_COLORS[colKey]}">${da[exCurrentCol]}</strong> − <strong style="color:${PV_COLORS[colKey]}">${db[exCurrentCol]}</strong>?`;
      }
    }
    area.innerHTML = msg ? `<div class="thought-bubble">${msg}</div>` : '';
  }

  let exCurrentInput = '';

  function exNumpadPress(key) {
    if (exInputLocked) return;
    const fb = document.getElementById('ex-feedback');
    if (fb) fb.innerHTML = '';

    if (key === '⌫') {
      exCurrentInput = exCurrentInput.slice(0, -1);
    } else {
      if (exCurrentInput.length < 2) exCurrentInput += key;
    }

    // Show current input in active answer cell
    const colKey = COL_KEYS[exCurrentCol];
    const ansEl = document.getElementById(`ex-ans-${colKey}`);
    if (ansEl) {
      ansEl.querySelector('span').textContent = exCurrentInput || '?';
    }

    // Auto-submit when 1 digit entered (or 2 digits for carry check)
    if (exCurrentInput.length === 1) {
      // For addition: if the correct column result >9, user might enter just the unit digit
      // Submit immediately after 1 digit
      setTimeout(() => { if (!exInputLocked) exSubmitCol(); }, 400);
    }
  }

  function exSubmitCol() {
    if (exInputLocked || !exCurrentInput) return;
    exInputLocked = true;
    const colKey = COL_KEYS[exCurrentCol];
    const da = exEffA, db = exEffB;

    let correctAns;
    if (mode === 'addition') {
      const ci = exCarries[exCurrentCol] || 0;
      const sum = da[exCurrentCol] + db[exCurrentCol] + ci;
      correctAns = sum % 10;
      // Check if carry needed
      if (sum > 9 && exCurrentCol + 1 < getMaxCol()) {
        exCarries[exCurrentCol + 1] = (exCarries[exCurrentCol + 1] || 0) + 1;
      }
    } else {
      correctAns = da[exCurrentCol] - db[exCurrentCol];
    }

    const userAns = parseInt(exCurrentInput);

    if (userAns === correctAns) {
      // Correct!
      exAnswers[exCurrentCol] = correctAns;
      exAttempts = 0;
      exCurrentInput = '';
      App.Sound.play('correct');

      // Carry animation?
      if (mode === 'addition') {
        const ci = exCarries[exCurrentCol] || 0;
        const sum = digits(numA)[exCurrentCol] + digits(numB)[exCurrentCol] + (ci > 0 ? 1 : 0);
        if (sum > 9 && exCurrentCol + 1 < getMaxCol()) {
          playCarrySound();
        }
      }

      celebrationSmall();

      // Check if done
      const nextCol = exCurrentCol + 1;
      if (nextCol >= getMaxCol()) {
        // All columns done — handle overflow carry for addition
        if (mode === 'addition') {
          const lastCarry = exCarries[getMaxCol()] || 0;
          if (lastCarry && getMaxCol() < 3) {
            exAnswers[getMaxCol()] = lastCarry;
          }
        }
        setTimeout(exShowResult, 1000);
      } else {
        exCurrentCol = nextCol;
        exInputLocked = false;
        renderExercise();
      }
    } else {
      exAttempts++;
      exCurrentInput = '';
      exInputLocked = false;

      if (exAttempts >= 2) {
        // Show answer and move on
        App.Sound.play('wrong');
        const fb = document.getElementById('ex-feedback');
        if (fb) fb.innerHTML = `<div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);border:2px solid #f59e0b;
          border-radius:var(--radius-md);padding:var(--space-3);font-weight:800;color:#92400e;text-align:center">
          Svaret är <strong style="color:${PV_COLORS[colKey]}">${correctAns}</strong></div>`;
        exAnswers[exCurrentCol] = correctAns;
        exAttempts = 0;

        setTimeout(() => {
          const nextCol = exCurrentCol + 1;
          if (nextCol >= getMaxCol()) {
            exShowResult();
          } else {
            exCurrentCol = nextCol;
            exInputLocked = false;
            renderExercise();
          }
        }, 1800);
      } else {
        App.Sound.play('wrong');
        const fb = document.getElementById('ex-feedback');
        if (fb) fb.innerHTML = `<div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);border:2px solid #f59e0b;
          border-radius:var(--radius-md);padding:var(--space-3);font-weight:800;color:#92400e;text-align:center">
          Hmm, prova igen! 💪</div>`;
      }
    }
  }

  function exDoBorrow() {
    if (exInputLocked) return;
    const c = exCurrentCol;
    if (c + 1 >= 3) return;

    playBorrowSound();
    exBorrowed[c] = true;
    exEffA[c] += 10;
    exEffA[c + 1] = Math.max(0, exEffA[c + 1] - 1);

    renderExercise();
  }

  function exShowResult() {
    // Did user get the correct final answer?
    const dr = digits(result);
    let correct = true;
    for (let c = 0; c < getMaxCol(); c++) {
      if (exAnswers[c] !== dr[c]) { correct = false; break; }
    }
    if (correct) exScore++;

    exerciseIdx++;
    if (exerciseIdx >= 5) {
      showExerciseFinalResults();
    } else {
      // Quick result feedback then next problem
      const root = document.getElementById('uppstallning-root');
      const hdr = root.querySelector('.app-header');
      const area = document.createElement('div');
      area.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:99';
      area.innerHTML = `<div style="background:${correct?'#dcfce7':'#fef9c3'};border:2px solid ${correct?'#22c55e':'#f59e0b'};
        border-radius:var(--radius-lg);padding:var(--space-3) var(--space-5);font-weight:800;
        color:${correct?'#166534':'#92400e'};font-size:var(--text-lg)">
        ${correct?'✅ Rätt!':'💪 Nästa!'} Uppgift ${exerciseIdx}/5</div>`;
      document.body.appendChild(area);
      if (correct) celebrationSmall();
      setTimeout(() => {
        area.remove();
        newExerciseProblem();
      }, 1200);
    }
  }

  function showExerciseFinalResults() {
    App.Sound.play(exScore >= 4 ? 'fanfare' : 'correct');
    if (exScore === 5) App.Confetti.burst(160);
    saveLog(exScore, 5);

    const root = document.getElementById('uppstallning-root');
    const emoji = exScore === 5 ? '🌟' : exScore >= 4 ? '🥇' : exScore >= 3 ? '🥈' : '💪';
    const msg   = exScore === 5 ? 'Perfekt! 🎉' : exScore >= 4 ? 'Fantastiskt!' : exScore >= 3 ? 'Jättebra!' : 'Fortsätt öva!';
    const modeLabel = mode === 'addition' ? 'Addition ➕' : 'Subtraktion ➖';

    root.innerHTML = `
      <div class="app-header" style="border-bottom-color:rgba(37,99,235,0.2)">
        <button class="btn-back up-btn" style="background:var(--pv-light);color:var(--pv-primary)"
          onclick="UppstallningGame.goBack()">Tillbaka</button>
        <span class="header-title" style="color:var(--pv-primary)">🏆 Resultat</span>
        <div style="width:80px"></div>
      </div>
      <div style="padding:var(--space-6);display:flex;flex-direction:column;align-items:center;gap:var(--space-5)">
        <div style="background:linear-gradient(135deg,var(--pv-primary),var(--pv-secondary));
          border-radius:var(--radius-xl);padding:var(--space-8) var(--space-6);text-align:center;
          color:white;width:100%;animation:bounce-in 0.6s var(--ease-bounce)">
          <div style="font-size:4rem;margin-bottom:var(--space-3)">${emoji}</div>
          <div style="font-family:var(--font-heading);font-size:var(--text-2xl)">${msg}</div>
          <div style="font-size:var(--text-5xl);font-weight:900;margin:var(--space-3) 0">
            ${exScore} <span style="font-size:var(--text-2xl);opacity:0.8">av 5</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-3);width:100%">
          <button class="btn btn-lg up-btn" style="background:linear-gradient(135deg,var(--pv-primary),var(--pv-secondary));color:white;border:none"
            onclick="UppstallningGame.startExercise()">🔄 Spela igen</button>
          <button class="btn btn-ghost up-btn" style="border-color:var(--pv-primary);color:var(--pv-primary)"
            onclick="UppstallningGame.goBack()">↩ Välj läge</button>
        </div>
      </div>
    `;
  }

  /* ── Celebration burst (liten) ──────────────────────────── */
  function celebrationSmall() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    const shapes = ['⭐','💫','✨','🌟','🎉','💙','💚','🔢'];
    for (let i = 0; i < 30; i++) {
      const el = document.createElement('span');
      el.className = 'confetti-piece';
      el.textContent = shapes[Math.floor(Math.random() * shapes.length)];
      el.style.cssText = `left:${Math.random()*100}%;font-size:${12+Math.random()*14}px;
        animation-duration:${1.2+Math.random()*1.5}s;animation-delay:${Math.random()*0.2}s`;
      container.appendChild(el);
    }
    setTimeout(() => {
      if (container) {
        const pieces = container.querySelectorAll('.confetti-piece');
        pieces.forEach(p => p.remove());
      }
    }, 2500);
  }

  /* ── Ljud ───────────────────────────────────────────────── */
  function playCarrySound() {
    try {
      const ac = new (window.AudioContext || window['webkitAudioContext'])();
      const osc = ac.createOscillator(), gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.frequency.setValueAtTime(400, ac.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ac.currentTime + 0.2);
      gain.gain.setValueAtTime(0.18, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
      osc.start(ac.currentTime); osc.stop(ac.currentTime + 0.25);
    } catch (_) {}
  }

  function playBorrowSound() {
    try {
      const ac = new (window.AudioContext || window['webkitAudioContext'])();
      const osc = ac.createOscillator(), gain = ac.createGain();
      osc.type = 'triangle';
      osc.connect(gain); gain.connect(ac.destination);
      osc.frequency.setValueAtTime(500, ac.currentTime);
      osc.frequency.linearRampToValueAtTime(250, ac.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
      osc.start(ac.currentTime); osc.stop(ac.currentTime + 0.35);
    } catch (_) {}
  }

  /* ── Canvas ─────────────────────────────────────────────── */
  function setupCanvas(id) {
    upCanvas = document.getElementById(id);
    if (!upCanvas) return;
    upErasing = false;
    requestAnimationFrame(() => {
      const r = upCanvas.getBoundingClientRect();
      upCanvas.width  = r.width  || 300;
      upCanvas.height = r.height || 200;
      upCtx = upCanvas.getContext('2d');
      upCanvas.addEventListener('pointerdown',  upPD);
      upCanvas.addEventListener('pointermove',  upPM);
      upCanvas.addEventListener('pointerup',    upPU);
      upCanvas.addEventListener('pointercancel', upPU);
    });
  }

  function upPD(e) {
    e.preventDefault(); upDrawing = true;
    const r = upCanvas.getBoundingClientRect();
    upLastX = (e.clientX - r.left) * (upCanvas.width / r.width);
    upLastY = (e.clientY - r.top)  * (upCanvas.height / r.height);
    upCanvas.setPointerCapture(e.pointerId);
  }

  function upPM(e) {
    if (!upDrawing || !upCtx) return;
    e.preventDefault();
    const r = upCanvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (upCanvas.width / r.width);
    const y = (e.clientY - r.top)  * (upCanvas.height / r.height);
    if (upErasing) {
      upCtx.globalCompositeOperation = 'destination-out';
      upCtx.lineWidth = 20;
    } else {
      upCtx.globalCompositeOperation = 'source-over';
      upCtx.lineWidth = 2 + (e.pressure || 0.5) * 3;
      upCtx.strokeStyle = '#3b82f6';
    }
    upCtx.lineCap = 'round'; upCtx.lineJoin = 'round';
    upCtx.beginPath(); upCtx.moveTo(upLastX, upLastY);
    upCtx.lineTo(x, y); upCtx.stroke();
    upLastX = x; upLastY = y;
  }

  function upPU() { upDrawing = false; }

  function upToggleEraser(on) {
    upErasing = on;
    const d = document.getElementById('up-draw');
    const e = document.getElementById('up-erase');
    if (d) { d.style.background = on ? 'var(--pv-light)' : 'var(--pv-primary)'; d.style.color = on ? 'var(--pv-primary)' : '#fff'; }
    if (e) { e.style.background = on ? 'var(--pv-primary)' : 'var(--pv-light)'; e.style.color = on ? '#fff' : 'var(--pv-primary)'; }
  }

  function upClearCanvas() {
    if (upCtx && upCanvas) upCtx.clearRect(0, 0, upCanvas.width, upCanvas.height);
  }

  /* ── Navigation ─────────────────────────────────────────── */
  function goBack() {
    document.getElementById('uppstallning-root').innerHTML = '';
    PlatsvardeGame.showSelect();
  }

  /* ── Hjälpfunktioner ────────────────────────────────────── */
  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function saveLog(score, total) {
    if (!profile) return;
    try {
      const key = LOG_KEY(profile.id);
      const log = JSON.parse(localStorage.getItem(key)) || [];
      log.unshift({ date: new Date().toISOString(), mode, difficulty, score, total });
      if (log.length > 30) log.pop();
      localStorage.setItem(key, JSON.stringify(log));
    } catch (_) {}
  }

  /* ── Publik API ─────────────────────────────────────────── */
  return {
    init,
    showModeSelect,
    setDifficulty,
    startDemo,
    startExercise,
    demoNextStep,
    exNumpadPress,
    exDoBorrow,
    upToggleEraser,
    upClearCanvas,
    goBack,
  };
})();
