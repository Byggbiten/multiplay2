/* ============================================================
   MULTIPLAY – Multiplikation & Division med uppställning (v32)
   Steg A: hubb + UPPSTÄLLD MULTIPLIKATION nivå 1–4 (alla lägen).
   Steg B (v32): KORT DIVISION nivå 1–4 (alla lägen) — hubbkortet
   är aktiverat.
   Mönster: uppstallning.js — demo-motor v28 (bubbla FÖRE animation,
   Klart-bubbla med 1,8 s lästid), exFree-miniräknaren, kladd-lagen.
   OBS: åk 4-boken använder · (mittpunkt) som gångertecken — multdiv
   följer boken. Nivå 4 skriver delprodukt 2 FÖRSKJUTEN ett steg åt
   vänster (ingen platshållar-nolla), med + framför, per boken.
   v30: LEVANDE MINNESSIFFROR (MINNESSIFFER-KONCEPT.md) — minnes-
   SPALT till höger om faktorraden (per Dennis foto: "1̶ 2" bredvid
   ·43). Varje minne appendas efter föregående, stryks med penndrag
   när det använts och RADERAS ALDRIG under uppgiften. Demo: egna
   placera/stryk-steg. Hjälp: PLACERA- och STRYK-faser (barnet tappar).
   Fritt: frivillig tappbar spalt + glömd-minnessiffra-detektion.
   Matte-kärnan (singlePass/addPass/mdCarries) är OFÖRÄNDRAD.
   v31: TVÅSTEGSFRÅGAN — kolumnfrågor med minne delas i (a) ren
   tabellfråga och (b) minnespåminnelsen som EGEN fråga (gäller även
   nivå 4:s additionsfas). LIVLINOR — 2 st per övningsrunda i hjälp-
   läget: knappen visar svaret i bubblan men barnet MÅSTE skriva in
   det själv (ingen auto-fyllning, ingen poängpåverkan).
   v32: KORT DIVISION — divisorn till vänster, lodrät avskiljare,
   täljaren till höger; kvoten skrivs siffra för siffra OVANFÖR
   täljaren. Mellanrest = liten röd .mem-digit-siffra uppe till
   vänster om NÄSTA täljarsiffra ("¹6" läses sexton). Rester stryks
   ALDRIG (de uppgår i nästa tal — pappers-korrekt). Generatorn
   konstruerar BAKLÄNGES (kvot·divisor = täljare ⇒ jämn delning) och
   verifierar nivåvillkoren på den framräknade stegsekvensen (divPass).
   Hjälpläget: frågekedja per siffra (kvotsiffra → rest → PLACERA-fas
   där barnet tappar platsen framför nästa siffra). Livlinorna delas
   med multiplikationen (2/runda). Fritt läge: kvoten i miniräknar-
   fältet + glömd-rest-detektor (kvotsiffra = floor(siffra/divisor)
   utan rest-medföljning). Multiplikationens kedjor är ORÖRDA.
   ============================================================ */
'use strict';

