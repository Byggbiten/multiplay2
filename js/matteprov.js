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
    undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo:'<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
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
#mp-root .mp-ans.bad{border:3px solid #fdba74;background:#fff7ed;color:#9a3412}
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
#mp-root .mp-m{position:relative;width:46px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-weight:800;font-size:18px;color:#7c3aed;transform:rotate(-4deg)}
#mp-root .mp-m.in{border:2px dashed rgba(124,58,237,.4);cursor:pointer;transform:none}
#mp-root .mp-m.in::after{content:'';position:absolute;left:50%;top:50%;width:46px;height:44px;transform:translate(-50%,-50%)}
#mp-root .mp-m.in.focus{border:2.5px solid #7c3aed;background:#f5f3ff}
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
#mp-root .mp-sr.bad .mp-ans{border:2px solid #fdba74;background:#fff7ed;color:#9a3412}
#mp-root .mp-sr.shown .mp-ans{border:2px solid #cbd5e1;background:#f8fafc;color:#64748b}
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
  #mp-root .mp-body .mp-scratch{min-height:58px;position:relative;padding:4px}
  /* kladdens verktyg som ikoner i kladdens hörn, så att ritytan får hela höjden */
  #mp-root .mp-scratch .mp-sc-bar{position:absolute;top:8px;right:8px;z-index:2;gap:4px}
  #mp-root .mp-scratch .mp-sc-l{display:none}
  #mp-root .mp-scratch .mp-sc-b{font-size:0;gap:0;padding:0;width:44px;justify-content:center;background:rgba(255,255,255,.92)}
  #mp-root .mp-scratch .mp-sc-b.on{background:var(--accent)}
  #mp-root .mp-scratch .mp-sc-b svg.mi{width:20px;height:20px}
  #mp-root .mp-scratch .mp-canvas{min-height:50px}
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
#mp-root .mp-rqmsg{font-size:13px;font-weight:800;line-height:1.25;color:var(--ink-soft);padding:1px 2px}
#mp-root .mp-rqmsg.retry{color:#9a3412}
#mp-root .mp-rqmsg.bit{color:#1e3a8a}
#mp-root .mp-rqmsg.ok{color:#15803d}
#mp-root .mp-nb.rq{min-width:64px}
.mp-fly{position:fixed;z-index:60;display:flex;align-items:center;justify-content:center;pointer-events:none;border-radius:10px;
  background:#dcfce7;border:2.5px solid #22c55e;color:#15803d;font-family:var(--font-head);font-weight:800;font-size:22px;
  transition:left .5s cubic-bezier(.3,.8,.3,1),top .5s cubic-bezier(.3,.8,.3,1),width .5s,height .5s,letter-spacing .5s}
