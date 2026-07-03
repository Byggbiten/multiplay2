/* ============================================================
   MULTIPLAY – Multiplikation & Division med uppställning (v29)
   Steg A: hubb + UPPSTÄLLD MULTIPLIKATION nivå 1–4 (alla lägen).
   Kort division kommer i steg B (hubbkortet är förberett men låst).
   Mönster: uppstallning.js — demo-motor v28 (bubbla FÖRE animation,
   Klart-bubbla med 1,8 s lästid), exFree-miniräknaren, kladd-lagen.
   OBS: åk 4-boken använder · (mittpunkt) som gångertecken — multdiv
   följer boken. Nivå 4 skriver delprodukt 2 FÖRSKJUTEN ett steg åt
   vänster (ingen platshållar-nolla), med + framför, per boken.
   ============================================================ */
'use strict';

const MultDivGame = (() => {

  /* ── State ─────────────────────────────────────────────── */
  let profile    = null;
  let difficulty = 1;   // 1🌱 utan minne · 2🌿 med minne · 3🌾 tresiffrigt · 4🌳 två tvåsiffriga
  let numA = 0, numB = 0;
  let plan = null;      // förberäknad uppgiftsplan (buildPlan) — FACIT för alla lägen

  /* Demo */
  let demoStep = 0, demoSteps = [], stepLocked = false;
  let mdCarries   = [0,0,0,0];
  let mdCarryUsed = [false,false,false,false];

  /* Övning */
  let exerciseIdx = 0, exScore = 0, helpMode = true;
  let exGen = 0; // session-token: ogiltigförklarar schemalagda uppgiftsbyten vid Avsluta
  let helpQueue = [], helpIdx = 0, helpSub = 0; // helpSub: 0=fråga · 1=carry-knapp väntar
  let helpInput = '', exInputLocked = false;

  /* Fritt läge (utan hjälp) — miniräknar-modell: ETT svarsfält */
  let exFreeInput = '', exFreeFirstAttempt = true;

  /* Kladd-canvas */
  let mdCanvas = null, mdCtx = null, mdDrawing = false, mdErasing = false;
  let mdLastX = 0, mdLastY = 0, mdResizeObs = null;

  /* ── Konstanter ─────────────────────────────────────────── */
  const COLV = ['#22c55e','#3b82f6','#ef4444','#a855f7']; // E grön, T blå, H röd, Tu lila
  const LBL  = ['E','T','H','T'];                          // tusental skrivs T i boken
  const cv = g => COLV[Math.min(g, 3)];
  const getLog = () => MP.createLog('multdiv_log_' + profile.id, 40);

  /* ── CSS (injiceras per vy, md-prefix så uppstallning ej krockar) ── */
  const BASE_CSS = `
    #screen-multdiv { max-width:100% !important; width:100% !important; padding:0 !important; }
    #screen-multdiv .app-header { max-width:100% !important; }
    #multdiv-root { display:flex; flex-direction:column; height:100vh; overflow:hidden; }
    #multdiv-root .app-header { padding:4px 12px 0; margin-bottom:0; flex-shrink:0; }
    #md-main { flex:1; display:flex; overflow:hidden; min-height:0; }
    #md-left { display:flex; flex-direction:column; gap:8px;
               overflow-y:auto; padding:clamp(6px,1.5vw,12px); min-height:0; padding-bottom:12px; }
    #md-right { display:flex; flex-direction:column; padding:clamp(6px,1.5vw,12px); gap:5px; min-height:0; }
    /* Kladd-lagen (Fas 3.2): kladden fyller ALL ledig yta i sin riktning. */
    @media (orientation:landscape) {
      #md-main { flex-direction:row; }
      #md-left  { flex:0 0 clamp(340px,45%,560px); }
      #md-right { flex:1 1 0; min-width:0; }
    }
    @media (orientation:portrait) {
      #md-main { flex-direction:column; }
      #md-left  { flex:0 1 auto; }
      #md-right { flex:1 1 0; min-height:150px; }
    }
    .md-btn { cursor:pointer; border:none; border-radius:var(--radius-md); font-weight:800;
      font-family:var(--font-body); transition:transform 0.25s var(--spring),box-shadow 0.25s; }
    .md-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 20px var(--glow); }
    .md-btn:disabled { opacity:0.45; cursor:not-allowed; transform:none; }
    .md-card { display:flex; align-items:center; gap:16px; text-align:left;
      padding:14px 20px; width:100%; position:relative;
      background:var(--glass); border:1px solid var(--glass-line);
      border-radius:var(--radius-lg); box-shadow:var(--shadow-panel); cursor:pointer;
      transition:transform .3s var(--spring),box-shadow .3s; }
    .md-card:hover { transform:translateY(-4px) scale(1.01); box-shadow:0 16px 40px var(--glow); }
    .md-card:active { transform:scale(.98); }
    .md-card.md-locked { cursor:default; }
    .md-card.md-locked:hover { transform:none; box-shadow:var(--shadow-panel); }
    .md-card.md-locked .md-aico, .md-card.md-locked b, .md-card.md-locked small { opacity:0.55; }
    .md-aico { width:58px; height:58px; border-radius:18px; display:grid; place-items:center;
      font-size:29px; flex-shrink:0; background:linear-gradient(135deg,var(--tint),#fff);
      border:1px solid var(--glass-line); box-shadow:0 4px 12px var(--glow); }
    .md-card b { font-family:var(--font-head); font-weight:700; font-size:19px;
      color:var(--deep); display:block; line-height:1.15; }
    .md-card small { color:var(--ink-soft); font-size:13px; font-weight:700; }
    .md-card .chev { color:var(--accent); flex-shrink:0; width:24px; height:24px; margin-left:auto; }
    .md-soon { margin-left:auto; flex-shrink:0; background:#fef3c7; color:var(--choco);
      border:1.5px solid #fbbf24; border-radius:999px; padding:5px 12px;
      font-size:12px; font-weight:900; white-space:nowrap; }
    .md-diff-row { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
    @media (max-width:480px) { .md-diff-row { grid-template-columns:repeat(2,1fr); } }
    .md-diff-btn { display:flex; flex-direction:column; align-items:center; justify-content:center;
      gap:1px; min-height:50px; padding:7px 5px; border-radius:var(--radius-lg);
      cursor:pointer; line-height:1.1; background:var(--glass-strong);
      border:1.5px solid color-mix(in srgb, var(--accent) 22%, transparent);
      color:var(--deep); transition:all 0.25s var(--spring); }
    .md-diff-btn:hover { transform:translateY(-2px); border-color:var(--accent); }
    .md-diff-btn .diff-num  { font-family:var(--font-head); font-weight:700; font-size:16px; line-height:1.1; }
    .md-diff-btn .diff-desc { font-size:11px; font-weight:800; opacity:0.9; line-height:1.1; white-space:nowrap; }
    .md-diff-btn.active { background:linear-gradient(135deg,var(--accent),var(--accent-light));
      color:#fff; border-color:transparent; box-shadow:0 6px 16px var(--glow); }

    /* Uppställningstabell */
    #md-table-wrap { position:relative; background:var(--glass-strong);
      border-radius:var(--radius-lg); padding:clamp(8px,1.5vw,16px);
      border:1px solid var(--glass-line); box-shadow:var(--shadow-panel); width:100%; }
    .md-table { border-collapse:separate; border-spacing:clamp(3px,0.9vw,7px); margin:0 auto; }
    .md-cell { width:clamp(38px,7vw,64px); height:clamp(38px,7vw,64px); border-radius:11px;
      position:relative; display:flex; align-items:center; justify-content:center;
      font-size:clamp(1.35rem,3.4vw,2.5rem); font-weight:900;
      border:2px solid rgba(0,0,0,0.08); background:rgba(255,255,255,0.92); overflow:visible; }
    .md-ghost { border-color:transparent !important; background:transparent !important; box-shadow:none !important; }
    .md-cell.dim { opacity:0.28; }
    .md-cell.md-glow { animation:md-glow 1.1s ease-in-out infinite; }
    .md-cell.md-prob { animation:md-prob 0.55s ease-in-out infinite; border-color:#ef4444; }
    .md-carry { width:clamp(38px,7vw,64px); height:clamp(16px,2.6vw,26px); border-radius:6px;
      display:flex; align-items:center; justify-content:center;
      font-size:clamp(0.66rem,1.4vw,0.92rem); font-weight:900;
      color:#d97706; background:rgba(251,191,36,0.13); }
    .md-ansc { width:clamp(38px,7vw,64px); height:clamp(38px,7vw,64px); border-radius:11px;
      display:flex; align-items:center; justify-content:center;
      font-size:clamp(1.35rem,3.4vw,2.5rem); font-weight:900;
      border:2.5px dashed color-mix(in srgb, var(--accent) 32%, transparent);
      background:rgba(255,255,255,0.7); }
    .md-ansc.active-col { border-style:solid; border-color:var(--accent);
      background:color-mix(in srgb, var(--accent) 8%, transparent); }
    .md-ansc.filled { border-style:solid; }
    .md-ansc.md-glow { animation:md-glow 1.1s ease-in-out infinite; }
    /* Nivå 4 (9 tabellrader): kompaktare celler så vyn ryms utan scroll */
    .md-l4 .md-cell, .md-l4 .md-ansc {
      width:clamp(33px,6.2vw,56px); height:clamp(33px,6.2vw,56px);
      font-size:clamp(1.15rem,3vw,2.1rem); }
    .md-l4 .md-carry { width:clamp(33px,6.2vw,56px); height:clamp(14px,2.4vw,22px); }

    /* Tankebubbla */
    .md-thought { background:#fff; border-radius:var(--radius-md);
      padding:clamp(8px,1.5vw,14px) clamp(10px,2vw,18px);
      box-shadow:var(--shadow-panel); font-weight:800; color:var(--ink);
      font-size:clamp(0.92rem,2vw,1.15rem);
      border:2px solid color-mix(in srgb, var(--accent) 18%, transparent);
      animation:md-bubble-in 0.3s var(--spring); line-height:1.5; }

    /* Numpad + inmatningsfält */
    .md-panel { background:var(--glass-strong); border-radius:var(--radius-md); padding:12px;
      border:1px solid var(--glass-line); box-shadow:var(--shadow-panel); }
    .md-numpad { display:grid; grid-template-columns:repeat(5,clamp(38px,6.6vw,58px)); gap:5px; justify-content:center; }
    .md-nk { width:clamp(38px,6.6vw,58px); height:clamp(38px,6.6vw,58px); border-radius:50%;
      font-size:clamp(0.95rem,2vw,1.1rem); font-family:var(--font-head); font-weight:900;
      cursor:pointer; background:var(--glass-strong);
      border:1.5px solid color-mix(in srgb, var(--accent) 32%, transparent);
      color:var(--deep); transition:transform 0.2s var(--spring); }
    .md-nk:hover { transform:scale(1.12); border-color:var(--accent); }
    .md-field { display:flex; align-items:center; justify-content:flex-end; gap:2px;
      width:100%; min-height:clamp(38px,7vw,64px); border-radius:11px;
      padding:0 clamp(10px,2vw,16px);
      font-family:var(--font-head); font-size:clamp(1.35rem,3.4vw,2.5rem); font-weight:900;
      color:var(--deep); background:rgba(255,255,255,0.7);
      border:2.5px dashed color-mix(in srgb, var(--accent) 32%, transparent);
      transition:border-color 0.2s, background 0.2s; }
    .md-field.has-digits { border-style:solid;
      border-color:color-mix(in srgb, var(--accent) 55%, transparent); }
    .md-field.wrong { border:2.5px solid #ef4444; background:rgba(239,68,68,0.1); color:#dc2626; }
    .md-field.correct { border:2.5px solid #22c55e; background:rgba(34,197,94,0.12); color:#16a34a; }
    .md-field.shake { animation:md-shake 0.3s ease; }
    .md-field-sm { min-height:clamp(34px,6vw,50px); font-size:clamp(1.1rem,2.6vw,1.7rem); margin-bottom:8px; }
    .md-caret { display:inline-block; width:3px; height:1.05em; border-radius:2px;
      background:var(--accent); animation:md-caret 1s steps(1) infinite; }
    .md-field.wrong .md-caret { background:#dc2626; }

    /* Kladd */
    .md-scratch { background:var(--glass); border-radius:var(--radius-md);
      border:1px solid var(--glass-line); box-shadow:var(--shadow-panel);
      display:flex; flex-direction:column; gap:5px; flex:1; min-height:0; padding:8px; }
    .md-canvas { flex:1; min-height:60px; width:100%; display:block; touch-action:none;
      cursor:crosshair; border-radius:10px;
      border:2px dashed color-mix(in srgb, var(--accent) 30%, transparent);
      background:rgba(255,255,255,0.8); }

    /* Landskap med begränsad höjd (t.ex. iPad 1180×820): nivå 4:s höga
       tabell + numpad-panelen måste rymmas i vänsterspalten utan scroll */
    @media (orientation:landscape) and (max-height:880px) {
      .md-l4 .md-cell, .md-l4 .md-ansc { width:clamp(33px,5vw,44px); height:clamp(33px,5vw,44px);
        font-size:clamp(1.15rem,2.6vw,1.7rem); }
      .md-l4 .md-carry { width:clamp(33px,5vw,44px); height:clamp(14px,2vw,18px); }
      .md-nk { width:clamp(36px,5vw,46px); height:clamp(36px,5vw,46px); }
      .md-numpad { grid-template-columns:repeat(5,clamp(36px,5vw,46px)); }
      .md-field-sm { min-height:clamp(32px,5vw,42px); font-size:clamp(1.05rem,2.2vw,1.5rem); }
    }

    /* Stress-höjden 390×664 (porträtt, kort skärm): krymp tabell + numpad + kladd-minimum */
    @media (orientation:portrait) and (max-height:700px) {
      .md-cell, .md-ansc { width:clamp(32px,6vw,44px); height:clamp(32px,6vw,44px); font-size:1.15rem; }
      .md-l4 .md-cell, .md-l4 .md-ansc { width:27px; height:27px; font-size:0.95rem; border-radius:8px; }
      .md-carry, .md-l4 .md-carry { height:12px; width:27px; font-size:0.58rem; }
      .md-table { border-spacing:2px; }
      #md-table-wrap { padding:5px; }
      .md-nk { width:34px; height:34px; font-size:0.82rem; }
      .md-numpad { grid-template-columns:repeat(5,34px); }
      .md-panel { padding:6px; }
      .md-thought { font-size:0.85rem; padding:6px 10px; line-height:1.4; }
      .md-field { min-height:36px; font-size:1.2rem; }
      .md-field-sm { min-height:30px; font-size:1rem; margin-bottom:5px; }
      #md-right { min-height:96px; }
      #md-left { gap:6px; }
    }

    @keyframes md-drop {
      0%   { transform:translateY(-20px); opacity:0; }
      65%  { transform:translateY(4px); opacity:1; }
      100% { transform:translateY(0); opacity:1; }
    }
    @keyframes md-land {
      0%   { transform:scale(0.3); opacity:0; }
      65%  { transform:scale(1.25); opacity:1; }
      100% { transform:scale(1); opacity:1; }
    }
    @keyframes md-glow {
      0%,100% { box-shadow:0 0 8px var(--gc, rgba(13,148,136,0.3)); }
      50%      { box-shadow:0 0 22px var(--gc, rgba(13,148,136,0.7)); }
    }
    @keyframes md-prob {
      0%,100% { border-color:#ef4444; box-shadow:0 0 6px rgba(239,68,68,0.4); }
      50%      { border-color:#ef4444; box-shadow:0 0 18px rgba(239,68,68,0.8); }
    }
    @keyframes md-bubble-in {
      from { transform:scale(0.75) translateY(6px); opacity:0; }
      to   { transform:scale(1) translateY(0); opacity:1; }
    }
    @keyframes md-caret { 0%,60% { opacity:1; } 61%,100% { opacity:0; } }
    @keyframes md-shake {
      0%,100% { transform:translateX(0); }
      25% { transform:translateX(-6px); } 50% { transform:translateX(5px); } 75% { transform:translateX(-3px); }
    }
  `;

  /* ══════════════════════════════════════════════════════════
     REN MATTE-KÄRNA (exponeras via _internals för vitest)
  ══════════════════════════════════════════════════════════ */
  function rnd(n) { return Math.floor(Math.random() * n); }

  /* Siffror med ental först: 327 → [7,2,3] */
  function digitsOf(n) {
    const d = []; let x = Math.max(0, Math.floor(n));
    do { d.push(x % 10); x = Math.floor(x / 10); } while (x > 0);
    return d;
  }

  /* Ett pass: A · m (m ensiffrig), kolumn för kolumn höger→vänster.
     Sista kolumnen skriver HELA värdet (extra = tiotalssiffran som
     växer ut åt vänster). Standardalgoritmen ⇒ värdet blir alltid A·m. */
  function singlePass(a, m) {
    const ad = digitsOf(a), cols = [];
    let carry = 0;
    for (let c = 0; c < ad.length; c++) {
      const last = c === ad.length - 1;
      const prod = ad[c] * m + carry;
      let write, carryOut = 0, extra = null;
      if (last)          { write = prod % 10; extra = Math.floor(prod / 10) || null; }
      else if (prod > 9) { write = prod % 10; carryOut = Math.floor(prod / 10); }
      else               { write = prod; }
      cols.push({ col: c, aDig: ad[c], m, carryIn: carry, prod, write, carryOut, last, extra });
      carry = carryOut;
    }
    return { cols, value: a * m, digits: digitsOf(a * m),
             hasCarry: cols.some(x => x.carryOut > 0) };
  }

  /* Additionsfasen (nivå 4): p1 + p2 FÖRSKJUTEN ett steg vänster
     (= p1 + p2·10). Tom position räknas som 0 men VISAS tom (x/y=null).
     Itererar över svarets alla siffror ⇒ sista kolumnens summa ≤ 9. */
  function addPass(p1, p2) {
    const d1 = digitsOf(p1), d2 = digitsOf(p2);
    const total = p1 + p2 * 10, td = digitsOf(total), cols = [];
    let carry = 0;
    for (let c = 0; c < td.length; c++) {
      const last = c === td.length - 1;
      const x = c < d1.length ? d1[c] : null;                  // p1-siffra
      const y = (c >= 1 && c - 1 < d2.length) ? d2[c - 1] : null; // p2 förskjuten
      const sum = (x || 0) + (y || 0) + carry;
      let write, carryOut = 0;
      if (!last && sum > 9) { write = sum % 10; carryOut = Math.floor(sum / 10); }
      else                  { write = sum; }
      cols.push({ col: c, x, y, carryIn: carry, sum, write, carryOut, last, extra: null });
      carry = carryOut;
    }
    return { cols, value: total, digits: td };
  }

  /* Uppgiftsplan — FACIT för demo, hjälp och fritt läge */
  function buildPlan(a, b, level) {
    if (level < 4) {
      const pass = singlePass(a, b);
      return { level, a, b, kind: 'simple', pass,
               answer: a * b, width: digitsOf(a * b).length };
    }
    const ones = b % 10, tens = Math.floor(b / 10);
    const p1 = singlePass(a, ones), p2 = singlePass(a, tens);
    const add = addPass(p1.value, p2.value);
    return { level, a, b, kind: 'twostep', ones, tens, p1, p2, add,
             answer: a * b, width: digitsOf(a * b).length };
  }

  /* Generator per nivå (spec-tabellen). Nivåvillkoren verifieras på
     den FRAMRÄKNADE kolumnkedjan (singlePass), annars slumpas om. */
  function genProblem(level) {
    let a = 0, b = 0;
    if (level === 1) {
      // 2-siffrigt · (2–4), INGEN minnessiffra: varje siffra·B ≤ 9 (⇒ inga carries alls)
      b = 2 + rnd(3);
      const maxD = Math.floor(9 / b);
      a = (1 + rnd(maxD)) * 10 + rnd(maxD + 1);
    } else if (level === 2) {
      // 2-siffrigt · (2–9), GARANTERAT minst en minnessiffra
      do { a = 10 + rnd(90); b = 2 + rnd(8); }
      while (!singlePass(a, b).hasCarry);
    } else if (level === 3) {
      // 3-siffrigt · ensiffrigt, minst en minnessiffra, svar ≤ 9999
      do { a = 100 + rnd(900); b = 2 + rnd(8); }
      while (a * b > 9999 || !singlePass(a, b).hasCarry);
    } else {
      // 2-siffrigt · 2-siffrigt med delprodukter (bokens metod).
      // Ingen nolla som ental (delprodukt av 0 vore tom pedagogik).
      do { a = 12 + rnd(87); b = 12 + rnd(87); }
      while (a % 10 === 0 || b % 10 === 0);
    }
    return { a, b };
  }

  function generateProblem() {
    const p = genProblem(difficulty);
    numA = p.a; numB = p.b;
    plan = buildPlan(numA, numB, difficulty);
  }

  /* ══════════════════════════════════════════════════════════
     STEG-BYGGARE (demo) — bubbla FÖRE animation (v28-mönstret)
  ══════════════════════════════════════════════════════════ */
  function passStepsInto(steps, pass, rowKey, shift) {
    for (const c of pass.cols) {
      const g = c.col + shift; // grid-kolumn där siffran SKRIVS
      steps.push({ t: 'highlight', phase: 'mult', aCol: c.col, mCol: shift, g, rowKey });
      if (c.last) {
        if (c.prod > 9) {
          steps.push({ t: 'calc',       phase: 'mult', ...c, g, rowKey });
          steps.push({ t: 'write_full', phase: 'mult', ...c, g, rowKey });
        } else {
          steps.push({ t: 'write_simple', phase: 'mult', ...c, g, rowKey });
        }
      } else if (c.prod > 9) {
        steps.push({ t: 'calc',        phase: 'mult', ...c, g, rowKey });
        steps.push({ t: 'over9',       phase: 'mult', ...c, g, rowKey });
        steps.push({ t: 'write_carry', phase: 'mult', ...c, g, rowKey });
      } else {
        steps.push({ t: 'write_simple', phase: 'mult', ...c, g, rowKey });
      }
    }
  }

  function addStepsInto(steps, add) {
    for (const c of add.cols) {
      const single = (c.x === null || c.y === null) && c.carryIn === 0;
      steps.push({ t: 'highlight', phase: 'add', g: c.col, rowKey: 'ans' });
      if (!c.last && c.sum > 9) {
        steps.push({ t: 'calc',        phase: 'add', ...c, g: c.col, rowKey: 'ans' });
        steps.push({ t: 'over9',       phase: 'add', ...c, g: c.col, rowKey: 'ans' });
        steps.push({ t: 'write_carry', phase: 'add', ...c, g: c.col, rowKey: 'ans' });
      } else {
        steps.push({ t: 'write_simple', phase: 'add', ...c, g: c.col, rowKey: 'ans', single });
      }
    }
  }

  function buildDemoSteps() {
    const steps = [];
    if (plan.kind === 'simple') {
      passStepsInto(steps, plan.pass, 'ans', 0);
    } else {
      steps.push({ t: 'phase', which: 1 });
      passStepsInto(steps, plan.p1, 'p1', 0);
      steps.push({ t: 'phase', which: 2 });
      passStepsInto(steps, plan.p2, 'p2', 1);
      steps.push({ t: 'phase', which: 3 });
      addStepsInto(steps, plan.add);
    }
    steps.push({ t: 'done' });
    return steps;
  }

  /* ── Bubbeltexter (spec-språket, · per boken) ───────────── */
  function calcText(step) {
    const C = cv(step.g);
    if (step.phase === 'add') {
      const x = step.x === null ? 0 : step.x, y = step.y === null ? 0 : step.y;
      const mi = step.carryIn ? `, plus <span style="color:#d97706">${step.carryIn}</span> i minne` : '';
      if (step.x === null && step.y === null) {
        // Kolumn utan siffror — bara minnessiffran
        return `Bara minnessiffran kvar — <span style="color:#d97706">${step.carryIn}</span>:an flyttas ner! ✅`;
      }
      if (step.x === null || step.y === null) {
        const d = step.x === null ? y : x;
        return step.carryIn
          ? `<span style="color:${C}">${d}</span> plus <span style="color:#d97706">${step.carryIn}</span> i minne = <strong>${step.sum}</strong>`
          : `Bara <span style="color:${C}">${d}</span>:an här — den flyttas ner! ✅`;
      }
      return `<span style="color:${C}">${x}</span> + <span style="color:${C}">${y}</span>${mi} = <strong>${step.sum}</strong>`;
    }
    const base = `<span style="color:${C}">${step.aDig}</span> · <span style="color:${C}">${step.m}</span> = <strong>${step.aDig * step.m}</strong>`;
    return step.carryIn
      ? `${base}, plus <span style="color:#d97706">${step.carryIn}</span> i minne = <strong>${step.prod}</strong>`
      : base;
  }

  function stepBubbleHTML(step) {
    if (!step) return '';
    const val = step.phase === 'add' ? step.sum : step.prod;
    switch (step.t) {
      case 'highlight': return '';
      case 'phase':
        if (step.which === 1)
          return `Först räknar vi <strong>${numA} · ${plan.ones}</strong> — entalssiffran i ${numB}! 👇`;
        if (step.which === 2)
          return `<strong>${plan.tens}</strong>:an är tiotal — därför börjar vi skriva ett steg åt vänster! 👈`;
        return `Till sist adderar vi delprodukterna — som vanlig uppställd addition! ➕`;
      case 'calc':  return calcText(step);
      case 'over9': return `<strong>${val}</strong>... det är mer än 9! 🤔`;
      case 'write_carry':
        return `Vi skriver <strong style="color:${cv(step.g)}">${step.write}</strong>:an — och skickar upp <strong style="color:#d97706">${step.carryOut}</strong>:an som minnessiffra! ⬆️`;
      case 'write_simple': return calcText(step);
      case 'write_full':
        return `<strong style="color:${cv(step.g)}">${val}</strong> — sista kolumnen, så hela ${val} får plats! ✅`;
      case 'done':
        return `Klart! 🎉 ${numA} · ${numB} = <strong>${plan.answer}</strong>`;
    }
    return '';
  }

  /* ══════════════════════════════════════════════════════════
     DEMO-LÄGE
  ══════════════════════════════════════════════════════════ */
  function startDemo() {
    App.Sound.play('click');
    generateProblem();
    demoStep = 0; stepLocked = false;
    mdCarries = [0,0,0,0]; mdCarryUsed = [false,false,false,false];
    demoSteps = buildDemoSteps();
    renderDemoView();
  }

  function renderDemoView() {
    const root = document.getElementById('multdiv-root');
    root.innerHTML = `
      <style id="md-base">${BASE_CSS}</style>
      <div class="app-header">
        <button class="btn-back" onclick="MultDivGame.showModeSelect()">Avsluta</button>
        <span class="header-title">Multiplikation – Demo</span>
        <span style="width:52px"></span>
      </div>
      <div id="md-main">
        <div id="md-left">
          <div id="md-table-wrap" class="${plan.kind === 'twostep' ? 'md-l4' : ''}">${buildTableHTML(false)}</div>
          <div id="md-bubble"></div>
          <div id="md-next-area">${nextBtnHTML()}</div>
        </div>
        <div id="md-right">${scratchHTML()}</div>
      </div>`;
    setupCanvas('md-canvas');
    showStepBubble();
  }

  /* v28-mönstret: texten för steget som NU animeras visas FÖRE executeStep */
  function demoNextStep() {
    if (stepLocked) return;
    const step = demoSteps[demoStep];
    if (!step || step.t === 'done') return;
    lockStep();
    showStepBubble();
    executeStep(step, () => {
      demoStep++;
      unlockStep();
      if (demoSteps[demoStep] && demoSteps[demoStep].t === 'done') {
        const dennaOmgang = demoSteps; // 1,8 s lästid för sista stegtexten
        setTimeout(() => { if (demoSteps === dennaOmgang) showStepBubble(); }, 1800);
      }
      refreshNextBtn();
    });
  }

  function showStepBubble() {
    const area = document.getElementById('md-bubble');
    if (!area) return;
    const html = stepBubbleHTML(demoSteps[demoStep]);
    area.innerHTML = html ? `<div class="md-thought">${html}</div>` : '';
  }

  function nextBtnHTML() {
    const step = demoSteps[demoStep];
    if (!step) return '';
    if (step.t === 'done') {
      return `<div style="display:flex;gap:8px">
        <button class="btn btn-primary" style="flex:1"
          onclick="MultDivGame.startDemo()"><svg class="icn"><use href="#i-refresh"/></svg>Ny uppgift</button>
        <button class="btn btn-secondary" style="flex:1"
          onclick="MultDivGame.showModeSelect()">Tillbaka</button>
      </div>`;
    }
    return `<button id="md-next-btn" class="btn btn-primary btn-block" onclick="MultDivGame.demoNextStep()"
      ${stepLocked ? 'disabled' : ''}>Nästa steg <svg class="icn"><use href="#i-play"/></svg></button>`;
  }

  function refreshNextBtn() {
    const area = document.getElementById('md-next-area');
    if (area) area.innerHTML = nextBtnHTML();
  }
  function lockStep()   { stepLocked = true;  const b = document.getElementById('md-next-btn'); if (b) b.disabled = true; }
  function unlockStep() { stepLocked = false; const b = document.getElementById('md-next-btn'); if (b) b.disabled = false; }

  /* ── Steg-exekvering (animationer) ──────────────────────── */
  function executeStep(step, cb) {
    if (step.t === 'highlight') {
      doHighlight(step);
      setTimeout(cb, 50);

    } else if (step.t === 'calc') {
      setTimeout(cb, 50);

    } else if (step.t === 'phase') {
      if (step.which >= 2) clearCarryRow();
      // Pulsera B-siffran som fasen gäller (ental=grid 0, tiotal=grid 1)
      const bCell = step.which <= 2 ? document.getElementById(`md-b-${step.which - 1}`) : null;
      if (bCell) {
        bCell.classList.add('md-prob');
        setTimeout(() => bCell.classList.remove('md-prob'), 1100);
      }
      setTimeout(cb, step.which <= 2 ? 1200 : 600);

    } else if (step.t === 'over9') {
      probCells(step).forEach(el => el.classList.add('md-prob'));
      setTimeout(() => {
        probCells(step).forEach(el => el.classList.remove('md-prob'));
        cb();
      }, 1100);

    } else if (step.t === 'write_simple') {
      consumeCarry(step);
      setTimeout(() => {
        writeDigit(step.rowKey, step.g, step.write);
        App.Sound.play('correct');
        setTimeout(cb, 700);
      }, 300);

    } else if (step.t === 'write_carry') {
      consumeCarry(step);
      writeDigit(step.rowKey, step.g, step.write);
      setTimeout(() => {
        animateCarryToken(step.rowKey, step.g, step.g + 1, step.carryOut, () => {
          mdCarries[step.g + 1] = step.carryOut;
          updateCarryRow();
          setTimeout(cb, 300);
        });
      }, 450);

    } else if (step.t === 'write_full') {
      consumeCarry(step);
      writeDigit(step.rowKey, step.g, step.write);
      setTimeout(() => {
        if (step.extra !== null) writeDigit(step.rowKey, step.g + 1, step.extra);
        App.Sound.play('correct');
        setTimeout(cb, 800);
      }, 300);

    } else {
      cb();
    }
  }

  function probCells(step) {
    const out = [];
    if (step.phase === 'mult') {
      const a = document.getElementById(`md-a-${step.aCol !== undefined ? step.aCol : step.col}`);
      const b = document.getElementById(`md-b-${step.rowKey === 'p2' ? 1 : 0}`);
      if (a) out.push(a); if (b) out.push(b);
    } else {
      const p1 = document.getElementById(`md-p1-${step.g}`);
      const p2 = document.getElementById(`md-p2-${step.g}`);
      if (p1 && !p1.classList.contains('md-ghost')) out.push(p1);
      if (p2 && !p2.classList.contains('md-ghost')) out.push(p2);
    }
    return out;
  }

  function doHighlight(opts) {
    // Rensa allt
    document.querySelectorAll('#md-table-wrap .md-cell, #md-table-wrap .md-ansc')
      .forEach(el => { el.classList.remove('md-glow', 'dim'); el.style.removeProperty('--gc'); });
    const glowColor = hex => {
      const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
      return `rgba(${r},${g},${b},0.65)`;
    };
    const W = plan.width;
    if (opts.phase === 'mult') {
      const aLen = digitsOf(numA).length;
      for (let i = 0; i < aLen; i++) {
        const el = document.getElementById(`md-a-${i}`);
        if (!el) continue;
        if (i === opts.aCol) { el.classList.add('md-glow'); el.style.setProperty('--gc', glowColor(cv(i))); }
        else el.classList.add('dim');
      }
      const bLen = digitsOf(numB).length;
      for (let i = 0; i < bLen; i++) {
        const el = document.getElementById(`md-b-${i}`);
        if (!el) continue;
        if (i === opts.mCol) { el.classList.add('md-glow'); el.style.setProperty('--gc', glowColor(cv(i))); }
        else el.classList.add('dim');
      }
    } else {
      // Additionsfasen: dimma A/B, lys upp delproduktcellerna i kolumnen
      document.querySelectorAll('#md-table-wrap .md-cell').forEach(el => {
        if (!el.classList.contains('md-ghost')) el.classList.add('dim');
      });
      ['p1','p2'].forEach(rk => {
        const el = document.getElementById(`md-${rk}-${opts.g}`);
        if (el && !el.classList.contains('md-ghost')) {
          el.classList.remove('dim');
          el.classList.add('md-glow');
          el.style.setProperty('--gc', glowColor(cv(opts.g)));
        }
      });
    }
  }

  function writeDigit(rowKey, g, d) {
    const cell = document.getElementById(`md-${rowKey}-${g}`);
    if (!cell) return;
    cell.innerHTML = `<span style="color:${cv(g)};animation:md-drop 0.55s ease-out both;display:inline-block">${d}</span>`;
    cell.classList.add('filled');
    cell.classList.remove('active-col');
    cell.style.borderColor = cv(g);
    cell.style.borderStyle = 'solid';
  }

  function consumeCarry(step) {
    if (step.carryIn > 0) { mdCarryUsed[step.g] = true; updateCarryRow(); }
  }

  function updateCarryRow() {
    for (let g = 0; g < plan.width; g++) {
      const el = document.getElementById(`md-carry-${g}`);
      if (!el) continue;
      const val = mdCarries[g], used = mdCarryUsed[g];
      if (val) {
        el.innerHTML = used
          ? `<span style="color:#d97706;opacity:0.4;text-decoration:line-through">${val}</span>`
          : `<span style="animation:md-land 0.45s ease-out both;display:inline-block">${val}</span>`;
      } else {
        el.textContent = '';
      }
    }
  }

  function clearCarryRow() {
    mdCarries = [0,0,0,0]; mdCarryUsed = [false,false,false,false];
    updateCarryRow();
  }

  function animateCarryToken(rowKey, fromG, toG, val, cb) {
    const wrap = document.getElementById('md-table-wrap');
    const srcCell = document.getElementById(`md-${rowKey}-${fromG}`) || document.getElementById(`md-a-${fromG}`);
    const dstCarry = document.getElementById(`md-carry-${toG}`);
    if (!wrap || !srcCell || !dstCarry) { setTimeout(cb, 300); return; }
    const wRect = wrap.getBoundingClientRect();
    const sRect = srcCell.getBoundingClientRect();
    const dRect = dstCarry.getBoundingClientRect();
    const token = document.createElement('div');
    token.textContent = String(val);
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

  /* ══════════════════════════════════════════════════════════
     TABELL-HTML
     Grid-kolumn g räknas från höger (0=ental). W = svarets bredd.
     Nivå 4: p1-rad + p2-rad (förskjuten, + framför, position 0 TOM)
     + slutstreck + svarsrad. Fritt läge: inga delrader.
  ══════════════════════════════════════════════════════════ */
  function buildTableHTML(freeMode) {
    const W = plan.width;
    const idx = [];
    for (let i = W - 1; i >= 0; i--) idx.push(i);
    const aD = digitsOf(numA), bD = digitsOf(numB);
    const l4 = plan.kind === 'twostep' && !freeMode;

    const solidCell = (row, i, digit) => digit === null
      ? `<td><div class="md-cell md-ghost" id="md-${row}-${i}"></div></td>`
      : `<td><div class="md-cell" id="md-${row}-${i}" style="border-color:${cv(i)}">
           <span style="color:${cv(i)}">${digit}</span></div></td>`;
    const fillCell = (row, i, used) => used
      ? `<td><div class="md-ansc" id="md-${row}-${i}"></div></td>`
      : `<td><div class="md-ansc md-ghost" id="md-${row}-${i}"></div></td>`;
    const lineRow = `<tr><td colspan="${W + 2}" style="padding:2px 0">
      <div style="height:3px;background:linear-gradient(90deg,transparent,#374151,transparent);border-radius:2px"></div></td></tr>`;

    const labelRow = `<tr><td></td>${idx.map(i =>
      `<th style="text-align:center;font-size:clamp(0.8rem,1.6vw,1.15rem);font-weight:900;color:${cv(i)};padding-bottom:2px">${LBL[i]}</th>`).join('')}<td></td></tr>`;

    const carryRow = `<tr>
      <td style="font-size:11px;font-weight:800;color:#d97706;text-align:right;padding-right:6px;white-space:nowrap">minne:</td>
      ${idx.map(i => `<td style="text-align:center"><div class="md-carry" id="md-carry-${i}"></div></td>`).join('')}<td></td></tr>`;

    const rowA = `<tr><td></td>${idx.map(i =>
      solidCell('a', i, i < aD.length ? aD[i] : null)).join('')}<td></td></tr>`;

    const rowB = `<tr>
      <td style="font-size:1.8rem;font-weight:900;color:#555;text-align:right;padding-right:6px">·</td>
      ${idx.map(i => solidCell('b', i, i < bD.length ? bD[i] : null)).join('')}<td></td></tr>`;

    let midRows = '';
    if (l4) {
      const p1len = plan.p1.digits.length, p2len = plan.p2.digits.length;
      midRows = `
        <tr><td></td>${idx.map(i => fillCell('p1', i, i < p1len)).join('')}<td></td></tr>
        <tr>
          <td style="font-size:1.5rem;font-weight:900;color:#555;text-align:right;padding-right:6px">+</td>
          ${idx.map(i => fillCell('p2', i, i >= 1 && i <= p2len)).join('')}<td></td></tr>
        ${lineRow}`;
    }

    const ansRow = freeMode
      ? `<tr><td colspan="${W + 2}">
           <div class="md-field num" id="md-free-field"><span class="md-caret"></span></div></td></tr>`
      : `<tr><td></td>${idx.map(i => fillCell('ans', i, true)).join('')}<td></td></tr>`;

    return `
      <table class="md-table">
        <tbody>
          ${labelRow}
          ${carryRow}
          ${rowA}
          ${rowB}
          ${lineRow}
          ${midRows}
          ${ansRow}
        </tbody>
      </table>`;
  }

  /* ══════════════════════════════════════════════════════════
     HUBB + VAL-SKÄRMAR (exakt uppstallnings-flödet)
  ══════════════════════════════════════════════════════════ */
  function init(p) {
    profile = p;
    showHub();
  }

  function showHub() {
    const root = document.getElementById('multdiv-root');
    const levels = [
      { n: 1, emoji: '🌱', desc: 'Utan minnessiffra' },
      { n: 2, emoji: '🌿', desc: 'Med minnessiffra' },
      { n: 3, emoji: '🌾', desc: 'Tresiffrigt tal' },
      { n: 4, emoji: '🌳', desc: 'Två tvåsiffriga' },
    ];
    const diffBtnsHTML = levels.map(l => `
      <button class="md-diff-btn ${difficulty === l.n ? 'active' : ''}"
        onclick="MultDivGame.setDifficulty(${l.n},this)">
        <span class="diff-num">${l.n} ${l.emoji}</span>
        <span class="diff-desc">${l.desc}</span>
      </button>`).join('');

    root.innerHTML = `
      <style id="md-base">${BASE_CSS}</style>
      <div class="floaties"><span style="top:7%;right:8%">✨</span><span style="bottom:12%;left:6%;animation-delay:2s">🐬</span></div>
      <div class="app-header">
        <button class="btn-back" onclick="MultDivGame.exitToApp()">Tillbaka</button>
        <span class="header-title">Multiplikation &amp; Division</span>
        <span style="width:52px"></span>
      </div>
      <div class="wrap" style="padding:0 12px 12px;overflow-y:auto">
        <div class="me-chip" style="align-self:center;margin-top:auto">
          <span class="avatar avatar-sm">${profile.avatar}</span>
          <b>${MP.escapeHtml(profile.name)}</b>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;margin:14px 0 auto">
          <div class="md-card" onclick="MultDivGame.chooseMult()">
            <span class="md-aico">✖️</span>
            <span><b>Uppställd multiplikation</b><small>Räkna stora gångertal kolumn för kolumn</small></span>
            <svg class="icn chev" viewBox="0 0 24 24"><use href="#i-chevron"/></svg>
          </div>
          <div class="md-card md-locked" aria-disabled="true">
            <span class="md-aico">➗</span>
            <span><b>Kort division</b><small>Divisorn till vänster – kvoten skrivs ovanpå</small></span>
            <span class="md-soon">Kommer snart! 🔜</span>
          </div>
          <div class="card" style="padding:14px">
            <div class="panel-title" style="margin-bottom:10px">
              <svg class="icn" style="color:var(--accent)" viewBox="0 0 24 24"><path d="M6 16l4-8 3 6 2-3 3 5"/></svg>
              Svårighetsgrad
            </div>
            <div class="md-diff-row">${diffBtnsHTML}</div>
          </div>
        </div>
      </div>`;
    Router.show('screen-multdiv');
  }

  function setDifficulty(n, btn) {
    difficulty = n;
    document.querySelectorAll('.md-diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    App.Sound.play('click');
  }

  function chooseMult() {
    App.Sound.play('click');
    showModeSelect();
  }

  function showModeSelect() {
    exGen++; // avbryter ev. schemalagd nästa-uppgift (Avsluta-racet)
    const root = document.getElementById('multdiv-root');
    root.innerHTML = `
      <style id="md-base">${BASE_CSS}</style>
      <div class="floaties"><span style="top:7%;right:8%">✨</span><span style="bottom:12%;left:6%;animation-delay:2s">🐬</span></div>
      <div class="app-header">
        <button class="btn-back" onclick="MultDivGame.showHub()">Tillbaka</button>
        <span class="header-title">Multiplikation ✖️</span>
        <span style="width:52px"></span>
      </div>
      <div class="wrap vcenter" style="padding:0 12px 12px;gap:14px">
        <div class="section-title" style="text-align:center">Hur vill du träna?</div>
        <div class="md-card" onclick="MultDivGame.startDemo()">
          <span class="md-aico">👀</span>
          <span><b>Titta och lär</b><small>Se varje steg animerat – tryck "Nästa steg"</small></span>
          <svg class="icn chev" viewBox="0 0 24 24"><use href="#i-chevron"/></svg>
        </div>
        <div class="md-card" onclick="MultDivGame.startExercise()">
          <span class="md-aico">✏️</span>
          <span><b>Räkna själv</b><small>Räkna uppgifterna steg för steg</small></span>
          <svg class="icn chev" viewBox="0 0 24 24"><use href="#i-chevron"/></svg>
        </div>
      </div>`;
    Router.show('screen-multdiv');
  }

  function startExercise() {
    App.Sound.play('click');
    exerciseIdx = 0;
    exScore = 0;
    showHelpSelect();
  }

  function showHelpSelect() {
    const root = document.getElementById('multdiv-root');
    root.innerHTML = `
      <style id="md-base">${BASE_CSS}</style>
      <div class="floaties"><span style="top:7%;right:8%">✨</span><span style="bottom:12%;left:6%;animation-delay:2s">🐬</span></div>
      <div class="app-header">
        <button class="btn-back" onclick="MultDivGame.showModeSelect()">Tillbaka</button>
        <span class="header-title">Multiplikation – Övning</span>
        <span style="width:52px"></span>
      </div>
      <div class="wrap vcenter" style="padding:0 12px 12px;gap:14px">
        <div class="section-title" style="text-align:center">Hur vill du räkna?</div>
        <div class="md-card" onclick="MultDivGame.setHelpMode(true)">
          <span class="md-aico">🤝</span>
          <span><b>Med hjälp</b><small>Guidefrågor kolumn för kolumn</small></span>
          <svg class="icn chev" viewBox="0 0 24 24"><use href="#i-chevron"/></svg>
        </div>
        <div class="md-card" onclick="MultDivGame.setHelpMode(false)">
          <span class="md-aico">💪</span>
          <span><b>Utan hjälp</b><small>Räkna på egen hand – skriv hela svaret</small></span>
          <svg class="icn chev" viewBox="0 0 24 24"><use href="#i-chevron"/></svg>
        </div>
      </div>`;
  }

  function setHelpMode(on) {
    helpMode = on;
    App.Sound.play('click');
    newExProblem();
  }

  /* ══════════════════════════════════════════════════════════
     ÖVNINGSLÄGE — gemensam layout
  ══════════════════════════════════════════════════════════ */
  function newExProblem() {
    generateProblem();
    exInputLocked = false;
    mdCarries = [0,0,0,0]; mdCarryUsed = [false,false,false,false];
    helpQueue = helpMode ? buildHelpQueue() : [];
    helpIdx = 0; helpSub = 0; helpInput = '';
    exFreeInput = ''; exFreeFirstAttempt = true;
    renderExLayout();
  }

  function renderExLayout() {
    const root = document.getElementById('multdiv-root');
    const free = !helpMode;
    root.innerHTML = `
      <style id="md-base">${BASE_CSS}</style>
      <div class="app-header">
        <button class="btn-back" onclick="MultDivGame.showModeSelect()">Avsluta</button>
        <span class="header-title">Multiplikation – Övning</span>
        <span class="num" style="width:52px;text-align:right;font-family:var(--font-head);font-weight:700;font-size:15px;color:var(--ink-soft)">${exerciseIdx + 1}/5</span>
      </div>
      <div id="md-main">
        <div id="md-left">
          <div id="md-table-wrap" class="${plan.kind === 'twostep' && !free ? 'md-l4' : ''}">${buildTableHTML(free)}</div>
          <div id="md-bubble"></div>
          <div id="md-ui"></div>
          <div id="md-feedback"></div>
        </div>
        <div id="md-right">${scratchHTML()}</div>
      </div>`;
    setupCanvas('md-canvas');
    if (helpMode) advanceHelp(0);
    else showFreeUI();
  }

  /* ══════════════════════════════════════════════════════════
     MED HJÄLP — guidefrågor + framåtblickande knappar
     (exTenStep-mönstret: barnet trycker för varje delsteg)
  ══════════════════════════════════════════════════════════ */
  function buildHelpQueue() {
    const q = [];
    const passQ = (pass, rowKey, shift) => {
      for (const c of pass.cols) q.push({ kind: 'mult', ...c, g: c.col + shift, rowKey, mCol: shift });
    };
    if (plan.kind === 'simple') {
      passQ(plan.pass, 'ans', 0);
    } else {
      q.push({ kind: 'phase', which: 1 });
      passQ(plan.p1, 'p1', 0);
      q.push({ kind: 'phase', which: 2 });
      passQ(plan.p2, 'p2', 1);
      q.push({ kind: 'phase', which: 3 });
      for (const c of plan.add.cols) {
        const single = (c.x === null || c.y === null) && c.carryIn === 0;
        q.push({ kind: single ? 'trivial' : 'add', ...c, g: c.col, rowKey: 'ans' });
      }
    }
    return q;
  }

  function helpItem() { return helpQueue[helpIdx] || null; }

  function advanceHelp(idx) {
    helpIdx = idx;
    helpSub = 0;
    helpInput = '';
    exInputLocked = false;
    const fb = document.getElementById('md-feedback');
    if (fb) fb.innerHTML = '';
    const item = helpItem();
    if (!item) { helpTaskDone(); return; }
    if (item.kind === 'mult') doHighlight({ phase: 'mult', aCol: item.col, mCol: item.mCol, g: item.g });
    else if (item.kind === 'add' || item.kind === 'trivial') doHighlight({ phase: 'add', g: item.g });
    // Markera målcellen
    document.querySelectorAll('#md-table-wrap .md-ansc').forEach(el => el.classList.remove('active-col'));
    if (item.kind !== 'phase') {
      const cell = document.getElementById(`md-${item.rowKey}-${item.g}`);
      if (cell && !cell.classList.contains('filled')) cell.classList.add('active-col');
    }
    showHelpUI();
  }

  function helpBubble(html) {
    const area = document.getElementById('md-bubble');
    if (area) area.innerHTML = html ? `<div class="md-thought">${html}</div>` : '';
  }

  function askText(item) {
    const C = cv(item.g);
    if (item.kind === 'mult') {
      const mi = item.carryIn ? ` + <span style="color:#d97706">${item.carryIn}</span> (minne)` : '';
      return `Vad är <strong style="color:${C}">${item.aDig}</strong> · <strong style="color:${C}">${item.m}</strong>${mi}?`;
    }
    const x = item.x === null ? null : item.x, y = item.y === null ? null : item.y;
    const mi = item.carryIn ? ` + <span style="color:#d97706">${item.carryIn}</span> (minne)` : '';
    if (x === null && y === null) {
      // Kolumn utan siffror — bara minnessiffran (t.ex. 91·12, 33·33)
      return `Bara minnessiffran kvar! Vad är <strong style="color:#d97706">${item.carryIn}</strong>?`;
    }
    if (x === null || y === null) {
      const d = x === null ? y : x;
      return `Vad är <strong style="color:${C}">${d}</strong>${mi}?`;
    }
    return `Vad är <strong style="color:${C}">${x}</strong> + <strong style="color:${C}">${y}</strong>${mi}?`;
  }

  function showHelpUI() {
    const ui = document.getElementById('md-ui');
    if (!ui) return;
    const item = helpItem();
    if (!item) return;

    if (item.kind === 'phase') {
      helpBubble(stepBubbleHTML({ t: 'phase', which: item.which }));
      const label = item.which === 1 ? 'Vi börjar med entalet! ➜'
                  : item.which === 2 ? 'Fortsätt med tiotalet ➜'
                  : 'Dags att addera! ➕';
      ui.innerHTML = `<button class="btn btn-primary btn-block" id="md-action-btn"
        onclick="MultDivGame.helpAction()">${label}</button>`;
      return;
    }

    if (item.kind === 'trivial') {
      const d = item.x === null ? item.y : item.x;
      helpBubble(`Här står bara <strong style="color:${cv(item.g)}">${d}</strong>:an — den flyttas ner! ✅`);
      ui.innerHTML = `<button class="btn btn-primary btn-block" id="md-action-btn"
        onclick="MultDivGame.helpAction()">Skriv ${d}:an ✏️</button>`;
      return;
    }

    if (helpSub === 1) {
      // Rätt svar med minnessiffra: framåtblickande knapp kör animationen
      helpBubble(`Rätt! Vi skriver <strong style="color:${cv(item.g)}">${item.write}</strong>:an — <strong style="color:#d97706">${item.carryOut}</strong>:an blir minnessiffra!`);
      ui.innerHTML = `<button class="btn btn-primary btn-block" id="md-action-btn"
        onclick="MultDivGame.helpAction()">Skicka upp ${item.carryOut}:an! ⬆️</button>`;
      return;
    }

    // Fråga + miniräknar-fält (svaret kan vara tvåsiffrigt, t.ex. 42)
    helpBubble(askText(item));
    ui.innerHTML = `<div class="md-panel">
      <div class="md-field md-field-sm num" id="md-help-field"><span class="md-caret"></span></div>
      <div class="md-numpad">
        ${[1,2,3,4,5,6,7,8,9,0].map(k =>
          `<button class="md-nk" onclick="MultDivGame.helpKey('${k}')">${k}</button>`).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="md-btn" onclick="MultDivGame.helpErase()"
          style="width:64px;height:44px;background:var(--tint);color:var(--deep);border:2px solid color-mix(in srgb, var(--accent) 30%, transparent);font-size:1.2rem;border-radius:var(--radius-full)">⌫</button>
        <button class="md-btn" id="md-help-submit" onclick="MultDivGame.helpSubmit()" disabled
          style="flex:1;height:44px;background:linear-gradient(135deg,#cbd5e1,#94a3b8);color:#fff;font-size:1rem;border-radius:var(--radius-full)">Skriv svaret…</button>
      </div>
    </div>`;
    helpRenderField();
  }

  function helpRenderField() {
    const field = document.getElementById('md-help-field');
    if (field) {
      field.classList.toggle('has-digits', helpInput.length > 0);
      field.innerHTML = (helpInput ? `<span>${helpInput}</span>` : '') + '<span class="md-caret"></span>';
    }
    const btn = document.getElementById('md-help-submit');
    if (btn) {
      const ready = helpInput.length > 0;
      btn.disabled = !ready;
      btn.style.background = ready
        ? 'linear-gradient(135deg,var(--accent),var(--accent-light))'
        : 'linear-gradient(135deg,#cbd5e1,#94a3b8)';
      btn.textContent = ready ? 'Klar ✓' : 'Skriv svaret…';
    }
  }

  function helpClearWrong() {
    const field = document.getElementById('md-help-field');
    if (field) field.classList.remove('wrong');
    const fb = document.getElementById('md-feedback');
    if (fb) fb.innerHTML = '';
  }

  function helpKey(k) {
    if (exInputLocked || helpSub !== 0) return;
    helpClearWrong();
    if (helpInput === '0') helpInput = k;
    else if (helpInput.length >= 2) { helpShake(); return; }
    else helpInput += k;
    App.Sound.play('click');
    helpRenderField();
  }

  function helpErase() {
    if (exInputLocked || !helpInput) return;
    helpClearWrong();
    helpInput = helpInput.slice(0, -1);
    App.Sound.play('click');
    helpRenderField();
  }

  function helpShake() {
    const field = document.getElementById('md-help-field');
    if (!field) return;
    field.classList.remove('shake');
    void field.offsetWidth;
    field.classList.add('shake');
  }

  function helpSubmit() {
    if (exInputLocked || !helpInput) return;
    const item = helpItem();
    if (!item || (item.kind !== 'mult' && item.kind !== 'add')) return;
    const expected = item.kind === 'mult' ? item.prod : item.sum;

    if (parseInt(helpInput, 10) === expected) {
      exInputLocked = true;
      consumeCarry(item);
      App.Sound.play('correct');
      if (!item.last && item.carryOut > 0) {
        // Fas: visa "Rätt! ..." + knapp som kör carry-animationen
        exInputLocked = false;
        helpSub = 1;
        showHelpUI();
      } else if (item.last && item.extra !== null) {
        writeDigit(item.rowKey, item.g, item.write);
        setTimeout(() => writeDigit(item.rowKey, item.g + 1, item.extra), 250);
        helpBubble(`Rätt! Sista kolumnen — hela <strong style="color:${cv(item.g)}">${expected}</strong> får plats! ✅`);
        smallBurst();
        setTimeout(() => advanceHelp(helpIdx + 1), 1000);
      } else {
        writeDigit(item.rowKey, item.g, item.write);
        smallBurst();
        setTimeout(() => advanceHelp(helpIdx + 1), 600);
      }
    } else {
      // Fel → mild "prova igen", inget poängstraff, siffrorna kan redigeras
      App.Sound.play('wrong');
      const field = document.getElementById('md-help-field');
      if (field) field.classList.add('wrong');
      helpShake();
      const fb = document.getElementById('md-feedback');
      if (fb) fb.innerHTML = `<div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);
        border:2px solid #f59e0b;border-radius:12px;padding:5px 10px;font-weight:800;
        font-size:0.92rem;color:#92400e;text-align:center">Hmm, prova igen! 💪</div>`;
    }
  }

  function helpAction() {
    if (exInputLocked) return;
    const item = helpItem();
    if (!item) return;
    const btn = document.getElementById('md-action-btn');
    if (btn) btn.disabled = true;

    if (item.kind === 'phase') {
      if (item.which >= 2) clearCarryRow();
      App.Sound.play('click');
      advanceHelp(helpIdx + 1);

    } else if (item.kind === 'trivial') {
      writeDigit(item.rowKey, item.g, item.write);
      App.Sound.play('correct');
      setTimeout(() => advanceHelp(helpIdx + 1), 600);

    } else if (helpSub === 1) {
      // Kör skriv + carry-flyg (samma animation som demon)
      exInputLocked = true;
      writeDigit(item.rowKey, item.g, item.write);
      setTimeout(() => {
        animateCarryToken(item.rowKey, item.g, item.g + 1, item.carryOut, () => {
          mdCarries[item.g + 1] = item.carryOut;
          updateCarryRow();
          smallBurst();
          setTimeout(() => advanceHelp(helpIdx + 1), 400);
        });
      }, 400);
    }
  }

  function helpTaskDone() {
    exScore++;
    helpBubble(`Klart! 🎉 ${numA} · ${numB} = <strong>${plan.answer}</strong>`);
    const ui = document.getElementById('md-ui');
    if (ui) ui.innerHTML = '';
    App.Sound.play('correct');
    smallBurst();
    const gen = exGen;
    setTimeout(() => { if (gen === exGen) finishTask(true); }, 1400);
  }

  /* ══════════════════════════════════════════════════════════
     UTAN HJÄLP — miniräknar-fältet (v27-mönstret)
  ══════════════════════════════════════════════════════════ */
  function showFreeUI() {
    const ui = document.getElementById('md-ui');
    if (!ui) return;
    ui.innerHTML = `<div class="md-panel">
      <div id="md-free-label" style="font-size:11px;font-weight:800;text-align:center;margin-bottom:8px;text-transform:uppercase"></div>
      <div class="md-numpad">
        ${[1,2,3,4,5,6,7,8,9,0].map(k =>
          `<button class="md-nk" onclick="MultDivGame.exFreePress('${k}')">${k}</button>`).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="md-btn" id="md-free-erase" onclick="MultDivGame.exFreeErase()"
          style="width:64px;height:48px;background:var(--tint);color:var(--deep);border:2px solid color-mix(in srgb, var(--accent) 30%, transparent);font-size:1.2rem;border-radius:var(--radius-full)">⌫</button>
        <button class="md-btn" id="md-free-submit" onclick="MultDivGame.exFreeSubmit()" disabled
          style="flex:1;height:48px;background:linear-gradient(135deg,#cbd5e1,#94a3b8);color:#fff;font-size:1rem;border-radius:var(--radius-full)">Skriv svaret…</button>
      </div>
    </div>`;
    exFreeUpdateSubmit();
  }

  // Maxlängd = svarets sifferantal (aldrig > 4 per nivåvillkoren)
  function exFreeMaxLen() { return Math.min(plan.width, 4); }

  function exFreeRender() {
    const field = document.getElementById('md-free-field');
    if (!field) return;
    field.classList.toggle('has-digits', exFreeInput.length > 0);
    field.innerHTML = (exFreeInput ? `<span>${exFreeInput}</span>` : '') + '<span class="md-caret"></span>';
  }

  function exFreeShake() {
    const field = document.getElementById('md-free-field');
    if (!field) return;
    field.classList.remove('shake');
    void field.offsetWidth;
    field.classList.add('shake');
  }

  function exFreeClearWrong() {
    const field = document.getElementById('md-free-field');
    if (field) field.classList.remove('wrong');
    const fb = document.getElementById('md-feedback');
    if (fb) fb.innerHTML = '';
  }

  function exFreeUpdateSubmit() {
    const ready = exFreeInput.length > 0;
    const btn = document.getElementById('md-free-submit');
    if (btn) {
      btn.disabled = !ready;
      btn.style.background = ready
        ? 'linear-gradient(135deg,var(--accent),var(--accent-light))'
        : 'linear-gradient(135deg,#cbd5e1,#94a3b8)';
      btn.textContent = ready ? 'Klar ✓' : 'Skriv svaret…';
    }
    const label = document.getElementById('md-free-label');
    if (label) {
      label.textContent = ready ? 'Tryck Klar ✓ när du är säker' : 'Skriv svaret med siffrorna';
      label.style.color = ready ? '#16a34a' : 'var(--ink-soft)';
    }
  }

  function exFreePress(key) {
    if (exInputLocked) return;
    exFreeClearWrong();
    if (exFreeInput === '0') {
      exFreeInput = key;             // miniräknar-detalj: ensam nolla ersätts
    } else if (exFreeInput.length >= exFreeMaxLen()) {
      exFreeShake();                 // fullt — extra tryck ignoreras mjukt
      return;
    } else {
      exFreeInput += key;            // vänster→höger som man skriver
    }
    App.Sound.play('click');
    exFreeRender();
    exFreeUpdateSubmit();
  }

  function exFreeErase() {
    if (exInputLocked || !exFreeInput) return;
    exFreeClearWrong();
    exFreeInput = exFreeInput.slice(0, -1);   // ⌫ tar bort SISTA siffran
    App.Sound.play('click');
    exFreeRender();
    exFreeUpdateSubmit();
  }

  function exFreeSubmit() {
    if (exInputLocked || !exFreeInput) return; // gating: Klar kräver ≥1 siffra
    const field = document.getElementById('md-free-field');
    if (parseInt(exFreeInput, 10) === plan.answer) {
      exInputLocked = true;
      if (exFreeFirstAttempt) exScore++;      // +1 endast helrätt på FÖRSTA Klar
      exFreeClearWrong();
      if (field) {
        field.classList.add('correct');
        field.innerHTML = `<span>${exFreeInput}</span>`;
      }
      App.Sound.play('correct');
      smallBurst();
      setTimeout(() => finishTask(true), 900);
    } else {
      exFreeFirstAttempt = false;             // fel förbrukar första försöket
      App.Sound.play('wrong');
      if (field) field.classList.add('wrong'); // rött + redigerbart
      exFreeShake();
      const fb = document.getElementById('md-feedback');
      if (fb) fb.innerHTML = `<div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);
        border:2px solid #f59e0b;border-radius:12px;padding:5px 10px;font-weight:800;
        font-size:0.92rem;color:#92400e;text-align:center">Inte riktigt! Ändra med ⌫ och prova igen 💪</div>`;
      exFreeUpdateSubmit();
    }
  }

  /* ── Uppgiftsräknare + resultat ─────────────────────────── */
  function finishTask(correct) {
    exerciseIdx++;
    if (exerciseIdx >= 5) {
      showExResults();
    } else {
      const toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99';
      toast.innerHTML = `<div style="background:${correct ? '#dcfce7' : '#fef9c3'};border:2px solid ${correct ? '#22c55e' : '#f59e0b'};
        border-radius:999px;padding:10px 22px;font-weight:800;color:${correct ? '#166534' : '#92400e'};font-size:1rem">
        ${correct ? '✅ Rätt!' : '💪 Nästa!'} Uppgift ${exerciseIdx}/5</div>`;
      document.body.appendChild(toast);
      const gen = exGen;
      setTimeout(() => { toast.remove(); if (gen === exGen) newExProblem(); }, 1100);
    }
  }

  function showExResults() {
    App.Sound.play(exScore >= 4 ? 'fanfare' : 'correct');
    if (exScore === 5) App.Confetti.burst(160);
    // Logga fria lägets pass (mode, nivå, score) — hjälpläget loggas inte i steg A
    if (!helpMode && profile) {
      try { getLog().add({ mode: 'multiplikation', level: difficulty, score: exScore, total: 5 }); }
      catch (_) {}
    }
    const root = document.getElementById('multdiv-root');
    const emoji = exScore === 5 ? '🌟' : exScore >= 4 ? '🥇' : exScore >= 3 ? '🥈' : '💪';
    const msg   = exScore === 5 ? 'Perfekt! 🎉' : exScore >= 4 ? 'Fantastiskt!' : exScore >= 3 ? 'Jättebra!' : 'Fortsätt öva!';
    root.innerHTML = `
      <style id="md-base">${BASE_CSS}</style>
      <div class="floaties"><span style="top:7%;right:8%">✨</span><span style="bottom:12%;left:6%;animation-delay:2s">🐬</span></div>
      <div class="app-header">
        <button class="btn-back" onclick="MultDivGame.showModeSelect()">Tillbaka</button>
        <span class="header-title">Resultat</span>
        <span style="width:52px"></span>
      </div>
      <div class="wrap" style="padding:0 12px 12px">
        <div class="result-hero">
          <div class="result-pct num">${Math.round((exScore / 5) * 100)} %</div>
          <div class="result-medal">${emoji}</div>
          <div class="result-msg">${msg}</div>
          <div class="result-note num">${exScore} av 5 rätt</div>
          <div class="result-actions">
            <button class="btn btn-primary btn-lg" onclick="MultDivGame.startExercise()">
              <svg class="icn"><use href="#i-refresh"/></svg>Spela igen</button>
            <button class="btn btn-ghost" onclick="MultDivGame.showModeSelect()">Välj läge</button>
          </div>
        </div>
      </div>`;
  }

  /* ── Kladd (Fas 3.2: fyller ledig yta + bitmapp-synk) ───── */
  function scratchHTML() {
    return `<div class="md-scratch">
      <div style="font-size:10px;font-weight:800;color:var(--deep);text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0">✏️ Kladd</div>
      <canvas id="md-canvas" class="md-canvas"></canvas>
      <div style="display:flex;gap:5px;flex-shrink:0">
        <button onclick="MultDivGame.mdToggleEraser(false)" id="md-draw"
          style="flex:1;height:30px;border-radius:10px;font-weight:800;font-size:11px;
          cursor:pointer;background:var(--accent);color:#fff;border:1.5px solid var(--accent)">🖊️ Rita</button>
        <button onclick="MultDivGame.mdToggleEraser(true)" id="md-erase"
          style="flex:1;height:30px;border-radius:10px;font-weight:800;font-size:11px;
          cursor:pointer;background:var(--tint);color:var(--deep);border:1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)">🧹 Sudd</button>
        <button onclick="MultDivGame.mdClearCanvas()"
          style="flex:1;height:30px;border-radius:10px;font-weight:800;font-size:11px;
          cursor:pointer;background:var(--tint);color:var(--deep);border:1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)">🗑️ Rensa</button>
      </div>
    </div>`;
  }

  function setupCanvas(id) {
    const el = document.getElementById(id);
    if (mdResizeObs) { mdResizeObs.disconnect(); mdResizeObs = null; }
    mdCanvas = el;
    if (!mdCanvas) return;
    mdErasing = false;
    requestAnimationFrame(() => {
      if (!mdCanvas || !mdCanvas.isConnected) return;
      const r = mdCanvas.getBoundingClientRect();
      mdCanvas.width  = Math.max(Math.round(r.width)  || 300, 60);
      mdCanvas.height = Math.max(Math.round(r.height) || 200, 60);
      mdCtx = mdCanvas.getContext('2d');
      mdCanvas.addEventListener('pointerdown',   mdPD);
      mdCanvas.addEventListener('pointermove',   mdPM);
      mdCanvas.addEventListener('pointerup',     mdPU);
      mdCanvas.addEventListener('pointercancel', mdPU);
      /* Kladden flex-växer dynamiskt — håll bitmappen i synk med CSS-ytan */
      if (typeof ResizeObserver !== 'undefined') {
        mdResizeObs = new ResizeObserver(() => mdSyncBitmap());
        mdResizeObs.observe(mdCanvas);
      }
    });
  }

  function mdSyncBitmap() {
    if (!mdCanvas || !mdCtx || !mdCanvas.isConnected) return;
    const w = Math.round(mdCanvas.clientWidth);
    const h = Math.round(mdCanvas.clientHeight);
    if (!w || !h) return;
    if (Math.abs(w - mdCanvas.width) < 2 && Math.abs(h - mdCanvas.height) < 2) return;
    const tmp = document.createElement('canvas');
    tmp.width = mdCanvas.width; tmp.height = mdCanvas.height;
    tmp.getContext('2d').drawImage(mdCanvas, 0, 0);
    mdCanvas.width = w; mdCanvas.height = h;
    mdCtx.drawImage(tmp, 0, 0);
  }

  function mdPD(e) {
    e.preventDefault(); mdDrawing = true;
    const r = mdCanvas.getBoundingClientRect();
    mdLastX = (e.clientX - r.left) * (mdCanvas.width / r.width);
    mdLastY = (e.clientY - r.top)  * (mdCanvas.height / r.height);
    mdCanvas.setPointerCapture(e.pointerId);
  }

  function mdPM(e) {
    if (!mdDrawing || !mdCtx) return;
    e.preventDefault();
    const r = mdCanvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (mdCanvas.width / r.width);
    const y = (e.clientY - r.top)  * (mdCanvas.height / r.height);
    mdCtx.globalCompositeOperation = mdErasing ? 'destination-out' : 'source-over';
    mdCtx.lineWidth = mdErasing ? 20 : 2 + (e.pressure || 0.5) * 3;
    mdCtx.strokeStyle = '#0d9488';
    mdCtx.lineCap = 'round'; mdCtx.lineJoin = 'round';
    mdCtx.beginPath(); mdCtx.moveTo(mdLastX, mdLastY);
    mdCtx.lineTo(x, y); mdCtx.stroke();
    mdLastX = x; mdLastY = y;
  }

  function mdPU() { mdDrawing = false; }

  function mdToggleEraser(on) {
    mdErasing = on;
    const d = document.getElementById('md-draw');
    const e = document.getElementById('md-erase');
    if (d) { d.style.background = on ? 'var(--tint)' : 'var(--accent)'; d.style.color = on ? 'var(--deep)' : '#fff'; }
    if (e) { e.style.background = on ? 'var(--accent)' : 'var(--tint)'; e.style.color = on ? '#fff' : 'var(--deep)'; }
  }

  function mdClearCanvas() {
    if (mdCtx && mdCanvas) mdCtx.clearRect(0, 0, mdCanvas.width, mdCanvas.height);
  }

  /* ── Ljud + konfetti ────────────────────────────────────── */
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

  function smallBurst() {
    const c = document.getElementById('confetti-container');
    if (!c) return;
    const sh = ['⭐','💫','✨','🌟','🎉','💙','🐬'];
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
  function exitToApp() {
    const root = document.getElementById('multdiv-root');
    if (root) root.innerHTML = '';
    App.goBackToGameSelect();
  }

  /* ── Publikt API ────────────────────────────────────────── */
  const api = {
    init, showHub, setDifficulty, chooseMult,
    showModeSelect, startDemo, demoNextStep,
    startExercise, showHelpSelect, setHelpMode,
    helpKey, helpErase, helpSubmit, helpAction,
    exFreePress, exFreeErase, exFreeSubmit,
    mdToggleEraser, mdClearCanvas,
    exitToApp,
    /* Endast för vitest: ren matte-kärna + generator */
    _internals: { digitsOf, singlePass, addPass, buildPlan, genProblem },
  };
  return api;
})();

/* CJS-export för vitest (samma mönster som shared.js) */
if (typeof module !== 'undefined' && module.exports) module.exports = MultDivGame;
