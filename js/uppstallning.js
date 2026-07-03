/* ============================================================
   MULTIPLAY – Uppställd addition & subtraktion
   Demo-läge (steg-för-steg) + Övningsläge (kolumn för kolumn)
   ============================================================ */
'use strict';

const UppstallningGame = (() => {

  /* ── State ─────────────────────────────────────────────── */
  let profile    = null;
  let mode       = 'addition';

  let difficulty = 2; // Sifferskala 1–4 (1=🌱 Tal 0–20, 2=🌿 Tvåsiffrigt, 3=🌾 Över hundra, 4=🌳 Minnessiffra/lån)

  let numA = 0, numB = 0;
  let colCount = 3;

  /* Demo */
  let demoStep    = 0;
  let demoSteps   = [];
  let stepLocked  = false;        // locked during animation
  let demoEffA    = [];           // current display values for row A
  let demoCarries = [];           // carry row values [0=ental,1=tiotal,2=hundratal]
  let demoCarryUsed = [];         // whether carry[c] has been consumed
  let demoAns     = [null,null,null,null]; // filled answer digits
  let demoBorrowTens = [false, false, false]; // borrow-ten markers active per col

  /* Exercise */
  let exerciseIdx   = 0;
  let exScore       = 0;
  let exCurrentCol  = 0;
  let exInputLocked = false;
  let exAnswers     = [];
  let exInput       = '';
  let exColData     = []; // preprocessad per-kolumn data från buildDemoSteps
  let helpMode      = true; // true = med hjälp, false = utan hjälp
  let exTenPhase = [];  // 0=visa "Tryck för att se", 1=visa förklaring, 2=animation körd, 3=carry körd

  /* Free mode (utan hjälp) */
  let exFreeValues       = [null, null, null];
  let exFreeActiveCol    = 0;    // null = markören släckt (allt ifyllt)
  let exFreeFirstAttempt = true;
  let exFreeZeroLock     = [false, false, false]; // låsta ledande nollor
  let exFreeDoneLock     = [false, false, false]; // gröna, verifierade rutor
  let exFreeFillOrder    = [];                    // ifyllnadsordning (för sudd)

  /* Canvas */
  let upCanvas = null, upCtx = null;
  let upDrawing = false, upErasing = false;
  let upLastX = 0, upLastY = 0;

  /* ── Konstanter ─────────────────────────────────────────── */
  const PVC = { ental: '#22c55e', tiotal: '#3b82f6', hundratal: '#ef4444' };
  const COL_KEYS   = ['ental','tiotal','hundratal'];
  const COL_LABELS = ['E','T','H'];
  const LOG_KEY    = id => `uppstallning_log_${id}`;

  /* ── CSS (injected once per view) ──────────────────────── */
  const BASE_CSS = `
    /* Helskärmslayout – överskriver app.css max-width */
    #screen-addsub, #screen-uppstallning {
      max-width:100% !important; width:100% !important; padding:0 !important; }
    #screen-addsub .app-header, #screen-uppstallning .app-header { max-width:100% !important; }

    #uppstallning-root { display:flex; flex-direction:column; height:100vh; overflow:hidden; }
    #up-main { flex:1; display:flex; overflow:hidden; min-height:0; }
    #up-left { flex:1; display:flex; flex-direction:column; gap:8px;
               overflow-y:auto; padding:clamp(6px,1.5vw,12px); min-height:0; padding-bottom:12px; }
    #up-right { flex:1; display:flex; flex-direction:column; padding:clamp(6px,1.5vw,12px); gap:5px; min-height:0; }
    @media (orientation:landscape) { #up-main { flex-direction:row; } }
    @media (orientation:portrait) {
      #up-main { flex-direction:column; }
      #up-left { flex:1; }
      #up-right { flex:0 0 35vh; min-height:120px; }
    }
    .up-btn { cursor:pointer; border:none; border-radius:12px; font-weight:800;
      transition:transform 0.15s,box-shadow 0.15s; }
    .up-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,0.15); }
    .up-btn:disabled { opacity:0.45; cursor:not-allowed; transform:none; }
    .up-card { background:rgba(255,255,255,0.92); border-radius:16px; padding:20px;
      border:2px solid rgba(37,99,235,0.15); cursor:pointer;
      transition:transform 0.2s,box-shadow 0.2s; }
    .up-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.12); }
    .diff-row { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
    @media (max-width:480px) { .diff-row { grid-template-columns:repeat(2,1fr); } }
    .diff-btn { padding:8px 6px; border-radius:14px; font-weight:800; font-size:13px;
      cursor:pointer; border:2px solid rgba(37,99,235,0.3);
      background:var(--pv-light); color:var(--pv-primary); transition:all 0.15s;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      gap:2px; line-height:1.15; }
    .diff-btn .diff-num  { font-size:1.05rem; font-weight:900; }
    .diff-btn .diff-desc { font-size:10.5px; font-weight:800; opacity:0.85; }
    .diff-btn.active { background:var(--pv-primary); color:#fff; border-color:var(--pv-primary); }

    /* Uppställningstabell */
    #up-table-wrap { position:relative; background:rgba(255,255,255,0.93);
      border-radius:16px; padding:clamp(8px,1.5vw,16px); border:2px solid rgba(37,99,235,0.12); width:100%; }
    .up-table { border-collapse:separate; border-spacing:clamp(4px,1vw,8px); margin:0 auto; }
    .col-cell { width:clamp(46px,8vw,74px); height:clamp(46px,8vw,74px); border-radius:11px; position:relative;
      display:flex; align-items:center; justify-content:center;
      font-size:clamp(1.6rem,4vw,3rem); font-weight:900;
      border:2px solid rgba(0,0,0,0.08); background:rgba(255,255,255,0.92);
      overflow:visible; }
    .col-cell.dim { opacity:0.28; }
    .col-cell.glow-ental    { animation:glow-g 1.1s ease-in-out infinite; border-color:#22c55e; }
    .col-cell.glow-tiotal   { animation:glow-b 1.1s ease-in-out infinite; border-color:#3b82f6; }
    .col-cell.glow-hundratal{ animation:glow-r 1.1s ease-in-out infinite; border-color:#ef4444; }
    .col-cell.problem-cell  { animation:prob-pulse 0.55s ease-in-out infinite; }
    .carry-cell { width:clamp(46px,8vw,74px); height:clamp(20px,3vw,28px); border-radius:6px; display:flex;
      align-items:center; justify-content:center; font-size:clamp(0.7rem,1.5vw,0.95rem); font-weight:900;
      color:#d97706; background:rgba(251,191,36,0.13); }
    .ans-cell { width:clamp(46px,8vw,74px); height:clamp(46px,8vw,74px); border-radius:11px; display:flex;
      align-items:center; justify-content:center; font-size:clamp(1.6rem,4vw,3rem); font-weight:900;
      border:2.5px dashed rgba(37,99,235,0.28); background:rgba(255,255,255,0.7); }
    .ans-cell.active-col { border-style:solid; border-color:var(--pv-primary);
      background:rgba(37,99,235,0.07); }
    .ans-cell.filled { border-style:solid; }
    .ans-cell.wrong { border:2.5px solid #ef4444 !important; background:rgba(239,68,68,0.1) !important; }
    .ans-cell.clickable { cursor:pointer; }

    /* Diagonal streck */
    .dw { position:relative; display:inline-flex; align-items:center; justify-content:center;
      width:100%; height:100%; }
    .dw.crossed::after { content:''; position:absolute; left:4px; right:4px; top:50%;
      height:3px; background:#ef4444; border-radius:2px;
      transform:rotate(-22deg) scaleX(0); transform-origin:left center;
      animation:strike-draw 0.42s ease-out 0.05s forwards; }
    .dw.carry-crossed::after { background:#d97706; }
    .digit-new { font-size:clamp(0.75rem,1.5vw,0.92rem); font-weight:900; pointer-events:none; white-space:nowrap;
      animation:fade-up-flex 0.4s ease-out 0.45s both; }
    .small-new-digit { position:absolute; bottom:2px; right:4px;
      font-size:clamp(0.58rem,1.2vw,0.78rem); font-weight:900; pointer-events:none; z-index:2; }

    /* Borrow-ten wrapper och marker */
    .bt-wrap { position:absolute; bottom:100%; left:50%; transform:translateX(-50%);
      display:flex; flex-direction:column; align-items:center; gap:2px;
      pointer-events:none; padding-bottom:2px; z-index:5; }
    .borrow-ten { font-size:clamp(0.7rem,1.5vw,0.88rem); font-weight:900; color:#dc2626; background:#fee2e2;
      border:1.5px solid #ef4444; border-radius:6px; padding:1px clamp(4px,0.8vw,6px);
      pointer-events:none; animation:land-bounce-flex 0.45s ease-out both; white-space:nowrap; }
    .borrow-ten.used { text-decoration:line-through; opacity:0.4; animation:none; }

    /* Tankebubbla */
    .thought-bubble { background:#fff; border-radius:16px;
      padding:clamp(8px,1.5vw,14px) clamp(10px,2vw,18px);
      box-shadow:0 2px 12px rgba(0,0,0,0.10); font-weight:800;
      font-size:clamp(0.92rem,2vw,1.15rem);
      border:2px solid rgba(37,99,235,0.16); animation:bubble-in 0.3s ease-out; line-height:1.5; }

    /* Numpad i övningsläge */
    .ex-numpad { display:grid; grid-template-columns:repeat(5,clamp(40px,7vw,60px)); gap:5px; justify-content:center; }
    .ex-nk { width:clamp(40px,7vw,60px); height:clamp(40px,7vw,60px); border-radius:50%;
      font-size:clamp(0.95rem,2vw,1.1rem); font-weight:900;
      cursor:pointer; background:rgba(255,255,255,0.92); border:1.5px solid rgba(37,99,235,0.3);
      color:var(--pv-primary); transition:transform 0.1s; }
    .ex-nk:hover { transform:scale(1.12); }

    /* Fria läget: markör, pil och låsta rutor */
    .ans-cell.free-cursor { position:relative; animation:free-glow 1.2s ease-in-out infinite; }
    .free-arrow { position:absolute; bottom:calc(100% + 2px); left:50%;
      transform:translateX(-50%); font-size:clamp(1rem,2.2vw,1.3rem);
      pointer-events:none; z-index:6; animation:arrow-bounce 0.9s ease-in-out infinite; }
    .ans-cell.free-locked { border-style:dashed; border-color:rgba(100,116,139,0.25);
      background:rgba(148,163,184,0.08); cursor:default; }

    /* Canvas */
    .up-scratch { background:rgba(255,255,255,0.85); border-radius:14px;
      border:1.5px solid rgba(37,99,235,0.15); display:flex; flex-direction:column;
      gap:5px; flex:1; min-height:0; padding:8px; }
    .up-canvas { flex:1; min-height:120px; width:100%; display:block; touch-action:none;
      cursor:crosshair; border-radius:10px; border:2px dashed rgba(37,99,235,0.25);
      background:rgba(255,255,255,0.8); }

    /* Keyframes */
    @keyframes strike-draw {
      from { transform:rotate(-22deg) scaleX(0); }
      to   { transform:rotate(-22deg) scaleX(1); }
    }
    @keyframes fade-up {
      from { opacity:0; transform:translateX(-50%) translateY(8px); }
      to   { opacity:1; transform:translateX(-50%) translateY(0); }
    }
    @keyframes drop-down {
      0%   { transform:translateY(-20px); opacity:0; }
      65%  { transform:translateY(4px); opacity:1; }
      100% { transform:translateY(0); opacity:1; }
    }
    @keyframes land-bounce {
      0%   { transform:translateX(-50%) scale(0.3); opacity:0; }
      65%  { transform:translateX(-50%) scale(1.25); opacity:1; }
      100% { transform:translateX(-50%) scale(1); opacity:1; }
    }
    @keyframes land-bounce-flex {
      0%   { transform:scale(0.3); opacity:0; }
      65%  { transform:scale(1.25); opacity:1; }
      100% { transform:scale(1); opacity:1; }
    }
    @keyframes fade-up-flex {
      from { opacity:0; transform:translateY(8px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes glow-g {
      0%,100% { box-shadow:0 0 8px rgba(34,197,94,0.3); }
      50%      { box-shadow:0 0 22px rgba(34,197,94,0.7); }
    }
    @keyframes glow-b {
      0%,100% { box-shadow:0 0 8px rgba(59,130,246,0.3); }
      50%      { box-shadow:0 0 22px rgba(59,130,246,0.7); }
    }
    @keyframes glow-r {
      0%,100% { box-shadow:0 0 8px rgba(239,68,68,0.3); }
      50%      { box-shadow:0 0 22px rgba(239,68,68,0.7); }
    }
    @keyframes prob-pulse {
      0%,100% { border-color:#ef4444; box-shadow:0 0 6px rgba(239,68,68,0.4); }
      50%      { border-color:#ef4444; box-shadow:0 0 18px rgba(239,68,68,0.8); }
    }
    @keyframes bubble-in {
      from { transform:scale(0.75) translateY(6px); opacity:0; }
      to   { transform:scale(1) translateY(0); opacity:1; }
    }
    @keyframes borrow-glow {
      0%,100% { box-shadow: 0 4px 12px rgba(245,158,11,0.5); }
      50%      { box-shadow: 0 6px 28px rgba(245,158,11,0.95); }
    }
    @keyframes free-glow {
      0%,100% { box-shadow:0 0 6px rgba(37,99,235,0.30); }
      50%      { box-shadow:0 0 20px rgba(37,99,235,0.75); }
    }
    @keyframes arrow-bounce {
      0%,100% { transform:translateX(-50%) translateY(0); }
      50%      { transform:translateX(-50%) translateY(-7px); }
    }
  `;

  /* ── Init ───────────────────────────────────────────────── */
  function init(p, m) {
    profile = p;
    mode    = m || 'addition';
    showModeSelect();
  }

  /* ══════════════════════════════════════════════════════════
     VÄLJ-SKÄRM
  ══════════════════════════════════════════════════════════ */
  function showModeSelect() {
    const root = document.getElementById('uppstallning-root');
    const modeLabel = mode === 'addition' ? 'Addition ➕' : 'Subtraktion ➖';
    const modeColor = mode === 'addition' ? '#d97706' : '#dc2626';
    const modeBg    = mode === 'addition'
      ? 'linear-gradient(135deg,#fef9c3,#eff6ff)'
      : 'linear-gradient(135deg,#fdf4ff,#fef3c7)';

    const levels = [
      { n: 1, emoji: '🌱', desc: 'Tal 0–20' },
      { n: 2, emoji: '🌿', desc: 'Tvåsiffrigt' },
      { n: 3, emoji: '🌾', desc: 'Över hundra' },
      { n: 4, emoji: '🌳', desc: mode === 'addition' ? 'Med minnessiffra' : 'Med lån' },
    ];
    const diffBtnsHTML = levels.map(l => `
      <button class="diff-btn ${difficulty === l.n ? 'active' : ''}"
        onclick="UppstallningGame.setDifficulty(${l.n},this)">
        <span class="diff-num">${l.n} ${l.emoji}</span>
        <span class="diff-desc">${l.desc}</span>
      </button>`).join('');

    root.innerHTML = `
      <style id="up-base">${BASE_CSS}</style>
      <div class="app-header" style="border-bottom-color:rgba(37,99,235,0.2)">
        <button class="btn-back up-btn" style="background:var(--pv-light);color:var(--pv-primary)"
          onclick="UppstallningGame.goBack()">Tillbaka</button>
        <span class="header-title" style="color:${modeColor}">${modeLabel}</span>
        <div style="width:80px"></div>
      </div>
      <div style="padding:16px;display:flex;flex-direction:column;gap:14px;overflow-y:auto">
        <div class="player-banner">
          <div class="avatar avatar-lg">${profile.avatar}</div>
          <div class="player-info">
            <div class="player-name">${escHtml(profile.name)}</div>
            <div class="player-tagline">Välj läge och svårighetsgrad 🎯</div>
          </div>
        </div>
        <div style="background:rgba(255,255,255,0.9);border-radius:14px;padding:14px;border:2px solid rgba(37,99,235,0.1)">
          <div style="font-weight:800;font-size:12px;color:var(--pv-primary);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em">Svårighetsgrad</div>
          <div class="diff-row">${diffBtnsHTML}</div>
        </div>
        <div class="up-card" style="background:${modeBg}" onclick="UppstallningGame.startDemo()">
          <div style="display:flex;align-items:center;gap:16px">
            <div style="font-size:2.5rem;width:60px;height:60px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:rgba(255,255,255,0.7)">👀</div>
            <div style="flex:1">
              <div style="font-family:var(--font-heading);font-size:1.3rem;color:${modeColor}">Titta och lär</div>
              <div style="font-size:0.85rem;color:var(--color-text-muted);font-weight:700;margin-top:4px">Se varje steg animerat – tryck "Nästa steg"</div>
            </div>
            <div style="font-size:1.5rem;opacity:0.4">›</div>
          </div>
        </div>
        <div class="up-card" onclick="UppstallningGame.startExercise()">
          <div style="display:flex;align-items:center;gap:16px">
            <div style="font-size:2.5rem;width:60px;height:60px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:rgba(255,255,255,0.7)">✏️</div>
            <div style="flex:1">
              <div style="font-family:var(--font-heading);font-size:1.3rem;color:var(--pv-primary)">Räkna själv</div>
              <div style="font-size:0.85rem;color:var(--color-text-muted);font-weight:700;margin-top:4px">Fyll i svar kolumn för kolumn</div>
            </div>
            <div style="font-size:1.5rem;opacity:0.4">›</div>
          </div>
        </div>
      </div>`;
    Router.show('screen-uppstallning');
  }

  function setDifficulty(n, btn) {
    difficulty = n;
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
      if (difficulty === 1) {
        // Nivå 1 🌱: tal 0–20 (a,b ≥ 2, summa ≤ 20)
        do { a = 2 + rnd(18); b = 2 + rnd(18); } while (a + b > 20);
      } else if (difficulty === 2) {
        // Nivå 2 🌿: tvåsiffrigt, summa < 100
        do { a = 10 + rnd(40); b = 10 + rnd(40); } while (a + b >= 100);
      } else if (difficulty === 3) {
        // Nivå 3 🌾: två tvåsiffriga tal med summa över hundra (100–198)
        do { a = 40 + rnd(60); b = 40 + rnd(60); } while (a + b < 100);
      } else {
        // Nivå 4 🌳: tresiffrigt med garanterad minnessiffra
        do { a = 200 + rnd(400); b = 200 + rnd(300); } while (!hasCarry(a,b) || a + b >= 1000);
      }
    } else {
      if (difficulty === 1) {
        // Nivå 1 🌱: tal 0–20 (a 5–20, b 1 till a−1)
        a = 5 + rnd(16); b = 1 + rnd(a - 1);
      } else if (difficulty === 2) {
        // Nivå 2 🌿: tvåsiffrigt
        do { a = 30 + rnd(70); b = 10 + rnd(20); } while (a <= b);
      } else if (difficulty === 3) {
        // Nivå 3 🌾: över hundra — a 100–198, b tvåsiffrigt, differens 1–99 (lån över hundratalet)
        do { a = 100 + rnd(99); b = 10 + rnd(90); } while (a - b < 1 || a - b > 99);
      } else {
        // Nivå 4 🌳: garantera minst 1 lån. 50% chans att tiotalet=0 (dubbellån).
        if (Math.random() < 0.5) {
          do {
            const hA = 3 + rnd(7), eA = 1 + rnd(4);
            a = hA * 100 + 0 * 10 + eA;
            const hB = 1 + rnd(hA - 1), tB = 1 + rnd(5), eB = eA + 3 + rnd(5);
            b = hB * 100 + tB * 10 + Math.min(eB, 9);
          } while (a <= b);
        } else {
          do { a = 300 + rnd(600); b = 150 + rnd(300); }
          while (a <= b || !hasBorrow(a,b));
        }
      }
    }
    numA = a; numB = b;
    // Hundratalskolumn även när två tvåsiffriga tal ger tresiffrig summa (nivå 3-addition)
    colCount = (numA >= 100 || numB >= 100 || (mode === 'addition' && numA + numB >= 100)) ? 3 : 2;
  }

  function hasCarry(a, b) {
    const da = digs(a), db = digs(b);
    for (let c = 0; c < 3; c++) if (da[c] + db[c] > 9) return true;
    return false;
  }

  function hasBorrow(a, b) {
    const da = digs(a), db = digs(b);
    return da[0] < db[0] || da[1] < db[1];
  }

  function digs(n) { // [ental, tiotal, hundratal]
    return [n % 10, Math.floor(n/10) % 10, Math.floor(n/100) % 10];
  }

  function rnd(n) { return Math.floor(Math.random() * n); }

  /* ══════════════════════════════════════════════════════════
     DEMO-LÄGE
  ══════════════════════════════════════════════════════════ */
  function startDemo() {
    App.Sound.play('click');
    generatePair();
    demoStep       = 0;
    stepLocked     = false;
    demoEffA       = [...digs(numA)];
    demoCarries    = [0, 0, 0];
    demoCarryUsed  = [false, false, false];
    demoAns        = [null, null, null, null];
    demoBorrowTens = [false, false, false];
    demoSteps      = buildDemoSteps();
    renderDemoView();
  }

  /* ── Steg-byggare ───────────────────────────────────────── */
  function buildDemoSteps() {
    const steps = [];
    const da = [...digs(numA)], db = digs(numB);
    const maxC = colCount;

    if (mode === 'addition') {
      let carryVal = 0;
      for (let c = 0; c < maxC; c++) {
        const a = da[c], b = db[c];
        const effectiveA = a + carryVal;
        const sum = effectiveA + b;
        const ans = sum % 10;
        const nextCarry = sum > 9 ? 1 : 0;
        steps.push({ type:'add_highlight', col:c });
        if (sum > 9) {
          const behover = 10 - effectiveA;
          const kvar = b - behover;
          steps.push({ type:'add_over9', col:c, a, b, carry_in:carryVal, sum, effectiveA });
          steps.push({ type:'add_explain', col:c, a, b, carry_in:carryVal,
                       effectiveA, behover, kvar, ans, nextCarry });
          steps.push({ type:'add_cross', col:c, a, b, carry_in:carryVal,
                       effectiveA, behover, kvar, ans, nextCarry });
          steps.push({ type:'add_carry_fly', col:c, nextCarry });
          steps.push({ type:'add_result', col:c, a, b, kvar, ans, nextCarry });
        } else {
          steps.push({ type:'add_simple', col:c, a, b, carry_in:carryVal, sum, ans });
        }
        carryVal = nextCarry;
      }
      if (carryVal) steps.push({ type:'add_overflow', digit:carryVal });
    } else {
      // Kompletteringsmetoden
      const effA = [...da];
      for (let c = 0; c < maxC; c++) {
        steps.push({ type:'sub_highlight', col:c, a:effA[c], b:db[c] });
        if (effA[c] < db[c]) {
          const diff = db[c] - effA[c];
          const isDouble = c + 1 < maxC && effA[c+1] === 0 && c + 2 < maxC;
          steps.push({ type: isDouble ? 'sub_cant_double' : 'sub_cant',
            col:c, a:effA[c], b:db[c] });
          if (isDouble) {
            // Mellanlån H → T (separat steg, T visar nytt värde)
            steps.push({ type:'sub_borrow', srcCol:c+2, dstCol:c+1,
              srcNew:effA[c+2]-1, dstNew:effA[c+1]+10, mainCol:c });
            effA[c+2]--; effA[c+1] += 10;
          }
          // sub_flip + T→E lån i ETT steg
          steps.push({ type:'sub_flip_borrow', col:c, a:effA[c], b:db[c], diff,
            srcCol:c+1, srcNew:effA[c+1]-1 });
          effA[c+1]--;
          steps.push({ type:'sub_ten_minus', col:c, diff, ans:10-diff });
        } else {
          steps.push({ type:'sub_calc', col:c, a:effA[c], b:db[c], diff:effA[c]-db[c] });
        }
      }
    }
    steps.push({ type:'done' });
    return steps;
  }

  /* ── Preprocessa steg → per-kolumn övningsdata ──────────── */
  function preprocessExSteps(steps) {
    const result = [];
    for (let c = 0; c < colCount; c++) {
      const cantStep    = steps.find(s => (s.type === 'sub_cant' || s.type === 'sub_cant_double') && s.col === c);
      const flipStep    = steps.find(s => s.type === 'sub_flip_borrow' && s.col === c);
      const tenStep     = steps.find(s => s.type === 'sub_ten_minus'   && s.col === c);
      const calcStep    = steps.find(s => s.type === 'sub_calc'        && s.col === c);
      const interStep   = steps.find(s => s.type === 'sub_borrow'      && s.mainCol === c);
      const overStep     = steps.find(s => s.type === 'add_over9'       && s.col === c);
      const explainStep  = steps.find(s => s.type === 'add_explain'    && s.col === c);
      const crossStep    = steps.find(s => s.type === 'add_cross'      && s.col === c);
      const carryFlyStep = steps.find(s => s.type === 'add_carry_fly'  && s.col === c);
      const resultStep   = steps.find(s => (s.type === 'add_result' || s.type === 'add_simple') && s.col === c);
      result[c] = {
        correctAnswer:   tenStep?.ans ?? calcStep?.diff ?? resultStep?.ans ?? 0,
        nextCarry:       resultStep?.nextCarry ?? 0,
        needsBorrow:     !!cantStep,
        isDouble:        cantStep?.type === 'sub_cant_double',
        flipStep:        flipStep    || null,
        interStep:       interStep   || null,
        needsTenFriend:  !!overStep,
        overStep:        overStep    || null,
        explainStep:     explainStep || null,
        crossStep:       crossStep   || null,
        carryFlyStep:    carryFlyStep|| null,
        resultStep:      resultStep  || null,
      };
    }
    return result;
  }

  /* ── Render demo-vy ─────────────────────────────────────── */
  function renderDemoView() {
    const root = document.getElementById('uppstallning-root');
    const modeLabel = mode === 'addition' ? 'Addition ➕' : 'Subtraktion ➖';
    const modeColor = mode === 'addition' ? '#d97706' : '#dc2626';

    root.innerHTML = `
      <style id="up-base">${BASE_CSS}</style>
      <div class="app-header" style="border-bottom-color:rgba(37,99,235,0.2)">
        <button class="btn-back up-btn" style="background:var(--pv-light);color:var(--pv-primary)"
          onclick="UppstallningGame.goBack()">Avsluta</button>
        <span class="header-title" style="color:${modeColor}">${modeLabel} – Demo</span>
        <div style="width:80px"></div>
      </div>
      <div id="up-main">
        <div id="up-left">
          <div id="up-table-wrap">${buildTableHTML()}</div>
          <div id="up-bubble"></div>
          <div id="up-next-area">${nextBtnHTML()}</div>
        </div>
        <div id="up-right">
          ${scratchHTML()}
        </div>
      </div>`;

    setupCanvas('up-canvas');
    showStepBubble();
  }

  /* ── Nästa steg ─────────────────────────────────────────── */
  function demoNextStep() {
    if (stepLocked) return;
    const step = demoSteps[demoStep];
    if (!step || step.type === 'done') return;
    lockStep();
    executeStep(step, () => {
      demoStep++;
      unlockStep();
      showStepBubble();
      refreshNextBtn();
    });
  }

  function executeStep(step, cb) {
    if (step.type === 'add_highlight') {
      highlightCol(step.col);
      setTimeout(cb, 50);

    } else if (step.type === 'add_over9') {
      highlightCol(step.col);
      const colKey = COL_KEYS[step.col];
      ['row-a','row-b'].forEach(row => {
        const el = document.getElementById(`cell-${row}-${colKey}`);
        if (el) el.classList.add('problem-cell');
      });
      setTimeout(() => {
        ['row-a','row-b'].forEach(row => {
          const el = document.getElementById(`cell-${row}-${colKey}`);
          if (el) el.classList.remove('problem-cell');
        });
        cb();
      }, 1200);

    } else if (step.type === 'add_explain') {
      // Bara en förklaringsbubbla, ingen animation. Bubblan uppdateras av showStepBubble().
      highlightCol(step.col);
      setTimeout(cb, 50);

    } else if (step.type === 'add_cross') {
      highlightCol(step.col);
      const colKey = COL_KEYS[step.col];
      // t=0: Stryk undre siffran, visa "kvar" som liten siffra
      const dwB = document.getElementById(`dw-b-${colKey}`);
      if (dwB) {
        dwB.classList.add('crossed');
        const sp = document.createElement('span');
        sp.className = 'small-new-digit';
        sp.style.color = '#d97706';
        sp.textContent = step.kvar;
        dwB.appendChild(sp);
      }
      // t=400ms: Stryk övre siffran, visa "10" som liten siffra
      setTimeout(() => {
        const dwA = document.getElementById(`dw-a-${colKey}`);
        if (dwA) {
          dwA.classList.add('crossed');
          const sp = document.createElement('span');
          sp.className = 'small-new-digit';
          sp.style.color = '#d97706';
          sp.textContent = '10';
          dwA.appendChild(sp);
        }
        setTimeout(cb, 500);
      }, 400);

    } else if (step.type === 'add_carry_fly') {
      if (step.nextCarry && step.col + 1 < colCount) {
        playCarrySound();
        animateCarryToken(step.col, step.col + 1, () => {
          demoCarries[step.col + 1] = 1;
          updateCarryRow();
          setTimeout(cb, 300);
        });
      } else {
        setTimeout(cb, 100);
      }

    } else if (step.type === 'add_result') {
      highlightCol(step.col);
      const colKey = COL_KEYS[step.col];
      setTimeout(() => {
        const ansCell = document.getElementById(`ans-${colKey}`);
        if (ansCell) {
          ansCell.innerHTML = `<span style="color:${PVC[colKey]};animation:drop-down 0.55s ease-out both;display:inline-block">${step.ans}</span>`;
          ansCell.classList.add('filled');
          ansCell.style.borderColor = PVC[colKey];
        }
        demoAns[step.col] = step.ans;
        App.Sound.play('correct');
        setTimeout(cb, 700);
      }, 300);

    } else if (step.type === 'add_simple') {
      highlightCol(step.col);
      const colKey = COL_KEYS[step.col];
      setTimeout(() => {
        const ansCell = document.getElementById(`ans-${colKey}`);
        if (ansCell) {
          ansCell.innerHTML = `<span style="color:${PVC[colKey]};animation:drop-down 0.55s ease-out both;display:inline-block">${step.ans}</span>`;
          ansCell.classList.add('filled');
          ansCell.style.borderColor = PVC[colKey];
        }
        demoAns[step.col] = step.ans;
        App.Sound.play('correct');
        setTimeout(cb, 700);
      }, 300);

    } else if (step.type === 'add_overflow') {
      App.Sound.play('correct');
      setTimeout(cb, 400);

    } else if (step.type === 'sub_highlight') {
      highlightCol(step.col);
      setTimeout(cb, 50);

    } else if (step.type === 'sub_cant' || step.type === 'sub_cant_double') {
      const colKey = COL_KEYS[step.col];
      ['row-a','row-b'].forEach(row => {
        const el = document.getElementById(`cell-${row}-${colKey}`);
        if (el) el.classList.add('problem-cell');
      });
      setTimeout(() => {
        ['row-a','row-b'].forEach(row => {
          const el = document.getElementById(`cell-${row}-${colKey}`);
          if (el) el.classList.remove('problem-cell');
        });
        cb();
      }, 1100);

    } else if (step.type === 'sub_flip_borrow') {
      // Fas 1 (t=0): stryk A och B i aktiva kolumnen
      const colKey = COL_KEYS[step.col];
      const srcKey = COL_KEYS[step.srcCol];
      const dwA = document.getElementById(`dw-a-${colKey}`);
      if (dwA) {
        dwA.classList.add('crossed');
        const sp = document.createElement('span');
        sp.className = 'small-new-digit';
        sp.style.color = '#dc2626';
        sp.textContent = 0;
        dwA.appendChild(sp);
      }
      const dwB = document.getElementById(`dw-b-${colKey}`);
      if (dwB) {
        dwB.classList.add('crossed');
        const sp = document.createElement('span');
        sp.className = 'small-new-digit';
        sp.style.color = '#dc2626';
        sp.textContent = step.diff;
        dwB.appendChild(sp);
      }
      // Fas 2 (t=500ms): stryk src-kolumnen, visa srcNew
      setTimeout(() => {
        playBorrowSound();
        const srcDw = document.getElementById(`dw-a-${srcKey}`);
        if (srcDw) {
          srcDw.classList.add('crossed');
          // Ersätt befintlig digit-new (i bt-wrap, om dubbellån lämnade en) med srcNew
          const srcBtWrap = document.getElementById(`bt-wrap-${srcKey}`);
          const existing = srcBtWrap ? srcBtWrap.querySelector('.digit-new') : null;
          if (existing) {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = `display:flex;gap:3px;align-items:center;pointer-events:none;white-space:nowrap;`;
            wrapper.innerHTML =
              `<span style="color:${PVC[srcKey]};font-size:clamp(0.75rem,1.5vw,0.92rem);font-weight:900;text-decoration:line-through;opacity:0.4">${existing.textContent}</span>` +
              `<span style="color:${PVC[srcKey]};font-size:clamp(0.75rem,1.5vw,0.92rem);font-weight:900;animation:land-bounce-flex 0.45s ease-out both">${step.srcNew}</span>`;
            existing.replaceWith(wrapper);
          } else {
            const sp = document.createElement('span');
            sp.className = 'digit-new';
            sp.style.color = PVC[srcKey];
            sp.textContent = step.srcNew;
            if (srcBtWrap) srcBtWrap.appendChild(sp); else srcDw.appendChild(sp);
          }
        }
        demoEffA[step.srcCol] = step.srcNew;
        // Fas 3 (t=1000ms): token flyger + borrow-ten visas
        setTimeout(() => {
          showBorrowTen(step.col);
          animateBorrowToken(step.srcCol, step.col, null, () => {
            setTimeout(cb, 300);
          });
        }, 500);
      }, 500);

    } else if (step.type === 'sub_borrow') {
      // Mellanlån (H→T vid dubbellån) — separat steg
      playBorrowSound();
      const srcKey = COL_KEYS[step.srcCol];
      const dstKey = COL_KEYS[step.dstCol];
      const srcDw = document.getElementById(`dw-a-${srcKey}`);
      if (srcDw) {
        srcDw.classList.add('crossed');
        const sp = document.createElement('span');
        sp.className = 'digit-new';
        sp.style.color = PVC[srcKey];
        sp.textContent = step.srcNew;
        const srcBtWrap = document.getElementById(`bt-wrap-${srcKey}`);
        if (srcBtWrap) srcBtWrap.appendChild(sp); else srcDw.appendChild(sp);
      }
      demoEffA[step.srcCol] = step.srcNew;
      setTimeout(() => {
        animateBorrowToken(step.srcCol, step.dstCol, null, () => {
          const dstDw = document.getElementById(`dw-a-${dstKey}`);
          if (dstDw) {
            dstDw.classList.add('crossed');
            const sp2 = document.createElement('span');
            sp2.className = 'digit-new';
            sp2.style.color = PVC[dstKey];
            sp2.textContent = step.dstNew;
            const dstBtWrap = document.getElementById(`bt-wrap-${dstKey}`);
            if (dstBtWrap) dstBtWrap.appendChild(sp2); else dstDw.appendChild(sp2);
          }
          demoEffA[step.dstCol] = step.dstNew;
          setTimeout(cb, 300);
        });
      }, 400);

    } else if (step.type === 'sub_ten_minus') {
      highlightCol(step.col);
      const colKey = COL_KEYS[step.col];
      // Kryssa av borrow-ten-markören
      useBorrowTen(step.col);
      setTimeout(() => {
        const ansCell = document.getElementById(`ans-${colKey}`);
        if (ansCell) {
          ansCell.innerHTML = `<span style="color:${PVC[colKey]};animation:drop-down 0.55s ease-out both;display:inline-block">${step.ans}</span>`;
          ansCell.classList.add('filled');
          ansCell.style.borderColor = PVC[colKey];
        }
        demoAns[step.col] = step.ans;
        App.Sound.play('correct');
        setTimeout(cb, 700);
      }, 400);

    } else if (step.type === 'sub_calc') {
      highlightCol(step.col);
      const colKey = COL_KEYS[step.col];
      setTimeout(() => {
        const ansCell = document.getElementById(`ans-${colKey}`);
        if (ansCell) {
          ansCell.innerHTML = `<span style="color:${PVC[colKey]};animation:drop-down 0.55s ease-out both;display:inline-block">${step.diff}</span>`;
          ansCell.classList.add('filled');
          ansCell.style.borderColor = PVC[colKey];
        }
        demoAns[step.col] = step.diff;
        App.Sound.play('correct');
        setTimeout(cb, 700);
      }, 300);

    } else {
      cb();
    }
  }

  /* ── Highlight aktiv kolumn ─────────────────────────────── */
  function highlightCol(col) {
    const colKey = COL_KEYS[col];
    for (let c = 0; c < colCount; c++) {
      const ck = COL_KEYS[c];
      ['row-a','row-b'].forEach(row => {
        const el = document.getElementById(`cell-${row}-${ck}`);
        if (!el) return;
        el.classList.remove('glow-ental','glow-tiotal','glow-hundratal','dim');
        if (c === col) el.classList.add(`glow-${colKey}`);
        else el.classList.add('dim');
      });
    }
  }

  /* ── Tankebubbla ────────────────────────────────────────── */
  function showStepBubble() {
    const area = document.getElementById('up-bubble');
    if (!area) return;
    const step = demoSteps[demoStep];
    if (!step) { area.innerHTML = ''; return; }

    let html = '';
    if (step.type === 'add_highlight') {
      html = '';
    } else if (step.type === 'add_over9') {
      const ck = COL_KEYS[step.col];
      const ciStr = step.carry_in ? ` + <span style="color:#d97706">${step.carry_in}</span> (minne)` : '';
      html = `<span style="color:${PVC[ck]}">${step.a}</span> + <span style="color:${PVC[ck]}">${step.b}</span>${ciStr}... Hmm, det blir mer än 9! 🤔`;
    } else if (step.type === 'add_explain') {
      const ck = COL_KEYS[step.col];
      if (step.carry_in) {
        html = `<span style="color:${PVC[ck]}">${step.a}</span> + <span style="color:#d97706">${step.carry_in}</span> = <strong>${step.effectiveA}</strong> (<span style="color:#d97706">${step.carry_in}</span>:an är minnessiffran).<br>
          <span style="color:${PVC[ck]}">${step.effectiveA}</span>:ans 10-kompis är <strong>${step.behover}</strong>.<br>
          Vi tar <strong>${step.behover}</strong> från <span style="color:${PVC[ck]}">${step.b}</span>: ${step.b} − ${step.behover} = <strong>${step.kvar}</strong> (kvar från <span style="color:${PVC[ck]}">${step.b}</span>:an blir <strong>${step.kvar}</strong>).<br>
          Så <span style="color:${PVC[ck]}">${step.b}</span> blir <strong>${step.kvar}</strong> och <span style="color:${PVC[ck]}">${step.a}</span>:an blir <strong>10</strong>! 💡`;
      } else {
        html = `<span style="color:${PVC[ck]}">${step.effectiveA}</span>:ans 10-kompis är <strong>${step.behover}</strong>.<br>
          Vi tar <strong>${step.behover}</strong> från <span style="color:${PVC[ck]}">${step.b}</span>: ${step.b} − ${step.behover} = <strong>${step.kvar}</strong> (kvar från <span style="color:${PVC[ck]}">${step.b}</span>:an blir <strong>${step.kvar}</strong>).<br>
          Så <span style="color:${PVC[ck]}">${step.b}</span> blir <strong>${step.kvar}</strong> och <span style="color:${PVC[ck]}">${step.effectiveA}</span> blir <strong>10</strong>! 💡`;
      }
    } else if (step.type === 'add_cross') {
      const ck = COL_KEYS[step.col];
      if (step.carry_in) {
        html = `Vi stryker och skriver om: <span style="color:${PVC[ck]}">${step.b}</span> → <strong>${step.kvar}</strong>, <span style="color:${PVC[ck]}">${step.a}</span> → <strong>10</strong> (<span style="color:${PVC[ck]}">${step.a}</span> + <span style="color:#d97706">${step.carry_in}</span> minne + <strong>${step.behover}</strong> lån = 10) ✏️`;
      } else {
        html = `Vi stryker och skriver om: <span style="color:${PVC[ck]}">${step.b}</span> → <strong>${step.kvar}</strong>, <span style="color:${PVC[ck]}">${step.a}</span> → <strong>10</strong> (<span style="color:${PVC[ck]}">${step.a}</span> + <strong>${step.behover}</strong> lån = 10) ✏️`;
      }
    } else if (step.type === 'add_carry_fly') {
      html = `10:an skickas upp som minnessiffra! ⬆️`;
    } else if (step.type === 'add_result') {
      const ck = COL_KEYS[step.col];
      html = `Kvar blir <strong style="color:${PVC[ck]}">${step.kvar}</strong>. 10:an skickades upp som minnessiffra! ✅`;
    } else if (step.type === 'add_simple') {
      const ck = COL_KEYS[step.col];
      const ciStr = step.carry_in ? ` + <span style="color:#d97706">${step.carry_in}</span>` : '';
      html = `<span style="color:${PVC[ck]}">${step.a}</span> + <span style="color:${PVC[ck]}">${step.b}</span>${ciStr} = <strong style="color:${PVC[ck]}">${step.sum}</strong>`;
    } else if (step.type === 'add_overflow') {
      html = `Minnessiffran <strong style="color:${PVC.hundratal}">${step.digit}</strong> skrivs längst till vänster!`;

    } else if (step.type === 'sub_highlight') {
      const ck = COL_KEYS[step.col];
      const colName = step.col === 0 ? 'E (ental)' : step.col === 1 ? 'T (tiotal)' : 'H (hundratal)';
      if (step.a >= step.b) {
        html = `Kolumn <strong style="color:${PVC[ck]}">${colName}</strong>: <strong style="color:${PVC[ck]}">${step.a}</strong> − <strong style="color:${PVC[ck]}">${step.b}</strong> — det går! ✅`;
      } else {
        html = `Kolumn <strong style="color:${PVC[ck]}">${colName}</strong>: <strong style="color:${PVC[ck]}">${step.a}</strong> − <strong style="color:${PVC[ck]}">${step.b}</strong> — hmm...`;
      }
    } else if (step.type === 'sub_cant') {
      const ck = COL_KEYS[step.col];
      html = `<span style="color:#ef4444">⚠️ <strong style="color:${PVC[ck]}">${step.a}</strong> − <strong style="color:${PVC[ck]}">${step.b}</strong> går inte!</span><br>
        Vi lånar ett tiotal från nästa kolumn 🔄`;
    } else if (step.type === 'sub_cant_double') {
      const ck = COL_KEYS[step.col];
      html = `<span style="color:#ef4444">⚠️ <strong style="color:${PVC[ck]}">${step.a}</strong> − <strong style="color:${PVC[ck]}">${step.b}</strong> går inte!</span><br>
        Tiotalet är 0 — vi måste låna från hundratalet! 🔄`;
    } else if (step.type === 'sub_flip_borrow') {
      const ck = COL_KEYS[step.col];
      const sk = COL_KEYS[step.srcCol];
      html = `Vi vänder om: <strong style="color:${PVC[ck]}">${step.b}</strong> − <strong style="color:${PVC[ck]}">${step.a}</strong> = <strong>${step.diff}</strong>, lånar 1 från <strong style="color:${PVC[sk]}">${step.srcNew+1}</strong> → <strong style="color:${PVC[sk]}">${step.srcNew}</strong><br>
        Svaret blir <strong style="color:${PVC[ck]}">10 − ${step.diff} = ${10-step.diff}</strong> 💡`;
    } else if (step.type === 'sub_borrow') {
      const sKey = COL_KEYS[step.srcCol];
      const dKey = COL_KEYS[step.dstCol];
      html = `<span style="color:${PVC[sKey]}">${step.srcNew+1}</span> → <strong style="color:${PVC[sKey]}">${step.srcNew}</strong> (ger ett tiotal till T)<br>
        T: <span style="color:${PVC[dKey]}">${step.dstNew-10}</span> → <strong style="color:${PVC[dKey]}">${step.dstNew}</strong> ✅`;
    } else if (step.type === 'sub_ten_minus') {
      const ck = COL_KEYS[step.col];
      html = `<strong style="color:#dc2626">10</strong> − <strong style="color:${PVC[ck]}">${step.diff}</strong> = <strong style="color:${PVC[ck]}">${step.ans}</strong> ✅`;
    } else if (step.type === 'sub_calc') {
      const ck = COL_KEYS[step.col];
      html = `<strong style="color:${PVC[ck]}">${step.a}</strong> − <strong style="color:${PVC[ck]}">${step.b}</strong> = <strong style="color:${PVC[ck]}">${step.diff}</strong>`;
    } else if (step.type === 'done') {
      html = `Klart! 🎉 ${numA} ${mode==='addition'?'+':'−'} ${numB} = <strong>${mode==='addition'?numA+numB:numA-numB}</strong>`;
    }

    area.innerHTML = html ? `<div class="thought-bubble">${html}</div>` : '';
  }

  function refreshNextBtn() {
    const area = document.getElementById('up-next-area');
    if (area) area.innerHTML = nextBtnHTML();
  }

  function nextBtnHTML() {
    const step = demoSteps[demoStep];
    if (!step) return '';
    if (step.type === 'done') {
      return `<div style="display:flex;gap:8px">
        <button class="up-btn" style="flex:1;height:50px;background:var(--pv-primary);color:#fff;font-size:1rem"
          onclick="UppstallningGame.startDemo()">🔄 Ny uppgift</button>
        <button class="up-btn" style="flex:1;height:50px;background:var(--pv-light);color:var(--pv-primary);border:2px solid rgba(37,99,235,0.3);font-size:1rem"
          onclick="UppstallningGame.goBack()">↩ Tillbaka</button>
      </div>`;
    }
    return `<button id="up-next-btn" class="up-btn" onclick="UppstallningGame.demoNextStep()"
      style="width:100%;height:54px;background:var(--pv-primary);color:#fff;font-size:1.1rem;border-radius:14px"
      ${stepLocked ? 'disabled' : ''}>Nästa steg ▶️</button>`;
  }

  function lockStep() {
    stepLocked = true;
    const btn = document.getElementById('up-next-btn');
    if (btn) btn.disabled = true;
  }

  function unlockStep() {
    stepLocked = false;
    const btn = document.getElementById('up-next-btn');
    if (btn) btn.disabled = false;
  }

  /* ── Carry-rad ──────────────────────────────────────────── */
  function updateCarryRow() {
    for (let c = 0; c < colCount; c++) {
      const el = document.getElementById(`carry-${COL_KEYS[c]}`);
      if (!el) continue;
      const val = demoCarries[c];
      const used = demoCarryUsed[c];
      if (val) {
        el.innerHTML = used
          ? `<span class="dw carry-crossed" style="color:#d97706;opacity:0.4"><span>${val}</span></span>`
          : `<span style="animation:land-bounce 0.45s ease-out both;display:inline-block">${val}</span>`;
      } else {
        el.textContent = '';
      }
    }
  }

  /* ── Borrow-ten hjälpare ────────────────────────────────── */
  function showBorrowTen(col) {
    const key = COL_KEYS[col];
    const wrap = document.getElementById(`bt-wrap-${key}`);
    if (!wrap) return;
    const el = document.createElement('div');
    el.id = `borrow-ten-${key}`;
    el.className = 'borrow-ten';
    el.textContent = '10';
    wrap.appendChild(el);
    demoBorrowTens[col] = true;
  }

  function useBorrowTen(col) {
    const key = COL_KEYS[col];
    const el = document.getElementById(`borrow-ten-${key}`);
    if (el) el.classList.add('used');
    demoBorrowTens[col] = false;
  }

  /* ── Animera carry-token ────────────────────────────────── */
  function animateCarryToken(fromCol, toCol, cb) {
    const srcKey = COL_KEYS[fromCol];
    const dstKey = COL_KEYS[toCol];
    const wrap = document.getElementById('up-table-wrap');
    const srcCell = document.getElementById(`cell-row-a-${srcKey}`) ||
                    document.getElementById(`ans-${srcKey}`);
    const dstCarry = document.getElementById(`carry-${dstKey}`);
    if (!wrap || !srcCell || !dstCarry) { setTimeout(cb, 300); return; }

    const wRect = wrap.getBoundingClientRect();
    const sRect = srcCell.getBoundingClientRect();
    const dRect = dstCarry.getBoundingClientRect();

    const token = document.createElement('div');
    token.textContent = '1';
    token.style.cssText = `position:absolute;
      left:${sRect.left - wRect.left + sRect.width/2 - 14}px;
      top:${sRect.top - wRect.top + sRect.height/2 - 14}px;
      width:28px;height:28px;border-radius:50%;
      background:#fde68a;border:2px solid #d97706;
      display:flex;align-items:center;justify-content:center;
      font-size:0.9rem;font-weight:900;color:#d97706;
      pointer-events:none;z-index:20;
      transition:left 0.7s cubic-bezier(0.25,0.46,0.45,0.94),
                 top 0.7s cubic-bezier(0.25,0.46,0.45,0.94);`;
    wrap.style.position = 'relative';
    wrap.appendChild(token);
    playCarrySound();

    requestAnimationFrame(() => requestAnimationFrame(() => {
      token.style.left = `${dRect.left - wRect.left + dRect.width/2 - 14}px`;
      token.style.top  = `${dRect.top  - wRect.top  + dRect.height/2 - 14}px`;
    }));

    setTimeout(() => {
      token.style.opacity = '0';
      token.style.transition += ',opacity 0.3s';
      setTimeout(() => { token.remove(); cb(); }, 350);
    }, 750);
  }

  /* ── Animera borrow-token ───────────────────────────────── */
  function animateBorrowToken(srcCol, dstCol, _label, cb) {
    const srcKey = COL_KEYS[srcCol];
    const dstKey = COL_KEYS[dstCol];
    const wrap = document.getElementById('up-table-wrap');
    const srcCell = document.getElementById(`cell-row-a-${srcKey}`);
    const dstCell = document.getElementById(`cell-row-a-${dstKey}`);
    if (!wrap || !srcCell || !dstCell) { setTimeout(cb, 300); return; }

    const wRect  = wrap.getBoundingClientRect();
    const sRect  = srcCell.getBoundingClientRect();
    const dRect  = dstCell.getBoundingClientRect();

    const token = document.createElement('div');
    token.textContent = '+10';
    token.style.cssText = `position:absolute;
      left:${sRect.left - wRect.left + sRect.width/2 - 18}px;
      top:${sRect.top - wRect.top + sRect.height/2 - 14}px;
      padding:3px 7px;border-radius:999px;
      background:#fee2e2;border:2px solid #ef4444;
      font-size:0.85rem;font-weight:900;color:#dc2626;
      pointer-events:none;z-index:20;
      transition:left 0.75s cubic-bezier(0.25,0.46,0.45,0.94),
                 top 0.75s cubic-bezier(0.25,0.46,0.45,0.94);`;
    wrap.style.position = 'relative';
    wrap.appendChild(token);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      token.style.left = `${dRect.left - wRect.left + dRect.width/2 - 18}px`;
      token.style.top  = `${dRect.top  - wRect.top  + dRect.height/2 - 14}px`;
    }));

    setTimeout(() => {
      token.style.opacity = '0';
      token.style.transition += ',opacity 0.3s';
      setTimeout(() => { token.remove(); cb(); }, 350);
    }, 800);
  }

  /* ── Tabell HTML ────────────────────────────────────────── */
  function buildTableHTML() {
    const da = digs(numA), db = digs(numB);
    const maxC = colCount;
    const cols = [];
    for (let c = maxC - 1; c >= 0; c--) cols.push({ key: COL_KEYS[c], label: COL_LABELS[c], idx: c });

    const op = mode === 'addition' ? '+' : '−';
    const showA = c => c < String(numA).length ? da[c] : null;
    const showB = c => c < String(numB).length ? db[c] : null;

    const carryRowHTML = mode === 'addition' ? `
      <tr>
        <td style="font-size:11px;font-weight:800;color:#d97706;text-align:right;padding-right:6px;white-space:nowrap">minne:</td>
        ${cols.map(c => `<td style="text-align:center">
          <div class="carry-cell" id="carry-${c.key}"></div>
        </td>`).join('')}
        <td></td>
      </tr>` : '';

    const rowA = cols.map(c => {
      const v = showA(c.idx);
      return `<td style="text-align:center;vertical-align:bottom">
        <div class="col-cell" id="cell-row-a-${c.key}" style="border-color:${PVC[c.key]}">
          <div class="bt-wrap" id="bt-wrap-${c.key}"></div>
          <div class="dw" id="dw-a-${c.key}">
            <span style="color:${PVC[c.key]}">${v !== null ? v : ''}</span>
          </div>
        </div>
      </td>`;
    }).join('');

    const rowB = cols.map(c => {
      const v = showB(c.idx);
      return `<td style="text-align:center">
        <div class="col-cell" id="cell-row-b-${c.key}" style="border-color:${PVC[c.key]}">
          <div class="dw" id="dw-b-${c.key}">
            <span style="color:${PVC[c.key]}">${v !== null ? v : ''}</span>
          </div>
        </div>
      </td>`;
    }).join('');

    const ansRow = cols.map(c => {
      const v = demoAns[c.idx];
      const filled = v !== null;
      return `<td style="text-align:center">
        <div class="ans-cell${filled?' filled':''}" id="ans-${c.key}"
          style="${filled?'border-color:'+PVC[c.key]+';border-style:solid':''}">
          ${filled ? `<span style="color:${PVC[c.key]}">${v}</span>` : ''}
        </div>
      </td>`;
    }).join('');

    return `
      <table class="up-table">
        <thead>
          <tr>
            <td></td>
            ${cols.map(c => `<th style="text-align:center;font-size:1.3rem;font-weight:900;color:${PVC[c.key]};padding-bottom:4px">${c.label}</th>`).join('')}
            <td></td>
          </tr>
        </thead>
        <tbody>
          ${carryRowHTML}
          <tr>
            <td></td>${rowA}<td></td>
          </tr>
          <tr>
            <td style="font-size:1.8rem;font-weight:900;color:#555;text-align:right;padding-right:6px">${op}</td>
            ${rowB}<td></td>
          </tr>
          <tr>
            <td colspan="${cols.length + 2}" style="padding:2px 0">
              <div style="height:3px;background:linear-gradient(90deg,transparent,#374151,transparent);border-radius:2px"></div>
            </td>
          </tr>
          <tr>
            <td></td>${ansRow}<td></td>
          </tr>
        </tbody>
      </table>`;
  }

  /* ══════════════════════════════════════════════════════════
     ÖVNINGSLÄGE
  ══════════════════════════════════════════════════════════ */
  function startExercise() {
    App.Sound.play('click');
    exerciseIdx = 0;
    exScore     = 0;
    showHelpSelect();
  }

  function showHelpSelect() {
    const root = document.getElementById('uppstallning-root');
    const modeLabel = mode === 'addition' ? 'Addition ➕' : 'Subtraktion ➖';
    const modeColor = mode === 'addition' ? '#d97706' : '#dc2626';
    root.innerHTML = `
      <style id="up-base">${BASE_CSS}</style>
      <div class="app-header" style="border-bottom-color:rgba(37,99,235,0.2)">
        <button class="btn-back up-btn" style="background:var(--pv-light);color:var(--pv-primary)"
          onclick="UppstallningGame.goBack()">Tillbaka</button>
        <span class="header-title" style="color:${modeColor}">${modeLabel} – Övning</span>
        <div style="width:80px"></div>
      </div>
      <div style="padding:24px;display:flex;flex-direction:column;align-items:center;gap:20px">
        <div style="font-family:var(--font-heading);font-size:1.4rem;color:var(--pv-primary);text-align:center">Hur vill du räkna?</div>
        <div class="up-card" style="width:100%;background:linear-gradient(135deg,#eff6ff,#dbeafe)"
          onclick="UppstallningGame.setHelpMode(true)">
          <div style="display:flex;align-items:center;gap:16px">
            <div style="font-size:2.5rem">🤝</div>
            <div>
              <div style="font-family:var(--font-heading);font-size:1.2rem;color:var(--pv-primary)">Med hjälp</div>
              <div style="font-size:0.85rem;color:var(--color-text-muted);font-weight:700;margin-top:4px">Ledtrådar, låna-knapp och kompletteringsmetoden</div>
            </div>
          </div>
        </div>
        <div class="up-card" style="width:100%;background:linear-gradient(135deg,#f0fdf4,#dcfce7)"
          onclick="UppstallningGame.setHelpMode(false)">
          <div style="display:flex;align-items:center;gap:16px">
            <div style="font-size:2.5rem">💪</div>
            <div>
              <div style="font-family:var(--font-heading);font-size:1.2rem;color:#166534">Utan hjälp</div>
              <div style="font-size:0.85rem;color:var(--color-text-muted);font-weight:700;margin-top:4px">Räkna på egen hand – ingen ledtråd</div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function setHelpMode(on) {
    helpMode = on;
    newExProblem();
  }

  function newExProblem() {
    generatePair();
    exCurrentCol  = 0;
    exInputLocked = false;
    exInput       = '';
    exAnswers     = [null, null, null];
    exColData     = preprocessExSteps(buildDemoSteps());
    // Initiera delad demo-state som executeStep/highlightCol/showBorrowTen använder
    demoEffA       = [...digs(numA)];
    demoCarries    = [0, 0, 0];
    demoCarryUsed  = [false, false, false];
    demoAns        = [null, null, null, null];
    demoBorrowTens = [false, false, false];
    exTenPhase     = [0, 0, 0];
    exFreeValues       = [null, null, null];
    exFreeActiveCol    = 0;
    exFreeFirstAttempt = true;
    exFreeZeroLock     = [false, false, false];
    exFreeDoneLock     = [false, false, false];
    exFreeFillOrder    = [];
    renderExLayout();
  }

  function renderExLayout() {
    const root = document.getElementById('uppstallning-root');
    const modeLabel = mode === 'addition' ? 'Addition ➕' : 'Subtraktion ➖';
    const modeColor = mode === 'addition' ? '#d97706' : '#dc2626';
    root.innerHTML = `
      <style id="up-base">${BASE_CSS}</style>
      <div class="app-header" style="border-bottom-color:rgba(37,99,235,0.2)">
        <button class="btn-back up-btn" style="background:var(--pv-light);color:var(--pv-primary)"
          onclick="UppstallningGame.goBack()">Avsluta</button>
        <span class="header-title" style="color:${modeColor}">${modeLabel} – Övning</span>
        <div style="font-size:12px;font-weight:800;color:var(--color-text-muted)">${exerciseIdx+1}/5</div>
      </div>
      <div id="up-main">
        <div id="up-left">
          <div id="up-table-wrap">${buildTableHTML()}</div>
          ${helpMode ? '<div id="ex-bubble"></div>' : ''}
          <div id="ex-col-ui"></div>
          <div id="ex-feedback"></div>
        </div>
        <div id="up-right">
          ${scratchHTML()}
        </div>
      </div>`;
    setupCanvas('up-canvas');
    if (helpMode) {
      advanceToColumn(0);
    } else {
      exFreeInit();
    }
  }

  function advanceToColumn(col) {
    exCurrentCol  = col;
    exInputLocked = false;
    exInput       = '';
    for (let c = 0; c < colCount; c++) {
      const el = document.getElementById(`ans-${COL_KEYS[c]}`);
      if (el) el.classList.toggle('active-col', c === col);
    }
    highlightCol(col);
    showExColUI(col);
  }

  function showExColUI(col) {
    const ui = document.getElementById('ex-col-ui');
    if (!ui) return;

    /* ── Free mode (utan hjälp) — renderas EN gång per uppgift ── */
    if (!helpMode) {
      ui.innerHTML = `<div style="background:rgba(255,255,255,0.9);border-radius:14px;padding:12px;border:2px solid rgba(37,99,235,0.1)">
        <div id="ex-free-label" style="font-size:11px;font-weight:800;text-align:center;margin-bottom:8px;text-transform:uppercase"></div>
        <div class="ex-numpad">
          ${[1,2,3,4,5,6,7,8,9,0].map(k =>
            `<button class="ex-nk" onclick="UppstallningGame.exFreePress('${k}')">${k}</button>`
          ).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="up-btn" id="ex-free-erase" onclick="UppstallningGame.exFreeErase()"
            style="width:64px;height:48px;background:var(--pv-light);color:var(--pv-primary);border:2px solid rgba(37,99,235,0.3);font-size:1.2rem;border-radius:14px">⌫</button>
          <button class="up-btn" id="ex-free-submit" onclick="UppstallningGame.exFreeSubmit()" disabled
            style="flex:1;height:48px;background:linear-gradient(135deg,#cbd5e1,#94a3b8);color:#fff;font-size:1rem;border-radius:14px">
            Fyll i alla rutor…</button>
        </div>
      </div>`;
      exFreeUpdateLabel();
      return;
    }

    /* ── Help mode (med hjälp) — oförändrad ───────────── */
    const colKey      = COL_KEYS[col];
    const needsBorrow = !!(exColData[col]?.needsBorrow) && !demoBorrowTens[col];
    const isTenFriend = !!(exColData[col]?.needsTenFriend);
    const tenPhase    = exTenPhase[col] || 0;

    const bubble = document.getElementById('ex-bubble');
    if (bubble) {
      const msg = exBubbleMsg(col, needsBorrow, isTenFriend, tenPhase);
      bubble.innerHTML = msg ? `<div class="thought-bubble">${msg}</div>` : '';
    }

    if (needsBorrow) {
      // Subtraktion-lån (oförändrad)
      ui.innerHTML = `<button class="up-btn" id="ex-borrow-btn" onclick="UppstallningGame.exDoBorrow()"
        style="width:100%;height:58px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;font-size:1rem;border-radius:14px;animation:borrow-glow 1.2s ease-in-out infinite;box-shadow:0 4px 12px rgba(245,158,11,0.5)">
        👆 Tryck här för att låna!</button>`;

    } else if (isTenFriend && tenPhase === 0) {
      // Fas 0: "mer än 9" — visa knapp för att gå till förklaring
      ui.innerHTML = `<button class="up-btn" id="ex-continue-btn" onclick="UppstallningGame.exTenStep1()"
        style="width:100%;height:58px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;font-size:1rem;border-radius:14px;animation:borrow-glow 1.2s ease-in-out infinite;box-shadow:0 4px 12px rgba(245,158,11,0.5)">
        👆 Tryck här för att se hur! 🔢</button>`;

    } else if (isTenFriend && tenPhase === 1) {
      // Fas 1: förklaring visas i bubblan — knapp för att köra animationen
      ui.innerHTML = `<button class="up-btn" id="ex-continue-btn" onclick="UppstallningGame.exTenStep2()"
        style="width:100%;height:58px;background:var(--pv-primary);color:#fff;border:none;font-size:1rem;border-radius:14px">
        Se animation ▶️</button>`;

    } else if (isTenFriend && tenPhase === 2) {
      // Fas 2: streck-animation körd, väntar på carry-flyg
      ui.innerHTML = `<button class="up-btn" id="ex-continue-btn" onclick="UppstallningGame.exTenStep3()"
        style="width:100%;height:58px;background:var(--pv-primary);color:#fff;border:none;font-size:1rem;border-radius:14px">
        Skicka 10:an! ⬆️</button>`;

    } else {
      // Fas 3+ eller ingen 10-kompis: visa numpad
      ui.innerHTML = `<div style="background:rgba(255,255,255,0.9);border-radius:14px;padding:12px;border:2px solid rgba(37,99,235,0.1)">
        <div style="font-size:11px;font-weight:800;color:${PVC[colKey]};text-align:center;margin-bottom:8px;text-transform:uppercase">
          Fyll i ${colKey === 'ental' ? 'entalet' : colKey === 'tiotal' ? 'tiotalet' : 'hundratalet'}
        </div>
        <div class="ex-numpad">
          ${[1,2,3,4,5,6,7,8,9,0].map(k =>
            `<button class="ex-nk" onclick="UppstallningGame.exPress('${k}')">${k}</button>`
          ).join('')}
        </div>
      </div>`;
    }
  }

  function exBubbleMsg(col, needsBorrow, isTenFriend, tenPhase) {
    if (!helpMode) return '';
    const ck   = COL_KEYS[col];
    const aVal = demoEffA[col];
    const bVal = digs(numB)[col];
    let msg = '';

    if (needsBorrow) {
      msg = exColData[col]?.isDouble
        ? `<span style="color:#ef4444">⚠️ ${aVal} − ${bVal} går inte! Tiotalet är 0 — du behöver låna från hundratalet.</span>`
        : `<span style="color:#ef4444">⚠️ ${aVal} − ${bVal} går inte! Du behöver låna.</span>`;

    } else if (isTenFriend && tenPhase === 0) {
      const over = exColData[col].overStep;
      const ciStr = over.carry_in ? ` + <span style="color:#d97706">${over.carry_in}</span>` : '';
      msg = `<span style="color:${PVC[ck]}">${over.a}</span> + <span style="color:${PVC[ck]}">${over.b}</span>${ciStr}... Det blir mer än 9! 🤔 Se hur vi gör!`;

    } else if (isTenFriend && tenPhase === 1) {
      const exp = exColData[col].explainStep;
      if (exp.carry_in) {
        msg = `<span style="color:${PVC[ck]}">${exp.a}</span> + <span style="color:#d97706">${exp.carry_in}</span> = <strong>${exp.effectiveA}</strong> (<span style="color:#d97706">${exp.carry_in}</span>:an är minnessiffran).<br>
          <span style="color:${PVC[ck]}">${exp.effectiveA}</span>:ans 10-kompis är <strong>${exp.behover}</strong>.<br>
          Vi tar <strong>${exp.behover}</strong> från <span style="color:${PVC[ck]}">${exp.b}</span>: ${exp.b} − ${exp.behover} = <strong>${exp.kvar}</strong> (kvar från <span style="color:${PVC[ck]}">${exp.b}</span>:an blir <strong>${exp.kvar}</strong>).<br>
          Så <span style="color:${PVC[ck]}">${exp.b}</span> blir <strong>${exp.kvar}</strong> och <span style="color:${PVC[ck]}">${exp.a}</span>:an blir <strong>10</strong>! 💡`;
      } else {
        msg = `<span style="color:${PVC[ck]}">${exp.effectiveA}</span>:ans 10-kompis är <strong>${exp.behover}</strong>.<br>
          Vi tar <strong>${exp.behover}</strong> från <span style="color:${PVC[ck]}">${exp.b}</span>: ${exp.b} − ${exp.behover} = <strong>${exp.kvar}</strong> (kvar från <span style="color:${PVC[ck]}">${exp.b}</span>:an blir <strong>${exp.kvar}</strong>).<br>
          Så <span style="color:${PVC[ck]}">${exp.b}</span> blir <strong>${exp.kvar}</strong> och <span style="color:${PVC[ck]}">${exp.effectiveA}</span> blir <strong>10</strong>! 💡`;
      }

    } else if (isTenFriend && tenPhase === 2) {
      msg = `Bra! Nu skickar vi 10:an som minnessiffra! ⬆️`;

    } else if (isTenFriend && tenPhase >= 3) {
      const exp = exColData[col].explainStep;
      msg = `Kvar: <strong style="color:${PVC[ck]}">${exp.b}</strong> − <strong>${exp.behover}</strong> = ? Fyll i!`;

    } else if (demoBorrowTens[col]) {
      const diff = exColData[col]?.flipStep?.diff ?? (bVal - aVal + 10);
      msg = `Du lånade en 10:a! Vad är <strong style="color:#dc2626">10</strong> − <strong style="color:${PVC[ck]}">${diff}</strong>?`;

    } else if (mode === 'addition') {
      const ci    = demoCarries[col] || 0;
      const extra = ci ? ` + <span style="color:#d97706">${ci}</span> (minne)` : '';
      msg = `Vad är <strong style="color:${PVC[ck]}">${aVal}</strong> + <strong style="color:${PVC[ck]}">${bVal}</strong>${extra}?`;

    } else {
      msg = `Vad är <strong style="color:${PVC[ck]}">${aVal}</strong> − <strong style="color:${PVC[ck]}">${bVal}</strong>?`;
    }
    return msg;
  }

  function exPress(key) {
    if (exInputLocked) return;
    const fb = document.getElementById('ex-feedback');
    if (fb) fb.innerHTML = '';
    exInput = key;
    const colKey  = COL_KEYS[exCurrentCol];
    const ansCell = document.getElementById(`ans-${colKey}`);
    if (ansCell) ansCell.innerHTML = `<span style="color:${PVC[colKey]}">${key}</span>`;
    exSubmitCol();
  }

  function exSubmitCol() {
    if (exInputLocked || !exInput) return;
    exInputLocked = true;

    const correctDigit = exColData[exCurrentCol].correctAnswer;
    const colKey       = COL_KEYS[exCurrentCol];

    if (parseInt(exInput) === correctDigit) {
      exAnswers[exCurrentCol] = correctDigit;
      exInput = '';
      App.Sound.play('correct');
      const ansCell = document.getElementById(`ans-${colKey}`);
      if (ansCell) {
        ansCell.innerHTML = `<span style="color:${PVC[colKey]};animation:drop-down 0.55s ease-out both;display:inline-block">${correctDigit}</span>`;
        ansCell.classList.add('filled');
        ansCell.style.borderColor = PVC[colKey];
        ansCell.classList.remove('active-col');
      }
      if (demoBorrowTens[exCurrentCol]) useBorrowTen(exCurrentCol);
      if (mode === 'addition' && exColData[exCurrentCol].nextCarry && !exColData[exCurrentCol].needsTenFriend && exCurrentCol + 1 < colCount) {
        playCarrySound();
        setTimeout(() => {
          animateCarryToken(exCurrentCol, exCurrentCol + 1, () => {
            demoCarries[exCurrentCol + 1] = 1;
            updateCarryRow();
          });
        }, 400);
      }
      smallBurst();
      const next = exCurrentCol + 1;
      if (next >= colCount) {
        setTimeout(exCheckDone, 900);
      } else {
        setTimeout(() => advanceToColumn(next), 400);
      }
    } else {
      App.Sound.play('wrong');
      exInput = '';
      exInputLocked = false;
      const fb = document.getElementById('ex-feedback');
      if (fb) fb.innerHTML = `<div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);
        border:2px solid #f59e0b;border-radius:12px;padding:10px;font-weight:800;
        color:#92400e;text-align:center">Hmm, prova igen! 💪</div>`;
      const ansCell = document.getElementById(`ans-${colKey}`);
      if (ansCell) ansCell.innerHTML = '';
    }
  }

  function exDoBorrow() {
    if (exInputLocked) return;
    const c = exCurrentCol;
    exInputLocked = true;
    const btn = document.getElementById('ex-borrow-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Lånar...'; }

    const colData = exColData[c];
    const flip    = colData.flipStep;
    const ck      = COL_KEYS[c];

    // Visa förklaringsbubbla (utan svar – barnet ska räkna ut det själv)
    const bubble = document.getElementById('ex-bubble');
    if (bubble && flip) {
      bubble.innerHTML = `<div class="thought-bubble">Vi vänder om: <strong style="color:${PVC[ck]}">${flip.b}</strong> − <strong style="color:${PVC[ck]}">${flip.a}</strong> = <strong>${flip.diff}</strong>. Nu måste vi räkna ut <strong style="color:#dc2626">10 − ${flip.diff}</strong> för att få svaret! 💡</div>`;
    }

    // Visa "Fortsätt"-knapp istället för tidsbaserad paus
    const ui = document.getElementById('ex-col-ui');
    if (ui) {
      ui.innerHTML = `<button class="up-btn" id="ex-continue-btn" onclick="UppstallningGame.exContinueBorrow()"
        style="width:100%;height:54px;background:var(--pv-primary);color:#fff;font-size:1rem;border-radius:14px">
        Fortsätt ▶️</button>`;
    }
  }

  function exContinueBorrow() {
    const c       = exCurrentCol;
    const colData = exColData[c];
    const btn     = document.getElementById('ex-continue-btn');
    if (btn) btn.disabled = true;

    if (colData.isDouble) {
      executeStep(colData.interStep, () => {
        playBorrowSound();
        setTimeout(() => {
          executeStep(colData.flipStep, () => {
            exInputLocked = false;
            showExColUI(c);
          });
        }, 300);
      });
    } else {
      executeStep(colData.flipStep, () => {
        exInputLocked = false;
        showExColUI(c);
      });
    }
  }

  function exTenStep1() {
    // Fas 0 → 1: Visa förklaring i bubblan
    if (exInputLocked) return;
    App.Sound.play('click');
    const c = exCurrentCol;
    exTenPhase[c] = 1;
    showExColUI(c);
  }

  function exTenStep2() {
    // Fas 1 → 2: Kör streck-animationen
    if (exInputLocked) return;
    const c = exCurrentCol;
    const colData = exColData[c];
    const btn = document.getElementById('ex-continue-btn');
    if (btn) btn.disabled = true;
    exInputLocked = true;

    // Kör add_cross-steget via executeStep
    executeStep(colData.crossStep, () => {
      exTenPhase[c] = 2;
      exInputLocked = false;
      showExColUI(c);
    });
  }

  function exTenStep3() {
    // Fas 2 → 3: Kör carry-flyg
    if (exInputLocked) return;
    const c = exCurrentCol;
    const colData = exColData[c];
    const btn = document.getElementById('ex-continue-btn');
    if (btn) btn.disabled = true;
    exInputLocked = true;

    // Kör add_carry_fly-steget via executeStep
    executeStep(colData.carryFlyStep, () => {
      exTenPhase[c] = 3;
      exInputLocked = false;
      showExColUI(c);
    });
  }

  /* ── Free mode funktioner (utan hjälp) ────────────────── */
  function exFreeInit() {
    // Ledande nollor: lås kolumner uppifrån där facit-siffran är 0
    const dr = digs(mode === 'addition' ? numA + numB : numA - numB);
    for (let c = colCount - 1; c >= 0; c--) {
      if (dr[c] !== 0) break;
      exFreeZeroLock[c] = true;
      exFreeValues[c]   = 0;
    }
    for (let c = 0; c < colCount; c++) {
      const el = document.getElementById(`ans-${COL_KEYS[c]}`);
      if (!el) continue;
      if (exFreeZeroLock[c]) {
        el.classList.add('free-locked');
        continue;
      }
      el.classList.add('clickable');
      el.onclick = () => exFreeSelectCol(c);
    }
    showExColUI(0);
    exFreeSetCursor(exFreeFirstFree());
    exFreeUpdateSubmit();
  }

  function exFreeSelectable(c) {
    return c !== null && c !== undefined && !exFreeZeroLock[c] && !exFreeDoneLock[c];
  }

  function exFreeFirstFree() {
    for (let c = 0; c < colCount; c++)
      if (exFreeSelectable(c) && exFreeValues[c] === null) return c;
    return null;
  }

  // Nästa aktiva efter ifylld kolumn c: tom på c+1, annars tom på c-1, annars närmaste tomma
  function exFreeNextCol(from) {
    const empty = c => c >= 0 && c < colCount && exFreeSelectable(c) && exFreeValues[c] === null;
    if (empty(from + 1)) return from + 1;
    if (empty(from - 1)) return from - 1;
    for (let d = 2; d < colCount; d++) {
      if (empty(from + d)) return from + d;
      if (empty(from - d)) return from - d;
    }
    return null;
  }

  // Flytta markören (col=null → släckt). Uppdaterar glow, 👇-pil och etikett.
  function exFreeSetCursor(col) {
    exFreeActiveCol = col;
    for (let c = 0; c < colCount; c++) {
      const el = document.getElementById(`ans-${COL_KEYS[c]}`);
      if (!el) continue;
      const active = (c === col);
      el.classList.toggle('active-col', active);
      el.classList.toggle('free-cursor', active);
      const arrow = el.querySelector('.free-arrow');
      if (active && !arrow) {
        const a = document.createElement('span');
        a.className = 'free-arrow';
        a.textContent = '👇';
        el.appendChild(a);
      } else if (!active && arrow) {
        arrow.remove();
      }
    }
    exFreeUpdateLabel();
  }

  function exFreeUpdateLabel() {
    const label = document.getElementById('ex-free-label');
    if (!label) return;
    if (exFreeActiveCol === null || exFreeActiveCol === undefined) {
      label.textContent = 'Alla rutor fyllda – tryck Klar ✓';
      label.style.color = '#16a34a';
    } else {
      const colKey = COL_KEYS[exFreeActiveCol];
      label.textContent = `Fyll i ${colKey === 'ental' ? 'entalet' : colKey === 'tiotal' ? 'tiotalet' : 'hundratalet'}`;
      label.style.color = PVC[colKey];
    }
  }

  function exFreeAllFilled() {
    for (let c = 0; c < colCount; c++)
      if (!exFreeZeroLock[c] && exFreeValues[c] === null) return false;
    return true;
  }

  function exFreeUpdateSubmit() {
    const btn = document.getElementById('ex-free-submit');
    if (!btn) return;
    const ready = exFreeAllFilled();
    btn.disabled = !ready;
    btn.style.background = ready
      ? 'linear-gradient(135deg,#22c55e,#16a34a)'
      : 'linear-gradient(135deg,#cbd5e1,#94a3b8)';
    btn.textContent = ready ? 'Klar ✓' : 'Fyll i alla rutor…';
  }

  function exFreeSelectCol(col) {
    if (exInputLocked) return;
    if (!exFreeSelectable(col)) return;
    exFreeSetCursor(col);
  }

  function exFreePress(key) {
    if (exInputLocked) return;
    const col = exFreeActiveCol;
    if (!exFreeSelectable(col)) return;
    const fb = document.getElementById('ex-feedback');
    if (fb) fb.innerHTML = '';
    const colKey = COL_KEYS[col];
    exFreeValues[col] = parseInt(key);
    const oi = exFreeFillOrder.indexOf(col);
    if (oi !== -1) exFreeFillOrder.splice(oi, 1);
    exFreeFillOrder.push(col);
    const ansCell = document.getElementById(`ans-${colKey}`);
    if (ansCell) {
      ansCell.innerHTML = `<span style="color:${PVC[colKey]}">${key}</span>`;
      ansCell.classList.remove('wrong');
    }
    let next = exFreeNextCol(col);
    if (next === null) {
      // Alla fyllda: hoppa till nästa röda (felmarkerade) ruta om någon finns
      for (let c = 0; c < colCount; c++) {
        if (c === col || !exFreeSelectable(c)) continue;
        const cell = document.getElementById(`ans-${COL_KEYS[c]}`);
        if (cell && cell.classList.contains('wrong')) { next = c; break; }
      }
    }
    exFreeSetCursor(next);
    exFreeUpdateSubmit();
  }

  function exFreeErase() {
    if (exInputLocked) return;
    const erasable = c => exFreeSelectable(c) && exFreeValues[c] !== null;
    let col = exFreeActiveCol;
    if (!erasable(col)) {
      // Aktiv ruta tom → hoppa till senast ifyllda rutan
      col = null;
      for (let i = exFreeFillOrder.length - 1; i >= 0; i--) {
        if (erasable(exFreeFillOrder[i])) { col = exFreeFillOrder[i]; break; }
      }
      if (col === null) return; // inget att sudda
    }
    exFreeValues[col] = null;
    const oi = exFreeFillOrder.indexOf(col);
    if (oi !== -1) exFreeFillOrder.splice(oi, 1);
    const ansCell = document.getElementById(`ans-${COL_KEYS[col]}`);
    if (ansCell) {
      ansCell.innerHTML = '';
      ansCell.classList.remove('wrong', 'filled');
    }
    App.Sound.play('click');
    exFreeSetCursor(col);
    exFreeUpdateSubmit();
  }

  function exFreeSubmit() {
    if (exInputLocked) return;
    if (!exFreeAllFilled()) return; // gating: Klar kräver alla rutor ifyllda
    exInputLocked = true;

    let correctCount = 0;
    let firstWrong   = null;
    for (let c = 0; c < colCount; c++) {
      if (exFreeZeroLock[c]) { correctCount++; continue; }
      const colKey  = COL_KEYS[c];
      const ansCell = document.getElementById(`ans-${colKey}`);
      const correct = exFreeValues[c] === exColData[c].correctAnswer;
      if (!ansCell) continue;

      if (correct) {
        correctCount++;
        exFreeDoneLock[c] = true;
        ansCell.classList.remove('wrong');
        ansCell.classList.add('filled');
        ansCell.style.borderColor = PVC[colKey];
        ansCell.style.borderStyle = 'solid';
        ansCell.innerHTML = `<span style="color:${PVC[colKey]}">${exFreeValues[c]}</span>`;
        ansCell.onclick = null;
        ansCell.classList.remove('clickable', 'active-col', 'free-cursor');
      } else {
        if (firstWrong === null) firstWrong = c;
        ansCell.classList.add('wrong'); // röd, behåller sin siffra
        ansCell.classList.remove('filled');
      }
    }

    if (correctCount === colCount) {
      // Alla rätt — poäng endast om helrätt på första Klar-trycket
      if (exFreeFirstAttempt) exScore++;
      for (let c = 0; c < colCount; c++) exAnswers[c] = exFreeValues[c];
      const fb = document.getElementById('ex-feedback');
      if (fb) fb.innerHTML = '';
      exFreeSetCursor(null);
      App.Sound.play('correct');
      smallBurst();
      setTimeout(() => exCheckDone(true), 900);
    } else {
      // Fel — riktig fel-submit förbrukar första försöket
      exFreeFirstAttempt = false;
      App.Sound.play('wrong');
      exInputLocked = false;
      const fb = document.getElementById('ex-feedback');
      if (fb) fb.innerHTML = `<div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);
        border:2px solid #f59e0b;border-radius:12px;padding:10px;font-weight:800;
        color:#92400e;text-align:center">${correctCount} av ${colCount} rätt! Rätta de röda rutorna 💪</div>`;
      exFreeSetCursor(firstWrong);
      exFreeUpdateSubmit(); // allt är fortfarande ifyllt → Klar förblir aktiv
    }
  }

  function exCheckDone(skipScore) {
    // skipScore=true: fria läget har redan avgjort poängen i exFreeSubmit
    const dr = digs(mode === 'addition' ? numA + numB : numA - numB);
    let correct = true;
    for (let c = 0; c < colCount; c++) {
      if (exAnswers[c] !== dr[c]) { correct = false; break; }
    }
    if (correct) { if (!skipScore) exScore++; App.Sound.play('correct'); smallBurst(); }
    else App.Sound.play('wrong');

    exerciseIdx++;
    if (exerciseIdx >= 5) {
      showExResults();
    } else {
      const toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99';
      toast.innerHTML = `<div style="background:${correct?'#dcfce7':'#fef9c3'};border:2px solid ${correct?'#22c55e':'#f59e0b'};
        border-radius:999px;padding:10px 22px;font-weight:800;color:${correct?'#166534':'#92400e'};font-size:1rem">
        ${correct ? '✅ Rätt!' : '💪 Nästa!'} Uppgift ${exerciseIdx}/5</div>`;
      document.body.appendChild(toast);
      setTimeout(() => { toast.remove(); newExProblem(); }, 1100);
    }
  }

  function showExResults() {
    App.Sound.play(exScore >= 4 ? 'fanfare' : 'correct');
    if (exScore === 5) App.Confetti.burst(160);
    saveLog(exScore, 5);
    const root = document.getElementById('uppstallning-root');
    const emoji = exScore === 5 ? '🌟' : exScore >= 4 ? '🥇' : exScore >= 3 ? '🥈' : '💪';
    const msg   = exScore === 5 ? 'Perfekt! 🎉' : exScore >= 4 ? 'Fantastiskt!' : exScore >= 3 ? 'Jättebra!' : 'Fortsätt öva!';
    root.innerHTML = `
      <style id="up-base">${BASE_CSS}</style>
      <div class="app-header" style="border-bottom-color:rgba(37,99,235,0.2)">
        <button class="btn-back up-btn" style="background:var(--pv-light);color:var(--pv-primary)"
          onclick="UppstallningGame.goBack()">Tillbaka</button>
        <span class="header-title" style="color:var(--pv-primary)">🏆 Resultat</span>
        <div style="width:80px"></div>
      </div>
      <div style="padding:24px;display:flex;flex-direction:column;align-items:center;gap:20px">
        <div style="background:linear-gradient(135deg,var(--pv-primary),var(--pv-secondary));
          border-radius:20px;padding:32px 24px;text-align:center;color:white;width:100%;animation:bounce-in 0.6s var(--ease-bounce)">
          <div style="font-size:4rem;margin-bottom:12px">${emoji}</div>
          <div style="font-family:var(--font-heading);font-size:1.6rem">${msg}</div>
          <div style="font-size:3rem;font-weight:900;margin:12px 0">
            ${exScore} <span style="font-size:1.5rem;opacity:0.8">av 5</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;width:100%">
          <button class="btn btn-lg up-btn" style="background:linear-gradient(135deg,var(--pv-primary),var(--pv-secondary));color:white;border:none"
            onclick="UppstallningGame.startExercise()">🔄 Spela igen</button>
          <button class="btn btn-ghost up-btn" style="border-color:var(--pv-primary);color:var(--pv-primary)"
            onclick="UppstallningGame.goBack()">↩ Välj läge</button>
        </div>
      </div>`;
  }

  /* ── Scratch HTML ───────────────────────────────────────── */
  function scratchHTML() {
    return `<div class="up-scratch">
      <div style="font-size:10px;font-weight:800;color:var(--pv-primary);text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0">✏️ Kladd</div>
      <canvas id="up-canvas" class="up-canvas"></canvas>
      <div style="display:flex;gap:5px;flex-shrink:0">
        <button onclick="UppstallningGame.upToggleEraser(false)" id="up-draw"
          style="flex:1;height:30px;border-radius:10px;font-weight:800;font-size:11px;
          cursor:pointer;background:var(--pv-primary);color:#fff;border:1.5px solid var(--pv-primary)">🖊️ Rita</button>
        <button onclick="UppstallningGame.upToggleEraser(true)" id="up-erase"
          style="flex:1;height:30px;border-radius:10px;font-weight:800;font-size:11px;
          cursor:pointer;background:var(--pv-light);color:var(--pv-primary);border:1.5px solid rgba(37,99,235,0.3)">🧹 Sudd</button>
        <button onclick="UppstallningGame.upClearCanvas()"
          style="flex:1;height:30px;border-radius:10px;font-weight:800;font-size:11px;
          cursor:pointer;background:var(--pv-light);color:var(--pv-primary);border:1.5px solid rgba(37,99,235,0.3)">🗑️ Rensa</button>
      </div>
    </div>`;
  }

  /* ── Ljud ───────────────────────────────────────────────── */
  function playCarrySound() {
    try {
      const ac = new (window.AudioContext || window['webkitAudioContext'])();
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.frequency.setValueAtTime(400, ac.currentTime);
      o.frequency.linearRampToValueAtTime(800, ac.currentTime + 0.2);
      g.gain.setValueAtTime(0.18, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
      o.start(ac.currentTime); o.stop(ac.currentTime + 0.25);
    } catch (_) {}
  }

  function playBorrowSound() {
    try {
      const ac = new (window.AudioContext || window['webkitAudioContext'])();
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle';
      o.connect(g); g.connect(ac.destination);
      o.frequency.setValueAtTime(500, ac.currentTime);
      o.frequency.linearRampToValueAtTime(250, ac.currentTime + 0.32);
      g.gain.setValueAtTime(0.2, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.38);
      o.start(ac.currentTime); o.stop(ac.currentTime + 0.38);
    } catch (_) {}
  }

  /* ── Canvas ─────────────────────────────────────────────── */
  function setupCanvas(id) {
    upCanvas = document.getElementById(id);
    if (!upCanvas) return;
    upErasing = false;
    requestAnimationFrame(() => {
      const r = upCanvas.getBoundingClientRect();
      upCanvas.width  = Math.max(r.width  || 300, 300);
      upCanvas.height = Math.max(r.height || 200, 200);
      upCtx = upCanvas.getContext('2d');
      upCanvas.addEventListener('pointerdown',   upPD);
      upCanvas.addEventListener('pointermove',   upPM);
      upCanvas.addEventListener('pointerup',     upPU);
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
    upCtx.globalCompositeOperation = upErasing ? 'destination-out' : 'source-over';
    upCtx.lineWidth = upErasing ? 20 : 2 + (e.pressure || 0.5) * 3;
    upCtx.strokeStyle = '#3b82f6';
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

  /* ── Konfetti (liten burst) ─────────────────────────────── */
  function smallBurst() {
    const c = document.getElementById('confetti-container');
    if (!c) return;
    const sh = ['⭐','💫','✨','🌟','🎉','💙','💚'];
    for (let i = 0; i < 28; i++) {
      const el = document.createElement('span');
      el.className = 'confetti-piece';
      el.textContent = sh[Math.floor(Math.random() * sh.length)];
      el.style.cssText = `left:${Math.random()*100}%;font-size:${12+Math.random()*14}px;
        animation-duration:${1.2+Math.random()*1.5}s;animation-delay:${Math.random()*0.2}s`;
      c.appendChild(el);
    }
    setTimeout(() => { c.querySelectorAll('.confetti-piece').forEach(p => p.remove()); }, 2500);
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
    init, showModeSelect, setDifficulty,
    startDemo, demoNextStep,
    startExercise, showHelpSelect, setHelpMode,
    exPress, exDoBorrow, exContinueBorrow,
    exTenStep1, exTenStep2, exTenStep3,
    exFreeSelectCol, exFreePress, exFreeSubmit, exFreeErase,
    upToggleEraser, upClearCanvas,
    goBack,
  };
})();