#mp-root .mp-sc-b{padding:0;width:44px;justify-content:center}
#mp-root .mp-sc-b.off{opacity:.35}
#mp-root .mp-pad5 .mp-k.nx.w4{grid-column:span 4;font-size:17px;font-family:var(--font-head)}
#mp-root .mp-sr .old{color:#94a3b8;font-size:14px;text-decoration:line-through;min-width:22px;text-align:left}
#mp-root .mp-k.nx.pri{color:#fff;border-color:transparent;background:linear-gradient(135deg,var(--accent),var(--accent-light));box-shadow:0 6px 16px var(--glow)}
#mp-root .mp-help.info{background:#f8fafc;border-color:#cbd5e1;color:var(--deep)}
#mp-root .mp-shop .pick{cursor:pointer;min-height:44px}
#mp-root .mp-shop .pick:active{transform:scale(.97);background:var(--tint)}
#mp-root .mp-pdone{display:flex;align-items:center;gap:6px;font-family:var(--font-head);font-weight:800;font-size:16px;color:var(--deep);min-height:44px}
#mp-root .mp-pst{font-family:var(--font-body);font-size:12px;font-weight:900;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.04em}
#mp-root .mp-pchip{min-width:52px;height:40px;padding:0 8px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;background:#dcfce7;border:2px solid #86efac;color:#15803d;cursor:pointer}
#mp-root .mp-pcur{display:flex;flex-direction:column;gap:4px;align-self:stretch}
#mp-root .mp-plabel{font-weight:900;font-size:15px;color:var(--deep)}
#mp-root .mp-ptmpl{font-size:22px}
#mp-root .mp-op{font-family:var(--font-head);font-weight:800;font-size:24px;color:var(--deep);padding:0 2px}
#mp-root .mp-unit.sm{font-size:16px}
#mp-root .mp-concl{margin:0;font-family:var(--font-head);font-weight:800;font-size:18px;color:var(--deep)}
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
#mp-root .mp-k3 i.s,#mp-root .mp-k3leg i.s{background:#ede9fe;color:#6d28d9}
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
#mp-root .mp-fb{flex-shrink:0;display:flex;flex-direction:column;gap:8px;background:#fff;border-radius:20px;padding:12px 14px;border:2px solid #c7d2fe;box-shadow:var(--shadow-panel)}
#mp-root .mp-fb.good{border-color:#86efac}
#mp-root .mp-fb h3{margin:0;font-family:var(--font-head);font-weight:800;font-size:19px;color:var(--deep);display:flex;align-items:center;gap:8px}
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
#mp-root .mp-timer.low{color:#c2410c}
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
    return t ? `Senast klarade du ${t.ok} av ${t.total} direkt` : 'Inte gjort än';
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
      { v:big('<span class="mp-score">17<small>/20</small></span>'), t:'När alla 20 är ifyllda trycker du Klar. Då ser du vilka du klarade.' },
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
        { v:gl('Rad 1: Vad är 8 · 7?') + E({}, { top:[0], bot:[0] }), t:'Appen frågar: Vad är 8 · 7? Du skriver 56 i rutan och trycker Svara.' },
        { v:E({ r0 }, { top:[0], bot:[0] }), t:'Svaret flyttas till rad 1, med 6:an i entalet.' },
        { v:gl('Rad 2: Vad är 8 · 8?') + E({ r0, r1 }, { top:[1], bot:[0] }), t:'Nästa fråga: 8 · 8 = 64. Raden hamnar ett steg åt vänster, så entalsrutan står tom.' },
        { v:E({ r0, r1, r2 }, { top:[2], bot:[0] }), t:'Sist 8 · 6 = 48, ett steg till åt vänster. Raden börjar i hundratalet.' },
        { v:E({ r0, r1, r2, m:em, s:sh(5496, 0) }), t:'Summan skriver du själv, en ruta i taget från höger. Minnessiffrorna står i de lila rutorna. Svaret är 5496.' },
        { v:P({}), t:'Med en tvåsiffrig faktor, som 17 · 32, blir det två rader och sedan summan. Det större talet står överst.' },
        { v:gl('7 · 30 = 210   7 · 2 = 14   210 + 14 = 224') + P({}, { lit:{ top:[0, 1], bot:[0] } }), t:'Rad 1 räknar du i rutorna ovanför: 7 · 30 och 7 · 2, sedan summan 224.' },
        { v:P({ p1:row(224) }), t:'När summan är rätt flyttas 224 till rad 1.' },
        { v:gl('Rad 2 är tiotalet: skriv 0 i den grå rutan.') + P({ p1:row(224), p2:row(0, 1) }, { pulse:true }), t:'Rad 2 börjar med att du själv skriver 0 i den grå rutan.' },
        { v:gl('1 · 30 = 30   1 · 2 = 2   30 + 2 = 32') + P({ p1:row(224), p2:row(320) }, { lit:{ top:[0, 1], bot:[1] } }), t:'Sedan 1 · 32 = 32 i rutorna. Det flyttas till rad 2, efter nollan: 320.' },
        { v:P({ p1:row(224), p2:row(320), s:row(544) }), t:'Summan skriver du själv, en kolumn i taget: 224 + 320 = 544.' },
        { v:`<div style="color:var(--accent)">${svg('target')}</div>`, t:'I uppgifterna frågar appen efter varje rad och skriver svaret på rätt plats. Summan skriver du själv.' },
      ];
    }
    /* problem (D39 ✎): ett steg i taget med mallen [ ] op [ ] = [ ], slutsatsen sist med uttrycket */
    const shop = shopHTML();
    const tm = (a, op, b, c, u) => `<div class="mp-nl mp-ptmpl">${box(a)}<span class="mp-op">${op}</span>${box(b)}<span class="mp-op">=</span>${box(c)}${u ? ` <span class="mp-unit sm">${u}</span>` : ''}</div>`;
    const lab = t => `<div class="mp-plabel">${t}</div>`;
    const dn = (n, a, op, b, c, u) => `<div class="mp-pdone"><span class="mp-pst">Steg ${n}</span>${a} ${op} ${b} = <span class="mp-pchip">${c}</span>${u ? ' ' + u : ''}</div>`;
    const cn = t => `<p class="mp-concl">${t}</p>`;
    if (lv === 'svar') {
      /* Svårare: tvåsiffriga priser (dela upp i kladden som i moment 3), växel och omvänd uppgift */
      const qv = '<p class="mp-text">Leo köper 6 bollar och betalar med 200 kr. Hur mycket får Leo tillbaka?</p>';
      const qo = '<p class="mp-text">6 domare ger poäng. 5 av dem ger 8 poäng var. Totalt blir det 47 poäng. Hur många poäng gav den sista domaren?</p>';
      return [
        { v:shop, t:'Här löser du problem steg för steg. Prislistan visar vad sakerna kostar, och du kan trycka på ett pris.' },
        { v:qv + lab('Steg 1: Vad kostar 6 bollar?') + tm('', '·', '', '', 'kr'), t:'Appen delar upp frågan i steg. Varje steg har rutor: två tal, ett räknesätt och svaret.' },
        { v:qv + lab('Steg 1: Vad kostar 6 bollar?') + tm(6, '·', 28, 168, 'kr'), t:'6 · 28 är svårt i huvudet. Dela upp 28 i 20 och 8 i kladden: 6 · 20 = 120 och 6 · 8 = 48, tillsammans 168.' },
        { v:qv + dn(1, 6, '·', 28, 168, 'kr') + lab('Steg 2: Hur mycket får Leo tillbaka?') + tm(200, '−', 168, 32, 'kr'), t:'Växel: det du betalar minus det som det kostar. Du kan trycka på svaret från steg 1.' },
        { v:qv + dn(1, 6, '·', 28, 168, 'kr') + dn(2, 200, '−', 168, 32, 'kr') + cn('Uttrycket blir 200 − 6 · 28 = 32 kr.'), t:'Sist visar appen hela uttrycket. Så vill läraren se det skrivet.' },
        { v:qo + lab('Steg 1: Vad gav de 5 domarna tillsammans?') + tm(5, '·', 8, 40, 'poäng') + lab('Steg 2: Vad gav den sista domaren?') + tm(47, '−', 40, 7, 'poäng'), t:'Ibland är det totala givet och en del saknas: det totala minus det du vet.' },
        { v:big('7 · 8 + 6 · 9') + tm(7, '·', 8, 56) + tm(6, '·', 9, 54) + tm(56, '+', 54, 110), t:'Gånger först gäller alltid: först båda gångertalen, sedan plus.' },
      ];
    }
    const q = '<p class="mp-text">Alva köper 3 pennor och 2 sudd. Hur mycket kostar det tillsammans?</p>';
    return [
      { v:shop, t:'Här löser du problem steg för steg. Prislistan visar vad sakerna kostar, och du kan trycka på ett pris.' },
      { v:q + lab('Steg 1: Vad kostar 3 pennor?') + tm('', '·', '', '', 'kr'), t:'Appen delar upp frågan i steg. Varje steg har rutor: två tal, ett räknesätt och svaret.' },
      { v:q + lab('Steg 1: Vad kostar 3 pennor?') + tm(3, '·', 7, 21, 'kr'), t:'3 pennor kostar 3 · 7. Skriv 3 och 7, eller tryck på priset, och svaret 21 sist.' },
      { v:q + dn(1, 3, '·', 7, 21, 'kr') + lab('Steg 2: Vad kostar 2 sudd?') + tm(2, '·', 4, 8, 'kr'), t:'Steg 2 kommer när steg 1 stämmer: 2 sudd kostar 2 · 4 = 8 kr.' },
      { v:q + dn(1, 3, '·', 7, 21, 'kr') + dn(2, 2, '·', 4, 8, 'kr') + lab('Steg 3: Vad kostar det tillsammans?') + tm(21, '+', 8, 29, 'kr'), t:'Lägg ihop svaren från steg 1 och steg 2. Du kan trycka på dem i stället för att skriva.' },
      { v:q + dn(1, 3, '·', 7, 21, 'kr') + dn(2, 2, '·', 4, 8, 'kr') + dn(3, 21, '+', 8, 29, 'kr') + cn('Uttrycket blir 3 · 7 + 2 · 4 = 29 kr.'), t:'Sist visar appen hela uttrycket. Så vill läraren se det skrivet.' },
      { v:big('6 · 7 + 34') + tm(6, '·', 7, 42) + tm(42, '+', 34, 76), t:'Utan prislista gäller samma sak: gånger först, sedan plus.' },
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
    if (t.type === 'prob')                                  // D39 ✎: steg för steg, mallen [ ] op [ ] = [ ]
      return { kind:'prob', k:0, v:blanks(3), f:0, given:new Set(), bad:new Set(), sw:0, outc:[], msg:null, H };
    const W = t.width, blank = () => Array(W).fill(null);
    const rws = t.two ? ['p1', 'p2', 's'] : t.parts.map(p => 'r' + p.i).concat(['s']);   // ensiffrig: en rad per delprodukt
    const vals = { m:blank() }; rws.forEach(r => vals[r] = blank());
    /* tvåsiffrig: tankeradens anteckningsrutor per rad (en per term + summan); fokus börjar i dem */
    const notes = t.two ? { p1:Array(L.placeTerms(t.top).length + 1).fill(''), p2:Array(L.placeTerms(t.top).length + 1).fill('') } : null;
    /* rq = radfrågan (D38 ✎): k = raden som frågas (index i delprodukternas ordning), phase 'grey' (rad 2:s nolla)
       eller 'ask', ans = svaret (ensiffrig), wrong = fel på raden, outc = utfallet per rad */
    const rq = { k:0, phase:'ask', ans:'', wrong:0, msg:null, outc:{}, greyWrong:0, busy:false };
    return { kind:'upp', rows:rws, vals, notes, rq, booked:new Set(), f:{ row:rws[0], col:0, note:notes ? 0 : null }, back:null, given:new Set(), pulse:false, H };
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
    el.innerHTML = m ? (m.title ? `<b>${svg(m.kind === 'retry' ? 'again' : m.kind === 'info' ? 'next' : 'bulb')}${esc(m.title)}</b>` : '') + `<span>${esc(m.text)}</span>` : '';
    el.className = 'mp-help' + (m ? ' on ' + m.kind : '');
  }

  /* ── Kladden: appens kladdyta (samma ritkod som multdiv:s setupCanvas/mdSyncBitmap/mdPD/mdPM,
     kladd-lagen: den fyller all yta som blir över under knappsatsen). Töms vid ny uppgift. ── */
  let scCanvas = null, scCtx = null, scDrawing = false, scErasing = false, scX = 0, scY = 0, scObs = null;
  function scratchHTML() {
    const b = (id, act, icon, label, on) => `<button class="mp-sc-b${on ? ' on' : ''}" ${id ? `id="${id}" ` : ''}data-act="${act}" aria-label="${label}" title="${label}">${svg(icon)}</button>`;
    return `<div class="mp-scratch">
      <div class="mp-sc-bar"><span class="mp-sc-l">Kladd</span>
        ${b('mp-sc-pen', 'scpen', 'pen', 'Rita', true)}${b('mp-sc-erase', 'scerase', 'eraser', 'Sudda')}
        ${b('mp-sc-undo', 'scundo', 'undo', 'Ångra')}${b('mp-sc-redo', 'scredo', 'redo', 'Gör om')}${b('', 'scclear', 'trash', 'Rensa kladden')}</div>
      <canvas id="mp-canvas" class="mp-canvas"></canvas>
    </div>`;
  }
  /* Varje penn- och suddrag sparas som ett drag i historiken; Ångra/Gör om ritar om kladden från dragen.
     Historiken töms vid ny uppgift (scSetup). */
  let scHist = L.createHistory(), scStroke = null;
  function scSetup() {
    if (scObs) { scObs.disconnect(); scObs = null; }
    scCanvas = document.getElementById('mp-canvas'); scCtx = null; scErasing = false; scHist.reset(); scStroke = null;
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
      scButtons();
    });
  }
  function scSync() {
    if (!scCanvas || !scCtx || !scCanvas.isConnected) return;
    const w = Math.round(scCanvas.clientWidth), h = Math.round(scCanvas.clientHeight);
    if (!w || !h || (Math.abs(w - scCanvas.width) < 2 && Math.abs(h - scCanvas.height) < 2)) return;
    scCanvas.width = w; scCanvas.height = h; scRedraw();
  }
  function scSeg(op, a, b) {
    scCtx.globalCompositeOperation = op.erase ? 'destination-out' : 'source-over';
    scCtx.lineWidth = op.erase ? 20 : b[2];
    scCtx.strokeStyle = '#0d9488'; scCtx.lineCap = 'round'; scCtx.lineJoin = 'round';
    scCtx.beginPath(); scCtx.moveTo(a[0], a[1]); scCtx.lineTo(b[0], b[1]); scCtx.stroke();
  }
  function scDrawOp(op) { const P = op.pts; if (P.length === 1) scSeg(op, P[0], P[0]); for (let i = 1; i < P.length; i++) scSeg(op, P[i - 1], P[i]); }
  function scRedraw() {
    if (!scCtx || !scCanvas) return;
    scCtx.globalCompositeOperation = 'source-over';
    scCtx.clearRect(0, 0, scCanvas.width, scCanvas.height);
    for (const op of scHist.visible()) if (op.type === 'stroke') scDrawOp(op);
  }
  function scButtons() {
    const u = document.getElementById('mp-sc-undo'), r = document.getElementById('mp-sc-redo');
    if (u) { u.classList.toggle('off', !scHist.canUndo()); u.setAttribute('aria-disabled', String(!scHist.canUndo())); }
    if (r) { r.classList.toggle('off', !scHist.canRedo()); r.setAttribute('aria-disabled', String(!scHist.canRedo())); }
  }
  function scPos(e) { const r = scCanvas.getBoundingClientRect(); return [(e.clientX - r.left) * (scCanvas.width / r.width), (e.clientY - r.top) * (scCanvas.height / r.height)]; }
  function scPD(e) {
    if (!scCtx) return;
    e.preventDefault(); scDrawing = true;
    const [x, y] = scPos(e);
    scStroke = { type:'stroke', erase:scErasing, pts:[[x, y, 2 + (e.pressure || 0.5) * 3]] };
    try { scCanvas.setPointerCapture(e.pointerId); } catch (_) {}
  }
  function scPM(e) {
    if (!scDrawing || !scCtx || !scStroke) return;
    e.preventDefault();
    const [x, y] = scPos(e), pt = [x, y, 2 + (e.pressure || 0.5) * 3];
    scSeg(scStroke, scStroke.pts[scStroke.pts.length - 1], pt);
    scStroke.pts.push(pt);
  }
  function scPU() {
    if (scDrawing && scStroke && scStroke.pts.length > 1) { scHist.push(scStroke); scButtons(); }
    scDrawing = false; scStroke = null;
  }
  function scTool(erase) {
    scErasing = erase;
    const p = document.getElementById('mp-sc-pen'), e = document.getElementById('mp-sc-erase');
    if (p) p.classList.toggle('on', !erase);
    if (e) e.classList.toggle('on', erase);
  }
  function scClear() { if (scHist.visible().length) { scHist.push({ type:'clear' }); scRedraw(); scButtons(); } }
  function scUndo() { if (scHist.undo()) { scRedraw(); scButtons(); } }
  function scRedo() { if (scHist.redo()) { scRedraw(); scButtons(); } }

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
    }
    const G = fb ? null : uppGuide(t), M = !fb && IN.H.msg, open = fb ? null : L.uppOpenRows(t, IN.vals);
    /* uppställningen: hjälpens rad tar vägvisningens plats i kortet (annars får kladden ingen plats) */
    const inRows = !fb && IN.rq.k < L.uppRowsOrder(t).length;
    const noteBlock = inRows ? rqHTML(t, G) : '';
    const top = noteBlock ? noteBlock : M ? `<p class="mp-guide hm ${M.kind}">${svg(M.kind === 'retry' ? 'again' : 'bulb')}<span><b>${esc(M.title)}</b> ${esc(M.text)}</span></p>`
      : G ? `<p class="mp-guide">${svg('next')}<span class="tx">${esc(G.text)}</span></p>` : '';
    const focus = fb ? null : G && G.grey ? { row:'p2', col:0 } : inRows ? null : IN.f;
    return `${top}${paperHTML(t, { vals, readonly:!!fb, focus, ok:show || (fb && fb.ok), pulse:!fb && (IN.pulse || (G && G.grey)), given:show ? null : IN.given, lit:G ? G.lit : null, open })}`;
  }

  /* Problemlösningen: skriv uttrycket (fas 1), räkna gånger först rad för rad (fas 2) */
  function probHTML(t, fb) {
    /* Prislistan går att trycka på: priset skrivs i rutan med fokus. Tidigare stegs svar går också att trycka på. */
    const shop = t.shop ? `<div class="mp-shop">${L.SHOP.map(x => `<div class="pick" data-act="pick" data-v="${x.price}" role="button" aria-label="${esc(x.one)} ${x.price} kr">${shopIcon(x.id)}<span>${esc(x.one)}<b>${x.price} kr</b></span></div>`).join('')}</div>` : '';
    const head = t.kind === 'ordning' ? `<p class="mp-text">${esc(t.text)}</p>${big(esc(t.expr))}` : `<p class="mp-text">${esc(t.text)}</p>`;
    const unit = st => st.unit ? ` <span class="mp-unit sm">${esc(st.unit)}</span>` : '';
    const done = t.flow.slice(0, fb && fb.final ? t.flow.length : IN.k).map((st, j) => `<div class="mp-pdone"><span class="mp-pst">Steg ${j + 1}</span>${st.ans[0]} ${st.op} ${st.ans[1]} = <span class="mp-pchip" data-act="pick" data-v="${st.ans[2]}" role="button" aria-label="${st.ans[2]}">${st.ans[2]}</span>${unit(st)}</div>`).join('');
    if (fb && fb.final) return shop + head + done;
    const st = t.flow[IN.k], show = fb && fb.showAns;
    const bx = i => {
      if (show || IN.given.has(i)) return `<span class="mp-nb given">${esc(show ? String(st.ans[i]) : IN.v[i])}</span>`;
      const cls = (IN.f === i && !fb ? ' focus' : '') + (IN.bad.has(i) ? ' bad' : '');
      return `<span class="mp-nb${cls}" data-act="bx" data-i="${i}">${esc(IN.v[i])}</span>`;
    };
    const msg = IN.msg ? `<div class="mp-rqmsg ${IN.msg.kind}">${esc(IN.msg.text)}</div>` : '';
    return shop + head + done + `<div class="mp-pcur"><div class="mp-plabel">Steg ${IN.k + 1}: ${esc(st.q)}</div>
      <div class="mp-nl mp-ptmpl">${bx(0)}<span class="mp-op">${st.op}</span>${bx(1)}<span class="mp-op">=</span>${bx(2)}${unit(st)}</div>${msg}</div>`;
  }

  /* Tabelltestet: 20 tal i två kolumner. Runda 2: de orange rättas. */
  function sheetHTML(t, fb) {
    const out = IN.out;
    const cell = (it, i) => {
      let cls = 'mp-sr';
      const o = out[i];
      if (o === 'direkt') cls += ' ok';
      else if (o === 'hjalp') cls += ' fixed';
      else if (o === 'svar') cls += ' shown';
      else if (IN.bad.has(i)) cls += ' bad';
      if (!fb && IN.f === i && !o) cls += ' focus';
      const old = !o && IN.old && IN.old[i] != null && IN.v[i] === '' ? `<span class="old">${esc(IN.old[i])}</span>` : '';
      const fix = o === 'svar' ? `<span class="fix">${it.answer}</span>` : old;
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
    const R = L.uppRowsOrder(t), rq = IN.rq;
    if (rq.k < R.length) {                               // radfrågan
      const row = R[rq.k];
      if (!t.two) return { ask:true, row, lit:{ top:[+row.slice(1)], bot:[0] } };
      const N = L.thinkNotes(t, row), j = IN.f.note;
      const top = j != null && j < N.terms.length ? [String(N.terms[j]).length - 1] : L.digitsOf(t.top).map((_, k) => k);
      return { notes:rq.phase !== 'grey', grey:rq.phase === 'grey', row, lit:{ top, bot:[row === 'p1' ? 0 : 1] } };
    }
    /* summan: en kolumn i taget (provet: bara "kolumn för kolumn") */
    const col = IN.f.row === 's' ? IN.f.col : 0, mode = S && S.mode === 'prov' ? 'prov' : 'ova';
    return { text:L.thinkSteps(t, 's', mode, col)[0], lit:{ col } };
  }
  /* Radfrågans block ovanför rutnätet */
  function rqHTML(t, G) {
    const rq = IN.rq, n = IN.rows.indexOf(G.row) + 1;
    const msg = rq.msg ? `<div class="mp-rqmsg ${rq.msg.kind}">${esc(rq.msg.text)}</div>` : '';
    if (G.grey) return `<div class="mp-notes"><div class="mp-nl"><span class="mp-nt">Rad 2 är tiotalet: skriv 0 i den grå rutan.</span></div>${msg}</div>`;
    if (G.ask) {
      const q = L.rowQuestion(t, G.row);
      return `<div class="mp-notes"><div class="mp-nl"><span class="mp-nt">Rad ${n}: ${esc(q.text)}</span><span class="mp-nb rq${rq.busy ? '' : ' focus'}" id="mp-rqa">${esc(rq.ans)}</span></div>${msg}</div>`;
    }
    return notesHTML(t, G.row, msg);
  }

  /* Tankeradens anteckningsrutor: "8 · 80 = [ ]  8 · 2 = [ ]" och "Rad 1: 640 + 16 = [ ]" (barnets egna tal
     speglas). Öva rättar rutan när barnet lämnat den; provet rättar aldrig och visar inga värden. */
  function notesHTML(t, row, msg) {
    const N = L.thinkNotes(t, row), v = IN.notes[row], k = N.terms.length, mode = S && S.mode === 'prov' ? 'prov' : 'ova';
    const box = j => {
      const foc = IN.f.row === row && IN.f.note === j;
      const mark = foc && !IN.rq.busy ? 'focus' : j < k ? (L.noteMark(t, row, j, v[j], mode) || '') : '';
      return `<span class="mp-nb ${mark}${j === k ? ' rq' : ''}" ${j === k ? 'id="mp-rqa" ' : ''}data-act="note" data-row="${row}" data-j="${j}">${esc(v[j])}</span>`;
    };
    const l1 = N.labels.map((lb, j) => `<span class="mp-np"><span class="mp-nt">${esc(lb)} =</span>${box(j)}</span>`).join('');
    const mirror = v.slice(0, k).map(x => x || '…').join(' + ');
    const l2 = `<span class="mp-nt">Rad ${row === 'p1' ? 1 : 2}: ${esc(mirror)} =</span>${box(k)}<span class="mp-nt sm">Svara med summan.</span>`;
    return `<div class="mp-notes"><div class="mp-nl">${l1}</div><div class="mp-nl">${l2}</div>${msg || ''}</div>`;
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
      const edit = !o.readonly && !gv && !lk && row === 's';   // raderna bokförs av appen; summan skriver barnet
      return `<div class="${cls}" data-r="${row}" data-c="${i}" ${edit ? `data-act="cell" data-row="${row}" data-col="${i}"` : ''}${lk ? ' aria-disabled="true"' : ''}>${v != null ? v : ''}</div>`;
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
    if (IN.kind === 'prob' && IN.adv)                       // svaret visades: nästa steg på ett tryck
      return `<div class="mp-pad5">${digits}${erase}<button class="mp-k nx w4 pri" data-act="padv">Nästa steg ${svg('right')}</button></div>`;
    if (IN.kind === 'prob' && L.oneButton(IN.v, openIdx()) === 'klar')
      return `<div class="mp-pad5">${digits}${erase}<button class="mp-klar w4" id="mp-klar" data-act="klar">${svg('check')}<span>Svara</span></button></div>`;
    /* EN knapp bredvid ⌫ (D39 ✎): "Nästa tal"/"Nästa ruta" tills varje ruta är ifylld, sedan "Klar" */
    if (IN.kind === 'boxes' || IN.kind === 'sheet' || IN.kind === 'prob') {
      if (L.oneButton(IN.v, openIdx()) === 'klar') return `<div class="mp-pad5">${digits}${erase}${klar(4).replace(' disabled', '')}</div>`;
      const nx = IN.kind === 'sheet' ? `Nästa tal ${svg('down')}` : `Nästa ruta ${svg('right')}`;
      return `<div class="mp-pad5">${digits}${erase}<button class="mp-k nx w4 pri" data-act="key" data-k="next">${nx}</button></div>`;
    }
    if (t.type === 'upp' && IN.rq.k < L.uppRowsOrder(t).length && IN.rq.phase === 'grey')   // nollan rättas när den skrivs
      return `<div class="mp-pad5">${digits}${erase}<button class="mp-klar w4" disabled>${svg('check')}<span>Svara</span></button></div>`;
    if (t.type === 'upp' && IN.rq.k < L.uppRowsOrder(t).length && IN.rq.phase !== 'grey') {
      const last = IN.notes ? IN.notes[L.uppRowsOrder(t)[IN.rq.k]].length - 1 : 0;
      /* Radfrågan har EN knapp (Svara, eller Nästa mellan anteckningsrutorna); Klar finns först när summan låsts upp */
      const lbl = IN.notes && (IN.f.note == null ? 0 : IN.f.note) < last ? `${svg('right')}<span>Nästa</span>` : `${svg('check')}<span>Svara</span>`;
      return `<div class="mp-pad5">${digits}${erase}<button class="mp-klar w4" data-act="key" data-k="next">${lbl}</button></div>`;
    }
    return `<div class="mp-pad5">${digits}${erase}${klar(4)}</div>`;
  }
  function canSubmit() {
    if (!IN) return false;
    if (IN.kind === 'num') return IN.v.length > 0;
    if (IN.kind === 'boxes') return IN.v.every(x => x.length > 0);
    if (IN.kind === 'sheet') return L.oneButton(IN.v, openIdx()) === 'klar';
    if (IN.kind === 'prob') return !IN.adv && IN.v.every(x => x.length > 0);
    const t = curTask();
    return !!t && IN.rq.k >= L.uppRowsOrder(t).length && !IN.rq.busy && IN.vals.s.some(d => d != null);
  }
  function updKlar() { const k = document.getElementById('mp-klar'); if (k) k.disabled = !canSubmit() || locked; }

  /* Rutor som går att skriva i (inte ifyllda av hjälpen, inte klara i bladet) */
  function openBox(i) { return !(IN.given && IN.given.has(i)) && !(IN.kind === 'sheet' && IN.out[i]); }
  function nextOpen(from) { const n = IN.v.length; for (let k = 1; k <= n; k++) { const j = (from + k) % n; if (openBox(j)) return j; } return from; }
  const openIdx = () => IN.v.map((_, i) => i).filter(openBox);
  function press(k) {
    const t = curTask();
    if (!t || locked || !IN) return;
    S.touched = true;
    if (IN.kind === 'num') {
      if (k === 'erase') IN.v = IN.v.slice(0, -1);
      else if (/^\d$/.test(k) && IN.v.length < 6) IN.v = (IN.v === '0' ? '' : IN.v) + k;
    } else if (IN.kind === 'boxes' || IN.kind === 'sheet' || IN.kind === 'prob') {
      if (!openBox(IN.f)) IN.f = nextOpen(IN.f);
      if (k === 'next') { const j = L.nextEmpty(IN.v, IN.f, openIdx()); IN.f = j >= 0 ? j : nextOpen(IN.f); }
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
  /* Summafasen: fokus bara i summan eller minnesrutorna */
  function uppFixFocus(t) {
    if (IN.rq.k < L.uppRowsOrder(t).length) return;
    if (IN.f.row !== 's' && IN.f.row !== 'm') IN.f = { row:'s', col:uppFirstFree('s') };
  }
  function uppPress(t, k) {
    const R = L.uppRowsOrder(t), rq = IN.rq;
    if (rq.k < R.length) {                                   // radfrågan
      if (rq.busy) return;
      const row = R[rq.k];
      if (rq.phase === 'grey') {                             // rad 2: barnet skriver nollan själv
        if (!/^\d$/.test(k)) return;
        if (k === '0') { IN.vals.p2[0] = 0; IN.booked.add('p2:0'); rq.phase = 'ask'; rq.msg = null; IN.f = { row, col:0, note:0 }; return; }
        rq.greyWrong++;
        if (rq.greyWrong >= 3) { IN.vals.p2[0] = 0; IN.given.add('p2:0'); rq.phase = 'ask'; IN.f = { row, col:0, note:0 }; rq.msg = { kind:'bit', text:'Nollan står nu i den grå rutan. Rad 2 är tiotalet.' }; return; }
        rq.msg = { kind:'retry', text:rq.greyWrong === 1 ? 'Nästan! Rad 2 är tiotalet, så den grå rutan får en nolla.' : 'Skriv 0, nollan, i den grå rutan.' };
        return;
      }
      if (!t.two) {                                          // ensiffrig: ett svarsfält, vänster till höger
        if (k === 'next') return rowAnswer(t, row, rq.ans);
        if (k === 'erase') rq.ans = rq.ans.slice(0, -1);
        else if (/^\d$/.test(k) && rq.ans.length < 5) rq.ans = (rq.ans === '0' ? '' : rq.ans) + k;
        return;
      }
      const nv = IN.notes[row], last = nv.length - 1, j = IN.f.note == null ? 0 : IN.f.note;
      if (k === 'next') { if (j < last) IN.f = { row, col:0, note:j + 1 }; else rowAnswer(t, row, nv[last]); return; }
      if (k === 'erase') { if (nv[j]) nv[j] = nv[j].slice(0, -1); else if (j > 0) IN.f = { row, col:0, note:j - 1 }; return; }
      if (/^\d$/.test(k) && nv[j].length < 5) nv[j] = (nv[j] === '0' ? '' : nv[j]) + k;
      return;
    }
    /* summan: siffran hamnar i rutan med fokus, sedan ett steg åt vänster */
    const f = IN.f, W = t.width, rowVals = IN.vals[f.row];
    if (k === 'next') return;
    if (k === 'erase') {
      if (rowVals[f.col] != null && uppFree(f.row, f.col)) rowVals[f.col] = null;
      else if (f.row === 's' && f.col > 0 && uppFree('s', f.col - 1)) { IN.f = { row:'s', col:f.col - 1 }; IN.vals.s[f.col - 1] = null; }
      return;
    }
    if (!/^\d$/.test(k) || !uppFree(f.row, f.col)) return;
    rowVals[f.col] = +k;
    if (f.row === 'm') { IN.f = IN.back || { row:'s', col:0 }; IN.back = null; return; }
    let c = f.col + 1;
    while (c < W - 1 && !uppFree('s', c)) c++;
    if (c < W && uppFree('s', c)) IN.f = { row:'s', col:c };
  }
  /* Radens svar: rätt ⇒ bokförs; fel ⇒ försök igen, ledtråd, svaret (bokförs) */
  function rowAnswer(t, row, val) {
    const rq = IN.rq, q = L.rowQuestion(t, row);
    if (val === '' || val == null) return;
    if (+val === q.answer) { snd('correct'); return rowBookAnim(t, row, rq.wrong ? 'hjalp' : 'direkt'); }
    if (rq.wrong >= 1) snd('wrong');                     // D39: första "försök igen" är tyst
    rq.wrong++;
    const step = L.rowHelpStep(rq.wrong);
    if (!t.two) rq.ans = ''; else IN.notes[row][IN.notes[row].length - 1] = '';
    if (step === 'retry') rq.msg = { kind:'retry', text:'Inte riktigt – försök igen.' };
    else if (step === 'hint') rq.msg = { kind:'bit', text:L.rowHint(t, row) };
    else { if (!t.two) rq.ans = String(q.answer); else IN.notes[row][IN.notes[row].length - 1] = String(q.answer); return rowBookAnim(t, row, 'svar'); }
  }
  /* Bokföringen: texten först, sedan flyttar talet in på sin rad och sitt platsvärde */
  function rowBookAnim(t, row, outcome) {
    const rq = IN.rq, q = L.rowQuestion(t, row), n = IN.rows.indexOf(row) + 1, token = IN;
    rq.busy = true;
    const where = row === 'p2' ? 'rad 2, efter nollan' : `rad ${n}`;
    rq.msg = { kind:outcome === 'svar' ? 'bit' : 'ok', text:outcome === 'svar' ? `Svaret är ${q.answer}. Det skrivs på ${where}.` : `Rätt! ${q.answer} skrivs på ${where}.` };
    refreshQ(t);
    const cells = L.rowBook(t, row);
    const land = () => {
      if (IN !== token) return;
      for (const c of cells) { IN.vals[row][c.col] = c.val; (outcome === 'svar' ? IN.given : IN.booked).add(row + ':' + c.col); }
      rq.outc[row] = outcome;
      rq.k++; rq.wrong = 0; rq.ans = ''; rq.busy = false; rq.msg = null;
      const R = L.uppRowsOrder(t), next = R[rq.k];
      if (!next) IN.f = { row:'s', col:0 };
      else if (next === 'p2') { rq.phase = 'grey'; IN.f = { row:'p2', col:0 }; }
      else { rq.phase = 'ask'; IN.f = { row:next, col:0, note:t.two ? 0 : null }; }
      refreshQ(t);
    };
    const reduce = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; } })();
    if (reduce) return setTimeout(land, 500);
    setTimeout(() => {                                     // texten står innan rörelsen börjar
      if (IN !== token) return;
      const from = document.getElementById('mp-rqa');
      const els = cells.map(c => document.querySelector(`#mp-q .mp-c[data-r="${row}"][data-c="${c.col}"]`)).filter(Boolean);
      if (!from || !els.length) return land();
      const a = from.getBoundingClientRect(), rs = els.map(e => e.getBoundingClientRect());
      const box = { l:Math.min(...rs.map(r => r.left)), t:Math.min(...rs.map(r => r.top)), r:Math.max(...rs.map(r => r.right)), b:Math.max(...rs.map(r => r.bottom)) };
      const fly = document.createElement('div');
      fly.className = 'mp-fly'; fly.textContent = String(q.answer);
      Object.assign(fly.style, { left:a.left + 'px', top:a.top + 'px', width:a.width + 'px', height:a.height + 'px' });
      document.body.appendChild(fly);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        Object.assign(fly.style, { left:box.l + 'px', top:box.t + 'px', width:(box.r - box.l) + 'px', height:(box.b - box.t) + 'px', letterSpacing:((box.r - box.l) / cells.length - 18) + 'px' });
      }));
      setTimeout(() => { fly.remove(); land(); }, 520);
    }, 700);
  }
  function refreshQ(t) {
    if (IN && IN.kind === 'upp') uppFixFocus(t);
    const q = document.getElementById('mp-q');
    if (q) q.innerHTML = questionHTML(t);
    if (IN && IN.kind !== 'num') { const c = document.getElementById('mp-ctrl'); if (c && !c.querySelector('.mp-fb')) c.innerHTML = padHTML(t); }
    updKlar();
  }

  const num = x => x === '' ? null : +x;
  function readResp(t) {
    if (t.type === 'num') return num(IN.v);
    if (t.type === 'tio' || t.type === 'te' || t.type === 'sheet') return IN.v.map(num);
    if (t.type === 'prob') return IN.v.slice();
    return Object.assign({}, IN.vals);                 // alla rader: p1/p2 eller r0 … r{k-1}, och s
  }

  function submit() {
    const t = curTask();
    if (!t || locked || !canSubmit()) return;
    S.touched = true;
    if (t.type === 'sheet') return sheetSubmit(t);
    if (t.type === 'prob') return probAnswer(t);
    answered(t, L.check(t, readResp(t)));
  }

  /* Problemlösningen: ett steg rättas när barnet trycker Svara. Fel: försök igen (tyst), talen i rutorna,
     svaret. Rätt eller visat svar ⇒ nästa steg. Efter sista steget: slutsatsen med uttrycket. */
  function probAnswer(t) {
    const st = t.flow[IN.k], res = L.checkProbStep(st, IN.v);
    if (res.ok) { snd('correct'); IN.outc[IN.k] = IN.sw ? 'hjalp' : 'direkt'; return probAdvance(t); }
    if (!IN.H.wrong && isDrill()) S.drill.answer(false);  // nötloopen: uppgiften kommer igen senare
    IN.H.wrong++;
    if (IN.sw >= 1) snd('wrong');                         // första "försök igen" är tyst (D39)
    IN.sw++;
    const step = L.probHelpStep(IN.sw);
    IN.bad = new Set(res.wrong.map((w, i) => w ? i : -1).filter(i => i >= 0 && !IN.given.has(i)));
    if (step === 'retry') { IN.msg = { kind:'retry', text:'Inte riktigt – försök igen. ' + L.probStepHint(t, IN.k) }; IN.f = [...IN.bad][0] ?? 0; }
    else if (step === 'bit') {
      const b = L.probStepBit(t, IN.k);
      for (const [i, v] of Object.entries(b.fill)) { IN.v[+i] = String(v); IN.given.add(+i); IN.bad.delete(+i); }
      IN.msg = { kind:'bit', text:b.text }; IN.f = 2; if (IN.bad.has(2)) IN.v[2] = '';
    } else {
      st.ans.forEach((v, i) => { IN.v[i] = String(v); IN.given.add(i); });
      IN.bad = new Set(); IN.outc[IN.k] = 'svar';
      IN.msg = { kind:'bit', text:`Så här blir det: ${st.ans[0]} ${st.op} ${st.ans[1]} = ${st.ans[2]}.` };
      IN.adv = true;
    }
    refreshQ(t);
  }
  function probAdvance(t) {
    IN.adv = false; IN.msg = null;
    if (IN.k < t.flow.length - 1) {
      IN.k++; IN.v = ['', '', '']; IN.f = 0; IN.given = new Set(); IN.bad = new Set(); IN.sw = 0;
      return refreshQ(t);
    }
    /* slutsatsen sist, i ett eget steg: uttrycket som läraren vill se */
    locked = true;
    const outcome = IN.outc[IN.outc.length - 1] === 'svar' ? 'svar' : IN.outc.some(o => o !== 'direkt') ? 'hjalp' : 'direkt';
    taskDone(t, outcome, null);
    const title = outcome === 'svar' ? 'Så här blir det' : `Rätt!${outcome === 'hjalp' ? '<small>med hjälp</small>' : ''}`;
    renderTask({ ok:true, final:true, html:`<div class="mp-fb good"><h3>${svg('check')}${title}</h3>
      <p class="mp-concl">${esc(L.probConclusion(t))}</p>
      <button class="mp-cta" data-act="${outcome === 'svar' ? 'svarnext' : 'next'}">Nästa ${svg('next')}</button></div>` }, true, t);
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
    if (H.wrong >= 1) snd('wrong');                       // D39: första "försök igen" är tyst
    H.wrong++;
    if (H.wrong === 1) { H.cls0 = res.cls; H.bits = L.helpBits(t, res.cls); if (isDrill()) S.drill.answer(false); }
    const step = L.helpStep(H.wrong, H.bits.length);
    if (step === 'svar') { taskDone(t, 'svar', H.cls0); return showWrong(t, res); }
    markBad(t, res);
    if (step === 'retry') H.msg = { kind:'retry', title:'Inte riktigt – försök igen.', text:L.helpHint(t, res.cls) };
    else {
      const k = +step.slice(3), bit = H.bits[k - 1];
      applyFill(t, bit.fill);
      H.msg = { kind:'bit', title:`Hjälp ${k} av ${H.bits.length}`, text:bit.text };
    }
    renderTask(null, true, t);
  }
  /* Rutorna som inte var rätt blir milt orange tills barnet ändrar dem */
  function markBad(t, res) {
    if (IN.kind === 'num') { IN.v = ''; return; }
    if (!IN.bad || !res.wrong) return;
    IN.bad = new Set(res.wrong.map((w, i) => w ? i : -1).filter(i => i >= 0 && openBox(i)));
    if (IN.bad.size) IN.f = [...IN.bad][0];
  }
  /* Hjälpens bit skrivs in åt barnet och låses */
  function applyFill(t, fill) {
    if (!fill) return;
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
    let detail = null;
    if (t.type === 'upp' && IN && IN.rq) {                   // en rad som fått hjälp gör uppgiften "med hjälp"
      const rows = Object.keys(IN.rq.outc).filter(r => IN.rq.outc[r] !== 'direkt');
      detail = { rows, grey:IN.rq.greyWrong > 0 };
      if (outcome === 'direkt' && (rows.length || detail.grey)) outcome = 'hjalp';
    }
    const s = readSt(), p = provSt(s);
    p.hard = L.recordOutcome(p.hard, t, outcome, cls, today(), detail);
    writeSt(s);
    if (S.mode === 'prov') { S.results.push({ moment:t.moment, ok:outcome === 'direkt', outcome, mitt:S.mitt }); S.idx++; }
    else if (isDrill()) { S.outc[outcome]++; if (outcome !== 'svar') S.drill.answer(true); }
  }

  /* Tabelltestet: Klar rättar; de röda får rättas en gång (rätt då = med hjälp), sedan visas svaren */
  /* Tabelltestet (D39): Klar rättar först när alla rutor är ifyllda; annars en vänlig rad, fokus till första tomma,
     inget ljud och ingen färg. Runda 2: de orange får rättas en gång (rätt då = med hjälp), sedan visas svaren. */
  function sheetSubmit(t) {
    const vals = readResp(t);
    if (L.oneButton(IN.v, openIdx()) !== 'klar') return;   // Klar finns bara när alla rutor är ifyllda
    const res = L.check(t, vals);
    if (IN.round === 1) {
      res.per.forEach((ok, i) => { if (ok) IN.out[i] = 'direkt'; });
      if (res.ok) return sheetDone(t);
      IN.round = 2; IN.bad = new Set(res.per.map((ok, i) => ok ? -1 : i).filter(i => i >= 0)); IN.f = [...IN.bad][0];
      IN.old = {}; for (const i of IN.bad) { IN.old[i] = IN.v[i]; IN.v[i] = ''; }   // de orange töms; det gamla svaret syns svagt
      IN.H.msg = { kind:'retry', title:`Du har ${res.okCount} klara.`, text:'Titta en gång till på de orange.' };
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
      html = `${resHead(c.direkt, t.items.length)}${sum}
        <button class="mp-cta" data-act="next">Nästa ${svg('next')}</button></div>`;
    } else {
      S.wrongItems = t.items.filter((_, i) => IN.out[i] !== 'direkt');
      S.done = true;
      html = `${resHead(c.direkt, t.items.length)}${sum}
        <div class="mp-navrow">${S.wrongItems.length ? `<button class="mp-cta" data-act="sheetnot">${svg('again')}Nöt de ${S.wrongItems.length} som inte satt</button>` : ''}
        <button class="mp-cta sec" data-act="prov">Klar</button></div></div>`;
    }
    renderTask({ ok:true, sheetDone:true, html }, true, t);
  }
  /* De tre utfallen som små siffror: rätt direkt · med hjälp · fick svaret */
  /* Resultatraden (D39 ✎): från 60 % "Du klarade 17 av 20 direkt – Bra kämpat! 💪" med grön ram; under 60 % bara
     resultatet ("Du fick 3 av 20 rätt direkt"), neutral ram och ingen bock – ingen värdering. */
  const resHead = (ok, total) => {
    const high = total > 0 && ok / total >= 0.6;
    return `<div class="mp-fb${high ? ' good' : ''}" style="padding:10px 12px"><h3>${high ? svg('check') : ''}${esc(MP.resultNote(ok, total, ' direkt'))}</h3>`;
  };
  const k3 = (d, h, s) => `<span class="mp-k3"><i class="d" title="Klarade direkt">${d}</i><i class="h" title="Klarade med hjälp">${h}</i><i class="s" title="Övar vi mer på">${s}</i></span>`;
  const k3Legend = () => `<span class="mp-k3leg"><i class="d"></i>Klarade direkt<i class="h"></i>Med hjälp<i class="s"></i>Övar vi mer på</span>`;

  /* Hela svaret (trappans sista steg): förklaringen i steg, sedan Nästa */
  function explainSteps(t, res) {
    if (t.moment === 'tiotal') return L.explainTiotal(t).map(s => s.text);
    if (t.moment === 'problem') {
      const st = t.steps.map(s => s.text);
      return t.needExpr ? [`Uttrycket: ${t.expr}.`].concat(st) : st;
    }
    if (t.moment === 'talsorter') { const f = t.fields.map(x => x.ans); return [`Första raden: ${t.b} delas upp i ${f[0]} och ${f[1]}.`, `Andra raden: ${t.a} · ${f[0]} = ${f[2]} och ${t.a} · ${f[1]} = ${f[3]}.`, `Tredje raden: ${f[2]} + ${f[3]} = ${f[4]}.`]; }
    if (t.moment === 'uppstallning') return ['Lägg ihop raderna en kolumn i taget från höger. Minnessiffrorna står ovanför raderna.', `Summan är ${t.answer}.`];
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
    if (t.type === 'upp') return last ? null : L.uppRowsOrder(t).length;      // raderna och minnet först, summan sist
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
        <div class="mp-rc-row"><span class="nm">Klarade direkt</span><b>${R.correct} av ${R.total}</b></div>
        <div class="mp-rc-row"><span class="nm">Rätt med hjälp</span><b>${o.hjalp}</b></div>
        <div class="mp-rc-row"><span class="nm">Övar vi mer på</span><b>${o.svar}</b></div>
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
    /* D39 ✎: från 60 % beröm, under 60 % bara resultatet */
    const praise = sum.ok === sum.total ? '' : MP.resultNote(sum.ok, sum.total, ' direkt') + (sum.total && sum.ok / sum.total >= 0.6 && !sum.weak.length ? ' Alla moment är gröna.' : '');
    const when = MP.fmtWhen(iso);
    const per = sum.per.filter(x => x.total);
    frame(S.mitt ? 'Mitt prov klart' : 'Provet klart', 'prov', 'Klar', '', `
      <div class="mp-head"><span class="mp-starb">${svg('star')}</span><h2>${sum.ok === sum.total ? 'Allt satt direkt!' : 'Provet är klart!'}</h2><p>${sum.ok === sum.total ? `Du klarade alla ${sum.total} direkt.` : esc(praise)}</p></div>
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
        <p class="mp-text">Så många gångertal du hinner på 4 minuter, högst 48. Blir ett tal inte rätt går du vidare till nästa.</p>
        <p class="mp-note">Sprinten ingår inte i provet.${ps.sprint.best ? ' Ditt bästa: ' + ps.sprint.best + ' tal.' : ''}</p></div>
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
    if (ok) { S.ok++; snd('correct'); }                  // D39: inget felljud i sprinten, svaret visas lugnt
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
      <div class="mp-head" style="margin-top:auto"><div class="mp-bignum">${n}</div><h2>tal klarade du av 48</h2><p>${newBest ? 'Nytt rekord!' : 'Ditt bästa: ' + p.sprint.best}</p></div>
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
      case 'pick':      if (!locked && IN && IN.kind === 'prob' && !IN.adv && !IN.given.has(IN.f)) {
                          IN.v[IN.f] = String(el.dataset.v); IN.bad.delete(IN.f);
                          const j = L.nextEmpty(IN.v, IN.f, openIdx()); if (j >= 0) IN.f = j;
                          snd('click'); refreshQ(curTask());
                        } break;
      case 'padv':      if (IN && IN.kind === 'prob' && IN.adv) { snd('click'); probAdvance(curTask()); } break;
      case 'svarnext':  snd('click'); afterSvar(); break;
      case 'scpen':     scTool(false); break;
      case 'scerase':   scTool(true); break;
      case 'scclear':   scClear(); break;
      case 'scundo':    scUndo(); break;
      case 'scredo':    scRedo(); break;
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
      case 'note':      if (!locked && IN && IN.notes && !IN.rq.busy && IN.rq.phase === 'ask' && L.uppRowsOrder(curTask())[IN.rq.k] === el.dataset.row) {
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
    else if (e.key === 'Enter') { if (canSubmit()) submit(); else press('next'); }
    else if (e.key === 'Tab' && IN.kind !== 'num') { e.preventDefault(); press('next'); }
  }

  return { open, showList, showProv,
           /* bara för test i webbläsaren */
           _peek:() => ({ S, IN, task:curTask() }),
           _force:(items, prov) => { if (prov) { S = { mode:'prov', mitt:false, lv:L.PROV_LEVEL, items, idx:0, results:[], start:Date.now(), touched:false }; renderTask(); } else startDrill('ova', items, items[0].moment); } };
})();

if (typeof window !== 'undefined') window.MatteProv = MatteProv;
