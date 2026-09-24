/* ============================================================
   MULTIPLAY – Gångertabellen
   Modulen renderar sig i #mult-root.
   Hubben (tabellkartan, Lär dig strategin, Öva, Rekordrunda) är
   design-lab/gangertabell-mockup.html fört in i appen: mockupens
   CSS, texter, stegordning och animationer är specen.
   v58: hubben har en kompakt karta, övningspasset (nötloopen i varv
   med kvitto för en vuxen), tre mindre ingångar och Statistik/Logg.
   Eget matteprov är borttaget; övningspasset med flera tabeller ersätter det.
   v60: kartan visar bara framstegen (mindre rutor, ingen lektion, inga
   radknappar). Under den: Träna en tabell (snabbval 1–10, Extra 11–12,
   medaljer på lådorna) → startskärm → passet; varvraden; tre ingångar.
   "Så krymper tabellen" är lektionen "Tabellen är mindre än du tror" i
   Lär dig strategin, på en egen neutral karta.
   v62: De svåra talen – de 21 paren i {3, 4, 6, 7, 8, 9} som lektionen
   lämnar kvar. Kort på hemvyn → startskärm (6 × 6-karta, Alla 21 eller
   bara de som inte sitter än) → samma övningspass, med en parlista.
   Lila magi-temat sätts automatiskt via #mult-root i app.css.
   ============================================================ */
'use strict';

