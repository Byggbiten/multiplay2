/* ============================================================
   MULTIPLAY – 10-Kompisar
   Övning + Test. Renderar i #friends-root.
   Designsystem v25: komponentklasser + .theme-friends (lila/gult).
   KONTRASTLAG: aldrig vit text på gula ytor — alltid var(--choco).
   ============================================================ */
'use strict';

const FriendsGame = (() => {

  /* ── Tillstånd ─────────────────────────────────────── */
  let profile    = null;
  let practiceN  = 5;   // Det lila talet (1–9; paren 0+10/10+0 utgår)

  const LOG_KEY  = id => `friends_log_${id}`;

  /* ── Logg ──────────────────────────────────────────── */
  function sessionLog() {
    return MP.createLog(LOG_KEY(profile.id), 40);
  }

  function getLog() { return sessionLog().get(); }

  function addLog(entry) { sessionLog().add(entry); }

  /* ── Modulspecifik CSS (EN injektion, följer med varje render) ── */
  const FRIENDS_CSS = `
    #friends-root .wrap { gap: clamp(6px, 1.2vh, 14px); }
    .fr-spacer { width: 52px; flex-shrink: 0; }
    .fr-stage {
      flex: 1; min-height: 0; width: 100%;
      display: flex; flex-direction: column; align-items: center;
      justify-content: space-evenly; gap: clamp(6px, 1vh, 12px);
    }

    /* Ekvationsraden: lila bubbla + gul bubbla = 10 */
    .fr-eq { display: flex; align-items: center; justify-content: center; gap: clamp(8px, 1.8vw, 16px); }
    .fr-bubble {
      width: clamp(56px, 11vh, 112px); height: clamp(56px, 11vh, 112px);
      border-radius: 50%; display: grid; place-items: center;
      font-family: var(--font-head); font-weight: 800;
      font-size: clamp(28px, 5.6vh, 56px); line-height: 1; user-select: none;
    }
    .fr-bubble-purple {
      background: linear-gradient(135deg, #6d28d9, #a78bfa);
      color: #fff; border: 3px solid #5b21b6;
      box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
    }
    .fr-bubble-yellow {
      background: linear-gradient(135deg, #fbbf24, #fde047);
      color: var(--choco); border: 3px solid #d97706;
      box-shadow: 0 6px 20px rgba(217, 119, 6, 0.35);
    }
    .fr-bubble-q {
      background: var(--glass); border: 3px dashed var(--accent-light);
      color: var(--accent); box-shadow: var(--shadow-sm);
    }
    .fr-op {
      font-family: var(--font-head); font-weight: 800;
      font-size: clamp(24px, 4.8vh, 46px); color: var(--deep);
    }
    .fr-sum {
      min-width: clamp(56px, 11vh, 112px); height: clamp(56px, 11vh, 112px);
      padding: 0 clamp(10px, 2vw, 18px); border-radius: var(--radius-full);
      display: grid; place-items: center;
      font-family: var(--font-head); font-weight: 800;
      font-size: clamp(28px, 5.6vh, 56px); line-height: 1; user-select: none;
      background: var(--glass-strong); color: var(--deep);
      border: 3px solid var(--accent-2); box-shadow: 0 6px 20px rgba(217, 119, 6, 0.25);
    }

    /* Monumental variant för testfrågan — uppgiften äger skärmen */
    .fr-eq-big .fr-bubble, .fr-eq-big .fr-sum {
      width: clamp(60px, min(13vh, 20vw), 132px);
      height: clamp(60px, min(13vh, 20vw), 132px);
    }
    .fr-eq-big .fr-sum { min-width: clamp(60px, min(13vh, 20vw), 132px); padding: 0 clamp(8px, 1.6vw, 16px); }
    .fr-eq-big .fr-bubble, .fr-eq-big .fr-sum { font-size: clamp(32px, 6.6vh, 66px); }
    .fr-eq-big .fr-op { font-size: clamp(26px, 5.4vh, 54px); }

    /* Tio-rutnätet — pedagogikens hjärta, uppskalat */
    .fr-gridcard {
      background: var(--glass-strong); border: 2px solid var(--glass-line);
      border-radius: var(--radius-xl); box-shadow: var(--shadow-panel);
      padding: clamp(10px, 2vh, 20px);
    }
    #friends-root .ten-grid { max-width: none; gap: clamp(6px, 1.2vh, 12px); }
    #friends-root .ten-cell {
      width: clamp(42px, min(10.5vh, 15vw), 100px);
      display: grid; place-items: center;
      font-family: var(--font-head); font-weight: 800;
      font-size: clamp(16px, 3.2vh, 34px); line-height: 1; user-select: none;
    }
    #friends-root .ten-cell.filled-purple { color: #fff; }
    #friends-root .ten-cell.filled-yellow { color: var(--choco); }
    .fr-grid-sm .ten-cell { width: clamp(30px, min(6vh, 8vw), 52px) !important;
      font-size: clamp(12px, 2.2vh, 19px) !important; }
    @keyframes fr-pop { 0% { transform: scale(0.55); } 65% { transform: scale(1.18); } }
    #friends-root .fr-flip { animation: fr-pop 0.38s var(--spring); }

    /* Alla kompisar-chips */
    .fr-label {
      font-size: clamp(10px, 1.7vh, 13px); font-weight: 800; letter-spacing: 0.08em;
      text-transform: uppercase; color: var(--ink-soft); text-align: center;
      margin-bottom: clamp(4px, 0.8vh, 8px);
    }
    .fr-pairs { display: flex; flex-wrap: wrap; justify-content: center; gap: clamp(4px, 0.8vh, 8px); }
    .fr-pairs .chip { padding: 6px clamp(8px, 1.4vw, 14px); font-size: clamp(12px, 1.9vh, 15px); }

    /* Kontroller + start */
    .fr-controls {
      display: flex; align-items: center; justify-content: center;
      gap: clamp(8px, 1.5vw, 14px); flex-wrap: wrap; width: 100%;
    }
    .fr-controls .icon-btn { color: var(--accent); }
    .fr-start { min-width: 220px; }

    /* Testvyn — quiz-mallen: progress som kapsel i headern, inget eget band */
    #friends-root .header-progress {
      display: inline-flex; align-items: center; gap: clamp(6px, 1vw, 10px);
      padding: 8px clamp(10px, 1.6vw, 16px); border-radius: var(--radius-full);
      background: var(--glass-strong); border: 2px solid var(--glass-line);
      box-shadow: var(--shadow-panel); flex-shrink: 0; white-space: nowrap;
      font-family: var(--font-head); font-weight: 800;
      font-size: clamp(13px, 2vh, 16px); color: var(--deep);
    }
    #friends-root .header-progress .fr-hp-bar {
      width: clamp(34px, 6vw, 64px); height: 8px; border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.7); border: 1px solid var(--glass-line); overflow: hidden;
    }
    #friends-root .header-progress .fr-hp-bar i {
      display: block; height: 100%; border-radius: var(--radius-full);
      background: linear-gradient(90deg, var(--accent), var(--accent-light));
      transition: width 0.4s var(--spring);
    }
    .fr-prompt {
      font-size: clamp(11px, 1.8vh, 15px); font-weight: 800; letter-spacing: 0.08em;
      text-transform: uppercase; color: var(--ink-soft); text-align: center;
    }
    .fr-answers {
      display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr;
      gap: clamp(10px, 1.8vh, 18px); width: 100%; max-width: 620px;
      flex: 1 1 auto; min-height: 0; max-height: clamp(190px, 38vh, 420px);
    }
    #friends-root .fr-answers .answer-option {
      height: 100%; min-height: 64px;
      padding: clamp(8px, 1.6vh, 16px);
      font-size: clamp(30px, 6vh, 56px); font-weight: 800;
    }

    /* Resultatvyn */
    .fr-pctsign { font-size: 0.45em; }
    .fr-detailcard { padding: clamp(10px, 2vh, 18px); }
    #friends-root .card-title svg { color: var(--accent); }
    .fr-detail-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(4px, 1vh, 8px); }
    .fr-detail {
      text-align: center; padding: clamp(4px, 1vh, 8px) 2px;
      border-radius: var(--radius-md); font-family: var(--font-head);
      font-weight: 800; font-size: clamp(12px, 2vh, 16px);
      border: 2px solid transparent;
    }
    .fr-detail.ok   { background: #dcfce7; border-color: #86efac; color: #14532d; }
    .fr-detail.miss { background: #fee2e2; border-color: #fca5a5; color: #7f1d1d; }

    /* Historik */
    #friends-root .history-list { flex: 1; }
    .fr-new {
      display: inline-block; margin-left: 6px; vertical-align: middle;
      background: var(--accent); color: #fff; font-size: 10px; font-weight: 900;
      padding: 2px 8px; border-radius: var(--radius-full); letter-spacing: 0.04em;
    }
    .fr-empty {
      flex: 1; min-height: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: var(--space-4); text-align: center;
    }
    .fr-empty-emoji { font-size: clamp(48px, 9vh, 72px); }
    .fr-empty p { color: var(--ink-soft); font-weight: 700; }
  `;

  const styleTag = () => `<style id="friends-css">${FRIENDS_CSS}</style>`;

  /* ── Inline-SVG (UI-ikoner, 24×24 rundad stroke) ───── */
  const SVG_MINUS = `<svg class="icn" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>`;
  const SVG_DICE  = `<svg class="icn" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="9" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1" fill="currentColor" stroke="none"/></svg>`;

  /* ══════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════ */
  function init(p) {
    profile   = p;
    practiceN = 5;
    renderPractice();
  }

  /* ══════════════════════════════════════════════════════
     ÖVNINGSLÄGE
  ══════════════════════════════════════════════════════ */
  function renderPractice() {
    const root = document.getElementById('friends-root');
    const companion = 10 - practiceN;

    root.innerHTML = `
      ${styleTag()}
      <div class="app-header">
        <button class="btn-back" onclick="App.goBackToGameSelect()">Tillbaka</button>
        <span class="header-title">10-Kompisar</span>
        <button class="icon-btn" aria-label="Historik" onclick="FriendsGame.showHistory()">
          <svg class="icn"><use href="#i-history"/></svg>
        </button>
      </div>

      <div class="wrap">
        <div class="fr-stage">

          <!-- Ekvationen: lila + gul = 10 -->
          <div class="fr-eq" aria-live="polite">
            <span class="fr-bubble fr-bubble-purple num" id="purple-number">${practiceN}</span>
            <span class="fr-op">+</span>
            <span class="fr-bubble fr-bubble-yellow num" id="yellow-number">${companion}</span>
            <span class="fr-op">=</span>
            <span class="fr-sum num">10</span>
          </div>

          <!-- Tio-rutnätet -->
          <div class="fr-gridcard">${drawTenGrid(practiceN, 'fr-grid')}</div>

          <!-- Alla kompisar -->
          <div>
            <div class="fr-label">Alla 10-kompisar 💛</div>
            <div class="fr-pairs">
              ${[1,2,3,4,5,6,7,8,9].map(n => `
                <button class="chip num${n === practiceN ? ' chip-active' : ''}" id="fr-chip-${n}"
                  onclick="FriendsGame.setN(${n})">${n} + ${10 - n}</button>
              `).join('')}
            </div>
          </div>

          <!-- Kontroller + starta test (kompakt rad) -->
          <div class="fr-controls">
            <button class="icon-btn" aria-label="Minska" title="Minska" onclick="FriendsGame.adjustN(-1)">${SVG_MINUS}</button>
            <button class="icon-btn" aria-label="Återställ" title="Återställ" onclick="FriendsGame.resetN()">
              <svg class="icn"><use href="#i-refresh"/></svg>
            </button>
            <button class="icon-btn" aria-label="Slumpa" title="Slumpa" onclick="FriendsGame.randomN()">${SVG_DICE}</button>
            <button class="icon-btn" aria-label="Öka" title="Öka" onclick="FriendsGame.adjustN(1)">
              <svg class="icn"><use href="#i-plus"/></svg>
            </button>
            <button class="btn btn-primary btn-lg fr-start" onclick="FriendsGame.startTest()">
              <svg class="icn"><use href="#i-play"/></svg>
              Starta test!
            </button>
          </div>

        </div>
      </div>
    `;
  }

  /* ── TenGrid ───────────────────────────────────────── */
  function drawTenGrid(n, gridId) {
    let cells = '';
    for (let i = 0; i < 10; i++) {
      const cls = i < n ? 'ten-cell filled-purple' : 'ten-cell filled-yellow';
      cells += `<div class="${cls}">${i + 1}</div>`;
    }
    return `<div class="ten-grid"${gridId ? ` id="${gridId}"` : ''}>${cells}</div>`;
  }

  /* ── Mjuk uppdatering på plats (grid-animation) ────── */
  function popEl(el, val) {
    if (!el) return;
    if (val !== undefined && String(el.textContent) !== String(val)) el.textContent = val;
    el.classList.remove('fr-flip');
    void el.offsetWidth;               // starta om animationen
    el.classList.add('fr-flip');
  }

  function patchPractice() {
    const grid = document.getElementById('fr-grid');
    if (!grid) { renderPractice(); return; }

    const companion = 10 - practiceN;
    const cells = grid.children;
    for (let i = 0; i < cells.length; i++) {
      const want = i < practiceN ? 'filled-purple' : 'filled-yellow';
      if (!cells[i].classList.contains(want)) {
        cells[i].classList.remove('filled-purple', 'filled-yellow');
        cells[i].classList.add(want);
        popEl(cells[i]);
      }
    }
    popEl(document.getElementById('purple-number'), practiceN);
    popEl(document.getElementById('yellow-number'), companion);
    for (let n = 1; n <= 9; n++) {
      const chip = document.getElementById(`fr-chip-${n}`);
      if (chip) chip.classList.toggle('chip-active', n === practiceN);
    }
  }

  /* ── Kontroller (talområde 1–9) ────────────────────── */
  function adjustN(delta) {
    practiceN = Math.max(1, Math.min(9, practiceN + delta));
    App.Sound.play('click');
    patchPractice();
  }

  function setN(n) {
    practiceN = n;
    App.Sound.play('click');
    patchPractice();
  }

  function resetN() {
    practiceN = 1;
    App.Sound.play('click');
    patchPractice();
  }

  function randomN() {
    practiceN = Math.floor(Math.random() * 9) + 1;
    App.Sound.play('click');
    patchPractice();
  }

  /* ══════════════════════════════════════════════════════
     TESTLÄGE – 9 FRÅGOR
  ══════════════════════════════════════════════════════ */
  function startTest() {
    App.Sound.play('click');
    // Bygg frågor: 1–9 blandade (aldrig 0 eller 10)
    const questions = MP.shuffle([1,2,3,4,5,6,7,8,9]);
    runTest(questions);
  }

  function runTest(questions) {
    const TOTAL = questions.length;
    const quiz = MP.createRetryQuiz(questions);
    const results = [];          // första försöket per fråga (avgör poängen)
    const firstTried = new Set();

    function render() {
      const n = quiz.current();
      if (n === null) { showTestResult(quiz.stats(), results); return; }

      const corr = 10 - n;

      const root = document.getElementById('friends-root');
      const prog = quiz.progress();
      const progress = prog.answered / TOTAL;

      root.innerHTML = `
      ${styleTag()}
      <div class="app-header">
        <button class="btn-back" onclick="FriendsGame.renderPractice()">Avbryt</button>
        <span class="header-title">10-Kompisar · Test</span>
        <span class="header-progress num" aria-label="Fråga ${Math.min(prog.answered + 1, TOTAL)} av ${TOTAL}">
          ${Math.min(prog.answered + 1, TOTAL)} av ${TOTAL}
          <span class="fr-hp-bar"><i style="width:${Math.round(progress * 100)}%"></i></span>
        </span>
      </div>

      <div class="wrap">
        <div class="fr-stage">

          <!-- Frågan — monumental -->
          <div class="fr-prompt">Vad är kompisen till...</div>
          <div class="fr-eq fr-eq-big">
            <span class="fr-bubble fr-bubble-purple num">${n}</span>
            <span class="fr-op">+</span>
            <span class="fr-bubble fr-bubble-q num">?</span>
            <span class="fr-op">=</span>
            <span class="fr-sum num">10</span>
          </div>

          <!-- 10-ruta som ledtråd -->
          <div class="fr-gridcard fr-grid-sm">${drawTenGrid(n)}</div>

          <!-- Svarsalternativ (4st) -->
          <div class="fr-answers">
            ${generateFriendsOptions(corr).map((opt, i) => `
              <button class="answer-option num" id="fopt-${i}"
                onclick="FriendsGame._handleAnswer(${opt})">${opt}</button>
            `).join('')}
          </div>

        </div>
      </div>
    `;

      FriendsGame._handleAnswer = (chosen) => {
        const wasCorrect = chosen === corr;
        App.Sound.play(wasCorrect ? 'correct' : 'wrong');

        // Visuell feedback på knappar
        document.querySelectorAll('.answer-option').forEach(btn => {
          btn.disabled = true;
          const val = parseInt(btn.textContent.trim());
          if (val === corr) btn.classList.add('correct');
          else if (val === chosen && !wasCorrect) btn.classList.add('wrong');
        });

        // Flash
        const flash = document.createElement('div');
        flash.className = 'feedback-overlay';
        flash.innerHTML = `<div class="feedback-emoji">${wasCorrect ? '✅' : '❌'}</div>`;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 900);

        // Första försöket på denna fråga avgör poängen
        if (!firstTried.has(n)) {
          firstTried.add(n);
          results.push({ n, chosen, correct: wasCorrect });
        }
        quiz.answer(wasCorrect);

        setTimeout(render, wasCorrect ? 700 : 1400);
      };
    }

    render();
  }

  /* ── Generera svarsalternativ (1–9, aldrig 0/10) ───── */
  function generateFriendsOptions(correct) {
    const opts = new Set([correct]);
    while (opts.size < 4) {
      const delta = Math.floor(Math.random() * 4) + 1;
      const sign  = Math.random() < 0.5 ? 1 : -1;
      const val   = Math.max(1, Math.min(9, correct + delta * sign));
      opts.add(val);
    }
    return [...opts].sort(() => Math.random() - 0.5);
  }

  /* ══════════════════════════════════════════════════════
     TESTRESULTAT
  ══════════════════════════════════════════════════════ */
  function medalLabel(pct) {
    if (pct >= 95) return 'GULDMEDALJ';
    if (pct >= 85) return 'SILVERMEDALJ';
    if (pct >= 75) return 'BRONSMEDALJ';
    return '';
  }

  function showTestResult(stats, results) {
    // Första försöket per fråga avgör poängen
    const totalCorrect = stats.firstTryCorrect;
    const total        = stats.total;
    const pct          = stats.pct;

    App.Sound.play(pct >= 80 ? 'fanfare' : 'correct');
    if (pct === 100) App.Confetti.burst(80);

    addLog({ totalCorrect, total, pct, results });

    const { emoji, msg } = MP.feedbackMessage(pct);
    const medal = MP.getMedal(pct) || emoji;
    const label = medalLabel(pct);

    const root = document.getElementById('friends-root');
    root.innerHTML = `
      ${styleTag()}
      <div class="app-header">
        <button class="btn-back" onclick="FriendsGame.renderPractice()">Tillbaka</button>
        <span class="header-title">Resultat</span>
        <span class="fr-spacer"></span>
      </div>

      <div class="wrap">
        <div class="result-hero">
          <div class="result-pct num">${pct}<span class="fr-pctsign">%</span></div>
          <div><span class="result-medal">${medal}</span></div>
          ${label ? `<div><span class="result-medal-label">${label}</span></div>` : ''}
          <p class="result-msg">${msg}</p>
          <p class="result-note num">${totalCorrect} av ${total} rätt på första försöket</p>
        </div>

        <!-- Detaljer per tal -->
        <div class="card fr-detailcard">
          <div class="card-title">
            <svg class="icn"><use href="#i-stats"/></svg>
            Detaljresultat
          </div>
          <div class="fr-detail-grid">
            ${results.map(r => `
              <div class="fr-detail num ${r.correct ? 'ok' : 'miss'}">
                ${r.n} + ${10 - r.n}<br>${r.correct ? '✓' : '✗'}
              </div>
            `).join('')}
          </div>
        </div>

        <div class="result-actions">
          <button class="btn btn-primary btn-lg" onclick="FriendsGame.startTest()">
            <svg class="icn"><use href="#i-refresh"/></svg>
            Spela igen
          </button>
          <button class="btn btn-ghost btn-lg" onclick="FriendsGame.renderPractice()">
            Tillbaka till övning
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
    const root = document.getElementById('friends-root');

    const header = `
      <div class="app-header">
        <button class="btn-back" onclick="FriendsGame.renderPractice()">Tillbaka</button>
        <span class="header-title">Historik</span>
        <span class="fr-spacer"></span>
      </div>
    `;

    if (log.length === 0) {
      root.innerHTML = `
        ${styleTag()}
        ${header}
        <div class="wrap">
          <div class="fr-empty">
            <div class="fr-empty-emoji">📭</div>
            <p>Inga test gjorda ännu!</p>
            <button class="btn btn-primary btn-lg" onclick="FriendsGame.startTest()">
              <svg class="icn"><use href="#i-play"/></svg>
              Gör ett test nu!
            </button>
          </div>
        </div>
      `;
      return;
    }

    root.innerHTML = `
      ${styleTag()}
      ${header}
      <div class="wrap">
        <div class="history-list">
          ${log.map((e, i) => {
            const d = new Date(e.date);
            const dateStr = d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
            const timeStr = d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
            return `
              <div class="history-item">
                <span class="history-icon">${MP.getMedal(e.pct) || '🤝'}</span>
                <div class="history-main">
                  <div class="history-title">10-Kompisar${i === 0 ? '<span class="fr-new">NY!</span>' : ''}</div>
                  <div class="history-sub num">${dateStr} kl ${timeStr} · ${e.totalCorrect}/${e.total || 10} rätt</div>
                </div>
                <span class="history-value num">${e.pct} %</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /* ── Publik API ────────────────────────────────────── */
  return {
    init,
    renderPractice,
    adjustN,
    setN,
    resetN,
    randomN,
    startTest,
    showHistory,
    _handleAnswer: null,
  };
})();
