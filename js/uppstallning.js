/* ============================================================
   MULTIPLAY – Uppställd addition & subtraktion
   Demo-läge (steg-för-steg) + Övningsläge (kolumn för kolumn)
   ============================================================ */
'use strict';

const UppstallningGame = (() => {

  /* ── State ─────────────────────────────────────────────── */
  let profile    = null;
  let mode       = 'addition';

  let difficulty = 'medium';

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
  let exEffA        = [];
  let exEffB        = [];
  let exCarries     = [];
  let exBorrowTens  = [false, false, false]; // borrow-ten markers for exercise mode
  let exInput       = '';

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
    .diff-btn { padding:8px 18px; border-radius:999px; font-weight:800; font-size:13px;
      cursor:pointer; border:2px solid rgba(37,99,235,0.3);
      background:var(--pv-light); color:var(--pv-primary); transition:all 0.15s; }
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

    /* Diagonal streck */
    .dw { position:relative; display:inline-flex; align-items:center; justify-content:center;
      width:100%; height:100%; }
    .dw.crossed::after { content:''; position:absolute; left:4px; right:4px; top:50%;
      height:3px; background:#ef4444; border-radius:2px;
      transform:rotate(-22deg) scaleX(0); transform-origin:left center;
      animation:strike-draw 0.42s ease-out 0.05s forwards; }
    .dw.carry-crossed::after { background:#d97706; }
    .digit-new { position:absolute; top:-24px; left:50%; transform:translateX(-50%);
      font-size:clamp(0.75rem,1.5vw,0.92rem); font-weight:900; pointer-events:none; white-space:nowrap;
      animation:fade-up 0.4s ease-out 0.45s both; }
    .small-new-digit { position:absolute; bottom:2px; right:4px;
      font-size:clamp(0.58rem,1.2vw,0.78rem); font-weight:900; pointer-events:none; z-index:2; }

    /* Borrow-ten wrapper och marker */
    .bt-wrap { height:30px; position:relative; display:flex; align-items:flex-end;
      justify-content:center; }
    .borrow-ten { position:absolute; bottom:0; left:50%; transform:translateX(-50%);
      font-size:clamp(0.7rem,1.5vw,0.88rem); font-weight:900; color:#dc2626; background:#fee2e2;
      border:1.5px solid #ef4444; border-radius:6px; padding:1px clamp(4px,0.8vw,6px);
      pointer-events:none; animation:land-bounce 0.45s ease-out both; white-space:nowrap; }
    .borrow-ten.used { text-decoration:line-through; opacity:0.4; animation:none; }

    /* Tankebubbla */
    .thought-bubble { background:#fff; border-radius:16px;
      padding:clamp(8px,1.5vw,14px) clamp(10px,2vw,18px);
      box-shadow:0 2px 12px rgba(0,0,0,0.10); font-weight:800;
      font-size:clamp(0.92rem,2vw,1.15rem);
      border:2px solid rgba(37,99,235,0.16); animation:bubble-in 0.3s ease-out; line-height:1.5; }

    /* Numpad i övningsläge */
    .ex-numpad { display:grid; grid-template-columns:repeat(5,clamp(38px,7vw,48px)); gap:5px; justify-content:center; }
    .ex-nk { width:clamp(38px,7vw,48px); height:clamp(38px,7vw,48px); border-radius:50%;
      font-size:clamp(0.95rem,2vw,1.1rem); font-weight:900;
      cursor:pointer; background:rgba(255,255,255,0.92); border:1.5px solid rgba(37,99,235,0.3);
      color:var(--pv-primary); transition:transform 0.1s; }
    .ex-nk:hover { transform:scale(1.12); }

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
          <div style="display:flex;gap:8px">
            <button class="diff-btn ${difficulty==='easy'?'active':''}" onclick="UppstallningGame.setDifficulty('easy',this)">Lätt</button>
            <button class="diff-btn ${difficulty==='medium'?'active':''}" onclick="UppstallningGame.setDifficulty('medium',this)">Medium</button>
            <button class="diff-btn ${difficulty==='hard'?'active':''}" onclick="UppstallningGame.setDifficulty('hard',this)">Svårt</button>
          </div>
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
        do { a = 10 + rnd(40); b = 10 + rnd(40); } while (a + b >= 100);
      } else if (difficulty === 'medium') {
        a = 100 + rnd(400); b = 100 + rnd(300);
      } else {
        do { a = 200 + rnd(400); b = 200 + rnd(300); } while (!hasCarry(a,b));
      }
    } else {
      if (difficulty === 'easy') {
        do { a = 30 + rnd(70); b = 10 + rnd(20); } while (a <= b);
      } else if (difficulty === 'medium') {
        do { a = 200 + rnd(400); b = 100 + rnd(200); } while (a <= b);
      } else {
        // Garantera minst 1 lån. 50% chans att tiotalet=0 (dubbellån).
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
    colCount = (numA >= 100 || numB >= 100 || Math.abs(numA - numB) >= 100) ? 3 : 2;
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
        const sum = da[c] + db[c] + carryVal;
        const ans = sum % 10;
        const next = sum > 9 ? 1 : 0;
        steps.push({ type:'add_show', col:c, da:da[c], db:db[c], carry_in:carryVal, sum, ans, next_carry:next });
        steps.push({ type:'add_drop', col:c, ans, next_carry:next });
        carryVal = next;
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
    if (step.type === 'add_show') {
      highlightCol(step.col);
      setTimeout(cb, 50);

    } else if (step.type === 'add_drop') {
      highlightCol(step.col);
      const colKey = COL_KEYS[step.col];
      const ansCell = document.getElementById(`ans-${colKey}`);
      if (ansCell) {
        ansCell.innerHTML = `<span style="color:${PVC[colKey]};animation:drop-down 0.55s ease-out both;display:inline-block">${step.ans}</span>`;
        ansCell.classList.add('filled');
        ansCell.style.borderColor = PVC[colKey];
      }
      demoAns[step.col] = step.ans;
      App.Sound.play('correct');
      if (step.next_carry && step.col + 1 < colCount) {
        playCarrySound();
        setTimeout(() => {
          animateCarryToken(step.col, step.col + 1, () => {
            demoCarries[step.col + 1] = 1;
            updateCarryRow();
            setTimeout(cb, 200);
          });
        }, 500);
      } else {
        setTimeout(cb, 700);
      }

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
        sp.textContent = step.diff;
        dwA.appendChild(sp);
      }
      const dwB = document.getElementById(`dw-b-${colKey}`);
      if (dwB) dwB.classList.add('crossed');
      // Fas 2 (t=500ms): stryk src-kolumnen, visa srcNew
      setTimeout(() => {
        playBorrowSound();
        const srcDw = document.getElementById(`dw-a-${srcKey}`);
        if (srcDw) {
          srcDw.classList.add('crossed');
          // Ersätt befintlig digit-new (om dubbellån lämnade en) med srcNew
          const existing = srcDw.querySelector('.digit-new');
          if (existing) {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = `position:absolute;top:-24px;left:50%;transform:translateX(-50%);display:flex;gap:3px;align-items:center;pointer-events:none;white-space:nowrap;`;
            wrapper.innerHTML =
              `<span style="color:${PVC[srcKey]};font-size:clamp(0.75rem,1.5vw,0.92rem);font-weight:900;text-decoration:line-through;opacity:0.4">${existing.textContent}</span>` +
              `<span style="color:${PVC[srcKey]};font-size:clamp(0.75rem,1.5vw,0.92rem);font-weight:900;animation:land-bounce 0.45s ease-out both">${step.srcNew}</span>`;
            existing.replaceWith(wrapper);
          } else {
            const sp = document.createElement('span');
            sp.className = 'digit-new';
            sp.style.color = PVC[srcKey];
            sp.textContent = step.srcNew;
            srcDw.appendChild(sp);
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
        srcDw.appendChild(sp);
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
            dstDw.appendChild(sp2);
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
    if (step.type === 'add_show') {
      const ck = COL_KEYS[step.col];
      const ci = step.carry_in;
      const ciStr = ci ? ` + <span style="color:#d97706">${ci}</span> (minne)` : '';
      if (step.sum > 9) {
        html = `<span style="color:${PVC[ck]}">${step.da}</span> + <span style="color:${PVC[ck]}">${step.db}</span>${ciStr} = <strong>${step.sum}</strong><br>
          Skriv <strong style="color:${PVC[ck]}">${step.ans}</strong>, minns <strong style="color:#d97706">1</strong> till nästa kolumn 💭`;
      } else {
        html = `<span style="color:${PVC[ck]}">${step.da}</span> + <span style="color:${PVC[ck]}">${step.db}</span>${ciStr} = <strong style="color:${PVC[ck]}">${step.sum}</strong>`;
      }
    } else if (step.type === 'add_drop') {
      const ck = COL_KEYS[step.col];
      html = step.next_carry
        ? `<strong style="color:${PVC[ck]}">${step.ans}</strong> går ner i svaret. <strong style="color:#d97706">1</strong> flyger upp till minnessiffran! 🚀`
        : `<strong style="color:${PVC[ck]}">${step.ans}</strong> går ner i svaret ✅`;
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
        <div class="bt-wrap" id="bt-wrap-${c.key}"></div>
        <div class="col-cell" id="cell-row-a-${c.key}" style="border-color:${PVC[c.key]}">
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
    newExProblem();
  }

  function newExProblem() {
    generatePair();
    exCurrentCol  = 0;
    exInputLocked = false;
    exInput       = '';
    exAnswers     = [null, null, null];
    exEffA        = [...digs(numA)];
    exEffB        = [...digs(numB)];
    exCarries     = [0, 0, 0];
    exBorrowTens  = [false, false, false];
    renderExView();
  }

  function renderExView() {
    const root = document.getElementById('uppstallning-root');
    const modeLabel = mode === 'addition' ? 'Addition ➕' : 'Subtraktion ➖';
    const modeColor = mode === 'addition' ? '#d97706' : '#dc2626';
    const colKey = COL_KEYS[exCurrentCol];
    // needsBorrow: behöver låna OCH har inte redan lånat (borrow-ten inte aktiv)
    const needsBorrow = mode === 'subtraction'
      && exEffA[exCurrentCol] < exEffB[exCurrentCol]
      && !exBorrowTens[exCurrentCol];

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
          <div id="up-table-wrap">${buildExTableHTML()}</div>
          <div id="ex-bubble">${exBubbleHTML(needsBorrow)}</div>
          ${needsBorrow
            ? `<button class="up-btn" id="ex-borrow-btn" onclick="UppstallningGame.exDoBorrow()"
                style="width:100%;height:48px;background:#fef3c7;color:#d97706;border:2px solid #f59e0b;font-size:1rem;border-radius:14px">
                💡 Låna från nästa kolumn</button>`
            : `<div style="background:rgba(255,255,255,0.9);border-radius:14px;padding:12px;border:2px solid rgba(37,99,235,0.1)">
                <div style="font-size:11px;font-weight:800;color:${PVC[colKey]};text-align:center;margin-bottom:8px;text-transform:uppercase">
                  Fyll i ${colKey === 'ental' ? 'entalet' : colKey === 'tiotal' ? 'tiotalet' : 'hundratalet'}
                </div>
                <div class="ex-numpad">
                  ${[1,2,3,4,5,6,7,8,9,'⌫',0,''].map(k => k === ''
                    ? '<div></div>'
                    : `<button class="ex-nk" onclick="UppstallningGame.exPress(${JSON.stringify(String(k))})">${k}</button>`
                  ).join('')}
                </div>
              </div>`}
          <div id="ex-feedback"></div>
        </div>
        <div id="up-right">
          ${scratchHTML()}
        </div>
      </div>`;

    setupCanvas('up-canvas');
  }

  function buildExTableHTML() {
    const maxC = colCount;
    const cols = [];
    for (let c = maxC - 1; c >= 0; c--) cols.push({ key: COL_KEYS[c], label: COL_LABELS[c], idx: c });

    const op = mode === 'addition' ? '+' : '−';

    const carryRow = mode === 'addition' ? `
      <tr>
        <td style="font-size:11px;font-weight:800;color:#d97706;text-align:right;padding-right:6px;white-space:nowrap">minne:</td>
        ${cols.map(c => `<td style="text-align:center">
          <div class="carry-cell" id="ex-carry-${c.key}">${exCarries[c.idx] ? '1' : ''}</div>
        </td>`).join('')}
        <td></td>
      </tr>` : '';

    const rowA = cols.map(c => {
      const isCur = c.idx === exCurrentCol;
      const isFilled = exAnswers[c.idx] !== null;
      const hasBt = exBorrowTens[c.idx]; // borrow-ten aktiv för denna kolumn
      // Visa ursprungssiffran (exEffA - 10 om borrow-ten) struken, annars normalt
      const dispVal = hasBt ? (exEffA[c.idx] - 10) : exEffA[c.idx];
      const showVal = String(numA).length > c.idx ? dispVal : '';
      return `<td style="text-align:center;vertical-align:bottom">
        <div class="bt-wrap" id="ex-bt-wrap-${c.key}">
          ${hasBt ? '<div class="borrow-ten" style="animation:none">10</div>' : ''}
        </div>
        <div class="col-cell${isCur ? ' glow-'+c.key : isFilled ? ' dim' : ''}"
          style="border-color:${PVC[c.key]}" id="ex-a-${c.key}">
          <div class="dw${hasBt ? ' crossed' : ''}" id="ex-dw-a-${c.key}">
            <span style="color:${PVC[c.key]}">${showVal}</span>
          </div>
        </div>
      </td>`;
    }).join('');

    const rowB = cols.map(c => {
      const isCur = c.idx === exCurrentCol;
      const v = exEffB[c.idx];
      return `<td style="text-align:center">
        <div class="col-cell${!isCur ? ' dim' : ''}" style="border-color:${PVC[c.key]}">
          <div class="dw" id="ex-dw-b-${c.key}">
            <span style="color:${PVC[c.key]}">${String(numB).length > c.idx ? v : ''}</span>
          </div>
        </div>
      </td>`;
    }).join('');

    const ansRow = cols.map(c => {
      const v = exAnswers[c.idx];
      const isCur = c.idx === exCurrentCol;
      const filled = v !== null;
      return `<td style="text-align:center">
        <div class="ans-cell${isCur ? ' active-col' : ''}${filled ? ' filled' : ''}"
          id="ex-ans-${c.key}"
          style="${filled ? 'border-color:'+PVC[c.key]+';border-style:solid' : ''}">
          <span style="color:${PVC[c.key]}">${v !== null ? v : (isCur && exInput ? exInput : '')}</span>
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
          ${carryRow}
          <tr><td></td>${rowA}<td></td></tr>
          <tr>
            <td style="font-size:1.8rem;font-weight:900;color:#555;text-align:right;padding-right:6px">${op}</td>
            ${rowB}<td></td>
          </tr>
          <tr>
            <td colspan="${cols.length + 2}" style="padding:2px 0">
              <div style="height:3px;background:linear-gradient(90deg,transparent,#374151,transparent);border-radius:2px"></div>
            </td>
          </tr>
          <tr><td></td>${ansRow}<td></td></tr>
        </tbody>
      </table>`;
  }

  function exBubbleHTML(needsBorrow) {
    const ck = COL_KEYS[exCurrentCol];
    let msg = '';
    if (needsBorrow) {
      const isDouble = exCurrentCol + 1 < colCount && exEffA[exCurrentCol + 1] === 0;
      msg = isDouble
        ? `<span style="color:#ef4444">⚠️ ${exEffA[exCurrentCol]} − ${exEffB[exCurrentCol]} går inte! Tiotalet är 0 — du behöver låna från hundratalet.</span>`
        : `<span style="color:#ef4444">⚠️ ${exEffA[exCurrentCol]} − ${exEffB[exCurrentCol]} går inte! Du behöver låna.</span>`;
    } else if (exBorrowTens[exCurrentCol]) {
      // Kompletteringsmetoden: visa 10 − diff
      const origA = exEffA[exCurrentCol] - 10;
      const diff = exEffB[exCurrentCol] - origA;
      msg = `Du lånade en 10:a! Vad är <strong style="color:#dc2626">10</strong> − <strong style="color:${PVC[ck]}">${diff}</strong>?`;
    } else if (mode === 'addition') {
      const ci = exCarries[exCurrentCol] || 0;
      const extra = ci ? ` + <span style="color:#d97706">${ci}</span> (minne)` : '';
      msg = `Vad är <strong style="color:${PVC[ck]}">${exEffA[exCurrentCol]}</strong> + <strong style="color:${PVC[ck]}">${exEffB[exCurrentCol]}</strong>${extra}?`;
    } else {
      msg = `Vad är <strong style="color:${PVC[ck]}">${exEffA[exCurrentCol]}</strong> − <strong style="color:${PVC[ck]}">${exEffB[exCurrentCol]}</strong>?`;
    }
    return msg ? `<div class="thought-bubble">${msg}</div>` : '';
  }

  function exPress(key) {
    if (exInputLocked) return;
    const fb = document.getElementById('ex-feedback');
    if (fb) fb.innerHTML = '';
    if (key === '⌫') {
      exInput = exInput.slice(0, -1);
    } else if (exInput.length < 1) {
      exInput = key;
    }
    const colKey = COL_KEYS[exCurrentCol];
    const ansEl = document.getElementById(`ex-ans-${colKey}`);
    if (ansEl) ansEl.querySelector('span').textContent = exInput || '';
    if (exInput.length === 1) {
      setTimeout(() => { if (!exInputLocked && exInput.length === 1) exSubmitCol(); }, 350);
    }
  }

  function exSubmitCol() {
    if (exInputLocked || !exInput) return;
    exInputLocked = true;
    const ci = (mode === 'addition' ? exCarries[exCurrentCol] : 0) || 0;

    let correctFull;
    if (mode === 'addition') {
      correctFull = exEffA[exCurrentCol] + exEffB[exCurrentCol] + ci;
    } else if (exBorrowTens[exCurrentCol]) {
      // Kompletteringsmetoden: exEffA[c] = orig+10, så orig = exEffA[c]-10
      const origA = exEffA[exCurrentCol] - 10;
      const diff = exEffB[exCurrentCol] - origA;
      correctFull = 10 - diff;
    } else {
      correctFull = exEffA[exCurrentCol] - exEffB[exCurrentCol];
    }
    const correctDigit = ((correctFull % 10) + 10) % 10;

    if (parseInt(exInput) === correctDigit) {
      exAnswers[exCurrentCol] = correctDigit;
      exBorrowTens[exCurrentCol] = false; // rensa borrow-ten markör
      exInput = '';
      App.Sound.play('correct');
      if (mode === 'addition' && correctFull > 9 && exCurrentCol + 1 < colCount) {
        exCarries[exCurrentCol + 1] = 1;
        playCarrySound();
      }
      smallBurst();
      const next = exCurrentCol + 1;
      if (next >= colCount) {
        setTimeout(exCheckDone, 900);
      } else {
        exCurrentCol = next;
        exInputLocked = false;
        renderExView();
      }
    } else {
      App.Sound.play('wrong');
      exInput = '';
      exInputLocked = false;
      const fb = document.getElementById('ex-feedback');
      if (fb) fb.innerHTML = `<div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);
        border:2px solid #f59e0b;border-radius:12px;padding:10px;font-weight:800;
        color:#92400e;text-align:center">Hmm, prova igen! 💪</div>`;
      const ansEl = document.getElementById(`ex-ans-${COL_KEYS[exCurrentCol]}`);
      if (ansEl) ansEl.querySelector('span').textContent = '';
    }
  }

  function exDoBorrow() {
    if (exInputLocked) return;
    const c = exCurrentCol;
    if (c + 1 >= colCount) return;
    exInputLocked = true;
    const btn = document.getElementById('ex-borrow-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Lånar...'; }
    playBorrowSound();

    const isDouble = exEffA[c + 1] === 0 && c + 2 < colCount;

    if (isDouble) {
      // Steg 1: låna H → T (traditionellt: T får +10)
      setTimeout(() => {
        animateExBorrow(c + 2, c + 1, exEffA[c+2]-1, exEffA[c+1]+10, () => {
          exEffA[c+2]--;
          exEffA[c+1] += 10;
          playBorrowSound();
          // Steg 2: låna T → E (kompletteringsmetoden: sätt borrow-ten, +10 på E)
          setTimeout(() => {
            animateExBorrow(c+1, c, exEffA[c+1]-1, exEffA[c]+10, () => {
              exEffA[c+1]--;
              exEffA[c] += 10;
              exBorrowTens[c] = true;
              exInputLocked = false;
              renderExView();
            });
          }, 500);
        });
      }, 300);
    } else {
      animateExBorrow(c+1, c, exEffA[c+1]-1, exEffA[c]+10, () => {
        exEffA[c+1]--;
        exEffA[c] += 10;
        exBorrowTens[c] = true;
        exInputLocked = false;
        renderExView();
      });
    }
  }

  function animateExBorrow(srcCol, dstCol, srcNew, dstNew, cb) {
    const srcKey = COL_KEYS[srcCol];
    const dstKey = COL_KEYS[dstCol];
    const srcDw = document.getElementById(`ex-dw-a-${srcKey}`);
    if (srcDw) {
      srcDw.classList.add('crossed');
      const sp = document.createElement('span');
      sp.className = 'digit-new';
      sp.style.color = PVC[srcKey];
      sp.textContent = srcNew;
      srcDw.appendChild(sp);
    }
    const wrap = document.getElementById('up-table-wrap');
    const srcCell = document.getElementById(`ex-a-${srcKey}`);
    const dstCell = document.getElementById(`ex-a-${dstKey}`);
    if (wrap && srcCell && dstCell) {
      const wRect = wrap.getBoundingClientRect();
      const sRect = srcCell.getBoundingClientRect();
      const dRect = dstCell.getBoundingClientRect();
      const tok = document.createElement('div');
      tok.textContent = '+10';
      tok.style.cssText = `position:absolute;
        left:${sRect.left-wRect.left+sRect.width/2-18}px;
        top:${sRect.top-wRect.top+sRect.height/2-14}px;
        padding:3px 7px;border-radius:999px;
        background:#fee2e2;border:2px solid #ef4444;
        font-size:0.85rem;font-weight:900;color:#dc2626;
        pointer-events:none;z-index:20;
        transition:left 0.7s ease,top 0.7s ease;`;
      wrap.style.position = 'relative';
      wrap.appendChild(tok);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        tok.style.left = `${dRect.left-wRect.left+dRect.width/2-18}px`;
        tok.style.top  = `${dRect.top-wRect.top+dRect.height/2-14}px`;
      }));
      setTimeout(() => { tok.style.opacity='0'; tok.style.transition+=',opacity 0.3s'; }, 750);
      setTimeout(() => { tok.remove(); }, 1100);
    }
    // Uppdatera dst-cell display efter 0.8s
    setTimeout(() => {
      const dstDw = document.getElementById(`ex-dw-a-${dstKey}`);
      if (dstDw && dstNew !== null) {
        dstDw.classList.add('crossed');
        const sp2 = document.createElement('span');
        sp2.className = 'digit-new';
        sp2.style.color = PVC[dstKey];
        sp2.textContent = dstNew;
        dstDw.appendChild(sp2);
      }
      setTimeout(cb, 500);
    }, 800);
  }

  function exCheckDone() {
    const dr = digs(mode === 'addition' ? numA + numB : numA - numB);
    let correct = true;
    for (let c = 0; c < colCount; c++) {
      if (exAnswers[c] !== dr[c]) { correct = false; break; }
    }
    if (correct) { exScore++; App.Sound.play('correct'); smallBurst(); }
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
    startExercise, exPress, exDoBorrow,
    upToggleEraser, upClearCanvas,
    goBack,
  };
})();
