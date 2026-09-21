/* ============================================================
   MULTIPLAY – Uppställd addition & subtraktion
   Demo-läge (steg-för-steg) + Övningsläge (kolumn för kolumn)
   ============================================================ */
'use strict';

const UppstallningGame = (() => {

  /* ── State ─────────────────────────────────────────────── */
  let profile    = null;
  let mode       = 'addition';

  let difficulty = 2; // Sifferskala 1–4 (1=🌱 Tal 0–20, 2=🌿 Tvåsiffrigt, 3=🌾 Över hundra, 4=🌳 Minnessiffra/lån)

  let numA = 0, numB = 0;
  let colCount = 3;

  /* Demo */
  let demoStep    = 0;
  let demoSteps   = [];
  let stepLocked  = false;        // locked during animation
  let demoEffA    = [];           // current display values for row A
  let demoCarries = [];           // carry row values [0=ental,1=tiotal,2=hundratal]
  let demoCarryUsed = [];         // whether carry[c] has been consumed
  let demoAns     = [null,null,null,null]; // filled answer digits
  let demoBorrowTens = [false, false, false]; // borrow-ten markers active per col

  /* Exercise */
  let exerciseIdx   = 0;
  let exScore       = 0;
  let exCurrentCol  = 0;
  let exInputLocked = false;
  let exAnswers     = [];
  let exInput       = '';
  let exColData     = []; // preprocessad per-kolumn data från buildDemoSteps
  let helpMode      = true; // true = med hjälp, false = utan hjälp
  let exTenPhase = [];  // index i kolumnens metodkö (exColData[c].queue), 0…queue.length

  /* Free mode (utan hjälp) — miniräknar-modell: ETT svarsfält */
  let exFreeInput        = '';   // svaret som sträng, skrivs vänster→höger
  let exFreeFirstAttempt = true; // poäng endast vid helrätt på första Klar

  /* Levande minnessiffror (v30) — endast ADDITION */
  let memPhase   = null;  // null | {kind:'place', col, srcCol} | {kind:'strike', col, cont}
  let memPerfect = true;  // inga fel-tap i hela passet → Minnesmästare ⭐
  let memMoments = 0;     // antal placera+stryk-moment i passet
  let freeMemVals = [null, null, null];   // fria lägets frivilliga minnessiffror
  let freeMemUsed = [false, false, false];

  /* Canvas */
  let upCanvas = null, upCtx = null;
  let upDrawing = false, upErasing = false;
  let upLastX = 0, upLastY = 0;

  /* ── Konstanter ─────────────────────────────────────────── */
  const PVC = { ental: '#22c55e', tiotal: '#3b82f6', hundratal: '#ef4444' };
  const COL_KEYS   = ['ental','tiotal','hundratal'];
  const COL_LABELS = ['E','T','H'];
  const LOG_KEY    = id => `uppstallning_log_${id}`;

  /* Additionens pedagogiska vägval — Dennis 2026-09-20.
     'storsta' betyder att BÅDE komplementet och minnessiffran utgår från
     den största siffran i kolumnen: en 9:a tar 1 av en 2:a, aldrig tvärtom.

     VARFÖR DEN GAMLA VÄGEN FINNS KVAR: 'oversta' (= det översta talet, appens
     regel före 20/9) lever kvar i planAdditionColumns som `legacy`-grenen, och
     karakteriseringstestet i tests/uppstallning.test.mjs håller den vid liv.
     Skälet är att största-talet-regeln ÄNNU INTE är verifierad mot Miras
     mattebok (Mitt i Prick 4A). Visar boken att klassrummet alltid fyller det
     översta talet till 10, vänds hela regeln tillbaka genom att ändra raden
     nedan till { compTo:'oversta', memTo:'oversta' } — en rad, ingen omskrivning.

     VAD SOM FÅR STRYKA DEN: att boken kontrollerats och bekräftar största-
     talet-regeln (eller att Dennis säger att frågan är stängd). Då tas
     `legacy`-grenen i planAdditionColumns bort tillsammans med
     karakteriseringstestet, i samma commit — den pinnar annars fast ett
     beteende vi medvetet övergett. */
  const ADD_OPTS = { compTo: 'storsta', memTo: 'storsta' };

  /* TANKERUTANS TRÖSKEL — Dennis 2026-09-21.
     Ett lån på 1 är inget att lyfta ur kolumnen för på de svåra nivåerna:
     där kan hon metoden, och utlyftet blir en ceremoni kring ingenting.
     På nivå 1–2 öppnas rutan ALLTID, även vid små lån, så att metoden
     känns likadan varje gång medan hon lär sig den.
     Tröskeln är satt av Dennis och får höjas — `<= 2` är nästa steg, och
     tar då med lån på 2 i den korta vägen. Mätt på nuvarande regelverk är
     behover === 1 39,4 % av komplementkolumnerna på nivå 3 och 42,5 % på
     nivå 4 (3 000 000 dragningar per nivå). En höjning till `<= 2` skulle
     ta 70,0 % resp. 73,4 % av dem — alltså nästan hela klassen. */
  const SKIP_BOX_MAX_BORROW = 1;
  const SKIP_BOX_MIN_LEVEL  = 3;

  /* Tiokompis-villkoret (spec §3b = mockup:301). Båda termerna måste vara
     minst 1 — annars är det ingen tiokompis, utan en tia som redan står där. */
  function isExactTen(growVal, giveVal) {
    return growVal + giveVal === 10 && growVal >= 1 && giveVal >= 1;
  }

  /* ── CSS (injected once per view) ──────────────────────── */
  const BASE_CSS = `
    /* Helskärmslayout – överskriver app.css max-width */
    #screen-addsub, #screen-uppstallning {
      max-width:100% !important; width:100% !important; padding:0 !important; }
    #screen-addsub .app-header, #screen-uppstallning .app-header { max-width:100% !important; }

    #uppstallning-root { display:flex; flex-direction:column; height:100vh; overflow:hidden; }
    #uppstallning-root .app-header { padding:4px 12px 0; margin-bottom:0; flex-shrink:0; }
    #up-main { flex:1; display:flex; overflow:hidden; min-height:0; }
    #up-left { display:flex; flex-direction:column; gap:8px;
               overflow-y:auto; padding:clamp(6px,1.5vw,12px); min-height:0; padding-bottom:12px; }
    #up-right { display:flex; flex-direction:column; padding:clamp(6px,1.5vw,12px); gap:5px; min-height:0; }
    /* Kladd-lagen (Fas 3.2): kladden fyller ALL ledig yta i sin riktning.
       Landskap: uppgiftskolumnen får en stabil bredd (ej innehållsstyrd, så
       canvasens CSS-yta inte fladdrar mellan steg) — kladden tar resten.
       Porträtt: uppgiftsstacken tar sin naturliga höjd — kladden tar resten. */
    @media (orientation:landscape) {
      #up-main { flex-direction:row; }
      #up-left  { flex:0 0 clamp(340px,45%,560px); }
      #up-right { flex:1 1 0; min-width:0; }
    }
    @media (orientation:portrait) {
      #up-main { flex-direction:column; }
      #up-left  { flex:0 1 auto; }
      #up-right { flex:1 1 0; min-height:150px; }
    }
    .up-btn { cursor:pointer; border:none; border-radius:var(--radius-md); font-weight:800;
      font-family:var(--font-body);
      transition:transform 0.25s var(--spring),box-shadow 0.25s; }
    .up-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 20px var(--glow); }
    .up-btn:disabled { opacity:0.45; cursor:not-allowed; transform:none; }
    /* Val-kort (acard-mönstret från målbilden) */
    .up-card { display:flex; align-items:center; gap:16px; text-align:left;
      padding:14px 20px; width:100%;
      background:var(--glass); border:1px solid var(--glass-line);
      border-radius:var(--radius-lg); box-shadow:var(--shadow-panel); cursor:pointer;
      transition:transform .3s var(--spring),box-shadow .3s; }
    .up-card:hover { transform:translateY(-4px) scale(1.01); box-shadow:0 16px 40px var(--glow); }
    .up-card:active { transform:scale(.98); }
    .up-aico { width:58px; height:58px; border-radius:18px; display:grid; place-items:center;
      font-size:29px; flex-shrink:0; background:linear-gradient(135deg,var(--tint),#fff);
      border:1px solid var(--glass-line); box-shadow:0 4px 12px var(--glow); }
    .up-card b { font-family:var(--font-head); font-weight:700; font-size:19px;
      color:var(--deep); display:block; line-height:1.15; }
    .up-card small { color:var(--ink-soft); font-size:13px; font-weight:700; }
    .up-card .chev { color:var(--accent); flex-shrink:0; width:24px; height:24px; margin-left:auto; }
    /* Svårighetsgrad 1–4: målbildens kompakta tvåraders-chips */
    .diff-row { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
    @media (max-width:480px) { .diff-row { grid-template-columns:repeat(2,1fr); } }
    .diff-btn { display:flex; flex-direction:column; align-items:center; justify-content:center;
      gap:1px; min-height:50px; padding:7px 5px; border-radius:var(--radius-lg);
      cursor:pointer; line-height:1.1;
      background:var(--glass-strong);
      border:1.5px solid color-mix(in srgb, var(--accent) 22%, transparent);
      color:var(--deep); transition:all 0.25s var(--spring); }
    .diff-btn:hover { transform:translateY(-2px); border-color:var(--accent); }
    .diff-btn .diff-num  { font-family:var(--font-head); font-weight:700; font-size:16px; line-height:1.1; }
    .diff-btn .diff-desc { font-size:11px; font-weight:800; opacity:0.9; line-height:1.1; white-space:nowrap; }
    .diff-btn.active { background:linear-gradient(135deg,var(--accent),var(--accent-light));
      color:#fff; border-color:transparent; box-shadow:0 6px 16px var(--glow); }
    /* v37: lägesvyn på korta skärmar (390×664) — kompakta lägeskort
       så tre kort + chipsraden ryms utan scroll */
    @media (max-height:700px) {
      .up-card { padding:9px 14px; gap:12px; }
      .up-aico { width:44px; height:44px; font-size:22px; border-radius:14px; }
      .up-card b { font-size:16px; }
      .up-card small { font-size:12px; }
      .diff-btn { min-height:44px; padding:5px 4px; }
    }

    /* Uppställningstabell */
    #up-table-wrap { position:relative; background:var(--glass-strong);
      border-radius:var(--radius-lg); padding:clamp(8px,1.5vw,16px);
      border:1px solid var(--glass-line); box-shadow:var(--shadow-panel); width:100%; }
    .up-table { border-collapse:separate; border-spacing:clamp(4px,1vw,8px); margin:0 auto; }
    .col-cell { width:clamp(46px,8vw,74px); height:clamp(46px,8vw,74px); border-radius:11px; position:relative;
      display:flex; align-items:center; justify-content:center;
      font-size:clamp(1.6rem,4vw,3rem); font-weight:900;
      border:2px solid rgba(0,0,0,0.08); background:rgba(255,255,255,0.92);
      overflow:visible; }
    .col-cell.dim { opacity:0.28; }
    .col-cell.glow-ental    { animation:glow-g 1.1s ease-in-out infinite; border-color:#22c55e; }
    .col-cell.glow-tiotal   { animation:glow-b 1.1s ease-in-out infinite; border-color:#3b82f6; }
    .col-cell.glow-hundratal{ animation:glow-r 1.1s ease-in-out infinite; border-color:#ef4444; }
    .col-cell.problem-cell  { animation:prob-pulse 0.55s ease-in-out infinite; }
    .carry-cell { width:clamp(46px,8vw,74px); height:clamp(22px,3.2vw,30px); border-radius:6px; display:flex;
      align-items:center; justify-content:center; font-size:clamp(0.7rem,1.5vw,0.95rem); font-weight:900;
      color:#dc2626; background:rgba(220,38,38,0.07); overflow:visible; position:relative; }
    .ans-cell { width:clamp(46px,8vw,74px); height:clamp(46px,8vw,74px); border-radius:11px; display:flex;
      align-items:center; justify-content:center; font-size:clamp(1.6rem,4vw,3rem); font-weight:900;
      border:2.5px dashed color-mix(in srgb, var(--accent) 32%, transparent); background:rgba(255,255,255,0.7); }
    .ans-cell.active-col { border-style:solid; border-color:var(--accent);
      background:color-mix(in srgb, var(--accent) 8%, transparent); }
    .ans-cell.filled { border-style:solid; }
    /* Diagonal streck */
    .dw { position:relative; display:inline-flex; align-items:center; justify-content:center;
      width:100%; height:100%; }
    .dw.crossed::after { content:''; position:absolute; left:4px; right:4px; top:50%;
      height:3px; background:#ef4444; border-radius:2px;
      transform:rotate(-22deg) scaleX(0); transform-origin:left center;
      animation:strike-draw 0.42s ease-out 0.05s forwards; }
    .dw.carry-crossed::after { background:#d97706; }
    .digit-new { font-size:clamp(0.75rem,1.5vw,0.92rem); font-weight:900; pointer-events:none; white-space:nowrap;
      animation:fade-up-flex 0.4s ease-out 0.45s both; }
    .small-new-digit { position:absolute; bottom:2px; right:4px;
      font-size:clamp(0.58rem,1.2vw,0.78rem); font-weight:900; pointer-events:none; z-index:2; }

    /* Borrow-ten wrapper och marker */
    .bt-wrap { position:absolute; bottom:100%; left:50%; transform:translateX(-50%);
      display:flex; flex-direction:column; align-items:center; gap:2px;
      pointer-events:none; padding-bottom:2px; z-index:5; }
    .borrow-ten { font-size:clamp(0.7rem,1.5vw,0.88rem); font-weight:900; color:#dc2626; background:#fee2e2;
      border:1.5px solid #ef4444; border-radius:6px; padding:1px clamp(4px,0.8vw,6px);
      pointer-events:none; animation:land-bounce-flex 0.45s ease-out both; white-space:nowrap; }
    .borrow-ten.used { text-decoration:line-through; opacity:0.4; animation:none; }

    /* Levande minnessiffror (v30) — pennstil: liten, roterad, RÖD.
       Stryks med penndrag när den är använd — RADERAS ALDRIG under uppgiften. */
    .mem-digit { position:relative; display:inline-block; line-height:1;
      transform:rotate(-4deg); color:#dc2626; font-weight:900;
      font-family:var(--font-head); font-size:clamp(0.95rem,2.2vw,1.5rem);
      animation:land-bounce-flex 0.45s ease-out both; }
    .mem-digit.used { opacity:0.5; }
    .mem-digit .mem-strike { position:absolute; left:-22%; top:-14%; width:144%; height:128%;
      pointer-events:none; overflow:visible; }
    .mem-digit .mem-strike path { stroke:#b91c1c; stroke-width:2.6; fill:none;
      stroke-linecap:round; stroke-dasharray:44; stroke-dashoffset:44;
      animation:mem-strike-draw 0.25s ease-out forwards; }
    .mem-digit.pulse { animation:mem-digit-pulse 1.1s ease-in-out infinite; }
    /* Barnvänlig tap-yta (T2.1): siffran/cellen är liten men träffytan ≥40px */
    .mem-digit::after { content:''; position:absolute; inset:-14px; }
    .carry-cell::after { content:''; position:absolute; inset:-10px -4px; }
    .carry-cell.mem-pulse { animation:mem-cell-pulse 1.1s ease-in-out infinite;
      border:2px dashed #dc2626; cursor:pointer; }
    .mem-picker { position:absolute; z-index:30; background:#fff;
      border:2px solid #dc2626; border-radius:12px; padding:6px;
      display:grid; grid-template-columns:repeat(3,42px); gap:4px;
      box-shadow:0 8px 24px rgba(0,0,0,0.2); animation:bubble-in 0.2s var(--spring); }
    .mem-picker button { width:42px; height:42px; border-radius:8px;
      border:1.5px solid #fca5a5; background:#fef2f2; color:#dc2626;
      font-weight:900; font-size:1rem; cursor:pointer; font-family:var(--font-head); }
    .mem-picker button:active { transform:scale(0.92); }
    .mem-master { margin-top:8px; display:inline-flex; align-items:center; gap:6px;
      background:linear-gradient(135deg,#fef9c3,#fde68a); border:2px solid #f59e0b;
      border-radius:999px; padding:6px 16px; font-weight:900; color:#92400e;
      animation:land-bounce-flex 0.5s ease-out both; }

    /* Tankebubbla */
    .thought-bubble { background:#fff; border-radius:var(--radius-md);
      padding:clamp(8px,1.5vw,14px) clamp(10px,2vw,18px);
      box-shadow:var(--shadow-panel); font-weight:800; color:var(--ink);
      font-size:clamp(0.92rem,2vw,1.15rem);
      border:2px solid color-mix(in srgb, var(--accent) 18%, transparent);
      animation:bubble-in 0.3s var(--spring); line-height:1.5; }

    /* Numpad i övningsläge */
    .ex-numpad { display:grid; grid-template-columns:repeat(5,clamp(40px,7vw,60px)); gap:5px; justify-content:center; }
    .ex-nk { width:clamp(40px,7vw,60px); height:clamp(40px,7vw,60px); border-radius:50%;
      font-size:clamp(0.95rem,2vw,1.1rem); font-family:var(--font-head); font-weight:900;
      cursor:pointer; background:var(--glass-strong);
      border:1.5px solid color-mix(in srgb, var(--accent) 32%, transparent);
      color:var(--deep); transition:transform 0.2s var(--spring); }
    .ex-nk:hover { transform:scale(1.12); border-color:var(--accent); }

    /* Fria läget: ETT svarsfält (miniräknar-modell) */
    .free-field { display:flex; align-items:center; justify-content:flex-end; gap:2px;
      width:100%; min-height:clamp(40px,8vw,74px); border-radius:11px;
      padding:0 clamp(10px,2vw,16px);
      font-family:var(--font-head); font-size:clamp(1.6rem,4vw,3rem); font-weight:900;
      color:var(--deep); background:rgba(255,255,255,0.7);
      border:2.5px dashed color-mix(in srgb, var(--accent) 32%, transparent);
      transition:border-color 0.2s, background 0.2s; }
    .free-field.has-digits { border-style:solid;
      border-color:color-mix(in srgb, var(--accent) 55%, transparent); }
    .free-field.wrong { border:2.5px solid #ef4444; background:rgba(239,68,68,0.1);
      color:#dc2626; }
    .free-field.correct { border:2.5px solid #22c55e; background:rgba(34,197,94,0.12);
      color:#16a34a; }
    .free-field.shake { animation:free-shake 0.3s ease; }
    .free-caret { display:inline-block; width:3px; height:1.05em; border-radius:2px;
      background:var(--accent); animation:caret-blink 1s steps(1) infinite; }
    .free-field.wrong .free-caret { background:#dc2626; }

    /* Canvas */
    .up-scratch { background:var(--glass); border-radius:var(--radius-md);
      border:1px solid var(--glass-line); box-shadow:var(--shadow-panel);
      display:flex; flex-direction:column;
      gap:5px; flex:1; min-height:0; padding:8px; }
    .up-canvas { flex:1; min-height:60px; width:100%; display:block; touch-action:none;
      cursor:crosshair; border-radius:10px;
      border:2px dashed color-mix(in srgb, var(--accent) 30%, transparent);
      background:rgba(255,255,255,0.8); }

    /* Keyframes */
    @keyframes strike-draw {
      from { transform:rotate(-22deg) scaleX(0); }
      to   { transform:rotate(-22deg) scaleX(1); }
    }
    @keyframes fade-up {
      from { opacity:0; transform:translateX(-50%) translateY(8px); }
      to   { opacity:1; transform:translateX(-50%) translateY(0); }
    }
    @keyframes drop-down {
      0%   { transform:translateY(-20px); opacity:0; }
      65%  { transform:translateY(4px); opacity:1; }
      100% { transform:translateY(0); opacity:1; }
    }
    @keyframes land-bounce {
      0%   { transform:translateX(-50%) scale(0.3); opacity:0; }
      65%  { transform:translateX(-50%) scale(1.25); opacity:1; }
      100% { transform:translateX(-50%) scale(1); opacity:1; }
    }
    @keyframes land-bounce-flex {
      0%   { transform:scale(0.3); opacity:0; }
      65%  { transform:scale(1.25); opacity:1; }
      100% { transform:scale(1); opacity:1; }
    }
    @keyframes fade-up-flex {
      from { opacity:0; transform:translateY(8px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes glow-g {
      0%,100% { box-shadow:0 0 8px rgba(34,197,94,0.3); }
      50%      { box-shadow:0 0 22px rgba(34,197,94,0.7); }
    }
    @keyframes glow-b {
      0%,100% { box-shadow:0 0 8px rgba(59,130,246,0.3); }
      50%      { box-shadow:0 0 22px rgba(59,130,246,0.7); }
    }
    @keyframes glow-r {
      0%,100% { box-shadow:0 0 8px rgba(239,68,68,0.3); }
      50%      { box-shadow:0 0 22px rgba(239,68,68,0.7); }
    }
    @keyframes prob-pulse {
      0%,100% { border-color:#ef4444; box-shadow:0 0 6px rgba(239,68,68,0.4); }
      50%      { border-color:#ef4444; box-shadow:0 0 18px rgba(239,68,68,0.8); }
    }
    @keyframes bubble-in {
      from { transform:scale(0.75) translateY(6px); opacity:0; }
      to   { transform:scale(1) translateY(0); opacity:1; }
    }
    @keyframes borrow-glow {
      0%,100% { box-shadow: 0 4px 12px rgba(245,158,11,0.5); }
      50%      { box-shadow: 0 6px 28px rgba(245,158,11,0.95); }
    }
    @keyframes caret-blink {
      0%,60%   { opacity:1; }
      61%,100% { opacity:0; }
    }
    @keyframes free-shake {
      0%,100% { transform:translateX(0); }
      25%      { transform:translateX(-6px); }
      50%      { transform:translateX(5px); }
      75%      { transform:translateX(-3px); }
    }
    @keyframes mem-strike-draw { to { stroke-dashoffset:0; } }
    @keyframes mem-digit-pulse {
      0%,100% { transform:rotate(-4deg) scale(1); }
      50%      { transform:rotate(-4deg) scale(1.3); }
    }
    @keyframes mem-cell-pulse {
      0%,100% { box-shadow:0 0 6px rgba(220,38,38,0.35); }
      50%      { box-shadow:0 0 18px rgba(220,38,38,0.85); }
    }

    /* ══ Tiokompis-genvägen — spec §5.2, verbatim ur mockupen ══ */

    /* Kapseln kring paret (mockup:544–551) */
    .tk-capsule{position:absolute;z-index:6;pointer-events:none;
      border-radius:22px;border:3px solid #7c3aed;
      background:rgba(255,255,255,0.42);
      box-shadow:0 6px 20px rgba(124,58,237,0.26), inset 0 0 0 6px rgba(250,204,21,0.9);
      animation:tk-cap-in .38s var(--spring) both;}
    @keyframes tk-cap-in{0%{transform:scale(.82);opacity:0;}65%{transform:scale(1.04);opacity:1;}
      100%{transform:scale(1);opacity:1;}}
    .tk-capsule.fading{transition:opacity .35s var(--smooth);opacity:0;}

    /* Summebrickan (mockup:554–563, 570–579, 588) */
    .tk-badge{position:absolute;z-index:8;pointer-events:none;display:flex;align-items:center;
      gap:1px;padding:4px 12px;border-radius:var(--radius-full);
      background:linear-gradient(135deg,#7c3aed,#a78bfa);
      box-shadow:0 7px 20px rgba(124,58,237,.45), inset 0 1px 0 rgba(255,255,255,.35);
      font-family:var(--font-head);font-weight:800;font-size:1.5rem;color:#fff;line-height:1;
      animation:tk-badge-in .35s var(--spring) both;}
    @keyframes tk-badge-in{0%{transform:scale(.4);opacity:0;}65%{transform:scale(1.16);opacity:1;}
      100%{transform:scale(1);opacity:1;}}
    .tk-badge .tk-d{display:inline-block;transition:opacity .18s var(--smooth);}
    .tk-badge .tk-d.gone{opacity:0;width:0;overflow:hidden;}
    .tk-badge.badge-blue{background:linear-gradient(135deg,#3b82f6,#93c5fd);
      box-shadow:0 7px 20px rgba(59,130,246,.45), inset 0 1px 0 rgba(255,255,255,.35);}
    .tk-badge.badge-green{background:linear-gradient(135deg,#22c55e,#86efac);
      box-shadow:0 7px 20px rgba(34,197,94,.45), inset 0 1px 0 rgba(255,255,255,.35);}
    .tk-badge.badge-red{background:linear-gradient(135deg,#ef4444,#fca5a5);
      box-shadow:0 7px 20px rgba(239,68,68,.45), inset 0 1px 0 rgba(255,255,255,.35);}
    .tk-badge.fading{transition:opacity .3s var(--smooth),transform .3s var(--smooth);
      opacity:0;transform:scale(.7);}
    .tk-badge.tk-sum{min-width:62px;justify-content:center;}

    /* Flygande siffror (mockup:581–585) */
    .tk-fly{position:absolute;z-index:22;pointer-events:none;display:grid;place-items:center;
      font-family:var(--font-head);font-weight:800;line-height:1;}
    .tk-fly.fly-fixed{position:fixed;z-index:40;}
    .tk-badge.fly-fixed{position:fixed;z-index:40;}

    /* Avläsningspulsen och pulsarna (mockup:592–605) */
    @keyframes nf-read-glow{
      0%,100%{ text-shadow:none; }
      45%{ text-shadow:0 0 9px currentColor, 0 0 3px currentColor; }
    }
    .dw.tk-pop{animation:tk-pop .3s var(--spring) both;}
    @keyframes tk-pop{0%{transform:scale(1);}45%{transform:scale(1.34);}100%{transform:scale(1);}}
    .carry-cell .mem-digit.tk-blink{animation:tk-blink .4s ease-in-out both;}
    @keyframes tk-blink{0%,100%{transform:rotate(-4deg) scale(1);}
      50%{transform:rotate(-4deg) scale(1.45);}}

    /* Spökkonturen — platsen lånet ska fylla (mockup:613–626) */
    .nf-ghost{position:absolute;z-index:7;pointer-events:none;display:grid;place-items:center;
      border-radius:12px;border:2.5px dashed currentColor;background:rgba(255,255,255,0.55);
      font-family:var(--font-head);font-weight:800;font-size:1.45rem;line-height:1;opacity:.40;
      animation:nf-ghost-in .38s var(--spring) both;}
    @keyframes nf-ghost-in{0%{transform:scale(.6);opacity:0;}
      65%{transform:scale(1.12);opacity:.48;}100%{transform:scale(1);opacity:.40;}}
    .nf-ghost.filled{opacity:1;background:rgba(255,255,255,0.96);border-style:solid;
      box-shadow:0 5px 16px rgba(0,0,0,.14);}
    .nf-ghost.pop{animation:tk-pop .3s var(--spring) both;}
    .nf-ghost.inline{position:static;width:36px;height:36px;font-size:1.35rem;
      margin-left:-3px;flex:0 0 auto;align-self:center;}
    .nf-ghost.fading{transition:opacity .3s var(--smooth),transform .3s var(--smooth);
      opacity:0;transform:scale(.68);}

    /* ══ ARBETSYTAN I HÖGERMARGINALEN (uppgift 7b) ══════════════════
       Korta vägen (SKIP_BOX_MAX_BORROW) har ingen tankeruta, så minnets
       kvantitet hade ingenstans att synas: bubblan sa "Minnet gör 8:an
       till 9" medan kolumnen stod kvar på 8 ända tills siffran plötsligt
       blev 10. Pappret får inte ljuga — Mira skriver aldrig en 9:a där —
       så 9:an blir en BRICKA i marginalen, där allt lösräknande bor.
       Ytan håller sina barn INLINE (bricka, sedan spöket), precis som
       tankerutans rad; annars hamnar två absolutpositionerade element på
       samma parkeringsplats och lägger sig ovanpå varandra. */
    .nf-work{position:absolute;z-index:8;pointer-events:none;
      display:flex;align-items:center;gap:5px;}
    .nf-work .tk-badge.tk-work{position:static;flex:0 0 auto;
      font-size:1.35rem;padding:3px 10px;}
    .tk-badge.tk-pop{animation:tk-pop .3s var(--spring) both;}
    .nf-work.fading{transition:opacity .3s var(--smooth),transform .3s var(--smooth);
      opacity:0;transform:scale(.7);}

    /* Siffror mitt i en förändring (mockup:630–633).
       Spec §5.2 lät bli .dw.nf-owing eftersom läget "i kolumnen" var
       förkastat. Dennis korta väg (SKIP_BOX_MAX_BORROW) räknar just i
       kolumnen, så regeln behövs: siffran som lånat ut är blek tills den
       skrivits om, annars står "10 + 5" en stund och ljuger. */
    .dw.nf-owing > span{opacity:.34;transition:opacity .25s var(--smooth);}
    .col-cell.nf-vacated{border-style:dashed;}
    .dw.nf-vacated > span{opacity:.18;transition:opacity .3s var(--smooth);}

    /* Tankerutan (mockup:637–640, 649–682) */
    #up-think{max-height:0;opacity:0;overflow:hidden;flex-shrink:0;
      transition:max-height .42s var(--spring),opacity .28s var(--smooth);}
    #up-think.open{max-height:210px;opacity:1;}
    #up-think.off{display:none;}
    .nf-think{background:linear-gradient(140deg,#f7f2ff,#eef6ff);border:2.5px dashed #c4b5fd;
      border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);padding:7px 10px 9px;position:relative;}
    .nf-think-title{font-family:var(--font-head);font-weight:700;font-size:12.5px;
      color:var(--friends-deep);text-align:center;margin-bottom:3px;}
    .nf-think-row{display:flex;align-items:center;justify-content:center;gap:9px;min-height:54px;
      position:relative;}
    .nf-chip{min-width:50px;height:50px;padding:0 9px;border-radius:14px;background:#fff;
      border:2.5px solid currentColor;display:grid;place-items:center;
      font-family:var(--font-head);font-weight:800;font-size:1.95rem;line-height:1;
      box-shadow:0 4px 14px rgba(93,63,158,.13);opacity:0;
      transition:opacity .22s var(--smooth);}
    .nf-chip.in{opacity:1;}
    .nf-chip.owing{opacity:.38;border-style:dashed;}
    .nf-chip.pop{animation:tk-pop .32s var(--spring) both;}
    .nf-chip.nf-mem{min-width:38px;height:42px;font-size:1.5rem;border-width:2px;border-style:dashed;}
    .nf-dot{font-family:var(--font-head);font-weight:800;font-size:1.5rem;color:#94a3b8;
      margin:0 -3px;opacity:0;transition:opacity .22s var(--smooth);}
    .nf-dot.in{opacity:1;}
    .nf-chip.isten{border:none;padding:0 12px;color:#fff;gap:1px;display:flex;align-items:center;
      background:linear-gradient(135deg,#7c3aed,#a78bfa);
      box-shadow:0 7px 20px rgba(124,58,237,.42), inset 0 1px 0 rgba(255,255,255,.35);}
    .nf-chip.isten.badge-blue{background:linear-gradient(135deg,#3b82f6,#93c5fd);
      box-shadow:0 7px 20px rgba(59,130,246,.42), inset 0 1px 0 rgba(255,255,255,.35);}
    .nf-chip.isten.badge-green{background:linear-gradient(135deg,#22c55e,#86efac);
      box-shadow:0 7px 20px rgba(34,197,94,.42), inset 0 1px 0 rgba(255,255,255,.35);}
    .nf-chip.isten.badge-red{background:linear-gradient(135deg,#ef4444,#fca5a5);
      box-shadow:0 7px 20px rgba(239,68,68,.42), inset 0 1px 0 rgba(255,255,255,.35);}
    .nf-op{font-family:var(--font-head);font-weight:800;font-size:1.5rem;color:#64748b;
      opacity:0;transition:opacity .22s var(--smooth);}
    .nf-op.in{opacity:1;}
    .nf-think.leaving{transition:opacity .3s var(--smooth),transform .3s var(--smooth);
      opacity:.25;transform:scale(.97);}
  `;

  /* ── Init ───────────────────────────────────────────────── */
  function init(p, m) {
    profile = p;
    mode    = m || 'addition';
    showModeSelect();
  }

  /* ══════════════════════════════════════════════════════════
     VÄLJ-SKÄRM — v37: konsoliderad LÄGESVY med tre likvärdiga
     lägeskort (Titta och lär / Räkna med hjälp / Räkna själv) +
     svårighetschipsen i botten. Hjälpvals-steget är borttaget —
     startExercise(withHelp) startar rundan direkt. Avsluta/Tillbaka
     från demo/övning/resultat pekar HIT; vyens egen Tillbaka
     (goBack) går till A&S-hubben som tidigare.
  ══════════════════════════════════════════════════════════ */
  let upExGen = 0; // session-token: ogiltigförklarar schemalagda uppgiftsbyten vid Avsluta (T3.3)
  function showModeSelect() {
    upExGen++;
    const root = document.getElementById('uppstallning-root');
    const modeLabel = mode === 'addition' ? 'Addition ➕' : 'Subtraktion ➖';

    const levels = [
      { n: 1, emoji: '🌱', desc: 'Tal 0–20' },
      { n: 2, emoji: '🌿', desc: 'Tvåsiffrigt' },
      { n: 3, emoji: '🌾', desc: 'Över hundra' },
      { n: 4, emoji: '🌳', desc: mode === 'addition' ? 'Med minnessiffra' : 'Med lån' },
    ];
    const diffBtnsHTML = levels.map(l => `
      <button class="diff-btn ${difficulty === l.n ? 'active' : ''}"
        onclick="UppstallningGame.setDifficulty(${l.n},this)">
        <span class="diff-num">${l.n} ${l.emoji}</span>
        <span class="diff-desc">${l.desc}</span>
      </button>`).join('');

    root.innerHTML = `
      <style id="up-base">${BASE_CSS}</style>
      <div class="floaties"><span style="top:7%;right:8%">✨</span><span style="bottom:12%;left:6%;animation-delay:2s">🍀</span></div>
      <div class="app-header">
        <button class="btn-back" onclick="UppstallningGame.goBack()">Tillbaka</button>
        <span class="header-title">${modeLabel}</span>
        <span style="width:52px"></span>
      </div>
      <div class="wrap" style="padding:0 12px 12px;overflow-y:auto">
        <div class="me-chip" style="align-self:center;margin-top:auto">
          <span class="avatar avatar-sm">${profile.avatar}</span>
          <b>${escHtml(profile.name)}</b>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;margin:14px 0 auto">
          <div class="up-card" onclick="UppstallningGame.startDemo()">
            <span class="up-aico">👀</span>
            <span><b>Titta och lär</b><small>Se varje steg animerat – tryck "Nästa steg"</small></span>
            <svg class="icn chev" viewBox="0 0 24 24"><use href="#i-chevron"/></svg>
          </div>
          <div class="up-card" onclick="UppstallningGame.startExercise(true)">
            <span class="up-aico">🤝</span>
            <span><b>Räkna med hjälp</b><small>Ledtrådar och låna-knapp kolumn för kolumn</small></span>
            <svg class="icn chev" viewBox="0 0 24 24"><use href="#i-chevron"/></svg>
          </div>
          <div class="up-card" onclick="UppstallningGame.startExercise(false)">
            <span class="up-aico">💪</span>
            <span><b>Räkna själv</b><small>På egen hand – ingen ledtråd</small></span>
            <svg class="icn chev" viewBox="0 0 24 24"><use href="#i-chevron"/></svg>
          </div>
          <div class="card" style="padding:14px">
            <div class="panel-title" style="margin-bottom:10px">
              <svg class="icn" style="color:var(--accent)" viewBox="0 0 24 24"><path d="M6 16l4-8 3 6 2-3 3 5"/></svg>
              Svårighetsgrad
            </div>
            <div class="diff-row">${diffBtnsHTML}</div>
          </div>
        </div>
      </div>`;
    Router.show('screen-uppstallning');
  }

  function setDifficulty(n, btn) {
    difficulty = n;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    App.Sound.play('click');
  }

  /* ══════════════════════════════════════════════════════════
     TAL-GENERERING
  ══════════════════════════════════════════════════════════ */
  function generatePair() {
    let a, b;
    if (mode === 'addition') {
      if (difficulty === 1) {
        // Nivå 1 🌱: tal 0–20 (a,b ≥ 2, summa ≤ 20)
        do { a = 2 + rnd(18); b = 2 + rnd(18); } while (a + b > 20);
      } else if (difficulty === 2) {
        // Nivå 2 🌿: tvåsiffrigt, summa < 100
        do { a = 10 + rnd(40); b = 10 + rnd(40); } while (a + b >= 100);
      } else if (difficulty === 3) {
        // Nivå 3 🌾: två tvåsiffriga tal med summa över hundra (100–198)
        do { a = 40 + rnd(60); b = 40 + rnd(60); } while (a + b < 100);
      } else {
        // Nivå 4 🌳: tresiffrigt med garanterad minnessiffra
        do { a = 200 + rnd(400); b = 200 + rnd(300); } while (!hasCarry(a,b) || a + b >= 1000);
      }
    } else {
      if (difficulty === 1) {
        // Nivå 1 🌱: tal 0–20 (a 5–20, b 1 till a−1)
        a = 5 + rnd(16); b = 1 + rnd(a - 1);
      } else if (difficulty === 2) {
        // Nivå 2 🌿: tvåsiffrigt
        do { a = 30 + rnd(70); b = 10 + rnd(20); } while (a <= b);
      } else if (difficulty === 3) {
        // Nivå 3 🌾: över hundra — a 100–198, b tvåsiffrigt, differens 1–99 (lån över hundratalet)
        do { a = 100 + rnd(99); b = 10 + rnd(90); } while (a - b < 1 || a - b > 99);
      } else {
        // Nivå 4 🌳: garantera minst 1 lån. 50% chans att tiotalet=0 (dubbellån).
        if (Math.random() < 0.5) {
          do {
            const hA = 3 + rnd(7), eA = 1 + rnd(4);
            a = hA * 100 + 0 * 10 + eA;
            const hB = 1 + rnd(hA - 1), tB = 1 + rnd(5), eB = eA + 3 + rnd(5);
            b = hB * 100 + tB * 10 + Math.min(eB, 9);
          } while (a <= b);
        } else {
          do { a = 300 + rnd(600); b = 150 + rnd(300); }
          while (a <= b || !hasBorrow(a,b));
        }
      }
    }
    numA = a; numB = b;
    // Hundratalskolumn även när två tvåsiffriga tal ger tresiffrig summa (nivå 3-addition)
    colCount = (numA >= 100 || numB >= 100 || (mode === 'addition' && numA + numB >= 100)) ? 3 : 2;
  }

  function hasCarry(a, b) {
    const da = digs(a), db = digs(b);
    for (let c = 0; c < 3; c++) if (da[c] + db[c] > 9) return true;
    return false;
  }

  function hasBorrow(a, b) {
    const da = digs(a), db = digs(b);
    return da[0] < db[0] || da[1] < db[1];
  }

  function digs(n) { // [ental, tiotal, hundratal]
    return [n % 10, Math.floor(n/10) % 10, Math.floor(n/100) % 10];
  }

  function rnd(n) { return Math.floor(Math.random() * n); }

  /* ══════════════════════════════════════════════════════════
     DEMO-LÄGE
  ══════════════════════════════════════════════════════════ */
  function startDemo() {
    App.Sound.play('click');
    generatePair();
    demoStep       = 0;
    stepLocked     = false;
    demoEffA       = [...digs(numA)];
    demoCarries    = [0, 0, 0];
    demoCarryUsed  = [false, false, false];
    demoAns        = [null, null, null, null];
    demoBorrowTens = [false, false, false];
    demoSteps      = buildDemoSteps();
    renderDemoView();
  }

  /* ── Steg-byggare ───────────────────────────────────────── */

  /* Ren, testbar stegbyggare för addition. Läser inget modultillstånd. */
  function planAdditionColumns(numA, numB, colCount, opts) {
    /* difficulty kommer in via opts — funktionen är ren och får inte läsa
       modultillståndet. Förvalet 1 är den LÅNGA vägen: tankerutan öppnas
       alltid, vilket är rätt för den som inte har sagt något annat. */
    const o = Object.assign({ compTo: 'oversta', memTo: 'oversta', difficulty: 1 }, opts || {});
    /* Gamla vägen (båda 'oversta') ska ge EXAKT dagens steglista — samma fält,
       samma ordning. Därför bär bara den nya vägen §2.3:s extrafält. */
    const legacy = (o.compTo === 'oversta' && o.memTo === 'oversta');
    /* Samma siffersplit som modulens digs(): [ental, tiotal, hundratal] */
    const digs = n => [n % 10, Math.floor(n/10) % 10, Math.floor(n/100) % 10];
    const da = digs(numA), db = digs(numB);
    const steps = [];
    let carryVal = 0;
    for (let c = 0; c < colCount; c++) {
      const a = da[c], b = db[c];
      /* 1. MINNET går till en av termerna (spec §2.1). */
      const memRow   = (carryVal && o.memTo === 'storsta' && b > a) ? 'b' : 'a';
      const memDigit = (memRow === 'a') ? a : b;
      const memNew   = memDigit + carryVal;
      const valA = a + (memRow === 'a' ? carryVal : 0);
      const valB = b + (memRow === 'b' ? carryVal : 0);
      /* 2. KOMPLEMENTET fyller ett av talen till 10 (spec §2.1). */
      const growRow = (o.compTo === 'storsta' && valB > valA) ? 'b' : 'a';
      const giveRow = (growRow === 'a') ? 'b' : 'a';
      const growVal = (growRow === 'a') ? valA : valB;
      const giveVal = (growRow === 'a') ? valB : valA;
      const effectiveA = growVal;
      const sum = valA + valB;
      const ans = sum % 10;
      const nextCarry = sum > 9 ? 1 : 0;
      steps.push({ type:'add_highlight', col:c });
      if (sum > 9) {
        const behover = 10 - effectiveA;
        const kvar = giveVal - behover;
        /* §2.3: de nya stegen bär hela base-objektet. */
        const base = { col:c, a, b, carry_in:carryVal, effectiveA, behover, kvar,
                       ans, nextCarry, sum, growRow, giveRow, growVal, giveVal,
                       valA, valB, memRow, memDigit, memNew };
        if (legacy) {
          /* Gamla vägen, orörd: karakteriseringstestet jämför hela objekt. */
          steps.push({ type:'add_over9', col:c, a, b, carry_in:carryVal, sum, effectiveA });
          steps.push({ type:'add_explain', col:c, a, b, carry_in:carryVal, effectiveA, behover, kvar, ans, nextCarry });
          steps.push({ type:'add_cross', col:c, a, b, carry_in:carryVal, effectiveA, behover, kvar, ans, nextCarry });
          steps.push({ type:'add_carry_fly', col:c, nextCarry });
          steps.push({ type:'add_result', col:c, a, b, kvar, ans, nextCarry });
        } else if (isExactTen(growVal, giveVal)) {
          /* Tiokompis-genvägen (spec §3b): ingen tankeruta, ingen strykning.
             Att ceremonin uteblir ÄR beskedet "den här såg du direkt". */
          /* HÅL B (spec §7.2): är siffran minnet läggs på en 0:a skulle
             bubblan påstå "1 och 9 är tiokompisar" medan barnet ser en nolla
             och en nia. Minnet måste tala först, och då får tf_pair inte
             upprepa det. Inträffar inte med memTo:'storsta' — minnet går
             alltid till den största siffran — men ADD_OPTS kan vändas. */
          const memZero = carryVal && memDigit === 0;
          if (memZero) steps.push({ type:'add_memjoin', ...base, box:false });
          steps.push({ type:'tf_pair', ...base, ...(memZero ? { memSaid:true } : {}) });
          steps.push({ type:'add_carry_fly', ...base, tf:true, chip:true });
          steps.push({ type:'add_result', ...base, tf:true, chip:true });
        } else if (behover === 0) {
          /* HÅL A (spec §7.1): termen ÄR redan 10 när minnet lagts på. Det
             finns ingenting att låna — kolumnen är 10 + resten. Komplement-
             stegen hoppas över helt: ingen "behöver", ingen "lånar", ingen
             strykning. På pappret skriver barnet inget överkryssat här.
             Minnet MÅSTE nämnas först, annars får hon en bricka som säger
             14 utan att ettan någonsin kommit på tal. */
          steps.push({ type:'add_memjoin', ...base, box:false });
          steps.push({ type:'add_sum', ...base, box:false, way:'ur', nostrike:true });
          steps.push({ type:'add_carry_fly', ...base, nf:true, chip:true });
          steps.push({ type:'add_result', ...base, nf:true, chip:true });
        } else {
          /* DET VANLIGA FALLET (spec §3c/§3d): behover >= 1 och kvar >= 1.
             Att det alltid gäller här följer av att sum > 9 med growVal som
             det större talet: giveVal >= behover, och likhet betyder att
             kolumnen är exakt-10 (ovan) eller hål A (ovan).
             En idé per steg — paret lyfts ur kolumnen, räknas i rutan, och
             skrivs tillbaka på pappret INNAN summan läses ur det. */
          const box = !(behover <= SKIP_BOX_MAX_BORROW && o.difficulty >= SKIP_BOX_MIN_LEVEL);
          if (box) {
            /* Utlyftet bär orsaken: paret hoppar ut UR motiveringen, så
               add_over9 behövs inte som eget steg (mockup:774–775). */
            steps.push({ type:'add_lift', ...base, box:true, merged:true });
            /* Minnet får ett eget andetag först när brickorna ligger nere —
               det är brickan som blir en 7:a, inte siffran på pappret. */
            if (carryVal) steps.push({ type:'add_memjoin', ...base, box:true });
          } else if (carryVal) {
            /* Korta vägen: ingen ruta, men minnet måste ändå nämnas. */
            steps.push({ type:'add_memjoin', ...base, box:false });
          }
          steps.push({ type:'add_need', ...base, box });
          steps.push({ type:'add_lend', ...base, box, split:false });
          if (box) {
            steps.push({ type:'add_ten_named', ...base, box:true });
            /* "Ur pappret": skriv först, läs av sedan — då kan summan inte
               försvinna, för den har inte fötts än (spec §3c steg 6–7). */
            steps.push({ type:'add_return', ...base, box:true, way:'ur' });
            steps.push({ type:'add_sum', ...base, box:true, way:'ur' });
          } else {
            /* Korta vägen skriver om direkt i kolumnen — samma papper,
               samma slut, bara utan utflykten till rutan. */
            steps.push({ type:'add_ten', ...base, box:false });
            steps.push({ type:'add_sum', ...base, box:false, way:'ur' });
          }
          steps.push({ type:'add_carry_fly', ...base, nf:true, chip:true });
          steps.push({ type:'add_result', ...base, nf:true, chip:true });
        }
      } else {
        steps.push({ type:'add_simple', col:c, a, b, carry_in:carryVal, sum, ans });
      }
      // Minnet i kolumn c är nu ANVÄNT → eget strykningssteg (v30).
      // SISTA kolumnens minne stryks inte (Dennis: inget kommande att förväxla med)
      if (carryVal && c < colCount - 1) steps.push({ type:'add_mem_strike', col:c });
      carryVal = nextCarry;
    }
    if (carryVal) steps.push({ type:'add_overflow', digit:carryVal });
    steps.push({ type:'done' });
    return steps;
  }

  function buildDemoSteps() {
    if (mode === 'addition') {
      return planAdditionColumns(numA, numB, colCount, { ...ADD_OPTS, difficulty });
    }

    const steps = [];
    const da = [...digs(numA)], db = digs(numB);
    const maxC = colCount;

    {
      // Kompletteringsmetoden
      const effA = [...da];
      for (let c = 0; c < maxC; c++) {
        steps.push({ type:'sub_highlight', col:c, a:effA[c], b:db[c] });
        if (effA[c] < db[c]) {
          const diff = db[c] - effA[c];
          const isDouble = c + 1 < maxC && effA[c+1] === 0 && c + 2 < maxC;
          steps.push({ type: isDouble ? 'sub_cant_double' : 'sub_cant',
            col:c, a:effA[c], b:db[c] });
          if (isDouble) {
            // Mellanlån H → T (separat steg, T visar nytt värde)
            steps.push({ type:'sub_borrow', srcCol:c+2, dstCol:c+1,
              srcNew:effA[c+2]-1, dstNew:effA[c+1]+10, mainCol:c });
            effA[c+2]--; effA[c+1] += 10;
          }
          // sub_flip + T→E lån i ETT steg
          steps.push({ type:'sub_flip_borrow', col:c, a:effA[c], b:db[c], diff,
            srcCol:c+1, srcNew:effA[c+1]-1 });
          effA[c+1]--;
          steps.push({ type:'sub_ten_minus', col:c, diff, ans:10-diff });
        } else {
          steps.push({ type:'sub_calc', col:c, a:effA[c], b:db[c], diff:effA[c]-db[c] });
        }
      }
    }
    steps.push({ type:'done' });
    return steps;
  }

  /* ── Övningslägets vägval (spec §8) ─────────────────────────────────
     De steg demon spelar upp INNAN svarssiffran skrivs. add_result är
     aldrig med — den siffran är barnets jobb. add_mem_strike är inte
     heller med: strykningen är barnets tap efter svaret (exSubmitCol).

     add_ten står i listan trots att spec §8 inte nämner den. Specen skrevs
     före den korta vägen (uppgift 6: `behover === 1` på nivå 3–4 hoppar över
     tankerutan och skriver om tian direkt i kolumnen). Utan add_ten i kön
     skrivs aldrig 10:an på pappret, och add_sum läser då ostruket papper och
     bildar summan ur fel siffror. */
  const EX_QUEUE_TYPES = new Set([
    'add_lift', 'add_memjoin', 'add_need', 'add_lend',
    'add_ten', 'add_ten_named', 'add_return', 'add_sum',
    'tf_pair', 'add_carry_fly',
  ]);

  /* Ren klassning av EN kolumn: vilket av de fyra fallen den är, och vilka
     steg som ska spelas upp. Ersätter `needsTenFriend: !!overStep`, som blev
     false för varje kolumn så snart add_over9 slutade byggas — och då slutade
     övningsläget tyst undervisa metoden. */
  function exColumnPlan(steps, col) {
    const queue = steps.filter(s => s.col === col && EX_QUEUE_TYPES.has(s.type));
    const har   = t => queue.some(s => s.type === t);
    const kind  = har('tf_pair')  ? 'exact10'      /* tiokompis-genvägen */
                : har('add_need') ? 'complement'   /* lån ur det andra talet */
                : har('add_sum')  ? 'tenPlusRest'  /* hål A: termen är redan 10 */
                :                   'simple';      /* går direkt, summa ≤ 9 */
    return { kind, queue };
  }

  /* ── Preprocessa steg → per-kolumn övningsdata ──────────── */
  function preprocessExSteps(steps) {
    const result = [];
    for (let c = 0; c < colCount; c++) {
      const cantStep    = steps.find(s => (s.type === 'sub_cant' || s.type === 'sub_cant_double') && s.col === c);
      const flipStep    = steps.find(s => s.type === 'sub_flip_borrow' && s.col === c);
      const tenStep     = steps.find(s => s.type === 'sub_ten_minus'   && s.col === c);
      const calcStep    = steps.find(s => s.type === 'sub_calc'        && s.col === c);
      const interStep   = steps.find(s => s.type === 'sub_borrow'      && s.mainCol === c);
      const resultStep   = steps.find(s => (s.type === 'add_result' || s.type === 'add_simple') && s.col === c);
      const { kind, queue } = exColumnPlan(steps, c);
      result[c] = {
        correctAnswer:   tenStep?.ans ?? calcStep?.diff ?? resultStep?.ans ?? 0,
        nextCarry:       resultStep?.nextCarry ?? 0,
        sum:             resultStep?.sum ?? null,
        needsBorrow:     !!cantStep,
        isDouble:        cantStep?.type === 'sub_cant_double',
        flipStep:        flipStep    || null,
        interStep:       interStep   || null,
        kind,                      /* 'simple' | 'exact10' | 'complement' | 'tenPlusRest' */
        queue,                     /* demo-stegen, i ordning; exTenPhase[c] är index i den */
        resultStep:      resultStep  || null,
      };
    }
    return result;
  }

  /* ── Render demo-vy ─────────────────────────────────────── */
  function renderDemoView() {
    const root = document.getElementById('uppstallning-root');
    const modeLabel = mode === 'addition' ? 'Addition ➕' : 'Subtraktion ➖';

    root.innerHTML = `
      <style id="up-base">${BASE_CSS}</style>
      <div class="app-header">
        <button class="btn-back" onclick="UppstallningGame.showModeSelect()">Avsluta</button>
        <span class="header-title">${modeLabel} – Demo</span>
        <span style="width:52px"></span>
      </div>
      <div id="up-main">
        <div id="up-left">
          <div id="up-table-wrap">${buildTableHTML()}</div>
          <div id="up-think" class="off"></div>
          <div id="up-bubble"></div>
          <div id="up-next-area">${nextBtnHTML()}</div>
        </div>
        <div id="up-right">
          ${scratchHTML()}
        </div>
      </div>`;

    setupCanvas('up-canvas');
    showStepBubble();
  }

  /* ── Nästa steg ─────────────────────────────────────────── */
  function demoNextStep() {
    if (stepLocked) return;
    const step = demoSteps[demoStep];
    if (!step || step.type === 'done') return;
    lockStep();
    showStepBubble(); // texten för det steg som NU animeras — text och animation i samma fas
    executeStep(step, () => {
      demoStep++;
      unlockStep();
      // "Klart!"-bubblan visas efter sista animationen (med lästid för sista stegtexten)
      if (demoSteps[demoStep] && demoSteps[demoStep].type === 'done') {
        const dennaOmgång = demoSteps;
        setTimeout(() => { if (demoSteps === dennaOmgång) showStepBubble(); }, 1800);
      }
      refreshNextBtn();
    });
  }

  function executeStep(step, cb) {
    /* Övningsläget spelar upp steg ur kolumnens kö och subtraktionens
       flipStep/interStep kan vara null. Ett saknat steg ska aldrig kunna
       krascha en körning — det hoppas över. */
    if (!step) { cb && cb(); return; }
    if (step.type === 'add_highlight') {
      highlightCol(step.col);
      /* Lämna inget kvar från förra kolumnen som kan läsas som aktuellt. */
      const gStale = ghostEl(); if (gStale) gStale.remove();
      clearWork(false);
      closeThink();
      setTimeout(cb, 50);

    /* ── Tiokompis-steget (spec §4.2) ──────────────────────────
       Ordningen är hela poängen:
       (1) minnet blinkar där siffran kom ifrån (bara om carry_in)
       (2) BÅDA siffrorna pulsar samtidigt + kapseln ritas
       (3) 10-brickan framträder SIST — slutsatsen, inte premissen  */
    } else if (step.type === 'tf_pair') {
      highlightCol(step.col);
      let t0 = 0;
      if (step.carry_in) {
        const cell = upCarry(step.col);
        const md = cell && cell.querySelector('.mem-digit');
        if (md) { md.style.animationDuration = Ts(400); md.classList.add('tk-blink'); }
        t0 = 400;
      }
      after(t0, () => {
        ['a', 'b'].forEach(r => {
          const dw = upDw(r, step.col);
          if (dw) { dw.style.animationDuration = Ts(300); dw.classList.add('tk-pop'); }
        });
        drawCapsule(step.col);
      });
      /* Även här stiger summan ur det som står skrivet — siffrorna är
         ostrukna, men de ÄR pappret, och 10 är vad de säger ihop. */
      after(t0 + 400, () => riseSumChip(step.col, step.sum, paperSources(step.col), null));
      after(t0 + 1560, cb);

    /* ── Minnet slås ihop med sin term (spec §4.4, box:false-grenen) ──
       En KOPIA av minnessiffran glider ner i cellen och tonar ut. Den
       skrivna röda 1:an i minnesraden rörs inte — den stryks i sitt eget
       steg, aldrig här. */
    } else if (step.type === 'add_memjoin') {
      highlightCol(step.col);
      const row  = step.memRow || 'a';
      if (step.box) {
        /* I rutan glider minnesbrickan in i sin term, som SYNLIGT blir en
           7:a. Brickan förbrukas — den skrivna 1:an i minnesraden står kvar
           tills den stryks i sitt eget steg (spec §4.4). */
        const mem = chipEl('m'), dot = document.querySelector('.nf-dot');
        const tgt = chipEl(row);
        if (!mem || !tgt) { after(300, cb); return; }
        const tR = tgt.getBoundingClientRect(), mR = mem.getBoundingClientRect();
        mem.style.transition = `transform ${Ts(520)} cubic-bezier(0.34,1.06,0.5,1),` +
                               `opacity ${Ts(260)} var(--smooth) ${Ts(300)}`;
        if (dot) { dot.style.transition = `opacity ${Ts(240)} var(--smooth)`; dot.style.opacity = '0'; }
        requestAnimationFrame(() => requestAnimationFrame(() => {
          mem.style.transform = `translateX(${Math.round(tR.left - mR.left)}px) scale(.7)`;
          mem.style.opacity = '0';
        }));
        after(560, () => {
          mem.remove();
          if (dot) dot.remove();
          tgt.textContent = step.memNew;
          pop(tgt, 340, 'pop');
        });
        after(980, cb);
        return;
      }
      /* KORTA VÄGEN (uppgift 7b). Siffran i cellen ändras INTE — den står
         kvar tills den stryks och skrivs om, precis som på Miras papper.
         I stället läses 8:an och minnesettan av, och kvantiteten 9 ställer
         sig som en bricka i marginalen. Då pekar nästa steg ("9 behöver 1")
         på något som faktiskt syns. */
      const cell = upCarry(step.col);
      const md   = cell && cell.querySelector('.mem-digit');
      const src  = upDw(row, step.col);
      const colr = PVC[COL_KEYS[step.col]];
      const work = ensureWork(step.col, row);
      if (!work) { after(300, cb); return; }
      const wchip = document.createElement('div');
      wchip.className = 'tk-badge tk-work ' + badgeColorClass(step.col);
      wchip.innerHTML = String(step.memNew).split('')
        .map(d => `<span class="tk-d">${d}</span>`).join('');
      wchip.style.opacity = '0';
      work.appendChild(wchip);
      placeWork(work, step.col, row);
      if (src) src.style.animation = `nf-read-glow ${Ts(520)} ease-in-out both`;
      if (md)  { md.style.animationDuration = Ts(250); md.classList.add('tk-blink'); }
      after(250, () => {
        /* Två avläsningar bildar brickan: siffran på pappret och minnet.
           9:an får inte uppstå ur intet. */
        if (src) flyCopyIn(document.body, src, wchip, String(step.memDigit), {
          dur: 550, easing: 'cubic-bezier(0.34,1.06,0.5,1)', fixed: true,
          fontSize: '1.3rem', color: colr, endColor: colr, fade: true
        }, null);
        flyCopyIn(document.body, md || cell, wchip, String(step.carry_in), {
          dur: 550, easing: 'cubic-bezier(0.34,1.06,0.5,1)', fixed: true,
          fontSize: '1.2rem', color: '#dc2626', endColor: colr, fade: true
        }, null);
      });
      after(830, () => {
        wchip.style.opacity = '';
        wchip.style.animation = `tk-badge-in ${Ts(380)} cubic-bezier(0.34,1.3,0.4,1) both`;
        placeWork(work, step.col, row);
      });
      after(1240, cb);

    /* ── UTLYFTET (spec §4.3) ───────────────────────────────────
       Paret pulsar först — meningen pekar på DEM, sedan hoppar de ner i
       rutan. Det som dras ner är det som FAKTISKT står skrivet: minnes-
       ettan, a och b. Siffrorna på pappret blir spöken, inte borta: de
       är kvar, de räknas bara någon annanstans just nu. */
    } else if (step.type === 'add_lift') {
      highlightCol(step.col);
      if (step.merged) ['a', 'b'].forEach(r => pop(upDw(r, step.col), 300));
      openThink(step);
      after(180, () => {
        const ca = chipEl('a'), cbp = chipEl('b'), op = document.querySelector('.nf-op');
        const colr = PVC[COL_KEYS[step.col]];
        /* fixed: resan går från kortet ner till rutan — i vy-koordinater,
           annars räknas hela sträckan in i #up-lefts scrollHeight. */
        flyCopy(upDw('a', step.col), ca, String(step.a), {
          dur: 600, easing: 'cubic-bezier(0.34,1.3,0.4,1)', fixed: true,
          fontSize: '1.95rem', color: colr
        }, () => { if (ca) { ca.classList.add('in'); pop(ca, 300, 'pop'); } if (op) op.classList.add('in'); });
        flyCopy(upDw('b', step.col), cbp, String(step.b), {
          dur: 600, easing: 'cubic-bezier(0.34,1.3,0.4,1)', fixed: true,
          fontSize: '1.95rem', color: colr
        }, () => { if (cbp) { cbp.classList.add('in'); pop(cbp, 300, 'pop'); } });
        if (step.carry_in) {
          const cm = chipEl('m'), dot = document.querySelector('.nf-dot');
          const cell = upCarry(step.col);
          const md = cell && cell.querySelector('.mem-digit');
          if (md) { md.style.animationDuration = Ts(300); md.classList.add('tk-blink'); }
          if (cm) flyCopy(md || cell, cm, String(step.carry_in), {
            dur: 600, easing: 'cubic-bezier(0.34,1.3,0.4,1)', fixed: true,
            fontSize: '1.7rem', color: '#dc2626'
          }, () => { cm.classList.add('in'); pop(cm, 300, 'pop'); if (dot) dot.classList.add('in'); });
        }
      });
      after(600, () => {
        ['a', 'b'].forEach(r => {
          const cell = upCell(r, step.col), dw = upDw(r, step.col);
          if (cell) cell.classList.add('nf-vacated');
          if (dw)   dw.classList.add('nf-vacated');
        });
      });
      after(960, cb);

    /* ── BEHOVET (spec §4.5) — platsen tänds innan något fyller den. */
    } else if (step.type === 'add_need') {
      highlightCol(step.col);
      const host = step.box ? thinkCard() : null;
      const gr = step.growRow || 'a';
      /* Meningen handlar om 9:an — alltså pulsar brickan i marginalen när
         den finns, inte 8:an på pappret. */
      const wc = step.box ? null : workChip();
      pop(step.box ? chipEl(gr) : (wc || upDw(gr, step.col)), 300,
          step.box ? 'pop' : 'tk-pop');
      after(180, () => drawGhost(step.col, step.behover, host, gr));
      after(560, cb);

    /* ── LÅNET (spec §4.6) — 3:an lämnar 5:an på riktigt, så "5:an har 2
       kvar" räcker som mening. Givaren är blek tills den skrivits om:
       annars står "10 + 5" en stund och ljuger. */
    } else if (step.type === 'add_lend') {
      highlightCol(step.col);
      const ghost = ghostEl();
      const gr = step.growRow || 'a', gv = step.giveRow || 'b';
      const src = step.box ? chipEl(gv) : upDw(gv, step.col);
      const dst = ghost || (step.box ? chipEl(gr) : upCell(gr, step.col));
      const host = step.box ? thinkCard() : upWrap();
      flyCopyIn(host, src, dst, String(step.behover), {
        dur: 620, easing: 'cubic-bezier(0.25,0.46,0.45,0.94)',
        fontSize: '1.5rem', color: PVC[COL_KEYS[step.col]], sound: true
      }, () => {
        if (ghost) { ghost.classList.add('filled'); pop(ghost, 300, 'pop'); }
        const owe = step.box ? chipEl(gv) : upDw(gv, step.col);
        if (owe) owe.classList.add(step.box ? 'owing' : 'nf-owing');
        after(280, () => {
          if (step.box) {
            const chip = chipEl(gv);
            if (chip) { chip.classList.remove('owing'); chip.textContent = step.kvar; pop(chip, 300, 'pop'); }
          } else {
            const dw = upDw(gv, step.col);
            if (dw) dw.classList.remove('nf-owing');
            crossRow(gv, step.col, step.kvar);
          }
          after(420, () => {
            /* Samma textfunktion, ny mening: "5:an har 2 kvar." */
            showStepBubble({ ...step, type: 'add_left' });
            after(step.box ? 240 : 120, cb);
          });
        });
      });

    /* ── TIAN FÅR SIN EGEN MENING (spec §4.7) — lånet sugs in i 7:an och
       FÖRST därefter framträder 10-brickan. Slutsatsen sist. */
    } else if (step.type === 'add_ten_named') {
      highlightCol(step.col);
      const g = ghostEl();
      if (g) pop(g, 300, 'pop');
      after(120, absorbGhost);
      after(400, () => chipToTen(step));
      after(760, cb);

    /* ── TIAN I KOLUMNEN (korta vägen utan tankeruta) ────────────
       Samma mening, samma slutsats — men den skrivs direkt på pappret,
       för paret har aldrig lämnat kolumnen. */
    } else if (step.type === 'add_ten') {
      highlightCol(step.col);
      const wc = workChip();
      if (wc) {
        /* Finns arbetsytan slukar marginalens 9:a lånet och BLIR en tia —
           samma slutsats som chipToTen gör i rutan. Pappret skrivs om i
           samma andetag: det är där tian hör hemma. */
        after(120, absorbGhost);
        after(460, () => {
          wc.innerHTML = `<span class="tk-d">1</span><span class="tk-d">0</span>`;
          pop(wc, 320, 'tk-pop');
          const w = workEl();
          if (w) placeWork(w, step.col, w.dataset.row || step.growRow || 'a');
          crossRow(step.growRow || 'a', step.col, '10');
        });
        after(1100, cb);
        return;
      }
      crossRow(step.growRow || 'a', step.col, '10');
      const g = ghostEl();
      after(560, () => { if (g) { g.classList.add('fading'); after(320, () => g.remove()); } });
      after(900, cb);

    /* ── ÅTERVÄNDANDET (spec §4.8) ──────────────────────────────
       Tankerutan ERSÄTTER inte pappret. Här landar allt i kolumnen: 10
       under den term som fylldes, resten under den som lånade ut. Först
       när det står skrivet får summan läsas — därför kommer add_sum
       efter, inte före. */
    } else if (step.type === 'add_return') {
      highlightCol(step.col);
      ['a', 'b'].forEach(r => {
        const cell = upCell(r, step.col), dw = upDw(r, step.col);
        if (cell) cell.classList.remove('nf-vacated');
        if (dw)   dw.classList.remove('nf-vacated');
      });
      const colr = PVC[COL_KEYS[step.col]];
      const gr = step.growRow || 'a', gv = step.giveRow || 'b';
      const srcA = chipEl(gr), srcB = chipEl(gv);
      flyCopy(srcB || upWrap(), upDw(gv, step.col), String(step.kvar), {
        dur: 500, easing: 'cubic-bezier(0.25,0.46,0.45,0.94)', fixed: true,
        fontSize: '1.5rem', color: colr, endColor: '#d97706'
      }, () => crossRow(gv, step.col, step.kvar));
      if (srcB) after(40, () => { srcB.style.visibility = 'hidden'; });
      after(260, () => {
        flyCopy(srcA || upWrap(), upDw(gr, step.col), '10', {
          dur: 500, easing: 'cubic-bezier(0.25,0.46,0.45,0.94)', fixed: true,
          fontSize: '1.5rem', color: colr, endColor: '#d97706'
        }, () => crossRow(gr, step.col, '10'));
        if (srcA) after(40, () => { srcA.style.visibility = 'hidden'; });
        const r = document.querySelector('.nf-think-row');
        if (r) { r.style.transition = `opacity ${Ts(420)} var(--smooth)`; r.style.opacity = '0'; }
      });
      after(900, () => {
        const tc = thinkCard();
        if (tc) tc.classList.add('leaving');
        closeThink();
      });
      after(1420, cb);

    /* ── Summan stiger ur pappret (spec §4.9) ──────────────────
       I 10 + resten-fallet är pappret tre källor: båda siffrorna OCH
       minnessiffran. Ingenting är struket — det finns inget att stryka. */
    } else if (step.type === 'add_sum') {
      highlightCol(step.col);
      /* Marginalen har EN parkeringsplats. Arbetsytan lämnar den innan
         summebrickan tar den, annars ligger de ovanpå varandra. Brickan
         har gjort sitt: kvantiteten står skriven i kolumnen nu. */
      clearWork(true);
      riseSumChip(step.col, step.sum, paperSources(step.col, !!step.nostrike), cb);

    } else if (step.type === 'add_over9') {
      highlightCol(step.col);
      const colKey = COL_KEYS[step.col];
      ['row-a','row-b'].forEach(row => {
        const el = document.getElementById(`cell-${row}-${colKey}`);
        if (el) el.classList.add('problem-cell');
      });
      setTimeout(() => {
        ['row-a','row-b'].forEach(row => {
          const el = document.getElementById(`cell-${row}-${colKey}`);
          if (el) el.classList.remove('problem-cell');
        });
        cb();
      }, 1200);

    /* add_explain och add_cross är BORTA ur additionen (plan uppgift 6,
       steg 7). De var radfasta: texten sa "Vi tar 1 från 9" när lånet i
       själva verket togs från 2:an, och skrev 10 under fel rad. Spec §3c:s
       kedja innehåller dem inte, och stegen produceras bara av legacy-
       vägen i planAdditionColumns, som ingen körning i appen når.
       Subtraktionen har egna stegtyper och rörs inte. */

    } else if (step.type === 'add_carry_fly') {
      if (step.nextCarry && step.col + 1 < colCount) {
        if (step.chip) {
          /* Summans 1:a hör hemma i nästa kolumn — den lämnar brickan och
             åker dit. Ingen förvandling behövs: den ÄR redan en 1:a.
             Pappret under rörs inte (spec §4.11). */
          const sc = upSumChip();
          const d1 = sc && sc.querySelector('.sum-tens');
          flyBadgeDigit(d1, upCarry(step.col + 1), {
            dur: 700, easing: 'cubic-bezier(0.25,0.46,0.45,0.94)',
            fontSize: '1.5rem', color: '#ffffff', endColor: '#dc2626',
            endTransform: 'rotate(-4deg) scale(0.86)', sound: true
          }, () => {
            demoCarries[step.col + 1] = 1;
            updateCarryRow();
            after(450, cb);
          });
        } else {
          animateCarryToken(step.col, step.col + 1, () => {
            demoCarries[step.col + 1] = 1;
            updateCarryRow();
            setTimeout(cb, 300);
          });
        }
      } else {
        setTimeout(cb, 100);
      }

    } else if (step.type === 'add_result') {
      highlightCol(step.col);
      if (step.chip) {
        /* Den högra siffran åker ner i svaret och BLIR svarssiffran (spec §4.12). */
        if (step.tf) {
          /* Exakt-10-fallets kapsel har gjort sitt när paret lämnat. */
          after(150, () => {
            const cap = upCaps();
            if (cap) cap.classList.add('fading');
            after(350, () => { if (cap) cap.remove(); });
          });
        }
        flyChipToAnswer(upSumChip(), step.col, step.ans, cb);
        return;
      }
      const colKey = COL_KEYS[step.col];
      setTimeout(() => {
        const ansCell = document.getElementById(`ans-${colKey}`);
        if (ansCell) {
          ansCell.innerHTML = `<span style="color:${PVC[colKey]};animation:drop-down 0.55s ease-out both;display:inline-block">${step.ans}</span>`;
          ansCell.classList.add('filled');
          ansCell.style.borderColor = PVC[colKey];
        }
        demoAns[step.col] = step.ans;
        App.Sound.play('correct');
        setTimeout(cb, 700);
      }, 300);

    } else if (step.type === 'add_simple') {
      highlightCol(step.col);
      const colKey = COL_KEYS[step.col];
      setTimeout(() => {
        const ansCell = document.getElementById(`ans-${colKey}`);
        if (ansCell) {
          ansCell.innerHTML = `<span style="color:${PVC[colKey]};animation:drop-down 0.55s ease-out both;display:inline-block">${step.ans}</span>`;
          ansCell.classList.add('filled');
          ansCell.style.borderColor = PVC[colKey];
        }
        demoAns[step.col] = step.ans;
        App.Sound.play('correct');
        setTimeout(cb, 700);
      }, 300);

    } else if (step.type === 'add_mem_strike') {
      strikeMemDigit(step.col);
      App.Sound.play('click');
      setTimeout(cb, 600);

    } else if (step.type === 'add_overflow') {
      App.Sound.play('correct');
      setTimeout(cb, 400);

    } else if (step.type === 'sub_highlight') {
      highlightCol(step.col);
      setTimeout(cb, 50);

    } else if (step.type === 'sub_cant' || step.type === 'sub_cant_double') {
      const colKey = COL_KEYS[step.col];
      ['row-a','row-b'].forEach(row => {
        const el = document.getElementById(`cell-${row}-${colKey}`);
        if (el) el.classList.add('problem-cell');
      });
      setTimeout(() => {
        ['row-a','row-b'].forEach(row => {
          const el = document.getElementById(`cell-${row}-${colKey}`);
          if (el) el.classList.remove('problem-cell');
        });
        cb();
      }, 1100);

    } else if (step.type === 'sub_flip_borrow') {
      // Fas 1 (t=0): stryk A och B i aktiva kolumnen
      const colKey = COL_KEYS[step.col];
      const srcKey = COL_KEYS[step.srcCol];
      const dwA = document.getElementById(`dw-a-${colKey}`);
      if (dwA) {
        dwA.classList.add('crossed');
        const sp = document.createElement('span');
        sp.className = 'small-new-digit';
        sp.style.color = '#dc2626';
        sp.textContent = 0;
        dwA.appendChild(sp);
      }
      const dwB = document.getElementById(`dw-b-${colKey}`);
      if (dwB) {
        dwB.classList.add('crossed');
        const sp = document.createElement('span');
        sp.className = 'small-new-digit';
        sp.style.color = '#dc2626';
        sp.textContent = step.diff;
        dwB.appendChild(sp);
      }
      // Fas 2 (t=500ms): stryk src-kolumnen, visa srcNew
      setTimeout(() => {
        playBorrowSound();
        const srcDw = document.getElementById(`dw-a-${srcKey}`);
        if (srcDw) {
          srcDw.classList.add('crossed');
          // Ersätt befintlig digit-new (i bt-wrap, om dubbellån lämnade en) med srcNew
          const srcBtWrap = document.getElementById(`bt-wrap-${srcKey}`);
          const existing = srcBtWrap ? srcBtWrap.querySelector('.digit-new') : null;
          if (existing) {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = `display:flex;gap:3px;align-items:center;pointer-events:none;white-space:nowrap;`;
            wrapper.innerHTML =
              `<span style="color:${PVC[srcKey]};font-size:clamp(0.75rem,1.5vw,0.92rem);font-weight:900;text-decoration:line-through;opacity:0.4">${existing.textContent}</span>` +
              `<span style="color:${PVC[srcKey]};font-size:clamp(0.75rem,1.5vw,0.92rem);font-weight:900;animation:land-bounce-flex 0.45s ease-out both">${step.srcNew}</span>`;
            existing.replaceWith(wrapper);
          } else {
            const sp = document.createElement('span');
            sp.className = 'digit-new';
            sp.style.color = PVC[srcKey];
            sp.textContent = step.srcNew;
            if (srcBtWrap) srcBtWrap.appendChild(sp); else srcDw.appendChild(sp);
          }
        }
        demoEffA[step.srcCol] = step.srcNew;
        // Fas 3 (t=1000ms): token flyger + borrow-ten visas
        setTimeout(() => {
          showBorrowTen(step.col);
          animateBorrowToken(step.srcCol, step.col, null, () => {
            setTimeout(cb, 300);
          });
        }, 500);
      }, 500);

    } else if (step.type === 'sub_borrow') {
      // Mellanlån (H→T vid dubbellån) — separat steg
      playBorrowSound();
      const srcKey = COL_KEYS[step.srcCol];
      const dstKey = COL_KEYS[step.dstCol];
      const srcDw = document.getElementById(`dw-a-${srcKey}`);
      if (srcDw) {
        srcDw.classList.add('crossed');
        const sp = document.createElement('span');
        sp.className = 'digit-new';
        sp.style.color = PVC[srcKey];
        sp.textContent = step.srcNew;
        const srcBtWrap = document.getElementById(`bt-wrap-${srcKey}`);
        if (srcBtWrap) srcBtWrap.appendChild(sp); else srcDw.appendChild(sp);
      }
      demoEffA[step.srcCol] = step.srcNew;
      setTimeout(() => {
        animateBorrowToken(step.srcCol, step.dstCol, null, () => {
          const dstDw = document.getElementById(`dw-a-${dstKey}`);
          if (dstDw) {
            dstDw.classList.add('crossed');
            const sp2 = document.createElement('span');
            sp2.className = 'digit-new';
            sp2.style.color = PVC[dstKey];
            sp2.textContent = step.dstNew;
            const dstBtWrap = document.getElementById(`bt-wrap-${dstKey}`);
            if (dstBtWrap) dstBtWrap.appendChild(sp2); else dstDw.appendChild(sp2);
          }
          demoEffA[step.dstCol] = step.dstNew;
          setTimeout(cb, 300);
        });
      }, 400);

    } else if (step.type === 'sub_ten_minus') {
      highlightCol(step.col);
      const colKey = COL_KEYS[step.col];
      // Kryssa av borrow-ten-markören
      useBorrowTen(step.col);
      setTimeout(() => {
        const ansCell = document.getElementById(`ans-${colKey}`);
        if (ansCell) {
          ansCell.innerHTML = `<span style="color:${PVC[colKey]};animation:drop-down 0.55s ease-out both;display:inline-block">${step.ans}</span>`;
          ansCell.classList.add('filled');
          ansCell.style.borderColor = PVC[colKey];
        }
        demoAns[step.col] = step.ans;
        App.Sound.play('correct');
        setTimeout(cb, 700);
      }, 400);

    } else if (step.type === 'sub_calc') {
      highlightCol(step.col);
      const colKey = COL_KEYS[step.col];
      setTimeout(() => {
        const ansCell = document.getElementById(`ans-${colKey}`);
        if (ansCell) {
          ansCell.innerHTML = `<span style="color:${PVC[colKey]};animation:drop-down 0.55s ease-out both;display:inline-block">${step.diff}</span>`;
          ansCell.classList.add('filled');
          ansCell.style.borderColor = PVC[colKey];
        }
        demoAns[step.col] = step.diff;
        App.Sound.play('correct');
        setTimeout(cb, 700);
      }, 300);

    } else {
      cb();
    }
  }

  /* ── Highlight aktiv kolumn ─────────────────────────────── */
  function highlightCol(col) {
    const colKey = COL_KEYS[col];
    for (let c = 0; c < colCount; c++) {
      const ck = COL_KEYS[c];
      ['row-a','row-b'].forEach(row => {
        const el = document.getElementById(`cell-${row}-${ck}`);
        if (!el) return;
        el.classList.remove('glow-ental','glow-tiotal','glow-hundratal','dim');
        if (c === col) el.classList.add(`glow-${colKey}`);
        else el.classList.add('dim');
      });
    }
  }

  /* ── Tankebubbla ────────────────────────────────────────── */
  /* stepOverride: bubbeltexten kan bytas MITT i ett steg — lånet byter till
     "5:an har 2 kvar" när siffran skrivits om (spec §3c steg 4b). Samma
     textfunktion, ingen dubblerad sträng. */
  function showStepBubble(stepOverride) {
    /* Demon skriver i #up-bubble, övningsläget i #ex-bubble. Samma steg ska
       ge samma ord i båda — annars tappar övningen meningarna som executeStep
       skjuter in mitt i en animation (t.ex. "5:an har 2 kvar"). */
    const area = document.getElementById('up-bubble') || document.getElementById('ex-bubble');
    if (!area) return;
    const step = stepOverride || demoSteps[demoStep];
    if (!step) { area.innerHTML = ''; return; }
    const html = bubbleHTML(step);
    area.innerHTML = html ? `<div class="thought-bubble">${html}</div>` : '';
  }

  /* Ren textfunktion: ETT steg in, färdig HTML ut, inga sidoeffekter.
     Demon och övningsläget delar den, så metoden sägs med samma ord. */
  function bubbleHTML(step) {
    if (!step) return '';
    let html = '';
    if (step.type === 'add_highlight') {
      html = '';
    } else if (step.type === 'add_over9') {
      const ck = COL_KEYS[step.col];
      const ciStr = step.carry_in ? ` + <span style="color:#d97706">${step.carry_in}</span> (minne)` : '';
      html = `<span style="color:${PVC[ck]}">${step.a}</span> + <span style="color:${PVC[ck]}">${step.b}</span>${ciStr}... Hmm, det blir mer än 9! 🤔`;
    /* ── Komplementvägen, en kort mening per steg (spec §3c/§3d) ──
       Ingen aritmetik i texten som barnet måste räkna ut: 3:an lämnar
       5:an på riktigt, så "5:an har 2 kvar" räcker som mening. */
    } else if (step.type === 'add_lift') {
      const ck = COL_KEYS[step.col];
      html = `<span style="color:${PVC[ck]}">${step.a}</span> + <span style="color:${PVC[ck]}">${step.b}</span>` +
             `${step.carry_in ? ' + minnet' : ''} blir mer än 9 — vi tittar på dem en stund. 🤔`;
    } else if (step.type === 'add_need') {
      const ck = COL_KEYS[step.col];
      html = `<strong style="color:${PVC[ck]}">${step.growVal}</strong> behöver <strong style="color:${PVC[ck]}">${step.behover}</strong> för att bli <strong>10</strong>.`;
    } else if (step.type === 'add_lend') {
      const ck = COL_KEYS[step.col];
      html = `Vi lånar <strong style="color:${PVC[ck]}">${step.behover}</strong>:an från <strong style="color:${PVC[ck]}">${step.giveVal}</strong>:an.`;
    } else if (step.type === 'add_left') {
      const ck = COL_KEYS[step.col];
      html = `<strong style="color:${PVC[ck]}">${step.giveVal}</strong>:an har <strong style="color:#d97706">${step.kvar}</strong> kvar.`;
    } else if (step.type === 'add_ten_named' || step.type === 'add_ten') {
      /* ORDAGRANT samma mening i tankerutan som i kolumnen. */
      const ck = COL_KEYS[step.col];
      html = `Nu är <strong style="color:${PVC[ck]}">${step.growVal}</strong>:an en hel tia.`;
    } else if (step.type === 'add_return') {
      html = `Nu skriver vi om det i uppställningen.`;
    } else if (step.type === 'tf_pair') {
      /* Spec §3b, verbatim ur mockup:1898–1906. */
      const ck = COL_KEYS[step.col];
      if (step.memSaid) {
        /* Spec §7.2 krav 2: add_memjoin har redan talat om minnet. Kortformen,
           annars sägs samma sak två gånger i rad. */
        html = `<strong style="color:${PVC[ck]}">${step.valA}</strong> och <strong style="color:${PVC[ck]}">${step.valB}</strong> är tiokompisar — precis <strong>10</strong>! 💛`;
      } else if (step.carry_in) {
        html = `<span style="color:${PVC[ck]}">${step.memDigit}</span> plus minnet <span style="color:#d97706">${step.carry_in}</span> är <strong>${step.memNew}</strong>. Och <strong style="color:${PVC[ck]}">${step.valA}</strong> och <strong style="color:${PVC[ck]}">${step.valB}</strong> är tiokompisar — precis <strong>10</strong>! 💛`;
      } else {
        html = `<strong style="color:${PVC[ck]}">${step.a}</strong> och <strong style="color:${PVC[ck]}">${step.b}</strong> är tiokompisar — precis <strong>10</strong>! 💛`;
      }
    } else if (step.type === 'add_memjoin') {
      /* Spec §7.1 krav 1: minnet nämns FÖRE summan. */
      const ck = COL_KEYS[step.col];
      html = `Minnet gör <strong style="color:${PVC[ck]}">${step.memDigit}</strong>:an till <strong style="color:${PVC[ck]}">${step.memNew}</strong>.`;
    } else if (step.type === 'add_sum') {
      /* Spec §7.1 krav 4a: med nostrike är ingenting omskrivet, så resten
         bär kolumnens platsvärdesfärg — amber vore en lögn om lagret. */
      const ck = COL_KEYS[step.col];
      const kvarColor = step.nostrike ? PVC[ck] : '#d97706';
      html = `<strong>10</strong> och <strong style="color:${kvarColor}">${step.kvar}</strong> är <strong style="color:${PVC[ck]}">${step.sum}</strong>.`;
    } else if (step.type === 'add_carry_fly') {
      /* Summans vänstra siffra ÄR redan en 1:a — inget att förklara. */
      if (step.chip) {
        html = (step.nextCarry && step.col + 1 < colCount)
          ? `<strong style="color:#d97706">1</strong>:an åker upp som minne. 👆`
          : `<strong style="color:#d97706">1</strong>:an skrivs längst till vänster. 👆`;
      } else {
        html = `1:an skrivs som minnessiffra här 👇`;
      }
    } else if (step.type === 'add_result') {
      const ck = COL_KEYS[step.col];
      if (step.chip) {
        /* Summans högra siffra hör hemma i kolumnen — den åker dit. */
        html = `<strong style="color:${PVC[ck]}">${step.ans}</strong>:an åker ner i svaret. ✅`;
      } else {
        html = `Kvar blir <strong style="color:${PVC[ck]}">${step.kvar}</strong>. 10:an skickades upp som minnessiffra! ✅`;
      }
    } else if (step.type === 'add_simple') {
      const ck = COL_KEYS[step.col];
      if (step.a === 0 && step.b === 0 && step.carry_in) {
        // Kolumn utan siffror — svaret ÄR minnessiffran (t.ex. hundratalet i 50+98)
        html = `Bara minnessiffran är kvar — <span style="color:#d97706">${step.carry_in}</span>:an flyttas ner! ✅`;
      } else {
        const ciStr = step.carry_in ? ` + <span style="color:#d97706">${step.carry_in}</span>` : '';
        html = `<span style="color:${PVC[ck]}">${step.a}</span> + <span style="color:${PVC[ck]}">${step.b}</span>${ciStr} = <strong style="color:${PVC[ck]}">${step.sum}</strong>`;
      }
    } else if (step.type === 'add_mem_strike') {
      html = `Nu stryker vi <strong style="color:#dc2626">1</strong>:an — den är använd! Så vet vi att den inte räknas igen. ✏️`;
    } else if (step.type === 'add_overflow') {
      html = `Minnessiffran <strong style="color:${PVC.hundratal}">${step.digit}</strong> skrivs längst till vänster!`;

    } else if (step.type === 'sub_highlight') {
      const ck = COL_KEYS[step.col];
      const colName = step.col === 0 ? 'E (ental)' : step.col === 1 ? 'T (tiotal)' : 'H (hundratal)';
      if (step.a >= step.b) {
        html = `Kolumn <strong style="color:${PVC[ck]}">${colName}</strong>: <strong style="color:${PVC[ck]}">${step.a}</strong> − <strong style="color:${PVC[ck]}">${step.b}</strong> — det går! ✅`;
      } else {
        html = `Kolumn <strong style="color:${PVC[ck]}">${colName}</strong>: <strong style="color:${PVC[ck]}">${step.a}</strong> − <strong style="color:${PVC[ck]}">${step.b}</strong> — hmm...`;
      }
    } else if (step.type === 'sub_cant') {
      const ck = COL_KEYS[step.col];
      html = `<span style="color:#ef4444">⚠️ <strong style="color:${PVC[ck]}">${step.a}</strong> − <strong style="color:${PVC[ck]}">${step.b}</strong> går inte!</span><br>
        Vi lånar ett tiotal från nästa kolumn 🔄`;
    } else if (step.type === 'sub_cant_double') {
      const ck = COL_KEYS[step.col];
      html = `<span style="color:#ef4444">⚠️ <strong style="color:${PVC[ck]}">${step.a}</strong> − <strong style="color:${PVC[ck]}">${step.b}</strong> går inte!</span><br>
        Tiotalet är 0 — vi måste låna från hundratalet! 🔄`;
    } else if (step.type === 'sub_flip_borrow') {
      const ck = COL_KEYS[step.col];
      const sk = COL_KEYS[step.srcCol];
      html = `Vi vänder om: <strong style="color:${PVC[ck]}">${step.b}</strong> − <strong style="color:${PVC[ck]}">${step.a}</strong> = <strong>${step.diff}</strong>, lånar 1 från <strong style="color:${PVC[sk]}">${step.srcNew+1}</strong> → <strong style="color:${PVC[sk]}">${step.srcNew}</strong><br>
        Svaret blir <strong style="color:${PVC[ck]}">10 − ${step.diff} = ${10-step.diff}</strong> 💡`;
    } else if (step.type === 'sub_borrow') {
      const sKey = COL_KEYS[step.srcCol];
      const dKey = COL_KEYS[step.dstCol];
      html = `<span style="color:${PVC[sKey]}">${step.srcNew+1}</span> → <strong style="color:${PVC[sKey]}">${step.srcNew}</strong> (ger ett tiotal till T)<br>
        T: <span style="color:${PVC[dKey]}">${step.dstNew-10}</span> → <strong style="color:${PVC[dKey]}">${step.dstNew}</strong> ✅`;
    } else if (step.type === 'sub_ten_minus') {
      const ck = COL_KEYS[step.col];
      html = `<strong style="color:#dc2626">10</strong> − <strong style="color:${PVC[ck]}">${step.diff}</strong> = <strong style="color:${PVC[ck]}">${step.ans}</strong> ✅`;
    } else if (step.type === 'sub_calc') {
      const ck = COL_KEYS[step.col];
      html = `<strong style="color:${PVC[ck]}">${step.a}</strong> − <strong style="color:${PVC[ck]}">${step.b}</strong> = <strong style="color:${PVC[ck]}">${step.diff}</strong>`;
    } else if (step.type === 'done') {
      html = `Klart! 🎉 ${numA} ${mode==='addition'?'+':'−'} ${numB} = <strong>${mode==='addition'?numA+numB:numA-numB}</strong>`;
    }
    return html;
  }

  function refreshNextBtn() {
    const area = document.getElementById('up-next-area');
    if (area) area.innerHTML = nextBtnHTML();
  }

  function nextBtnHTML() {
    const step = demoSteps[demoStep];
    if (!step) return '';
    if (step.type === 'done') {
      return `<div style="display:flex;gap:8px">
        <button class="btn btn-primary" style="flex:1"
          onclick="UppstallningGame.startDemo()"><svg class="icn"><use href="#i-refresh"/></svg>Ny uppgift</button>
        <button class="btn btn-secondary" style="flex:1"
          onclick="UppstallningGame.showModeSelect()">Tillbaka</button>
      </div>`;
    }
    return `<button id="up-next-btn" class="btn btn-primary btn-block" onclick="UppstallningGame.demoNextStep()"
      ${stepLocked ? 'disabled' : ''}>Nästa steg <svg class="icn"><use href="#i-play"/></svg></button>`;
  }

  function lockStep() {
    stepLocked = true;
    const btn = document.getElementById('up-next-btn');
    if (btn) btn.disabled = true;
  }

  function unlockStep() {
    stepLocked = false;
    const btn = document.getElementById('up-next-btn');
    if (btn) btn.disabled = false;
  }

  /* ── Carry-rad (v30: .mem-digit — raderas ALDRIG under uppgiften) ── */
  function updateCarryRow() {
    // Skriver ENDAST till: en befintlig minnessiffra rensas eller skrivs
    // aldrig över — cellen lämnas orörd tills ny uppgift renderar om tabellen.
    for (let c = 0; c < colCount; c++) {
      const el = document.getElementById(`carry-${COL_KEYS[c]}`);
      if (!el || !demoCarries[c]) continue;
      let d = el.querySelector('.mem-digit');
      if (!d) {
        el.innerHTML = `<span class="mem-digit">${demoCarries[c]}</span>`;
        d = el.querySelector('.mem-digit');
      }
      if (demoCarryUsed[c]) strikeMemEl(d);
    }
  }

  /* ── Stryk minnessiffra: animerat snett penndrag (~250 ms) ── */
  const MEM_STRIKE_SVG = `<svg class="mem-strike" viewBox="0 0 24 24" preserveAspectRatio="none" aria-hidden="true"><path d="M3.2 20.4 C 7.5 16.8 10.4 12.2 14.2 8.6 C 16.8 6.2 19.2 4.4 21 3.2"/></svg>`;

  function strikeMemEl(d) {
    if (!d || d.classList.contains('used')) return;
    d.classList.remove('pulse');
    d.insertAdjacentHTML('beforeend', MEM_STRIKE_SVG);
    d.classList.add('used');
  }

  function strikeMemDigit(col) {
    demoCarryUsed[col] = true;
    const cell = document.getElementById(`carry-${COL_KEYS[col]}`);
    if (cell) cell.classList.remove('mem-pulse');
    strikeMemEl(cell ? cell.querySelector('.mem-digit') : null);
  }

  /* ── Borrow-ten hjälpare ────────────────────────────────── */
  function showBorrowTen(col) {
    const key = COL_KEYS[col];
    const wrap = document.getElementById(`bt-wrap-${key}`);
    if (!wrap) return;
    const el = document.createElement('div');
    el.id = `borrow-ten-${key}`;
    el.className = 'borrow-ten';
    el.textContent = '10';
    wrap.appendChild(el);
    demoBorrowTens[col] = true;
  }

  function useBorrowTen(col) {
    const key = COL_KEYS[col];
    const el = document.getElementById(`borrow-ten-${key}`);
    if (el) el.classList.add('used');
    demoBorrowTens[col] = false;
  }

  /* ── Animera carry-token ────────────────────────────────── */
  function animateCarryToken(fromCol, toCol, cb) {
    const srcKey = COL_KEYS[fromCol];
    const dstKey = COL_KEYS[toCol];
    const wrap = document.getElementById('up-table-wrap');
    const srcCell = document.getElementById(`cell-row-a-${srcKey}`) ||
                    document.getElementById(`ans-${srcKey}`);
    const dstCarry = document.getElementById(`carry-${dstKey}`);
    if (!wrap || !srcCell || !dstCarry) { setTimeout(cb, 300); return; }

    const wRect = wrap.getBoundingClientRect();
    const sRect = srcCell.getBoundingClientRect();
    const dRect = dstCarry.getBoundingClientRect();

    const token = document.createElement('div');
    token.textContent = '1';
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

  /* ── Animera borrow-token ───────────────────────────────── */
  function animateBorrowToken(srcCol, dstCol, _label, cb) {
    const srcKey = COL_KEYS[srcCol];
    const dstKey = COL_KEYS[dstCol];
    const wrap = document.getElementById('up-table-wrap');
    const srcCell = document.getElementById(`cell-row-a-${srcKey}`);
    const dstCell = document.getElementById(`cell-row-a-${dstKey}`);
    if (!wrap || !srcCell || !dstCell) { setTimeout(cb, 300); return; }

    const wRect  = wrap.getBoundingClientRect();
    const sRect  = srcCell.getBoundingClientRect();
    const dRect  = dstCell.getBoundingClientRect();

    const token = document.createElement('div');
    token.textContent = '+10';
    token.style.cssText = `position:absolute;
      left:${sRect.left - wRect.left + sRect.width/2 - 18}px;
      top:${sRect.top - wRect.top + sRect.height/2 - 14}px;
      padding:3px 7px;border-radius:999px;
      background:#fee2e2;border:2px solid #ef4444;
      font-size:0.85rem;font-weight:900;color:#dc2626;
      pointer-events:none;z-index:20;
      transition:left 0.75s cubic-bezier(0.25,0.46,0.45,0.94),
                 top 0.75s cubic-bezier(0.25,0.46,0.45,0.94);`;
    wrap.style.position = 'relative';
    wrap.appendChild(token);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      token.style.left = `${dRect.left - wRect.left + dRect.width/2 - 18}px`;
      token.style.top  = `${dRect.top  - wRect.top  + dRect.height/2 - 14}px`;
    }));

    setTimeout(() => {
      token.style.opacity = '0';
      token.style.transition += ',opacity 0.3s';
      setTimeout(() => { token.remove(); cb(); }, 350);
    }, 800);
  }

  /* ══════════════════════════════════════════════════════════
     TIOKOMPIS-GENVÄGEN — hjälpare (spec §4, mockupen är facit)
     Appen har inget fartreglage, så after()/Ts() är setTimeout och
     sekunder rakt av. De gör tiderna läsbara på ett ställe.
  ══════════════════════════════════════════════════════════ */
  /* REDUCERAD RÖRELSE ÄR MEDVETET BORTVALD HÄR — Dennis 2026-09-21.
     styles/app.css:2286–2293 nollar redan alla animationer och övergångar
     med !important när prefers-reduced-motion: reduce är på. Den regeln
     träffar brickflykterna nedan automatiskt: siffran hamnar direkt på sin
     plats, medan stegen, bubblorna och ordningen finns kvar. Degraderingen
     är alltså redan hygglig, och en egen hantering här skulle bara kunna
     göra den sämre. Det är inte en glömska. */
  const Ts    = ms => (ms / 1000).toFixed(3) + 's';
  const after = (ms, fn) => setTimeout(fn, ms);

  /* Uppslag mot appens id-schema (spec §5.3: id-schemat behålls). */
  const upWrap    = () => document.getElementById('up-table-wrap');
  const upCell    = (row, c) => document.getElementById(`cell-row-${row}-${COL_KEYS[c]}`);
  const upDw      = (row, c) => document.getElementById(`dw-${row}-${COL_KEYS[c]}`);
  const upAns     = c => document.getElementById(`ans-${COL_KEYS[c]}`);
  const upCarry   = c => document.getElementById(`carry-${COL_KEYS[c]}`);
  const upCaps    = () => document.querySelector('.tk-capsule');
  const upSumChip = () => document.querySelector('.tk-badge[data-role="sum"]');

  /* Retriggbar puls — klassen kan redan sitta kvar från ett tidigare steg. */
  function pop(el, ms, cls) {
    if (!el) return;
    const k = cls || 'tk-pop';
    el.classList.remove(k);
    void el.offsetWidth;
    el.style.animationDuration = Ts(ms || 300);
    el.classList.add(k);
  }

  /* Svarssiffran skrivs — samma markup som de befintliga grenarna. */
  function fillAnsCell(col, value, anim) {
    const el = upAns(col);
    if (!el) return;
    const key = COL_KEYS[col];
    el.innerHTML = `<span style="color:${PVC[key]};animation:${anim || 'drop-down 0.55s ease-out both'};display:inline-block">${value}</span>`;
    el.classList.add('filled');
    el.style.borderColor = PVC[key];
    demoAns[col] = value;
  }

  /* ── TANKERUTAN (spec §3c, §5.2–5.3; mockup:1413–1443) ──────────────
     Paret lyfts ut och räknas för sig. Fällan är att pappersvanan tappas
     om ALLT sker här — därför skriver add_return tillbaka strykningen och
     siffrorna i kolumnen innan summan läses av. */
  const upThink   = () => document.getElementById('up-think');
  const thinkCard = () => document.querySelector('.nf-think');
  const chipEl    = slot => document.querySelector(`.nf-chip[data-slot="${slot}"]`);
  const ghostEl   = () => document.querySelector('.nf-ghost');

  function thinkHTML(step) {
    const c = PVC[COL_KEYS[step.col]];
    /* Vid minne in dras TRE brickor ner — minnesettan står något avskild
       med en punkt, så att den läses som minnet och inte som en term. */
    const mem = step.carry_in
      ? `<span class="nf-chip nf-mem" data-slot="m" style="color:#dc2626">${step.carry_in}</span>` +
        `<span class="nf-dot">·</span>`
      : '';
    return `<div class="nf-think">
      <div class="nf-think-title">Vi räknar så här</div>
      <div class="nf-think-row">${mem}` +
      `<span class="nf-chip" data-slot="a" style="color:${c}">${step.a}</span>` +
      `<span class="nf-op">+</span>` +
      `<span class="nf-chip" data-slot="b" style="color:${c}">${step.b}</span>` +
      `</div></div>`;
  }

  function openThink(step) {
    const t = upThink();
    if (!t) return null;
    t.innerHTML = thinkHTML(step);
    t.classList.remove('off');
    void t.offsetWidth;          /* annars hoppar max-height-övergången över */
    t.classList.add('open');
    return t;
  }

  /* Rutan hör till kolumnen som räknades. Fäll ihop den när vi går vidare,
     annars står ett gammalt "7 + 5" kvar och ljuger om nuet. */
  function closeThink() {
    const t = upThink();
    if (!t) return;
    t.classList.remove('open');
    after(420, () => {
      if (!t.classList.contains('open')) { t.innerHTML = ''; t.classList.add('off'); }
    });
  }

  function absorbGhost() {
    const g = ghostEl();
    if (!g) return;
    g.classList.add('fading');
    after(320, () => g.remove());
  }

  /* ── ARBETSYTAN (uppgift 7b) ───────────────────────────────────────
     En liten rad i högermarginalen som håller kolumnens lösräknande
     INLINE: först minnets bricka, sedan spöket. Utan den skulle båda
     vilja ha rightMarginSpot och lägga sig ovanpå varandra. Ytan flyttas
     om när bredden ändras, så gruppen hålls kvar i marginalen och aldrig
     glider in över tabellen. */
  const workEl   = () => document.querySelector('.nf-work');
  const workChip = () => document.querySelector('.nf-work .tk-work');

  /* Lodrätt centrerad på den rad minnet gick till; vågrätt på samma
     parkeringsplats som spöket och summebrickan. */
  function placeWork(work, col, row) {
    const wrap = upWrap(), anchor = upCell(row || 'a', col);
    if (!wrap || !work || !anchor) return;
    const wR = wrap.getBoundingClientRect(), aR = anchor.getBoundingClientRect();
    const bb = work.getBoundingClientRect();
    work.style.top  = (aR.top - wR.top + aR.height / 2 - bb.height / 2) + 'px';
    work.style.left = rightMarginSpot(bb.width) + 'px';
  }

  function ensureWork(col, row) {
    const existing = workEl();
    if (existing && existing.dataset.col === String(col)) return existing;
    if (existing) existing.remove();
    const wrap = upWrap();
    if (!wrap) return null;
    const w = document.createElement('div');
    w.className = 'nf-work';
    w.dataset.col = String(col);
    w.dataset.row = row || 'a';
    wrap.appendChild(w);
    return w;
  }

  /* Städas som spöket: tonas bort när kolumnen lämnar marginalen, och
     sopas bort utan ceremoni när en ny kolumn tar över. */
  function clearWork(fade) {
    const w = workEl();
    if (!w) return;
    if (!fade) { w.remove(); return; }
    w.classList.add('fading');
    after(320, () => w.remove());
  }

  /* Platsen som lånet ska fylla. I rutan står den INLINE direkt efter
     grow-brickan ("7 ⟨3⟩ + 5"); finns en arbetsyta för kolumnen läggs den
     inline där i stället, så det läses "9 ⟨1⟩" precis som i rutan; annars
     läggs den vid sidan av cellen. */
  function drawGhost(col, value, hostEl, row) {
    const old = ghostEl(); if (old) old.remove();
    const g = document.createElement('div');
    g.className = 'nf-ghost';
    g.textContent = value;
    g.style.color = PVC[COL_KEYS[col]];
    g.style.animationDuration = Ts(380);
    if (hostEl) {
      const chip = hostEl.querySelector(`.nf-chip[data-slot="${row || 'a'}"]`);
      if (!chip) return null;
      g.classList.add('inline');
      chip.insertAdjacentElement('afterend', g);
      return g;
    }
    /* Korta vägen: har minnet redan lagt en bricka i marginalen ställer
       sig spöket bredvid den i stället för att ta samma punkt. */
    const work = workEl();
    if (work && work.dataset.col === String(col)) {
      g.classList.add('inline');
      work.appendChild(g);
      placeWork(work, col, work.dataset.row);
      return g;
    }
    const wrap = upWrap(), anchor = upCell(row || 'a', col);
    if (!wrap || !anchor) return null;
    const wR = wrap.getBoundingClientRect(), aR = anchor.getBoundingClientRect();
    const size = Math.round(aR.height * 0.66);
    g.style.width  = size + 'px';
    g.style.height = size + 'px';
    g.style.fontSize = Math.round(size * 0.62) + 'px';
    g.style.top  = (aR.top - wR.top + aR.height / 2 - size / 2) + 'px';
    /* ALLT lösräknande ligger på talets HÖGERSIDA, samma x hela uppgiften
       igenom — samma parkeringsplats som summebrickan. Dennis 21/9: barnen
       ska lära sig att hålla uträkningarna om talets högersida, så handen vet
       var kladden hör hemma. Tidigare gick spöket ut i vänstermarginalen för
       alla kolumner utom entalen; då låg lösa siffror på ena sidan och summan
       på den andra, och barnet fick leta på två håll. */
    g.style.left = rightMarginSpot(size) + 'px';
    wrap.appendChild(g);
    return g;
  }

  /* Grow-brickan blir en hel tia inne i rutan (mockup:1541–1548). */
  function chipToTen(step) {
    const chip = chipEl(step.growRow || 'a');
    if (!chip) return;
    chip.innerHTML = `<span class="tk-d">1</span><span class="tk-d">0</span>`;
    chip.classList.add('isten', badgeColorClass(step.col));
    pop(chip, 320, 'pop');
  }

  /* Strykning + omskrivning på PAPPRET — samma gest som appen alltid haft:
     siffran stryks och den nya skrivs liten i amber bredvid (mockup:1237–1249). */
  function crossRow(row, col, text) {
    const dw = upDw(row, col);
    if (!dw || dw.classList.contains('crossed')) return;
    dw.classList.remove('nf-vacated');
    dw.classList.add('crossed');
    const sp = document.createElement('span');
    sp.className = 'small-new-digit';
    sp.style.color = '#d97706';
    sp.textContent = text;
    sp.style.animation = `land-bounce-flex ${Ts(400)} ease-out both`;
    sp.style.animationDelay = Ts(240);
    dw.appendChild(sp);
  }

  /* Flykt i uppställningens egna koordinater (mockup:1186–1188). */
  function flyCopy(fromEl, toEl, text, opts, cb) {
    flyCopyIn(upWrap(), fromEl, toEl, text, opts, cb);
  }

  /* Kapseln runt paret (mockup:1313–1329). */
  function drawCapsule(col) {
    const wrap = upWrap(), ca = upCell('a', col), cbEl = upCell('b', col);
    if (!wrap || !ca || !cbEl) return null;
    const wR = wrap.getBoundingClientRect();
    const aR = ca.getBoundingClientRect(), bR = cbEl.getBoundingClientRect();
    const pad = 7;
    const cap = document.createElement('div');
    cap.className = 'tk-capsule';
    cap.style.left   = (aR.left - wR.left - pad) + 'px';
    cap.style.top    = (aR.top  - wR.top  - pad) + 'px';
    cap.style.width  = (aR.width + pad * 2) + 'px';
    cap.style.height = ((bR.bottom - aR.top) + pad * 2) + 'px';
    cap.style.animationDuration = Ts(380);
    wrap.appendChild(cap);
    return cap;
  }

  /* 10-brickans färg: låst till kolumnens platsvärdesfärg (mockup:1343–1348). */
  function badgeColorClass(col) {
    const key = COL_KEYS[col];
    if (key === 'ental')     return 'badge-green';
    if (key === 'hundratal') return 'badge-red';
    return 'badge-blue';
  }

  /* PARKERINGSPLATSEN: fri marginal till höger om HELA tabellen — samma x
     hela uppgiften igenom, så barnet slipper leta efter brickan. */
  function rightMarginSpot(width) {
    const wrap = upWrap();
    const table = document.querySelector('.up-table');
    if (!wrap || !table) return 2;
    const wR = wrap.getBoundingClientRect(), tR = table.getBoundingClientRect();
    const x = (tR.right - wR.left) + 8;
    return Math.max(2, Math.min(x, wR.width - width - 4));
  }

  /* Summebrickan skapas parkerad i marginalen (mockup:1350–1372). */
  function drawSumChip(col, sum) {
    const wrap = upWrap(), ca = upCell('a', col), cbEl = upCell('b', col);
    if (!wrap || !ca || !cbEl) return null;
    document.querySelectorAll('.tk-badge[data-role="sum"]').forEach(e => e.remove());
    const e = document.createElement('div');
    e.className = 'tk-badge tk-sum ' + badgeColorClass(col);
    e.dataset.role = 'sum';
    e.dataset.col  = col;
    e.innerHTML = `<span class="tk-d sum-tens">${Math.floor(sum / 10)}</span>` +
                  `<span class="tk-d sum-ones">${sum % 10}</span>`;
    e.style.animationDuration = Ts(350);
    wrap.appendChild(e);
    const wR = wrap.getBoundingClientRect();
    const aR = ca.getBoundingClientRect(), bR = cbEl.getBoundingClientRect();
    const bb = e.getBoundingClientRect();
    e.style.left = rightMarginSpot(bb.width) + 'px';
    e.style.top  = ((aR.top - wR.top) + ((bR.bottom - aR.top) / 2) - bb.height / 2) + 'px';
    return e;
  }

  /* VAD SOM STÅR SKRIVET i kolumnen just nu, att läsa av. Efter en strykning
     är det de små amber-siffrorna som gäller; i exakt-10-fallet står inget
     struket, och då ÄR de två termerna pappret (mockup:1506–1512). */
  function paperSources(col, withMem) {
    const src = ['a', 'b'].map(r => {
      const dw = upDw(r, col);
      if (!dw) return null;
      return dw.querySelector('.small-new-digit') || dw;
    });
    /* 10 + resten (spec §7.1.4b): minnessiffran ÄR en av källorna. Utan den
       läser avläsningen 9 och 4 och bildar 14 ur intet. */
    if (withMem) {
      const cell = upCarry(col);
      const md = cell && cell.querySelector('.mem-digit');
      if (md) src.push(md);
    }
    return src;
  }

  /* En KOPIA flyger, originalet står kvar (mockup:1191–1224).
     opts.fixed: flyg i VYNS koordinater — absolutpositionerade barn i
     #up-table-wrap räknas annars in i #up-lefts scrollHeight. */
  function flyCopyIn(host, fromEl, toEl, text, opts, cb) {
    const fixed = !!(opts && opts.fixed);
    const wrap = fixed ? document.body : host;
    if (!wrap || !fromEl || !toEl) { after(250, () => cb && cb()); return; }
    const wR = fixed ? { left: 0, top: 0 } : host.getBoundingClientRect();
    const sR = fromEl.getBoundingClientRect();
    const dR = toEl.getBoundingClientRect();
    const size = Math.max(28, Math.round(sR.height * 0.8));
    const f = document.createElement('div');
    f.className = 'tk-fly' + (fixed ? ' fly-fixed' : '');
    f.textContent = text;
    f.style.cssText = `left:${sR.left - wR.left + sR.width / 2 - size / 2}px;` +
      `top:${sR.top - wR.top + sR.height / 2 - size / 2}px;` +
      `width:${size}px;height:${size}px;` +
      `font-size:${opts.fontSize};color:${opts.color};` +
      `transition:left ${Ts(opts.dur)} ${opts.easing},` +
      `top ${Ts(opts.dur)} ${opts.easing},` +
      `opacity ${Ts(opts.dur)} linear,` +
      `color ${Ts(opts.dur)} linear;`;
    wrap.appendChild(f);
    if (opts.sound) playCarrySound();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      f.style.left = `${dR.left - wR.left + dR.width / 2 - size / 2}px`;
      f.style.top  = `${dR.top  - wR.top  + dR.height / 2 - size / 2}px`;
      if (opts.endColor) f.style.color = opts.endColor;
      if (opts.fade)     f.style.opacity = '0';
    }));
    after(opts.dur + 20, () => { f.remove(); cb && cb(); });
  }

  /* UR PAPPRET — summan läses av det som står skrivet. De skrivna siffrorna
     pulsar, en avläsning färdas ut i marginalen, och DÄR formas brickan.
     Siffrorna på pappret rörs aldrig: det är en avläsning, inte en flytt. */
  function riseSumChip(col, sum, srcEls, cb) {
    const chip = drawSumChip(col, sum);
    if (!chip) { after(250, () => cb && cb()); return null; }
    chip.style.animation = 'none';
    chip.style.opacity = '0';
    const src = srcEls.filter(Boolean);
    src.forEach(el => { el.style.animation = `nf-read-glow ${Ts(520)} ease-in-out both`; });
    after(200, () => {
      src.forEach(el => {
        /* Minnessiffrans kopia behåller sin röda identitet på vägen ut
           (spec §7.1.4b); de skrivna siffrorna reser i amber. */
        const isMem = el.classList && el.classList.contains('mem-digit');
        flyCopyIn(document.body, el, chip, el.textContent.trim(), {
          dur: 520, easing: 'cubic-bezier(0.34,1.06,0.5,1)', fixed: true,
          fontSize: '1.2rem', color: isMem ? '#dc2626' : '#d97706',
          endColor: PVC[COL_KEYS[col]], fade: true
        }, null);
      });
    });
    after(760, () => {
      chip.style.opacity = '';
      chip.style.animation = `tk-badge-in ${Ts(380)} cubic-bezier(0.34,1.3,0.4,1) both`;
    });
    after(1160, () => cb && cb());
    return chip;
  }

  /* Summans vänstra siffra lämnar brickan och åker upp som minnessiffra
     (mockup:1153–1183). Pappret under rörs inte. */
  function flyBadgeDigit(digitEl, toEl, opts, cb) {
    const wrap = upWrap();
    if (!wrap || !digitEl || !toEl) { after(250, () => cb && cb()); return; }
    const wR = wrap.getBoundingClientRect();
    const sR = digitEl.getBoundingClientRect();
    const dR = toEl.getBoundingClientRect();
    const size = Math.max(26, sR.width + 12);
    const f = document.createElement('div');
    f.className = 'tk-fly';
    f.textContent = digitEl.textContent;
    f.style.cssText = `left:${sR.left - wR.left + sR.width / 2 - size / 2}px;` +
      `top:${sR.top - wR.top + sR.height / 2 - size / 2}px;` +
      `width:${size}px;height:${size}px;` +
      `font-size:${opts.fontSize};color:${opts.color};` +
      `transition:left ${Ts(opts.dur)} ${opts.easing},` +
      `top ${Ts(opts.dur)} ${opts.easing},` +
      `transform ${Ts(opts.dur)} ${opts.easing},` +
      `color ${Ts(opts.dur)} linear;`;
    wrap.appendChild(f);
    digitEl.classList.add('gone');
    if (opts.sound) playCarrySound();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      f.style.left = `${dR.left - wR.left + dR.width / 2 - size / 2}px`;
      f.style.top  = `${dR.top  - wR.top  + dR.height / 2 - size / 2}px`;
      if (opts.endColor) f.style.color = opts.endColor;
      if (opts.endTransform) f.style.transform = opts.endTransform;
    }));
    after(opts.dur + 20, () => { f.remove(); cb && cb(); });
  }

  /* DEN HÖGRA SIFFRAN ÅKER NER I SVARET. Brickan KLONAS inte — samma element
     flyttas, morfar till svarssiffrans utseende och förbrukas först när
     siffran står i cellen (mockup:1374–1415). */
  function flyChipToAnswer(chip, col, value, cb) {
    const dst = upAns(col);
    if (!chip || !dst) { after(250, () => cb && cb()); return; }
    const sR = chip.getBoundingClientRect(), dR = dst.getBoundingClientRect();
    const dur = 560;
    chip.style.animation = 'none';
    chip.classList.add('fly-fixed');
    chip.style.left = sR.left + 'px';
    chip.style.top  = sR.top  + 'px';
    void chip.offsetWidth;
    chip.style.transition = `left ${Ts(dur)} cubic-bezier(0.34,1.12,0.5,1),` +
      `top ${Ts(dur)} cubic-bezier(0.34,1.12,0.5,1),` +
      `background ${Ts(280)} var(--smooth),box-shadow ${Ts(280)} var(--smooth),` +
      `color ${Ts(280)} var(--smooth),font-size ${Ts(280)} var(--smooth),` +
      `min-width ${Ts(280)} var(--smooth),padding ${Ts(280)} var(--smooth)`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      chip.style.left = `${dR.left + dR.width / 2 - chip.offsetWidth / 2}px`;
      chip.style.top  = `${dR.top  + dR.height / 2 - chip.offsetHeight / 2}px`;
    }));
    after(Math.round(dur * 0.55), () => {
      chip.style.background = 'transparent';
      chip.style.boxShadow  = 'none';
      chip.style.color      = PVC[COL_KEYS[col]];
      chip.style.padding    = '0';
      chip.style.minWidth   = '0';
      chip.style.fontSize   = '2.2rem';
    });
    after(dur + 40, () => {
      fillAnsCell(col, value, `land-bounce-flex ${Ts(360)} ease-out both`);
      chip.remove();                  /* förbrukad — siffran står i cellen */
      App.Sound.play('correct');
      after(420, () => cb && cb());
    });
  }

  /* ── Tabell HTML ────────────────────────────────────────── */
  function buildTableHTML() {
    const da = digs(numA), db = digs(numB);
    const maxC = colCount;
    const cols = [];
    for (let c = maxC - 1; c >= 0; c--) cols.push({ key: COL_KEYS[c], label: COL_LABELS[c], idx: c });

    const op = mode === 'addition' ? '+' : '−';
    const showA = c => c < String(numA).length ? da[c] : null;
    const showB = c => c < String(numB).length ? db[c] : null;

    const carryRowHTML = mode === 'addition' ? `
      <tr>
        <td style="font-size:11px;font-weight:800;color:#dc2626;text-align:right;padding-right:6px;white-space:nowrap">minne:</td>
        ${cols.map(c => `<td style="text-align:center">
          <div class="carry-cell" id="carry-${c.key}"></div>
        </td>`).join('')}
        <td></td>
      </tr>` : '';

    const rowA = cols.map(c => {
      const v = showA(c.idx);
      return `<td style="text-align:center;vertical-align:bottom">
        <div class="col-cell" id="cell-row-a-${c.key}" style="border-color:${PVC[c.key]}">
          <div class="bt-wrap" id="bt-wrap-${c.key}"></div>
          <div class="dw" id="dw-a-${c.key}">
            <span style="color:${PVC[c.key]}">${v !== null ? v : ''}</span>
          </div>
        </div>
      </td>`;
    }).join('');

    const rowB = cols.map(c => {
      const v = showB(c.idx);
      return `<td style="text-align:center">
        <div class="col-cell" id="cell-row-b-${c.key}" style="border-color:${PVC[c.key]}">
          <div class="dw" id="dw-b-${c.key}">
            <span style="color:${PVC[c.key]}">${v !== null ? v : ''}</span>
          </div>
        </div>
      </td>`;
    }).join('');

    const ansRow = cols.map(c => {
      const v = demoAns[c.idx];
      const filled = v !== null;
      return `<td style="text-align:center">
        <div class="ans-cell${filled?' filled':''}" id="ans-${c.key}"
          style="${filled?'border-color:'+PVC[c.key]+';border-style:solid':''}">
          ${filled ? `<span style="color:${PVC[c.key]}">${v}</span>` : ''}
        </div>
      </td>`;
    }).join('');

    return `
      <table class="up-table">
        <thead>
          <tr>
            <td></td>
            ${cols.map(c => `<th style="text-align:center;font-size:1.3rem;font-weight:900;color:${PVC[c.key]};padding-bottom:4px">${c.label}</th>`).join('')}
            <td></td>
          </tr>
        </thead>
        <tbody>
          ${carryRowHTML}
          <tr>
            <td></td>${rowA}<td></td>
          </tr>
          <tr>
            <td style="font-size:1.8rem;font-weight:900;color:#555;text-align:right;padding-right:6px">${op}</td>
            ${rowB}<td></td>
          </tr>
          <tr>
            <td colspan="${cols.length + 2}" style="padding:2px 0">
              <div style="height:3px;background:linear-gradient(90deg,transparent,#374151,transparent);border-radius:2px"></div>
            </td>
          </tr>
          <tr>
            <td></td>${ansRow}<td></td>
          </tr>
        </tbody>
      </table>`;
  }

  /* ══════════════════════════════════════════════════════════
     ÖVNINGSLÄGE
  ══════════════════════════════════════════════════════════ */
  /* v37: startar övningsrundan DIREKT från lägesvyn (hjälpvals-steget
     är borttaget). withHelp sätter helpMode (true = Räkna med hjälp,
     false = Räkna själv); utelämnad (resultatvyens "Spela igen")
     behålls senaste läget. Nollställningarna som tidigare låg i
     startExercise/setHelpMode är samlade här. */
  function startExercise(withHelp) {
    if (withHelp !== undefined) helpMode = withHelp;
    App.Sound.play('click');
    exerciseIdx = 0;
    exScore     = 0;
    memPerfect  = true;
    memMoments  = 0;
    newExProblem();
  }

  function newExProblem() {
    generatePair();
    exCurrentCol  = 0;
    exInputLocked = false;
    exInput       = '';
    exAnswers     = [null, null, null];
    exColData     = preprocessExSteps(buildDemoSteps());
    // Initiera delad demo-state som executeStep/highlightCol/showBorrowTen använder
    demoEffA       = [...digs(numA)];
    demoCarries    = [0, 0, 0];
    demoCarryUsed  = [false, false, false];
    demoAns        = [null, null, null, null];
    demoBorrowTens = [false, false, false];
    exTenPhase     = [0, 0, 0];
    exFreeInput        = '';
    exFreeFirstAttempt = true;
    memPhase    = null;
    freeMemVals = [null, null, null];
    freeMemUsed = [false, false, false];
    renderExLayout();
  }

  function renderExLayout() {
    const root = document.getElementById('uppstallning-root');
    const modeLabel = mode === 'addition' ? 'Addition ➕' : 'Subtraktion ➖';
    root.innerHTML = `
      <style id="up-base">${BASE_CSS}</style>
      <div class="app-header">
        <button class="btn-back" onclick="UppstallningGame.showModeSelect()">Avsluta</button>
        <span class="header-title">${modeLabel} – Övning</span>
        <span class="num" style="width:52px;text-align:right;font-family:var(--font-head);font-weight:700;font-size:15px;color:var(--ink-soft)">${exerciseIdx+1}/5</span>
      </div>
      <div id="up-main">
        <div id="up-left">
          <div id="up-table-wrap" onclick="UppstallningGame.memTableTap(event)">${buildTableHTML()}</div>
          ${helpMode ? '<div id="up-think" class="off"></div>' : ''}
          ${helpMode ? '<div id="ex-bubble"></div>' : ''}
          <div id="ex-col-ui"></div>
          <div id="ex-feedback"></div>
        </div>
        <div id="up-right">
          ${scratchHTML()}
        </div>
      </div>`;
    setupCanvas('up-canvas');
    if (helpMode) {
      advanceToColumn(0);
    } else {
      exFreeInit();
    }
  }

  function advanceToColumn(col) {
    exCurrentCol  = col;
    exInputLocked = false;
    exInput       = '';
    /* Övningsläget spelar samma kö som demon men har inget add_highlight
       som sopar mellan kolumnerna — inget lösräknande får följa med. */
    const gStale = ghostEl(); if (gStale) gStale.remove();
    clearWork(false);
    for (let c = 0; c < colCount; c++) {
      const el = document.getElementById(`ans-${COL_KEYS[c]}`);
      if (el) el.classList.toggle('active-col', c === col);
    }
    highlightCol(col);
    showExColUI(col);
  }

  function showExColUI(col) {
    const ui = document.getElementById('ex-col-ui');
    if (!ui) return;

    /* ── Free mode (utan hjälp) — renderas EN gång per uppgift ── */
    if (!helpMode) {
      ui.innerHTML = `<div style="background:var(--glass-strong);border-radius:var(--radius-md);padding:12px;border:1px solid var(--glass-line);box-shadow:var(--shadow-panel)">
        <div id="ex-free-label" style="font-size:11px;font-weight:800;text-align:center;margin-bottom:8px;text-transform:uppercase"></div>
        <div class="ex-numpad">
          ${[1,2,3,4,5,6,7,8,9,0].map(k =>
            `<button class="ex-nk" onclick="UppstallningGame.exFreePress('${k}')">${k}</button>`
          ).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="up-btn" id="ex-free-erase" onclick="UppstallningGame.exFreeErase()"
            style="width:64px;height:48px;background:var(--tint);color:var(--deep);border:2px solid color-mix(in srgb, var(--accent) 30%, transparent);font-size:1.2rem;border-radius:var(--radius-full)">⌫</button>
          <button class="up-btn" id="ex-free-submit" onclick="UppstallningGame.exFreeSubmit()" disabled
            style="flex:1;height:48px;background:linear-gradient(135deg,#cbd5e1,#94a3b8);color:#fff;font-size:1rem;border-radius:var(--radius-full)">
            Skriv svaret…</button>
        </div>
      </div>`;
      exFreeUpdateSubmit();
      return;
    }

    /* ── Help mode (med hjälp) — oförändrad ───────────── */
    const colKey      = COL_KEYS[col];
    const needsBorrow = !!(exColData[col]?.needsBorrow) && !demoBorrowTens[col];
    /* Vägvalet, inte längre needsTenFriend: kön är kolumnens metod och
       exTenPhase[col] är hur långt barnet har tagit sig i den. */
    const queue       = exColData[col]?.queue || [];
    const phase       = exTenPhase[col] || 0;

    const bubble = document.getElementById('ex-bubble');
    if (bubble) {
      const msg = exBubbleMsg(col, needsBorrow);
      bubble.innerHTML = msg ? `<div class="thought-bubble">${msg}</div>` : '';
    }

    if (needsBorrow) {
      // Subtraktion-lån (oförändrad)
      ui.innerHTML = `<button class="up-btn" id="ex-borrow-btn" onclick="UppstallningGame.exDoBorrow()"
        style="width:100%;height:58px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;font-size:1rem;border-radius:var(--radius-full);animation:borrow-glow 1.2s ease-in-out infinite;box-shadow:0 4px 12px rgba(245,158,11,0.5)">
        👆 Tryck här för att låna!</button>`;

    } else if (queue.length && phase === 0) {
      // Metoden är inte visad än — lockknappen öppnar den första gesten
      ui.innerHTML = `<button class="up-btn" id="ex-continue-btn" onclick="UppstallningGame.exTenStepNext()"
        style="width:100%;height:58px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;font-size:1rem;border-radius:var(--radius-full);animation:borrow-glow 1.2s ease-in-out infinite;box-shadow:0 4px 12px rgba(245,158,11,0.5)">
        👆 Tryck här för att se hur! 🔢</button>`;

    } else if (phase < queue.length) {
      // Mitt i metoden — ett steg per tryck, samma kedja som demon
      ui.innerHTML = `<button class="btn btn-primary btn-block" id="ex-continue-btn" onclick="UppstallningGame.exTenStepNext()">
        Nästa steg <svg class="icn"><use href="#i-play"/></svg></button>`;

    } else {
      // Metoden är genomgången (eller kolumnen gick direkt): visa numpad
      ui.innerHTML = `<div style="background:var(--glass-strong);border-radius:var(--radius-md);padding:12px;border:1px solid var(--glass-line);box-shadow:var(--shadow-panel)">
        <div style="font-size:11px;font-weight:800;color:${PVC[colKey]};text-align:center;margin-bottom:8px;text-transform:uppercase">
          Fyll i ${colKey === 'ental' ? 'entalet' : colKey === 'tiotal' ? 'tiotalet' : 'hundratalet'}
        </div>
        <div class="ex-numpad">
          ${[1,2,3,4,5,6,7,8,9,0].map(k =>
            `<button class="ex-nk" onclick="UppstallningGame.exPress('${k}')">${k}</button>`
          ).join('')}
        </div>
      </div>`;
    }
  }

  function exBubbleMsg(col, needsBorrow) {
    if (!helpMode) return '';
    const ck   = COL_KEYS[col];
    const aVal = demoEffA[col];
    const bVal = digs(numB)[col];
    const queue = exColData[col]?.queue || [];
    const phase = exTenPhase[col] || 0;
    let msg = '';

    if (needsBorrow) {
      msg = exColData[col]?.isDouble
        ? `<span style="color:#ef4444">⚠️ ${aVal} − ${bVal} går inte! Tiotalet är 0 — du behöver låna från hundratalet.</span>`
        : `<span style="color:#ef4444">⚠️ ${aVal} − ${bVal} går inte! Du behöver låna.</span>`;

    } else if (phase < queue.length) {
      /* ORDAGRANT demons text för samma steg — en idé per steg, inga egna
         formuleringar i övningsläget (spec §8). */
      msg = bubbleHTML(queue[phase]);

    } else if (queue.length) {
      /* Metoden är genomgången: summan står i marginalen, och det barnet ska
         göra är att placera dess sista siffra. Den gamla frågan "Kvar: 5 − 3
         = ?" hörde till en metod som inte lärs ut längre. */
      const sum = exColData[col]?.sum ?? queue[queue.length - 1]?.sum;
      msg = `Vad är sista siffran i <strong style="color:${PVC[ck]}">${sum}</strong>?`;

    } else if (demoBorrowTens[col]) {
      const diff = exColData[col]?.flipStep?.diff ?? (bVal - aVal + 10);
      msg = `Du lånade en 10:a! Vad är <strong style="color:#dc2626">10</strong> − <strong style="color:${PVC[ck]}">${diff}</strong>?`;

    } else if (mode === 'addition') {
      const ci    = demoCarries[col] || 0;
      const extra = ci ? ` + <span style="color:#d97706">${ci}</span> (minne)` : '';
      msg = `Vad är <strong style="color:${PVC[ck]}">${aVal}</strong> + <strong style="color:${PVC[ck]}">${bVal}</strong>${extra}?`;

    } else {
      msg = `Vad är <strong style="color:${PVC[ck]}">${aVal}</strong> − <strong style="color:${PVC[ck]}">${bVal}</strong>?`;
    }
    return msg;
  }

  function exPress(key) {
    if (exInputLocked) return;
    const fb = document.getElementById('ex-feedback');
    if (fb) fb.innerHTML = '';
    exInput = key;
    const colKey  = COL_KEYS[exCurrentCol];
    const ansCell = document.getElementById(`ans-${colKey}`);
    if (ansCell) ansCell.innerHTML = `<span style="color:${PVC[colKey]}">${key}</span>`;
    exSubmitCol();
  }

  function exSubmitCol() {
    if (exInputLocked || !exInput) return;
    exInputLocked = true;

    const correctDigit = exColData[exCurrentCol].correctAnswer;
    const colKey       = COL_KEYS[exCurrentCol];

    if (parseInt(exInput) === correctDigit) {
      exAnswers[exCurrentCol] = correctDigit;
      exInput = '';
      /* Kolumnindexet MÅSTE fångas här: allt nedan kan köra efter att
         advanceToColumn() flyttat exCurrentCol. */
      const col     = exCurrentCol;
      const next    = col + 1;
      const ansCell = document.getElementById(`ans-${colKey}`);

      const finish = () => {
        if (demoBorrowTens[col]) useBorrowTen(col);
        /* Minnet från en kolumn som gick direkt. I alla andra kolumner har
           barnet redan placerat minnet i kön (add_carry_fly) — flög det en
           gång till här blev det två minnessiffror av en. Kolumner med
           kind 'simple' har summa ≤ 9 och därmed aldrig något minne ut, så
           grenen är i praktiken en spärr: den får inte tas som en väg. */
        if (mode === 'addition' && exColData[col].nextCarry
            && exColData[col].kind === 'simple' && col + 1 < colCount) {
          setTimeout(() => {
            animateCarryToken(col, col + 1, () => {
              demoCarries[col + 1] = 1;
              updateCarryRow();
              /* Nästa kolumns fråga skrevs innan minnet landade — skriv om den,
                 annars står det "Vad är 4 + 3?" när svaret ska bli 8. */
              if (exCurrentCol === col + 1 && !exInputLocked) showExColUI(exCurrentCol);
            });
          }, 400);
        }
        smallBurst();
        const proceed = () => {
          if (next >= colCount) exCheckDone();
          else advanceToColumn(next);
        };
        if (mode === 'addition' && helpMode && demoCarries[col] === 1 && !demoCarryUsed[col]
            && col < colCount - 1) {
          // STRYKA-fas (v30): minnet i denna kolumn är nu använt — barnet stryker det.
          // Sista kolumnens minne undantas (Dennis: inget kommande att förväxla med)
          memMoments++;
          setTimeout(() => {
            memPhase = { kind:'strike', col, cont: proceed };
            const cell = document.getElementById(`carry-${COL_KEYS[col]}`);
            if (cell) {
              cell.classList.add('mem-pulse');
              const d = cell.querySelector('.mem-digit');
              if (d) d.classList.add('pulse');
            }
            const bubble = document.getElementById('ex-bubble');
            if (bubble) bubble.innerHTML = `<div class="thought-bubble">Stryk minnessiffran — den är använd! ✏️</div>`;
            const ui = document.getElementById('ex-col-ui');
            if (ui) ui.innerHTML = `<div style="font-size:12px;font-weight:800;color:#dc2626;text-align:center;padding:8px">👆 Tryck på minnessiffran för att stryka den!</div>`;
          }, 700);
        } else if (next >= colCount) {
          setTimeout(exCheckDone, 900);
        } else {
          setTimeout(() => advanceToColumn(next), 400);
        }
      };

      /* SUMMEBRICKAN ÄR SVARET (spec §8, §4.12). Ligger den kvar i marginalen
         ska den landa i cellen — annars står brickan kvar och ljuger, och
         svarssiffran föds ur intet bredvid den. Den skrivna gissningen tas
         bort först: det är brickan som blir siffran. */
      const chip = upSumChip();
      if (chip) {
        if (ansCell) { ansCell.innerHTML = ''; ansCell.classList.remove('active-col'); }
        /* Exakt-10-fallets kapsel har gjort sitt när paret lämnat — samma
           avslut som demons add_result (spec §4.12). I övningsläget kommer
           add_result aldrig, så den städningen måste ske här. */
        if (exColData[col].kind === 'exact10') {
          after(150, () => {
            const cap = upCaps();
            if (cap) cap.classList.add('fading');
            after(350, () => { if (cap) cap.remove(); });
          });
        }
        flyChipToAnswer(chip, col, correctDigit, finish);
      } else {
        App.Sound.play('correct');
        if (ansCell) {
          ansCell.innerHTML = `<span style="color:${PVC[colKey]};animation:drop-down 0.55s ease-out both;display:inline-block">${correctDigit}</span>`;
          ansCell.classList.add('filled');
          ansCell.style.borderColor = PVC[colKey];
          ansCell.classList.remove('active-col');
        }
        finish();
      }
    } else {
      App.Sound.play('wrong');
      exInput = '';
      exInputLocked = false;
      const fb = document.getElementById('ex-feedback');
      if (fb) fb.innerHTML = `<div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);
        border:2px solid #f59e0b;border-radius:12px;padding:10px;font-weight:800;
        color:#92400e;text-align:center">Hmm, prova igen! 💪</div>`;
      const ansCell = document.getElementById(`ans-${colKey}`);
      if (ansCell) ansCell.innerHTML = '';
    }
  }

  function exDoBorrow() {
    if (exInputLocked) return;
    const c = exCurrentCol;
    exInputLocked = true;
    const btn = document.getElementById('ex-borrow-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Lånar...'; }

    const colData = exColData[c];
    const flip    = colData.flipStep;
    const ck      = COL_KEYS[c];

    // Visa förklaringsbubbla (utan svar – barnet ska räkna ut det själv)
    const bubble = document.getElementById('ex-bubble');
    if (bubble && flip) {
      bubble.innerHTML = `<div class="thought-bubble">Vi vänder om: <strong style="color:${PVC[ck]}">${flip.b}</strong> − <strong style="color:${PVC[ck]}">${flip.a}</strong> = <strong>${flip.diff}</strong>. Nu måste vi räkna ut <strong style="color:#dc2626">10 − ${flip.diff}</strong> för att få svaret! 💡</div>`;
    }

    // Visa "Fortsätt"-knapp istället för tidsbaserad paus
    const ui = document.getElementById('ex-col-ui');
    if (ui) {
      ui.innerHTML = `<button class="btn btn-primary btn-block" id="ex-continue-btn" onclick="UppstallningGame.exContinueBorrow()">
        Fortsätt <svg class="icn"><use href="#i-play"/></svg></button>`;
    }
  }

  function exContinueBorrow() {
    const c       = exCurrentCol;
    const colData = exColData[c];
    const btn     = document.getElementById('ex-continue-btn');
    if (btn) btn.disabled = true;

    if (colData.isDouble) {
      executeStep(colData.interStep, () => {
        playBorrowSound();
        setTimeout(() => {
          executeStep(colData.flipStep, () => {
            exInputLocked = false;
            showExColUI(c);
          });
        }, 300);
      });
    } else {
      executeStep(colData.flipStep, () => {
        exInputLocked = false;
        showExColUI(c);
      });
    }
  }

  /* ── ETT steg i taget ur kolumnens kö (spec §8) ─────────────────────
     Ersätter exTenStep1/2/3, som var bundna till den gamla treställiga
     fasmodellen. exTenPhase[c] är nu index i kön: knappen spelar upp
     queue[phase] och räknar upp. Samma steg, samma animation och samma
     ord som demon — metoden lärs ut likadant i båda lägena. */
  function exTenStepNext() {
    if (exInputLocked) return;
    /* Kolumnen fångas HÄR, synkront: callbacken nedan kommer efter att
       advanceToColumn() kan ha flyttat exCurrentCol. */
    const c       = exCurrentCol;
    const colData = exColData[c];
    const queue   = colData?.queue || [];
    const step    = queue[exTenPhase[c] || 0];
    if (!step) { showExColUI(c); return; }

    const btn = document.getElementById('ex-continue-btn');
    if (btn) btn.disabled = true;
    exInputLocked = true;

    /* LEVANDE MINNESSIFFROR (v30): minnets flygning initieras inte av
       knappen utan av barnets tap på rätt ruta. Knappen lämnar bara över. */
    if (step.type === 'add_carry_fly' && step.nextCarry && c + 1 < colCount) {
      App.Sound.play('click');
      memMoments++;
      memPhase = { kind:'place', col: c + 1, srcCol: c };
      const cell = document.getElementById(`carry-${COL_KEYS[c + 1]}`);
      if (cell) cell.classList.add('mem-pulse');
      const bubble = document.getElementById('ex-bubble');
      if (bubble) bubble.innerHTML = `<div class="thought-bubble">Var ska minnessiffran? 🤔 Tryck på rätt ruta!</div>`;
      const ui = document.getElementById('ex-col-ui');
      if (ui) ui.innerHTML = `<div style="font-size:12px;font-weight:800;color:#dc2626;text-align:center;padding:8px">👆 Tryck på minnesrutan där 1:an ska stå!</div>`;
      return;
    }

    App.Sound.play('click');
    executeStep(step, () => {
      exTenPhase[c] = (exTenPhase[c] || 0) + 1;
      exInputLocked = false;
      showExColUI(c);
    });
  }

  /* ── Levande minnessiffror: tap-hantering (v30, endast addition) ── */
  function memTableTap(ev) {
    if (mode !== 'addition') return;
    if (!helpMode) { freeMemTap(ev); return; }
    if (!memPhase) return;
    const cellEl    = ev.target.closest ? ev.target.closest('.carry-cell') : null;
    const targetKey = COL_KEYS[memPhase.col];
    const hit       = !!(cellEl && cellEl.id === `carry-${targetKey}`);
    const fb        = document.getElementById('ex-feedback');

    if (memPhase.kind === 'place') {
      if (hit) {
        const dst = memPhase.col, src = memPhase.srcCol;
        memPhase = null;
        cellEl.classList.remove('mem-pulse');
        if (fb) fb.innerHTML = '';
        const landed = () => {
          demoCarries[dst] = 1;
          updateCarryRow();
          App.Sound.play('correct');
          smallBurst();
          exTenPhase[src] = (exTenPhase[src] || 0) + 1;
          exInputLocked = false;
          showExColUI(src);
        };
        /* Minnet kommer UR summebrickan, precis som i demon (spec §4.11):
           brickans vänstra siffra lämnar den och blir minnessiffran. Flög en
           gul token i stället stod brickan kvar med sin 1:a och pappret ljög
           om vad som hänt. animateCarryToken är kvar som reserv för kolumner
           utan bricka. */
        const sc = upSumChip();
        const d1 = sc && sc.querySelector('.sum-tens');
        if (d1) {
          flyBadgeDigit(d1, upCarry(dst), {
            dur: 700, easing: 'cubic-bezier(0.25,0.46,0.45,0.94)',
            fontSize: '1.5rem', color: '#ffffff', endColor: '#dc2626',
            endTransform: 'rotate(-4deg) scale(0.86)', sound: true
          }, landed);
        } else {
          animateCarryToken(src, dst, landed);
        }
      } else {
        // Fel tap → mild vägledning, inget poängstraff — tappa igen
        memPerfect = false;
        const t = document.getElementById(`carry-${targetKey}`);
        if (t) t.classList.add('mem-pulse');
        if (fb) fb.innerHTML = `<div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);
          border:2px solid #f59e0b;border-radius:12px;padding:10px;font-weight:800;
          color:#92400e;text-align:center">Nästan — den ska stå här 👉</div>`;
      }
    } else if (memPhase.kind === 'strike') {
      if (hit) {
        const col  = memPhase.col;
        const cont = memPhase.cont;
        memPhase = null;
        if (fb) fb.innerHTML = '';
        const bubble = document.getElementById('ex-bubble');
        if (bubble) bubble.innerHTML = `<div class="thought-bubble">Struken! Nu vet vi att den inte räknas igen. ✏️</div>`;
        strikeMemDigit(col);
        App.Sound.play('correct');
        const gen = upExGen;
        setTimeout(() => { if (gen === upExGen) cont(); }, 500);
      } else {
        memPerfect = false;
        if (fb) fb.innerHTML = `<div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);
          border:2px solid #f59e0b;border-radius:12px;padding:10px;font-weight:800;
          color:#92400e;text-align:center">Titta — 1:an är inte struken än 👀</div>`;
      }
    }
  }

  /* ── Fria läget: frivilliga minnessiffror (påverkar ALDRIG rättningen) ── */
  function freeMemTap(ev) {
    if (ev.target.closest && ev.target.closest('.mem-picker')) return; // väljarens knappar sköter sig själva
    closeMemPicker();
    const cellEl = ev.target.closest ? ev.target.closest('.carry-cell') : null;
    if (!cellEl) return;
    const col = COL_KEYS.findIndex(k => cellEl.id === `carry-${k}`);
    if (col < 0) return;
    if (freeMemVals[col] == null) {
      openMemPicker(col, cellEl);           // tom → sifferväljare 1–9
    } else if (!freeMemUsed[col]) {
      freeMemUsed[col] = true;              // skriven → stryks
      strikeMemEl(cellEl.querySelector('.mem-digit'));
      App.Sound.play('click');
    } else {
      freeMemVals[col] = null;              // struken → rensas
      freeMemUsed[col] = false;
      cellEl.innerHTML = '';
      App.Sound.play('click');
    }
  }

  function openMemPicker(col, cellEl) {
    const wrap = document.getElementById('up-table-wrap');
    if (!wrap) return;
    const p = document.createElement('div');
    p.className = 'mem-picker';
    p.id = 'mem-picker';
    p.innerHTML = [1,2,3,4,5,6,7,8,9].map(n =>
      `<button onclick="UppstallningGame.memPick(${col},${n})">${n}</button>`).join('');
    wrap.appendChild(p);
    // Klampa inom tabellytan — poppisen får aldrig skapa overflow
    const wR = wrap.getBoundingClientRect();
    const cR = cellEl.getBoundingClientRect();
    const left = Math.max(4, Math.min(cR.left - wR.left + cR.width / 2 - p.offsetWidth / 2,
      wR.width - p.offsetWidth - 4));
    let top = cR.bottom - wR.top + 6;
    if (top + p.offsetHeight > wR.height - 4) {
      top = Math.max(4, cR.top - wR.top - p.offsetHeight - 6);
    }
    p.style.left = `${left}px`;
    p.style.top  = `${top}px`;
    App.Sound.play('click');
  }

  function closeMemPicker() {
    const p = document.getElementById('mem-picker');
    if (p) p.remove();
  }

  function memPick(col, n) {
    closeMemPicker();
    freeMemVals[col] = n;
    freeMemUsed[col] = false;
    const el = document.getElementById(`carry-${COL_KEYS[col]}`);
    if (el) el.innerHTML = `<span class="mem-digit">${n}</span>`;
    App.Sound.play('click');
  }

  /* ── Glömd-minnessiffra-simulering: alla carryIn = 0 ────── */
  function simulateNoCarrySum() {
    // Kolumnsumma skrivs mod 10; carry genereras men adderas aldrig
    const da = digs(numA), db = digs(numB);
    let out = 0, mul = 1;
    for (let c = 0; c < colCount; c++) { out += ((da[c] + db[c]) % 10) * mul; mul *= 10; }
    return out;
  }

  /* ── Free mode funktioner (utan hjälp) — miniräknare ───── */
  function exFreeInit() {
    // Ersätt svarsradens per-kolumn-rutor med ETT brett svarsfält.
    // buildTableHTML lämnas orörd (hjälpläget delar den) — fria läget
    // byter bara ut sin egen svarsrad vid init.
    const firstAns = document.getElementById(`ans-${COL_KEYS[0]}`);
    const row = firstAns ? firstAns.closest('tr') : null;
    if (row) {
      row.innerHTML = `<td colspan="${colCount + 2}">
        <div class="free-field num" id="ex-free-field"><span class="free-caret"></span></div>
      </td>`;
    }
    showExColUI(0);
  }

  // Maxlängd = antal siffror i största möjliga svar (svar ≥1000 förekommer inte)
  function exFreeMaxLen() { return colCount; }

  function exFreeRender() {
    const field = document.getElementById('ex-free-field');
    if (!field) return;
    field.classList.toggle('has-digits', exFreeInput.length > 0);
    field.innerHTML = (exFreeInput ? `<span>${exFreeInput}</span>` : '') +
      '<span class="free-caret"></span>';
  }

  function exFreeShake() {
    const field = document.getElementById('ex-free-field');
    if (!field) return;
    field.classList.remove('shake');
    void field.offsetWidth; // starta om animationen
    field.classList.add('shake');
  }

  function exFreeClearWrong() {
    const field = document.getElementById('ex-free-field');
    if (field) field.classList.remove('wrong');
    const fb = document.getElementById('ex-feedback');
    if (fb) fb.innerHTML = '';
  }

  function exFreeUpdateSubmit() {
    const ready = exFreeInput.length > 0;
    const btn = document.getElementById('ex-free-submit');
    if (btn) {
      btn.disabled = !ready;
      btn.style.background = ready
        ? 'linear-gradient(135deg,var(--accent),var(--accent-light))'
        : 'linear-gradient(135deg,#cbd5e1,#94a3b8)';
      btn.textContent = ready ? 'Klar ✓' : 'Skriv svaret…';
    }
    const label = document.getElementById('ex-free-label');
    if (label) {
      label.textContent = ready ? 'Tryck Klar ✓ när du är säker' : 'Skriv svaret med siffrorna';
      label.style.color = ready ? '#16a34a' : 'var(--ink-soft)';
    }
  }

  function exFreePress(key) {
    if (exInputLocked) return;
    exFreeClearWrong();
    if (exFreeInput === '0') {
      exFreeInput = key; // miniräknar-detalj: ensam nolla ersätts
    } else if (exFreeInput.length >= exFreeMaxLen()) {
      exFreeShake(); // fullt — extra tryck ignoreras mjukt
      return;
    } else {
      exFreeInput += key; // läggs till i slutet: vänster→höger som man skriver
    }
    App.Sound.play('click');
    exFreeRender();
    exFreeUpdateSubmit();
  }

  function exFreeErase() {
    if (exInputLocked) return;
    if (!exFreeInput) return; // inget att sudda
    exFreeClearWrong();
    exFreeInput = exFreeInput.slice(0, -1); // ⌫ tar bort SISTA siffran
    App.Sound.play('click');
    exFreeRender();
    exFreeUpdateSubmit();
  }

  function exFreeSubmit() {
    if (exInputLocked) return;
    if (!exFreeInput) return; // gating: Klar kräver minst 1 siffra
    const facit = mode === 'addition' ? numA + numB : numA - numB;
    const field = document.getElementById('ex-free-field');

    if (parseInt(exFreeInput, 10) === facit) {
      // Rätt — poäng endast om helrätt på första Klar-trycket
      exInputLocked = true;
      if (exFreeFirstAttempt) exScore++;
      const dr = digs(facit);
      for (let c = 0; c < colCount; c++) exAnswers[c] = dr[c];
      exFreeClearWrong();
      if (field) {
        field.classList.add('correct');
        field.innerHTML = `<span>${exFreeInput}</span>`; // markören släcks
      }
      App.Sound.play('correct');
      smallBurst();
      setTimeout(() => exCheckDone(true), 900);
    } else {
      // Fel — förbrukar första försöket; siffrorna står kvar och kan redigeras
      exFreeFirstAttempt = false;
      App.Sound.play('wrong');
      if (field) field.classList.add('wrong');
      exFreeShake();
      // Glömd-minnessiffra-detektion (v30): matchar svaret simuleringen
      // med alla carryIn=0 → riktad feedback istället för generisk
      const glomtMinne = mode === 'addition' &&
        parseInt(exFreeInput, 10) === simulateNoCarrySum();
      const fb = document.getElementById('ex-feedback');
      if (fb) fb.innerHTML = `<div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);
        border:2px solid #f59e0b;border-radius:12px;padding:10px;font-weight:800;
        color:#92400e;text-align:center">${glomtMinne
          ? 'Nästan! Kolla minnessiffrorna — någon vill vara med! 👆'
          : 'Inte riktigt! Ändra med ⌫ och prova igen 💪'}</div>`;
      exFreeUpdateSubmit(); // siffror finns kvar → Klar förblir aktiv
    }
  }

  function exCheckDone(skipScore) {
    // skipScore=true: fria läget har redan avgjort poängen i exFreeSubmit
    const dr = digs(mode === 'addition' ? numA + numB : numA - numB);
    let correct = true;
    for (let c = 0; c < colCount; c++) {
      if (exAnswers[c] !== dr[c]) { correct = false; break; }
    }
    if (correct) { if (!skipScore) exScore++; App.Sound.play('correct'); smallBurst(); }
    else App.Sound.play('wrong');

    exerciseIdx++;
    if (exerciseIdx >= 5) {
      showExResults();
    } else {
      const toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99';
      toast.innerHTML = `<div style="background:${correct?'#dcfce7':'#fef9c3'};border:2px solid ${correct?'#22c55e':'#f59e0b'};
        border-radius:999px;padding:10px 22px;font-weight:800;color:${correct?'#166534':'#92400e'};font-size:1rem">
        ${correct ? '✅ Rätt!' : '💪 Nästa!'} Uppgift ${exerciseIdx}/5</div>`;
      document.body.appendChild(toast);
      const gen = upExGen;
      setTimeout(() => { toast.remove(); if (gen === upExGen) newExProblem(); }, 1100);
    }
  }

  function showExResults() {
    App.Sound.play(exScore >= 4 ? 'fanfare' : 'correct');
    if (exScore === 5) App.Confetti.burst(160);
    saveLog(exScore, 5);
    const root = document.getElementById('uppstallning-root');
    const emoji = exScore === 5 ? '🌟' : exScore >= 4 ? '🥇' : exScore >= 3 ? '🥈' : '💪';
    const msg   = exScore === 5 ? 'Perfekt! 🎉' : exScore >= 4 ? 'Fantastiskt!' : exScore >= 3 ? 'Jättebra!' : 'Fortsätt öva!';
    // Minnesmästare ⭐ (v30): alla placera+stryk-moment klarade utan fel-tap.
    // Aldrig något negativt vid miss — bara utebliven bonus.
    const memStar = mode === 'addition' && helpMode && memMoments > 0 && memPerfect;
    root.innerHTML = `
      <style id="up-base">${BASE_CSS}</style>
      <div class="floaties"><span style="top:7%;right:8%">✨</span><span style="bottom:12%;left:6%;animation-delay:2s">🍀</span></div>
      <div class="app-header">
        <button class="btn-back" onclick="UppstallningGame.showModeSelect()">Tillbaka</button>
        <span class="header-title">Resultat</span>
        <span style="width:52px"></span>
      </div>
      <div class="wrap" style="padding:0 12px 12px">
        <div class="result-hero">
          <div class="result-pct num">${Math.round((exScore / 5) * 100)} %</div>
          <div class="result-medal">${emoji}</div>
          <div class="result-msg">${msg}</div>
          <div class="result-note num">${exScore} av 5 rätt</div>
          ${memStar ? '<div class="mem-master">⭐ Minnesmästare!</div>' : ''}
          <div class="result-actions">
            <button class="btn btn-primary btn-lg" onclick="UppstallningGame.startExercise()">
              <svg class="icn"><use href="#i-refresh"/></svg>Spela igen</button>
            <button class="btn btn-ghost" onclick="UppstallningGame.showModeSelect()">Välj läge</button>
          </div>
        </div>
      </div>`;
    // Capybara-samlingen (v34): ren sidoeffekt EFTER resultat/logg – får aldrig kasta
    try { if (window.Capy) Capy.award(profile, { type: 'test', data: { module: 'uppstallning', pct: Math.round((exScore / 5) * 100), memStar } }); } catch (_) {}
  }

  /* ── Scratch HTML ───────────────────────────────────────── */
  function scratchHTML() {
    return `<div class="up-scratch">
      <div style="font-size:10px;font-weight:800;color:var(--deep);text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0">✏️ Kladd</div>
      <canvas id="up-canvas" class="up-canvas"></canvas>
      <div style="display:flex;gap:5px;flex-shrink:0">
        <button onclick="UppstallningGame.upToggleEraser(false)" id="up-draw"
          style="flex:1;height:30px;border-radius:10px;font-weight:800;font-size:11px;
          cursor:pointer;background:var(--accent);color:#fff;border:1.5px solid var(--accent)">🖊️ Rita</button>
        <button onclick="UppstallningGame.upToggleEraser(true)" id="up-erase"
          style="flex:1;height:30px;border-radius:10px;font-weight:800;font-size:11px;
          cursor:pointer;background:var(--tint);color:var(--deep);border:1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)">🧹 Sudd</button>
        <button onclick="UppstallningGame.upClearCanvas()"
          style="flex:1;height:30px;border-radius:10px;font-weight:800;font-size:11px;
          cursor:pointer;background:var(--tint);color:var(--deep);border:1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)">🗑️ Rensa</button>
      </div>
    </div>`;
  }

  /* ── Ljud ───────────────────────────────────────────────── */
  /* Spec §4.14: EN AudioContext, och den skapas först efter en användargest.
     Annars varnar webbläsaren i konsolen — och konsolen ska vara tom. Efter
     lånet ringer det två gånger per komplementkolumn i stället för en. */
  let upAudioCtx = null, upGestured = false;
  /* Modulen laddas också av vitest, där det inte finns något document. */
  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown', () => { upGestured = true; }, { passive: true });
  }

  function playCarrySound() {
    if (!upGestured) return;
    try {
      upAudioCtx = upAudioCtx || new (window.AudioContext || window['webkitAudioContext'])();
      const ac = upAudioCtx;
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.frequency.setValueAtTime(400, ac.currentTime);
      o.frequency.linearRampToValueAtTime(800, ac.currentTime + 0.2);
      g.gain.setValueAtTime(0.18, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
      o.start(ac.currentTime); o.stop(ac.currentTime + 0.25);
    } catch (_) {}
  }

  function playBorrowSound() {
    try {
      const ac = new (window.AudioContext || window['webkitAudioContext'])();
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle';
      o.connect(g); g.connect(ac.destination);
      o.frequency.setValueAtTime(500, ac.currentTime);
      o.frequency.linearRampToValueAtTime(250, ac.currentTime + 0.32);
      g.gain.setValueAtTime(0.2, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.38);
      o.start(ac.currentTime); o.stop(ac.currentTime + 0.38);
    } catch (_) {}
  }

  /* ── Canvas ─────────────────────────────────────────────── */
  let upResizeObs = null;

  function setupCanvas(id) {
    const el = document.getElementById(id);
    if (upResizeObs) { upResizeObs.disconnect(); upResizeObs = null; }
    upCanvas = el;
    if (!upCanvas) return;
    upErasing = false;
    requestAnimationFrame(() => {
      if (!upCanvas || !upCanvas.isConnected) return;
      const r = upCanvas.getBoundingClientRect();
      upCanvas.width  = Math.max(Math.round(r.width)  || 300, 60);
      upCanvas.height = Math.max(Math.round(r.height) || 200, 60);
      upCtx = upCanvas.getContext('2d');
      upCanvas.addEventListener('pointerdown',   upPD);
      upCanvas.addEventListener('pointermove',   upPM);
      upCanvas.addEventListener('pointerup',     upPU);
      upCanvas.addEventListener('pointercancel', upPU);
      /* Kladden flex-växer nu dynamiskt (bubblor/feedback ändrar layouten) —
         håll bitmappen i synk med CSS-ytan så pennan aldrig förvrängs. */
      if (typeof ResizeObserver !== 'undefined') {
        upResizeObs = new ResizeObserver(() => upSyncBitmap());
        upResizeObs.observe(upCanvas);
      }
    });
  }

  function upSyncBitmap() {
    if (!upCanvas || !upCtx || !upCanvas.isConnected) return;
    const w = Math.round(upCanvas.clientWidth);
    const h = Math.round(upCanvas.clientHeight);
    if (!w || !h) return;
    if (Math.abs(w - upCanvas.width) < 2 && Math.abs(h - upCanvas.height) < 2) return;
    /* Bevara det ritade: kopiera ut, ändra bitmapp, kopiera tillbaka oskalat */
    const tmp = document.createElement('canvas');
    tmp.width = upCanvas.width; tmp.height = upCanvas.height;
    tmp.getContext('2d').drawImage(upCanvas, 0, 0);
    upCanvas.width = w; upCanvas.height = h;
    upCtx.drawImage(tmp, 0, 0);
  }

  function upPD(e) {
    e.preventDefault(); upDrawing = true;
    const r = upCanvas.getBoundingClientRect();
    upLastX = (e.clientX - r.left) * (upCanvas.width / r.width);
    upLastY = (e.clientY - r.top)  * (upCanvas.height / r.height);
    upCanvas.setPointerCapture(e.pointerId);
  }

  function upPM(e) {
    if (!upDrawing || !upCtx) return;
    e.preventDefault();
    const r = upCanvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (upCanvas.width / r.width);
    const y = (e.clientY - r.top)  * (upCanvas.height / r.height);
    upCtx.globalCompositeOperation = upErasing ? 'destination-out' : 'source-over';
    upCtx.lineWidth = upErasing ? 20 : 2 + (e.pressure || 0.5) * 3;
    upCtx.strokeStyle = '#3b82f6';
    upCtx.lineCap = 'round'; upCtx.lineJoin = 'round';
    upCtx.beginPath(); upCtx.moveTo(upLastX, upLastY);
    upCtx.lineTo(x, y); upCtx.stroke();
    upLastX = x; upLastY = y;
  }

  function upPU() { upDrawing = false; }

  function upToggleEraser(on) {
    upErasing = on;
    const d = document.getElementById('up-draw');
    const e = document.getElementById('up-erase');
    if (d) { d.style.background = on ? 'var(--tint)' : 'var(--accent)'; d.style.color = on ? 'var(--deep)' : '#fff'; }
    if (e) { e.style.background = on ? 'var(--accent)' : 'var(--tint)'; e.style.color = on ? '#fff' : 'var(--deep)'; }
  }

  function upClearCanvas() {
    if (upCtx && upCanvas) upCtx.clearRect(0, 0, upCanvas.width, upCanvas.height);
  }

  /* ── Konfetti (liten burst) ─────────────────────────────── */
  function smallBurst() {
    const c = document.getElementById('confetti-container');
    if (!c) return;
    const sh = ['⭐','💫','✨','🌟','🎉','💙','💚'];
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
  function goBack() {
    document.getElementById('uppstallning-root').innerHTML = '';
    PlatsvardeGame.showSelect();
  }

  /* ── Hjälpfunktioner ────────────────────────────────────── */
  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function saveLog(score, total) {
    if (!profile) return;
    try {
      const key = LOG_KEY(profile.id);
      const log = JSON.parse(localStorage.getItem(key)) || [];
      log.unshift({ date: new Date().toISOString(), mode, difficulty, score, total });
      if (log.length > 30) log.pop();
      localStorage.setItem(key, JSON.stringify(log));
    } catch (_) {}
  }

  /* ── Publik API ─────────────────────────────────────────── */
  return {
    init, showModeSelect, setDifficulty,
    startDemo, demoNextStep,
    startExercise,
    exPress, exDoBorrow, exContinueBorrow,
    exTenStepNext,
    memTableTap, memPick,
    exFreePress, exFreeSubmit, exFreeErase,
    upToggleEraser, upClearCanvas,
    goBack,
    __test: { planAdditionColumns, exColumnPlan },
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = UppstallningGame;
