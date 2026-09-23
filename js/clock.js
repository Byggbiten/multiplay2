/* ============================================================
   MULTIPLAY – Klockan (v64: lektioner med tre representationer, räkning och försök)
   Renderar i #clock-root. Logiken (stegen, felalternativen, visarna,
   lektionerna och förklaringarna) ligger i js/clock-logic.js; lådorna,
   nötloopen och kvittot delas med Gångertabellen via js/shared.js.
   Hemvyn: Klockans trappa – sju steg med medalj, exempel och Kan-stapel.
   Under trappan: Lekklockan, Klocktest och Statistik och logg.
   Ett steg: startskärm (medaljerna, varven) → Lär dig (lektionen) eller
   Öva (passet: Läs klockan / Ställ klockan, nötloopen, förklaring vid fel)
   → kvittot med "Sett av en vuxen".
   Design: designsystem v25 – drömhimmel via #clock-root.
   KLOCKLAGEN (designlag 3): timvisare BLÅ --time-h, minutvisare
   RÖD --time-m, digital tid blå/mörk/röd, tidstext färgkodad.
   ============================================================ */
'use strict';

const ClockGame = (() => {

  const SH = (typeof MP !== 'undefined' && MP) || require('./shared.js');
  const CL = (typeof ClockLogic !== 'undefined' && ClockLogic) || require('./clock-logic.js');
  const SP = SH.spaced;

  /* ── Tillstånd ─────────────────────────────────────── */
  let profile   = null;
  let practiceT = CL.toTot(12, 0);   // lekklockan (minuter sedan midnatt)
  let playMap   = false;             // lekklockans minutkarta
  let clockType = 'analog';          // klocktestet: 'analog' | 'digital'

  /* ── Lagring (rensas i Store.deleteProfile) ────────── */
  const LOG_KEY = id => `clock_log_${id}`;
  const BOX_KEY = id => `clock_boxes_${id}`;     // lådorna per steg och tid
  const OVP_KEY = id => `clock_ovpass_${id}`;    // passets varv
  function readJSON(key){ try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; } }
  function writeJSON(key, v){ try { return SH.safeSetItem(key, JSON.stringify(v)); } catch (_) { return false; } }
  const sessionLog = () => SH.createLog(LOG_KEY(profile.id), 40);
  const getLog = () => sessionLog().get();
  const addLog = entry => sessionLog().add(entry);
  function updateLogEntry(id, patch){
    try {
      const log = getLog(), e = log.find(x => x.id === id);
      if (!e) return false;
      Object.assign(e, patch);
      return SH.safeSetItem(LOG_KEY(profile.id), JSON.stringify(log));
    } catch (_) { return false; }
  }

  let todayOverride = null;                         // datumkrok: _test.setToday('2026-10-01')
  const today = () => todayOverride || SP.fmtDay(new Date());
  const loadBoxes = () => CL.validBoxes(profile && readJSON(BOX_KEY(profile.id)));
  const saveBoxes = b => { if (profile) writeJSON(BOX_KEY(profile.id), { v:1, steps:b }); };
  const loadCounts = () => CL.countsFrom(profile && readJSON(OVP_KEY(profile.id)));
  const saveCounts = c => { if (profile) writeJSON(OVP_KEY(profile.id), { counts:CL.normCounts(c) }); };

  /* Varje besvarad fråga i passet går hit (bara första försöket, se nötloopen).
     Blir steget guld: Capy-händelsen 'klocksteg' (köas, en gång per steg). */
  function recordAnswer(stepId, key, ok){
    const b = loadBoxes();
    try { CL.recordBox(b, stepId, key, ok, today()); saveBoxes(b); } catch (_) { /* lådorna får aldrig stoppa ett svar */ }
    try {
      if (ok && typeof window !== 'undefined' && window.Capy && profile && CL.stepMedal(b, stepId, today()).medal === 'guld'){
        Capy.award(profile, { type:'klocksteg', data:{ step:stepId, name:CL.stepById(stepId).short } });
      }
    } catch (_) { /* samlingen får aldrig stoppa ett svar */ }
  }

  const snd = t => { try { App.Sound.play(t); } catch (_) {} };
  const confetti = n => { try { App.Confetti.burst(n); } catch (_) {} };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  /* Reducerad rörelse: animationerna hoppar direkt till slutläget */
  const RM = () => { try { return !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (_) { return false; } };
  const pause = ms => RM() ? Promise.resolve() : wait(ms);
  const LEAD = 300;                                  // texten först, rörelsen sen
  const p2 = n => String(n).padStart(2, '0');
  const $ = id => document.getElementById('ck-' + id);
  const root = () => document.getElementById('clock-root');
  let token = 0;                                     // byts vid varje vy: väntande steg avbryts
  let busy = false;

  /* ══════════════════════════════════════════════════════
     MODULSPECIFIK CSS — EN injektion (id="clock-css")
  ══════════════════════════════════════════════════════ */
  const CLOCK_CSS = `
    #clock-root .wrap{gap:12px}
    #clock-root .hdr-spacer{width:52px;flex-shrink:0;display:inline-block}
    #clock-root .app-header .header-title{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

    /* Tidsfärger (KLOCKLAGEN – designlag 3) */
    #clock-root .t-h,.ck-modal .t-h{color:var(--time-h);font-weight:900}
    #clock-root .t-m,.ck-modal .t-m{color:var(--time-m);font-weight:900}
    #clock-root .t-k{color:var(--time-k);font-weight:800}
    #clock-root .t-p{color:var(--ink-soft);font-weight:800}

    /* Urtavlans SVG-delar */
    #clock-root .ck-tick{stroke:var(--deep)}
    #clock-root .ck-num{fill:var(--time-h);font-family:var(--font-head);font-weight:800;font-size:15px;text-anchor:middle;transition:fill .3s,font-size .3s}
    #clock-root .ck-num.lit{fill:#1d4ed8;font-size:17.5px}
    #clock-root .ck-num.glow{fill:#1d4ed8;font-size:21px}
    #clock-root .ck-hand-h{stroke:var(--time-h)}
    #clock-root .ck-hand-m{stroke:var(--time-m)}
    #clock-root .ck-cap{fill:var(--accent-2);stroke:#fff;stroke-width:2.5}
    #clock-root .ckv{touch-action:none;user-select:none;-webkit-user-select:none;display:block}
    #clock-root .ckv .hand .vis{transition:opacity .3s}
    #clock-root .ckv .hand .glw{opacity:0;transition:opacity .3s}
    #clock-root .ckv .hand .hit{stroke:transparent;stroke-width:26;stroke-linecap:round}
    #clock-root .ckv.hl-m .hand-m .glw,#clock-root .ckv.hl-h .hand-h .glw,#clock-root .ckv.hl-both .hand .glw{opacity:.32}
    #clock-root .ckv.hl-m .hand-h .vis{opacity:.28}
    #clock-root .ckv.hl-h .hand-m .vis{opacity:.28}
    #clock-root .ckv.drag{cursor:grab}
    #clock-root .ckv.drag-m .hand-m .glw,#clock-root .ckv.drag-h .hand-h .glw{opacity:.32}
    #clock-root .ckv .ck-map{transition:opacity .45s var(--smooth)}
    #clock-root .ckv .mn{fill:var(--time-m);font-family:var(--font-head);font-weight:800;font-size:12.5px;text-anchor:middle;opacity:0;transition:opacity .3s}
    #clock-root .ckv .ck-map.nums .mn{opacity:1}
    #clock-root .ckv .ck-map .mn.on{opacity:1}
    #clock-root .ckv .zl{font-family:var(--font-head);font-weight:800;font-size:14px;text-anchor:middle}
    #clock-root .ckv .r24{fill:var(--time-h);font-family:var(--font-head);font-weight:800;font-size:13px;text-anchor:middle;opacity:0;transition:opacity .3s,font-size .3s}
    #clock-root .ckv.r24on .r24{opacity:.22}
    #clock-root .ckv.r24on .r24.lit{opacity:1}
    #clock-root .ckv.r24on .r24.hot{opacity:1;fill:#1d4ed8;font-size:17px}
    #clock-root .ckv.nomin .hand-m{opacity:0}
    #clock-root .ckv .hand-m{transition:opacity .2s}
    #clock-root .ckv .seg{animation:ck-fadein .22s ease-out}
    #clock-root .ckv .seg-gone{fill:rgba(239,68,68,.2)}
    #clock-root .ckv .seg-left{fill:rgba(245,158,11,.36)}
    #clock-root .ckv .lap{fill:none;stroke:#facc15;stroke-width:6;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;animation:ck-draw .9s ease-out forwards}
    #clock-root .ckv .ck-bed{animation:ck-pop .45s var(--spring)}
    #clock-root .ckv .ck-bed text{font-family:var(--font-head);font-weight:800;font-size:10.5px;text-anchor:middle;fill:var(--deep)}

    /* ── Trappan, startskärmen, lektionen och passet (v63) ── */
    #clock-root .ck2{--kan:#2fbf68;--due:#bfead0;--ovar:#fbbf24;max-width:440px;gap:8px}
    #clock-root .ck2 .card{background:var(--glass-strong);border-radius:var(--radius-lg);border:1px solid var(--glass-line);box-shadow:var(--shadow-panel);padding:10px 12px}
    #clock-root .ck2 .card:hover{box-shadow:var(--shadow-panel)}
    #clock-root .ck2 .btn{width:100%;min-height:52px;padding:0 16px}
    #clock-root .ck2 .btn:disabled{opacity:.42;box-shadow:none}
    #clock-root .ck2 .btn-primary:hover,#clock-root .ck2 .btn-secondary:hover{transform:none}
    #clock-root .ck2 .grow{flex:1;min-height:0}
    #clock-root .ck2 svg.i{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
    #clock-root .ck2 .btn-pill{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 14px;border-radius:999px;background:var(--glass-strong);
      border:1.5px solid color-mix(in srgb,var(--accent) 26%,transparent);color:var(--deep);font-weight:800;font-size:14px;white-space:nowrap}
    #clock-root .ck2 .tb-bar{display:block;height:4px;border-radius:999px;background:rgba(30,58,138,.1);overflow:hidden}
    #clock-root .ck2 .tb-bar i{display:block;height:100%;border-radius:inherit;background:var(--kan)}
    #clock-root .ck2 svg.md{display:block;width:100%;height:100%}
    #clock-root .ck2 .mdue{position:absolute;top:-3px;right:-4px;width:10px;height:10px;border-radius:50%;background:var(--due);box-shadow:0 0 0 1.5px #fff,inset 0 0 0 1.5px rgba(47,191,104,.5)}

    /* Hemvyn: Klockans trappa */
    #clock-root .ck-stairs{display:flex;flex-direction:column;gap:7px;flex:1 1 auto;min-height:0}
    #clock-root .ck-st-head{display:flex;align-items:center;gap:10px;min-height:30px}
    #clock-root .ck-st-head b{font-family:var(--font-head);font-weight:800;font-size:19px;color:var(--deep);line-height:1.1}
    #clock-root .ck-st-head svg{width:26px;height:26px;color:var(--accent)}
    #clock-root .ck-step{display:flex;align-items:center;gap:10px;flex:1 1 0;min-height:52px;max-height:80px;padding:6px 8px 6px 6px;border-radius:16px;background:#fff;text-align:left;width:100%;
      border:1.5px solid color-mix(in srgb,var(--accent) 18%,transparent);color:var(--deep);transition:transform .2s var(--spring)}
    #clock-root .ck-step:active{transform:scale(.97)}
    #clock-root .ck-sn{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;background:var(--tint);color:var(--accent);font-family:var(--font-head);font-weight:800;font-size:17px}
    #clock-root .ck-stx{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;line-height:1.1}
    #clock-root .ck-stx b{font-family:var(--font-head);font-weight:800;font-size:16.5px}
    #clock-root .ck-stx small{font-size:12.5px;font-weight:800;color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #clock-root .ck-stx .tb-bar{margin-top:2px;max-width:170px}
    #clock-root .ck-smd{position:relative;width:30px;height:30px;flex-shrink:0}
    #clock-root .ck-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;flex-shrink:0}
    #clock-root .ck-tile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:86px;padding:8px 4px;border-radius:20px;
      background:var(--glass-strong);border:1.5px solid color-mix(in srgb,var(--accent) 20%,transparent);box-shadow:var(--shadow-panel);color:var(--deep);text-align:center;transition:transform .25s var(--spring)}
    #clock-root .ck-tile:active{transform:scale(.96)}
    #clock-root .ck-tile .ic{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;background:var(--tint);color:var(--accent);margin-bottom:3px}
    #clock-root .ck-tile b{font-family:var(--font-head);font-weight:800;font-size:15px;line-height:1.08}
    #clock-root .ck-tile small{font-size:11.5px;font-weight:700;color:var(--ink-soft)}

    /* Startskärmen för ett steg */
    #clock-root .ck-shead{display:flex;align-items:center;gap:12px}
    #clock-root .ck-smd-l{position:relative;width:54px;height:54px;flex-shrink:0}
    #clock-root .ck-smd-l .mdue{width:14px;height:14px;top:-2px;right:-3px}
    #clock-root .ck-sht{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;line-height:1.1}
    #clock-root .ck-sht b{font-family:var(--font-head);font-weight:800;font-size:27px;color:var(--deep)}
    #clock-root .ck-sht span{font-weight:800;font-size:13.5px;color:var(--ink-soft)}
    #clock-root .ck-sht .tb-bar{width:140px;height:6px;margin-top:3px}
    #clock-root .ck-mini{width:64px;height:64px;flex-shrink:0;display:grid;place-items:center}
    #clock-root .ck-mini svg{width:64px;height:64px}
    #clock-root .ck-mini .ck-minidigi{font-family:var(--font-head);font-weight:800;font-size:19px;padding:6px 8px;border-radius:12px;background:#fff;border:1.5px solid rgba(47,111,228,.18)}
    #clock-root .ck-medals{display:flex;flex-direction:column;gap:2px}
    #clock-root .ck-md{display:flex;align-items:center;gap:10px;min-height:34px;font-size:14px;font-weight:700;color:var(--ink);transition:opacity .2s}
    #clock-root .ck-md b{font-weight:900}
    #clock-root .ck-md .ck-mdi{width:26px;height:26px;flex-shrink:0}
    #clock-root .ck-md.off{opacity:.45}
    #clock-root .ck-md .ck-mok{margin-left:auto;width:22px;height:22px;color:#16a34a;visibility:hidden}
    #clock-root .ck-md:not(.off) .ck-mok{visibility:visible}
    #clock-root .ck-md .ck-mok svg.i{width:20px;height:20px;stroke-width:3}
    #clock-root .ck-md.fill{color:var(--ink-soft);font-weight:800;font-size:13px}
    #clock-root .ck-md.fill i{display:block;width:12px;height:12px;border-radius:50%;margin:0 7px;background:var(--due);box-shadow:inset 0 0 0 1.5px rgba(47,191,104,.5)}
    #clock-root .ck-rounds{display:flex;flex-direction:column;gap:6px}
    #clock-root .ck-rhead{display:flex;align-items:center;justify-content:space-between;gap:8px}
    #clock-root .ck-rhead b{font-family:var(--font-head);font-weight:800;font-size:18px;color:var(--deep)}
    #clock-root .ck-rlist{display:grid;grid-template-columns:1fr 1fr;gap:4px 10px}
    #clock-root .ck-r{display:flex;align-items:center;gap:8px;min-height:30px;font-size:14px;font-weight:800;color:var(--ink);white-space:nowrap;overflow:hidden}
    #clock-root .ck-r em{font-style:normal;color:var(--ink-soft);min-width:14px}
    #clock-root .ck-sum{font-size:13px;font-weight:800;color:var(--ink-soft)}
    #clock-root .ri{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;flex-shrink:0}
    #clock-root .ri svg.i{width:16px;height:16px}
    #clock-root .ri-read{background:#f3e8ff;color:#7e22ce}
    #clock-root .ri-set{background:#ffedd5;color:#c2410c}
    #clock-root .ck-duo2{display:grid;grid-template-columns:1fr 1.25fr;gap:8px;flex-shrink:0}
    #clock-root .ck-duo2 .btn{min-height:58px;font-size:17px}

    /* Ändra varv */
    #clock-root .ck-su{display:flex;flex-direction:column;gap:8px}
    #clock-root .ck-presets{display:flex;gap:2px;background:rgba(30,58,138,.07);border-radius:999px;padding:3px}
    #clock-root .ck-presets button{flex:1;min-height:44px;padding:0 10px;border-radius:999px;font-weight:800;font-size:14px;color:var(--ink-soft)}
    #clock-root .ck-presets button.on{background:#fff;color:var(--deep);box-shadow:0 2px 8px rgba(30,58,138,.14)}
    #clock-root .ck-rrow{display:flex;align-items:center;gap:10px;min-height:56px}
    #clock-root .ck-rrow .ri{width:36px;height:36px;border-radius:12px}
    #clock-root .ck-rrow .ri svg.i{width:20px;height:20px}
    #clock-root .ck-rrow .rt{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15}
    #clock-root .ck-rrow .rt b{font-weight:900;font-size:15px;color:var(--ink)}
    #clock-root .ck-rrow .rt small{font-size:12px;font-weight:700;color:var(--ink-soft)}
    #clock-root .ck-rrow.zero .rt,#clock-root .ck-rrow.zero .ri{opacity:.5}
    #clock-root .ck-stp{width:44px;height:44px;border-radius:50%;background:var(--glass-strong);border:1.5px solid color-mix(in srgb,var(--accent) 24%,transparent);display:grid;place-items:center;color:var(--deep)}
    #clock-root .ck-stp:disabled{opacity:.3}
    #clock-root .ck-rn{width:22px;text-align:center;font-family:var(--font-head);font-weight:800;font-size:22px;color:var(--deep)}
    #clock-root .ck-susum{text-align:center;font-weight:800;font-size:15px;color:var(--deep);min-height:22px}

    /* Klockans scen (lektion och pass) */
    #clock-root .ck-stage{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 10px;position:relative}
    #clock-root .ck-stage.ok{box-shadow:0 0 0 3px #86efac,var(--shadow-panel)}
    #clock-root .ck-qtop{width:100%;display:flex;align-items:center;justify-content:space-between;min-height:36px;flex-shrink:0}
    #clock-root .qtag{height:26px;padding:0 11px;border-radius:999px;background:var(--tint);color:var(--accent);font-size:12.5px;font-weight:900;display:inline-flex;align-items:center;visibility:hidden}
    #clock-root .qtag.on{visibility:visible}
    #clock-root .ck-help{display:inline-flex;align-items:center;gap:6px;min-height:44px;margin:-4px -4px -4px 0;padding:0 12px;border-radius:999px;font-weight:800;font-size:13.5px;color:var(--accent);background:var(--tint)}
    #clock-root .ck-help svg.i{width:17px;height:17px}
    #clock-root .ck-help.on{background:var(--accent);color:#fff}
    #clock-root .ck-prompt{flex-shrink:0;text-align:center;font-family:var(--font-head);font-weight:800;color:var(--deep);font-size:17px;line-height:1.2}
    #clock-root .ck-prompt .big{display:block;font-size:25px;margin-top:2px}
    #clock-root .ck-qclock{flex:1;min-height:0;width:100%;display:flex;justify-content:center;align-items:center}
    #clock-root .ck-qclock .ckv{height:100%;max-width:100%;filter:drop-shadow(0 10px 22px rgba(47,111,228,.2))}
    #clock-root .ck-qclock.two{gap:6px;align-items:stretch}
    #clock-root .ck-qclock.two .ck-half{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px}
    #clock-root .ck-qclock.two .ck-half .ckv{flex:1;min-height:0;width:100%}
    #clock-root .ck-qclock.two small{font-size:12px;font-weight:900;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em}
    #clock-root .ck-qclock.two .ck-hw{font-family:var(--font-head);font-weight:800;font-size:15px;text-align:center;line-height:1.15}
    #clock-root .ck-hidden{visibility:hidden}
    #clock-root .ck-digi2{font-family:var(--font-head);font-weight:800;font-size:46px;letter-spacing:2px;line-height:1;padding:8px 22px;background:#fff;border:2px solid rgba(47,111,228,.18);border-radius:20px;box-shadow:var(--shadow-panel);flex-shrink:0}
    #clock-root .ck-aux{flex-shrink:0;min-height:30px;display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;font-family:var(--font-head);font-weight:800;font-size:19px;color:var(--deep);text-align:center}
    #clock-root .ck-aux .digi{font-size:24px;letter-spacing:1px}
    #clock-root .ck-chip{display:inline-flex;align-items:center;height:28px;padding:0 11px;border-radius:999px;font-size:14.5px;font-weight:800;color:#fff;background:var(--time-m);animation:ck-pop .45s var(--spring)}
    #clock-root .ck-chip.h{background:var(--time-h)}
    #clock-root .ck-chip.tot{background:var(--deep)}
    #clock-root .ck-lrow{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:26px;flex-shrink:0}
    #clock-root .ck-ltag{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 10px;border-radius:999px;background:var(--tint);color:var(--accent);font-size:12.5px;font-weight:900}
    #clock-root .ck-ltag svg.i{width:15px;height:15px}
    #clock-root .ck-ldots{display:flex;justify-content:center;gap:6px;height:14px;align-items:center;flex-shrink:0}
    #clock-root .ck-ldots i{width:8px;height:8px;border-radius:50%;background:rgba(30,58,138,.16);transition:background-color .3s,transform .3s}
    #clock-root .ck-ldots i.done{background:var(--accent-light)}
    #clock-root .ck-ldots i.cur{background:var(--accent);transform:scale(1.35)}

    /* Svarsknappar och ställkontroller */
    #clock-root .ck-ctrl{flex-shrink:0;transition:opacity .25s}
    #clock-root .ck-opts{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    #clock-root .ck-opts.one{grid-template-columns:1fr;gap:6px}
    #clock-root .ck-opt{min-height:60px;padding:6px 8px;border-radius:18px;font-family:var(--font-head);font-weight:800;font-size:17px;line-height:1.15;background:var(--glass-strong);color:var(--deep);
      border:2px solid color-mix(in srgb,var(--accent) 22%,transparent);box-shadow:var(--shadow-panel);transition:transform .2s var(--spring),background-color .25s,border-color .25s}
    #clock-root .ck-opts.one .ck-opt{min-height:46px;font-size:16px}
    #clock-root .ck-opt:active{transform:scale(.96)}
    #clock-root .ck-opt.ok{background:#dcfce7;border-color:#22c55e}
    #clock-root .ck-opt.bad{background:#fee2e2;border-color:#ef4444}
    #clock-root .ck-opt:disabled{cursor:default}
    #clock-root .ck-setrow{display:flex;justify-content:space-between;gap:8px}
    #clock-root .ck-setrow .grp{flex:1;display:flex;align-items:center;justify-content:space-between;gap:4px;padding:3px;border-radius:999px;background:var(--glass-strong);border:1px solid var(--glass-line);box-shadow:var(--shadow-panel)}
    #clock-root .ck-setrow .grp b{font-size:13.5px;font-weight:900}
    #clock-root .ck-setrow .grp b.lab-h{color:var(--time-h)}
    #clock-root .ck-setrow .grp b.lab-m{color:var(--time-m)}
    #clock-root .ck-setrow .ck-stp{width:44px;height:44px}
    #clock-root .shake{animation:ck-shake .4s ease-in-out}

    /* Pratbubblan (fast höjd) och knappraden */
    #clock-root .ck2 .bubble{flex-shrink:0;display:flex}
    #clock-root .ck2 .b92{height:92px}
    #clock-root .ck2 .b86{height:86px}
    #clock-root .ck2 .thought{flex:1;background:#fff;border-radius:var(--radius-md);padding:8px 14px;box-shadow:var(--shadow-panel);font-weight:800;color:var(--ink);
      font-size:15.5px;line-height:1.35;border:2px solid color-mix(in srgb,var(--accent) 18%,transparent);display:flex;flex-direction:column;justify-content:center;gap:2px;overflow:hidden}
    #clock-root .ck2 .thought.pop{animation:ck-bubblein .3s var(--spring)}
    #clock-root .ck2 .thought .sm{font-size:13px;color:#64748b}
    #clock-root .ck2 .slot{height:52px;flex-shrink:0;display:flex;gap:8px}
    #clock-root .ck2 .slot .duo{display:none;gap:8px;width:100%}
    #clock-root .ck2 .slot.duoing .duo{display:flex}
    #clock-root .ck2 .slot.duoing > .btn{display:none}
    #clock-root .ck2 .slot .duo .btn{flex:1;padding:0 10px;font-size:15px}

    /* Passets spår */
    #clock-root .ck2 .track{min-height:54px;flex-shrink:0;padding:8px 16px;display:flex;flex-direction:column;justify-content:center;gap:7px}
    #clock-root .ck2 .trtop{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-weight:800;font-size:13px;color:var(--ink-soft);white-space:nowrap}
    #clock-root .ck2 .trtop b{font-family:var(--font-head);font-size:18px;color:var(--deep)}
    #clock-root .ck2 .rps{display:flex;gap:5px;align-items:center;flex-shrink:0}
    #clock-root .ck2 .rp{width:9px;height:9px;border-radius:50%;background:rgba(30,58,138,.16)}
    #clock-root .ck2 .rp.ok{background:var(--kan)}
    #clock-root .ck2 .rp.cur{background:var(--accent);box-shadow:0 0 0 2px #fff,0 0 0 3.5px var(--accent)}
    #clock-root .ck2 .bar{position:relative;height:10px;flex-shrink:0;border-radius:999px;background:rgba(30,58,138,.12)}
    #clock-root .ck2 .bar .fill{position:absolute;inset:0;border-radius:inherit;background:linear-gradient(90deg,var(--accent),var(--accent-light));transform-origin:left center;transform:scaleX(0);transition:transform .45s var(--smooth)}
    #clock-root .ck-between{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center}
    #clock-root .ck-between .okc{width:64px;height:64px;color:var(--kan)}
    #clock-root .ck-between .okc svg{width:64px;height:64px;stroke-width:3}
    #clock-root .ck-between b{font-family:var(--font-head);font-weight:800;font-size:30px;color:var(--deep)}
    #clock-root .ck-between span{font-weight:800;font-size:16px;color:var(--ink-soft)}
    #clock-root .ck-rl{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}
    #clock-root .ck-rl span{display:flex;align-items:center;gap:8px;min-height:44px;padding:0 12px;border-radius:14px;background:var(--glass-strong);border:1.5px solid color-mix(in srgb,var(--accent) 16%,transparent);font-weight:800;font-size:13.5px;color:var(--ink-soft);white-space:nowrap}
    #clock-root .ck-rl span.ok{background:#dcfce7;border-color:#86efac;color:#15803d}
    #clock-root .ck-rl span.next{border-color:var(--accent);color:var(--deep)}

    /* Du är klar! – kvittot */
    #clock-root .dn-head{display:flex;flex-direction:column;align-items:center;text-align:center;flex-shrink:0}
    #clock-root .dn-star{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#fbbf24,#f59e0b);box-shadow:0 8px 20px rgba(245,158,11,.35);animation:ck-pop .6s var(--spring)}
    #clock-root .dn-star svg.i{width:30px;height:30px;fill:#fff;stroke-width:1.6}
    #clock-root .dn-head h2{font-family:var(--font-head);font-weight:800;font-size:32px;color:var(--deep);line-height:1.05;margin:6px 0 0}
    #clock-root .dn-head p{font-weight:800;font-size:15px;color:var(--ink-soft);margin:3px 0 0;min-height:20px}
    #clock-root .receipt{display:flex;flex-direction:column;gap:6px;flex-shrink:0;background:#fff !important}
    #clock-root .rc-top{display:flex;flex-direction:column;gap:1px;padding-bottom:7px;border-bottom:1.5px dashed rgba(30,58,138,.2)}
    #clock-root .rc-k{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}
    #clock-root .rc-k svg.i{width:16px;height:16px}
    #clock-root .rc-when{font-weight:800;font-size:15px;color:var(--deep)}
    #clock-root .rc-row{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:14px;font-weight:700;color:var(--ink-soft)}
    #clock-root .rc-row b{font-family:var(--font-head);font-weight:800;font-size:17px;color:var(--deep);text-align:right}
    #clock-root .rc-rounds{display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;padding:6px 0;border-top:1.5px dashed rgba(30,58,138,.2);border-bottom:1.5px dashed rgba(30,58,138,.2)}
    #clock-root .rv{display:flex;align-items:center;gap:5px;font-size:13px;font-weight:800;color:var(--ink);white-space:nowrap}
    #clock-root .rv svg.i{width:16px;height:16px;color:#16a34a;stroke-width:3}
    #clock-root .rv em{font-style:normal;color:var(--ink-soft)}
    #clock-root .rc-foot{position:relative;height:66px;display:grid;place-items:center;border:2px dashed rgba(22,163,74,.35);border-radius:14px;margin-top:2px}
    #clock-root .slot-ph{font-size:13px;font-weight:800;color:rgba(21,128,61,.6);transition:opacity .2s}
    #clock-root .slot-ph.off{opacity:0}
    #clock-root .stamp{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;opacity:0}
    #clock-root .stamp.on{animation:ck-stamp .55s cubic-bezier(.2,1.4,.4,1) both}
    #clock-root .st-in{display:flex;align-items:center;gap:8px;padding:6px 14px 6px 10px;border:3px solid #16a34a;border-radius:12px;color:#15803d;transform:rotate(-5deg);background:rgba(240,253,244,.9)}
    #clock-root .st-in svg.i{width:26px;height:26px;stroke-width:3.2}
    #clock-root .st-tx{display:flex;flex-direction:column;align-items:flex-start;line-height:1.15}
    #clock-root .st-in b{font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}
    #clock-root .st-in small{font-size:12px;font-weight:800}
    #clock-root .dn-ask{text-align:center;font-weight:900;font-size:16px;color:var(--deep);margin:0;flex-shrink:0;min-height:22px}
    #clock-root .hold{position:relative;overflow:hidden;min-height:58px;flex-shrink:0;border-radius:999px;border:2px solid #16a34a;background:#fff;color:#15803d;
      font-weight:900;font-size:16px;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
    #clock-root .hold-fill{position:absolute;inset:0;background:linear-gradient(90deg,#bbf7d0,#4ade80);transform:scaleX(0);transform-origin:left center}
    #clock-root .hold.holding .hold-fill{transform:scaleX(1);transition:transform 1.5s linear}
    #clock-root .hold-t{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px}
    #clock-root .hold.done{background:#dcfce7}
    #clock-root .hold:disabled{opacity:1}

    /* Statistik och logg */
    #clock-root .ck-smap{display:flex;flex-direction:column;gap:6px;flex-shrink:0}
    #clock-root .ck-smap .t{font-family:var(--font-head);font-weight:800;font-size:17px;color:var(--deep)}
    #clock-root .ck-grid{display:grid;grid-template-columns:104px repeat(12,1fr);gap:3px;align-items:center}
    #clock-root .ck-grid .gl{font-size:11px;font-weight:800;color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #clock-root .ck-grid .gc{aspect-ratio:1;border-radius:4px;background:#fff;box-shadow:inset 0 0 0 1px rgba(30,58,138,.18)}
    #clock-root .ck-grid .gc.kan{background:var(--kan);box-shadow:none}
    #clock-root .ck-grid .gc.ovar{background:var(--ovar);box-shadow:none}
    #clock-root .ck-grid .gc.due{background:var(--due);box-shadow:inset 0 0 0 1px rgba(47,191,104,.35)}
    #clock-root .ck-legend2{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 12px;font-size:12.5px;font-weight:800;color:var(--ink-soft)}
    #clock-root .ck-legend2 i{display:inline-block;width:12px;height:12px;border-radius:4px;margin-right:5px;vertical-align:-1px}
    #clock-root .ck-legend2 b{color:var(--deep)}
    #clock-root .ck-logcard{flex:1;min-height:0;display:flex;flex-direction:column}
    #clock-root .ck-logcard .history-list{flex:1;min-height:0;overflow-y:auto}
    #clock-root .ck-logcard .history-icon svg{width:22px;height:22px;color:var(--accent)}
    #clock-root .ck-stampmini{display:inline-flex;align-items:center;gap:5px;margin-top:5px;padding:2px 9px 2px 6px;border:2px solid #16a34a;border-radius:8px;color:#15803d;font-size:11.5px;font-weight:900;white-space:nowrap;transform:rotate(-2deg);background:rgba(220,252,231,.6)}
    #clock-root .ck-stampmini svg{width:14px;height:14px}
    #clock-root .c-ok{color:#16a34a}#clock-root .c-mid{color:#d97706}#clock-root .c-err{color:#dc2626}

    /* v64: de tre representationerna, summan i marginalen och betoningen */
    #clock-root .ck2{position:relative}
    #clock-root .ck-trio{flex-shrink:0;width:100%;display:flex;align-items:center;gap:10px;min-height:46px;padding:0 2px}
    #clock-root .ck-trio.off{display:none}
    #clock-root .ck-tdigi{font-family:var(--font-head);font-weight:800;font-size:27px;letter-spacing:1px;line-height:1.1;padding:4px 11px;background:#fff;border:2px solid rgba(47,111,228,.18);border-radius:14px;flex-shrink:0;display:inline-flex;overflow:hidden}
    #clock-root .ck-tdigi .dg{display:inline-block}
    #clock-root .ck-tdigi .dg.flip{animation:ck-flip .34s ease-out}
    #clock-root .ck-twords{flex:1;min-width:0;font-family:var(--font-head);font-weight:800;font-size:19px;line-height:1.2;color:var(--deep)}
    #clock-root .ck-twords.chg{animation:ck-wordin .32s ease-out}
    #clock-root .ck-twords .t-p{font-size:15px}
    #clock-root .ck-trio.nowords .ck-twords{visibility:hidden}
    #clock-root .ck-stage.digiq .ck-qclock{display:none}
    #clock-root .ck-stage.digiq .ck-trio{flex:1;justify-content:center}
    #clock-root .ck-stage.digiq .ck-tdigi{font-size:52px;padding:10px 24px;border-radius:22px}
    #clock-root .ck-stage.digiq .ck-twords{display:none}
    #clock-root .ck-stage.exp .ck-prompt{display:none}
    #clock-root .ck-sumline{display:inline-flex;align-items:baseline;gap:5px;font-family:var(--font-head);font-weight:800;font-size:20px;color:var(--time-k);white-space:nowrap}
    #clock-root .ck-sumline b{color:var(--time-m);font-weight:900}
    #clock-root .ck-sumline.h b{color:var(--time-h)}
    #clock-root .ck-sumline small{font-size:13px;font-weight:900;color:#fff;background:var(--time-m);border-radius:999px;padding:1px 8px;align-self:center}
    #clock-root .ck-sumline.left small{background:#d97706}
    #clock-root .ck-sumline.long{font-size:15px;gap:3px}
    #clock-root .ck-m12 .fly{display:inline-block;animation:ck-flyin .45s var(--spring) .12s both}
    #clock-root .ck-m12 .eq{display:inline-block;animation:ck-fadein .3s ease-out .5s both}
    #clock-root .lk{display:inline-block;border-radius:6px;padding:0 3px;margin:0 -1px;transition:background-color .25s,box-shadow .25s}
    #clock-root .lk.on{background:var(--lk);box-shadow:0 0 0 2px var(--lk-line);animation:ck-lkpulse .7s ease-out}
    #clock-root .lk-i{--lk:#fde68a;--lk-line:#f59e0b}
    #clock-root .lk-o{--lk:#a7f3d0;--lk-line:#10b981}
    #clock-root .lk-h{--lk:#ddd6fe;--lk-line:#8b5cf6}
    #clock-root .ck-bow{position:absolute;left:0;top:0;pointer-events:none;overflow:visible;z-index:6}
    #clock-root .ck-bow path{fill:none;stroke-width:2.5;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;animation:ck-draw .5s ease-out .15s forwards}
    #clock-root .ck2 .thought .lead{font-size:15.5px;font-weight:900;color:#b45309}
    #clock-root .ck2 .thought .lead.good{color:#15803d}
    #clock-root .ck-ldots i.try{border-radius:3px}
    #clock-root #ck-lesson .ck-ltag{white-space:nowrap}
    #clock-root #ck-lesson .ck-ldots{flex:1;justify-content:flex-end;padding-right:4px}
    #clock-root .ck-ctrl:empty{display:none}
    /* Under förklaringen: bara svaret barnet valde (och det rätta när det visats) – klockan får platsen */
    #clock-root .ck-ctrl.exp .ck-opt:not(.bad):not(.ok){display:none}
    #clock-root .ck-ctrl.exp .ck-opts{grid-template-columns:1fr 1fr}
    #clock-root .ck-ctrl.exp .ck-setrow{display:none}
    @keyframes ck-flip{0%{transform:translateY(-40%);opacity:.15}100%{transform:none;opacity:1}}
    @keyframes ck-wordin{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
    @keyframes ck-lkpulse{0%{transform:scale(1)}35%{transform:scale(1.2)}100%{transform:scale(1)}}
    @keyframes ck-fadein{from{opacity:0}to{opacity:1}}
    @keyframes ck-flyin{from{opacity:0;transform:translateX(36px)}to{opacity:1;transform:none}}
    @keyframes ck-draw{to{stroke-dashoffset:0}}

    @keyframes ck-pop{0%{transform:scale(.5);opacity:.2}65%{transform:scale(1.15);opacity:1}100%{transform:scale(1);opacity:1}}
    @keyframes ck-bubblein{from{transform:scale(.9) translateY(4px);opacity:.4}to{transform:scale(1) translateY(0);opacity:1}}
    @keyframes ck-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}50%{transform:translateX(5px)}75%{transform:translateX(-3px)}}
    @keyframes ck-stamp{0%{opacity:0;transform:scale(2.4)}60%{opacity:1;transform:scale(.92)}100%{opacity:1;transform:scale(1)}}

    /* ── Lekklockan och klocktestet ── */
    #clock-root .ck-cols{display:flex;flex-direction:column;gap:10px;flex:1;min-height:0}
    #clock-root .ck-left{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:12px 10px;flex:1;min-height:0}
    #clock-root .ck-left .ck-qclock{flex:1;min-height:0}
    #clock-root .ck-right{display:flex;flex-direction:column;gap:10px;min-height:0}
    #clock-root .ck-periods{display:flex;gap:4px;flex-wrap:nowrap;justify-content:center;flex-shrink:0}
    #clock-root .ck-periods .chip{min-height:30px;font-size:11.5px;padding:4px 8px;cursor:default}
    #clock-root .ck-timepanel{text-align:center;padding:10px 14px}
    #clock-root .ck-digi{font-family:var(--font-head);font-weight:800;font-size:34px;line-height:1.05;letter-spacing:2px}
    #clock-root .ck-svline{font-family:var(--font-head);font-weight:700;font-size:16.5px;color:var(--time-k);line-height:1.25;margin-top:4px}
    #clock-root .ck-spins{padding:4px 13px}
    #clock-root .ck-spinrow{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:5px 0}
    #clock-root .ck-spinrow+.ck-spinrow{border-top:1px solid rgba(109,90,150,.14)}
    #clock-root .ck-spinrow b{font-size:14.5px;display:block}
    #clock-root .ck-spinrow b.lab-h{color:var(--time-h)}
    #clock-root .ck-spinrow b.lab-m{color:var(--time-m)}
    #clock-root .ck-ctrls{display:flex;align-items:center;gap:10px}
    #clock-root .ck-ctrls .icon-btn{width:44px;height:44px;min-height:44px}
    #clock-root .ck-val{font-family:var(--font-head);font-weight:800;font-size:20px;min-width:38px;text-align:center}
    #clock-root .ck-actions{display:flex;gap:10px;align-items:stretch}
    #clock-root .ck-actions .icon-btn{width:48px;height:48px;flex-shrink:0}
    #clock-root .ck-actions .btn{flex:1;min-height:48px;font-size:14.5px}
    #clock-root .header-progress{display:inline-flex;align-items:center;gap:7px;min-height:36px;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.8);border:1.5px solid rgba(47,111,228,.22);box-shadow:var(--shadow-sm);font-weight:900;font-size:12px;color:var(--deep);white-space:nowrap;flex-shrink:0}
    #clock-root .header-progress .progress-bar{width:34px;height:8px;flex:none}
    #clock-root .ck-choice-wrap{align-items:center;gap:clamp(14px,3vh,34px)}
    #clock-root .ck-hero{width:96px;height:96px;color:var(--accent);animation:bounce-in .5s var(--spring)}
    #clock-root .ck-choice-title{font-family:var(--font-head);color:var(--deep);font-size:clamp(21px,3.6vh,34px);text-align:center}
    #clock-root .ck-choice{display:flex;flex-direction:column;gap:clamp(12px,2.2vh,24px);width:100%;max-width:640px}
    #clock-root .ck-choice .game-card-wide{min-height:clamp(86px,14vh,170px);padding:12px 20px}
    #clock-root .ck-choice .ck-gi{width:44px;height:44px;color:var(--accent);flex-shrink:0}
    #clock-root .ck-choice h3{font-size:clamp(19px,3vh,30px)}
    #clock-root .ck-choice p{font-size:clamp(13px,2vh,17px)}
    #clock-root .ck-chev{width:24px;height:24px;margin-left:auto;color:var(--ink-soft);flex-shrink:0}
    #clock-root .ck-quiz{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:clamp(10px,2vh,24px)}
    #clock-root .ck-qpanel{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(8px,1.6vh,18px);padding:12px}
    #clock-root .ck-setctrl .btn{min-height:54px}
    #clock-root .ck-quiz .ck-target{font-size:clamp(19px,3.2vh,30px);padding:6px 16px}
    #clock-root .ck-qlabel{font-family:var(--font-head);font-weight:700;font-size:clamp(17px,2.8vh,27px);color:var(--deep);text-align:center}
    #clock-root .ck-quiz .ck-qclock{flex:0 0 auto}
    #clock-root .ck-quiz .ck-qclock .ckv{width:min(36vh,80vw,440px);height:auto;max-width:100%}
    #clock-root .ck-digibox{font-family:var(--font-head);font-weight:800;font-size:clamp(44px,12vh,120px);letter-spacing:2px;line-height:1.05;padding:clamp(10px,2vh,22px) clamp(24px,5vw,48px);background:rgba(255,255,255,.92);border:2px solid rgba(47,111,228,.18);border-radius:22px;box-shadow:var(--shadow-md)}
    #clock-root .ck-target{font-size:clamp(19px,3.4vh,36px);letter-spacing:0;padding:8px 22px;text-align:center}
    #clock-root .ck-topts{display:flex;flex-direction:column;gap:clamp(9px,1.6vh,16px);width:100%;max-width:520px;margin:0 auto}
    #clock-root .ck-topts .answer-option{min-height:clamp(50px,7vh,96px);font-size:clamp(16px,2.6vh,28px)}
    #clock-root .ck-setctrl{display:flex;flex-direction:column;justify-content:center;gap:clamp(8px,1.6vh,16px);width:100%;max-width:520px;margin:0 auto}
    #clock-root .ck-facit{font-weight:800;font-size:13px;color:#16a34a;text-align:center;margin-bottom:2px}
    #clock-root .ck-result{flex:1;min-height:0;display:flex;flex-direction:column;gap:12px}
    #clock-root .result-pct{font-size:clamp(60px,14vh,140px)}
    #clock-root .ck-detail{flex:1;min-height:0;overflow-y:auto}
    #clock-root .ck-sec{font-size:12px;font-weight:800;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em;margin:8px 0 6px}

    @media (min-width:700px){
      #clock-root .ck2{max-width:520px}
      #clock-root .ck-step{min-height:66px}
    }
    @media (min-width:900px){
      #clock-root .ck-cols{display:grid;grid-template-columns:1.02fr 1fr;align-items:stretch}
      #clock-root .ck-quiz{display:grid;grid-template-columns:1.05fr 1fr;align-items:center;gap:clamp(20px,3vw,44px)}
      #clock-root .ck-result{display:grid;grid-template-columns:1fr 1fr;align-items:stretch;gap:16px}
    }
    @media (max-height:700px){
      #clock-root .ck-step{min-height:48px}
      #clock-root .ck-stx .tb-bar{display:none}
    }
  `;
  const styleTag = () => `<style id="clock-css">${CLOCK_CSS}</style>`;

  /* ══════════════════════════════════════════════════════
     IKONER (SVG, inga emojis)
  ══════════════════════════════════════════════════════ */
  const ICON = {
    minus:'<path d="M6 12h12"/>', plus:'<path d="M12 6v12M6 12h12"/>',
    check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>', next:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    again:'<path d="M4.5 12a7.5 7.5 0 1 1 2.2 5.3M4.5 17.5V12H10"/>', play:'<path d="M8 5.5l11 6.5-11 6.5z"/>',
    bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    grid4:'<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>',
    hand:'<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M12 10.5V4a1.5 1.5 0 0 1 3 0v6.5"/><path d="M15 10.5V6a1.5 1.5 0 0 1 3 0v8a6.5 6.5 0 0 1-6.5 6.5h-.8a6 6 0 0 1-4.6-2.2L3.6 15a1.6 1.6 0 0 1 2.4-2.1L9 15V8a1.5 1.5 0 0 1 3 0"/>',
    drag:'<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M12 10.5V4a1.5 1.5 0 0 1 3 0v6.5"/><path d="M15 10.5V6a1.5 1.5 0 0 1 3 0v8a6.5 6.5 0 0 1-6.5 6.5h-.8a6 6 0 0 1-4.6-2.2L3.6 15a1.6 1.6 0 0 1 2.4-2.1L9 15V8a1.5 1.5 0 0 1 3 0"/>',
    star:'<path d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.2l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    repeat:'<path d="M17 2.5l3.5 3.5L17 9.5"/><path d="M3.5 11.5V10a4 4 0 0 1 4-4h13"/><path d="M7 21.5L3.5 18 7 14.5"/><path d="M20.5 12.5V14a4 4 0 0 1-4 4h-13"/>',
    clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    test:'<rect x="5" y="3.5" width="14" height="17" rx="3"/><path d="M9 8.5h6M9 12h6M9 15.5h3.5"/>',
    stats:'<path d="M5 19v-6M12 19V5.5M19 19v-9"/>',
    map:'<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v2M20.5 12h-2M12 20.5v-2M3.5 12h2"/><path d="M12 12l3.5-3.5"/>',
    dice:'<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none"/>',
    reset:'<path d="M4.5 12a7.5 7.5 0 1 1 2.2 5.3M4.5 17.5V12H10"/>',
    stairs:'<path d="M3.5 20.5h4v-4h4v-4h4v-4h5"/><path d="M3.5 20.5h17"/>',
    digital:'<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M8 10v4M11 10.5h.01M11 13.5h.01M14 10h2v4"/>',
    fwd:'<path d="M9 5l7 7-7 7"/>',
  };
  const BED = '<path d="M3 19V6"/><path d="M3 15h18v4"/><path d="M21 15v-2.5a3 3 0 0 0-3-3h-7V15"/><circle cx="7" cy="11.5" r="2"/>';
  const svg = (k, style = '') => `<svg class="i" viewBox="0 0 24 24"${style ? ` style="${style}"` : ''}>${ICON[k]}</svg>`;
  const icn = k => `<svg class="icn" viewBox="0 0 24 24">${ICON[k]}</svg>`;
  const RICON = { read:'grid4', set:'drag' };
  const MEDAL_BAND = { l:'#93c5fd', r:'#2f6fe4', ring:'rgba(30,58,138,.3)' };   // klockans blå band
  const medalSVG = kind => SH.medalSVG(kind, MEDAL_BAND);
  const MEDAL_NAME = { guld:'Guld', silver:'Silver', brons:'Brons' };

  function headerHtml(title, backAct, opts = {}){
    const right = opts.progress
      ? `<span class="header-progress num" aria-label="Fråga ${opts.progress.n} av ${opts.progress.total}"><span>${opts.progress.n} av ${opts.progress.total}</span><span class="progress-bar"><i style="width:${opts.progress.pct}%"></i></span></span>`
      : `<span class="hdr-spacer"></span>`;
    return `
      <div class="app-header">
        <button class="btn-back" ${backAct.startsWith('ClockGame') || backAct.startsWith('App') ? `onclick="${backAct}"` : `data-act="${backAct}"`}>${opts.backLabel || 'Tillbaka'}</button>
        <span class="header-title">${title}</span>
        ${right}
      </div>`;
  }

  /* ── Färgkoda tidstext pedagogiskt (KLOCKLAGEN) ─────
     Timord blå (.t-h) · minutord röda (.t-m, inkl "halv") ·
     bindeord/kolon mörka (.t-k) · dygnsdelen dämpad (.t-p). */
  function colorizeTimeText(text){
    const b = s => `<span class="t-h">${s}</span>`;
    const r = s => `<span class="t-m">${s}</span>`;
    const k = s => `<span class="t-k">${s}</span>`;
    let per = '';
    const pm = String(text).match(/^(.*?) ((?:mitt )?på (?:natten|morgonen|förmiddagen|eftermiddagen|kvällen|dagen))$/);
    if (pm){ text = pm[1]; per = ` <span class="t-p">${pm[2]}</span>`; }
    if (/^\d{2}:\d{2}$/.test(text)){ const [hh, mm] = text.split(':'); return b(hh) + k(':') + r(mm) + per; }
    let m = text.match(/^halv (.+)$/);                 if (m) return r('halv ') + b(m[1]) + per;
    m = text.match(/^(.+?) över halv (.+)$/);          if (m) return r(m[1]) + k(' över ') + r('halv ') + b(m[2]) + per;
    m = text.match(/^(.+?) i halv (.+)$/);             if (m) return r(m[1]) + k(' i ') + r('halv ') + b(m[2]) + per;
    m = text.match(/^(.+?) över (.+)$/);               if (m) return r(m[1]) + k(' över ') + b(m[2]) + per;
    m = text.match(/^(.+?) i (.+)$/);                  if (m) return r(m[1]) + k(' i ') + b(m[2]) + per;
    return b(text.replace(/\s*\(.*\)$/, '')) + per;
  }
  /* Bubbeltexten, färgkodad som klockan (KLOCKLAGEN): tidsnamnen ("tjugo i åtta":
     minutordet rött, bindeordet mörkt, timordet blått), visarnas namn i sina färger,
     "20 minuter" rött, "12 timmar" blått, timordet efter till/innan/över/är blått,
     digital tid blå:röd. link:[ord i tiden, ord i förklaringen] märks för betoningen:
     förklaringsordet där det först står, tidsordet där det sist står (i tidsnamnet). */
  const NAMES = (() => { const s = new Set(); for (let h = 1; h <= 12; h++) for (let m = 0; m < 60; m += 5){ const w = CL.words(h, m); if (w.includes(' ')) s.add(w); } return [...s].sort((a, b) => b.length - a.length); })();
  const NAME_RE = new RegExp(`(?<!\\p{L})(?:${NAMES.join('|')})(?!\\p{L})`, 'giu');
  const HOURS_W = 'ett|två|tre|fyra|fem|sex|sju|åtta|nio|tio|elva|tolv';
  const wordRe = w => new RegExp(`(?<!\\p{L})${w}(?!\\p{L})`, 'giu');
  const LKW = { i:'lk-i', 'över':'lk-o', halv:'lk-h' };
  function fmtText(text, link){
    text = String(text);
    const n = text.length, cls = Array(n).fill(''), lk = Array(n).fill('');
    const mark = (a, b, c) => { for (let i = a; i < b; i++) if (!cls[i]) cls[i] = c; };
    const each = (re, fn) => { for (const m of text.matchAll(re)) fn(m); };
    let bR = null;
    if (link){
      const m = [...text.matchAll(wordRe(link[1]))][0];
      if (m){ bR = [m.index, m.index + m[0].length]; for (let i = bR[0]; i < bR[1]; i++) lk[i] = 'b'; }
      const as = [...text.matchAll(wordRe(link[0]))].filter(x => !bR || x.index + x[0].length <= bR[0] || x.index >= bR[1]);
      const a = as[as.length - 1];
      if (a) for (let i = a.index; i < a.index + a[0].length; i++) lk[i] = 'a';
    }
    each(/(?<!\d)(\d{2}):(\d{2})(?!\d)/g, m => { mark(m.index, m.index + 2, 't-h'); mark(m.index + 2, m.index + 3, 't-k'); mark(m.index + 3, m.index + 5, 't-m'); });
    each(NAME_RE, m => {
      let off = m.index; const ws = m[0].split(' ');
      ws.forEach((w, j) => { mark(off, off + w.length, j === ws.length - 1 ? 't-h' : /^(i|över)$/i.test(w) ? 't-k' : 't-m'); off += w.length + 1; });
    });
    each(/den långa röda|den röda visaren|röda visaren|den röda|en lång röd/giu, m => mark(m.index, m.index + m[0].length, 't-m'));
    each(/den korta blå|den blå visaren|blå visaren|den blå|en kort blå/giu, m => mark(m.index, m.index + m[0].length, 't-h'));
    each(/(?<!\p{L}|\d)(?:\d+|fem|tio|tjugo) minut(?:er)?(?!\p{L})/giu, m => mark(m.index, m.index + m[0].length, 't-m'));
    each(/(?<!\p{L}|\d)\d+ tim(?:me|mar)(?!\p{L})/giu, m => mark(m.index, m.index + m[0].length, 't-h'));
    each(new RegExp(`(?<=(?:till|innan|över|är|mot|vid) )(?:${HOURS_W})(?!\\p{L})`, 'giu'), m => mark(m.index, m.index + m[0].length, 't-h'));
    each(/(?<!\p{L})(?:halv|kvart)(?!\p{L})/giu, m => mark(m.index, m.index + m[0].length, 't-m'));
    let out = '', i = 0;
    while (i < n){
      let j = i + 1;
      while (j < n && cls[j] === cls[i] && lk[j] === lk[i]) j++;
      let h = SH.escapeHtml(text.slice(i, j));
      if (cls[i]) h = `<span class="${cls[i]}">${h}</span>`;
      if (lk[i]) h = `<span class="lk lk-${lk[i]} ${LKW[link[0]] || ''}">${h}</span>`;
      out += h; i = j;
    }
    return out;
  }
  const tint = t => fmtText(t);

  /* ══════════════════════════════════════════════════════
     URTAVLAN: SVG och styrning
     viewBox: urtavlan i mitten (100,100) med rim r95 och face r87,
     minutkartans ring utanför (r97–128), etiketter i hörnen.
  ══════════════════════════════════════════════════════ */
  const VB = '-38 -36 276 290';
  const VB_TIGHT = '-6 -6 212 212';                 // utan minutkartans ring: större urtavla
  const pt = (r, a) => [100 + r * Math.sin(a * Math.PI / 180), 100 - r * Math.cos(a * Math.PI / 180)];
  const f1 = n => n.toFixed(1);
  function ringPath(r1, r2, a1, a2){
    const large = (a2 - a1) % 360 > 180 ? 1 : 0;
    const [x1, y1] = pt(r2, a1), [x2, y2] = pt(r2, a2), [x3, y3] = pt(r1, a2), [x4, y4] = pt(r1, a1);
    return `M${f1(x1)} ${f1(y1)}A${r2} ${r2} 0 ${large} 1 ${f1(x2)} ${f1(y2)}L${f1(x3)} ${f1(y3)}A${r1} ${r1} 0 ${large} 0 ${f1(x4)} ${f1(y4)}Z`;
  }
  function sectorPath(r, a1, a2){
    if (a2 - a1 >= 359.9) return `M100 ${100 - r}A${r} ${r} 0 1 1 99.9 ${100 - r}Z`;
    const large = a2 - a1 > 180 ? 1 : 0;
    const [x1, y1] = pt(r, a1), [x2, y2] = pt(r, a2);
    return `M100 100L${f1(x1)} ${f1(y1)}A${r} ${r} 0 ${large} 1 ${f1(x2)} ${f1(y2)}Z`;
  }
  const ZONE = {
    over:{ c:'#10b981', o:.2,  lab:'över', lx:206, ly:-8,  lc:'#047857' },
    i:   { c:'#f59e0b', o:.24, lab:'i',    lx:-6,  ly:-8,  lc:'#b45309' },
    runt:{ c:'#8b5cf6', o:.3,  lab:'runt halv', lx:100, ly:248, lc:'#6d28d9' },
  };
  function faceDefs(){
    return `<defs>
        <radialGradient id="ck-face" cx="38%" cy="32%" r="80%"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#e3efff"/></radialGradient>
        <linearGradient id="ck-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7db2f7"/><stop offset="100%" stop-color="#2f6fe4"/></linearGradient>
      </defs>`;
  }
  function faceBody(){
    let ticks = '';
    for (let i = 0; i < 60; i++){
      const a = i * 6 * Math.PI / 180, major = i % 5 === 0, r1 = major ? 73 : 79, r2 = 82;
      ticks += `<line class="ck-tick" x1="${f1(100 + r1 * Math.sin(a))}" y1="${f1(100 - r1 * Math.cos(a))}" x2="${f1(100 + r2 * Math.sin(a))}" y2="${f1(100 - r2 * Math.cos(a))}" stroke-width="${major ? 3 : 1.4}" stroke-linecap="round" opacity="${major ? 0.9 : 0.3}"/>`;
    }
    let nums = '';
    for (let h = 1; h <= 12; h++){
      const a = h * 30 * Math.PI / 180;
      nums += `<text class="ck-num" data-h="${h}" x="${f1(100 + 61 * Math.sin(a))}" y="${f1(100 - 61 * Math.cos(a) + 5.2)}">${h}</text>`;
    }
    return { ticks, nums };
  }
  /* opts: { cls, label } – hela urtavlan med minutkartan, 24-timmarsringen, effekter och visare */
  function clockSVG(opts = {}){
    const { ticks, nums } = faceBody();
    let mn = '', r24 = '';
    for (let k = 0; k < 12; k++){
      const [x, y] = pt(112.5, k * 30);
      mn += `<text class="mn" data-k="${k}" x="${f1(x)}" y="${f1(y + 4.5)}">${k === 0 ? '00' : k * 5}</text>`;
      r24 += `<text class="r24" data-k="${k}" x="${f1(x)}" y="${f1(y + 4.5)}"></text>`;
    }
    const hand = (w, len, width, cls) => `<g class="hand hand-${w}" transform="rotate(0 100 100)">
        <line class="hit" x1="100" y1="112" x2="100" y2="${100 - len - 8}"/>
        <line class="glw" x1="100" y1="100" x2="100" y2="${100 - len}" stroke="${w === 'h' ? '#3b82f6' : '#ef4444'}" stroke-width="${width + 10}" stroke-linecap="round"/>
        <line class="vis ${cls}" x1="100" y1="106" x2="100" y2="${100 - len}" stroke-width="${width}" stroke-linecap="round"/>
      </g>`;
    return `<svg class="ckv ${opts.cls || ''}" viewBox="${opts.tight ? VB_TIGHT : VB}" role="img" aria-label="${opts.label || 'Analog klocka – blå timvisare, röd minutvisare'}">
        ${faceDefs()}
        <g class="ck-map" style="opacity:0"><g class="ck-zones"></g>${mn}</g>
        <g class="ck-r24g">${r24}</g>
        <g class="ck-deco"></g>
        <circle cx="100" cy="100" r="95" fill="url(#ck-rim)"/>
        <circle cx="100" cy="100" r="87" fill="url(#ck-face)"/>
        <g class="ck-fx"></g>
        ${ticks}${nums}
        <g class="ck-arc"></g>
        ${hand('h', 46, 8, 'ck-hand-h')}
        ${hand('m', 70, 4.5, 'ck-hand-m')}
        <circle class="ck-cap" cx="100" cy="100" r="6.5"/>
      </svg>`;
  }
  /* Styrningen för en urtavla i DOM:en */
  function ClockView(svgEl, t0){
    let t = t0 || 0, dragOn = false, which = null, onChange = null, anim = 0, moving = false;
    const hh = svgEl.querySelector('.hand-h'), hm = svgEl.querySelector('.hand-m');
    const map = svgEl.querySelector('.ck-map'), zones = svgEl.querySelector('.ck-zones');
    const fx = svgEl.querySelector('.ck-fx'), arc = svgEl.querySelector('.ck-arc'), deco = svgEl.querySelector('.ck-deco');
    const r24s = [...svgEl.querySelectorAll('.r24')];
    let ringMode = null;
    function draw(){
      const a = CL.handAngles(t);
      hh.setAttribute('transform', `rotate(${a.hour.toFixed(2)} 100 100)`);
      hm.setAttribute('transform', `rotate(${a.minute.toFixed(2)} 100 100)`);
      if (V && V.onDraw) V.onDraw(t, moving);
    }
    let V = null;
    V = {
      el:svgEl,
      onDraw:null,                                   // tiden ändrades (de tre representationerna följer med)
      get t(){ return t; },
      set(tt){ anim++; moving = false; t = tt; draw(); },
      /* Visarna går från nuvarande tid till tt (framåt eller bakåt, i minuter).
         Reducerad rörelse: direkt till slutläget. */
      animateTo(tt, ms = 1200, onFrame = null){
        const my = ++anim, from = t, d = tt - from, t0 = Date.now();
        if (!d || RM()){ t = tt; moving = false; draw(); if (onFrame) onFrame(t); return Promise.resolve(); }
        moving = true;
        return new Promise(res => {
          const tick = () => {
            if (my !== anim){ moving = false; res(); return; }
            const p = Math.min(1, (Date.now() - t0) / ms), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
            if (p < 1){ t = from + d * e; draw(); if (onFrame) onFrame(t); setTimeout(tick, 16); }
            else { t = tt; moving = false; draw(); if (onFrame) onFrame(t); res(); }
          };
          tick();
        });
      },
      hl(w){ svgEl.classList.remove('hl-m', 'hl-h', 'hl-both'); if (w) svgEl.classList.add('hl-' + w); },
      /* Minutkartan: level 0–1, parts ⊆ nums/over/i/runt */
      setMap(level, parts = []){
        map.style.opacity = String(level);
        map.classList.toggle('nums', parts.includes('nums'));
        const runt = parts.includes('runt');
        let z = '';
        if (parts.includes('over')) z += `<path d="${ringPath(97, 128, 0, runt ? 150 : 180)}" fill="${ZONE.over.c}" opacity="${ZONE.over.o}"/><text class="zl" x="${ZONE.over.lx}" y="${ZONE.over.ly}" fill="${ZONE.over.lc}">${ZONE.over.lab}</text>`;
        if (parts.includes('i'))    z += `<path d="${ringPath(97, 128, runt ? 210 : 180, 360)}" fill="${ZONE.i.c}" opacity="${ZONE.i.o}"/><text class="zl" x="${ZONE.i.lx}" y="${ZONE.i.ly}" fill="${ZONE.i.lc}">${ZONE.i.lab}</text>`;
        if (runt)                   z += `<path d="${ringPath(97, 128, 150, 210)}" fill="${ZONE.runt.c}" opacity="${ZONE.runt.o}"/><text class="zl" x="${ZONE.runt.lx}" y="${ZONE.runt.ly}" fill="${ZONE.runt.lc}">${ZONE.runt.lab}</text>`;
        zones.innerHTML = z;
      },
      /* Minuttalen (röda) tänds ett i taget */
      async numsSeq(){
        map.style.opacity = '1';
        const ns = [...map.querySelectorAll('.mn')];
        if (RM()){ map.classList.add('nums'); return; }
        ns.forEach(n => n.classList.remove('on'));
        for (let k = 1; k <= 12; k++){ ns[k % 12].classList.add('on'); await wait(120); }
        map.classList.add('nums');
      },
      /* Timsiffrorna (blå) tänds en i taget */
      async hnumsSeq(){
        const ns = [...svgEl.querySelectorAll('.ck-num')];
        if (RM()){ ns.forEach(n => n.classList.add('lit')); return; }
        for (const n of ns){ n.classList.add('lit'); await wait(100); }
      },
      /* Dygnsringen: 'am' = 1–12, 'pm' = 13–24 (13 vid 1:an), null = av */
      ring24(mode, o = {}){
        ringMode = mode || null;
        svgEl.classList.toggle('r24on', !!mode);
        r24s.forEach(el => {
          const k = +el.dataset.k;
          el.textContent = mode === 'am' ? (k || 12) : mode === 'pm' ? (k ? k + 12 : 24) : '';
          el.classList.remove('hot');
          el.classList.toggle('lit', !!o.all);
        });
      },
      /* Etiketterna tänds när timvisaren har passerat dem */
      ringLit(tt){ if (!ringMode) return; r24s.forEach(el => { const L = +el.textContent; el.classList.toggle('lit', tt >= L * 60 - 0.5); }); },
      async ringSeq(){
        const order = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0].map(k => r24s[k]);
        order.forEach(el => el.classList.remove('lit'));
        for (let i = 0; i < order.length; i++){ order[i].classList.add('lit'); V.glowNum(i + 1); if (!RM()) await wait(110); }
        V.glowNum(null);
      },
      ringHot(hr){ r24s.forEach(el => el.classList.toggle('hot', +el.textContent === hr)); },
      nomin(on){ svgEl.classList.toggle('nomin', !!on); },
      /* Ett femminuterssegment på urtavlan (räkningen) */
      seg(from, to, c){ fx.insertAdjacentHTML('beforeend', `<path class="seg seg-${c}" d="${sectorPath(86, from * 6, to * 6)}"/>`); },
      fill(from, to, c){
        const col = c === 'left' ? 'rgba(245,158,11,.28)' : 'rgba(239,68,68,.13)';
        fx.insertAdjacentHTML('beforeend', `<path class="fl-${c}" d="${sectorPath(86, from * 6, to * 6)}" fill="${col}"/>`);
        if (c === 'gone') [...fx.querySelectorAll('.fl-gone')].slice(0, -1).forEach(p => p.remove());
      },
      quarters(){
        let q = '';
        for (const a of [0, 90, 180, 270]){ const [x, y] = pt(86, a); q += `<line x1="100" y1="100" x2="${f1(x)}" y2="${f1(y)}" stroke="#2f6fe4" stroke-width="2" stroke-dasharray="4 4" opacity=".55"/>`; }
        fx.insertAdjacentHTML('beforeend', q);
      },
      /* Timvisarens väg från timme `from` mot nästa: hela vägen streckad, delen upto fylld */
      arc(from, upto){
        const a1 = from * 30, a2 = a1 + 30, am = a1 + 30 * upto, r = 91;       // på kanten, där den syns bredvid visaren
        const p = (x, y) => { const [p1, q1] = pt(r, x), [p2, q2] = pt(r, y); return `M${f1(p1)} ${f1(q1)}A${r} ${r} 0 0 1 ${f1(p2)} ${f1(q2)}`; };
        const [tx, ty] = pt(r, a2);
        arc.innerHTML = `<path d="${p(a1, a2)}" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity=".9"/>` +
          `<path d="${p(a1, am)}" fill="none" stroke="#facc15" stroke-width="7" stroke-linecap="round"/>` +
          `<circle cx="${f1(tx)}" cy="${f1(ty)}" r="5.5" fill="#ffffff" stroke="#facc15" stroke-width="2.5"/>`;
      },
      /* Ett helt varv: en blå ring ritas runt urtavlan */
      lap(){ arc.innerHTML = '<circle class="lap" cx="100" cy="100" r="91" pathLength="1" transform="rotate(-90 100 100)"/>'; },
      /* Läggdags: en säng vid tiden på dygnsringen */
      bed(at, who){
        const a = CL.handAngles(at).hour, [x, y] = pt(138, a);
        deco.insertAdjacentHTML('beforeend', `<g class="ck-bed" transform="translate(${f1(x)} ${f1(y)})">
            <circle r="13" fill="#fff" stroke="#6366f1" stroke-width="2"/>
            <g transform="translate(-8.5 -8.5) scale(.71)" fill="none" stroke="#4338ca" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${BED}</g>
            <text y="25">${who}</text></g>`);
      },
      glowNum(h){ svgEl.querySelectorAll('.ck-num').forEach(n => n.classList.toggle('glow', +n.dataset.h === h)); },
      clearFx(){
        fx.innerHTML = ''; arc.innerHTML = ''; deco.innerHTML = ''; V.glowNum(null);
        svgEl.querySelectorAll('.ck-num.lit').forEach(n => n.classList.remove('lit'));
        r24s.forEach(el => el.classList.remove('hot'));
      },
      enableDrag(cb){ dragOn = true; onChange = cb; svgEl.classList.add('drag'); },
      disableDrag(){ dragOn = false; which = null; svgEl.classList.remove('drag', 'drag-m', 'drag-h'); },
    };
    draw();
    function local(e){
      const m = svgEl.getScreenCTM();
      if (!m) return null;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      return { dx:p.x - 100, dy:p.y - 100 };
    }
    function moveTo(ang){
      const nt = which === 'h' ? CL.dragHour(CL.norm(Math.round(t)), ang) : CL.dragMinute(CL.norm(Math.round(t)), ang);
      if (nt !== t){ t = nt; draw(); if (onChange) onChange(t); }
    }
    svgEl.addEventListener('pointerdown', e => {
      if (!dragOn) return;
      const p = local(e); if (!p) return;
      const r = Math.hypot(p.dx, p.dy);
      if (r > 140) return;
      anim++;
      which = CL.pickHand(r, CL.angleOf(p.dx, p.dy), t);
      svgEl.classList.add('drag-' + which);
      try { svgEl.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
      moveTo(CL.angleOf(p.dx, p.dy));
    });
    svgEl.addEventListener('pointermove', e => {
      if (!dragOn || !which) return;
      const p = local(e); if (!p) return;
      e.preventDefault();
      moveTo(CL.angleOf(p.dx, p.dy));
    });
    const end = () => { if (which){ svgEl.classList.remove('drag-m', 'drag-h'); which = null; } };
    svgEl.addEventListener('pointerup', end);
    svgEl.addEventListener('pointercancel', end);
    return V;
  }

  /* Liten statisk klocka (startskärmen) */
  function miniClock(h, m){
    const a = CL.handAngles(CL.toTot(h, m));
    const { ticks, nums } = faceBody();
    return `<svg viewBox="0 0 200 200" aria-hidden="true">${faceDefs()}<circle cx="100" cy="100" r="95" fill="url(#ck-rim)"/><circle cx="100" cy="100" r="87" fill="url(#ck-face)"/>${ticks}${nums}
      <line class="ck-hand-h" x1="100" y1="100" x2="100" y2="54" stroke-width="10" stroke-linecap="round" transform="rotate(${a.hour} 100 100)"/>
      <line class="ck-hand-m" x1="100" y1="100" x2="100" y2="30" stroke-width="6" stroke-linecap="round" transform="rotate(${a.minute} 100 100)"/>
      <circle class="ck-cap" cx="100" cy="100" r="8"/></svg>`;
  }

  /* ══════════════════════════════════════════════════════
     INIT OCH KLICKEN
  ══════════════════════════════════════════════════════ */
  function init(p){
    profile = p;
    practiceT = CL.toTot(12, 0);
    const R = root();
    if (R && !R._ckBound){ R.addEventListener('click', onClick); R._ckBound = true; }
    enterHub();
  }
  const leave = () => { token++; busy = false; };
  function onClick(e){
    const b = e.target.closest('[data-act]');
    if (!b || !root().contains(b) || b.disabled) return;
    const a = b.dataset.act, arg = b.dataset.arg;
    const A = {
      exit:() => { leave(); App.goBackToGameSelect(); },
      hub:() => enterHub(),
      step:() => { snd('click'); enterStart(arg); },
      start:() => enterStart(S.step),
      lesson:() => { snd('click'); enterLesson(S.step); },
      pass:() => { snd('click'); enterPass(S.step); },
      setup:() => enterSetup(),
      preset:() => { SU.counts = { ...CL.PRESETS.find(p => p.k === arg).c }; snd('click'); renderSetup(); },
      rstep:() => { const [t, d] = arg.split(','); SU.counts[t] = CL.clampCount(SU.counts[t] + +d); snd('click'); renderSetup(); },
      suDone:() => { snd('click'); enterStart(S.step); },
      lnext:() => lessonNext(),
      lagain:() => enterLesson(S.step),
      play:() => { snd('click'); renderPractice(); },
      test:() => showTestSetup(),
      stats:() => { snd('click'); showStats(); },
      help:() => toggleHelp(),
      opt:() => S.screen === 'lesson' ? tryAnswerRead(+arg, b) : passAnswerRead(+arg, b),
      pmain:() => passMain(),
      adj:() => { const [w, d] = arg.split(','); if (S.screen === 'lesson') tryAdjust(w, +d); else passAdjust(w, +d); },
      cancel:() => confirmCancelPass(),
      mapToggle:() => { playMap = !playMap; snd('click'); updateClock(); },
    };
    if (A[a]) A[a]();
  }
  const S = { screen:'hub', step:null };

  /* ══════════════════════════════════════════════════════
     HEMVYN: KLOCKANS TRAPPA
  ══════════════════════════════════════════════════════ */
  /* Exemplet under stegets namn, färgkodat som klockan (Hur lång tid: bara text) */
  const exampleHTML = s => s.id === 'tid' ? s.example
    : s.id === 'digital' ? `${colorizeTimeText('14:30')} är ${colorizeTimeText('halv tre på eftermiddagen')}`
    : s.example.split(' · ').map(x => colorizeTimeText(x.replace(/^klockan /, ''))).map((x, i) => s.id === 'hela' ? `klockan ${x}` : x).join(' · ');
  function enterHub(){
    leave(); S.screen = 'hub';
    const B = loadBoxes(), day = today();
    const rows = CL.STEPS.map(s => {
      const m = CL.stepMedal(B, s.id, day);
      const lbl = `Steg ${s.n}: ${s.name}. ${m.medal ? MEDAL_NAME[m.medal] : 'Ingen medalj än'}. ${CL.kanTxt(m.kan, m.total)}.${m.due ? ' Några tider behöver fyllas på.' : ''}`;
      return `<button class="ck-step" data-act="step" data-arg="${s.id}" aria-label="${lbl}">
          <span class="ck-sn">${s.n}</span>
          <span class="ck-stx"><b>${s.name}</b><small>${exampleHTML(s)}</small><span class="tb-bar"><i style="width:${Math.round(m.share * 100)}%"></i></span></span>
          <span class="ck-smd">${medalSVG(m.medal)}${m.due ? '<i class="mdue"></i>' : ''}</span>
        </button>`;
    }).join('');
    root().innerHTML = `
      ${styleTag()}
      ${headerHtml('Klockan', 'App.goBackToGameSelect()')}
      <div class="wrap ck2" id="ck-hub">
        <div class="card ck-stairs" id="ck-stairs">
          <div class="ck-st-head">${svg('stairs')}<b>Klockans trappa</b></div>
          ${rows}
        </div>
        <div class="ck-tiles" id="ck-tiles">
          <button class="ck-tile" data-act="play" id="ck-goPlay"><span class="ic">${svg('clock')}</span><b>Lekklockan</b><small>Ställ fritt</small></button>
          <button class="ck-tile" data-act="test" id="ck-goTest"><span class="ic">${svg('test')}</span><b>Klocktest</b><small>Tio frågor</small></button>
          <button class="ck-tile" data-act="stats" id="ck-goStats"><span class="ic">${svg('stats')}</span><b>Statistik</b><small>och logg</small></button>
        </div>
      </div>`;
  }

  /* ══════════════════════════════════════════════════════
     STEGETS STARTSKÄRM
  ══════════════════════════════════════════════════════ */
  function enterStart(stepId){
    const s = CL.stepById(stepId); if (!s){ enterHub(); return; }
    leave(); S.screen = 'start'; S.step = stepId;
    const m = CL.stepMedal(loadBoxes(), stepId, today()), rank = m.medal ? SP.MEDALS.indexOf(m.medal) : -1;
    const rows = [['guld', '<b>Guld:</b> du kan alla tider i steget'], ['silver', '<b>Silver:</b> du kan minst hälften av tiderna'], ['brons', '<b>Brons:</b> du har övat på alla tider']];
    const counts = loadCounts(), pl = CL.passPlan(stepId, counts);
    const mini = s.id === 'digital' ? `<span class="ck-minidigi num">${colorizeTimeText(CL.digi(...s.ex))}</span>` : miniClock(...s.ex);
    root().innerHTML = `
      ${styleTag()}
      ${headerHtml(`Steg ${s.n} av ${CL.STEPS.length}`, 'hub')}
      <div class="wrap ck2" id="ck-start">
        <div class="card ck-shead">
          <span class="ck-smd-l">${medalSVG(m.medal)}${m.due ? '<i class="mdue"></i>' : ''}</span>
          <div class="ck-sht"><b>${s.name}</b><span>${CL.kanTxt(m.kan, m.total)}.</span><span class="tb-bar"><i style="width:${Math.round(m.share * 100)}%"></i></span></div>
          <span class="ck-mini">${mini}</span>
        </div>
        <div class="card ck-medals">
          ${rows.map(([k, txt]) => `<div class="ck-md${SP.MEDALS.indexOf(k) <= rank ? '' : ' off'}"><span class="ck-mdi">${medalSVG(k)}</span><span>${txt}</span><span class="ck-mok">${svg('check')}</span></div>`).join('')}
          ${m.due ? `<div class="ck-md fill"><i></i><span>${m.due === 1 ? 'En tid' : `${m.due} tider`} att fylla på</span></div>` : ''}
        </div>
        <div class="card ck-rounds">
          <div class="ck-rhead"><b>Varv</b><button class="btn-pill" data-act="setup" id="ck-edit">Ändra varv</button></div>
          <div class="ck-rlist">${pl.types.map((ty, k) => `<span class="ck-r"><em>${k + 1}.</em><i class="ri ri-${ty}">${svg(RICON[ty])}</i>${CL.RNAME[ty]}</span>`).join('')}</div>
          <div class="ck-sum">${CL.planSummary(pl)}</div>
        </div>
        <div class="grow"></div>
        <div class="ck-duo2">
          <button class="btn btn-secondary" data-act="lesson" id="ck-goLesson">${svg('bulb')} Lär dig</button>
          <button class="btn btn-primary" data-act="pass" id="ck-goPass" ${pl.rounds ? '' : 'disabled'}>${svg('play')} Öva</button>
        </div>
      </div>`;
  }

  /* ── Ändra varv ── */
  let SU = null;
  function enterSetup(){ leave(); S.screen = 'setup'; SU = { counts:loadCounts() }; renderSetup(); }
  function renderSetup(){
    const pl = CL.passPlan(S.step, SU.counts), pk = CL.presetFor(SU.counts);
    root().innerHTML = `
      ${styleTag()}
      ${headerHtml('Ändra varv', 'start')}
      <div class="wrap ck2" id="ck-setup">
        <div class="card ck-su">
          <div class="ck-rhead"><b>Varv</b></div>
          <div class="ck-presets">${CL.PRESETS.map(p => `<button data-act="preset" data-arg="${p.k}" class="${p.k === pk ? 'on' : ''}">${p.label}</button>`).join('')}</div>
          ${CL.RTYPES.map(t => `<div class="ck-rrow${SU.counts[t] ? '' : ' zero'}"><span class="ri ri-${t}">${svg(RICON[t])}</span><span class="rt"><b>${CL.RNAME[t]}</b><small>${CL.RHELP[t]}</small></span>
            <button class="ck-stp" data-act="rstep" data-arg="${t},-1" aria-label="Ett varv färre" ${SU.counts[t] <= 0 ? 'disabled' : ''}>${svg('minus')}</button><b class="ck-rn">${SU.counts[t]}</b>
            <button class="ck-stp" data-act="rstep" data-arg="${t},1" aria-label="Ett varv till" ${SU.counts[t] >= CL.RMAX ? 'disabled' : ''}>${svg('plus')}</button></div>`).join('')}
        </div>
        <div class="grow"></div>
        <div class="ck-susum">${CL.planSummary(pl)}</div>
        <div class="slot"><button class="btn btn-primary" data-act="suDone" ${pl.rounds ? '' : 'disabled'}>${svg('check')} Klar</button></div>
      </div>`;
    if (pl.rounds) saveCounts(SU.counts);            // sparas vid varje ändring (även om barnet trycker Tillbaka)
  }

  /* ══════════════════════════════════════════════════════
     SCENEN: gemensamt för lektionen, försöken och förklaringen vid fel.
     De tre representationerna: urtavlan, den digitala tiden och tiden i ord,
     synkrona. Summan i marginalen (aux) och betoningen av bindeordet.
  ══════════════════════════════════════════════════════ */
  const trioHTML = () => `<div class="ck-trio off" id="ck-trio"><span class="ck-tdigi num" id="ck-tdigi"><span class="dg t-h"></span><span class="t-k">:</span><span class="dg t-m"></span></span><span class="ck-twords" id="ck-twords"></span></div>`;
  /* Digital tid och ord under klockan: följer visarna. Siffrorna bläddrar när de byts,
     orden tonar in när visarna står still. */
  function Trio(el){
    const [dh, dm] = el.querySelectorAll('.dg'), wd = el.querySelector('.ck-twords');
    const S = { on:false, digital:false, words:true, hourOnly:false, h:null, m:null, w:null };
    const flip = e => { e.classList.remove('flip'); void e.offsetWidth; e.classList.add('flip'); };
    return {
      S,
      show(on, o = {}){
        S.on = !!on; if ('digital' in o) S.digital = !!o.digital; if ('words' in o) S.words = o.words !== false;
        el.classList.toggle('off', !S.on); el.classList.toggle('nowords', !S.words);
        S.h = S.m = S.w = null;
      },
      words(on){ S.words = !!on; el.classList.toggle('nowords', !S.words); S.w = null; },
      update(t, moving){
        if (!S.on) return;
        t = CL.norm(Math.round(t));
        const h = CL.hOf(t), m = S.hourOnly ? 0 : CL.mOf(t);
        const hs = p2(S.digital ? h : CL.h12(h)), ms = p2(m);
        if (hs !== S.h){ dh.textContent = hs; if (!moving && S.h !== null) flip(dh); S.h = hs; }
        if (ms !== S.m){ dm.textContent = ms; if (!moving && S.m !== null) flip(dm); S.m = ms; }
        if (moving || S.hourOnly || !S.words) return;
        const w = S.digital ? CL.digitalWords(h, m) : CL.words(h, m);
        if (w !== S.w){
          wd.innerHTML = (m === 0 ? '<span class="t-k">klockan</span> ' : '') + colorizeTimeText(w);
          wd.classList.remove('chg'); void wd.offsetWidth; wd.classList.add('chg');
          S.w = w;
        }
      },
      pulse(){ flip(dh); flip(dm); },
      /* Ordet i tiden, som eget element (utan mellanrummen runt bindeordet) */
      wordEl(word){
        const sp = [...wd.querySelectorAll('span')].reverse().find(x => x.textContent.trim().toLowerCase() === word);
        if (!sp) return null;
        const tx = sp.textContent, i = tx.toLowerCase().indexOf(word);
        sp.innerHTML = `${esc(tx.slice(0, i))}<span class="lkw">${esc(tx.slice(i, i + word.length))}</span>${esc(tx.slice(i + word.length))}`;
        return sp.querySelector('.lkw');
      },
    };
  }
  /* Scenens delar i ett paket: urtavlan, marginalen och de tre representationerna */
  function mkCtx(V, aux, trio, extra = {}){
    V.onDraw = (t, moving) => { if (trio) trio.update(t, moving); };
    return { V, aux, trio, ...extra };
  }

  /* ── Bubblan: färgkodad text och betoningen ─────────── */
  const esc = s => SH.escapeHtml(String(s));
  function say(t1, t2 = '', raw = false, o = {}){
    const th = $('bubble'); if (!th) return;
    removeBow();
    const lead = o.lead ? `<span class="lead${o.good ? ' good' : ''}">${esc(o.lead)}</span>` : '';
    th.innerHTML = `${lead}<span>${raw ? t1 : fmtText(t1, o.link)}</span>${t2 ? `<span class="sm">${t2}</span>` : ''}`;
    th.classList.remove('pop'); void th.offsetWidth; th.classList.add('pop');
  }
  /* Betoningen: ordet i tiden och ordet i förklaringen lyser upp samtidigt, med en tunn båge */
  const LK = { i:'lk-i', 'över':'lk-o', halv:'lk-h' };
  const BOWC = { i:'#f59e0b', 'över':'#10b981', halv:'#8b5cf6' };
  function applyLink(X, link){
    if (!link) return;
    const b = $('bubble'); if (!b) return;
    b.querySelectorAll('.lk').forEach(m => m.classList.add('on'));
    let tw = null;
    if (X.trio && X.trio.S.on && X.trio.S.words){ tw = X.trio.wordEl(link[0]); if (tw) tw.classList.add('lk', LK[link[0]], 'on'); }
    const bb = b.querySelector('.lk-b');
    if (tw && bb) drawBow(tw, bb, BOWC[link[0]]);
  }
  function removeBow(){
    const r = root(); if (!r) return;
    r.querySelectorAll('.ck-bow').forEach(x => x.remove());
    r.querySelectorAll('.ck-twords .lk').forEach(x => x.classList.remove('lk', 'on', 'lk-i', 'lk-o', 'lk-h'));   // betoningen gäller sitt steg
  }
  function drawBow(from, to, color){
    const wrap = root().querySelector('.ck2'); if (!wrap) return;
    const w = wrap.getBoundingClientRect(), a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const x1 = a.left + a.width / 2 - w.left, y1 = a.bottom - w.top + 2, x2 = b.left + b.width / 2 - w.left, y2 = b.top - w.top - 2;
    const dy = Math.max(16, Math.abs(y2 - y1) * 0.6);
    wrap.insertAdjacentHTML('beforeend', `<svg class="ck-bow" width="${Math.round(w.width)}" height="${Math.round(w.height)}" aria-hidden="true">
      <path pathLength="1" stroke="${color}" d="M${f1(x1)} ${f1(y1)}C${f1(x1)} ${f1(y1 + dy)} ${f1(x2)} ${f1(y2 - dy)} ${f1(x2)} ${f1(y2)}"/></svg>`);
  }

  /* ── Räkningen och summan i marginalen ─────────────── */
  const sumHTML = text => esc(text).replace(/\d+/g, n => `<b>${n}</b>`);
  function setSum(aux, html){
    if (!aux) return;
    aux.querySelectorAll('.ck-sumline').forEach(x => x.remove());
    if (html) aux.insertAdjacentHTML('beforeend', html);
  }
  /* Den röda visaren går (eller räknas) i steg om 5 minuter; varje femmingssegment tänds
     och summan byggs: "5", "5 + 5 = 10" … Framåt ("gått") och det som är kvar till 12 ("kvar"). */
  async function countAct(X, x, tok){
    const { V, aux } = X;
    const n = Math.round((x.to - x.from) / 5); if (n <= 0) return;
    const ms = CL.countStepMs(n), base = Math.round(V.t) - CL.mOf(Math.round(V.t));
    setSum(aux, `<span class="ck-sumline ${x.c}"><small>${x.c === 'left' ? 'kvar' : 'gått'}</small><span class="st"></span></span>`);
    const line = aux && aux.querySelector('.ck-sumline'), st = line && line.querySelector('.st');
    const show = k => { if (st){ st.innerHTML = sumHTML(CL.sumText(k)); line.classList.toggle('long', k > 6); } };
    if (RM()){
      for (let k = 1; k <= n; k++) V.seg(x.from + 5 * (k - 1), x.from + 5 * k, x.c);
      if (x.move) V.set(base + x.to);
      show(n); return;
    }
    for (let k = 1; k <= n; k++){
      if (tok !== token) return;
      V.seg(x.from + 5 * (k - 1), x.from + 5 * k, x.c);
      if (x.move) await V.animateTo(base + x.from + 5 * k, ms * 0.55);
      if (tok !== token) return;
      show(k);
      await wait(ms * (x.move ? 0.45 : 1));
    }
  }

  /* Kör en lektions- eller förklaringsakt (X = scenen) */
  async function act(X, x, tok){
    if (tok !== token) return;
    const { V, aux, trio } = X;
    switch (x.do){
      case 'time':  V.set(x.t); return;
      case 'go': {
        const tt = x.near ? nearest(V.t, x.t) : x.t;
        await V.animateTo(tt, x.ms || 1200);
        if (x.near && tok === token) V.set(x.t);                // samma läge på urtavlan, rätt tid i den digitala
        return;
      }
      case 'hl':    V.hl(x.w); return;
      case 'trio':  if (trio){ trio.show(x.on !== false, { digital:!!x.digital, words:x.words !== false }); trio.update(V.t, false); } return;
      case 'words': if (trio){ trio.words(true); trio.update(V.t, false); } return;
      case 'map':   V.setMap(1, x.parts); return;
      case 'nums':  await V.numsSeq(); return;
      case 'hnums': await V.hnumsSeq(); return;
      case 'glow':  V.glowNum(x.h); return;
      case 'fill':  V.fill(x.from, x.to, x.c); await pause(350); return;
      case 'quarters': V.quarters(); await pause(300); return;
      case 'arc':   V.arc(x.from, x.upto); await pause(300); return;
      case 'clear': V.clearFx(); return;
      case 'ring24': V.ring24(x.mode, x); if (x.seq) await V.ringSeq(); return;
      case 'rev': {
        V.nomin(true); if (trio) trio.S.hourOnly = true;
        await V.animateTo(x.t, x.ms || 1600, tt => V.ringLit(tt));
        V.nomin(false); if (trio) trio.S.hourOnly = false;
        if (tok === token) V.set(x.t);
        return;
      }
      case 'lap':   V.lap(); return;
      case 'bed':   V.bed(x.at, x.who); return;
      case 'minus12': {
        const hr = CL.hOf(Math.round(V.t)), d = CL.digitalHour(hr);
        V.ringHot(hr); V.glowNum(d.dial);
        setSum(aux, `<span class="ck-sumline h ck-m12"><b>${hr}</b><span class="fly">&minus;&nbsp;12</span><span class="eq">=&nbsp;<b>${d.dial}</b></span></span>`);
        await pause(800); return;
      }
      case 'count': await countAct(X, x, tok); return;
      case 'sum':   setSum(aux, x.text ? `<span class="ck-sumline${x.cls === 'h' ? ' h' : ''}">${sumHTML(x.text)}</span>` : null); return;
      case 'pulse': if (trio) trio.pulse(); return;
      case 'showAnalog': if (X.showAnalog) X.showAnalog(); V.set(V.t); return;
      case 'chip': {
        if (!aux) return;
        if (x.reset){ aux.innerHTML = ''; return; }
        if (x.total){
          const line = aux.querySelector('.ck-sumline');
          if (line){ const tot = +((line.textContent.match(/(\d+)\s*$/) || [0, 0])[1]); line.outerHTML = `<span class="ck-chip">${tot} minuter</span>`; }
          aux.insertAdjacentHTML('beforeend', `<span class="ck-chip tot">= ${x.total}</span>`); return;
        }
        aux.insertAdjacentHTML('beforeend', `<span class="ck-chip${/timm/.test(x.text) ? ' h' : ''}">${x.text}</span>`);
        return;
      }
    }
  }
  async function runStep(X, st, tok){
    for (const x of st.acts){ if (tok !== token) return; await act(X, x, tok); }
    if (tok === token && st.link) applyLink(X, st.link);
  }
  /* Svarsknapparna och ställraden (passet och lektionens försök) */
  const optsHTML = (task, opts) => `<div class="ck-opts${task.kind === 'digital' ? ' one' : ''}">${opts.map((o, i) => `<button class="ck-opt" data-act="opt" data-arg="${i}">${task.kind === 'dur' ? o.text : colorizeTimeText(o.text)}</button>`).join('')}</div>`;
  const setRowHTML = () => `<div class="ck-setrow">
      <span class="grp"><button class="ck-stp" data-act="adj" data-arg="h,-1" aria-label="En timme bakåt">${svg('minus')}</button><b class="lab-h">Timme</b><button class="ck-stp" data-act="adj" data-arg="h,1" aria-label="En timme framåt">${svg('plus')}</button></span>
      <span class="grp"><button class="ck-stp" data-act="adj" data-arg="m,-5" aria-label="Fem minuter bakåt">${svg('minus')}</button><b class="lab-m">Minut</b><button class="ck-stp" data-act="adj" data-arg="m,5" aria-label="Fem minuter framåt">${svg('plus')}</button></span>
    </div>`;
  /* Det barnet svarade, i den form nearMiss vill ha */
  const givenOf = (task, t) => task.kind === 'dur' ? CL.diffFwd(CL.toTot(task.h1, task.m1), Math.round(t)) : Math.round(t);

  /* ══════════════════════════════════════════════════════
     LEKTIONEN ("Lär dig"): klickstyrd, en idé per steg.
     LS.phase: 'demo' (visa) · 'q' (försöket) · 'exp' (förklaringen efter fel)
     · 'conf' (bekräftande förklaring efter rätt) · 'ok2' (rätt andra gången) · 'end'
  ══════════════════════════════════════════════════════ */
  let LS = null;
  function enterLesson(stepId){
    const s = CL.stepById(stepId); if (!s) return;
    leave(); S.screen = 'lesson';
    const steps = CL.LESSONS[stepId], tries = CL.lessonTries(stepId);
    const tight = !steps.some(st => st.acts.some(a => ['map', 'nums', 'ring24'].includes(a.do)));
    root().innerHTML = `
      ${styleTag()}
      ${headerHtml(s.short, 'start')}
      <div class="wrap ck2" id="ck-lesson">
        <div class="ck-lrow"><span class="ck-ltag" id="ck-ltag"></span><div class="ck-ldots" id="ck-ldots">${steps.map(() => '<i></i>').join('')}${tries.map(() => '<i class="try"></i>').join('')}</div></div>
        <div class="card ck-stage" id="ck-stage"><div class="ck-qclock" id="ck-lclock">${clockSVG({ tight })}</div><div class="ck-aux" id="ck-aux"></div>${trioHTML()}</div>
        <div class="ck-ctrl" id="ck-ctrl"></div>
        <div class="bubble b92"><div class="thought" id="ck-bubble"></div></div>
        <div class="slot" id="ck-slot"><button class="btn btn-primary" data-act="lnext" id="ck-main"></button>
          <div class="duo"><button class="btn btn-secondary" data-act="lagain">${svg('again')} Igen</button><button class="btn btn-primary" data-act="pass">Öva nu ${svg('next')}</button></div></div>
      </div>`;
    const V = ClockView($('lclock').querySelector('svg'), CL.toTot(12, 0));
    LS = { step:stepId, steps, tries, i:-1, phase:'demo', ti:-1, task:null, type:null, first:true, E:null, lead:null, good:false, opts:null, pr:0 };
    LS.X = mkCtx(V, $('aux'), Trio($('trio')), { showAnalog:() => { $('stage').classList.remove('digiq'); } });
    lessonStep(0);
  }
  function lessonRefresh(){
    if (!LS) return;
    const m = $('main'); if (!m) return;
    const P = LS.phase, E = LS.E, moreTries = LS.ti < LS.tries.length - 1;
    let label = 'Nästa steg', icon = 'next', show = true, before = false;
    if (P === 'demo' && LS.i >= LS.steps.length - 1) label = 'Nu får du försöka';
    if (P === 'q'){ if (LS.type === 'set'){ label = 'Klar'; icon = 'check'; before = true; } else show = false; }
    if (P === 'exp' && E.i >= E.steps.length - 1){ label = 'Försök igen'; icon = 'again'; before = true; }
    if ((P === 'conf' && E.i >= E.steps.length - 1) || P === 'ok2'){ label = moreTries ? 'Nästa uppgift' : 'Klar'; if (!moreTries){ icon = 'check'; before = true; } }
    m.style.visibility = show ? '' : 'hidden';
    m.innerHTML = before ? `${svg(icon)} ${label}` : `${label} ${svg(icon)}`;
    m.disabled = busy;
    $('slot').classList.toggle('duoing', P === 'end');
    const nd = LS.steps.length, trying = P !== 'demo';
    [...$('ldots').children].forEach((d, k) => {
      const base = k >= nd ? 'try' : '';
      let st = '';
      if (k < nd) st = trying || k < LS.i ? 'done' : k === LS.i ? 'cur' : '';
      else { const j = k - nd; st = P === 'end' || j < LS.ti || (j === LS.ti && (P === 'conf' || P === 'ok2')) ? 'done' : j === LS.ti ? 'cur' : ''; }
      d.className = `${base} ${st}`.trim();
    });
    const tag = $('ltag');
    if (tag) tag.innerHTML = trying && P !== 'end' ? `${svg('hand')}Försök ${LS.ti + 1} av ${LS.tries.length}` : `${svg('bulb')}Lär dig`;
  }
  async function lessonStep(k){
    const tok = token, st = LS.steps[k];
    LS.i = k; busy = true; lessonRefresh();
    say(st.text, '', false, { link:st.link });
    await pause(LEAD);
    await runStep(LS.X, st, tok);
    if (tok !== token) return;
    busy = false; lessonRefresh();
  }
  function lessonNext(){
    if (busy || !LS) return;
    const E = LS.E;
    switch (LS.phase){
      case 'demo':
        if (LS.i < LS.steps.length - 1) lessonStep(LS.i + 1); else { snd('click'); startTry(0); }
        return;
      case 'q':   if (LS.type === 'set') trySubmitSet(); return;
      case 'exp':
        if (E.i < E.steps.length - 1) tryExplainStep(E.i + 1); else { snd('click'); startTry(LS.ti, true); }
        return;
      case 'conf':
        if (E.i < E.steps.length - 1){ tryExplainStep(E.i + 1); return; }
        // sista steget: vidare som efter 'ok2'
      case 'ok2':
        snd('click');
        if (LS.ti < LS.tries.length - 1) startTry(LS.ti + 1); else lessonEnd();
        return;
    }
  }
  /* Ett försök: "Nu får du försöka! Med det vi nyss visade." */
  function startTry(j, again = false){
    const tr = LS.tries[j], task = CL.taskByKey(LS.step, tr.key), X = LS.X, V = X.V;
    LS.phase = 'q'; LS.ti = j; LS.task = task; LS.type = tr.type; LS.first = !again; LS.E = null; busy = false;
    removeBow();
    V.disableDrag(); V.clearFx(); V.hl(null); V.ring24(null);
    X.aux.innerHTML = '';
    X.trio.show(false);
    $('stage').className = 'card ck-stage';
    $('ctrl').className = 'ck-ctrl';
    if (tr.type === 'read'){
      if (task.kind === 'digital'){
        $('stage').classList.add('digiq');
        V.set(CL.targetTot(task));
        X.trio.show(true, { digital:true, words:false }); X.trio.update(V.t, false);
      } else V.set(task.kind === 'dur' ? CL.toTot(task.h1, task.m1) : CL.targetTot(task));
      LS.opts = CL.readOptions(task);
      $('ctrl').innerHTML = optsHTML(task, LS.opts);
    } else {
      V.set(CL.setStart(task));
      V.enableDrag(() => {});
      $('ctrl').innerHTML = setRowHTML();
    }
    say(CL.tryPrompt(task, tr.type, again));
    lessonRefresh();
  }
  function tryAnswerRead(i, el){
    if (!LS || LS.phase !== 'q' || LS.type !== 'read' || busy) return;
    const o = LS.opts[i]; if (!o) return;
    $('ctrl').querySelectorAll('.ck-opt').forEach(b => b.disabled = true);
    el.classList.add(o.ok ? 'ok' : 'bad');
    if (!o.ok){ el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
    tryAnswered(o.ok, o.val);
  }
  function tryAdjust(w, d){
    if (!LS || LS.phase !== 'q' || LS.type !== 'set') return;
    LS.X.V.set(CL.norm(Math.round(LS.X.V.t) + (w === 'h' ? d * 60 : d)));
    snd('click');
  }
  function trySubmitSet(){
    const V = LS.X.V, ok = CL.sameOnDial(Math.round(V.t), CL.targetTot(LS.task));
    $('ctrl').innerHTML = '';
    tryAnswered(ok, givenOf(LS.task, V.t));
  }
  /* Rätt: beröm, och förklaringen kommer ändå – "Precis som du redan räknat ut". Andra gången: kort beröm.
     Fel: "Nästan rätt!" bara när felet är nära, sedan förklaringen och samma uppgift igen. */
  function tryAnswered(ok, given){
    const X = LS.X;
    X.V.disableDrag();
    if (LS.first) recordAnswer(LS.step, LS.task.key, ok);     // bara första försöket räknas, som i Öva
    snd(ok ? 'correct' : 'wrong');
    if (ok) $('stage').classList.add('ok');
    if (ok && !LS.first){ LS.phase = 'ok2'; say(CL.RETRY_OK); lessonRefresh(); return; }
    if (ok){ LS.phase = 'conf'; LS.lead = CL.praise(LS.pr++); LS.good = true; LS.E = { steps:CL.explainSteps(LS.task, LS.type, { confirm:true }), i:-1 }; }
    else { LS.phase = 'exp'; LS.lead = CL.wrongLead(CL.nearMiss(LS.task, given, LS.type)); LS.good = false; LS.E = { steps:CL.explainSteps(LS.task, LS.type), i:-1 }; }
    tryExplainStep(0);
  }
  async function tryExplainStep(k){
    const tok = token, E = LS.E, st = E.steps[k];
    E.i = k; busy = true; lessonRefresh();
    say(st.text, '', false, { lead:k === 0 ? LS.lead : null, good:LS.good, link:st.link });
    await pause(LEAD);
    if (tok !== token) return;
    if (k === 0){ $('stage').classList.add('exp'); $('ctrl').classList.add('exp'); }
    await runStep(LS.X, st, tok);
    if (tok !== token) return;
    if (st.done && LS.type === 'read'){
      const b = $('ctrl').querySelectorAll('.ck-opt')[LS.opts.findIndex(o => o.ok)];
      if (b) b.classList.add('ok');
    }
    busy = false; lessonRefresh();
  }
  function lessonEnd(){
    LS.phase = 'end'; LS.X.V.disableDrag();
    $('ctrl').innerHTML = '';
    say(CL.LESSON_END);
    lessonRefresh();
  }

  /* ══════════════════════════════════════════════════════
     ÖVNINGSPASSET
     PS.phase: 'q' (fråga) · 'right' (rätt, går vidare själv) · 'explain' (förklaringen
     steg för steg) · 'explained' (färdigförklarad: Svara igen) · 'between' (mellan varven)
  ══════════════════════════════════════════════════════ */
  let PS = null;
  function enterPass(stepId){
    const s = CL.stepById(stepId); if (!s) return;
    const counts = loadCounts(), rounds = CL.buildRounds(stepId, counts);
    if (!rounds.length){ enterSetup(); return; }
    leave(); S.screen = 'pass';
    const medal0 = CL.stepMedal(loadBoxes(), stepId, today()).medal;
    PS = { step:stepId, s, rounds, ri:0, drill:null, phase:'q', res:[], start:Date.now(), help:null, level:CL.mapLevel(medal0), V:null, V2:null, E:null, justFixed:false, opts:null, X:null, lead:null, pr:0 };
    root().innerHTML = `
      ${styleTag()}
      ${headerHtml(s.short, 'cancel', { backLabel:'Avbryt' })}
      <div class="wrap ck2" id="ck-pass">
        <div class="card track"><div class="trtop"><span id="ck-psL"></span><span class="rps" id="ck-psR"></span></div><div class="bar"><i class="fill" id="ck-psFill"></i></div></div>
        <div class="card ck-stage" id="ck-stage"></div>
        <div class="ck-ctrl" id="ck-ctrl"></div>
        <div class="bubble b86"><div class="thought" id="ck-bubble"></div></div>
        <div class="slot" id="ck-slot"><button class="btn btn-primary" data-act="pmain" id="ck-main"></button></div>
      </div>`;
    startRound(0);
  }
  const curTask = () => { const c = PS.drill.current(); return c ? CL.taskByKey(PS.step, c.key) : null; };
  const rtype = () => PS.rounds[PS.ri].type;
  function startRound(i){
    PS.ri = i; PS.drill = SH.createDrill(PS.rounds[i].items); PS.justFixed = false;
    nextQ(true);
  }
  function renderTrack(){
    const p = PS.drill.progress(), done = PS.phase === 'between';
    $('psL').innerHTML = `Varv <b>${PS.ri + 1}</b> av ${PS.rounds.length} · ${CL.RNAME[rtype()]}`;
    $('psR').innerHTML = PS.rounds.map((r, k) => `<i class="rp${k < PS.ri || (k === PS.ri && done) ? ' ok' : k === PS.ri ? ' cur' : ''}"></i>`).join('');
    $('psFill').style.transform = `scaleX(${done ? 1 : p.total ? p.done / p.total : 0})`;
  }
  const mapParts = () => CL.MAP_PARTS[PS.step];
  /* Minutkartan i frågorna: stegets nivå (full utan medalj, nedtonad med brons, borta från silver),
     eller barnets eget val (PS.help: true = tänd, false = släckt, null = stegets nivå). Förklaringen: full. */
  const helpLevel = () => PS.help === true ? 1 : PS.help === false ? 0 : PS.level;
  function applyMap(){
    const lvl = PS.phase === 'explain' || PS.phase === 'explained' ? 1 : helpLevel();
    [PS.V, PS.V2].forEach(V => V && V.setMap(lvl, mapParts()));
    const h = $('help'), on = helpLevel() >= 1;
    if (h){ h.classList.toggle('on', on); h.innerHTML = `${svg('map')}${on ? 'Dölj hjälp' : 'Visa hjälp'}`; h.setAttribute('aria-pressed', on); }
  }
  function toggleHelp(){ if (!PS) return; PS.help = helpLevel() >= 1 ? false : true; snd('click'); applyMap(); }
  function setMain(label, icon, show = true, after = true){
    const m = $('main'); if (!m) return;
    m.style.visibility = show ? '' : 'hidden';
    m.innerHTML = after ? `${label} ${icon ? svg(icon) : ''}` : `${icon ? svg(icon) : ''} ${label}`;
    m.disabled = busy;
  }
  function tagFor(cur){ return cur.retry ? 'En gång till' : cur.extra ? 'Tillbaka igen' : ''; }

  /* Frågans scen: tidens visning + urtavla(or) */
  function nextQ(first = false){
    if (!PS || S.screen !== 'pass') return;
    if (PS.drill.isDone()){ roundDone(); return; }
    const cur = PS.drill.current(), task = curTask(), type = rtype();
    PS.phase = 'q'; PS.E = null; PS.task = task; PS.cur = cur; busy = false;
    renderTrack();
    const tag = tagFor(cur), hasMap = mapParts().length > 0 && !(type === 'read' && task.kind === 'digital');   // digital läsfråga: ingen urtavla att hjälpa
    const top = `<div class="ck-qtop"><span class="qtag${tag ? ' on' : ''}" id="ck-tag">${tag}</span>${hasMap ? `<button class="ck-help" data-act="help" id="ck-help"></button>` : ''}</div>`;
    let body = '', twoClocks = false;
    if (type === 'read'){
      if (task.kind === 'digital'){
        body = `<div class="ck-prompt">Vad är klockan i ord?</div><div class="ck-digi2 num">${colorizeTimeText(CL.digi(task.h, task.m))}</div>
          <div class="ck-qclock ck-hidden" id="ck-qclock">${clockSVG({ tight:true })}</div>`;
      } else if (task.kind === 'dur'){
        twoClocks = true;
        body = `<div class="ck-prompt">Hur lång tid går det från den första klockan till den andra?</div>
          <div class="ck-qclock two" id="ck-qclock"><div class="ck-half"><small>Från</small>${clockSVG()}<span class="ck-hw">${colorizeTimeText(CL.words(task.h1, task.m1))}</span></div>
          <div class="ck-half"><small>Till</small>${clockSVG()}<span class="ck-hw">${colorizeTimeText(CL.words(task.h2, task.m2))}</span></div></div>`;
      } else {
        body = `<div class="ck-prompt">Vad visar klockan?</div><div class="ck-qclock" id="ck-qclock">${clockSVG()}</div>`;
      }
    } else {
      const target = task.kind === 'digital' ? `<span class="big num">${colorizeTimeText(CL.digi(task.h, task.m))}</span>`
        : task.kind === 'dur' ? `<span class="big">${CL.durWords(task.mins)} senare</span>`
        : `<span class="big">${colorizeTimeText(CL.words(task.h, task.m))}</span>`;
      const lead = task.kind === 'dur' ? `Klockan är ${colorizeTimeText(CL.words(task.h1, task.m1))}. Ställ klockan` : 'Ställ klockan på';
      body = `<div class="ck-prompt">${lead}${target}</div><div class="ck-qclock" id="ck-qclock">${clockSVG()}</div>`;
    }
    $('stage').className = 'card ck-stage';
    $('ctrl').className = 'ck-ctrl';
    $('stage').innerHTML = top + body + '<div class="ck-aux" id="ck-aux"></div>' + trioHTML();
    const svgs = $('qclock').querySelectorAll('svg');
    PS.V = ClockView(svgs[0], task.kind === 'dur' ? CL.toTot(task.h1, task.m1) : CL.targetTot(task));
    PS.V2 = twoClocks ? ClockView(svgs[1], CL.toTot(task.h2, task.m2)) : null;
    PS.X = mkCtx(PS.V, $('aux'), Trio($('trio')), { showAnalog:passShowAnalog });
    if (type === 'set'){
      PS.V.set(CL.setStart(task));
      PS.V.enableDrag(() => {});
    }
    applyMap();
    // kontrollerna
    if (type === 'read'){
      PS.opts = CL.readOptions(task);                 // ny lottning vid varje visning (även omfrågan)
      $('ctrl').innerHTML = optsHTML(task, PS.opts);
      setMain('', null, false);
    } else {
      $('ctrl').innerHTML = setRowHTML();
      setMain('Klar', 'check', true, false);
    }
    const intro = first ? (type === 'set' ? 'Nu ställer du klockan.' : 'Nu läser du klockan.') : '';
    say(cur.retry ? 'Samma fråga en gång till.'
      : cur.extra ? 'Den här frågan kommer tillbaka en gång till.'
      : type === 'set' ? 'Dra visarna. Tryck på Klar när klockan stämmer.' : 'Vilket svar stämmer?', intro, true);
  }
  function passAdjust(w, d){
    if (!PS || PS.phase !== 'q' || rtype() !== 'set') return;
    PS.V.set(CL.norm(Math.round(PS.V.t) + (w === 'h' ? d * 60 : d)));
    snd('click');
  }
  /* Rätt i passet: bara kort beröm, så att nötningen flyter */
  function rightText(task){
    const p = CL.praise(PS.pr++);
    if (task.kind === 'digital') return `${p} ${CL.digi(task.h, task.m)} är ${CL.digitalWords(task.h, task.m)}.`;
    if (task.kind === 'dur') return `${p} Det tar ${CL.durWords(task.mins)}.`;
    return `${p} Klockan är ${CL.words(task.h, task.m)}.`;
  }
  /* Digital läsfråga: klockan visas i förklaringen, den digitala tiden flyttar ner under den */
  function passShowAnalog(){
    const q = $('qclock'); if (q) q.classList.remove('ck-hidden');
    const d = $('stage') && $('stage').querySelector('.ck-digi2'); if (d) d.style.display = 'none';
  }
  function passAnswerRead(i, el){
    if (!PS || PS.phase !== 'q' || rtype() !== 'read') return;
    const o = PS.opts[i]; if (!o) return;
    $('ctrl').querySelectorAll('.ck-opt').forEach(b => b.disabled = true);
    el.classList.add(o.ok ? 'ok' : 'bad');
    if (!o.ok){ el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
    answered(o.ok, o.val);
  }
  function answered(ok, given){
    const cur = PS.cur, task = PS.task;
    const res = PS.drill.answer(ok);
    if (res.record) recordAnswer(PS.step, task.key, ok);     // bara första försöket räknas
    snd(ok ? 'correct' : 'wrong');
    if (PS.V) PS.V.disableDrag();
    if (ok){
      PS.phase = 'right';
      $('stage').classList.add('ok');
      say(cur.retry && PS.justFixed ? 'Rätt! Den frågan kommer tillbaka en gång till i varvet.' : rightText(task), '', false);
      PS.justFixed = false;
      setMain('', null, false);
      renderTrack();
      const tok = token;
      setTimeout(() => { if (tok === token && PS && PS.phase === 'right') nextQ(); }, cur.retry ? 1500 : 800);
      return;
    }
    PS.justFixed = res.insertedAt !== null || PS.justFixed;
    PS.phase = 'explain';
    PS.E = { steps:CL.explainSteps(task, rtype()), i:-1 };
    PS.lead = CL.wrongLead(CL.nearMiss(task, given, rtype()));
    renderTrack();
    applyMap();
    explainStep(0);
  }
  /* Ett förklaringssteg: texten först, sedan det klockan visar (lektionens byggstenar) */
  async function explainStep(k){
    const tok = token, E = PS.E, st = E.steps[k], task = PS.task, type = rtype();
    E.i = k; busy = true; setMain('Nästa steg', 'next');
    say(st.text, '', false, { lead:k === 0 ? PS.lead : null, link:st.link });
    await pause(LEAD);
    if (tok !== token) return;
    if (k === 0){
      // Hur lång tid, läsfrågan: de två klockorna blir en, som går från start till slut
      if (task.kind === 'dur' && PS.V2){
        $('qclock').className = 'ck-qclock'; $('qclock').innerHTML = clockSVG();
        PS.V = ClockView($('qclock').querySelector('svg'), CL.toTot(task.h1, task.m1)); PS.V2 = null;
        PS.X = mkCtx(PS.V, $('aux'), PS.X.trio, { showAnalog:passShowAnalog });
        PS.V.setMap(1, mapParts());
      }
      $('stage').classList.add('exp');
      $('ctrl').classList.add('exp');
    }
    await runStep(PS.X, st, tok);
    if (tok !== token) return;
    if (st.done && type === 'read'){
      const b = $('ctrl').querySelectorAll('.ck-opt')[PS.opts.findIndex(o => o.ok)];
      if (b) b.classList.add('ok');
    }
    busy = false;
    if (k >= E.steps.length - 1){ PS.phase = 'explained'; setMain(type === 'set' ? 'Ställ igen' : 'Svara igen', 'again'); }
    else setMain('Nästa steg', 'next');
  }
  /* Samma tid på urtavlan, närmast där visarna står (visarna går kortaste vägen) */
  const nearest = (from, target) => { const d = ((target - from) % CL.HALF_DAY + CL.HALF_DAY + CL.HALF_DAY / 2) % CL.HALF_DAY - CL.HALF_DAY / 2; return Math.round(from + d); };
  function passMain(){
    if (!PS || busy) return;
    if (PS.phase === 'q' && rtype() === 'set'){
      const ok = CL.sameOnDial(Math.round(PS.V.t), CL.targetTot(PS.task));
      answered(ok, givenOf(PS.task, PS.V.t));
      return;
    }
    if (PS.phase === 'explain'){ if (PS.E.i < PS.E.steps.length - 1) explainStep(PS.E.i + 1); return; }
    if (PS.phase === 'explained'){ snd('click'); nextQ(); return; }
    if (PS.phase === 'between'){ startRound(PS.ri + 1); return; }
  }
  function roundDone(){
    const st = PS.drill.stats();
    PS.res.push({ type:rtype(), asked:st.asked, firstOk:st.firstOk, wrongFirst:st.wrongFirst });
    if (PS.ri >= PS.rounds.length - 1){ finishPass(); return; }
    PS.phase = 'between'; PS.V = PS.V2 = null;
    renderTrack();
    const nxt = PS.rounds[PS.ri + 1].type;
    $('stage').className = 'card ck-stage';
    $('stage').innerHTML = `<div class="ck-between"><span class="okc">${svg('check')}</span><b>Varv ${PS.ri + 1} klart!</b><span>Nästa: ${CL.RNAME[nxt]}</span></div>`;
    $('ctrl').innerHTML = `<div class="ck-rl">${PS.rounds.map((r, k) => `<span class="${k <= PS.ri ? 'ok' : k === PS.ri + 1 ? 'next' : ''}">${svg(k <= PS.ri ? 'check' : RICON[r.type])}${CL.RNAME[r.type]}</span>`).join('')}</div>`;
    snd('correct');
    say('Bra jobbat! Fortsätt när du är redo.', CL.RHELP[nxt], true);
    setMain('Fortsätt', 'next');
  }
  function confirmCancelPass(){
    const el = document.createElement('div');
    el.className = 'modal-overlay ck-modal'; el.id = 'ck-modal';
    el.innerHTML = `<div class="modal"><h3 class="modal-title">Vill du avbryta passet?</h3>
      <p style="color:var(--ink-soft);font-weight:700;text-align:center;margin:6px 0 16px">Om du avbryter nu sparas inte passet.</p>
      <div style="display:flex;flex-direction:column;gap:10px"><button class="btn btn-primary" id="ck-mStay">Fortsätt passet</button><button class="btn btn-ghost" id="ck-mQuit">Avbryt passet</button></div></div>`;
    document.body.appendChild(el);
    const close = () => el.remove();
    el.addEventListener('click', e => { if (e.target === el) close(); });
    el.querySelector('#ck-mStay').onclick = close;
    el.querySelector('#ck-mQuit').onclick = () => { close(); PS = null; enterStart(S.step); };
  }
  function finishPass(){
    const R0 = SH.receiptFor(PS.res, Date.now() - PS.start);
    const entry = { type:'ovningspass', step:PS.step, rounds:R0.rounds, correct:R0.correct, total:R0.total, pct:R0.pct, fixed:R0.fixed, secs:R0.secs };
    addLog(entry);
    const saved = getLog()[0];
    PS.logId = saved && saved.type === 'ovningspass' ? saved.id : null;
    PS.receipt = { ...entry, date:saved && saved.date || new Date().toISOString(), seen:null };
    enterDone();
    snd('fanfare');
    confetti(R0.pct >= 90 ? 110 : 70);
    // Capybara-samlingen: ren sidoeffekt EFTER loggen – får aldrig kasta
    try { if (window.Capy) Capy.award(profile, { type:'ovningspass', data:{ module:'clock', pct:R0.pct, step:PS.step, stepName:PS.s.short, rounds:R0.rounds.length } }); } catch (_) {}
  }

  /* ── Du är klar! – kvittot till en vuxen ── */
  function receiptHTML(e){
    const s = CL.stepById(e.step);
    return `
      <div class="rc-top"><span class="rc-k">${svg('repeat')}Övningspass · Klockan</span><span class="rc-when">${CL.cap(SH.fmtWhen(e.date))}</span></div>
      <div class="rc-row"><span>Steg</span><b>${s ? `${s.n}. ${s.name}` : ''}</b></div>
      <div class="rc-rounds">${e.rounds.map((t, k) => `<span class="rv">${svg('check')}<em>${k + 1}.</em> ${CL.RNAME[t]}</span>`).join('')}</div>
      <div class="rc-row"><span>Rätt på första försöket</span><b>${e.correct} av ${e.total}</b></div>
      <div class="rc-row"><span>Fel som rättades</span><b>${e.fixed}</b></div>
      <div class="rc-row"><span>Tid</span><b>${SH.durTxt(e.secs)}</b></div>`;
  }
  const stampHTML = iso => `<span class="st-in">${svg('check')}<span class="st-tx"><b>Sett av en vuxen</b><small>${SH.fmtStamp(iso)}</small></span></span>`;
  function enterDone(){
    leave(); S.screen = 'done';
    const e = PS.receipt;
    root().innerHTML = `
      ${styleTag()}
      ${headerHtml('Övningspass', 'start')}
      <div class="wrap ck2" id="ck-done">
        <div class="dn-head"><span class="dn-star">${svg('star')}</span><h2>Du är klar!</h2><p>${SH.praiseFor(e.pct)}</p></div>
        <div class="card receipt" id="ck-rc">${receiptHTML(e)}<div class="rc-foot"><span class="slot-ph" id="ck-rcPh">Plats för en vuxens stämpel</span><div class="stamp" id="ck-rcStamp"></div></div></div>
        <div class="grow"></div>
        <p class="dn-ask" id="ck-dnAsk">Visa kvittot för en vuxen.</p>
        <button class="hold" id="ck-hold" aria-label="Sett av en vuxen. Håll inne en och en halv sekund."><i class="hold-fill"></i><span class="hold-t">${svg('hand')}Håll inne: Sett av en vuxen</span></button>
        <button class="btn btn-secondary" data-act="hub" style="min-height:48px">${svg('stairs')} Till trappan</button>
      </div>`;
    const P = PS;
    SH.bindHold($('hold'), {
      ms:1500,
      canStart:() => !!(P.receipt && !P.receipt.seen),
      onDone:() => {
        if (!P.receipt || P.receipt.seen) return;
        const iso = new Date().toISOString();
        P.receipt.seen = iso;
        if (P.logId) updateLogEntry(P.logId, { seen:iso });
        const st = $('rcStamp'); if (!st) return;
        st.innerHTML = stampHTML(iso); st.classList.add('on');
        $('rcPh').classList.add('off');
        const h = $('hold'); h.classList.add('done'); h.disabled = true;
        h.innerHTML = `<span class="hold-t">${svg('check')}Kvittot är stämplat</span>`;
        $('dnAsk').textContent = 'Snyggt! Nu finns kvittot i loggen.';
        snd('correct');
      },
    });
  }

  /* ══════════════════════════════════════════════════════
     STATISTIK OCH LOGG
  ══════════════════════════════════════════════════════ */
  function logRow(e, i){
    const d = new Date(e.date);
    const when = `${d.toLocaleDateString('sv-SE', { weekday:'short', day:'numeric', month:'short' })} kl. ${d.toLocaleTimeString('sv-SE', { hour:'2-digit', minute:'2-digit' })}`;
    const vCls = e.pct >= 80 ? 'c-ok' : e.pct >= 60 ? 'c-mid' : 'c-err';
    if (e.type === 'ovningspass'){
      const s = CL.stepById(e.step);
      return `<div class="history-item"><span class="history-icon">${icn('repeat')}</span><div class="history-main">
          <div class="history-title">Övningspass: ${s ? s.short : ''}</div>
          <div class="history-sub">${when} · ${CL.varvTxt((e.rounds || []).length).toLowerCase()} · ${e.correct} rätt av ${e.total} på första försöket · ${SH.durTxt(e.secs || 0)}</div>
          ${e.seen ? `<span class="ck-stampmini">${icn('check')}Sett av en vuxen · ${SH.fmtStamp(e.seen)}</span>` : ''}
        </div><span class="history-value num ${vCls}">${e.pct}%</span></div>`;
    }
    return `<div class="history-item"><span class="history-icon">${icn(e.type === 'digital' ? 'digital' : 'clock')}</span><div class="history-main">
        <div class="history-title">${e.type === 'digital' ? 'Digital' : 'Analog'} klocktest</div>
        <div class="history-sub">${when}</div>
      </div><span class="history-value num ${vCls}">${e.totalCorrect}/${e.total || 10}</span></div>`;
  }
  function showStats(){
    leave(); S.screen = 'stats';
    const B = loadBoxes(), day = today(), c = { kan:0, due:0, ovar:0, ny:0 };
    const grid = CL.STEPS.map(s => {
      const v = CL.stepViews(B, s.id, day); v.forEach(x => c[x]++);
      return `<span class="gl">${s.n}. ${s.short}</span>${v.map((x, k) => `<i class="gc ${x}" title="${s.tasks[k].key}"></i>`).join('')}`;
    }).join('');
    const log = getLog();
    root().innerHTML = `
      ${styleTag()}
      ${headerHtml('Statistik och logg', 'hub')}
      <div class="wrap ck2" id="ck-stats">
        <div class="card ck-smap">
          <span class="t">Tiderna i trappan</span>
          <div class="ck-grid">${grid}</div>
          <div class="ck-legend2"><span><i style="background:var(--kan)"></i>Kan <b>${c.kan}</b></span><span><i style="background:var(--due)"></i>Dags igen <b>${c.due}</b></span><span><i style="background:var(--ovar)"></i>Övar <b>${c.ovar}</b></span><span><i style="background:#fff;box-shadow:inset 0 0 0 1px rgba(30,58,138,.25)"></i>Ny <b>${c.ny}</b></span></div>
        </div>
        <div class="card ck-logcard">
          <div class="card-title" style="margin-bottom:6px">${icn('clock')} Logg</div>
          <div class="history-list">${log.length ? log.map(logRow).join('') : '<p style="color:var(--ink-soft);font-weight:700;text-align:center;margin:18px 0">Inga pass eller test än.</p>'}</div>
        </div>
      </div>`;
  }

  /* ══════════════════════════════════════════════════════
     LEKKLOCKAN — dragbara visare, minutkartan, dygnsperioden
  ══════════════════════════════════════════════════════ */
  let PV = null;
  function spinnersHtml(fn, withVals){
    const btn = (label, onclick, icon) => `<button class="icon-btn" aria-label="${label}" onclick="${onclick}">${icn(icon)}</button>`;
    return `
      <div class="card ck-spins">
        <div class="ck-spinrow">
          <span><b class="lab-h">Timmar</b></span>
          <span class="ck-ctrls">${btn('Minska timme', `${fn}('h',-1)`, 'minus')}${withVals ? `<span class="ck-val num" id="ctrl-h">12</span>` : ''}${btn('Öka timme', `${fn}('h',1)`, 'plus')}</span>
        </div>
        <div class="ck-spinrow">
          <span><b class="lab-m">Minuter</b></span>
          <span class="ck-ctrls">${btn('Minska minuter', `${fn}('m',-5)`, 'minus')}${withVals ? `<span class="ck-val num" id="ctrl-m">00</span>` : ''}${btn('Öka minuter', `${fn}('m',5)`, 'plus')}</span>
        </div>
      </div>`;
  }
  function renderPractice(){
    leave(); S.screen = 'play';
    root().innerHTML = `
      ${styleTag()}
      ${headerHtml('Lekklockan', 'hub')}
      <div class="wrap">
        <div class="ck-cols">
          <div class="card ck-left">
            <div class="ck-qclock" id="ck-pclock">${clockSVG()}</div>
            <div class="ck-periods" id="time-period">${CL.PERIODS.map(p => `<span class="chip" data-p="${p.id}">${p.name}</span>`).join('')}</div>
          </div>
          <div class="ck-right">
            <div class="card ck-timepanel">
              <div id="digital-display" class="ck-digi num">12:00</div>
              <p id="text-display" class="ck-svline"></p>
            </div>
            ${spinnersHtml('ClockGame.adjustTime', true)}
            <div class="ck-actions">
              <button class="icon-btn" aria-label="Slumpa tid" title="Slumpa tid" onclick="ClockGame.randomTime()">${icn('dice')}</button>
              <button class="icon-btn" aria-label="Återställ" title="Återställ" onclick="ClockGame.resetTime()">${icn('reset')}</button>
              <button class="btn btn-secondary" data-act="mapToggle" id="ck-mapBtn"></button>
            </div>
          </div>
        </div>
      </div>`;
    PV = ClockView($('pclock').querySelector('svg'), practiceT);
    PV.enableDrag(t => { practiceT = t; updateClock(true); });
    updateClock();
  }
  function updateClock(fromDrag){
    if (!PV) return;
    if (!fromDrag) PV.set(practiceT);
    const h = CL.hOf(practiceT), m = CL.mOf(practiceT);
    PV.setMap(playMap ? 1 : 0, CL.MAP_PARTS.runt);
    const d = document.getElementById('digital-display');
    if (d) d.innerHTML = colorizeTimeText(`${p2(h)}:${p2(m)}`);
    const tx = document.getElementById('text-display');
    if (tx) tx.innerHTML = `<span class="t-k">Klockan är</span> ${colorizeTimeText(CL.digitalWords(h, m))}`;
    const ch = document.getElementById('ctrl-h'), cm = document.getElementById('ctrl-m');
    if (ch) ch.textContent = p2(h);
    if (cm) cm.textContent = p2(m);
    const per = document.getElementById('time-period');
    if (per) per.querySelectorAll('.chip').forEach(c => c.classList.toggle('chip-active', c.dataset.p === CL.periodOf(h).id));
    const mb = $('mapBtn');
    if (mb) mb.innerHTML = `${icn('map')} ${playMap ? 'Dölj minutkartan' : 'Visa minutkartan'}`;
  }
  function adjustTime(part, delta){
    practiceT = CL.norm(practiceT + (part === 'h' ? delta * 60 : delta));
    snd('click'); updateClock();
  }
  function resetTime(){ practiceT = CL.toTot(12, 0); snd('click'); updateClock(); }
  function randomTime(){ practiceT = CL.toTot(Math.floor(Math.random() * 24), Math.floor(Math.random() * 12) * 5); snd('click'); updateClock(); }

  /* ══════════════════════════════════════════════════════
     KLOCKTESTET (ett litet val): 5 läsfrågor + 5 ställfrågor.
     v63: de riktade felalternativen och lottad ordning; analog
     ställs genom att dra visarna (plus/minus finns kvar).
  ══════════════════════════════════════════════════════ */
  function showTestSetup(){
    leave(); S.screen = 'testSetup';
    snd('click');
    root().innerHTML = `
      ${styleTag()}
      ${headerHtml('Välj klocktest', 'hub')}
      <div class="wrap vcenter ck-choice-wrap">
        <svg class="icn ck-hero" viewBox="0 0 24 24">${ICON.clock}</svg>
        <h2 class="ck-choice-title">Vilket test vill du göra?</h2>
        <div class="ck-choice">
          <button class="game-card game-card-wide" onclick="ClockGame.startTestWithType('analog')">
            <svg class="icn ck-gi" viewBox="0 0 24 24">${ICON.clock}</svg>
            <div><h3>Analog klocka</h3><p>Urtavla med visare</p></div>
            <svg class="icn ck-chev" viewBox="0 0 24 24">${ICON.fwd}</svg>
          </button>
          <button class="game-card game-card-wide" onclick="ClockGame.startTestWithType('digital')">
            <svg class="icn ck-gi" viewBox="0 0 24 24">${ICON.digital}</svg>
            <div><h3>Digital klocka</h3><p>24-timmars format</p></div>
            <svg class="icn ck-chev" viewBox="0 0 24 24">${ICON.fwd}</svg>
          </button>
        </div>
      </div>`;
  }
  function startTestWithType(type){
    clockType = type;
    snd('click');
    runReadingTest(type, generateQuestions(type, 5), generateQuestions(type, 5));
  }
  /* Slumpa frågetider (fem-minutersintervall). Digital: 0–23. Analog: 1–12. */
  function generateQuestions(type, count){
    const qs = [];
    for (let i = 0; i < count; i++){
      const h = type === 'digital' ? Math.floor(Math.random() * 24) : Math.floor(Math.random() * 12) + 1;
      qs.push({ h, m:Math.floor(Math.random() * 12) * 5 });
    }
    return qs;
  }
  const testTask = (type, q) => type === 'digital' ? { kind:'digital', h:q.h, m:q.m } : { kind:'time', h:q.h, m:q.m };
  const testText = (type, q) => type === 'digital' ? CL.digitalWords(q.h, q.m) : CL.words(q.h, q.m);
  function runReadingTest(type, questions, settingQuestions){
    const TOTAL = questions.length, quiz = SH.createRetryQuiz(questions), results = [], firstTried = new Set();
    function render(){
      const q = quiz.current();
      if (q === null){ runSettingTest(type, results, settingQuestions); return; }
      const options = CL.readOptions(testTask(type, q));    // riktade fel, ordningen lottad vid varje visning
      const prog = quiz.progress();
      root().innerHTML = `
        ${styleTag()}
        ${headerHtml('Del 1 · Läsa klockan', 'ClockGame.showTestSetup()', { backLabel:'Avbryt', progress:{ n:Math.min(prog.answered + 1, TOTAL), total:TOTAL, pct:Math.round(prog.answered / TOTAL * 100) } })}
        <div class="wrap">
          <div class="ck-quiz">
            <div class="ck-qpanel card">
              <p class="ck-qlabel">Vad visar klockan?</p>
              ${type === 'analog' ? `<div class="ck-qclock" id="ck-tclock">${clockSVG()}</div>` : `<div class="ck-digibox num">${colorizeTimeText(`${p2(q.h)}:${p2(q.m)}`)}</div>`}
            </div>
            <div class="ck-topts">
              ${options.map((o, i) => `<button class="answer-option" id="opt-${i}" onclick="ClockGame._handleReadChoice(${i})">${colorizeTimeText(o.text)}</button>`).join('')}
            </div>
          </div>
        </div>`;
      if (type === 'analog') ClockView($('tclock').querySelector('svg'), CL.toTot(q.h, q.m));
      let locked = false;
      ClockGame._handleReadChoice = idx => {
        if (locked) return; locked = true;
        const chosen = options[idx], wasCorrect = chosen.ok;
        snd(wasCorrect ? 'correct' : 'wrong');
        document.querySelectorAll('#clock-root .answer-option').forEach((btn, i) => {
          btn.disabled = true;
          if (options[i].ok) btn.classList.add('correct');
          if (i === idx && !wasCorrect) btn.classList.add('wrong');
        });
        if (!firstTried.has(q)){ firstTried.add(q); results.push({ h:q.h, m:q.m, chosen:chosen.text, correct:wasCorrect }); }
        quiz.answer(wasCorrect);
        setTimeout(render, wasCorrect ? 700 : 1400);
      };
    }
    render();
  }
  function runSettingTest(type, part1Results, questions){
    const TOTAL = questions.length, quiz = SH.createRetryQuiz(questions), results = [], firstTried = new Set();
    let settingT = CL.toTot(12, 0), TV = null;
    function drawDigital(){ const el = document.getElementById('digital-setting-display'); if (el) el.innerHTML = colorizeTimeText(`${p2(CL.hOf(settingT))}:${p2(CL.mOf(settingT))}`); }
    function render(){
      const q = quiz.current();
      if (q === null){ showTestResult(type, part1Results, results); return; }
      settingT = CL.toTot(12, 0);
      const prog = quiz.progress();
      root().innerHTML = `
        ${styleTag()}
        ${headerHtml('Del 2 · Ställ klockan', 'ClockGame.showTestSetup()', { backLabel:'Avbryt', progress:{ n:Math.min(prog.answered + 1, TOTAL) + 5, total:10, pct:Math.round((5 + prog.answered) * 10) } })}
        <div class="wrap">
          <div class="ck-quiz">
            <div class="ck-qpanel card">
              <p class="ck-qlabel">Ställ klockan till:</p>
              <div class="ck-digibox ck-target">${colorizeTimeText(testText(type, q))}</div>
              ${type === 'analog' ? `<p class="ck-facit" id="ck-facit" style="visibility:hidden">Rätt svar:</p><div class="ck-qclock" id="ck-tclock">${clockSVG()}</div>`
                : `<div id="digital-setting-wrap"><div id="digital-setting-display" class="ck-digibox num"></div></div>`}
            </div>
            <div class="ck-setctrl">
              ${spinnersHtml('ClockGame._adjustSetting', false)}
              <button class="btn btn-primary btn-lg" onclick="ClockGame._lockSetting()">Lås svar ${icn('check')}</button>
            </div>
          </div>
        </div>`;
      if (type === 'analog'){ TV = ClockView($('tclock').querySelector('svg'), settingT); TV.enableDrag(t => { settingT = t; }); }
      else drawDigital();
      ClockGame._adjustSetting = (part, delta) => {
        settingT = CL.norm(settingT + (part === 'h' ? delta * 60 : delta));
        snd('click');
        if (TV) TV.set(settingT); else drawDigital();
      };
      let lockGuard = false;
      ClockGame._lockSetting = () => {
        if (lockGuard) return; lockGuard = true;
        const sh = CL.hOf(settingT), sm = CL.mOf(settingT);
        // Analog: urtavlan skiljer inte på fm/em. Digital: tiden står med dygnsdelen, så timmen ska stämma exakt.
        const wasCorrect = type === 'digital' ? (sh === q.h && sm === q.m) : CL.sameOnDial(settingT, CL.toTot(q.h, q.m));
        snd(wasCorrect ? 'correct' : 'wrong');
        if (!firstTried.has(q)){ firstTried.add(q); results.push({ h:q.h, m:q.m, setH:sh, setM:sm, correct:wasCorrect }); }
        quiz.answer(wasCorrect);
        if (!wasCorrect){
          if (TV){ TV.disableDrag(); $('facit').style.visibility = ''; TV.animateTo(nearest(settingT, CL.toTot(q.h, q.m)), 900); }
          else { settingT = CL.toTot(q.h, q.m); const w = document.getElementById('digital-setting-wrap'); w.insertAdjacentHTML('afterbegin', '<p class="ck-facit">Rätt svar:</p>'); drawDigital(); }
          setTimeout(render, 1800);
        } else setTimeout(render, 700);
      };
    }
    render();
  }
  function showTestResult(type, part1, part2){
    leave(); S.screen = 'testResult';
    const totalCorrect = part1.filter(r => r.correct).length + part2.filter(r => r.correct).length, total = 10;
    const pct = Math.round(totalCorrect / total * 100);
    snd(pct >= 80 ? 'fanfare' : 'correct');
    if (pct === 100) confetti(80);
    addLog({ type:clockType, totalCorrect, total, pct, part1, part2 });
    const { emoji, msg } = SH.feedbackMessage(pct);
    root().innerHTML = `
      ${styleTag()}
      ${headerHtml('Resultat', 'hub')}
      <div class="wrap">
        <div class="ck-result">
          <div class="result-hero">
            <div class="result-pct num">${pct}%</div>
            <div class="result-medal">${emoji}</div>
            <div class="result-msg">${msg}</div>
            <div class="result-note">${totalCorrect} av ${total} rätt · ${type === 'analog' ? 'Analog' : 'Digital'} klocka</div>
            <div class="result-actions">
              <button class="btn btn-primary" onclick="ClockGame.startTestWithType('${type}')">Spela igen ${icn('reset')}</button>
              <button class="btn btn-ghost" data-act="hub">Till trappan</button>
            </div>
          </div>
          <div class="card ck-detail">
            <div class="card-title">${icn('stats')} Detaljresultat</div>
            <div class="ck-sec">Del 1 · Läsa klockan</div>
            ${part1.slice(0, 5).map(r => `<div class="stat-row"><span class="num">${colorizeTimeText(`${p2(r.h)}:${p2(r.m)}`)}</span><span class="${r.correct ? 'c-ok' : 'c-err'}">${r.correct ? '✓' : '✗'} ${colorizeTimeText(testText(type, r))}</span></div>`).join('')}
            <div class="ck-sec">Del 2 · Ställa klockan</div>
            ${part2.slice(0, 5).map(r => `<div class="stat-row"><span>${colorizeTimeText(testText(type, r))}</span><span class="${r.correct ? 'c-ok' : 'c-err'}">${r.correct ? '✓ Rätt' : `✗ ${colorizeTimeText(`${p2(r.setH)}:${p2(r.setM)}`)}`}</span></div>`).join('')}
          </div>
        </div>
      </div>`;
    // Capybara-samlingen (v34): ren sidoeffekt EFTER resultat/logg – får aldrig kasta
    try { if (window.Capy) Capy.award(profile, { type:'test', data:{ module:'clock', pct } }); } catch (_) {}
  }

  /* ── Publik API ────────────────────────────────────── */
  return {
    init,
    renderHub:enterHub,
    renderPractice,
    adjustTime, resetTime, randomTime,
    showTestSetup, startTestWithType,
    showHistory:showStats,
    _handleReadChoice:null, _adjustSetting:null, _lockSetting:null,
    /* Endast för tester och verifiering */
    _test:{
      colorizeTimeText, clockSVG, tint, fmtText,
      setToday:d => { todayOverride = d || null; }, today,
      peek:() => ({ screen:S.screen, step:S.step, busy, pass:PS, lesson:LS, token }),
    },
  };
})();

/* CJS-export för vitest (samma mönster som shared.js) */
if (typeof module !== 'undefined' && module.exports) module.exports = ClockGame;
