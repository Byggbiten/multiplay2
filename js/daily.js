/* ============================================================
   MULTIPLAY – Dagens träning (window.DailyTraining), v65
   Gäller bara Gångertabellen och Klockan, och bygger på deras
   lådor (kartorna) med påfyllning över tid.

   Urvalet (pickItems, ren och testad i tests/daily.test.mjs):
   varje modul lämnar sina kandidater själv (MultGame.dailyCandidates,
   ClockGame.dailyCandidates) som
     { module, key, label, state:'due'|'ovar'|'ny'|'kan', due, okDays, order }
   Prioritet: 1) dags igen, äldst due först  2) övar, lägst okDays först
   3) högst en ny per modul (den första i lätt-först-ordning). Högst 8.
   Fördelningen följer vad som väntar; har båda modulerna något i
   prioritet 1–2 får båda minst en plats. Lika läge avgörs seedat per
   datum och profil. Urvalet fryses i daily_state_<id> för dagen
   ({ v:2, date, items }); gamla poster ({ date, tal:[{a,b}] }) räknas om.
   Har ingen modul lådor med data finns inget pass.

   Passet: först gångertabellens tal (MultGame.runDaily: ett varv
   flerval med nötloopen och rektangeln), en mellanskärm, sedan
   klocktiderna (ClockGame.runDaily: ett varv där läs och ställ växlar,
   med den animerade klockan). Ett tomt avsnitt hoppas över. Slutskärmen
   är gemensam; passet loggas i daily_log_<id> ({date, tal, score, total})
   så att streak() fungerar, och Capy får händelsen 'daily'.
   ============================================================ */
'use strict';

