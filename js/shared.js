/* ============================================================
   MULTIPLAY – Delad logik (window.MP)
   Ren, DOM-fri logik som delas av alla spelmoduler.
   Laddas FÖRE övriga moduler. Exporteras även som CJS för vitest.
   ============================================================ */
'use strict';

(function () {

  const MP = {};

  /* ── Retry-quiz (låst semantik, se RENOVERING.md) ──────
     Varje item ställs i ordning. FÖRSTA försöket avgör poängen.
     Fel svar → samma item igen tills rätt. Med opts.endReview
     läggs fel-items dessutom EN gång sist som repetition
     (påverkar varken poäng eller progress). Terminering garanterad:
     varje rätt svar flyttar tillståndet strikt framåt. */
  MP.createRetryQuiz = function (items, opts) {
    opts = opts || {};
    const endReview = !!opts.endReview;
    const total = items.length;
    let idx = 0;                  // position i huvudpasset
    let firstAttemptDone = false; // första försöket gjort på aktuellt item?
    let firstTryCorrect = 0;
    let answered = 0;             // unika items besvarade rätt (huvudpasset)
    let attempts = 0;
    const review = [];            // items besvarade fel – repeteras EN gång sist

    function inMain() { return idx < total; }

    function isDone() {
      if (inMain()) return false;
      return !endReview || review.length === 0;
    }

    function current() {
      if (inMain()) return items[idx];
      if (endReview && review.length > 0) return review[0];
      return null;
    }

    function answer(wasCorrect) {
      if (isDone()) return;
      attempts++;
      if (inMain()) {
        if (!firstAttemptDone) {
          firstAttemptDone = true;
          if (wasCorrect) firstTryCorrect++;
          else if (endReview) review.push(items[idx]);
        }
        if (wasCorrect) {
          answered++;
          idx++;
          firstAttemptDone = false;
        }
      } else if (wasCorrect) {
        review.shift();
      }
    }

    function progress() { return { answered, total }; }

    function stats() {
      const pct = total === 0 ? 0 : Math.min(100, Math.round((firstTryCorrect / total) * 100));
      return { total, firstTryCorrect, pct, attempts };
    }

    return { current, answer, isDone, progress, stats };
  };

  /* ── Fisher-Yates, returnerar NY array ─────────────── */
  MP.shuffle = function (arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };

  /* ── HTML-escaping (inkl enkelfnutt) ───────────────── */
  MP.escapeHtml = function (str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  /* ── Resultatnivå (samma trösklar som tidigare cls-ternaries) ── */
  MP.resultTier = function (pct) {
    if (pct >= 90) return 'excellent';
    if (pct >= 70) return 'good';
    if (pct >= 50) return 'ok';
    return 'practice';
  };

  /* ── Uppmuntrande feedback ─────────────────────────── */
  MP.feedbackMessage = function (pct) {
    if (pct === 100) return { emoji: '🌟', msg: 'PERFEKT! Du är en stjärna!' };
    if (pct >= 90)   return { emoji: '🥇', msg: 'Fantastiskt bra!' };
    if (pct >= 75)   return { emoji: '🥈', msg: 'Jättebra jobbat!' };
    if (pct >= 60)   return { emoji: '👍', msg: 'Bra försök! Fortsätt träna!' };
    return { emoji: '💪', msg: 'Fortsätt träna, det går bättre snart!' };
  };

  /* ── Medaljer: brons 75 / silver 85 / guld 95 ──────── */
  MP.getMedal = function (pct) {
    if (pct === null || pct === undefined) return '';
    if (pct >= 95) return '🥇';
    if (pct >= 85) return '🥈';
    if (pct >= 75) return '🥉';
    return '';
  };

  /* ── Sessionslogg i localStorage (cap + try/catch) ─── */
  MP.createLog = function (storageKey, maxEntries) {
    return {
      get() {
        try { return JSON.parse(localStorage.getItem(storageKey)) || []; }
        catch (_) { return []; }
      },
      add(entry) {
        const log = this.get();
        log.unshift({ ...entry, id: Date.now(), date: new Date().toISOString() });
        if (log.length > maxEntries) log.length = maxEntries;
        try { localStorage.setItem(storageKey, JSON.stringify(log)); return true; }
        catch (_) { return false; }
      }
    };
  };

  /* ── Svensk tidtext ("kvart i tre" osv) ────────────── */
  const HOUR_NAMES = ['tolv','ett','två','tre','fyra','fem','sex','sju','åtta','nio','tio','elva','tolv'];

  MP.timeToSwedish = function (h, m) {
    const h12 = (((h % 24) + 24) % 24) % 12;   // 0–11; 0 och 12 → "tolv"
    const nextH = h12 + 1;                     // 1–12
    if (m === 0)  return HOUR_NAMES[h12];
    if (m === 5)  return `fem över ${HOUR_NAMES[h12]}`;
    if (m === 10) return `tio över ${HOUR_NAMES[h12]}`;
    if (m === 15) return `kvart över ${HOUR_NAMES[h12]}`;
    if (m === 20) return `tjugo över ${HOUR_NAMES[h12]}`;
    if (m === 25) return `fem i halv ${HOUR_NAMES[nextH]}`;
    if (m === 30) return `halv ${HOUR_NAMES[nextH]}`;
    if (m === 35) return `fem över halv ${HOUR_NAMES[nextH]}`;
    if (m === 40) return `tjugo i ${HOUR_NAMES[nextH]}`;
    if (m === 45) return `kvart i ${HOUR_NAMES[nextH]}`;
    if (m === 50) return `tio i ${HOUR_NAMES[nextH]}`;
    if (m === 55) return `fem i ${HOUR_NAMES[nextH]}`;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  /* ── Säker localStorage-skrivning ──────────────────── */
  MP.safeSetItem = function (key, value) {
    try { localStorage.setItem(key, value); return true; }
    catch (_) { return false; }
  };

  /* ══════════════════════════════════════════════════════
     LÅDORNA OCH PÅFYLLNINGEN (v63: utbrutet ur multiplication.js,
     delas av Gångertabellen och Klockan). Rena funktioner.
     Ett tillstånd per uppgift:
       { box:'ny'|'ovar'|'kan', okDays, level, due, lastOk, relearn }
     okDays = antal olika lokala kalenderdagar med rätt svar sedan
     senaste fel; lastOk = senaste dag som räknats; due = YYYY-MM-DD.
  ══════════════════════════════════════════════════════ */
  MP.spaced = (function () {
    const BOXES = ['ny', 'ovar', 'kan'];
    const MEDALS = ['brons', 'silver', 'guld'];
    const INTERVALS = [1, 3, 7, 14, 30];               // dagar per level; efter level 5 fortsatt 30
    const intervalFor = level => INTERVALS[Math.min(Math.max(level, 1), INTERVALS.length) - 1];
    const pad2 = n => String(n).padStart(2, '0');
    const fmtDay = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    function addDays(day, n) { const [y, m, d] = day.split('-').map(Number); return fmtDay(new Date(y, m - 1, d + n)); }
    const fresh = () => ({ box:'ny', okDays:0, level:0, due:null, lastOk:null, relearn:false });

    /* Reglerna, tillämpade vid VARJE besvarad fråga:
       - Rätt: okDays ökar bara om dagens datum inte redan räknats för uppgiften.
       - ny + rätt → övar.
       - övar + rätt → kan när okDays ≥ 3 (≥ 2 efter att uppgiften fallit från kan). level 1, due = idag + 1.
       - kan + rätt när idag ≥ due → level + 1, due = idag + intervall (1, 3, 7, 14, 30, sedan 30). Före due: inget.
       - kan + fel → övar, okDays 0 (sedan räcker 2 dagar för kan igen, med level 1).
       - övar + fel → övar, okDays 0.   ny + fel → ny. */
    function applyAnswer(st, correct, day) {
      if (correct) {
        if (st.lastOk !== day) { st.okDays++; st.lastOk = day; }
        if (st.box === 'ny') st.box = 'ovar';
        else if (st.box === 'ovar') {
          if (st.okDays >= (st.relearn ? 2 : 3)) {
            st.box = 'kan'; st.level = 1; st.due = addDays(day, intervalFor(1)); st.relearn = false;
          }
        } else if (st.box === 'kan' && (!st.due || day >= st.due)) {
          st.level = (st.level || 1) + 1; st.due = addDays(day, intervalFor(st.level));
        }
      } else if (st.box === 'kan') {
        st.box = 'ovar'; st.okDays = 0; st.lastOk = null; st.relearn = true; st.level = 0; st.due = null;
      } else if (st.box === 'ovar') {
        st.okDays = 0; st.lastOk = null;
      }
      return st;
    }

    /* Hur uppgiften ser ut: ett kan-tillstånd vars due passerats är "Dags igen" (bleknat grönt). */
    const vis = (st, day) => (st.box === 'kan' && st.due && day >= st.due) ? 'due' : st.box;

    /* Medaljen för en grupp uppgifter (en tabell, ett klocksteg), byggd på lådorna –
       aldrig på andelen rätt. views = varje uppgifts vis-värde ('ny'|'ovar'|'kan'|'due').
       "Dags igen" räknas som Kan.
         ingen:  någon uppgift är fortfarande ny
         brons:  alla uppgifter har övats (ingen är ny)
         silver: minst hälften är Kan
         guld:   alla är Kan
       due = antal "Dags igen" → medaljen får en blek prick (fyll på). */
    function medal(views) {
      const total = views.length;
      let kan = 0, ny = 0, due = 0;
      for (const v of views) {
        if (v === 'kan' || v === 'due') kan++;
        if (v === 'due') due++;
        if (v === 'ny') ny++;
      }
      const m = ny > 0 ? null : kan === total ? 'guld' : kan * 2 >= total ? 'silver' : 'brons';
      return { medal:m, kan, total, due, share:total ? kan / total : 0 };
    }

    return { BOXES, MEDALS, INTERVALS, intervalFor, fmtDay, addDays, fresh, applyAnswer, vis, medal };
  })();

  /* ── NÖTLOOPEN i ett varv (v63: utbruten ur multiplication.js) ──
     - Varje fråga ställs en gång.
     - Fel svar: samma fråga direkt igen (retry), om och om tills den blir rätt.
     - Första felet på en fråga lägger in den EN gång till, på en slumpad plats
       minst två frågor bort (två andra frågor emellan). Är varvet nästan slut
       läggs den sist. Extratillfället får aldrig ett eget extratillfälle.
     - answer() säger om svaret ska räknas (record): bara första försöket på
       varje ställd fråga, inklusive extratillfället – aldrig upprepningarna.
     items: valfria objekt; varje post i kön är en kopia med id och extra. */
  MP.createDrill = function (items, r) {
    r = r || Math.random;
    const q = items.map((it, i) => ({ ...it, id:i, extra:false }));
    const hasExtra = new Set();
    let idx = 0, retry = false;
    const st = { asked:0, firstOk:0, wrongFirst:0, attempts:0 };
    return {
      current(){ return idx < q.length ? { ...q[idx], retry } : null; },
      answer(ok){
        if (idx >= q.length) return null;
        const slot = q[idx], record = !retry;
        let insertedAt = null;
        st.attempts++;
        if (record){ st.asked++; if (ok) st.firstOk++; else st.wrongFirst++; }
        if (ok){ idx++; retry = false; }
        else {
          retry = true;
          if (!slot.extra && !hasExtra.has(slot.id)){
            hasExtra.add(slot.id);
            const lo = idx + 3, hi = q.length;            // insättningsindex: två andra frågor emellan
            insertedAt = lo >= hi ? hi : lo + Math.floor(r() * (hi - lo + 1));
            q.splice(insertedAt, 0, { ...slot, extra:true });
          }
        }
        return { record, ok:!!ok, insertedAt };
      },
      isDone(){ return idx >= q.length; },
      progress(){ return { done:idx, total:q.length }; },
      stats(){ return { ...st }; },
      queue(){ return q.map(x => ({ ...x })); },
    };
  };

  /* ── Kvittot efter ett övningspass (v63: utbrutet ur multiplication.js) ──
     results = varvens resultat [{ type, asked, firstOk, wrongFirst }] */
  MP.receiptFor = function (results, ms) {
    const correct = results.reduce((s, x) => s + x.firstOk, 0);
    const total   = results.reduce((s, x) => s + x.asked, 0);
    const fixed   = results.reduce((s, x) => s + x.wrongFirst, 0);
    return { correct, total, pct:total ? Math.round(100 * correct / total) : 0, fixed, secs:Math.max(0, Math.round((ms || 0) / 1000)), rounds:results.map(x => x.type) };
  };
  MP.durTxt = function (secs) {
    if (secs < 60) return `${secs} s`;
    const m = Math.floor(secs / 60), s = secs % 60;
    return s ? `${m} min ${s} s` : `${m} min`;
  };
  /* Beröm som varierar med resultatet men aldrig är negativt */
  MP.praiseFor = function (pct) {
    if (pct >= 100) return 'Varje svar satt på första försöket.';
    if (pct >= 85)  return 'Starkt jobbat! Nästan allt satt direkt.';
    if (pct >= 60)  return 'Bra nött! Du rättade varje fel.';
    return 'Du nötte dig igenom hela passet. Varje fel blev rätt till slut.';
  };
  /* Kvittots datum ("onsdag 23 september kl. 18:05") och stämpelns ("23 sep. 18:05") */
  MP.fmtWhen = function (iso) { const d = new Date(iso); return `${d.toLocaleDateString('sv-SE', { weekday:'long', day:'numeric', month:'long' })} kl. ${d.toLocaleTimeString('sv-SE', { hour:'2-digit', minute:'2-digit' })}`; };
  MP.fmtStamp = function (iso) { const d = new Date(iso); return `${d.toLocaleDateString('sv-SE', { day:'numeric', month:'short' })} ${d.toLocaleTimeString('sv-SE', { hour:'2-digit', minute:'2-digit' })}`; };

  /* ── Medaljen som SVG (band + medalj + stjärna; färgen skiljer) ──
     kind: 'guld'|'silver'|'brons'|null (null = streckad ring: ingen medalj än).
     band: bandets två färger (standard: Gångertabellens lila). */
  const MEDAL_COL = {
    guld:   { f:'#fcd34d', s:'#d97706', st:'#fffbeb' },
    silver: { f:'#e2e8f0', s:'#64748b', st:'#ffffff' },
    brons:  { f:'#c2733a', s:'#6b2f0c', st:'#f1c29a' },
  };
  MP.medalSVG = function (kind, band) {
    const b = band || { l:'#a78bfa', r:'#7c3aed', ring:'rgba(76,29,149,.3)' };
    if (!kind) return `<svg class="md" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="14.3" r="7" fill="none" stroke="${b.ring}" stroke-width="1.6" stroke-dasharray="2.4 2.4"/></svg>`;
    const c = MEDAL_COL[kind];
    return `<svg class="md md-${kind}" viewBox="0 0 24 24" aria-hidden="true">` +
      `<path d="M6 1h4.2l2.9 6.4H8.9z" fill="${b.l}"/><path d="M18 1h-4.2l-2.9 6.4h4.2z" fill="${b.r}"/>` +
      `<circle cx="12" cy="14.3" r="7.6" fill="${c.f}" stroke="${c.s}" stroke-width="1.5"/>` +
      `<circle cx="12" cy="14.3" r="5.4" fill="none" stroke="${c.s}" stroke-width=".8" opacity=".4"/>` +
      `<path d="M12 10.4l1.15 2.35 2.6.38-1.88 1.83.44 2.58L12 16.32l-2.31 1.22.44-2.58-1.88-1.83 2.6-.38z" fill="${c.st}" stroke="${c.s}" stroke-width=".7" stroke-linejoin="round"/>` +
      '</svg>';
  };

  /* ── Håll inne-knappen ("Sett av en vuxen") ──
     el: knappen. opts: { ms, canStart():bool, onDone() }. Returnerar { reset, cancel }.
     Håll inne i ms millisekunder (pekare eller mellanslag/Enter); släpps den före är inget gjort. */
  MP.bindHold = function (el, opts) {
    const ms = opts.ms || 1500;
    let t = null;
    function start(ev) {
      if (el.disabled || (opts.canStart && !opts.canStart())) return;
      if (ev && ev.cancelable) ev.preventDefault();
      clearTimeout(t);
      el.classList.remove('holding'); void el.offsetWidth; el.classList.add('holding');
      t = setTimeout(() => { t = null; el.classList.remove('holding'); opts.onDone(); }, ms);
    }
    function end() {
      if (!t) return;
      clearTimeout(t); t = null;
      el.classList.remove('holding');
    }
    el.addEventListener('pointerdown', start);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => el.addEventListener(ev, end));
    el.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat){ e.preventDefault(); start(); } });
    el.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') end(); });
    el.addEventListener('contextmenu', e => e.preventDefault());
    return { cancel:end };
  };

  if (typeof window !== 'undefined') window.MP = MP;
  if (typeof module !== 'undefined' && module.exports) module.exports = MP;

})();
