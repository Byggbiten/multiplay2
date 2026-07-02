/* ============================================================
   MULTIPLAY – Gångertabellen
   Modulen renderar sig i #mult-root.
   Följer DESIGN.md: lila/orange, magisk känsla.
   ============================================================ */
'use strict';

const MultGame = (() => {

  /* ── Tillstånd ─────────────────────────────────────── */
  let profile      = null;
  let rangeMin     = 1;
  let rangeMax     = 12;
  let answerMode   = 'choice';   // 'choice' | 'free'
  let timer        = { id: null, seconds: 0, active: false };
  let sessionStart = null;

  /* ── Statistik-nycklar ─────────────────────────────── */
  const STATS_KEY = id => `mult_stats_${id}`;
  const LOG_KEY   = id => `mult_log_${id}`;

  /* ── Statistik-hantering ───────────────────────────── */
  function getStats() {
    try { return JSON.parse(localStorage.getItem(STATS_KEY(profile.id))) || {}; }
    catch(_) { return {}; }
  }

  function saveStats(s) {
    MP.safeSetItem(STATS_KEY(profile.id), JSON.stringify(s));
  }

  function sessionLog() {
    return MP.createLog(LOG_KEY(profile.id), 50);
  }

  function getLog() { return sessionLog().get(); }

  function recordAnswer(table, multiplier, correct) {
    const stats = getStats();
    const key = `${table}x${multiplier}`;
    if (!stats[key]) stats[key] = { correct: 0, total: 0 };
    stats[key].total++;
    if (correct) stats[key].correct++;
    saveStats(stats);
  }

  function getTablePercent(table) {
    const stats = getStats();
    let cor = 0, tot = 0;
    for (let m = 1; m <= 12; m++) {
      const k = `${table}x${m}`;
      if (stats[k]) { cor += stats[k].correct; tot += stats[k].total; }
    }
    if (tot === 0) return null;
    return Math.round((cor / tot) * 100);
  }

  function addSessionLog(entry) {
    sessionLog().add(entry);
  }

  // Resultatnivå → befintlig CSS-klass
  const RESULT_CLS = {
    excellent: 'result-excellent',
    good:      'result-good',
    ok:        'result-ok',
    practice:  'result-tryagain',
  };

  /* ── Init ──────────────────────────────────────────── */
  function init(p) {
    profile  = p;
    rangeMin = 1;
    rangeMax = 12;
    stopTimer();
    renderMain();
  }

  /* ══════════════════════════════════════════════════════
     HUVUD-VY
  ══════════════════════════════════════════════════════ */
  function renderMain() {
    const root = document.getElementById('mult-root');
    const pct  = getTablePercent;

    root.innerHTML = `
      <div class="app-header">
        <button class="btn-back" onclick="App.goBackToGameSelect()">Tillbaka</button>
        <span class="header-title" style="color:var(--mult-primary)">✖️ Gångertabellen</span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="MultGame.showStats()">📊</button>
          <button class="btn btn-ghost btn-sm" onclick="MultGame.showLog()">📝</button>
        </div>
      </div>

      <div style="padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-4)">

        <!-- TIMER-SEKTION -->
        <div id="mult-timer-display"></div>

        <!-- RANGE SELECTOR -->
        <div class="card-glass" style="padding:var(--space-4)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-3)">
            <span style="font-weight:800;color:var(--mult-primary)">🎯 Talintervall</span>
            <span id="range-label" style="font-weight:900;font-size:var(--text-lg);color:var(--mult-primary)">1 – 12</span>
          </div>
          <div style="display:flex;gap:var(--space-3);align-items:center">
            <span style="font-size:var(--text-xs);font-weight:800;color:var(--color-text-muted)">Min</span>
            <input type="range" class="range-input" id="range-min" min="1" max="12" value="1" oninput="MultGame.updateRange()">
            <span style="font-size:var(--text-xs);font-weight:800;color:var(--color-text-muted)">Max</span>
            <input type="range" class="range-input" id="range-max" min="1" max="12" value="12" oninput="MultGame.updateRange()">
          </div>
        </div>

        <!-- TIMER-KNAPPAR -->
        <div class="card-glass" style="padding:var(--space-4)">
          <div style="font-weight:800;color:var(--mult-primary);margin-bottom:var(--space-3)">⏰ Träna med timer</div>
          <div style="display:flex;gap:var(--space-2);flex-wrap:wrap">
            ${[10,15,20,30].map(m => `
              <button class="btn btn-ghost btn-sm" onclick="MultGame.startTimer(${m})">${m} min</button>
            `).join('')}
            <button class="btn btn-danger btn-sm" id="btn-stop-timer" style="display:none" onclick="MultGame.stopTimer()">⏹ Stoppa</button>
          </div>
        </div>

        <!-- EGET MATTEPROV -->
        <button class="btn btn-accent btn-lg w-full" onclick="MultGame.showCustomTest()">
          🎲 Gör ett eget Matteprov →
        </button>

        <!-- TABELL-GRID -->
        <div class="section-title">Välj en tabell 👇</div>
        <div class="grid-3" style="gap:var(--space-3)">
          ${[1,2,3,4,5,6,7,8,9,10,11,12].map(t => {
            const p = pct(t);
            const medal = MP.getMedal(p);
            return `
              <div class="table-card" onclick="MultGame.selectTable(${t})" tabindex="0" role="button" aria-label="${t}:ans tabell">
                ${medal ? `<div class="table-medal">${medal}</div>` : ''}
                <div class="table-number">${t}:an</div>
                ${p !== null ? `<div class="table-percent">${p}%</div>` : '<div class="table-percent">Ej tränad</div>'}
              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;

    updateTimerDisplay();
  }

  /* ── Timer ─────────────────────────────────────────── */
  function startTimer(minutes) {
    stopTimer();
    timer.seconds = minutes * 60;
    timer.active  = true;
    sessionStart  = Date.now();
    const stopBtn = document.getElementById('btn-stop-timer');
    if (stopBtn) stopBtn.style.display = '';
    timer.id = setInterval(() => {
      timer.seconds--;
      updateTimerDisplay();
      if (timer.seconds <= 0) {
        stopTimer();
        showTimerDone(minutes);
      }
    }, 1000);
    updateTimerDisplay();
    App.Sound.play('click');
  }

  function stopTimer() {
    if (timer.id) { clearInterval(timer.id); timer.id = null; }
    timer.active  = false;
    timer.seconds = 0;
    const btn = document.getElementById('btn-stop-timer');
    if (btn) btn.style.display = 'none';
  }

  function updateTimerDisplay() {
    const el = document.getElementById('mult-timer-display');
    if (!el) return;
    if (!timer.active) { el.innerHTML = ''; return; }
    const m   = Math.floor(timer.seconds / 60);
    const s   = timer.seconds % 60;
    const str = `${m}:${String(s).padStart(2,'0')}`;
    const cls = timer.seconds <= 60 ? 'timer-danger' : timer.seconds <= 180 ? 'timer-warning' : '';
    el.innerHTML = `<div class="timer-bar ${cls}">⏰ ${str}</div>`;
  }

  function showTimerDone(minutes) {
    App.Confetti.burst(80);
    App.Sound.play('fanfare');
    const elapsed = sessionStart ? Math.round((Date.now() - sessionStart) / 60000) : minutes;
    addSessionLog({ type: 'timer', minutes: elapsed });
    showModal(`
      <div style="text-align:center">
        <div style="font-size:4rem;margin-bottom:var(--space-4)">🎉</div>
        <h3 style="color:var(--mult-primary);font-family:var(--font-heading);font-size:var(--text-2xl);margin-bottom:var(--space-2)">
          Fantastisk träning!
        </h3>
        <p style="color:var(--color-text-muted);margin-bottom:var(--space-6)">
          Du tränade i ${elapsed} minut${elapsed !== 1 ? 'er' : ''}! ⭐
        </p>
        <div style="display:flex;flex-direction:column;gap:var(--space-3)">
          <button class="btn btn-primary w-full" onclick="MultGame.hideModal();MultGame.startTimer(${minutes})">
            ⏰ Starta ny timer (${minutes} min)
          </button>
          <button class="btn btn-ghost w-full" onclick="MultGame.hideModal();MultGame.showStats()">
            📊 Se resultat
          </button>
          <button class="btn btn-ghost w-full" onclick="MultGame.hideModal()">
            Fortsätt träna fritt
          </button>
        </div>
      </div>
    `);
  }

  /* ── Range ─────────────────────────────────────────── */
  function updateRange() {
    let min = parseInt(document.getElementById('range-min').value);
    let max = parseInt(document.getElementById('range-max').value);
    if (min > max) { max = min; document.getElementById('range-max').value = max; }
    rangeMin = min;
    rangeMax = max;
    document.getElementById('range-label').textContent = `${min} – ${max}`;
  }

  /* ══════════════════════════════════════════════════════
     VÄLJ TABELL → INSTÄLLNINGSVY
  ══════════════════════════════════════════════════════ */
  function selectTable(table) {
    App.Sound.play('click');
    const root = document.getElementById('mult-root');
    root.innerHTML = `
      <div class="app-header">
        <button class="btn-back" onclick="MultGame.renderMain()">Tillbaka</button>
        <span class="header-title" style="color:var(--mult-primary)">✖️ ${table}:ans tabell</span>
        <div style="width:64px"></div>
      </div>
      <div style="padding:var(--space-6) var(--space-4);display:flex;flex-direction:column;gap:var(--space-5);align-items:center">
        <div style="font-size:4rem;animation:bounce-in 0.5s var(--ease-bounce)">✖️</div>
        <h2 style="font-family:var(--font-heading);color:var(--mult-primary);font-size:var(--text-3xl)">
          ${table}:ans tabell
        </h2>
        <p style="color:var(--color-text-muted);text-align:center;font-size:var(--text-sm)">
          Tränar: ${table} × ${rangeMin}–${rangeMax}
        </p>

        <!-- Svarsläge -->
        <div class="card-glass w-full" style="padding:var(--space-4)">
          <div style="font-weight:800;margin-bottom:var(--space-3);color:var(--mult-primary)">Steg 1 – Välj svarsläge</div>
          <div style="display:flex;gap:var(--space-3)">
            <button id="mode-choice" class="btn btn-primary w-full" onclick="MultGame.setMode('choice')">
              📝 Flerval
            </button>
            <button id="mode-free" class="btn btn-ghost w-full" onclick="MultGame.setMode('free')">
              ⌨️ Fri inmatning
            </button>
          </div>
        </div>

        <!-- Aktivitet -->
        <div class="card-glass w-full" style="padding:var(--space-4)">
          <div style="font-weight:800;margin-bottom:var(--space-3);color:var(--mult-primary)">Steg 2 – Välj aktivitet</div>
          <div style="display:flex;flex-direction:column;gap:var(--space-3)">
            <button class="btn btn-ghost w-full" onclick="MultGame.startLearn(${table})">
              📖 Lär dig först
            </button>
            <button class="btn btn-primary w-full" onclick="MultGame.startInteractive(${table})">
              🎯 Interaktiv träning
            </button>
            <button class="btn btn-accent w-full" onclick="MultGame.startTest(${table})">
              🚀 Börja testa direkt
            </button>
          </div>
        </div>
      </div>
    `;
    updateModeButtons();
  }

  function setMode(mode) {
    answerMode = mode;
    updateModeButtons();
    App.Sound.play('click');
  }

  function updateModeButtons() {
    const ch = document.getElementById('mode-choice');
    const fr = document.getElementById('mode-free');
    if (!ch || !fr) return;
    if (answerMode === 'choice') {
      ch.className = 'btn btn-primary w-full';
      fr.className = 'btn btn-ghost w-full';
    } else {
      ch.className = 'btn btn-ghost w-full';
      fr.className = 'btn btn-primary w-full';
    }
  }

  /* ══════════════════════════════════════════════════════
     LÄR DIG FÖRST
  ══════════════════════════════════════════════════════ */
  function startLearn(table) {
    App.Sound.play('click');
    const root = document.getElementById('mult-root');
    const rows = [];
    for (let m = rangeMin; m <= rangeMax; m++) {
      rows.push(`
        <div class="card animate-pop-in" style="
          display:flex;justify-content:space-between;align-items:center;
          padding:var(--space-4);background:rgba(255,255,255,0.9);
          animation-delay:${(m-rangeMin)*0.06}s
        ">
          <span style="font-size:var(--text-xl);font-weight:700;color:var(--color-text-muted)">${table} × ${m}</span>
          <span style="font-size:var(--text-3xl);font-weight:900;color:var(--mult-primary)">=</span>
          <span style="font-size:var(--text-3xl);font-weight:900;color:var(--mult-primary)">${table * m}</span>
        </div>
      `);
    }
    root.innerHTML = `
      <div class="app-header">
        <button class="btn-back" onclick="MultGame.selectTable(${table})">Tillbaka</button>
        <span class="header-title" style="color:var(--mult-primary)">📖 ${table}:an – Lär dig</span>
        <div style="width:64px"></div>
      </div>
      <div style="padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-3)">
        ${rows.join('')}
        <button class="btn btn-primary btn-lg w-full mt-4" onclick="MultGame.startInteractive(${table})">
          🎯 Träna nu! →
        </button>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════
     INTERAKTIV TRÄNING
  ══════════════════════════════════════════════════════ */
  function startInteractive(table) {
    App.Sound.play('click');
    // Bygg frågesekvens: framåt + bakåt
    const fwd = [];
    for (let m = rangeMin; m <= rangeMax; m++) fwd.push(m);
    const bwd = [...fwd].reverse();
    const seq = [...fwd, ...bwd];

    runTrainingSession(table, seq, true);
  }

  /* ── Kör en träningssession ────────────────────────── */
  function runTrainingSession(table, sequence, showAnswer) {
    // Träning (showAnswer): repetition av fel-tal i slutet. Test: ingen repetition.
    const quiz = MP.createRetryQuiz(sequence, { endReview: showAnswer });
    let phase  = showAnswer ? 'show' : 'ask';  // 'show' | 'ask'

    function renderQ() {
      const mult = quiz.current();
      if (mult === null) { showTrainingResult(table, quiz.stats()); return; }
      const ans  = table * mult;
      const root = document.getElementById('mult-root');

      const prog     = quiz.progress();
      const progress = prog.total > 0 ? Math.min(1, prog.answered / prog.total) : 0;

      if (phase === 'show') {
        // Visa svaret först
        root.innerHTML = `
          <div class="app-header">
            <button class="btn-back" onclick="MultGame.selectTable(${table})">Avbryt</button>
            <span class="header-title" style="color:var(--mult-primary)">🎯 ${table}:an</span>
            <div style="width:64px"></div>
          </div>
          <div style="padding:var(--space-4) var(--space-4) var(--space-2)">
            <div class="progress-label">
              <span>Framsteg</span><span>${prog.answered}/${prog.total}</span>
            </div>
            <div class="progress-container"><div class="progress-fill" style="width:${Math.round(progress*100)}%"></div></div>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--space-6) var(--space-4);gap:var(--space-6)">
            <div style="font-size:var(--text-sm);font-weight:800;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.08em">Kom ihåg detta! 📚</div>
            <div style="text-align:center;animation:bounce-in 0.4s var(--ease-bounce)">
              <div style="font-size:var(--text-5xl);font-weight:900;color:var(--mult-primary)">${table} × ${mult}</div>
              <div style="font-size:4rem;color:var(--mult-secondary);font-weight:900;margin-top:var(--space-3)">= ${ans}</div>
            </div>
            <button class="btn btn-primary btn-lg w-full" onclick="MultGame._trainingNext()">
              Jag förstår! →
            </button>
          </div>
        `;
        MultGame._trainingNext = () => { phase = 'ask'; renderQ(); };
      } else {
        // Fråga
        root.innerHTML = `
          <div class="app-header">
            <button class="btn-back" onclick="MultGame.selectTable(${table})">Avbryt</button>
            <span class="header-title" style="color:var(--mult-primary)">🎯 ${table}:an</span>
            <div style="width:64px"></div>
          </div>
          <div style="padding:var(--space-4) var(--space-4) var(--space-2)">
            <div class="progress-label">
              <span>Framsteg</span><span>${prog.answered}/${prog.total}</span>
            </div>
            <div class="progress-container"><div class="progress-fill" style="width:${Math.round(progress*100)}%"></div></div>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--space-4);gap:var(--space-5)">
            <div style="text-align:center;animation:bounce-in 0.4s var(--ease-bounce)">
              <div style="font-size:var(--text-4xl);font-weight:900;color:var(--mult-primary)">${table} × ${mult} = ?</div>
            </div>
            ${buildAnswerUI(table, mult, ans, (wasCorrect) => {
              recordAnswer(table, mult, wasCorrect);
              quiz.answer(wasCorrect);
              if (quiz.isDone()) {
                showTrainingResult(table, quiz.stats());
                return;
              }
              if (wasCorrect && showAnswer) { phase = 'show'; }
              renderQ();
            })}
          </div>
        `;
        initFreeInput(ans);
      }
    }

    renderQ();
  }

  /* ══════════════════════════════════════════════════════
     TESTFAS (hoppa direkt)
  ══════════════════════════════════════════════════════ */
  function startTest(table) {
    App.Sound.play('click');
    const seq = [];
    for (let m = rangeMin; m <= rangeMax; m++) seq.push(m);
    runTrainingSession(table, MP.shuffle(seq), false);
  }

  /* ── Resultat efter träning ────────────────────────── */
  function showTrainingResult(table, stats) {
    const correct = stats.firstTryCorrect;
    const total   = stats.total;
    const pct     = stats.pct;
    App.Sound.play(pct >= 80 ? 'fanfare' : 'correct');
    if (pct === 100) App.Confetti.burst(80);

    addSessionLog({
      type: 'table', table,
      correct, total, pct,
      rangeMin, rangeMax, mode: answerMode
    });

    const { emoji, msg } = MP.feedbackMessage(pct);
    const cls = RESULT_CLS[MP.resultTier(pct)];

    const root = document.getElementById('mult-root');
    root.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;min-height:100vh;justify-content:center;padding:var(--space-8) var(--space-4)">
        <div class="result-display ${cls} w-full">
          <div style="font-size:4rem;margin-bottom:var(--space-4);animation:sparkle 1.5s infinite">${emoji}</div>
          <div class="result-score">${pct}%</div>
          <div class="result-message">${msg}</div>
          <div class="result-sub">${correct} rätt av ${total}</div>
          ${MP.getMedal(pct) ? `<div style="font-size:3rem;margin-top:var(--space-4);animation:sparkle 1.5s infinite">${MP.getMedal(pct)}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-3);width:100%;margin-top:var(--space-8)">
          <button class="btn btn-primary btn-lg w-full" onclick="MultGame.startTest(${table})">
            🔄 Testa igen
          </button>
          <button class="btn btn-ghost w-full" onclick="MultGame.renderMain()">
            🏠 Tillbaka till menyn
          </button>
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════
     EGET MATTEPROV
  ══════════════════════════════════════════════════════ */
  function showCustomTest() {
    App.Sound.play('click');
    let selected = [];

    const root = document.getElementById('mult-root');
    root.innerHTML = `
      <div class="app-header">
        <button class="btn-back" onclick="MultGame.renderMain()">Tillbaka</button>
        <span class="header-title" style="color:var(--mult-primary)">🎲 Eget Matteprov</span>
        <div style="width:64px"></div>
      </div>
      <div style="padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-5)">
        <p style="font-size:var(--text-sm);color:var(--color-text-muted);font-weight:700;text-align:center">
          Välj 2–3 tabeller att blanda 🎲
        </p>
        <div class="grid-3" style="gap:var(--space-2)" id="custom-grid">
          ${[1,2,3,4,5,6,7,8,9,10,11,12].map(t => `
            <div class="table-card" id="ct-${t}" onclick="MultGame._toggleCustomTable(${t})" tabindex="0" role="checkbox">
              <div class="table-number">${t}:an</div>
            </div>
          `).join('')}
        </div>

        <!-- Range -->
        <div class="card-glass" style="padding:var(--space-4)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-3)">
            <span style="font-weight:800;color:var(--mult-primary)">Talintervall</span>
            <span id="custom-range-label" style="font-weight:900;color:var(--mult-primary)">${rangeMin} – ${rangeMax}</span>
          </div>
          <div style="display:flex;gap:var(--space-3);align-items:center">
            <input type="range" class="range-input" id="custom-range-min" min="1" max="12" value="${rangeMin}" oninput="MultGame._updateCustomRange()">
            <input type="range" class="range-input" id="custom-range-max" min="1" max="12" value="${rangeMax}" oninput="MultGame._updateCustomRange()">
          </div>
        </div>

        <button class="btn btn-accent btn-lg w-full" id="btn-start-custom" disabled onclick="MultGame._startCustom()">
          🚀 Starta ditt matteprov!
        </button>
        <p id="custom-hint" style="text-align:center;font-size:var(--text-sm);color:var(--color-text-muted);font-weight:700">
          Välj minst 2 tabeller
        </p>
      </div>
    `;

    MultGame._toggleCustomTable = (t) => {
      const idx = selected.indexOf(t);
      if (idx === -1) {
        if (selected.length >= 3) {
          document.getElementById(`ct-${selected[0]}`).classList.remove('selected');
          selected.shift();
        }
        selected.push(t);
        document.getElementById(`ct-${t}`).classList.add('selected');
      } else {
        selected.splice(idx, 1);
        document.getElementById(`ct-${t}`).classList.remove('selected');
      }
      App.Sound.play('click');
      const btn = document.getElementById('btn-start-custom');
      const hint = document.getElementById('custom-hint');
      btn.disabled = selected.length < 2;
      hint.textContent = selected.length < 2 ? 'Välj minst 2 tabeller' : `${selected.length} tabeller valda – kör! 🎉`;
    };

    MultGame._updateCustomRange = () => {
      let min = parseInt(document.getElementById('custom-range-min').value);
      let max = parseInt(document.getElementById('custom-range-max').value);
      if (min > max) { max = min; document.getElementById('custom-range-max').value = max; }
      rangeMin = min; rangeMax = max;
      document.getElementById('custom-range-label').textContent = `${min} – ${max}`;
    };

    MultGame._startCustom = () => {
      if (selected.length < 2) return;
      App.Sound.play('click');
      // Bygg blandad frågelista
      const questions = [];
      selected.forEach(t => {
        for (let m = rangeMin; m <= rangeMax; m++) questions.push({ table: t, mult: m });
      });
      runCustomSession(MP.shuffle(questions), selected);
    };
  }

  function runCustomSession(questions, tables) {
    const quiz = MP.createRetryQuiz(questions);

    function renderQ() {
      const q = quiz.current();
      if (q === null) { showCustomResult(quiz.stats(), tables); return; }
      const ans = q.table * q.mult;
      const root = document.getElementById('mult-root');
      const prog     = quiz.progress();
      const progress = prog.total > 0 ? Math.min(1, prog.answered / prog.total) : 0;

      root.innerHTML = `
        <div class="app-header">
          <button class="btn-back" onclick="MultGame.showCustomTest()">Avbryt</button>
          <span class="header-title" style="color:var(--mult-primary)">🎲 Matteprov</span>
          <div style="width:64px"></div>
        </div>
        <div style="padding:var(--space-4) var(--space-4) var(--space-2)">
          <div class="progress-label">
            <span>${tables.join(', ')}-tabellerna</span><span>${prog.answered}/${prog.total}</span>
          </div>
          <div class="progress-container"><div class="progress-fill" style="width:${Math.round(progress*100)}%"></div></div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--space-4);gap:var(--space-5)">
          <div style="text-align:center;animation:bounce-in 0.4s var(--ease-bounce)">
            <div style="font-size:var(--text-4xl);font-weight:900;color:var(--mult-primary)">${q.table} × ${q.mult} = ?</div>
          </div>
          ${buildAnswerUI(q.table, q.mult, ans, (wasCorrect) => {
            recordAnswer(q.table, q.mult, wasCorrect);
            quiz.answer(wasCorrect);
            if (quiz.isDone()) {
              showCustomResult(quiz.stats(), tables); return;
            }
            renderQ();
          })}
        </div>
      `;
      initFreeInput(ans);
    }

    renderQ();
  }

  function showCustomResult(stats, tables) {
    const correct = stats.firstTryCorrect;
    const total   = stats.total;
    const pct     = stats.pct;
    App.Sound.play(pct >= 80 ? 'fanfare' : 'correct');
    if (pct === 100) App.Confetti.burst(80);
    addSessionLog({ type: 'custom', tables, correct, total, pct, rangeMin, rangeMax });
    const { emoji, msg } = MP.feedbackMessage(pct);
    const cls = RESULT_CLS[MP.resultTier(pct)];
    const root = document.getElementById('mult-root');
    root.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;min-height:100vh;justify-content:center;padding:var(--space-8) var(--space-4)">
        <div class="result-display ${cls} w-full">
          <div style="font-size:4rem;margin-bottom:var(--space-4)">${emoji}</div>
          <div class="result-score">${pct}%</div>
          <div class="result-message">${msg}</div>
          <div class="result-sub">${correct} rätt av ${total} – ${tables.join(', ')}-tabellerna</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-3);width:100%;margin-top:var(--space-8)">
          <button class="btn btn-accent btn-lg w-full" onclick="MultGame.showCustomTest()">🔄 Nytt matteprov</button>
          <button class="btn btn-ghost w-full" onclick="MultGame.renderMain()">🏠 Tillbaka</button>
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════
     STATISTIK-VY
  ══════════════════════════════════════════════════════ */
  function showStats() {
    const stats = getStats();
    App.Sound.play('click');

    // Hitta svåra tal
    const allKeys = Object.keys(stats);
    const sorted  = allKeys
      .filter(k => stats[k].total >= 4)
      .map(k => ({ key: k, pct: Math.round(stats[k].correct / stats[k].total * 100) }))
      .sort((a,b) => a.pct - b.pct);
    const hardest5 = sorted.slice(0, 5);
    const problemKeys = sorted.filter(x => x.pct <= 75);

    const root = document.getElementById('mult-root');
    root.innerHTML = `
      <div class="app-header">
        <button class="btn-back" onclick="MultGame.renderMain()">Tillbaka</button>
        <span class="header-title" style="color:var(--mult-primary)">📊 Statistik</span>
        <div style="width:64px"></div>
      </div>
      <div style="padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-4)">

        <!-- Tabellöversikt -->
        <div class="section-title">Alla tabeller</div>
        <div class="grid-3" style="gap:var(--space-2)">
          ${[1,2,3,4,5,6,7,8,9,10,11,12].map(t => {
            const p = getTablePercent(t);
            const medal = MP.getMedal(p);
            return `
              <div class="table-card" style="cursor:default">
                ${medal ? `<div class="table-medal">${medal}</div>` : ''}
                <div class="table-number">${t}:an</div>
                <div class="table-percent">${p !== null ? p+'%' : '—'}</div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Svåraste tal -->
        ${hardest5.length > 0 ? `
          <div class="section-title">💪 Träna mer på dessa</div>
          <div style="display:flex;flex-direction:column;gap:var(--space-2)">
            ${hardest5.map(x => `
              <div class="stat-row">
                <span class="stat-label">${x.key.replace('x', ' × ')}</span>
                <span class="stat-value" style="color:${x.pct<50?'var(--color-error)':x.pct<75?'var(--color-accent)':'var(--color-success)'}">${x.pct}%</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Fokuserad träning -->
        ${problemKeys.length > 0 ? `
          <div class="card" style="background:linear-gradient(135deg,#fff1f2,#ffe4e6);border-color:#fca5a5">
            <div style="font-weight:800;color:#be123c;margin-bottom:var(--space-3)">🎯 Fokuserad träning</div>
            <p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-3)">
              Du har ${problemKeys.length} tal med under 75% – vill du träna på dem?
            </p>
            <button class="btn btn-danger w-full" onclick="MultGame.startFocusedTraining()">
              Träna på problemtalen
            </button>
          </div>
        ` : ''}

        <!-- Medaljsystem -->
        <div class="section-title">🏆 Medaljsystemet</div>
        <div class="card">
          ${[['🥉 Brons','75% rätt'],['🥈 Silver','85% rätt'],['🥇 Guld','95% rätt']].map(([m,r]) => `
            <div class="stat-row" style="margin-bottom:var(--space-2)">
              <span style="font-size:var(--text-xl)">${m}</span>
              <span class="stat-value">${r}</span>
            </div>
          `).join('')}
        </div>

        <!-- Träningshistorik -->
        ${renderSessionHistory()}

        <!-- Nollställ -->
        <button class="btn btn-danger btn-sm w-full" onclick="MultGame.confirmReset()">
          ⚙️ Nollställ all statistik
        </button>
      </div>
    `;
  }

  function renderSessionHistory() {
    const log = getLog();
    if (log.length === 0) return '';
    const entries = log.slice(0, 10).map((e, i) => {
      const d = new Date(e.date);
      const dateStr = d.toLocaleDateString('sv-SE', { day:'numeric', month:'short' });
      const timeStr = d.toLocaleTimeString('sv-SE', { hour:'2-digit', minute:'2-digit' });
      const label = e.type === 'timer'
        ? `⏰ Timerträning`
        : e.type === 'custom' ? `Eget prov (${e.tables?.join(',')})` : `${e.table}:an`;
      const value = e.type === 'timer'
        ? `<span class="stat-value" style="color:var(--color-accent)">${e.minutes} min</span>`
        : `<span class="stat-value" style="color:${e.pct>=80?'var(--color-success)':'var(--color-accent)'}">${e.pct}%</span>`;
      return `
        <div class="stat-row">
          <div>
            <div style="font-weight:800;font-size:var(--text-sm)">${label} ${i===0?'<span style="color:var(--color-secondary);font-size:var(--text-xs)">NY!</span>':''}</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-muted)">${dateStr} ${timeStr}</div>
          </div>
          ${value}
        </div>
      `;
    }).join('');
    return `
      <div class="section-title">📅 Träningshistorik</div>
      <div style="display:flex;flex-direction:column;gap:var(--space-2)">${entries}</div>
    `;
  }

  function startFocusedTraining() {
    const stats = getStats();
    const problems = Object.keys(stats)
      .filter(k => stats[k].total >= 4 && stats[k].correct / stats[k].total < 0.75)
      .map(k => {
        const [t, m] = k.split('x').map(Number);
        return { table: t, mult: m };
      });
    if (problems.length === 0) return;
    App.Sound.play('click');

    // Bygg unika tabeller
    const tables = [...new Set(problems.map(p => p.table))];
    runCustomSession(problems, tables);
  }

  function confirmReset() {
    showModal(`
      <div style="text-align:center">
        <div style="font-size:3rem;margin-bottom:var(--space-4)">⚠️</div>
        <h3 style="font-family:var(--font-heading);color:var(--color-error-dark);margin-bottom:var(--space-3)">Nollställ statistik?</h3>
        <p style="color:var(--color-text-muted);font-size:var(--text-sm);margin-bottom:var(--space-6)">All träningsdata raderas permanent!</p>
        <div style="display:flex;gap:var(--space-3)">
          <button class="btn btn-ghost w-full" onclick="MultGame.hideModal()">Avbryt</button>
          <button class="btn btn-danger w-full" onclick="MultGame._doReset()">Ja, nollställ</button>
        </div>
      </div>
    `);
    MultGame._doReset = () => {
      localStorage.removeItem(STATS_KEY(profile.id));
      localStorage.removeItem(LOG_KEY(profile.id));
      hideModal();
      showStats();
    };
  }

  /* ══════════════════════════════════════════════════════
     SESSIONSLOGG
  ══════════════════════════════════════════════════════ */
  function showLog() {
    const log = getLog();
    App.Sound.play('click');
    const root = document.getElementById('mult-root');

    if (log.length === 0) {
      root.innerHTML = `
        <div class="app-header">
          <button class="btn-back" onclick="MultGame.renderMain()">Tillbaka</button>
          <span class="header-title" style="color:var(--mult-primary)">📝 Sessionslogg</span>
          <div style="width:64px"></div>
        </div>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:var(--space-4);padding:var(--space-8)">
          <div style="font-size:4rem">📭</div>
          <p style="color:var(--color-text-muted);font-weight:700">Inga sessioner än. Börja träna!</p>
        </div>
      `;
      return;
    }

    const entries = log.map((e, i) => {
      const d = new Date(e.date);
      const dateStr = d.toLocaleDateString('sv-SE', { weekday:'short', day:'numeric', month:'short' });
      const timeStr = d.toLocaleTimeString('sv-SE', { hour:'2-digit', minute:'2-digit' });
      const label   = e.type === 'timer'
        ? `⏰ Timerträning`
        : e.type === 'custom'
        ? `🎲 Eget prov (${e.tables?.join(', ')})`
        : `✖️ ${e.table}:ans tabell`;
      const value   = e.type === 'timer'
        ? `<div style="font-size:var(--text-2xl);font-weight:900;color:var(--color-accent)">${e.minutes} min</div>`
        : `<div style="font-size:var(--text-2xl);font-weight:900;color:${e.pct>=80?'var(--color-success)':e.pct>=60?'var(--color-accent)':'var(--color-error)'}">${e.pct}%</div>`;
      const sub     = e.type === 'timer'
        ? `Tidsträning i ${e.minutes} minut${e.minutes !== 1 ? 'er' : ''}`
        : `${e.correct} rätt av ${e.total} | Intervall ${e.rangeMin}–${e.rangeMax}`;
      return `
        <div class="card" style="padding:var(--space-4)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-2)">
            <div>
              <div style="font-weight:800;font-size:var(--text-base)">${label} ${i===0?'<span style="background:var(--color-secondary);color:white;font-size:10px;padding:2px 8px;border-radius:999px;font-weight:800">NY!</span>':''}</div>
              <div style="font-size:var(--text-xs);color:var(--color-text-muted)">${dateStr} kl. ${timeStr}</div>
            </div>
            ${value}
          </div>
          <div style="font-size:var(--text-sm);color:var(--color-text-muted)">${sub}</div>
        </div>
      `;
    }).join('');

    root.innerHTML = `
      <div class="app-header">
        <button class="btn-back" onclick="MultGame.renderMain()">Tillbaka</button>
        <span class="header-title" style="color:var(--mult-primary)">📝 Sessionslogg</span>
        <div style="width:64px"></div>
      </div>
      <div style="padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-3)">
        ${entries}
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════
     SVARSGRÄNSSNITT
  ══════════════════════════════════════════════════════ */
  function buildAnswerUI(table, mult, correctAnswer, callback) {
    if (answerMode === 'choice') {
      return buildChoiceUI(correctAnswer, callback);
    } else {
      return buildFreeUI(correctAnswer, callback);
    }
  }

  function buildChoiceUI(correctAnswer, callback) {
    const options = generateOptions(correctAnswer);
    MultGame._choiceCallback = callback;
    return `
      <div style="display:flex;flex-direction:column;gap:var(--space-3);width:100%" id="choice-options">
        ${options.map(o => `
          <button class="answer-option" onclick="MultGame._handleChoice(${o},${correctAnswer})" id="opt-${o}">
            ${o}
          </button>
        `).join('')}
      </div>
    `;
  }

  function generateOptions(correct) {
    const opts = new Set([correct]);
    while (opts.size < 4) {
      const delta = Math.floor(Math.random() * 5) + 1;
      const sign  = Math.random() < 0.5 ? 1 : -1;
      const val   = Math.max(1, correct + delta * sign);
      opts.add(val);
    }
    return [...opts].sort(() => Math.random() - 0.5);
  }

  // Läggs på MultGame-objektet i slutet
  let _choiceCB  = null;
  let _freeCB    = null;
  let _freeVal   = '';
  let _freeAns   = 0;

  function buildFreeUI(correctAnswer, callback) {
    _freeCB  = callback;
    _freeAns = correctAnswer;
    _freeVal = '';
    return `
      <div style="width:100%;display:flex;flex-direction:column;gap:var(--space-4)">
        <div id="free-display" style="
          width:100%;height:72px;
          display:flex;align-items:center;justify-content:center;
          border-radius:var(--radius-lg);
          border:3px solid var(--color-primary-light);
          background:white;
          font-size:var(--text-4xl);
          font-weight:900;
          color:var(--mult-primary);
          transition:all 0.15s;
        ">?</div>
        <div class="numpad" id="mult-numpad">
          ${[7,8,9,4,5,6,1,2,3].map(n=>`
            <button class="numpad-key" onclick="MultGame._freeInput('${n}')">${n}</button>
          `).join('')}
          <button class="numpad-key key-delete" onclick="MultGame._freeInput('del')">⌫</button>
          <button class="numpad-key" onclick="MultGame._freeInput('0')">0</button>
          <button class="numpad-key key-ok" onclick="MultGame._freeInput('ok')">OK ✓</button>
        </div>
      </div>
    `;
  }

  function initFreeInput(ans) {
    _freeAns = ans;
    _freeVal = '';
  }

  /* ══════════════════════════════════════════════════════
     MODAL
  ══════════════════════════════════════════════════════ */
  function showModal(html) {
    const el = document.createElement('div');
    el.className = 'modal-overlay';
    el.id = 'mult-modal';
    el.innerHTML = `<div class="modal">${html}</div>`;
    el.addEventListener('click', e => { if (e.target === el) hideModal(); });
    document.body.appendChild(el);
  }

  function hideModal() {
    const el = document.getElementById('mult-modal');
    if (el) el.remove();
  }

  /* ── Feedback-animation ────────────────────────────── */
  function flashFeedback(correct) {
    const el = document.createElement('div');
    el.className = 'feedback-overlay';
    el.innerHTML = `<div class="feedback-emoji">${correct ? '✅' : '❌'}</div>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  /* ── Publik API ────────────────────────────────────── */
  return {
    init,
    renderMain,
    selectTable,
    setMode,
    startLearn,
    startInteractive,
    startTest,
    showCustomTest,
    showStats,
    showLog,
    startFocusedTraining,
    confirmReset,
    updateRange,
    startTimer,
    stopTimer,
    showModal,
    hideModal,

    // Händelsehanterare (sätts dynamiskt av renderfunktioner)
    _trainingNext: null,
    _toggleCustomTable: null,
    _updateCustomRange: null,
    _startCustom: null,
    _doReset: null,

    _handleChoice(selected, correct) {
      const wasCorrect = selected === correct;
      App.Sound.play(wasCorrect ? 'correct' : 'wrong');
      flashFeedback(wasCorrect);

      // Färglägg knappar
      document.querySelectorAll('.answer-option').forEach(btn => {
        btn.disabled = true;
        const val = parseInt(btn.id.replace('opt-', ''));
        if (val === correct) btn.classList.add('correct');
        else if (val === selected && !wasCorrect) btn.classList.add('wrong');
      });

      setTimeout(() => {
        if (MultGame._choiceCallback) MultGame._choiceCallback(wasCorrect);
      }, wasCorrect ? 600 : 1200);
    },

    _choiceCallback: null,

    _freeInput(key) {
      const display = document.getElementById('free-display');
      if (!display) return;

      if (key === 'del') {
        _freeVal = _freeVal.slice(0, -1);
      } else if (key === 'ok') {
        if (_freeVal === '') return;
        const guess      = parseInt(_freeVal);
        _freeVal = ''; // direkt-nollställning: guarden ovan blockerar dubbel-OK under feedback
        const wasCorrect = guess === _freeAns;
        App.Sound.play(wasCorrect ? 'correct' : 'wrong');
        flashFeedback(wasCorrect);
        display.style.background     = wasCorrect ? '#dcfce7' : '#fee2e2';
        display.style.borderColor    = wasCorrect ? '#22c55e' : '#ef4444';
        display.style.color          = wasCorrect ? '#166534' : '#991b1b';
        if (!wasCorrect) display.classList.add('animate-shake');
        setTimeout(() => {
          display.style.background  = '';
          display.style.borderColor = '';
          display.style.color       = '';
          display.classList.remove('animate-shake');
          _freeVal = '';
          if (display) display.textContent = '?';
          if (_freeCB) _freeCB(wasCorrect);
        }, wasCorrect ? 600 : 1000);
        return;
      } else {
        if (_freeVal.length >= 3) return;
        _freeVal += key;
      }

      display.textContent = _freeVal || '?';
      App.Sound.play('click');
    },
  };
})();