const MultGame = (() => {

  /* Delad logik (js/shared.js): i appen den globala MP, i vitest via require */
  const SH = (typeof MP !== 'undefined' && MP) || require('./shared.js');
  const SP = SH.spaced;                                  // lådorna och påfyllningen (v63: delas med Klockan)

  /* ── Tillstånd ─────────────────────────────────────── */
  let profile      = null;
  let answerMode   = 'choice';   // 'choice' | 'free'  (inställningen "Svar": Val / Fri)

  /* ── Modulspecifik CSS för frågesessionen, Statistik och Logg ── */
  const MULT_CSS = `
    #mult-root .mult-gap{gap:12px}
    #mult-root .mult-spacer{width:52px;flex:0 0 auto}
    #mult-root .mult-hdr-actions{display:flex;gap:8px;align-items:center;flex:0 0 auto}
    #mult-root .app-header .header-title{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #mult-root .mult-sub{text-align:center;color:var(--ink-soft);font-weight:700;font-size:14px}

    /* Tabellrutnät (Statistik) */
    #mult-root .tables-panel{flex:1;min-height:0;display:flex;flex-direction:column}
    #mult-root .tgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;flex:1;align-content:space-evenly}
    #mult-root .mult-tbar{display:block;height:5px;border-radius:999px;background:rgba(93,63,158,.12);margin-top:7px;overflow:hidden}
    #mult-root .mult-tbar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--accent),var(--accent-2))}
    @media (min-width:700px){
      #mult-root .tgrid .table-card{min-height:118px}
    }
    @media (max-width:430px){
      #mult-root .tgrid{grid-template-columns:repeat(4,1fr);gap:8px}
    }

    /* Quiz-vyer (fokuserad träning) */
    #mult-root .header-progress{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:64px;padding:8px 13px;border-radius:999px;background:var(--glass-strong);border:1px solid var(--glass-line);box-shadow:var(--shadow-panel);font-family:var(--font-head);font-weight:800;font-size:15px;line-height:1;color:var(--deep);flex:0 0 auto}
    #mult-root .header-progress .hp-bar{width:100%;min-width:40px;height:4px;border-radius:999px;background:rgba(93,63,158,.15);overflow:hidden}
    #mult-root .header-progress .hp-bar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--accent),var(--accent-2));transition:width .4s var(--spring)}
    #mult-root .mq-main{flex:1;min-height:0;display:flex;flex-direction:column;gap:clamp(12px,2vh,20px);width:100%;max-width:720px;margin:0 auto}
    #mult-root .q-hero.mq-qcard{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:clamp(4px,1vh,12px);padding:clamp(12px,3vh,30px) 18px}
    #mult-root .mq-task{font-family:var(--font-head);font-weight:800;font-size:clamp(44px,min(14vh,19vw),120px);line-height:1;color:var(--deep);letter-spacing:2px}
    #mult-root .mq-x{color:var(--accent-2);margin:0 .18em}
    #mult-root .mq-eq{color:var(--accent);opacity:.85}
    #mult-root .mq-hint{color:var(--ink-soft);font-weight:800;font-size:clamp(13px,1.9vh,16px);text-transform:uppercase;letter-spacing:.08em}
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
    #mult-root .history-icon svg{width:22px;height:22px;color:var(--accent)}
    #mult-root .history-icon svg.icn{fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
    #mult-root .mult-stamp{display:inline-flex;align-items:center;gap:5px;margin-top:5px;padding:2px 9px 2px 6px;border:2px solid #16a34a;border-radius:8px;
      color:#15803d;font-size:11.5px;font-weight:900;white-space:nowrap;transform:rotate(-2deg);background:rgba(220,252,231,.6)}
    #mult-root .mult-stamp svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}

    /* Modal-innehåll (modalen ligger på body – därför oprefixat) */
    .mult-modal-emoji{font-size:3.2rem;text-align:center;margin-bottom:8px}
    .mult-modal-txt{color:var(--ink-soft);font-weight:700;text-align:center;margin:6px 0 16px}
    .mult-modal-stack{display:flex;flex-direction:column;gap:10px}
    .mult-modal-row{display:flex;gap:10px}
    .mult-modal-row .btn{flex:1}
  `;

  /* ── Gångertabellens hubb och övningar: mockupens CSS, scopad under .gt ──
     Klassnamnen är mockupens (design-lab/gangertabell-mockup.html) utom
     .screen/.screens som heter .gscr/.gscrs här (app.css äger .screen),
     och keyframes som fått prefixet gt-. */
  const GT_CSS = `
    #mult-root .gt{--kan:#2fbf68;--due:#bfead0;--ovar:#fbbf24;--ny:#ffffff;--pA:#3b82f6;--pB:#f97316;
      flex:1;min-height:0;display:flex;flex-direction:column;width:100%;max-width:440px;margin:0 auto;position:relative}
    #mult-root .gt svg.i{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;display:inline-block}
    #mult-root .gt .card:hover{box-shadow:var(--shadow-panel)}
    #mult-root .gt .btn-primary:hover{transform:none;box-shadow:0 8px 22px var(--glow),inset 0 1px 0 rgba(255,255,255,.35)}
    #mult-root .gt-hdr .icon-btn svg{width:22px;height:22px}
    #mult-root .gt-hdr .btn-back{min-height:44px}
    #mult-root .gcap{display:none;align-items:center;min-height:36px;padding:0 13px;border-radius:999px;background:var(--glass-strong);border:1px solid var(--glass-line);
      box-shadow:var(--shadow-panel);font-family:var(--font-head);font-weight:800;font-size:15px;color:var(--deep);white-space:nowrap}
    #mult-root .gcap.on{display:inline-flex}

    /* Hubbens diskreta rad: det som finns kvar från förr */
    #mult-root .gt .hubmore{display:flex;justify-content:center;gap:4px;height:44px;margin-top:8px;flex-shrink:0}
    #mult-root .gt .mlink{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 12px;border-radius:999px;font-size:13.5px;font-weight:800;color:var(--ink-soft);transition:background-color .2s}
    #mult-root .gt .mlink svg.i{width:17px;height:17px}
    #mult-root .gt .mlink:active{background:rgba(255,255,255,.7)}
    #mult-root .gt .refill{display:flex;justify-content:center;align-items:center;gap:6px;height:18px;font-size:12.5px;font-weight:800;color:var(--ink-soft)}
    #mult-root .gt .refill i{display:inline-block;width:12px;height:12px;border-radius:4px;background:var(--due);box-shadow:inset 0 0 0 1px rgba(47,191,104,.35)}
    #mult-root .gt .legend .sw-due{background:var(--due);box-shadow:inset 0 0 0 1px rgba(47,191,104,.35)}

    /* Inställningsarket (kugghjulet i headern) */
    #mult-root .gsheet{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;justify-content:flex-end;pointer-events:none}
    #mult-root .gsheet .gsh-bg{position:absolute;inset:0;background:rgba(59,29,110,.38);opacity:0;transition:opacity .3s var(--smooth)}
    #mult-root .gsheet .gsh-panel{position:relative;width:100%;max-width:440px;margin:0 auto;background:#fcfaff;border-radius:26px 26px 0 0;
      padding:14px 16px calc(16px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:12px;box-shadow:0 -10px 34px rgba(93,63,158,.18);
      transform:translateY(105%);transition:transform .38s var(--smooth)}
    #mult-root .gsheet.on{pointer-events:auto}
    #mult-root .gsheet.on .gsh-bg{opacity:1}
    #mult-root .gsheet.on .gsh-panel{transform:none}
    #mult-root .gsh-head{display:flex;align-items:center;justify-content:space-between;min-height:44px}
    #mult-root .gsh-head b{font-family:var(--font-head);font-weight:800;font-size:21px;color:var(--deep)}
    #mult-root .gsh-x{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;color:var(--deep);background:var(--glass-strong);border:1px solid rgba(76,29,149,.12)}
    #mult-root .gsh-x svg.i{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
    #mult-root .gsh-row{display:flex;flex-direction:column;gap:5px}
    #mult-root .gsh-lab{display:flex;flex-direction:column;line-height:1.2}
    #mult-root .gsh-lab b{font-weight:900;font-size:15px;color:var(--ink)}
    #mult-root .gsh-lab small{font-weight:700;font-size:12.5px;color:var(--ink-soft)}
    #mult-root .gsh-tg{display:grid;grid-template-columns:1fr 1fr;gap:4px;background:rgba(76,29,149,.07);border-radius:999px;padding:3px}
    #mult-root .gsh-tg button{min-height:44px;border-radius:999px;font-weight:800;font-size:15px;color:var(--ink-soft);transition:background-color .2s,color .2s}
    #mult-root .gsh-tg button.on{background:#fff;color:var(--deep);box-shadow:0 2px 8px rgba(76,29,149,.14)}
    #mult-root .gsh-tg button small{display:block;font-size:11px;font-weight:700;opacity:.75;line-height:1.1}
    #mult-root .gsh-tg button{line-height:1.1;padding:0 4px}
    #mult-root .gsh-done{display:inline-flex;align-items:center;justify-content:center;min-height:52px;border-radius:999px;font-size:16px;font-weight:800;color:#fff;
      background:linear-gradient(135deg,var(--accent),var(--accent-light));box-shadow:0 8px 22px var(--glow),inset 0 1px 0 rgba(255,255,255,.35)}

    /* Skärmar */
    #mult-root .gt .gscrs{flex:1;min-height:0;position:relative}
    #mult-root .gt .gscr{position:absolute;inset:0;display:none;flex-direction:column;gap:6px}
    #mult-root .gt .gscr.on{display:flex;animation:gt-scrin .32s var(--smooth) both}
    #mult-root .gt .card{background:var(--glass-strong);border-radius:var(--radius-lg);border:1px solid var(--glass-line);box-shadow:var(--shadow-panel)}
    #mult-root .gt .grow{flex:1;min-height:0}

    /* Knappar */
    #mult-root .gt .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:12px 24px;border-radius:var(--radius-full);
      font-size:16px;font-weight:800;line-height:1;white-space:nowrap;user-select:none;width:100%;
      transition:transform .25s var(--spring),box-shadow .25s var(--smooth),opacity .15s}
    #mult-root .gt .btn-primary{background:linear-gradient(135deg,var(--accent),var(--accent-light));color:#fff;box-shadow:0 8px 22px var(--glow),inset 0 1px 0 rgba(255,255,255,.35)}
    #mult-root .gt .btn-sec{background:var(--glass-strong);border:1.5px solid color-mix(in srgb,var(--accent) 28%,transparent);color:var(--deep);box-shadow:var(--shadow-panel)}
    #mult-root .gt .btn:active:not(:disabled){transform:scale(.96)}
    #mult-root .gt .btn:disabled{opacity:.42;box-shadow:none}
    #mult-root .gt .btn-pill{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 14px;border-radius:999px;background:var(--glass-strong);
      border:1.5px solid color-mix(in srgb,var(--accent) 26%,transparent);color:var(--deep);font-weight:800;font-size:14px;white-space:nowrap;
      transition:transform .25s var(--spring)}
    #mult-root .gt .btn-pill svg{width:18px;height:18px}
    #mult-root .gt .btn-pill:active{transform:scale(.96)}
    #mult-root .gt .slot{height:52px;flex-shrink:0;display:flex}
    #mult-root .gt .choice{display:none;gap:8px;width:100%}
    #mult-root .gt .choice .btn{flex:1;padding:0 10px;font-size:15px;white-space:normal;line-height:1.15}
    #mult-root .gt .slot.choosing .choice{display:flex}
    #mult-root .gt .slot.choosing > .btn{display:none}

    /* Bubblan — fast höjd, knappen står still */
    #mult-root .gt .bubble{flex-shrink:0;display:flex}
    #mult-root .gt .b92{height:92px}
    #mult-root .gt .b76{height:76px}
    #mult-root .gt .thought{flex:1;background:#fff;border-radius:var(--radius-md);padding:8px 14px;box-shadow:var(--shadow-panel);font-weight:800;color:var(--ink);
      font-size:16px;line-height:1.4;border:2px solid color-mix(in srgb,var(--accent) 18%,transparent);display:flex;flex-direction:column;justify-content:center;gap:2px;overflow:hidden}
    #mult-root .gt .thought.pop{animation:gt-bubblein .3s var(--spring)}
    #mult-root .gt .thought .sm{font-size:13.5px;color:#64748b}

    /* ── Tabellkartan ─────────────────────────────── */
    #mult-root .gt .mapcard{padding:10px 12px;flex-shrink:0;display:flex;flex-direction:column;gap:8px}
    #mult-root .gt .maphead{display:flex;align-items:center;justify-content:space-between;height:44px;gap:8px}
    #mult-root .gt .mhl{display:flex;align-items:center;gap:8px;line-height:1}
    #mult-root .gt .mhl b{font-family:var(--font-head);font-weight:800;font-size:36px;color:var(--deep);display:inline-block;line-height:.9}
    #mult-root .gt .mhl b.pop{animation:gt-pop .5s var(--spring)}
    #mult-root .gt .mhl span{font-weight:800;font-size:13.5px;color:var(--ink-soft);line-height:1.15}
    #mult-root .gt .map{display:grid;grid-template-columns:repeat(13,24px);grid-auto-rows:24px;gap:2px;justify-content:center;position:relative}
    #mult-root .gt .mh{display:grid;place-items:center;font-size:10.5px;font-weight:900;color:var(--ink-soft);transition:opacity .4s var(--smooth)}
    #mult-root .gt .mh.x{color:var(--accent)}
    #mult-root .gt .mh.dim{opacity:.22}
    #mult-root .gt .mc{position:relative;border-radius:6px;background:var(--ny);box-shadow:inset 0 0 0 1px rgba(76,29,149,.16);
      transition:opacity .45s var(--smooth),transform .5s var(--smooth)}
    #mult-root .gt .mc.kan{background:var(--kan);box-shadow:none}
    #mult-root .gt .mc.ovar{background:var(--ovar);box-shadow:none}
    #mult-root .gt .mc.due{background:var(--due);box-shadow:inset 0 0 0 1px rgba(47,191,104,.35)}
    #mult-root .gt .mc::before{content:'';position:absolute;inset:0;border-radius:inherit;background:#e4d7fb;opacity:0;transition:opacity .45s var(--smooth)}
    #mult-root .gt .map.neutral .mc::before{opacity:1}
    #mult-root .gt .mc::after{content:'';position:absolute;inset:-2px;border-radius:8px;border:2px solid var(--accent);opacity:0;transition:opacity .25s}
    #mult-root .gt .mc.mark{transform:scale(.8)}
    #mult-root .gt .mc.mark::after{opacity:1}
    #mult-root .gt .mc.gone{opacity:.1;transform:scale(.55)}
    #mult-root .gt .mc.fly{transition:transform .75s var(--smooth),opacity .3s .5s}
    #mult-root .gt .mc.flown{opacity:0}
    #mult-root .gt .mc.twin{animation:gt-twin .75s var(--spring)}
    #mult-root .gt .mc.glow{animation:gt-twin .8s ease-in-out}
    #mult-root .gt .mc .nf{position:absolute;inset:0;border-radius:inherit;opacity:0;transition:opacity .6s var(--smooth)}
    #mult-root .gt .mc .nf.on{opacity:1}
    #mult-root .gt .mc.chg{animation:gt-chg .8s var(--spring)}
    #mult-root .gt .mc.chg::after{animation:gt-ring .9s var(--smooth)}
    #mult-root .gt .legend{display:flex;justify-content:center;align-items:center;gap:11px;height:20px;font-size:12.5px;font-weight:800;color:var(--ink-soft)}
    #mult-root .gt .legend i{display:inline-block;width:12px;height:12px;border-radius:4px;margin-right:5px;vertical-align:-1px}
    #mult-root .gt .legend .sw-ny{background:#fff;box-shadow:inset 0 0 0 1px rgba(76,29,149,.25)}
    #mult-root .gt .legend b{font-family:var(--font-head);font-size:16px;color:var(--deep)}
    #mult-root .gt .legend b.pop{display:inline-block;animation:gt-pop .5s var(--spring)}


    /* ── Lär dig strategin ────────────────────────── */
    #mult-root .gt .seg{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;flex-shrink:0}
    #mult-root .gt .seg button{min-height:44px;border-radius:14px;background:var(--glass-strong);border:1.5px solid color-mix(in srgb,var(--accent) 20%,transparent);
      font-family:var(--font-head);font-weight:800;font-size:16px;color:var(--deep);transition:transform .2s var(--spring)}
    #mult-root .gt .seg button.on{background:linear-gradient(135deg,var(--accent),var(--accent-light));color:#fff;border-color:transparent;box-shadow:0 5px 14px var(--glow)}
    #mult-root .gt .seg button:active{transform:scale(.95)}
    #mult-root .gt .stepper{display:flex;align-items:center;justify-content:space-between;height:48px;flex-shrink:0;padding:0 2px}
    #mult-root .gt .stp{width:48px;height:48px;border-radius:50%;background:var(--glass-strong);border:1.5px solid color-mix(in srgb,var(--accent) 24%,transparent);
      display:grid;place-items:center;color:var(--deep);box-shadow:var(--shadow-panel);transition:transform .2s var(--spring),opacity .15s}
    #mult-root .gt .stp:active:not(:disabled){transform:scale(.92)}
    #mult-root .gt .stp:disabled{opacity:.3;box-shadow:none}
    #mult-root .gt .steq{font-family:var(--font-head);font-weight:800;font-size:32px;color:var(--deep);line-height:1}
    #mult-root .gt .steq .x,#mult-root .gt .qbig .x,#mult-root .gt .oq .x{color:var(--accent-2);margin:0 .14em}
    #mult-root .gt .rectcard{flex:1;min-height:0;padding:12px;display:flex}

    /* Prickrektangeln */
    #mult-root .gt .rhost{position:relative;flex:1;min-height:0}
    #mult-root .gt .rgrid{position:absolute;transition:transform .85s var(--smooth)}
    #mult-root .gt .dot{position:absolute;border-radius:50%;background:#cdbdf3;opacity:0;
      transition:opacity .45s var(--smooth),background-color .4s var(--smooth),box-shadow .4s,transform .45s var(--spring)}
    #mult-root .gt .dot.on{opacity:1}
    #mult-root .gt .dot.A{background:var(--pA)}
    #mult-root .gt .dot.B{background:var(--pB)}
    #mult-root .gt .dot.ex{background:#fff;box-shadow:inset 0 0 0 2px var(--pB)}
    #mult-root .gt .dot.ex.A{background:var(--pA);box-shadow:none}
    #mult-root .gt .dot.on.dim{opacity:.16}
    #mult-root .gt .rline{position:absolute;height:3px;border-radius:2px;background:var(--deep);transform:scaleX(0);transform-origin:left center;transition:transform .5s var(--smooth)}
    #mult-root .gt .rline.on{transform:scaleX(1)}
    #mult-root .gt .rstrike{position:absolute;height:3px;border-radius:2px;background:#dc2626;transform:scaleX(0);transform-origin:left center;transition:transform .45s var(--smooth),opacity .35s}
    #mult-root .gt .rstrike.on{transform:scaleX(1)}
    #mult-root .gt .rmargin{position:absolute;transition:opacity .35s var(--smooth)}
    #mult-root .gt .rmargin.fade{opacity:0}
    #mult-root .gt .rbrace{position:absolute;width:3px;border-radius:2px;transition:background-color .4s}
    #mult-root .gt .rchip{position:absolute;display:inline-flex;align-items:center;height:var(--ch,24px);padding:0 8px;border-radius:999px;font-family:var(--font-head);font-weight:800;
      font-size:var(--cf,14px);color:#fff;white-space:nowrap;background:var(--c);box-shadow:0 5px 14px color-mix(in srgb,var(--c) 38%,transparent);
      transition:background-color .4s,box-shadow .4s}
    #mult-root .gt .rchip.in{animation:gt-chipin .45s var(--spring) both}
    #mult-root .gt .rresult{position:absolute;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:6px;font-family:var(--font-head);font-weight:800;
      font-size:21px;color:var(--deep);opacity:0;transition:opacity .35s}
    #mult-root .gt .rresult.on{opacity:1}
    #mult-root .gt .rresult.on span.in{display:inline-block;animation:gt-pop .5s var(--spring)}
    #mult-root .gt .cA{color:var(--pA)}
    #mult-root .gt .cB{color:var(--pB)}

    /* ── Öva / Rekordrunda ────────────────────────── */
    #mult-root .gt .pdots{height:20px;flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:7px}
    #mult-root .gt .pd{width:10px;height:10px;border-radius:50%;background:rgba(76,29,149,.16);transition:transform .3s var(--spring),background-color .3s}
    #mult-root .gt .pd.intro{border-radius:3px;transform:rotate(45deg) scale(.9)}
    #mult-root .gt .pd.ok{background:var(--kan)}
    #mult-root .gt .pd.bad{background:#ef4444}
    /* Aktuell prick: storlek + ring. Fyllningen visar bara "obesvarad" – ett svar (rött/grönt) syns alltid */
    #mult-root .gt .pd.cur{transform:scale(1.45);box-shadow:0 0 0 1.5px #fff,0 0 0 3px var(--accent)}
    #mult-root .gt .pd.cur:not(.ok):not(.bad){background:var(--accent)}
    #mult-root .gt .pd.intro.cur{transform:rotate(45deg) scale(1.3)}
    #mult-root .gt .pd.re{box-shadow:0 0 0 2px #fca5a5}
    #mult-root .gt .pd.re.cur{box-shadow:0 0 0 1.5px #fff,0 0 0 3px var(--accent)}
    #mult-root .gt .pmain{flex:1;min-height:0;position:relative;display:flex;flex-direction:column;gap:6px}
    #mult-root .gt .stage{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;position:relative}
    #mult-root .gt .qtag{height:24px;padding:0 11px;border-radius:999px;background:var(--tint);color:var(--accent);font-size:12.5px;font-weight:900;display:inline-flex;align-items:center;visibility:hidden}
    #mult-root .gt .qtag.on{visibility:visible}
    #mult-root .gt .qbig{font-family:var(--font-head);font-weight:800;font-size:64px;line-height:1;color:var(--deep);letter-spacing:1px;text-align:center}
    #mult-root .gt .qbig .qa{color:var(--accent)}
    #mult-root .gt .qbig .rq{display:block;font-size:17px;letter-spacing:0;color:var(--ink-soft);margin-bottom:6px;font-family:var(--font-body);font-weight:800}
    #mult-root .gt .qbig.swap{animation:gt-swapin .35s var(--smooth)}
    #mult-root .gt .qbig .rbig{display:block;font-size:72px}
    #mult-root .gt .qbig .rsub{display:block;font-size:17px;letter-spacing:0;color:var(--ink-soft);font-family:var(--font-body);font-weight:800;margin-top:4px}
    #mult-root .gt .ctrl{height:258px;flex-shrink:0;transition:opacity .25s}
    #mult-root .gt .ctrl.off{opacity:.35;pointer-events:none}
    #mult-root .gt .opts{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:10px;height:100%}
    #mult-root .gt .opt{border-radius:24px;font-family:var(--font-head);font-weight:800;font-size:40px;background:var(--glass-strong);color:var(--deep);
      border:2px solid color-mix(in srgb,var(--accent) 22%,transparent);box-shadow:var(--shadow-panel);transition:transform .2s var(--spring),background-color .25s,border-color .25s}
    #mult-root .gt .opt.pair{font-size:30px}
    #mult-root .gt .opt:active{transform:scale(.96)}
    #mult-root .gt .opt.ok{background:#dcfce7;border-color:#22c55e;color:#15803d}
    #mult-root .gt .opt.bad{background:#fee2e2;border-color:#ef4444;color:#b91c1c}
    #mult-root .gt .fdisp{height:48px;border-radius:18px;border:3px solid var(--accent-light);background:#fff;display:flex;align-items:center;justify-content:center;
      font-family:var(--font-head);font-weight:800;font-size:32px;color:var(--deep);margin-bottom:6px;transition:border-color .25s,background-color .25s}
    #mult-root .gt .fdisp .ph{color:#c4b5fd}
    #mult-root .gt .fdisp.ok{border-color:#22c55e;background:#dcfce7;color:#15803d}
    #mult-root .gt .fdisp.bad{border-color:#ef4444;background:#fee2e2;color:#b91c1c}
    #mult-root .gt .keys{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:46px;gap:6px}
    #mult-root .gt .key{border-radius:16px;background:var(--glass-strong);border:1.5px solid color-mix(in srgb,var(--accent) 24%,transparent);font-family:var(--font-head);
      font-weight:800;font-size:22px;color:var(--deep);display:grid;place-items:center;transition:transform .2s var(--spring)}
    #mult-root .gt .key:active{transform:scale(.94)}
    #mult-root .gt .key.kok{background:linear-gradient(135deg,var(--accent),var(--accent-light));color:#fff;border-color:transparent;font-size:18px}
    #mult-root .gt .overlay{position:absolute;inset:0;padding:10px 12px 12px;background:#fcfaff;display:flex;flex-direction:column;gap:6px;opacity:0;pointer-events:none;transform:scale(.98);
      transition:opacity .4s var(--smooth),transform .4s var(--smooth);z-index:5}
    #mult-root .gt .overlay.on{opacity:1;pointer-events:auto;transform:none}
    #mult-root .gt .ohead{height:34px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
    #mult-root .gt .oq{font-family:var(--font-head);font-weight:800;font-size:26px;color:var(--deep);white-space:nowrap}
    #mult-root .gt .oq .oa{color:var(--accent)}
    #mult-root .gt .oq .oa.ok{color:#15803d;display:inline-block;animation:gt-pop .5s var(--spring)}
    #mult-root .gt .oq s{color:#dc2626;font-size:19px;margin-left:10px;text-decoration-thickness:2.5px}
    #mult-root .gt .otag{height:26px;padding:0 11px;border-radius:999px;background:var(--tint);color:var(--accent);font-size:12.5px;font-weight:900;display:inline-flex;align-items:center}
    #mult-root .gt .shake{animation:gt-shake .4s ease-in-out}

    /* Rekordspåret */
    #mult-root .gt .track{height:58px;flex-shrink:0;padding:8px 16px;display:flex;flex-direction:column;justify-content:center;gap:7px}
    #mult-root .gt .trtop{display:flex;justify-content:space-between;align-items:baseline;font-weight:800;font-size:13px;color:var(--ink-soft)}
    #mult-root .gt .trtop b{font-family:var(--font-head);font-size:19px;color:var(--deep);display:inline-block}
    #mult-root .gt .trtop b.pop{animation:gt-pop .45s var(--spring)}
    #mult-root .gt .bar{position:relative;height:12px;border-radius:999px;background:rgba(76,29,149,.12)}
    #mult-root .gt .bar .fill{position:absolute;inset:0;border-radius:inherit;background:linear-gradient(90deg,var(--accent),var(--accent-light));transform-origin:left center;transform:scaleX(0);transition:transform .45s var(--smooth)}
    #mult-root .gt .bar.beat .fill{background:linear-gradient(90deg,#f59e0b,#fbbf24)}
    #mult-root .gt .bar.clock .fill{transition:transform 1s linear}
    #mult-root .gt .bar .flag{position:absolute;top:-5px;bottom:-5px;width:4px;margin-left:-2px;border-radius:2px;background:#f59e0b;box-shadow:0 0 0 2px #fff}
    #mult-root .gt .bar .flag.off{display:none}

    /* ── Hubben v60: kompakt karta (bara framstegen), Träna en tabell, varvraden, tre ingångar ── */
    #mult-root .gt #mt-scr-hub{gap:8px}
    #mult-root .gt #mt-scr-hub.tight{gap:6px}
    #mult-root .gt .mapcard.mini{flex-direction:row;align-items:center;gap:12px;padding:10px 12px}
    #mult-root .gt .map.mini .mh{font-size:9.5px}
    #mult-root .gt .map.mini .mc{border-radius:4px}
    #mult-root .gt .mside{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:9px}
    #mult-root .gt .mside .mhl{flex-direction:column;align-items:flex-start;gap:3px}
    #mult-root .gt .mside .mhl b{font-size:32px}
    #mult-root .gt .mside .mhl span{font-size:13px}
    #mult-root .gt .mlegend{display:flex;flex-direction:column;gap:3px;font-size:12.5px;font-weight:800;color:var(--ink-soft)}
    #mult-root .gt .mlegend span{display:flex;align-items:center;white-space:nowrap}
    #mult-root .gt .mlegend b{margin-left:auto;padding-left:6px;font-family:var(--font-head);font-size:15px;color:var(--deep)}
    #mult-root .gt .mlegend i{display:inline-block;width:12px;height:12px;border-radius:4px;margin-right:6px;flex-shrink:0}
    #mult-root .gt .mlegend .sw-ny{background:#fff;box-shadow:inset 0 0 0 1px rgba(76,29,149,.25)}
    #mult-root .gt .mlegend .sw-due{background:var(--due);box-shadow:inset 0 0 0 1px rgba(47,191,104,.35)}
    #mult-root .gt .mside .refill{justify-content:flex-start;height:auto;line-height:1.2}
    #mult-root .gt #mt-scr-hub .hubmore{margin-top:auto}

    /* Träna en tabell: snabbval 1–10 (11–12 under Extra) med medalj och Kan-stapel */
    #mult-root .gt .tcard{padding:10px 12px;display:flex;flex-direction:column;gap:7px;flex-shrink:0}
    #mult-root .gt .tc-head{font-family:var(--font-head);font-weight:800;font-size:18px;color:var(--deep);line-height:1.1}
    #mult-root .gt .tbtns{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
    #mult-root .gt .tb{display:flex;flex-direction:column;justify-content:center;gap:6px;min-height:58px;padding:6px 4px 8px;border-radius:14px;background:#fff;
      border:1.5px solid color-mix(in srgb,var(--accent) 22%,transparent);color:var(--deep);transition:transform .2s var(--spring)}
    #mult-root .gt .tb:active{transform:scale(.94)}
    #mult-root .gt .tb-top{display:flex;align-items:center;justify-content:center;gap:4px}
    #mult-root .gt .tb-top b{font-family:var(--font-head);font-weight:800;font-size:22px;line-height:1;min-width:12px;text-align:center}
    #mult-root .gt .tb-md{position:relative;width:24px;height:24px;flex-shrink:0}
    #mult-root .gt .tb .tb-bar{margin:0 4px}
    #mult-root .gt .tb-bar{display:block;height:4px;border-radius:999px;background:rgba(76,29,149,.1);overflow:hidden}
    #mult-root .gt .tb-bar i{display:block;height:100%;border-radius:inherit;background:var(--kan)}
    #mult-root .gt .tx{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;align-items:center}
    #mult-root .gt .tx .xlab{grid-column:1 / 4}
    #mult-root .gt svg.md{display:block;width:100%;height:100%}
    #mult-root .gt .mdue{position:absolute;top:-3px;right:-4px;width:10px;height:10px;border-radius:50%;background:var(--due);
      box-shadow:0 0 0 1.5px #fff,inset 0 0 0 1.5px rgba(47,191,104,.5)}

    /* Varvraden: vad som gäller för snabbvalen */
    #mult-root .gt .varvrow{display:flex;align-items:center;gap:10px;padding:6px 8px 6px 14px;flex-shrink:0}
    #mult-root .gt .vr-t{display:flex;flex-direction:column;line-height:1.1;flex-shrink:0}
    #mult-root .gt .vr-t small{font-size:11.5px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}
    #mult-root .gt .vr-t b{font-family:var(--font-head);font-weight:800;font-size:17px;color:var(--deep);white-space:nowrap}
    #mult-root .gt .varvrow .pc-rs{flex:1;min-width:0;overflow:hidden;gap:3px}
    #mult-root .gt .varvrow .ri{width:22px;height:22px;border-radius:7px}
    #mult-root .gt .varvrow .ri svg.i{width:14px;height:14px}
    #mult-root .gt .varvrow .btn-pill{flex-shrink:0}
    #mult-root .gt .pc-rs{display:flex;gap:4px;flex-shrink:0}
    #mult-root .gt .rig{display:inline-flex;align-items:center;gap:2px;margin-right:4px;font-size:13px;font-weight:900;color:var(--ink-soft)}
    #mult-root .gt .ri{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;flex-shrink:0}
    #mult-root .gt .ri svg.i{width:16px;height:16px}
    #mult-root .gt .ri-show{background:#dbeafe;color:#1d4ed8}
    #mult-root .gt .ri-choice{background:#f3e8ff;color:#7e22ce}
    #mult-root .gt .ri-free{background:#ffedd5;color:#c2410c}
    #mult-root .gt .tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;flex-shrink:0}
    #mult-root .gt .tile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:96px;padding:8px 4px;border-radius:20px;
      background:var(--glass-strong);border:1.5px solid color-mix(in srgb,var(--accent) 22%,transparent);box-shadow:var(--shadow-panel);color:var(--deep);text-align:center;
      transition:transform .25s var(--spring),opacity .15s}
    #mult-root .gt .tile:active:not(:disabled){transform:scale(.96)}
    #mult-root .gt .tile:disabled{opacity:.5}
    #mult-root .gt .tile .ic{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;background:var(--tint);color:var(--accent);margin-bottom:3px}
    #mult-root .gt .tile b{font-family:var(--font-head);font-weight:800;font-size:15px;line-height:1.08}
    #mult-root .gt .tile small{font-size:11.5px;font-weight:700;color:var(--ink-soft);white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}

    /* ── Ställ in ett övningspass ── */
    #mult-root .gt #mt-scr-setup{gap:8px}
    #mult-root .gt .sucard{padding:10px 12px;display:flex;flex-direction:column;gap:8px;flex-shrink:0}
    #mult-root .gt #mt-scr-setup.varv-only > .sucard:nth-child(-n+2){display:none}
    #mult-root .gt .su-lab{display:flex;flex-direction:column;line-height:1.15}
    #mult-root .gt .su-lab b{font-family:var(--font-head);font-weight:800;font-size:18px;color:var(--deep)}
    #mult-root .gt .su-lab small{font-size:12.5px;font-weight:700;color:var(--ink-soft)}
    #mult-root .gt .su-lab.su-row{flex-direction:row;align-items:center;justify-content:space-between;gap:8px}
    #mult-root .gt .chips{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
    #mult-root .gt .xrow{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;align-items:center}
    #mult-root .gt .xlab{grid-column:1 / 4;justify-self:end;font-size:12px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-soft)}
    #mult-root .gt .xchips{grid-column:4 / 6;grid-template-columns:1fr 1fr}
    #mult-root .gt .chips button.dim{opacity:.5;border-style:dashed;color:var(--ink-soft)}
    #mult-root .gt .chips button{height:46px;border-radius:14px;background:#fff;border:1.5px solid color-mix(in srgb,var(--accent) 22%,transparent);
      font-family:var(--font-head);font-weight:800;font-size:19px;color:var(--deep);transition:transform .2s var(--spring),opacity .2s}
    #mult-root .gt .chips button:active:not(:disabled){transform:scale(.93)}
    #mult-root .gt .chips button.on{background:linear-gradient(135deg,var(--accent),var(--accent-light));color:#fff;border-color:transparent;box-shadow:0 5px 14px var(--glow)}
    #mult-root .gt .chips button:disabled{opacity:.25}
    #mult-root .gt .presets{display:flex;gap:2px;background:rgba(76,29,149,.07);border-radius:999px;padding:3px}
    #mult-root .gt .presets button{min-height:44px;padding:0 12px;border-radius:999px;font-weight:800;font-size:14px;color:var(--ink-soft);transition:background-color .2s,color .2s}
    #mult-root .gt .presets button.on{background:#fff;color:var(--deep);box-shadow:0 2px 8px rgba(76,29,149,.14)}
    #mult-root .gt .rrow{display:flex;align-items:center;gap:10px;min-height:52px}
    #mult-root .gt .rrow .ri{width:36px;height:36px;border-radius:12px;transition:opacity .2s}
    #mult-root .gt .rrow .ri svg.i{width:20px;height:20px}
    #mult-root .gt .rrow .rt{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15;transition:opacity .2s}
    #mult-root .gt .rrow .rt b{font-weight:900;font-size:15px;color:var(--ink)}
    #mult-root .gt .rrow .rt small{font-size:12px;font-weight:700;color:var(--ink-soft)}
    #mult-root .gt .rrow.zero .rt,#mult-root .gt .rrow.zero .ri{opacity:.5}
    #mult-root .gt .rstep{display:flex;align-items:center;gap:6px}
    #mult-root .gt .rstep .stp{width:44px;height:44px}
    #mult-root .gt .rstep .rn{width:22px;text-align:center;font-family:var(--font-head);font-weight:800;font-size:22px;color:var(--deep)}
    #mult-root .gt .su-sum{text-align:center;font-weight:800;font-size:15px;color:var(--deep);height:22px;flex-shrink:0}

    /* ── Startskärmen för en tabell (snabbvalet) ── */
    #mult-root .gt #mt-scr-tstart{gap:8px}
    #mult-root .gt .ts-head{padding:12px 14px;display:flex;align-items:center;gap:14px;flex-shrink:0}
    #mult-root .gt .ts-md{position:relative;width:56px;height:56px;flex-shrink:0}
    #mult-root .gt .ts-md .mdue{width:14px;height:14px;top:-2px;right:-3px}
    #mult-root .gt .ts-t{display:flex;flex-direction:column;gap:3px;min-width:0;line-height:1.1}
    #mult-root .gt .ts-t b{font-family:var(--font-head);font-weight:800;font-size:30px;color:var(--deep)}
    #mult-root .gt .ts-t span{font-weight:800;font-size:14px;color:var(--ink-soft)}
    #mult-root .gt .ts-t .tb-bar{width:150px;height:6px;margin-top:3px}
    #mult-root .gt .ts-medals{padding:8px 12px;display:flex;flex-direction:column;gap:2px;flex-shrink:0}
    #mult-root .gt .tsm{display:flex;align-items:center;gap:10px;min-height:36px;font-size:14px;font-weight:700;color:var(--ink);transition:opacity .2s}
    #mult-root .gt .tsm b{font-weight:900}
    #mult-root .gt .tsm .tsm-md{width:26px;height:26px;flex-shrink:0}
    #mult-root .gt .tsm.off{opacity:.45}
    #mult-root .gt .tsm .tsm-ok{margin-left:auto;width:22px;height:22px;color:#16a34a;visibility:hidden}
    #mult-root .gt .tsm:not(.off) .tsm-ok{visibility:visible}
    #mult-root .gt .tsm .tsm-ok svg.i{width:20px;height:20px;stroke-width:3}
    #mult-root .gt .tsm.fill{color:var(--ink-soft);font-weight:800;font-size:13px}
    #mult-root .gt .tsm.fill i{display:block;width:12px;height:12px;border-radius:50%;margin:0 7px;background:var(--due);box-shadow:inset 0 0 0 1.5px rgba(47,191,104,.5)}
    #mult-root .gt .ts-rounds{padding:10px 12px;display:flex;flex-direction:column;gap:6px;flex-shrink:0}
    #mult-root .gt .ts-rlist{display:grid;grid-template-columns:1fr;gap:4px 10px}
    #mult-root .gt .ts-rlist.two{grid-template-columns:1fr 1fr}
    #mult-root .gt .ts-r{display:flex;align-items:center;gap:8px;min-height:30px;font-size:14px;font-weight:800;color:var(--ink);white-space:nowrap;overflow:hidden}
    #mult-root .gt .ts-r em{font-style:normal;color:var(--ink-soft);min-width:16px}
    #mult-root .gt .ts-sum{font-size:13px;font-weight:800;color:var(--ink-soft)}
    #mult-root .gt .ts-go{min-height:60px;font-size:19px}
    #mult-root .gt .ts-edit{min-height:48px}

    /* ── De svåra talen (v62): kortet på hemvyn och startskärmen ── */
    #mult-root .gt .hardrow{display:flex;align-items:center;gap:12px;min-height:52px;padding:6px 10px 6px 12px;flex-shrink:0;width:100%;text-align:left;color:var(--deep);
      transition:transform .2s var(--spring)}
    #mult-root .gt .hardrow:active{transform:scale(.97)}
    #mult-root .gt .hr-ic{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;background:var(--tint);color:var(--accent);flex-shrink:0}
    #mult-root .gt .hr-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;line-height:1.1}
    #mult-root .gt .hr-t b{font-family:var(--font-head);font-weight:800;font-size:17px;color:var(--deep)}
    #mult-root .gt .hr-k{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:800;color:var(--ink-soft);white-space:nowrap}
    #mult-root .gt .hr-k .tb-bar{flex:1;max-width:130px;height:5px}
    #mult-root .gt .hr-go{display:grid;place-items:center;width:28px;color:var(--ink-soft)}
    #mult-root .gt #mt-scr-hstart{gap:8px}
    #mult-root .gt .hs-ic{display:grid;place-items:center;border-radius:18px;background:var(--tint);color:var(--accent)}
    #mult-root .gt .hs-ic svg.i{width:32px;height:32px;stroke-width:2.2}
    #mult-root .gt .hs-mapcard{padding:10px 12px;display:flex;align-items:center;gap:12px;flex-shrink:0}
    #mult-root .gt .hs-map{flex-shrink:0}
    #mult-root .gt .hs-map .mh{font-size:11px}
    #mult-root .gt .mc.mirror{background:transparent;box-shadow:none}
    #mult-root .gt .hs-side{flex:1;min-width:0;display:flex;flex-direction:column;gap:10px}
    #mult-root .gt .hs-why{margin:0;font-size:13.5px;font-weight:800;line-height:1.3;color:var(--ink)}
    #mult-root .gt .hs-pick{grid-template-columns:auto 1fr;flex-shrink:0}
    #mult-root .gt .hs-pick.one{grid-template-columns:1fr}
    #mult-root .gt .hs-pick button{padding:0 16px;white-space:nowrap}
    #mult-root .gt .hs-praise{margin:0;text-align:center;font-weight:800;font-size:14px;line-height:1.3;color:#15803d;flex-shrink:0}

    /* ── Lär dig strategin: kapitlet "Tabellen är mindre än du tror" ── */
    #mult-root .gt .chap{display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;flex-shrink:0;border-radius:14px;background:var(--glass-strong);
      border:1.5px solid color-mix(in srgb,var(--accent) 20%,transparent);font-family:var(--font-head);font-weight:800;font-size:16px;color:var(--deep);transition:transform .2s var(--spring)}
    #mult-root .gt .chap.on{background:linear-gradient(135deg,var(--accent),var(--accent-light));color:#fff;border-color:transparent;box-shadow:0 5px 14px var(--glow)}
    #mult-root .gt .chap:active{transform:scale(.97)}
    #mult-root .gt #mt-scr-learn .lesson-only{display:none}
    #mult-root .gt #mt-scr-learn.lesson .lesson-only{display:flex}
    #mult-root .gt #mt-scr-learn.lesson .strat-only{display:none}
    #mult-root .gt .lessoncard{flex:1;min-height:0;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:10px 12px}

    /* ── Passet ── */
    #mult-root .gt #mt-scr-pass .trtop{gap:10px;white-space:nowrap}
    #mult-root .gt #mt-psL{min-width:0;overflow:hidden;text-overflow:ellipsis}
    #mult-root .gt .rps{display:flex;gap:5px;align-items:center;flex-shrink:0}
    #mult-root .gt .rps.many{gap:3px}
    #mult-root .gt .rps.many .rp{width:7px;height:7px}
    #mult-root .gt .rp{width:9px;height:9px;border-radius:50%;background:rgba(76,29,149,.16);transition:background-color .3s}
    #mult-root .gt .rp.ok{background:var(--kan)}
    #mult-root .gt .rp.cur{background:var(--accent);box-shadow:0 0 0 2px #fff,0 0 0 3.5px var(--accent)}
    #mult-root .gt .qbig .qok{color:#15803d;display:inline-block;animation:gt-pop .45s var(--spring)}
    #mult-root .gt .qbig .okc{color:var(--kan);line-height:1}
    #mult-root .gt .qbig .rbt{display:block;font-size:34px;margin-top:6px}
    #mult-root .gt .rlist{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:minmax(0,44px);gap:8px;align-content:center;height:100%}
    #mult-root .gt .rl{display:flex;align-items:center;gap:8px;min-height:0;padding:0 12px;border-radius:14px;background:var(--glass-strong);
      border:1.5px solid color-mix(in srgb,var(--accent) 16%,transparent);font-weight:800;font-size:13.5px;color:var(--ink-soft);white-space:nowrap;overflow:hidden}
    #mult-root .gt .rl svg.i{width:18px;height:18px}
    #mult-root .gt .rl.ok{background:#dcfce7;border-color:#86efac;color:#15803d}
    #mult-root .gt .rl.next{border-color:var(--accent);color:var(--deep);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 22%,transparent)}
    #mult-root .gt .oq .qok{color:#15803d}
    #mult-root .gt .duo{display:none;gap:8px;width:100%}
    #mult-root .gt .duo .btn{flex:1;padding:0 10px;font-size:15px}
    #mult-root .gt .slot.duoing .duo{display:flex}
    #mult-root .gt .slot.duoing > .btn{display:none}
    #mult-root .gt .slot.choosing .duo{display:none}

    /* ── Du är klar! – kvittot ── */
    #mult-root .gt #mt-scr-done{gap:8px}
    #mult-root .gt .dn-head{display:flex;flex-direction:column;align-items:center;text-align:center;flex-shrink:0;padding-top:2px}
    #mult-root .gt .dn-star{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#fbbf24,#f59e0b);
      box-shadow:0 8px 20px rgba(245,158,11,.35);animation:gt-pop .6s var(--spring)}
    #mult-root .gt .dn-star svg.i{width:30px;height:30px;fill:#fff;stroke-width:1.6}
    #mult-root .gt .dn-head h2{font-family:var(--font-head);font-weight:800;font-size:34px;color:var(--deep);line-height:1.05;margin:6px 0 0}
    #mult-root .gt .dn-head p{font-weight:800;font-size:15px;color:var(--ink-soft);margin:3px 0 0;min-height:20px}
    #mult-root .gt .receipt{position:relative;padding:12px 14px;display:flex;flex-direction:column;gap:6px;flex-shrink:0;background:#fff}
    #mult-root .gt .rc-top{display:flex;flex-direction:column;gap:1px;padding-bottom:7px;border-bottom:1.5px dashed rgba(76,29,149,.2)}
    #mult-root .gt .rc-k{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}
    #mult-root .gt .rc-k svg.i{width:16px;height:16px}
    #mult-root .gt .rc-when{font-weight:800;font-size:15px;color:var(--deep)}
    #mult-root .gt .rc-row{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:14px;font-weight:700;color:var(--ink-soft)}
    #mult-root .gt .rc-row b{font-family:var(--font-head);font-weight:800;font-size:17px;color:var(--deep);text-align:right}
    #mult-root .gt .rc-rounds{display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;padding:6px 0;border-top:1.5px dashed rgba(76,29,149,.2);border-bottom:1.5px dashed rgba(76,29,149,.2)}
    #mult-root .gt .rv{display:flex;align-items:center;gap:5px;font-size:13px;font-weight:800;color:var(--ink);white-space:nowrap}
    #mult-root .gt .rv svg.i{width:16px;height:16px;color:#16a34a;stroke-width:3}
    #mult-root .gt .rv em{font-style:normal;color:var(--ink-soft)}
    #mult-root .gt .rc-foot{position:relative;height:70px;display:grid;place-items:center;border:2px dashed rgba(22,163,74,.35);border-radius:14px;margin-top:2px}
    #mult-root .gt .slot-ph{font-size:13px;font-weight:800;color:rgba(21,128,61,.6);transition:opacity .2s}
    #mult-root .gt .slot-ph.off{opacity:0}
    #mult-root .gt .stamp{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;opacity:0}
    #mult-root .gt .stamp.on{animation:gt-stamp .55s cubic-bezier(.2,1.4,.4,1) both}
    #mult-root .gt .st-tx{display:flex;flex-direction:column;align-items:flex-start;line-height:1.15}
    #mult-root .gt .st-in{display:flex;align-items:center;gap:8px;padding:6px 14px 6px 10px;border:3px solid #16a34a;border-radius:12px;color:#15803d;
      transform:rotate(-5deg);background:rgba(240,253,244,.9);box-shadow:inset 0 0 0 2px rgba(22,163,74,.18)}
    #mult-root .gt .st-in svg.i{width:26px;height:26px;stroke-width:3.2}
    #mult-root .gt .st-in b{font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}
    #mult-root .gt .st-in small{font-size:12px;font-weight:800}
    #mult-root .gt .dn-ask{text-align:center;font-weight:900;font-size:16px;color:var(--deep);margin:0;flex-shrink:0;min-height:22px}
    #mult-root .gt .hold{position:relative;overflow:hidden;min-height:58px;flex-shrink:0;border-radius:999px;border:2px solid #16a34a;background:#fff;color:#15803d;
      font-weight:900;font-size:16px;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
    #mult-root .gt .hold-fill{position:absolute;inset:0;background:linear-gradient(90deg,#bbf7d0,#4ade80);transform:scaleX(0);transform-origin:left center}
    #mult-root .gt .hold.holding .hold-fill{transform:scaleX(1);transition:transform 1.5s linear}
    #mult-root .gt .hold-t{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px}
    #mult-root .gt .hold.done{background:#dcfce7}
    #mult-root .gt .hold:disabled{opacity:1}
    @keyframes gt-stamp{0%{opacity:0;transform:scale(2.4)}60%{opacity:1;transform:scale(.92)}100%{opacity:1;transform:scale(1)}}

    @keyframes gt-scrin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    @keyframes gt-bubblein{from{transform:scale(.9) translateY(4px);opacity:.4}to{transform:scale(1) translateY(0);opacity:1}}
    @keyframes gt-chipin{0%{transform:scale(.4);opacity:0}65%{transform:scale(1.14);opacity:1}100%{transform:scale(1);opacity:1}}
    @keyframes gt-pop{0%{transform:scale(.5);opacity:.2}65%{transform:scale(1.2);opacity:1}100%{transform:scale(1);opacity:1}}
    @keyframes gt-twin{0%,100%{transform:scale(1)}50%{transform:scale(1.28)}}
    @keyframes gt-chg{0%{transform:scale(1)}45%{transform:scale(1.35)}100%{transform:scale(1)}}
    @keyframes gt-ring{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.8)}}
    @keyframes gt-swapin{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    @keyframes gt-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}50%{transform:translateX(5px)}75%{transform:translateX(-3px)}}
  `;

  const baseStyle = () => `<style id="mult-css">${MULT_CSS}</style>`;

  /* ── Lagringsnycklar (rensas i Store.deleteProfile) ── */
  const STATS_KEY = id => `mult_stats_${id}`;
  const LOG_KEY   = id => `mult_log_${id}`;
  const BOX_KEY   = id => `mult_boxes_${id}`;     // lådorna per par + passräknaren
  const REC_KEY   = id => `mult_record_${id}`;    // rekordrundans rekord
  const SET_KEY   = id => `mult_settings_${id}`;  // kugghjulets inställningar
  /* Tabeller och gånger: standard upp till 10. 11:an och 12:an är extraval. */
  const UPTO_DEFAULT = '10';
  const UPTO_OPTS = [['10', 'Upp till 10<small>(standard)</small>'], ['11', 'Upp till 11'], ['12', 'Upp till 12']];
  const OVP_KEY   = id => `mult_ovpass_${id}`;    // det sparade övningspasset

  function readJSON(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch (_) { return null; }
  }
  function writeJSON(key, value) {
    try { return MP.safeSetItem(key, JSON.stringify(value)); }
    catch (_) { return false; }
  }

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

  /* Varje besvarad fråga i alla flöden (Öva, Rekordrunda, Dagens träning,
     Övningspass, fokuserad träning) går hit: statistiken som förut,
     och lådorna enligt reglerna i applyAnswer. */
  function recordAnswer(table, multiplier, correct) {
    const T = loadTrainer();          // första gången: lådorna byggs ur statistiken FÖRE detta svar
    const stats = getStats();
    const key = `${table}x${multiplier}`;
    if (!stats[key]) stats[key] = { correct: 0, total: 0 };
    stats[key].total++;
    if (correct) stats[key].correct++;
    saveStats(stats);
    try {
      const k = KEY(table, multiplier);
      if (T.pairs[k]) { applyAnswer(T.pairs[k], !!correct, today()); saveTrainer(T); }
    } catch (_) { /* lådorna får aldrig stoppa ett svar */ }
    // Capybara-samlingen (v59): hel tabell i Kan → händelsen 'tabell'. EFTER att lådorna
    // sparats, i try/catch. Capy ger den en gång per tabell och profil och KÖAR bara kortet
    // (ingen overlay mitt i en fråga): resultatets egen award (passet, testet) drar sedan
    // köns första post, så max ett kort per resultat gäller. Står passets eget kort först i
    // kön kommer tabellkortet vid nästa resultat.
    try {
      if (typeof window !== 'undefined' && window.Capy && profile && correct) {
        for (const t of fullTables(T.pairs, UPTO(), table === multiplier ? [table] : [table, multiplier])) {
          Capy.award(profile, { type:'tabell', data:{ table:t } });
        }
      }
    } catch (_) { /* samlingen får aldrig stoppa ett svar */ }
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

  const snd = t => { try { App.Sound.play(t); } catch (_) {} };
  const confetti = n => { try { App.Confetti.burst(n); } catch (_) {} };

  /* ═══════════════════════════════════════════════════════════
     LÅDORNA: ett tillstånd per par. a×b och b×a delar alltid.
     { box:'ny'|'ovar'|'kan', okDays, level, due, lastOk, relearn }
     okDays = antal olika lokala kalenderdagar med rätt svar sedan
     senaste fel; lastOk = senaste dag som räknats; due = YYYY-MM-DD.
  ═══════════════════════════════════════════════════════════ */
  const KEY = (a, b) => a <= b ? `${a}x${b}` : `${b}x${a}`;
  const PAIRS = []; for (let a = 1; a <= 12; a++) for (let b = a; b <= 12; b++) PAIRS.push([a, b]);   // 78 unika par
  /* Lådornas regler bor i js/shared.js (MP.spaced) sedan v63 och delas med Klockan:
     tre olika dagar till Kan, intervallen 1, 3, 7, 14, 30 dagar, fel på Kan ger Övar. */
  const { BOXES, INTERVALS, intervalFor, fmtDay, addDays, applyAnswer } = SP;

  let todayOverride = null;                            // testkrok: _test.setToday('2026-09-23')
  const today = () => todayOverride || fmtDay(new Date());

  const freshPair = SP.fresh;

  /* Hur paret ser ut på kartan: ett kan-tal vars due passerats är "Dags igen" (bleknat grönt). */
  const vis = (st, day = today()) => SP.vis(st, day);
  const pairsUpTo = n => PAIRS.filter(([a, b]) => a <= n && b <= n);
  /* n = hur långt tabellerna går (Gånger). Tal utanför syns inte och räknas inte. */
  function visMap(pairs, day = today(), n = 12) { const V = {}; for (const [a, b] of pairsUpTo(n)) V[KEY(a, b)] = vis(pairs[KEY(a, b)], day); return V; }
  function counts(V) { const c = { kan:0, due:0, ovar:0, ny:0 }; for (const k in V) c[V[k]]++; return c; }
  const leftToLearn = V => { const c = counts(V); return c.ny + c.ovar; };   // "tal kvar att lära"
  /* Hela tabeller: tabell t är klar när alla t×1 … t×n ligger i lådan kan ("Dags igen" räknas
     som kan – samma låda). Bara tabeller inom Gånger (t ≤ n). Ren; tables = kandidaterna. */
  function fullTables(pairs, n, tables) {
    return tables.filter(t => t >= 1 && t <= n && pairsUpTo(n).every(([a, b]) =>
      (a !== t && b !== t) || (pairs[KEY(a, b)] && pairs[KEY(a, b)].box === 'kan')));
  }
  /* Medaljen för tabell t (v60), byggd på lådorna – aldrig på andelen rätt.
     Talen är t × 1 … t × n (n = Gånger). "Dags igen" räknas som Kan (samma låda, samma
     regel som fullTables och Capy-händelsen 'tabell').
       ingen:  något tal är fortfarande nytt
       brons:  alla tal har övats (inget är nytt)
       silver: minst hälften av talen är Kan
       guld:   alla tal är Kan
     due = minst ett av talen är "Dags igen" → medaljen får en blek prick (fyll på). Ren. */
  const MEDALS = SP.MEDALS;
  function tableMedal(pairs, t, n, day = today()){
    const views = [];
    for (let m = 1; m <= n; m++){ const st = pairs[KEY(t, m)]; views.push(st ? vis(st, day) : 'ny'); }
    return { t, ...SP.medal(views) };               // samma regel som klockans steg (MP.spaced.medal)
  }
  /* Snabbvalen: 1–10 alltid, 11 och 12 (Extra) bara när Gånger når dit */
  const quickTables = n => ({ main:[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], extra:[11, 12].filter(t => t <= n) });

  /* Första gången: lådorna byggs ur befintlig statistik (`${table}x${mult}` → {correct,total}).
     a×b och b×a slås ihop. Minst 3 försök och minst 90 % rätt → kan (level 1, due utspritt
     1–7 dagar fram, fast per par). Minst 1 försök → övar (okDays 1). Annars ny. */
  const spreadDays = (a, b) => 1 + (a * 5 + b * 3) % 7;
  function pairsFromStats(stats, day) {
    const out = {};
    for (const [a, b] of PAIRS) {
      const keys = a === b ? [`${a}x${b}`] : [`${a}x${b}`, `${b}x${a}`];
      let c = 0, t = 0;
      for (const k of keys) {
        const s = stats && stats[k];
        if (s && Number(s.total) > 0) { t += Number(s.total) || 0; c += Number(s.correct) || 0; }
      }
      const st = freshPair();
      if (t >= 3 && c / t >= 0.9) { st.box = 'kan'; st.level = 1; st.due = addDays(day, spreadDays(a, b)); }
      else if (t >= 1) { st.box = 'ovar'; st.okDays = 1; }
      out[KEY(a, b)] = st;
    }
    return out;
  }
  function validPairs(p) {
    return !!p && typeof p === 'object' && PAIRS.every(([a, b]) => { const s = p[KEY(a, b)]; return s && BOXES.includes(s.box); });
  }
  function loadTrainer() {
    const raw = readJSON(BOX_KEY(profile.id));
    if (raw && raw.v === 2 && validPairs(raw.pairs)) return { v:2, pairs:raw.pairs, passNo:Number(raw.passNo) || 0 };
    const T = { v:2, pairs:pairsFromStats(getStats(), today()), passNo:0 };
    saveTrainer(T);
    return T;
  }
  function saveTrainer(T) { writeJSON(BOX_KEY(profile.id), { v:2, pairs:T.pairs, passNo:T.passNo }); }
  function loadRecord() {
    const r = readJSON(REC_KEY(profile.id)) || {};
    return { streak:Number(r.streak) || 0, clock:Number(r.clock) || 0 };
  }
  function saveRecord(r) { writeJSON(REC_KEY(profile.id), r); }

  /* ── Inställningarna (kugghjulet). Sparas per profil. ── */
  const SET = { strat:'fast', tempo:'rekord', rev:'pa', upto:'10' };
  const SETTINGS = [
    { k:'upto',   label:'Tabeller och gånger', help:'Hur långt kartan och övningarna går. 11:an och 12:an är extra.', opts:UPTO_OPTS },
    { k:'strat',  label:'Strategi', help:'Fast: en väg visas. Välj väg: barnet väljer mellan två.', opts:[['fast', 'Fast'], ['valj', 'Välj väg']] },
    { k:'tempo',  label:'Tempo', help:'Rekordrundan mot klockan eller mot eget rekord i rad.', opts:[['klocka', 'Klocka'], ['rekord', 'Eget rekord']] },
    { k:'answer', label:'Svar', help:'Fyra svar att välja bland, eller skriv svaret själv.', opts:[['choice', 'Val'], ['free', 'Fri']] },
    { k:'rev',    label:'Omvända frågor', help:'Till exempel: vilket gångertal blir 56? Visas bara med Val.', opts:[['av', 'Av'], ['pa', 'På']] },
  ];
  const getSetting = k => k === 'answer' ? answerMode : SET[k];
  /* Sparade inställningar → giltiga värden. Saknas ett värde (t.ex. profiler från v57,
     som inte har upto) gäller standard: upp till 10. Ett sparat värde gäller före standard. */
  function settingsFrom(raw) {
    const s = raw && typeof raw === 'object' ? raw : {};
    return {
      strat: s.strat === 'valj' ? 'valj' : 'fast',
      tempo: s.tempo === 'klocka' ? 'klocka' : 'rekord',
      rev:   s.rev === 'av' ? 'av' : 'pa',
      upto:  ['10', '11', '12'].includes(String(s.upto)) ? String(s.upto) : UPTO_DEFAULT,
      answer: s.answer === 'free' ? 'free' : 'choice',
    };
  }
  function loadSettings() {
    const s = settingsFrom(profile && readJSON(SET_KEY(profile.id)));
    SET.strat = s.strat; SET.tempo = s.tempo; SET.rev = s.rev; SET.upto = s.upto;
    answerMode = s.answer;
  }
  function saveSettings() {
    if (profile) writeJSON(SET_KEY(profile.id), { strat:SET.strat, tempo:SET.tempo, rev:SET.rev, upto:SET.upto, answer:answerMode });
  }
  const isVal = () => answerMode === 'choice';
  /* "Gånger": 1–10, 1–11 eller 1–12. Styr kartans storlek, räknarna, Öva blandat,
     Rekordrunda och övningspasset. Lådorna för dolda tal ligger kvar orörda. */
  const UPTO = () => +SET.upto;

  /* ═══════════════════════════════════════════════════════════
     GRUNDER (ur mockupen)
  ═══════════════════════════════════════════════════════════ */
  const $ = id => document.getElementById('mt-' + id);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const frame = () => new Promise(r => { requestAnimationFrame(() => requestAnimationFrame(r)); setTimeout(r, 60); });   // rAF står still i dolda flikar
  const LEAD = 280;                                    // texten först, rörelsen sen
  const ICON = {
    back:'<path d="M15 5l-7 7 7 7"/>',
    fwd:'<path d="M9 5l7 7-7 7"/>',
    next:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    again:'<path d="M4.5 12a7.5 7.5 0 1 1 2.2 5.3M4.5 17.5V12H10"/>',
    flip:'<path d="M20 12a8 8 0 0 1-13.7 5.7M4 12a8 8 0 0 1 13.7-5.7"/><path d="M17.7 2.5v3.8h-3.8M6.3 21.5v-3.8h3.8"/>',
    shrink:'<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
    close:'<path d="M6 6l12 12M18 6L6 18"/>',
    bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    play:'<path d="M8 5.5l11 6.5-11 6.5z"/>',
    trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>',
    lock:'<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    del:'<path d="M20 6H9l-5 6 5 6h11z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/>',
    map:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 10h16M4 15h16M10 4v16M15 4v16"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    test:'<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.2" fill="currentColor" stroke="none"/>',
    stats:'<path d="M5 19v-6M12 19V5.5M19 19v-9"/>',
    log:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    repeat:'<path d="M17 2.5l3.5 3.5L17 9.5"/><path d="M3.5 11.5V10a4 4 0 0 1 4-4h13"/><path d="M7 21.5L3.5 18 7 14.5"/><path d="M20.5 12.5V14a4 4 0 0 1-4 4h-13"/>',
    eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    grid4:'<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>',
    pencil:'<path d="M4 20h4L19 9a2.83 2.83 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    star:'<path d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.2l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    minus:'<path d="M6 12h12"/>',
    plus:'<path d="M12 6v12M6 12h12"/>',
    shuffle:'<path d="M16 3.5h4.5V8"/><path d="M4 20L20.5 3.5"/><path d="M20.5 16v4.5H16"/><path d="M14.5 14.5l6 6"/><path d="M4 4l5 5"/>',
    target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".9" fill="currentColor"/>',
    hand:'<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M12 10.5V4a1.5 1.5 0 0 1 3 0v6.5"/><path d="M15 10.5V6a1.5 1.5 0 0 1 3 0v8a6.5 6.5 0 0 1-6.5 6.5h-.8a6 6 0 0 1-4.6-2.2L3.6 15a1.6 1.6 0 0 1 2.4-2.1L9 15V8a1.5 1.5 0 0 1 3 0"/>',
  };
  const svg = (k, style = '') => `<svg class="i" viewBox="0 0 24 24"${style ? ` style="${style}"` : ''}>${ICON[k]}</svg>`;
  const X = ' × ';
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const TALORD = ['inga','ett','två','tre','fyra','fem','sex','sju','åtta','nio','tio','elva','tolv'];
  const talord = n => n <= 12 ? TALORD[n] : String(n);

  function rng(seed){ return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(arr, r = Math.random){ const a = [...arr]; for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function hashStr(s){ let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  /* ═══════════════════════════════════════════════════════════
     SVARSALTERNATIV (ur mockupen)
     Vanlig fråga: distraktorer = tabellgrannar a×(b±1), (a±1)×b och diagonalgrannar.
     Omvänd fråga: fyra gångertal som delar en faktor; den andra faktorn är ett
     fönster med fyra tal i rad där rätt svar kan ligga var som helst.
  ═══════════════════════════════════════════════════════════ */
  function distractors(a, b, r = Math.random){
    // Raka grannar (samma tabell, ett steg) går före snedgrannar: 21 och 25 till 4 × 6
    // är tabellprodukter men ser slumpade ut och kan uteslutas på udda/jämnt.
    const c = a * b, direct = [], diag = [];
    const add = (L, x, y) => { if (x < 1 || y < 1) return; const v = x * y; if (v !== c && !direct.includes(v) && !diag.includes(v)) L.push(v); };
    add(direct, a, b - 1); add(direct, a, b + 1); add(direct, a - 1, b); add(direct, a + 1, b);
    add(diag, a - 1, b + 1); add(diag, a + 1, b - 1); add(diag, a - 1, b - 1); add(diag, a + 1, b + 1);
    const near = (x, y) => Math.abs(x - c) - Math.abs(y - c) || x - y;
    const cand = [...direct.sort(near), ...diag.sort(near)];
    for (let v = c + 1; cand.length < 3; v++) if (!cand.includes(v)) cand.push(v);   // bara 1 × 1 behöver detta
    // Båda sidor om svaret (annars räcker "välj minsta/största"), och fördelningen lottas:
    // ibland två under och ett över, ibland tvärtom. En fast fördelning gav svaret samma
    // storleksplats varje gång (3:ans tabell: alltid näst störst) — Mira tryckte bara där.
    const lo = cand.filter(v => v < c), hi = cand.filter(v => v > c);
    const splits = [1, 2].filter(k => lo.length >= k && hi.length >= 3 - k);
    let pick;
    if (splits.length){
      const k = splits[Math.floor(r() * splits.length)];
      pick = [...lo.slice(0, k), ...hi.slice(0, 3 - k)];
    } else {
      pick = cand.slice(0, 3);                   // bara små tal (1 × 1) saknar två sidor
    }
    // Udda × udda ger udda svar men bara jämna grannar: då pekar udda/jämnt ut svaret.
    // Byt in ett udda tal två steg bort i samma tabell (7 × 9: 7 × 7 = 49), svaren kvar på båda sidor.
    if (c % 2 && !pick.some(v => v % 2)){
      // Bytet sker på samma sida om svaret (lägre mot lägre, högre mot högre), så att den
      // lottade fördelningen står sig — annars blev svaret näst störst vid varje udda svar.
      const odds = shuffle([a * (b - 2), a * (b + 2), (a - 2) * b, (a + 2) * b]
        .filter(v => v >= 1 && v !== c && v % 2 && !pick.includes(v)), r);
      for (const o of odds){
        const same = [...pick.keys()].filter(i => (pick[i] < c) === (o < c))
          .sort((x, y) => Math.abs(pick[y] - c) - Math.abs(pick[x] - c));
        if (same.length){ pick[same[0]] = o; break; }
      }
    }
    return pick;
  }
  // Ordningen på skärmen lottas vid varje visning (även vid omfrågan), så platsen avslöjar aldrig svaret.
  const options = (a, b, r = Math.random) => shuffle([a * b, ...distractors(a, b, r)], r);

  function reverseOptions(a, b, r = Math.random){
    const c = a * b;
    const cands = [[a, b], [b, a]].filter(([f]) => f !== 1);
    const [f, g] = cands.length ? cands[Math.floor(r() * cands.length)] : [a, b];
    const wins = [];
    for (let s = g - 3; s <= g; s++) if (s >= 1 && s + 3 <= 12) wins.push([s, s + 1, s + 2, s + 3]);
    const xs = wins[Math.floor(r() * wins.length)].filter(x => f * x !== c || x === g);
    const firsts = shuffle([true, true, false, false], r);     // faktorn står först i exakt två alternativ
    return shuffle(xs, r).map((x, i) => {
      const A = firsts[i] ? f : x, B = firsts[i] ? x : f;
      return { a:A, b:B, v:f * x, ok:x === g, label:`${A}${X}${B}` };
    });
  }

  /* ═══════════════════════════════════════════════════════════
     STRATEGIERNA (ur mockupen). Konvention: a × b = a rader med b prickar i varje.
  ═══════════════════════════════════════════════════════════ */
  function waysFor(a){
    switch (a){
      case 1:  return [{ kind:'one' }];
      case 2:  return [{ kind:'double', levels:[1,2] }];
      case 3:  return [{ kind:'split', k1:2, k2:1 }];
      case 4:  return [{ kind:'double', levels:[1,2,4] }, { kind:'minus', N:5, k:1 }];
      case 5:  return [{ kind:'half' }];
      case 6:  return [{ kind:'split', k1:5, k2:1 }, { kind:'split', k1:3, k2:3 }];
      case 7:  return [{ kind:'split', k1:5, k2:2 }, { kind:'minus', N:10, k:3 }];
      case 8:  return [{ kind:'double', levels:[1,2,4,8] }, { kind:'split', k1:5, k2:3 }];
      case 9:  return [{ kind:'minus', N:10, k:1 }, { kind:'split', k1:5, k2:4 }];
      case 10: return [{ kind:'ten' }];
      case 11: return [{ kind:'split', k1:10, k2:1 }];
      case 12: return [{ kind:'split', k1:10, k2:2 }];
    }
  }
  /* hur enkel en faktors väg är som radantal (lägre = enklare); används när Öva väljer vilket håll rektangeln ritas */
  const wayRank = a => ({ 1:0, 10:1, 2:2, 5:3, 11:4, 3:5, 4:5, 9:6, 12:6, 6:7, 8:7, 7:8 })[a];
  const rowsFor = (a, w) => w.kind === 'minus' ? w.N : (w.kind === 'half' || w.kind === 'ten') ? 10 : a;
  const rader = n => n === 1 ? 'en rad' : `${n} rader`;
  const prickar = n => n === 1 ? 'en prick' : `${n} prickar`;
  function wayLabel(w){
    if (w.kind === 'split')  return `${w.k1} rader + ${rader(w.k2)}`;
    if (w.kind === 'double') return ['', '', 'Dubbelt en gång', 'Dubbelt två gånger', 'Dubbelt tre gånger'][w.levels.length];
    if (w.kind === 'minus')  return `${w.N} rader − ${rader(w.k)}`;
    if (w.kind === 'half')   return 'Hälften av 10 rader';
    return '';
  }
  function introText(a, b){
    if (a === 1) return `1${X}${b} är en rad med ${prickar(b)}.`;
    if (a === b) return `${a}${X}${a} är ${a} rader. Varje rad har lika många prickar.`;
    if (b === 1) return `${a}${X}1 är ${a} rader med en prick i varje.`;
    return `${a}${X}${b} är ${a} rader med ${b} prickar i varje.`;
  }
  function stepsFor(a, b, w){
    const ab = a * b, st = [];
    const res = html => ({ do:'result', html });
    if (w.kind === 'split'){
      const { k1, k2 } = w, p1 = k1 * b, p2 = k2 * b;
      st.push({ text:`Vi drar ett streck efter ${rader(k1)}.`, acts:[{ do:'split', at:k1 }, { do:'color', from:0, to:k1, c:'A' }, { do:'color', from:k1, to:a, c:'B' }] });
      st.push({ text:`Den blå delen: ${k1}${X}${b} = ${p1}.`, acts:[{ do:'chip', from:0, to:k1, c:'A', html:`${k1}${X}${b} = ${p1}` }] });
      st.push({ text:`Den orange delen: ${k2}${X}${b} = ${p2}.`, acts:[{ do:'chip', from:k1, to:a, c:'B', html:`${k2}${X}${b} = ${p2}` }] });
      st.push({ text:`Ihop: ${p1} + ${p2} = ${ab}. Så ${a}${X}${b} = ${ab}.`, acts:[res(`<span class="cA">${p1}</span> + <span class="cB">${p2}</span> = <span class="in">${ab}</span>`)] });
    } else if (w.kind === 'double'){
      const L = w.levels;
      st.push({ text:`Börja med en rad: ${prickar(b)}.`, acts:[{ do:'color', from:0, to:1, c:'A' }, { do:'chip', from:0, to:1, c:'A', html:`1${X}${b} = ${b}` }] });
      const lead = ['', 'Dubbelt', 'Dubbelt igen', 'Dubbelt en gång till'];
      for (let i = 1; i < L.length; i++){
        const n = L[i], prev = L[i - 1], v = prev * b;
        st.push({ text:`${lead[i]}: ${v} + ${v} = ${2 * v}. Nu är det ${n} rader.`,
          acts:[{ do:'color', from:0, to:prev, c:'A' }, { do:'chipsTo', c:'A' }, { do:'color', from:prev, to:n, c:'B' }, { do:'chip', from:prev, to:n, c:'B', html:`${n}${X}${b} = ${n * b}` }] });
      }
      st.push({ text:`${a === 2 ? 'Båda raderna' : `Alla ${a} rader`}: ${a}${X}${b} = ${ab}.`, acts:[{ do:'color', from:0, to:a, c:'A' }, { do:'chipsTo', c:'A' }, res(`${a}${X}${b} = <span class="in">${ab}</span>`)] });
    } else if (w.kind === 'minus'){
      const { N, k } = w, full = N * b, cut = k * b;
      st.push({ text:`Tänk dig ${k === 1 ? 'en rad' : `${k} rader`} till. Då blir det ${N} rader.`, acts:[{ do:'color', from:0, to:a, c:'A' }, { do:'extra', from:a, to:N }] });
      st.push({ text:`${N} rader: ${N}${X}${b} = ${full}.`, acts:[{ do:'chip', from:0, to:N, c:'A', html:`${N}${X}${b} = ${full}` }] });
      st.push({ text: k === 1 ? `Ta bort raden igen. Den har ${prickar(b)}.` : `Ta bort de ${k} raderna igen. De har ${k}${X}${b} = ${cut} prickar.`,
        acts:[{ do:'strike', from:a, to:N }, { do:'chip', from:a, to:N, c:'B', html:`− ${cut}`, lane:1 }] });
      st.push({ text:`${full} − ${cut} = ${ab}. Så ${a}${X}${b} = ${ab}.`, acts:[res(`<span class="cA">${full}</span> − <span class="cB">${cut}</span> = <span class="in">${ab}</span>`)] });
    } else if (w.kind === 'half'){
      st.push({ text:'Tänk dig 5 rader till. Då blir det 10 rader.', acts:[{ do:'color', from:0, to:5, c:'A' }, { do:'extra', from:5, to:10 }] });
      st.push({ text:`10 rader: 10${X}${b} = ${10 * b}.`, acts:[{ do:'chip', from:0, to:10, c:'A', html:`10${X}${b} = ${10 * b}` }] });
      st.push({ text:'5 rader är hälften av 10 rader.', acts:[{ do:'dim', from:5, to:10 }, { do:'chip', from:0, to:5, c:'D', html:'hälften', lane:1 }] });
      st.push({ text:`Hälften av ${10 * b} är ${5 * b}. Så 5${X}${b} = ${5 * b}.`, acts:[res(`hälften av ${10 * b} = <span class="in">${5 * b}</span>`)] });
    } else if (w.kind === 'one'){
      st.push({ text:`En rad med ${prickar(b)} är ${b}. Så 1${X}${b} = ${b}.`, acts:[{ do:'color', from:0, to:1, c:'A' }, res(`1${X}${b} = <span class="in">${b}</span>`)] });
    } else if (w.kind === 'ten'){
      const tior = b === 1 ? 'en tia' : `${b} tior`;
      st.push({ text:`Tio rader med ${b} i varje är ${tior}.`, acts:[{ do:'color', from:0, to:10, c:'A' }, { do:'chip', from:0, to:10, c:'A', html:tior }] });
      st.push({ text:`${cap(tior)} är ${10 * b}. Så 10${X}${b} = ${10 * b}.`, acts:[res(`10${X}${b} = <span class="in">${10 * b}</span>`)] });
    }
    return st;
  }
  /* hela kedjan (intro + stegen) för en väg */
  const strategySteps = (a, b, k = 0) => { const w = waysFor(a)[k]; return w ? [{ text:introText(a, b), acts:[] }, ...stepsFor(a, b, w)] : null; };

  /* Övriga förklaringstexter kring rektangeln – samma funktioner används av UI:t och textsvepet */
  const TXT = {
    flipStart:  'Vi vänder rektangeln ett kvarts varv.',
    flipDone:   (a, b) => `Nu är det ${b} rader med ${a} prickar i varje. Samma prickar, samma svar: ${b}${X}${a} = ${a * b}.`,
    choose:     'Det finns två vägar. Vilken vill du ta?',
    newIntro:   (a, b) => `Ett nytt tal! ${introText(a, b)}`,
    wrong:      (a, b) => `Inte riktigt. ${introText(a, b)}`,
    wrongSwap:  (a, b) => `Inte riktigt. ${a}${X}${b} är lika mycket som ${b}${X}${a}.`,
  };
  /* Alla texter barnet kan få se kring rektangeln för paret a × b (textsvepet i testerna) */
  function strategyTexts(a, b){
    const out = [];
    waysFor(a).forEach((w, k) => strategySteps(a, b, k).forEach(s => out.push(s.text)));
    if (waysFor(a).length > 1) out.push(TXT.choose);
    if (a !== b) out.push(TXT.flipStart, TXT.flipDone(a, b), TXT.wrongSwap(a, b));
    out.push(TXT.newIntro(a, b), TXT.wrong(a, b));
    return out;
  }

  /* ═══════════════════════════════════════════════════════════
     PASSBYGGET (Öva)
     - De nio kända platserna väljs i första hand bland bleknade kan-tal
       ("Dags igen", äldst due först), sedan övar och sedan övriga kan.
     - Nya tal tas i lätt-först-ordning: först efter den lättare faktorns
       väg (wayRank: 1:an, 10:an, 2:an, 5:an, 11:an ... 7:an sist), sedan
       efter den andra faktorns väg, sedan efter produkten. Det nya talet
       ritas med den lättare faktorn som rader (10 × 7, inte 7 × 10).
     - Ett nytt tal visas först (intro) och frågas sedan två gånger. Det
       frågas ALDRIG direkt efter att det visats, och inget tal frågas två
       gånger i rad. Mellanrummet är helst tre andra poster (mockupens pass:
       K, intro, K, K, K, fråga, K, K, K, fråga, K, K).
     - Ett nytt tal per pass. Är de kända talen för få krymper mellanrummet
       först (tre, två, ett). Räcker det ändå inte (tomt eller nästan tomt läge)
       tas upp till tre nya tal, som då håller isär varandra:
       intro A, intro B, A, B, A, B.
  ═══════════════════════════════════════════════════════════ */
  const NEW_GAP = 3;
  function easyKey([a, b]){ const x = wayRank(a), y = wayRank(b); return [Math.min(x, y), Math.max(x, y), a * b]; }
  function easyFirst(p, q){ const A = easyKey(p), B = easyKey(q); return A[0] - B[0] || A[1] - B[1] || A[2] - B[2]; }
  const orient = ([a, b]) => wayRank(a) <= wayRank(b) ? { a, b } : { a:b, b:a };

  function schedulePass(known, news, gap = NEW_GAP){
    const out = [], K = known.slice(), intros = news.slice(), pend = [];
    const lastKey = () => out.length ? KEY(out[out.length - 1].a, out[out.length - 1].b) : null;
    const ask = p => {
      out.push({ kind:'q', a:p.N.a, b:p.N.b, src:'ny', isNew:true });
      p.left--; p.due = out.length + gap;
      if (!p.left) pend.splice(pend.indexOf(p), 1);
    };
    for (let guard = 0; (K.length || intros.length || pend.length) && guard < 200; guard++){
      const i = out.length;
      const ready = pend.find(p => p.due <= i && p.key !== lastKey());
      if (ready){ ask(ready); continue; }
      if (intros.length && (i >= 1 || !K.length) && (!pend.length || !K.length)){
        const N = intros.shift();
        out.push({ kind:'intro', a:N.a, b:N.b, src:'ny', isNew:true });
        pend.push({ N, key:KEY(N.a, N.b), due:i + 1 + gap, left:2 });
        continue;
      }
      if (K.length){ out.push(K.shift()); continue; }
      const forced = pend.slice().sort((x, y) => x.due - y.due).find(p => p.key !== lastKey());
      if (forced){ ask(forced); continue; }
      break;                                            // bara talet som nyss stod kvar – resten stryks
    }
    return { items:out, dropped:pend.reduce((s, p) => s + p.left, 0) };
  }

  function buildPass(pairs, seed, day = today(), n = 12){
    const r = rng(seed);
    const by = k => pairsUpTo(n).filter(([a, b]) => vis(pairs[KEY(a, b)], day) === k);
    const ny = by('ny').sort(easyFirst);
    const dueP = by('due').sort((p, q) => { const x = pairs[KEY(...p)].due, y = pairs[KEY(...q)].due; return x < y ? -1 : x > y ? 1 : easyFirst(p, q); });
    const ov = shuffle(by('ovar'), r), kn = shuffle(by('kan'), r);
    const known = [...dueP.map(p => ({ p, src:'due' })), ...ov.map(p => ({ p, src:'ovar' })), ...kn.map(p => ({ p, src:'kan' }))].slice(0, 9);
    const K = shuffle(known, r).map(({ p, src }) => { const [a, b] = r() < .5 ? p : [p[1], p[0]]; return { kind:'q', a, b, src }; });
    [2, 5, 8].forEach(i => { if (K[i]) K[i].rev = true; });          // ungefär var fjärde fråga (bara kända tal)
    if (!ny.length) return K;
    // Minsta antal nya tal först, och inom det helst mellanrum tre, annars två, annars ett.
    let res = null;
    for (let m = 1; m <= Math.min(3, ny.length); m++){
      for (const gap of [NEW_GAP, 2, 1]){
        res = schedulePass(K, ny.slice(0, m).map(orient), gap);
        if (!res.dropped) return res.items;
      }
    }
    return res.items;
  }
  const passSeed = T => 1000 + T.passNo * 7 + (profile ? hashStr(String(profile.id)) % 997 : 0);

  /* ═══════════════════════════════════════════════════════════
     ÖVNINGSPASSET (rena funktioner – testas i tests/multiplication.test.mjs)
     Ett pass = valda tabeller × gånger 1–n, körda i varv. Varven går från
     lätt till svårt: Se svaret först (i ordning), Flerval, Fri inmatning
     (blandad ordning). Inom varje varv gäller nötloopen i createDrill.
  ═══════════════════════════════════════════════════════════ */
  const RTYPES = ['show', 'choice', 'free'];
  const RNAME  = { show:'Se svaret först', choice:'Flerval', free:'Fri inmatning' };
  const RHELP  = { show:'Svaret visas, sedan frågar jag. I ordning.', choice:'Fyra svar att välja bland.', free:'Skriv svaret själv.' };
  const PRESETS = [
    { k:'kort',    label:'Kort',    c:{ show:0, choice:1, free:1 } },
    { k:'vanligt', label:'Vanligt', c:{ show:1, choice:2, free:1 } },
    { k:'langt',   label:'Långt',   c:{ show:1, choice:3, free:2 } },
  ];
  const RMAX = 4;                                       // varje stegare 0–4
  const EST_S = { show:14, choice:10, free:12 };        // grov tid per fråga (sekunder)

  const clampCount = v => Math.max(0, Math.min(RMAX, Math.round(Number(v) || 0)));
  function normCounts(c){ c = c || {}; return { show:clampCount(c.show), choice:clampCount(c.choice), free:clampCount(c.free) }; }
  /* Stegarna → varvens ordning, alltid lätt till svårt */
  function roundTypes(counts){ const c = normCounts(counts), out = []; for (const t of RTYPES) for (let i = 0; i < c[t]; i++) out.push(t); return out; }
  const presetFor = counts => { const c = normCounts(counts); return (PRESETS.find(p => RTYPES.every(t => p.c[t] === c[t])) || {}).k || null; };
  /* Tabellerna 1–12. 11:an och 12:an är extraval och får väljas även när Gånger går upp till 10. */
  function cleanTables(tables){ return [...new Set((tables || []).map(Number))].filter(t => Number.isInteger(t) && t >= 1 && t <= 12).sort((x, y) => x - y); }
  /* Frågorna i ett varv. Se svaret först: tabell för tabell, 1, 2, 3 … Övriga: blandat. */
  function roundItems(type, tables, n, r = Math.random){
    const items = [];
    for (const t of tables) for (let m = 1; m <= n; m++) items.push({ a:t, b:m });
    return type === 'show' ? items : shuffle(items, r);
  }
  /* Paren i ett pass med parlista (De svåra talen): a ≤ b, 1–12, utan dubbletter, ordnade efter a och b */
  function cleanPairs(pairs){
    const seen = new Set(), out = [];
    for (const p of Array.isArray(pairs) ? pairs : []){
      if (!Array.isArray(p)) continue;
      const a = Math.min(Number(p[0]), Number(p[1])), b = Math.max(Number(p[0]), Number(p[1]));
      if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b > 12 || seen.has(KEY(a, b))) continue;
      seen.add(KEY(a, b)); out.push([a, b]);
    }
    return out.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  }
  /* Frågorna i ett varv med parlista: varje par en gång, ordningen a × b eller b × a lottas per fråga.
     Se svaret först: ordnade efter a och sedan b (som frågorna står), så att de läses tabellvis.
     Övriga varv: blandat. */
  function pairItems(type, pairs, r = Math.random){
    const items = cleanPairs(pairs).map(([a, b]) => r() < 0.5 ? { a, b } : { a:b, b:a });
    return type === 'show' ? items.sort((p, q) => p.a - q.a || p.b - q.b) : shuffle(items, r);
  }
  function buildRounds(cfg, n, r = Math.random){
    const types = roundTypes(cfg && cfg.counts);
    if (cfg && cfg.pairs) return types.map(type => ({ type, items:pairItems(type, cfg.pairs, r) }));
    const tables = cleanTables(cfg && cfg.tables);
    return types.map(type => ({ type, items:roundItems(type, tables, n, r) }));
  }
  /* cfg = { tables, counts } (tabeller × gånger 1–n) eller { pairs, counts, hard } (en parlista, n gäller inte) */
  function passPlan(cfg, n){
    const types = roundTypes(cfg && cfg.counts);
    const pairs = cfg && cfg.pairs ? cleanPairs(cfg.pairs) : null;
    const tables = pairs ? [] : cleanTables(cfg && cfg.tables);
    const perRound = pairs ? pairs.length : tables.length * n;
    const secs = types.reduce((s, t) => s + EST_S[t] * perRound, 0);
    return { tables, pairs, types, rounds:types.length, perRound, questions:perRound * types.length, minutes:secs ? Math.max(1, Math.round(secs / 60)) : 0 };
  }
  const varvTxt = n => `${cap(talord(n))} varv`;
  const minTxt = m => m === 1 ? 'en minut' : `${m} minuter`;
  function planSummary(pl){
    if (!pl.perRound) return pl.pairs ? 'Välj minst ett tal.' : 'Välj minst en tabell.';
    if (!pl.rounds) return 'Välj minst ett varv.';
    return `${varvTxt(pl.rounds)} · ${pl.questions} ${pl.questions === 1 ? 'fråga' : 'frågor'} · ungefär ${minTxt(pl.minutes)}`;
  }

  /* ═══════════════════════════════════════════════════════════
     DE SVÅRA TALEN (v62): paren a × b med a ≤ b och a, b i {3, 4, 6, 7, 8, 9}.
     Det är de 21 rutor som lektionen "Tabellen är mindre än du tror" lämnar kvar
     (1, 2, 5, 10, 11 och 12 har en genväg, tvillingarna räknas en gång).
     Mängden är densamma oavsett Gånger. Rena funktioner.
  ═══════════════════════════════════════════════════════════ */
  const HARD_T = [3, 4, 6, 7, 8, 9];
  function hardPairs(){ const out = []; for (const a of HARD_T) for (const b of HARD_T) if (a <= b) out.push([a, b]); return out; }
  /* Lådorna för de svåra talen. Dags igen räknas som Kan (som i medaljerna). weak = de som inte är Kan än. */
  function hardInfo(pairs, day = today()){
    const c = { kan:0, due:0, ovar:0, ny:0 }, weak = [], all = hardPairs();
    for (const [a, b] of all){
      const st = pairs && pairs[KEY(a, b)], v = st ? vis(st, day) : 'ny';
      c[v]++;
      if (v !== 'kan' && v !== 'due') weak.push([a, b]);
    }
    const kan = c.kan + c.due;
    return { total:all.length, kan, counts:c, weak, share:kan / all.length };
  }
  /* Standardvalet: "Bara de du inte kan än" när minst fem återstår, annars "Alla 21" */
  const hardDefault = weakN => weakN >= 5 ? 'weak' : 'all';
  function hardSelection(pairs, mode, day = today()){
    const w = hardInfo(pairs, day).weak;
    return mode === 'weak' && w.length ? w : hardPairs();
  }
  /* Passet för De svåra talen: parlistan och de sparade varven (samma varv som snabbvalen) */
  function hardCfg(pairs, mode, saved, day = today()){ return { pairs:hardSelection(pairs, mode, day), counts:countsFrom(saved), hard:true }; }
  /* "Du kan N av M". Alla kan: "Du kan alla M" – samma tal får inte stå för två saker i en mening. */
  const kanTxt = (k, total, unit = '') => k >= total ? `Du kan alla ${total}${unit}` : `Du kan ${k} av ${total}${unit}`;
  const HARD_WHY = 'De här 21 talen har ingen enkel genväg. Här tränar du bara dem.';
  const HARD_ALL_OK = 'Snyggt! Du kan alla de svåra talen. Öva dem ibland, så sitter de kvar.';
  const hardWeakLabel = n => `Bara de du inte kan än (${n})`;
  const hardWhat = e => { const k = (e.pairs || []).length; return !k || k >= hardPairs().length ? 'De svåra talen' : `${k} av de svåra talen`; };

  /* NÖTLOOPEN i ett varv: MP.createDrill i js/shared.js (v63: delas med Klockan).
     Fel ger samma fråga direkt igen och en gång till senare; bara första försöket räknas. */
  const createDrill = SH.createDrill;

  /* "Så kan du tänka" i passet: har den andra faktorn en enklare väg (7 × 2 → 2 × 7,
     dubbelt)? Då ritas den som rader, som i Öva. */
  function passExplainFor(a, b){
    const swap = wayRank(b) < wayRank(a), ea = swap ? b : a, eb = swap ? a : b;
    return { ea, eb, text:swap ? `${a}${X}${b} är lika mycket som ${ea}${X}${eb}. ${introText(ea, eb)}` : introText(ea, eb) };
  }

  /* Kvittots siffror, tiden och berömmet: js/shared.js (v63: delas med Klockan) */
  const { receiptFor, durTxt, praiseFor } = SH;

  /* ═══════════════════════════════════════════════════════════
     TRÄNARENS TILLSTÅND (per montering av hubben)
  ═══════════════════════════════════════════════════════════ */
  const S = { screen:'hub', T:null, record:{ streak:0, clock:0 }, learn:{ a:7, b:8 } };
  let hubMap = null, endMap = null, learnRect = null, pracRect = null, passRect = null, ctrlP = null, ctrlR = null, ctrlS = null;
  let PS = null, SU = null;                              // övningspasset som körs · inställningsskärmen
  let LW = null, LF = 0;                                 // LF: 0 ej vänd, 1 vänd (väntar på slutsats), 2 klar
  let P = null, R = null, clockId = null;
  const E = { i:0 };
  let busy = false;
  const curVis = () => visMap(S.T.pairs, today(), UPTO());
  const reloadT = () => { S.T = loadTrainer(); };

  /* Gångaren: en strategi steg för steg, delad av Lär dig och Öva */
  function makeWalker(a, b){
    const ways = waysFor(a);
    // fast: bara första vägen ritas; välj väg: plats för båda så rektangeln inte flyttar sig vid valet
    const used = SET.strat === 'valj' ? ways : ways.slice(0, 1);
    return { a, b, ways, way:null, steps:null, i:0, stage:'intro', rows:Math.max(...used.map(w => rowsFor(a, w))) };
  }
  const needsChoice = W => SET.strat === 'valj' && W.ways.length > 1 && W.stage === 'intro';
  function walkerChoose(W, k){ W.way = W.ways[k]; W.steps = stepsFor(W.a, W.b, W.way); W.i = 0; W.stage = 'run'; }
  async function walkerStep(W, rect, sayFn){
    if (W.stage === 'intro' || W.stage === 'choice') walkerChoose(W, 0);
    const s = W.steps[W.i++];
    if (W.i >= W.steps.length) W.stage = 'done';
    sayFn(s.text);
    await wait(LEAD);
    await rect.apply(s.acts);
  }

  /* ═══════════════════════════════════════════════════════════
     PRICKREKTANGELN (ur mockupen)
  ═══════════════════════════════════════════════════════════ */
  const COL = { A:'#3b82f6', B:'#f97316', D:'#7c3aed' };
  function makeRect(host){
    const Rc = {};
    let grid, margin, result, dots = [], a, b, rows, p, x0, y0, gh, W;
    Rc.setup = (A, B, ROWS) => {
      a = A; b = B; rows = ROWS;
      W = host.clientWidth; const H = host.clientHeight;
      const resH = 34, marginW = 118, mgap = 12;
      gh = H - resH - 6;
      p = Math.max(10, Math.min(26, Math.floor(gh / Math.max(rows, b)), Math.floor((W - marginW - mgap) / Math.max(a, b))));
      const d = Math.round(p * .7), off = (p - d) / 2;
      x0 = Math.round((W - (b * p + mgap + marginW)) / 2); y0 = Math.round((gh - rows * p) / 2);
      host.innerHTML = '<div class="rgrid"></div><div class="rmargin"></div><div class="rresult"></div>';
      [grid, margin, result] = host.children;
      Object.assign(grid.style, { left:x0 + 'px', top:y0 + 'px', width:b * p + 'px', height:rows * p + 'px', transform:'' });
      Object.assign(margin.style, { left:(x0 + b * p + mgap) + 'px', top:y0 + 'px', width:marginW + 'px', height:rows * p + 'px' });
      margin.style.setProperty('--ch', Math.min(24, p - 1) + 'px');
      margin.style.setProperty('--cf', (p >= 22 ? 14 : 12) + 'px');
      Object.assign(result.style, { top:(gh + 6) + 'px', height:resH + 'px' });
      let html = '';
      for (let r = 0; r < rows; r++) for (let c = 0; c < b; c++)
        html += `<i class="dot${r >= a ? ' ex' : ''}" data-r="${r}" style="left:${c * p + off}px;top:${r * p + off}px;width:${d}px;height:${d}px"></i>`;
      grid.innerHTML = html;
      dots = [...grid.querySelectorAll('.dot')];
    };
    Rc.reveal = async () => {
      const shown = dots.filter(el => +el.dataset.r < a);
      shown.forEach(el => el.style.transitionDelay = (+el.dataset.r * 35) + 'ms');
      await frame();
      shown.forEach(el => el.classList.add('on'));
      await wait(a * 35 + 450);
      shown.forEach(el => el.style.transitionDelay = '');
    };
    const rowDots = (f, t) => dots.filter(el => { const r = +el.dataset.r; return r >= f && r < t; });
    const line = (cls, top, extra) => { const l = document.createElement('div'); l.className = cls; Object.assign(l.style, { left:(-extra) + 'px', width:(b * p + 2 * extra) + 'px', top:top + 'px' }); grid.append(l); return l; };
    async function act(x){
      switch (x.do){
        case 'color': rowDots(x.from, x.to).forEach(el => { el.classList.remove('A', 'B'); el.classList.add(x.c); }); await wait(120); return;
        case 'split': { const l = line('rline', x.at * p - 1.5, 6); await frame(); l.classList.add('on'); await wait(420); return; }
        case 'extra': rowDots(x.from, x.to).forEach(el => el.classList.add('on')); await wait(480); return;
        case 'strike': {
          const ls = []; for (let r = x.from; r < x.to; r++) ls.push(line('rstrike', r * p + p / 2 - 1.5, 4));
          await frame(); ls.forEach(l => l.classList.add('on')); rowDots(x.from, x.to).forEach(el => el.classList.add('dim')); await wait(450); return;
        }
        case 'dim': rowDots(x.from, x.to).forEach(el => el.classList.add('dim')); await wait(420); return;
        case 'chip': {
          const lane = x.lane || 0, mid = (x.from + x.to) / 2 * p, ch = Math.min(24, p - 1);
          const br = document.createElement('div'); br.className = 'rbrace';
          Object.assign(br.style, { left:(lane * 6) + 'px', top:(x.from * p + 3) + 'px', height:Math.max(4, (x.to - x.from) * p - 6) + 'px', background:COL[x.c] });
          const c = document.createElement('div'); c.className = 'rchip in'; c.style.setProperty('--c', COL[x.c]); c.innerHTML = x.html;
          Object.assign(c.style, { left:(lane * 6 + 9) + 'px', top:(mid - ch / 2) + 'px' });
          c.addEventListener('animationend', () => c.classList.remove('in'), { once:true });
          margin.append(br, c); await wait(450); return;
        }
        case 'chipsTo':
          margin.querySelectorAll('.rchip').forEach(c => c.style.setProperty('--c', COL[x.c]));
          margin.querySelectorAll('.rbrace').forEach(c => c.style.background = COL[x.c]); return;
        case 'result': result.innerHTML = x.html; result.classList.remove('on'); void result.offsetWidth; result.classList.add('on'); await wait(500); return;
        case 'rotate': {
          margin.classList.add('fade');
          rowDots(a, rows).forEach(el => el.classList.remove('on'));
          grid.querySelectorAll('.rstrike').forEach(l => l.style.opacity = 0);
          await wait(320);
          const cx = b * p / 2, cy = a * p / 2, tx = W / 2 - x0 - cx, ty = gh / 2 - y0 - cy;
          grid.style.transformOrigin = `${cx}px ${cy}px`;
          grid.style.transform = `translate(${tx}px,${ty}px) rotate(-90deg)`;
          await wait(880); return;
        }
      }
    }
    Rc.apply = async acts => { for (const x of acts) await act(x); };
    Rc.info = () => ({ a, b, rows, p, W, gh });
    return Rc;
  }

  /* ═══════════════════════════════════════════════════════════
     GEMENSAMT: bubbla, lås, skärmbyte
  ═══════════════════════════════════════════════════════════ */
  function say(id, t1, t2 = ''){
    const th = $(id); if (!th) return;
    th.innerHTML = `<span>${t1}</span>${t2 ? `<span class="sm">${t2}</span>` : ''}`;
    th.classList.remove('pop'); void th.offsetWidth; th.classList.add('pop');
  }
  async function run(fn){
    if (busy) return;
    busy = true; refresh();
    try { await fn(); } finally { busy = false; refresh(); }
  }
  function refresh(){
    if (!$('app')) return;
    ({ hub:refreshHub, learn:refreshLearn, prac:refreshPrac, end:refreshEnd, rec:refreshRec, setup:refreshSetup, pass:refreshPass, done:() => {}, tstart:() => {}, hstart:() => {} })[S.screen]();
  }
  function btn(el, label, icon, after = true){ el.innerHTML = after ? `${label} ${icon ? svg(icon) : ''}` : `${icon ? svg(icon) : ''} ${label}`; }
  const TITLES = { hub:'Gångertabellen', learn:'Lär dig strategin', prac:'Öva blandat', end:'Passet klart', rec:'Rekordrunda',
                   setup:'Ställ in passet', pass:'Övningspass', done:'Övningspass', tstart:'Träna en tabell', hstart:'De svåra talen' };
  function goto(name, arg){
    if (S.screen === 'rec') stopClock();
    if (S.screen === 'pass' && name !== 'pass' && PS) PS.token++;   // väntande steg i passet får inte köra vidare
    busy = false;
    closeModalSafe();
    S.screen = name;
    document.querySelectorAll('#mt-app .gscr').forEach(s => s.classList.toggle('on', s.id === 'mt-scr-' + name));
    $('title').textContent = TITLES[name];
    $('cap').classList.toggle('on', name === 'prac');
    $('backBtn').textContent = name === 'pass' ? 'Avbryt' : 'Tillbaka';
    $('gear').style.visibility = (name === 'pass' || name === 'done') ? 'hidden' : '';
    ({ hub:enterHub, learn:enterLearn, prac:enterPrac, end:enterEnd, rec:enterRec, setup:enterSetup, pass:enterPass, done:enterDone, tstart:enterTStart, hstart:enterHStart })[name](arg);
  }

  /* ═══════════════════════════════════════════════════════════
     TABELLKARTAN (komponent: hubben, slutbilden och lektionen har var sin)
  ═══════════════════════════════════════════════════════════ */
  /* n = hur långt tabellerna går (10, 11, 12), cell = rutans storlek i px.
     v60: radnumren är vanlig text – snabbvalen under kartan ersätter dem. */
  function makeMap(el, n = 12, cell = 24){
    const cells = [], rowH = [], colH = [];
    el.innerHTML = '';
    el.style.gridTemplateColumns = `repeat(${n + 1},${cell}px)`;
    el.style.gridAutoRows = `${cell}px`;
    const mk = (cls, txt = '') => { const d = document.createElement('div'); d.className = cls; d.textContent = txt; el.append(d); return d; };
    mk('mh x', '×');
    for (let c = 1; c <= n; c++) colH[c] = mk('mh', c);
    for (let a = 1; a <= n; a++){
      rowH[a] = mk('mh', a);
      cells[a] = [];
      for (let b = 1; b <= n; b++){ const d = mk('mc'); d.dataset.a = a; d.dataset.b = b; cells[a][b] = d; }
    }
    const all = () => cells.flatMap((row, a) => row ? row.slice(1).map((c, i) => ({ el:c, a, b:i + 1 })) : []);
    return {
      el, cells, rowH, colH, all, n, pitch:cell + 2,
      paint(V){
        el.classList.remove('neutral');
        rowH.forEach(h => h && h.classList.remove('dim')); colH.forEach(h => h && h.classList.remove('dim'));
        for (const { el:c, a, b } of all()){ c.className = 'mc ' + V[KEY(a, b)]; c.style.transform = ''; c.innerHTML = ''; }
      },
    };
  }
  const bTag = pop => `<b${pop ? ' class="pop"' : ''}>`;
  const legendHTML = (c, pop = false) =>
    `<span><i style="background:var(--kan)"></i>Kan ${bTag(pop)}${c.kan}</b></span>` +
    `<span><i class="sw-due"></i>Dags igen ${bTag(pop)}${c.due}</b></span>` +
    `<span><i style="background:var(--ovar)"></i>Övar ${bTag(pop)}${c.ovar}</b></span>` +
    `<span><i class="sw-ny"></i>Ny ${bTag(pop)}${c.ny}</b></span>`;
  const countHTML = (n, pop = false) => n === 0
    ? `${bTag(pop)}0</b><span>tal kvar —<br>hela tabellen är grön</span>`
    : `${bTag(pop)}${n}</b><span>tal kvar<br>att lära</span>`;
  const refillHTML = m => m > 0 ? `<i></i>${m} att fylla på` : '';

  /* ── Medaljerna (SVG, samma form för alla tre: band + medalj + stjärna; färgen skiljer) ── */
  const MEDAL_NAME = { guld:'Guld', silver:'Silver', brons:'Brons' };
  const medalSVG = kind => SH.medalSVG(kind);          // js/shared.js, lila band (v63: delas med Klockan)
  const medalWrap = m => `${medalSVG(m.medal)}${m.due ? '<i class="mdue"></i>' : ''}`;
  function tableBtnHTML(m){
    const lbl = `${m.t}:ans tabell. ${m.medal ? MEDAL_NAME[m.medal] : 'Ingen medalj än'}. ${kanTxt(m.kan, m.total, ' tal')}.${m.due ? ' Några tal behöver fyllas på.' : ''}`;
    return `<button class="tb" data-t="${m.t}" aria-label="${lbl}"><span class="tb-top"><b>${m.t}</b><span class="tb-md">${medalWrap(m)}</span></span>` +
      `<span class="tb-bar"><i style="width:${Math.round(m.share * 100)}%"></i></span></button>`;
  }

  /* ═══════════════════════════════════════════════════════════
     HUBBEN (v60): kompakt karta med framstegen, Träna en tabell, varvraden, tre ingångar
  ═══════════════════════════════════════════════════════════ */
  function enterHub(){ reloadT(); renderHub(); }
  const RICON = { show:'eye', choice:'grid4', free:'pencil' };
  /* En liten ikon per varv. Fler än sex varv får inte plats på raden – då en ikon per sort med antal. */
  const roundIcons = types => types.length <= 6
    ? types.map(t => `<i class="ri ri-${t}" title="${RNAME[t]}">${svg(RICON[t])}</i>`).join('')
    : RTYPES.filter(t => types.includes(t)).map(t => `<span class="rig"><i class="ri ri-${t}" title="${RNAME[t]}">${svg(RICON[t])}</i>×${types.filter(x => x === t).length}</span>`).join('');
  function renderHub(){
    const n = UPTO(), V = curVis(), c = counts(V);
    hubMap.paint(V);
    $('scr-hub').classList.toggle('tight', n > 10);        // 11–12: Extra-raden tar plats, inget får scrolla
    $('hubHead').innerHTML = countHTML(leftToLearn(V));
    $('hubLegend').innerHTML = legendHTML(c);
    $('hubRefill').innerHTML = refillHTML(c.due);
    $('hubRefill').style.display = c.due ? '' : 'none';
    // Träna en tabell: 1–10, och 11–12 under Extra när Gånger når dit
    const q = quickTables(n), med = t => tableMedal(S.T.pairs, t, n);
    $('hubTables').innerHTML = q.main.map(t => tableBtnHTML(med(t))).join('');
    $('hubXTables').innerHTML = q.extra.map(t => tableBtnHTML(med(t))).join('');
    $('hubExtra').style.display = q.extra.length ? '' : 'none';
    // De svåra talen: samma 21 par oavsett Gånger
    const hi = hardInfo(S.T.pairs);
    $('hubHardTxt').textContent = kanTxt(hi.kan, hi.total);
    $('hubHardBar').style.width = `${Math.round(hi.share * 100)}%`;
    $('hubHard').setAttribute('aria-label', `De svåra talen. ${kanTxt(hi.kan, hi.total)}.`);
    // Varvraden: varven som snabbvalen kör
    const types = roundTypes(countsFrom(loadOvp()));
    $('vrTxt').textContent = varvTxt(types.length);
    $('vrIcons').innerHTML = roundIcons(types);
    const kanAll = c.kan + c.due;
    $('icRec').innerHTML = svg(kanAll < 10 ? 'lock' : 'trophy');
    const pv = buildPass(S.T.pairs, passSeed(S.T), today(), n);
    $('subPrac').textContent = `${pv.filter(it => it.kind === 'q').length} frågor`;
    $('subLearn').textContent = 'Så kan du tänka';
    $('subRec').textContent = kanAll < 10 ? 'När du kan 10 tal'
      : SET.tempo === 'klocka' ? 'En minut'
      : S.record.streak > 0 ? `Rekord ${S.record.streak} i rad` : 'Sätt ett rekord';
    refreshHub();
  }
  function refreshHub(){
    const c = counts(curVis());
    $('goRec').disabled = c.kan + c.due < 10;
  }

  /* ── Startskärmen för en tabell: två tryck från hemvyn till första frågan ── */
  let TS = null;
  function enterTStart(t){
    t = +t;
    if (!quickTables(UPTO()).main.concat(quickTables(UPTO()).extra).includes(t)){ goto('hub'); return; }
    reloadT();
    TS = { t, cfg:quickPassCfg(t, loadOvp()) };
    renderTStart();
  }
  function renderTStart(){
    if (!TS) return;
    const n = UPTO(), t = TS.t, m = tableMedal(S.T.pairs, t, n), rank = m.medal ? MEDALS.indexOf(m.medal) : -1;
    TS.cfg = quickPassCfg(t, loadOvp());
    $('tsMd').innerHTML = medalWrap(m);
    $('tsTitle').textContent = `${t}:ans tabell`;
    $('tsKan').textContent = `${kanTxt(m.kan, m.total, ' tal')}.`;
    $('tsBar').style.width = `${Math.round(m.share * 100)}%`;
    const rows = [
      ['guld', `<b>Guld:</b> du kan alla tal i ${t}:ans tabell`],
      ['silver', '<b>Silver:</b> du kan minst hälften av talen'],
      ['brons', '<b>Brons:</b> du har övat på alla tal'],
    ];
    $('tsMedals').innerHTML = rows.map(([k, txt]) =>
      `<div class="tsm${MEDALS.indexOf(k) <= rank ? '' : ' off'}"><span class="tsm-md">${medalSVG(k)}</span><span>${txt}</span><span class="tsm-ok">${svg('check')}</span></div>`).join('') +
      (m.due ? `<div class="tsm fill"><i></i><span>${m.due} tal att fylla på</span></div>` : '');
    const pl = passPlan(TS.cfg, n);
    $('tsRounds').classList.toggle('two', pl.types.length > 5);
    $('tsRounds').innerHTML = pl.types.map((ty, k) => `<span class="ts-r"><em>${k + 1}.</em><i class="ri ri-${ty}">${svg(RICON[ty])}</i>${RNAME[ty]}</span>`).join('');
    $('tsSum').textContent = planSummary(pl);
    btn($('tsGo'), 'Starta', 'play', false);
    $('tsEdit').textContent = 'Ändra varv';
  }
  function startTStart(){
    if (busy || !TS) return;
    const cfg = quickPassCfg(TS.t, loadOvp());
    if (!cfg.tables.length || !roundTypes(cfg.counts).length) return;
    snd('click');
    goto('pass', cfg);                                   // samma pass som passinställningen startar
  }

  /* ── Startskärmen för De svåra talen (v62): samma delar som tabellens startskärm ── */
  let HS = null;
  /* Liten karta 6 × 6 över 3, 4, 6, 7, 8, 9. Varje par färgas efter Miras låda på en plats:
     på och under diagonalen, samma triangel som lektionen lämnar kvar. Spegelrutan ovanför är tom. */
  function makeHardMap(el, cell = 24){
    el.innerHTML = '';
    el.style.gridTemplateColumns = `repeat(${HARD_T.length + 1},${cell}px)`;
    el.style.gridAutoRows = `${cell}px`;
    const mk = (cls, txt = '') => { const d = document.createElement('div'); d.className = cls; d.textContent = txt; el.append(d); return d; };
    mk('mh x', '×');
    HARD_T.forEach(t => mk('mh', t));
    const cells = [];
    for (const a of HARD_T){
      mk('mh', a);
      for (const b of HARD_T){ const d = mk('mc'); d.dataset.a = a; d.dataset.b = b; cells.push({ el:d, a, b }); }
    }
    return {
      paint(pairs){
        for (const { el:c, a, b } of cells){
          const st = pairs[KEY(a, b)];
          c.className = b > a ? 'mc mirror' : `mc ${st ? vis(st) : 'ny'}`;
        }
      },
    };
  }
  let hardMap = null;
  function enterHStart(){
    reloadT();
    HS = { mode:hardDefault(hardInfo(S.T.pairs).weak.length) };
    if (!hardMap) hardMap = makeHardMap($('hsMap'));
    renderHStart();
  }
  function renderHStart(){
    if (!HS) return;
    const info = hardInfo(S.T.pairs), weakN = info.weak.length;
    if (!weakN) HS.mode = 'all';
    const cfg = hardCfg(S.T.pairs, HS.mode, loadOvp());
    $('hsKan').textContent = `${kanTxt(info.kan, info.total, ' tal')}.`;
    $('hsBar').style.width = `${Math.round(info.share * 100)}%`;
    hardMap.paint(S.T.pairs);
    $('hsLegend').innerHTML = legendHTML(info.counts);
    const pick = $('hsPick');
    pick.querySelector('[data-v="weak"]').textContent = hardWeakLabel(weakN);
    pick.querySelector('[data-v="weak"]').style.display = weakN ? '' : 'none';
    pick.classList.toggle('one', !weakN);
    pick.querySelectorAll('button').forEach(b => { const on = b.dataset.v === HS.mode; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    $('hsPraise').textContent = weakN ? '' : HARD_ALL_OK;
    $('hsPraise').style.display = weakN ? 'none' : '';
    const pl = passPlan(cfg, UPTO());
    $('hsRounds').classList.toggle('two', pl.types.length > 1);
    $('hsRounds').innerHTML = pl.types.map((ty, k) => `<span class="ts-r"><em>${k + 1}.</em><i class="ri ri-${ty}">${svg(RICON[ty])}</i>${RNAME[ty]}</span>`).join('');
    $('hsSum').textContent = planSummary(pl);
    btn($('hsGo'), 'Starta', 'play', false);
    $('hsEdit').textContent = 'Ändra varv';
  }
  function startHStart(){
    if (busy || !HS) return;
    const cfg = hardCfg(S.T.pairs, HS.mode, loadOvp());
    if (!cfg.pairs.length || !roundTypes(cfg.counts).length) return;
    snd('click');
    goto('pass', cfg);                                   // samma pass och nötloop, med en parlista
  }

  /* ═══════════════════════════════════════════════════════════
     LEKTIONEN "Tabellen är mindre än du tror" (Lär dig strategin, v60)
     Förr "Så krymper tabellen" på hemvyn. Spelas på en egen karta med
     neutrala rutor – hemvyns karta rörs aldrig av en lektion.
  ═══════════════════════════════════════════════════════════ */
  /* Stegen beror på hur långt tabellerna går: med 1–10 finns inget 11/12-steg */
  function shrinkSteps(n = 12){
    const big = n === 12 ? { text:() => `11:an och 12:an är 10:an och lite till: 12${X}7 = 70 + 14. Vi stryker deras rader och kolumner.`, rm:[11, 12] }
      : n === 11 ? { text:() => `11:an är 10:an och lite till: 11${X}7 = 70 + 7. Vi stryker 11:ans rad och kolumn.`, rm:[11] } : null;
    return [
      { text:() => `Hela tabellen har ${n * n} rutor. Nu stryker vi en del i taget.`, act:'neutral' },
      { text:() => `Gånger 1 ändrar inget: 1${X}7 = 7. Vi stryker 1:ans rad och kolumn.`, rm:[1] },
      { text:() => `Gånger 10 sätter en nolla efter talet: 10${X}7 = 70. Vi stryker 10:ans rad och kolumn.`, rm:[10] },
      { text:() => `Gånger 2 är dubbelt: 2${X}7 = 7 + 7. Vi stryker 2:ans rad och kolumn.`, rm:[2] },
      { text:() => `Gånger 5 är hälften av gånger 10: 5${X}7 är hälften av 70. Vi stryker 5:ans rad och kolumn.`, rm:[5] },
      ...(big ? [big] : []),
      { text:() => `3${X}7 och 7${X}3 blir lika mycket. Därför räcker det att lära sig varje par en gång.`, act:'twins' },
      // "rutor", inte "tal": hemvyns "N tal kvar att lära" är ett annat tal
      { text:k => `Kvar blir ${k} svåra rutor. Dem övar vi på.`, act:'final' },
    ];
  }
  /* Rutorna kvar efter varje steg (samma regler som animationen: strukna rader och
     kolumner försvinner, tvillingarna ovanför diagonalen flyger till sin spegelbild). */
  function shrinkTrace(n = 12){
    let live = [];
    for (let a = 1; a <= n; a++) for (let b = 1; b <= n; b++) live.push([a, b]);
    return shrinkSteps(n).map(st => {
      if (st.rm) live = live.filter(([a, b]) => !st.rm.includes(a) && !st.rm.includes(b));
      if (st.act === 'twins') live = live.filter(([a, b]) => b <= a);
      return live;
    });
  }
  const shrinkRemain = (n = 12) => shrinkTrace(n).map(l => l.length);
  /* Rutorna som finns kvar i lektionens slutsteg – samma mängd som De svåra talen */
  const shrinkLive = (n = 12) => shrinkTrace(n).slice(-1)[0];
  const LS = { on:false, i:-1, steps:shrinkSteps(10) };
  let lessonMap = null;
  const LESSON_CELL = { 10:26, 11:24, 12:22 };
  const liveCells = () => lessonMap.all().filter(c => !c.el.classList.contains('gone') && !c.el.classList.contains('flown'));
  function lessonCount(n, pop){ $('lessonCount').innerHTML = `<span>Kvar i tabellen: ${bTag(pop)}${n}</b> rutor</span>`; }
  function startLesson(){
    const n = UPTO();
    LS.on = true; LS.i = -1; LS.steps = shrinkSteps(n);
    $('scr-learn').classList.add('lesson');
    lessonMap = makeMap($('lessonMap'), n, LESSON_CELL[n]);
    lessonMap.el.classList.add('neutral');              // neutrala rutor från start – inte Miras färger
    lessonCount(n * n);
    refreshLearn();
    run(() => lessonStep(0));
  }
  async function lessonStep(k){
    const st = LS.steps[k]; LS.i = k;
    const tables = st.rm, M = lessonMap;
    say('lessonBubble', st.text(k === LS.steps.length - 1 ? liveCells().length : 0));
    refreshLearn();
    await wait(LEAD + 120);
    if (st.act === 'neutral'){
      M.el.classList.add('neutral'); await wait(500); lessonCount(M.n * M.n, true);
    } else if (tables){
      const hit = liveCells().filter(c => tables.includes(c.a) || tables.includes(c.b));
      tables.forEach(t => { M.rowH[t].classList.add('dim'); M.colH[t].classList.add('dim'); });
      hit.forEach(c => c.el.classList.add('mark'));
      await wait(520);
      hit.forEach(c => { c.el.classList.remove('mark'); c.el.classList.add('gone'); });
      await wait(480);
      lessonCount(liveCells().length, true);
    } else if (st.act === 'twins'){
      const up = liveCells().filter(c => c.b > c.a);
      up.forEach(c => {
        const twin = M.cells[c.b][c.a];
        c.el.classList.add('fly');
        c.el.style.transform = `translate(${(c.a - c.b) * M.pitch}px,${(c.b - c.a) * M.pitch}px)`;
        c.el.classList.add('flown');
        setTimeout(() => { twin.classList.remove('twin'); void twin.offsetWidth; twin.classList.add('twin'); }, 600);
      });
      await wait(1400);
      lessonCount(liveCells().length, true);
    } else if (st.act === 'final'){
      liveCells().forEach(c => c.el.classList.add('glow'));
      await wait(850);
      liveCells().forEach(c => c.el.classList.remove('glow'));
    }
  }
  function onLessonMain(){
    if (busy || !LS.on) return;
    if (LS.i >= LS.steps.length - 1){ startLesson(); return; }
    run(() => lessonStep(LS.i + 1));
  }

  /* ═══════════════════════════════════════════════════════════
     LÄR DIG STRATEGIN
  ═══════════════════════════════════════════════════════════ */
  const LT = [2, 4, 5, 6, 7, 8, 9];
  function enterLearn(){ LS.on = false; startLearn(); }
  function startLearn(){
    if (LS.on){ startLesson(); return; }
    $('scr-learn').classList.remove('lesson');          // rektangeln mäter sin yta: den måste synas först
    S.learn.b = Math.min(S.learn.b, UPTO());
    const { a, b } = S.learn;
    LW = makeWalker(a, b); LF = 0;
    $('learnEq').innerHTML = `${a}<span class="x">×</span>${b}`;
    learnRect.setup(a, b, LW.rows);
    run(async () => { say('learnBubble', introText(a, b)); await wait(LEAD); await learnRect.reveal(); });
  }
  function refreshLearn(){
    $('scr-learn').classList.toggle('lesson', LS.on);
    $('learnChap').classList.toggle('on', LS.on);
    $('learnChap').setAttribute('aria-pressed', LS.on);
    $('learnTabs').querySelectorAll('button').forEach(x => x.classList.toggle('on', !LS.on && +x.dataset.t === S.learn.a));
    if (LS.on){
      const last = LS.i >= LS.steps.length - 1;
      btn($('lessonMain'), 'Nästa steg', 'next');
      $('lessonMain').disabled = busy;
      // Slutsteget: "Kvar blir 21 svåra rutor. Dem övar vi på." → Träna de svåra
      $('lessonSlot').classList.toggle('duoing', last);
      btn($('lessonAgain'), 'Igen', 'again', false);
      btn($('lessonHard'), 'Träna de svåra', 'next');
      $('lessonAgain').disabled = busy; $('lessonHard').disabled = busy;
      return;
    }
    const W = LW; if (!W) return;
    $('learnSlot').classList.toggle('choosing', W.stage === 'choice');
    const again = W.stage === 'done' && LF !== 1;
    btn($('learnMain'), again ? 'Igen' : 'Nästa steg', again ? 'again' : 'next');
    $('learnMain').disabled = busy;
    btn($('learnFlip'), 'Vänd rektangeln', 'flip', false);
    $('learnFlip').disabled = busy || !(W.stage === 'done' && LF === 0 && W.a !== W.b);
    $('bPrev').disabled = S.learn.b <= 1; $('bNext').disabled = S.learn.b >= UPTO();
    $('learnChoice').querySelectorAll('button').forEach(b => b.disabled = busy);
  }
  function onLearnMain(){
    if (busy) return;
    const W = LW;
    if (W.stage === 'done' && LF !== 1){ startLearn(); return; }
    if (W.stage === 'done' && LF === 1){
      run(async () => {
        const { a, b } = W, ab = a * b;
        say('learnBubble', TXT.flipDone(a, b));
        await wait(LEAD);
        await learnRect.apply([{ do:'result', html:`${a}${X}${b} = <span class="in">${b}${X}${a}</span> = ${ab}` }]);
        LF = 2;
      });
      return;
    }
    if (needsChoice(W)){ showChoice('learn', W); return; }
    run(async () => { await walkerStep(W, learnRect, t => say('learnBubble', t)); });
  }
  function onLearnFlip(){
    if (busy || LW.stage !== 'done' || LF !== 0 || LW.a === LW.b) return;
    LF = 1;
    run(async () => { say('learnBubble', TXT.flipStart); await wait(LEAD); await learnRect.apply([{ do:'rotate' }]); });
  }
  /* Välj väg: två likvärdiga knappar, inga jämförelseord */
  function showChoice(where, W){
    W.stage = 'choice';
    const host = $(where + 'Choice'), bub = where + 'Bubble';
    host.innerHTML = W.ways.map((w, k) => `<button class="btn btn-sec" data-k="${k}">${wayLabel(w)}</button>`).join('');
    say(bub, TXT.choose);
    host.querySelectorAll('button').forEach(b => b.onclick = () => {
      if (busy) return;
      walkerChoose(W, +b.dataset.k);
      const rect = where === 'learn' ? learnRect : where === 'pass' ? passRect : pracRect;
      run(async () => {
        await walkerStep(W, rect, t => say(bub, t));
        if (where === 'prac') afterExplainStep();
      });
    });
    refresh();
  }

  /* ═══════════════════════════════════════════════════════════
     ÖVA
  ═══════════════════════════════════════════════════════════ */
  const isRev = it => it && it.kind === 'q' && it.rev && isVal() && SET.rev === 'pa';

  /* valFn: flerval (true) eller knappsats (false). Öva och Rekordrunda följer
     inställningen "Svar"; övningspasset styr det per varv. */
  function makeCtrl(host, onAnswer, valFn = isVal){
    const C = { opts:null, typed:'', locked:true, pair:false };
    function draw(){
      if (valFn()){
        host.innerHTML = `<div class="opts">${[0,1,2,3].map(i => `<button class="opt${C.pair ? ' pair' : ''}" data-i="${i}">${C.opts && C.opts[i] ? C.opts[i].label : ''}</button>`).join('')}</div>`;
        host.querySelectorAll('.opt').forEach(b => b.onclick = () => { if (C.locked || !C.opts || busy) return; onAnswer(C.opts[+b.dataset.i], b); });
      } else {
        host.innerHTML = `<div class="fdisp"><span class="ft"></span></div><div class="keys">${[1,2,3,4,5,6,7,8,9].map(d => `<button class="key" data-d="${d}">${d}</button>`).join('')}<button class="key" data-d="del" aria-label="Sudda">${svg('del')}</button><button class="key" data-d="0">0</button><button class="key kok" data-d="ok">OK</button></div>`;
        host.querySelectorAll('.key').forEach(b => b.onclick = () => {
          if (C.locked || !C.opts || busy) return;
          const d = b.dataset.d;
          if (d === 'del') C.typed = C.typed.slice(0, -1);
          else if (d === 'ok'){ if (C.typed) onAnswer({ label:C.typed, v:+C.typed }, host.querySelector('.fdisp')); return; }
          else if (C.typed.length < 3) C.typed += d;
          showTyped();
        });
        showTyped();
      }
      host.classList.toggle('off', C.locked && !C.answered);
    }
    function showTyped(){ const t = host.querySelector('.ft'); if (t){ t.textContent = C.typed || '?'; t.classList.toggle('ph', !C.typed); } }
    C.set = (opts, locked, pair = false) => { C.opts = opts; C.typed = ''; C.locked = locked; C.answered = false; C.pair = pair; draw(); };
    C.done = () => { C.locked = true; C.answered = true; host.classList.remove('off'); };
    C.mark = (label, cls) => {
      if (valFn()) host.querySelectorAll('.opt').forEach(b => { if (b.textContent === String(label)) b.classList.add(cls); });
      else { const d = host.querySelector('.fdisp'); if (d) d.classList.add(cls); }
    };
    return C;
  }

  function enterPrac(){
    reloadT();
    P = { items:buildPass(S.T.pairs, passSeed(S.T), today(), UPTO()), i:0, st:[], res:{}, correct:0, answered:0, phase:'q', W:null, wrongLabel:null, reasks:{} };
    P.before = curVis();
    goItem(0);
  }
  const curItem = () => P.items[P.i];
  function renderDots(){
    const host = $('pracDots');
    if (host.children.length !== P.items.length) host.innerHTML = P.items.map(() => '<span class="pd"></span>').join('');
    [...host.children].forEach((d, i) => {
      const it = P.items[i];
      d.className = 'pd' + (it.kind === 'intro' ? ' intro' : '') + (it.reask ? ' re' : '') + (P.st[i] ? ' ' + P.st[i] : '') + (i === P.i ? ' cur' : '');
    });
    const qs = P.items.filter(it => it.kind === 'q'), done = P.items.slice(0, P.i + 1).filter(it => it.kind === 'q').length;
    $('cap').textContent = `${Math.min(done, qs.length)} / ${qs.length}`;
  }
  function goItem(i){
    P.i = i;
    const it = curItem();
    if (!it){ finishPass(); return; }
    renderDots();
    if (it.kind === 'intro') showIntro(it); else showQuestion(it);
  }
  function qHTML(it){
    if (isRev(it)) return `<span class="rq">Vilket gångertal blir</span>${it.a * it.b}`;
    return `${it.a}<span class="x">×</span>${it.b} = <span class="qa">?</span>`;
  }
  function showQuestion(it){
    P.phase = 'q'; P.wrongLabel = null; P.pending = null;
    $('pracOver').classList.remove('on');
    const q = $('pracQ'); q.innerHTML = qHTML(it); q.classList.remove('swap'); void q.offsetWidth; q.classList.add('swap');
    const tag = it.reask ? 'Tillbaka igen' : it.isNew ? 'Det nya talet' : '';
    $('pracTag').textContent = tag; $('pracTag').classList.toggle('on', !!tag);
    if (isRev(it)){
      if (!it.ropts) it.ropts = reverseOptions(it.a, it.b, rng(it.a * 31 + it.b * 7 + S.T.passNo));
      ctrlP.set(it.ropts, false, true);
      say('pracBubble', it.reask ? 'Samma fråga igen. Nu vet du hur du kan tänka.' : 'Räkna efter — bara ett av gångertalen stämmer.');
    } else {
      ctrlP.set(options(it.a, it.b).map(v => ({ label:String(v), v })), false);
      say('pracBubble', it.reask ? `${it.a}${X}${it.b} igen. Nu vet du hur du kan tänka.`
        : it.isNew ? 'Det här är talet du nyss lärde dig.'
        : isVal() ? 'Vilket svar stämmer?' : 'Skriv svaret och tryck OK.');
    }
    refreshPrac();
  }
  function pracSettingChange(){
    const it = P && curItem();
    if (P && P.phase === 'q' && it && it.kind === 'q') showQuestion(it);
  }
  function refreshPrac(){
    if (!P) return;
    $('pracSlot').classList.toggle('choosing', P.phase === 'explain' && P.W && P.W.stage === 'choice');
    const m = $('pracMain');
    const lastQ = P.i >= P.items.length - 1;
    if (P.phase === 'q'){ btn(m, 'Nästa fråga', 'next'); m.disabled = true; }
    else if (P.phase === 'answered'){ btn(m, lastQ ? 'Se kartan' : 'Nästa fråga', lastQ ? 'map' : 'next'); m.disabled = busy; }
    else if (P.phase === 'explain'){ btn(m, 'Nästa steg', 'next'); m.disabled = busy; }
    else if (P.phase === 'explained'){ btn(m, lastQ && !willReask() ? 'Se kartan' : 'Fortsätt', lastQ && !willReask() ? 'map' : 'next'); m.disabled = busy; }
    $('pracChoice').querySelectorAll('button').forEach(b => b.disabled = busy);
  }
  function willReask(){ const it = curItem(); return it && it.kind === 'q' && P.wrongLabel !== null && reaskSpot() !== null; }
  function reaskSpot(){
    const it = curItem(), k = KEY(it.a, it.b);
    if ((P.reasks[k] || 0) >= 2) return null;
    if (P.items.slice(P.i + 1).some(x => x.kind === 'q' && KEY(x.a, x.b) === k)) return null;    // kommer redan tillbaka
    return Math.min(P.i + 4, P.items.length);
  }
  function openOverlay(it, head, tag){
    $('pracOQ').innerHTML = head; $('pracOTag').textContent = tag;
    $('pracOver').classList.add('on');
    P.W = makeWalker(it.a, it.b);
    pracRect.setup(it.a, it.b, P.W.rows);
  }
  function showIntro(it){
    P.phase = 'explain'; P.wrongLabel = null;
    ctrlP.set(null, true);
    $('pracQ').innerHTML = ''; $('pracTag').classList.remove('on');
    run(async () => {
      say('pracBubble', TXT.newIntro(it.a, it.b));
      await wait(LEAD);
      openOverlay(it, `Nytt: ${it.a}<span class="x">×</span>${it.b} = <span class="oa">?</span>`, 'Nytt tal');
      await pracRect.reveal();
    });
  }
  function pracAnswer(o, el){
    const it = curItem(); if (P.phase !== 'q') return;
    const rev = isRev(it), ok = rev ? o.ok : o.v === it.a * it.b, k = KEY(it.a, it.b);
    P.answered++;
    P.res[k] = P.res[k] || { asked:0, wrong:false };
    P.res[k].asked++;
    recordAnswer(it.a, it.b, ok);
    ctrlP.done();
    snd(ok ? 'correct' : 'wrong');
    if (ok){
      P.correct++; P.st[P.i] = 'ok'; P.phase = 'answered';
      ctrlP.mark(o.label, 'ok');
      say('pracBubble', `Rätt! ${rev ? `${o.a}${X}${o.b}` : `${it.a}${X}${it.b}`} = ${it.a * it.b}.`);
      renderDots(); refreshPrac();
      return;
    }
    P.res[k].wrong = true; P.st[P.i] = 'bad'; P.wrongLabel = o.label;
    ctrlP.mark(o.label, 'bad');
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
    P.phase = 'explain'; renderDots();
    // förklaringen ritar det par barnet skulle hitta (i omvänd fråga: rätt alternativ som det står)
    const ro = rev ? it.ropts.find(x => x.ok) : null;
    const ea = rev ? ro.a : it.a, eb = rev ? ro.b : it.b;
    // Har den andra faktorn en enklare väg (t.ex. 8 × 2 → 2 × 8, dubbelt)? Då vänder vi — i ett eget steg.
    const swap = wayRank(eb) < wayRank(ea);
    // Rubriken visar samma ordning som rektangeln och texten: efter vändningen eb × ea.
    const hA = swap ? eb : ea, hB = swap ? ea : eb;
    const head = `${hA}<span class="x">×</span>${hB} = <span class="oa">?</span><s>${o.label}</s>`;
    run(async () => {
      if (swap){
        say('pracBubble', TXT.wrongSwap(ea, eb));
        P.pending = { t:introText(eb, ea), a:eb, b:ea, head };
        await wait(LEAD);
        return;
      }
      say('pracBubble', TXT.wrong(ea, eb));
      await wait(LEAD + 150);
      openOverlay({ a:ea, b:eb }, head, 'Så kan du tänka');
      await pracRect.reveal();
    });
  }
  function afterExplainStep(){
    if (P.W.stage === 'done'){
      const oa = $('pracOQ').querySelector('.oa');
      oa.textContent = P.W.a * P.W.b; oa.classList.add('ok');
      P.phase = 'explained';
    }
  }
  function onPracMain(){
    if (busy || !P) return;
    if (P.phase === 'answered'){ goItem(P.i + 1); return; }
    if (P.phase === 'explained'){
      if (willReask()){
        const it = curItem(), k = KEY(it.a, it.b);
        P.reasks[k] = (P.reasks[k] || 0) + 1;
        P.items.splice(reaskSpot(), 0, { ...it, reask:true, ropts:it.ropts });
      }
      goItem(P.i + 1); return;
    }
    if (P.phase === 'explain'){
      if (P.pending){
        const pd = P.pending; P.pending = null;
        run(async () => {
          say('pracBubble', pd.t);
          await wait(LEAD);
          openOverlay({ a:pd.a, b:pd.b }, pd.head, 'Så kan du tänka');
          await pracRect.reveal();
        });
        return;
      }
      if (needsChoice(P.W)){ showChoice('prac', P.W); return; }
      run(async () => { await walkerStep(P.W, pracRect, t => say('pracBubble', t)); afterExplainStep(); });
    }
  }
  function finishPass(){
    reloadT();
    const before = P.before, after = curVis(), moves = [];
    for (const k in P.res) if (before[k] && after[k] && before[k] !== after[k]) moves.push({ k, from:before[k], to:after[k] });
    P.moves = moves; P.after = after;
    S.T.passNo++; saveTrainer(S.T);                      // nästa pass blir ett annat
    const pct = P.answered ? Math.round(100 * P.correct / P.answered) : 0;
    addSessionLog({ type:'pass', correct:P.correct, total:P.answered, pct, news:P.items.filter(it => it.kind === 'intro').length });
    snd(pct >= 80 ? 'fanfare' : 'correct');
    if (pct === 100) confetti(80);
    // Capybara-samlingen: ren sidoeffekt EFTER resultat/logg – får aldrig kasta
    try { if (window.Capy) Capy.award(profile, { type: 'test', data: { module: 'mult', pct } }); } catch (_) {}
    goto('end');
  }

  /* ═══════════════════════════════════════════════════════════
     SLUTBILDEN: kartan där de ändrade rutorna byter färg
  ═══════════════════════════════════════════════════════════ */
  function enterEnd(){
    if (!P || !P.after){ goto('hub'); return; }
    E.i = 0;
    endMap.paint(P.before);
    $('endHead').innerHTML = countHTML(leftToLearn(P.before));
    $('endLegend').innerHTML = legendHTML(counts(P.before));
    say('endBubble', `Passet är klart. Du svarade rätt på ${P.correct} av ${P.answered} frågor.`);
    refreshEnd();
  }
  function endSummary(){
    const g = { toKan:0, refill:0, nyOvar:0, kanOvar:0, ovarNy:0 };
    P.moves.forEach(m => {
      if (m.to === 'kan') { if (m.from === 'due') g.refill++; else g.toKan++; }
      else if (m.to === 'ovar') { if (m.from === 'ny') g.nyOvar++; else g.kanOvar++; }
      else if (m.to === 'ny') g.ovarNy++;
    });
    const parts = [];
    if (g.toKan)   parts.push(`${talord(g.toKan)} blev ${g.toKan === 1 ? 'grönt' : 'gröna'}`);
    if (g.refill)  parts.push(`${talord(g.refill)} fylldes på`);
    if (g.nyOvar)  parts.push(`${talord(g.nyOvar)} blev ${g.nyOvar === 1 ? 'gult' : 'gula'}`);
    if (g.kanOvar) parts.push(`${talord(g.kanOvar)} gick tillbaka till gult`);
    if (g.ovarNy)  parts.push(`${talord(g.ovarNy)} gick tillbaka till vitt`);
    if (!parts.length) return `Alla tal stannar i sin låda. Nu är det ${leftToLearn(P.after)} tal kvar att lära.`;
    parts[0] = parts[0].replace(/^(\S+)/, '$1 tal');
    const s = parts.length === 1 ? parts[0] : parts.slice(0, -1).join(', ') + ' och ' + parts[parts.length - 1];
    return `${cap(s)}. Nu är det ${leftToLearn(P.after)} tal kvar att lära.`;
  }
  function refreshEnd(){
    const m = $('endMain');
    if (!P || !P.moves) return;                 // passet nollställt (vyn lämnad)
    const lastStep = E.i >= 2 || (E.i >= 1 && !P.moves.length);
    btn(m, lastStep ? 'Till kartan' : 'Nästa steg', lastStep ? 'map' : 'next');
    m.disabled = busy;
  }
  function onEndMain(){
    if (busy) return;
    if (!P || !P.moves){ goto('hub'); return; }
    // Animationen håller sitt eget pass: lämnas vyn under väntan nollställs P (null-krasch 'moves').
    const PP = P;
    if (E.i >= 2 || (E.i >= 1 && !PP.moves.length)){ goto('hub'); return; }
    if (E.i === 0 && PP.moves.length){
      E.i = 1;
      run(async () => {
        say('endBubble', 'Talen du övade flyttar till sin nya låda.');
        await wait(LEAD + 120);
        const cells = [];
        if (P !== PP) return;                   // vyn lämnad under väntan
        PP.moves.forEach(mv => { const [a, b] = mv.k.split('x').map(Number); cells.push([endMap.cells[a][b], mv.to]); if (a !== b) cells.push([endMap.cells[b][a], mv.to]); });
        cells.forEach(([c, to]) => { const i = document.createElement('i'); i.className = 'nf'; i.style.background = `var(--${to})`; if (to === 'ny') i.style.boxShadow = 'inset 0 0 0 1px rgba(76,29,149,.16)'; c.append(i); });
        await frame();
        cells.forEach(([c]) => { c.querySelector('.nf').classList.add('on'); c.classList.add('chg'); });
        await wait(900);
        cells.forEach(([c, to]) => { c.className = 'mc ' + to; c.innerHTML = ''; });
      });
      return;
    }
    E.i = 2;
    run(async () => {
      say('endBubble', endSummary());
      await wait(LEAD);
      if (P !== PP) return;                     // vyn lämnad under väntan
      $('endHead').innerHTML = countHTML(leftToLearn(PP.after), true);
      $('endLegend').innerHTML = legendHTML(counts(PP.after), true);
      await wait(400);
    });
  }

  /* ═══════════════════════════════════════════════════════════
     REKORDRUNDA — bara lådan "kan", mot eget förra resultat
  ═══════════════════════════════════════════════════════════ */
  function stopClock(){ clearInterval(clockId); clockId = null; }
  function enterRec(){
    stopClock();
    reloadT();
    const pool = pairsUpTo(UPTO()).filter(([a, b]) => S.T.pairs[KEY(a, b)].box === 'kan');
    R = { phase:'intro', streak:0, correct:0, answered:0, left:60, pool, queue:[], q:null, max:Math.min(30, pool.length),
          prev:SET.tempo === 'klocka' ? S.record.clock : S.record.streak, beat:false };
    const q = $('recQ');
    if (pool.length < 10){
      q.innerHTML = `<span class="rbig">${svg('lock', 'width:56px;height:56px')}</span><span class="rsub">Öppnar när du kan 10 tal</span>`;
      say('recBubble', `Du kan ${pool.length ? pool.length : 'inga'} tal än så länge. Öva lite till, så öppnas rundan.`);
    } else if (SET.tempo === 'rekord'){
      q.innerHTML = R.prev > 0 ? `<span class="rbig">${R.prev}</span><span class="rsub">i rad är ditt rekord</span>` : `<span class="rbig">${svg('trophy', 'width:60px;height:60px')}</span><span class="rsub">Inget rekord än</span>`;
      say('recBubble', 'Bara tal du kan. Hur många klarar du i rad?', 'Ingen klocka — bara du mot ditt rekord.');
    } else {
      q.innerHTML = `<span class="rbig">60</span><span class="rsub">sekunder</span>`;
      say('recBubble', 'Bara tal du kan. Hur många hinner du på en minut?');
    }
    $('recTag').classList.remove('on');
    ctrlR.set(null, true);
    recTrack(); refreshRec();
  }
  function recTrack(pop = false){
    const bar = $('recBar'), fill = $('recFill'), flag = $('recFlag');
    bar.classList.toggle('clock', SET.tempo === 'klocka');
    if (SET.tempo === 'rekord'){
      const L = Math.max(20, R.prev + 6);
      $('recL').innerHTML = `${bTag(pop)}${R.streak}</b> i rad`;
      $('recR').innerHTML = R.prev > 0 ? `Rekord: <b>${R.prev}</b>` : 'Inget rekord än';
      fill.style.transform = `scaleX(${Math.min(1, R.streak / L)})`;
      flag.classList.toggle('off', R.prev <= 0);
      flag.style.left = (R.prev / L * 100) + '%';
      bar.classList.toggle('beat', R.streak > R.prev && R.prev > 0);
    } else {
      $('recL').innerHTML = `${bTag(pop)}${R.correct}</b> rätt`;
      $('recR').innerHTML = `<b>${R.left}</b> s kvar`;
      fill.style.transform = `scaleX(${R.left / 60})`;
      flag.classList.add('off'); bar.classList.remove('beat');
    }
  }
  function refreshRec(){
    if (!R) return;
    const m = $('recMain');
    m.className = 'btn ' + (R.phase === 'run' ? 'btn-sec' : 'btn-primary');
    if (R.pool.length < 10){ btn(m, 'Till kartan', 'map'); m.disabled = false; return; }
    if (R.phase === 'intro') btn(m, 'Starta', 'play');
    else if (R.phase === 'run') btn(m, 'Avsluta rundan', 'close', false);
    else if (R.phase === 'miss') btn(m, 'Se resultatet', 'next');
    else btn(m, 'Kör igen', 'again');
    m.disabled = busy;
  }
  function nextRecQ(){
    if (!R.queue.length) R.queue = shuffle(R.pool);
    const p = R.queue.shift(), [a, b] = Math.random() < .5 ? p : [p[1], p[0]];
    R.q = { a, b };
    const q = $('recQ'); q.innerHTML = `${a}<span class="x">×</span>${b} = <span class="qa">?</span>`; q.classList.remove('swap'); void q.offsetWidth; q.classList.add('swap');
    ctrlR.set(options(a, b).map(v => ({ label:String(v), v })), false);
  }
  function recAnswer(o, el){
    if (R.phase !== 'run') return;
    const { a, b } = R.q, ab = a * b, ok = o.v === ab;
    R.answered++;
    recordAnswer(a, b, ok);
    snd(ok ? 'correct' : 'wrong');
    if (ok){
      R.correct++; R.streak++;
      const firstBeat = SET.tempo === 'rekord' && R.prev > 0 && R.streak === R.prev + 1;
      say('recBubble', SET.tempo === 'klocka' ? `Rätt! ${R.correct} hittills.` : firstBeat ? `Nytt rekord! ${R.streak} i rad.` : `Rätt! ${R.streak} i rad.`);
      recTrack(true);
      if (SET.tempo === 'rekord' && R.streak >= R.max){ endRec(); return; }
      nextRecQ();
      return;
    }
    if (SET.tempo === 'klocka'){
      say('recBubble', `Det var ${a}${X}${b} = ${ab}. Nästa!`);
      el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
      nextRecQ(); return;
    }
    ctrlR.done(); ctrlR.mark(o.label, 'bad'); ctrlR.mark(String(ab), 'ok');
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
    R.phase = 'miss';
    say('recBubble', `${a}${X}${b} = ${ab}. Rundan är slut.`);
    refreshRec();
  }
  function endRec(){
    stopClock();
    R.phase = 'end'; ctrlR.set(null, true); $('recTag').classList.remove('on');
    const n = SET.tempo === 'klocka' ? R.correct : R.streak, prev = R.prev;
    const q = $('recQ');
    q.innerHTML = `<span class="rbig">${n}</span><span class="rsub">${SET.tempo === 'klocka' ? 'rätt på en minut' : 'i rad'}</span>`;
    q.classList.remove('swap'); void q.offsetWidth; q.classList.add('swap');
    let t;
    if (SET.tempo === 'klocka'){ t = `${n} rätt på en minut.`; S.record.clock = n; }
    else {
      if (n >= R.max && n > 0) t = `Alla ${n} rätt i rad!`;
      else if (n === 0) t = 'Inget i rad den här gången.';
      else if (prev === 0) t = `${n} i rad. Det är ditt första rekord.`;
      else if (n > prev) t = `Nytt rekord: ${n} i rad! Förra rekordet var ${prev}.`;
      else if (n === prev) t = `${n} i rad — lika många som ditt rekord.`;
      else t = `${n} i rad. Ditt rekord är ${prev}.`;
      if (n > prev) S.record.streak = n;
    }
    saveRecord(S.record);
    if (R.answered > 0) addSessionLog({ type:'record', tempo:SET.tempo, n, correct:R.correct, total:R.answered });
    if (SET.tempo === 'rekord' && n > prev && prev > 0){ snd('fanfare'); confetti(80); }
    else if (n > 0) snd('correct');
    say('recBubble', t);
    refreshRec();
  }
  function onRecMain(){
    if (busy) return;
    if (R.pool.length < 10){ goto('hub'); return; }
    if (R.phase === 'intro'){
      R.phase = 'run';
      say('recBubble', SET.tempo === 'klocka' ? 'Klockan går. Kör!' : 'Kör! Svara så många rätt i rad du kan.');
      nextRecQ(); recTrack(); refreshRec();
      if (SET.tempo === 'klocka') clockId = setInterval(() => { if (!R || !$('recBar')){ stopClock(); return; } R.left--; recTrack(); if (R.left <= 0) endRec(); }, 1000);
      return;
    }
    if (R.phase === 'run'){ endRec(); return; }
    if (R.phase === 'miss'){ endRec(); return; }
    enterRec();
  }

  /* ═══════════════════════════════════════════════════════════
     ÖVNINGSPASSET: sparat pass, inställning, körning, kvitto
  ═══════════════════════════════════════════════════════════ */
  function loadOvp(){
    const r = profile && readJSON(OVP_KEY(profile.id));
    if (!r || !Array.isArray(r.tables)) return null;
    return { tables:r.tables.map(Number), counts:normCounts(r.counts) };
  }
  function saveOvp(cfg){ if (profile) writeJSON(OVP_KEY(profile.id), { tables:cfg.tables, counts:normCounts(cfg.counts) }); }
  /* Det sparade passet så som det kan köras med nuvarande Gånger (null = inget att starta) */
  function usableOvp(){
    const c = loadOvp(); if (!c) return null;
    const tables = cleanTables(c.tables);
    return tables.length && roundTypes(c.counts).length ? { tables, counts:c.counts } : null;
  }
  /* Varven som gäller för snabbvalen: det sparade passets varv, annars Vanligt. Ren. */
  function countsFrom(saved){
    return saved && roundTypes(saved.counts).length ? normCounts(saved.counts) : { ...PRESETS[1].c };
  }
  /* Snabbvalet: passet med EN tabell och de sparade varven. Samma cfg som passinställningen ger. Ren. */
  function quickPassCfg(table, saved){ return { tables:cleanTables([table]), counts:countsFrom(saved) }; }

  /* ── Ställ in ett övningspass ── */
  /* arg: ett tabellnummer (från tabellens startskärm), { from:'hstart' } (från De svåra talen)
     eller inget (varvraden på hemvyn). Tillbaka leder dit man kom ifrån. Från De svåra talen
     visas bara varven och knappen heter Klar — annars startade den ett tabellpass. */
  function enterSetup(arg){
    const table = typeof arg === 'number' ? arg : null;
    const from = table ? 'tstart' : (arg && arg.from) || null;
    const saved = loadOvp();
    const tables = table ? [table] : saved ? cleanTables(saved.tables) : [];
    SU = { tables, counts:countsFrom(saved), from, fromT:table };
    $('scr-setup').classList.toggle('varv-only', from === 'hstart');
    renderSetup();
  }
  function renderSetup(){
    if (!SU) return;
    const n = UPTO();
    SU.tables = cleanTables(SU.tables);
    $('scr-setup').querySelectorAll('.chips button').forEach(b => {
      const t = +b.dataset.t, on = SU.tables.includes(t);
      b.classList.toggle('on', on); b.classList.toggle('dim', t > n && !on); b.setAttribute('aria-pressed', on);
    });
    $('suUpto').querySelectorAll('button').forEach(b => { const on = b.dataset.v === SET.upto; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    const pk = presetFor(SU.counts);
    $('suPresets').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === pk));
    RTYPES.forEach(t => {
      const row = $('suR-' + t);
      row.querySelector('.rn').textContent = SU.counts[t];
      row.querySelector('[data-d="-1"]').disabled = SU.counts[t] <= 0;
      row.querySelector('[data-d="1"]').disabled = SU.counts[t] >= RMAX;
      row.classList.toggle('zero', SU.counts[t] === 0);
    });
    const pl = passPlan(SU, n);
    $('suSum').textContent = planSummary(pl);
    const varvOnly = SU.from === 'hstart';
    $('suGo').disabled = !pl.rounds || (!varvOnly && !pl.tables.length);
    if (varvOnly) btn($('suGo'), 'Klar', 'check', false); else btn($('suGo'), 'Starta passet', 'play', false);
    // Varven styr alla snabbval: spara direkt vid varje ändring, inte först vid start,
    // annars försvinner ändringen när barnet trycker Tillbaka.
    if (pl.rounds && (pl.tables.length || varvOnly)) saveOvp({ tables:SU.tables, counts:SU.counts });
  }
  function refreshSetup(){}
  function startFromSetup(){
    if (!SU) return;
    if (SU.from === 'hstart'){ snd('click'); goto('hstart'); return; }   // varven är redan sparade
    const pl = passPlan(SU, UPTO());
    if (!pl.tables.length || !pl.rounds) return;
    saveOvp({ tables:pl.tables, counts:SU.counts });
    snd('click');
    goto('pass', { tables:pl.tables, counts:SU.counts });
  }

  /* ── Körningen ──
     PS.phase: 'show' (svaret visas) · 'q' (fråga) · 'right' (rätt, går vidare själv)
               'wrong' (rätt svar visas) · 'explain' (strategirektangeln) · 'between' (mellan varven) */
  const passVal = () => !!PS && PS.rounds[PS.ri] && PS.rounds[PS.ri].type !== 'free';
  function enterPass(cfg){
    cfg = cfg || usableOvp();
    if (!cfg){ goto('setup'); return; }
    const n = UPTO(), pairs = cfg.pairs ? cleanPairs(cfg.pairs) : null;
    PS = { cfg, upto:n, pairs, hard:!!pairs, tables:pairs ? [] : cleanTables(cfg.tables), rounds:buildRounds(cfg, n), ri:0, drill:null, phase:'q', res:[],
           start:Date.now(), token:(PS ? PS.token : 0) + 1, W:null, justFixed:false, daily:cfg.daily || null, first:{} };
    if (!PS.rounds.length || !(pairs ? pairs.length : PS.tables.length)){ goto(pairs ? 'hstart' : 'setup'); return; }
    if (PS.daily) $('title').textContent = 'Dagens träning';
    startRound(0);
  }
  function startRound(i){
    PS.ri = i;
    PS.drill = createDrill(PS.rounds[i].items);
    PS.justFixed = false;
    renderPassTrack();
    nextQ(true);
  }
  function renderPassTrack(){
    const R0 = PS.rounds[PS.ri], p = PS.drill ? PS.drill.progress() : { done:0, total:1 };
    const done = PS.phase === 'between';
    $('psL').innerHTML = PS.daily ? `<b>Gångertabellen</b> · ${RNAME[R0.type]}` : `Varv <b>${PS.ri + 1}</b> av ${PS.rounds.length} · ${RNAME[R0.type]}`;
    $('psR').classList.toggle('many', PS.rounds.length > 6);
    $('psR').innerHTML = PS.rounds.map((r, k) => `<i class="rp${k < PS.ri || (k === PS.ri && done) ? ' ok' : k === PS.ri ? ' cur' : ''}"></i>`).join('');
    $('psFill').style.transform = `scaleX(${done ? 1 : p.total ? p.done / p.total : 0})`;
  }
  function stageQ(html, tag){
    const q = $('psQ'); q.innerHTML = html; q.classList.remove('swap'); void q.offsetWidth; q.classList.add('swap');
    $('psTag').textContent = tag || ''; $('psTag').classList.toggle('on', !!tag);
  }
  const eqHTML = (a, b, ans) => `${a}<span class="x">×</span>${b} = ${ans === undefined ? '<span class="qa">?</span>' : `<span class="qok">${ans}</span>`}`;
  function nextQ(first = false){
    if (!PS || S.screen !== 'pass') return;
    if (PS.drill.isDone()){ roundDone(); return; }
    const cur = PS.drill.current(), type = PS.rounds[PS.ri].type;
    $('psOver').classList.remove('on'); PS.W = null;
    renderPassTrack();
    if (type === 'show' && !cur.retry){
      PS.phase = 'show';
      stageQ(eqHTML(cur.a, cur.b, cur.a * cur.b), cur.extra ? 'Tillbaka igen' : 'Titta');
      ctrlS.set(options(cur.a, cur.b).map(v => ({ label:String(v), v })), true);
      say('passBubble', `Titta: ${cur.a}${X}${cur.b} = ${cur.a * cur.b}.`, 'Tryck på Fråga mig när du är redo.');
      refreshPass();
      return;
    }
    askQ(first);
  }
  function askQ(first = false){
    const cur = PS.drill.current(), type = PS.rounds[PS.ri].type;
    PS.phase = 'q';
    $('psOver').classList.remove('on'); PS.W = null;
    stageQ(eqHTML(cur.a, cur.b), cur.retry ? 'En gång till' : cur.extra ? 'Tillbaka igen' : '');
    ctrlS.set(options(cur.a, cur.b).map(v => ({ label:String(v), v })), false);
    const intro = first && !PS.daily ? (type === 'free' ? 'Nu skriver du svaret själv.' : type === 'choice' ? 'Nu blandas frågorna.' : '') : '';
    say('passBubble',
      cur.retry ? 'Samma fråga en gång till.'
      : cur.extra ? 'Den här frågan kommer tillbaka en gång till.'
      : type === 'show' ? 'Vilket svar var det?'
      : type === 'free' ? 'Skriv svaret och tryck OK.' : 'Vilket svar stämmer?', intro);
    refreshPass();
  }
  function passAnswer(o, el){
    if (!PS || PS.phase !== 'q') return;
    const cur = PS.drill.current(), ab = cur.a * cur.b, ok = o.v === ab;
    const res = PS.drill.answer(ok);
    if (res.record){
      recordAnswer(cur.a, cur.b, ok);                      // bara första försöket räknas
      if (!(KEY(cur.a, cur.b) in PS.first)) PS.first[KEY(cur.a, cur.b)] = ok;   // Dagens träning: första svaret per tal
    }
    ctrlS.done();
    snd(ok ? 'correct' : 'wrong');
    if (ok){
      PS.phase = 'right';
      ctrlS.mark(o.label, 'ok');
      stageQ(eqHTML(cur.a, cur.b, ab), cur.retry ? 'En gång till' : cur.extra ? 'Tillbaka igen' : '');
      say('passBubble', cur.retry && PS.justFixed ? 'Rätt! Den frågan kommer tillbaka en gång till i varvet.' : `Rätt! ${cur.a}${X}${cur.b} = ${ab}.`);
      PS.justFixed = false;
      renderPassTrack(); refreshPass();
      const tok = PS.token;
      run(async () => { await wait(cur.retry ? 1400 : 700); if (PS && PS.token === tok) nextQ(); });
      return;
    }
    PS.phase = 'wrong';
    PS.justFixed = res.insertedAt !== null || PS.justFixed;
    ctrlS.mark(o.label, 'bad');
    if (passVal()) ctrlS.mark(String(ab), 'ok');
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
    stageQ(eqHTML(cur.a, cur.b, ab), 'Rätt svar');
    say('passBubble', `Det blir ${ab}.`, 'Titta en gång till och svara sedan igen.');
    renderPassTrack(); refreshPass();
  }
  function passExplain(){
    if (busy || !PS || PS.phase !== 'wrong') return;
    const cur = PS.drill.current();
    PS.phase = 'explain';
    const { ea, eb, text } = passExplainFor(cur.a, cur.b);
    run(async () => {
      say('passBubble', text);
      await wait(LEAD);
      $('psOQ').innerHTML = eqHTML(ea, eb, ea * eb);
      $('psOver').classList.add('on');
      PS.W = makeWalker(ea, eb);
      passRect.setup(ea, eb, PS.W.rows);
      await passRect.reveal();
    });
  }
  function passExplainStep(){
    if (busy || !PS || PS.phase !== 'explain' || !PS.W || PS.W.stage === 'done') return;
    if (needsChoice(PS.W)){ showChoice('pass', PS.W); return; }
    run(async () => { await walkerStep(PS.W, passRect, t => say('passBubble', t)); });
  }
  function passRetry(){
    if (busy || !PS || (PS.phase !== 'wrong' && PS.phase !== 'explain')) return;
    askQ();
  }
  function roundDone(){
    const st = PS.drill.stats();
    PS.res.push({ type:PS.rounds[PS.ri].type, asked:st.asked, firstOk:st.firstOk, wrongFirst:st.wrongFirst });
    if (PS.ri >= PS.rounds.length - 1){ finishOvp(); return; }
    PS.phase = 'between';
    $('psOver').classList.remove('on');
    renderPassTrack();
    const nxt = PS.rounds[PS.ri + 1].type;
    stageQ(`<span class="rbig okc">${svg('check', 'width:64px;height:64px')}</span><span class="rbt">Varv ${PS.ri + 1} klart!</span><span class="rsub">Nästa: ${RNAME[nxt]}</span>`, '');
    ctrlS.set(null, true);
    $('psCtrl').innerHTML = `<div class="rlist">${PS.rounds.map((r, k) => `<span class="rl${k <= PS.ri ? ' ok' : k === PS.ri + 1 ? ' next' : ''}">${svg(k <= PS.ri ? 'check' : RICON[r.type])}<span>${RNAME[r.type]}</span></span>`).join('')}</div>`;
    $('psCtrl').classList.remove('off');
    snd('correct');
    say('passBubble', 'Bra jobbat! Fortsätt när du är redo.', RHELP[nxt]);
    refreshPass();
  }
  function onPassMain(){
    if (busy || !PS) return;
    if (PS.phase === 'show'){ askQ(); return; }
    if (PS.phase === 'between'){ startRound(PS.ri + 1); return; }
  }
  function refreshPass(){
    if (!PS) return;
    const ph = PS.phase, duo = ph === 'wrong' || ph === 'explain';
    $('psSlot').classList.toggle('choosing', ph === 'explain' && !!PS.W && PS.W.stage === 'choice');
    $('psSlot').classList.toggle('duoing', duo);
    const m = $('psMain');
    m.style.visibility = (ph === 'q' || ph === 'right') ? 'hidden' : '';
    if (ph === 'show') btn(m, 'Fråga mig', 'next');
    else if (ph === 'between') btn(m, 'Fortsätt', 'next');
    m.disabled = busy;
    const help = $('psHelp');
    if (ph === 'explain'){ btn(help, 'Nästa steg', 'next'); help.disabled = busy || !PS.W || PS.W.stage === 'done'; }
    else { btn(help, 'Så kan du tänka', 'bulb', false); help.disabled = busy; }
    btn($('psRetry'), 'Svara igen', 'again');
    $('psRetry').disabled = busy;
    $('passChoice').querySelectorAll('button').forEach(b => b.disabled = busy);
  }
  function confirmCancelPass(){
    showModal(`
      <h3 class="modal-title">Vill du avbryta passet?</h3>
      <p class="mult-modal-txt">Om du avbryter nu sparas inte passet.</p>
      <div class="mult-modal-stack">
        <button class="btn btn-primary" onclick="MultGame.hideModal()">Fortsätt passet</button>
        <button class="btn btn-ghost" onclick="MultGame._cancelPass()">Avbryt passet</button>
      </div>
    `);
  }
  function finishOvp(){
    const R0 = receiptFor(PS.res, Date.now() - PS.start);
    if (PS.daily){                                       // Dagens träning: inget eget kvitto, ingen logg – statistiken går tillbaka
      const d = PS.daily, first = { ...PS.first };
      PS.token++;
      d.onDone({ correct:R0.correct, total:R0.total, fixed:R0.fixed, secs:R0.secs, first });
      return;
    }
    const entry = { type:'ovningspass', tables:PS.tables, upto:PS.upto, rounds:R0.rounds, correct:R0.correct, total:R0.total, pct:R0.pct, fixed:R0.fixed, secs:R0.secs };
    if (PS.hard){ entry.hard = true; entry.pairs = PS.pairs.map(([a, b]) => KEY(a, b)); }
    addSessionLog(entry);
    const saved = getLog()[0];
    PS.logId = saved && saved.type === 'ovningspass' ? saved.id : null;
    PS.receipt = { ...entry, date:saved && saved.date || new Date().toISOString(), seen:null };
    goto('done');
    snd('fanfare');
    confetti(R0.pct >= 90 ? 110 : 70);
    // Capybara-samlingen: ren sidoeffekt EFTER loggen – får aldrig kasta
    try { if (window.Capy) Capy.award(profile, { type:'ovningspass', data:{ module:'mult', pct:R0.pct, tables:PS.tables, rounds:R0.rounds.length, hard:PS.hard } }); } catch (_) {}
  }

  /* ── Du är klar! – kvittot till en vuxen ── */
  const { fmtWhen, fmtStamp } = SH;                    // js/shared.js (v63: delas med Klockan)
  function receiptHTML(e){
    return `
      <div class="rc-top"><span class="rc-k">${svg('repeat')}Övningspass</span><span class="rc-when">${cap(fmtWhen(e.date))}</span></div>
      ${e.hard ? `<div class="rc-row"><span>Tal</span><b>${hardWhat(e)}</b></div>`
        : `<div class="rc-row"><span>Tabeller</span><b>${e.tables.map(t => `${t}:an`).join(', ')}</b></div>
      <div class="rc-row"><span>Gånger</span><b>1–${e.upto}</b></div>`}
      <div class="rc-rounds">${e.rounds.map((t, k) => `<span class="rv">${svg('check')}<em>${k + 1}.</em> ${RNAME[t]}</span>`).join('')}</div>
      <div class="rc-row"><span>Rätt på första försöket</span><b>${e.correct} av ${e.total}</b></div>
      <div class="rc-row"><span>Fel som rättades</span><b>${e.fixed}</b></div>
      <div class="rc-row"><span>Tid</span><b>${durTxt(e.secs)}</b></div>`;
  }
  function stampHTML(iso){ return `<span class="st-in">${svg('check')}<span class="st-tx"><b>Sett av en vuxen</b><small>${fmtStamp(iso)}</small></span></span>`; }
  function enterDone(){
    if (!PS || !PS.receipt){ goto('hub'); return; }
    const e = PS.receipt;
    $('dnPraise').textContent = praiseFor(e.pct);
    $('dnCard').innerHTML = receiptHTML(e) + `<div class="rc-foot"><span class="slot-ph" id="mt-rcPh">Plats för en vuxens stämpel</span><div class="stamp" id="mt-rcStamp"></div></div>`;
    $('dnAsk').textContent = 'Visa kvittot för en vuxen.';
    resetHold();
  }
  let holdT = null;
  const HOLD_MS = 1500;
  function resetHold(){
    clearTimeout(holdT); holdT = null;
    const h = $('dnHold'); if (!h) return;
    h.classList.remove('holding', 'done'); h.disabled = false;
    h.innerHTML = `<i class="hold-fill"></i><span class="hold-t">${svg('hand')}Håll inne: Sett av en vuxen</span>`;
  }
  function holdStart(ev){
    const h = $('dnHold');
    if (!PS || !PS.receipt || PS.receipt.seen || h.disabled) return;
    if (ev && ev.cancelable) ev.preventDefault();
    clearTimeout(holdT);
    h.classList.remove('holding'); void h.offsetWidth; h.classList.add('holding');
    holdT = setTimeout(stampReceipt, HOLD_MS);
  }
  function holdEnd(){
    if (!holdT) return;
    clearTimeout(holdT); holdT = null;
    $('dnHold').classList.remove('holding');
  }
  function stampReceipt(){
    holdT = null;
    if (!PS || !PS.receipt || PS.receipt.seen) return;
    const iso = new Date().toISOString();
    PS.receipt.seen = iso;
    if (PS.logId) updateLogEntry(PS.logId, { seen:iso });
    const st = $('rcStamp'); st.innerHTML = stampHTML(iso); st.classList.add('on');
    $('rcPh').classList.add('off');
    const h = $('dnHold'); h.classList.remove('holding'); h.classList.add('done'); h.disabled = true;
    h.innerHTML = `<span class="hold-t">${svg('check')}Kvittot är stämplat</span>`;
    $('dnAsk').textContent = 'Snyggt! Nu finns kvittot i loggen.';
    snd('correct');
  }
  function updateLogEntry(id, patch){
    try {
      const log = getLog(), e = log.find(x => x.id === id);
      if (!e) return false;
      Object.assign(e, patch);
      return MP.safeSetItem(LOG_KEY(profile.id), JSON.stringify(log));
    } catch (_) { return false; }
  }

  /* ═══════════════════════════════════════════════════════════
     INSTÄLLNINGSARKET
  ═══════════════════════════════════════════════════════════ */
  function renderSheet(){
    $('sheet').querySelectorAll('.gsh-tg').forEach(tg => {
      const k = tg.dataset.k;
      tg.querySelectorAll('button').forEach(b => { const on = getSetting(k) === b.dataset.v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    });
  }
  function openSheet(){ if (busy) return; renderSheet(); $('sheet').classList.add('on'); $('sheet').setAttribute('aria-hidden', 'false'); }
  function closeSheet(){ $('sheet').classList.remove('on'); $('sheet').setAttribute('aria-hidden', 'true'); }
  function setSetting(k, v){
    if (getSetting(k) === v) return;
    if (k === 'answer') answerMode = v; else SET[k] = v;
    saveSettings(); renderSheet(); onSettingChange(k);
  }
  function onSettingChange(k){
    if (k === 'upto'){
      buildMaps();
      if (S.screen === 'hub') renderHub();
      else if (S.screen === 'end') goto('hub');
      else if (S.screen === 'tstart') enterTStart(TS && TS.t);
      else if (S.screen === 'hstart') renderHStart();
      else if (S.screen === 'setup') renderSetup();
      else if (S.screen === 'learn') startLearn();
      else if (S.screen === 'rec') enterRec();
      return;
    }
    if (S.screen === 'hub') renderHub();
    if (S.screen === 'learn' && k === 'strat') startLearn();
    if (S.screen === 'prac' && (k === 'answer' || k === 'rev')) pracSettingChange();
    if (S.screen === 'rec' && (k === 'tempo' || k === 'answer')) enterRec();
  }

  /* ═══════════════════════════════════════════════════════════
     MONTERING
  ═══════════════════════════════════════════════════════════ */
  const tile = (id, icon, title) => `<button class="tile" id="mt-go${id}"><span class="ic" id="mt-ic${id}">${icon ? svg(icon) : ''}</span><b>${title}</b><small id="mt-sub${id}"></small></button>`;
  function trainerHTML(){
    return `
      <style id="mult-css">${MULT_CSS}${GT_CSS}</style>
      <div class="app-header gt-hdr">
        <button class="btn-back" id="mt-backBtn">Tillbaka</button>
        <span class="header-title" id="mt-title">Gångertabellen</span>
        <div class="mult-hdr-actions">
          <span class="gcap" id="mt-cap"></span>
          <button class="icon-btn" id="mt-gear" aria-label="Inställningar"><svg class="icn" viewBox="0 0 24 24">${ICON.gear}</svg></button>
        </div>
      </div>
      <div class="gt" id="mt-app">
        <div class="gscrs">
          <section class="gscr" id="mt-scr-hub">
            <div class="card mapcard mini">
              <div class="map mini" id="mt-hubMap"></div>
              <div class="mside">
                <div class="mhl" id="mt-hubHead"></div>
                <div class="mlegend" id="mt-hubLegend"></div>
                <span class="refill" id="mt-hubRefill"></span>
              </div>
            </div>
            <div class="card tcard" id="mt-hubTCard">
              <div class="tc-head">Träna en tabell</div>
              <div class="tbtns" id="mt-hubTables"></div>
              <div class="tx" id="mt-hubExtra"><span class="xlab">Extra</span><div class="tbtns xchips" id="mt-hubXTables"></div></div>
            </div>
            <button class="card hardrow" id="mt-hubHard">
              <span class="hr-ic">${svg('target')}</span>
              <span class="hr-t"><b>De svåra talen</b><span class="hr-k"><span id="mt-hubHardTxt"></span><span class="tb-bar"><i id="mt-hubHardBar"></i></span></span></span>
              <span class="hr-go">${svg('fwd')}</span>
            </button>
            <div class="card varvrow">
              <span class="vr-t"><small>Varje pass</small><b id="mt-vrTxt"></b></span>
              <span class="pc-rs" id="mt-vrIcons"></span>
              <button class="btn-pill" id="mt-vrEdit">Ändra</button>
            </div>
            <div class="tiles">
              ${tile('Prac', 'shuffle', 'Öva blandat')}
              ${tile('Learn', 'bulb', 'Lär dig strategin')}
              ${tile('Rec', '', 'Rekordrunda')}
            </div>
            <div class="hubmore" id="mt-hubMore">
              <button class="mlink" id="mt-goStats">${svg('stats')}Statistik</button>
              <button class="mlink" id="mt-goLog">${svg('log')}Logg</button>
            </div>
          </section>

          <section class="gscr" id="mt-scr-tstart">
            <div class="card ts-head">
              <span class="ts-md" id="mt-tsMd"></span>
              <div class="ts-t"><b id="mt-tsTitle"></b><span id="mt-tsKan"></span><span class="tb-bar"><i id="mt-tsBar"></i></span></div>
            </div>
            <div class="card ts-medals" id="mt-tsMedals"></div>
            <div class="card ts-rounds">
              <div class="su-lab"><b>Varv</b></div>
              <div class="ts-rlist" id="mt-tsRounds"></div>
              <div class="ts-sum" id="mt-tsSum"></div>
            </div>
            <div class="grow"></div>
            <button class="btn btn-primary ts-go" id="mt-tsGo"></button>
            <button class="btn btn-sec ts-edit" id="mt-tsEdit"></button>
          </section>

          <section class="gscr" id="mt-scr-hstart">
            <div class="card ts-head">
              <span class="ts-md hs-ic">${svg('target')}</span>
              <div class="ts-t"><b>De svåra talen</b><span id="mt-hsKan"></span><span class="tb-bar"><i id="mt-hsBar"></i></span></div>
            </div>
            <div class="card hs-mapcard">
              <div class="map hs-map" id="mt-hsMap"></div>
              <div class="hs-side">
                <p class="hs-why">${HARD_WHY}</p>
                <div class="mlegend" id="mt-hsLegend"></div>
              </div>
            </div>
            <div class="gsh-tg hs-pick" id="mt-hsPick"><button data-v="all">Alla 21</button><button data-v="weak"></button></div>
            <p class="hs-praise" id="mt-hsPraise"></p>
            <div class="card ts-rounds">
              <div class="su-lab"><b>Varv</b></div>
              <div class="ts-rlist" id="mt-hsRounds"></div>
              <div class="ts-sum" id="mt-hsSum"></div>
            </div>
            <div class="grow"></div>
            <button class="btn btn-primary ts-go" id="mt-hsGo"></button>
            <button class="btn btn-sec ts-edit" id="mt-hsEdit"></button>
          </section>

          <section class="gscr" id="mt-scr-setup">
            <div class="card sucard">
              <div class="su-lab"><b>Tabeller</b><small>Välj en tabell, eller flera att blanda</small></div>
              <div class="chips" id="mt-suTables">${[1,2,3,4,5,6,7,8,9,10].map(t => `<button data-t="${t}">${t}</button>`).join('')}</div>
              <div class="xrow"><span class="xlab">Extra</span><div class="chips xchips">${[11, 12].map(t => `<button data-t="${t}">${t}</button>`).join('')}</div></div>
            </div>
            <div class="card sucard">
              <div class="su-lab"><b>Gånger</b><small>Gäller hela gångertabellen: kartan och alla övningar</small></div>
              <div class="gsh-tg" id="mt-suUpto" style="grid-template-columns:repeat(3,1fr)">${UPTO_OPTS.map(([v, l]) => `<button data-v="${v}">${l}</button>`).join('')}</div>
            </div>
            <div class="card sucard">
              <div class="su-lab su-row"><b>Varv</b><div class="presets" id="mt-suPresets">${PRESETS.map(p => `<button data-k="${p.k}">${p.label}</button>`).join('')}</div></div>
              ${RTYPES.map(t => `<div class="rrow" id="mt-suR-${t}"><span class="ri ri-${t}">${svg(RICON[t])}</span><span class="rt"><b>${RNAME[t]}</b><small>${RHELP[t]}</small></span><span class="rstep"><button class="stp" data-t="${t}" data-d="-1" aria-label="Ett varv färre">${svg('minus')}</button><b class="rn"></b><button class="stp" data-t="${t}" data-d="1" aria-label="Ett varv till">${svg('plus')}</button></span></div>`).join('')}
            </div>
            <div class="grow"></div>
            <div class="su-sum" id="mt-suSum"></div>
            <div class="slot"><button class="btn btn-primary" id="mt-suGo"></button></div>
          </section>

          <section class="gscr" id="mt-scr-pass">
            <div class="card track"><div class="trtop"><span id="mt-psL"></span><span class="rps" id="mt-psR"></span></div><div class="bar"><i class="fill" id="mt-psFill"></i></div></div>
            <div class="pmain">
              <div class="card stage"><span class="qtag" id="mt-psTag"></span><div class="qbig" id="mt-psQ"></div></div>
              <div class="ctrl" id="mt-psCtrl"></div>
              <div class="card overlay" id="mt-psOver">
                <div class="ohead"><div class="oq" id="mt-psOQ"></div><span class="otag">Så kan du tänka</span></div>
                <div class="rhost" id="mt-psHost"></div>
              </div>
            </div>
            <div class="bubble b76"><div class="thought" id="mt-passBubble"></div></div>
            <div class="slot" id="mt-psSlot">
              <button class="btn btn-primary" id="mt-psMain"></button>
              <div class="duo"><button class="btn btn-sec" id="mt-psHelp"></button><button class="btn btn-primary" id="mt-psRetry"></button></div>
              <div class="choice" id="mt-passChoice"></div>
            </div>
          </section>

          <section class="gscr" id="mt-scr-done">
            <div class="dn-head"><span class="dn-star">${svg('star')}</span><h2>Du är klar!</h2><p id="mt-dnPraise"></p></div>
            <div class="card receipt" id="mt-dnCard"></div>
            <div class="grow"></div>
            <p class="dn-ask" id="mt-dnAsk"></p>
            <button class="hold" id="mt-dnHold" aria-label="Sett av en vuxen. Håll inne en och en halv sekund."></button>
            <button class="btn btn-sec" id="mt-dnHome" style="min-height:48px">${svg('map')} Till kartan</button>
          </section>

          <section class="gscr" id="mt-scr-learn">
            <button class="chap" id="mt-learnChap" aria-pressed="false">${svg('shrink')}Tabellen är mindre än du tror</button>
            <div class="seg" id="mt-learnTabs">${LT.map(t => `<button data-t="${t}">${t}:an</button>`).join('')}</div>
            <div class="stepper strat-only">
              <button class="stp" id="mt-bPrev" aria-label="Talet före">${svg('back')}</button>
              <div class="steq" id="mt-learnEq"></div>
              <button class="stp" id="mt-bNext" aria-label="Talet efter">${svg('fwd')}</button>
            </div>
            <div class="card rectcard strat-only"><div class="rhost" id="mt-learnHost"></div></div>
            <div class="bubble b92 strat-only"><div class="thought" id="mt-learnBubble"></div></div>
            <div class="slot strat-only" id="mt-learnSlot"><button class="btn btn-primary" id="mt-learnMain"></button><div class="choice" id="mt-learnChoice"></div></div>
            <button class="btn btn-sec strat-only" id="mt-learnFlip" style="min-height:44px"></button>
            <div class="card lessoncard lesson-only"><div class="map" id="mt-lessonMap"></div><div class="legend" id="mt-lessonCount"></div></div>
            <div class="bubble b92 lesson-only"><div class="thought" id="mt-lessonBubble"></div></div>
            <div class="slot lesson-only" id="mt-lessonSlot"><button class="btn btn-primary" id="mt-lessonMain"></button><div class="duo"><button class="btn btn-sec" id="mt-lessonAgain"></button><button class="btn btn-primary" id="mt-lessonHard"></button></div></div>
          </section>

          <section class="gscr" id="mt-scr-prac">
            <div class="pdots" id="mt-pracDots"></div>
            <div class="pmain">
              <div class="card stage"><span class="qtag" id="mt-pracTag"></span><div class="qbig" id="mt-pracQ"></div></div>
              <div class="ctrl" id="mt-pracCtrl"></div>
              <div class="card overlay" id="mt-pracOver">
                <div class="ohead"><div class="oq" id="mt-pracOQ"></div><span class="otag" id="mt-pracOTag"></span></div>
                <div class="rhost" id="mt-pracHost"></div>
              </div>
            </div>
            <div class="bubble b76"><div class="thought" id="mt-pracBubble"></div></div>
            <div class="slot" id="mt-pracSlot"><button class="btn btn-primary" id="mt-pracMain"></button><div class="choice" id="mt-pracChoice"></div></div>
          </section>

          <section class="gscr" id="mt-scr-end">
            <div class="card mapcard">
              <div class="maphead"><div class="mhl" id="mt-endHead"></div></div>
              <div class="map" id="mt-endMap"></div>
              <div class="legend" id="mt-endLegend"></div>
            </div>
            <div class="grow"></div>
            <div class="bubble b92"><div class="thought" id="mt-endBubble"></div></div>
            <div class="slot"><button class="btn btn-primary" id="mt-endMain"></button></div>
          </section>

          <section class="gscr" id="mt-scr-rec">
            <div class="card track"><div class="trtop"><span id="mt-recL"></span><span id="mt-recR"></span></div><div class="bar" id="mt-recBar"><i class="fill" id="mt-recFill"></i><i class="flag" id="mt-recFlag"></i></div></div>
            <div class="pmain">
              <div class="card stage"><span class="qtag" id="mt-recTag"></span><div class="qbig" id="mt-recQ"></div></div>
              <div class="ctrl" id="mt-recCtrl"></div>
            </div>
            <div class="bubble b76"><div class="thought" id="mt-recBubble"></div></div>
            <div class="slot"><button class="btn btn-primary" id="mt-recMain"></button></div>
          </section>
        </div>
      </div>
      <div class="gsheet" id="mt-sheet" aria-hidden="true">
        <div class="gsh-bg" id="mt-sheetBg"></div>
        <div class="gsh-panel" role="dialog" aria-modal="true" aria-label="Inställningar">
          <div class="gsh-head"><b>Inställningar</b><button class="gsh-x" id="mt-sheetX" aria-label="Stäng">${svg('close')}</button></div>
          ${SETTINGS.map(r => `<div class="gsh-row"><div class="gsh-lab"><b>${r.label}</b><small>${r.help}</small></div><div class="gsh-tg" data-k="${r.k}" style="grid-template-columns:repeat(${r.opts.length},1fr)">${r.opts.map(([v, l]) => `<button data-v="${v}">${l}</button>`).join('')}</div></div>`).join('')}
          <button class="gsh-done" id="mt-sheetDone">Klar</button>
        </div>
      </div>
    `;
  }

  function bindTrainer(){
    $('backBtn').onclick = () => {
      if (S.screen === 'pass'){ confirmCancelPass(); return; }
      if (S.screen === 'setup' && SU && SU.from === 'hstart'){ goto('hstart'); return; }
      if (S.screen === 'setup' && SU && SU.from === 'tstart' && SU.fromT){ goto('tstart', SU.fromT); return; }
      if (S.screen !== 'hub') goto('hub');
      else { stopClock(); App.goBackToGameSelect(); }
    };
    $('gear').onclick = openSheet;
    $('sheetBg').onclick = closeSheet; $('sheetX').onclick = closeSheet; $('sheetDone').onclick = closeSheet;
    $('sheet').querySelectorAll('.gsh-tg').forEach(tg => tg.querySelectorAll('button').forEach(b => b.onclick = () => setSetting(tg.dataset.k, b.dataset.v)));

    // Träna en tabell: ett tryck → startskärmen för den tabellen
    $('hubTCard').onclick = e => {
      const b = e.target.closest('.tb');
      if (!b || busy) return;
      snd('click'); goto('tstart', +b.dataset.t);
    };
    $('vrEdit').onclick = () => { if (!busy) goto('setup'); };
    $('hubHard').onclick = () => { if (!busy){ snd('click'); goto('hstart'); } };
    $('hsPick').querySelectorAll('button').forEach(b => b.onclick = () => { if (!HS || busy || HS.mode === b.dataset.v) return; HS.mode = b.dataset.v; snd('click'); renderHStart(); });
    $('hsGo').onclick = startHStart;
    $('hsEdit').onclick = () => { if (!busy) goto('setup', { from:'hstart' }); };
    $('tsGo').onclick = startTStart;
    $('tsEdit').onclick = () => { if (!busy && TS) goto('setup', TS.t); };
    $('goLearn').onclick = () => { if (!busy) goto('learn'); };
    $('goPrac').onclick = () => { if (!busy) goto('prac'); };
    $('goRec').onclick = () => { const c = counts(curVis()); if (!busy && c.kan + c.due >= 10) goto('rec'); };
    $('scr-setup').querySelectorAll('.chips button').forEach(b => b.onclick = () => {
      if (!SU || b.disabled) return;
      const t = +b.dataset.t;
      SU.tables = SU.tables.includes(t) ? SU.tables.filter(x => x !== t) : [...SU.tables, t];
      snd('click'); renderSetup();
    });
    $('suUpto').querySelectorAll('button').forEach(b => b.onclick = () => setSetting('upto', b.dataset.v));
    $('suPresets').querySelectorAll('button').forEach(b => b.onclick = () => { if (!SU) return; SU.counts = { ...PRESETS.find(p => p.k === b.dataset.k).c }; snd('click'); renderSetup(); });
    $('scr-setup').querySelectorAll('.rrow .stp').forEach(b => b.onclick = () => {
      if (!SU || b.disabled) return;
      SU.counts[b.dataset.t] = clampCount(SU.counts[b.dataset.t] + +b.dataset.d);
      snd('click'); renderSetup();
    });
    $('suGo').onclick = startFromSetup;
    $('psMain').onclick = onPassMain;
    $('psHelp').onclick = () => { if (PS && PS.phase === 'explain') passExplainStep(); else passExplain(); };
    $('psRetry').onclick = passRetry;
    const hold = $('dnHold');
    hold.addEventListener('pointerdown', holdStart);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => hold.addEventListener(ev, holdEnd));
    hold.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat){ e.preventDefault(); holdStart(); } });
    hold.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') holdEnd(); });
    hold.addEventListener('contextmenu', e => e.preventDefault());
    $('dnHome').onclick = () => goto('hub');
    $('goStats').onclick = () => { if (!busy) showStats(); };
    $('goLog').onclick = () => { if (!busy) showLog(); };

    $('learnTabs').querySelectorAll('button').forEach(b => b.onclick = () => { if (busy) return; LS.on = false; S.learn.a = +b.dataset.t; startLearn(); });
    $('learnChap').onclick = () => { if (!busy){ snd('click'); startLesson(); } };
    $('lessonMain').onclick = onLessonMain;
    $('lessonAgain').onclick = () => { if (!busy && LS.on) startLesson(); };
    $('lessonHard').onclick = () => { if (!busy){ snd('click'); goto('hstart'); } };
    $('bPrev').onclick = () => { if (busy || S.learn.b <= 1) return; S.learn.b--; startLearn(); };
    $('bNext').onclick = () => { if (busy || S.learn.b >= UPTO()) return; S.learn.b++; startLearn(); };
    $('learnMain').onclick = onLearnMain;
    $('learnFlip').onclick = onLearnFlip;
    $('pracMain').onclick = onPracMain;
    $('endMain').onclick = onEndMain;
    $('recMain').onclick = onRecMain;
  }

  /* ── Init ──────────────────────────────────────────── */
  function init(p) {
    profile  = p;
    loadSettings();
    stopTimer();
    renderMain();
  }

  /* Hubben (Gångertabellens startvy). Anropas också av Tillbaka-knapparna i
     Statistik och Logg. */
  function renderMain() {
    stopClock();
    closeModalSafe();
    const root = document.getElementById('mult-root');
    if (!root) return;
    root.innerHTML = trainerHTML();
    busy = false; P = null; R = null; LW = null; PS = null; SU = null; TS = null; HS = null; hardMap = null; LS.on = false; LS.i = -1;
    S.screen = 'hub';
    S.T = loadTrainer();
    S.record = loadRecord();
    buildMaps();
    learnRect = makeRect($('learnHost'));
    pracRect = makeRect($('pracHost'));
    passRect = makeRect($('psHost'));
    ctrlP = makeCtrl($('pracCtrl'), (o, el) => pracAnswer(o, el));
    ctrlR = makeCtrl($('recCtrl'), (o, el) => recAnswer(o, el));
    ctrlS = makeCtrl($('psCtrl'), (o, el) => passAnswer(o, el), passVal);
    bindTrainer();
    goto('hub');
  }
  function closeModalSafe(){ try { hideModal(); } catch (_) {} }
  /* Kartornas storlek följer Gånger: hubbens kompakta rutor 18/14/13 px, slutbildens 28/26/24 px.
     Lektionens karta byggs när lektionen startar (LESSON_CELL). */
  function buildMaps(){
    const n = UPTO();
    hubMap = makeMap($('hubMap'), n, { 10:18, 11:14, 12:13 }[n]);   // v62: 11–12 mindre, så att De svåra talen får plats
    endMap = makeMap($('endMap'), n, { 10:28, 11:26, 12:24 }[n]);
  }

  /* Stoppar rekordrundans klocka (anropas av app.js när Gångertabellen lämnas). */
  function stopTimer() { stopClock(); }

  /* ══════════════════════════════════════════════════════
     FRÅGESESSION (Fokuserad träning i Statistik)
     Eget matteprov är borttaget ur hubben (v58): övningspasset med
     flera tabeller ersätter det.
  ══════════════════════════════════════════════════════ */
  /* Kör en blandad session med given frågelista.
     opts (alla valfria – utelämnade = Fokuserad träning från Statistik):
       headerTitle  – rubrik i headern
       hint         – text ovanför frågan ('' döljer raden)
       onCancel     – Avbryt-knappens handling (default: Statistik)
       onDone(stats)– egen resultathantering (default: showFocusResult)
     Används av Fokuserad träning i Statistik. */
  function runCustomSession(questions, tables, opts) {
    opts = opts || {};
    const quiz = MP.createRetryQuiz(questions);
    const headerTitle = opts.headerTitle || 'Fokuserad träning';
    const hint = (opts.hint !== undefined) ? opts.hint : `${tables.join(', ')}-tabellerna`;
    MultGame._sessionCancel = opts.onCancel || showStats;

    function finish() {
      if (opts.onDone) { opts.onDone(quiz.stats()); return; }
      showFocusResult(quiz.stats(), tables);
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
      initFreeInput(ans);
    }

    renderQ();
  }

  function showFocusResult(stats, tables) {
    const correct = stats.firstTryCorrect;
    const total   = stats.total;
    const pct     = stats.pct;
    snd(pct >= 80 ? 'fanfare' : 'correct');
    if (pct === 100) confetti(80);
    addSessionLog({ type: 'focus', tables, correct, total, pct });
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
          <button class="btn btn-accent btn-lg" onclick="MultGame.showStats()">Till statistiken</button>
          <button class="btn btn-ghost btn-lg" onclick="MultGame.renderMain()">Till kartan</button>
        </div>
      </div>
    `;
    // Capybara-samlingen (v34): ren sidoeffekt EFTER resultat/logg – får aldrig kasta
    try { if (window.Capy) Capy.award(profile, { type: 'test', data: { module: 'mult', pct } }); } catch (_) {}
  }

  /* ══════════════════════════════════════════════════════
     STATISTIK-VY
  ══════════════════════════════════════════════════════ */
  function showStats() {
    const stats = getStats();
    snd('click');
    stopClock();

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

  /* Loggposternas ikon och rubrik. Öva-pass och rekordrundor (nya) har SVG-ikoner. */
  const LOG_SVG = {
    pass:   `<svg class="icn" viewBox="0 0 24 24">${ICON.shuffle}</svg>`,
    record: `<svg class="icn" viewBox="0 0 24 24">${ICON.trophy}</svg>`,
    ovningspass: `<svg class="icn" viewBox="0 0 24 24">${ICON.repeat}</svg>`,
    focus:  `<svg class="icn" viewBox="0 0 24 24">${ICON.bulb}</svg>`,
  };
  function logIcon(e) {
    if (LOG_SVG[e.type]) return LOG_SVG[e.type];
    return e.type === 'timer' ? '⏰' : e.type === 'custom' ? '🎲' : '✖️';
  }
  function logLabel(e, long) {
    if (e.type === 'pass') return 'Öva blandat';
    if (e.type === 'record') return 'Rekordrunda';
    if (e.type === 'ovningspass' && e.hard) return 'De svåra talen';
    if (e.type === 'ovningspass') return `Övningspass (${(e.tables || []).map(t => `${t}:an`).join(long ? ', ' : ',')})`;
    if (e.type === 'focus') return 'Fokuserad träning';
    if (e.type === 'timer') return 'Timerträning';
    if (e.type === 'custom') return `Eget prov (${e.tables?.join(long ? ', ' : ',')})`;
    return long ? `${e.table}:ans tabell` : `${e.table}:an`;
  }
  function logValue(e, long) {
    if (e.type === 'timer') return `<span class="history-value num mult-mid">${e.minutes} min</span>`;
    if (e.type === 'record') return `<span class="history-value num mult-mid">${e.n} ${e.tempo === 'klocka' ? 'rätt' : 'i rad'}</span>`;
    const cls = e.pct >= 80 ? 'mult-good' : (!long || e.pct >= 60) ? 'mult-mid' : 'mult-bad';
    return `<span class="history-value num ${cls}">${e.pct}%</span>`;
  }
  function logSub(e) {
    if (e.type === 'timer') return `Tidsträning i ${e.minutes} minut${e.minutes !== 1 ? 'er' : ''}`;
    if (e.type === 'pass') return `${e.correct} rätt av ${e.total}`;
    if (e.type === 'record') return e.tempo === 'klocka' ? `${e.n} rätt på en minut` : `${e.n} rätt i rad`;
    if (e.type === 'focus') return `${e.correct} rätt av ${e.total}`;
    if (e.type === 'ovningspass') return `${varvTxt((e.rounds || []).length).toLowerCase()} · ${e.correct} rätt av ${e.total} på första försöket · ${durTxt(e.secs || 0)}`;
    return `${e.correct} rätt av ${e.total} | Intervall ${e.rangeMin}–${e.rangeMax}`;
  }

  function renderSessionHistory() {
    const log = getLog();
    if (log.length === 0) return '';
    const entries = log.slice(0, 10).map((e, i) => {
      const d = new Date(e.date);
      const dateStr = d.toLocaleDateString('sv-SE', { day:'numeric', month:'short' });
      const timeStr = d.toLocaleTimeString('sv-SE', { hour:'2-digit', minute:'2-digit' });
      return `
        <div class="history-item">
          <span class="history-icon">${logIcon(e)}</span>
          <div class="history-main">
            <div class="history-title">${logLabel(e, false)} ${i===0?'<span class="mult-new">NY!</span>':''}</div>
            <div class="history-sub">${dateStr} ${timeStr}</div>
          </div>
          ${logValue(e, false)}
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
    snd('click');

    // Bygg unika tabeller
    const tables = [...new Set(problems.map(p => p.table))];
    runCustomSession(problems, tables);
  }

  /* ══════════════════════════════════════════════════════
     DAGENS TRÄNING (js/daily.js, v65)
  ══════════════════════════════════════════════════════ */
  /* Kandidaterna: varje par inom Gånger (upto) med sin låda, i lätt-först-ordning (easyFirst,
     samma ordning som passet använder för nya tal). Läser lådorna utan att skriva: saknas de
     byggs de ur statistiken i minnet, som loadTrainer skulle göra. Ren mot localStorage. */
  function dailyCandidatesFrom(pairs, n, day){
    return pairsUpTo(n).slice().sort(easyFirst).map(([a, b], i) => {
      const st = pairs[KEY(a, b)] || freshPair();
      return { module:'mult', key:KEY(a, b), label:`${a} × ${b}`, state:vis(st, day), due:st.due || null, okDays:Number(st.okDays) || 0, order:i };
    });
  }
  function dailyCandidates(p, day = today()){
    if (!p) return [];
    const raw = readJSON(BOX_KEY(p.id));
    let pairs;
    if (raw && raw.v === 2 && validPairs(raw.pairs)) pairs = raw.pairs;
    else pairs = pairsFromStats(readJSON(STATS_KEY(p.id)) || {}, day);
    return dailyCandidatesFrom(pairs, +settingsFrom(readJSON(SET_KEY(p.id))).upto, day);
  }
  /* Dagens avsnitt med gångertabellens tal: övningspasset med en parlista, ett varv flerval.
     Nötloopen och rektangeln vid fel som vanligt; recordAnswer på första försöket.
     keys = kandidaternas nycklar ('7x8'). Inget eget kvitto och ingen logg:
     opts.onDone({ correct, total, fixed, secs, first }) där first = { '7x8': rätt på första
     försöket }. Avbryt frågar först, sedan opts.onCancel(). */
  function runDaily(p, keys, opts){
    const pairs = cleanPairs((keys || []).map(k => String(k).split('x').map(Number)));
    if (!pairs.length){ opts.onDone({ correct:0, total:0, fixed:0, secs:0, first:{} }); return; }
    profile = p;
    loadSettings();
    renderMain();                                         // skalet monteras (hubben), passet tar över direkt
    goto('pass', { pairs, counts:{ show:0, choice:1, free:0 }, daily:opts });
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
      // Statistik, logg, lådor och rekord. Inställningarna (kugghjulet) står kvar.
      [STATS_KEY, LOG_KEY, BOX_KEY, REC_KEY].forEach(k => { try { localStorage.removeItem(k(profile.id)); } catch (_) {} });
      hideModal();
      showStats();
    };
  }

  /* ══════════════════════════════════════════════════════
     SESSIONSLOGG
  ══════════════════════════════════════════════════════ */
  function showLog() {
    const log = getLog();
    snd('click');
    stopClock();
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
      return `
        <div class="history-item">
          <span class="history-icon">${logIcon(e)}</span>
          <div class="history-main">
            <div class="history-title">${logLabel(e, true)} ${i===0?'<span class="mult-new">NY!</span>':''}</div>
            <div class="history-sub">${dateStr} kl. ${timeStr} · ${logSub(e)}</div>
            ${e.type === 'ovningspass' && e.seen ? `<span class="mult-stamp"><svg viewBox="0 0 24 24">${ICON.check}</svg>Sett av en vuxen · ${fmtStamp(e.seen)}</span>` : ''}
          </div>
          ${logValue(e, true)}
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
     SVARSGRÄNSSNITT (Fokuserad träning)
  ══════════════════════════════════════════════════════ */
  function buildAnswerUI(table, mult, correctAnswer, callback) {
    if (answerMode === 'choice') {
      return buildChoiceUI(correctAnswer, callback);
    } else {
      return buildFreeUI(correctAnswer, callback);
    }
  }

  function buildChoiceUI(correctAnswer, callback) {
    const opts = generateOptions(correctAnswer);
    MultGame._choiceCallback = callback;
    return `
      <div class="mq-answers q-answers-fill" id="choice-options">
        ${opts.map(o => `
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
    showStats,
    showLog,
    startFocusedTraining,
    dailyCandidates,
    runDaily,
    confirmReset,
    stopTimer,
    showModal,
    hideModal,

    // Händelsehanterare (sätts dynamiskt av renderfunktioner)
    _sessionCancel: null,
    _doReset: null,
    _cancelPass(){
      hideModal();
      if (S.screen !== 'pass') return;
      if (PS && PS.daily){ const d = PS.daily; PS.token++; PS = null; d.onCancel(); return; }   // Dagens träning: tillbaka dit den startades
      goto('hub');
    },

    _handleChoice(selected, correct) {
      const wasCorrect = selected === correct;
      snd(wasCorrect ? 'correct' : 'wrong');
      flashFeedback(wasCorrect);

      // Färglägg knappar
      document.querySelectorAll('.answer-option').forEach(btnEl => {
        btnEl.disabled = true;
        const val = parseInt(btnEl.id.replace('opt-', ''));
        if (val === correct) btnEl.classList.add('correct');
        else if (val === selected && !wasCorrect) btnEl.classList.add('wrong');
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
        snd(wasCorrect ? 'correct' : 'wrong');
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
      snd('click');
    },

    /* Endast för tester och verifiering: rena funktioner, aldrig anropade av appen */
    _test: {
      KEY, PAIRS, distractors, options, reverseOptions,
      waysFor, stepsFor, introText, wayLabel, strategySteps, strategyTexts, TXT, wayRank,
      applyAnswer, freshPair, vis, visMap, counts, leftToLearn, fullTables, pairsFromStats, addDays, intervalFor, INTERVALS,
      buildPass, schedulePass, easyFirst, orient, pairsUpTo, shrinkSteps, shrinkRemain,
      tableMedal, MEDALS, quickTables, quickPassCfg, countsFrom, medalSVG, trainerHTML,
      hardPairs, hardInfo, hardDefault, hardSelection, hardCfg, kanTxt, cleanPairs, pairItems, shrinkLive,
      HARD_WHY, HARD_ALL_OK, hardWeakLabel, hardWhat, receiptHTML, logLabel, logSub,
      RTYPES, PRESETS, normCounts, roundTypes, presetFor, cleanTables, roundItems, buildRounds, passPlan, planSummary,
      createDrill, receiptFor, praiseFor, durTxt, passExplainFor, settingsFrom, UPTO_DEFAULT, endSummaryFor: (moves, after) => { const keep = P; P = { moves, after }; try { return endSummary(); } finally { P = keep; } },
      dailyCandidatesFrom,
      setToday: d => { todayOverride = d || null; },
      today,
      peek: () => ({ screen:S.screen, busy, pass:P, rec:R, ovp:PS, setup:SU, learn:LW && { walker:LW, flip:LF }, trainer:S.T, settings:{ ...SET, answer:answerMode } }),
    },
  };
})();

/* CJS-export för vitest (samma mönster som shared.js) */
if (typeof module !== 'undefined' && module.exports) module.exports = MultGame;
