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

  /* Free mode (utan hjälp) — svaret skrivs i svarsradens EGNA celler,
     en siffra per kolumn, med start i entalet. Index 0 = ental, 1 = tiotal,
     2 = hundratal (samma ordning som digs()). null = tom ruta, och en tom
     LEDANDE ruta är tillåten — på papper lämnas den blank. */
  let exFreeCells        = [null, null, null];
  let exFreeCur          = 0;    // svarsrutan med fokus (0 = entalet)
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
  const ICON_ERASE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6H9.6a2 2 0 0 0-1.5.7L3.4 12l4.7 5.3a2 2 0 0 0 1.5.7H20a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1Z"/><path d="M17 10l-4 4M13 10l4 4"/></svg>';
  const ICON_CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12.5l5 5 10-11"/></svg>';
  const PVC = { ental: '#22c55e', tiotal: '#3b82f6', hundratal: '#ef4444' };
  const COL_KEYS   = ['ental','tiotal','hundratal'];
  const COL_LABELS = ['E','T','H'];
  const LOG_KEY    = id => `uppstallning_log_${id}`;

  /* Additionens pedagogiska vägval — Dennis 2026-09-20, utan förbehåll 21/9.
     'storsta' betyder att BÅDE komplementet och minnessiffran utgår från
     den största siffran i kolumnen: en 9:a tar 1 av en 2:a, aldrig tvärtom.
     'oversta' finns kvar som värde (hål B-testet kör memTo:'oversta'), men den
     gamla stegkedjan (add_over9/add_explain/add_cross) är borttagen — Dennis
     släppte frågan om att verifiera regeln mot matteboken. */
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
    .small-new-digit { position:absolute; bottom:2px; right:4px;
      font-size:clamp(0.58rem,1.2vw,0.78rem); font-weight:900; pointer-events:none; z-index:2; }
    /* .digit-new, .bt-wrap och .borrow-ten är borta (granskning 21/9, C1):
       lånet bodde i sidhuvudet ovanpå kolumnbokstaven. Omskrivningen bor nu
       i cellhörnet (.sub-rw) och tian i marginalen (.nf-work). */

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
    /* Hjälplägets knappsats. Storleken var clamp(40px,7vw,60px) — 7vw är 27 px
       på en 390 pt-telefon, så den klämde till 40 och passerade Apples golv på
       44 först vid 629 pt skärmbredd, alltså aldrig på en iPhone i stående.
       48 pt med 7 px mellanrum ryms med marginal: 5×48 + 4×7 = 268 av ~362.
       Fria läget överskriver width/height via .free-keys och påverkas inte. */
    .ex-numpad { display:grid; grid-template-columns:repeat(5,clamp(48px,12vw,64px)); gap:7px; justify-content:center; }
    .ex-nk { width:clamp(48px,12vw,64px); height:clamp(48px,12vw,64px); border-radius:50%;
      font-size:clamp(1.05rem,2.4vw,1.25rem); font-family:var(--font-head); font-weight:900;
      cursor:pointer; background:var(--glass-strong);
      border:1.5px solid color-mix(in srgb, var(--accent) 32%, transparent);
      color:var(--deep); transition:transform 0.2s var(--spring); }
    .ex-nk:hover { transform:scale(1.12); border-color:var(--accent); }

    /* Fria läget: svaret skrivs i svarsradens celler (v39).
       Fokusringen GLIDER mellan rutorna — flytten ska synas, inte ske tyst. */
    .ans-focus { position:absolute; pointer-events:none; z-index:6; border-radius:15px;
      border:3px solid var(--accent);
      box-shadow:0 0 0 4px color-mix(in srgb, var(--accent) 16%, transparent),
                 0 6px 16px var(--glow);
      transition:left 0.26s var(--spring), top 0.26s var(--spring),
                 width 0.26s var(--spring), height 0.26s var(--spring); }
    .ans-focus.instant { transition:none; }
    .ans-cell.hop { animation:cell-hop 0.34s var(--spring) both; }
    .ans-cell .ans-caret { display:inline-block; width:4px; height:0.62em; border-radius:2px;
      background:var(--accent); animation:caret-blink 1s steps(1) infinite; }
    /* Bedömningen syns FÖRST efter Klar — aldrig medan hon skriver. */
    .ans-cell.judged-ok { border-color:#22c55e !important; border-style:solid;
      background:rgba(34,197,94,0.14); animation:land-bounce-flex 0.45s ease-out both; }
    #up-table-wrap.shake { animation:free-shake 0.3s ease; }

    /* Fria lägets knappsats: 3×4 siffergrid + Klar som hög Enter-knapp.
       Siffran trycks tio gånger per uppgift, Klar en — ytan fördelas därefter.
       ⌫ ligger i nedersta vänstra hörnet, längst från Klar: ångra och
       lämna-in får aldrig vara grannar. */
    .free-pad { display:flex; gap:clamp(5px,1.4vw,9px); align-items:stretch; }
    .free-keys { flex:1 1 auto; display:grid; grid-template-columns:repeat(3,1fr);
      /* min(12vw,9vh): i liggande är 12vw enormt men höjden knapp —
         då styr höjden, annars bredden. Golvet 46 px gäller alltid. */
      grid-auto-rows:clamp(46px,min(12vw,9vh),60px); gap:clamp(5px,1.4vw,9px); }
    .free-keys .ex-nk { width:100%; height:100%; border-radius:16px;
      font-size:clamp(1.25rem,3.4vw,1.6rem);
      background:linear-gradient(180deg,#fff,var(--glass-strong));
      box-shadow:0 2px 0 color-mix(in srgb, var(--accent) 16%, transparent),
                 0 4px 10px rgba(93,63,158,0.07); }
    .free-keys .ex-nk:hover { transform:none; }
    .free-keys .ex-nk:active { transform:scale(0.94); box-shadow:none;
      background:color-mix(in srgb, var(--accent) 12%, #fff); }
    .free-keys .k-zero { grid-column:2 / span 2; }
    .free-keys .k-erase { color:var(--deep); background:var(--tint);
      display:grid; place-items:center; }
    .free-keys .k-erase svg { width:26px; height:26px; fill:none; stroke:currentColor;
      stroke-width:2.3; stroke-linecap:round; stroke-linejoin:round; }
    /* Klar: samma namn alltid — ytan bär tillståndet, inte etiketten. */
    .btn-klar { flex:0 0 clamp(88px,24.5vw,118px); position:relative; overflow:hidden;
      border:none; border-radius:18px; cursor:pointer;
      font-family:var(--font-head); font-weight:800; font-size:clamp(1rem,3vw,1.25rem);
      display:flex; flex-direction:column; align-items:center; justify-content:center; gap:7px;
      transition:background 0.25s var(--smooth), color 0.2s, box-shadow 0.25s var(--smooth); }
    .btn-klar svg { width:30px; height:30px; fill:none; stroke:currentColor; stroke-width:3;
      stroke-linecap:round; stroke-linejoin:round; }
    .btn-klar[disabled] { cursor:default; color:var(--deep);
      background:linear-gradient(180deg,#fff,var(--tint));
      box-shadow:inset 0 0 0 2.5px color-mix(in srgb, var(--accent) 40%, transparent),
                 0 4px 14px rgba(93,63,158,0.08); }
    .btn-klar[disabled]::after { content:''; position:absolute; inset:0; pointer-events:none;
      background:linear-gradient(170deg,transparent 38%,
        color-mix(in srgb, var(--accent) 17%, transparent) 50%, transparent 62%);
      transform:translateY(-130%); animation:klar-sheen 2.6s var(--smooth) infinite; }
    .btn-klar:not([disabled]) { color:#fff;
      background:linear-gradient(135deg,var(--accent),var(--accent-light));
      box-shadow:0 8px 22px var(--glow); }
    .btn-klar:not([disabled]):active { transform:scale(0.97); }
    .btn-klar.wake { animation:land-bounce-flex 0.42s ease-out both; }
    .btn-klar.done[disabled] { color:#fff; background:linear-gradient(135deg,#22c55e,#86efac);
      box-shadow:0 8px 22px rgba(34,197,94,0.35); }
    .btn-klar.done[disabled]::after { display:none; }

    /* Fria lägets tips efter ett felaktigt Klar. Egen klass, inte hjälplägets
       inline-stil: rutan skjuter ner knappsatsen och kladden, så varje pixel
       den tar är kladdyta. Kompakt nog att kolumnen inte börjar scrolla. */
    .free-tip { background:linear-gradient(135deg,#fff7ed,#fef3c7); border:2px solid #f59e0b;
      border-radius:12px; padding:6px 10px; font-weight:800; color:#92400e;
      text-align:center; font-size:0.88rem; line-height:1.25; }

    /* Kladden tar vid DIREKT efter knappsatsen i fria läget (porträtt):
       inget glapp mellan korten, och kortkanterna möts. Ytan som blir över
       går till ritytan — det är den barnen behöver. */
    @media (orientation:portrait) {
      #up-main.free-seam #up-left  { padding-bottom:0; gap:6px; }
      #up-main.free-seam #up-right { padding-top:0; }
      #up-main.free-seam #ex-feedback:empty { display:none; }
      #up-main.free-seam .free-pad-card { border-bottom-left-radius:0;
        border-bottom-right-radius:0; border-bottom:none; }
      #up-main.free-seam .up-scratch { border-top-left-radius:0;
        border-top-right-radius:0; padding-top:6px; }
    }

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
    @keyframes cell-hop {
      0% { transform:scale(0.86); } 55% { transform:scale(1.1); } 100% { transform:scale(1); }
    }
    @keyframes klar-sheen { 0% { transform:translateY(-130%); } 55%,100% { transform:translateY(130%); } }
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
      display:flex;align-items:center;gap:5px;width:max-content;}
    .nf-work .tk-badge.tk-work{position:static;flex:0 0 auto;
      font-size:1.35rem;padding:3px 10px;}
    .tk-badge.tk-pop{animation:tk-pop .3s var(--spring) both;}
    .nf-work.fading{transition:opacity .3s var(--smooth),transform .3s var(--smooth);
      opacity:0;transform:scale(.7);}
    /* Subtraktionens marginal: "10 − 5". Brickan får bli fixed när den
       åker ner i svaret — .nf-work .tk-work är annars static och slår
       .tk-badge.fly-fixed på specificitet. */
    .nf-work .nf-op{font-size:1.35rem;}
    .nf-work .tk-badge.tk-work.fly-fixed{position:fixed;}

    /* ══ STRIDSPLATSEN: (10 + 3) − 8 (Dennis 22/9) ══════════════════
       Parentesgruppen är en pille runt tian och försvararen, så att det
       SYNS att 10 och 3 hör ihop innan anfallet löser upp dem. När 3:an
       gått in i 8:an öppnas pillen (.open) och bara tian står kvar —
       ingenting byts ut, gruppen tonar bara bort runt brickan.

       Övergången ligger på .open, inte på basregeln, och det är avsiktligt:
       när parentesen SLÅS UPP (klassen tas bort) ska bredden vara färdig
       med en gång, annars mäter placeWork en yta som fortfarande växer och
       uttrycket hamnar utanför spalten. När den STÄNGS (klassen läggs på)
       gäller .open:s egen transition och pillen tonar lugnt bort. */
    .sub-group{display:flex;align-items:center;gap:4px;padding:3px 8px;
      border-radius:var(--radius-full);background:rgba(100,116,139,.15);
      border:2px solid rgba(100,116,139,.34);}
    .sub-group.open{background:transparent;border-color:transparent;padding:3px 0;gap:0;
      transition:background .35s var(--smooth),border-color .35s var(--smooth),
        padding .35s var(--smooth),gap .35s var(--smooth);}
    .sub-paren{font-family:var(--font-head);font-weight:800;font-size:1.6rem;color:#64748b;
      line-height:1;transition:opacity .3s var(--smooth);}
    .sub-term{font-family:var(--font-head);font-weight:800;font-size:1.35rem;line-height:1;
      display:inline-block;transition:opacity .3s var(--smooth);}
    .sub-paren.gone,.sub-term.gone,.nf-ghost.gone{opacity:0;}

    /* Den lånade tian skrivs OVANFÖR siffran den tillhör, som på papper.
       Rubrikraden får därför ett fritt band under sig i subtraktionen —
       annars hade tian lagt sig över H/T/E-bokstäverna. Måttet bor HÄR och
       inte i en style-attribut på cellen: en inline-padding vinner över
       klassregeln, och bandet hade tyst uteblivit. */
    .up-table thead th{padding-bottom:4px;}
    .up-table.sub-head thead th{padding-bottom:44px;}

    /* Talet står till VÄNSTER i subtraktionen, inte centrerat. Högerspalten
       är stridsplatsen och (10 + 3) − 8 är bredare än en centrerad tabell
       lämnar över: med tabellen mitt i skrevs uttrycket ovanpå kolumnen och
       barnet såg inte längre pappret. Additionen har inget uttryck att ge
       plats åt och står kvar centrerad. */
    .up-table.sub-head{margin-left:4px;}

    /* Subtraktionens papper: röd penna i cellhörnet, samma geometri som
       additionens .small-new-digit. En andra omskrivning stryker den
       första och ställer sig bredvid — "1̶0̶ 9" — inget byts ut. */
    .sub-rw{position:absolute;bottom:2px;right:4px;display:flex;gap:3px;align-items:baseline;
      font-size:clamp(0.58rem,1.2vw,0.78rem);font-weight:900;color:#dc2626;line-height:1;
      pointer-events:none;z-index:2;white-space:nowrap;}
    .sub-rw span{display:inline-block;}
    .sub-rw span.used{text-decoration:line-through;opacity:.45;}

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
      steps.push({ type:'add_highlight', col:c, a, b, carry_in:carryVal });
      if (sum > 9) {
        const behover = 10 - effectiveA;
        const kvar = giveVal - behover;
        /* §2.3: de nya stegen bär hela base-objektet. */
        const base = { col:c, a, b, carry_in:carryVal, effectiveA, behover, kvar,
                       ans, nextCarry, sum, growRow, giveRow, growVal, giveVal,
                       valA, valB, memRow, memDigit, memNew };
        if (isExactTen(growVal, giveVal)) {
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

  /* Ren, testbar stegbyggare för subtraktion ("vänd om"-metoden). Läser
     inget modultillstånd — samma kontrakt som planAdditionColumns. */
  function planSubtractionColumns(numA, numB, colCount) {
    const digs = n => [n % 10, Math.floor(n/10) % 10, Math.floor(n/100) % 10];
    const da = digs(numA), db = digs(numB);
    const steps = [];
    const effA = [...da];
    /* A4 (granskning 21/9): ingen skriver 045 på papper. En kolumn där både
       talen är tomma får inget steg alls, och när resten av svaret är 0 skrivs
       ingen siffra — har kolumnen ändå siffror (30 − 29: 2 − 2) får den ett
       eget steg som SÄGER att det inte blir någon siffra, så att barnet inte
       lär sig hoppa över kolumner som har något i sig. Entalen skrivs alltid. */
    const lenA = String(numA).length, lenB = String(numB).length;
    const rest = c => Math.floor((numA - numB) / Math.pow(10, c));
    for (let c = 0; c < colCount; c++) {
      if (c >= lenA && c >= lenB) break;
      const bEmpty = c >= lenB;
      if (c > 0 && rest(c) === 0) {
        if (bEmpty) break;
        steps.push({ type:'sub_highlight', col:c, a:effA[c], b:db[c] });
        steps.push({ type:'sub_zero_lead', col:c, a:effA[c], b:db[c] });
        continue;
      }
      steps.push({ type:'sub_highlight', col:c, a:effA[c], b:db[c], ...(bEmpty ? { bEmpty:true } : {}) });
      if (effA[c] < db[c]) {
        /* LÅNEKEDJAN — en idé per steg (granskning 21/9: A1, A3, B2).
           Alla steg bär col = kolumnen som inte gick (c); det är HENNES
           metod, och övningsläget plockar kön per kolumn på det fältet. */
        const a = effA[c], b = db[c], diff = b - a;
        const isDouble = c + 1 < colCount && effA[c+1] === 0 && c + 2 < colCount;
        steps.push({ type:'sub_cant', col:c, a, b, double:isDouble, srcCol: isDouble ? c+2 : c+1 });
        if (isDouble) {
          /* Tiotalet är 0 och har inget att låna ut: hundratalet lånar ut
             först (sub_lend, tian parkerar i marginalen), tian landar som
             10 på tiotalets papper (sub_land). Ett lån per steg. */
          steps.push({ type:'sub_lend', col:c, srcCol:c+2, dstCol:c+1,
            srcOld:effA[c+2], srcNew:effA[c+2]-1, toPaper:true });
          steps.push({ type:'sub_land', col:c, srcCol:c+2, dstCol:c+1, dstOld:0, dstNew:10 });
          effA[c+2]--; effA[c+1] = 10;
        }
        /* Grannen lånar ut en tia: grannen stryks och skrivs om på pappret,
           och tian hoppar RAKT till kolumnen och lägger sig ovanför siffran
           — den är inte lösräknande, den är skriven på pappret. */
        steps.push({ type:'sub_lend', col:c, srcCol:c+1, dstCol:c,
          srcOld:effA[c+1], srcNew:effA[c+1]-1, toPaper:false });
        effA[c+1]--;
        /* STRIDEN I HÖGERSPALTEN (Dennis 22/9). Vändningen ("vi vänder om:
           8 − 3 = 5") var ett trick utan motivering — femman kom ur
           ingenstans. Nu visas båda leden i (10 + a) − b = 10 − (b − a):
           sub_expr ställer upp uttrycket, sub_attack låter a ta a ur b så
           att 10 − diff står kvar. Är a = 0 hoppas båda över: det finns
           ingen försvarare som kan ta något, och (10 + 0) vore en parentes
           utan tanke — tian möter b själv (sub_take). */
        if (a > 0) {
          steps.push({ type:'sub_expr',   col:c, a, b, diff });
          steps.push({ type:'sub_attack', col:c, a, b, diff });
        } else {
          steps.push({ type:'sub_take', col:c, a, b, diff });
        }
        /* Svaret skrivs SIST, i sitt eget steg: 10 minus diff. */
        steps.push({ type:'sub_ten_minus', col:c, a, b, diff, ans:10-diff });
      } else {
        steps.push({ type:'sub_calc', col:c, a:effA[c], b:db[c], diff:effA[c]-db[c], ...(bEmpty ? { bEmpty:true } : {}) });
      }
    }
    steps.push({ type:'done' });
    return steps;
  }

  function buildDemoSteps() {
    if (mode === 'addition') {
      return planAdditionColumns(numA, numB, colCount, { ...ADD_OPTS, difficulty });
    }
    return planSubtractionColumns(numA, numB, colCount);
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
    /* Subtraktionens lånekedja: allt fram till svaret, som är barnets jobb.
       sub_ten_minus är aldrig med — brickan blir svaret när hon svarat rätt.
       sub_zero_lead (A4) visas utan att något svar krävs. */
    'sub_cant', 'sub_lend', 'sub_land', 'sub_expr', 'sub_attack', 'sub_take',
    'sub_zero_lead',
  ]);

  /* Ren klassning av EN kolumn: vilket av fallen den är, och vilka steg som
     ska spelas upp. Ersätter `needsTenFriend: !!overStep`, som blev false för
     varje kolumn så snart add_over9 slutade byggas — och då slutade
     övningsläget tyst undervisa metoden. Subtraktionen har två egna fall. */
  function exColumnPlan(steps, col) {
    const queue = steps.filter(s => s.col === col && EX_QUEUE_TYPES.has(s.type));
    const har   = t => queue.some(s => s.type === t);
    const kind  = har('tf_pair')       ? 'exact10'      /* tiokompis-genvägen */
                : har('add_need')      ? 'complement'   /* lån ur det andra talet */
                : har('add_sum')       ? 'tenPlusRest'  /* hål A: termen är redan 10 */
                : har('sub_lend')      ? 'borrow'       /* subtraktion: lånekedjan */
                : har('sub_zero_lead') ? 'zeroLead'     /* subtraktion: ledande nolla, inget svar */
                :                        'simple';      /* går direkt */
    return { kind, queue };
  }

  /* ── Preprocessa steg → per-kolumn övningsdata ──────────── */
  function preprocessExSteps(steps) {
    const result = [];
    for (let c = 0; c < colCount; c++) {
      const tenStep     = steps.find(s => s.type === 'sub_ten_minus'   && s.col === c);
      const calcStep    = steps.find(s => s.type === 'sub_calc'        && s.col === c);
      const resultStep   = steps.find(s => (s.type === 'add_result' || s.type === 'add_simple') && s.col === c);
      const { kind, queue } = exColumnPlan(steps, c);
      result[c] = {
        correctAnswer:   tenStep?.ans ?? calcStep?.diff ?? resultStep?.ans ?? 0,
        nextCarry:       resultStep?.nextCarry ?? 0,
        sum:             resultStep?.sum ?? null,
        tenStep:         tenStep     || null,   /* subtraktion: frågan "10 minus diff" */
        bEmpty:          !!calcStep?.bEmpty,    /* subtraktion: undre cellen är tom */
        kind,                      /* 'simple' | 'exact10' | 'complement' | 'tenPlusRest' | 'borrow' | 'zeroLead' */
        queue,                     /* demo-stegen, i ordning; exTenPhase[c] är index i den */
        resultStep:      resultStep  || null,
        /* A4: en kolumn utan steg finns inte på pappret (8 − 3: tiotalet) och
           en ledande nolla (30 − 29: tiotalet) får inget svar — övningen får
           aldrig fråga efter en 0:a där. */
        skip:            !steps.some(s => s.col === c),
        noAnswer:        steps.some(s => s.type === 'sub_zero_lead' && s.col === c),
      };
    }
    return result;
  }

  /* Nästa kolumn som övningen ska stanna i, eller -1 när uppgiften är klar.
     Kolumner som inte finns på pappret hoppas över utan att nämnas. */
  function exNextCol(from) {
    for (let c = from + 1; c < colCount; c++) if (!exColData[c]?.skip) return c;
    return -1;
  }

  function exProceedFrom(col) {
    const next = exNextCol(col);
    if (next < 0) exCheckDone();
    else advanceToColumn(next);
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
    /* Övningsläget spelar upp steg ur kolumnens kö. Ett saknat steg ska
       aldrig kunna krascha en körning — det hoppas över. */
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
      /* Inget lösräknande från förra kolumnen får läsas som aktuellt. */
      const gStale = ghostEl(); if (gStale) gStale.remove();
      clearWork(false);
      setTimeout(cb, 50);

    /* ── SUBTRAKTIONENS LÅNEKEDJA (granskning 21/9) ───────────────────
       Två lager, som i additionen: kolumnen är PAPPRET (strukna siffror,
       små röda omskrivningar i cellhörnet) och står still när det
       skrivits. Tian är en BRICKA — den föds ur den strukna siffran,
       flyger till marginalen och blir där det enda som rör sig. Inget
       skapas och förstörs i samma steg. */
    } else if (step.type === 'sub_cant') {
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
      }, 1100);

    /* Lånet: grannen pulsar, stryks och skrivs om på pappret; ur den
       strukna siffran föds tian som bricka och hoppar RAKT till kolumnen
       till höger, där den lägger sig ovanför siffran. Omvägen ut till
       marginalen och tillbaka är borta (Dennis 22/9: två rörelser för en
       händelse) — tian tillhör pappret, inte lösräknandet.
       När den landat byter meningen till vad pappret nu säger. */
    } else if (step.type === 'sub_lend') {
      highlightCol(step.col);
      pop(upDw('a', step.srcCol), 300);
      after(250, () => {
        playBorrowSound();
        subRewrite('a', step.srcCol, step.srcNew);
        demoEffA[step.srcCol] = step.srcNew;
        const chip = bornTenChip(step.srcCol, step.dstCol);
        const w = chip && workEl();
        if (w) w.dataset.place = 'above';
      });
      after(700, () => flyWorkToSpot(step.dstCol, 600));
      after(1340, () => showStepBubble({ ...step, type: 'sub_left' }));
      after(1600, cb);

    /* Dubbellånets landning: tian ovanför tiotalet går in i cellen och
       BLIR det som står skrivet där — 0:an stryks, "10" skrivs. Brickan
       föddes i förra steget och förbrukas först när siffran står. */
    } else if (step.type === 'sub_land') {
      highlightCol(step.col);
      const work = workEl();
      if (!work) { subRewrite('a', step.dstCol, step.dstNew); demoEffA[step.dstCol] = step.dstNew; after(600, cb); return; }
      pop(workChip(), 300, 'tk-pop');
      after(200, () => flyWorkTo(work, upDw('a', step.dstCol), 600));
      after(850, () => {
        subRewrite('a', step.dstCol, step.dstNew);
        demoEffA[step.dstCol] = step.dstNew;
        work.remove();
        showStepBubble({ ...step, type: 'sub_landed' });
      });
      after(1350, cb);

    /* ── STRIDEN I HÖGERSPALTEN (Dennis 22/9) ──────────────────────────
       Kolumnen är pappret; högerspalten är stridsplatsen. När lånet är
       klart hoppar de inblandade talen dit ut och gör upp där, och först
       svaret återvänder ner i svarscellen.

       sub_expr: tian lämnar pappret och tar plats i högerspalten, och
       försvararen och anfallaren följer efter som kopior — originalen står
       kvar i kolumnen, för det som är skrivet ska stå kvar (P5). Kvar står
       (10 + 3) − 8, med parentesen som en synlig grupp. */
    } else if (step.type === 'sub_expr') {
      highlightCol(step.col);
      const work = workEl();
      if (!work) { after(300, cb); return; }
      const colr = PVC[COL_KEYS[step.col]];
      work.dataset.place = '';              /* tian går ut till stridsplatsen */
      flyWorkToSpot(step.col, 600);
      after(680, () => { subBuildExpr(work, step.col, step.a, step.b); flyWorkToSpot(step.col, 260, false); });
      after(880, () => {
        ['a', 'b'].forEach(r => { const dw = upDw(r, step.col); if (dw) dw.style.animation = `nf-read-glow ${Ts(520)} ease-in-out both`; });
        const dst = { a: work.querySelector('.sub-term[data-slot="a"]'), b: ghostEl() };
        ['a', 'b'].forEach(r => flyCopyIn(document.body, upDw(r, step.col), dst[r], String(step[r]), {
          dur: 520, easing: 'cubic-bezier(0.34,1.06,0.5,1)', fixed: true,
          fontSize: '1.2rem', color: colr, endColor: colr, fade: true
        }, null));
      });
      after(1300, () => ['a', 'b'].forEach(r => { const dw = upDw(r, step.col); if (dw) dw.style.animation = ''; }));
      after(1420, () => {
        const ta = work.querySelector('.sub-term[data-slot="a"]');
        if (ta) { ta.classList.remove('gone'); pop(ta, 320, 'tk-pop'); }
        const g = ghostEl();
        if (g) { g.classList.remove('gone'); g.classList.add('filled'); pop(g, 320, 'pop'); }
      });
      after(1820, cb);

    /* sub_attack: försvararen lämnar parentesen och går in i anfallaren.
       3 av 8:an förbrukas och 5:an SYNS uppstå ur samma siffra — den byts
       mitt i pulsen, det är inte en ny siffra som skrivs dit. Parentesen
       öppnas i samma rörelse, och kvar står 10 − 5 åt sub_ten_minus. */
    } else if (step.type === 'sub_attack') {
      highlightCol(step.col);
      const work = workEl();
      if (!work) { after(300, cb); return; }
      const grp = work.querySelector('.sub-group');
      const ta  = work.querySelector('.sub-term[data-slot="a"]');
      const g   = ghostEl();
      pop(ta, 320, 'tk-pop');
      after(320, () => {
        /* Samma nod hela vägen: trean flyttas med transform, den skapas
           aldrig om på vägen (P5). */
        if (ta && g) {
          const tR = ta.getBoundingClientRect(), gR = g.getBoundingClientRect();
          ta.style.transition = `transform ${Ts(520)} cubic-bezier(0.34,1.06,0.5,1), opacity ${Ts(260)} var(--smooth)`;
          void ta.offsetWidth;
          ta.style.transform =
            `translate(${gR.left + gR.width / 2 - (tR.left + tR.width / 2)}px,` +
            `${gR.top + gR.height / 2 - (tR.top + tR.height / 2)}px) scale(0.8)`;
        }
        if (grp) grp.classList.add('open');
        work.querySelectorAll('.sub-paren').forEach(e => e.classList.add('gone'));
        const plus = work.querySelector('.sub-group .nf-op');
        if (plus) plus.classList.remove('in');
      });
      after(870, () => {
        if (ta) ta.classList.add('gone');
        playBorrowSound();
        if (g) { pop(g, 340, 'pop'); after(150, () => { g.textContent = step.diff; }); }
      });
      after(1200, () => {
        if (ta) ta.remove();
        work.querySelectorAll('.sub-paren').forEach(e => e.remove());
        const plus = work.querySelector('.sub-group .nf-op');
        if (plus) plus.remove();
        /* Uttrycket krympte när parentesen och försvararen försvann, men
           ytan står kvar på sub_exprs bredare x. Utan omsättning hamnar
           10 − 5 kant i kant med E-cellen och luften mot tabellen som
           varje annat steg har försvinner. Stridsplatsen ska ligga i
           marginalen hela vägen, inte bara när uttrycket är som bredast. */
        flyWorkToSpot(step.col, 220, false);
      });
      after(1500, cb);

    /* a = 0: det finns ingen försvarare som kan ta något ur anfallaren, och
       (10 + 0) vore en parentes utan tanke. Tian går ut till stridsplatsen
       och möter åttan själv: "10 − 8". */
    } else if (step.type === 'sub_take') {
      highlightCol(step.col);
      const work = workEl();
      const colr = PVC[COL_KEYS[step.col]];
      if (work) work.dataset.place = '';
      flyWorkToSpot(step.col, 600);
      after(680, () => {
        subDrawOp(step.col);
        const g = drawGhost(step.col, step.diff, null, 'a');
        if (g) g.classList.add('gone');
        flyWorkToSpot(step.col, 260, false);
      });
      after(880, () => {
        const dw = upDw('b', step.col);
        if (dw) dw.style.animation = `nf-read-glow ${Ts(520)} ease-in-out both`;
        flyCopyIn(document.body, dw, ghostEl(), String(step.b), {
          dur: 520, easing: 'cubic-bezier(0.34,1.06,0.5,1)', fixed: true,
          fontSize: '1.2rem', color: colr, endColor: colr, fade: true
        }, null);
      });
      after(1300, () => { const dw = upDw('b', step.col); if (dw) dw.style.animation = ''; });
      after(1420, () => {
        const g = ghostEl();
        if (g) { g.classList.remove('gone'); g.classList.add('filled'); pop(g, 320, 'pop'); }
      });
      after(1780, cb);

    /* Svaret sist: differensen sugs in i tian, brickan blir svarssiffran
       och åker ner i cellen (samma avslut som additionens add_result). */
    } else if (step.type === 'sub_ten_minus') {
      highlightCol(step.col);
      subCollapseTen(step.col, step.ans, cb);

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

    /* A4: kolumnen har siffror men svaret är en ledande nolla (30 − 29).
       Ingen siffra skrivs — steget finns för att SÄGA det. */
    } else if (step.type === 'sub_zero_lead') {
      highlightCol(step.col);
      ['a', 'b'].forEach(r => pop(upDw(r, step.col), 300));
      setTimeout(cb, 900);

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
      /* Steget markerade kolumnen men sa ingenting, så tankerutan blev tom
         när barnet tryckte fram det — ett dött steg mitt i kedjan. Det får
         samma kolumnöppning som subtraktionen redan har. Öppningen DÖMER
         inte: nästa steg är det som avgör om talet går eller behöver
         tiokompisen. Här sägs bara var vi står. */
      const ck = COL_KEYS[step.col];
      const colName = step.col === 0 ? 'E (ental)' : step.col === 1 ? 'T (tiotal)' : 'H (hundratal)';
      html = `Kolumn <strong style="color:${PVC[ck]}">${colName}</strong>: ` +
             `<strong style="color:${PVC[ck]}">${step.a}</strong> + ` +
             `<strong style="color:${PVC[ck]}">${step.b}</strong>` +
             `${step.carry_in ? ' + minnet' : ''}`;
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
      if (step.bEmpty) {
        /* A4: undre cellen är tom — då finns inget "− 0" att läsa upp. */
        html = `Kolumn <strong style="color:${PVC[ck]}">${colName}</strong>: <strong style="color:${PVC[ck]}">${step.a}</strong>:an står ensam — inget att ta bort.`;
      } else if (step.a >= step.b) {
        html = `Kolumn <strong style="color:${PVC[ck]}">${colName}</strong>: <strong style="color:${PVC[ck]}">${step.a}</strong> − <strong style="color:${PVC[ck]}">${step.b}</strong> — det går! ✅`;
      } else {
        html = `Kolumn <strong style="color:${PVC[ck]}">${colName}</strong>: <strong style="color:${PVC[ck]}">${step.a}</strong> − <strong style="color:${PVC[ck]}">${step.b}</strong> — hmm...`;
      }
    /* ── Lånekedjan: en kort mening per steg, ETT namn på lånet (B1):
       det som lånas är "en tia", brickan säger 10, och sedan heter den
       "tian". Ingen uträkning i texten — resultatet sägs, barnet räknar
       inte (P6). Svaret nämns först i sub_ten_minus, där det skrivs.

       BERÄTTELSEN BOR I VERBEN (Dennis 22/9). Övre radens siffror
       försvarar, undre radens anfaller — därför lånar man: försvararen är
       för svag och kallar in förstärkning från grannen till vänster.
       Metaforen bärs av att raderna beter sig olika, inte av att ordet
       upprepas; varje mening är lika kort som eller kortare än den den
       ersätter. Och verbet måste ha täckning i bilden: står det "skickar
       över" ska något flyga, står det "tar av" ska något minska synligt. */
    } else if (step.type === 'sub_cant') {
      const ck = COL_KEYS[step.col];
      html = step.double
        ? `<strong style="color:${PVC[ck]}">${step.a}</strong>:an klarar inte <strong style="color:${PVC[ck]}">${step.b}</strong>:an — och tiotalet har inget att låna ut.`
        : `<strong style="color:${PVC[ck]}">${step.a}</strong>:an klarar inte <strong style="color:${PVC[ck]}">${step.b}</strong>:an — vi måste låna.`;
    } else if (step.type === 'sub_lend') {
      const sk = COL_KEYS[step.srcCol];
      html = step.toPaper
        ? `<strong style="color:${PVC[sk]}">${step.srcOld}</strong>:an skickar en tia till tiotalet.`
        : `<strong style="color:${PVC[sk]}">${step.srcOld}</strong>:an skickar över en tia.`;
    } else if (step.type === 'sub_left') {
      const sk = COL_KEYS[step.srcCol];
      html = `<strong style="color:${PVC[sk]}">${step.srcOld}</strong>:an har <strong style="color:#dc2626">${step.srcNew}</strong> kvar.`;
    } else if (step.type === 'sub_land') {
      html = `Tian landar hos tiotalet.`;
    } else if (step.type === 'sub_landed') {
      html = `Nu står det <strong style="color:#dc2626">${step.dstNew}</strong> i tiotalet.`;
    } else if (step.type === 'sub_expr') {
      /* Dennis 22/9, ordagrant. Steget är uppställningen av uttrycket och
         inget annat — vad det blir sägs i nästa steg, när det syns. */
      const ck = COL_KEYS[step.col];
      html = `Nu har vi (<strong style="color:${PVC[ck]}">10</strong> + <strong style="color:${PVC[ck]}">${step.a}</strong>) − <strong style="color:${PVC[ck]}">${step.b}</strong>.`;
    } else if (step.type === 'sub_attack') {
      /* Dennis 21/9: "Vi vänder om: 8 − 3 = 5" förklarade aldrig VARFÖR vi
         vände, och femman dök upp ur ingenstans. Nu säger meningen vem som
         gör vad, och båda talen den nämner ändras framför ögonen på barnet:
         3:an far in i 8:an, och 8:an blir en 5:a. Dennis bild är att de
         "anfaller" — rörelsen bär den, texten behöver inte ordet. */
      const ck = COL_KEYS[step.col];
      html = `<strong style="color:${PVC[ck]}">${step.a}</strong>:an tar <strong style="color:${PVC[ck]}">${step.a}</strong> av <strong style="color:${PVC[ck]}">${step.b}</strong>:an — <strong style="color:${PVC[ck]}">${step.diff}</strong> står kvar.`;
    } else if (step.type === 'sub_take') {
      /* a = 0: ingen försvarare att skicka in, tian får klara sig själv. */
      const ck = COL_KEYS[step.col];
      html = `Tian möter <strong style="color:${PVC[ck]}">${step.b}</strong>:an själv.`;
    } else if (step.type === 'sub_ten_minus') {
      /* Dennis 21/9: namnge tian som DEN LÅNADE — det knyter ihop steget
         med brickan i högerspalten och med lånet några steg tidigare. */
      const ck = COL_KEYS[step.col];
      html = `Och nu använder vi lånetian! <strong style="color:${PVC[ck]}">10</strong> − <strong style="color:${PVC[ck]}">${step.diff}</strong> = <strong style="color:${PVC[ck]}">${step.ans}</strong>`;
    } else if (step.type === 'sub_calc') {
      const ck = COL_KEYS[step.col];
      html = step.bEmpty
        ? `<strong style="color:${PVC[ck]}">${step.a}</strong>:an skrivs ner som den är.`
        : `<strong style="color:${PVC[ck]}">${step.a}</strong> − <strong style="color:${PVC[ck]}">${step.b}</strong> = <strong style="color:${PVC[ck]}">${step.diff}</strong>`;
    } else if (step.type === 'sub_zero_lead') {
      const ck = COL_KEYS[step.col];
      html = `<strong style="color:${PVC[ck]}">${step.a}</strong> − <strong style="color:${PVC[ck]}">${step.b}</strong> är 0 — här blir det ingen siffra.`;
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

  /* animateBorrowToken ("+10"-tokenen som teleporterade, granskning 21/9 A2)
     är borta: tian är nu EN bricka som föds ur den strukna siffran
     (bornTenChip) och flyger som helhet (flyWorkToSpot/flyWorkTo). */

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

  /* ── TIANS PLATS ÄR PAPPRET, INTE MARGINALEN (Dennis 22/9) ──────────
     Regeln "allt lösräknande ligger på talets högersida" gäller fullt ut.
     Den lånade tian är inget undantag från den — den är inte lösräknande.
     Den är SKRIVEN PÅ PAPPRET, och på papper skrivs den ovanför siffran
     den tillhör. Därför ligger den över cellen: kolumnen är pappret,
     högerspalten är stridsplatsen. Först när talen ska göra upp hoppar
     de ut till högerspalten (sub_expr/sub_take), och där stannar allt
     räknande tills svaret återvänder ner i svarscellen.

     Ytan bär valet i dataset.place, så att varje befintlig ompositionering
     (drawGhost, subCollapseTen, flyWorkToSpot) hamnar rätt av sig själv.
     Additionen sätter aldrig flaggan och rör sig inte ur marginalen. */
  function placeWork(work, col, row) {
    if (work && work.dataset.place === 'above') return placeWorkAbove(work, col);
    const wrap = upWrap(), anchor = upCell(row || 'a', col);
    if (!wrap || !work || !anchor) return;
    const wR = wrap.getBoundingClientRect(), aR = anchor.getBoundingClientRect();
    const bb = work.getBoundingClientRect();
    work.style.top  = (aR.top - wR.top + aR.height / 2 - bb.height / 2) + 'px';
    work.style.left = rightMarginSpot(bb.width) + 'px';
  }

  /* Ovanför den mottagande cellen, i det fria bandet under rubrikraden
     (.up-table.sub-head). Det är BRICKANS mitt som ankras över cellens
     mitt — inte ytans — så att tian står rakt över sin siffra även när
     resten av ett uttryck hänger med på ytan. */
  function placeWorkAbove(work, col) {
    const wrap = upWrap(), cell = upCell('a', col);
    if (!wrap || !work || !cell) return;
    const wR = wrap.getBoundingClientRect(), cR = cell.getBoundingClientRect();
    const bb = work.getBoundingClientRect();
    const chip = work.querySelector('.tk-work');
    const cb = chip ? chip.getBoundingClientRect() : bb;
    const mitt = (cb.left - bb.left) + cb.width / 2;
    const left = (cR.left - wR.left) + cR.width / 2 - mitt;
    work.style.left = Math.max(2, Math.min(left, wR.width - bb.width - 2)) + 'px';
    work.style.top  = (cR.top - wR.top - bb.height - 4) + 'px';
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

  /* ── SUBTRAKTIONENS PAPPER OCH BRICKA (granskning 21/9) ─────────────
     Pappret: strykning + omskrivning med röd penna i cellens hörn. En andra
     omskrivning i samma cell stryker den första och ställer sig bredvid:
     "1̶0̶ 9". Inget objekt byts ut (D4) — spåret står kvar hela uppgiften. */
  function subRewrite(row, col, text) {
    const dw = upDw(row, col);
    if (!dw) return null;
    dw.classList.add('crossed');
    let box = dw.querySelector('.sub-rw');
    if (!box) {
      box = document.createElement('span');
      box.className = 'sub-rw';
      dw.appendChild(box);
    } else {
      box.querySelectorAll('span').forEach(s => s.classList.add('used'));
    }
    const s = document.createElement('span');
    s.textContent = text;
    s.style.animation = `land-bounce-flex ${Ts(400)} ease-out both`;
    box.appendChild(s);
    return s;
  }

  /* Brickan: tian FÖDS ur den strukna siffran. Arbetsytan (.nf-work, samma
     som additionens korta väg) ställs över källcellen med brickan i sig och
     hoppar sedan som helhet till sin plats — brickan är ett och samma
     objekt från födsel till dess den blir svarssiffran. Färgen är
     MOTTAGARENS platsvärdesfärg: det är tio av hennes enheter.

     Brickan föds redan inuti .sub-group, fast öppen (genomskinlig). Utan
     den skulle sub_expr behöva flytta brickan in i gruppen, och en flyttad
     nod är en nod som tas bort och skapas igen i samma steg (P5). Nu växer
     parentesen bara omkring en bricka som står still. */
  function bornTenChip(srcCol, dstCol) {
    const wrap = upWrap(), src = upCell('a', srcCol);
    if (!wrap || !src) return null;
    const work = ensureWork(dstCol, 'a');
    if (!work) return null;
    work.innerHTML = '';
    work.style.transition = 'none';
    const grp = document.createElement('div');
    grp.className = 'sub-group open';
    const chip = document.createElement('div');
    chip.className = 'tk-badge tk-work ' + badgeColorClass(dstCol);
    chip.innerHTML = '<span class="tk-d">1</span><span class="tk-d">0</span>';
    chip.style.animationDuration = Ts(380);
    grp.appendChild(chip);
    work.appendChild(grp);
    const wR = wrap.getBoundingClientRect(), sR = src.getBoundingClientRect();
    const bb = work.getBoundingClientRect();
    work.style.left = (sR.left - wR.left + sR.width / 2 - bb.width / 2) + 'px';
    work.style.top  = (sR.top  - wR.top  + sR.height / 2 - bb.height / 2) + 'px';
    return chip;
  }

  /* Hela arbetsytan flyger (brickan följer med som barn). */
  function flyWorkTo(work, targetEl, dur) {
    const wrap = upWrap();
    if (!work || !targetEl || !wrap) return;
    const wR = wrap.getBoundingClientRect(), tR = targetEl.getBoundingClientRect();
    const bb = work.getBoundingClientRect();
    work.style.transition = `left ${Ts(dur)} cubic-bezier(0.34,1.06,0.5,1), top ${Ts(dur)} cubic-bezier(0.34,1.06,0.5,1)`;
    void work.offsetWidth;
    work.style.left = (tR.left - wR.left + tR.width / 2 - bb.width / 2) + 'px';
    work.style.top  = (tR.top  - wR.top  + tR.height / 2 - bb.height / 2) + 'px';
    after(dur + 40, () => { work.style.transition = ''; });
  }

  /* Flytta ytan till sin plats för kolumnen — ovanför cellen eller ute i
     högerspalten, beroende på dataset.place. Hette flyWorkToMargin när
     marginalen var enda platsen. */
  function flyWorkToSpot(col, dur, pulsa) {
    const work = workEl();
    if (!work) return;
    work.style.transition = `left ${Ts(dur)} cubic-bezier(0.34,1.06,0.5,1), top ${Ts(dur)} cubic-bezier(0.34,1.06,0.5,1)`;
    void work.offsetWidth;
    placeWork(work, col, 'a');
    after(dur + 40, () => {
      work.style.transition = '';
      if (pulsa !== false) pop(workChip(), 300, 'tk-pop');
    });
  }

  /* ── UTTRYCKET ( 10 + 3 ) − 8 ───────────────────────────────────────
     Byggs RUNT tian, som redan står i .sub-group: parentesen och plusset
     skjuts in före och efter brickan, och gruppen stängs (pillen syns) så
     att 10 och 3 läses som ett. Slottarna föds tomma — siffrorna kommer
     flygande från pappret, de uppstår inte i rutan. Platsvärdesfärg på
     båda, precis som i kolumnen. */
  function subBuildExpr(work, col, a, b) {
    const grp  = work && work.querySelector('.sub-group');
    const chip = grp && grp.querySelector('.tk-work');
    if (!grp || !chip) return null;
    const colr = PVC[COL_KEYS[col]];
    const spann = (cls, txt) => {
      const e = document.createElement('span');
      e.className = cls;
      e.textContent = txt;
      return e;
    };
    grp.insertBefore(spann('sub-paren', '('), chip);
    const plus = spann('nf-op', '+');
    grp.appendChild(plus);
    const ta = spann('sub-term gone', a);
    ta.dataset.slot = 'a';
    ta.style.color = colr;
    grp.appendChild(ta);
    grp.appendChild(spann('sub-paren', ')'));
    grp.classList.remove('open');
    requestAnimationFrame(() => plus.classList.add('in'));
    /* Anfallaren står utanför parentesen: "… ) − 8". */
    subDrawOp(col);
    const g = drawGhost(col, b, null, 'a');
    if (g) g.classList.add('gone');
    return g;
  }

  /* Minustecknet mellan tian och differensen: "10 − 5" ska läsas som en
     uträkning, inte som talet 105. `:scope >` är inte kosmetik — plusset
     inne i parentesen är också en .nf-op, och en osållad querySelector
     hade rivit det uttryck vi just byggt. */
  function subDrawOp(col) {
    const work = workEl();
    if (!work || work.dataset.col !== String(col)) return null;
    const old = work.querySelector(':scope > .nf-op'); if (old) old.remove();
    const op = document.createElement('span');
    op.className = 'nf-op';
    op.textContent = '−';
    work.appendChild(op);
    requestAnimationFrame(() => op.classList.add('in'));
    return op;
  }

  /* 10 minus diff: differensen sugs in i tian, brickan blir svarssiffran
     och åker ner i cellen. Demon och övningsläget delar den — i övningen
     är det barnets rätta siffra som utlöser den (spec §8: brickan ÄR svaret). */
  function subCollapseTen(col, ans, cb) {
    const chip = workChip();
    if (!chip) { fillAnsCell(col, ans); App.Sound.play('correct'); after(700, () => cb && cb()); return; }
    const g = ghostEl(), op = document.querySelector('.nf-work > .nf-op');
    if (g) pop(g, 300, 'pop');
    after(120, () => {
      absorbGhost();
      if (op) { op.classList.remove('in'); after(320, () => op.remove()); }
    });
    after(460, () => {
      chip.innerHTML = `<span class="tk-d">${ans}</span>`;
      pop(chip, 320, 'tk-pop');
      const w = workEl(); if (w) placeWork(w, col, 'a');
    });
    after(900, () => flyChipToAnswer(chip, col, ans, () => { clearWork(false); cb && cb(); }));
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
      <table class="up-table${mode === 'addition' ? '' : ' sub-head'}">
        <thead>
          <tr>
            <td></td>
            ${cols.map(c => `<th style="text-align:center;font-size:1.3rem;font-weight:900;color:${PVC[c.key]}">${c.label}</th>`).join('')}
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
    // Initiera delad demo-state som executeStep/highlightCol använder
    demoEffA       = [...digs(numA)];
    demoCarries    = [0, 0, 0];
    demoCarryUsed  = [false, false, false];
    demoAns        = [null, null, null, null];
    exTenPhase     = [0, 0, 0];
    exFreeCells        = [null, null, null];
    exFreeCur          = 0;
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
      <div id="up-main"${helpMode ? '' : ' class="free-seam"'}>
        <div id="up-left">
          <div id="up-table-wrap" onclick="UppstallningGame.memTableTap(event)">${buildTableHTML()}${
            helpMode ? '' : '<div class="ans-focus" id="ans-focus" style="display:none"></div>'}</div>
          ${helpMode ? '<div id="up-think" class="off"></div>' : ''}
          ${helpMode ? '<div id="ex-bubble"></div>' : ''}
          ${/* Fria läget: bedömningen hamnar UNDER uppställningen, så att
                knappsatsen och kladden sitter ihop utan glapp. */ ''}
          ${helpMode ? '<div id="ex-col-ui"></div><div id="ex-feedback"></div>'
                     : '<div id="ex-feedback"></div><div id="ex-col-ui"></div>'}
        </div>
        <div id="up-right">
          ${scratchHTML(!helpMode)}
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
      /* Ingen rubrik över knappsatsen: rutorna, fokusringen och den
         blinkande markören säger redan vad som ska göras, och raden
         kostade höjd som kladden behöver bättre (Dennis 21/9). */
      ui.innerHTML = `<div class="free-pad-card" style="background:var(--glass-strong);border-radius:var(--radius-md);padding:6px;border:1px solid var(--glass-line);box-shadow:var(--shadow-panel)">
        <div class="free-pad">
          <div class="free-keys">
            ${[1,2,3,4,5,6,7,8,9].map(k =>
              `<button class="ex-nk" onclick="UppstallningGame.exFreePress('${k}')">${k}</button>`
            ).join('')}
            <button class="ex-nk k-erase" aria-label="Sudda sista siffran"
              onclick="UppstallningGame.exFreeErase()">${ICON_ERASE}</button>
            <button class="ex-nk k-zero" onclick="UppstallningGame.exFreePress('0')">0</button>
          </div>
          <button class="btn-klar" id="ex-free-submit" disabled
            onclick="UppstallningGame.exFreeSubmit()">${ICON_CHECK}<span>Klar</span></button>
        </div>
      </div>`;
      exFreeUpdateSubmit();
      return;
    }

    /* ── Help mode (med hjälp) ─────────────────────────── */
    const colKey      = COL_KEYS[col];
    /* Vägvalet, inte längre needsTenFriend: kön är kolumnens metod och
       exTenPhase[col] är hur långt barnet har tagit sig i den. Subtraktionens
       lån går samma väg (granskning 21/9, punkt 9) — lånaknappen och
       exDoBorrow/exContinueBorrow är borta. */
    const queue       = exColData[col]?.queue || [];
    const phase       = exTenPhase[col] || 0;

    const bubble = document.getElementById('ex-bubble');
    if (bubble) {
      const msg = exBubbleMsg(col);
      bubble.innerHTML = msg ? `<div class="thought-bubble">${msg}</div>` : '';
    }

    if (queue.length && phase === 0 && exColData[col]?.noAnswer) {
      // Ledande nolla (A4): bara ett steg att se, inget att lära ut
      ui.innerHTML = `<button class="btn btn-primary btn-block" id="ex-continue-btn" onclick="UppstallningGame.exTenStepNext()">
        Nästa steg <svg class="icn"><use href="#i-play"/></svg></button>`;

    } else if (queue.length && phase === 0) {
      // Metoden är inte visad än — lockknappen öppnar den första gesten
      ui.innerHTML = `<button class="up-btn" id="ex-continue-btn" onclick="UppstallningGame.exTenStepNext()"
        style="width:100%;height:58px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;font-size:1rem;border-radius:var(--radius-full);animation:borrow-glow 1.2s ease-in-out infinite;box-shadow:0 4px 12px rgba(245,158,11,0.5)">
        👆 Tryck här för att se hur! 🔢</button>`;

    } else if (phase < queue.length) {
      // Mitt i metoden — ett steg per tryck, samma kedja som demon
      ui.innerHTML = `<button class="btn btn-primary btn-block" id="ex-continue-btn" onclick="UppstallningGame.exTenStepNext()">
        Nästa steg <svg class="icn"><use href="#i-play"/></svg></button>`;

    } else if (exColData[col]?.noAnswer) {
      /* A4: ledande nolla — steget är visat, ingen siffra ska skrivas.
         Vidare av sig själv; låset hindrar dubbla timers om vyn ritas om. */
      ui.innerHTML = '';
      if (!exInputLocked) {
        exInputLocked = true;
        setTimeout(() => { exInputLocked = false; exProceedFrom(col); }, 700);
      }

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

  function exBubbleMsg(col) {
    if (!helpMode) return '';
    const ck   = COL_KEYS[col];
    const aVal = demoEffA[col];
    const bVal = digs(numB)[col];
    const queue = exColData[col]?.queue || [];
    const phase = exTenPhase[col] || 0;
    let msg = '';

    if (phase < queue.length) {
      /* ORDAGRANT demons text för samma steg — en idé per steg, inga egna
         formuleringar i övningsläget (spec §8). */
      msg = bubbleHTML(queue[phase]);

    } else if (queue.length && exColData[col]?.noAnswer) {
      /* A4: ledande nolla — inget att fråga efter. Stegets ord står kvar
         tills nästa kolumn tar över; annars faller kolumnen ner i låne-
         frågan och säger "Vad är 10 minus 0?" (fynd i hjälplägesrundan). */
      msg = bubbleHTML(queue[queue.length - 1]);

    } else if (queue.length && exColData[col]?.kind === 'borrow') {
      /* Lånekedjan är genomgången: "10 − 5" står i marginalen och det barnet
         ska göra är att säga vad tian har kvar. Samma ord som demons
         sub_ten_minus, som fråga. */
      const diff = exColData[col]?.tenStep?.diff ?? (bVal - aVal);
      msg = `Vad är <strong style="color:${PVC[ck]}">10</strong> minus <strong style="color:${PVC[ck]}">${diff}</strong>?`;

    } else if (queue.length) {
      /* Metoden är genomgången: summan står i marginalen, och det barnet ska
         göra är att placera dess sista siffra. Den gamla frågan "Kvar: 5 − 3
         = ?" hörde till en metod som inte lärs ut längre. */
      const sum = exColData[col]?.sum ?? queue[queue.length - 1]?.sum;
      msg = `Vad är sista siffran i <strong style="color:${PVC[ck]}">${sum}</strong>?`;

    } else if (mode === 'addition') {
      const ci    = demoCarries[col] || 0;
      const extra = ci ? ` + <span style="color:#d97706">${ci}</span> (minne)` : '';
      msg = `Vad är <strong style="color:${PVC[ck]}">${aVal}</strong> + <strong style="color:${PVC[ck]}">${bVal}</strong>${extra}?`;

    } else if (exColData[col]?.bEmpty) {
      /* A4: undre cellen är tom — fråga inte efter "3 − 0". */
      msg = `Inget under <strong style="color:${PVC[ck]}">${aVal}</strong>:an — vad skrivs här?`;

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
      const next    = exNextCol(col);
      const ansCell = document.getElementById(`ans-${colKey}`);

      const finish = () => {
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
        const proceed = () => exProceedFrom(col);
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
        } else if (next < 0) {
          setTimeout(exCheckDone, 900);
        } else {
          setTimeout(() => advanceToColumn(next), 400);
        }
      };

      /* SUMMEBRICKAN ÄR SVARET (spec §8, §4.12). Ligger den kvar i marginalen
         ska den landa i cellen — annars står brickan kvar och ljuger, och
         svarssiffran föds ur intet bredvid den. Den skrivna gissningen tas
         bort först: det är brickan som blir siffran. */
      /* Subtraktionen: "10 − 5" i marginalen är svaret — differensen sugs in
         i tian och brickan blir siffran, precis som demons sub_ten_minus. */
      const wc = (mode !== 'addition') ? workChip() : null;
      if (wc) {
        if (ansCell) { ansCell.innerHTML = ''; ansCell.classList.remove('active-col'); }
        subCollapseTen(col, correctDigit, finish);
        return;
      }
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

  /* ── Fria läget: tap i tabellen (påverkar ALDRIG rättningen) ──
     Svarsrutan tar fokus. Minnesrutan cyklar i TRE lägen:
     tom → skriven 1:a → struken 1:a → tom igen.

     Varför ingen sifferväljare: minnessiffran kan aldrig bli något annat än
     1 i den här appen — kolumnsumman av två siffror plus ett minne är som
     mest 19, och koden skriver `nextCarry = sum > 9 ? 1 : 0`. En väljare för
     ett värde med ett enda utfall är bara friktion.

     De två första stegen ÄR minnessiffrans dokumenterade livscykel
     (.project-context/MINNESSIFFER-KONCEPT.md): skrivs liten → vilar →
     används → STRYKS, aldrig suddas. Det tredje steget är ångra, och det
     hör hemma här: i fria läget skriver hon själv och måste kunna rätta en
     felplacerad etta. Minnesraden är hennes kladd och bedöms aldrig. */
  function freeMemTap(ev) {
    const ansEl = ev.target.closest ? ev.target.closest('.ans-cell') : null;
    if (ansEl) {
      const ac = COL_KEYS.findIndex(k => ansEl.id === `ans-${k}`);
      if (ac >= 0) exFreeFocusCell(ac);
      return;
    }
    const cellEl = ev.target.closest ? ev.target.closest('.carry-cell') : null;
    if (!cellEl) return;
    const col = COL_KEYS.findIndex(k => cellEl.id === `carry-${k}`);
    if (col < 0) return;
    if (freeMemVals[col] == null) {
      freeMemVals[col] = 1;                 // tom → skriven 1:a
      freeMemUsed[col] = false;
      cellEl.innerHTML = '<span class="mem-digit">1</span>';
    } else if (!freeMemUsed[col]) {
      freeMemUsed[col] = true;              // skriven → struken
      strikeMemEl(cellEl.querySelector('.mem-digit'));
    } else {
      freeMemVals[col] = null;              // struken → tom igen (ångra)
      freeMemUsed[col] = false;
      cellEl.innerHTML = '';
    }
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

  /* ── Free mode (utan hjälp): svaret skrivs i svarsradens celler ──
     Ingen bedömning sker någonstans i det här blocket utom i exFreeSubmit.
     Medan hon skriver finns varken bock, skakning eller färg som antyder
     rätt eller fel — och ingen spärr av typen "du har missat en ruta". */
  function exFreeInit() {
    exFreeCells = [null, null, null];
    exFreeCur   = 0;
    exFreePaintCells();
    showExColUI(0);
    /* Ringen mäts mot cellerna och placeras när tabellen fått sina mått. */
    requestAnimationFrame(() => exFreePlaceRing(false));
  }

  /* Svarets värde som tal, eller null om rutorna inte bildar ett tal.
     Ledande tomma rutor hoppas över — blankt på papper är ingen siffra.
     En tom ruta MITT i talet är inget tal alls och kan aldrig bli rätt;
     den får INTE tyst klämmas ihop till ett annat tal. */
  function exFreeValue() {
    let s = '', started = false;
    for (let c = colCount - 1; c >= 0; c--) {
      const v = exFreeCells[c];
      if (v === null) { if (started) return null; continue; }
      started = true; s += v;
    }
    return s === '' ? null : parseInt(s, 10);
  }

  function exFreeHasDigits() {
    for (let c = 0; c < colCount; c++) if (exFreeCells[c] !== null) return true;
    return false;
  }

  function exFreePaintCells(popCol) {
    for (let c = 0; c < colCount; c++) {
      const el = document.getElementById(`ans-${COL_KEYS[c]}`);
      if (!el) continue;
      const v = exFreeCells[c];
      el.classList.toggle('filled', v !== null);
      el.classList.toggle('active-col', c === exFreeCur && !exInputLocked);
      el.style.borderColor = v !== null ? PVC[COL_KEYS[c]] : '';
      el.innerHTML = v !== null
        ? `<span style="color:${PVC[COL_KEYS[c]]}">${v}</span>`
        : (c === exFreeCur && !exInputLocked ? '<span class="ans-caret"></span>' : '');
      if (popCol === c) { el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop'); }
    }
  }

  /* Fokusringen glider mellan rutorna — flytten ska SYNAS. */
  function exFreePlaceRing(animate) {
    const ring = document.getElementById('ans-focus');
    const wrap = document.getElementById('up-table-wrap');
    if (!ring || !wrap) return;
    if (exInputLocked) { ring.style.display = 'none'; return; }
    const cell = document.getElementById(`ans-${COL_KEYS[exFreeCur]}`);
    if (!cell) return;
    ring.style.display = 'block';
    ring.classList.toggle('instant', animate === false);
    const wr = wrap.getBoundingClientRect(), cr = cell.getBoundingClientRect();
    ring.style.left   = `${cr.left - wr.left - 4}px`;
    ring.style.top    = `${cr.top  - wr.top  - 4}px`;
    ring.style.width  = `${cr.width + 8}px`;
    ring.style.height = `${cr.height + 8}px`;
    if (animate === false) requestAnimationFrame(() => ring.classList.remove('instant'));
  }

  /* Vilken ruta som helst går att trycka på; nästa siffra ersätter den
     gamla utan att hon först måste sudda. */
  function exFreeFocusCell(col) {
    if (exInputLocked || helpMode) return;
    if (col < 0 || col >= colCount) return;
    exFreeCur = col;
    App.Sound.play('click');
    exFreePaintCells();
    exFreePlaceRing(true);
  }

  function exFreeClearWrong() {
    for (let c = 0; c < colCount; c++) {
      const el = document.getElementById(`ans-${COL_KEYS[c]}`);
      if (el) el.classList.remove('judged-ok');
    }
    const fb = document.getElementById('ex-feedback');
    if (fb) fb.innerHTML = '';
  }

  /* Klar heter Klar hela tiden och syns även innan den går att trycka på —
     ytan bär tillståndet, inte namnet. */
  function exFreeUpdateSubmit() {
    const btn = document.getElementById('ex-free-submit');
    if (!btn) return;
    const ready = exFreeHasDigits() && !exInputLocked;
    const was   = !btn.disabled;
    btn.disabled = !ready;
    btn.classList.toggle('done', exInputLocked);
    if (ready && !was) { btn.classList.remove('wake'); void btn.offsetWidth; btn.classList.add('wake'); }
  }

  function exFreePress(key) {
    if (exInputLocked) return;
    exFreeClearWrong();
    exFreeCells[exFreeCur] = parseInt(key, 10);
    const popped = exFreeCur;
    if (exFreeCur < colCount - 1) exFreeCur++;   // ett steg vänsterut
    App.Sound.play('click');
    exFreePaintCells(popped);
    exFreePlaceRing(true);
    exFreeUpdateSubmit();
  }

  /* ⌫ som på ett tangentbord: har rutan en siffra töms den och fokus står
     kvar; är rutan tom flyttar fokus ett steg åt HÖGER och tömmer den
     rutan. Så blir "ångra sista siffran" ETT tryck även direkt efter att
     fokus glidit vänsterut. */
  function exFreeErase() {
    if (exInputLocked) return;
    exFreeClearWrong();
    if (exFreeCells[exFreeCur] === null) {
      if (exFreeCur > 0) { exFreeCur--; exFreeCells[exFreeCur] = null; }
    } else {
      exFreeCells[exFreeCur] = null;
    }
    App.Sound.play('click');
    exFreePaintCells();
    exFreePlaceRing(true);
    exFreeUpdateSubmit();
  }

  function exFreeSubmit() {
    if (exInputLocked) return;
    if (!exFreeHasDigits()) return;      // Klar kräver minst en siffra
    const facit = mode === 'addition' ? numA + numB : numA - numB;
    const val   = exFreeValue();

    if (val === facit) {
      // Rätt — poäng endast om helrätt på första Klar-trycket
      exInputLocked = true;
      if (exFreeFirstAttempt) exScore++;
      const dr = digs(facit);
      for (let c = 0; c < colCount; c++) { exAnswers[c] = dr[c]; exFreeCells[c] = dr[c]; }
      exFreeClearWrong();
      exFreePaintCells();
      exFreePlaceRing(false);            // låst ruta → ringen släcks
      for (let c = 0; c < colCount; c++) {
        const el = document.getElementById(`ans-${COL_KEYS[c]}`);
        if (el) el.classList.add('judged-ok');
      }
      exFreeUpdateSubmit();
      App.Sound.play('correct');
      smallBurst();
      setTimeout(() => exCheckDone(true), 900);
    } else {
      // Fel — förbrukar första försöket; siffrorna står kvar och kan ändras
      exFreeFirstAttempt = false;
      App.Sound.play('wrong');
      const wrap = document.getElementById('up-table-wrap');
      if (wrap) { wrap.classList.remove('shake'); void wrap.offsetWidth; wrap.classList.add('shake'); }
      // Glömd-minnessiffra-detektion (v30): matchar svaret simuleringen
      // med alla carryIn=0 → riktad feedback istället för generisk
      const glomtMinne = mode === 'addition' && val !== null && val === simulateNoCarrySum();
      const fb = document.getElementById('ex-feedback');
      if (fb) fb.innerHTML = `<div class="free-tip">${glomtMinne
        ? 'Nästan! Kolla minnessiffrorna — någon vill vara med! 👆'
        : 'Inte riktigt! Ändra med ⌫ och prova igen 💪'}</div>`;
      exFreeUpdateSubmit(); // siffror finns kvar → Klar förblir aktiv
    }
  }

  /* Ringen är utmätt i pixlar och måste räknas om när ytan ändrar form. */
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
      if (document.getElementById('ans-focus')) exFreePlaceRing(false);
    });
  }

  function exCheckDone(skipScore) {
    // skipScore=true: fria läget har redan avgjort poängen i exFreeSubmit
    const dr = digs(mode === 'addition' ? numA + numB : numA - numB);
    let correct = true;
    for (let c = 0; c < colCount; c++) {
      /* A4: en kolumn utan svar (tom på pappret, eller en ledande nolla)
         står som null — det ÄR rätt när siffran där är 0. */
      if ((exAnswers[c] ?? 0) !== dr[c]) { correct = false; break; }
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
  /* compact=true (fria läget): etikettraden ovanför ritytan utgår och
     ordet flyttar ner till verktygsraden — raden kostade höjd, ordet inte. */
  function scratchHTML(compact) {
    return `<div class="up-scratch">
      ${compact ? '' : `<div style="font-size:10px;font-weight:800;color:var(--deep);text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0">✏️ Kladd</div>`}
      <canvas id="up-canvas" class="up-canvas"></canvas>
      <div style="display:flex;gap:5px;flex-shrink:0;align-items:center">
        ${compact ? `<span style="font-size:10px;font-weight:800;color:var(--deep);text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0">✏️ Kladd</span>` : ''}
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
    exPress,
    exTenStepNext,
    memTableTap,
    exFreePress, exFreeSubmit, exFreeErase,
    upToggleEraser, upClearCanvas,
    goBack,
    __test: { planAdditionColumns, planSubtractionColumns, exColumnPlan },
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = UppstallningGame;
