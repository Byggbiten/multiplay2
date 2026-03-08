/* ============================================================
   MULTIPLAY – NP Matte Åk 3: Skriftlig del
   20 kategorier, alla svarstyper, canvas-kladdyta
   ============================================================ */
'use strict';

const NpMatteSkriftlig = (() => {

  /* ── State ─────────────────────────────────────────────── */
  let profile   = null;
  let questions = [];
  let qIndex    = 0;
  let score     = 0;
  let attempts  = 0;
  let currentQ  = null;
  let inputLocked = false;

  /* Canvas */
  let canvas, ctx, drawing = false, erasing = false;
  let lastX = 0, lastY = 0;

  /* Answer-type state */
  let npadValue   = '';          // free
  let tfAnswers   = {};          // truefalse  { idx: 'sant'|'falskt' }
  let mcSelected  = new Set();   // multi-choice
  let mfValues    = [];          // multi-free  [val, val, ...]
  let mfActiveIdx = 0;
  let orderPlaced = [];          // order
  let orderPool   = [];
  let matchLeft   = null;        // match: selected left index
  let matchPairs  = {};          // match: { leftIdx: rightIdx }
  let fillAnswers = [];          // fillSign: answers per sub-question

  /* ── Data pools ─────────────────────────────────────────── */
  const NAMES = ['Mira', 'Dennis', 'Zelda', 'Nova', 'Hilma', 'Alva', 'Moa', 'Johanna', 'Julian', 'Belle'];
  const CONTEXTS = [
    { place: 'skolgården',   things: 'elever'   },
    { place: 'biblioteket',  things: 'böcker'   },
    { place: 'fruktkorgen',  things: 'äpplen'   },
    { place: 'leklådan',     things: 'leksaker' },
    { place: 'garaget',      things: 'cyklar'   },
    { place: 'idrottshallen',things: 'bollar'   },
    { place: 'klassrummet',  things: 'pennor'   },
    { place: 'trädgården',   things: 'blommor'  },
  ];
  const ACTIVITIES = [
    ['Längdhopp','Innebandy','Dans','Schack'],
    ['Fotboll','Simning','Basket','Löpning'],
    ['Målning','Musik','Teater','Pyssel'],
    ['Cykling','Klättring','Yoga','Pingis'],
  ];
  const SHOP_ITEMS = [
    { name: 'fotboll',      price: [30, 50, 80]  },
    { name: 'vattenflaska', price: [10, 15, 20]  },
    { name: 'penna',        price: [5,  10, 15]  },
    { name: 'bok',          price: [40, 60, 90]  },
    { name: 'mössa',        price: [50, 80, 100] },
    { name: 'glass',        price: [10, 15, 25]  },
  ];
  const EMOJI_OBJECTS = ['⚽','🏀','🎾','🏐','🍎','🌟','🐠','🦋','🌸','🎈'];
  const BALL_COLORS   = ['🔵','🔴','🟢','🟡','🟠','🟣'];
  const STAT_COLORS   = ['#9333ea','#f59e0b','#3b82f6','#f472b6'];

  const QUESTION_ORDER = [
    'tableChart','pieChart','addText','clock','placeValue',
    'truefalseProb','subText','multiChoice','volume','mulContext',
    'orderNum','ballBags','backwards','fillSign','timeUnits',
    'doubleRest','halfSub','moneyBack','addWritten','subWritten',
  ];

  const ROOT_ID = 'np-matte-skriftlig-root';

  /* ── Helpers ─────────────────────────────────────────────── */
  const rnd  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = arr => arr[rnd(0, arr.length - 1)];
  const shuffle = arr => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = rnd(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const esc = str => String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const root = () => document.getElementById(ROOT_ID);

  /* ── Init ────────────────────────────────────────────────── */
  function init(p) {
    profile = p;
    showStartScreen();
  }

  /* ── Start screen ────────────────────────────────────────── */
  function showStartScreen() {
    root().innerHTML = `
      <div class="app-header" style="border-bottom-color:rgba(37,99,235,0.2)">
        <button class="btn-back" style="background:#eff6ff;color:#2563eb"
          onclick="NationellaHub.showMatteSelect()">Tillbaka</button>
        <span class="header-title" style="color:#2563eb">✏️ Skriftlig del</span>
        <div style="width:80px"></div>
      </div>
      <div style="padding:var(--space-6);display:flex;flex-direction:column;align-items:center;gap:var(--space-5);text-align:center">
        <div style="font-size:4rem;animation:bounce-in 0.6s var(--ease-bounce)">📝</div>
        <div style="font-family:var(--font-heading);font-size:var(--text-3xl);color:#2563eb">
          Skriftlig del – Åk 3
        </div>
        <div style="font-size:var(--text-base);color:var(--color-text-muted);font-weight:700;max-width:300px;line-height:1.5">
          20 uppgifter från riktiga nationella prov. Tabeller, diagram, klockan, och mer! 🎯
        </div>
        <div class="player-banner" style="width:100%;max-width:320px">
          <div class="avatar avatar-lg">${esc(profile.avatar)}</div>
          <div class="player-info">
            <div class="player-name">${esc(profile.name)}</div>
            <div class="player-tagline">Redo att visa vad du kan? 💪</div>
          </div>
        </div>
        <button class="btn btn-primary w-full" style="max-width:320px;background:linear-gradient(135deg,#2563eb,#06b6d4);margin-top:var(--space-2)"
          onclick="NpMatteSkriftlig.startGame()">
          Starta provet! 🚀
        </button>
      </div>`;
  }

  /* ── Start game ──────────────────────────────────────────── */
  function startGame() {
    App.Sound.play('click');
    questions = generateQuestions();
    qIndex = 0;
    score  = 0;
    showQuestion();
  }

  function generateQuestions() {
    return QUESTION_ORDER.map(cat => generateQuestion(cat));
  }

  /* ── Show question ───────────────────────────────────────── */
  function showQuestion() {
    if (qIndex >= questions.length) { showResults(); return; }
    currentQ = questions[qIndex];
    attempts = 0;
    inputLocked = false;
    resetAnswerState();

    root().innerHTML = buildQuestionLayout();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setupCanvas();
        renderVisual(currentQ);
        renderAnswerArea(currentQ);
      });
    });
  }

  function buildQuestionLayout() {
    const pct = Math.round((qIndex / questions.length) * 100);
    return `
      <style id="nps-rs">
        #screen-np-matte-skriftlig,
        #np-matte-skriftlig-root {
          max-width:100%!important; width:100%!important;
          height:100%; display:flex; flex-direction:column; overflow:hidden;
        }
        #nps-hdr {
          display:flex; align-items:center; gap:8px; flex-shrink:0;
          padding:5px 10px; border-bottom:1px solid rgba(37,99,235,0.15); min-height:44px;
        }
        #nps-hdr .hdr-cat { flex:1; text-align:center; font-weight:800; font-size:13px; color:#2563eb; }
        #nps-prog-wrap { width:72px; height:6px; border-radius:3px; background:rgba(37,99,235,0.15); overflow:hidden; flex-shrink:0; }
        #nps-prog-fill { height:100%; border-radius:3px; background:linear-gradient(90deg,#2563eb,#06b6d4); transition:width 0.4s; }
        #nps-main {
          flex:1; display:grid; grid-template-columns:55fr 45fr;
          padding:8px; gap:8px; overflow:hidden; min-height:0; height:100%;
        }
        #nps-left-col {
          display:flex; flex-direction:column; gap:8px; overflow-y:auto; min-height:0;
        }
        #nps-visual-panel {
          background:rgba(255,255,255,0.85); border-radius:var(--radius-lg);
          padding:10px; border:1.5px solid rgba(37,99,235,0.12); flex-shrink:0;
        }
        #nps-scratch-panel {
          background:rgba(255,255,255,0.85); border-radius:var(--radius-lg);
          padding:8px; border:1.5px solid rgba(37,99,235,0.12);
          display:flex; flex-direction:column; gap:5px; height:100%; min-height:0;
        }
        #nps-canvas {
          flex:1; width:100%; display:block;
          touch-action:none; cursor:crosshair;
          border-radius:var(--radius-md); border:1.5px dashed rgba(37,99,235,0.25);
          background:#f8fbff;
        }
        .nps-tool-btn {
          flex:1; height:30px; border-radius:var(--radius-md); font-weight:800;
          font-size:11px; cursor:pointer; border:1.5px solid rgba(37,99,235,0.3); transition:all 0.15s;
        }
        .nps-tool-btn.active       { background:#2563eb; color:#fff; border-color:#2563eb; }
        .nps-tool-btn:not(.active) { background:#eff6ff; color:#2563eb; }
        #nps-bottom { flex-shrink:0; display:flex; flex-direction:column; gap:5px; }
        .nps-question-text { font-size:var(--text-base); font-weight:800; color:var(--color-text); padding:4px 6px; line-height:1.4; }
        .nps-choice-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
        .nps-choice-btn {
          height:46px; border-radius:var(--radius-md); background:rgba(255,255,255,0.9);
          border:2px solid rgba(37,99,235,0.22); color:#1e3a8a;
          font-size:var(--text-base); font-weight:800; cursor:pointer;
          transition:all 0.15s; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding:0 8px;
        }
        .nps-choice-btn:hover, .nps-choice-btn:active { background:rgba(37,99,235,0.1); }
        .nps-numpad-grid { display:grid; grid-template-columns:repeat(3,52px); gap:5px; justify-content:center; }
        .nps-numpad-btn {
          width:52px; height:52px; border-radius:var(--radius-full);
          font-size:var(--text-lg); font-weight:900; cursor:pointer;
          box-shadow:var(--shadow-sm); transition:transform 0.1s;
        }
        #nps-npad-display {
          font-size:var(--text-4xl); font-weight:900; color:#1e3a8a; min-height:52px;
          display:flex; align-items:center; justify-content:center;
          background:rgba(255,255,255,0.9); border-radius:var(--radius-lg);
          border:2.5px solid rgba(37,99,235,0.3); width:100%; letter-spacing:0.05em;
        }
        #nps-feedback { min-height:0; }
      </style>

      <!-- Compact header -->
      <div id="nps-hdr">
        <button class="btn-back" style="background:#eff6ff;color:#2563eb;flex-shrink:0;padding:4px 10px;font-size:13px"
          onclick="NpMatteSkriftlig.confirmBack()">Avsluta</button>
        <div class="hdr-cat">${getCategoryEmoji(currentQ.cat)} ${getCategoryLabel(currentQ.cat)}</div>
        <span style="font-size:11px;font-weight:800;color:#2563eb;flex-shrink:0">${qIndex+1}/${questions.length}</span>
        <div id="nps-prog-wrap"><div id="nps-prog-fill" style="width:${pct}%"></div></div>
      </div>

      <!-- Main: left col = question+answers, right col = canvas -->
      <div id="nps-main">

        <!-- Left column: question, visual, answer area, feedback -->
        <div id="nps-left-col">
          <div id="nps-visual-panel">
            <div style="font-size:11px;font-weight:800;color:#2563eb;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;opacity:0.7">
              ${getCategoryLabel(currentQ.cat)}
            </div>
            <div style="font-size:var(--text-base);font-weight:800;color:var(--color-text);line-height:1.4;margin-bottom:8px">
              ${currentQ.question}
            </div>
            <div id="nps-visual"></div>
            <div id="nps-hint" style="display:none;margin-top:6px;padding:8px 10px;background:#eff6ff;border-radius:var(--radius-md);border:1.5px solid rgba(37,99,235,0.2);font-size:var(--text-sm);font-weight:700;color:#1d4ed8">
              💡 ${esc(currentQ.hint || '')}
            </div>
          </div>
          <div id="nps-bottom">
            <div id="nps-answer-area"></div>
            <div id="nps-feedback"></div>
          </div>
        </div>

        <!-- Right column: canvas full height -->
        <div id="nps-scratch-panel">
          <div style="font-size:10px;font-weight:800;color:#2563eb;text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0">✏️ Kladd</div>
          <canvas id="nps-canvas"></canvas>
          <div style="display:flex;gap:5px;flex-shrink:0">
            <button id="nps-tool-draw" class="nps-tool-btn active" onclick="NpMatteSkriftlig.toggleEraser(false)">🖊️ Rita</button>
            <button id="nps-tool-erase" class="nps-tool-btn" onclick="NpMatteSkriftlig.toggleEraser(true)">🧹 Sudd</button>
            <button class="nps-tool-btn" onclick="NpMatteSkriftlig.clearCanvas()">🗑️ Rensa</button>
          </div>
        </div>

      </div>
    `;
  }

  /* ── Canvas ──────────────────────────────────────────────── */
  function setupCanvas() {
    canvas = document.getElementById('nps-canvas');
    if (!canvas) return;
    erasing = false;

    requestAnimationFrame(() => {
      const rect = canvas.getBoundingClientRect();
      canvas.width  = rect.width  || 300;
      canvas.height = rect.height || 160;
      ctx = canvas.getContext('2d');

      canvas.addEventListener('pointerdown', onPD);
      canvas.addEventListener('pointermove', onPM);
      canvas.addEventListener('pointerup',   onPU);
      canvas.addEventListener('pointercancel', onPU);
    });
  }

  function onPD(e) {
    e.preventDefault();
    drawing = true;
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width;
    const sy = canvas.height / r.height;
    lastX = (e.clientX - r.left) * sx;
    lastY = (e.clientY - r.top)  * sy;
    canvas.setPointerCapture(e.pointerId);
  }
  function onPM(e) {
    if (!drawing) return;
    e.preventDefault();
    const r  = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width;
    const sy = canvas.height / r.height;
    const x  = (e.clientX - r.left) * sx;
    const y  = (e.clientY - r.top)  * sy;
    ctx.save();
    if (erasing) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 24;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = Math.max(1.5, (e.pressure || 0.5) * 3);
      ctx.strokeStyle = '#1e3a8a';
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();
    lastX = x; lastY = y;
  }
  function onPU(e) { drawing = false; }

  function toggleEraser(enable) {
    erasing = enable;
    const drawBtn  = document.getElementById('nps-tool-draw');
    const eraseBtn = document.getElementById('nps-tool-erase');
    if (drawBtn)  drawBtn.className  = 'nps-tool-btn' + (enable ? '' : ' active');
    if (eraseBtn) eraseBtn.className = 'nps-tool-btn' + (enable ? ' active' : '');
  }
  function clearCanvas() {
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /* ── Reset answer state ──────────────────────────────────── */
  function resetAnswerState() {
    npadValue   = '';
    tfAnswers   = {};
    mcSelected  = new Set();
    mfValues    = [];
    mfActiveIdx = 0;
    orderPlaced = [];
    orderPool   = [];
    matchLeft   = null;
    matchPairs  = {};
    fillAnswers = [];
  }

  /* ══════════════════════════════════════════════════════════
     VISUAL RENDERERS
  ══════════════════════════════════════════════════════════ */
  function renderVisual(q) {
    const el = document.getElementById('nps-visual');
    if (!el) return;
    switch (q.cat) {
      case 'tableChart':    el.innerHTML = renderTableAndBar(q.data);  break;
      case 'pieChart':      el.innerHTML = renderPieAndTable(q.data);  break;
      case 'truefalseProb': el.innerHTML = renderColoredObjects(q.data); break;
      case 'ballBags':      el.innerHTML = renderBags(q.data);         break;
      case 'multiChoice':   el.innerHTML = renderGroupedObjects(q.data); break;
      case 'clock':         el.innerHTML = renderClockSVG(q.data.hour, q.data.min); break;
      default: el.innerHTML = ''; break;
    }
  }

  function renderTableAndBar(data) {
    const { names, values, unit } = data;
    const maxVal = Math.max(...values);
    const scale  = 120 / maxVal;
    const barW   = Math.min(40, Math.floor(280 / names.length) - 8);

    let rows = names.map((n, i) =>
      `<tr><td style="padding:2px 8px;font-weight:700">${esc(n)}</td>
           <td style="padding:2px 8px;text-align:right;font-weight:800">${values[i]}</td></tr>`
    ).join('');

    let bars = names.map((n, i) => {
      const h = Math.round(values[i] * scale);
      return `
        <g>
          <rect x="${i*(barW+8)}" y="${120-h}" width="${barW}" height="${h}"
            fill="${STAT_COLORS[i % STAT_COLORS.length]}" rx="4"/>
          <text x="${i*(barW+8)+barW/2}" y="135" text-anchor="middle"
            font-size="11" fill="#555" font-weight="700">${esc(n.split(' ')[0])}</text>
          <text x="${i*(barW+8)+barW/2}" y="${120-h-5}" text-anchor="middle"
            font-size="10" fill="#333" font-weight="800">${values[i]}</text>
        </g>`;
    }).join('');

    const svgW = names.length * (barW + 8) + 20;

    return `
      <div style="display:flex;gap:var(--space-4);align-items:flex-start;flex-wrap:wrap">
        <table style="border-collapse:collapse;font-size:var(--text-sm);background:rgba(255,255,255,0.8);
          border-radius:var(--radius-md);overflow:hidden;border:1px solid rgba(37,99,235,0.15)">
          <thead><tr style="background:rgba(37,99,235,0.1)">
            <th style="padding:4px 8px;text-align:left;font-size:var(--text-xs)">Namn</th>
            <th style="padding:4px 8px;text-align:right;font-size:var(--text-xs)">${esc(unit||'antal')}</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <svg width="${svgW}" height="145" style="overflow:visible">
          <line x1="0" y1="120" x2="${svgW}" y2="120" stroke="#ccc" stroke-width="1.5"/>
          ${bars}
        </svg>
      </div>`;
  }

  function renderPieAndTable(data) {
    const { activities, counts, total } = data;
    const cx = 70, cy = 70, r = 62;
    let angle = -Math.PI / 2;
    let slices = '';
    counts.forEach((c, i) => {
      const sweep = (c / total) * 2 * Math.PI;
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      angle += sweep;
      const x2 = cx + r * Math.cos(angle);
      const y2 = cy + r * Math.sin(angle);
      const large = sweep > Math.PI ? 1 : 0;
      slices += `<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)}
        A${r},${r} 0 ${large},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z"
        fill="${STAT_COLORS[i]}" stroke="#fff" stroke-width="2"/>`;
    });

    const legend = activities.map((a, i) =>
      `<tr><td><span style="display:inline-block;width:12px;height:12px;border-radius:3px;
        background:${STAT_COLORS[i]};margin-right:4px;vertical-align:middle"></span>${esc(a)}</td>
       <td style="text-align:right;font-weight:800">${counts[i]}</td></tr>`
    ).join('');

    return `
      <div style="display:flex;gap:var(--space-5);align-items:flex-start;flex-wrap:wrap">
        <svg width="140" height="140" style="border-radius:50%;overflow:visible">
          ${slices}
        </svg>
        <table style="border-collapse:collapse;font-size:var(--text-sm);background:rgba(255,255,255,0.8);
          border-radius:var(--radius-md);overflow:hidden;border:1px solid rgba(37,99,235,0.15)">
          <thead><tr style="background:rgba(37,99,235,0.1)">
            <th style="padding:4px 8px;text-align:left;font-size:var(--text-xs)">Aktivitet</th>
            <th style="padding:4px 8px;text-align:right;font-size:var(--text-xs)">Elever</th>
          </tr></thead>
          <tbody>${legend}</tbody>
        </table>
      </div>`;
  }

  function renderClockSVG(hour, min) {
    const cx = 80, cy = 80, r = 72;
    const toRad = deg => deg * Math.PI / 180;
    const minAngle  = (min / 60) * 360 - 90;
    const hourAngle = ((hour % 12) + min / 60) / 12 * 360 - 90;

    const minX  = cx + 60 * Math.cos(toRad(minAngle));
    const minY  = cy + 60 * Math.sin(toRad(minAngle));
    const hourX = cx + 38 * Math.cos(toRad(hourAngle));
    const hourY = cy + 38 * Math.sin(toRad(hourAngle));

    let nums = '';
    for (let n = 1; n <= 12; n++) {
      const a = (n / 12) * 360 - 90;
      const nx = cx + 58 * Math.cos(toRad(a));
      const ny = cy + 58 * Math.sin(toRad(a));
      nums += `<text x="${nx.toFixed(1)}" y="${ny.toFixed(1)}" text-anchor="middle"
        dominant-baseline="middle" font-size="11" font-weight="800" fill="#1e3a8a">${n}</text>`;
    }
    let ticks = '';
    for (let t = 0; t < 60; t++) {
      const a  = (t / 60) * 360 - 90;
      const ri = t % 5 === 0 ? r - 8 : r - 4;
      const x1 = cx + r * Math.cos(toRad(a));
      const y1 = cy + r * Math.sin(toRad(a));
      const x2 = cx + ri * Math.cos(toRad(a));
      const y2 = cy + ri * Math.sin(toRad(a));
      ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
        stroke="#93c5fd" stroke-width="${t%5===0?2:1}"/>`;
    }

    return `
      <svg width="160" height="160" style="margin:0 auto;display:block">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#f0f9ff" stroke="#3b82f6" stroke-width="3"/>
        ${ticks}${nums}
        <line x1="${cx}" y1="${cy}" x2="${hourX.toFixed(1)}" y2="${hourY.toFixed(1)}"
          stroke="#1e3a8a" stroke-width="5" stroke-linecap="round"/>
        <line x1="${cx}" y1="${cy}" x2="${minX.toFixed(1)}" y2="${minY.toFixed(1)}"
          stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
        <circle cx="${cx}" cy="${cy}" r="5" fill="#1e3a8a"/>
      </svg>`;
  }

  function renderColoredObjects(data) {
    const { counts, colors, emoji } = data;
    let html = '<div style="display:flex;gap:var(--space-3);flex-wrap:wrap;margin-bottom:var(--space-2)">';
    counts.forEach((c, i) => {
      for (let j = 0; j < c; j++) {
        html += `<span style="font-size:1.6rem">${emoji[i]}</span>`;
      }
    });
    html += '</div>';
    html += '<div style="font-size:var(--text-sm);font-weight:700;color:#555">';
    counts.forEach((c, i) => {
      html += `<span style="margin-right:var(--space-3)">${emoji[i]} = ${c} st</span>`;
    });
    html += '</div>';
    return html;
  }

  function renderGroupedObjects(data) {
    const { groups, perGroup, emoji } = data;
    let html = '<div style="display:flex;gap:var(--space-3);flex-wrap:wrap">';
    for (let g = 0; g < groups; g++) {
      html += `<div style="border:2px solid rgba(37,99,235,0.3);border-radius:var(--radius-md);
        padding:var(--space-2);display:flex;flex-wrap:wrap;gap:2px;max-width:${perGroup*28+12}px">`;
      for (let i = 0; i < perGroup; i++) {
        html += `<span style="font-size:1.4rem">${emoji}</span>`;
      }
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function renderBags(data) {
    const { bags } = data; // bags = [{label, contents:[{color,count}]}]
    let html = '<div style="display:flex;gap:var(--space-4);flex-wrap:wrap">';
    bags.forEach(bag => {
      html += `<div style="text-align:center">
        <div style="border:2px solid rgba(37,99,235,0.3);border-radius:var(--radius-xl);
          padding:var(--space-3);background:rgba(255,255,255,0.8);min-width:70px;
          display:flex;flex-wrap:wrap;gap:2px;justify-content:center;max-width:90px">`;
      bag.contents.forEach(({color, count}) => {
        for (let i = 0; i < count; i++) {
          html += `<span style="font-size:1.2rem">${color}</span>`;
        }
      });
      html += `</div>
        <div style="font-weight:800;font-size:var(--text-sm);color:#2563eb;margin-top:4px">${esc(bag.label)}</div>
      </div>`;
    });
    html += '</div>';
    return html;
  }

  /* ══════════════════════════════════════════════════════════
     ANSWER AREA RENDERERS
  ══════════════════════════════════════════════════════════ */
  function renderAnswerArea(q) {
    const el = document.getElementById('nps-answer-area');
    if (!el) return;
    switch (q.answerType) {
      case 'free':        el.innerHTML = buildNumpad(); break;
      case 'choice':      el.innerHTML = buildChoices(q); break;
      case 'truefalse':   el.innerHTML = buildTrueFalse(q); break;
      case 'multi-choice':el.innerHTML = buildMultiChoice(q); break;
      case 'multi-free':  el.innerHTML = buildMultiFree(q); break;
      case 'order':       el.innerHTML = buildOrder(q); break;
      case 'fillSign':    el.innerHTML = buildFillSign(q); break;
      case 'match':       el.innerHTML = buildMatch(q); break;
    }
  }

  /* ── Numpad ─────────────────────────────────────────────── */
  function buildNumpad(id = 'nps-numpad') {
    const keys = ['7','8','9','4','5','6','1','2','3','⌫','0','✓'];
    return `
      <div style="display:flex;flex-direction:column;gap:5px">
        <div id="nps-npad-display">${npadValue || '...'}</div>
        <div class="nps-numpad-grid" id="${id}">
          ${keys.map(k => `
            <button class="nps-numpad-btn" style="
              background:${k==='✓'?'linear-gradient(135deg,#2563eb,#06b6d4)':k==='⌫'?'linear-gradient(135deg,#fca5a5,#f87171)':'rgba(255,255,255,0.9)'};
              color:${k==='✓'||k==='⌫'?'white':'#1e3a8a'};
              border:2px solid ${k==='✓'?'#2563eb':k==='⌫'?'#ef4444':'rgba(37,99,235,0.2)'};
            "
              onpointerdown="this.style.transform='scale(0.91)'"
              onpointerup="this.style.transform=''"
              onclick="NpMatteSkriftlig.npadPress('${k}')">
              ${k}
            </button>
          `).join('')}
        </div>
      </div>`;
  }

  function submitFree() {
    if (inputLocked) return;
    inputLocked = true;
    if (!npadValue) { inputLocked = false; return; }
    handleAnswer(parseInt(npadValue, 10));
  }

  /* ── Choice ─────────────────────────────────────────────── */
  function buildChoices(q) {
    return `<div class="nps-choice-grid">` +
      q.choices.map((c, i) =>
        `<button class="nps-choice-btn" id="nps-choice-${i}"
          onclick="NpMatteSkriftlig.submitChoice(${i})">${esc(String(c))}</button>`
      ).join('') + '</div>';
  }

  function submitChoice(i) {
    if (inputLocked) return;
    inputLocked = true;
    handleAnswer(i);
  }

  /* ── True/False ──────────────────────────────────────────── */
  function buildTrueFalse(q) {
    let html = '<div style="display:flex;flex-direction:column;gap:var(--space-3)">';
    q.statements.forEach((s, i) => {
      html += `
        <div style="background:rgba(255,255,255,0.85);border-radius:var(--radius-md);
          padding:var(--space-3);border:1.5px solid rgba(37,99,235,0.15)">
          <div style="font-weight:700;font-size:var(--text-sm);margin-bottom:var(--space-2)">${esc(s)}</div>
          <div style="display:flex;gap:var(--space-2)">
            <button onclick="NpMatteSkriftlig.tfPick(${i},'sant')" id="nps-tf-${i}-sant"
              style="flex:1;padding:var(--space-2);border-radius:var(--radius-md);border:2px solid #22c55e;
              background:transparent;color:#16a34a;font-weight:800;cursor:pointer">✓ Sant</button>
            <button onclick="NpMatteSkriftlig.tfPick(${i},'falskt')" id="nps-tf-${i}-falskt"
              style="flex:1;padding:var(--space-2);border-radius:var(--radius-md);border:2px solid #f87171;
              background:transparent;color:#dc2626;font-weight:800;cursor:pointer">✗ Falskt</button>
          </div>
        </div>`;
    });
    html += `</div>
      <button onclick="NpMatteSkriftlig.submitTrueFalse()" id="nps-tf-confirm"
        style="margin-top:var(--space-3);width:100%;padding:var(--space-3);
        border-radius:var(--radius-md);border:none;background:rgba(37,99,235,0.15);
        color:#1e3a8a;font-weight:800;font-size:var(--text-base);cursor:pointer;
        opacity:0.5" disabled>Bekräfta svar</button>`;
    return html;
  }

  function tfPick(i, val) {
    tfAnswers[i] = val;
    ['sant','falskt'].forEach(v => {
      const btn = document.getElementById(`nps-tf-${i}-${v}`);
      if (btn) {
        btn.style.background = v === val ? (v === 'sant' ? '#22c55e' : '#f87171') : 'transparent';
        btn.style.color      = v === val ? '#fff' : (v === 'sant' ? '#16a34a' : '#dc2626');
      }
    });
    const confirm = document.getElementById('nps-tf-confirm');
    if (confirm && Object.keys(tfAnswers).length === currentQ.statements.length) {
      confirm.style.opacity = '1';
      confirm.removeAttribute('disabled');
      confirm.style.background = 'linear-gradient(135deg,#2563eb,#06b6d4)';
      confirm.style.color = '#fff';
    }
  }

  function submitTrueFalse() {
    if (inputLocked) return;
    inputLocked = true;
    handleAnswer(tfAnswers);
  }

  /* ── Multi-choice ────────────────────────────────────────── */
  function buildMultiChoice(q) {
    const needed = q.correctCount || 3;
    let html = `<div style="font-size:var(--text-sm);font-weight:800;color:#2563eb;margin-bottom:var(--space-2)">
      Välj ${needed} alternativ:</div>
      <div style="display:flex;flex-direction:column;gap:var(--space-2)">`;
    q.choices.forEach((c, i) => {
      html += `<button onclick="NpMatteSkriftlig.mcToggle(${i},${needed})" id="nps-mc-${i}"
        style="padding:var(--space-3);border-radius:var(--radius-md);border:2px solid rgba(37,99,235,0.25);
        background:rgba(255,255,255,0.85);font-size:var(--text-base);font-weight:800;
        color:#1e3a8a;cursor:pointer;text-align:left">${esc(String(c))}</button>`;
    });
    html += `</div>
      <button onclick="NpMatteSkriftlig.submitMultiChoice()" id="nps-mc-confirm"
        style="margin-top:var(--space-3);width:100%;padding:var(--space-3);
        border-radius:var(--radius-md);border:none;background:rgba(37,99,235,0.15);
        color:#1e3a8a;font-weight:800;font-size:var(--text-base);cursor:pointer;
        opacity:0.5" disabled>Bekräfta svar</button>`;
    return html;
  }

  function mcToggle(i, needed) {
    const btn = document.getElementById(`nps-mc-${i}`);
    if (!btn) return;
    if (mcSelected.has(i)) {
      mcSelected.delete(i);
      btn.style.background = 'rgba(255,255,255,0.85)';
      btn.style.borderColor = 'rgba(37,99,235,0.25)';
      btn.style.color = '#1e3a8a';
    } else {
      if (mcSelected.size >= needed) return;
      mcSelected.add(i);
      btn.style.background = '#2563eb';
      btn.style.borderColor = '#2563eb';
      btn.style.color = '#fff';
    }
    const confirm = document.getElementById('nps-mc-confirm');
    if (confirm) {
      const ready = mcSelected.size === needed;
      confirm.style.opacity = ready ? '1' : '0.5';
      if (ready) { confirm.removeAttribute('disabled'); confirm.style.background='linear-gradient(135deg,#2563eb,#06b6d4)'; confirm.style.color='#fff'; }
      else { confirm.setAttribute('disabled',''); confirm.style.background='rgba(37,99,235,0.15)'; confirm.style.color='#1e3a8a'; }
    }
  }

  function submitMultiChoice() {
    if (inputLocked) return;
    inputLocked = true;
    handleAnswer([...mcSelected].sort((a,b)=>a-b));
  }

  /* ── Multi-free ──────────────────────────────────────────── */
  function buildMultiFree(q) {
    mfValues = new Array(q.fields.length).fill('');
    mfActiveIdx = 0;
    let tableHtml = `<table style="border-collapse:collapse;margin-bottom:var(--space-3);width:100%;
      background:rgba(255,255,255,0.85);border-radius:var(--radius-md);overflow:hidden;
      border:1.5px solid rgba(37,99,235,0.15)"><thead><tr>`;
    q.fields.forEach(f => { tableHtml += `<th style="padding:6px 12px;font-size:var(--text-sm);background:rgba(37,99,235,0.08)">${esc(f.label)}</th>`; });
    tableHtml += '</tr></thead><tbody><tr>';
    q.fields.forEach((f, i) => {
      tableHtml += `<td style="padding:8px;text-align:center">
        <div id="nps-mf-cell-${i}" onclick="NpMatteSkriftlig.mfFocus(${i})"
          style="min-width:60px;height:44px;border-radius:var(--radius-md);border:2px solid rgba(37,99,235,0.3);
          background:${i===0?'rgba(37,99,235,0.08)':'#fff'};display:flex;align-items:center;
          justify-content:center;font-size:var(--text-xl);font-weight:900;color:#1e3a8a;cursor:pointer">
          ${f.prefilled !== undefined ? f.prefilled : '...'}
        </div></td>`;
    });
    tableHtml += '</tr></tbody></table>';

    // Mark prefilled
    q.fields.forEach((f, i) => { if (f.prefilled !== undefined) mfValues[i] = String(f.prefilled); });

    // Find first editable
    mfActiveIdx = q.fields.findIndex(f => f.prefilled === undefined);
    if (mfActiveIdx < 0) mfActiveIdx = 0;

    return tableHtml + buildNumpad('nps-mf-numpad') +
      `<button onclick="NpMatteSkriftlig.submitMultiFree()"
        style="margin-top:var(--space-3);width:100%;padding:var(--space-3);border-radius:var(--radius-md);
        border:none;background:linear-gradient(135deg,#2563eb,#06b6d4);color:#fff;font-weight:800;cursor:pointer">
        Bekräfta svar ✓</button>`;
  }

  function mfFocus(i) {
    if (currentQ.fields[i].prefilled !== undefined) return;
    mfActiveIdx = i;
    currentQ.fields.forEach((f, j) => {
      const cell = document.getElementById(`nps-mf-cell-${j}`);
      if (cell && f.prefilled === undefined) {
        cell.style.background = j === i ? 'rgba(37,99,235,0.08)' : '#fff';
      }
    });
    const disp = document.getElementById('nps-npad-display');
    if (disp) disp.textContent = mfValues[i] || '...';
  }

  function npadPress(key) {
    if (key === '✓') { if (inputLocked) return; submitFree(); return; }
    if (currentQ && currentQ.answerType === 'multi-free') {
      const f = currentQ.fields[mfActiveIdx];
      if (f && f.prefilled !== undefined) return;
      if (key === '⌫') {
        mfValues[mfActiveIdx] = (mfValues[mfActiveIdx] || '').slice(0, -1);
      } else if ((mfValues[mfActiveIdx] || '').length < 4) {
        mfValues[mfActiveIdx] = (mfValues[mfActiveIdx] || '') + key;
      }
      const cell = document.getElementById(`nps-mf-cell-${mfActiveIdx}`);
      if (cell) cell.textContent = mfValues[mfActiveIdx] || '...';
      const disp = document.getElementById('nps-npad-display');
      if (disp) disp.textContent = mfValues[mfActiveIdx] || '...';
    } else {
      if (key === '⌫') {
        npadValue = npadValue.slice(0, -1);
      } else if (npadValue.length < 6) {
        npadValue += key;
      }
      const disp = document.getElementById('nps-npad-display');
      if (disp) disp.textContent = npadValue || '...';
    }
  }

  function submitMultiFree() {
    if (inputLocked) return;
    inputLocked = true;
    handleAnswer(mfValues.map(v => parseInt(v, 10)));
  }

  /* ── Order ───────────────────────────────────────────────── */
  function buildOrder(q) {
    orderPool   = [...q.numbers];
    orderPlaced = [];
    return renderOrderUI(q);
  }

  function renderOrderUI(q) {
    const slots = q.numbers.length;
    let pool = '<div style="display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-3)">';
    q.numbers.forEach((n, i) => {
      const placed = orderPlaced.includes(n) && orderPlaced.filter(x=>x===n).length >= orderPool.filter(x=>x===n).length;
      pool += `<button onclick="NpMatteSkriftlig.orderPick(${n})" id="nps-ord-pool-${i}"
        style="padding:var(--space-2) var(--space-4);border-radius:var(--radius-md);
        border:2px solid ${placed?'rgba(37,99,235,0.1)':'rgba(37,99,235,0.3)'};
        background:${placed?'rgba(200,200,200,0.2)':'rgba(255,255,255,0.85)'};
        font-size:var(--text-xl);font-weight:900;color:${placed?'#aaa':'#1e3a8a'};cursor:pointer">
        ${n}</button>`;
    });
    pool += '</div>';

    let placed = '<div style="display:flex;gap:var(--space-2);align-items:center;margin-bottom:var(--space-3)">';
    placed += '<span style="font-size:var(--text-xs);font-weight:800;color:#555;white-space:nowrap">Minst →</span>';
    for (let i = 0; i < slots; i++) {
      placed += `<div id="nps-ord-slot-${i}" style="width:52px;height:52px;border-radius:var(--radius-md);
        border:2px dashed rgba(37,99,235,0.3);background:rgba(37,99,235,0.04);
        display:flex;align-items:center;justify-content:center;font-size:var(--text-lg);font-weight:900;color:#1e3a8a">
        ${orderPlaced[i] !== undefined ? orderPlaced[i] : ''}</div>`;
    }
    placed += '<span style="font-size:var(--text-xs);font-weight:800;color:#555;white-space:nowrap">→ Störst</span>';
    placed += '</div>';

    return pool + placed +
      `<div style="display:flex;gap:var(--space-3)">
        <button onclick="NpMatteSkriftlig.orderUndo()"
          style="flex:1;padding:var(--space-2);border-radius:var(--radius-md);border:2px solid rgba(37,99,235,0.2);
          background:transparent;color:#2563eb;font-weight:800;cursor:pointer">↩ Ångra</button>
        <button onclick="NpMatteSkriftlig.submitOrder()" id="nps-ord-confirm"
          style="flex:2;padding:var(--space-2);border-radius:var(--radius-md);border:none;
          background:linear-gradient(135deg,#2563eb,#06b6d4);color:#fff;font-weight:800;cursor:pointer">
          Bekräfta ✓</button>
      </div>`;
  }

  function orderPick(n) {
    if (orderPlaced.length >= currentQ.numbers.length) return;
    // Check if still available
    const usedCount = orderPlaced.filter(x => x === n).length;
    const totalCount = currentQ.numbers.filter(x => x === n).length;
    if (usedCount >= totalCount) return;
    orderPlaced.push(n);
    refreshOrderUI();
  }

  function orderUndo() {
    if (orderPlaced.length > 0) orderPlaced.pop();
    refreshOrderUI();
  }

  function refreshOrderUI() {
    const el = document.getElementById('nps-answer-area');
    if (el) el.innerHTML = renderOrderUI(currentQ);
  }

  function submitOrder() {
    if (inputLocked) return;
    inputLocked = true;
    if (orderPlaced.length < currentQ.numbers.length) { inputLocked = false; return; }
    handleAnswer([...orderPlaced]);
  }

  /* ── FillSign ────────────────────────────────────────────── */
  function buildFillSign(q) {
    fillAnswers = q.subQuestions.map(() => ({ op1: null, op2: null }));
    let html = '<div style="display:flex;flex-direction:column;gap:var(--space-4)">';
    q.subQuestions.forEach((sq, i) => {
      html += `
        <div style="background:rgba(255,255,255,0.85);border-radius:var(--radius-md);
          padding:var(--space-3);border:1.5px solid rgba(37,99,235,0.15)">
          <div style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-2xl);font-weight:900;color:#1e3a8a;margin-bottom:var(--space-2)">
            <span>${sq.a}</span>
            <div id="nps-fs-${i}-0" onclick="NpMatteSkriftlig.fsSelect(${i},0)"
              style="width:40px;height:40px;border-radius:var(--radius-md);border:2px solid rgba(37,99,235,0.4);
              background:rgba(37,99,235,0.05);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:var(--text-xl)">
              ?</div>
            <span>${sq.b}</span>
            <span>=</span>
            <span>${sq.c}</span>
          </div>
          <div style="display:flex;gap:var(--space-2)">
            ${['+','−','·','÷'].map(sign =>
              `<button onclick="NpMatteSkriftlig.fsSign(${i},'${sign}')"
                style="flex:1;height:40px;border-radius:var(--radius-md);border:2px solid rgba(37,99,235,0.2);
                background:rgba(255,255,255,0.9);font-size:var(--text-lg);font-weight:800;color:#1e3a8a;cursor:pointer">
                ${sign}</button>`
            ).join('')}
          </div>
        </div>`;
    });
    html += '</div>';
    html += `<button onclick="NpMatteSkriftlig.submitFillSign()"
      style="margin-top:var(--space-3);width:100%;padding:var(--space-3);border-radius:var(--radius-md);
      border:none;background:linear-gradient(135deg,#2563eb,#06b6d4);color:#fff;font-weight:800;cursor:pointer">
      Bekräfta svar ✓</button>`;
    return html;
  }

  let fsActiveSlot = { qi: 0, pos: 0 };
  function fsSelect(qi, pos) { fsActiveSlot = { qi, pos }; }
  function fsSign(qi, sign) {
    fillAnswers[qi].op1 = sign;
    const el = document.getElementById(`nps-fs-${qi}-0`);
    if (el) { el.textContent = sign; el.style.background = 'rgba(37,99,235,0.15)'; el.style.color='#2563eb'; }
  }

  function submitFillSign() {
    if (inputLocked) return;
    inputLocked = true;
    handleAnswer(fillAnswers.map(a => a.op1));
  }

  /* ── Match ───────────────────────────────────────────────── */
  function buildMatch(q) {
    matchPairs  = {};
    matchLeft   = null;
    const COLORS = ['#9333ea','#f59e0b','#3b82f6','#f472b6'];
    let html = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-2)">
      <div style="font-size:var(--text-xs);font-weight:800;color:#555;text-align:center;padding-bottom:4px">Räknehändelse</div>
      <div style="font-size:var(--text-xs);font-weight:800;color:#555;text-align:center;padding-bottom:4px">Uttryck</div>`;
    q.events.forEach((ev, i) => {
      html += `<button onclick="NpMatteSkriftlig.matchPickLeft(${i})" id="nps-ml-${i}"
        style="padding:var(--space-2);border-radius:var(--radius-md);border:2px solid rgba(37,99,235,0.2);
        background:rgba(255,255,255,0.85);font-size:var(--text-sm);font-weight:700;color:#1e3a8a;cursor:pointer;text-align:left">
        ${esc(ev)}</button>`;
    });
    q.expressions.forEach((ex, i) => {
      html += `<button onclick="NpMatteSkriftlig.matchPickRight(${i})" id="nps-mr-${i}"
        style="padding:var(--space-2);border-radius:var(--radius-md);border:2px solid rgba(37,99,235,0.2);
        background:rgba(255,255,255,0.85);font-size:var(--text-lg);font-weight:900;color:#1e3a8a;cursor:pointer;text-align:center">
        ${esc(ex)}</button>`;
    });
    html += `</div>
      <button onclick="NpMatteSkriftlig.submitMatch()" id="nps-match-confirm"
        style="margin-top:var(--space-3);width:100%;padding:var(--space-3);border-radius:var(--radius-md);
        border:none;background:linear-gradient(135deg,#2563eb,#06b6d4);color:#fff;font-weight:800;cursor:pointer">
        Bekräfta ✓</button>`;
    return html;
  }

  function matchPickLeft(i) {
    matchLeft = i;
    currentQ.events.forEach((_, j) => {
      const b = document.getElementById(`nps-ml-${j}`);
      if (b) b.style.outline = j===i ? '3px solid #2563eb' : 'none';
    });
  }

  function matchPickRight(i) {
    if (matchLeft === null) return;
    // Remove previous pair for this left
    matchPairs[matchLeft] = i;
    matchLeft = null;
    // Re-color all
    const COLORS = ['#9333ea','#f59e0b','#3b82f6','#f472b6'];
    Object.entries(matchPairs).forEach(([li, ri]) => {
      const lBtn = document.getElementById(`nps-ml-${li}`);
      const rBtn = document.getElementById(`nps-mr-${ri}`);
      const c = COLORS[parseInt(li) % COLORS.length];
      if (lBtn) { lBtn.style.background = c; lBtn.style.color='#fff'; lBtn.style.outline='none'; }
      if (rBtn) { rBtn.style.background = c; rBtn.style.color='#fff'; }
    });
  }

  function submitMatch() {
    if (inputLocked) return;
    inputLocked = true;
    handleAnswer(matchPairs);
  }

  /* ══════════════════════════════════════════════════════════
     ANSWER HANDLING
  ══════════════════════════════════════════════════════════ */
  function handleAnswer(given) {
    attempts++;
    const correct = checkAnswer(currentQ, given);
    if (correct) {
      score++;
      showFeedback(true);
      celebrationBurst();
      setTimeout(() => nextQuestion(), 1400);
    } else if (attempts >= 2) {
      showFeedback(false, true);
      setTimeout(() => nextQuestion(), 2200);
    } else {
      showFeedback(false, false);
    }
  }

  function checkAnswer(q, given) {
    switch (q.answerType) {
      case 'free':
        return parseInt(given, 10) === q.answer;
      case 'choice':
        return given === q.correctIndex;
      case 'truefalse': {
        const keys = Object.keys(given);
        if (keys.length !== q.correctTF.length) return false;
        return q.correctTF.every((v, i) => given[i] === v);
      }
      case 'multi-choice': {
        const arr = [...given].sort((a,b)=>a-b);
        return JSON.stringify(arr) === JSON.stringify(q.correctIndices);
      }
      case 'multi-free': {
        return given.every((v, i) => v === q.answers[i]);
      }
      case 'order':
        return JSON.stringify(given) === JSON.stringify(q.sortedNumbers);
      case 'fillSign':
        return given.every((v, i) => v === q.correctSigns[i]);
      case 'match': {
        const keys = Object.keys(given);
        if (keys.length < q.events.length) return false;
        return q.events.every((_, i) => parseInt(given[i]) === q.correctMatch[i]);
      }
      default: return false;
    }
  }

  function showFeedback(correct, reveal = false) {
    const el = document.getElementById('nps-feedback');
    if (!el) return;
    if (correct) {
      App.Sound.play('correct');
      el.innerHTML = `<div style="text-align:center;font-size:var(--text-xl);font-weight:900;color:#16a34a;animation:bounce-in 0.4s var(--ease-bounce)">
        ✅ Rätt! ${pick(['Bra jobbat! 🌟','Fantastiskt! 🎉','Supersnyggt! 💫','Du är grym! 🦁'])}
      </div>`;
    } else if (reveal) {
      App.Sound.play('wrong');
      const answerText = formatAnswer(currentQ);
      el.innerHTML = `<div style="background:#fef2f2;border-radius:var(--radius-md);padding:var(--space-3);font-size:var(--text-sm);font-weight:700;color:#991b1b;animation:wiggle 0.4s ease">
        ❌ Rätt svar: <strong>${answerText}</strong><br>Bra försök! 💪
      </div>`;
      // Show hint
      const hintEl = document.getElementById('nps-hint');
      if (hintEl) hintEl.style.display = 'block';
    } else {
      App.Sound.play('wrong');
      el.innerHTML = `<div style="text-align:center;font-size:var(--text-base);font-weight:800;color:#dc2626;animation:wiggle 0.4s ease">
        Försök igen! 🤔
      </div>`;
    }
  }

  function formatAnswer(q) {
    switch (q.answerType) {
      case 'free':         return String(q.answer);
      case 'choice':       return String(q.choices[q.correctIndex]);
      case 'truefalse':    return q.correctTF.map((v,i)=>`${i+1}: ${v}`).join(', ');
      case 'multi-choice': return q.correctIndices.map(i=>q.choices[i]).join(', ');
      case 'multi-free':   return q.answers.join(', ');
      case 'order':        return q.sortedNumbers.join(' < ');
      case 'fillSign':     return q.correctSigns.join(', ');
      case 'match':        return q.events.map((e,i)=>`${e} = ${q.expressions[q.correctMatch[i]]}`).join(' | ');
      default:             return '?';
    }
  }

  function nextQuestion() {
    qIndex++;
    showQuestion();
  }

  /* ── Celebrations ────────────────────────────────────────── */
  function celebrationBurst() {
    const type = rnd(0, 5);
    if (typeof App !== 'undefined' && App.Confetti) {
      if (type === 0) App.Confetti.burst(45);
      else if (type === 1) App.Confetti.burst(24);
      else App.Confetti.burst(15);
    }
  }

  /* ── Results ─────────────────────────────────────────────── */
  function showResults() {
    saveStats();
    if (typeof App !== 'undefined' && App.Confetti) App.Confetti.burst(250);
    const pct = Math.round((score / questions.length) * 100);
    const medal = score === questions.length ? '🥇' : score >= questions.length * 0.75 ? '🥈' : score >= questions.length * 0.5 ? '🥉' : '💪';
    const msg   = score === questions.length ? 'Perfekt! Du klarade allt!' :
                  score >= questions.length * 0.75 ? 'Jättebra jobbat!' :
                  score >= questions.length * 0.5 ? 'Bra kämpat!' : 'Fortsätt öva!';

    root().innerHTML = `
      <div class="app-header" style="border-bottom-color:rgba(37,99,235,0.2)">
        <button class="btn-back" style="background:#eff6ff;color:#2563eb"
          onclick="NationellaHub.showMatteSelect()">Tillbaka</button>
        <span class="header-title" style="color:#2563eb">Resultat</span>
        <div style="width:80px"></div>
      </div>
      <div style="padding:var(--space-6);display:flex;flex-direction:column;align-items:center;gap:var(--space-5);text-align:center">
        <div style="font-size:5rem;animation:bounce-in 0.6s var(--ease-bounce)">${medal}</div>
        <div style="font-family:var(--font-heading);font-size:var(--text-3xl);color:#2563eb">${msg}</div>
        <div style="font-size:var(--text-5xl);font-weight:900;color:#1e3a8a">
          ${score}<span style="font-size:var(--text-2xl);opacity:0.6">/${questions.length}</span>
        </div>
        <div style="width:100%;max-width:320px">
          <div style="height:16px;border-radius:var(--radius-full);background:rgba(37,99,235,0.1);overflow:hidden">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#2563eb,#06b6d4);
              border-radius:var(--radius-full);transition:width 1s ease"></div>
          </div>
          <div style="margin-top:4px;font-size:var(--text-sm);font-weight:800;color:#2563eb">${pct}%</div>
        </div>
        <button class="btn btn-primary w-full" style="max-width:320px;background:linear-gradient(135deg,#2563eb,#06b6d4)"
          onclick="NpMatteSkriftlig.startGame()">Spela igen 🔄</button>
        <button class="btn btn-ghost w-full" style="max-width:320px"
          onclick="NationellaHub.showMatteSelect()">Byt modul</button>
      </div>`;
  }

  function saveStats() {
    if (!profile) return;
    const key  = `np_matte_skriftlig_stats_${profile.id}`;
    const prev = JSON.parse(localStorage.getItem(key) || '{"plays":0,"totalScore":0,"bestScore":0}');
    prev.plays++;
    prev.totalScore += score;
    prev.bestScore   = Math.max(prev.bestScore, score);
    localStorage.setItem(key, JSON.stringify(prev));
  }

  function confirmBack() {
    if (confirm('Avsluta provet? Ditt resultat sparas inte.')) {
      root().innerHTML = '';
      NationellaHub.showMatteSelect();
    }
  }

  /* ══════════════════════════════════════════════════════════
     QUESTION GENERATORS
  ══════════════════════════════════════════════════════════ */
  function generateQuestion(cat) {
    switch (cat) {
      case 'tableChart':    return genTableChart();
      case 'pieChart':      return genPieChart();
      case 'addText':       return genAddText();
      case 'clock':         return genClock();
      case 'placeValue':    return genPlaceValue();
      case 'truefalseProb': return genTruefalseProb();
      case 'subText':       return genSubText();
      case 'multiChoice':   return genMultiChoice();
      case 'volume':        return genVolume();
      case 'mulContext':    return genMulContext();
      case 'orderNum':      return genOrderNum();
      case 'ballBags':      return genBallBags();
      case 'backwards':     return genBackwards();
      case 'fillSign':      return genFillSign();
      case 'timeUnits':     return genTimeUnits();
      case 'doubleRest':    return genDoubleRest();
      case 'halfSub':       return genHalfSub();
      case 'moneyBack':     return genMoneyBack();
      case 'addWritten':    return genAddWritten();
      case 'subWritten':    return genSubWritten();
      default: return genAddText();
    }
  }

  /* ── Kat 1: Tabell + stapeldiagram ─────────────────────── */
  function genTableChart() {
    const ctx   = pick(CONTEXTS);
    const namePool = shuffle(NAMES).slice(0, 4);
    const unit  = pick(['klossar','hopp','poäng','pinnar','steg']);
    const values = namePool.map(() => rnd(30, 180));
    const maxIdx = values.indexOf(Math.max(...values));
    const minIdx = values.indexOf(Math.min(...values));

    const variant = rnd(0, 2);
    let question, answer, answerType, choices, correctIndex;

    if (variant === 0) {
      question   = `Vem hade flest ${unit}?`;
      answerType = 'choice';
      choices    = [...namePool];
      correctIndex = maxIdx;
    } else if (variant === 1) {
      question   = `Vem hade färst ${unit}?`;
      answerType = 'choice';
      choices    = [...namePool];
      correctIndex = minIdx;
    } else {
      const i1 = rnd(0, 1), i2 = rnd(2, 3);
      question   = `Hur många ${unit} hade ${namePool[i1]} och ${namePool[i2]} sammanlagt?`;
      answerType = 'free';
      answer     = values[i1] + values[i2];
    }

    return {
      cat: 'tableChart', answerType,
      question, answer, choices, correctIndex,
      hint: `Titta noga på tabellen och diagrammet!`,
      data: { names: namePool, values, unit },
    };
  }

  /* ── Kat 2: Cirkeldiagram ──────────────────────────────── */
  function genPieChart() {
    const acts  = shuffle(pick(ACTIVITIES));
    const total = 24;
    const half  = 12;
    const others= [rnd(2, 5), rnd(2, 5)];
    const last  = total - half - others[0] - others[1];
    const counts = [half, others[0], others[1], last < 1 ? 1 : last];

    const variant = rnd(0, 1);
    let question, answerType, choices, correctIndex, answer;

    if (variant === 0) {
      question     = `Vilken aktivitet valdes av flest elever?`;
      answerType   = 'choice';
      choices      = [...acts];
      correctIndex = counts.indexOf(Math.max(...counts));
    } else {
      question   = `Hur många elever är det totalt?`;
      answerType = 'free';
      answer     = total;
    }

    return {
      cat: 'pieChart', answerType,
      question, choices, correctIndex, answer,
      hint: `Den största sektionen i cirkeln = flest elever.`,
      data: { activities: acts, counts, total },
    };
  }

  /* ── Kat 3: Textuppgift addition ──────────────────────── */
  function genAddText() {
    const ctx = pick(CONTEXTS);
    const a   = rnd(15, 60);
    const b   = rnd(10, 40);
    const ans = a + b;
    const name= pick(NAMES);
    return {
      cat: 'addText', answerType: 'free',
      question: `På ${ctx.place} är det ${a} ${ctx.things}. Det kommer ${b} ${ctx.things} till. Hur många ${ctx.things} är det nu?`,
      answer: ans,
      hint: `Addera: ${a} + ${b} = ?`,
    };
  }

  /* ── Kat 4: Klockan ────────────────────────────────────── */
  function genClock() {
    const hour    = rnd(6, 17);
    const minutes = pick([0, 15, 20, 25, 30, 45]);
    const addMin  = pick([15, 20, 25, 30]);

    const totalMin  = hour * 60 + minutes + addMin;
    const newHour   = Math.floor(totalMin / 60) % 24;
    const newMin    = totalMin % 60;
    const fmtTime   = h => `${h < 10 ? '0' + h : h}:${newMin < 10 ? '0' + newMin : newMin}`;
    const startStr  = `${hour < 10 ? '0'+hour : hour}:${minutes < 10 ? '0'+minutes : minutes}`;
    const endStr    = fmtTime(newHour);

    // Build choices: correct + 3 distractors
    const makeTime = (h, m) => `${h < 10?'0'+h:h}:${m < 10?'0'+m:m}`;
    const wrong = [
      makeTime(newHour, (newMin + 10) % 60),
      makeTime((newHour + 1) % 24, newMin),
      makeTime(newHour, (newMin - 10 + 60) % 60),
    ];
    const allChoices = shuffle([endStr, ...wrong]);
    const correctIndex = allChoices.indexOf(endStr);

    return {
      cat: 'clock', answerType: 'choice',
      question: `Klockan är ${startStr}. Efter ${addMin} minuter, vad är klockan då?`,
      choices: allChoices, correctIndex,
      hint: `Räkna: ${startStr} + ${addMin} minuter.`,
      data: { hour, min: minutes },
    };
  }

  /* ── Kat 5: Taluppfattning ─────────────────────────────── */
  function genPlaceValue() {
    const variant = rnd(0, 2);
    if (variant === 0) {
      const hundreds = rnd(1, 9);
      const tens     = rnd(0, 9);
      const ones     = rnd(0, 9);
      const num      = hundreds * 100 + tens * 10 + ones;
      return {
        cat: 'placeValue', answerType: 'free',
        question: `Vilket tal har ${hundreds} hundratal, ${tens} tiotal och ${ones} ental?`,
        answer: num,
        hint: `Hundratal × 100 + tiotal × 10 + ental.`,
      };
    } else if (variant === 1) {
      const num  = rnd(100, 999);
      const h    = Math.floor(num / 100);
      const t    = Math.floor((num % 100) / 10);
      const e    = num % 10;
      const part = pick(['hundratal','tiotal','ental']);
      const ans  = part === 'hundratal' ? h : part === 'tiotal' ? t : e;
      return {
        cat: 'placeValue', answerType: 'free',
        question: `Talet är ${num}. Hur många ${part} har det?`,
        answer: ans,
        hint: `Titta på rätt siffra i ${num}.`,
      };
    } else {
      const base = rnd(1, 8) * 100;
      const add  = rnd(10, 90);
      const ans  = base + add;
      return {
        cat: 'placeValue', answerType: 'free',
        question: `Vilket tal är ${add} mer än ${base}?`,
        answer: ans,
        hint: `${base} + ${add} = ?`,
      };
    }
  }

  /* ── Kat 6: Sant/Falskt sannolikhet ───────────────────── */
  function genTruefalseProb() {
    const obj   = pick(['kulor','knappar','godisbitar','stenar','löv']);
    const emoji = ['🔵','🔴','🟢'];
    const colors= ['blå','röda','gröna'];

    // Generate counts ensuring no ties for max/min (so störst/minst statements are unambiguous)
    let counts;
    do {
      counts = [rnd(2, 6), rnd(2, 6), rnd(2, 6)];
    } while (
      // retry if max is tied (more than one color shares the highest count)
      counts.filter(c => c === Math.max(...counts)).length > 1 ||
      // retry if min is tied (more than one color shares the lowest count)
      counts.filter(c => c === Math.min(...counts)).length > 1
    );

    const maxI = counts.indexOf(Math.max(...counts));
    const minI = counts.indexOf(Math.min(...counts));

    // "lika stor chans" statement: pick two indices and check if they're equal
    const [cmpI1, cmpI2] = [0, 1]; // always compare blå vs röda
    const likaStort = counts[cmpI1] === counts[cmpI2];

    const stmts = [
      `Det är störst chans att ta en ${colors[maxI]} ${obj.slice(0,-1)}.`,
      `Det är minst chans att ta en ${colors[minI]} ${obj.slice(0,-1)}.`,
      `Det är lika stor chans att ta ${colors[cmpI1]} som ${colors[cmpI2]}.`,
      `Det är störst chans att ta en ${colors[minI]} ${obj.slice(0,-1)}.`,
    ];
    const correct = [
      'sant',   // strict max → always true after loop guard
      'sant',   // strict min → always true after loop guard
      likaStort ? 'sant' : 'falskt',
      'falskt', // minI does NOT have the most → always false
    ];

    return {
      cat: 'truefalseProb', answerType: 'truefalse',
      question: `Det finns ${counts[0]} ${colors[0]}, ${counts[1]} ${colors[1]} och ${counts[2]} ${colors[2]} ${obj}. Svara sant eller falskt:`,
      statements: stmts,
      correctTF: correct,
      hint: `Fler = störst chans. Färre = minst chans.`,
      data: { counts, colors, emoji },
    };
  }

  /* ── Kat 7: Textuppgift subtraktion ───────────────────── */
  function genSubText() {
    // Use context-appropriate attribute pairs to avoid illogical combos
    const scenarios = [
      { place: 'fruktkorgen',   things: 'äpplen',   cat1: 'röda',      cat2: 'gröna'     },
      { place: 'biblioteket',   things: 'böcker',   cat1: 'utlånade',  cat2: 'kvar'      },
      { place: 'klassrummet',   things: 'pennor',   cat1: 'stora',     cat2: 'små'       },
      { place: 'leklådan',      things: 'leksaker', cat1: 'stora',     cat2: 'små'       },
      { place: 'garaget',       things: 'cyklar',   cat1: 'stora',     cat2: 'små'       },
      { place: 'skolgården',    things: 'elever',   cat1: 'inne',      cat2: 'ute'       },
      { place: 'idrottshallen', things: 'bollar',   cat1: 'röda',      cat2: 'blå'       },
      { place: 'trädgården',    things: 'blommor',  cat1: 'röda',      cat2: 'gula'      },
    ];
    const sc    = pick(scenarios);
    const total = rnd(40, 99);
    const part  = rnd(15, total - 10);
    const ans   = total - part;
    return {
      cat: 'subText', answerType: 'free',
      question: `Det finns ${total} ${sc.things} på ${sc.place}. ${part} är ${sc.cat1}. Resten är ${sc.cat2}. Hur många ${sc.cat2} ${sc.things} finns det?`,
      answer: ans,
      hint: `Subtrahera: ${total} − ${part} = ?`,
    };
  }

  /* ── Kat 8: Koppla bild till uttryck (multi-choice) ──── */
  function genMultiChoice() {
    const groups  = rnd(2, 5);
    const perGroup= rnd(2, 6);
    const total   = groups * perGroup;
    const emoji   = pick(EMOJI_OBJECTS);

    // Correct expressions
    const corrExprs = [
      `${groups}·${perGroup}`,
      `${perGroup}+`.repeat(groups - 1) + perGroup,
      `${total}÷${groups}`,
    ];
    // Distractors
    const distract = [
      `${total}−${groups}`,
      `${groups}+${perGroup}`,
      `${total}÷${perGroup}`,
    ].filter(d => !corrExprs.includes(d));

    const allExprs = shuffle([...corrExprs, ...distract.slice(0, 3)]);
    const correctIndices = corrExprs.map(e => allExprs.indexOf(e)).sort((a,b)=>a-b);

    return {
      cat: 'multiChoice', answerType: 'multi-choice',
      question: `Se bilden nedan. Välj de 3 uttryck som passar.`,
      choices: allExprs, correctIndices, correctCount: 3,
      hint: `Räkna grupper och objekt per grupp.`,
      data: { groups, perGroup, emoji },
    };
  }

  /* ── Kat 9: Volym och enheter ─────────────────────────── */
  function genVolume() {
    const items = [
      { name: 'mjölkpaket', val: 1, unit: 'liter' },
      { name: 'tekopp',     val: 2, unit: 'dl'    },
      { name: 'stor hink',  val: 10,unit: 'liter' },
      { name: 'glas vatten',val: 2, unit: 'dl'    },
    ];
    const item = pick(items);
    const unit2 = item.unit === 'liter' ? 'dl' : 'liter';

    const choices = [item.unit, unit2, 'ml', 'cl'];
    const correctIndex = 0;
    const shuffled = shuffle(choices.map((c,i)=>({c,orig:i})));
    const ci = shuffled.findIndex(x=>x.orig===0);

    return {
      cat: 'volume', answerType: 'choice',
      question: `En ${item.name} rymmer ungefär ${item.val} ___. Välj rätt enhet.`,
      choices: shuffled.map(x=>x.c),
      correctIndex: ci,
      hint: `Tänk på hur stor en ${item.name} är.`,
    };
  }

  /* ── Kat 10: Multiplikation i kontext ─────────────────── */
  function genMulContext() {
    const n   = rnd(2, 6);
    const per = rnd(2, 10);
    const ans = n * per;
    const subjects = ['barn','elever','kompisar'];
    const objects  = ['äpplen','pennor','kort','klistermärken','karameller'];
    return {
      cat: 'mulContext', answerType: 'free',
      question: `${n} ${pick(subjects)} tar ${per} ${pick(objects)} var. Hur många är det sammanlagt?`,
      answer: ans,
      hint: `Multiplicera: ${n} × ${per} = ?`,
    };
  }

  /* ── Kat 11: Storleksordning ───────────────────────────── */
  function genOrderNum() {
    const base  = rnd(0, 5) * 100;
    const nums  = [];
    while (nums.length < 5) {
      const n = base + rnd(0, 99);
      if (!nums.includes(n)) nums.push(n);
    }
    const sorted = [...nums].sort((a,b)=>a-b);
    return {
      cat: 'orderNum', answerType: 'order',
      question: `Ordna talen från minst till störst.`,
      numbers: shuffle(nums),
      sortedNumbers: sorted,
      hint: `Klicka talen i ordning från minst till störst.`,
    };
  }

  /* ── Kat 12: Bollpåsar sannolikhet ────────────────────── */
  function genBallBags() {
    const targetColor = pick(BALL_COLORS);
    const colorName   = ['blå','röd','grön','gul','orange','lila'][BALL_COLORS.indexOf(targetColor)];

    const makeContents = (targetCount) => {
      const other  = pick(BALL_COLORS.filter(c=>c!==targetColor));
      const other2 = pick(BALL_COLORS.filter(c=>c!==targetColor&&c!==other));
      return [
        { color: targetColor, count: targetCount },
        { color: other,  count: rnd(1,4) },
        { color: other2, count: rnd(1,3) },
      ];
    };

    const counts = shuffle([rnd(4,6), rnd(1,2), rnd(2,3)]);
    const bags = [
      { label: 'Påse A', contents: makeContents(counts[0]) },
      { label: 'Påse B', contents: makeContents(counts[1]) },
      { label: 'Påse C', contents: makeContents(counts[2]) },
    ];
    const bagTotals = bags.map(b => b.contents.find(c=>c.color===targetColor)?.count || 0);
    const correctIdx = bagTotals.indexOf(Math.max(...bagTotals));

    return {
      cat: 'ballBags', answerType: 'choice',
      question: `I vilken påse är det störst chans att ta en ${colorName} boll?`,
      choices: ['Påse A','Påse B','Påse C'],
      correctIndex: correctIdx,
      hint: `Fler ${colorName} bollar = störst chans.`,
      data: { bags },
    };
  }

  /* ── Kat 13: Baklängesräkning ─────────────────────────── */
  function genBackwards() {
    const b     = rnd(5, 15);
    const total = rnd(20, 40);
    const start = total - b;
    const name  = pick(NAMES);
    const obj   = pick(['bollar','pinnar','böcker','klistermärken','stenar']);
    const cont  = pick(['låda','hink','korg','påse']);
    return {
      cat: 'backwards', answerType: 'free',
      question: `Det finns ${obj} i en ${cont}. ${name} lägger i ${b} till. Nu är det ${total} ${obj}. Hur många var det från början?`,
      answer: start,
      hint: `Subtrahera: ${total} − ${b} = ?`,
    };
  }

  /* ── Kat 14: Fyll i rätt tecken ───────────────────────── */
  function genFillSign() {
    const makeExpr = () => {
      const type = rnd(0, 3);
      if (type === 0) {
        const a = rnd(2, 9), b = rnd(2, 9);
        return { a, b, c: a + b, sign: '+' };
      } else if (type === 1) {
        const c = rnd(5, 18), b = rnd(2, c-1);
        return { a: c, b, c: c - b, sign: '−' };
      } else if (type === 2) {
        const a = rnd(2, 6), b = rnd(2, 6);
        return { a, b, c: a * b, sign: '·' };
      } else {
        const b = rnd(2, 6), a = b * rnd(2, 5);
        return { a, b, c: a / b, sign: '÷' };
      }
    };

    const subs = Array.from({length: 4}, makeExpr);
    return {
      cat: 'fillSign', answerType: 'fillSign',
      question: `Fyll i rätt räknetecken i varje uppgift.`,
      subQuestions: subs,
      correctSigns: subs.map(s => s.sign),
      hint: `Välj +, −, · eller ÷ för varje uppgift.`,
    };
  }

  /* ── Kat 15: Tidsenheter ──────────────────────────────── */
  function genTimeUnits() {
    const facts = [
      { q: 'Hur många månader är det på ett år?', a: 12, type:'free' },
      { q: 'Hur många dagar är det på en vecka?', a: 7,  type:'free' },
      { q: 'Hur många minuter är det på en timme?', a: 60, type:'free' },
      { q: 'Hur många timmar är det på ett dygn?', a: 24, type:'free' },
      { q: 'Hur många veckor är det på ett år?', a: 52, type:'free' },
    ];
    const fact = pick(facts);
    return {
      cat: 'timeUnits', answerType: 'free',
      question: fact.q,
      answer:   fact.a,
      hint:     `Tänk på kalendern och klockan!`,
    };
  }

  /* ── Kat 16: Dubblering + rest-tabell ─────────────────── */
  function genDoubleRest() {
    const activities = ['Basket','Fotboll','Hopprep','Dans','Schack','Pyssel'];
    const [act1, act2, act3] = shuffle(activities).slice(0,3);
    const total = rnd(10, 24);
    const a     = rnd(2, Math.floor(total / 4));
    const b     = a * 2;
    const c     = total - a - b;

    return {
      cat: 'doubleRest', answerType: 'multi-free',
      question: `Det är ${total} elever. ${a} spelar ${act1}. Dubbelt så många spelar ${act2}. Resten spelar ${act3}. Fyll i tabellen.`,
      fields: [
        { label: act1, prefilled: a },
        { label: act2, prefilled: undefined },
        { label: act3, prefilled: undefined },
      ],
      answers: [a, b, c],
      hint: `Dubbelt av ${a} = ${b}. Resten = ${total} − ${a} − ${b}.`,
    };
  }

  /* ── Kat 17: Halvering + subtraktion ──────────────────── */
  function genHalfSub() {
    const total = rnd(6, 15) * 2;
    const x     = rnd(2, 8);
    const ans   = total / 2 - x;
    const name1 = pick(NAMES);
    const name2 = pick(NAMES.filter(n => n !== name1));
    const obj   = pick(['äpplen','klistermärken','kort','pennor','karameller']);
    return {
      cat: 'halfSub', answerType: 'free',
      question: `${name1} har ${total} ${obj}. Hen ger hälften till ${name2}. Sen äter ${name1} ${x} till. Hur många har ${name1} kvar?`,
      answer:   ans,
      hint:     `Halvera: ${total} ÷ 2 = ${total/2}. Sedan: ${total/2} − ${x} = ?`,
    };
  }

  /* ── Kat 18: Pengar baklänges ─────────────────────────── */
  function genMoneyBack() {
    const item1 = pick(SHOP_ITEMS);
    const item2 = pick(SHOP_ITEMS.filter(i=>i.name!==item1.name));
    const a     = pick(item1.price);
    const b     = pick(item2.price);
    const c     = rnd(5, 30);
    const ans   = a + b + c;
    const name  = pick(NAMES);
    return {
      cat: 'moneyBack', answerType: 'free',
      question: `${name} köper en ${item1.name} för ${a} kr och en ${item2.name} för ${b} kr. Nu har ${name} ${c} kr kvar. Hur mycket hade ${name} från början?`,
      answer: ans,
      hint:   `Addera: ${a} + ${b} + ${c} = ?`,
    };
  }

  /* ── Kat 19: Addition skriftlig ───────────────────────── */
  function genAddWritten() {
    const variant = rnd(0, 1);
    let a, b;
    if (variant === 0) { a = rnd(50, 99); b = rnd(50, 99); }
    else               { a = rnd(100, 200); b = rnd(30, 99); }
    return {
      cat: 'addWritten', answerType: 'free',
      question: `Räkna ut: ${a} + ${b} = ?`,
      answer: a + b,
      hint: `Använd kladdytan för att räkna skriftligt.`,
    };
  }

  /* ── Kat 20: Subtraktion skriftlig ───────────────────── */
  function genSubWritten() {
    const variant = rnd(0, 2);
    let a, b;
    if (variant === 0)      { a = rnd(100, 200); b = rnd(20, 60); }
    else if (variant === 1) { a = rnd(100, 200); b = rnd(50, a - 10); }
    else                    { a = pick([100, 200, 300]); b = rnd(30, 99); }
    return {
      cat: 'subWritten', answerType: 'free',
      question: `Räkna ut: ${a} − ${b} = ?`,
      answer: a - b,
      hint: `Använd kladdytan för att räkna skriftligt.`,
    };
  }

  /* ── Para ihop (match) ─────────────────────────────────── */
  function genMatch() {
    const a = rnd(6, 12);
    const b = pick([2, 3, 4].filter(x => a % x === 0));
    const events = [
      `${name} har ${a} saker och ger bort ${b}`,
      `${a} elever delar lika på ${a*b} saker`,
      `${b} grupper med ${a/b} saker i varje`,
    ].map(() => ''); // placeholder, built below

    const name = pick(NAMES);
    const ev = [
      `${name} har ${a} och ger bort ${b}`,
      `${a} saker delas på ${b}`,
      `${b} grupper med ${a/b} var`,
    ];
    const expr = shuffle([`${a}−${b}`, `${a}÷${b}`, `${b}·${a/b}`, `${a}+${b}`]);
    const correctMatch = ev.map((e, i) => {
      if (i === 0) return expr.indexOf(`${a}−${b}`);
      if (i === 1) return expr.indexOf(`${a}÷${b}`);
      return expr.indexOf(`${b}·${a/b}`);
    });

    return {
      cat: 'match', answerType: 'match',
      question: `Para ihop räknehändelserna med rätt uttryck.`,
      events: ev, expressions: expr, correctMatch,
      hint: `Ge bort = minus, dela lika = delat, grupper = gånger.`,
    };
  }

  /* ── Category helpers ──────────────────────────────────── */
  function getCategoryLabel(cat) {
    const labels = {
      tableChart:    'Tabell & stapeldiagram',
      pieChart:      'Cirkeldiagram',
      addText:       'Textuppgift – addition',
      clock:         'Klockan',
      placeValue:    'Taluppfattning',
      truefalseProb: 'Sant eller falskt',
      subText:       'Textuppgift – subtraktion',
      multiChoice:   'Koppla bild till uttryck',
      volume:        'Volym & enheter',
      mulContext:    'Multiplikation',
      orderNum:      'Storleksordning',
      ballBags:      'Bollpåsar – sannolikhet',
      backwards:     'Baklängesräkning',
      fillSign:      'Rätt tecken',
      timeUnits:     'Tidsenheter',
      doubleRest:    'Dubblering & rest',
      halfSub:       'Halvering & subtraktion',
      moneyBack:     'Pengar',
      addWritten:    'Addition – skriftlig',
      subWritten:    'Subtraktion – skriftlig',
    };
    return labels[cat] || cat;
  }

  function getCategoryEmoji(cat) {
    const emojis = {
      tableChart:'📊', pieChart:'🥧', addText:'➕', clock:'🕐',
      placeValue:'🔢', truefalseProb:'🎲', subText:'➖', multiChoice:'🖼️',
      volume:'💧', mulContext:'✖️', orderNum:'📶', ballBags:'👜',
      backwards:'🔄', fillSign:'🔣', timeUnits:'📅', doubleRest:'⚡',
      halfSub:'✂️', moneyBack:'💰', addWritten:'📝', subWritten:'📝',
    };
    return emojis[cat] || '📝';
  }

  /* ── Public API ────────────────────────────────────────── */
  return {
    init, startGame, confirmBack,
    toggleEraser, clearCanvas,
    npadPress, submitFree,
    submitChoice,
    tfPick, submitTrueFalse,
    mcToggle, submitMultiChoice,
    mfFocus, submitMultiFree,
    orderPick, orderUndo, submitOrder,
    fsSelect, fsSign, submitFillSign,
    matchPickLeft, matchPickRight, submitMatch,
  };
})();
