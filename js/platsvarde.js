/* ============================================================
   MULTIPLAY – Platsvärde-övningar (Nivå A–D)
   10 frågor per pass: identifiera, bygga, talord, jämföra
   ============================================================ */
'use strict';

const PlatsvardeGame = (() => {

  /* ── State ─────────────────────────────────────────────── */
  let profile     = null;
  let questions   = [];
  let qIndex      = 0;
  let score       = 0;
  let attempts    = 0;
  let currentQ    = null;
  let inputLocked = false;

  /* Canvas */
  let pvCanvas = null, pvCtx = null;
  let pvDrawing = false, pvErasing = false;
  let pvLastX = 0, pvLastY = 0;

  /* Answer state */
  let decompAnswers = ['', '', ''];
  let decompActive  = 0;
  let orderPlaced   = [];

  /* ── Konstanter ─────────────────────────────────────────── */
  const PV_COLORS = { ental: '#22c55e', tiotal: '#3b82f6', hundratal: '#ef4444' };
  const POS_LABELS = { hundratal: 'Hundratal', tiotal: 'Tiotal', ental: 'Ental' };
  const LOG_KEY = id => `platsvarde_log_${id}`;

  /* ── Init ───────────────────────────────────────────────── */
  function init(p) {
    profile = p;
    showSelect();
  }

  /* ══════════════════════════════════════════════════════════
     VÄLJ-SKÄRM
  ══════════════════════════════════════════════════════════ */
  function readHubLog(key, filter) {
    try {
      let log = JSON.parse(localStorage.getItem(key)) || [];
      if (filter) log = log.filter(filter);
      return log.length ? { latest: log[0], count: log.length } : null;
    } catch (_) { return null; }
  }

  function hubStatusHtml(s) {
    if (!s || !s.latest || !s.latest.total) {
      return `<span class="astat astat-new">Ny! ✨</span>`;
    }
    const pct   = Math.max(0, Math.min(100, Math.round(s.latest.score / s.latest.total * 100)));
    const medal = pct === 100 ? '🥇' : pct >= 75 ? '🥈' : pct >= 50 ? '🥉' : '💪';
    const pass  = s.count === 1 ? '1 pass' : `${s.count} pass`;
    return `
      <span class="astat num">${medal} Senast ${s.latest.score}/${s.latest.total} · ${pass}</span>
      <span class="abar"><i style="width:${pct}%"></i></span>`;
  }

  function showSelect() {
    const root = document.getElementById('addsub-root');
    const pid  = profile.id;
    const cards = [
      { icon: '🧮', label: 'Platsvärde',            desc: 'Hundratal, tiotal och ental',
        onclick: 'PlatsvardeGame.startPlatsvarde()',
        stat: readHubLog(LOG_KEY(pid)) },
      { icon: '➕', label: 'Uppställd addition',    desc: 'Räkna uppställt med minnessiffra',
        onclick: "PlatsvardeGame.startUppstallning('addition')",
        stat: readHubLog(`uppstallning_log_${pid}`, e => e.mode === 'addition') },
      { icon: '➖', label: 'Uppställd subtraktion', desc: 'Låna från tiotalet',
        onclick: "PlatsvardeGame.startUppstallning('subtraction')",
        stat: readHubLog(`uppstallning_log_${pid}`, e => e.mode === 'subtraction') },
    ];

    root.innerHTML = `
      <style id="pv-hub-css">
        .as-hub { flex:1; min-height:0; width:100%; display:flex; flex-direction:column;
          justify-content:center; align-items:center; gap:clamp(12px,2.2vh,22px); }
        .as-hub .section-title { width:100%; padding:0; flex-shrink:0; }
        .as-hub .me-chip { flex-shrink:0; }
        .as-cards { width:100%; flex:1; min-height:0; max-height:min(58vh,540px);
          display:grid; grid-template-columns:1fr; grid-auto-rows:1fr;
          gap:clamp(10px,1.8vh,18px); }
        .acard { display:flex; align-items:center; gap:clamp(14px,2vw,20px); text-align:left;
          width:100%; min-height:clamp(84px,13vh,140px);
          padding:clamp(12px,2vh,20px) clamp(16px,2.5vw,24px);
          background:var(--glass); border:1px solid var(--glass-line);
          border-radius:var(--radius-lg); box-shadow:var(--shadow-panel);
          cursor:pointer; transition:transform .3s var(--spring), box-shadow .3s; }
        .acard:hover { transform:translateY(-4px) scale(1.01); box-shadow:0 16px 40px var(--glow); }
        .acard:active { transform:scale(.98); }
        .aico { width:clamp(56px,9vh,84px); height:clamp(56px,9vh,84px);
          border-radius:22px; display:grid; place-items:center;
          font-size:clamp(28px,4.6vh,44px); flex-shrink:0;
          background:linear-gradient(135deg,var(--tint),#fff);
          border:1px solid var(--glass-line); box-shadow:0 4px 12px var(--glow); }
        .acard-body { flex:1; min-width:0; display:flex; flex-direction:column;
          align-items:flex-start; gap:2px; }
        .acard b { font-family:var(--font-head); font-weight:700;
          font-size:clamp(18px,2.6vh,23px); color:var(--deep); line-height:1.15; }
        .acard small { color:var(--ink-soft); font-size:clamp(12px,1.7vh,14.5px); font-weight:700; }
        .astat { display:inline-flex; align-items:center; gap:6px; margin-top:6px;
          font-size:12.5px; font-weight:800; color:var(--deep);
          background:color-mix(in srgb, var(--accent) 10%, white 60%);
          padding:4px 12px; border-radius:var(--radius-full); }
        .astat-new { background:linear-gradient(135deg,var(--accent),var(--accent-light));
          color:#fff; }
        .abar { width:min(220px,70%); height:6px; margin-top:7px; border-radius:99px;
          background:color-mix(in srgb, var(--accent) 14%, white 50%); overflow:hidden; }
        .abar i { display:block; height:100%; border-radius:inherit;
          background:linear-gradient(90deg,var(--accent),var(--accent-light)); }
        .acard .chev { color:var(--accent); flex-shrink:0; width:26px; height:26px; margin-left:auto; }
        @media (min-width:1000px) {
          .as-cards { grid-template-columns:repeat(3,1fr); max-height:min(54vh,460px); }
          .acard { flex-direction:column; justify-content:center; text-align:center;
            gap:clamp(10px,2vh,18px); min-height:0; }
          .acard-body { flex:0 0 auto; align-items:center; text-align:center; }
          .acard .chev { display:none; }
        }
      </style>
      <div class="floaties"><span style="top:6%;right:8%">✨</span><span style="bottom:10%;left:5%;animation-delay:2s">🍀</span></div>
      <div class="app-header">
        <button class="btn-back" onclick="App.goBackToGameSelect()">Tillbaka</button>
        <span class="header-title">Addition &amp; Subtraktion</span>
        <span style="width:52px"></span>
      </div>
      <div class="wrap">
        <div class="as-hub">
          <div class="me-chip">
            <span class="avatar avatar-sm">${profile.avatar}</span>
            <b>${escHtml(profile.name)}</b>
          </div>
          <div class="section-title">Vad vill du träna?</div>
          <div class="as-cards">
            ${cards.map(c => `
              <button class="acard" onclick="${c.onclick}">
                <span class="aico">${c.icon}</span>
                <span class="acard-body">
                  <b>${c.label}</b>
                  <small>${c.desc}</small>
                  ${hubStatusHtml(c.stat)}
                </span>
                <svg class="icn chev" viewBox="0 0 24 24"><use href="#i-chevron"/></svg>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    Router.show('screen-addsub');
  }

  function startUppstallning(mode) {
    App.Sound.play('click');
    document.getElementById('addsub-root').innerHTML = '';
    Router.show('screen-uppstallning');
    if (typeof UppstallningGame !== 'undefined') {
      UppstallningGame.init(profile, mode);
    }
  }

  /* ══════════════════════════════════════════════════════════
     STARTA PLATSVÄRDE-ÖVNING
  ══════════════════════════════════════════════════════════ */
  function startPlatsvarde() {
    App.Sound.play('click');
    qIndex    = 0;
    score     = 0;
    questions = generateQuestions();
    renderQuestion();
  }

  /* ══════════════════════════════════════════════════════════
     FRÅGE-GENERERING
  ══════════════════════════════════════════════════════════ */
  function genNum3() {
    let n;
    do { n = 100 + Math.floor(Math.random() * 900); }
    while (String(n).includes('0'));
    return n;
  }

  function getDigitAt(num, pos) {
    if (pos === 'hundratal') return Math.floor(num / 100);
    if (pos === 'tiotal')    return Math.floor((num % 100) / 10);
    return num % 10;
  }

  function generateQuestions() {
    const qs = [];
    const positions = ['hundratal', 'tiotal', 'ental'];

    /* ── Nivå A: 3 frågor ── */
    // A1: Tryck på rätt siffra
    const a1Num = genNum3();
    const a1Pos = positions[Math.floor(Math.random() * 3)];
    qs.push({ level: 'A', type: 'A1', num: a1Num, target: a1Pos });

    // A2: Vad är [position] värt?
    const a2Num  = genNum3();
    const a2Pos  = positions[Math.floor(Math.random() * 3)];
    const a2Dig  = getDigitAt(a2Num, a2Pos);
    const a2Mul  = a2Pos === 'hundratal' ? 100 : a2Pos === 'tiotal' ? 10 : 1;
    const a2Cor  = a2Dig * a2Mul;
    const a2Pool = [a2Cor, a2Dig, a2Dig * (a2Mul < 100 ? a2Mul * 10 : 10),
                    a2Dig * (a2Mul === 1 ? 10 : 1)].filter((v, i, a) => a.indexOf(v) === i);
    while (a2Pool.length < 4) a2Pool.push(a2Pool[a2Pool.length - 1] + 1);
    qs.push({ level: 'A', type: 'A2', num: a2Num, target: a2Pos, correct: a2Cor, options: shuffle(a2Pool).slice(0, 4) });

    // A3: Hur många [position]er?
    const a3Num  = genNum3();
    const a3Pos  = positions[Math.floor(Math.random() * 3)];
    const a3Dig  = getDigitAt(a3Num, a3Pos);
    const a3Pool = [a3Dig];
    for (let d = 1; d <= 9 && a3Pool.length < 4; d++) {
      const v = (a3Dig + d) % 10;
      if (!a3Pool.includes(v)) a3Pool.push(v);
    }
    qs.push({ level: 'A', type: 'A3', num: a3Num, target: a3Pos, correct: a3Dig, options: shuffle(a3Pool.slice(0, 4)) });

    /* ── Nivå B: 2 frågor ── */
    // B1: Sätt ihop tal
    const bH = 1 + Math.floor(Math.random() * 9);
    const bT = 1 + Math.floor(Math.random() * 9);
    const bE = 1 + Math.floor(Math.random() * 9);
    const b1Cor  = bH * 100 + bT * 10 + bE;
    const b1Opts = shuffle([b1Cor, bH * 100 + bE * 10 + bT, bE * 100 + bT * 10 + bH, bT * 100 + bH * 10 + bE]);
    qs.push({ level: 'B', type: 'B1', h: bH, t: bT, e: bE, correct: b1Cor, options: b1Opts });

    // B2: Dela upp tal
    const b2Num = genNum3();
    qs.push({
      level: 'B', type: 'B2', num: b2Num,
      correct: { h: Math.floor(b2Num / 100), t: Math.floor((b2Num % 100) / 10), e: b2Num % 10 }
    });

    /* ── Nivå C: 3 frågor ── */
    // C1: Tal → ord
    const c1Num  = genNum3();
    const c1Word = numberToSwedish(c1Num);
    let c1W1, c1W2;
    do { c1W1 = numberToSwedish(genNum3()); } while (c1W1 === c1Word);
    do { c1W2 = numberToSwedish(genNum3()); } while (c1W2 === c1Word || c1W2 === c1W1);
    qs.push({ level: 'C', type: 'C1', num: c1Num, correct: c1Word, options: shuffle([c1Word, c1W1, c1W2]) });

    // C2: Ord → tal
    const c2Num  = genNum3();
    const c2Opts = [c2Num];
    while (c2Opts.length < 4) {
      const n = genNum3();
      if (!c2Opts.includes(n)) c2Opts.push(n);
    }
    qs.push({ level: 'C', type: 'C2', num: c2Num, word: numberToSwedish(c2Num), correct: c2Num, options: shuffle(c2Opts) });

    // C3: Tal → ord (till)
    const c3Num  = genNum3();
    const c3Word = numberToSwedish(c3Num);
    let c3W1, c3W2;
    do { c3W1 = numberToSwedish(genNum3()); } while (c3W1 === c3Word);
    do { c3W2 = numberToSwedish(genNum3()); } while (c3W2 === c3Word || c3W2 === c3W1);
    qs.push({ level: 'C', type: 'C1', num: c3Num, correct: c3Word, options: shuffle([c3Word, c3W1, c3W2]) });

    /* ── Nivå D: 2 frågor ── */
    // D1: Störst/minst
    let d1Nums;
    do { d1Nums = Array.from({ length: 4 }, genNum3); } while (new Set(d1Nums).size < 4);
    const d1Max = Math.random() > 0.5;
    qs.push({ level: 'D', type: 'D1', nums: d1Nums, askMax: d1Max,
              correct: d1Max ? Math.max(...d1Nums) : Math.min(...d1Nums) });

    // D2: Ordna
    let d2Raw;
    do { d2Raw = Array.from({ length: 4 }, genNum3); } while (new Set(d2Raw).size < 4);
    qs.push({ level: 'D', type: 'D2', nums: shuffle([...d2Raw]),
              correct: [...d2Raw].sort((a, b) => a - b) });

    return qs;
  }

  /* ══════════════════════════════════════════════════════════
     RENDERA FRÅGA (2-kolumn layout)
  ══════════════════════════════════════════════════════════ */
  function renderQuestion() {
    inputLocked   = false;
    attempts      = 0;
    decompAnswers = ['', '', ''];
    decompActive  = 0;
    orderPlaced   = [];

    const q = questions[qIndex];
    currentQ = q;
    const root = document.getElementById('addsub-root');

    root.innerHTML = `
      <style id="pv-rs">
        #screen-addsub { max-width:100% !important; width:100% !important; padding:0 !important; }
        #screen-addsub .app-header { max-width:100% !important; }
        #addsub-root { display:flex; flex-direction:column; height:100vh; overflow:hidden; }
        #pv-main { flex:1; display:flex; flex-direction:row; gap:8px; padding:8px; overflow:hidden; min-height:0; }
        #pv-left { flex:55; display:flex; flex-direction:column; gap:6px; overflow-y:auto; min-height:0; padding-bottom:8px; }
        #pv-scratch { flex:45; background:var(--glass); border-radius:var(--radius-lg); padding:8px;
          border:1px solid var(--glass-line); box-shadow:var(--shadow-panel);
          display:flex; flex-direction:column; gap:5px; min-height:0; }
        @media (orientation:portrait) {
          #pv-main { flex-direction:column; }
          #pv-left { flex:1; }
          #pv-scratch { flex:0 0 40vh; }
        }
        #pv-canvas { flex:1; width:100%; display:block; touch-action:none; cursor:crosshair;
          border-radius:var(--radius-md); border:2px dashed color-mix(in srgb, var(--accent) 30%, transparent);
          background:rgba(255,255,255,0.75); }
        .pv-card { background:var(--glass-strong); border-radius:var(--radius-lg); padding:10px;
          border:1px solid var(--glass-line); box-shadow:var(--shadow-panel); }
        .pv-digit-row { display:flex; justify-content:center; gap:10px; margin:8px 0; }
        .pv-digit-box { display:flex; flex-direction:column; align-items:center; gap:4px; width:clamp(52px,10vw,80px);
          border-radius:var(--radius-lg); padding:10px 0; cursor:pointer;
          transition:transform 0.25s var(--spring),box-shadow 0.25s;
          border-width:2.5px; border-style:solid; }
        .pv-digit-box:hover { transform:scale(1.08); box-shadow:0 8px 20px var(--glow); }
        .pv-choice-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
        .pv-choice-btn { padding:10px; border-radius:var(--radius-md); background:var(--glass-strong);
          border:2px solid color-mix(in srgb, var(--accent) 22%, transparent); color:var(--deep);
          font-size:var(--text-base); font-family:var(--font-head);
          font-weight:800; cursor:pointer; box-shadow:var(--shadow-sm);
          transition:all 0.25s var(--spring); }
        .pv-choice-btn:hover { border-color:var(--accent); transform:translateY(-2px) scale(1.02);
          box-shadow:0 8px 20px var(--glow); }
        .pv-decomp-field { width:clamp(40px,8vw,60px); height:clamp(40px,8vw,60px); border-radius:var(--radius-md); font-size:var(--text-2xl);
          font-family:var(--font-head); font-variant-numeric:tabular-nums;
          font-weight:900; border:2.5px solid; display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:all 0.15s; background:var(--glass-strong); position:relative; }
        .pv-decomp-field.active { outline:3px solid var(--accent);
          animation:pv-free-glow 1.2s ease-in-out infinite; }
        .pv-free-arrow { position:absolute; bottom:calc(100% + 2px); left:50%;
          transform:translateX(-50%); font-size:clamp(1rem,2.2vw,1.3rem);
          pointer-events:none; z-index:6; animation:pv-arrow-bounce 0.9s ease-in-out infinite; }
        @keyframes pv-free-glow {
          0%,100% { box-shadow:0 0 6px color-mix(in srgb, var(--accent) 30%, transparent); }
          50%      { box-shadow:0 0 20px color-mix(in srgb, var(--accent) 75%, transparent); }
        }
        @keyframes pv-arrow-bounce {
          0%,100% { transform:translateX(-50%) translateY(0); }
          50%      { transform:translateX(-50%) translateY(-7px); }
        }
        .pv-numpad { display:grid; grid-template-columns:repeat(3,clamp(40px,8vw,52px)); gap:6px; justify-content:center; margin-top:8px; }
        .pv-nk { width:clamp(40px,8vw,52px); height:clamp(40px,8vw,52px); border-radius:var(--radius-full);
          font-size:var(--text-base); font-family:var(--font-head); font-weight:900;
          cursor:pointer; background:var(--glass-strong);
          border:1.5px solid color-mix(in srgb, var(--accent) 32%, transparent);
          color:var(--deep); transition:transform 0.2s var(--spring); }
        .pv-nk:hover { transform:scale(1.1); }
        .pv-nk-del { background:#fee2e2; border-color:#ef4444; color:#dc2626; }
        .pv-nk-ok  { background:linear-gradient(135deg,var(--accent),var(--accent-light));
          border-color:transparent; color:#fff; box-shadow:0 4px 12px var(--glow); }
        .pv-nk:disabled { opacity:0.5; cursor:default; box-shadow:none; }
        .pv-nk:disabled:hover { transform:none; }
        .pv-order-pool { display:flex; flex-wrap:wrap; gap:6px; justify-content:center; margin:6px 0; }
        .pv-order-btn { padding:5px 10px; border-radius:var(--radius-md); font-size:var(--text-sm); font-weight:800;
          cursor:pointer; border:2px solid color-mix(in srgb, var(--accent) 30%, transparent);
          background:var(--glass-strong); transition:all 0.25s var(--spring); }
        .pv-order-btn.placed { opacity:0.45; border-style:dashed; border-color:var(--accent);
          outline:2px solid color-mix(in srgb, var(--accent) 25%, transparent);
          background:color-mix(in srgb, var(--accent) 8%, transparent); }
        .pv-slot { width:clamp(50px,10vw,72px); height:44px; border-radius:var(--radius-md);
          border:2px dashed color-mix(in srgb, var(--accent) 32%, transparent);
          display:inline-flex; align-items:center; justify-content:center; font-size:var(--text-sm);
          font-weight:800; color:color-mix(in srgb, var(--accent) 45%, transparent); }
        .pv-slot.filled { background:color-mix(in srgb, var(--accent) 10%, transparent);
          border:2px solid var(--accent); color:var(--accent); cursor:pointer; }
      </style>

      <div id="pv-hdr" style="display:flex;align-items:center;gap:8px;padding:5px 10px;
        border-bottom:1px solid color-mix(in srgb, var(--accent) 15%, transparent);min-height:44px;flex-shrink:0">
        <button class="btn-back" style="flex-shrink:0;min-height:36px;padding:4px 12px 4px 8px;font-size:13px"
          onclick="PlatsvardeGame.confirmAbort()">Avbryt</button>
        <div class="num" style="flex:1;text-align:center;font-family:var(--font-head);font-weight:700;font-size:14px;color:var(--deep)">
          ${getLevelLabel(q)} &middot; ${qIndex + 1}/10
        </div>
        <div class="progress-bar" style="width:72px;flex-shrink:0">
          <i style="width:${qIndex * 10}%"></i>
        </div>
      </div>

      <div id="pv-main">
        <div id="pv-left">
          ${renderQContent(q)}
          <div id="pv-feedback"></div>
        </div>
        <div id="pv-scratch">
          <div style="font-size:10px;font-weight:800;color:var(--deep);text-transform:uppercase;
            letter-spacing:0.06em;flex-shrink:0">✏️ Kladd</div>
          <canvas id="pv-canvas"></canvas>
          <div style="display:flex;gap:5px;flex-shrink:0">
            <button onclick="PlatsvardeGame.pvToggleEraser(false)" id="pv-draw"
              style="flex:1;height:30px;border-radius:var(--radius-md);font-weight:800;font-size:11px;
              cursor:pointer;background:var(--accent);color:#fff;border:1.5px solid var(--accent)">🖊️ Rita</button>
            <button onclick="PlatsvardeGame.pvToggleEraser(true)" id="pv-erase"
              style="flex:1;height:30px;border-radius:var(--radius-md);font-weight:800;font-size:11px;
              cursor:pointer;background:var(--tint);color:var(--deep);border:1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)">🧹 Sudd</button>
            <button onclick="PlatsvardeGame.pvClearCanvas()"
              style="flex:1;height:30px;border-radius:var(--radius-md);font-weight:800;font-size:11px;
              cursor:pointer;background:var(--tint);color:var(--deep);border:1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)">🗑️ Rensa</button>
          </div>
        </div>
      </div>
    `;
    setupCanvas();
    if (q.type === 'B2') setDecompActive(0); // markera hundratal aktivt direkt
  }

  function renderQContent(q) {
    switch (q.type) {
      case 'A1': return renderA1(q);
      case 'A2': return renderA2(q);
      case 'A3': return renderA3(q);
      case 'B1': return renderB1(q);
      case 'B2': return renderB2(q);
      case 'C1': return renderC1(q);
      case 'C2': return renderC2(q);
      case 'D1': return renderD1(q);
      case 'D2': return renderD2(q);
      default:   return '';
    }
  }

  /* ── Render-hjälpare ────────────────────────────────────── */
  function renderMonoColor(n, color, size) {
    size = size || '1.25rem';
    return String(n).split('').map(d =>
      `<span style="color:${color};font-weight:900;font-size:${size}">${d}</span>`
    ).join('');
  }

  function coloredDigit(d, pos) {
    return `<span style="color:${PV_COLORS[pos]};font-weight:900">${d}</span>`;
  }

  function renderColoredNumber(n, size = '2rem') {
    const s = String(n);
    const posOrder = s.length >= 3
      ? ['hundratal', 'tiotal', 'ental']
      : s.length === 2 ? ['tiotal', 'ental'] : ['ental'];
    return s.split('').map((d, i) =>
      `<span style="color:${PV_COLORS[posOrder[i + (3 - s.length)]]};font-weight:900;font-size:${size}">${d}</span>`
    ).join('');
  }

  /* A1: Tryck på rätt position */
  function renderA1(q) {
    const s = String(q.num);
    return `
      <div class="pv-card">
        <div style="font-size:var(--text-base);font-weight:800;color:var(--color-text);margin-bottom:12px">
          Tryck på <span style="color:${PV_COLORS[q.target]};font-weight:900">${POS_LABELS[q.target].toLowerCase()}</span>:
        </div>
        <div class="pv-digit-row">
          ${['hundratal','tiotal','ental'].map((pos, i) => `
            <button class="pv-digit-box" id="pv-digit-${pos}"
              style="background:rgba(0,0,0,0.03);border-color:${PV_COLORS[pos]}"
              onclick="PlatsvardeGame.handleDigitClick('${pos}')">
              <span style="font-size:2.5rem;font-weight:900;color:${PV_COLORS[pos]};line-height:1">${s[i]}</span>
              <span style="font-size:10px;font-weight:800;color:${PV_COLORS[pos]}">${POS_LABELS[pos]}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* A2: Vad är [position] värt? */
  function renderA2(q) {
    return `
      <div class="pv-card">
        <div style="text-align:center;margin-bottom:10px;letter-spacing:2px">
          ${renderColoredNumber(q.num, '3rem')}
        </div>
        <div style="font-size:var(--text-base);font-weight:800;color:var(--color-text);margin-bottom:10px">
          Vad är <span style="color:${PV_COLORS[q.target]};font-weight:900">${POS_LABELS[q.target].toLowerCase()}</span> värt?
        </div>
        <div class="pv-choice-grid">
          ${q.options.map(opt => `
            <button class="pv-choice-btn" onclick="PlatsvardeGame.handleChoice(${opt},${q.correct})">
              ${renderMonoColor(opt, PV_COLORS[q.target], '1.25rem')}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* A3: Hur många [position]er? */
  function renderA3(q) {
    const plLabel = q.target === 'hundratal' ? 'hundratal' : q.target === 'tiotal' ? 'tiotal' : 'ental';
    return `
      <div class="pv-card">
        <div style="text-align:center;margin-bottom:10px;letter-spacing:2px">
          ${renderColoredNumber(q.num, '3rem')}
        </div>
        <div style="font-size:var(--text-base);font-weight:800;color:var(--color-text);margin-bottom:10px">
          Hur många <span style="color:${PV_COLORS[q.target]};font-weight:900">${plLabel}</span> finns i talet?
        </div>
        <div class="pv-choice-grid">
          ${q.options.map(opt => `
            <button class="pv-choice-btn" onclick="PlatsvardeGame.handleChoice(${opt},${q.correct})">
              <span style="font-weight:900;font-size:var(--text-xl)">${opt}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* B1: Sätt ihop tal */
  function renderB1(q) {
    return `
      <div class="pv-card">
        <div style="font-size:var(--text-base);font-weight:800;color:var(--color-text);margin-bottom:12px">
          Vilket tal har ${coloredDigit(q.h,'hundratal')} hundratal,
          ${coloredDigit(q.t,'tiotal')} tiotal och
          ${coloredDigit(q.e,'ental')} ental?
        </div>
        <div class="pv-choice-grid">
          ${q.options.map(opt => `
            <button class="pv-choice-btn" onclick="PlatsvardeGame.handleChoice(${opt},${q.correct})">
              ${renderColoredNumber(opt, '1.5rem')}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* B2: Dela upp tal */
  function renderB2(q) {
    const fields = [
      { pos:'hundratal', idx:0, label:'hundratal' },
      { pos:'tiotal',    idx:1, label:'tiotal' },
      { pos:'ental',     idx:2, label:'ental' },
    ];
    return `
      <div class="pv-card">
        <div style="font-size:var(--text-base);font-weight:800;color:var(--color-text);margin-bottom:8px">
          Dela upp: ${renderColoredNumber(q.num, '1.5rem')}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px">
          ${fields.map(f => `
            <div style="display:flex;align-items:center;gap:8px">
              <div id="pv-dc-${f.idx}" class="pv-decomp-field"
                style="border-color:${PV_COLORS[f.pos]};color:${PV_COLORS[f.pos]}"
                onclick="PlatsvardeGame.setDecompActive(${f.idx})">
                <span id="pv-dc-val-${f.idx}">?</span>
              </div>
              <span style="color:${PV_COLORS[f.pos]};font-weight:800;font-size:var(--text-base)">${f.label}</span>
            </div>
          `).join('')}
        </div>
        <div class="pv-numpad">
          ${['1','2','3','4','5','6','7','8','9','⌫','0','✓'].map(k => `
            <button class="pv-nk${k==='⌫'?' pv-nk-del':k==='✓'?' pv-nk-ok':''}"
              ${k==='✓' ? 'id="pv-dc-ok" disabled' : ''}
              onclick="PlatsvardeGame.decompPress('${k}')">${k}</button>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* C1: Tal → ord */
  function renderC1(q) {
    return `
      <div class="pv-card">
        <div style="text-align:center;margin-bottom:10px;letter-spacing:2px">
          ${renderColoredNumber(q.num, '3rem')}
        </div>
        <div style="font-size:var(--text-base);font-weight:800;color:var(--color-text);margin-bottom:10px">
          Hur skrivs talet med bokstäver?
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${q.options.map(opt => `
            <button class="pv-choice-btn" style="text-align:left;padding:10px 12px"
              onclick="PlatsvardeGame.handleChoice('${escApos(opt)}','${escApos(q.correct)}')">
              ${escHtml(opt)}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* C2: Ord → tal */
  function renderC2(q) {
    return `
      <div class="pv-card">
        <div style="font-size:var(--text-lg);font-weight:800;color:var(--deep);text-align:center;font-family:var(--font-head);
          margin-bottom:10px;padding:10px;background:color-mix(in srgb, var(--accent) 8%, transparent);border-radius:var(--radius-md)">
          ${escHtml(q.word)}
        </div>
        <div style="font-size:var(--text-base);font-weight:800;color:var(--color-text);margin-bottom:10px">
          Vilket tal är det?
        </div>
        <div class="pv-choice-grid">
          ${q.options.map(opt => `
            <button class="pv-choice-btn" onclick="PlatsvardeGame.handleChoice(${opt},${q.correct})">
              ${renderColoredNumber(opt, '1.5rem')}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* D1: Störst/minst */
  function renderD1(q) {
    const col = q.askMax ? PV_COLORS.hundratal : PV_COLORS.ental;
    return `
      <div class="pv-card">
        <div style="font-size:var(--text-base);font-weight:800;color:var(--color-text);margin-bottom:10px">
          Vilket tal är <span style="color:${col};font-weight:900">${q.askMax ? 'störst' : 'minst'}</span>?
        </div>
        <div class="pv-choice-grid">
          ${q.nums.map(n => `
            <button class="pv-choice-btn" onclick="PlatsvardeGame.handleChoice(${n},${q.correct})">
              ${renderColoredNumber(n, '1.5rem')}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* D2: Ordna */
  function renderD2(q) {
    orderPlaced = [];
    return `
      <div class="pv-card">
        <div style="font-size:var(--text-base);font-weight:800;color:var(--color-text);margin-bottom:8px">
          Ordna från
          <span style="color:${PV_COLORS.ental};font-weight:900">minst</span> →
          <span style="color:${PV_COLORS.hundratal};font-weight:900">störst</span>:
        </div>
        <div style="display:flex;gap:4px;justify-content:center;margin-bottom:8px" id="pv-order-slots">
          ${[0,1,2,3].map(i => `<div class="pv-slot" id="pv-slot-${i}">?</div>`).join('')}
        </div>
        <div class="pv-order-pool" id="pv-order-pool">
          ${q.nums.map(n => `
            <button class="pv-order-btn" id="pv-ob-${n}"
              onclick="PlatsvardeGame.handleOrderClick(${n})">
              ${renderColoredNumber(n, '0.9rem')}
            </button>
          `).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:6px">
          <button onclick="PlatsvardeGame.orderUndo()"
            style="flex:1;height:40px;border-radius:var(--radius-full);
            background:var(--tint);color:var(--deep);
            border:1.5px solid color-mix(in srgb, var(--accent) 30%, transparent);
            font-weight:800;cursor:pointer">
            ↩ Ångra
          </button>
          <button id="pv-order-confirm" onclick="PlatsvardeGame.submitOrder()" disabled
            style="flex:2;height:40px;border-radius:var(--radius-full);
            background:color-mix(in srgb, var(--accent) 15%, transparent);color:var(--deep);border:none;
            font-weight:800;cursor:pointer;opacity:0.5">
            ✓ Klar
          </button>
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════════
     SVARSHANTERING
  ══════════════════════════════════════════════════════════ */
  function handleChoice(val, correct) {
    if (inputLocked) return;
    inputLocked = true;
    processAnswer(String(val) === String(correct), String(correct));
  }

  function handleDigitClick(pos) {
    if (inputLocked) return;
    inputLocked = true;
    const isCorrect = pos === currentQ.target;
    ['hundratal', 'tiotal', 'ental'].forEach(p => {
      const btn = document.getElementById(`pv-digit-${p}`);
      if (!btn) return;
      btn.style.pointerEvents = 'none';
      if (p === currentQ.target) btn.style.background = 'rgba(34,197,94,0.25)';
      if (p === pos && !isCorrect) btn.style.background = 'rgba(239,68,68,0.2)';
    });
    processAnswer(isCorrect, POS_LABELS[currentQ.target]);
  }

  function setDecompActive(idx) {
    decompActive = idx;
    [0, 1, 2].forEach(i => {
      const el = document.getElementById(`pv-dc-${i}`);
      if (!el) return;
      const active = i === idx;
      el.classList.toggle('active', active);
      let arrow = el.querySelector('.pv-free-arrow');
      if (active && !arrow) {
        arrow = document.createElement('span');
        arrow.className = 'pv-free-arrow';
        arrow.textContent = '👇';
        el.appendChild(arrow);
      } else if (!active && arrow) {
        arrow.remove();
      }
    });
  }

  function updateDecompOk() {
    const ok = document.getElementById('pv-dc-ok');
    if (!ok) return;
    const ready = decompAnswers.every(v => v !== '');
    ok.disabled = !ready;
  }

  function decompPress(key) {
    if (inputLocked) return;
    if (key === '✓') { submitDecomp(); return; }
    if (key === '⌫') {
      // Tomt aktivt fält? Backa till föregående (som uppställnings sudd).
      if (decompAnswers[decompActive] === '' && decompActive > 0) {
        setDecompActive(decompActive - 1);
      }
      decompAnswers[decompActive] = '';
    } else {
      decompAnswers[decompActive] = key;
      if (decompActive < 2) { setDecompActive(decompActive + 1); }
    }
    [0, 1, 2].forEach(i => {
      const v = document.getElementById(`pv-dc-val-${i}`);
      if (v) v.textContent = decompAnswers[i] || '?';
    });
    updateDecompOk();
  }

  function submitDecomp() {
    if (inputLocked) return;
    if (decompAnswers.some(v => v === '')) return; // aldrig fel försök på tomt ✓
    inputLocked = true;
    const { h, t, e } = currentQ.correct;
    const isCorrect = parseInt(decompAnswers[0]) === h
                   && parseInt(decompAnswers[1]) === t
                   && parseInt(decompAnswers[2]) === e;
    processAnswer(isCorrect, `${h} hundratal, ${t} tiotal, ${e} ental`);
  }

  function handleOrderClick(num) {
    if (inputLocked) return;
    const idx = orderPlaced.indexOf(num);
    if (idx !== -1) {
      orderPlaced.splice(idx, 1);
    } else if (orderPlaced.length < 4) {
      orderPlaced.push(num);
    }
    updateOrderUI();
  }

  function orderUndo() {
    if (inputLocked) return;
    if (orderPlaced.length === 0) return;
    orderPlaced.pop(); // tar bort SENAST placerade (samma mönster som np-skriftlig)
    updateOrderUI();
  }

  function updateOrderUI() {
    [0, 1, 2, 3].forEach(i => {
      const slot = document.getElementById(`pv-slot-${i}`);
      if (!slot) return;
      if (orderPlaced[i] !== undefined) {
        const num = orderPlaced[i];
        slot.className = 'pv-slot filled';
        slot.innerHTML = renderColoredNumber(num, '0.9rem');
        slot.onclick = () => handleOrderClick(num); // klick på fylld slot tar bort talet
      } else {
        slot.className = 'pv-slot';
        slot.textContent = '?';
        slot.onclick = null;
      }
    });
    currentQ.nums.forEach(n => {
      const btn = document.getElementById(`pv-ob-${n}`);
      if (!btn) return;
      // Placerade knappar förblir klickbara: klick tar tillbaka talet (ångra)
      btn.classList.toggle('placed', orderPlaced.includes(n));
    });
    const confirm = document.getElementById('pv-order-confirm');
    if (confirm) {
      const ready = orderPlaced.length === 4;
      confirm.disabled = !ready;
      confirm.style.opacity = ready ? '1' : '0.5';
      confirm.style.background = ready
        ? 'linear-gradient(135deg,var(--accent),var(--accent-light))'
        : 'color-mix(in srgb, var(--accent) 15%, transparent)';
      confirm.style.color = ready ? '#fff' : 'var(--deep)';
      confirm.style.boxShadow = ready ? '0 4px 12px var(--glow)' : 'none';
    }
  }

  function submitOrder() {
    if (inputLocked) return;
    if (orderPlaced.length < 4) return;
    inputLocked = true;
    const isCorrect = orderPlaced.every((n, i) => n === currentQ.correct[i]);
    processAnswer(isCorrect, currentQ.correct.map(n => renderColoredNumber(n, '1rem')).join(' → '));
  }

  /* ── Bearbeta svar ──────────────────────────────────────── */
  function processAnswer(isCorrect, correctDisplay) {
    attempts++;
    if (isCorrect) {
      score++;
      App.Sound.play('correct');
      celebrationBurst();
      showFeedback(true, '');
      setTimeout(nextQuestion, 1400);
    } else if (attempts >= 2) {
      App.Sound.play('wrong');
      showFeedback(false, `Rätt svar: <strong>${correctDisplay}</strong>`);
      setTimeout(nextQuestion, 2200);
    } else {
      inputLocked = false;
      App.Sound.play('wrong');
      showFeedback(false, 'Prova igen! 💪');
    }
  }

  function showFeedback(correct, msg) {
    const fb = document.getElementById('pv-feedback');
    if (!fb) return;
    fb.innerHTML = correct
      ? `<div style="background:linear-gradient(135deg,#dcfce7,#bbf7d0);border:2px solid #22c55e;
          border-radius:var(--radius-md);padding:var(--space-3);font-size:var(--text-base);
          font-weight:800;color:#166534;text-align:center;animation:bounce-in 0.3s var(--ease-bounce)">
          ✅ Rätt! 🌟</div>`
      : `<div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);border:2px solid #f59e0b;
          border-radius:var(--radius-md);padding:var(--space-3);font-size:var(--text-sm);
          font-weight:700;color:#92400e;text-align:center">❌ ${msg}</div>`;
  }

  function celebrationBurst() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    container.innerHTML = '';
    const shapes = ['⭐', '💫', '✨', '🌟', '🎉', '💙', '💚', '❤️', '🔢', '🎊'];
    for (let i = 0; i < 60; i++) {
      const el = document.createElement('span');
      el.className = 'confetti-piece';
      el.textContent = shapes[Math.floor(Math.random() * shapes.length)];
      el.style.cssText = `left:${Math.random()*100}%;font-size:${14+Math.random()*18}px;
        color:#${Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0')};
        animation-duration:${1.5+Math.random()*2}s;animation-delay:${Math.random()*0.3}s`;
      container.appendChild(el);
    }
    setTimeout(() => { container.innerHTML = ''; }, 3000);
  }

  /* ── Navigation ─────────────────────────────────────────── */
  function nextQuestion() {
    qIndex++;
    qIndex >= questions.length ? showResults() : renderQuestion();
  }

  function showResults() {
    App.Sound.play(score >= 8 ? 'fanfare' : 'correct');
    if (score >= 9) App.Confetti.burst(180);
    saveLog();
    const root = document.getElementById('addsub-root');
    const pct   = Math.round((score / questions.length) * 100);
    const emoji = score === 10 ? '🌟' : score >= 8 ? '🥇' : score >= 6 ? '🥈' : '💪';
    const msg   = score === 10 ? 'Perfekt! 🎉' : score >= 8 ? 'Fantastiskt bra!' : score >= 6 ? 'Jättebra!' : 'Fortsätt öva!';
    root.innerHTML = `
      <div class="app-header">
        <button class="btn-back" onclick="PlatsvardeGame.showSelect()">Tillbaka</button>
        <span class="header-title">Resultat</span>
        <span style="width:52px"></span>
      </div>
      <div class="wrap">
        <div class="result-hero">
          <div class="result-pct num">${pct} %</div>
          <div class="result-medal">${emoji}</div>
          <div class="result-msg">${msg}</div>
          <div class="result-note num">${score} av ${questions.length} rätt</div>
          <div class="result-actions">
            <button class="btn btn-primary btn-lg" onclick="PlatsvardeGame.startPlatsvarde()">
              <svg class="icn"><use href="#i-refresh"/></svg>Spela igen</button>
            <button class="btn btn-ghost" onclick="PlatsvardeGame.showSelect()">Välj övning</button>
          </div>
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════════
     CANVAS
  ══════════════════════════════════════════════════════════ */
  function setupCanvas() {
    pvCanvas = document.getElementById('pv-canvas');
    if (!pvCanvas) return;
    pvErasing = false;
    requestAnimationFrame(() => {
      const r = pvCanvas.getBoundingClientRect();
      pvCanvas.width  = r.width  || 300;
      pvCanvas.height = r.height || 160;
      pvCtx = pvCanvas.getContext('2d');
      pvCanvas.addEventListener('pointerdown',  pvPD);
      pvCanvas.addEventListener('pointermove',  pvPM);
      pvCanvas.addEventListener('pointerup',    pvPU);
      pvCanvas.addEventListener('pointercancel', pvPU);
    });
  }

  function pvPD(e) {
    e.preventDefault();
    pvDrawing = true;
    const r = pvCanvas.getBoundingClientRect();
    pvLastX = (e.clientX - r.left) * (pvCanvas.width / r.width);
    pvLastY = (e.clientY - r.top)  * (pvCanvas.height / r.height);
    pvCanvas.setPointerCapture(e.pointerId);
  }

  function pvPM(e) {
    if (!pvDrawing || !pvCtx) return;
    e.preventDefault();
    const r = pvCanvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (pvCanvas.width / r.width);
    const y = (e.clientY - r.top)  * (pvCanvas.height / r.height);
    if (pvErasing) {
      pvCtx.globalCompositeOperation = 'destination-out';
      pvCtx.lineWidth = 20;
    } else {
      pvCtx.globalCompositeOperation = 'source-over';
      pvCtx.lineWidth = 2 + (e.pressure || 0.5) * 3;
      pvCtx.strokeStyle = '#3b82f6';
    }
    pvCtx.lineCap = 'round'; pvCtx.lineJoin = 'round';
    pvCtx.beginPath(); pvCtx.moveTo(pvLastX, pvLastY);
    pvCtx.lineTo(x, y); pvCtx.stroke();
    pvLastX = x; pvLastY = y;
  }

  function pvPU() { pvDrawing = false; }

  function pvToggleEraser(on) {
    pvErasing = on;
    const d = document.getElementById('pv-draw');
    const e = document.getElementById('pv-erase');
    if (d) { d.style.background = on ? 'var(--tint)' : 'var(--accent)'; d.style.color = on ? 'var(--deep)' : '#fff'; }
    if (e) { e.style.background = on ? 'var(--accent)' : 'var(--tint)'; e.style.color = on ? '#fff' : 'var(--deep)'; }
  }

  function pvClearCanvas() {
    if (pvCtx && pvCanvas) pvCtx.clearRect(0, 0, pvCanvas.width, pvCanvas.height);
  }

  /* ══════════════════════════════════════════════════════════
     HJÄLPFUNKTIONER
  ══════════════════════════════════════════════════════════ */
  function numberToSwedish(n) {
    const ones = ['noll','ett','två','tre','fyra','fem','sex','sju','åtta','nio',
                  'tio','elva','tolv','tretton','fjorton','femton','sexton','sjutton','arton','nitton'];
    const tens = ['','','tjugo','trettio','fyrtio','femtio','sextio','sjuttio','åttio','nittio'];
    if (n < 20) return ones[n];
    if (n < 100) { const t = Math.floor(n / 10); return tens[t] + (n % 10 > 0 ? ones[n % 10] : ''); }
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return (h === 1 ? 'ett' : ones[h]) + 'hundra' + (rest > 0 ? numberToSwedish(rest) : '');
  }

  function getLevelLabel(q) {
    const map = { A: 'Nivå A – Platsvärde', B: 'Nivå B – Bygga tal', C: 'Nivå C – Talord', D: 'Nivå D – Jämföra' };
    return map[q.level] || 'Platsvärde';
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function escApos(str) {
    return String(str).replace(/'/g, "\\'");
  }

  function confirmAbort() {
    if (confirm('Avbryt och gå tillbaka?')) {
      document.getElementById('addsub-root').innerHTML = '';
      showSelect();
    }
  }

  function saveLog() {
    if (!profile) return;
    try {
      const log = JSON.parse(localStorage.getItem(LOG_KEY(profile.id))) || [];
      log.unshift({ date: new Date().toISOString(), score, total: questions.length });
      if (log.length > 20) log.pop();
      localStorage.setItem(LOG_KEY(profile.id), JSON.stringify(log));
    } catch (_) {}
  }

  /* ── Publik API ─────────────────────────────────────────── */
  return {
    init, showSelect, startPlatsvarde, startUppstallning,
    handleChoice, handleDigitClick,
    setDecompActive, decompPress, submitDecomp,
    handleOrderClick, orderUndo, submitOrder,
    pvToggleEraser, pvClearCanvas,
    confirmAbort,
  };
})();
