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
    bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
    pen:'<path d="M4 20l1.2-4.4L15.6 5.2a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.4 18.8z"/><path d="M13.8 7l3.2 3.2"/>',
    eraser:'<path d="M8.5 19.5h11"/><path d="M4.6 14.6l8.8-8.8a2 2 0 0 1 2.8 0l2.4 2.4a2 2 0 0 1 0 2.8L12 17.6a2 2 0 0 1-2.8 0z"/><path d="M8.8 10.4l5.2 5.2"/>',
    trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
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
    p.hard = p.hard || {};               // D38: det som var svårt (typ/felklass → { level, n, ok, last })
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
#mp-root .mp-body{flex:1;min-height:0;display:flex;flex-direction:column;gap:8px}
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
#mp-root .mp-q.fit .mp-c{width:44px;height:44px;font-size:26px}
#mp-root .mp-q.fit .mp-m{height:22px;font-size:16px}
#mp-root .mp-q.fit .mp-paper{border-spacing:5px 3px}
#mp-root .mp-help{font-size:13.5px;padding:5px 10px}
#mp-root .mp-k.op{font-size:28px;color:var(--accent)}
#mp-root .mp-q.fit{flex:0 0 auto;gap:6px;padding:8px 10px}
#mp-root .mp-guide{margin:0;display:flex;align-items:center;gap:6px;font-weight:900;font-size:14px;color:var(--accent);line-height:1.25;align-self:stretch}
#mp-root .mp-guide svg.mi{width:18px;height:18px}
#mp-root .mp-guide.hm{font-size:13px;font-weight:800;color:#7c2d12;background:#fff7ed;border:2px solid #fdba74;border-radius:12px;padding:4px 8px;align-items:flex-start}
#mp-root .mp-guide.hm.bit{color:#1e3a8a;background:#eff6ff;border-color:#93c5fd}
#mp-root .mp-guide.hm b{font-weight:900}
#mp-root .mp-c.fix.lit{box-shadow:0 0 0 3px #fb923c,0 0 12px rgba(251,146,60,.65);background:#fff7ed}
#mp-root .mp-guide .tx{flex:1;min-width:0}
#mp-root .mp-led{flex-shrink:0;width:44px;height:44px;margin:-8px -4px -8px 0;border-radius:12px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,var(--accent),var(--accent-light));box-shadow:0 4px 10px var(--glow)}
#mp-root .mp-led svg.mi{width:20px;height:20px}
#mp-root .mp-c.in.lit{box-shadow:0 0 0 3px #fb923c,0 0 10px rgba(251,146,60,.6)}
#mp-root .mp-pad5{display:grid;grid-template-columns:repeat(5,1fr);grid-auto-rows:48px;gap:6px;flex-shrink:0}
#mp-root .mp-pad5 .mp-k.nx{grid-column:span 2;font-size:14px}
#mp-root .mp-pad5 .mp-klar{grid-row:auto;grid-column:span 2;flex-direction:row;gap:6px;font-size:18px}
#mp-root .mp-pad5 .mp-klar svg.mi{width:24px;height:24px}
#mp-root .mp-pad5 .mp-klar.w1{grid-column:span 1;font-size:15px;gap:2px}
#mp-root .mp-pad5 .mp-klar.w1 span{display:none}
#mp-root .mp-pad5 .mp-klar.w4{grid-column:span 4}
@media (max-height:760px){#mp-root .mp-pad5{grid-auto-rows:44px;gap:5px}
  /* korta skärmar: talen i faktorerna är inga tryckytor och får krympa; kladden får resten */
  #mp-root .mp-q.fit .mp-c.fix{height:34px;font-size:24px}
  #mp-root .mp-q.fit .mp-m{height:18px;font-size:14px}
  #mp-root .mp-q.fit{padding:5px 8px;gap:4px}
  #mp-root .mp-body{gap:6px}
  #mp-root .app-header{margin-bottom:2px}
  #mp-root .mp-body .mp-scratch{min-height:64px;position:relative;padding:4px}
  /* kladdens verktyg som ikoner i kladdens hörn, så att ritytan får hela höjden */
  #mp-root .mp-scratch .mp-sc-bar{position:absolute;top:8px;right:8px;z-index:2;gap:4px}
  #mp-root .mp-scratch .mp-sc-l{display:none}
  #mp-root .mp-scratch .mp-sc-b{font-size:0;gap:0;padding:0;width:44px;justify-content:center;background:rgba(255,255,255,.92)}
  #mp-root .mp-scratch .mp-sc-b.on{background:var(--accent)}
  #mp-root .mp-scratch .mp-sc-b svg.mi{width:20px;height:20px}
  #mp-root .mp-scratch .mp-canvas{min-height:56px}
  #mp-root .mp-q.fit .mp-guide.hm{font-size:12.5px;padding:3px 7px}}
#mp-root .mp-notes{display:flex;flex-direction:column;gap:4px;align-self:stretch}
#mp-root .mp-nl{display:flex;align-items:center;gap:4px;flex-wrap:wrap;font-family:var(--font-head);font-weight:800;font-size:14.5px;color:var(--deep);font-variant-numeric:tabular-nums}
#mp-root .mp-np{display:inline-flex;align-items:center;gap:3px;margin-right:3px}
#mp-root .mp-nt{white-space:nowrap}
#mp-root .mp-nt.sm{font-family:var(--font-body);font-size:12.5px;font-weight:800;color:var(--ink-soft)}
#mp-root .mp-nb{min-width:46px;height:44px;padding:0 4px;border-radius:10px;border:2.5px dashed color-mix(in srgb,var(--accent) 40%,transparent);background:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer}
#mp-root .mp-nb.focus{border:3px solid var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}
#mp-root .mp-nb.ok{border:2.5px solid #22c55e;background:#dcfce7;color:#15803d}
#mp-root .mp-nb.bad{border:2.5px solid #fdba74;background:#fff7ed;color:#9a3412}
#mp-root .mp-c.in.lk{opacity:.32;border-style:dashed;cursor:default}
#mp-root .mp-c.in.sh{border:2px dotted rgba(100,116,139,.25);background:transparent}
#mp-root .mp-help{display:none;flex-shrink:0;border-radius:16px;padding:7px 12px;background:#fff7ed;border:2px solid #fdba74;color:#7c2d12;font-weight:800;font-size:14px;line-height:1.3}
#mp-root .mp-help.on{display:flex;flex-direction:column;gap:2px}
#mp-root .mp-help.bit{background:#eff6ff;border-color:#93c5fd;color:#1e3a8a}
#mp-root .mp-help b{display:flex;align-items:center;gap:6px;font-size:14.5px}
#mp-root .mp-help b svg.mi{width:18px;height:18px}
#mp-root .mp-ans.given,#mp-root .mp-c.in.given{border:2.5px solid #93c5fd;background:#dbeafe;color:#1e3a8a;border-style:solid}
#mp-root .mp-c.in.grey.given{background:#bfdbfe}
#mp-root .mp-sr.fixed .mp-ans{border:2px solid #93c5fd;background:#dbeafe;color:#1e3a8a}
#mp-root .mp-fb h3 small{font-family:var(--font-body);font-size:13px;font-weight:900;color:#1d4ed8;background:#dbeafe;border-radius:999px;padding:2px 8px;margin-left:4px}
#mp-root .mp-k3{display:inline-flex;gap:4px;flex-shrink:0}
#mp-root .mp-k3 i{font-style:normal;min-width:26px;height:24px;padding:0 5px;border-radius:8px;display:grid;place-items:center;font-family:var(--font-head);font-weight:800;font-size:14px;font-variant-numeric:tabular-nums}
#mp-root .mp-k3 i.d,#mp-root .mp-k3leg i.d{background:#dcfce7;color:#15803d}
#mp-root .mp-k3 i.h,#mp-root .mp-k3leg i.h{background:#dbeafe;color:#1d4ed8}
#mp-root .mp-k3 i.s,#mp-root .mp-k3leg i.s{background:#fee2e2;color:#b91c1c}
#mp-root .mp-k3leg{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:800;color:var(--ink-soft);flex-wrap:wrap}
#mp-root .mp-k3leg i{width:11px;height:11px;border-radius:3px;display:inline-block;margin-left:6px}
#mp-root .mp-k3leg i:first-child{margin-left:0}
#mp-root .mp-rc-row.leg{min-height:20px}
#mp-root .mp-k3l{margin:0;display:flex;justify-content:center}
#mp-root .mp-scratch{flex:1 1 0;min-height:88px;display:flex;flex-direction:column;gap:4px;background:var(--glass);border:1px solid var(--glass-line);border-radius:18px;box-shadow:var(--shadow-panel);padding:6px}
#mp-root .mp-sc-bar{display:flex;align-items:center;gap:6px;flex-shrink:0}
#mp-root .mp-sc-l{flex:1;font-size:11px;font-weight:900;color:var(--deep);text-transform:uppercase;letter-spacing:.06em;padding-left:4px}
#mp-root .mp-sc-b{min-height:44px;min-width:44px;padding:0 10px;border-radius:12px;display:inline-flex;align-items:center;gap:5px;font-weight:800;font-size:12.5px;color:var(--deep);background:var(--tint);border:1.5px solid color-mix(in srgb,var(--accent) 30%,transparent)}
#mp-root .mp-sc-b svg.mi{width:18px;height:18px}
#mp-root .mp-sc-b.on{background:var(--accent);color:#fff;border-color:var(--accent)}
#mp-root .mp-canvas{flex:1;min-height:40px;width:100%;display:block;touch-action:none;cursor:crosshair;border-radius:12px;border:2px dashed color-mix(in srgb,var(--accent) 30%,transparent);background:rgba(255,255,255,.8)}
@keyframes mp-pulse{0%,100%{box-shadow:0 0 0 0 rgba(234,88,12,0)}50%{box-shadow:0 0 0 6px rgba(234,88,12,.45)}}

/* Knappsatsen (som multdiv:s fria läge: hög Klar till höger) */
#mp-root .mp-k{border-radius:16px;font-family:var(--font-head);font-weight:800;font-size:24px;color:var(--deep);background:linear-gradient(180deg,#fff,var(--glass-strong));
  border:2px solid color-mix(in srgb,var(--accent) 18%,transparent);box-shadow:0 2px 0 color-mix(in srgb,var(--accent) 16%,transparent);display:grid;place-items:center}
