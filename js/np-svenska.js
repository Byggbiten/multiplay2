/* ============================================================
   MULTIPLAY – Nationella Prov Åk 3: Svenska
   Kräver: np-svenska-texts.js (laddas före denna fil)
   ============================================================ */
const NpSvenska = (() => {
  'use strict';

  /* ── State ──────────────────────────────────────────────── */
  let profile   = null;
  let story     = null;   // Slumpad berättande text
  let factual   = null;   // Slumpad faktatext
  let qIdx      = 0;      // 0-11 (12 frågor)
  let score     = 0;
  let answers   = [];     // [{category, correct, givenAnswer, correctAnswer}]
  let attempts  = 0;      // Försök för aktuell fråga
  let orderSelected = []; // Ordna-händelser: vald ordning
  let multiSelected = new Set(); // Multi-choice: valda index
  let isReadMode = false; // Visar texten i fullskärm
  let inputLocked = false;
  let usedSpellingIndices = new Set(); // Förhindra upprepade stavningsfrågor
  let canvasEl = null, canvasCtx = null, tool = 'pen';
  let isDrawing = false, lastX = 0, lastY = 0;

  /* ── CSS ─────────────────────────────────────────────────── */
  function injectCSS() {
    if (document.getElementById('svk-rs')) return;
    const s = document.createElement('style');
    s.id = 'svk-rs';
    s.textContent = `
      #screen-np-svenska-prov, #screen-np-svenska-skriva {
        flex-direction:column; height:100vh; overflow:hidden;
        background:var(--svk-bg,linear-gradient(135deg,#ecfdf5 0%,#eff6ff 50%,#fdf4ff 100%));
      }
      .svk-header {
        display:flex; align-items:center; gap:8px;
        padding:8px 12px; background:rgba(255,255,255,0.92);
        border-bottom:2px solid rgba(5,150,105,0.2);
        min-height:44px; flex-shrink:0;
      }
      .svk-btn-back {
        background:var(--svk-light,#d1fae5); color:var(--svk-primary,#059669);
        border:none; border-radius:10px; padding:6px 12px;
        font-weight:800; cursor:pointer; font-size:13px; white-space:nowrap;
      }
      .svk-title { font-family:var(--font-heading); color:var(--svk-primary,#059669); font-size:15px; flex:1; text-align:center; }
      .svk-score { font-weight:800; color:var(--svk-primary,#059669); white-space:nowrap; font-size:13px; }
      .svk-progress { height:4px; background:rgba(5,150,105,0.15); flex-shrink:0; }
      .svk-progress-bar { height:100%; background:var(--svk-primary,#059669); transition:width 0.4s; }

      .svk-dashboard {
        flex:1; display:flex; min-height:0;
        flex-direction:row; /* landscape default */
      }
      @media (orientation:portrait) {
        .svk-dashboard { flex-direction:column; }
        .svk-text-panel { max-height:42%; min-height:120px; }
        .svk-qa-panel { flex:1; }
      }
      .svk-text-panel {
        flex:1; overflow-y:auto; padding:12px 14px;
        background:rgba(255,255,255,0.9);
        border-right:2px solid rgba(5,150,105,0.12);
        font-size:var(--text-base,16px); line-height:1.65;
      }
      .svk-text-title {
        font-family:var(--font-heading); font-size:18px;
        color:var(--svk-primary,#059669); margin-bottom:10px;
      }
      .svk-qa-panel {
        flex:1; display:flex; flex-direction:column;
        overflow:hidden; min-width:0;
      }
      .svk-question-area {
        flex:1; overflow-y:auto; padding:12px 12px 8px;
        display:flex; flex-direction:column; gap:8px;
      }
      .svk-q-label {
        font-size:12px; font-weight:800; color:var(--svk-secondary,#7c3aed);
        text-transform:uppercase; letter-spacing:0.04em;
      }
      .svk-q-text {
        font-family:var(--font-heading); font-size:17px;
        color:var(--color-text,#1e293b); line-height:1.35;
      }
      .svk-choices { display:flex; flex-direction:column; gap:6px; }
      .svk-choice {
        background:rgba(255,255,255,0.9); border:2px solid rgba(5,150,105,0.25);
        border-radius:10px; padding:10px 12px; cursor:pointer;
        font-size:14px; font-weight:700; text-align:left;
        transition:background 0.15s, border-color 0.15s;
      }
      .svk-choice:hover { background:var(--svk-light,#d1fae5); border-color:var(--svk-primary,#059669); }
      .svk-choice.correct { background:#d1fae5; border-color:#059669; color:#065f46; }
      .svk-choice.wrong   { background:#fee2e2; border-color:#ef4444; color:#991b1b; }
      .svk-choice.disabled { pointer-events:none; opacity:0.6; }

      /* Sammanfattningskort */
      .svk-summary-cards { display:flex; flex-direction:column; gap:8px; }
      .svk-summary-card {
        background:rgba(255,255,255,0.92); border:2px solid rgba(5,150,105,0.2);
        border-radius:12px; padding:12px; cursor:pointer;
        transition:transform 0.15s, box-shadow 0.15s;
      }
      .svk-summary-card:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(5,150,105,0.15); }
      .svk-summary-card.correct { border-color:#059669; background:#d1fae5; }
      .svk-summary-card.wrong   { border-color:#ef4444; background:#fee2e2; }
      .svk-card-label {
        font-size:11px; font-weight:900; color:var(--svk-secondary,#7c3aed);
        letter-spacing:0.08em; margin-bottom:4px;
      }
      .svk-card-text { font-size:13px; line-height:1.55; color:#1e293b; }

      /* Ordna-händelser */
      .svk-order-events { display:flex; flex-direction:column; gap:5px; }
      .svk-order-event {
        background:rgba(255,255,255,0.92); border:2px solid rgba(5,150,105,0.25);
        border-radius:10px; padding:9px 12px; cursor:pointer;
        font-size:13px; font-weight:700; transition:all 0.15s;
        display:flex; align-items:center; gap:8px;
      }
      .svk-order-event:hover:not(.placed) { background:var(--svk-light,#d1fae5); }
      .svk-order-event.placed { background:#e0e7ff; border-color:#6366f1; opacity:0.7; cursor:default; }
      .svk-order-event.correct { background:#d1fae5; border-color:#059669; }
      .svk-order-event.wrong   { background:#fee2e2; border-color:#ef4444; }
      .svk-order-slot {
        background:rgba(255,255,255,0.7); border:2px dashed rgba(5,150,105,0.35);
        border-radius:10px; padding:9px 12px; min-height:40px;
        font-size:13px; color:#94a3b8; display:flex; align-items:center; gap:8px;
      }
      .svk-order-slot.filled { border-style:solid; border-color:rgba(5,150,105,0.5); color:#1e293b; background:#f0fdf4; }
      .svk-order-number {
        width:22px; height:22px; border-radius:50%;
        background:var(--svk-primary,#059669); color:#fff;
        font-size:11px; font-weight:900; display:flex; align-items:center; justify-content:center;
        flex-shrink:0;
      }

      /* Multi-choice */
      .svk-multi-items { display:flex; flex-wrap:wrap; gap:6px; }
      .svk-multi-item {
        background:rgba(255,255,255,0.9); border:2px solid rgba(5,150,105,0.25);
        border-radius:8px; padding:7px 12px; cursor:pointer;
        font-size:13px; font-weight:700; transition:all 0.15s;
      }
      .svk-multi-item.selected { background:var(--svk-light,#d1fae5); border-color:var(--svk-primary,#059669); }
      .svk-multi-item.correct  { background:#d1fae5; border-color:#059669; color:#065f46; }
      .svk-multi-item.wrong    { background:#fee2e2; border-color:#ef4444; color:#991b1b; }

      /* Canvas */
      .svk-canvas-strip {
        height:52px; background:rgba(255,255,255,0.85);
        border-top:1px solid rgba(5,150,105,0.15);
        display:flex; align-items:center; gap:6px; padding:0 10px;
        flex-shrink:0;
      }
      .svk-canvas-btn {
        padding:4px 10px; border-radius:8px; border:2px solid rgba(5,150,105,0.25);
        background:rgba(255,255,255,0.8); font-size:12px; font-weight:700;
        cursor:pointer; white-space:nowrap;
      }
      .svk-canvas-btn.active { background:var(--svk-light,#d1fae5); border-color:var(--svk-primary,#059669); }
      .svk-canvas-wrap { flex:1; height:36px; border-radius:8px; overflow:hidden; border:1px solid rgba(5,150,105,0.2); }
      #svk-canvas { display:block; width:100%; height:100%; touch-action:none; background:rgba(255,255,255,0.5); }

      /* Feedback bar */
      .svk-feedback {
        padding:8px 12px; font-weight:700; font-size:13px; text-align:center;
        border-radius:0; flex-shrink:0;
      }
      .svk-feedback.correct { background:#d1fae5; color:#065f46; }
      .svk-feedback.wrong   { background:#fee2e2; color:#991b1b; }

      /* Read mode */
      .svk-read-screen {
        display:flex; flex-direction:column; height:100%;
        background:rgba(255,255,255,0.96);
      }
      .svk-read-body {
        flex:1; overflow-y:auto; padding:16px;
        font-size:17px; line-height:1.7;
      }

      /* Bokvy */
      .svk-book-view {
        background:#fefce8; border:2px solid rgba(5,150,105,0.2);
        border-radius:16px; padding:20px; margin:12px;
        font-size:18px; line-height:1.8; position:relative;
      }
      .svk-book-title {
        font-family:var(--font-heading); font-size:24px;
        color:var(--svk-primary,#059669); margin-bottom:12px; text-align:center;
      }
      .svk-book-author { font-size:13px; color:#64748b; margin-top:16px; text-align:right; }
      .svk-book-wordcount { font-size:11px; color:#94a3b8; text-align:right; }
      .svk-support-words {
        background:var(--svk-light,#d1fae5); border-radius:10px;
        padding:10px 14px; margin-top:12px;
        font-size:13px; color:#065f46;
      }

      /* Skrivläge */
      .svk-write-dashboard { flex:1; display:flex; min-height:0; }
      @media (orientation:portrait) { .svk-write-dashboard { flex-direction:column; } }
      .svk-write-left {
        width:200px; flex-shrink:0; overflow-y:auto;
        padding:12px; background:rgba(255,255,255,0.85);
        border-right:2px solid rgba(5,150,105,0.12);
      }
      @media (orientation:portrait) { .svk-write-left { width:auto; max-height:30%; } }
      .svk-write-right { flex:1; display:flex; flex-direction:column; padding:10px; gap:6px; min-width:0; }
      .svk-title-input {
        border:2px solid rgba(5,150,105,0.3); border-radius:10px;
        padding:8px 12px; font-size:16px; font-weight:700;
        font-family:var(--font-heading); background:rgba(255,255,255,0.9);
        outline:none; width:100%; box-sizing:border-box;
      }
      .svk-title-input:focus { border-color:var(--svk-primary,#059669); }
      .svk-textarea {
        flex:1; border:2px solid rgba(5,150,105,0.3); border-radius:10px;
        padding:12px; font-size:18px; line-height:1.65;
        font-family:var(--font-body,sans-serif);
        background:rgba(255,255,255,0.95); resize:none;
        outline:none; min-height:0;
      }
      .svk-textarea:focus { border-color:var(--svk-primary,#059669); }
      .svk-wordcount { font-size:12px; color:#64748b; font-weight:700; text-align:right; }

      /* Logg */
      .svk-log-list { display:flex; flex-direction:column; gap:8px; padding:12px; }
      .svk-log-item {
        background:rgba(255,255,255,0.9); border:2px solid rgba(5,150,105,0.2);
        border-radius:12px; padding:12px; cursor:pointer;
        display:flex; align-items:center; gap:10px;
        transition:box-shadow 0.15s;
      }
      .svk-log-item:hover { box-shadow:0 4px 12px rgba(5,150,105,0.15); }
      .svk-log-icon { font-size:22px; flex-shrink:0; }
      .svk-log-meta { flex:1; min-width:0; }
      .svk-log-type { font-size:11px; color:#64748b; font-weight:700; }
      .svk-log-title { font-size:15px; font-weight:800; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .svk-log-detail { font-size:12px; color:#059669; font-weight:700; }

      /* Resultatskärm */
      .svk-result-area { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px; }
      .svk-result-row {
        display:flex; align-items:center; gap:8px;
        padding:8px 12px; border-radius:10px;
        font-size:13px; font-weight:700;
      }
      .svk-result-row.ok  { background:#d1fae5; color:#065f46; }
      .svk-result-row.bad { background:#fee2e2; color:#991b1b; }

      /* Knapp */
      .svk-btn {
        background:var(--svk-primary,#059669); color:#fff;
        border:none; border-radius:12px; padding:12px 20px;
        font-size:15px; font-weight:800; cursor:pointer;
        text-align:center; transition:opacity 0.15s;
      }
      .svk-btn:hover { opacity:0.88; }
      .svk-btn.secondary {
        background:rgba(5,150,105,0.12); color:var(--svk-primary,#059669);
      }
    `;
    document.head.appendChild(s);
  }

  /* ── Hjälp ───────────────────────────────────────────────── */
  function esc(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function countWords(str) {
    return str.trim().split(/\s+/).filter(Boolean).length;
  }
  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('sv-SE', {day:'numeric',month:'long',year:'numeric'});
  }

  /* ── localStorage ────────────────────────────────────────── */
  function logKey() { return `np_svenska_log_${profile.id}`; }
  function loadLog() {
    try { return JSON.parse(localStorage.getItem(logKey()) || '[]'); }
    catch { return []; }
  }
  function saveLog(arr) {
    while (arr.length > 50) arr.pop();
    localStorage.setItem(logKey(), JSON.stringify(arr));
  }
  function appendLog(entry) {
    const log = loadLog();
    log.unshift(entry);
    saveLog(log);
  }

  /* ── Init ────────────────────────────────────────────────── */
  function init(p) {
    profile = p;
    injectCSS();
    showSelectScreen();
  }

  /* ── Välj-skärm ──────────────────────────────────────────── */
  function showSelectScreen() {
    const root = document.getElementById('np-svenska-select-root');
    root.innerHTML = `
      <div class="svk-header">
        <button class="svk-btn-back" onclick="NationellaHub.showSubjectSelect()">Tillbaka</button>
        <span class="svk-title">📖 Svenska Åk 3</span>
        <button class="svk-btn-back" onclick="NpSvenska.showLog()" style="white-space:nowrap">📚 Min bok</button>
      </div>
      <div style="padding:16px;display:flex;flex-direction:column;gap:14px;flex:1;overflow-y:auto">

        <div class="card" style="
          display:flex;align-items:center;gap:16px;padding:18px;cursor:pointer;
          background:linear-gradient(135deg,#d1fae5 0%,#ede9fe 100%);
          border:2px solid rgba(5,150,105,0.2);transition:transform 0.2s,box-shadow 0.2s;"
          onclick="NpSvenska.startProv()"
          onmouseenter="this.style.transform='translateY(-3px)';this.style.boxShadow='var(--shadow-lg)'"
          onmouseleave="this.style.transform='';this.style.boxShadow=''">
          <div style="font-size:2.5rem;width:60px;height:60px;display:flex;align-items:center;justify-content:center;
            border-radius:14px;background:linear-gradient(135deg,#d1fae5,#ede9fe)">📝</div>
          <div style="flex:1">
            <div style="font-family:var(--font-heading);font-size:20px;color:var(--svk-primary,#059669)">Läsförståelse &amp; språk</div>
            <div style="font-size:13px;color:#64748b;font-weight:700;margin-top:4px">17 frågor – texter, begrepp och stavning 🔍</div>
          </div>
          <div style="font-size:20px;opacity:0.5">›</div>
        </div>

        <div class="card" style="
          display:flex;align-items:center;gap:16px;padding:18px;cursor:pointer;
          background:linear-gradient(135deg,#eff6ff 0%,#fdf4ff 100%);
          border:2px solid rgba(124,58,237,0.2);transition:transform 0.2s,box-shadow 0.2s;"
          onclick="NpSvenska.showWriteSelect()"
          onmouseenter="this.style.transform='translateY(-3px)';this.style.boxShadow='var(--shadow-lg)'"
          onmouseleave="this.style.transform='';this.style.boxShadow=''">
          <div style="font-size:2.5rem;width:60px;height:60px;display:flex;align-items:center;justify-content:center;
            border-radius:14px;background:linear-gradient(135deg,#eff6ff,#fdf4ff)">✏️</div>
          <div style="flex:1">
            <div style="font-family:var(--font-heading);font-size:20px;color:var(--svk-secondary,#7c3aed)">Skriva</div>
            <div style="font-size:13px;color:#64748b;font-weight:700;margin-top:4px">Berättelse eller faktatext 🖊️</div>
          </div>
          <div style="font-size:20px;opacity:0.5">›</div>
        </div>

        <div class="player-banner" style="margin-top:4px">
          <div class="avatar avatar-lg">${esc(profile.avatar)}</div>
          <div class="player-info">
            <div class="player-name">${esc(profile.name)}</div>
            <div class="player-tagline">Välj vad du vill träna idag 🎯</div>
          </div>
        </div>
      </div>
    `;
    Router.show('screen-np-svenska-select');
  }

  /* ── Starta prov ─────────────────────────────────────────── */
  function startProv() {
    App.Sound.play('click');
    story   = pick(NARRATIVE_TEXTS);
    factual = pick(FACTUAL_TEXTS);
    qIdx    = 0;
    score   = 0;
    answers = [];
    usedSpellingIndices = new Set();
    isReadMode = true;
    Router.show('screen-np-svenska-prov');
    renderReadMode(story, () => { isReadMode = false; renderQuestion(); });
  }

  /* ── Läs-läge ────────────────────────────────────────────── */
  function renderReadMode(text, onDone) {
    const root = document.getElementById('np-svenska-prov-root');
    root.innerHTML = `
      <div class="svk-read-screen">
        <div class="svk-header">
          <button class="svk-btn-back" onclick="NpSvenska.showSelectScreen()">Avsluta</button>
          <span class="svk-title">📖 Läs texten</span>
          <div style="width:80px"></div>
        </div>
        <div class="svk-read-body">
          <div class="svk-text-title">${esc(text.title)}</div>
          <div>${esc(text.text).replace(/\n/g,'<br>')}</div>
        </div>
        <div style="padding:12px">
          <button class="svk-btn" style="width:100%" id="svk-read-done">Jag har läst klart ▶️</button>
        </div>
      </div>
    `;
    document.getElementById('svk-read-done').onclick = onDone;
  }

  /* ── 12 Frågor ───────────────────────────────────────────── */
  /*
    0: Lokalisera – berättande       (locate, story)
    1: Tolka/integrera – berättande  (interpret, story)
    2: Ordna händelser               (order, story)
    3: Vem gjorde vad?               (whoDidWhat, story)
    4: Vilka saker nämns?            (detailPick, story)
    5: Bästa sammanfattning berat.   (summaries, story)
    6: Lokalisera – fakta            (locate, factual) → LÄSLÄGE
    7: Förstå begrepp – fakta        (concept, factual)
    8: Dra slutsats – fakta          (inference, factual)
    9: Bästa sammanfattning fakta    (summaries, factual)
   10: Stödord – rätt mening        (WORD_IN_SENTENCE_POOL)
   11: Stavning & interpunktion      (SPELLING_POOL)
  */

  function renderQuestion() {
    inputLocked = false;
    attempts = 0;
    orderSelected = [];
    multiSelected = new Set();

    // Vid fråga 6 (första faktafrågan): visa faktatexten i läsläge
    if (qIdx === 6) {
      renderReadMode(factual, () => renderQ());
      return;
    }
    renderQ();
  }

  function renderQ() {
    const root = document.getElementById('np-svenska-prov-root');
    const pct = Math.round((qIdx / 17) * 100);
    const categoryLabels = [
      'Lokalisera information',
      'Tolka och integrera',
      'Ordna händelser',
      'Vem gjorde vad?',
      'Vilka saker nämns?',
      'Välj bästa sammanfattning',
      'Lokalisera information',
      'Förstå begrepp',
      'Dra slutsats',
      'Välj bästa sammanfattning',
      'Stödord – rätt mening',
      'Stavning & interpunktion',
      'Stavning & interpunktion',
      'Stavning & interpunktion',
      'Stavning & interpunktion',
      'Stavning & interpunktion',
      'Stavning & interpunktion'
    ];
    const label = categoryLabels[qIdx] || '';
    const currentText = qIdx < 6 ? story : factual;

    root.innerHTML = `
      <div class="svk-header">
        <button class="svk-btn-back" onclick="NpSvenska.showSelectScreen()">Avsluta</button>
        <span class="svk-title">${esc(label)}</span>
        <span class="svk-score">${score} / ${qIdx} ⭐</span>
      </div>
      <div class="svk-progress"><div class="svk-progress-bar" style="width:${pct}%"></div></div>
      <div class="svk-dashboard" id="svk-dashboard">
        ${qIdx <= 9 ? `
        <div class="svk-text-panel" id="svk-text-panel">
          <div class="svk-text-title">${esc(currentText.title)}</div>
          <div>${esc(currentText.text).replace(/\n/g,'<br>')}</div>
        </div>` : ''}
        <div class="svk-qa-panel">
          <div class="svk-question-area" id="svk-qa"></div>
          <div id="svk-feedback"></div>
        </div>
      </div>
    `;

    renderQContent();
  }

  function renderQContent() {
    const qa = document.getElementById('svk-qa');
    if (!qa) return;

    switch (qIdx) {
      case 0: renderChoice(qa, pick(story.questions.locate), 'Fråga om texten'); break;
      case 1: renderChoice(qa, pick(story.questions.interpret), 'Tolkningsfråga'); break;
      case 2: renderOrder(qa); break;
      case 3: renderWhoDidWhat(qa); break;
      case 4: renderDetailPick(qa); break;
      case 5: renderSummary(qa, story, 'Berättande text'); break;
      case 6: renderChoice(qa, pick(factual.questions.locate), 'Fråga om faktatexten'); break;
      case 7: renderChoice(qa, factual.questions.concept, 'Förstå begrepp'); break;
      case 8: renderChoice(qa, factual.questions.inference, 'Dra slutsats'); break;
      case 9: renderSummary(qa, factual, 'Faktatext'); break;
      case 10: renderWordInSentence(qa); break;
      case 11:
      case 12:
      case 13:
      case 14:
      case 15:
      case 16: renderSpelling(qa); break;
    }
  }

  /* ── Choice (4 alt) ──────────────────────────────────────── */
  function renderChoice(qa, item, catLabel) {
    qa.innerHTML = `
      <div class="svk-q-label">${esc(catLabel)}</div>
      <div class="svk-q-text">${esc(item.q)}</div>
      <div class="svk-choices" id="svk-choices"></div>
    `;
    const ch = document.getElementById('svk-choices');
    item.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'svk-choice';
      btn.textContent = opt;
      btn.onclick = () => handleChoice(i, item.correct, btn, item);
      ch.appendChild(btn);
    });
  }

  function handleChoice(idx, correct, btn, item) {
    if (inputLocked) return;
    inputLocked = true;
    const allBtns = document.querySelectorAll('.svk-choice');
    const isCorrect = idx === correct;
    if (isCorrect) {
      btn.classList.add('correct');
      allBtns.forEach(b => b.classList.add('disabled'));
      recordAnswer(true);
      showFeedback(true);
      scheduleNext();
    } else {
      attempts++;
      btn.classList.add('wrong');
      if (attempts >= 2) {
        allBtns[correct].classList.add('correct');
        allBtns.forEach(b => b.classList.add('disabled'));
        recordAnswer(false);
        showFeedback(false);
        scheduleNext();
      } else {
        btn.classList.add('disabled');
        showFeedback(false, 'Försök igen!');
        inputLocked = false;
      }
    }
  }

  /* ── Summary (3 textkort) ────────────────────────────────── */
  function renderSummary(qa, text, catLabel) {
    const s = text.questions.summaries;
    const cards = shuffle([
      { label: 'A', text: s.bad, isBest: false, key: 'bad' },
      { label: 'B', text: s.medium, isBest: false, key: 'medium' },
      { label: 'C', text: s.good, isBest: true, key: 'good' }
    ]);
    qa.innerHTML = `
      <div class="svk-q-label">${esc(catLabel)}</div>
      <div class="svk-q-text">Vilken sammanfattning är bäst?</div>
      <div class="svk-summary-cards" id="svk-sum-cards"></div>
    `;
    const container = document.getElementById('svk-sum-cards');
    cards.forEach(card => {
      const div = document.createElement('div');
      div.className = 'svk-summary-card';
      div.innerHTML = `<div class="svk-card-label">Sammanfattning ${esc(card.label)}</div><div class="svk-card-text">${esc(card.text)}</div>`;
      div.onclick = () => handleSummaryChoice(card.isBest, div, cards, container, s.good);
      container.appendChild(div);
    });
  }

  function handleSummaryChoice(isBest, clickedDiv, cards, container, goodText) {
    if (inputLocked) return;
    inputLocked = true;
    const allCards = container.querySelectorAll('.svk-summary-card');
    allCards.forEach(c => c.style.pointerEvents = 'none');
    if (isBest) {
      clickedDiv.classList.add('correct');
      recordAnswer(true);
      showFeedback(true, '⭐ Rätt! Det är den bästa sammanfattningen!');
      scheduleNext();
    } else {
      clickedDiv.classList.add('wrong');
      // Hitta och markera rätt
      allCards.forEach((c, i) => {
        if (c.querySelector('.svk-card-text').textContent === goodText) c.classList.add('correct');
      });
      recordAnswer(false);
      showFeedback(false, 'Nja! En bra sammanfattning har det viktigaste OCH hur personerna känner sig.');
      scheduleNext(2500);
    }
  }

  /* ── Ordna händelser ─────────────────────────────────────── */
  function renderOrder(qa) {
    const ord = story.questions.order;
    const eventTexts = ord.events;
    const shuffledIndices = shuffle([...Array(eventTexts.length).keys()]);

    qa.innerHTML = `
      <div class="svk-q-label">Ordna händelserna</div>
      <div class="svk-q-text">Klicka på händelserna i rätt ordning.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px">
        <div>
          <div style="font-size:11px;font-weight:800;color:#64748b;margin-bottom:4px">HÄNDELSER</div>
          <div class="svk-order-events" id="svk-events"></div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:800;color:#64748b;margin-bottom:4px">DIN ORDNING</div>
          <div id="svk-slots"></div>
        </div>
      </div>
      <div id="svk-order-check" style="margin-top:8px"></div>
    `;

    const eventsEl = document.getElementById('svk-events');
    const slotsEl  = document.getElementById('svk-slots');

    // Hjälpfunktion: uppdatera alla slots utifrån orderSelected
    function refreshSlots() {
      for (let i = 0; i < eventTexts.length; i++) {
        const slot = slotsEl.children[i];
        if (i < orderSelected.length) {
          slot.classList.add('filled');
          slot.innerHTML = `<span style="font-weight:800;color:#059669;font-size:12px">${i+1}.</span> <span>${esc(eventTexts[orderSelected[i]])}</span>`;
          slot.style.cursor = 'pointer';
          slot.onclick = () => undoFromSlot(i);
        } else {
          slot.classList.remove('filled');
          slot.innerHTML = `<span style="color:#94a3b8;font-size:12px">${i+1}.</span> <span>–</span>`;
          slot.style.cursor = 'default';
          slot.onclick = null;
        }
      }
    }

    // Ångra: klicka på en placerad slot → ta bort den och alla efter
    function undoFromSlot(pos) {
      if (inputLocked) return;
      const removed = orderSelected.splice(pos);
      removed.forEach(idx => {
        const btn = eventsEl.querySelector(`[data-idx="${idx}"]`);
        if (btn) btn.classList.remove('placed');
      });
      refreshSlots();
    }

    // Skapa platshållare
    for (let i = 0; i < eventTexts.length; i++) {
      const slot = document.createElement('div');
      slot.className = 'svk-order-slot';
      slot.dataset.pos = i;
      slot.innerHTML = `<span style="color:#94a3b8;font-size:12px">${i+1}.</span> <span>–</span>`;
      slotsEl.appendChild(slot);
    }

    // Skapa händelse-knappar
    shuffledIndices.forEach(origIdx => {
      const btn = document.createElement('div');
      btn.className = 'svk-order-event';
      btn.dataset.idx = origIdx;
      btn.textContent = eventTexts[origIdx];
      btn.onclick = () => {
        if (inputLocked) return;
        if (btn.classList.contains('placed')) return;
        const pos = orderSelected.length;
        if (pos >= eventTexts.length) return;
        orderSelected.push(origIdx);
        btn.classList.add('placed');
        refreshSlots();

        if (orderSelected.length === eventTexts.length) {
          checkOrder(ord.correctOrder, eventTexts);
        }
      };
      eventsEl.appendChild(btn);
    });
  }

  function checkOrder(correctOrder, eventTexts) {
    if (inputLocked) return;
    inputLocked = true;
    const isCorrect = orderSelected.every((val, i) => val === correctOrder[i]);
    const evBtns = document.querySelectorAll('.svk-order-event');
    const slots  = document.querySelectorAll('.svk-order-slot');
    if (isCorrect) {
      slots.forEach(s => s.style.background = '#d1fae5');
      evBtns.forEach(b => b.classList.add('correct'));
      recordAnswer(true);
      showFeedback(true);
      scheduleNext();
    } else {
      slots.forEach(s => s.style.background = '#fee2e2');
      recordAnswer(false);
      showFeedback(false, 'Inte rätt ordning. Rätt ordning: ' + correctOrder.map(i => eventTexts[i]).map((t,n) => `${n+1}. ${t}`).join(' → '));
      scheduleNext(3000);
    }
  }

  /* ── Vem gjorde vad? (multi-choice namn) ─────────────────── */
  function renderWhoDidWhat(qa) {
    const w = story.questions.whoDidWhat;
    const correctCount = w.correctNames.length;
    qa.innerHTML = `
      <div class="svk-q-label">Vem gjorde vad?</div>
      <div class="svk-q-text">${esc(w.q)}</div>
      <div style="font-size:12px;color:#7c3aed;font-weight:700;margin-top:2px">Välj ${correctCount} namn</div>
      <div class="svk-multi-items" id="svk-multi"></div>
      <div id="svk-multi-check" style="margin-top:8px"></div>
    `;
    renderMultiItems(w.allNames, correctCount, (sel) => {
      const selNames = [...sel].map(i => w.allNames[i]);
      const correct  = w.correctNames.every(n => selNames.includes(n)) && selNames.length === w.correctNames.length;
      return { correct, correctIndices: w.allNames.map((n,i) => w.correctNames.includes(n) ? i : -1).filter(i => i >= 0) };
    });
  }

  /* ── Vilka saker nämns? (multi-choice detaljer) ─────────── */
  function renderDetailPick(qa) {
    const d = story.questions.detailPick;
    const correctCount = d.correct.length;
    qa.innerHTML = `
      <div class="svk-q-label">Vilka saker nämns?</div>
      <div class="svk-q-text">${esc(d.q)}</div>
      <div style="font-size:12px;color:#7c3aed;font-weight:700;margin-top:2px">Välj ${correctCount} saker</div>
      <div class="svk-multi-items" id="svk-multi"></div>
      <div id="svk-multi-check" style="margin-top:8px"></div>
    `;
    renderMultiItems(d.options, correctCount, (sel) => {
      const selArr = [...sel].sort();
      const corArr = [...d.correct].sort();
      const correct = selArr.length === corArr.length && selArr.every((v,i) => v === corArr[i]);
      return { correct, correctIndices: d.correct };
    });
  }

  function renderMultiItems(options, requiredCount, checkFn) {
    const container = document.getElementById('svk-multi');
    options.forEach((opt, i) => {
      const btn = document.createElement('div');
      btn.className = 'svk-multi-item';
      btn.textContent = opt;
      btn.onclick = () => {
        if (btn.classList.contains('correct') || btn.classList.contains('wrong')) return;
        if (multiSelected.has(i)) {
          multiSelected.delete(i);
          btn.classList.remove('selected');
        } else {
          multiSelected.add(i);
          btn.classList.add('selected');
        }
        if (multiSelected.size === requiredCount) {
          if (inputLocked) return;
          inputLocked = true;
          const { correct, correctIndices } = checkFn(multiSelected);
          const allBtns = container.querySelectorAll('.svk-multi-item');
          allBtns.forEach((b, j) => {
            b.style.pointerEvents = 'none';
            if (correctIndices.includes(j)) b.classList.add('correct');
            else if (multiSelected.has(j)) b.classList.add('wrong');
          });
          recordAnswer(correct);
          showFeedback(correct);
          scheduleNext();
        }
      };
      container.appendChild(btn);
    });
  }

  /* ── Stödord – rätt mening ───────────────────────────────── */
  function renderWordInSentence(qa) {
    const item = pick(WORD_IN_SENTENCE_POOL);
    qa.innerHTML = `
      <div class="svk-q-label">Stödord – rätt mening</div>
      <div class="svk-q-text">Välj meningen där "<strong>${esc(item.word)}</strong>" används rätt.</div>
      <div class="svk-choices" id="svk-choices"></div>
    `;
    const ch = document.getElementById('svk-choices');
    item.sentences.forEach((sent, i) => {
      const btn = document.createElement('button');
      btn.className = 'svk-choice';
      btn.textContent = sent;
      btn.onclick = () => handleChoice(i, item.correct, btn, item);
      ch.appendChild(btn);
    });
  }

  /* ── Stavning & interpunktion ────────────────────────────── */
  function renderSpelling(qa) {
    // Välj ett oanvänt stavningsobjekt; återställ om poolen är slut
    let availableIndices = SPELLING_POOL.map((_, i) => i).filter(i => !usedSpellingIndices.has(i));
    if (availableIndices.length === 0) { usedSpellingIndices = new Set(); availableIndices = SPELLING_POOL.map((_, i) => i); }
    const chosenIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    usedSpellingIndices.add(chosenIdx);
    const item = SPELLING_POOL[chosenIdx];
    // item.options contains all 4 alternatives (including the correct one); shuffle for randomness
    const options = shuffle(item.options ? [...item.options] : [item.correct, ...(item.wrong || [])]);
    const correctIdx = options.indexOf(item.correct);
    qa.innerHTML = `
      <div class="svk-q-label">Stavning &amp; interpunktion</div>
      <div class="svk-q-text">Vilken mening är rätt skriven?</div>
      <div class="svk-choices" id="svk-choices"></div>
    `;
    const ch = document.getElementById('svk-choices');
    options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'svk-choice';
      btn.textContent = opt;
      btn.onclick = () => handleChoice(i, correctIdx, btn, {q:'', options, correct: correctIdx});
      ch.appendChild(btn);
    });
  }

  /* ── Svar & nästa fråga ──────────────────────────────────── */
  function recordAnswer(correct) {
    const labels = [
      'Lokalisera info','Tolka/integrera','Ordna händelser','Vem gjorde vad?',
      'Vilka saker nämns?','Sammanfattning (berättande)','Lokalisera info (fakta)',
      'Förstå begrepp','Dra slutsats','Sammanfattning (fakta)','Stödord',
      'Stavning','Stavning','Stavning','Stavning','Stavning','Stavning'
    ];
    if (correct) score++;
    answers.push({ category: labels[qIdx] || `Fråga ${qIdx+1}`, correct });
  }

  function showFeedback(correct, msg) {
    const fb = document.getElementById('svk-feedback');
    if (!fb) return;
    if (msg) {
      fb.className = 'svk-feedback ' + (correct ? 'correct' : 'wrong');
      fb.textContent = msg;
    } else {
      fb.className = 'svk-feedback ' + (correct ? 'correct' : 'wrong');
      fb.textContent = correct ? '✅ Rätt!' : '❌ Fel!';
    }
    if (correct) {
      App.Sound.play('correct');
      if (typeof App.Confetti !== 'undefined') App.Confetti.burst({ count: 45 });
    } else {
      App.Sound.play('wrong');
    }
  }

  function scheduleNext(delay) {
    setTimeout(() => {
      qIdx++;
      if (qIdx >= 17) { showResult(); return; }
      renderQuestion();
    }, delay || 1400);
  }

  /* ── Resultat ────────────────────────────────────────────── */
  function showResult() {
    // Spara i log
    appendLog({
      id: Date.now(),
      date: new Date().toISOString(),
      type: 'prov',
      score,
      total: 17,
      textsUsed: [story.id, factual.id],
      answers
    });

    const root = document.getElementById('np-svenska-prov-root');
    const stars = score >= 15 ? '🌟🌟🌟' : score >= 11 ? '⭐⭐' : '⭐';
    root.innerHTML = `
      <div class="svk-header">
        <button class="svk-btn-back" onclick="NpSvenska.showSelectScreen()">Tillbaka</button>
        <span class="svk-title">📝 Resultat</span>
        <button class="svk-btn-back" onclick="NpSvenska.showLog()">📚 Min bok</button>
      </div>
      <div class="svk-result-area">
        <div style="text-align:center;padding:16px 0">
          <div style="font-size:3rem">${stars}</div>
          <div style="font-family:var(--font-heading);font-size:28px;color:var(--svk-primary,#059669)">${score} av 17</div>
          <div style="font-size:14px;color:#64748b;font-weight:700;margin-top:4px">
            ${score === 17 ? 'Perfekt! Du är en stjärna! 🎉' : score >= 13 ? 'Bra jobbat! 💪' : 'Fortsätt öva! 📚'}
          </div>
        </div>
        ${answers.map(a => `
          <div class="svk-result-row ${a.correct ? 'ok' : 'bad'}">
            <span>${a.correct ? '✅' : '❌'}</span>
            <span style="flex:1">${esc(a.category)}</span>
          </div>
        `).join('')}
        <button class="svk-btn" onclick="NpSvenska.startProv()" style="margin-top:8px">Kör igen 🔄</button>
        <button class="svk-btn secondary" onclick="NpSvenska.showSelectScreen()" style="margin-top:4px">Tillbaka till menyn</button>
      </div>
    `;

    if (score >= 11) {
      App.Sound.play('win');
      if (typeof App.Confetti !== 'undefined') App.Confetti.burst(250);
    }
  }

  /* ── Canvas ──────────────────────────────────────────────── */
  function initCanvas() {
    canvasEl = document.getElementById('svk-canvas');
    if (!canvasEl) return;
    const wrap = canvasEl.parentElement;
    canvasEl.width  = wrap.clientWidth  || 300;
    canvasEl.height = wrap.clientHeight || 36;
    canvasCtx = canvasEl.getContext('2d');
    canvasCtx.lineCap = 'round';
    canvasCtx.lineJoin = 'round';
    tool = 'pen';

    canvasEl.addEventListener('pointerdown', onPointerDown);
    canvasEl.addEventListener('pointermove', onPointerMove);
    canvasEl.addEventListener('pointerup',   onPointerUp);
    canvasEl.addEventListener('pointerleave',onPointerUp);
  }

  function onPointerDown(e) {
    e.preventDefault();
    isDrawing = true;
    const r = canvasEl.getBoundingClientRect();
    lastX = e.clientX - r.left;
    lastY = e.clientY - r.top;
    canvasEl.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const r = canvasEl.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    canvasCtx.beginPath();
    if (tool === 'eraser') {
      canvasCtx.globalCompositeOperation = 'destination-out';
      canvasCtx.lineWidth = 16;
    } else {
      canvasCtx.globalCompositeOperation = 'source-over';
      canvasCtx.strokeStyle = '#1e293b';
      canvasCtx.lineWidth = 2;
    }
    canvasCtx.moveTo(lastX, lastY);
    canvasCtx.lineTo(x, y);
    canvasCtx.stroke();
    lastX = x; lastY = y;
  }

  function onPointerUp(e) { isDrawing = false; }

  function setTool(t) {
    tool = t;
    document.getElementById('svk-pen-btn') ?.classList.toggle('active', t === 'pen');
    document.getElementById('svk-sudd-btn')?.classList.toggle('active', t === 'eraser');
  }

  function clearCanvas() {
    if (canvasCtx) canvasCtx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  }

  /* ── Skrivläge – välj typ ────────────────────────────────── */
  function showWriteSelect() {
    App.Sound.play('click');
    const root = document.getElementById('np-svenska-skriva-root');
    root.innerHTML = `
      <div class="svk-header">
        <button class="svk-btn-back" onclick="NpSvenska.showSelectScreen()">Tillbaka</button>
        <span class="svk-title">✏️ Skriva</span>
        <button class="svk-btn-back" onclick="NpSvenska.showLog()">📚 Min bok</button>
      </div>
      <div style="padding:16px;display:flex;flex-direction:column;gap:14px;flex:1;overflow-y:auto">

        <div class="card" style="
          display:flex;align-items:center;gap:16px;padding:18px;cursor:pointer;
          background:linear-gradient(135deg,#fef9c3 0%,#d1fae5 100%);
          border:2px solid rgba(5,150,105,0.2);transition:transform 0.2s,box-shadow 0.2s;"
          onclick="NpSvenska.startWriteStory()"
          onmouseenter="this.style.transform='translateY(-3px)';this.style.boxShadow='var(--shadow-lg)'"
          onmouseleave="this.style.transform='';this.style.boxShadow=''">
          <div style="font-size:2.5rem">📖</div>
          <div style="flex:1">
            <div style="font-family:var(--font-heading);font-size:18px;color:#059669">Skriv en berättelse</div>
            <div style="font-size:13px;color:#64748b;font-weight:700;margin-top:4px">Välj ett ämne och skriv fritt</div>
          </div>
          <div style="font-size:20px;opacity:0.5">›</div>
        </div>

        <div class="card" style="
          display:flex;align-items:center;gap:16px;padding:18px;cursor:pointer;
          background:linear-gradient(135deg,#eff6ff 0%,#fdf4ff 100%);
          border:2px solid rgba(124,58,237,0.2);transition:transform 0.2s,box-shadow 0.2s;"
          onclick="NpSvenska.startWriteFacts()"
          onmouseenter="this.style.transform='translateY(-3px)';this.style.boxShadow='var(--shadow-lg)'"
          onmouseleave="this.style.transform='';this.style.boxShadow=''">
          <div style="font-size:2.5rem">📋</div>
          <div style="flex:1">
            <div style="font-family:var(--font-heading);font-size:18px;color:#7c3aed">Skriv en faktatext</div>
            <div style="font-size:13px;color:#64748b;font-weight:700;margin-top:4px">Stödord hjälper dig skriva 📝</div>
          </div>
          <div style="font-size:20px;opacity:0.5">›</div>
        </div>
      </div>
    `;
    Router.show('screen-np-svenska-skriva');
  }

  /* ── Skriv berättelse ────────────────────────────────────── */
  let currentWritePrompt = null;
  let currentFactsPrompt = null;

  function startWriteStory() {
    App.Sound.play('click');
    currentWritePrompt = pick(STORY_PROMPTS);
    const root = document.getElementById('np-svenska-skriva-root');
    root.innerHTML = `
      <div class="svk-header">
        <button class="svk-btn-back" onclick="NpSvenska.showWriteSelect()">Tillbaka</button>
        <span class="svk-title">📖 Skriv berättelse</span>
        <div style="width:80px"></div>
      </div>
      <div class="svk-write-dashboard" id="svk-write-db">
        <div class="svk-write-left">
          <div style="font-size:11px;font-weight:900;color:#059669;letter-spacing:0.06em;margin-bottom:6px">UPPGIFT</div>
          <div style="font-size:14px;font-weight:700;color:#1e293b;line-height:1.5">${esc(currentWritePrompt)}</div>
          <div style="margin-top:10px;font-size:12px;color:#64748b;line-height:1.5;background:#f0fdf4;border-radius:8px;padding:8px">
            💡 Tips: en bra berättelse har en inledning, en handling och en avslutning. Skriv med hela meningar!
          </div>
        </div>
        <div class="svk-write-right">
          <input class="svk-title-input" id="svk-story-title" placeholder="Din rubrik (frivilligt)" maxlength="80">
          <textarea class="svk-textarea" id="svk-story-text" placeholder="Skriv din berättelse här..." oninput="NpSvenska.updateWordCount('svk-story-text','svk-wc')"></textarea>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="svk-wordcount" id="svk-wc">0 ord</span>
            <button class="svk-btn" onclick="NpSvenska.saveStory()">Jag är klar ✅</button>
          </div>
        </div>
      </div>
    `;
  }

  function updateWordCount(textareaId, wcId) {
    const ta = document.getElementById(textareaId);
    const wc = document.getElementById(wcId);
    if (ta && wc) wc.textContent = countWords(ta.value) + ' ord';
  }

  function saveStory() {
    const titleEl = document.getElementById('svk-story-title');
    const textEl  = document.getElementById('svk-story-text');
    const title   = titleEl ? titleEl.value.trim() : '';
    const text    = textEl  ? textEl.value.trim()  : '';
    if (!text) { alert('Skriv något i textfältet först! ✏️'); return; }

    const entry = {
      id: Date.now(),
      date: new Date().toISOString(),
      type: 'write_story',
      prompt: currentWritePrompt,
      title: title || 'Min berättelse',
      text,
      wordCount: countWords(text),
      authorName: profile.name
    };
    appendLog(entry);
    App.Sound.play('win');
    if (typeof App.Confetti !== 'undefined') App.Confetti.burst({ count: 120 });
    showBookView(entry, () => showWriteSelect());
  }

  /* ── Skriv faktatext ─────────────────────────────────────── */
  function startWriteFacts() {
    App.Sound.play('click');
    currentFactsPrompt = pick(FACTS_PROMPTS);
    const root = document.getElementById('np-svenska-skriva-root');
    root.innerHTML = `
      <div class="svk-header">
        <button class="svk-btn-back" onclick="NpSvenska.showWriteSelect()">Tillbaka</button>
        <span class="svk-title">📋 Faktatext: ${esc(currentFactsPrompt.theme)}</span>
        <div style="width:80px"></div>
      </div>
      <div class="svk-write-dashboard" id="svk-write-db">
        <div class="svk-write-left">
          <div style="font-size:11px;font-weight:900;color:#7c3aed;letter-spacing:0.06em;margin-bottom:6px">UPPGIFT</div>
          <div style="font-size:14px;font-weight:700;color:#1e293b;line-height:1.5">${esc(currentFactsPrompt.prompt)}</div>
          <div style="margin-top:10px">
            <div style="font-size:11px;font-weight:900;color:#059669;letter-spacing:0.06em;margin-bottom:6px">STÖDORD</div>
            <div style="display:flex;flex-wrap:wrap;gap:5px">
              ${currentFactsPrompt.words.map(w => `<span style="background:#d1fae5;color:#065f46;border-radius:6px;padding:3px 8px;font-size:12px;font-weight:700">${esc(w)}</span>`).join('')}
            </div>
          </div>
          <div style="margin-top:10px;font-size:12px;color:#64748b;background:#f0fdf4;border-radius:8px;padding:8px;line-height:1.5">
            Försök använda stödorden. Skriv med hela meningar.
          </div>
        </div>
        <div class="svk-write-right">
          <input class="svk-title-input" id="svk-facts-title" placeholder="Din rubrik (frivilligt)" maxlength="80">
          <textarea class="svk-textarea" id="svk-facts-text" placeholder="Skriv din faktatext här..." oninput="NpSvenska.updateWordCount('svk-facts-text','svk-facts-wc')"></textarea>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="svk-wordcount" id="svk-facts-wc">0 ord</span>
            <button class="svk-btn" onclick="NpSvenska.saveFacts()">Jag är klar ✅</button>
          </div>
        </div>
      </div>
    `;
  }

  function saveFacts() {
    const titleEl = document.getElementById('svk-facts-title');
    const textEl  = document.getElementById('svk-facts-text');
    const title   = titleEl ? titleEl.value.trim() : '';
    const text    = textEl  ? textEl.value.trim()  : '';
    if (!text) { alert('Skriv något i textfältet först! ✏️'); return; }

    const entry = {
      id: Date.now(),
      date: new Date().toISOString(),
      type: 'write_facts',
      prompt: currentFactsPrompt.prompt,
      theme: currentFactsPrompt.theme,
      title: title || `Faktatext: ${currentFactsPrompt.theme}`,
      supportWords: currentFactsPrompt.words,
      text,
      wordCount: countWords(text),
      authorName: profile.name
    };
    appendLog(entry);
    App.Sound.play('win');
    if (typeof App.Confetti !== 'undefined') App.Confetti.burst({ count: 120 });
    showBookView(entry, () => showWriteSelect());
  }

  /* ── Bokvy ───────────────────────────────────────────────── */
  function showBookView(entry, onBack) {
    const root = entry.type === 'prov'
      ? document.getElementById('np-svenska-prov-root')
      : document.getElementById('np-svenska-skriva-root');

    const supportBlock = entry.supportWords ? `
      <div class="svk-support-words">
        <div style="font-weight:900;font-size:12px;color:#065f46;margin-bottom:5px">STÖDORD</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px">
          ${entry.supportWords.map(w => `<span style="background:rgba(5,150,105,0.15);border-radius:5px;padding:2px 7px;font-size:12px;font-weight:700">${esc(w)}</span>`).join('')}
        </div>
      </div>` : '';

    root.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;background:linear-gradient(135deg,#ecfdf5,#eff6ff)">
        <div class="svk-header">
          <button class="svk-btn-back" id="svk-book-back">Tillbaka</button>
          <span class="svk-title">✨📖✨</span>
          <div style="width:80px"></div>
        </div>
        <div style="flex:1;overflow-y:auto;padding:12px">
          <div class="svk-book-view">
            <div style="text-align:center;font-size:22px;margin-bottom:6px">✨📖✨</div>
            <div class="svk-book-title">${esc(entry.title)}</div>
            <div style="font-size:17px;line-height:1.8;color:#1e293b">${esc(entry.text).replace(/\n/g,'<br>')}</div>
            ${supportBlock}
            <div class="svk-book-author">Skriven av ${esc(entry.authorName)}, ${formatDate(entry.date)}</div>
            <div class="svk-book-wordcount">${entry.wordCount} ord</div>
          </div>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="svk-btn" style="flex:1" id="svk-book-back2">Spara &amp; gå tillbaka 💾</button>
            <button class="svk-btn secondary" style="flex:1" onclick="${entry.type === 'write_story' ? 'NpSvenska.startWriteStory()' : 'NpSvenska.startWriteFacts()'}">Skriv en till ✏️</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('svk-book-back').onclick  = onBack;
    document.getElementById('svk-book-back2').onclick = onBack;
  }

  /* ── Logg ────────────────────────────────────────────────── */
  function showLog() {
    App.Sound.play('click');
    const log = loadLog();
    const root = document.getElementById('np-svenska-skriva-root');

    Router.show('screen-np-svenska-skriva');

    if (log.length === 0) {
      root.innerHTML = `
        <div class="svk-header">
          <button class="svk-btn-back" onclick="NpSvenska.showSelectScreen()">Tillbaka</button>
          <span class="svk-title">📚 Min svenska-bok</span>
          <div style="width:80px"></div>
        </div>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;padding:24px;text-align:center">
          <div style="font-size:3rem">📚</div>
          <div style="font-family:var(--font-heading);font-size:20px;color:#059669">Din bok är tom än</div>
          <div style="font-size:14px;color:#64748b">Gör ett prov eller skriv en text för att se dem här!</div>
          <button class="svk-btn" onclick="NpSvenska.showSelectScreen()">Börja öva 🚀</button>
        </div>`;
      return;
    }

    root.innerHTML = `
      <div class="svk-header">
        <button class="svk-btn-back" onclick="NpSvenska.showSelectScreen()">Tillbaka</button>
        <span class="svk-title">📚 Min svenska-bok</span>
        <div style="font-size:12px;color:#64748b;font-weight:700">${log.length} poster</div>
      </div>
      <div class="svk-log-list" style="flex:1;overflow-y:auto">
        ${log.map((entry, i) => renderLogItem(entry, i)).join('')}
      </div>
    `;
  }

  function renderLogItem(entry, i) {
    const icon  = entry.type === 'prov' ? '📝' : entry.type === 'write_story' ? '📖' : '📋';
    const type  = entry.type === 'prov' ? 'Läsförståelse' : entry.type === 'write_story' ? 'Berättelse' : 'Faktatext';
    const score = entry.type === 'prov' ? `${entry.score} av ${entry.total} ⭐` : `${entry.wordCount} ord`;
    const title = entry.title || (entry.type === 'prov' ? 'Provsession' : 'Text');
    return `
      <div class="svk-log-item" onclick="NpSvenska.openLogEntry(${i})">
        <div class="svk-log-icon">${icon}</div>
        <div class="svk-log-meta">
          <div class="svk-log-type">${esc(type)} • ${formatDate(entry.date)}</div>
          <div class="svk-log-title">${esc(title)}</div>
          <div class="svk-log-detail">${esc(score)}</div>
        </div>
        <div style="font-size:18px;opacity:0.4">›</div>
      </div>`;
  }

  function openLogEntry(i) {
    App.Sound.play('click');
    const log   = loadLog();
    const entry = log[i];
    if (!entry) return;

    const root = document.getElementById('np-svenska-skriva-root');

    if (entry.type === 'prov') {
      root.innerHTML = `
        <div class="svk-header">
          <button class="svk-btn-back" onclick="NpSvenska.showLog()">Tillbaka</button>
          <span class="svk-title">📝 Provresultat</span>
          <div style="width:80px"></div>
        </div>
        <div style="flex:1;overflow-y:auto;padding:12px">
          <div style="text-align:center;padding:12px 0">
            <div style="font-size:2rem">📝</div>
            <div style="font-family:var(--font-heading);font-size:24px;color:#059669">${entry.score} av ${entry.total}</div>
            <div style="font-size:13px;color:#64748b">${formatDate(entry.date)}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${(entry.answers || []).map(a => `
              <div class="svk-result-row ${a.correct ? 'ok' : 'bad'}">
                <span>${a.correct ? '✅' : '❌'}</span>
                <span>${esc(a.category)}</span>
              </div>`).join('')}
          </div>
        </div>`;
    } else {
      showBookView(entry, () => showLog());
    }
  }

  /* ── Public API ──────────────────────────────────────────── */
  return {
    init,
    showSelectScreen,
    startProv,
    showWriteSelect,
    startWriteStory,
    startWriteFacts,
    saveStory,
    saveFacts,
    showLog,
    openLogEntry,
    setTool,
    clearCanvas,
    updateWordCount
  };
})();