const MultDivGame = (() => {

  /* ── State ─────────────────────────────────────────────── */
  let profile    = null;
  let difficulty = 1;   // 1🌱 utan minne · 2🌿 med minne · 3🌾 tresiffrigt · 4🌳 två tvåsiffriga
  let gameKind   = 'mult'; // v32: 'mult' | 'div' — hubbens två spelkort
  let numA = 0, numB = 0;  // div: numA = täljare, numB = divisor
  let plan = null;      // förberäknad uppgiftsplan (buildPlan/buildDivPlan) — FACIT för alla lägen

  /* Demo */
  let demoStep = 0, demoSteps = [], stepLocked = false;
  let mdCarries   = [0,0,0,0];
  let mdCarryUsed = [false,false,false,false];

  /* Minnesspalten (v30) — visningsmodell, rör ALDRIG matte-kärnan.
     Appendas hela uppgiften (strukna står kvar), töms först vid ny uppgift. */
  let mdMemList   = [];    // [{ val, used }]
  let memColMode  = 'demo';// 'demo' | 'help' | 'free'
  let memAwait    = null;  // hjälpläget: { type:'place'|'strike', val, srcG?, idx? }
  let memMoments  = 0;     // antal placera/stryk-moment i passet
  let memMistakes = 0;     // fel-tap i passet (0 ⇒ Minnesmästare ⭐)
  let memPickerOpen = false; // fria lägets sifferväljare 1–9

  /* Divisionens PLACERA-fas (v32): { g, val, next } — barnet tappar
     platsen framför nästa täljarsiffra där mellanresten ska stå. */
  let divAwait = null;

  /* Övning */
  let exerciseIdx = 0, exScore = 0, helpMode = true;
  let lifelines = 2; // v31: 2 livlinor per övningsrunda (hjälpläget) — nollställs i startExercise
  let exGen = 0; // session-token: ogiltigförklarar schemalagda uppgiftsbyten vid Avsluta
  let helpQueue = [], helpIdx = 0, helpSub = 0; // helpSub: alltid 0 sedan v30 (carry-knappen ersattes av PLACERA-fasen)
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
    .md-ansc { width:clamp(38px,7vw,64px); height:clamp(38px,7vw,64px); border-radius:11px;
      display:flex; align-items:center; justify-content:center;
      font-size:clamp(1.35rem,3.4vw,2.5rem); font-weight:900;
      border:2.5px dashed color-mix(in srgb, var(--accent) 32%, transparent);
      background:rgba(255,255,255,0.7); }
    .md-ansc.active-col { border-style:solid; border-color:var(--accent);
      background:color-mix(in srgb, var(--accent) 8%, transparent); }
    .md-ansc.filled { border-style:solid; }
    .md-ansc.md-glow { animation:md-glow 1.1s ease-in-out infinite; }
    /* Nivå 4 (8 tabellrader): kompaktare celler så vyn ryms utan scroll */
    .md-l4 .md-cell, .md-l4 .md-ansc {
      width:clamp(33px,6.2vw,56px); height:clamp(33px,6.2vw,56px);
      font-size:clamp(1.15rem,3vw,2.1rem); }

    /* Minnesspalten (v30) — smal spalt HÖGER om faktorraden, per Dennis
       foto ("1̶ 2" bredvid ·43). flex-wrap ⇒ radbryt i stället för
       overflow; bredden clamp:as så 390 px-viewporten aldrig spricker. */
    .md-memtd { vertical-align:middle; padding-left:3px; }
    .md-memcol { display:flex; flex-wrap:wrap; gap:2px 6px; align-items:center;
      align-content:center; width:clamp(44px,11vw,80px); min-height:20px; }
    .mem-digit { position:relative; display:inline-flex; align-items:center;
      justify-content:center; min-width:0.7em; line-height:1.15;
      font-family:var(--font-head); font-weight:900; color:#dc2626;
      transform:rotate(-4deg); font-size:clamp(0.85rem,2.1vw,1.45rem); }
    .mem-digit.used { opacity:0.5; }
    .mem-digit.landing { animation:md-memland 0.45s ease-out both; }
    .mem-digit .mem-strike { position:absolute; left:-18%; top:-8%;
      width:136%; height:116%; overflow:visible; pointer-events:none; }
    .mem-strike path { stroke:#b91c1c; stroke-width:2.2; fill:none; stroke-linecap:round; }
    .mem-strike.draw path { stroke-dasharray:30; stroke-dashoffset:30;
      animation:md-pen 0.25s ease-out 0.05s forwards; }
    .mem-slot { width:1.05em; height:1.3em; border:2px dashed rgba(220,38,38,0.55);
      border-radius:6px; display:inline-flex; font-size:clamp(0.85rem,2.1vw,1.45rem); }
    #md-memcol .mem-digit, #md-memcol .mem-slot { cursor:pointer; }
    /* Barnvänlig tap-yta (T2.1): siffran är liten men träffytan ≥40px */
    #md-memcol .mem-digit::after, #md-memcol .mem-slot::after {
      content:''; position:absolute; inset:-14px; }
    .mem-slot { position:relative; }
    .mem-pulse { animation:md-mem-pulse 1.1s ease-in-out infinite; }
    .md-l4 .mem-digit, .md-l4 .mem-slot { font-size:clamp(0.72rem,1.8vw,1.2rem); }
    @media (max-width:420px) { .md-memcol { width:clamp(36px,10vw,48px); gap:1px 4px; } }

    /* Kort division (v32): divisor | lodrät avskiljare | täljare.
       Mellanresten (.md-divrem) = liten röd pennstils-siffra (.mem-digit)
       uppe till vänster om NÄSTA täljarsiffra — stryks ALDRIG. */
    .md-divbar { width:4px; height:clamp(38px,7vw,64px); border-radius:2px;
      background:linear-gradient(180deg,transparent,#374151 12%,#374151 88%,transparent); }
    .md-cell .md-divrem { position:absolute; top:-9px; left:-10px; z-index:3; display:none; }
    .md-cell .md-divrem.on { display:inline-flex; }
    .md-cell .md-divslot { position:absolute; top:-13px; left:-13px; z-index:4;
      background:rgba(255,255,255,0.92); cursor:pointer; }
    .md-cell .md-divslot::after { content:''; position:absolute; inset:-12px; }

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
      .md-l4 .mem-digit, .md-l4 .mem-slot { font-size:clamp(0.72rem,1.5vw,1rem); }
      .md-nk { width:clamp(36px,5vw,46px); height:clamp(36px,5vw,46px); }
      .md-numpad { grid-template-columns:repeat(5,clamp(36px,5vw,46px)); }
      .md-field-sm { min-height:clamp(32px,5vw,42px); font-size:clamp(1.05rem,2.2vw,1.5rem); }
    }

    /* Stress-höjden 390×664 (porträtt, kort skärm): krymp tabell + numpad + kladd-minimum */
    @media (orientation:portrait) and (max-height:700px) {
      .md-cell, .md-ansc { width:clamp(32px,6vw,44px); height:clamp(32px,6vw,44px); font-size:1.15rem; }
      .md-l4 .md-cell, .md-l4 .md-ansc { width:27px; height:27px; font-size:0.95rem; border-radius:8px; }
      .mem-digit, .mem-slot, .md-l4 .mem-digit, .md-l4 .mem-slot { font-size:0.72rem; }
      .md-memcol { width:34px; gap:1px 3px; }
      .md-divbar { height:clamp(32px,6vw,44px); }
      .md-cell .md-divrem { top:-7px; left:-7px; }
      .md-cell .md-divslot { top:-10px; left:-10px; }
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
    @keyframes md-memland {
      0%   { transform:scale(0.3) rotate(-4deg); opacity:0; }
      65%  { transform:scale(1.25) rotate(-4deg); opacity:1; }
      100% { transform:scale(1) rotate(-4deg); opacity:1; }
    }
    @keyframes md-pen { to { stroke-dashoffset:0; } }
    @keyframes md-mem-pulse {
      0%,100% { box-shadow:0 0 4px rgba(220,38,38,0.3); transform:scale(1) rotate(-4deg); }
      50%      { box-shadow:0 0 14px rgba(220,38,38,0.75); transform:scale(1.14) rotate(-4deg); }
    }
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

  /* Glömd-minnessiffra-detektion (fria läget): simulera HELA algoritmen
     med alla carryIn = 0 — kolumnvärde skrivs mod 10 (sista kolumnen
     skrivs hel), carry genereras men adderas aldrig. Nivå 4: samma regel
     per delprodukt OCH i slutadditionen. Ren funktion (vitest-bar). */
  function noCarryAnswer(pl) {
    const join = ds => ds.reduce((n, d, i) => n + d * Math.pow(10, i), 0);
    const simPass = (a, m) => {
      const ad = digitsOf(a), ds = [];
      for (let c = 0; c < ad.length; c++) {
        const prod = ad[c] * m;
        if (c === ad.length - 1) digitsOf(prod).forEach(d => ds.push(d));
        else ds.push(prod % 10);
      }
      return join(ds);
    };
    if (pl.kind === 'simple') return simPass(pl.a, pl.b);
    const v1 = simPass(pl.a, pl.ones), v2 = simPass(pl.a, pl.tens);
    const d1 = digitsOf(v1), d2 = digitsOf(v2);
    const len = Math.max(d1.length, d2.length + 1), ds = [];
    for (let c = 0; c < len; c++) {
      const s = (c < d1.length ? d1[c] : 0) + ((c >= 1 && c - 1 < d2.length) ? d2[c - 1] : 0);
      if (c === len - 1) digitsOf(s).forEach(d => ds.push(d));
      else ds.push(s % 10);
    }
    return join(ds);
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

  /* ── KORT DIVISION — ren matte-kärna (v32) ─────────────────
     divPass(n, d): stegsekvensen siffra för siffra VÄNSTER→HÖGER.
     g = platsvärdes-index från höger (som mult: 0=ental) — styr
     cellernas id och färg. cur = remIn·10 + siffran. skip = leading-
     specialfallet (första siffran < divisorn: ingen kvotsiffra skrivs,
     siffrorna läses ihop). Efter en skip är cur ≥ 10 > divisorn
     (divisor ≤ 9) ⇒ skip kan bara ske på FÖRSTA positionen, en gång. */
  function divPass(n, d) {
    const ds = digitsOf(n).reverse(); // vänster→höger
    const L = ds.length, steps = [];
    let rem = 0, started = false, prevSkip = false;
    for (let i = 0; i < L; i++) {
      const g = L - 1 - i, cur = rem * 10 + ds[i], last = i === L - 1;
      const next = last ? null : ds[i + 1];
      if (!started && cur < d && !last) {
        steps.push({ i, g, digit: ds[i], remIn: rem, cur, next,
                     skip: true, fromSkip: false, q: null, rem: cur, last });
        rem = cur; prevSkip = true; continue;
      }
      started = true;
      const q = Math.floor(cur / d), r = cur - q * d;
      steps.push({ i, g, digit: ds[i], remIn: rem, cur, next,
                   skip: false, fromSkip: prevSkip, q, rem: r, last });
      rem = r; prevSkip = false;
    }
    const qDigits = steps.filter(s => !s.skip).map(s => s.q);
    return {
      steps,
      quotient: qDigits.reduce((a, x) => a * 10 + x, 0),
      remainder: rem,
      hasSkip: steps.some(s => s.skip),
      hasMidRem: steps.some(s => !s.skip && !s.last && s.rem > 0),
      qHasZero: qDigits.some(x => x === 0),
    };
  }

  /* Nivåvillkoren (spec-tabellen) verifieras på den FRAMRÄKNADE
     stegsekvensen — inte på slumptalen. Jämn delning är garanterad
     av baklänges-konstruktionen (n = q·d), remainder-koll ändå. */
  function divLevelOk(level, d, q, n, p) {
    if (p.remainder !== 0) return false;
    const nLen = digitsOf(n).length, qd = digitsOf(q);
    if (level === 1) // 2-siffrigt ÷ (2–5), ingen mellanrest (varje siffra delbar)
      return nLen === 2 && !p.hasSkip && !p.hasMidRem && qd.length === 2 && qd.every(x => x > 0);
    if (level === 2) // 2-siffrigt ÷ (2–5), MED mellanrest
      return nLen === 2 && !p.hasSkip && p.hasMidRem;
    if (level === 3) // 3-siffrigt, mellanrester, ingen nolla i kvoten, första siffran ≥ divisorn
      return nLen === 3 && !p.hasSkip && p.hasMidRem && qd.length === 3 && qd.every(x => x > 0);
    // Nivå 4: 3-siffrigt ÷ (6–9) OCH/ELLER första siffran < divisorn ELLER nolla i kvoten
    return nLen === 3 && (d >= 6 || p.hasSkip || p.qHasZero);
  }

  /* Generator: slumpa kvot + divisor BAKLÄNGES → täljare = kvot·divisor
     (alltid jämn delning), verifiera nivåvillkoren, annars slumpa om.
     Deterministisk fallback om slumpen mot förmodan aldrig träffar. */
  function genDivProblem(level) {
    for (let t = 0; t < 400; t++) {
      let d, q;
      if (level === 1) {
        d = 2 + rnd(3); // 2–4: d=5 ger bara 55÷5 (m=1) — för mager variation
        const m = Math.floor(9 / d); // kvotsiffra ≤ m ⇒ varje täljarsiffra = siffra·d ≤ 9
        q = (1 + rnd(m)) * 10 + (1 + rnd(m));
      } else if (level === 2) {
        d = 2 + rnd(4); q = 11 + rnd(Math.floor(99 / d) - 10);
      } else if (level === 3) {
        d = 2 + rnd(4); q = 100 + rnd(Math.floor(999 / d) - 99);
      } else {
        d = 2 + rnd(8);
        const lo = Math.ceil(100 / d), hi = Math.floor(999 / d);
        q = lo + rnd(hi - lo + 1);
      }
      const n = q * d, p = divPass(n, d);
      if (divLevelOk(level, d, q, n, p)) return { a: n, b: d };
    }
    return [{ a: 84, b: 4 }, { a: 96, b: 4 }, { a: 738, b: 3 }, { a: 336, b: 6 }][level - 1];
  }

  function buildDivPlan(n, d, level) {
    const pass = divPass(n, d);
    return { level, a: n, b: d, kind: 'division', pass,
             answer: pass.quotient, width: digitsOf(pass.quotient).length };
  }

  /* Glömd-rest-detektorn (fria läget): simulera divisionen där mellan-
     resterna TAPPAS — kvotsiffra = floor(siffra/divisor) utan rest-
     medföljning. Ren funktion (vitest-bar). */
  function divNoRemAnswer(n, d) {
    const s = digitsOf(n).reverse().map(x => Math.floor(x / d)).join('');
    const v = parseInt(s, 10);
    return Number.isNaN(v) ? 0 : v;
  }

  function generateProblem() {
    if (gameKind === 'div') {
      const p = genDivProblem(difficulty);
      numA = p.a; numB = p.b;
      plan = buildDivPlan(numA, numB, difficulty);
    } else {
      const p = genProblem(difficulty);
      numA = p.a; numB = p.b;
      plan = buildPlan(numA, numB, difficulty);
    }
  }

  /* ══════════════════════════════════════════════════════════
     STEG-BYGGARE (demo) — bubbla FÖRE animation (v28-mönstret)
  ══════════════════════════════════════════════════════════ */
  /* finalPass (v31): sista minnessiffran i uppgiften — den som används i
     uppgiftens SISTA beräkningssteg — stryks inte (inget kommande minne
     att förväxla med). Gäller bara uppgiftens sista pass sista kolumn. */
  function passStepsInto(steps, pass, rowKey, shift, finalPass) {
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
      /* v30: minnets livscykel som EGNA steg — stryk det använda
         minnet först, placera sedan det nya i spalten.
         v31: uppgiftens SISTA minne (finalPass + sista kolumnen) stryks ej. */
      if (c.carryIn > 0 && !(finalPass && c.last))
        steps.push({ t: 'mem_strike', phase: 'mult', val: c.carryIn, g, rowKey });
      if (!c.last && c.carryOut > 0) steps.push({ t: 'mem_place', phase: 'mult', carryOut: c.carryOut, g, rowKey });
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
      // v31: additionsfasen är uppgiftens sista pass — sista kolumnens minne stryks ej
      if (c.carryIn > 0 && !c.last)
        steps.push({ t: 'mem_strike', phase: 'add', val: c.carryIn, g: c.col, rowKey: 'ans' });
      if (!c.last && c.carryOut > 0) steps.push({ t: 'mem_place', phase: 'add', carryOut: c.carryOut, g: c.col, rowKey: 'ans' });
    }
  }

  /* Divisionens demo-steg (v32): per siffra — highlight → fråga
     ("Hur många hela 4:or ryms i 9?") → skriv kvotsiffran → ev. rest-
     steg (mellanresten ritas som mem-digit framför nästa siffra).
     Jämn fortsättning (remIn>0, rem=0) får spec-bubblan "precis jämnt!"
     som ETT steg. Leading-specialfallet: informationssteg utan skrivning. */
  function buildDivDemoSteps() {
    const steps = [];
    for (const s of plan.pass.steps) {
      steps.push({ t: 'dhl', ...s });
      if (s.skip) { steps.push({ t: 'dskip', ...s }); continue; }
      if (s.remIn > 0 && s.rem === 0) {
        steps.push({ t: 'dwrite', ...s });          // "16 ÷ 4 = 4, precis jämnt! ✅"
      } else {
        steps.push({ t: 'dask', ...s });            // "Hur många hela 4:or ryms i 9?"
        steps.push({ t: 'dwrite', ...s });          // "2 stycken! För 2 · 4 = 8"
      }
      if (s.rem > 0 && !s.last) steps.push({ t: 'drem', ...s });
    }
    steps.push({ t: 'done' });
    return steps;
  }

  function buildDemoSteps() {
    if (plan.kind === 'division') return buildDivDemoSteps();
    const steps = [];
    if (plan.kind === 'simple') {
      passStepsInto(steps, plan.pass, 'ans', 0, true);
    } else {
      // v31: delprodukternas minnen är ALDRIG uppgiftens sista (p2 + addition följer)
      steps.push({ t: 'phase', which: 1 });
      passStepsInto(steps, plan.p1, 'p1', 0, false);
      steps.push({ t: 'phase', which: 2 });
      passStepsInto(steps, plan.p2, 'p2', 1, false);
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
        return `Vi skriver <strong style="color:${cv(step.g)}">${step.write}</strong>:an — <strong style="color:#dc2626">${step.carryOut}</strong>:an blir minnessiffra! ➡️`;
      case 'write_simple': return calcText(step);
      case 'write_full':
        return `<strong style="color:${cv(step.g)}">${val}</strong> — sista kolumnen, så hela ${val} får plats! ✅`;
      case 'mem_place':
        return `<strong style="color:#dc2626">${step.carryOut}</strong>:an skrivs som minnessiffra här 👇`;
      case 'mem_strike':
        return `Nu stryker vi <strong style="color:#dc2626">${step.val}</strong>:an — den är använd! Så vet vi att den inte räknas igen. ✏️`;
      /* Kort division (v32) — spec-språket */
      case 'dhl': return '';
      case 'dask':
        return `Hur många hela <strong>${numB}</strong>:or ryms i <strong style="color:${cv(step.g)}">${step.cur}</strong>? 🤔`;
      case 'dskip':
        return `${numB}:or i ${step.cur}? Det går inte — vi tar med nästa siffra: <strong>${step.cur * 10 + step.next}</strong>!`;
      case 'dwrite':
        if (step.q === 0)
          return `Ingen hel ${numB}:a ryms i ${step.cur} — vi skriver <strong style="color:${cv(step.g)}">0</strong> i kvoten! ⭕`;
        if (step.remIn > 0 && step.rem === 0)
          return `<strong>${step.cur} ÷ ${numB} = ${step.q}</strong>, precis jämnt! ✅`;
        return `<strong style="color:${cv(step.g)}">${step.q}</strong> ${step.q === 1 ? 'styck' : 'stycken'}! För ${step.q} · ${numB} = ${step.q * numB}`;
      case 'drem':
        return step.q > 0
          ? `${step.cur} − ${step.q * numB} = <strong style="color:#dc2626">${step.rem}</strong> blir över — ${step.rem}:an ställer sig framför ${step.next}:an: nu har vi <strong>${step.rem * 10 + step.next}</strong>!`
          : `Hela <strong style="color:#dc2626">${step.rem}</strong>:an blir över — den ställer sig framför ${step.next}:an: nu har vi <strong>${step.rem * 10 + step.next}</strong>!`;
      case 'done':
        return plan.kind === 'division'
          ? `Klart! 🎉 ${numA} ÷ ${numB} = <strong>${plan.answer}</strong> — kolla: ${plan.answer} · ${numB} = ${numA}!`
          : `Klart! 🎉 ${numA} · ${numB} = <strong>${plan.answer}</strong>`;
    }
    return '';
  }

  /* ══════════════════════════════════════════════════════════
     DEMO-LÄGE
  ══════════════════════════════════════════════════════════ */
  const modeTitle = () => gameKind === 'div' ? 'Kort division' : 'Multiplikation';

  function startDemo() {
    App.Sound.play('click');
    generateProblem();
    demoStep = 0; stepLocked = false;
    mdCarries = [0,0,0,0]; mdCarryUsed = [false,false,false,false];
    mdMemList = []; memAwait = null; memPickerOpen = false; memColMode = 'demo';
    demoSteps = buildDemoSteps();
    renderDemoView();
  }

  function renderDemoView() {
    const root = document.getElementById('multdiv-root');
    root.innerHTML = `
      <style id="md-base">${BASE_CSS}</style>
      <div class="app-header">
        <button class="btn-back" onclick="MultDivGame.showModeSelect()">Avsluta</button>
        <span class="header-title">${modeTitle()} – Demo</span>
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
    renderMemCol();
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
      App.Sound.play('correct');
      setTimeout(cb, 800);

    } else if (step.t === 'mem_place') {
      // Eget steg (v30): siffran flyger till minnesspalten och landar där
      mdMemList.push({ val: step.carryOut, used: false });
      renderMemCol();
      const col = document.getElementById('md-memcol');
      const dst = col ? col.querySelectorAll('.mem-digit')[mdMemList.length - 1] : null;
      const src = document.getElementById(`md-${step.rowKey}-${step.g}`);
      mdCarries[step.g + 1] = step.carryOut;
      if (dst && src) {
        dst.style.opacity = '0';
        animateTokenTo(src, dst, step.carryOut, () => {
          dst.style.opacity = '';
          dst.classList.add('landing');
          setTimeout(cb, 400);
        });
      } else setTimeout(cb, 300);

    } else if (step.t === 'mem_strike') {
      // Eget steg (v30): penndraget ritas — minnet står kvar, struket
      const i = mdMemList.findIndex(e => !e.used);
      if (i >= 0) { mdMemList[i].used = true; renderMemCol({ strikeIdx: i }); }
      App.Sound.play('click');
      setTimeout(cb, 900);

    } else if (step.t === 'write_full') {
      consumeCarry(step);
      writeDigit(step.rowKey, step.g, step.write);
      setTimeout(() => {
        if (step.extra !== null) writeDigit(step.rowKey, step.g + 1, step.extra);
        App.Sound.play('correct');
        setTimeout(cb, 800);
      }, 300);

    /* ── Kort division (v32) ── */
    } else if (step.t === 'dhl') {
      divHighlight(step);
      setTimeout(cb, 50);

    } else if (step.t === 'dask') {
      // Pulsera divisorn + aktuell täljarsiffra medan frågan läses
      const els = [document.getElementById('md-d-0'), document.getElementById(`md-n-${step.g}`)].filter(Boolean);
      els.forEach(el => el.classList.add('md-prob'));
      setTimeout(() => { els.forEach(el => el.classList.remove('md-prob')); cb(); }, 1000);

    } else if (step.t === 'dskip') {
      // "Det går inte — vi tar med nästa siffra": pulsera båda siffrorna
      const els = [document.getElementById(`md-n-${step.g}`), document.getElementById(`md-n-${step.g - 1}`)].filter(Boolean);
      els.forEach(el => el.classList.add('md-prob'));
      setTimeout(() => { els.forEach(el => el.classList.remove('md-prob')); cb(); }, 1200);

    } else if (step.t === 'dwrite') {
      writeDigit('q', step.g, step.q);
      App.Sound.play('correct');
      setTimeout(cb, 800);

    } else if (step.t === 'drem') {
      // Mellanresten ritas som liten röd mem-digit framför NÄSTA siffra
      divWriteRem(step.g - 1, step.rem);
      playCarrySound();
      setTimeout(cb, 900);

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

  /* Divisionens highlight: lys upp siffran/siffrorna som bildar cur.
     fromSkip ⇒ även föregående siffra (33 läses ihop); skip ⇒ även
     nästa ("vi tar med nästa siffra"). Divisorn dimmas aldrig. */
  function divHighlight(s) {
    document.querySelectorAll('#md-table-wrap .md-cell, #md-table-wrap .md-ansc')
      .forEach(el => { el.classList.remove('md-glow', 'dim'); el.style.removeProperty('--gc'); });
    const glowColor = hex => {
      const r = parseInt(hex.slice(1,3),16), g2 = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
      return `rgba(${r},${g2},${b},0.65)`;
    };
    const L = digitsOf(numA).length;
    const hot = new Set([s.g]);
    if (s.skip) hot.add(s.g - 1);
    if (s.fromSkip) hot.add(s.g + 1);
    for (let g = L - 1; g >= 0; g--) {
      const el = document.getElementById(`md-n-${g}`);
      if (!el) continue;
      if (hot.has(g)) { el.classList.add('md-glow'); el.style.setProperty('--gc', glowColor(cv(s.g))); }
      else el.classList.add('dim');
    }
  }

  /* Mellanresten skrivs (pennstil, −4°, röd) uppe till vänster om
     täljarsiffran i grid-kolumn g. Stryks ALDRIG — uppgår i nästa tal. */
  function divWriteRem(g, val) {
    const cell = document.getElementById(`md-n-${g}`);
    if (!cell) return;
    let sp = cell.querySelector('.md-divrem');
    if (!sp) {
      sp = document.createElement('span');
      sp.className = 'mem-digit md-divrem';
      cell.appendChild(sp);
    }
    sp.textContent = String(val);
    sp.classList.add('on', 'landing');
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
    // Matte-bokföring oförändrad (v30): strykningen är numera ett EGET
    // steg/en egen fas — här markeras bara att minnet är förbrukat.
    if (step.carryIn > 0) mdCarryUsed[step.g] = true;
  }

  function clearCarryRow() {
    // Nollställer bara den interna carry-bokföringen mellan faserna.
    // Minnesspalten (mdMemList) RÖRS ALDRIG under uppgiften.
    mdCarries = [0,0,0,0]; mdCarryUsed = [false,false,false,false];
  }

  /* ── Minnesspalten (v30): rendering + interaktion ────────── */
  const memStrikeSVG = draw =>
    `<svg class="mem-strike${draw ? ' draw' : ''}" viewBox="0 0 20 20" aria-hidden="true">
       <path pathLength="30" d="M2.5 17.5 C 6 13.5, 7.5 12, 10 9 S 15.5 4.5, 17.5 2.5"/></svg>`;

  function renderMemCol(opts = {}) {
    const col = document.getElementById('md-memcol');
    if (!col) return;
    const tap = memColMode !== 'demo';
    let html = mdMemList.map((e, i) => {
      let cls = 'mem-digit';
      if (e.used) cls += ' used';
      if (memAwait && memAwait.type === 'strike' && memAwait.idx === i) cls += ' mem-pulse';
      if (opts.landIdx === i) cls += ' landing';
      const on = tap ? ` onclick="event.stopPropagation();MultDivGame.memTap(${i})"` : '';
      return `<span class="${cls}"${on}>${e.val}${e.used ? memStrikeSVG(opts.strikeIdx === i) : ''}</span>`;
    }).join('');
    if (memColMode === 'help' && memAwait && memAwait.type === 'place')
      html += `<span class="mem-slot mem-pulse" id="md-memslot"
        onclick="event.stopPropagation();MultDivGame.memTapSlot()"></span>`;
    if (memColMode === 'free')
      html += `<span class="mem-slot" title="Minnessiffra"
        onclick="event.stopPropagation();MultDivGame.memTapSlot()"></span>`;
    col.innerHTML = html;
  }

  function animateTokenTo(srcCell, dstEl, val, cb) {
    const wrap = document.getElementById('md-table-wrap');
    if (!wrap || !srcCell || !dstEl) { setTimeout(cb, 300); return; }
    const wRect = wrap.getBoundingClientRect();
    const sRect = srcCell.getBoundingClientRect();
    const dRect = dstEl.getBoundingClientRect();
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
  /* Kort division (v32): divisor | lodrät avskiljare | täljarsiffror.
     KVOTEN skrivs siffra för siffra OVANFÖR täljaren (md-q-cellerna,
     ghost över leading-skip-positionen). Fritt läge: kvotraden ersätts
     av miniräknar-fältet. g = platsvärde från höger (färg/id som mult). */
  function buildDivTableHTML(freeMode) {
    const nd = digitsOf(numA).reverse(); // vänster→höger
    const L = nd.length;
    const gs = []; for (let i = 0; i < L; i++) gs.push(L - 1 - i);
    const skipG = plan.pass.steps.length && plan.pass.steps[0].skip ? plan.pass.steps[0].g : null;

    const labelRow = `<tr><td></td><td></td>${gs.map(g =>
      `<th style="text-align:center;font-size:clamp(0.8rem,1.6vw,1.15rem);font-weight:900;color:${cv(g)};padding-bottom:2px">${LBL[g]}</th>`).join('')}</tr>`;

    const qRow = freeMode
      ? `<tr><td colspan="${L + 2}">
           <div class="md-field num" id="md-free-field"><span class="md-caret"></span></div></td></tr>`
      : `<tr><td></td><td></td>${gs.map(g =>
          `<td><div class="md-ansc${g === skipG ? ' md-ghost' : ''}" id="md-q-${g}"></div></td>`).join('')}</tr>`;

    const nRow = `<tr>
      <td><div class="md-cell" id="md-d-0" style="border-color:#64748b">
        <span style="color:#475569">${numB}</span></div></td>
      <td style="padding:0 2px"><div class="md-divbar"></div></td>
      ${gs.map((g, i) =>
        `<td><div class="md-cell" id="md-n-${g}" style="border-color:${cv(g)}">
           <span style="color:${cv(g)}">${nd[i]}</span></div></td>`).join('')}</tr>`;

    return `
      <table class="md-table">
        <tbody>
          ${labelRow}
          ${qRow}
          ${nRow}
        </tbody>
      </table>`;
  }

  function buildTableHTML(freeMode) {
    if (plan.kind === 'division') return buildDivTableHTML(freeMode);
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

    const rowA = `<tr><td></td>${idx.map(i =>
      solidCell('a', i, i < aD.length ? aD[i] : null)).join('')}<td></td></tr>`;

    /* v30: minnesspalten till HÖGER om faktorraden (per Dennis foto) —
       ersätter den gamla minne-raden ovanför kolumnerna. */
    const rowB = `<tr>
      <td style="font-size:1.8rem;font-weight:900;color:#555;text-align:right;padding-right:6px">·</td>
      ${idx.map(i => solidCell('b', i, i < bD.length ? bD[i] : null)).join('')}
      <td class="md-memtd"><div class="md-memcol" id="md-memcol"></div></td></tr>`;

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
    /* v32: chipsen gäller BÅDA spelen (väljs innan kortet) — beskriv-
       ningarna täcker mult (minne) och division (rest) per spec-tabellen. */
    const levels = [
      { n: 1, emoji: '🌱', desc: 'Utan minne · utan rest' },
      { n: 2, emoji: '🌿', desc: 'Med minne · med rest' },
      { n: 3, emoji: '🌾', desc: 'Tresiffrigt tal' },
      { n: 4, emoji: '🌳', desc: 'Klurigaste nivån' },
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
          <div class="md-card" onclick="MultDivGame.chooseDiv()">
            <span class="md-aico">➗</span>
            <span><b>Kort division</b><small>Divisorn till vänster – kvoten skrivs ovanpå</small></span>
            <svg class="icn chev" viewBox="0 0 24 24"><use href="#i-chevron"/></svg>
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
    gameKind = 'mult';
    App.Sound.play('click');
    showModeSelect();
  }

  function chooseDiv() {
    gameKind = 'div';
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
        <span class="header-title">${gameKind === 'div' ? 'Kort division ➗' : 'Multiplikation ✖️'}</span>
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
    memMoments = 0; memMistakes = 0; // Minnesmästare ⭐ räknas per pass
    lifelines = 2; // v31: livlinorna nollställs per övningsrunda (5 uppgifter)
    showHelpSelect();
  }

  function showHelpSelect() {
    const root = document.getElementById('multdiv-root');
    root.innerHTML = `
      <style id="md-base">${BASE_CSS}</style>
      <div class="floaties"><span style="top:7%;right:8%">✨</span><span style="bottom:12%;left:6%;animation-delay:2s">🐬</span></div>
      <div class="app-header">
        <button class="btn-back" onclick="MultDivGame.showModeSelect()">Tillbaka</button>
        <span class="header-title">${modeTitle()} – Övning</span>
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
    mdMemList = []; memAwait = null; memPickerOpen = false; // nytt papper
    divAwait = null;
    memColMode = helpMode ? 'help' : 'free';
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
        <span class="header-title">${modeTitle()} – Övning</span>
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
    renderMemCol();
    // Fel-tap-guard för PLACERA/STRYK-faserna (property ⇒ ingen stackning)
    const wrapEl = document.getElementById('md-table-wrap');
    if (wrapEl) wrapEl.onclick = helpMode ? (gameKind === 'div' ? divWrapTap : memWrapTap) : null;
    if (helpMode) advanceHelp(0);
    else showFreeUI();
  }

  /* ══════════════════════════════════════════════════════════
     MED HJÄLP — guidefrågor + framåtblickande knappar
     (exTenStep-mönstret: barnet trycker för varje delsteg)
  ══════════════════════════════════════════════════════════ */
  /* Divisionens frågekedja (v32), per siffra:
     (a) 'divq'  — "Hur många hela 4:or ryms i 9?" → kvotsiffran skrivs;
     (b) 'divrem' — OM rest: "Blir något över? 9 − 8 = ?" (skippas när
         kvotsiffran är 0 — hela talet blir över, ingen subtraktion);
     (c) 'divplace' — PLACERA-fasen: barnet tappar platsen framför
         nästa täljarsiffra → ¹ skrivs (mem-digit-mönstret, INGEN strykfas).
     Leading-specialfallet: informationssteg med framåtblickande knapp. */
  function buildDivHelpQueue() {
    const q = [];
    for (const s of plan.pass.steps) {
      if (s.skip) { q.push({ kind: 'dskip', rowKey: 'q', ...s }); continue; }
      q.push({ kind: 'divq', rowKey: 'q', ...s });
      if (s.rem > 0 && !s.last) {
        if (s.q > 0) q.push({ kind: 'divrem', rowKey: 'q', ...s });
        q.push({ kind: 'divplace', rowKey: 'q', ...s });
      }
    }
    return q;
  }

  function buildHelpQueue() {
    if (plan.kind === 'division') return buildDivHelpQueue();
    const q = [];
    /* v30: efter varje kolumn skjuts minnets livscykel in som egna
       faser — STRYK det använda minnet, PLACERA det nya.
       v31: uppgiftens SISTA minne (finalPass + sista kolumnen) har inget
       strykkrav — inget kommande minne att förväxla med. Momentet räknas
       då inte heller i Minnesmästare (showMemPhase körs aldrig). */
    const memQ = (c, g, finalPass) => {
      if (c.carryIn > 0 && !(finalPass && c.last)) q.push({ kind: 'memstrike', val: c.carryIn });
      if (!c.last && c.carryOut > 0) q.push({ kind: 'memplace', val: c.carryOut, srcG: g });
    };
    /* v31: TVÅSTEGSFRÅGAN — kolumn med minne delas i (a) ren tabell-
       fråga (step:'table') och (b) minnespåminnelsen som EGEN fråga
       (step:'mem'). Utan minne: bara en fråga som förut. */
    const passQ = (pass, rowKey, shift, finalPass) => {
      for (const c of pass.cols) {
        const g = c.col + shift;
        if (c.carryIn > 0) {
          q.push({ kind: 'mult', ...c, g, rowKey, mCol: shift, step: 'table' });
          q.push({ kind: 'mult', ...c, g, rowKey, mCol: shift, step: 'mem' });
        } else {
          q.push({ kind: 'mult', ...c, g, rowKey, mCol: shift });
        }
        memQ(c, g, finalPass);
      }
    };
    if (plan.kind === 'simple') {
      passQ(plan.pass, 'ans', 0, true);
    } else {
      // v31: delprodukternas minnen är ALDRIG uppgiftens sista (p2 + addition följer)
      q.push({ kind: 'phase', which: 1 });
      passQ(plan.p1, 'p1', 0, false);
      q.push({ kind: 'phase', which: 2 });
      passQ(plan.p2, 'p2', 1, false);
      q.push({ kind: 'phase', which: 3 });
      for (const c of plan.add.cols) {
        const single = (c.x === null || c.y === null) && c.carryIn === 0;
        const bothNull = c.x === null && c.y === null;
        if (single) {
          q.push({ kind: 'trivial', ...c, g: c.col, rowKey: 'ans' });
        } else if (c.carryIn > 0 && !bothNull) {
          // v31: tabellfrågan bara när det finns TVÅ siffror att addera —
          // ensam siffra + minne går direkt till minnespåminnelsen
          if (c.x !== null && c.y !== null)
            q.push({ kind: 'add', ...c, g: c.col, rowKey: 'ans', step: 'table' });
          q.push({ kind: 'add', ...c, g: c.col, rowKey: 'ans', step: 'mem' });
        } else {
          q.push({ kind: 'add', ...c, g: c.col, rowKey: 'ans' });
        }
        // additionsfasen är uppgiftens sista pass ⇒ sista minnet utan strykkrav
        memQ(c, c.col, true);
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
    memAwait = null;
    divAwait = null;
    document.querySelectorAll('.md-divslot').forEach(el => el.remove());
    const fb = document.getElementById('md-feedback');
    if (fb) fb.innerHTML = '';
    const item = helpItem();
    if (!item) { helpTaskDone(); return; }
    if (item.kind === 'memplace' || item.kind === 'memstrike') { showMemPhase(item); return; }
    if (item.kind === 'divplace') { showDivPlace(item); return; }
    if (item.kind === 'mult') doHighlight({ phase: 'mult', aCol: item.col, mCol: item.mCol, g: item.g });
    else if (item.kind === 'add' || item.kind === 'trivial') doHighlight({ phase: 'add', g: item.g });
    else if (item.kind === 'divq' || item.kind === 'divrem' || item.kind === 'dskip') divHighlight(item);
    // Markera målcellen
    document.querySelectorAll('#md-table-wrap .md-ansc').forEach(el => el.classList.remove('active-col'));
    if (item.kind !== 'phase') {
      const cell = document.getElementById(`md-${item.rowKey}-${item.g}`);
      if (cell && !cell.classList.contains('filled')) cell.classList.add('active-col');
    }
    renderMemCol();
    showHelpUI();
  }

  /* ── PLACERA/STRYK-faserna (v30) — barnet utför minnets livscykel ── */
  function showMemPhase(item) {
    memMoments++;
    document.querySelectorAll('#md-table-wrap .md-ansc').forEach(el => el.classList.remove('active-col'));
    const ui = document.getElementById('md-ui');
    if (ui) ui.innerHTML = '';
    if (item.kind === 'memplace') {
      memAwait = { type: 'place', val: item.val, srcG: item.srcG };
      renderMemCol(); // nästa slot pulserar
      helpBubble(`Var ska minnessiffran <strong style="color:#dc2626">${item.val}</strong>? Tryck där den ska stå! 👉`);
    } else {
      const idx = mdMemList.findIndex(e => !e.used);
      if (idx < 0) { advanceHelp(helpIdx + 1); return; } // säkerhetsnät
      memAwait = { type: 'strike', val: item.val, idx };
      renderMemCol(); // siffran pulserar
      helpBubble(`Stryk minnessiffran <strong style="color:#dc2626">${item.val}</strong> — den är använd! ✏️`);
    }
  }

  function memGuide() {
    if (!memAwait) return;
    memMistakes++;
    const fb = document.getElementById('md-feedback');
    const msg = memAwait.type === 'place'
      ? 'Nästan — den ska stå här 👉'
      : `Titta — ${memAwait.val}:an är inte struken än 👀`;
    if (fb) fb.innerHTML = `<div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);
      border:2px solid #f59e0b;border-radius:12px;padding:5px 10px;font-weight:800;
      font-size:0.92rem;color:#92400e;text-align:center">${msg}</div>`;
  }

  function memWrapTap(ev) {
    if (!memAwait || exInputLocked) return;
    if (ev.target && ev.target.closest && ev.target.closest('#md-memcol')) return;
    memGuide();
  }

  /* ── Divisionens PLACERA-fas (v32): "Var ska resten stå?" ──
     Barnet TAPPAR platsen framför nästa täljarsiffra → mellanresten
     skrivs som mem-digit. INGEN strykfas (rester uppgår i nästa tal). */
  function showDivPlace(item) {
    document.querySelectorAll('#md-table-wrap .md-ansc').forEach(el => el.classList.remove('active-col'));
    const ui = document.getElementById('md-ui');
    if (ui) ui.innerHTML = '';
    divAwait = { g: item.g - 1, val: item.rem, next: item.next };
    renderDivSlot();
    helpBubble(`Var ska resten <strong style="color:#dc2626">${item.rem}</strong> stå? Tryck där! 👉`);
  }

  function renderDivSlot() {
    document.querySelectorAll('.md-divslot').forEach(el => el.remove());
    if (!divAwait) return;
    const cell = document.getElementById(`md-n-${divAwait.g}`);
    if (!cell) return;
    const s = document.createElement('span');
    s.className = 'mem-slot mem-pulse md-divslot';
    s.onclick = ev => { ev.stopPropagation(); MultDivGame.divTapSlot(); };
    cell.appendChild(s);
  }

  function divTapSlot() {
    if (!divAwait || exInputLocked) return;
    exInputLocked = true;
    const { g, val, next } = divAwait;
    divAwait = null;
    document.querySelectorAll('.md-divslot').forEach(el => el.remove());
    divWriteRem(g, val);
    playCarrySound();
    helpBubble(`Precis där! 🎯 Nu har vi <strong>${val * 10 + next}</strong>!`);
    const gen = exGen;
    setTimeout(() => { if (gen === exGen) advanceHelp(helpIdx + 1); }, 800);
  }

  function divWrapTap(ev) {
    if (!divAwait || exInputLocked) return;
    if (ev.target && ev.target.closest && ev.target.closest('.md-divslot')) return;
    // Fel tap → mild vägledning, aldrig poängstraff (barn-UX-lagen)
    const fb = document.getElementById('md-feedback');
    if (fb) fb.innerHTML = `<div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);
      border:2px solid #f59e0b;border-radius:12px;padding:5px 10px;font-weight:800;
      font-size:0.92rem;color:#92400e;text-align:center">Nästan — resten ska stå här 👉</div>`;
  }

  function memTapSlot() {
    if (memColMode === 'help') {
      if (!memAwait || memAwait.type !== 'place' || exInputLocked) return;
      exInputLocked = true;
      const val = memAwait.val, srcG = memAwait.srcG;
      memAwait = null;
      mdMemList.push({ val, used: false });
      mdCarries[srcG + 1] = val;
      renderMemCol({ landIdx: mdMemList.length - 1 });
      playCarrySound();
      helpBubble('Precis där! 🎯');
      const gen = exGen;
      setTimeout(() => { if (gen === exGen) advanceHelp(helpIdx + 1); }, 700);
    } else if (memColMode === 'free') {
      if (exInputLocked) return;
      memPickerOpen = !memPickerOpen;
      renderMemPicker();
      App.Sound.play('click');
    }
  }

  function memTap(i) {
    if (memColMode === 'demo') return;
    if (memColMode === 'help') {
      if (!memAwait || exInputLocked) return;
      if (memAwait.type === 'strike' && i === memAwait.idx) {
        exInputLocked = true;
        memAwait = null;
        mdMemList[i].used = true;
        renderMemCol({ strikeIdx: i }); // animerat penndrag
        App.Sound.play('correct');
        helpBubble('Struken! ✏️ Nu vet vi att den inte räknas igen.');
        const gen = exGen;
        setTimeout(() => { if (gen === exGen) advanceHelp(helpIdx + 1); }, 800);
      } else {
        memGuide(); // fel siffra / fel läge — mild vägledning
      }
      return;
    }
    // Fria läget: frivillig livscykel — påverkar aldrig rättningen
    if (exInputLocked) return;
    const e = mdMemList[i];
    if (!e) return;
    memPickerOpen = false;
    renderMemPicker();
    if (!e.used) { e.used = true; renderMemCol({ strikeIdx: i }); }
    else { mdMemList.splice(i, 1); renderMemCol(); }
    App.Sound.play('click');
  }

  function renderMemPicker() {
    const area = document.getElementById('md-bubble');
    if (!area) return;
    if (!memPickerOpen) { area.innerHTML = ''; return; }
    area.innerHTML = `<div class="md-thought" style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
      <span style="font-size:0.85rem">Minnessiffra:</span>
      ${[1,2,3,4,5,6,7,8,9].map(d => `<button class="md-nk" style="width:34px;height:34px;font-size:0.9rem"
        onclick="MultDivGame.memPick(${d})">${d}</button>`).join('')}
      <button class="md-nk" style="width:34px;height:34px;font-size:0.9rem"
        onclick="MultDivGame.memTapSlot()">✕</button>
    </div>`;
  }

  function memPick(d) {
    memPickerOpen = false;
    renderMemPicker();
    mdMemList.push({ val: d, used: false });
    renderMemCol({ landIdx: mdMemList.length - 1 });
    App.Sound.play('click');
  }

  function helpBubble(html) {
    const area = document.getElementById('md-bubble');
    if (area) area.innerHTML = html ? `<div class="md-thought">${html}</div>` : '';
  }

  /* v31: basvärdet för minnespåminnelsen = kolumnsvaret UTAN minne */
  function helpBase(item) {
    return item.kind === 'mult' ? item.aDig * item.m : (item.x || 0) + (item.y || 0);
  }

  /* v31: förväntat svar per delfråga — tabellsteget svarar utan minne */
  function helpExpected(item) {
    if (item.kind === 'divq') return item.q;       // kvotsiffran (kan vara 0)
    if (item.kind === 'divrem') return item.rem;   // mellanresten
    if (item.step === 'table') return helpBase(item);
    return item.kind === 'mult' ? item.prod : item.sum;
  }

  /* v31: uttrycket för aktuell delfråga (livlinans "4 · 7 = 28") */
  function helpExprHTML(item) {
    const C = cv(item.g);
    if (item.kind === 'divq')
      return `<strong style="color:${C}">${item.cur}</strong> ÷ <strong>${numB}</strong>`;
    if (item.kind === 'divrem')
      return `<strong>${item.cur}</strong> − <strong>${item.q * numB}</strong>`;
    if (item.step === 'mem')
      return `<strong>${helpBase(item)}</strong> + <strong style="color:#d97706">${item.carryIn}</strong>`;
    if (item.kind === 'mult')
      return `<strong style="color:${C}">${item.aDig}</strong> · <strong style="color:${C}">${item.m}</strong>`;
    if (item.x === null || item.y === null) return ''; // bara-minnet-kolumnen (91·12) — inget uttryck
    return `<strong style="color:${C}">${item.x}</strong> + <strong style="color:${C}">${item.y}</strong>`;
  }

  function askText(item) {
    const C = cv(item.g);
    /* v32: divisionens frågor — facit sägs ALDRIG i frågan */
    if (item.kind === 'divq')
      return `Hur många hela <strong>${numB}</strong>:or ryms i <strong style="color:${C}">${item.cur}</strong>? 🤔`;
    if (item.kind === 'divrem')
      return `Blir något över? <strong>${item.cur}</strong> − <strong>${item.q * numB}</strong> = ?`;
    /* v31: minnespåminnelsen som EGEN fråga (tvåstegsfrågan) */
    if (item.step === 'mem') {
      return `Har vi någon minnessiffra som ska med? 👀 Just det — <strong style="color:#d97706">${item.carryIn}</strong>:an! `
           + `Vad blir <strong>${helpBase(item)}</strong> + <strong style="color:#d97706">${item.carryIn}</strong>?`;
    }
    if (item.kind === 'mult') {
      // v31: ren tabellfråga — minnet kommer som egen fråga efteråt
      return `Vad är <strong style="color:${C}">${item.aDig}</strong> · <strong style="color:${C}">${item.m}</strong>?`;
    }
    const x = item.x, y = item.y;
    if (x === null && y === null) {
      // Kolumn utan siffror — bara minnessiffran (t.ex. 91·12, 33·33)
      return `Bara minnessiffran kvar! Vad är <strong style="color:#d97706">${item.carryIn}</strong>?`;
    }
    if (x === null || y === null) {
      const d = x === null ? y : x;
      return `Vad är <strong style="color:${C}">${d}</strong>?`;
    }
    return `Vad är <strong style="color:${C}">${x}</strong> + <strong style="color:${C}">${y}</strong>?`;
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

    /* v32: leading-specialfallet — informationssteg med framåtblickande knapp */
    if (item.kind === 'dskip') {
      helpBubble(`${numB}:or i ${item.cur}? Det går inte — vi tar med nästa siffra: <strong>${item.cur * 10 + item.next}</strong>!`);
      ui.innerHTML = `<button class="btn btn-primary btn-block" id="md-action-btn"
        onclick="MultDivGame.helpAction()">Vi tar med nästa siffra! →</button>`;
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
      <div style="display:flex;gap:6px;margin-top:8px">
        <button class="md-btn" onclick="MultDivGame.helpErase()"
          style="width:52px;flex-shrink:0;height:44px;background:var(--tint);color:var(--deep);border:2px solid color-mix(in srgb, var(--accent) 30%, transparent);font-size:1.2rem;border-radius:var(--radius-full)">⌫</button>
        ${lifelineBtnHTML()}
        <button class="md-btn" id="md-help-submit" onclick="MultDivGame.helpSubmit()" disabled
          style="flex:1.1;min-width:0;height:44px;background:linear-gradient(135deg,#cbd5e1,#94a3b8);color:#fff;font-size:0.95rem;border-radius:var(--radius-full)">Skriv svaret…</button>
      </div>
    </div>`;
    helpRenderField();
  }

  /* ── LIVLINOR (v31) — 2/runda; visar svaret, barnet skriver själv ── */
  function lifelineBtnHTML() {
    const on = lifelines > 0;
    /* Samma knapprad som ⌫/Klar ⇒ ingen extra höjd (390×664-budgeten),
       ändå ≥44px hög tap-yta. Grå + disabled när 0 kvar. */
    return `<button class="md-btn" id="md-lifeline" onclick="MultDivGame.useLifeline()"
      ${on ? '' : 'disabled'}
      style="flex:1;min-width:0;height:44px;padding:0 4px;white-space:nowrap;
      color:#fff;font-size:0.8rem;border-radius:var(--radius-full);
      background:${on ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : 'linear-gradient(135deg,#cbd5e1,#94a3b8)'}">🛟 Livlina (${lifelines} kvar)</button>`;
  }

  function useLifeline() {
    if (exInputLocked || lifelines <= 0) return;
    const item = helpItem();
    // v32: samma livline-pool gäller även divisionens frågor
    if (!item || !['mult', 'add', 'divq', 'divrem'].includes(item.kind)) return;
    lifelines--;
    App.Sound.play('click');
    const btn = document.getElementById('md-lifeline');
    if (btn) btn.outerHTML = lifelineBtnHTML();
    /* Svaret VISAS i bubblan — ingen auto-fyllning: numpaden är kvar
       och barnet måste själv skriva rätt svar för att gå vidare.
       Ingen poängpåverkan, ingen effekt på Minnesmästare. */
    const expected = helpExpected(item);
    if (item.kind === 'divq') {
      // Undvik falsk likhet ("9 ÷ 4 = 2" är fel matte) — säg det som det är
      helpBubble(`Det ryms <strong>${expected}</strong> ${expected === 1 ? `hel ${numB}:a` : `hela ${numB}:or`} i ${item.cur} — skriv in det själv! ✍️`);
      return;
    }
    const expr = helpExprHTML(item);
    helpBubble(`${expr ? `${expr} = ` : 'Svaret är '}<strong>${expected}</strong> — skriv in det själv! ✍️`);
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
    if (!item || !['mult', 'add', 'divq', 'divrem'].includes(item.kind)) return;
    const expected = helpExpected(item); // v31: per delfråga (tabell/minne)

    if (parseInt(helpInput, 10) === expected) {
      exInputLocked = true;
      App.Sound.play('correct');
      const gen = exGen;
      if (item.kind === 'divq') {
        // Kvotsiffran skrivs OVANFÖR täljaren — sedan ev. rest-frågan
        writeDigit('q', item.g, item.q);
        const txt = item.q === 0
          ? `Rätt! Ingen hel ${numB}:a ryms i ${item.cur} — <strong style="color:${cv(item.g)}">0</strong> i kvoten! ⭕`
          : (item.remIn > 0 && item.rem === 0)
            ? `Rätt! <strong>${item.cur} ÷ ${numB} = ${item.q}</strong>, precis jämnt! ✅`
            : `Rätt! <strong style="color:${cv(item.g)}">${item.q}</strong> ${item.q === 1 ? 'styck' : 'stycken'} — för ${item.q} · ${numB} = ${item.q * numB} ✅`;
        helpBubble(txt);
        smallBurst();
        setTimeout(() => { if (gen === exGen) advanceHelp(helpIdx + 1); }, 900);
        return;
      }
      if (item.kind === 'divrem') {
        helpBubble(`Rätt! <strong style="color:#dc2626">${item.rem}</strong> blir över ✅`);
        smallBurst();
        setTimeout(() => { if (gen === exGen) advanceHelp(helpIdx + 1); }, 700);
        return;
      }
      if (item.step === 'table') {
        // v31: tabellsvaret klart — minnespåminnelsen kommer som EGEN fråga.
        // Inget skrivs i rutan än; consumeCarry sker i minnessteget.
        helpBubble(`Rätt! <strong style="color:${cv(item.g)}">${expected}</strong> ✅`);
        smallBurst();
        setTimeout(() => { if (gen === exGen) advanceHelp(helpIdx + 1); }, 800);
        return;
      }
      consumeCarry(item);
      if (item.last && item.extra !== null) {
        writeDigit(item.rowKey, item.g, item.write);
        setTimeout(() => writeDigit(item.rowKey, item.g + 1, item.extra), 250);
        helpBubble(`Rätt! Sista kolumnen — hela <strong style="color:${cv(item.g)}">${expected}</strong> får plats! ✅`);
        smallBurst();
        setTimeout(() => { if (gen === exGen) advanceHelp(helpIdx + 1); }, 1000);
      } else if (!item.last && item.carryOut > 0) {
        // v30: skriv siffran — placeringen är barnets egen PLACERA-fas
        writeDigit(item.rowKey, item.g, item.write);
        helpBubble(`Rätt! Vi skriver <strong style="color:${cv(item.g)}">${item.write}</strong>:an — <strong style="color:#dc2626">${item.carryOut}</strong>:an blir minnessiffra!`);
        smallBurst();
        setTimeout(() => { if (gen === exGen) advanceHelp(helpIdx + 1); }, 900);
      } else {
        writeDigit(item.rowKey, item.g, item.write);
        smallBurst();
        setTimeout(() => { if (gen === exGen) advanceHelp(helpIdx + 1); }, 600);
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
      if (item.which >= 2) clearCarryRow(); // arrays — minnesspalten står kvar
      App.Sound.play('click');
      advanceHelp(helpIdx + 1);

    } else if (item.kind === 'trivial') {
      writeDigit(item.rowKey, item.g, item.write);
      App.Sound.play('correct');
      const gen = exGen;
      setTimeout(() => { if (gen === exGen) advanceHelp(helpIdx + 1); }, 600);

    } else if (item.kind === 'dskip') {
      // v32: framåtblickande knappen "Vi tar med nästa siffra! →"
      App.Sound.play('click');
      advanceHelp(helpIdx + 1);
    }
  }

  function helpTaskDone() {
    exScore++;
    helpBubble(plan.kind === 'division'
      ? `Klart! 🎉 ${numA} ÷ ${numB} = <strong>${plan.answer}</strong> — kolla: ${plan.answer} · ${numB} = ${numA}!`
      : `Klart! 🎉 ${numA} · ${numB} = <strong>${plan.answer}</strong>`);
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
      const what = gameKind === 'div' ? 'kvoten' : 'svaret';
      label.textContent = ready ? 'Tryck Klar ✓ när du är säker' : `Skriv ${what} med siffrorna`;
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
      // Glömd-minnessiffra-detektion (v30) / glömd-rest-detektion (v32):
      // matchar svaret simuleringen där minnen/rester tappas → riktad
      // feedback i stället för generisk.
      const guess = parseInt(exFreeInput, 10);
      const nc = plan.kind === 'division' ? divNoRemAnswer(numA, numB) : noCarryAnswer(plan);
      const memHint = nc !== plan.answer && guess === nc;
      const hintText = plan.kind === 'division'
        ? 'Nästan! Kolla resterna — de följer med till nästa siffra! 👆'
        : 'Nästan! Kolla minnessiffrorna — någon vill vara med! 👆';
      const fb = document.getElementById('md-feedback');
      if (fb) fb.innerHTML = `<div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);
        border:2px solid #f59e0b;border-radius:12px;padding:5px 10px;font-weight:800;
        font-size:0.92rem;color:#92400e;text-align:center">${memHint
          ? hintText
          : 'Inte riktigt! Ändra med ⌫ och prova igen 💪'}</div>`;
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
    // Logga fria lägets pass (mode, nivå, score) — hjälpläget loggas inte
    if (!helpMode && profile) {
      try { getLog().add({ mode: gameKind === 'div' ? 'division' : 'multiplikation', level: difficulty, score: exScore, total: 5 }); }
      catch (_) {}
    }
    const root = document.getElementById('multdiv-root');
    const emoji = exScore === 5 ? '🌟' : exScore >= 4 ? '🥇' : exScore >= 3 ? '🥈' : '💪';
    const msg   = exScore === 5 ? 'Perfekt! 🎉' : exScore >= 4 ? 'Fantastiskt!' : exScore >= 3 ? 'Jättebra!' : 'Fortsätt öva!';
    // MINNESMÄSTARE ⭐ (v30): alla placera+stryk-moment utan fel-tap.
    // Aldrig något negativt vid miss — bara utebliven bonus.
    const memStar = helpMode && memMoments > 0 && memMistakes === 0;
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
          ${memStar ? `<div style="margin:10px auto 0;display:inline-block;
            background:linear-gradient(135deg,#fef9c3,#fef3c7);border:2px solid #fbbf24;
            border-radius:999px;padding:8px 20px;font-weight:900;color:#b45309;
            font-size:1.05rem;animation:md-bubble-in 0.4s var(--spring)">⭐ Minnesmästare!</div>` : ''}
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
    init, showHub, setDifficulty, chooseMult, chooseDiv,
    showModeSelect, startDemo, demoNextStep,
    startExercise, showHelpSelect, setHelpMode,
    helpKey, helpErase, helpSubmit, helpAction,
    useLifeline,                           // livlinor (v31)
    memTap, memTapSlot, memPick,           // minnesspalten (v30)
    divTapSlot,                            // divisionens PLACERA-fas (v32)
    exFreePress, exFreeErase, exFreeSubmit,
    mdToggleEraser, mdClearCanvas,
    exitToApp,
    /* Endast för vitest: ren matte-kärna + generator */
    _internals: { digitsOf, singlePass, addPass, buildPlan, genProblem, noCarryAnswer,
                  divPass, divLevelOk, genDivProblem, buildDivPlan, divNoRemAnswer },
  };
  return api;
})();

/* CJS-export för vitest (samma mönster som shared.js) */
if (typeof module !== 'undefined' && module.exports) module.exports = MultDivGame;
