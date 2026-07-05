/* ============================================================
   MULTIPLAY – Dagens träning (window.DailyTraining)
   Urvalsmotor + hero-innehåll + passtart (FAS 4 steg 1, v33).

   Läser mult_stats_<id> (per-tal-statistik från multiplication.js)
   och väljer dagens 3 tal: lägst träffprocent bland tal med ≥3
   försök ("svåra"); räcker inte de kompletteras med minst tränade
   talen. Urvalet seedas på (datum yyyy-mm-dd + profil-id) och
   fryses i daily_state_<id> → stabilt över dagen, nytt i morgon.

   Passet återanvänder Gångertabellens quiz-maskineri via
   MultGame.runFocusedSession (ingen duplicering av quiz-flödet).
   Avklarade pass loggas i daily_log_<id> ({date, tal, score,
   total}) → streak(profile) för framtida capybara-upplåsningar.
   ============================================================ */
'use strict';

const DailyTraining = (() => {

  /* ── Lagringsnycklar (rensas i Store.deleteProfile) ── */
  const LOG_KEY   = id => `daily_log_${id}`;
  const STATE_KEY = id => `daily_state_${id}`;

  const PASS_REPEATS = 2;   // varje tal frågas 2 ggr → 3 × 2 = 6 frågor
  const HARD_MIN_ATTEMPTS = 3; // ≥3 försök krävs för att räknas som "svårt"
  const PICK_COUNT = 3;

  /* ── Datum: lokal tid, dagsgräns = lokal midnatt ───── */
  function dayStr(d) {
    const dt = d ? new Date(d) : new Date();
    if (isNaN(dt)) return '';
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
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

  /* ── Läsare ────────────────────────────────────────── */
  function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (_) { return fallback; }
  }

  function readStats(profileId) {
    return readJSON(`mult_stats_${profileId}`, {});
  }

  function dailyLog(profileId) {
    return MP.createLog(LOG_KEY(profileId), 60);
  }

  function hasMultData(profileId) {
    const stats = readStats(profileId);
    return Object.keys(stats).some(k => stats[k] && stats[k].total > 0);
  }

  /* ══════════════════════════════════════════════════════
     URVALSMOTORN
  ══════════════════════════════════════════════════════ */
  function computeSelection(profileId, dateStr) {
    const stats = readStats(profileId);
    const rnd = mulberry32(hashSeed(`${dateStr}|${profileId}`));

    // Kandidater ur statistiken – sorterade nycklar först så att
    // jitter-tilldelningen (deterministisk tie-break) blir stabil.
    const entries = Object.keys(stats).sort().map(k => {
      const parts = k.split('x').map(Number);
      const s = stats[k];
      if (parts.length !== 2 || !Number.isInteger(parts[0]) || !Number.isInteger(parts[1])) return null;
      if (!s || !(s.total > 0)) return null;
      return { a: parts[0], b: parts[1], key: k, total: s.total, pct: s.correct / s.total, r: rnd() };
    }).filter(Boolean);

    if (entries.length === 0) return null;

    // 1) Svåra tal: ≥3 försök, lägst träffprocent först
    const hard = entries
      .filter(e => e.total >= HARD_MIN_ATTEMPTS)
      .sort((x, y) => (x.pct - y.pct) || (x.r - y.r));
    const picked = hard.slice(0, PICK_COUNT);

    // 2) Komplettera med minst tränade talen (lägst antal försök)
    if (picked.length < PICK_COUNT) {
      const chosen = new Set(picked.map(e => e.key));
      entries
        .filter(e => !chosen.has(e.key))
        .sort((x, y) => (x.total - y.total) || (x.pct - y.pct) || (x.r - y.r))
        .slice(0, PICK_COUNT - picked.length)
        .forEach(e => { picked.push(e); chosen.add(e.key); });

      // 3) Räcker inte statistiken: fyll på med otränade tal (2–9)
      if (picked.length < PICK_COUNT) {
        const pool = [];
        for (let a = 2; a <= 9; a++) {
          for (let b = 2; b <= 9; b++) {
            const key = `${a}x${b}`;
            if (!chosen.has(key) && !stats[key]) pool.push({ a, b, key });
          }
        }
        // Seedad Fisher-Yates
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(rnd() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        pool.slice(0, PICK_COUNT - picked.length).forEach(e => picked.push(e));
      }
    }

    return picked.slice(0, PICK_COUNT).map(e => ({ a: e.a, b: e.b }));
  }

  /* Dagens urval: beräknas en gång per dag och fryses i
     daily_state_<id> → stabilt även när statistiken ändras
     under dagen (t.ex. av själva passet). */
  function selection(profileId) {
    const today = dayStr();
    const st = readJSON(STATE_KEY(profileId), null);
    if (st && st.date === today && Array.isArray(st.tal) && st.tal.length === PICK_COUNT &&
        st.tal.every(t => t && Number.isInteger(t.a) && Number.isInteger(t.b))) {
      return st.tal;
    }
    const tal = computeSelection(profileId, today);
    if (!tal) return null;
    MP.safeSetItem(STATE_KEY(profileId), JSON.stringify({ date: today, tal }));
    return tal;
  }

  /* ── Klart-status & streak (ur daily_log) ──────────── */
  function doneToday(profileId) {
    return dailyLog(profileId).get().some(e => e && dayStr(e.date) === dayStr());
  }

  /* Antal dagar i rad med avklarat pass. Kedjan räknas från
     idag, eller från igår om dagens pass inte är gjort än. */
  function streak(profile) {
    if (!profile) return 0;
    const days = [...new Set(
      dailyLog(profile.id).get().map(e => e && dayStr(e.date)).filter(Boolean)
    )].sort().reverse();
    if (days.length === 0) return 0;

    // Kalenderbaserad dag-stegning (DST-säker, till skillnad från ±86400000 ms)
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    const yesterday = new Date(cursor);
    yesterday.setDate(yesterday.getDate() - 1);

    if (days[0] === dayStr(yesterday)) cursor.setDate(cursor.getDate() - 1);
    else if (days[0] !== dayStr(cursor)) return 0;

    let n = 0;
    for (const d of days) {
      if (d !== dayStr(cursor)) break;
      n++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return n;
  }

  /* ══════════════════════════════════════════════════════
     FALLBACK: ingen mult-data men andra spel spelade →
     föreslå modulen med lägst senaste-resultat.
     (Samma loggnycklar som app.js gameStatusChip.)
  ══════════════════════════════════════════════════════ */
  const FALLBACK_MODULES = [
    { id: 'clock',      namn: 'Klockan',                   keys: id => [`clock_log_${id}`] },
    { id: 'friends',    namn: '10-Kompisar',               keys: id => [`friends_log_${id}`] },
    { id: 'nationella', namn: 'Nationella Prov',           keys: id => [`np_svenska_log_${id}`] },
    { id: 'addsub',     namn: 'Addition & Subtraktion',    keys: id => [`uppstallning_log_${id}`, `platsvarde_log_${id}`] },
    { id: 'multdiv',    namn: 'Multiplikation & Division', keys: id => [`multdiv_log_${id}`] },
  ];

  function entryScore(e) {
    if (!e) return null;
    const correct = (typeof e.score === 'number') ? e.score
                  : (typeof e.totalCorrect === 'number') ? e.totalCorrect
                  : (typeof e.correct === 'number') ? e.correct : null;
    if (correct !== null && typeof e.total === 'number' && e.total > 0) {
      return { pct: Math.round((correct / e.total) * 100), text: `${correct}/${e.total}` };
    }
    if (typeof e.pct === 'number') return { pct: e.pct, text: `${e.pct} %` };
    return null;
  }

  function fallbackSuggestion(profileId) {
    const candidates = [];
    FALLBACK_MODULES.forEach(mod => {
      // Loggarna är nyast-först; vid flera nycklar tas färskaste posten
      const latest = mod.keys(profileId)
        .map(k => readJSON(k, [])[0])
        .filter(Boolean)
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];
      if (!latest) return;
      candidates.push({ mod, score: entryScore(latest), date: latest.date });
    });
    if (candidates.length === 0) return null;

    // Lägst senaste-resultat vinner; poster utan mätbart resultat sist
    candidates.sort((x, y) => {
      if (x.score && y.score) return x.score.pct - y.score.pct;
      if (x.score) return -1;
      if (y.score) return 1;
      return new Date(y.date || 0) - new Date(x.date || 0);
    });
    const best = candidates[0];
    return {
      modul:  best.mod.id,
      namn:   best.mod.namn,
      senast: best.score ? best.score.text : null,
      text:   `Dags att träna ${best.mod.namn}?${best.score ? ` Senast ${best.score.text}` : ''}`,
    };
  }

  /* ══════════════════════════════════════════════════════
     PUBLIKT API
  ══════════════════════════════════════════════════════ */

  /* Hero-innehåll för spelväljaren (anropas av App.renderHero
     bakom ≥2 test-gaten). Returnerar:
       { läge:'träna', tal:[{a,b}×3], text:'7·8 · 6·7 · 9·6' }
       { läge:'klart', streak }
       { läge:'fallback', modul, namn, senast, text }
       null → befintliga kom igång-kortet */
  function heroContent(profile) {
    if (!profile) return null;

    if (hasMultData(profile.id)) {
      const tal = selection(profile.id);
      if (tal) {
        if (doneToday(profile.id)) return { läge: 'klart', streak: streak(profile) };
        return { läge: 'träna', tal, text: tal.map(t => `${t.a}·${t.b}`).join(' · ') };
      }
    }

    const fb = fallbackSuggestion(profile.id);
    if (fb) return { läge: 'fallback', ...fb };
    return null;
  }

  /* Logga ett avklarat pass (extra pass samma dag loggas också
     men ändrar inte klart-statusen – den är redan satt). */
  function markDone(profile, stats, tal) {
    if (!profile) return;
    dailyLog(profile.id).add({
      tal:   (tal || []).map(t => `${t.a}x${t.b}`),
      score: stats.firstTryCorrect,
      total: stats.total,
    });
  }

  /* Starta dagens pass. Återanvänder Gångertabellens quiz-
     maskineri (flerval, retry-kö, first-try-poäng, ordinarie
     recordAnswer) via MultGame.runFocusedSession. Anroparen
     (App.startDailyTraining) har redan visat screen-multiplication. */
  function startPass(profile) {
    if (!profile || typeof MultGame === 'undefined' || !MultGame.runFocusedSession) return;
    const tal = selection(profile.id);
    if (!tal) { App.goBackToGameSelect(); return; }

    const questions = [];
    tal.forEach(t => {
      for (let i = 0; i < PASS_REPEATS; i++) questions.push({ table: t.a, mult: t.b });
    });

    MultGame.runFocusedSession(profile, MP.shuffle(questions), {
      headerTitle: 'Dagens träning',
      hint:        'Dagens träning 🎯',
      answerMode:  'choice',
      onCancel:    () => App.goBackToGameSelect(),
      onDone:      (stats) => {
        markDone(profile, stats, tal);
        showResult(stats);
      },
    });
  }

  /* Resultatvy-variant på befintlig result-hero (globala klasser
     i app.css – ingen modul-CSS behövs). */
  const RESULT_CLS = {
    excellent: 'result-excellent',
    good:      'result-good',
    ok:        'result-ok',
    practice:  'result-tryagain',
  };

  function showResult(stats) {
    const root = document.getElementById('mult-root');
    if (!root) return;
    const pct = stats.pct;
    App.Sound.play(pct >= 80 ? 'fanfare' : 'correct');
    if (pct === 100) App.Confetti.burst(80);

    const { emoji, msg } = MP.feedbackMessage(pct);
    const medal = MP.getMedal(pct);
    const cls = RESULT_CLS[MP.resultTier(pct)];

    root.innerHTML = `
      <div class="wrap vcenter">
        <div class="result-hero ${cls}">
          <div class="result-pct num">${pct}%</div>
          <div><span class="result-medal">${medal || emoji}</span></div>
          <p class="result-msg">${msg}</p>
          <p class="result-note num">${stats.firstTryCorrect} rätt av ${stats.total} · Dagens träning 🎯</p>
        </div>
        <div class="result-actions">
          <button class="btn btn-primary btn-lg" onclick="App.goBackToGameSelect()">
            Tillbaka till spelväljaren
          </button>
          <button class="btn btn-ghost btn-lg" onclick="DailyTraining.startPass(App.getCurrentProfile())">
            <svg class="icn"><use href="#i-refresh"/></svg>
            Kör igen
          </button>
        </div>
      </div>
    `;
  }

  return { heroContent, startPass, markDone, streak };
})();

if (typeof window !== 'undefined') window.DailyTraining = DailyTraining;