const DailyTraining = (() => {

  const SH = (typeof MP !== 'undefined' && MP) || require('./shared.js');
  const SP = SH.spaced;

  /* ── Lagringsnycklar (rensas i Store.deleteProfile) ── */
  const LOG_KEY   = id => `daily_log_${id}`;
  const STATE_KEY = id => `daily_state_${id}`;

  const MAX_ITEMS = 8;
  const MODULES = ['mult', 'clock'];
  const STATES = ['due', 'ovar', 'ny', 'kan'];
  const isCore = it => !!it && (it.state === 'due' || it.state === 'ovar');   // prioritet 1–2

  /* ── Datum: lokal tid, dagsgräns = lokal midnatt ───── */
  let todayOverride = null;                           // testkrok: _test.setToday('2026-09-24')
  const today = () => todayOverride || SP.fmtDay(new Date());
  function dayStr(d) {
    const dt = d ? new Date(d) : new Date();
    if (isNaN(dt)) return '';
    return SP.fmtDay(dt);
  }

  /* ── Enkel hash + seedad PRNG (FNV-1a → mulberry32) ── */
  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function readJSON(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v === null || v === undefined ? fallback : v; }
    catch (_) { return fallback; }
  }
  const dailyLog = profileId => SH.createLog(LOG_KEY(profileId), 60);

  /* ══════════════════════════════════════════════════════
     KANDIDATERNA: modulerna äger sitt format
  ══════════════════════════════════════════════════════ */
  function moduleApi(m) {
    if (m === 'mult')  return typeof MultGame  !== 'undefined' ? MultGame  : null;
    if (m === 'clock') return typeof ClockGame !== 'undefined' ? ClockGame : null;
    return null;
  }
  function candidates(profile, day) {
    const out = [];
    for (const m of MODULES) {
      const api = moduleApi(m);
      if (!api || typeof api.dailyCandidates !== 'function') continue;
      try {
        (api.dailyCandidates(profile, day) || []).forEach(c => {
          if (c && c.module === m && typeof c.key === 'string' && STATES.includes(c.state)) out.push(c);
        });
      } catch (_) { /* en modul får aldrig stoppa hemskärmen */ }
    }
    return out;
  }

  /* ══════════════════════════════════════════════════════
     URVALET (ren)
     cands: kandidater från båda modulerna. seed: 'yyyy-mm-dd|profil'.
     Returnerar uppgifterna i prioritetsordning, eller null när ingen
     modul har lådor med data (allt är nytt eller inget är spelat).
  ══════════════════════════════════════════════════════ */
  function pickItems(cands, seed, max = MAX_ITEMS) {
    const all = (cands || [])
      .filter(c => c && MODULES.includes(c.module) && typeof c.key === 'string' && STATES.includes(c.state))
      .slice()
      .sort((x, y) => (x.module + '|' + x.key < y.module + '|' + y.key ? -1 : 1));
    if (!all.some(c => c.state !== 'ny')) return null;

    // Lika läge: seedat per datum och profil (sorterade nycklar först → stabil tilldelning)
    const rnd = mulberry32(hashSeed(String(seed || '')));
    const tie = new Map(all.map(c => [c, rnd()]));
    const byDue = (x, y) => { const a = x.due || '', b = y.due || ''; return a < b ? -1 : a > b ? 1 : tie.get(x) - tie.get(y); };
    const byOk  = (x, y) => ((Number(x.okDays) || 0) - (Number(y.okDays) || 0)) || (tie.get(x) - tie.get(y));

    const core = [
      ...all.filter(c => c.state === 'due').sort(byDue),     // 1) dags igen, äldst först
      ...all.filter(c => c.state === 'ovar').sort(byOk),     // 2) övar, lägst okDays först
    ];
    const picked = core.slice(0, max);

    // Har båda modulerna något i prioritet 1–2 får båda minst en plats:
    // modulens främsta ersätter den andra modulens sista i urvalet.
    for (const m of MODULES) {
      if (picked.some(c => c.module === m)) continue;
      const best = core.find(c => c.module === m);
      if (!best) continue;
      let idx = -1;
      for (let i = picked.length - 1; i >= 0; i--) if (picked[i].module !== m) { idx = i; break; }
      if (picked.length < max || idx < 0) picked.push(best); else picked[idx] = best;
    }

    // 3) Högst en ny uppgift per modul, den första i lätt-först-ordning
    for (const m of MODULES) {
      if (picked.length >= max) break;
      const ny = all.filter(c => c.module === m && c.state === 'ny').sort((x, y) => (x.order || 0) - (y.order || 0))[0];
      if (ny) picked.push(ny);
    }

    return picked.map(c => {
      const it = { module:c.module, key:c.key, label:String(c.label || c.key), state:c.state, due:c.due || null, okDays:Number(c.okDays) || 0, order:Number(c.order) || 0 };
      if (c.html) it.html = String(c.html);
      return it;
    });
  }
  const hasCore = items => Array.isArray(items) && items.some(isCore);

  /* ── Frysningen: ett urval per dag ─────────────────── */
  function validItem(it) {
    if (!it || !MODULES.includes(it.module) || typeof it.key !== 'string' || !STATES.includes(it.state)) return false;
    if (it.module === 'mult') return /^\d{1,2}x\d{1,2}$/.test(it.key);
    return it.key.indexOf('/') > 0;
  }
  function readFrozen(profileId, day) {
    const st = readJSON(STATE_KEY(profileId), null);
    if (st && st.v === 2 && st.date === day && Array.isArray(st.items) && st.items.length > 0 &&
        st.items.length <= MAX_ITEMS && st.items.every(validItem) && hasCore(st.items)) return st.items;
    return null;                                      // gammal post (bara tal), annan dag eller trasig → räknas om
  }
  /* Dagens urval: räknas ut en gång per dag och fryses, så att passet
     självt inte ändrar det. Ett urval utan något i prioritet 1–2 fryses
     inte: spelar hon en modul senare samma dag räknas det om. */
  function selection(profile, day = today()) {
    if (!profile) return null;
    const frozen = readFrozen(profile.id, day);
    if (frozen) return frozen;
    const items = pickItems(candidates(profile, day), `${day}|${profile.id}`);
    if (hasCore(items)) SH.safeSetItem(STATE_KEY(profile.id), JSON.stringify({ v:2, date:day, items }));
    return items;
  }

  /* ── Klart-status & streak (ur daily_log) ──────────── */
  function doneToday(profileId) {
    const d = today();
    return dailyLog(profileId).get().some(e => e && dayStr(e.date) === d);
  }
  /* Antal dagar i rad med avklarat pass. Kedjan räknas från idag, eller
     från igår om dagens pass inte är gjort än. Läser bara datumet, så
     gamla poster ({tal:['7x8'], score, total}) och nya räknas lika. */
  function streak(profile) {
    if (!profile) return 0;
    const days = new Set(dailyLog(profile.id).get().map(e => e && dayStr(e.date)).filter(Boolean));
    let cur = today();
    if (!days.has(cur)) cur = SP.addDays(cur, -1);
    let n = 0;
    while (days.has(cur)) { n++; cur = SP.addDays(cur, -1); }
    return n;
  }

  /* ══════════════════════════════════════════════════════
     TEXTERNA (rena)
  ══════════════════════════════════════════════════════ */
  const talTxt = n => n === 1 ? 'ett tal' : `${n} tal`;
  const tidTxt = n => n === 1 ? 'en klocktid' : `${n} klocktider`;
  const whatTxt = (m, c) => [m ? talTxt(m) : '', c ? tidTxt(c) : ''].filter(Boolean).join(' och ');
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
  /* Vad som väntar och varför: dags igen / att öva / något nytt.
     Den första orsaken med antal, resten utan (så att inget tal får två roller i en mening). */
  function heroText(items) {
    items = items || [];
    const n = (m, st) => items.filter(i => i.module === m && i.state === st).length;
    const due = [n('mult', 'due'), n('clock', 'due')], ov = [n('mult', 'ovar'), n('clock', 'ovar')];
    const ny = items.some(i => i.state === 'ny');
    const rest = [];
    let head;
    if (due[0] + due[1]) {
      head = `${cap(whatTxt(due[0], due[1]))} är dags att visa igen.`;
      if (ov[0] + ov[1]) rest.push('lite att öva på');
    } else if (ov[0] + ov[1]) {
      head = `Du övar vidare på ${whatTxt(ov[0], ov[1])}.`;
    } else {
      head = 'Något nytt väntar.';
    }
    if (ny && (due[0] + due[1] + ov[0] + ov[1])) rest.push('något nytt');
    return rest.length ? `${head} Sedan ${rest.join(' och ')}.` : head;
  }
  /* "9 av 11" – alla: "Alla 11" (samma tal får inte stå för två saker) */
  const rightTxt = (c, t) => c >= t ? `Alla ${t}` : `${c} av ${t}`;

  /* ══════════════════════════════════════════════════════
     PUBLIKT: hjältekortet
  ══════════════════════════════════════════════════════ */
  /* Grinden: finns något i prioritet 1–2 i dagens urval? (ersätter ≥2 test) */
  function hasWork(profile) {
    try { return !!profile && hasCore(selection(profile)); } catch (_) { return false; }
  }
  /* Hjältekortets innehåll:
       { läge:'träna', items, text }   dagens urval och varför
       { läge:'klart', streak }        dagens pass är gjort
       null                            kom igång (inget att träna än) */
  function heroContent(profile) {
    if (!profile) return null;
    if (doneToday(profile.id)) return { läge:'klart', streak:streak(profile) };
    const items = selection(profile);
    if (!hasCore(items)) return null;
    return { läge:'träna', items, text:heroText(items) };
  }
  /* Etikettens HTML: klocktider i klocklagens färger, tal som text */
  function labelHTML(it) {
    if (it.module === 'clock') {
      let h = '';
      try { if (typeof ClockGame !== 'undefined' && ClockGame.dailyLabelHTML) h = ClockGame.dailyLabelHTML(it.key); } catch (_) {}
      return h || SH.escapeHtml(it.label);
    }
    return SH.escapeHtml(it.label);
  }
  const chipHTML = it => `<span class="dly-chip${it.module === 'clock' ? ' ck' : ''}">${labelHTML(it)}</span>`;

  /* ══════════════════════════════════════════════════════
     PASSET
  ══════════════════════════════════════════════════════ */
  let RUN = null;
  const ICO = {
    check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    star:'<path d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.2l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    next:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  };
  const svg = k => `<svg class="dly-i" viewBox="0 0 24 24" aria-hidden="true">${ICO[k]}</svg>`;
  const droot = () => document.getElementById('daily-root');
  const snd = t => { try { App.Sound.play(t); } catch (_) {} };

  /* Starta dagens pass (App.startDailyTraining). Kör igen använder samma frysta urval. */
  function startPass(profile) {
    const items = profile ? selection(profile) : null;
    if (!profile || !hasCore(items)) { App.goBackToGameSelect(); return; }
    // Lådornas läge just nu (inte det frysta): "fylldes på" gäller bara det som faktiskt var
    // dags igen när passet startade – vid Kör igen är dagens påfyllda redan Kan.
    const live = {};
    candidates(profile, today()).forEach(c => { live[c.key] = c.state; });
    const run = { profile, items, live, res:[], first:{}, start:Date.now() };
    run.mult = items.filter(i => i.module === 'mult');
    run.clock = items.filter(i => i.module === 'clock');
    RUN = run;
    if (run.mult.length) runMult(run);
    else runClock(run);
  }
  function collect(run, st) {
    run.res.push(st);
    Object.assign(run.first, st.first || {});
  }
  function runMult(run) {
    if (typeof MultGame === 'undefined' || !MultGame.runDaily) { runClock(run); return; }
    App.showScreen('screen-multiplication');
    MultGame.runDaily(run.profile, run.mult.map(i => i.key), {
      onDone: st => { if (RUN !== run) return; collect(run, st); if (run.clock.length) showBetween(run); else finish(run); },
      onCancel: () => cancelled(run),
    });
  }
  function runClock(run) {
    if (!run.clock.length || typeof ClockGame === 'undefined' || !ClockGame.runDaily) { finish(run); return; }
    App.showScreen('screen-clock');
    ClockGame.runDaily(run.profile, run.clock.map(i => i.key), {
      onDone: st => { if (RUN !== run) return; collect(run, st); finish(run); },
      onCancel: () => cancelled(run),
    });
  }
  function cancelled(run) {
    if (RUN === run) RUN = null;                       // ett avbrutet pass loggas inte
    App.goBackToGameSelect();
  }

  /* Mellanskärmen: "Nu: Klockan" */
  function showBetween(run) {
    const r = droot(); if (!r) { runClock(run); return; }
    App.showScreen('screen-daily');
    snd('correct');
    const chips = run.clock.map(chipHTML).join('');
    r.innerHTML = `
      <div class="app-header">
        <button class="btn-back" onclick="DailyTraining._confirmCancel()">Avbryt</button>
        <span class="header-title">Dagens träning</span>
        <span class="dly-spacer"></span>
      </div>
      <div class="wrap dly" id="dly-between">
        <div class="dly-steps" aria-label="Del två av två">
          <span class="dly-step ok">${svg('check')}Gångertabellen</span>
          <span class="dly-step cur">${svg('clock')}Klockan</span>
        </div>
        <div class="card dly-card fill">
          <span class="dly-badge ok">${svg('check')}</span>
          <p class="dly-kicker">Talen är klara!</p>
          <h2 class="dly-big">Nu: Klockan</h2>
          <p class="dly-sub">Du läser och ställer klockan, om vartannat.</p>
          <div class="dly-chips">${chips}</div>
        </div>
        <button class="btn btn-primary btn-lg dly-go" id="dly-next" onclick="DailyTraining._next()">Fortsätt ${svg('next')}</button>
      </div>`;
  }
  function next() {
    const run = RUN; if (!run) { App.goBackToGameSelect(); return; }
    snd('click');
    runClock(run);
  }
  function confirmCancel() {
    if (document.getElementById('dly-modal')) return;
    const el = document.createElement('div');
    el.className = 'modal-overlay'; el.id = 'dly-modal';
    el.innerHTML = `<div class="modal"><h3 class="modal-title">Vill du avbryta passet?</h3>
      <p class="dly-modal-txt">Om du avbryter nu sparas inte Dagens träning.</p>
      <div class="dly-modal-btns"><button class="btn btn-primary" id="dly-mStay">Fortsätt passet</button><button class="btn btn-ghost" id="dly-mQuit">Avbryt passet</button></div></div>`;
    document.body.appendChild(el);
    const close = () => el.remove();
    el.addEventListener('click', e => { if (e.target === el) close(); });
    el.querySelector('#dly-mStay').onclick = close;
    el.querySelector('#dly-mQuit').onclick = () => { close(); const run = RUN; RUN = null; if (run) cancelled(run); else App.goBackToGameSelect(); };
  }

  /* Det som fylldes på: var dags igen när passet startade och satt på första försöket (ren) */
  const filledItems = (items, live, first) => (items || []).filter(i => live && live[i.key] === 'due' && first && first[i.key] === true);

  /* Logga ett avklarat pass. tal = nycklar från båda modulerna ('7x8', 'halv/2:30');
     fylldes = de som var dags igen och satt på första försöket. */
  function markDone(profile, result, items, fylldes) {
    if (!profile) return;
    dailyLog(profile.id).add({
      v:2,
      tal:(items || []).map(i => i.key),
      fylldes:(fylldes || []).map(i => i.key),
      score:result.correct,
      total:result.total,
    });
  }

  /* Slutskärmen: gemensam för båda avsnitten */
  function finish(run) {
    if (RUN !== run) return;
    RUN = null;
    const correct = run.res.reduce((s, x) => s + (x.correct || 0), 0);
    const total   = run.res.reduce((s, x) => s + (x.total || 0), 0);
    const pct = total ? Math.round(100 * correct / total) : 0;
    const fylldes = filledItems(run.items, run.live, run.first);
    const ovade = run.items.filter(i => !fylldes.includes(i));
    markDone(run.profile, { correct, total }, run.items, fylldes);
    const days = streak(run.profile);
    // Capybara-samlingen: ren sidoeffekt EFTER loggen – får aldrig kasta
    try { if (window.Capy) Capy.award(run.profile, { type:'daily', data:{ pct, streak:days } }); } catch (_) {}

    const r = droot(); if (!r) { App.goBackToGameSelect(); return; }
    App.showScreen('screen-daily');
    snd('fanfare');
    try { App.Confetti.burst(pct >= 90 ? 110 : 70); } catch (_) {}
    r.innerHTML = `
      <div class="app-header">
        <span class="dly-spacer"></span>
        <span class="header-title">Dagens träning</span>
        <span class="dly-spacer"></span>
      </div>
      <div class="wrap dly" id="dly-done">
        <div class="grow"></div>
        <div class="dly-head"><span class="dly-star">${svg('star')}</span><h2>Klart för idag!</h2><p>${SH.praiseFor(pct)}</p></div>
        <div class="card dly-rc">
          <div class="dly-row"><span>Rätt på första försöket</span><b class="num">${rightTxt(correct, total)}</b></div>
          ${fylldes.length ? `<div class="dly-row col"><span>Fylldes på</span><div class="dly-chips">${fylldes.map(chipHTML).join('')}</div></div>` : ''}
          ${ovade.length ? `<div class="dly-row col"><span>${fylldes.length ? 'Övade också' : 'Övade'}</span><div class="dly-chips">${ovade.map(chipHTML).join('')}</div></div>` : ''}
          <div class="dly-row"><span>Dagar i rad</span><b class="num">${days}</b></div>
        </div>
        <div class="grow"></div>
        <button class="btn btn-primary btn-lg dly-go" id="dly-home" onclick="App.goBackToGameSelect()">Tillbaka till spelväljaren</button>
      </div>`;
  }

  const api = {
    heroContent, hasWork, startPass, markDone, streak, selection, labelHTML, chipHTML,
    _next: next,
    _confirmCancel: confirmCancel,
    /* Endast för tester */
    _test: { pickItems, heroText, filledItems, rightTxt, candidates, readFrozen, doneToday, validItem, MAX_ITEMS,
             setToday: d => { todayOverride = d || null; }, today },
  };
  return api;
})();

if (typeof window !== 'undefined') window.DailyTraining = DailyTraining;
if (typeof module !== 'undefined' && module.exports) module.exports = DailyTraining;
