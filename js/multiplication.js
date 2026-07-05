/* ============================================================
   MULTIPLAY – Gångertabellen
   Modulen renderar sig i #mult-root.
   Design: nya komponentsystemet (docs/DESIGN-SYSTEM.md).
   Lila magi-temat sätts automatiskt via #mult-root i app.css.
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

  /* ── Modulspecifik CSS (uppstallning-mönstret) ─────── */
  const MULT_CSS = `
    /* Layout-hjälpare */
    #mult-root .mult-gap{gap:12px}
    #mult-root .mult-spacer{width:52px;flex:0 0 auto}
    #mult-root .mult-hdr-actions{display:flex;gap:8px;align-items:center;flex:0 0 auto}
    #mult-root .app-header .header-title{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #mult-root .mult-timer-slot{display:flex;justify-content:center;margin-bottom:8px}
    #mult-root .mult-timer-slot:empty{display:none;margin:0}
    #mult-root .mult-sub{text-align:center;color:var(--ink-soft);font-weight:700;font-size:14px}
    #mult-root .mult-stack{display:flex;flex-direction:column;gap:10px}

    /* Hub: tvåkolumn ≥700px (kontroller vänster / tabellrutnät höger) */
    #mult-root .hub-cols{display:flex;flex-direction:column;gap:12px;flex:1;min-height:0}
    #mult-root .hub-side{display:flex;flex-direction:column;gap:12px}
    #mult-root .tables-panel{flex:1;min-height:0;display:flex;flex-direction:column}
    #mult-root .tgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;flex:1;align-content:space-evenly}
    #mult-root .mult-tbar{display:block;height:5px;border-radius:999px;background:rgba(93,63,158,.12);margin-top:7px;overflow:hidden}
    #mult-root .mult-tbar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--accent),var(--accent-2))}
    #mult-root .range-lab{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px}
    #mult-root .range-lab b{font-size:15px;color:var(--deep)}
    #mult-root .range-lab .num{font-family:var(--font-head);font-weight:700;font-size:19px;color:var(--accent)}
    #mult-root .range-row{display:flex;gap:10px;align-items:center}
    #mult-root .range-row label{font-size:11px;font-weight:800;color:var(--ink-soft);text-transform:uppercase}
    #mult-root .timer-row{display:flex;align-items:center;gap:10px;padding:12px 14px}
    #mult-root .timer-row>b{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-head);font-weight:700;font-size:15px;color:var(--deep)}
    #mult-root .timer-row>b svg{width:19px;height:19px;color:var(--accent)}
    #mult-root .timer-row .chips{flex:1;min-width:0;flex-wrap:wrap}
    #mult-root .timer-row .chip{min-height:38px;padding:7px 12px;font-size:13px;white-space:nowrap}
    #mult-root .hub-shortcuts{display:none}
    @media (min-width:700px){
      #mult-root .hub-cols{display:grid;grid-template-columns:minmax(260px,320px) 1fr;align-items:stretch}
      #mult-root .tgrid .table-card{min-height:118px}
      /* Balansera vänsterkolumnen (landskap 1180: inget dött band under CTA:n) */
      #mult-root .hub-side{justify-content:space-between}
      #mult-root .hub-shortcuts{display:flex;gap:10px}
      #mult-root .hub-shortcuts .btn{flex:1;min-height:52px}
    }
    @media (max-width:430px){
      #mult-root .tgrid{grid-template-columns:repeat(4,1fr);gap:8px}
      #mult-root .timer-row{padding:10px 12px;gap:8px}
      #mult-root .timer-row .chip{min-height:34px;padding:6px 9px;font-size:12px}
    }

    /* Inställningsvy (lägesval) – uppskalad + centrerad, fyller kolumnen */
    #mult-root .mult-setup{gap:clamp(14px,2.4vh,26px);max-width:560px;margin:0 auto;width:100%}
    #mult-root .mult-setup .card{padding:clamp(16px,2.4vh,26px) clamp(16px,3vw,26px)}
    #mult-root .mult-setup .card-title{font-size:clamp(15px,2.2vh,19px)}
    #mult-root .mult-setup .segmented button{min-height:clamp(52px,7vh,64px);font-size:clamp(15px,2vh,18px)}
    #mult-root .mult-setup .mult-stack{gap:clamp(10px,1.8vh,16px)}
    #mult-root .mult-setup .mult-stack .btn{min-height:clamp(60px,9vh,86px);font-size:clamp(17px,2.4vh,21px);border-radius:22px}
    #mult-root .mult-setup .mult-sub{font-size:clamp(14px,2vh,17px)}

    /* Lär dig-vy */
    #mult-root .mult-learn{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;flex:1;min-height:0;align-content:space-evenly}
    #mult-root .mult-learn .card{display:flex;justify-content:space-between;align-items:center;padding:10px 16px}
    #mult-root .ml-q{font-size:17px;font-weight:800;color:var(--ink-soft)}
    #mult-root .ml-a{font-family:var(--font-head);font-size:22px;font-weight:800;color:var(--deep)}

    /* Quiz-vyer (v26: uppgiften äger skärmen) */
    /* Progress-kapsel i headern (modulvariant av .header-progress) */
    #mult-root .header-progress{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:64px;padding:8px 13px;border-radius:999px;background:var(--glass-strong);border:1px solid var(--glass-line);box-shadow:var(--shadow-panel);font-family:var(--font-head);font-weight:800;font-size:15px;line-height:1;color:var(--deep);flex:0 0 auto}
    #mult-root .header-progress .hp-bar{width:100%;min-width:40px;height:4px;border-radius:999px;background:rgba(93,63,158,.15);overflow:hidden}
    #mult-root .header-progress .hp-bar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--accent),var(--accent-2));transition:width .4s var(--spring)}
    #mult-root .mult-timer-hdr:empty{display:none}
    #mult-root .mq-main{flex:1;min-height:0;display:flex;flex-direction:column;gap:clamp(12px,2vh,20px);width:100%;max-width:720px;margin:0 auto}
    /* Frågehero: växer i all ledig yta, monumental typografi som skalar med skärmhöjd */
    #mult-root .q-hero.mq-qcard{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:clamp(4px,1vh,12px);padding:clamp(12px,3vh,30px) 18px}
    #mult-root .mq-task{font-family:var(--font-head);font-weight:800;font-size:clamp(44px,min(14vh,19vw),120px);line-height:1;color:var(--deep);letter-spacing:2px}
    #mult-root .mq-x{color:var(--accent-2);margin:0 .18em}
    #mult-root .mq-eq{color:var(--accent);opacity:.85}
    #mult-root .mq-ans{font-family:var(--font-head);font-weight:800;font-size:clamp(34px,min(10vh,15vw),88px);line-height:1.1;color:var(--accent)}
    #mult-root .mq-hint{color:var(--ink-soft);font-weight:800;font-size:clamp(13px,1.9vh,16px);text-transform:uppercase;letter-spacing:.08em}
    #mult-root .mq-cta{flex:0 0 auto;min-height:clamp(58px,9vh,78px);font-size:clamp(17px,2.6vh,22px)}
    /* Svarsytor: fyller nedre delen (tumzon) och skalar med höjden */
    #mult-root .q-answers-fill.mq-answers{display:grid;grid-template-columns:1fr 1fr;gap:clamp(10px,1.8vh,16px);width:100%;flex:0 0 auto}
    #mult-root .q-answers-fill .answer-option{min-height:clamp(64px,11vh,116px);font-size:clamp(24px,4.6vh,42px);border-radius:24px}
    #mult-root .mult-free{width:100%;display:flex;flex-direction:column;gap:clamp(10px,1.6vh,16px);align-items:center;flex:0 0 auto}
    #mult-root .mult-free .numpad{width:100%;max-width:min(460px,92vw);gap:clamp(8px,1.4vh,14px)}
    #mult-root .mult-free .numpad-key{height:clamp(52px,8vh,80px);font-size:clamp(20px,3.4vh,30px)}
    #mult-root .mult-free .numpad-key.key-delete{font-size:clamp(18px,3vh,26px)}
    #mult-root .mult-free .numpad-key.key-ok{font-size:clamp(15px,2.4vh,21px)}
    #mult-root .mult-free-display{width:100%;max-width:min(460px,92vw);height:clamp(56px,9vh,84px);flex:0 0 auto;display:flex;align-items:center;justify-content:center;border-radius:20px;border:3px solid var(--accent-light);background:rgba(255,255,255,.92);font-family:var(--font-head);font-size:clamp(28px,5vh,44px);font-weight:800;color:var(--deep);transition:all .15s}

    /* Statistik & logg */
    #mult-root .mult-stats-cols{display:flex;flex-direction:column;gap:12px;flex:1;min-height:0}
    #mult-root .mult-stats-side{display:flex;flex-direction:column;gap:10px;min-height:0}
    @media (min-width:700px){#mult-root .mult-stats-cols{display:grid;grid-template-columns:1fr minmax(280px,340px);align-items:stretch}}
    #mult-root .mult-scroll{overflow-y:auto;min-height:0}
    #mult-root .mult-hist-card{flex:1;min-height:0;display:flex;flex-direction:column}
    #mult-root .mult-good{color:#16a34a}
    #mult-root .mult-mid{color:#d97706}
    #mult-root .mult-bad{color:#dc2626}
    #mult-root .mult-new{display:inline-block;background:var(--accent-2);color:#fff;font-size:10px;padding:2px 8px;border-radius:999px;font-weight:800;vertical-align:middle}
    #mult-root .mult-focus-card{background:linear-gradient(135deg,#fff1f2,#ffe4e6);border-color:#fca5a5}
    #mult-root .mult-focus-title{color:#be123c}
    #mult-root .mult-static{cursor:default}
    #mult-root .mult-left{text-align:left;margin-bottom:10px}
    #mult-root .mult-empty{align-items:center;gap:14px}
    #mult-root .mult-empty-emoji{font-size:4rem}

    /* Modal-innehåll (modalen ligger på body – därför oprefixat) */
    .mult-modal-emoji{font-size:3.2rem;text-align:center;margin-bottom:8px}
    .mult-modal-txt{color:var(--ink-soft);font-weight:700;text-align:center;margin:6px 0 16px}
    .mult-modal-stack{display:flex;flex-direction:column;gap:10px}
    .mult-modal-row{display:flex;gap:10px}
    .mult-modal-row .btn{flex:1}
  `;

  const baseStyle = () => `<style id="mult-css">${MULT_CSS}</style>`;

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

  /* ── Delade markup-snuttar ─────────────────────────── */
  function modeSegHTML() {
    return `
      <div class="segmented">
        <span class="seg-ind"></span>
        <button id="mode-choice" class="${answerMode === 'choice' ? 'chip-active' : ''}" onclick="MultGame.setMode('choice')">Flerval</button>
        <button id="mode-free" class="${answerMode === 'free' ? 'chip-active' : ''}" onclick="MultGame.setMode('free')">Fri inmatning</button>
      </div>
    `;
  }

  function tableCardHTML(t) {
    const p = getTablePercent(t);
    const medal = MP.getMedal(p);
    return `
      <div class="table-card" onclick="MultGame.selectTable(${t})" tabindex="0" role="button" aria-label="${t}:ans tabell">
        ${medal ? `<div class="table-medal">${medal}</div>` : ''}
        <div class="table-number num">${t}:an</div>
        <div class="table-percent num">${p !== null ? p + '%' : 'Ej tränad'}</div>
        <span class="mult-tbar"><i style="width:${p ?? 0}%"></i></span>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════
     HUVUD-VY (hub)
  ══════════════════════════════════════════════════════ */
  function renderMain() {
    const root = document.getElementById('mult-root');

    root.innerHTML = `
      ${baseStyle()}
      <div class="floaties"><span style="top:5%;right:8%">✨</span><span style="bottom:10%;left:4%;animation-delay:2s">🔮</span></div>
      <div class="app-header">
        <button class="btn-back" onclick="App.goBackToGameSelect()">Tillbaka</button>
        <span class="header-title">Gångertabellen</span>
        <div class="mult-hdr-actions">
          <button class="icon-btn" aria-label="Statistik" onclick="MultGame.showStats()">
            <svg class="icn"><use href="#i-stats"/></svg>
          </button>
          <button class="icon-btn" aria-label="Sessionslogg" onclick="MultGame.showLog()">
            <svg class="icn"><use href="#i-history"/></svg>
          </button>
        </div>
      </div>

      <div class="wrap">
        <!-- TIMER-SEKTION -->
        <div id="mult-timer-display" class="mult-timer-slot"></div>

        <div class="hub-cols">
          <div class="hub-side">
            <!-- SVARSLÄGE -->
            ${modeSegHTML()}

            <!-- RANGE SELECTOR -->
            <div class="card">
              <div class="range-lab"><b>Talintervall</b><span class="num" id="range-label">1 – 12</span></div>
              <div class="range-row">
                <label for="range-min">Min</label>
                <input type="range" class="range-input" id="range-min" min="1" max="12" value="1" oninput="MultGame.updateRange()">
                <label for="range-max">Max</label>
                <input type="range" class="range-input" id="range-max" min="1" max="12" value="12" oninput="MultGame.updateRange()">
              </div>
            </div>

            <!-- TIMER-KNAPPAR (EN rad) -->
            <div class="card timer-row">
              <b><svg class="icn"><use href="#i-timer"/></svg>Timer</b>
              <div class="chips">
                ${[10,15,20,30].map(m => `
                  <button class="chip" onclick="MultGame.startTimer(${m})">${m} min</button>
                `).join('')}
                <button class="chip" id="btn-stop-timer" style="display:none" onclick="MultGame.stopTimer()">Stoppa</button>
              </div>
            </div>

            <!-- EGET MATTEPROV -->
            <button class="btn btn-accent btn-lg btn-block" onclick="MultGame.showCustomTest()">
              <svg class="icn" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.2" fill="currentColor" stroke="none"/></svg>
              Gör ett eget Matteprov
            </button>

            <!-- GENVÄGAR (fyllnad ≥700px – mobilen har header-ikonerna) -->
            <div class="hub-shortcuts">
              <button class="btn btn-secondary" onclick="MultGame.showStats()">
                <svg class="icn"><use href="#i-stats"/></svg>
                Statistik
              </button>
              <button class="btn btn-secondary" onclick="MultGame.showLog()">
                <svg class="icn"><use href="#i-history"/></svg>
                Sessionslogg
              </button>
            </div>
          </div>

          <!-- TABELL-GRID -->
          <div class="card tables-panel">
            <div class="panel-title">
              <svg class="icn" viewBox="0 0 24 24" style="color:var(--accent)"><path d="M6 6l12 12M18 6L6 18"/></svg>
              Välj en tabell att träna på
            </div>
            <div class="tgrid">
              ${[1,2,3,4,5,6,7,8,9,10,11,12].map(t => tableCardHTML(t)).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    updateTimerDisplay();
    updateModeButtons();
    requestAnimationFrame(updateModeButtons);
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
    el.innerHTML = `<span class="timer-pill timer-bar num ${cls}"><svg class="icn"><use href="#i-timer"/></svg>${str}</span>`;
  }

  function showTimerDone(minutes) {
    App.Confetti.burst(80);
    App.Sound.play('fanfare');
    const elapsed = sessionStart ? Math.round((Date.now() - sessionStart) / 60000) : minutes;
    addSessionLog({ type: 'timer', minutes: elapsed });
    showModal(`
      <div class="mult-modal-emoji">🎉</div>
      <h3 class="modal-title">Fantastisk träning!</h3>
      <p class="mult-modal-txt">Du tränade i ${elapsed} minut${elapsed !== 1 ? 'er' : ''}! ⭐</p>
      <div class="mult-modal-stack">
        <button class="btn btn-primary btn-block" onclick="MultGame.hideModal();MultGame.startTimer(${minutes})">
          Starta ny timer (${minutes} min)
        </button>
        <button class="btn btn-secondary btn-block" onclick="MultGame.hideModal();MultGame.showStats()">
          Se resultat
        </button>
        <button class="btn btn-ghost btn-block" onclick="MultGame.hideModal()">
          Fortsätt träna fritt
        </button>
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
      ${baseStyle()}
      <div class="app-header">
        <button class="btn-back" onclick="MultGame.renderMain()">Tillbaka</button>
        <span class="header-title">${table}:ans tabell</span>
        <span class="mult-spacer"></span>
      </div>
      <div class="wrap vcenter mult-setup">
        <p class="mult-sub num">Tränar: ${table} × ${rangeMin}–${rangeMax}</p>

        <!-- Svarsläge -->
        <div class="card">
          <div class="card-title">Steg 1 – Välj svarsläge</div>
          ${modeSegHTML()}
        </div>

        <!-- Aktivitet -->
        <div class="card">
          <div class="card-title">Steg 2 – Välj aktivitet</div>
          <div class="mult-stack">
            <button class="btn btn-secondary btn-block" onclick="MultGame.startLearn(${table})">
              <svg class="icn" viewBox="0 0 24 24"><path d="M12 5.5C10.5 4 8.4 3.5 6 3.5c-1 0-2 .15-3 .5v14.5c1-.35 2-.5 3-.5 2.4 0 4.5.5 6 2 1.5-1.5 3.6-2 6-2 1 0 2 .15 3 .5V4c-1-.35-2-.5-3-.5-2.4 0-4.5.5-6 2zm0 0v14.5"/></svg>
              Lär dig först
            </button>
            <button class="btn btn-primary btn-block" onclick="MultGame.startInteractive(${table})">
              <svg class="icn"><use href="#i-play"/></svg>
              Interaktiv träning
            </button>
            <button class="btn btn-accent btn-block" onclick="MultGame.startTest(${table})">
              <svg class="icn" viewBox="0 0 24 24"><path d="M13 2.5L4.5 13.5h6l-1 8L18 10.5h-6l1-8z"/></svg>
              Börja testa direkt
            </button>
          </div>
        </div>
      </div>
    `;
    updateModeButtons();
    requestAnimationFrame(updateModeButtons);
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
    const act = answerMode === 'choice' ? ch : fr;
    ch.classList.toggle('chip-active', act === ch);
    fr.classList.toggle('chip-active', act === fr);
    const seg = ch.closest('.segmented');
    const ind = seg ? seg.querySelector('.seg-ind') : null;
    if (ind) {
      ind.style.left  = act.offsetLeft + 'px';
      ind.style.width = act.offsetWidth + 'px';
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
        <div class="card animate-pop-in" style="animation-delay:${(m-rangeMin)*0.06}s">
          <span class="ml-q num">${table} × ${m}</span>
          <span class="ml-a num">= ${table * m}</span>
        </div>
      `);
    }
    root.innerHTML = `
      ${baseStyle()}
      <div class="app-header">
        <button class="btn-back" onclick="MultGame.selectTable(${table})">Tillbaka</button>
        <span class="header-title">${table}:an – Lär dig</span>
        <span class="mult-spacer"></span>
      </div>
      <div class="wrap mult-gap">
        <div class="mult-learn">
          ${rows.join('')}
        </div>
        <button class="btn btn-primary btn-lg btn-block" onclick="MultGame.startInteractive(${table})">
          Träna nu!
          <svg class="icn"><use href="#i-play"/></svg>
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

      const headerHTML = `
        <div class="app-header">
          <button class="btn-back" onclick="MultGame.selectTable(${table})">Avbryt</button>
          <span class="header-title">${table}:ans tabell</span>
          <div class="mult-hdr-actions">
            <span class="mult-timer-hdr" id="mult-timer-display"></span>
            <span class="header-progress num" role="progressbar" aria-valuenow="${prog.answered}" aria-valuemin="0" aria-valuemax="${prog.total}" aria-label="Framsteg">
              <span>${prog.answered}/${prog.total}</span>
              <span class="hp-bar"><i style="width:${Math.round(progress*100)}%"></i></span>
            </span>
          </div>
        </div>
      `;

      if (phase === 'show') {
        // Visa svaret först
        root.innerHTML = `
          ${baseStyle()}
          ${headerHTML}
          <div class="wrap">
            <div class="mq-main">
              <div class="card mq-qcard q-hero">
                <div class="mq-hint">Kom ihåg detta! 📚</div>
                <div class="mq-task num">${table}<span class="mq-x">×</span>${mult}</div>
                <div class="mq-ans num">= ${ans}</div>
              </div>
              <button class="btn btn-primary btn-lg btn-block mq-cta" onclick="MultGame._trainingNext()">
                Jag förstår!
                <svg class="icn"><use href="#i-play"/></svg>
              </button>
            </div>
          </div>
        `;
        updateTimerDisplay();
        MultGame._trainingNext = () => { phase = 'ask'; renderQ(); };
      } else {
        // Fråga
        root.innerHTML = `
          ${baseStyle()}
          ${headerHTML}
          <div class="wrap">
            <div class="mq-main">
              <div class="card mq-qcard q-hero">
                <div class="mq-task num">${table}<span class="mq-x">×</span>${mult}<span class="mq-eq">&nbsp;= ?</span></div>
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
          </div>
        `;
        updateTimerDisplay();
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
    const cls   = RESULT_CLS[MP.resultTier(pct)];
    const medal = MP.getMedal(pct);

    const root = document.getElementById('mult-root');
    root.innerHTML = `
      ${baseStyle()}
      <div class="wrap vcenter">
        <div class="result-hero ${cls}">
          <div class="result-pct num">${pct}%</div>
          <div><span class="result-medal">${medal || emoji}</span></div>
          <p class="result-msg">${msg}</p>
          <p class="result-note num">${correct} rätt av ${total}</p>
        </div>
        <div class="result-actions">
          <button class="btn btn-primary btn-lg" onclick="MultGame.startTest(${table})">
            <svg class="icn"><use href="#i-refresh"/></svg>
            Testa igen
          </button>
          <button class="btn btn-ghost btn-lg" onclick="MultGame.renderMain()">
            Tillbaka till menyn
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
      ${baseStyle()}
      <div class="app-header">
        <button class="btn-back" onclick="MultGame.renderMain()">Tillbaka</button>
        <span class="header-title">Eget Matteprov</span>
        <span class="mult-spacer"></span>
      </div>
      <div class="wrap mult-gap">
        <p class="mult-sub">Välj 2–3 tabeller att blanda 🎲</p>
        <div class="tgrid" id="custom-grid">
          ${[1,2,3,4,5,6,7,8,9,10,11,12].map(t => `
            <div class="table-card" id="ct-${t}" onclick="MultGame._toggleCustomTable(${t})" tabindex="0" role="checkbox">
              <div class="table-number num">${t}:an</div>
            </div>
          `).join('')}
        </div>

        <!-- Range -->
        <div class="card">
          <div class="range-lab"><b>Talintervall</b><span class="num" id="custom-range-label">${rangeMin} – ${rangeMax}</span></div>
          <div class="range-row">
            <input type="range" class="range-input" id="custom-range-min" min="1" max="12" value="${rangeMin}" oninput="MultGame._updateCustomRange()" aria-label="Från">
            <input type="range" class="range-input" id="custom-range-max" min="1" max="12" value="${rangeMax}" oninput="MultGame._updateCustomRange()" aria-label="Till">
          </div>
        </div>

        <button class="btn btn-accent btn-lg btn-block" id="btn-start-custom" disabled onclick="MultGame._startCustom()">
          Starta ditt matteprov!
        </button>
        <p class="mult-sub" id="custom-hint">
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

  /* Kör en blandad session med given frågelista.
     opts (alla valfria – utelämnade = exakt gamla Matteprov-beteendet):
       headerTitle  – rubrik i headern
       hint         – text ovanför frågan ('' döljer raden)
       onCancel     – Avbryt-knappens handling (default: showCustomTest)
       onDone(stats)– egen resultathantering (default: showCustomResult)
     Återanvänds av Dagens träning (js/daily.js) via runFocusedSession. */
  function runCustomSession(questions, tables, opts) {
    opts = opts || {};
    const quiz = MP.createRetryQuiz(questions);
    const headerTitle = opts.headerTitle || 'Matteprov';
    const hint = (opts.hint !== undefined) ? opts.hint : `${tables.join(', ')}-tabellerna`;
    MultGame._sessionCancel = opts.onCancel || showCustomTest;

    function finish() {
      if (opts.onDone) { opts.onDone(quiz.stats()); return; }
      showCustomResult(quiz.stats(), tables);
    }

    function renderQ() {
      const q = quiz.current();
      if (q === null) { finish(); return; }
      const ans = q.table * q.mult;
      const root = document.getElementById('mult-root');
      const prog     = quiz.progress();
      const progress = prog.total > 0 ? Math.min(1, prog.answered / prog.total) : 0;

      root.innerHTML = `
        ${baseStyle()}
        <div class="app-header">
          <button class="btn-back" onclick="MultGame._sessionCancel()">Avbryt</button>
          <span class="header-title">${headerTitle}</span>
          <div class="mult-hdr-actions">
            <span class="mult-timer-hdr" id="mult-timer-display"></span>
            <span class="header-progress num" role="progressbar" aria-valuenow="${prog.answered}" aria-valuemin="0" aria-valuemax="${prog.total}" aria-label="Framsteg">
              <span>${prog.answered}/${prog.total}</span>
              <span class="hp-bar"><i style="width:${Math.round(progress*100)}%"></i></span>
            </span>
          </div>
        </div>
        <div class="wrap">
          <div class="mq-main">
            <div class="card mq-qcard q-hero">
              ${hint ? `<div class="mq-hint num">${hint}</div>` : ''}
              <div class="mq-task num">${q.table}<span class="mq-x">×</span>${q.mult}<span class="mq-eq">&nbsp;= ?</span></div>
            </div>
            ${buildAnswerUI(q.table, q.mult, ans, (wasCorrect) => {
              recordAnswer(q.table, q.mult, wasCorrect);
              quiz.answer(wasCorrect);
              if (quiz.isDone()) {
                finish(); return;
              }
              renderQ();
            })}
          </div>
        </div>
      `;
      updateTimerDisplay();
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
      ${baseStyle()}
      <div class="wrap vcenter">
        <div class="result-hero ${cls}">
          <div class="result-pct num">${pct}%</div>
          <div><span class="result-medal">${emoji}</span></div>
          <p class="result-msg">${msg}</p>
          <p class="result-note num">${correct} rätt av ${total} – ${tables.join(', ')}-tabellerna</p>
        </div>
        <div class="result-actions">
          <button class="btn btn-accent btn-lg" onclick="MultGame.showCustomTest()">
            <svg class="icn"><use href="#i-refresh"/></svg>
            Nytt matteprov
          </button>
          <button class="btn btn-ghost btn-lg" onclick="MultGame.renderMain()">Tillbaka</button>
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
      ${baseStyle()}
      <div class="app-header">
        <button class="btn-back" onclick="MultGame.renderMain()">Tillbaka</button>
        <span class="header-title">Statistik</span>
        <span class="mult-spacer"></span>
      </div>
      <div class="wrap">
        <div class="mult-stats-cols">

          <!-- Tabellöversikt -->
          <div class="card tables-panel">
            <div class="panel-title">
              <svg class="icn" style="color:var(--accent)"><use href="#i-stats"/></svg>
              Alla tabeller
            </div>
            <div class="tgrid">
              ${[1,2,3,4,5,6,7,8,9,10,11,12].map(t => {
                const p = getTablePercent(t);
                const medal = MP.getMedal(p);
                return `
                  <div class="table-card mult-static">
                    ${medal ? `<div class="table-medal">${medal}</div>` : ''}
                    <div class="table-number num">${t}:an</div>
                    <div class="table-percent num">${p !== null ? p+'%' : '—'}</div>
                    <span class="mult-tbar"><i style="width:${p ?? 0}%"></i></span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="mult-stats-side">
            <!-- Svåraste tal -->
            ${hardest5.length > 0 ? `
              <div class="card">
                <div class="card-title">Träna mer på dessa 💪</div>
                ${hardest5.map(x => `
                  <div class="stat-row">
                    <span class="stat-label num">${x.key.replace('x', ' × ')}</span>
                    <span class="stat-value num ${x.pct<50?'mult-bad':x.pct<75?'mult-mid':'mult-good'}">${x.pct}%</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <!-- Fokuserad träning -->
            ${problemKeys.length > 0 ? `
              <div class="card mult-focus-card">
                <div class="card-title mult-focus-title">Fokuserad träning</div>
                <p class="mult-sub mult-left">
                  Du har ${problemKeys.length} tal med under 75% – vill du träna på dem?
                </p>
                <button class="btn btn-danger btn-block" onclick="MultGame.startFocusedTraining()">
                  Träna på problemtalen
                </button>
              </div>
            ` : ''}

            <!-- Medaljsystem -->
            <div class="card">
              <div class="card-title">
                <svg class="icn" style="color:var(--accent)"><use href="#i-star"/></svg>
                Medaljsystemet
              </div>
              ${[['🥉 Brons','75% rätt'],['🥈 Silver','85% rätt'],['🥇 Guld','95% rätt']].map(([m,r]) => `
                <div class="stat-row">
                  <span class="stat-label">${m}</span>
                  <span class="stat-value num">${r}</span>
                </div>
              `).join('')}
            </div>

            <!-- Träningshistorik -->
            ${renderSessionHistory()}

            <!-- Nollställ -->
            <button class="btn btn-danger btn-sm btn-block" onclick="MultGame.confirmReset()">
              <svg class="icn"><use href="#i-trash"/></svg>
              Nollställ all statistik
            </button>
          </div>
        </div>
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
      const icon  = e.type === 'timer' ? '⏰' : e.type === 'custom' ? '🎲' : '✖️';
      const label = e.type === 'timer'
        ? 'Timerträning'
        : e.type === 'custom' ? `Eget prov (${e.tables?.join(',')})` : `${e.table}:an`;
      const value = e.type === 'timer'
        ? `<span class="history-value num mult-mid">${e.minutes} min</span>`
        : `<span class="history-value num ${e.pct>=80?'mult-good':'mult-mid'}">${e.pct}%</span>`;
      return `
        <div class="history-item">
          <span class="history-icon">${icon}</span>
          <div class="history-main">
            <div class="history-title">${label} ${i===0?'<span class="mult-new">NY!</span>':''}</div>
            <div class="history-sub">${dateStr} ${timeStr}</div>
          </div>
          ${value}
        </div>
      `;
    }).join('');
    return `
      <div class="card mult-hist-card">
        <div class="card-title">
          <svg class="icn" style="color:var(--accent)"><use href="#i-history"/></svg>
          Träningshistorik
        </div>
        <div class="history-list mult-scroll">${entries}</div>
      </div>
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

  /* Parametriserad fokuserad träning för externa moduler
     (Dagens träning, js/daily.js): exakt frågelista in
     [{table, mult}, ...], callbacks ut. Sätter profil och kan
     tillfälligt tvinga svarsläge ('choice') – användarens val
     återställs när passet avslutas eller avbryts. */
  function runFocusedSession(p, pairs, opts) {
    opts = opts || {};
    profile = p;
    stopTimer();
    const prevMode = answerMode;
    if (opts.answerMode) answerMode = opts.answerMode;
    const restore = () => { answerMode = prevMode; };
    const tables = [...new Set(pairs.map(q => q.table))];
    runCustomSession(pairs.slice(), tables, {
      headerTitle: opts.headerTitle,
      hint:        opts.hint,
      onCancel:    opts.onCancel && (() => { restore(); opts.onCancel(); }),
      onDone:      opts.onDone && ((stats) => { restore(); opts.onDone(stats); }),
    });
  }

  function confirmReset() {
    showModal(`
      <div class="mult-modal-emoji">⚠️</div>
      <h3 class="modal-title">Nollställ statistik?</h3>
      <p class="mult-modal-txt">All träningsdata raderas permanent!</p>
      <div class="mult-modal-row">
        <button class="btn btn-ghost" onclick="MultGame.hideModal()">Avbryt</button>
        <button class="btn btn-danger" onclick="MultGame._doReset()">Ja, nollställ</button>
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
        ${baseStyle()}
        <div class="app-header">
          <button class="btn-back" onclick="MultGame.renderMain()">Tillbaka</button>
          <span class="header-title">Sessionslogg</span>
          <span class="mult-spacer"></span>
        </div>
        <div class="wrap vcenter mult-empty">
          <div class="mult-empty-emoji">📭</div>
          <p class="mult-sub">Inga sessioner än. Börja träna!</p>
        </div>
      `;
      return;
    }

    const entries = log.map((e, i) => {
      const d = new Date(e.date);
      const dateStr = d.toLocaleDateString('sv-SE', { weekday:'short', day:'numeric', month:'short' });
      const timeStr = d.toLocaleTimeString('sv-SE', { hour:'2-digit', minute:'2-digit' });
      const icon    = e.type === 'timer' ? '⏰' : e.type === 'custom' ? '🎲' : '✖️';
      const label   = e.type === 'timer'
        ? 'Timerträning'
        : e.type === 'custom'
        ? `Eget prov (${e.tables?.join(', ')})`
        : `${e.table}:ans tabell`;
      const value   = e.type === 'timer'
        ? `<span class="history-value num mult-mid">${e.minutes} min</span>`
        : `<span class="history-value num ${e.pct>=80?'mult-good':e.pct>=60?'mult-mid':'mult-bad'}">${e.pct}%</span>`;
      const sub     = e.type === 'timer'
        ? `Tidsträning i ${e.minutes} minut${e.minutes !== 1 ? 'er' : ''}`
        : `${e.correct} rätt av ${e.total} | Intervall ${e.rangeMin}–${e.rangeMax}`;
      return `
        <div class="history-item">
          <span class="history-icon">${icon}</span>
          <div class="history-main">
            <div class="history-title">${label} ${i===0?'<span class="mult-new">NY!</span>':''}</div>
            <div class="history-sub">${dateStr} kl. ${timeStr} · ${sub}</div>
          </div>
          ${value}
        </div>
      `;
    }).join('');

    root.innerHTML = `
      ${baseStyle()}
      <div class="app-header">
        <button class="btn-back" onclick="MultGame.renderMain()">Tillbaka</button>
        <span class="header-title">Sessionslogg</span>
        <span class="mult-spacer"></span>
      </div>
      <div class="wrap">
        <div class="card mult-hist-card">
          <div class="history-list mult-scroll">${entries}</div>
        </div>
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
      <div class="mq-answers q-answers-fill" id="choice-options">
        ${options.map(o => `
          <button class="answer-option num" onclick="MultGame._handleChoice(${o},${correctAnswer})" id="opt-${o}">
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
      <div class="mult-free">
        <div id="free-display" class="mult-free-display num">?</div>
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
    runFocusedSession,
    confirmReset,
    updateRange,
    startTimer,
    stopTimer,
    showModal,
    hideModal,

    // Händelsehanterare (sätts dynamiskt av renderfunktioner)
    _trainingNext: null,
    _sessionCancel: null,
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
