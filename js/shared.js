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

  if (typeof window !== 'undefined') window.MP = MP;
  if (typeof module !== 'undefined' && module.exports) module.exports = MP;

})();
