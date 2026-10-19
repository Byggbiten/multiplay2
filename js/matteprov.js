/* ============================================================
   MULTIPLAY – Matteprov 4:an (D37)
   Nås från Multiplikationens lägesvy (multdiv.js, under
   Svårighetsgrad). Provlistan → provsidan med de fem momenten →
   Öva (så här gör du + nötloop), Gör provet (utan klocka och
   hjälp, kvitto per moment med "Sett av en vuxen"), Tabellsprint.
   All räkning, facit och felklassning: js/matteprov-logic.js.
   Uppställningens pappret följer multdiv:s (cellerna, färgerna,
   minnessiffrorna i rött, knappsatsen med hög Klar) men har den
   grå rutan för tiotalsradens nolla, som bara provet använder.
   Lagring per profil: matteprov_{id}.
   ============================================================ */
'use strict';

const MatteProv = (() => {
  const L = window.MatteProvLogic;
  const KEY = id => 'matteprov_' + id;

  let profile = null, onBack = null, provId = 'prov1';
  let S = null;          // pågående pass: ova | svag | prov | sprint
  let IN = null;         // inmatningen för aktuell uppgift
  let locked = false;
  let sprintTimer = null;

  /* ── Ikoner (SVG, inga emojis i nytt) ───────────────────── */
  const ICON = {
    back:'<path d="M15 5l-7 7 7 7"/>',
    next:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    chev:'<path d="M9 5l7 7-7 7"/>',
    check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    erase:'<path d="M20 6H9.6a2 2 0 0 0-1.5.7L3.4 12l4.7 5.3a2 2 0 0 0 1.5.7H20a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1Z"/><path d="M17 10l-4 4M13 10l4 4"/>',
    down:'<path d="M12 5v13M6 12l6 6 6-6"/>',
    right:'<path d="M5 12h13M12 6l6 6-6 6"/>',
    timer:'<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.5 1.5M9.5 3.5h5"/>',
    paper:'<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4"/><path d="M10 12h6M10 16h6"/>',
    hand:'<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M12 10.5V4a1.5 1.5 0 0 1 3 0v6.5"/><path d="M15 10.5V6a1.5 1.5 0 0 1 3 0v8a6.5 6.5 0 0 1-6.5 6.5h-.8a6 6 0 0 1-4.6-2.2L3.6 15a1.6 1.6 0 0 1 2.4-2.1L9 15V8a1.5 1.5 0 0 1 3 0"/>',
    star:'<path d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.2l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    again:'<path d="M4.5 12a7.5 7.5 0 1 1 2.2 5.3M4.5 17.5V12H10"/>',
    dot:'<circle cx="12" cy="12" r="5"/>',
    target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
  };
  const svg = (k, cls) => `<svg class="mi${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;

  /* Prislistans saker som små SVG-bilder (egna, enkla former) */
  const SHOP_SVG = {
    penna:'<path d="M5 19l2.5-6.5L16 4l4 4-8.5 8.5z" fill="#fde047" stroke="#a16207"/><path d="M5 19l2.5-6.5 4 4z" fill="#fcd9b6" stroke="#a16207"/><path d="M5 19l1.2-3 1.8 1.8z" fill="#334155"/>',
    sudd:'<rect x="3" y="8" width="18" height="9" rx="2.5" fill="#fda4af" stroke="#be123c"/><path d="M13 8v9" stroke="#be123c"/><rect x="13" y="8" width="8" height="9" rx="2" fill="#93c5fd" stroke="#1d4ed8"/>',
    block:'<rect x="5" y="3.5" width="14" height="17" rx="2" fill="#bbf7d0" stroke="#15803d"/><path d="M8 3v3M12 3v3M16 3v3" stroke="#15803d"/><path d="M8 10h8M8 13.5h8M8 17h5" stroke="#15803d"/>',
    linjal:'<rect x="2.5" y="8.5" width="19" height="7" rx="1.5" fill="#fef08a" stroke="#a16207"/><path d="M6 8.5v3M9.5 8.5v2M13 8.5v3M16.5 8.5v2M20 8.5v3" stroke="#a16207"/>',
    boll:'<circle cx="12" cy="12" r="8.5" fill="#fff" stroke="#334155"/><path d="M12 7.5l3.8 2.8-1.5 4.5h-4.6l-1.5-4.5z" fill="#334155"/><path d="M12 3.5v4M15.8 10.3l4-1.3M14.3 14.8l2.4 3.5M9.7 14.8l-2.4 3.5M8.2 10.3l-4-1.3" stroke="#334155"/>',
    dekal:'<circle cx="12" cy="12" r="9" fill="#e9d5ff" stroke="#7e22ce"/><path d="M12 6.5l1.6 3.4 3.7.5-2.7 2.6.7 3.7L12 15l-3.3 1.7.7-3.7-2.7-2.6 3.7-.5z" fill="#facc15" stroke="#a16207" stroke-width="1"/>',
  };
  const shopIcon = id => `<svg class="mp-shopi" viewBox="0 0 24 24" aria-hidden="true" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round">${SHOP_SVG[id]}</svg>`;

  /* ── Hjälpare ───────────────────────────────────────────── */
  const esc = s => MP.escapeHtml(s);
  const snd = t => { try { App.Sound.play(t); } catch (_) {} };
  const root = () => document.getElementById('mp-root');
  const prov = () => L.PROVS.find(p => p.id === provId) || L.PROVS[0];
  const momentOf = id => L.MOMENTS.find(m => m.id === id);
  const levelName = lv => (L.LEVELS.find(l => l.id === lv) || L.LEVELS[0]).name;
  const COLV = ['#16a34a', '#2563eb', '#dc2626', '#9333ea'];     // E grön, T blå, H röd, Tu lila (som multdiv)

  /* ── Lagring: matteprov_{id} ────────────────────────────── */
  function readSt() { try { return JSON.parse(localStorage.getItem(KEY(profile.id))) || {}; } catch (_) { return {}; } }
  function writeSt(s) { MP.safeSetItem(KEY(profile.id), JSON.stringify(s)); }
  function provSt(s) {
    s.provs = s.provs || {};
    const p = s.provs[provId] = s.provs[provId] || {};
    p.ova = p.ova || {}; p.tests = p.tests || []; p.sprint = p.sprint || { best:0, last:null };
    return p;
  }
  function level() { return readSt().level === 'svar' ? 'svar' : 'latt'; }
  function setLevel(lv) { const s = readSt(); s.level = lv; writeSt(s); }

  /* ══════════════════════════════════════════════════════════
     CSS (injiceras i roten; allt under #mp-root)
  ══════════════════════════════════════════════════════════ */
  const CSS = `
#screen-matteprov{padding:4px 12px 10px}
#mp-root{display:flex;flex-direction:column;flex:1;min-height:0;width:100%;max-width:560px;margin:0 auto}
#mp-root .app-header{margin-bottom:6px;flex-shrink:0}
#mp-root svg.mi{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
#mp-root .mp-body{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px}
#mp-root .mp-spacer{width:52px;flex-shrink:0}
#mp-root .mp-skip{min-height:44px;padding:0 12px;border-radius:999px;font-weight:800;font-size:13px;color:var(--accent);background:var(--glass-strong);border:1.5px solid color-mix(in srgb,var(--accent) 30%,transparent)}
#mp-root .mp-row{display:flex;align-items:center;gap:12px;width:100%;min-height:62px;padding:9px 12px;text-align:left;border-radius:20px;
  background:var(--glass);border:1px solid var(--glass-line);box-shadow:var(--shadow-panel);color:var(--deep);transition:transform .25s var(--spring)}
#mp-root .mp-row:active{transform:scale(.98)}
#mp-root .mp-row b{display:block;font-family:var(--font-head);font-weight:700;font-size:17px;line-height:1.15;color:var(--deep)}
#mp-root .mp-row small{display:block;font-size:12.5px;font-weight:700;color:var(--ink-soft);line-height:1.2}
#mp-root .mp-row .mp-tx{flex:1;min-width:0}
#mp-root .mp-row .chev{color:var(--accent)}
#mp-root .mp-nr{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;flex-shrink:0;font-family:var(--font-head);font-weight:800;font-size:19px;
  color:#fff;background:linear-gradient(135deg,var(--accent),var(--accent-light));box-shadow:0 4px 10px var(--glow)}
#mp-root .mp-nr.alt{background:linear-gradient(135deg,#f59e0b,#fbbf24)}
#mp-root .mp-badge{flex-shrink:0;font-size:12px;font-weight:900;padding:4px 9px;border-radius:999px;white-space:nowrap}
#mp-root .mp-badge.g{background:#dcfce7;color:#15803d}
#mp-root .mp-badge.y{background:#fef3c7;color:#92400e}
#mp-root .mp-cta{min-height:58px;border-radius:999px;font-family:var(--font-head);font-weight:800;font-size:19px;color:#fff;display:flex;align-items:center;justify-content:center;gap:10px;
  background:linear-gradient(135deg,var(--accent),var(--accent-light));box-shadow:0 8px 22px var(--glow);flex-shrink:0;width:100%}
#mp-root .mp-cta:active{transform:scale(.97)}
#mp-root .mp-cta.sec{background:var(--glass-strong);color:var(--deep);border:2px solid color-mix(in srgb,var(--accent) 35%,transparent);box-shadow:var(--shadow-panel);font-size:17px;min-height:52px}
#mp-root .mp-note{text-align:center;font-size:13px;font-weight:800;color:var(--ink-soft);margin:0}
#mp-root .mp-seg{display:flex;background:rgba(255,255,255,.6);border:1px solid var(--glass-line);border-radius:999px;padding:4px;box-shadow:var(--shadow-panel);flex-shrink:0}
#mp-root .mp-seg button{flex:1;min-height:44px;border-radius:999px;font-weight:800;font-size:15px;color:var(--deep)}
#mp-root .mp-seg button.on{color:#fff;background:linear-gradient(135deg,var(--accent),var(--accent-light));box-shadow:0 4px 14px var(--glow)}
#mp-root .mp-list{display:flex;flex-direction:column;gap:8px}
#mp-root .mp-h{font-family:var(--font-head);font-weight:800;font-size:15px;color:var(--ink-soft);margin:2px 4px -2px;letter-spacing:.02em}

/* Uppgiften */
#mp-root .mp-q{background:var(--glass-strong);border:1px solid var(--glass-line);border-radius:22px;box-shadow:var(--shadow-panel);padding:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;flex:1;min-height:0}
#mp-root .mp-big{font-family:var(--font-head);font-weight:800;font-size:clamp(34px,10vw,52px);color:var(--deep);line-height:1.1;display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;font-variant-numeric:tabular-nums}
#mp-root .mp-ans{min-width:2.6em;height:1.35em;padding:0 .2em;border-radius:14px;border:3px dashed color-mix(in srgb,var(--accent) 45%,transparent);background:#fff;display:inline-flex;align-items:center;justify-content:center;color:var(--deep)}
#mp-root .mp-ans.focus{border-style:solid;border-color:var(--accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 18%,transparent)}
#mp-root .mp-ans.ok{border:3px solid #22c55e;background:#dcfce7;color:#15803d}
#mp-root .mp-ans.bad{border:3px solid #ef4444;background:#fee2e2;color:#b91c1c}
#mp-root .mp-ans.sm{font-size:.62em;min-width:2.4em;border-radius:11px;cursor:pointer}
#mp-root .mp-unit{font-size:.6em;color:var(--ink-soft)}
#mp-root .mp-text{font-weight:800;font-size:17px;color:var(--ink);text-align:center;line-height:1.35;margin:0}
#mp-root .mp-te{display:flex;flex-direction:column;align-items:flex-start;gap:6px;font-family:var(--font-head);font-weight:800;font-size:clamp(26px,7.4vw,36px);color:var(--deep);font-variant-numeric:tabular-nums}
#mp-root .mp-te .ln{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
#mp-root .mp-te .mp-ans.sm{font-size:.8em;min-width:2.3em;height:max(44px,1.35em);border-width:2.5px}
#mp-root .mp-te .mp-ans.sm.wide{min-width:6.5em}
#mp-root .mp-te .t{color:#2563eb}
#mp-root .mp-te .e{color:#16a34a}
#mp-root .mp-shop{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:100%}
#mp-root .mp-shop div{display:flex;align-items:center;gap:6px;background:#fff;border-radius:12px;padding:4px 6px;border:1px solid rgba(0,0,0,.06)}
#mp-root .mp-shopi{width:30px;height:30px;flex-shrink:0}
#mp-root .mp-shop span{display:flex;flex-direction:column;line-height:1.1;font-size:12px;font-weight:800;color:var(--ink-soft);min-width:0}
#mp-root .mp-shop b{font-family:var(--font-head);font-size:15px;color:var(--deep)}

/* Pappret (uppställningen) */
#mp-root .mp-paper{border-collapse:separate;border-spacing:5px 4px;margin:0 auto}
#mp-root .mp-paper td{padding:0;text-align:center}
#mp-root .mp-c{width:46px;height:46px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-weight:800;font-size:28px;font-variant-numeric:tabular-nums}
#mp-root .mp-c.fix{background:rgba(255,255,255,.95);border:2px solid rgba(0,0,0,.08)}
#mp-root .mp-c.in{background:rgba(255,255,255,.8);border:2.5px dashed color-mix(in srgb,var(--accent) 35%,transparent);color:var(--deep);cursor:pointer}
#mp-root .mp-c.in.has{border-style:solid}
#mp-root .mp-c.in.grey{background:#d9dde3;border-color:#9aa3ae}
#mp-root .mp-c.in.focus{border:3px solid var(--accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 20%,transparent)}
#mp-root .mp-c.in.ok{border:2.5px solid #22c55e;background:#dcfce7;color:#15803d}
#mp-root .mp-c.in.grey.ok{background:#bbf7d0}
#mp-root .mp-c.in.pulse{animation:mp-pulse 1s ease-in-out 3}
#mp-root .mp-c.ghost{visibility:hidden}
#mp-root .mp-m{position:relative;width:46px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-weight:800;font-size:18px;color:#dc2626;transform:rotate(-4deg)}
#mp-root .mp-m.in{border:2px dashed rgba(220,38,38,.4);cursor:pointer;transform:none}
#mp-root .mp-m.in::after{content:'';position:absolute;left:50%;top:50%;width:46px;height:44px;transform:translate(-50%,-50%)}
#mp-root .mp-m.in.focus{border:2.5px solid #dc2626;background:#fff1f2}
#mp-root .mp-sign{font-family:var(--font-head);font-weight:900;font-size:26px;color:#475569;width:22px}
#mp-root .mp-line td{height:3px;border-radius:2px}
#mp-root .mp-line td + td{background:#374151}
#mp-root .mp-greyhint{font-size:12.5px;font-weight:800;color:#64748b;text-align:center;margin:0}
#mp-root .mp-q.top{justify-content:flex-start;padding:8px}
#mp-root .mp-text.sm{font-size:14.5px;color:var(--ink-soft)}
#mp-root .mp-expr{font-family:var(--font-head);font-size:20px;color:var(--deep)}
#mp-root .mp-ans.wide{min-width:6em;justify-content:flex-start;padding:0 .35em}
#mp-root .mp-ans.xs{font-size:20px;min-width:52px;height:36px;border-radius:9px;border-width:2px}
#mp-root .mp-tecol{display:inline-flex;flex-direction:column;align-items:center;line-height:1}
#mp-root .mp-tecol i{font-style:normal;font-size:.45em;font-weight:900;margin-bottom:-2px}
#mp-root .mp-te .ln:first-child{align-items:flex-end}
#mp-root .mp-score{font-family:var(--font-head);font-weight:800;font-variant-numeric:tabular-nums}
#mp-root .mp-score small{font-size:.6em;color:var(--ink-soft);margin-left:2px}
#mp-root .mp-sheet{display:grid;grid-template-columns:1fr 1fr;gap:6px;width:100%}
#mp-root .mp-sheet .col{display:flex;flex-direction:column;gap:2px}
#mp-root .mp-sr{display:flex;align-items:center;justify-content:flex-end;gap:6px;min-height:44px;padding:0 6px;border-radius:12px;font-family:var(--font-head);font-weight:800;font-size:19px;color:var(--deep);font-variant-numeric:tabular-nums;background:transparent;border:2px solid transparent}
#mp-root .mp-sr .ex{white-space:nowrap}
#mp-root .mp-sr.focus{border-color:var(--accent);background:#fff}
#mp-root .mp-sr.focus .mp-ans{border-style:solid;border-color:var(--accent)}
#mp-root .mp-sr.ok .mp-ans{border:2px solid #22c55e;background:#dcfce7;color:#15803d}
#mp-root .mp-sr.bad .mp-ans{border:2px solid #ef4444;background:#fee2e2;color:#b91c1c;text-decoration:line-through}
#mp-root .mp-sr .fix{color:#15803d;font-size:16px;min-width:26px;text-align:left}
#mp-root .mp-sheet.demo .mp-sr{min-height:36px;font-size:17px}
#mp-root .mp-sheet.demo .mp-ans.sm{font-size:16px;min-width:44px;height:30px}
#mp-root .mp-pad.r5{grid-template-rows:repeat(5,clamp(42px,6vh,52px));grid-auto-rows:auto}
#mp-root .mp-pad.r5 .mp-klar{grid-row:1 / span 5}
#mp-root .mp-pad.low{grid-auto-rows:clamp(44px,5.6vh,50px)}
#mp-root .mp-k.op{font-size:28px;color:var(--accent)}
#mp-root .mp-k.op.z2{grid-column:2 / span 2}
@keyframes mp-pulse{0%,100%{box-shadow:0 0 0 0 rgba(234,88,12,0)}50%{box-shadow:0 0 0 6px rgba(234,88,12,.45)}}

/* Knappsatsen (som multdiv:s fria läge: hög Klar till höger) */
#mp-root .mp-pad{display:grid;grid-template-columns:repeat(3,1fr) clamp(84px,24vw,112px);grid-auto-rows:clamp(48px,7.2vh,60px);gap:7px;flex-shrink:0}
#mp-root .mp-k{border-radius:16px;font-family:var(--font-head);font-weight:800;font-size:24px;color:var(--deep);background:linear-gradient(180deg,#fff,var(--glass-strong));
  border:2px solid color-mix(in srgb,var(--accent) 18%,transparent);box-shadow:0 2px 0 color-mix(in srgb,var(--accent) 16%,transparent);display:grid;place-items:center}
#mp-root .mp-k:active{transform:scale(.94);background:color-mix(in srgb,var(--accent) 12%,#fff)}
#mp-root .mp-k.er{background:var(--tint)}
#mp-root .mp-k.nx{font-family:var(--font-body);font-size:13px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:4px;grid-column:3}
#mp-root .mp-k.z2{grid-column:2 / span 2}
#mp-root .mp-klar{grid-column:4;grid-row:1 / span 4;border-radius:18px;font-family:var(--font-head);font-weight:800;font-size:19px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#fff;
  background:linear-gradient(135deg,var(--accent),var(--accent-light));box-shadow:0 8px 22px var(--glow)}
#mp-root .mp-klar svg.mi{width:30px;height:30px;stroke-width:3}
#mp-root .mp-klar:disabled{color:var(--deep);background:linear-gradient(180deg,#fff,var(--tint));box-shadow:inset 0 0 0 2.5px color-mix(in srgb,var(--accent) 40%,transparent)}

/* Återkopplingen vid fel (ersätter knappsatsen) */
#mp-root .mp-fb{flex-shrink:0;display:flex;flex-direction:column;gap:8px;background:#fff;border-radius:20px;padding:12px 14px;border:2px solid #fca5a5;box-shadow:var(--shadow-panel)}
#mp-root .mp-fb.good{border-color:#86efac}
#mp-root .mp-fb h3{margin:0;font-family:var(--font-head);font-weight:800;font-size:19px;color:#b91c1c;display:flex;align-items:center;gap:8px}
#mp-root .mp-fb.good h3{color:#15803d}
#mp-root .mp-fb p{margin:0;font-weight:800;font-size:15.5px;color:var(--ink);line-height:1.35}
#mp-root .mp-fb .mp-step{min-height:44px}
#mp-root .mp-dots{display:flex;gap:6px;justify-content:center;flex-shrink:0}
#mp-root .mp-dots i{width:8px;height:8px;border-radius:50%;background:color-mix(in srgb,var(--accent) 25%,transparent)}
#mp-root .mp-dots i.on{background:var(--accent)}

/* Så här gör du */
#mp-root .mp-intro{flex:1;min-height:0;display:flex;flex-direction:column;gap:12px}
#mp-root .mp-vis{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:var(--glass-strong);border:1px solid var(--glass-line);border-radius:22px;box-shadow:var(--shadow-panel);padding:12px}
#mp-root .mp-say{background:#fff;border-radius:18px;padding:12px 14px;font-weight:800;font-size:17px;line-height:1.4;color:var(--ink);min-height:96px;display:flex;align-items:center;box-shadow:var(--shadow-panel);flex-shrink:0}
#mp-root .mp-navrow{display:flex;gap:10px;flex-shrink:0}
#mp-root .mp-navrow .mp-cta{flex:1}
#mp-root .mp-navrow .mp-cta.sec{flex:0 0 34%}
#mp-root .mp-fb .mp-navrow .mp-cta{font-size:16px;min-height:50px}
#mp-root .mp-fb .mp-navrow .mp-cta.sec{flex:0 0 30%}
#mp-root .zero{color:#ea580c}
#mp-root .dim{opacity:.35}

/* Kvittot */
#mp-root .mp-head{display:flex;flex-direction:column;align-items:center;text-align:center;flex-shrink:0}
#mp-root .mp-starb{width:50px;height:50px;border-radius:50%;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#fbbf24,#f59e0b);box-shadow:0 8px 20px rgba(245,158,11,.35)}
#mp-root .mp-starb svg.mi{width:28px;height:28px;fill:#fff;stroke-width:1.6}
#mp-root .mp-head h2{font-family:var(--font-head);font-weight:800;font-size:26px;color:var(--deep);margin:4px 0 0;line-height:1.05}
#mp-root .mp-head p{margin:2px 0 0;font-weight:800;font-size:14.5px;color:var(--ink-soft)}
#mp-root .mp-rc{background:#fff;border-radius:20px;padding:10px 12px;display:flex;flex-direction:column;gap:5px;box-shadow:var(--shadow-panel);flex-shrink:0}
#mp-root .mp-rc-top{display:flex;flex-direction:column;padding-bottom:6px;border-bottom:1.5px dashed rgba(15,92,84,.25)}
#mp-root .mp-rc-k{font-size:12px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}
#mp-root .mp-rc-when{font-weight:800;font-size:14px;color:var(--deep)}
#mp-root .mp-rc-row{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:800;color:var(--ink-soft);min-height:26px}
#mp-root .mp-rc-row .nm{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#mp-root .mp-rc-row b{font-family:var(--font-head);font-size:16px;color:var(--deep);white-space:nowrap}
#mp-root .mp-rc-row.tot{border-top:1.5px dashed rgba(15,92,84,.25);padding-top:5px}
#mp-root .mp-rc-foot{position:relative;height:52px;display:grid;place-items:center;border:2px dashed rgba(22,163,74,.35);border-radius:14px;margin-top:2px}
#mp-root .mp-ph{font-size:13px;font-weight:800;color:rgba(21,128,61,.6)}
#mp-root .mp-ph.off{opacity:0}
#mp-root .mp-stamp{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none}
#mp-root .st-in{display:flex;align-items:center;gap:8px;padding:4px 14px 4px 10px;border:3px solid #16a34a;border-radius:12px;color:#15803d;transform:rotate(-5deg);background:rgba(240,253,244,.95)}
#mp-root .st-in b{font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;display:block}
#mp-root .st-in small{font-size:12px;font-weight:800}
#mp-root .hold{position:relative;overflow:hidden;min-height:54px;flex-shrink:0;border-radius:999px;border:2px solid #16a34a;background:#fff;color:#15803d;font-weight:900;font-size:16px;touch-action:none;width:100%}
#mp-root .hold-fill{position:absolute;inset:0;background:linear-gradient(90deg,#bbf7d0,#4ade80);transform:scaleX(0);transform-origin:left center}
#mp-root .hold.holding .hold-fill{transform:scaleX(1);transition:transform 1.5s linear}
#mp-root .hold-t{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px}
#mp-root .hold.done{background:#dcfce7}
#mp-root .hold:disabled{opacity:1}

/* Sprinten */
#mp-root .mp-timer{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:6px 12px;border-radius:999px;background:var(--glass-strong);border:1px solid var(--glass-line);font-family:var(--font-head);font-weight:800;font-size:17px;color:var(--deep);font-variant-numeric:tabular-nums}
#mp-root .mp-timer.low{color:#b91c1c}
#mp-root .mp-bands{display:flex;flex-direction:column;gap:6px;width:100%}
#mp-root .mp-band{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:14px;background:rgba(255,255,255,.7);font-weight:800;color:var(--ink-soft);border:2px solid transparent}
#mp-root .mp-band b{font-family:var(--font-head);color:var(--deep);min-width:58px;font-variant-numeric:tabular-nums}
#mp-root .mp-band.on{border-color:var(--accent);background:#fff;color:var(--deep);box-shadow:0 4px 14px var(--glow)}
#mp-root .mp-bignum{font-family:var(--font-head);font-weight:800;font-size:64px;line-height:1;color:var(--deep);font-variant-numeric:tabular-nums}

/* Avsluta-frågan */
#mp-root .mp-ov{position:fixed;inset:0;z-index:50;background:rgba(15,23,42,.35);display:grid;place-items:center;padding:20px}
#mp-root .mp-ovc{background:#fff;border-radius:22px;padding:18px;max-width:340px;width:100%;display:flex;flex-direction:column;gap:12px;box-shadow:0 20px 50px rgba(0,0,0,.25)}
#mp-root .mp-ovc p{margin:0;font-weight:800;font-size:17px;color:var(--ink);text-align:center}
#mp-root .mp-ovc .mp-navrow .mp-cta{flex:1}
`;

  /* ══════════════════════════════════════════════════════════
     RAM: rubrik + kropp
  ══════════════════════════════════════════════════════════ */
  function frame(title, leftAct, leftTxt, right, body) {
    const r = root();
    r.innerHTML = `<style>${CSS}</style>
      <div class="app-header">
        <button class="btn-back" data-act="${leftAct}">${leftTxt}</button>
        <span class="header-title">${title}</span>
        ${right || '<span class="mp-spacer"></span>'}
      </div>
      <div class="mp-body">${body}</div>`;
  }
  function show() { Router.show('screen-matteprov'); }

  /* ══════════════════════════════════════════════════════════
     PROVLISTAN OCH PROVSIDAN
  ══════════════════════════════════════════════════════════ */
  function open(p, back) {
    profile = p; onBack = back || null;
    const r = root();
    if (r && !r._mpBound) {
      r.addEventListener('click', onClick);
      r._mpBound = true;
      document.addEventListener('keydown', onKey);
    }
    showList();
    show();
  }

  function lastTestTxt(pid) {
    const s = readSt(), p = s.provs && s.provs[pid];
    const t = p && p.tests && p.tests[0];
    return t ? `Senast ${t.ok} av ${t.total} · ${levelName(t.level)}` : 'Inte gjort än';
  }

  function showList() {
    stopSprint(); S = null;
    frame('Matteprov 4:an', 'back', 'Tillbaka', '', `
      <p class="mp-note" style="margin-top:6px">Prov om multiplikation. Nya prov läggs ut här efter hand.</p>
      <div class="mp-list">
        ${L.PROVS.map((p, i) => `<button class="mp-row" data-act="prov" data-id="${p.id}">
          <span class="mp-nr">${i + 1}</span>
          <span class="mp-tx"><b>${esc(p.title)} · ${esc(p.sub)}</b><small>${esc(lastTestTxt(p.id))}</small></span>
          ${svg('chev', 'chev')}</button>`).join('')}
      </div>`);
  }

  function showProv() {
    stopSprint(); S = null;
    const P = prov(), lv = level(), ps = provSt(readSt());
    const ovaBadge = id => {
      const o = ps.ova[id];
      if (!o || o.level !== lv) return '';
      const green = o.total && Math.round(100 * o.ok / o.total) >= L.GREEN_PCT;
      return `<span class="mp-badge ${green ? 'g' : 'y'}">${o.ok}/${o.total}</span>`;
    };
    const total = Object.values(P.provCount).reduce((a, b) => a + b, 0);
    frame(esc(P.title), 'list', 'Tillbaka', '', `
      <div class="mp-seg" role="group" aria-label="Nivå">
        ${L.LEVELS.map(l => `<button class="${l.id === lv ? 'on' : ''}" data-act="level" data-id="${l.id}">${l.name}</button>`).join('')}
      </div>
      <p class="mp-note" style="margin-top:-4px">Nivån gäller när du övar. Provet är alltid på Svårare.</p>
      <div class="mp-h">Öva på ett moment</div>
      <div class="mp-list">
        ${P.moments.map(id => { const m = momentOf(id); return `<button class="mp-row" data-act="ova" data-id="${id}">
          <span class="mp-nr">${m.nr}</span>
          <span class="mp-tx"><b>${esc(m.title)}</b><small>${esc(id === 'tabell' ? 'Tabelltest med 20 tal' : m.desc)}</small></span>
          ${ovaBadge(id)}${svg('chev', 'chev')}</button>`; }).join('')}
        <button class="mp-row" data-act="sprint" style="min-height:54px">
          <span class="mp-nr alt">${svg('timer')}</span>
          <span class="mp-tx"><b>Tabellsprint</b><small>Så många du hinner på 4 minuter${ps.sprint.best ? ' · bäst ' + ps.sprint.best : ''}</small></span>
          ${svg('chev', 'chev')}</button>
      </div>
      <div style="margin-top:auto;display:flex;flex-direction:column;gap:6px">
        <button class="mp-cta" data-act="startprov">${svg('paper')}Gör provet</button>
        <p class="mp-note">Tabelltestet och ${total - P.provCount.tabell} uppgifter till, utan klocka och utan hjälp. ${esc(lastTestTxt(provId))}.</p>
      </div>`);
  }

  /* ══════════════════════════════════════════════════════════
     SÅ HÄR GÖR DU (klickstyrt, ett steg = en idé)
  ══════════════════════════════════════════════════════════ */
  const big = h => `<div class="mp-big">${h}</div>`;
  const z = s => `<span class="zero">${s}</span>`;
  const box = (v, cls) => `<span class="mp-ans sm ${cls || ''}">${v == null ? '' : v}</span>`;
  const rows = lines => `<div class="mp-te">${lines.map(l => `<div class="ln">${l}</div>`).join('')}</div>`;
  /* "4 · 28" med T och E ovanför tiotalet och entalet, som på bladet */
  function teHead(a, b) {
    const d = String(b).split('');
    return `<div class="ln">${a} · <span class="mp-tecol"><i class="t">T</i><b class="t">${d[0]}</b></span><span class="mp-tecol"><i class="e">E</i><b class="e">${d[1]}</b></span></div>`;
  }
  function introSteps(moment, lv) {
    if (moment === 'tabell') return [
      { v:sheetDemo(), t:'Det här är ett tabelltest: 20 gångertal i två kolumner. Du skriver svaret i rutan efter varje tal.' },
      { v:big('6 · 7 = ' + box(42, 'focus')), t:'Skriv svaret med knapparna. Knappen Nästa hoppar till nästa ruta.' },
      { v:big('5 · 7 = 35') + big('35 + 7 = 42'), t:'Kommer du inte ihåg? Ta ett gångertal du kan, 5 · 7 = 35, och lägg till en 7:a till.' },
      { v:big('<span class="mp-score">17<small>/20</small></span>'), t:'Tryck Klar när du är färdig. Du får veta hur många av 20 som blev rätt.' },
      { v:`<div style="color:var(--accent)">${svg('again')}</div>`, t:'De tal som blev fel kan du sedan nöta: samma tal direkt igen, och en gång till lite senare.' },
    ];
    if (moment === 'tiotal') return [
      { v:big('8 · 4' + z('0')), t:'Här räknar du gånger med tiotal och hundratal. 40 är 4 tiotal.' },
      { v:rows(['8 · 40 = 8 · 4 tiotal']), t:'Skriv om: 8 · 40 är detsamma som 8 · 4 tiotal.' },
      { v:rows(['8 · 40 = 8 · 4 tiotal', '= ' + box(32) + ' tiotal']), t:'Räkna tabellen: 8 · 4 = 32. Det blir 32 tiotal.' },
      { v:rows(['8 · 40 = 8 · 4 tiotal', '= ' + box(32) + ' tiotal', '= ' + box(320)]), t:'32 tiotal är 320. Det är svaret.' },
      { v:rows(['50 · 60 = 5 · 6 hundratal']), t:'Tiotal gånger tiotal blir hundratal: 50 · 60 är 5 · 6 hundratal.' },
      { v:rows(['50 · 60 = 5 · 6 hundratal', '= ' + box(30) + ' hundratal']), t:'Räkna tabellen: 5 · 6 = 30. Det blir 30 hundratal.' },
      { v:rows(['50 · 60 = 5 · 6 hundratal', '= ' + box(30) + ' hundratal', '= ' + box('3' + z('000'))]), t:'30 hundratal är 3000. Se upp: tre nollor! Nollan i tabellsvaret 30 ska stå kvar.' },
    ];
    if (moment === 'talsorter') return [
      { v:rows([teHead(4, 28)]), t:'Här delar du upp talet i tiotal (T) och ental (E) och räknar dem var för sig.' },
      { v:rows([teHead(4, 28), '= 4 · ' + box(20) + ' + 4 · ' + box(8)]), t:'Första raden: dela upp 28 i tiotalen 20 och entalen 8.' },
      { v:rows([teHead(4, 28), '= 4 · ' + box(20) + ' + 4 · ' + box(8), '= ' + box(80) + ' + ' + box(32)]), t:'Andra raden: räkna båda delarna. 4 · 20 = 80 och 4 · 8 = 32.' },
      { v:rows([teHead(4, 28), '= 4 · ' + box(20) + ' + 4 · ' + box(8), '= ' + box(80) + ' + ' + box(32), '= ' + box(112)]), t:'Tredje raden: lägg ihop. 80 + 32 = 112.' },
      { v:rows([teHead(4, 28), '= 4 · ' + box(20) + ' + 4 · ' + box(8), '= ' + box(80) + ' + ' + box(32), '= ' + box(112)]), t:'I uppgifterna fyller du i rutorna en i taget. Knappen Nästa hoppar till nästa ruta.' },
    ];
    if (moment === 'uppstallning') {
      const t = L.makeUpp(17, 32), W = t.width;
      const row = (v, n) => { const d = L.digitsOf(v), out = Array(W).fill(null); for (let i = 0; i < Math.min(n == null ? d.length : n, d.length); i++) out[i] = d[i]; return out; };
      const P = (vals, opts) => paperHTML(t, Object.assign({ vals, readonly:true }, opts || {}));
      const mem = (c, d) => { const m = Array(W).fill(null); m[c] = d; return m; };
      return [
        { v:P({}), t:'Här ställer du upp gångertal. Det större talet står överst, och du räknar från höger.' },
        { v:P({ p1:row(224, 1), m:mem(1, 1) }), t:'Börja med entalet 7 i 17: 7 · 2 = 14. Skriv 4 och lägg 1 i minnet ovanför.' },
        { v:P({ p1:row(224), m:mem(1, 1) }), t:'Sedan 7 · 3 = 21, och minnessiffran 1 gör det till 22. Första raden blir 224.' },
        { v:P({ p1:row(224), p2:row(0, 1) }, { pulse:true }), t:'Nu tiotalet 1 i 17. Det betyder 10. Skriv därför en nolla i den grå rutan först.' },
        { v:P({ p1:row(224), p2:row(320) }), t:'Sedan 1 · 32 = 32, till vänster om nollan. Andra raden blir 320.' },
        { v:P({ p1:row(224), p2:row(320), s:row(544) }), t:'Lägg ihop raderna: 224 + 320 = 544.' },
        { v:P({ p1:row(224), p2:row(320), s:row(544) }, { pulse:true }), t:'Kom ihåg nollan i den grå rutan och minnessiffrorna. Med en ensiffrig faktor räcker svarsraden.' },
        { v:`<div style="color:var(--accent)">${svg('target')}</div>`, t:'I uppgifterna trycker du på en ruta och skriver. Knappen Nästa rad hoppar ner till nästa rad.' },
      ];
    }
    /* problem: skriv uttrycket och räkna */
    const shop = shopHTML();
    const q = '<p class="mp-text">Alva köper 3 pennor och 2 sudd. Hur mycket kostar det?</p>';
    return [
      { v:shop, t:'Här löser du problem i två steg. Prislistan visar vad sakerna kostar.' },
      { v:shop + q, t:'Läs frågan. Skriv sedan ett uttryck för det du ska räkna ut.' },
      { v:q + rows([box('3 · 7 + 2 · 4', 'wide')]), t:'3 pennor kostar 3 · 7 och 2 sudd kostar 2 · 4. Uttrycket blir 3 · 7 + 2 · 4.' },
      { v:q + rows([box('3 · 7 + 2 · 4', 'wide'), '= ' + box(21) + ' + ' + box(8)]), t:'Räkna gånger först: 3 · 7 = 21 och 2 · 4 = 8.' },
      { v:q + rows([box('3 · 7 + 2 · 4', 'wide'), '= ' + box(21) + ' + ' + box(8), '= ' + box(29) + ' kr']), t:'Sedan plus: 21 + 8 = 29. Det kostar 29 kr.' },
      { v:rows(['6 · 7 + 34', '= ' + box(42) + ' + 34', '= ' + box(76)]), t:'Gånger först gäller alltid, även utan prislista: 6 · 7 = 42 först, sedan 42 + 34 = 76.' },
    ];
  }
  function sheetDemo() {
    const ex = [[6, 7], [3, 8], [9, 4], [7, 7], [2, 9]], ex2 = [[8, 6], [4, 4], [10, 3], [5, 9], [7, 8]];
    const col = E => E.map(([a, b]) => `<div class="mp-sr"><span class="ex">${a} · ${b} =</span>${box('')}</div>`).join('');
    return `<div class="mp-sheet demo"><div class="col">${col(ex)}</div><div class="col">${col(ex2)}</div></div>`;
  }

  function showIntro(moment, i) {
    const lv = level(), st = introSteps(moment, lv), s = st[i], last = i === st.length - 1;
    S = { mode:'intro', moment, i };
    frame('Så här gör du', 'prov', 'Tillbaka', `<button class="mp-skip" data-act="introskip">Hoppa över</button>`, `
      <div class="mp-intro">
        <div class="mp-vis">${s.v}</div>
        <div class="mp-say">${esc(s.t)}</div>
        <div class="mp-dots">${st.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
        <div class="mp-navrow">
          ${i > 0 ? `<button class="mp-cta sec" data-act="introprev" aria-label="Föregående">${svg('back')}</button>` : ''}
          <button class="mp-cta" data-act="${last ? 'introskip' : 'intronext'}">${last ? 'Börja öva' : 'Nästa'} ${svg('next')}</button>
        </div>
      </div>`);
  }

  /* ══════════════════════════════════════════════════════════
     PASSEN: öva (nötloop), blad (tabelltestet), svag, prov
  ══════════════════════════════════════════════════════════ */
  function startOva(moment) {
    const lv = level();
    if (moment === 'tabell') return startSheet();
    startDrill('ova', L.genMoment(moment, lv, L.ovaCount(moment, lv)), moment);
  }
  function startDrill(mode, items, moment) {
    stopSprint();
    S = { mode, moment, lv:level(), drill:MP.createDrill(items), start:Date.now(), touched:false };
    renderTask();
  }
  function startSheet() {
    stopSprint();
    S = { mode:'sheet', moment:'tabell', lv:level(), task:L.makeSheet(level()), start:Date.now(), touched:false };
    renderTask();
  }
  function startProv() {
    const lv = level();
    S = { mode:'prov', lv:L.PROV_LEVEL, items:L.buildProv(provId, lv), idx:0, results:[], start:Date.now(), touched:false };
    renderTask();
  }
  function curTask() {
    if (!S) return null;
    if (S.mode === 'prov' || S.mode === 'sprint') return S.items[S.idx] || null;
    if (S.mode === 'sheet') return S.task;
    return S.drill ? S.drill.current() : null;
  }

  function header(t, fb) {
    let right;
    if (S.mode === 'sprint') right = `<span class="mp-timer" id="mp-timer">${svg('timer')}<span id="mp-tt">${clock(S.left)}</span></span>`;
    else if (S.mode === 'sheet') right = `<span class="mp-timer mp-score">${fb ? fb.okCount : '&nbsp;&nbsp;'}<small>/20</small></span>`;
    else {
      const done = S.mode === 'prov' ? S.idx : S.drill.progress().done;
      const tot  = S.mode === 'prov' ? S.items.length : S.drill.progress().total;
      right = `<span class="header-progress"><span class="progress-bar"><i style="width:${Math.round(100 * done / tot)}%"></i></span><span class="hp-label num">${Math.min(done + 1, tot)}/${tot}</span></span>`;
    }
    const title = S.mode === 'prov' ? 'Provet' : S.mode === 'sprint' ? 'Tabellsprint' : S.mode === 'sheet' ? 'Tabelltest' : 'Öva';
    return { title, right };
  }

  /* Inmatningen per typ. "Rutor" (v[] + fokus f) delas av tio, te, prob-raderna och bladet. */
  function freshInput(t) {
    const blanks = n => Array(n).fill('');
    if (t.type === 'num') return { kind:'num', v:'' };
    if (t.type === 'tio' || t.type === 'te') return { kind:'boxes', v:blanks(t.fields.length), f:0 };
    if (t.type === 'sheet') return { kind:'sheet', v:blanks(t.items.length), f:0 };
    if (t.type === 'prob') {
      if (t.needExpr) return { kind:'prob', phase:'expr', toks:[], v:[], f:0 };
      const terms = L.parseExpr(t.expr);
      return { kind:'prob', phase:'rows', toks:null, exprStr:t.expr, terms, v:blanks(L.exprRows(terms).boxes.length), f:0 };
    }
    const W = t.width, blank = () => Array(W).fill(null);
    const rws = t.two ? ['p1', 'p2', 's'] : ['s'];
    const vals = { m:blank() }; rws.forEach(r => vals[r] = blank());
    return { kind:'upp', rows:rws, vals, f:{ row:rws[0], col:0 }, back:null };
  }

  /* fb + task: återkopplingen ritas på uppgiften som just besvarades (nötloopen har redan gått vidare) */
  function renderTask(fb, keep, task) {
    const t = task || curTask();
    if (!t) return finish();
    if (!fb && !keep) { IN = freshInput(t); locked = false; }
    const H = header(t, fb);
    const leftAct = S.mode === 'sprint' ? 'sprintstop' : 'avsluta';
    frame(H.title, leftAct, 'Avsluta', H.right, `
      <div class="mp-q${t.type === 'sheet' ? ' top' : ''}" id="mp-q">${questionHTML(t, fb)}</div>
      <div id="mp-ctrl" style="flex-shrink:0">${fb ? fb.html : padHTML(t)}</div>`);
    updKlar();
  }

  /* ── Frågekortet ── */
  function shopHTML() {
    return `<div class="mp-shop">${L.SHOP.map(s => `<div>${shopIcon(s.id)}<span>${esc(s.one)}<b>${s.price} kr</b></span></div>`).join('')}</div>`;
  }
  function ansBox(v, cls) { return `<span class="mp-ans ${cls || ''}" id="mp-a">${esc(v || '')}</span>`; }
  /* En ruta i rutsystemet: index i, med facit när svaret visas */
  function fbox(t, i, fb, facit, row) {
    if (fb && fb.showAns) return row != null && fb.reveal != null && row > fb.reveal
      ? '<span class="mp-ans sm"></span>'                       // raden visas när förklaringen kommer dit
      : `<span class="mp-ans sm ok">${esc(L.fmt(facit))}</span>`;
    const cls = !fb && IN.f === i ? ' focus' : '';
    return `<span class="mp-ans sm${cls}" data-act="bx" data-i="${i}">${esc(IN.v[i] || '')}</span>`;
  }
  function questionHTML(t, fb) {
    const show = fb && fb.showAns;
    if (t.type === 'num') {
      const v = show ? String(t.answer) : IN.v, cls = fb ? (fb.ok ? 'ok' : 'bad') : 'focus';
      return big(`${esc(t.text)} = ${ansBox(v, show ? 'ok' : cls)}`);
    }
    if (t.type === 'tio') {
      return `<p class="mp-text sm">Räkna. Skriv i rutorna.</p>` + rows([
        `${esc(t.text)} = ${esc(t.given)}`,
        `= ${fbox(t, 0, fb, t.fact, 1)} ${esc(t.unit)}`,
        `= ${fbox(t, 1, fb, t.answer, 2)}`]);
    }
    if (t.type === 'te') {
      const f = t.fields.map(x => x.ans);
      return `<p class="mp-text sm">Dela upp i tiotal och ental. Skriv i rutorna.</p>` + rows([
        teHead(t.a, t.b),
        `= ${t.a} · ${fbox(t, 0, fb, f[0], 1)} + ${t.a} · ${fbox(t, 1, fb, f[1], 1)}`,
        `= ${fbox(t, 2, fb, f[2], 2)} + ${fbox(t, 3, fb, f[3], 2)}`,
        `= ${fbox(t, 4, fb, f[4], 3)}`]);
    }
    if (t.type === 'prob') return probHTML(t, fb);
    if (t.type === 'sheet') return sheetHTML(t, fb);
    /* upp */
    const vals = show ? Object.assign({ m:fb.mem || Array(t.width).fill(null) }, L.uppFacitRows(t)) : IN.vals;
    return `<p class="mp-text sm">Ställ upp och räkna: <b class="mp-expr">${esc(t.text)}</b></p>
      ${paperHTML(t, { vals, readonly:!!fb, focus:fb ? null : IN.f, ok:show, pulse:show && fb.cls === 'nolla' })}
      ${t.two && !fb ? '<p class="mp-greyhint">Den grå rutan: nollan på tiotalsraden</p>' : ''}`;
  }

  /* Problemlösningen: skriv uttrycket (fas 1), räkna gånger först rad för rad (fas 2) */
  function probHTML(t, fb) {
    const show = fb && fb.showAns;
    let h = t.shop ? shopHTML() + `<p class="mp-text">${esc(t.text)}</p>` : `<p class="mp-text">${esc(t.text)}</p>`;
    const lines = [];
    /* uttrycket: barnets (fas 1) eller det givna */
    let exprShown, terms;
    if (show) { terms = IN.terms || L.parseExpr(t.expr); exprShown = L.exprText(terms); }
    else if (IN.phase === 'expr') exprShown = IN.toks.join(' ');
    else { terms = IN.terms; exprShown = IN.exprStr; }
    if (t.needExpr) {
      if (IN.phase === 'expr' && !fb) lines.push(`<span class="mp-ans sm wide focus" id="mp-a">${esc(exprShown)}</span>`);
      else lines.push(`<span class="mp-ans sm wide ok">${esc(exprShown)}</span>`);
    } else lines.push(esc(t.expr));
    if (terms && (IN.phase === 'rows' || show)) {
      const R = L.exprRows(terms);
      let bi = 0;
      lines.push('= ' + R.r1.map(x => (x.op ? ` ${x.op} ` : '') + (x.box ? fbox(t, bi++, fb, x.v, 1) : x.v)).join(''));
      lines.push('= ' + fbox(t, bi, fb, R.answer, 2) + (t.unit ? ' ' + esc(t.unit) : ''));
    }
    h += (t.needExpr ? `<p class="mp-text sm">${IN.phase === 'expr' && !fb ? 'Skriv uttrycket med · + och −.' : 'Räkna gånger först.'}</p>` : '') + rows(lines);
    return h;
  }

  /* Tabelltestet: 20 tal i två kolumner */
  function sheetHTML(t, fb) {
    const per = fb && fb.per;
    const cell = (it, i) => {
      let cls = 'mp-sr';
      if (per) cls += per[i] ? ' ok' : ' bad';
      else if (IN.f === i) cls += ' focus';
      const fix = per && !per[i] ? `<span class="fix">${it.answer}</span>` : '';
      return `<button class="${cls}" ${per ? '' : `data-act="bx" data-i="${i}"`}><span class="ex">${esc(it.text)} =</span><span class="mp-ans xs">${esc(IN.v[i] || '')}</span>${fix}</button>`;
    };
    const half = Math.ceil(t.items.length / 2);
    return `<div class="mp-sheet"><div class="col">${t.items.slice(0, half).map((it, i) => cell(it, i)).join('')}</div>
      <div class="col">${t.items.slice(half).map((it, i) => cell(it, i + half)).join('')}</div></div>`;
  }

  /* Pappret: kolumner från vänster W-1 … 0 (0 = entalet) */
  function paperHTML(t, o) {
    const W = t.width, idx = [];
    for (let i = W - 1; i >= 0; i--) idx.push(i);
    const vals = o.vals || {};
    const fix = (n, i) => { const d = L.digitsOf(n); return i < d.length ? `<div class="mp-c fix" style="color:${COLV[Math.min(i, 3)]}">${d[i]}</div>` : '<div class="mp-c ghost"></div>'; };
    const inCell = (row, i) => {
      const v = vals[row] ? vals[row][i] : null;
      const grey = row === 'p2' && i === 0;
      const foc = o.focus && o.focus.row === row && o.focus.col === i;
      const cls = ['mp-c', 'in', v != null ? 'has' : '', grey ? 'grey' : '', foc ? 'focus' : '', o.ok ? 'ok' : '', grey && o.pulse ? 'pulse' : ''].join(' ');
      return `<div class="${cls}" ${o.readonly ? '' : `data-act="cell" data-row="${row}" data-col="${i}"`}>${v != null ? v : ''}</div>`;
    };
    const memCell = i => {
      if (i === 0) return '<div class="mp-m"></div>';
      const v = vals.m ? vals.m[i] : null;
      const foc = o.focus && o.focus.row === 'm' && o.focus.col === i;
      if (o.readonly) return `<div class="mp-m">${v != null ? v : ''}</div>`;
      return `<div class="mp-m in${foc ? ' focus' : ''}" data-act="cell" data-row="m" data-col="${i}" aria-label="Minnessiffra">${v != null ? v : ''}</div>`;
    };
    const line = `<tr class="mp-line"><td></td><td colspan="${W}"></td></tr>`;
    let h = `<table class="mp-paper"><tbody>
      <tr><td></td>${idx.map(memCell).map(x => `<td>${x}</td>`).join('')}</tr>
      <tr><td></td>${idx.map(i => `<td>${fix(t.top, i)}</td>`).join('')}</tr>
      <tr><td class="mp-sign">·</td>${idx.map(i => `<td>${fix(t.bot, i)}</td>`).join('')}</tr>${line}`;
    if (t.two) h += `<tr><td></td>${idx.map(i => `<td>${inCell('p1', i)}</td>`).join('')}</tr>
      <tr><td class="mp-sign">+</td>${idx.map(i => `<td>${inCell('p2', i)}</td>`).join('')}</tr>${line}`;
    h += `<tr><td></td>${idx.map(i => `<td>${inCell('s', i)}</td>`).join('')}</tr></tbody></table>`;
    return h;
  }

  /* ── Knappsatsen ── */
  function padHTML(t) {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<button class="mp-k" data-act="key" data-k="${k}">${k}</button>`).join('');
    const erase = `<button class="mp-k er" data-act="key" data-k="erase" aria-label="Sudda">${svg('erase')}</button>`;
    const klar = `<button class="mp-klar" id="mp-klar" data-act="klar" disabled>${svg('check')}<span>Klar</span></button>`;
    if (t.type === 'prob' && IN.phase === 'expr')
      return `<div class="mp-pad r5">${digits}${erase}<button class="mp-k" data-act="key" data-k="0">0</button>
        <button class="mp-k op" data-act="key" data-k="·" aria-label="gånger">·</button>
        <button class="mp-k op" data-act="key" data-k="+" aria-label="plus">+</button>
        <button class="mp-k op z2" data-act="key" data-k="−" aria-label="minus">−</button>${klar}</div>`;
    const multi = IN.kind === 'boxes' || IN.kind === 'sheet' || (IN.kind === 'prob' && IN.v.length > 1);
    const nx = IN.kind === 'sheet' ? `<button class="mp-k nx" data-act="key" data-k="next">Nästa ${svg('down')}</button>`
             : multi ? `<button class="mp-k nx" data-act="key" data-k="next">Nästa ruta ${svg('right')}</button>`
             : t.type === 'upp' && t.two ? `<button class="mp-k nx" data-act="key" data-k="next">Nästa rad ${svg('down')}</button>` : '';
    return `<div class="mp-pad${IN.kind === 'sheet' ? ' low' : ''}">${digits}${erase}
      <button class="mp-k${nx ? '' : ' z2'}" data-act="key" data-k="0">0</button>${nx}${klar}</div>`;
  }
  function canSubmit() {
    if (!IN) return false;
    if (IN.kind === 'num') return IN.v.length > 0;
    if (IN.kind === 'boxes') return IN.v.every(x => x.length > 0);
    if (IN.kind === 'sheet') return IN.v.some(x => x.length > 0);
    if (IN.kind === 'prob') return IN.phase === 'expr' ? IN.toks.length > 0 && /\d$/.test(IN.toks[IN.toks.length - 1]) : IN.v.every(x => x.length > 0);
    return IN.vals.s.some(d => d != null);
  }
  function updKlar() { const k = document.getElementById('mp-klar'); if (k) k.disabled = !canSubmit() || locked; }

  function press(k) {
    const t = curTask();
    if (!t || locked || !IN) return;
    S.touched = true;
    if (IN.kind === 'num') {
      if (k === 'erase') IN.v = IN.v.slice(0, -1);
      else if (/^\d$/.test(k) && IN.v.length < 6) IN.v = (IN.v === '0' ? '' : IN.v) + k;
    } else if (IN.kind === 'prob' && IN.phase === 'expr') {
      const T = IN.toks, last = T[T.length - 1];
      if (k === 'erase') { if (last) { if (last.length > 1) T[T.length - 1] = last.slice(0, -1); else T.pop(); } }
      else if (/^\d$/.test(k)) { if (last && /^\d+$/.test(last)) { if (last.length < 4) T[T.length - 1] = (last === '0' ? '' : last) + k; } else if (T.length < 9) T.push(k); }
      else if (['·', '+', '−'].includes(k)) { if (last && /^\d+$/.test(last)) T.push(k); else if (last) T[T.length - 1] = k; }
    } else if (IN.kind === 'boxes' || IN.kind === 'sheet' || IN.kind === 'prob') {
      const n = IN.v.length;
      if (k === 'next') IN.f = (IN.f + 1) % n;
      else if (k === 'erase') { if (IN.v[IN.f]) IN.v[IN.f] = IN.v[IN.f].slice(0, -1); else if (IN.f > 0) IN.f--; }
      else if (/^\d$/.test(k) && IN.v[IN.f].length < 5) IN.v[IN.f] = (IN.v[IN.f] === '0' ? '' : IN.v[IN.f]) + k;
    } else uppPress(t, k);
    snd('click');
    refreshQ(t);
  }
  /* Uppställningen: siffran skrivs i rutan med fokus och fokus flyttar ett steg åt vänster.
     En minnessiffra (den röda raden) är frivillig; efter den går fokus tillbaka. */
  function uppPress(t, k) {
    const f = IN.f, W = t.width, rowVals = IN.vals[f.row];
    if (k === 'next') {
      const i = IN.rows.indexOf(f.row === 'm' ? (IN.back || {}).row : f.row);
      IN.f = { row:IN.rows[Math.min(i + 1, IN.rows.length - 1)], col:0 }; IN.back = null;
      return;
    }
    if (k === 'erase') {
      if (rowVals[f.col] != null) rowVals[f.col] = null;
      else if (f.row !== 'm' && f.col > 0) { IN.f = { row:f.row, col:f.col - 1 }; IN.vals[f.row][f.col - 1] = null; }
      return;
    }
    if (!/^\d$/.test(k)) return;
    rowVals[f.col] = +k;
    if (f.row === 'm') { IN.f = IN.back || { row:IN.rows[0], col:0 }; IN.back = null; return; }
    if (f.col < W - 1) IN.f = { row:f.row, col:f.col + 1 };
  }
  function refreshQ(t) {
    const q = document.getElementById('mp-q');
    if (q) q.innerHTML = questionHTML(t);
    updKlar();
  }

  const num = x => x === '' ? null : +x;
  function readResp(t) {
    if (t.type === 'num') return num(IN.v);
    if (t.type === 'tio' || t.type === 'te' || t.type === 'sheet') return IN.v.map(num);
    if (t.type === 'prob') return { expr:IN.exprStr, rows:IN.v.map(num) };
    return { p1:IN.vals.p1, p2:IN.vals.p2, s:IN.vals.s };
  }

  function submit() {
    const t = curTask();
    if (!t || locked || !canSubmit()) return;
    S.touched = true;
    /* Problemlösningens första fas: uttrycket */
    if (t.type === 'prob' && IN.phase === 'expr') {
      const str = IN.toks.join(' ');
      if (L.exprOk(t, str)) {
        IN.exprStr = str; IN.terms = L.parseExpr(str); IN.phase = 'rows';
        IN.v = Array(L.exprRows(IN.terms).boxes.length).fill(''); IN.f = 0;
        snd('click');
        return renderTask(null, true);
      }
      return answered(t, { ok:false, cls:'uttryck' });
    }
    answered(t, L.check(t, readResp(t)));
  }
  function answered(t, res) {
    if (S.mode === 'sprint') return sprintAnswer(t, res.ok);
    if (S.mode === 'prov') {
      if (t.type === 'sheet') res.per.forEach(ok => S.results.push({ moment:'tabell', ok }));
      else S.results.push({ moment:t.moment, ok:res.ok, cls:res.cls });
      S.idx++;
      snd('click');
      return renderTask();
    }
    if (S.mode === 'sheet') return sheetResult(t, res);
    S.drill.answer(res.ok);
    if (res.ok) {
      locked = true; snd('correct');
      renderTask({ ok:true, showAns:false, html:`<div class="mp-fb good"><h3>${svg('check')}Rätt!</h3>
        <button class="mp-cta" data-act="next">Nästa ${svg('next')}</button></div>` }, true, t);
      return;
    }
    snd('wrong');
    showWrong(t, res);
  }

  /* Tabelltestet i övningen: /20, de fel talen med rätt svar, sedan nötning av dem */
  function sheetResult(t, res) {
    locked = true;
    const wrongItems = t.items.filter((_, i) => !res.per[i]);
    S.wrongItems = wrongItems;
    const s = readSt(), p = provSt(s);
    p.ova.tabell = { date:new Date().toISOString(), ok:res.okCount, total:t.items.length, level:S.lv };
    writeSt(s);
    snd(res.okCount === t.items.length ? 'fanfare' : 'correct');
    const html = `<div class="mp-fb good" style="padding:10px 12px"><h3>${svg('check')}${res.okCount} av ${t.items.length} rätt</h3>
      <div class="mp-navrow">${wrongItems.length ? `<button class="mp-cta" data-act="sheetnot">${svg('again')}Nöt de ${wrongItems.length} som blev fel</button>` : ''}
      <button class="mp-cta sec" data-act="prov">Klar</button></div></div>`;
    renderTask({ ok:res.ok, per:res.per, okCount:res.okCount, html }, true, t);
  }

  /* Fel i övningen: svaret visas; förklaringen i steg; samma uppgift direkt igen */
  function explainSteps(t, res) {
    if (t.moment === 'tiotal') {
      const lead = { nollfalla:'Se upp med nollan i tabellsvaret!', nollor:'Räkna nollorna en gång till.', tabell:'Kolla tabellsvaret på första raden.' }[res.cls];
      const st = L.explainTiotal(t).map(s => s.text);
      return lead ? [lead].concat(st) : st;
    }
    if (t.moment === 'problem') {
      const st = t.steps.map(s => s.text);
      return res.cls === 'uttryck' ? [`Uttrycket kan vara ${t.expr}.`].concat(st) : st;
    }
    if (t.moment === 'talsorter') { const f = t.fields.map(x => x.ans); return [`Första raden: ${t.b} delas upp i ${f[0]} och ${f[1]}.`, `Andra raden: ${t.a} · ${f[0]} = ${f[2]} och ${t.a} · ${f[1]} = ${f[3]}.`, `Tredje raden: ${f[2]} + ${f[3]} = ${f[4]}.`]; }
    if (t.moment === 'uppstallning') return [L.UPP_FEEDBACK[res.cls] || L.UPP_FEEDBACK.fel];
    return [`${t.text} = ${t.answer}.`];
  }
  function memFacit(t) {
    /* minnessiffrorna för första raden (entalets rad), i röd text över kolumnen de går till */
    const m = Array(t.width).fill(null), mult = t.two ? t.ones : t.bot, ds = L.digitsOf(t.top);
    let c = 0;
    ds.forEach((d, i) => { const p = d * mult + c; c = Math.floor(p / 10); if (i < ds.length - 1 && c > 0) m[i + 1] = c; });
    return m;
  }
  function showWrong(t, res) {
    locked = true;
    if (t.type === 'prob' && res.cls === 'uttryck') IN.terms = null;   // visa det rätta uttrycket
    S.fb = { t, res, steps:explainSteps(t, res), i:0 };
    renderWrong();
  }
  function renderWrong() {
    const { t, res, steps, i } = S.fb, last = i >= steps.length - 1;
    const html = `<div class="mp-fb"><h3>Inte riktigt. Så här blir det:</h3>
      <p class="mp-step">${esc(steps[i])}</p>
      ${steps.length > 1 ? `<div class="mp-dots">${steps.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div>` : ''}
      <button class="mp-cta${last ? '' : ' sec'}" data-act="${last ? 'retry' : 'fbnext'}">${last ? `${svg('again')}Försök igen` : `Nästa ${svg('next')}`}</button></div>`;
    renderTask({ ok:false, showAns:true, cls:res.cls, reveal:revealFor(t, res, steps, i), mem:t.type === 'upp' ? memFacit(t) : null, html }, true, t);
  }

  /* Hur många "="-rader som syns i facit vid förklaringens steg i (ett steg = en rad) */
  function revealFor(t, res, steps, i) {
    const last = i >= steps.length - 1;
    if (t.type === 'prob') return res.cls === 'uttryck' ? i : i + 1;
    if (t.type === 'te') return i + 1;
    if (t.type === 'tio') { const tab = steps.findIndex(x => x.startsWith('Räkna tabellen')); return last ? 2 : i >= tab ? 1 : 0; }
    return null;
  }
  function finish() {
    if (S.mode === 'prov') return showKvitto();
    return showDrillDone();
  }

  /* ── Slutet på ett övningspass ── */
  function showDrillDone() {
    const st = S.drill.stats();
    const R = MP.receiptFor([{ type:S.mode, asked:st.asked, firstOk:st.firstOk, wrongFirst:st.wrongFirst }], Date.now() - S.start);
    if (S.mode === 'ova') {
      const s = readSt(), p = provSt(s);
      p.ova[S.moment] = { date:new Date().toISOString(), ok:R.correct, total:R.total, level:S.lv };
      writeSt(s);
    }
    snd('win');
    const title = S.mode === 'svag' ? 'Det som var svårt' : momentOf(S.moment).title;
    const again = S.mode !== 'svag' ? `<button class="mp-cta sec" data-act="ova" data-id="${S.moment}">${svg('again')}Öva igen</button>` : '';
    frame('Bra nött!', 'prov', 'Tillbaka', '', `
      <div class="mp-head" style="margin-top:auto"><span class="mp-starb">${svg('star')}</span><h2>${esc(title)}</h2><p>${esc(levelName(S.lv))}</p></div>
      <div class="mp-rc">
        <div class="mp-rc-row"><span class="nm">Rätt på första försöket</span><b>${R.correct} av ${R.total}</b></div>
        <div class="mp-rc-row"><span class="nm">Rättade fel</span><b>${R.fixed}</b></div>
        <div class="mp-rc-row"><span class="nm">Tid</span><b>${esc(MP.durTxt(R.secs))}</b></div>
      </div>
      <p class="mp-note" style="font-size:15px">${esc(MP.praiseFor(R.pct))}</p>
      <div style="margin-top:auto;display:flex;flex-direction:column;gap:8px">
        ${again}<button class="mp-cta" data-act="prov">Till provet ${svg('next')}</button></div>`);
    S = null;
  }

  /* ── Kvittot efter provet ── */
  function showKvitto() {
    const sum = L.provSummary(provId, S.results), iso = new Date().toISOString();
    const s = readSt(), p = provSt(s);
    const rec = { id:Date.now(), date:iso, level:S.lv, ok:sum.ok, total:sum.total, per:sum.per.map(x => ({ id:x.id, ok:x.ok, total:x.total })), seen:null };
    p.tests.unshift(rec); if (p.tests.length > 30) p.tests.length = 30;
    writeSt(s);
    S.rec = rec; S.weak = sum.weak; S.mode = 'kvitto';
    snd('fanfare');
    const praise = sum.ok === sum.total ? 'Allt satt!' : sum.weak.length ? 'Bra kämpat! Nu vet du vad du ska öva på.' : 'Starkt! Alla moment är gröna.';
    const when = MP.fmtWhen(iso);
    frame('Provet klart', 'prov', 'Klar', '', `
      <div class="mp-head"><span class="mp-starb">${svg('star')}</span><h2>${sum.ok} av ${sum.total} rätt</h2><p>${esc(praise)}</p></div>
      <div class="mp-rc">
        <div class="mp-rc-top"><span class="mp-rc-k">${esc(prov().title)} · ${esc(levelName(S.lv))}</span><span class="mp-rc-when">${esc(when.charAt(0).toUpperCase() + when.slice(1))}</span></div>
        ${sum.per.map(x => { const m = momentOf(x.id); return `<div class="mp-rc-row"><span class="nm">${m.nr}. ${esc(m.title)}</span><b>${x.ok} av ${x.total}</b>
          <span class="mp-badge ${x.green ? 'g' : 'y'}">${x.green ? 'Klart' : 'Öva'}</span></div>`; }).join('')}
        <div class="mp-rc-foot"><span class="mp-ph" id="mp-ph">Plats för en vuxens stämpel</span><div class="mp-stamp" id="mp-stamp"></div></div>
      </div>
      <button class="hold" id="mp-hold" aria-label="Sett av en vuxen. Håll inne en och en halv sekund."><i class="hold-fill"></i><span class="hold-t">${svg('hand')}Håll inne: Sett av en vuxen</span></button>
      <div style="margin-top:auto;display:flex;flex-direction:column;gap:8px">
        ${sum.weak.length ? `<button class="mp-cta" data-act="weak">${svg('target')}Öva på det som var svårt</button>` : ''}
        <button class="mp-cta sec" data-act="prov">Till provet</button></div>`);
    MP.bindHold(document.getElementById('mp-hold'), { onDone:stampKvitto });
  }
  function stampKvitto() {
    if (!S || !S.rec || S.rec.seen) return;
    const iso = new Date().toISOString();
    S.rec.seen = iso;
    const s = readSt(), p = provSt(s), r = p.tests.find(x => x.id === S.rec.id);
    if (r) { r.seen = iso; writeSt(s); }
    document.getElementById('mp-stamp').innerHTML = `<span class="st-in">${svg('check')}<span><b>Sett av en vuxen</b><small>${esc(MP.fmtStamp(iso))}</small></span></span>`;
    document.getElementById('mp-ph').classList.add('off');
    const h = document.getElementById('mp-hold');
    h.classList.add('done'); h.disabled = true; h.innerHTML = `<span class="hold-t">${svg('check')}Kvittot är stämplat</span>`;
    snd('correct');
  }

  /* ══════════════════════════════════════════════════════════
     TABELLSPRINTEN: 4 minuter, max 48, tiden syns bara här
  ══════════════════════════════════════════════════════════ */
  const clock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  function showSprintIntro() {
    stopSprint();
    S = { mode:'sprintintro' };
    const ps = provSt(readSt());
    frame('Tabellsprint', 'prov', 'Tillbaka', '', `
      <div class="mp-vis">${big(svg('timer').replace('class="mi"', 'class="mi" style="width:64px;height:64px;color:var(--accent)"'))}
        <p class="mp-text">Så många gångertal du hinner på 4 minuter, högst 48. Fel svar hoppas över.</p>
        <p class="mp-note">Sprinten ingår inte i provet.${ps.sprint.best ? ' Ditt bästa: ' + ps.sprint.best + ' rätt.' : ''}</p></div>
      <button class="mp-cta" data-act="sprintgo">${svg('next')}Starta</button>`);
  }
  function startSprint() {
    stopSprint();
    S = { mode:'sprint', items:L.genSprint(), idx:0, ok:0, left:L.SPRINT.secs, end:Date.now() + L.SPRINT.secs * 1000, start:Date.now(), touched:false };
    renderTask();
    sprintTimer = setInterval(() => {
      const scr = document.getElementById('screen-matteprov');
      if (!S || S.mode !== 'sprint' || !scr || !scr.classList.contains('active')) return stopSprint();
      S.left = Math.max(0, Math.ceil((S.end - Date.now()) / 1000));
      const el = document.getElementById('mp-tt');
      if (el) { el.textContent = clock(S.left); document.getElementById('mp-timer').classList.toggle('low', S.left <= 30); }
      if (S.left <= 0) sprintDone();
    }, 250);
  }
  function stopSprint() { if (sprintTimer) { clearInterval(sprintTimer); sprintTimer = null; } }
  function sprintAnswer(t, ok) {
    if (ok) { S.ok++; snd('correct'); } else snd('wrong');
    S.idx++;
    if (S.idx >= S.items.length) return sprintDone();
    if (ok) return renderTask();
    /* fel: rätt svar syns kort, sedan nästa tal (tiden går) */
    locked = true;
    const a = document.getElementById('mp-a');
    if (a) { a.textContent = String(t.answer); a.className = 'mp-ans ok'; }
    setTimeout(() => { if (S && S.mode === 'sprint') renderTask(); }, 900);
  }
  function sprintDone() {
    stopSprint();
    const n = S.ok, band = L.sprintBand(n);
    const s = readSt(), p = provSt(s);
    const newBest = n > (p.sprint.best || 0);
    p.sprint.best = Math.max(p.sprint.best || 0, n);
    p.sprint.last = { date:new Date().toISOString(), n };
    writeSt(s);
    S = { mode:'sprintdone' };
    snd('fanfare');
    frame('Tabellsprint', 'prov', 'Tillbaka', '', `
      <div class="mp-head" style="margin-top:auto"><div class="mp-bignum">${n}</div><h2>rätt av 48</h2><p>${newBest ? 'Nytt rekord!' : 'Ditt bästa: ' + p.sprint.best}</p></div>
      <div class="mp-bands">${L.SPRINT_BANDS.slice().reverse().map(b => `<div class="mp-band${b === band ? ' on' : ''}"><b>${b.lo}–${b.hi}</b>${esc(b.name)}</div>`).join('')}</div>
      <div style="margin-top:auto;display:flex;flex-direction:column;gap:8px">
        <button class="mp-cta" data-act="sprintgo">${svg('again')}Kör igen</button>
        <button class="mp-cta sec" data-act="prov">Till provet</button></div>`);
  }

  /* ══════════════════════════════════════════════════════════
     AVSLUTA
  ══════════════════════════════════════════════════════════ */
  function avsluta() {
    if (!S || !S.touched) return showProv();
    const r = root();
    if (document.getElementById('mp-ov')) return;
    const msg = S.mode === 'prov' ? `Avsluta provet? Du är på uppgift ${S.idx + 1} av ${S.items.length}, och provet sparas inte.` : 'Avsluta passet?';
    r.insertAdjacentHTML('beforeend', `<div class="mp-ov" id="mp-ov" data-act="ovno"><div class="mp-ovc"><p>${esc(msg)}</p>
      <div class="mp-navrow"><button class="mp-cta sec" data-act="ovno">Nej, fortsätt</button><button class="mp-cta" data-act="prov">Ja, avsluta</button></div></div></div>`);
  }

  /* ══════════════════════════════════════════════════════════
     HÄNDELSER
  ══════════════════════════════════════════════════════════ */
  function onClick(ev) {
    const el = ev.target.closest('[data-act]');
    if (!el || !root().contains(el)) return;
    if (el.id === 'mp-ov' && ev.target !== el) return;     // klick i rutan, inte bakgrunden
    const a = el.dataset.act, id = el.dataset.id;
    switch (a) {
      case 'back':      snd('click'); if (onBack) onBack(); break;
      case 'list':      snd('click'); showList(); break;
      case 'prov':      snd('click'); if (id) provId = id; showProv(); break;
      case 'level':     snd('click'); setLevel(id); showProv(); break;
      case 'ova':       snd('click'); showIntro(id, 0); break;
      case 'intronext': snd('click'); showIntro(S.moment, S.i + 1); break;
      case 'introprev': snd('click'); showIntro(S.moment, Math.max(0, S.i - 1)); break;
      case 'introskip': snd('click'); startOva(S.moment); break;
      case 'startprov': snd('click'); startProv(); break;
      case 'weak':      snd('click'); startDrill('svag', L.buildWeakPass(S.weak, S.rec.level)); break;
      case 'sprint':    snd('click'); showSprintIntro(); break;
      case 'sprintgo':  snd('click'); startSprint(); break;
      case 'sprintstop': stopSprint(); snd('click'); showProv(); break;
      case 'key':       press(el.dataset.k); break;
      case 'klar':      submit(); break;
      case 'next':      snd('click'); renderTask(); break;
      case 'fbnext':    snd('click'); S.fb.i++; renderWrong(); break;
      case 'retry':     snd('click'); S.fb = null; renderTask(); break;
      case 'avsluta':   avsluta(); break;
      case 'ovno':      { const o = document.getElementById('mp-ov'); if (o) o.remove(); break; }
      case 'bx':        if (!locked && IN && IN.v && el.dataset.i != null) { IN.f = +el.dataset.i; refreshQ(curTask()); } break;
      case 'sheetnot':  snd('click'); startDrill('not', S.wrongItems, 'tabell'); break;
      case 'cell':      if (!locked && IN && IN.kind === 'upp') {
                          const row = el.dataset.row, col = +el.dataset.col;
                          if (row === 'm' && IN.f.row !== 'm') IN.back = IN.f;
                          IN.f = { row, col }; refreshQ(curTask());
                        } break;
    }
  }
  function onKey(e) {
    const scr = document.getElementById('screen-matteprov');
    if (!scr || !scr.classList.contains('active') || !IN || locked || !S) return;
    if (/^\d$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') press('erase');
    else if (['·', '*', '+', '-', '−'].includes(e.key) && IN.kind === 'prob') press(e.key === '*' ? '·' : e.key === '-' ? '−' : e.key);
    else if (e.key === 'Enter') { if (IN.kind === 'sheet' && IN.f < IN.v.length - 1) press('next'); else submit(); }
    else if (e.key === 'Tab' && IN.kind !== 'num') { e.preventDefault(); press('next'); }
  }

  return { open, showList, showProv,
           /* bara för test i webbläsaren */
           _peek:() => ({ S, IN, task:curTask() }) };
})();

if (typeof window !== 'undefined') window.MatteProv = MatteProv;
