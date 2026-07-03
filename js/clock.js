/* ============================================================
   MULTIPLAY – Klockan
   Övning + Test (analog & digital). Renderar i #clock-root.
   Design: designsystem v25 (docs/DESIGN-SYSTEM.md) – drömhimmel
   via .theme-clock-tokens (#clock-root sätter accentgruppen).
   KLOCKLAGEN (designlag 3): timvisare BLÅ --time-h, minutvisare
   RÖD --time-m, digital tid blå/mörk/röd, tidstext färgkodad.
   ============================================================ */
'use strict';

const ClockGame = (() => {

  /* ── Tillstånd ─────────────────────────────────────── */
  let profile    = null;
  let practiceH  = 12;
  let practiceM  = 0;
  let clockType  = 'analog';   // 'analog' | 'digital'

  const LOG_KEY  = id => `clock_log_${id}`;

  /* ── Logg ──────────────────────────────────────────── */
  function sessionLog() {
    return MP.createLog(LOG_KEY(profile.id), 40);
  }

  function getLog() { return sessionLog().get(); }

  function addLog(entry) { sessionLog().add(entry); }

  const p2 = n => String(n).padStart(2, '0');

  /* ══════════════════════════════════════════════════════
     MODULSPECIFIK CSS — EN injektion (id="clock-css")
  ══════════════════════════════════════════════════════ */
  const CLOCK_CSS = `
    #clock-root .wrap{gap:12px}
    .hdr-spacer{width:52px;flex-shrink:0;display:inline-block}

    /* Tidsfärger (KLOCKLAGEN – designlag 3) */
    .t-h{color:var(--time-h);font-weight:900}
    .t-m{color:var(--time-m);font-weight:900}
    .t-k{color:var(--time-k);font-weight:800}

    /* Urtavlans SVG-delar */
    .ck-tick{stroke:var(--deep)}
    .ck-num{fill:var(--deep);font-family:var(--font-head);font-weight:700;font-size:15px;text-anchor:middle}
    .ck-hand-h{stroke:var(--time-h)}
    .ck-hand-m{stroke:var(--time-m)}
    .ck-cap{fill:var(--accent-2);stroke:#fff;stroke-width:2.5}

    /* Övningsvyn – tvåkolumn ≥900px */
    .ck-cols{display:flex;flex-direction:column;gap:12px;flex:1;min-height:0}
    .ck-left{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:18px 16px;flex:1;min-height:0}
    .ck-right{display:flex;flex-direction:column;gap:12px;min-height:0}
    #clock-root .ck-svg{width:min(272px,100%);height:auto;filter:drop-shadow(0 12px 30px rgba(47,111,228,.26))}
    .ck-periods{display:flex;gap:7px;flex-wrap:wrap;justify-content:center}
    .ck-periods .chip{min-height:38px;font-size:13px;padding:7px 13px;cursor:default}
    .ck-timepanel{text-align:center;padding:14px 18px}
    .ck-digi{font-family:var(--font-head);font-weight:800;font-size:44px;line-height:1.05;letter-spacing:2px}
    .ck-svline{font-family:var(--font-head);font-weight:700;font-size:21px;color:var(--time-k);line-height:1.25;margin-top:6px}
    .ck-legend{display:flex;justify-content:center;gap:16px;margin-top:8px;font-size:12px;font-weight:800;color:var(--ink-soft)}
    .ck-legend span{display:inline-flex;align-items:center;gap:6px}
    .ck-legend i{width:10px;height:10px;border-radius:50%;display:inline-block}
    .ck-legend .dot-h{background:var(--time-h)}
    .ck-legend .dot-m{background:var(--time-m)}
    .ck-spins{padding:8px 18px}
    .ck-spinrow{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:7px 0}
    .ck-spinrow+.ck-spinrow{border-top:1px solid rgba(109,90,150,.14)}
    .ck-spinrow b{font-size:16px;display:block}
    .ck-spinrow b.lab-h{color:var(--time-h)}
    .ck-spinrow b.lab-m{color:var(--time-m)}
    .ck-spinrow small{display:block;font-size:12px;font-weight:700;color:var(--ink-soft)}
    .ck-ctrls{display:flex;align-items:center;gap:10px}
    .ck-ctrls .icon-btn{width:46px;height:46px;min-height:46px}
    .ck-val{font-family:var(--font-head);font-weight:800;font-size:24px;min-width:46px;text-align:center}
    .ck-actions{display:flex;gap:10px;align-items:stretch}
    .ck-actions .icon-btn{width:52px;height:52px;flex-shrink:0}
    .ck-actions .btn{flex:1;min-height:52px}

    /* Header-progress-kapsel (v26 quiz-mall: ersätter frågebandet) */
    #clock-root .header-progress{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:7px 13px;border-radius:999px;background:rgba(255,255,255,.8);border:1.5px solid rgba(47,111,228,.22);box-shadow:var(--shadow-sm);font-weight:900;font-size:13.5px;color:var(--deep);white-space:nowrap;flex-shrink:0}
    #clock-root .header-progress .progress-bar{width:54px;height:8px;flex:none}

    /* Testval — skala med skärmhöjden, fyll som övningsvyn */
    .ck-choice-wrap{align-items:center;gap:clamp(14px,3vh,34px)}
    .ck-hero{font-size:clamp(54px,11vh,108px);line-height:1;text-align:center;animation:bounce-in .5s var(--spring)}
    .ck-choice-title{font-family:var(--font-head);color:var(--deep);font-size:clamp(21px,3.6vh,34px);text-align:center}
    .ck-choice{display:flex;flex-direction:column;gap:clamp(12px,2.2vh,24px);width:100%;max-width:640px}
    .ck-choice .game-card-wide{min-height:clamp(86px,16vh,190px);padding:clamp(12px,2.4vh,26px) clamp(20px,3vw,34px)}
    .ck-choice .game-emoji{font-size:clamp(30px,6vh,58px);margin:0}
    .ck-choice h3{font-size:clamp(19px,3vh,30px)}
    .ck-choice p{font-size:clamp(13px,2vh,17px)}
    .ck-chev{width:24px;height:24px;margin-left:auto;color:var(--ink-soft);flex-shrink:0}

    /* Testflöde (Del 1 & 2) — uppgiften äger skärmen (v26 quiz-mall):
       klockan/tiden skalar med skärmhöjden, svaren/kontrollerna fyller nedre delen */
    .ck-quiz{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:clamp(10px,2vh,24px)}
    .ck-qpanel,#clock-root .q-hero{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(8px,1.6vh,18px)}
    .ck-qlabel{font-family:var(--font-head);font-weight:700;font-size:clamp(17px,2.8vh,27px);color:var(--deep);text-align:center}
    .ck-qsvg{width:min(41vh,84vw,540px);height:auto;filter:drop-shadow(0 10px 24px rgba(47,111,228,.22))}
    #setting-clock-wrap .ck-qsvg{width:min(38vh,72vw,480px)}
    .ck-digibox{font-family:var(--font-head);font-weight:800;font-size:clamp(44px,12vh,120px);letter-spacing:2px;line-height:1.05;padding:clamp(10px,2vh,22px) clamp(24px,5vw,48px);background:rgba(255,255,255,.92);border:2px solid rgba(47,111,228,.18);border-radius:22px;box-shadow:var(--shadow-md)}
    #digital-setting-wrap .ck-digibox{font-size:clamp(48px,13vh,130px)}
    .ck-target{font-size:clamp(19px,3.4vh,36px);letter-spacing:0;padding:8px 22px}
    .ck-opts{display:flex;flex-direction:column;gap:clamp(9px,1.6vh,16px);width:100%;max-width:520px;margin:0 auto}
    .ck-opts .answer-option{min-height:clamp(50px,8vh,96px);font-size:clamp(17px,2.9vh,28px)}
    .ck-setctrl{display:flex;flex-direction:column;justify-content:center;gap:clamp(8px,1.6vh,16px);width:100%;max-width:520px;margin:0 auto}
    .ck-setctrl .ck-ctrls .icon-btn{width:48px;height:48px;min-height:48px}
    .ck-setctrl .btn-lg{min-height:clamp(50px,8vh,64px)}
    .ck-facit{font-weight:800;font-size:13px;color:#16a34a;text-align:center;margin-bottom:2px}

    /* Resultat — skala upp och fyll (samma nivå som övningsvyn) */
    .ck-result{flex:1;min-height:0;display:flex;flex-direction:column;gap:12px}
    #clock-root .result-pct{font-size:clamp(60px,14vh,140px)}
    #clock-root .result-medal{font-size:clamp(40px,7vh,68px)}
    #clock-root .result-msg{font-size:clamp(19px,3.2vh,32px)}
    #clock-root .result-note{font-size:clamp(13px,2vh,18px)}
    #clock-root .result-actions .btn{min-height:clamp(48px,7.5vh,62px);font-size:clamp(14px,2.2vh,18px)}
    .ck-detail{flex:1;min-height:0;overflow-y:auto}
    .ck-detail .stat-row{padding:clamp(8px,1.4vh,14px) clamp(12px,1.8vw,18px);margin-bottom:clamp(6px,1vh,10px);font-size:clamp(14px,2vh,19px)}
    .ck-sec{font-size:12px;font-weight:800;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em;margin:8px 0 6px}
    .c-ok{color:#16a34a}.c-mid{color:#d97706}.c-err{color:#dc2626}

    /* Historik */
    .ck-history{flex:1;min-height:0}
    .ck-history .history-list{flex:1}
    .ck-history .history-value.c-ok{color:#16a34a}
    .ck-history .history-value.c-mid{color:#d97706}
    .ck-history .history-value.c-err{color:#dc2626}
    .ck-new{background:var(--accent);color:#fff;font-size:10px;font-weight:900;padding:2px 8px;border-radius:999px;margin-left:6px;vertical-align:middle}
    .ck-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center}
    .ck-empty-emoji{font-size:56px}
    .ck-empty p{color:var(--ink-soft);font-weight:700}

    /* Mobil ≤430 */
    @media (max-width:430px){
      .ck-left{padding:13px 10px;gap:9px}
      #clock-root .ck-svg{width:min(250px,64vw)}
      .ck-periods .chip{min-height:33px;font-size:11.5px;padding:6px 10px}
      .ck-timepanel{padding:11px 13px}
      .ck-digi{font-size:35px}
      .ck-svline{font-size:16.5px;margin-top:4px}
      .ck-legend{margin-top:6px;font-size:10.5px;gap:12px}
      .ck-spins{padding:5px 13px}
      .ck-spinrow{padding:6px 0}
      .ck-spinrow b{font-size:14.5px}
      .ck-spinrow small{display:none}
      .ck-ctrls .icon-btn{width:40px;height:40px;min-height:40px}
      .ck-val{font-size:20px;min-width:38px}
      .ck-actions .icon-btn{width:46px;height:46px}
      .ck-actions .btn{min-height:46px;font-size:14.5px}
      #clock-root .header-progress{min-height:36px;padding:6px 10px;gap:7px;font-size:12px}
      #clock-root .header-progress .progress-bar{width:34px}
      #clock-root .header-progress .hp-full{display:none}
      #clock-root .app-header .header-title{font-size:clamp(17px,4.7vw,20px)}
      .ck-setctrl .ck-ctrls .icon-btn{width:46px;height:46px;min-height:46px}
    }

    /* iPad porträtt 700–899: skala upp (designlag 2 – fyll skärmen) */
    @media (min-width:700px) and (max-width:899px){
      #clock-root .ck-svg{width:min(340px,100%)}
      .ck-periods .chip{min-height:44px;font-size:14px;padding:9px 16px}
      .ck-timepanel{padding:20px 18px}
      .ck-digi{font-size:56px}
      .ck-svline{font-size:25px;margin-top:8px}
      .ck-legend{font-size:13px;margin-top:10px}
      .ck-spins{padding:12px 22px}
      .ck-spinrow{padding:10px 0}
      .ck-ctrls .icon-btn{width:52px;height:52px;min-height:52px}
      .ck-val{font-size:28px;min-width:52px}
      .ck-actions .icon-btn{width:58px;height:58px}
      .ck-actions .btn{min-height:58px;font-size:17px}
      .ck-qsvg{width:min(44vh,62vw,560px)}
      #setting-clock-wrap .ck-qsvg{width:min(40vh,56vw,470px)}
      .ck-opts{max-width:640px}
      .ck-setctrl{max-width:600px}
      .ck-setctrl .ck-ctrls .icon-btn{width:56px;height:56px;min-height:56px}
    }

    /* iPad landskap / desktop ≥900: tvåkolumn */
    @media (min-width:900px){
      .ck-cols{display:grid;grid-template-columns:1.02fr 1fr;align-items:stretch}
      .ck-right .ck-timepanel,.ck-right .ck-spins{flex:1;display:flex;flex-direction:column;justify-content:center}
      #clock-root .ck-svg{width:min(400px,100%);height:auto}
      .ck-quiz{display:grid;grid-template-columns:1.05fr 1fr;align-items:center;gap:clamp(20px,3vw,44px)}
      .ck-opts,.ck-setctrl{margin:0;max-width:none}
      .ck-qsvg{width:min(56vh,38vw,500px)}
      #setting-clock-wrap .ck-qsvg{width:min(46vh,32vw,430px)}
      .ck-opts .answer-option{min-height:clamp(64px,11vh,112px)}
      .ck-setctrl .ck-ctrls .icon-btn{width:56px;height:56px;min-height:56px}
      .ck-setctrl .ck-spins{padding:14px 24px}
      .ck-setctrl .ck-spinrow{padding:14px 0}
      .ck-setctrl .ck-spinrow b{font-size:19px}
      .ck-result{display:grid;grid-template-columns:1fr 1fr;align-items:stretch;gap:16px}
    }
  `;

  function styleTag() {
    return `<style id="clock-css">${CLOCK_CSS}</style>`;
  }

  /* ══════════════════════════════════════════════════════
     MARKUP-HJÄLPARE
  ══════════════════════════════════════════════════════ */
  const ICON_MINUS   = `<svg class="icn" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>`;
  const ICON_PLUS    = `<svg class="icn" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`;
  const ICON_DICE    = `<svg class="icn" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none"/></svg>`;
  const ICON_CHECK   = `<svg class="icn" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>`;

  function headerHtml(title, backAction, opts = {}) {
    const right = opts.progress
      ? `<span class="header-progress num" aria-label="Fråga ${opts.progress.n} av ${opts.progress.total}"><span><span class="hp-full">Fråga </span>${opts.progress.n} av ${opts.progress.total}</span><span class="progress-bar"><i style="width:${opts.progress.pct}%"></i></span></span>`
      : opts.history
        ? `<button class="icon-btn" aria-label="Historik" onclick="ClockGame.showHistory()"><svg class="icn"><use href="#i-history"/></svg></button>`
        : `<span class="hdr-spacer"></span>`;
    return `
      <div class="app-header">
        <button class="btn-back" onclick="${backAction}">${opts.backLabel || 'Tillbaka'}</button>
        <span class="header-title">${title}</span>
        ${right}
      </div>`;
  }

  /* Spinners: Timmar (blå etikett) + Minuter (röd etikett) */
  function spinnersHtml(fn, withVals) {
    const btn = (label, onclick, icon) =>
      `<button class="icon-btn" aria-label="${label}" onclick="${onclick}">${icon}</button>`;
    return `
      <div class="card ck-spins">
        <div class="ck-spinrow">
          <span><b class="lab-h">Timmar</b><small>+1 / −1 timme</small></span>
          <span class="ck-ctrls">
            ${btn('Minska timme', `${fn}('h',-1)`, ICON_MINUS)}
            ${withVals ? `<span class="ck-val num" id="ctrl-h">12</span>` : ''}
            ${btn('Öka timme', `${fn}('h',1)`, ICON_PLUS)}
          </span>
        </div>
        <div class="ck-spinrow">
          <span><b class="lab-m">Minuter</b><small>+5 / −5 minuter</small></span>
          <span class="ck-ctrls">
            ${btn('Minska minuter', `${fn}('m',-5)`, ICON_MINUS)}
            ${withVals ? `<span class="ck-val num" id="ctrl-m">00</span>` : ''}
            ${btn('Öka minuter', `${fn}('m',5)`, ICON_PLUS)}
          </span>
        </div>
      </div>`;
  }

  /* ══════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════ */
  function init(p) {
    profile   = p;
    practiceH = 12;
    practiceM = 0;
    renderPractice();
  }

  /* ══════════════════════════════════════════════════════
     ÖVNINGSLÄGE — målbildens klockvy (scr-clock)
  ══════════════════════════════════════════════════════ */
  function renderPractice() {
    const root = document.getElementById('clock-root');
    root.innerHTML = `
      ${styleTag()}
      <div class="floaties"><span style="top:5%;left:5%">☁️</span><span style="top:9%;right:7%;animation-delay:2s">🌤️</span></div>
      ${headerHtml('Klockan', 'App.goBackToGameSelect()', { history: true })}
      <div class="wrap">
        <div class="ck-cols">

          <!-- Vänster: stor analog klocka + dygnsperiod-chips -->
          <div class="card ck-left">
            <svg id="clock-svg" class="ck-svg" viewBox="0 0 200 200" role="img"
              aria-label="Analog klocka – blå timvisare, röd minutvisare">
              ${faceDefs()}${faceBody()}
              <line id="hand-hour" class="ck-hand-h" x1="100" y1="100" x2="100" y2="57"
                stroke-width="8" stroke-linecap="round"/>
              <line id="hand-minute" class="ck-hand-m" x1="100" y1="100" x2="100" y2="37"
                stroke-width="4.5" stroke-linecap="round"/>
              <circle class="ck-cap" cx="100" cy="100" r="6.5"/>
            </svg>
            <div class="ck-periods" id="time-period">
              <span class="chip" data-p="natt">🌙 Natt</span>
              <span class="chip" data-p="morgon">🌅 Morgon</span>
              <span class="chip chip-gold" data-p="dag">☀️ Dag</span>
              <span class="chip" data-p="kvall">🌆 Kväll</span>
            </div>
          </div>

          <!-- Höger: digital + tidstext + legend, spinners, actions -->
          <div class="ck-right">
            <div class="card ck-timepanel">
              <div id="digital-display" class="ck-digi num">12:00</div>
              <p id="text-display" class="ck-svline"></p>
              <div class="ck-legend">
                <span><i class="dot-h"></i>Timmar</span>
                <span><i class="dot-m"></i>Minuter</span>
              </div>
            </div>

            ${spinnersHtml('ClockGame.adjustTime', true)}

            <div class="ck-actions">
              <button class="icon-btn" aria-label="Slumpa tid" title="Slumpa tid" onclick="ClockGame.randomTime()">${ICON_DICE}</button>
              <button class="icon-btn" aria-label="Återställ" title="Återställ" onclick="ClockGame.resetTime()"><svg class="icn"><use href="#i-refresh"/></svg></button>
              <button class="btn btn-primary" onclick="ClockGame.showTestSetup()">
                Starta klocktest
                <svg class="icn"><use href="#i-play"/></svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    updateClock();
  }

  /* ── Klockuppdatering ──────────────────────────────── */
  function updateClock() {
    const h = practiceH;
    const m = practiceM;

    // Visare-vinklar (urtavla: centrum 100,100 · timvisare 43 · minutvisare 63)
    const hourAngle   = (h % 12) * 30 + m * 0.5 - 90;
    const minuteAngle = m * 6 - 90;

    const hRad  = hourAngle   * Math.PI / 180;
    const mRad  = minuteAngle * Math.PI / 180;

    const handH = document.getElementById('hand-hour');
    const handM = document.getElementById('hand-minute');

    if (handH) {
      handH.setAttribute('x2', (100 + 43 * Math.cos(hRad)).toFixed(1));
      handH.setAttribute('y2', (100 + 43 * Math.sin(hRad)).toFixed(1));
    }
    if (handM) {
      handM.setAttribute('x2', (100 + 63 * Math.cos(mRad)).toFixed(1));
      handM.setAttribute('y2', (100 + 63 * Math.sin(mRad)).toFixed(1));
    }

    // Digital: timmar blå · kolon mörk · minuter röda
    const digitalEl = document.getElementById('digital-display');
    if (digitalEl) digitalEl.innerHTML = colorizeTimeText(`${p2(h)}:${p2(m)}`);

    // Svensk tidstext: timord blå · minutord röda · bindeord mörka
    const textEl = document.getElementById('text-display');
    if (textEl) textEl.innerHTML = `<span class="t-k">Klockan är</span> ${colorizeTimeText(MP.timeToSwedish(h, m))}`;

    // Spinner-värden
    const ch = document.getElementById('ctrl-h');
    const cm = document.getElementById('ctrl-m');
    if (ch) ch.textContent = p2(h);
    if (cm) cm.textContent = p2(m);

    // Dygnsperiod
    updateTimePeriod(h);
  }

  function updateTimePeriod(h) {
    const el = document.getElementById('time-period');
    if (!el) return;
    const p = h < 6 ? 'natt' : h < 12 ? 'morgon' : h < 18 ? 'dag' : 'kvall';
    el.querySelectorAll('.chip').forEach(c =>
      c.classList.toggle('chip-active', c.dataset.p === p));
  }

  function adjustTime(part, delta) {
    if (part === 'h') {
      practiceH = ((practiceH + delta) + 24) % 24;
    } else {
      practiceM = ((practiceM + delta) + 60) % 60;
    }
    App.Sound.play('click');
    updateClock();
  }

  function resetTime() {
    practiceH = 12; practiceM = 0;
    App.Sound.play('click');
    updateClock();
  }

  function randomTime() {
    practiceH = Math.floor(Math.random() * 24);
    practiceM = [0,5,10,15,20,25,30,35,40,45,50,55][Math.floor(Math.random()*12)];
    App.Sound.play('click');
    updateClock();
  }

  /* ══════════════════════════════════════════════════════
     TESTKONFIGURATION
  ══════════════════════════════════════════════════════ */
  function showTestSetup() {
    const root = document.getElementById('clock-root');
    App.Sound.play('click');
    root.innerHTML = `
      ${styleTag()}
      ${headerHtml('Välj klocktest', 'ClockGame.renderPractice()')}
      <div class="wrap vcenter ck-choice-wrap">
        <div class="ck-hero">⏰</div>
        <h2 class="ck-choice-title">Vilket test vill du göra?</h2>
        <div class="ck-choice">
          <button class="game-card game-card-wide" onclick="ClockGame.startTestWithType('analog')">
            <span class="game-emoji">🕐</span>
            <div>
              <h3>Analog klocka</h3>
              <p>Urtavla med visare</p>
            </div>
            <svg class="icn ck-chev"><use href="#i-chevron"/></svg>
          </button>
          <button class="game-card game-card-wide" onclick="ClockGame.startTestWithType('digital')">
            <span class="game-emoji">⏰</span>
            <div>
              <h3>Digital klocka</h3>
              <p>24-timmars format</p>
            </div>
            <svg class="icn ck-chev"><use href="#i-chevron"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════
     TEST – DEL 1: LÄSA KLOCKAN (5 frågor)
  ══════════════════════════════════════════════════════ */
  function startTestWithType(type) {
    clockType = type;
    App.Sound.play('click');
    // Förgenerera frågorna så samma fråga kan ställas om vid fel
    runReadingTest(type, generateQuestions(type, 5), generateQuestions(type, 5));
  }

  /* Slumpa frågetider (fem-minutersintervall).
     Digital: 0–23 (svensk digital standard). Analog: 1–12. */
  function generateQuestions(type, count) {
    const minutes = [0,5,10,15,20,25,30,35,40,45,50,55];
    const qs = [];
    for (let i = 0; i < count; i++) {
      const h = type === 'digital'
        ? Math.floor(Math.random() * 24)
        : Math.floor(Math.random() * 12) + 1;
      const m = minutes[Math.floor(Math.random() * minutes.length)];
      qs.push({ h, m });
    }
    return qs;
  }

  function runReadingTest(type, questions, settingQuestions) {
    const TOTAL = questions.length;
    const quiz = MP.createRetryQuiz(questions);
    const results = [];          // första försöket per fråga (avgör poängen)
    const firstTried = new Set();

    function render() {
      const q = quiz.current();
      if (q === null) { runSettingTest(type, results, settingQuestions); return; }

      const correct = MP.timeToSwedish(q.h, q.m);
      const options = generateTimeOptions(q.h, q.m, correct);

      const root = document.getElementById('clock-root');
      const prog = quiz.progress();
      const progress = prog.answered / TOTAL;

      root.innerHTML = `
        ${styleTag()}
        ${headerHtml('Del 1 · Läsa klockan', 'ClockGame.showTestSetup()', {
          backLabel: 'Avbryt',
          progress: { n: Math.min(prog.answered+1,TOTAL), total: TOTAL, pct: Math.round(progress*100) }
        })}
        <div class="wrap">
          <div class="ck-quiz">
            <div class="ck-qpanel q-hero">
              <p class="ck-qlabel">Vad visar klockan?</p>
              ${type === 'analog'
                ? drawAnalogClock(q.h, q.m)
                : `<div class="ck-digibox num">${colorizeTimeText(`${p2(q.h)}:${p2(q.m)}`)}</div>`
              }
            </div>
            <div class="ck-opts q-answers-fill">
              ${options.map((opt, i) => `
                <button class="answer-option" id="opt-${i}" onclick="ClockGame._handleReadChoice(${i})">
                  ${colorizeTimeText(opt)}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      ClockGame._handleReadChoice = (idx) => {
        const chosen = options[idx];
        const wasCorrect = chosen === correct;
        App.Sound.play(wasCorrect ? 'correct' : 'wrong');

        document.querySelectorAll('.answer-option').forEach((btn, i) => {
          btn.disabled = true;
          if (options[i] === correct)   btn.classList.add('correct');
          if (i === idx && !wasCorrect) btn.classList.add('wrong');
        });

        // Första försöket på denna fråga avgör poängen
        if (!firstTried.has(q)) {
          firstTried.add(q);
          results.push({ h: q.h, m: q.m, chosen, correct: wasCorrect });
        }
        quiz.answer(wasCorrect);

        setTimeout(render, wasCorrect ? 700 : 1400);
      };
    }

    render();
  }

  /* ══════════════════════════════════════════════════════
     TEST – DEL 2: STÄLLA KLOCKAN (5 frågor)
  ══════════════════════════════════════════════════════ */
  function runSettingTest(type, part1Results, questions) {
    const TOTAL = questions.length;
    const quiz = MP.createRetryQuiz(questions);
    const results = [];          // första försöket per fråga (avgör poängen)
    const firstTried = new Set();

    let settingH = 12, settingM = 0;

    function render() {
      const q = quiz.current();
      if (q === null) { showTestResult(type, part1Results, results); return; }

      // Nollställ inställningen inför varje fråga (även omfråga efter fel)
      settingH = 12; settingM = 0;

      const text = MP.timeToSwedish(q.h, q.m);
      const root = document.getElementById('clock-root');
      const prog = quiz.progress();
      const progress = (5 + prog.answered) / 10;

      root.innerHTML = `
        ${styleTag()}
        ${headerHtml('Del 2 · Ställ klockan', 'ClockGame.showTestSetup()', {
          backLabel: 'Avbryt',
          progress: { n: Math.min(prog.answered+1,TOTAL)+5, total: 10, pct: Math.round(progress*100) }
        })}
        <div class="wrap">
          <div class="ck-quiz">
            <div class="ck-qpanel q-hero">
              <p class="ck-qlabel">Ställ klockan till:</p>
              <div class="ck-digibox ck-target">${colorizeTimeText(text)}</div>
              ${type === 'analog'
                ? `<div id="setting-clock-wrap">${drawSettingClock(settingH, settingM)}</div>`
                : `<div id="digital-setting-wrap">${drawDigitalSetting(settingH, settingM)}</div>`
              }
            </div>
            <div class="ck-setctrl q-answers-fill">
              ${spinnersHtml('ClockGame._adjustSetting', false)}
              <button class="btn btn-primary btn-lg" onclick="ClockGame._lockSetting()">
                Lås svar
                ${ICON_CHECK}
              </button>
            </div>
          </div>
        </div>
      `;

      ClockGame._adjustSetting = (part, delta) => {
        if (part === 'h') {
          // Digital: 0–23 (svensk digital standard). Analog: 1–12.
          if (type === 'digital') settingH = ((settingH + delta) + 24) % 24;
          else settingH = ((settingH - 1 + delta) + 12) % 12 + 1;
        } else {
          settingM = ((settingM + delta) + 60) % 60;
        }
        App.Sound.play('click');
        if (type === 'analog') {
          document.getElementById('setting-clock-wrap').innerHTML = drawSettingClock(settingH, settingM);
        } else {
          document.getElementById('digital-setting-wrap').innerHTML = drawDigitalSetting(settingH, settingM);
        }
      };

      let lockGuard = false; // återställs vid varje render — blockerar dubbeltryck under feedback
      ClockGame._lockSetting = () => {
        if (lockGuard) return;
        lockGuard = true;
        // Tidtexten skiljer inte på fm/em – jämför timmen modulo 12
        const wasCorrect = (settingH % 12) === (q.h % 12) && settingM === q.m;
        App.Sound.play(wasCorrect ? 'correct' : 'wrong');

        if (!firstTried.has(q)) {
          firstTried.add(q);
          results.push({ h: q.h, m: q.m, setH: settingH, setM: settingM, correct: wasCorrect });
        }
        quiz.answer(wasCorrect);

        if (!wasCorrect) {
          // Visa facit kort, ställ sedan om SAMMA fråga.
          // Visarna behåller KLOCKLAGENS färger (blå tim / röd minut).
          if (type === 'analog') {
            document.getElementById('setting-clock-wrap').innerHTML =
              `<p class="ck-facit">Rätt svar:</p>` + drawSettingClock(q.h, q.m);
          } else {
            // Tidstexten är fm/em-ambivalent (jämförelsen är mod 12): visa
            // facit-timmen konsekvent med det barnet kunde veta — behåll
            // barnets timme om den var mod-12-rätt, annars frågans timme.
            const facitH = (settingH % 12) === (q.h % 12) ? settingH : q.h;
            document.getElementById('digital-setting-wrap').innerHTML =
              `<p class="ck-facit">Rätt svar:</p>` + drawDigitalSetting(facitH, q.m);
          }
          setTimeout(render, 1500);
        } else {
          setTimeout(render, 700);
        }
      };
    }

    render();
  }

  /* ══════════════════════════════════════════════════════
     TESTRESULTAT
  ══════════════════════════════════════════════════════ */
  function showTestResult(type, part1, part2) {
    const totalCorrect = part1.filter(r=>r.correct).length + part2.filter(r=>r.correct).length;
    const total = 10;
    const pct   = Math.round((totalCorrect / total) * 100);

    App.Sound.play(pct >= 80 ? 'fanfare' : 'correct');
    if (pct === 100) App.Confetti.burst(80);

    addLog({ type: clockType, totalCorrect, total, pct, part1, part2 });

    const { emoji, msg } = MP.feedbackMessage(pct);

    const root = document.getElementById('clock-root');
    root.innerHTML = `
      ${styleTag()}
      ${headerHtml('Resultat', 'ClockGame.renderPractice()')}
      <div class="wrap">
        <div class="ck-result">

          <div class="result-hero">
            <div class="result-pct num">${pct}%</div>
            <div class="result-medal">${emoji}</div>
            <div class="result-msg">${msg}</div>
            <div class="result-note">${totalCorrect} av ${total} rätt · ${type==='analog'?'Analog':'Digital'} klocka</div>
            <div class="result-actions">
              <button class="btn btn-primary" onclick="ClockGame.startTestWithType('${type}')">
                Spela igen
                <svg class="icn"><use href="#i-refresh"/></svg>
              </button>
              <button class="btn btn-ghost" onclick="ClockGame.renderPractice()">Till övningen</button>
            </div>
          </div>

          <div class="card ck-detail">
            <div class="card-title">
              <svg class="icn" style="color:var(--accent)"><use href="#i-stats"/></svg>
              Detaljresultat
            </div>
            <div class="ck-sec">Del 1 · Läsa klockan</div>
            ${part1.slice(0,5).map(r => `
              <div class="stat-row">
                <span class="num">${colorizeTimeText(`${p2(r.h)}:${p2(r.m)}`)}</span>
                <span class="${r.correct?'c-ok':'c-err'}">${r.correct?'✓':'✗'} ${colorizeTimeText(MP.timeToSwedish(r.h,r.m))}</span>
              </div>
            `).join('')}
            <div class="ck-sec">Del 2 · Ställa klockan</div>
            ${part2.slice(0,5).map(r => `
              <div class="stat-row">
                <span>${colorizeTimeText(MP.timeToSwedish(r.h,r.m))}</span>
                <span class="${r.correct?'c-ok':'c-err'}">${r.correct
                  ? '✓ Rätt'
                  : `✗ ${colorizeTimeText(`${p2(r.setH)}:${p2(r.setM)}`)}`}</span>
              </div>
            `).join('')}
          </div>

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
    const root = document.getElementById('clock-root');

    if (log.length === 0) {
      root.innerHTML = `
        ${styleTag()}
        ${headerHtml('Historik', 'ClockGame.renderPractice()')}
        <div class="wrap">
          <div class="ck-empty">
            <div class="ck-empty-emoji">📭</div>
            <p>Inga test gjorda ännu!</p>
            <button class="btn btn-primary" onclick="ClockGame.showTestSetup()">
              Gör ett test nu!
              <svg class="icn"><use href="#i-play"/></svg>
            </button>
          </div>
        </div>
      `;
      return;
    }

    root.innerHTML = `
      ${styleTag()}
      ${headerHtml('Historik', 'ClockGame.renderPractice()')}
      <div class="wrap ck-history">
        <div class="history-list">
          ${log.map((e, i) => {
            const d = new Date(e.date);
            const dateStr = d.toLocaleDateString('sv-SE', { weekday:'short', day:'numeric', month:'short' });
            const timeStr = d.toLocaleTimeString('sv-SE', { hour:'2-digit', minute:'2-digit' });
            const vCls = e.pct >= 80 ? 'c-ok' : e.pct >= 60 ? 'c-mid' : 'c-err';
            return `
              <div class="history-item">
                <span class="history-icon">${e.type==='analog'?'🕐':'⏰'}</span>
                <div class="history-main">
                  <div class="history-title">${e.type==='analog'?'Analog':'Digital'} klocktest${i===0?'<span class="ck-new">Ny!</span>':''}</div>
                  <div class="history-sub">${dateStr} kl. ${timeStr}</div>
                </div>
                <span class="history-value num ${vCls}">${e.totalCorrect}/10</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════
     SVG-HJÄLPARE — drömhimmels-urtavlan (målbildens face)
     viewBox 0 0 200 200 · centrum (100,100) · rim r95 · face r87
  ══════════════════════════════════════════════════════ */
  function faceDefs() {
    return `
      <defs>
        <radialGradient id="ck-face" cx="38%" cy="32%" r="80%">
          <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#e3efff"/>
        </radialGradient>
        <linearGradient id="ck-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#7db2f7"/><stop offset="100%" stop-color="#2f6fe4"/>
        </linearGradient>
      </defs>`;
  }

  function faceBody() {
    let ticks = '';
    for (let i = 0; i < 60; i++) {
      const a = i * 6 * Math.PI / 180, major = i % 5 === 0;
      const r1 = major ? 73 : 79, r2 = 82;
      ticks += `<line class="ck-tick" x1="${(100+r1*Math.sin(a)).toFixed(1)}" y1="${(100-r1*Math.cos(a)).toFixed(1)}"
        x2="${(100+r2*Math.sin(a)).toFixed(1)}" y2="${(100-r2*Math.cos(a)).toFixed(1)}"
        stroke-width="${major?3:1.4}" stroke-linecap="round" opacity="${major?0.9:0.3}"/>`;
    }
    let nums = '';
    for (let h = 1; h <= 12; h++) {
      const a = h * 30 * Math.PI / 180;
      nums += `<text class="ck-num" x="${(100+61*Math.sin(a)).toFixed(1)}" y="${(100-61*Math.cos(a)+5.2).toFixed(1)}">${h}</text>`;
    }
    return `
      <circle cx="100" cy="100" r="95" fill="url(#ck-rim)"/>
      <circle cx="100" cy="100" r="87" fill="url(#ck-face)"/>
      ${ticks}${nums}`;
  }

  /* Statisk klocka (fråge- och inställningsvyer).
     KLOCKLAGEN: timvisare blå (tjock/kort), minutvisare röd (tunn/lång). */
  function drawAnalogClock(h, m) {
    const hourAngle   = ((h % 12) * 30 + m * 0.5 - 90) * Math.PI / 180;
    const minuteAngle = (m * 6 - 90) * Math.PI / 180;
    const hx = 100 + 43 * Math.cos(hourAngle),   hy = 100 + 43 * Math.sin(hourAngle);
    const mx = 100 + 63 * Math.cos(minuteAngle), my = 100 + 63 * Math.sin(minuteAngle);

    return `
      <svg class="ck-qsvg" viewBox="0 0 200 200" role="img"
        aria-label="Analog klocka – blå timvisare, röd minutvisare">
        ${faceDefs()}${faceBody()}
        <line class="ck-hand-h" x1="100" y1="100" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}"
          stroke-width="8" stroke-linecap="round"/>
        <line class="ck-hand-m" x1="100" y1="100" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}"
          stroke-width="4.5" stroke-linecap="round"/>
        <circle class="ck-cap" cx="100" cy="100" r="6.5"/>
      </svg>
    `;
  }

  function drawSettingClock(h, m) {
    return drawAnalogClock(h, m);
  }

  function drawDigitalSetting(h, m) {
    return `
      <div id="digital-setting-display" class="ck-digibox num">${colorizeTimeText(`${p2(h)}:${p2(m)}`)}</div>
    `;
  }

  /* ── Generera svarsalternativ ─────────────────────── */
  function generateTimeOptions(h, m, correctText) {
    const opts = [correctText];
    const minutes = [0,5,10,15,20,25,30,35,40,45,50,55];
    let attempts = 0;
    while (opts.length < 4 && attempts < 30) {
      attempts++;
      const rh = Math.floor(Math.random() * 12) + 1;
      const rm = minutes[Math.floor(Math.random() * minutes.length)];
      const txt = MP.timeToSwedish(rh, rm);
      if (!opts.includes(txt)) opts.push(txt);
    }
    return opts.sort(() => Math.random() - 0.5);
  }

  /* ── Färgkoda tidstext pedagogiskt (KLOCKLAGEN) ─────
     Timord blå (.t-h) · minutord röda (.t-m, inkl "halv") ·
     bindeord/kolon mörka (.t-k). Klasserna i clock-css. */
  function colorizeTimeText(text) {
    const b = s => `<span class="t-h">${s}</span>`;
    const r = s => `<span class="t-m">${s}</span>`;
    const k = s => `<span class="t-k">${s}</span>`;

    // Digital: "23:45" → timme blå, kolon mörk, minut röd
    if (/^\d{2}:\d{2}$/.test(text)) {
      const [hh, mm] = text.split(':');
      return b(hh) + k(':') + r(mm);
    }
    // "halv X" (30 min) → "halv" röd (minutbeskrivning), timme blå
    let match = text.match(/^halv (.+)$/);
    if (match) return r('halv ') + b(match[1]);

    // "X över halv Y" → minut röd, "över" mörk, "halv" röd, timme blå
    match = text.match(/^(.+?) över halv (.+)$/);
    if (match) return r(match[1]) + k(' över ') + r('halv ') + b(match[2]);

    // "X i halv Y" → minut röd, "i" mörk, "halv" röd, timme blå
    match = text.match(/^(.+?) i halv (.+)$/);
    if (match) return r(match[1]) + k(' i ') + r('halv ') + b(match[2]);

    // "X över Y"
    match = text.match(/^(.+?) över (.+)$/);
    if (match) return r(match[1]) + k(' över ') + b(match[2]);

    // "X i Y"
    match = text.match(/^(.+?) i (.+)$/);
    if (match) return r(match[1]) + k(' i ') + b(match[2]);

    // Bara timme (m=0); tål även äldre "tolv (tolv)"-format
    const hourOnly = text.replace(/\s*\(.*\)$/, '');
    return b(hourOnly);
  }

  /* ── Publik API ────────────────────────────────────── */
  return {
    init,
    renderPractice,
    adjustTime,
    resetTime,
    randomTime,
    showTestSetup,
    startTestWithType,
    showHistory,

    // Dynamiska handlers
    _handleReadChoice: null,
    _adjustSetting: null,
    _lockSetting: null,
  };
})();
