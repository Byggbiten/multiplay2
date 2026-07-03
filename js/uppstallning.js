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

  /* Free mode (utan hjälp) — miniräknar-modell: ETT svarsfält */
  let exFreeInput        = '';   // svaret som sträng, skrivs vänster→höger
  let exFreeFirstAttempt = true; // poäng endast vid helrätt på första Klar

  /* Levande minnessiffror (v30) — endast ADDITION */
  let memPhase   = null;  // null | {kind:'place', col, srcCol} | {kind:'strike', col, cont}
  let memPerfect = true;  // inga fel-tap i hela passet → Minnesmästare ⭐
  let memMoments = 0;     // antal placera+stryk-moment i passet
  let freeMemVals = [null, null, null];   // fria lägets frivilliga minnessiffror
  let freeMemUsed = [false, false, false];

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
    #uppstallning-root .app-header { padding:4px 12px 0; margin-bottom:0; flex-shrink:0; }
    #up-main { flex:1; display:flex; overflow:hidden; min-height:0; }
    #up-left { display:flex; flex-direction:column; gap:8px;
               overflow-y:auto; padding:clamp(6px,1.5vw,12px); min-height:0; padding-bottom:12px; }
    #up-right { display:flex; flex-direction:column; padding:clamp(6px,1.5vw,12px); gap:5px; min-height:0; }
    /* Kladd-lagen (Fas 3.2): kladden fyller ALL ledig yta i sin riktning.
       Landskap: uppgiftskolumnen får en stabil bredd (ej innehållsstyrd, så
       canvasens CSS-yta inte fladdrar mellan steg) — kladden tar resten.
       Porträtt: uppgiftsstacken tar sin naturliga höjd — kladden tar resten. */
    @media (orientation:landscape) {
      #up-main { flex-direction:row; }
      #up-left  { flex:0 0 clamp(340px,45%,560px); }
      #up-right { flex:1 1 0; min-width:0; }
    }
    @media (orientation:portrait) {
      #up-main { flex-direction:column; }
      #up-left  { flex:0 1 auto; }
      #up-right { flex:1 1 0; min-height:150px; }
    }
    .up-btn { cursor:pointer; border:none; border-radius:var(--radius-md); font-weight:800;
      font-family:var(--font-body);
      transition:transform 0.25s var(--spring),box-shadow 0.25s; }
    .up-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 20px var(--glow); }
    .up-btn:disabled { opacity:0.45; cursor:not-allowed; transform:none; }
    /* Val-kort (acard-mönstret från målbilden) */
    .up-card { display:flex; align-items:center; gap:16px; text-align:left;
      padding:14px 20px; width:100%;
      background:var(--glass); border:1px solid var(--glass-line);
      border-radius:var(--radius-lg); box-shadow:var(--shadow-panel); cursor:pointer;
      transition:transform .3s var(--spring),box-shadow .3s; }
    .up-card:hover { transform:translateY(-4px) scale(1.01); box-shadow:0 16px 40px var(--glow); }
    .up-card:active { transform:scale(.98); }
    .up-aico { width:58px; height:58px; border-radius:18px; display:grid; place-items:center;
      font-size:29px; flex-shrink:0; background:linear-gradient(135deg,var(--tint),#fff);
      border:1px solid var(--glass-line); box-shadow:0 4px 12px var(--glow); }
    .up-card b { font-family:var(--font-head); font-weight:700; font-size:19px;
      color:var(--deep); display:block; line-height:1.15; }
    .up-card small { color:var(--ink-soft); font-size:13px; font-weight:700; }
    .up-card .chev { color:var(--accent); flex-shrink:0; width:24px; height:24px; margin-left:auto; }
    /* Svårighetsgrad 1–4: målbildens kompakta tvåraders-chips */
    .diff-row { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
    @media (max-width:480px) { .diff-row { grid-template-columns:repeat(2,1fr); } }
    .diff-btn { display:flex; flex-direction:column; align-items:center; justify-content:center;
      gap:1px; min-height:50px; padding:7px 5px; border-radius:var(--radius-lg);
      cursor:pointer; line-height:1.1;
      background:var(--glass-strong);
      border:1.5px solid color-mix(in srgb, var(--accent) 22%, transparent);
      color:var(--deep); transition:all 0.25s var(--spring); }
    .diff-btn:hover { transform:translateY(-2px); border-color:var(--accent); }
    .diff-btn .diff-num  { font-family:var(--font-head); font-weight:700; font-size:16px; line-height:1.1; }
    .diff-btn .diff-desc { font-size:11px; font-weight:800; opacity:0.9; line-height:1.1; white-space:nowrap; }
    .diff-btn.active { background:linear-gradient(135deg,var(--accent),var(--accent-light));
      color:#fff; border-color:transparent; box-shadow:0 6px 16px var(--glow); }

    /* Uppställningstabell */
    #up-table-wrap { position:relative; background:var(--glass-strong);
      border-radius:var(--radius-lg); padding:clamp(8px,1.5vw,16px);
      border:1px solid var(--glass-line); box-shadow:var(--shadow-panel); width:100%; }
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
    .carry-cell { width:clamp(46px,8vw,74px); height:clamp(22px,3.2vw,30px); border-radius:6px; display:flex;
      align-items:center; justify-content:center; font-size:clamp(0.7rem,1.5vw,0.95rem); font-weight:900;
      color:#dc2626; background:rgba(220,38,38,0.07); overflow:visible; position:relative; }
    .ans-cell { width:clamp(46px,8vw,74px); height:clamp(46px,8vw,74px); border-radius:11px; display:flex;
      align-items:center; justify-content:center; font-size:clamp(1.6rem,4vw,3rem); font-weight:900;
      border:2.5px dashed color-mix(in srgb, var(--accent) 32%, transparent); background:rgba(255,255,255,0.7); }
    .ans-cell.active-col { border-style:solid; border-color:var(--accent);
      background:color-mix(in srgb, var(--accent) 8%, transparent); }
    .ans-cell.filled { border-style:solid; }
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

    /* Levande minnessiffror (v30) — pennstil: liten, roterad, RÖD.
       Stryks med penndrag när den är använd — RADERAS ALDRIG under uppgiften. */
    .mem-digit { position:relative; display:inline-block; line-height:1;
      transform:rotate(-4deg); color:#dc2626; font-weight:900;
      font-family:var(--font-head); font-size:clamp(0.95rem,2.2vw,1.5rem);
      animation:land-bounce-flex 0.45s ease-out both; }
    .mem-digit.used { opacity:0.5; }
    .mem-digit .mem-strike { position:absolute; left:-22%; top:-14%; width:144%; height:128%;
      pointer-events:none; overflow:visible; }
    .mem-digit .mem-strike path { stroke:#b91c1c; stroke-width:2.6; fill:none;
      stroke-linecap:round; stroke-dasharray:44; stroke-dashoffset:44;
      animation:mem-strike-draw 0.25s ease-out forwards; }
    .mem-digit.pulse { animation:mem-digit-pulse 1.1s ease-in-out infinite; }
    /* Barnvänlig tap-yta (T2.1): siffran/cellen är liten men träffytan ≥40px */
    .mem-digit::after { content:''; position:absolute; inset:-14px; }
    .carry-cell::after { content:''; position:absolute; inset:-10px -4px; }
    .carry-cell.mem-pulse { animation:mem-cell-pulse 1.1s ease-in-out infinite;
      border:2px dashed #dc2626; cursor:pointer; }
    .mem-picker { position:absolute; z-index:30; background:#fff;
      border:2px solid #dc2626; border-radius:12px; padding:6px;
      display:grid; grid-template-columns:repeat(3,42px); gap:4px;
      box-shadow:0 8px 24px rgba(0,0,0,0.2); animation:bubble-in 0.2s var(--spring); }
    .mem-picker button { width:42px; height:42px; border-radius:8px;
      border:1.5px solid #fca5a5; background:#fef2f2; color:#dc2626;
      font-weight:900; font-size:1rem; cursor:pointer; font-family:var(--font-head); }
    .mem-picker button:active { transform:scale(0.92); }
    .mem-master { margin-top:8px; display:inline-flex; align-items:center; gap:6px;
      background:linear-gradient(135deg,#fef9c3,#fde68a); border:2px solid #f59e0b;
      border-radius:999px; padding:6px 16px; font-weight:900; color:#92400e;
      animation:land-bounce-flex 0.5s ease-out both; }

    /* Tankebubbla */
    .thought-bubble { background:#fff; border-radius:var(--radius-md);
      padding:clamp(8px,1.5vw,14px) clamp(10px,2vw,18px);
      box-shadow:var(--shadow-panel); font-weight:800; color:var(--ink);
      font-size:clamp(0.92rem,2vw,1.15rem);
      border:2px solid color-mix(in srgb, var(--accent) 18%, transparent);
      animation:bubble-in 0.3s var(--spring); line-height:1.5; }

    /* Numpad i övningsläge */
    .ex-numpad { display:grid; grid-template-columns:repeat(5,clamp(40px,7vw,60px)); gap:5px; justify-content:center; }
    .ex-nk { width:clamp(40px,7vw,60px); height:clamp(40px,7vw,60px); border-radius:50%;
      font-size:clamp(0.95rem,2vw,1.1rem); font-family:var(--font-head); font-weight:900;
      cursor:pointer; background:var(--glass-strong);
      border:1.5px solid color-mix(in srgb, var(--accent) 32%, transparent);
      color:var(--deep); transition:transform 0.2s var(--spring); }
    .ex-nk:hover { transform:scale(1.12); border-color:var(--accent); }

    /* Fria läget: ETT svarsfält (miniräknar-modell) */
    .free-field { display:flex; align-items:center; justify-content:flex-end; gap:2px;
      width:100%; min-height:clamp(40px,8vw,74px); border-radius:11px;
      padding:0 clamp(10px,2vw,16px);
      font-family:var(--font-head); font-size:clamp(1.6rem,4vw,3rem); font-weight:900;
      color:var(--deep); background:rgba(255,255,255,0.7);
      border:2.5px dashed color-mix(in srgb, var(--accent) 32%, transparent);
      transition:border-color 0.2s, background 0.2s; }
    .free-field.has-digits { border-style:solid;
      border-color:color-mix(in srgb, var(--accent) 55%, transparent); }
    .free-field.wrong { border:2.5px solid #ef4444; background:rgba(239,68,68,0.1);
      color:#dc2626; }
    .free-field.correct { border:2.5px solid #22c55e; background:rgba(34,197,94,0.12);
      color:#16a34a; }
    .free-field.shake { animation:free-shake 0.3s ease; }
    .free-caret { display:inline-block; width:3px; height:1.05em; border-radius:2px;
      background:var(--accent); animation:caret-blink 1s steps(1) infinite; }
    .free-field.wrong .free-caret { background:#dc2626; }

    /* Canvas */
    .up-scratch { background:var(--glass); border-radius:var(--radius-md);
      border:1px solid var(--glass-line); box-shadow:var(--shadow-panel);
      display:flex; flex-direction:column;
      gap:5px; flex:1; min-height:0; padding:8px; }
    .up-canvas { flex:1; min-height:60px; width:100%; display:block; touch-action:none;
      cursor:crosshair; border-radius:10px;
      border:2px dashed color-mix(in srgb, var(--accent) 30%, transparent);
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
    @keyframes caret-blink {
      0%,60%   { opacity:1; }
      61%,100% { opacity:0; }
    }
    @keyframes free-shake {
      0%,100% { transform:translateX(0); }
      25%      { transform:translateX(-6px); }
      50%      { transform:translateX(5px); }
      75%      { transform:translateX(-3px); }
    }
    @keyframes mem-strike-draw { to { stroke-dashoffset:0; } }
    @keyframes mem-digit-pulse {
      0%,100% { transform:rotate(-4deg) scale(1); }
      50%      { transform:rotate(-4deg) scale(1.3); }
    }
    @keyframes mem-cell-pulse {
      0%,100% { box-shadow:0 0 6px rgba(220,38,38,0.35); }
      50%      { box-shadow:0 0 18px rgba(220,38,38,0.85); }
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
  let upExGen = 0; // session-token: ogiltigförklarar schemalagda uppgiftsbyten vid Avsluta (T3.3)
  function showModeSelect() {
    upExGen++;
    const root = document.getElementById('uppstallning-root');
    const modeLabel = mode === 'addition' ? 'Addition ➕' : 'Subtraktion ➖';

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
      <div class="floaties"><span style="top:7%;right:8%">✨</span><span style="bottom:12%;left:6%;animation-delay:2s">🍀</span></div>
      <div class="app-header">
        <button class="btn-back" onclick="UppstallningGame.goBack()">Tillbaka</button>
        <span class="header-title">${modeLabel}</span>
        <span style="width:52px"></span>
      </div>
      <div class="wrap" style="padding:0 12px 12px;overflow-y:auto">
        <div class="me-chip" style="align-self:center;margin-top:auto">
          <span class="avatar avatar-sm">${profile.avatar}</span>
          <b>${escHtml(profile.name)}</b>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;margin:14px 0 auto">
          <div class="up-card" onclick="UppstallningGame.startDemo()">
            <span class="up-aico">👀</span>
            <span><b>Titta och lär</b><small>Se varje steg animerat – tryck "Nästa steg"</small></span>
            <svg class="icn chev" viewBox="0 0 24 24"><use href="#i-chevron"/></svg>
          </div>
          <div class="up-card" onclick="UppstallningGame.startExercise()">
            <span class="up-aico">✏️</span>
            <span><b>Räkna själv</b><small>Fyll i svar kolumn för kolumn</small></span>
            <svg class="icn chev" viewBox="0 0 24 24"><use href="#i-chevron"/></svg>
          </div>
          <div class="card" style="padding:14px">
            <div class="panel-title" style="margin-bottom:10px">
              <svg class="icn" style="color:var(--accent)" viewBox="0 0 24 24"><path d="M6 16l4-8 3 6 2-3 3 5"/></svg>
              Svårighetsgrad
            </div>
            <div class="diff-row">${diffBtnsHTML}</div>
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
        // Minnet i kolumn c är nu ANVÄNT → eget strykningssteg (v30).
        // SISTA kolumnens minne stryks inte (Dennis: inget kommande att förväxla med)
        if (carryVal && c < colCount - 1) steps.push({ type:'add_mem_strike', col:c });
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

    root.innerHTML = `
      <style id="up-base">${BASE_CSS}</style>
      <div class="app-header">
        <button class="btn-back" onclick="UppstallningGame.goBack()">Avsluta</button>
        <span class="header-title">${modeLabel} – Demo</span>
        <span style="width:52px"></span>
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
    showStepBubble(); // texten för det steg som NU animeras — text och animation i samma fas
    executeStep(step, () => {
      demoStep++;
      unlockStep();
      // "Klart!"-bubblan visas efter sista animationen (med lästid för sista stegtexten)
      if (demoSteps[demoStep] && demoSteps[demoStep].type === 'done') {
        const dennaOmgång = demoSteps;
        setTimeout(() => { if (demoSteps === dennaOmgång) showStepBubble(); }, 1800);
      }
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

    } else if (step.type === 'add_mem_strike') {
      strikeMemDigit(step.col);
      App.Sound.play('click');
      setTimeout(cb, 600);

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
      html = `1:an skrivs som minnessiffra här 👇`;
    } else if (step.type === 'add_result') {
      const ck = COL_KEYS[step.col];
      html = `Kvar blir <strong style="color:${PVC[ck]}">${step.kvar}</strong>. 10:an skickades upp som minnessiffra! ✅`;
    } else if (step.type === 'add_simple') {
      const ck = COL_KEYS[step.col];
      if (step.a === 0 && step.b === 0 && step.carry_in) {
        // Kolumn utan siffror — svaret ÄR minnessiffran (t.ex. hundratalet i 50+98)
        html = `Bara minnessiffran är kvar — <span style="color:#d97706">${step.carry_in}</span>:an flyttas ner! ✅`;
      } else {
        const ciStr = step.carry_in ? ` + <span style="color:#d97706">${step.carry_in}</span>` : '';
        html = `<span style="color:${PVC[ck]}">${step.a}</span> + <span style="color:${PVC[ck]}">${step.b}</span>${ciStr} = <strong style="color:${PVC[ck]}">${step.sum}</strong>`;
      }
    } else if (step.type === 'add_mem_strike') {
      html = `Nu stryker vi <strong style="color:#dc2626">1</strong>:an — den är använd! Så vet vi att den inte räknas igen. ✏️`;
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
        <button class="btn btn-primary" style="flex:1"
          onclick="UppstallningGame.startDemo()"><svg class="icn"><use href="#i-refresh"/></svg>Ny uppgift</button>
        <button class="btn btn-secondary" style="flex:1"
          onclick="UppstallningGame.goBack()">Tillbaka</button>
      </div>`;
    }
    return `<button id="up-next-btn" class="btn btn-primary btn-block" onclick="UppstallningGame.demoNextStep()"
      ${stepLocked ? 'disabled' : ''}>Nästa steg <svg class="icn"><use href="#i-play"/></svg></button>`;
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

  /* ── Carry-rad (v30: .mem-digit — raderas ALDRIG under uppgiften) ── */
  function updateCarryRow() {
    // Skriver ENDAST till: en befintlig minnessiffra rensas eller skrivs
    // aldrig över — cellen lämnas orörd tills ny uppgift renderar om tabellen.
    for (let c = 0; c < colCount; c++) {
      const el = document.getElementById(`carry-${COL_KEYS[c]}`);
      if (!el || !demoCarries[c]) continue;
      let d = el.querySelector('.mem-digit');
      if (!d) {
        el.innerHTML = `<span class="mem-digit">${demoCarries[c]}</span>`;
        d = el.querySelector('.mem-digit');
      }
      if (demoCarryUsed[c]) strikeMemEl(d);
    }
  }

  /* ── Stryk minnessiffra: animerat snett penndrag (~250 ms) ── */
  const MEM_STRIKE_SVG = `<svg class="mem-strike" viewBox="0 0 24 24" preserveAspectRatio="none" aria-hidden="true"><path d="M3.2 20.4 C 7.5 16.8 10.4 12.2 14.2 8.6 C 16.8 6.2 19.2 4.4 21 3.2"/></svg>`;

  function strikeMemEl(d) {
    if (!d || d.classList.contains('used')) return;
    d.classList.remove('pulse');
    d.insertAdjacentHTML('beforeend', MEM_STRIKE_SVG);
    d.classList.add('used');
  }

  function strikeMemDigit(col) {
    demoCarryUsed[col] = true;
    const cell = document.getElementById(`carry-${COL_KEYS[col]}`);
    if (cell) cell.classList.remove('mem-pulse');
    strikeMemEl(cell ? cell.querySelector('.mem-digit') : null);
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
        <td style="font-size:11px;font-weight:800;color:#dc2626;text-align:right;padding-right:6px;white-space:nowrap">minne:</td>
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
    memPerfect  = true;
    memMoments  = 0;
    showHelpSelect();
  }

  function showHelpSelect() {
    const root = document.getElementById('uppstallning-root');
    const modeLabel = mode === 'addition' ? 'Addition ➕' : 'Subtraktion ➖';
    root.innerHTML = `
      <style id="up-base">${BASE_CSS}</style>
      <div class="floaties"><span style="top:7%;right:8%">✨</span><span style="bottom:12%;left:6%;animation-delay:2s">🍀</span></div>
      <div class="app-header">
        <button class="btn-back" onclick="UppstallningGame.goBack()">Tillbaka</button>
        <span class="header-title">${modeLabel} – Övning</span>
        <span style="width:52px"></span>
      </div>
      <div class="wrap vcenter" style="padding:0 12px 12px;gap:14px">
        <div class="section-title" style="text-align:center">Hur vill du räkna?</div>
        <div class="up-card" onclick="UppstallningGame.setHelpMode(true)">
          <span class="up-aico">🤝</span>
          <span><b>Med hjälp</b><small>Ledtrådar, låna-knapp och kompletteringsmetoden</small></span>
          <svg class="icn chev" viewBox="0 0 24 24"><use href="#i-chevron"/></svg>
        </div>
        <div class="up-card" onclick="UppstallningGame.setHelpMode(false)">
          <span class="up-aico">💪</span>
          <span><b>Utan hjälp</b><small>Räkna på egen hand – ingen ledtråd</small></span>
          <svg class="icn chev" viewBox="0 0 24 24"><use href="#i-chevron"/></svg>
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
    exFreeInput        = '';
    exFreeFirstAttempt = true;
    memPhase    = null;
    freeMemVals = [null, null, null];
    freeMemUsed = [false, false, false];
    renderExLayout();
  }

  function renderExLayout() {
    const root = document.getElementById('uppstallning-root');
    const modeLabel = mode === 'addition' ? 'Addition ➕' : 'Subtraktion ➖';
    root.innerHTML = `
      <style id="up-base">${BASE_CSS}</style>
      <div class="app-header">
        <button class="btn-back" onclick="UppstallningGame.goBack()">Avsluta</button>
        <span class="header-title">${modeLabel} – Övning</span>
        <span class="num" style="width:52px;text-align:right;font-family:var(--font-head);font-weight:700;font-size:15px;color:var(--ink-soft)">${exerciseIdx+1}/5</span>
      </div>
      <div id="up-main">
        <div id="up-left">
          <div id="up-table-wrap" onclick="UppstallningGame.memTableTap(event)">${buildTableHTML()}</div>
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
      ui.innerHTML = `<div style="background:var(--glass-strong);border-radius:var(--radius-md);padding:12px;border:1px solid var(--glass-line);box-shadow:var(--shadow-panel)">
        <div id="ex-free-label" style="font-size:11px;font-weight:800;text-align:center;margin-bottom:8px;text-transform:uppercase"></div>
        <div class="ex-numpad">
          ${[1,2,3,4,5,6,7,8,9,0].map(k =>
            `<button class="ex-nk" onclick="UppstallningGame.exFreePress('${k}')">${k}</button>`
          ).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="up-btn" id="ex-free-erase" onclick="UppstallningGame.exFreeErase()"
            style="width:64px;height:48px;background:var(--tint);color:var(--deep);border:2px solid color-mix(in srgb, var(--accent) 30%, transparent);font-size:1.2rem;border-radius:var(--radius-full)">⌫</button>
          <button class="up-btn" id="ex-free-submit" onclick="UppstallningGame.exFreeSubmit()" disabled
            style="flex:1;height:48px;background:linear-gradient(135deg,#cbd5e1,#94a3b8);color:#fff;font-size:1rem;border-radius:var(--radius-full)">
            Skriv svaret…</button>
        </div>
      </div>`;
      exFreeUpdateSubmit();
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
        style="width:100%;height:58px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;font-size:1rem;border-radius:var(--radius-full);animation:borrow-glow 1.2s ease-in-out infinite;box-shadow:0 4px 12px rgba(245,158,11,0.5)">
        👆 Tryck här för att låna!</button>`;

    } else if (isTenFriend && tenPhase === 0) {
      // Fas 0: "mer än 9" — visa knapp för att gå till förklaring
      ui.innerHTML = `<button class="up-btn" id="ex-continue-btn" onclick="UppstallningGame.exTenStep1()"
        style="width:100%;height:58px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;font-size:1rem;border-radius:var(--radius-full);animation:borrow-glow 1.2s ease-in-out infinite;box-shadow:0 4px 12px rgba(245,158,11,0.5)">
        👆 Tryck här för att se hur! 🔢</button>`;

    } else if (isTenFriend && tenPhase === 1) {
      // Fas 1: förklaring visas i bubblan — knapp för att köra animationen
      ui.innerHTML = `<button class="btn btn-primary btn-block" id="ex-continue-btn" onclick="UppstallningGame.exTenStep2()">
        Se animation <svg class="icn"><use href="#i-play"/></svg></button>`;

    } else if (isTenFriend && tenPhase === 2) {
      // Fas 2: streck-animation körd, väntar på carry-flyg
      ui.innerHTML = `<button class="btn btn-primary btn-block" id="ex-continue-btn" onclick="UppstallningGame.exTenStep3()">
        Skicka 10:an! <svg class="icn" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>`;

    } else {
      // Fas 3+ eller ingen 10-kompis: visa numpad
      ui.innerHTML = `<div style="background:var(--glass-strong);border-radius:var(--radius-md);padding:12px;border:1px solid var(--glass-line);box-shadow:var(--shadow-panel)">
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
      const col  = exCurrentCol;
      const next = col + 1;
      const proceed = () => {
        if (next >= colCount) exCheckDone();
        else advanceToColumn(next);
      };
      if (mode === 'addition' && helpMode && demoCarries[col] === 1 && !demoCarryUsed[col]
          && col < colCount - 1) {
        // STRYKA-fas (v30): minnet i denna kolumn är nu använt — barnet stryker det.
        // Sista kolumnens minne undantas (Dennis: inget kommande att förväxla med)
        memMoments++;
        setTimeout(() => {
          memPhase = { kind:'strike', col, cont: proceed };
          const cell = document.getElementById(`carry-${COL_KEYS[col]}`);
          if (cell) {
            cell.classList.add('mem-pulse');
            const d = cell.querySelector('.mem-digit');
            if (d) d.classList.add('pulse');
          }
          const bubble = document.getElementById('ex-bubble');
          if (bubble) bubble.innerHTML = `<div class="thought-bubble">Stryk minnessiffran — den är använd! ✏️</div>`;
          const ui = document.getElementById('ex-col-ui');
          if (ui) ui.innerHTML = `<div style="font-size:12px;font-weight:800;color:#dc2626;text-align:center;padding:8px">👆 Tryck på minnessiffran för att stryka den!</div>`;
        }, 700);
      } else if (next >= colCount) {
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
      ui.innerHTML = `<button class="btn btn-primary btn-block" id="ex-continue-btn" onclick="UppstallningGame.exContinueBorrow()">
        Fortsätt <svg class="icn"><use href="#i-play"/></svg></button>`;
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
    // Fas 2 → PLACERA (v30): knappen INITIERAR — själva placeringen är barnets tap
    if (exInputLocked) return;
    const c = exCurrentCol;
    const colData = exColData[c];
    const btn = document.getElementById('ex-continue-btn');
    if (btn) btn.disabled = true;
    exInputLocked = true;

    const fly = colData.carryFlyStep;
    if (!fly || !fly.nextCarry || c + 1 >= colCount) {
      // Ingen destination för minnessiffran — bete sig som tidigare (no-op-flyg)
      executeStep(fly || { type:'add_carry_fly', col:c, nextCarry:0 }, () => {
        exTenPhase[c] = 3;
        exInputLocked = false;
        showExColUI(c);
      });
      return;
    }
    App.Sound.play('click');
    memMoments++;
    memPhase = { kind:'place', col: c + 1, srcCol: c };
    const cell = document.getElementById(`carry-${COL_KEYS[c + 1]}`);
    if (cell) cell.classList.add('mem-pulse');
    const bubble = document.getElementById('ex-bubble');
    if (bubble) bubble.innerHTML = `<div class="thought-bubble">Var ska minnessiffran? 🤔 Tryck på rätt ruta!</div>`;
    const ui = document.getElementById('ex-col-ui');
    if (ui) ui.innerHTML = `<div style="font-size:12px;font-weight:800;color:#dc2626;text-align:center;padding:8px">👆 Tryck på minnesrutan där 1:an ska stå!</div>`;
  }

  /* ── Levande minnessiffror: tap-hantering (v30, endast addition) ── */
  function memTableTap(ev) {
    if (mode !== 'addition') return;
    if (!helpMode) { freeMemTap(ev); return; }
    if (!memPhase) return;
    const cellEl    = ev.target.closest ? ev.target.closest('.carry-cell') : null;
    const targetKey = COL_KEYS[memPhase.col];
    const hit       = !!(cellEl && cellEl.id === `carry-${targetKey}`);
    const fb        = document.getElementById('ex-feedback');

    if (memPhase.kind === 'place') {
      if (hit) {
        const dst = memPhase.col, src = memPhase.srcCol;
        memPhase = null;
        cellEl.classList.remove('mem-pulse');
        if (fb) fb.innerHTML = '';
        playCarrySound();
        animateCarryToken(src, dst, () => {
          demoCarries[dst] = 1;
          updateCarryRow();
          App.Sound.play('correct');
          smallBurst();
          exTenPhase[src] = 3;
          exInputLocked = false;
          showExColUI(src);
        });
      } else {
        // Fel tap → mild vägledning, inget poängstraff — tappa igen
        memPerfect = false;
        const t = document.getElementById(`carry-${targetKey}`);
        if (t) t.classList.add('mem-pulse');
        if (fb) fb.innerHTML = `<div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);
          border:2px solid #f59e0b;border-radius:12px;padding:10px;font-weight:800;
          color:#92400e;text-align:center">Nästan — den ska stå här 👉</div>`;
      }
    } else if (memPhase.kind === 'strike') {
      if (hit) {
        const col  = memPhase.col;
        const cont = memPhase.cont;
        memPhase = null;
        if (fb) fb.innerHTML = '';
        const bubble = document.getElementById('ex-bubble');
        if (bubble) bubble.innerHTML = `<div class="thought-bubble">Struken! Nu vet vi att den inte räknas igen. ✏️</div>`;
        strikeMemDigit(col);
        App.Sound.play('correct');
        const gen = upExGen;
        setTimeout(() => { if (gen === upExGen) cont(); }, 500);
      } else {
        memPerfect = false;
        if (fb) fb.innerHTML = `<div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);
          border:2px solid #f59e0b;border-radius:12px;padding:10px;font-weight:800;
          color:#92400e;text-align:center">Titta — 1:an är inte struken än 👀</div>`;
      }
    }
  }

  /* ── Fria läget: frivilliga minnessiffror (påverkar ALDRIG rättningen) ── */
  function freeMemTap(ev) {
    if (ev.target.closest && ev.target.closest('.mem-picker')) return; // väljarens knappar sköter sig själva
    closeMemPicker();
    const cellEl = ev.target.closest ? ev.target.closest('.carry-cell') : null;
    if (!cellEl) return;
    const col = COL_KEYS.findIndex(k => cellEl.id === `carry-${k}`);
    if (col < 0) return;
    if (freeMemVals[col] == null) {
      openMemPicker(col, cellEl);           // tom → sifferväljare 1–9
    } else if (!freeMemUsed[col]) {
      freeMemUsed[col] = true;              // skriven → stryks
      strikeMemEl(cellEl.querySelector('.mem-digit'));
      App.Sound.play('click');
    } else {
      freeMemVals[col] = null;              // struken → rensas
      freeMemUsed[col] = false;
      cellEl.innerHTML = '';
      App.Sound.play('click');
    }
  }

  function openMemPicker(col, cellEl) {
    const wrap = document.getElementById('up-table-wrap');
    if (!wrap) return;
    const p = document.createElement('div');
    p.className = 'mem-picker';
    p.id = 'mem-picker';
    p.innerHTML = [1,2,3,4,5,6,7,8,9].map(n =>
      `<button onclick="UppstallningGame.memPick(${col},${n})">${n}</button>`).join('');
    wrap.appendChild(p);
    // Klampa inom tabellytan — poppisen får aldrig skapa overflow
    const wR = wrap.getBoundingClientRect();
    const cR = cellEl.getBoundingClientRect();
    const left = Math.max(4, Math.min(cR.left - wR.left + cR.width / 2 - p.offsetWidth / 2,
      wR.width - p.offsetWidth - 4));
    let top = cR.bottom - wR.top + 6;
    if (top + p.offsetHeight > wR.height - 4) {
      top = Math.max(4, cR.top - wR.top - p.offsetHeight - 6);
    }
    p.style.left = `${left}px`;
    p.style.top  = `${top}px`;
    App.Sound.play('click');
  }

  function closeMemPicker() {
    const p = document.getElementById('mem-picker');
    if (p) p.remove();
  }

  function memPick(col, n) {
    closeMemPicker();
    freeMemVals[col] = n;
    freeMemUsed[col] = false;
    const el = document.getElementById(`carry-${COL_KEYS[col]}`);
    if (el) el.innerHTML = `<span class="mem-digit">${n}</span>`;
    App.Sound.play('click');
  }

  /* ── Glömd-minnessiffra-simulering: alla carryIn = 0 ────── */
  function simulateNoCarrySum() {
    // Kolumnsumma skrivs mod 10; carry genereras men adderas aldrig
    const da = digs(numA), db = digs(numB);
    let out = 0, mul = 1;
    for (let c = 0; c < colCount; c++) { out += ((da[c] + db[c]) % 10) * mul; mul *= 10; }
    return out;
  }

  /* ── Free mode funktioner (utan hjälp) — miniräknare ───── */
  function exFreeInit() {
    // Ersätt svarsradens per-kolumn-rutor med ETT brett svarsfält.
    // buildTableHTML lämnas orörd (hjälpläget delar den) — fria läget
    // byter bara ut sin egen svarsrad vid init.
    const firstAns = document.getElementById(`ans-${COL_KEYS[0]}`);
    const row = firstAns ? firstAns.closest('tr') : null;
    if (row) {
      row.innerHTML = `<td colspan="${colCount + 2}">
        <div class="free-field num" id="ex-free-field"><span class="free-caret"></span></div>
      </td>`;
    }
    showExColUI(0);
  }

  // Maxlängd = antal siffror i största möjliga svar (svar ≥1000 förekommer inte)
  function exFreeMaxLen() { return colCount; }

  function exFreeRender() {
    const field = document.getElementById('ex-free-field');
    if (!field) return;
    field.classList.toggle('has-digits', exFreeInput.length > 0);
    field.innerHTML = (exFreeInput ? `<span>${exFreeInput}</span>` : '') +
      '<span class="free-caret"></span>';
  }

  function exFreeShake() {
    const field = document.getElementById('ex-free-field');
    if (!field) return;
    field.classList.remove('shake');
    void field.offsetWidth; // starta om animationen
    field.classList.add('shake');
  }

  function exFreeClearWrong() {
    const field = document.getElementById('ex-free-field');
    if (field) field.classList.remove('wrong');
    const fb = document.getElementById('ex-feedback');
    if (fb) fb.innerHTML = '';
  }

  function exFreeUpdateSubmit() {
    const ready = exFreeInput.length > 0;
    const btn = document.getElementById('ex-free-submit');
    if (btn) {
      btn.disabled = !ready;
      btn.style.background = ready
        ? 'linear-gradient(135deg,var(--accent),var(--accent-light))'
        : 'linear-gradient(135deg,#cbd5e1,#94a3b8)';
      btn.textContent = ready ? 'Klar ✓' : 'Skriv svaret…';
    }
    const label = document.getElementById('ex-free-label');
    if (label) {
      label.textContent = ready ? 'Tryck Klar ✓ när du är säker' : 'Skriv svaret med siffrorna';
      label.style.color = ready ? '#16a34a' : 'var(--ink-soft)';
    }
  }

  function exFreePress(key) {
    if (exInputLocked) return;
    exFreeClearWrong();
    if (exFreeInput === '0') {
      exFreeInput = key; // miniräknar-detalj: ensam nolla ersätts
    } else if (exFreeInput.length >= exFreeMaxLen()) {
      exFreeShake(); // fullt — extra tryck ignoreras mjukt
      return;
    } else {
      exFreeInput += key; // läggs till i slutet: vänster→höger som man skriver
    }
    App.Sound.play('click');
    exFreeRender();
    exFreeUpdateSubmit();
  }

  function exFreeErase() {
    if (exInputLocked) return;
    if (!exFreeInput) return; // inget att sudda
    exFreeClearWrong();
    exFreeInput = exFreeInput.slice(0, -1); // ⌫ tar bort SISTA siffran
    App.Sound.play('click');
    exFreeRender();
    exFreeUpdateSubmit();
  }

  function exFreeSubmit() {
    if (exInputLocked) return;
    if (!exFreeInput) return; // gating: Klar kräver minst 1 siffra
    const facit = mode === 'addition' ? numA + numB : numA - numB;
    const field = document.getElementById('ex-free-field');

    if (parseInt(exFreeInput, 10) === facit) {
      // Rätt — poäng endast om helrätt på första Klar-trycket
      exInputLocked = true;
      if (exFreeFirstAttempt) exScore++;
      const dr = digs(facit);
      for (let c = 0; c < colCount; c++) exAnswers[c] = dr[c];
      exFreeClearWrong();
      if (field) {
        field.classList.add('correct');
        field.innerHTML = `<span>${exFreeInput}</span>`; // markören släcks
      }
      App.Sound.play('correct');
      smallBurst();
      setTimeout(() => exCheckDone(true), 900);
    } else {
      // Fel — förbrukar första försöket; siffrorna står kvar och kan redigeras
      exFreeFirstAttempt = false;
      App.Sound.play('wrong');
      if (field) field.classList.add('wrong');
      exFreeShake();
      // Glömd-minnessiffra-detektion (v30): matchar svaret simuleringen
      // med alla carryIn=0 → riktad feedback istället för generisk
      const glomtMinne = mode === 'addition' &&
        parseInt(exFreeInput, 10) === simulateNoCarrySum();
      const fb = document.getElementById('ex-feedback');
      if (fb) fb.innerHTML = `<div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);
        border:2px solid #f59e0b;border-radius:12px;padding:10px;font-weight:800;
        color:#92400e;text-align:center">${glomtMinne
          ? 'Nästan! Kolla minnessiffrorna — någon vill vara med! 👆'
          : 'Inte riktigt! Ändra med ⌫ och prova igen 💪'}</div>`;
      exFreeUpdateSubmit(); // siffror finns kvar → Klar förblir aktiv
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
      const gen = upExGen;
      setTimeout(() => { toast.remove(); if (gen === upExGen) newExProblem(); }, 1100);
    }
  }

  function showExResults() {
    App.Sound.play(exScore >= 4 ? 'fanfare' : 'correct');
    if (exScore === 5) App.Confetti.burst(160);
    saveLog(exScore, 5);
    const root = document.getElementById('uppstallning-root');
    const emoji = exScore === 5 ? '🌟' : exScore >= 4 ? '🥇' : exScore >= 3 ? '🥈' : '💪';
    const msg   = exScore === 5 ? 'Perfekt! 🎉' : exScore >= 4 ? 'Fantastiskt!' : exScore >= 3 ? 'Jättebra!' : 'Fortsätt öva!';
    // Minnesmästare ⭐ (v30): alla placera+stryk-moment klarade utan fel-tap.
    // Aldrig något negativt vid miss — bara utebliven bonus.
    const memStar = mode === 'addition' && helpMode && memMoments > 0 && memPerfect;
    root.innerHTML = `
      <style id="up-base">${BASE_CSS}</style>
      <div class="floaties"><span style="top:7%;right:8%">✨</span><span style="bottom:12%;left:6%;animation-delay:2s">🍀</span></div>
      <div class="app-header">
        <button class="btn-back" onclick="UppstallningGame.goBack()">Tillbaka</button>
        <span class="header-title">Resultat</span>
        <span style="width:52px"></span>
      </div>
      <div class="wrap" style="padding:0 12px 12px">
        <div class="result-hero">
          <div class="result-pct num">${Math.round((exScore / 5) * 100)} %</div>
          <div class="result-medal">${emoji}</div>
          <div class="result-msg">${msg}</div>
          <div class="result-note num">${exScore} av 5 rätt</div>
          ${memStar ? '<div class="mem-master">⭐ Minnesmästare!</div>' : ''}
          <div class="result-actions">
            <button class="btn btn-primary btn-lg" onclick="UppstallningGame.startExercise()">
              <svg class="icn"><use href="#i-refresh"/></svg>Spela igen</button>
            <button class="btn btn-ghost" onclick="UppstallningGame.goBack()">Välj läge</button>
          </div>
        </div>
      </div>`;
  }

  /* ── Scratch HTML ───────────────────────────────────────── */
  function scratchHTML() {
    return `<div class="up-scratch">
      <div style="font-size:10px;font-weight:800;color:var(--deep);text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0">✏️ Kladd</div>
      <canvas id="up-canvas" class="up-canvas"></canvas>
      <div style="display:flex;gap:5px;flex-shrink:0">
        <button onclick="UppstallningGame.upToggleEraser(false)" id="up-draw"
          style="flex:1;height:30px;border-radius:10px;font-weight:800;font-size:11px;
          cursor:pointer;background:var(--accent);color:#fff;border:1.5px solid var(--accent)">🖊️ Rita</button>
        <button onclick="UppstallningGame.upToggleEraser(true)" id="up-erase"
          style="flex:1;height:30px;border-radius:10px;font-weight:800;font-size:11px;
          cursor:pointer;background:var(--tint);color:var(--deep);border:1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)">🧹 Sudd</button>
        <button onclick="UppstallningGame.upClearCanvas()"
          style="flex:1;height:30px;border-radius:10px;font-weight:800;font-size:11px;
          cursor:pointer;background:var(--tint);color:var(--deep);border:1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)">🗑️ Rensa</button>
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
  let upResizeObs = null;

  function setupCanvas(id) {
    const el = document.getElementById(id);
    if (upResizeObs) { upResizeObs.disconnect(); upResizeObs = null; }
    upCanvas = el;
    if (!upCanvas) return;
    upErasing = false;
    requestAnimationFrame(() => {
      if (!upCanvas || !upCanvas.isConnected) return;
      const r = upCanvas.getBoundingClientRect();
      upCanvas.width  = Math.max(Math.round(r.width)  || 300, 60);
      upCanvas.height = Math.max(Math.round(r.height) || 200, 60);
      upCtx = upCanvas.getContext('2d');
      upCanvas.addEventListener('pointerdown',   upPD);
      upCanvas.addEventListener('pointermove',   upPM);
      upCanvas.addEventListener('pointerup',     upPU);
      upCanvas.addEventListener('pointercancel', upPU);
      /* Kladden flex-växer nu dynamiskt (bubblor/feedback ändrar layouten) —
         håll bitmappen i synk med CSS-ytan så pennan aldrig förvrängs. */
      if (typeof ResizeObserver !== 'undefined') {
        upResizeObs = new ResizeObserver(() => upSyncBitmap());
        upResizeObs.observe(upCanvas);
      }
    });
  }

  function upSyncBitmap() {
    if (!upCanvas || !upCtx || !upCanvas.isConnected) return;
    const w = Math.round(upCanvas.clientWidth);
    const h = Math.round(upCanvas.clientHeight);
    if (!w || !h) return;
    if (Math.abs(w - upCanvas.width) < 2 && Math.abs(h - upCanvas.height) < 2) return;
    /* Bevara det ritade: kopiera ut, ändra bitmapp, kopiera tillbaka oskalat */
    const tmp = document.createElement('canvas');
    tmp.width = upCanvas.width; tmp.height = upCanvas.height;
    tmp.getContext('2d').drawImage(upCanvas, 0, 0);
    upCanvas.width = w; upCanvas.height = h;
    upCtx.drawImage(tmp, 0, 0);
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
    if (d) { d.style.background = on ? 'var(--tint)' : 'var(--accent)'; d.style.color = on ? 'var(--deep)' : '#fff'; }
    if (e) { e.style.background = on ? 'var(--accent)' : 'var(--tint)'; e.style.color = on ? '#fff' : 'var(--deep)'; }
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
    memTableTap, memPick,
    exFreePress, exFreeSubmit, exFreeErase,
    upToggleEraser, upClearCanvas,
    goBack,
  };
})();
