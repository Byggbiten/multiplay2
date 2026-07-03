/* ============================================================
   MULTIPLAY – 10-Kompisar
   Övning + Test. Renderar i #friends-root.
   DESIGN.md: djup violett + solguld, vänskap & värme.
   ============================================================ */
'use strict';

const FriendsGame = (() => {

  /* ── Tillstånd ─────────────────────────────────────── */
  let profile    = null;
  let practiceN  = 5;   // Det lila talet (0–10)

  const LOG_KEY  = id => `friends_log_${id}`;

  /* ── Logg ──────────────────────────────────────────── */
  function sessionLog() {
    return MP.createLog(LOG_KEY(profile.id), 40);
  }

  function getLog() { return sessionLog().get(); }

  function addLog(entry) { sessionLog().add(entry); }

  // Resultatnivå → befintlig CSS-klass
  const RESULT_CLS = {
    excellent: 'result-excellent',
    good:      'result-good',
    ok:        'result-ok',
    practice:  'result-tryagain',
  };

  /* ══════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════ */
  function init(p) {
    profile   = p;
    practiceN = 5;
    renderPractice();
  }

  /* ══════════════════════════════════════════════════════
     ÖVNINGSLÄGE
  ══════════════════════════════════════════════════════ */
  function renderPractice() {
    const root = document.getElementById('friends-root');
    const companion = 10 - practiceN;

    root.innerHTML = `
      <div class="app-header" style="border-bottom-color:rgba(124,58,237,0.2)">
        <button class="btn-back" style="background:var(--friends-accent);color:var(--friends-primary)" onclick="App.goBackToGameSelect()">Tillbaka</button>
        <span class="header-title" style="color:var(--friends-primary)">🤝 10-Kompisar</span>
        <button class="btn btn-ghost btn-sm" style="border-color:var(--friends-primary);color:var(--friends-primary)" onclick="FriendsGame.showHistory()">📜 Historik</button>
      </div>

      <div style="padding:var(--space-4) var(--space-4) var(--space-8);display:flex;flex-direction:column;align-items:center;gap:var(--space-5)">

        <!-- Lila siffra (övre) -->
        <div style="
          width:clamp(70px,15vw,120px);height:clamp(70px,15vw,120px);
          border-radius:var(--radius-full);
          background:linear-gradient(135deg,var(--friends-primary),var(--color-primary));
          display:flex;align-items:center;justify-content:center;
          font-size:3.5rem;font-weight:900;color:white;
          box-shadow:0 6px 24px rgba(124,58,237,0.45);
          animation:bounce-in 0.5s var(--ease-bounce);
          cursor:default;
          user-select:none;
        " id="purple-number">${practiceN}</div>

        <!-- 10-RUTA -->
        <div style="
          padding:var(--space-4);
          background:rgba(255,255,255,0.85);
          border-radius:var(--radius-xl);
          border:2px solid var(--friends-accent);
          box-shadow:var(--shadow-md);
        ">
          ${drawTenGrid(practiceN)}
        </div>

        <!-- Gul siffra (nedre) -->
        <div style="
          width:clamp(70px,15vw,120px);height:clamp(70px,15vw,120px);
          border-radius:var(--radius-full);
          background:linear-gradient(135deg,var(--friends-secondary),#fde68a);
          display:flex;align-items:center;justify-content:center;
          font-size:3.5rem;font-weight:900;color:white;
          box-shadow:0 6px 24px rgba(234,179,8,0.45);
          animation:bounce-in 0.5s var(--ease-bounce);
          cursor:default;
          user-select:none;
        " id="yellow-number">${companion}</div>

        <!-- Ekvation -->
        <div style="
          font-family:var(--font-heading);
          font-size:var(--text-3xl);
          color:var(--friends-primary);
          text-align:center;
          animation:pop-in 0.4s var(--ease-bounce);
        ">
          ${practiceN} + ${companion} = <span style="color:var(--friends-secondary)">10</span>
        </div>

        <!-- Kontroller -->
        <div style="display:flex;gap:var(--space-3);align-items:center">
          <button class="btn" style="
            background:var(--friends-accent);color:var(--friends-primary);
            width:56px;height:56px;min-height:56px;padding:0;border-radius:var(--radius-full);
            font-size:var(--text-2xl);box-shadow:var(--shadow-sm);
          " onclick="FriendsGame.adjustN(-1)">▼</button>

          <button class="btn" style="
            background:white;color:var(--friends-primary);
            width:56px;height:56px;min-height:56px;padding:0;border-radius:var(--radius-full);
            font-size:var(--text-lg);border:2px solid var(--friends-accent);
          " onclick="FriendsGame.resetN()" title="Återställ">↺</button>

          <button class="btn" style="
            background:var(--friends-accent);color:var(--friends-primary);
            width:56px;height:56px;min-height:56px;padding:0;border-radius:var(--radius-full);
            font-size:var(--text-lg);border:2px solid var(--friends-accent);
          " onclick="FriendsGame.randomN()" title="Slumpa">🎲</button>

          <button class="btn" style="
            background:var(--friends-accent);color:var(--friends-primary);
            width:56px;height:56px;min-height:56px;padding:0;border-radius:var(--radius-full);
            font-size:var(--text-2xl);box-shadow:var(--shadow-sm);
          " onclick="FriendsGame.adjustN(1)">▲</button>
        </div>

        <!-- Alla kompisar -->
        <div class="card-glass w-full" style="padding:var(--space-4)">
          <div style="font-weight:800;color:var(--friends-primary);margin-bottom:var(--space-3)">Alla 10-kompisar 💛</div>
          <div style="display:flex;flex-direction:column;gap:var(--space-2)">
            ${[0,1,2,3,4,5].map(n => `
              <div style="
                display:flex;align-items:center;gap:var(--space-3);
                padding:var(--space-2) var(--space-4);
                border-radius:var(--radius-md);
                background:${practiceN===n?'linear-gradient(135deg,var(--friends-accent),#fef3c7)':'rgba(255,255,255,0.6)'};
                border:${practiceN===n?'2px solid var(--friends-primary)':'2px solid transparent'};
                cursor:pointer;
                transition:all 0.2s var(--ease-smooth);
              " onclick="FriendsGame.setN(${n})">
                <span style="font-weight:900;color:var(--friends-primary);min-width:40px;font-size:var(--text-lg)">${n}</span>
                <span style="color:var(--color-text-muted);font-weight:700">+</span>
                <span style="font-weight:900;color:var(--friends-secondary);min-width:40px;font-size:var(--text-lg)">${10-n}</span>
                <span style="color:var(--color-text-muted);font-weight:700">=</span>
                <span style="font-weight:900;color:var(--friends-primary);font-size:var(--text-lg)">10</span>
              </div>
            `).join('')}
            ${[6,7,8,9,10].map(n => `
              <div style="
                display:flex;align-items:center;gap:var(--space-3);
                padding:var(--space-2) var(--space-4);
                border-radius:var(--radius-md);
                background:${practiceN===n?'linear-gradient(135deg,var(--friends-accent),#fef3c7)':'rgba(255,255,255,0.6)'};
                border:${practiceN===n?'2px solid var(--friends-primary)':'2px solid transparent'};
                cursor:pointer;
                transition:all 0.2s var(--ease-smooth);
              " onclick="FriendsGame.setN(${n})">
                <span style="font-weight:900;color:var(--friends-primary);min-width:40px;font-size:var(--text-lg)">${n}</span>
                <span style="color:var(--color-text-muted);font-weight:700">+</span>
                <span style="font-weight:900;color:var(--friends-secondary);min-width:40px;font-size:var(--text-lg)">${10-n}</span>
                <span style="color:var(--color-text-muted);font-weight:700">=</span>
                <span style="font-weight:900;color:var(--friends-primary);font-size:var(--text-lg)">10</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Starta test -->
        <button class="btn btn-lg w-full" style="
          background:linear-gradient(135deg,var(--friends-primary),var(--color-primary));
          color:white;
          box-shadow:0 4px 20px rgba(124,58,237,0.4);
        " onclick="FriendsGame.startTest()">
          🚀 Starta test!
        </button>

      </div>
    `;
  }

  /* ── TenGrid ───────────────────────────────────────── */
  function drawTenGrid(n) {
    const companion = 10 - n;
    let cells = '';
    for (let i = 0; i < 10; i++) {
      let cls, label;
      if (i < n) {
        cls = 'ten-cell filled-purple';
        label = `${i+1}`;
      } else if (i < n + companion) {
        cls = 'ten-cell filled-yellow';
        label = `${i+1}`;
      } else {
        cls = 'ten-cell empty';
        label = '';
      }
      cells += `<div class="${cls}" style="width:clamp(32px,5vw,50px);height:clamp(32px,5vw,50px);" title="${label}"></div>`;
    }
    return `<div class="ten-grid" style="max-width:clamp(200px,45vw,380px);gap:var(--space-2)">${cells}</div>`;
  }

  /* ── Kontroller ────────────────────────────────────── */
  function adjustN(delta) {
    practiceN = Math.max(0, Math.min(10, practiceN + delta));
    App.Sound.play('click');
    renderPractice();
  }

  function setN(n) {
    practiceN = n;
    App.Sound.play('click');
    renderPractice();
  }

  function resetN() {
    practiceN = 0;
    App.Sound.play('click');
    renderPractice();
  }

  function randomN() {
    practiceN = Math.floor(Math.random() * 11);
    App.Sound.play('click');
    renderPractice();
  }

  /* ══════════════════════════════════════════════════════
     TESTLÄGE – 10 FRÅGOR
  ══════════════════════════════════════════════════════ */
  function startTest() {
    App.Sound.play('click');
    // Bygg frågor: 0–10 blandade
    const questions = MP.shuffle([0,1,2,3,4,5,6,7,8,9,10]).slice(0, 10);
    runTest(questions);
  }

  function runTest(questions) {
    const TOTAL = questions.length;
    const quiz = MP.createRetryQuiz(questions);
    const results = [];          // första försöket per fråga (avgör poängen)
    const firstTried = new Set();

    function render() {
      const n = quiz.current();
      if (n === null) { showTestResult(quiz.stats(), results); return; }

      const corr = 10 - n;

      const root = document.getElementById('friends-root');
      const prog = quiz.progress();
      const progress = prog.answered / TOTAL;

      root.innerHTML = `
      <div class="app-header">
        <button class="btn-back" style="background:var(--friends-accent);color:var(--friends-primary)" onclick="FriendsGame.renderPractice()">Avbryt</button>
        <span class="header-title" style="color:var(--friends-primary)">🤝 10-Kompisar Test</span>
        <div style="width:64px"></div>
      </div>
      <div style="padding:var(--space-4) var(--space-4) var(--space-2)">
        <div class="progress-label" style="color:var(--friends-primary)">
          <span>Fråga ${Math.min(prog.answered+1,TOTAL)} av ${TOTAL}</span>
        </div>
        <div class="progress-container" style="background:var(--friends-accent)">
          <div class="progress-fill" style="width:${Math.round(progress*100)}%;background:linear-gradient(90deg,var(--friends-primary),var(--color-primary))"></div>
        </div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--space-4) var(--space-4) var(--space-8);gap:var(--space-6)">

        <!-- Frågan -->
        <div style="text-align:center;animation:bounce-in 0.4s var(--ease-bounce)">
          <div style="font-size:var(--text-sm);font-weight:800;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:var(--space-3)">
            Vad är kompisen till...
          </div>
          <div style="
            width:110px;height:110px;
            border-radius:var(--radius-full);
            background:linear-gradient(135deg,var(--friends-primary),var(--color-primary));
            display:flex;align-items:center;justify-content:center;
            font-size:4rem;font-weight:900;color:white;
            box-shadow:0 6px 24px rgba(124,58,237,0.45);
            margin:0 auto;
          ">${n}</div>
          <div style="font-size:var(--text-xl);font-weight:800;color:var(--friends-primary);margin-top:var(--space-3)">
            ${n} + ? = 10
          </div>
        </div>

        <!-- 10-ruta som ledtråd -->
        <div style="
          padding:var(--space-3);
          background:rgba(255,255,255,0.8);
          border-radius:var(--radius-lg);
          border:2px solid var(--friends-accent);
        ">
          ${drawTenGrid(n)}
        </div>

        <!-- Svarsalternativ (4st) -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);width:100%">
          ${generateFriendsOptions(corr).map((opt, i) => `
            <button class="answer-option" id="fopt-${i}"
              style="
                border-color:rgba(124,58,237,0.3);
                font-size:var(--text-3xl);
                font-weight:900;
                color:var(--friends-primary);
                padding:var(--space-5);
              "
              onclick="FriendsGame._handleAnswer(${opt})">
              ${opt}
            </button>
          `).join('')}
        </div>

      </div>
    `;

      FriendsGame._handleAnswer = (chosen) => {
        const wasCorrect = chosen === corr;
        App.Sound.play(wasCorrect ? 'correct' : 'wrong');

        // Visuell feedback på knappar
        document.querySelectorAll('.answer-option').forEach(btn => {
          btn.disabled = true;
          const val = parseInt(btn.textContent.trim());
          if (val === corr) btn.classList.add('correct');
          else if (val === chosen && !wasCorrect) btn.classList.add('wrong');
        });

        // Flash
        const flash = document.createElement('div');
        flash.className = 'feedback-overlay';
        flash.innerHTML = `<div class="feedback-emoji">${wasCorrect ? '✅' : '❌'}</div>`;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 900);

        // Första försöket på denna fråga avgör poängen
        if (!firstTried.has(n)) {
          firstTried.add(n);
          results.push({ n, chosen, correct: wasCorrect });
        }
        quiz.answer(wasCorrect);

        setTimeout(render, wasCorrect ? 700 : 1400);
      };
    }

    render();
  }

  /* ── Generera svarsalternativ ─────────────────────── */
  function generateFriendsOptions(correct) {
    const opts = new Set([correct]);
    while (opts.size < 4) {
      const delta = Math.floor(Math.random() * 4) + 1;
      const sign  = Math.random() < 0.5 ? 1 : -1;
      const val   = Math.max(0, Math.min(10, correct + delta * sign));
      opts.add(val);
    }
    return [...opts].sort(() => Math.random() - 0.5);
  }

  /* ══════════════════════════════════════════════════════
     TESTRESULTAT
  ══════════════════════════════════════════════════════ */
  function showTestResult(stats, results) {
    // Första försöket per fråga avgör poängen
    const totalCorrect = stats.firstTryCorrect;
    const total        = stats.total;
    const pct          = stats.pct;

    App.Sound.play(pct >= 80 ? 'fanfare' : 'correct');
    if (pct === 100) App.Confetti.burst(80);

    addLog({ totalCorrect, total, pct, results });

    const { emoji, msg } = MP.feedbackMessage(pct);
    const cls = RESULT_CLS[MP.resultTier(pct)];

    const root = document.getElementById('friends-root');
    root.innerHTML = `
      <div class="app-header">
        <button class="btn-back" style="background:var(--friends-accent);color:var(--friends-primary)" onclick="FriendsGame.renderPractice()">Tillbaka</button>
        <span class="header-title" style="color:var(--friends-primary)">🏆 Resultat</span>
        <div style="width:64px"></div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;padding:var(--space-8) var(--space-4);gap:var(--space-6)">

        <div class="result-display ${cls} w-full">
          <div style="font-size:4rem;margin-bottom:var(--space-3);animation:sparkle 1.5s infinite">${emoji}</div>
          <div class="result-score">${totalCorrect} / ${total}</div>
          <div class="result-message">${msg}</div>
          <div class="result-sub">${pct}% rätt</div>
        </div>

        <!-- Detaljer per tal -->
        <div class="card w-full" style="padding:var(--space-4)">
          <div style="font-weight:800;color:var(--friends-primary);margin-bottom:var(--space-3)">Detaljresultat</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-2)">
            ${results.map(r => `
              <div style="
                text-align:center;padding:var(--space-2);
                border-radius:var(--radius-md);
                background:${r.correct?'linear-gradient(135deg,#dcfce7,#bbf7d0)':'linear-gradient(135deg,#fee2e2,#fecaca)'};
                border:2px solid ${r.correct?'var(--color-success-dark)':'var(--color-error-dark)'};
              ">
                <div style="font-weight:900;font-size:var(--text-base)">${r.n} + ${10 - r.n}</div>
                <div style="font-size:var(--text-xl)">${r.correct?'✓':'✗'}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:var(--space-3);width:100%">
          <button class="btn btn-lg w-full" style="
            background:linear-gradient(135deg,var(--friends-primary),var(--color-primary));
            color:white;box-shadow:0 4px 20px rgba(124,58,237,0.4);
          " onclick="FriendsGame.startTest()">
            🔄 Spela igen
          </button>
          <button class="btn btn-ghost w-full" style="border-color:var(--friends-primary);color:var(--friends-primary)" onclick="FriendsGame.renderPractice()">
            ↩ Tillbaka till övning
          </button>
        </div>

      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════
     HISTORIK
  ══════════════════════════════════════════════════════ */
  function showHistory() {
    const log = getLog();
    App.Sound.play('click');
    const root = document.getElementById('friends-root');

    if (log.length === 0) {
      root.innerHTML = `
        <div class="app-header">
          <button class="btn-back" style="background:var(--friends-accent);color:var(--friends-primary)" onclick="FriendsGame.renderPractice()">Tillbaka</button>
          <span class="header-title" style="color:var(--friends-primary)">📜 Historik</span>
          <div style="width:64px"></div>
        </div>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:var(--space-4);padding:var(--space-8)">
          <div style="font-size:4rem">📭</div>
          <p style="color:var(--color-text-muted);font-weight:700">Inga test gjorda ännu!</p>
          <button class="btn btn-lg w-full" style="background:linear-gradient(135deg,var(--friends-primary),var(--color-primary));color:white" onclick="FriendsGame.startTest()">
            Gör ett test nu! 🚀
          </button>
        </div>
      `;
      return;
    }

    root.innerHTML = `
      <div class="app-header">
        <button class="btn-back" style="background:var(--friends-accent);color:var(--friends-primary)" onclick="FriendsGame.renderPractice()">Tillbaka</button>
        <span class="header-title" style="color:var(--friends-primary)">📜 Historik</span>
        <div style="width:64px"></div>
      </div>
      <div style="padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-3)">
        ${log.map((e, i) => {
          const d = new Date(e.date);
          const dateStr = d.toLocaleDateString('sv-SE', { weekday:'short', day:'numeric', month:'short' });
          const timeStr = d.toLocaleTimeString('sv-SE', { hour:'2-digit', minute:'2-digit' });
          return `
            <div class="card" style="padding:var(--space-4)">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div>
                  <div style="font-weight:800">🤝 10-Kompisar ${i===0?'<span style="background:var(--friends-primary);color:white;font-size:10px;padding:2px 8px;border-radius:999px">NY!</span>':''}</div>
                  <div style="font-size:var(--text-xs);color:var(--color-text-muted)">${dateStr} kl. ${timeStr}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-size:var(--text-2xl);font-weight:900;color:${e.pct>=80?'var(--color-success)':e.pct>=60?'var(--color-accent)':'var(--color-error)'}">${e.totalCorrect}/10</div>
                  <div style="font-size:var(--text-xs);color:var(--color-text-muted)">${e.pct}%</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /* ── Publik API ────────────────────────────────────── */
  return {
    init,
    renderPractice,
    adjustN,
    setN,
    resetN,
    randomN,
    startTest,
    showHistory,
    _handleAnswer: null,
  };
})();