#mp-root .mp-k:active{transform:scale(.94);background:color-mix(in srgb,var(--accent) 12%,#fff)}
#mp-root .mp-k.er{background:var(--tint)}
#mp-root .mp-k.nx{font-family:var(--font-body);font-size:13px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:4px;grid-column:3}
#mp-root .mp-klar{border-radius:18px;font-family:var(--font-head);font-weight:800;font-size:19px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#fff;
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
    const t = p && p.tests && p.tests.find(x => x.kind !== 'mitt');
    return t ? `Senast ${t.ok} av ${t.total} rätt direkt` : 'Inte gjort än';
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
        ${mittCard(ps)}
        <button class="mp-cta" data-act="startprov">${svg('paper')}Gör provet</button>
        <p class="mp-note">Tabelltestet och ${total - P.provCount.tabell} uppgifter till, utan klocka och utan hjälp. ${esc(lastTestTxt(provId))}.</p>
      </div>`);
  }

  /* "Mitt prov – det som var svårt": syns när det finns underlag och säger vad det tar upp */
  function mittCard(ps) {
    const tags = L.hardList(ps.hard);
    if (!tags.length) return '';
    const names = tags.slice(0, 3).map(L.tagLabel).join(', ') + (tags.length > 3 ? ` och ${tags.length - 3} till` : '');
    return `<button class="mp-row" data-act="mitt" style="min-height:58px">
      <span class="mp-nr alt">${svg('target')}</span>
      <span class="mp-tx"><b>Mitt prov – det som var svårt</b><small>${esc(names)}</small></span>${svg('chev', 'chev')}</button>`;
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
      const gl = txt => `<p class="mp-guide" style="max-width:340px">${svg('next')}<span class="tx">${esc(txt)}</span></p>`;
      /* Ensiffrig faktor (Dennis 19/10): en delprodukt per siffra, varje rad ett steg åt vänster */
      const e = L.makeUpp(687, 8), We = e.width;
      const sh = (v, i) => { const d = L.digitsOf(v), out = Array(We).fill(null); d.forEach((x, k) => { out[i + k] = x; }); return out; };
      const E = (vals, lit) => paperHTML(e, { vals, readonly:true, lit });
      const em = Array(We).fill(null); L.addCarries(e.parts.map(q => q.place)).forEach(c => { em[c.col] = c.val; });
      const r0 = sh(56, 0), r1 = sh(64, 1), r2 = sh(48, 2);
      return [
        { v:E({}), t:'Med en ensiffrig faktor räknar du en siffra i taget. Varje svar får en egen rad.' },
        { v:E({ r0 }, { top:[0], bot:[0] }), t:'Börja här: 8 · 7 = 56. Skriv det på första raden, med 6:an i entalet.' },
        { v:E({ r0, r1 }, { top:[1], bot:[0] }), t:'Nu 8 · 8 = 64: en rad ner och ett steg åt vänster. Raden börjar i tiotalet, och entalsrutan står tom.' },
        { v:E({ r0, r1, r2 }, { top:[2], bot:[0] }), t:'Sist 8 · 6 = 48, ett steg till åt vänster. Raden börjar i hundratalet.' },
        { v:E({ r0, r1, r2, m:em, s:sh(5496, 0) }), t:'Lägg ihop raderna. Minnessiffrorna skriver du i de röda rutorna ovanför raderna. Svaret är 5496.' },
        { v:P({}), t:'Med en tvåsiffrig faktor, som 17 · 32, blir det två rader och sedan summan. Det större talet står överst.' },
        { v:gl('Rad 1: 7 · 32 = 7 · 30 + 7 · 2') + P({}, { lit:{ top:[0, 1], bot:[0] } }), t:'Tankeraden ovanför visar hur rad 1 räknas: 7 · 32 delas upp i 7 · 30 och 7 · 2.' },
        { v:gl('Rad 1: 7 · 32 = 7 · 30 + 7 · 2 = 210 + 14 = 224') + P({ p1:row(224) }, { lit:{ top:[0, 1], bot:[0] } }), t:'7 · 30 = 210 och 7 · 2 = 14. Tillsammans blir det 224, som skrivs på rad 1.' },
        { v:gl('Rad 2 är tiotalet: skriv nollan i den grå rutan.') + P({ p1:row(224), p2:row(0, 1) }, { pulse:true }), t:'Rad 2 är tiotalet 1 i 17, alltså 10. Skriv därför först nollan i den grå rutan.' },
        { v:gl('1 · 32 = 1 · 30 + 1 · 2 = 30 + 2 = 32') + P({ p1:row(224), p2:row(320) }, { lit:{ top:[0, 1], bot:[1] } }), t:'Sedan 1 · 32 = 32, till vänster om nollan. Rad 2 blir 320.' },
        { v:gl('Lägg ihop raderna, en kolumn i taget.') + P({ p1:row(224), p2:row(320), s:row(544) }), t:'Lägg ihop raderna, en kolumn i taget: 224 + 320 = 544.' },
        { v:`<div style="color:var(--accent)">${svg('target')}</div>`, t:'I uppgifterna står tankeraden ovanför rutnätet. Pilen visar nästa led. Knappen Nästa rad hoppar ner när raden är klar.' },
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
     PASSEN: öva (nötloop), blad (tabelltestet), svag, prov, mitt prov
     D38: alla har hjälptrappan (fel → ledtråd → bit 1 → bit 2 → hela svaret och Nästa),
     kladden under knappsatsen och utfallen "rätt direkt", "rätt med hjälp", "fick svaret".
  ══════════════════════════════════════════════════════════ */
  const today = () => MP.spaced.fmtDay(new Date());
  function startOva(moment) {
    const lv = level();
    if (moment === 'tabell') return startSheet();
    startDrill('ova', L.genMoment(moment, lv, L.ovaCount(moment, lv)), moment);
  }
  function startDrill(mode, items, moment) {
    stopSprint();
    S = { mode, moment, lv:level(), drill:MP.createDrill(items), start:Date.now(), touched:false, outc:{ direkt:0, hjalp:0, svar:0 } };
    renderTask();
  }
  function startSheet() {
    stopSprint();
    S = { mode:'sheet', moment:'tabell', lv:level(), task:L.makeSheet(level()), start:Date.now(), touched:false };
    renderTask();
  }
  function startProv(mitt) {
    const items = mitt ? L.buildMittProv(provSt(readSt()).hard) : L.buildProv(provId, level());
    if (!items.length) return showProv();
    S = { mode:'prov', mitt:!!mitt, lv:L.PROV_LEVEL, items, idx:0, results:[], start:Date.now(), touched:false };
    renderTask();
  }
  function curTask() {
    if (!S) return null;
    if (S.mode === 'prov' || S.mode === 'sprint') return S.items[S.idx] || null;
    if (S.mode === 'sheet') return S.done ? null : S.task;
    return S.drill ? S.drill.current() : null;
  }
  const isDrill = () => S && (S.mode === 'ova' || S.mode === 'svag' || S.mode === 'not');

  function header(t) {
    let right;
    if (S.mode === 'sprint') right = `<span class="mp-timer" id="mp-timer">${svg('timer')}<span id="mp-tt">${clock(S.left)}</span></span>`;
    else if (S.mode === 'sheet') right = `<span class="mp-timer mp-score" id="mp-score">&nbsp;&nbsp;<small>/${t.items.length}</small></span>`;
    else {
      const done = S.mode === 'prov' ? S.idx : S.drill.progress().done;
      const tot  = S.mode === 'prov' ? S.items.length : S.drill.progress().total;
      right = `<span class="header-progress"><span class="progress-bar"><i style="width:${Math.round(100 * done / tot)}%"></i></span><span class="hp-label num">${Math.min(done + 1, tot)}/${tot}</span></span>`;
    }
    let title = S.mode === 'prov' ? (S.mitt ? 'Mitt prov' : 'Provet') : S.mode === 'sprint' ? 'Tabellsprint' : S.mode === 'sheet' ? 'Tabelltest' : 'Öva';
    if (t.type === 'upp') title = esc(t.text);          // uppställningen: uppgiften i rubriken, så att kladden får plats
    return { title, right };
  }

  /* Inmatningen per typ. "Rutor" (v[] + fokus f) delas av tio, te, prob-raderna och bladet.
     given = rutor som hjälpen har fyllt (låsta), bad = rutor som var fel vid senaste Klar. */
  function freshInput(t) {
    const blanks = n => Array(n).fill('');
    const H = { wrong:0, cls0:null, bits:null, msg:null };
    if (t.type === 'num') return { kind:'num', v:'', H };
    if (t.type === 'tio' || t.type === 'te') return { kind:'boxes', v:blanks(t.fields.length), f:0, given:new Set(), bad:new Set(), H };
    if (t.type === 'sheet') return { kind:'sheet', v:blanks(t.items.length), f:0, round:1, out:Array(t.items.length).fill(null), bad:new Set(), H };
    if (t.type === 'prob') {
      if (t.needExpr) return { kind:'prob', phase:'expr', toks:[], v:[], f:0, given:new Set(), bad:new Set(), H };
      const terms = L.parseExpr(t.expr);
      return { kind:'prob', phase:'rows', toks:null, exprStr:t.expr, terms, v:blanks(L.exprRows(terms).boxes.length), f:0, given:new Set(), bad:new Set(), H };
    }
    const W = t.width, blank = () => Array(W).fill(null);
    const rws = t.two ? ['p1', 'p2', 's'] : t.parts.map(p => 'r' + p.i).concat(['s']);   // ensiffrig: en rad per delprodukt
    const vals = { m:blank() }; rws.forEach(r => vals[r] = blank());
    /* tvåsiffrig: tankeradens anteckningsrutor per rad (en per term + summan); fokus börjar i dem */
    const notes = t.two ? { p1:Array(L.placeTerms(t.top).length + 1).fill(''), p2:Array(L.placeTerms(t.top).length + 1).fill('') } : null;
    return { kind:'upp', rows:rws, vals, notes, f:{ row:rws[0], col:0, note:notes ? 0 : null }, back:null, given:new Set(), pulse:false, H };
  }
  const needsScratch = t => t.type !== 'sheet' && S.mode !== 'sprint';

  /* Ritar uppgiften. Ny uppgift ⇒ hela ramen (och en tom kladd). keep ⇒ bara frågekortet,
     hjälpraden och kontrollerna ritas om, så att kladden står kvar under hela uppgiften. */
  function renderTask(fb, keep, task) {
    const t = task || curTask();
    if (!t) return finish();
    if (!fb && !keep) { IN = freshInput(t); locked = false; }
    const q = document.getElementById('mp-q');
    if (keep && q) {
      q.innerHTML = questionHTML(t, fb);
      paintHelp();
      document.getElementById('mp-ctrl').innerHTML = fb ? fb.html : padHTML(t);
      updKlar();
      return;
    }
    const H = header(t);
    const leftAct = S.mode === 'sprint' ? 'sprintstop' : 'avsluta';
    frame(H.title, leftAct, 'Avsluta', H.right, `
      <div class="mp-q${t.type === 'sheet' ? ' top' : ''}${needsScratch(t) ? ' fit' : ''}" id="mp-q">${questionHTML(t, fb)}</div>
      <div class="mp-help" id="mp-help"></div>
      <div id="mp-ctrl" style="flex-shrink:0">${fb ? fb.html : padHTML(t)}</div>
      ${needsScratch(t) ? scratchHTML() : ''}`);
    paintHelp();
    if (needsScratch(t)) scSetup();
    updKlar();
  }
  function paintHelp() {
    const el = document.getElementById('mp-help');
    if (!el) return;
    const m = IN && IN.H && IN.H.msg && IN.kind !== 'upp' ? IN.H.msg : null;
    el.innerHTML = m ? `<b>${svg(m.kind === 'retry' ? 'again' : 'bulb')}${esc(m.title)}</b><span>${esc(m.text)}</span>` : '';
    el.className = 'mp-help' + (m ? ' on ' + m.kind : '');
  }

  /* ── Kladden: appens kladdyta (samma ritkod som multdiv:s setupCanvas/mdSyncBitmap/mdPD/mdPM,
     kladd-lagen: den fyller all yta som blir över under knappsatsen). Töms vid ny uppgift. ── */
  let scCanvas = null, scCtx = null, scDrawing = false, scErasing = false, scX = 0, scY = 0, scObs = null;
  function scratchHTML() {
    return `<div class="mp-scratch">
      <div class="mp-sc-bar"><span class="mp-sc-l">Kladd</span>
        <button class="mp-sc-b on" id="mp-sc-pen" data-act="scpen" aria-label="Rita">${svg('pen')}Rita</button>
        <button class="mp-sc-b" id="mp-sc-erase" data-act="scerase" aria-label="Sudda">${svg('eraser')}Sudd</button>
        <button class="mp-sc-b" data-act="scclear" aria-label="Rensa kladden">${svg('trash')}Rensa</button></div>
      <canvas id="mp-canvas" class="mp-canvas"></canvas>
    </div>`;
  }
  function scSetup() {
    if (scObs) { scObs.disconnect(); scObs = null; }
    scCanvas = document.getElementById('mp-canvas'); scCtx = null; scErasing = false;
    if (!scCanvas) return;
    requestAnimationFrame(() => {
      if (!scCanvas || !scCanvas.isConnected) return;
      const r = scCanvas.getBoundingClientRect();
      scCanvas.width = Math.max(Math.round(r.width) || 300, 60);
      scCanvas.height = Math.max(Math.round(r.height) || 120, 40);
      scCtx = scCanvas.getContext('2d');
      scCanvas.addEventListener('pointerdown', scPD);
      scCanvas.addEventListener('pointermove', scPM);
      scCanvas.addEventListener('pointerup', scPU);
      scCanvas.addEventListener('pointercancel', scPU);
      if (typeof ResizeObserver !== 'undefined') { scObs = new ResizeObserver(scSync); scObs.observe(scCanvas); }
    });
  }
  function scSync() {
    if (!scCanvas || !scCtx || !scCanvas.isConnected) return;
    const w = Math.round(scCanvas.clientWidth), h = Math.round(scCanvas.clientHeight);
    if (!w || !h || (Math.abs(w - scCanvas.width) < 2 && Math.abs(h - scCanvas.height) < 2)) return;
    const tmp = document.createElement('canvas'); tmp.width = scCanvas.width; tmp.height = scCanvas.height;
    tmp.getContext('2d').drawImage(scCanvas, 0, 0);
    scCanvas.width = w; scCanvas.height = h; scCtx.drawImage(tmp, 0, 0);
  }
  function scPos(e) { const r = scCanvas.getBoundingClientRect(); return [(e.clientX - r.left) * (scCanvas.width / r.width), (e.clientY - r.top) * (scCanvas.height / r.height)]; }
  function scPD(e) { e.preventDefault(); scDrawing = true; [scX, scY] = scPos(e); try { scCanvas.setPointerCapture(e.pointerId); } catch (_) {} }
  function scPM(e) {
    if (!scDrawing || !scCtx) return;
    e.preventDefault();
    const [x, y] = scPos(e);
    scCtx.globalCompositeOperation = scErasing ? 'destination-out' : 'source-over';
    scCtx.lineWidth = scErasing ? 20 : 2 + (e.pressure || 0.5) * 3;
    scCtx.strokeStyle = '#0d9488'; scCtx.lineCap = 'round'; scCtx.lineJoin = 'round';
    scCtx.beginPath(); scCtx.moveTo(scX, scY); scCtx.lineTo(x, y); scCtx.stroke();
    scX = x; scY = y;
  }
  function scPU() { scDrawing = false; }
  function scTool(erase) {
    scErasing = erase;
    const p = document.getElementById('mp-sc-pen'), e = document.getElementById('mp-sc-erase');
    if (p) p.classList.toggle('on', !erase);
    if (e) e.classList.toggle('on', erase);
  }
  function scClear() { if (scCtx && scCanvas) scCtx.clearRect(0, 0, scCanvas.width, scCanvas.height); }

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
    if (IN.given && IN.given.has(i)) return `<span class="mp-ans sm given">${esc(IN.v[i])}</span>`;
    const cls = (!fb && IN.f === i ? ' focus' : '') + (IN.bad && IN.bad.has(i) ? ' bad' : '') + (fb && fb.ok ? ' ok' : '');
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
    let vals = show ? Object.assign({ m:fb.mem || Array(t.width).fill(null) }, L.uppFacitRows(t)) : IN.vals;
    if (show && fb.reveal != null) {                     // förklaringen visar en rad i taget
      const order = t.two ? ['p1', 'p2', 's'] : t.parts.map(p => 'r' + p.i).concat(['s']);
      vals = Object.assign({}, vals);
      order.forEach((r, k) => { if (k >= fb.reveal) vals[r] = Array(t.width).fill(null); });
      if (fb.reveal < order.length) vals.m = Array(t.width).fill(null);
    }
    const G = fb ? null : uppGuide(t), M = !fb && IN.H.msg, open = fb ? null : L.uppOpenRows(t, IN.vals);
    /* uppställningen: hjälpens rad tar vägvisningens plats i kortet (annars får kladden ingen plats) */
    const noteBlock = !fb && G && G.notes ? notesHTML(t, G.row) : '';
    const top = !fb && IN.note ? `<p class="mp-guide hm retry">${svg('next')}<span>${esc(IN.note)}</span></p>` : M ? `<p class="mp-guide hm ${M.kind}">${svg(M.kind === 'retry' ? 'again' : 'bulb')}<span><b>${esc(M.title)}</b> ${esc(M.text)}</span></p>`
      : noteBlock ? noteBlock
      : G ? `<p class="mp-guide">${svg('next')}<span class="tx">${esc(G.text)}</span>${G.more ? `<button class="mp-led" data-act="led" aria-label="Nästa led">${svg('right')}</button>` : ''}</p>` : '';
    return `${top}${paperHTML(t, { vals, readonly:!!fb, focus:fb || IN.f.note != null ? null : IN.f, ok:show || (fb && fb.ok), pulse:(show && fb.cls === 'nolla') || (!fb && (IN.pulse || (G && G.grey))), given:show ? null : IN.given, lit:G ? G.lit : null, open })}`;
  }

  /* Problemlösningen: skriv uttrycket (fas 1), räkna gånger först rad för rad (fas 2) */
  function probHTML(t, fb) {
    const show = fb && fb.showAns;
    let h = t.shop ? shopHTML() + `<p class="mp-text">${esc(t.text)}</p>` : `<p class="mp-text">${esc(t.text)}</p>`;
    const lines = [];
    let exprShown, terms;
    if (show) { terms = IN.terms || L.parseExpr(t.expr); exprShown = L.exprText(terms); }
    else if (IN.phase === 'expr') exprShown = IN.toks.join(' ');
    else { terms = IN.terms; exprShown = IN.exprStr; }
    if (t.needExpr) {
      if (IN.phase === 'expr' && !fb) lines.push(`<span class="mp-ans sm wide focus" id="mp-a">${esc(exprShown)}</span>`);
      else lines.push(`<span class="mp-ans sm wide ${IN.exprGiven && !show ? 'given' : 'ok'}">${esc(exprShown)}</span>`);
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

  /* Tabelltestet: 20 tal i två kolumner. Runda 2: de röda rättas. */
  function sheetHTML(t, fb) {
    const out = IN.out;
    const cell = (it, i) => {
      let cls = 'mp-sr';
      const o = out[i];
      if (o === 'direkt') cls += ' ok';
      else if (o === 'hjalp') cls += ' fixed';
      else if (o === 'svar') cls += ' bad';
      else if (IN.bad.has(i)) cls += ' bad';
      if (!fb && IN.f === i && !o) cls += ' focus';
      const fix = o === 'svar' ? `<span class="fix">${it.answer}</span>` : '';
      const act = !fb && !o ? `data-act="bx" data-i="${i}"` : '';
      return `<button class="${cls}" ${act}><span class="ex">${esc(it.text)} =</span><span class="mp-ans xs">${esc(IN.v[i] || '')}</span>${fix}</button>`;
    };
    const half = Math.ceil(t.items.length / 2);
    return `<div class="mp-sheet"><div class="col">${t.items.slice(0, half).map((it, i) => cell(it, i)).join('')}</div>
      <div class="col">${t.items.slice(half).map((it, i) => cell(it, i + half)).join('')}</div></div>`;
  }

  /* Vägvisningen (Dennis 19/10: "att appen guidar barnen vart de skall börja"): en kort rad om vad
     som ska göras på raden med fokus, och siffrorna som ska multipliceras lyser. Den är vägvisning,
     inte hjälp, och räknas inte som "med hjälp". */
  function uppGuide(t) {
    /* Tankeraden (L.thinkSteps): ett led i taget, barnet klickar fram nästa led. Provet: bara uppdelningen.
       Tvåsiffrig faktor: anteckningsrutorna (L.thinkNotes) i stället för leden. */
    const row = IN.f.row === 'm' ? ((IN.back || {}).row || IN.rows[0]) : IN.f.row;
    if (t.two && row !== 's') {
      const bot = [row === 'p1' ? 0 : 1], N = L.thinkNotes(t, row), j = IN.f.note;
      const top = j != null && j < N.terms.length ? [String(N.terms[j]).length - 1] : L.digitsOf(t.top).map((_, k) => k);
      return { notes:true, row, lit:{ top, bot }, grey:row === 'p2' && IN.vals.p2[0] == null && j == null };
    }
    const col = row === 's' ? IN.f.col : null, mode = S && S.mode === 'prov' ? 'prov' : 'ova';
    const st = L.thinkSteps(t, row, mode, col);
    if (!IN.think || IN.think.row !== row || IN.think.col !== col) IN.think = { row, col, i:0 };
    const i = Math.min(IN.think.i, st.length - 1);
    const text = row === 'p2' && i >= 1 ? st.slice(1, i + 1).join(' ') : st.slice(0, i + 1).join(' ');
    const allTop = L.digitsOf(t.top).map((_, k) => k);
    let lit = null;
    if (row === 's') lit = { col };
    else if (t.two) lit = { top:allTop, bot:[row === 'p1' ? 0 : 1] };
    else lit = { top:[rowStart(row)], bot:[0] };
    return { text, lit, more:i < st.length - 1, grey:row === 'p2' && IN.vals.p2[0] == null };
  }

  /* Tankeradens anteckningsrutor: "8 · 80 = [ ]  8 · 2 = [ ]" och "Rad 1: 640 + 16 = [ ]" (barnets egna tal
     speglas). Öva rättar rutan när barnet lämnat den; provet rättar aldrig och visar inga värden. */
  function notesHTML(t, row) {
    const N = L.thinkNotes(t, row), v = IN.notes[row], k = N.terms.length, mode = S && S.mode === 'prov' ? 'prov' : 'ova';
    const box = j => {
      const foc = IN.f.row === row && IN.f.note === j;
      const mark = foc ? 'focus' : (L.noteMark(t, row, j, v[j], mode) || '');
      return `<span class="mp-nb ${mark}" data-act="note" data-row="${row}" data-j="${j}">${esc(v[j])}</span>`;
    };
    const l1 = N.labels.map((lb, j) => `<span class="mp-np"><span class="mp-nt">${esc(lb)} =</span>${box(j)}</span>`).join('');
    const mirror = v.slice(0, k).map(x => x || '…').join(' + ');
    const l2 = `<span class="mp-nt">Rad ${row === 'p1' ? 1 : 2}: ${esc(mirror)} =</span>${box(k)}` +
      (row === 'p2' ? `<span class="mp-nt sm">${IN.vals.p2[0] == null ? 'Nollan i grå rutan först.' : 'Sedan raden.'}</span>` : `<span class="mp-nt sm">Skriv raden.</span>`);
    return `<div class="mp-notes"><div class="mp-nl">${l1}</div><div class="mp-nl">${l2}</div></div>`;
  }

  /* Pappret: kolumner från vänster W-1 … 0 (0 = entalet) */
  function paperHTML(t, o) {
    const W = t.width, idx = [];
    for (let i = W - 1; i >= 0; i--) idx.push(i);
    const vals = o.vals || {}, given = o.given || new Set();
    const lit = o.lit || {};
    const fix = (n, i, which) => { const d = L.digitsOf(n); return i < d.length ? `<div class="mp-c fix${(lit[which] || []).includes(i) ? ' lit' : ''}" style="color:${COLV[Math.min(i, 3)]}">${d[i]}</div>` : '<div class="mp-c ghost"></div>'; };
    const inCell = (row, i) => {
      const v = vals[row] ? vals[row][i] : null;
      const grey = row === 'p2' && i === 0, gv = given.has(row + ':' + i);
      const foc = o.focus && o.focus.row === row && o.focus.col === i;
      const sh = i < rowStart(row) && v == null;                  // förskjutningens tomma ruta
      const lk = o.open && !o.open.includes(row);                 // låst tills raderna ovanför är ifyllda
      const colLit = lit.col != null && lit.col === i && row !== 's' && v != null;   // summans kolumn lyser
      const cls = ['mp-c', 'in', v != null ? 'has' : '', grey ? 'grey' : '', sh ? 'sh' : '', lk ? 'lk' : '', colLit ? 'lit' : '', foc ? 'focus' : '', o.ok && v != null ? 'ok' : '', gv ? 'given' : '', grey && o.pulse ? 'pulse' : ''].join(' ');
      return `<div class="${cls}" ${o.readonly || gv || lk ? '' : `data-act="cell" data-row="${row}" data-col="${i}"`}${lk ? ' aria-disabled="true"' : ''}>${v != null ? v : ''}</div>`;
    };
    const memCell = i => {
      if (i === 0) return '<div class="mp-m"></div>';
      const v = vals.m ? vals.m[i] : null;
      const foc = o.focus && o.focus.row === 'm' && o.focus.col === i;
      if (o.readonly || given.has('m:' + i)) return `<div class="mp-m">${v != null ? v : ''}</div>`;
      return `<div class="mp-m in${foc ? ' focus' : ''}" data-act="cell" data-row="m" data-col="${i}" aria-label="Minnessiffra">${v != null ? v : ''}</div>`;
    };
    const line = `<tr class="mp-line"><td></td><td colspan="${W}"></td></tr>`;
    const memRow = `<tr><td></td>${idx.map(memCell).map(x => `<td>${x}</td>`).join('')}</tr>`;
    /* additionens minnesrad ovanför raderna (som i appens addition); den visas först när summan är upplåst */
    const memShown = !o.open || o.open.includes('s');
    const memLine = memShown ? memRow : '';                    // minnesraden finns först när summan är upplåst
    let h = `<table class="mp-paper"><tbody>
      <tr><td></td>${idx.map(i => `<td>${fix(t.top, i, 'top')}</td>`).join('')}</tr>
      <tr><td class="mp-sign">·</td>${idx.map(i => `<td>${fix(t.bot, i, 'bot')}</td>`).join('')}</tr>${line}`;
    if (t.two) h += memLine + `<tr><td></td>${idx.map(i => `<td>${inCell('p1', i)}</td>`).join('')}</tr>
      <tr><td class="mp-sign">+</td>${idx.map(i => `<td>${inCell('p2', i)}</td>`).join('')}</tr>${line}`;
    else {
      /* ensiffrig: additionens minnessiffror ovanför raderna (som i appens addition), sedan en rad per delprodukt */
      h += memLine + t.parts.map((p, k) => `<tr><td class="mp-sign">${k === t.parts.length - 1 ? '+' : ''}</td>${idx.map(i => `<td>${inCell('r' + p.i, i)}</td>`).join('')}</tr>`).join('') + line;
    }
    h += `<tr><td></td>${idx.map(i => `<td>${inCell('s', i)}</td>`).join('')}</tr></tbody></table>`;
    return h;
  }

  /* ── Knappsatsen ── */
  /* Knappsatsen (D38 ✎, bara i matteprovet): siffrorna i två rader om fem, under dem ⌫ · Nästa · Klar.
     Tre rader i stället för fyra; höjden går till kladden. */
  function padHTML(t) {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(k => `<button class="mp-k" data-act="key" data-k="${k}">${k}</button>`).join('');
    const erase = `<button class="mp-k er" data-act="key" data-k="erase" aria-label="Sudda">${svg('erase')}</button>`;
    const klar = w => `<button class="mp-klar w${w}" id="mp-klar" data-act="klar" disabled>${svg('check')}<span>Klar</span></button>`;
    if (t.type === 'prob' && IN.phase === 'expr')
      return `<div class="mp-pad5">${digits}${erase}
        <button class="mp-k op" data-act="key" data-k="·" aria-label="gånger">·</button>
        <button class="mp-k op" data-act="key" data-k="+" aria-label="plus">+</button>
        <button class="mp-k op" data-act="key" data-k="−" aria-label="minus">−</button>${klar(1)}</div>`;
    const multi = IN.kind === 'boxes' || IN.kind === 'sheet' || (IN.kind === 'prob' && IN.v.length > 1);
    const nx = IN.kind === 'sheet' ? `Nästa ${svg('down')}` : multi ? `Nästa ruta ${svg('right')}`
             : t.type === 'upp' && (IN.rows.length > 1 || IN.notes) ? (IN.f && IN.f.note != null ? `Nästa ${svg('right')}` : `Nästa rad ${svg('down')}`) : '';
    return `<div class="mp-pad5">${digits}${erase}${nx ? `<button class="mp-k nx" data-act="key" data-k="next">${nx}</button>${klar(2)}` : klar(4)}</div>`;
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

  /* Rutor som går att skriva i (inte ifyllda av hjälpen, inte klara i bladet) */
  function openBox(i) { return !(IN.given && IN.given.has(i)) && !(IN.kind === 'sheet' && IN.out[i]); }
  function nextOpen(from) { const n = IN.v.length; for (let k = 1; k <= n; k++) { const j = (from + k) % n; if (openBox(j)) return j; } return from; }
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
      if (!openBox(IN.f)) IN.f = nextOpen(IN.f);
      if (k === 'next') IN.f = nextOpen(IN.f);
      else if (k === 'erase') { if (IN.v[IN.f]) IN.v[IN.f] = IN.v[IN.f].slice(0, -1); }
      else if (/^\d$/.test(k) && IN.v[IN.f].length < 5) { IN.v[IN.f] = (IN.v[IN.f] === '0' ? '' : IN.v[IN.f]) + k; IN.bad.delete(IN.f); }
    } else uppPress(t, k);
    snd('click');
    refreshQ(t);
  }
  /* Uppställningen: siffran skrivs i rutan med fokus och fokus flyttar ett steg åt vänster.
     En minnessiffra (den röda raden) är frivillig; efter den går fokus tillbaka.
     Rutor som hjälpen fyllt hoppas över. */
  function uppFree(row, col) { return !IN.given.has(row + ':' + col); }
  /* rad r{i} (ensiffrig faktor) börjar i kolumn i: förskjuten, entalsrutan tom */
  const rowStart = row => /^r\d$/.test(row) ? +row.slice(1) : 0;
  function uppFirstFree(row) { const W = curTask().width; for (let c = rowStart(row); c < W; c++) if (uppFree(row, c) && IN.vals[row][c] == null) return c; return rowStart(row); }
  /* Raderna fylls i ordning och summan låses upp sist (L.uppOpenRows). Fokus på en låst rad
     flyttas till den första raden som inte är ifylld. */
  const uppOpen = t => L.uppOpenRows(t, IN.vals);
  function uppFixFocus(t) {
    const open = uppOpen(t), cur = IN.f.row === 'm' ? (IN.back || {}).row : IN.f.row;
    if (!open.includes(cur)) { const row = open[open.length - 1]; IN.f = { row, col:uppFirstFree(row), note:IN.notes && IN.notes[row] ? 0 : null }; IN.back = null; }
  }
  function uppPress(t, k) {
    IN.note = null;
    const f = IN.f, W = t.width, rowVals = IN.vals[f.row];
    if (f.note != null && IN.notes) {                          // tankeradens anteckningsruta
      const nv = IN.notes[f.row], last = nv.length - 1;
      if (k === 'next') { IN.f = f.note < last ? { row:f.row, col:0, note:f.note + 1 } : { row:f.row, col:uppFirstFree(f.row), note:null }; return; }
      if (k === 'erase') { if (nv[f.note]) nv[f.note] = nv[f.note].slice(0, -1); else if (f.note > 0) IN.f = { row:f.row, col:0, note:f.note - 1 }; return; }
      if (/^\d$/.test(k) && nv[f.note].length < 5) nv[f.note] = (nv[f.note] === '0' ? '' : nv[f.note]) + k;
      return;
    }
    if (k === 'next') {
      const cur = f.row === 'm' ? (IN.back || {}).row || IN.rows[0] : f.row;
      if (cur === 's') return;
      if (!L.uppRowFilled(t, cur, IN.vals[cur])) {
        const n = IN.rows.indexOf(cur) + 1;
        IN.note = cur === 'p2' && IN.vals.p2[0] == null ? 'Rad 2 börjar med nollan i den grå rutan.' : `Rad ${n} är inte klar. Skriv hela svaret på raden först.`;
        return;
      }
      const row = IN.rows[IN.rows.indexOf(cur) + 1];
      IN.f = { row, col:uppFirstFree(row), note:IN.notes && IN.notes[row] ? 0 : null }; IN.back = null;
      return;
    }
    if (k === 'erase') {
      if (rowVals[f.col] != null && uppFree(f.row, f.col)) rowVals[f.col] = null;
      else if (f.row !== 'm' && f.col > 0 && uppFree(f.row, f.col - 1)) { IN.f = { row:f.row, col:f.col - 1 }; IN.vals[f.row][f.col - 1] = null; }
      return;
    }
    if (!/^\d$/.test(k)) return;
    if (!uppFree(f.row, f.col)) return;
    if (f.row !== 'm' && !uppOpen(t).includes(f.row)) return;
    rowVals[f.col] = +k;
    if (f.row === 'm') { IN.f = IN.back || { row:IN.rows[0], col:0 }; IN.back = null; return; }
    let c = f.col + 1;
    while (c < W - 1 && !uppFree(f.row, c)) c++;
    if (c < W && uppFree(f.row, c)) IN.f = { row:f.row, col:c };
  }
  function refreshQ(t) {
    if (IN && IN.kind === 'upp') uppFixFocus(t);
    const q = document.getElementById('mp-q');
    if (q) q.innerHTML = questionHTML(t);
    updKlar();
  }

  const num = x => x === '' ? null : +x;
  function readResp(t) {
    if (t.type === 'num') return num(IN.v);
    if (t.type === 'tio' || t.type === 'te' || t.type === 'sheet') return IN.v.map(num);
    if (t.type === 'prob') return { expr:IN.exprStr, rows:IN.v.map(num) };
    return Object.assign({}, IN.vals);                 // alla rader: p1/p2 eller r0 … r{k-1}, och s
  }

  function submit() {
    const t = curTask();
    if (!t || locked || !canSubmit()) return;
    S.touched = true;
    if (t.type === 'sheet') return sheetSubmit(t);
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

  /* Ett svar: rätt ⇒ "rätt direkt" eller "rätt med hjälp"; fel ⇒ nästa steg i trappan */
  function answered(t, res) {
    if (S.mode === 'sprint') return sprintAnswer(t, res.ok);
    const H = IN.H;
    if (res.ok) {
      locked = true; snd('correct');
      const outcome = H.wrong ? 'hjalp' : 'direkt';
      taskDone(t, outcome, H.cls0);
      const tag = outcome === 'hjalp' ? '<small>med hjälp</small>' : '';
      IN.H.msg = null;
      renderTask({ ok:true, showAns:false, html:`<div class="mp-fb good"><h3>${svg('check')}Rätt!${tag}</h3>
        <button class="mp-cta" data-act="next">Nästa ${svg('next')}</button></div>` }, true, t);
      return;
    }
    snd('wrong');
    H.wrong++;
    if (H.wrong === 1) { H.cls0 = res.cls; H.bits = L.helpBits(t, res.cls); if (isDrill()) S.drill.answer(false); }
    const step = L.helpStep(H.wrong, H.bits.length);
    if (step === 'svar') { taskDone(t, 'svar', H.cls0); return showWrong(t, res); }
    markBad(t, res);
    if (step === 'retry') H.msg = { kind:'retry', title:'Inte riktigt. Försök igen.', text:L.helpHint(t, res.cls) };
    else {
      const k = +step.slice(3), bit = H.bits[k - 1];
      applyFill(t, bit.fill);
      H.msg = { kind:'bit', title:`Hjälp ${k} av ${H.bits.length}`, text:bit.text };
    }
    renderTask(null, true, t);
  }
  /* Rutorna som var fel blir röda tills barnet ändrar dem */
  function markBad(t, res) {
    if (IN.kind === 'num') { IN.v = ''; return; }
    if (!IN.bad || !res.wrong) return;
    IN.bad = new Set(res.wrong.map((w, i) => w ? i : -1).filter(i => i >= 0 && openBox(i)));
    if (IN.bad.size) IN.f = [...IN.bad][0];
  }
  /* Hjälpens bit skrivs in åt barnet och låses */
  function applyFill(t, fill) {
    if (!fill) return;
    if (IN.kind === 'prob') {
      if (fill.expr && (IN.phase === 'expr' || IN.exprStr !== t.expr)) {
        IN.exprStr = t.expr; IN.terms = L.parseExpr(t.expr); IN.phase = 'rows'; IN.exprGiven = true;
        IN.v = Array(L.exprRows(IN.terms).boxes.length).fill(''); IN.given = new Set(); IN.bad = new Set();
      }
    }
    if (fill.boxes && IN.v) {
      for (const [i, v] of Object.entries(fill.boxes)) { IN.v[+i] = String(v); IN.given.add(+i); IN.bad.delete(+i); }
      IN.f = nextOpen(-1);
    }
    if (IN.kind === 'upp') {
      for (const c of fill.cells || []) { IN.vals[c.row][c.col] = c.val; IN.given.add(c.row + ':' + c.col); }
      for (const m of fill.mem || []) { IN.vals.m[m.col] = m.val; IN.given.add('m:' + m.col); }
      IN.pulse = !!fill.pulse;
      const open = L.uppOpenRows(t, IN.vals), row = open[open.length - 1];
      IN.f = { row, col:uppFirstFree(row) };
    }
  }
  /* Utfallet sparas: i provets resultat, i passets räkning och i "det som var svårt" */
  function taskDone(t, outcome, cls) {
    const s = readSt(), p = provSt(s);
    p.hard = L.recordOutcome(p.hard, t, outcome, cls, today());
    writeSt(s);
    if (S.mode === 'prov') { S.results.push({ moment:t.moment, ok:outcome === 'direkt', outcome, mitt:S.mitt }); S.idx++; }
    else if (isDrill()) { S.outc[outcome]++; if (outcome !== 'svar') S.drill.answer(true); }
  }

  /* Tabelltestet: Klar rättar; de röda får rättas en gång (rätt då = med hjälp), sedan visas svaren */
  function sheetSubmit(t) {
    const res = L.check(t, readResp(t));
    if (IN.round === 1) {
      res.per.forEach((ok, i) => { if (ok) IN.out[i] = 'direkt'; });
      if (res.per.every(Boolean)) return sheetDone(t);
      IN.round = 2; IN.bad = new Set(res.per.map((ok, i) => ok ? -1 : i).filter(i => i >= 0)); IN.f = [...IN.bad][0];
      snd('wrong');
      IN.H.msg = { kind:'retry', title:`${res.okCount} av ${t.items.length} rätt.`, text:'Rätta de röda talen och tryck Klar igen.' };
      return renderTask(null, true, t);
    }
    res.per.forEach((ok, i) => { if (!IN.out[i]) IN.out[i] = ok ? 'hjalp' : 'svar'; });
    sheetDone(t);
  }
  function sheetDone(t) {
    locked = true; IN.H.msg = null;
    const s = readSt(), p = provSt(s), day = today();
    t.items.forEach((it, i) => { p.hard = L.recordOutcome(p.hard, it, IN.out[i], 'tabell', day); });
    const c = { direkt:0, hjalp:0, svar:0 }; IN.out.forEach(o => c[o]++);
    if (S.mode === 'sheet') p.ova.tabell = { date:new Date().toISOString(), ok:c.direkt, total:t.items.length, level:S.lv };
    writeSt(s);
    snd(c.direkt === t.items.length ? 'fanfare' : 'correct');
    const sc = document.getElementById('mp-score'); if (sc) sc.innerHTML = `${c.direkt}<small>/${t.items.length}</small>`;
    const sum = `<p class="mp-k3l">${k3(c.direkt, c.hjalp, c.svar)}</p>`;
    let html;
    if (S.mode === 'prov') {
      t.items.forEach((it, i) => S.results.push({ moment:'tabell', ok:IN.out[i] === 'direkt', outcome:IN.out[i], mitt:S.mitt }));
      S.idx++;
      html = `<div class="mp-fb good" style="padding:10px 12px"><h3>${svg('check')}${c.direkt} av ${t.items.length} rätt direkt</h3>${sum}
        <button class="mp-cta" data-act="next">Nästa ${svg('next')}</button></div>`;
    } else {
      S.wrongItems = t.items.filter((_, i) => IN.out[i] !== 'direkt');
      S.done = true;
      html = `<div class="mp-fb good" style="padding:10px 12px"><h3>${svg('check')}${c.direkt} av ${t.items.length} rätt direkt</h3>${sum}
        <div class="mp-navrow">${S.wrongItems.length ? `<button class="mp-cta" data-act="sheetnot">${svg('again')}Nöt de ${S.wrongItems.length} som inte satt</button>` : ''}
        <button class="mp-cta sec" data-act="prov">Klar</button></div></div>`;
    }
    renderTask({ ok:true, sheetDone:true, html }, true, t);
  }
  /* De tre utfallen som små siffror: rätt direkt · med hjälp · fick svaret */
  const k3 = (d, h, s) => `<span class="mp-k3"><i class="d" title="Rätt direkt">${d}</i><i class="h" title="Rätt med hjälp">${h}</i><i class="s" title="Fick svaret">${s}</i></span>`;
  const k3Legend = () => `<span class="mp-k3leg"><i class="d"></i>Rätt direkt<i class="h"></i>Med hjälp<i class="s"></i>Fick svaret</span>`;

  /* Hela svaret (trappans sista steg): förklaringen i steg, sedan Nästa */
  function explainSteps(t, res) {
    if (t.moment === 'tiotal') return L.explainTiotal(t).map(s => s.text);
    if (t.moment === 'problem') {
      const st = t.steps.map(s => s.text);
      return t.needExpr ? [`Uttrycket: ${t.expr}.`].concat(st) : st;
    }
    if (t.moment === 'talsorter') { const f = t.fields.map(x => x.ans); return [`Första raden: ${t.b} delas upp i ${f[0]} och ${f[1]}.`, `Andra raden: ${t.a} · ${f[0]} = ${f[2]} och ${t.a} · ${f[1]} = ${f[3]}.`, `Tredje raden: ${f[2]} + ${f[3]} = ${f[4]}.`]; }
    if (t.moment === 'uppstallning') return t.two
      ? [`Rad 1: ${t.top} · ${t.ones} = ${t.p1}.`, `Rad 2: ${t.top} · ${t.tens * 10} = ${t.p2}, med nollan i den grå rutan.`, `Lägg ihop raderna: ${t.p1} + ${t.p2} = ${t.answer}.`]
      : t.parts.map(p => `Rad ${p.i + 1}: ${t.bot} · ${p.d} = ${p.val}` + (p.i ? `, ${['', 'ett steg', 'två steg', 'tre steg'][p.i]} åt vänster.` : '.'))
          .concat([`Lägg ihop raderna, med minnessiffrorna ovanför: svaret är ${t.answer}.`]);
    return [`${t.text} = ${t.answer}.`];
  }
  function memFacit(t) {          // additionens minnessiffror
    const m = Array(t.width).fill(null);
    L.addCarries(t.two ? [t.p1, t.p2] : t.parts.map(p => p.place)).forEach(c => { m[c.col] = c.val; });
    return m;
  }
  function showWrong(t, res) {
    locked = true; IN.H.msg = null;
    S.fb = { t, res, steps:explainSteps(t, res), i:0 };
    renderWrong();
  }
  function renderWrong() {
    const { t, res, steps, i } = S.fb, last = i >= steps.length - 1;
    const html = `<div class="mp-fb"><h3>Så här blir det:</h3>
      <p class="mp-step">${esc(steps[i])}</p>
      ${steps.length > 1 ? `<div class="mp-dots">${steps.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div>` : ''}
      <button class="mp-cta${last ? '' : ' sec'}" data-act="${last ? 'svarnext' : 'fbnext'}">Nästa ${svg('next')}</button></div>`;
    renderTask({ ok:false, showAns:true, cls:res.cls, reveal:revealFor(t, res, steps, i), mem:t.type === 'upp' ? memFacit(t) : null, html }, true, t);
  }
  /* Hur många "="-rader som syns i facit vid förklaringens steg i (ett steg = en rad) */
  function revealFor(t, res, steps, i) {
    const last = i >= steps.length - 1;
    if (t.type === 'prob') return t.needExpr ? i : i + 1;
    if (t.type === 'te') return i + 1;
    if (t.type === 'tio') { const tab = steps.findIndex(x => x.startsWith('Räkna tabellen')); return last ? 2 : i >= tab ? 1 : 0; }
    if (t.type === 'upp') return i + 1;
    return null;
  }
  /* Efter hela svaret: öva ⇒ nötloopen går vidare (uppgiften kommer igen senare); prov ⇒ nästa uppgift */
  function afterSvar() {
    if (isDrill()) S.drill.answer(true);
    S.fb = null;
    renderTask();
  }

  function finish() {
    if (S.mode === 'prov') return showKvitto();
    return showDrillDone();
  }

  /* ── Slutet på ett övningspass ── */
  function showDrillDone() {
    const st = S.drill.stats(), o = S.outc;
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
        <div class="mp-rc-row"><span class="nm">Rätt med hjälp</span><b>${o.hjalp}</b></div>
        <div class="mp-rc-row"><span class="nm">Fick svaret</span><b>${o.svar}</b></div>
        <div class="mp-rc-row"><span class="nm">Tid</span><b>${esc(MP.durTxt(R.secs))}</b></div>
      </div>
      <p class="mp-note" style="font-size:15px">${esc(MP.praiseFor(R.pct))}</p>
      <div style="margin-top:auto;display:flex;flex-direction:column;gap:8px">
        ${again}<button class="mp-cta" data-act="prov">Till provet ${svg('next')}</button></div>`);
    S = null;
  }

  /* ── Kvittot efter provet (och mitt prov) ── */
  function showKvitto() {
    const sum = L.provSummary(provId, S.results), iso = new Date().toISOString();
    const hj = S.results.filter(x => x.outcome === 'hjalp').length, sv = S.results.filter(x => x.outcome === 'svar').length;
    const s = readSt(), p = provSt(s);
    const rec = { id:Date.now(), date:iso, kind:S.mitt ? 'mitt' : 'prov', level:S.lv, ok:sum.ok, hjalp:hj, svar:sv, total:sum.total,
                  per:sum.per.map(x => ({ id:x.id, ok:x.ok, hjalp:x.hjalp, svar:x.svar, total:x.total })), seen:null };
    p.tests.unshift(rec); if (p.tests.length > 30) p.tests.length = 30;
    writeSt(s);
    const hardNow = L.hardList(p.hard);
    S.rec = rec; S.weak = sum.weak; S.mode = 'kvitto';
    snd('fanfare');
    const praise = sum.ok === sum.total ? 'Allt satt direkt!' : sum.weak.length ? 'Bra kämpat! Nu vet du vad du ska öva på.' : 'Starkt! Alla moment är gröna.';
    const when = MP.fmtWhen(iso);
    const per = sum.per.filter(x => x.total);
    frame(S.mitt ? 'Mitt prov klart' : 'Provet klart', 'prov', 'Klar', '', `
      <div class="mp-head"><span class="mp-starb">${svg('star')}</span><h2>${sum.ok} av ${sum.total} rätt direkt</h2><p>${esc(praise)}</p></div>
      <div class="mp-rc">
        <div class="mp-rc-top"><span class="mp-rc-k">${esc(S.mitt ? 'Mitt prov' : prov().title)} · ${esc(levelName(S.lv))}</span><span class="mp-rc-when">${esc(when.charAt(0).toUpperCase() + when.slice(1))}</span></div>
        <div class="mp-rc-row leg">${k3Legend()}</div>
        ${per.map(x => { const m = momentOf(x.id); return `<div class="mp-rc-row"><span class="nm">${m.nr}. ${esc(m.short)}</span>${k3(x.ok, x.hjalp, x.svar)}
          <span class="mp-badge ${x.green ? 'g' : 'y'}">${x.green ? 'Klart' : 'Öva'}</span></div>`; }).join('')}
        <div class="mp-rc-foot"><span class="mp-ph" id="mp-ph">Plats för en vuxens stämpel</span><div class="mp-stamp" id="mp-stamp"></div></div>
      </div>
      <button class="hold" id="mp-hold" aria-label="Sett av en vuxen. Håll inne en och en halv sekund."><i class="hold-fill"></i><span class="hold-t">${svg('hand')}Håll inne: Sett av en vuxen</span></button>
      <div style="margin-top:auto;display:flex;flex-direction:column;gap:8px">
        ${hardNow.length ? `<button class="mp-cta" data-act="mitt">${svg('target')}Gör mitt prov</button>` : ''}
        ${sum.weak.length ? `<button class="mp-cta sec" data-act="weak">${svg('again')}Öva på det som var svårt</button>` : ''}
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
      case 'startprov': snd('click'); startProv(false); break;
      case 'mitt':      snd('click'); startProv(true); break;
      case 'led':       if (IN && IN.think) { IN.think.i++; snd('click'); refreshQ(curTask()); } break;
      case 'svarnext':  snd('click'); afterSvar(); break;
      case 'scpen':     scTool(false); break;
      case 'scerase':   scTool(true); break;
      case 'scclear':   scClear(); break;
      case 'weak':      snd('click'); startDrill('svag', L.buildWeakPass(S.weak, S.rec.level)); break;
      case 'sprint':    snd('click'); showSprintIntro(); break;
      case 'sprintgo':  snd('click'); startSprint(); break;
      case 'sprintstop': stopSprint(); snd('click'); showProv(); break;
      case 'key':       press(el.dataset.k); break;
      case 'klar':      submit(); break;
      case 'next':      snd('click'); renderTask(); break;
      case 'fbnext':    snd('click'); S.fb.i++; renderWrong(); break;
      case 'avsluta':   avsluta(); break;
      case 'ovno':      { const o = document.getElementById('mp-ov'); if (o) o.remove(); break; }
      case 'bx':        if (!locked && IN && IN.v && el.dataset.i != null) { IN.f = +el.dataset.i; refreshQ(curTask()); } break;
      case 'sheetnot':  snd('click'); startDrill('not', S.wrongItems, 'tabell'); break;
      case 'note':      if (!locked && IN && IN.notes && L.uppOpenRows(curTask(), IN.vals).includes(el.dataset.row)) {
                          IN.f = { row:el.dataset.row, col:0, note:+el.dataset.j }; refreshQ(curTask());
                        } break;
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
           _peek:() => ({ S, IN, task:curTask() }),
           _force:(items, prov) => { if (prov) { S = { mode:'prov', mitt:false, lv:L.PROV_LEVEL, items, idx:0, results:[], start:Date.now(), touched:false }; renderTask(); } else startDrill('ova', items, items[0].moment); } };
})();

if (typeof window !== 'undefined') window.MatteProv = MatteProv;
