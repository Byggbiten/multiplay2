/* ============================================================
   MULTIPLAY – Huvud-applikation
   Hanterar: routing, profiler, navigering, ljud, konfetti
   ============================================================ */
'use strict';

/* ── App-version (matchar CACHE_VERSION i sw.js) ────── */
const APP_VERSION = 'v29';

/* ── Avatarer ─────────────────────────────────────────── */
const AVATARS = ['🤖', '⭐', '🐉', '🦊', '🧙', '🧠', '👧', '👽'];

/* ── Ljud (Web Audio API) ─────────────────────────────── */
const Sound = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window['webkitAudioContext'])();
    return ctx;
  }

  function play(type) {
    try {
      const ac = getCtx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);

      if (type === 'correct') {
        osc.frequency.setValueAtTime(523, ac.currentTime);        // C5
        osc.frequency.setValueAtTime(659, ac.currentTime + 0.1);  // E5
        osc.frequency.setValueAtTime(784, ac.currentTime + 0.2);  // G5
        gain.gain.setValueAtTime(0.3, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + 0.5);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ac.currentTime);
        osc.frequency.setValueAtTime(200, ac.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + 0.4);
      } else if (type === 'fanfare') {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
          const o = ac.createOscillator();
          const g = ac.createGain();
          o.connect(g); g.connect(ac.destination);
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.25, ac.currentTime + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.12 + 0.4);
          o.start(ac.currentTime + i * 0.12);
          o.stop(ac.currentTime + i * 0.12 + 0.4);
        });
      } else if (type === 'click') {
        osc.frequency.setValueAtTime(800, ac.currentTime);
        gain.gain.setValueAtTime(0.1, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + 0.08);
      }
    } catch (_) { /* silent fallback */ }
  }

  return { play };
})();

/* ── Konfetti ─────────────────────────────────────────── */
const Confetti = (() => {
  const COLORS = ['#c084fc','#f472b6','#fb923c','#fbbf24','#4ade80','#60a5fa','#f87171'];
  const SHAPES = ['●','★','♥','✿','◆','🦄','🌈','🎉','🎊','💖','🦋','🍭','⭐','💫','✨','🌸','🐱','🐶','🦊','🎀','👑'];

  function burst(count = 180) {
    const container = document.getElementById('confetti-container');
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'confetti-piece';
      el.textContent = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      el.style.cssText = `
        left: ${Math.random() * 100}%;
        color: ${COLORS[Math.floor(Math.random() * COLORS.length)]};
        font-size: ${10 + Math.random() * 24}px;
        animation-duration: ${2 + Math.random() * 3}s;
        animation-delay: ${Math.random() * 0.5}s;
      `;
      container.appendChild(el);
    }
    setTimeout(() => { container.innerHTML = ''; }, 5000);
  }

  return { burst };
})();

/* ── Bakgrundsstjärnor ────────────────────────────────── */
function initBgStars() {
  const container = document.getElementById('bg-stars');
  if (!container) return;
  const stars = ['✨','🌟','⭐','💫','🌸','💕'];
  for (let i = 0; i < 12; i++) {
    const el = document.createElement('div');
    el.className = 'bg-decoration';
    el.textContent = stars[Math.floor(Math.random() * stars.length)];
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      top:  ${Math.random() * 100}%;
      font-size: ${0.8 + Math.random() * 1.5}rem;
      animation-duration: ${4 + Math.random() * 6}s;
      animation-delay: ${Math.random() * 4}s;
    `;
    container.appendChild(el);
  }
}

/* ── LocalStorage-hjälp ───────────────────────────────── */
const Store = {
  KEY: 'multiplay_profiles',

  load() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch (_) { return []; }
  },

  save(profiles) {
    MP.safeSetItem(this.KEY, JSON.stringify(profiles));
  },

  getProfiles() { return this.load(); },

  addProfile(name, avatar) {
    const profiles = this.load();
    const profile = {
      id: Date.now().toString(),
      name,
      avatar,
      created: new Date().toISOString(),
      stats: {}
    };
    profiles.push(profile);
    this.save(profiles);
    return profile;
  },

  deleteProfile(id) {
    const profiles = this.load().filter(p => p.id !== id);
    this.save(profiles);
    // Rensa även profilens speldata (ALLA moduler som sparar per profil-id)
    [
      `mult_stats_${id}`,               // multiplication.js
      `mult_log_${id}`,                 // multiplication.js
      `clock_log_${id}`,                // clock.js
      `friends_log_${id}`,              // tenfriends.js
      `uppstallning_log_${id}`,         // uppstallning.js
      `platsvarde_log_${id}`,           // platsvarde.js
      `multdiv_log_${id}`,              // multdiv.js
      `np_svenska_log_${id}`,           // np-svenska.js
      `np_matte_muntligt_stats_${id}`,  // np-matte-muntligt.js
      `np_matte_skriftlig_stats_${id}`, // np-matte-skriftlig.js
    ].forEach(key => {
      try { localStorage.removeItem(key); } catch (_) { /* ignorera */ }
    });
  },

  getProfile(id) {
    return this.load().find(p => p.id === id) || null;
  },

  updateProfile(id, updates) {
    const profiles = this.load();
    const idx = profiles.findIndex(p => p.id === id);
    if (idx !== -1) {
      profiles[idx] = { ...profiles[idx], ...updates };
      this.save(profiles);
    }
  }
};

/* ── Routing / Screen-hantering ───────────────────────── */
const Router = (() => {
  let current = 'screen-home';

  function show(screenId) {
    // Göm alla skärmar
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active');
    });

    // Visa den valda
    const target = document.getElementById(screenId);
    if (!target) { console.warn('Screen not found:', screenId); return; }
    target.classList.add('active');
    current = screenId;

    // Scrolla till toppen
    target.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function getCurrent() { return current; }

  return { show, getCurrent };
})();

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HUVUD-APP-OBJEKT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const App = (() => {
  let currentProfile = null;
  let selectedAvatar = AVATARS[0];

  /* ── Init ─────────────────────────────────────────── */
  function init() {
    initBgStars();
    renderAvatarPicker();
    renderProfiles();
    setupKeyboardNav();
    showHome();
  }

  /* ── Avatarväljare ────────────────────────────────── */
  function renderAvatarPicker() {
    const picker = document.getElementById('avatar-picker');
    if (!picker) return;
    picker.innerHTML = AVATARS.map((emoji, i) => `
      <button
        class="avatar-option${i === 0 ? ' selected' : ''}"
        onclick="App.selectAvatar('${emoji}', this)"
        type="button"
        title="${emoji}"
        aria-label="Avatar ${emoji}"
      >${emoji}</button>
    `).join('');
  }

  function selectAvatar(emoji, el) {
    selectedAvatar = emoji;
    document.querySelectorAll('.avatar-option').forEach(btn => btn.classList.remove('selected'));
    el.classList.add('selected');
    Sound.play('click');
  }

  /* ── Loggläsning (statuschips + Dagens träning-villkor) ── */
  /* Loggnycklar per modul – samma nycklar som Store.deleteProfile rensar */
  const GAME_LOG_KEYS = {
    multiplication: id => [`mult_log_${id}`],
    clock:          id => [`clock_log_${id}`],
    friends:        id => [`friends_log_${id}`],
    nationella:     id => [`np_svenska_log_${id}`],
    addsub:         id => [`uppstallning_log_${id}`, `platsvarde_log_${id}`],
    multdiv:        id => [`multdiv_log_${id}`],
  };

  function readLog(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch (_) { return []; }
  }

  function allLogs(profileId) {
    return Object.values(GAME_LOG_KEYS)
      .flatMap(fn => fn(profileId))
      .map(readLog);
  }

  function countTotalTests(profileId) {
    return allLogs(profileId).reduce((sum, log) => sum + log.length, 0);
  }

  /* Dagens träning visas först när profilen har ≥2 spelade test totalt.
     (Själva innehållet i Dagens träning byggs i Fas 4.) */
  function shouldShowDailyTraining(profile) {
    const p = profile || currentProfile;
    if (!p) return false;
    return countTotalTests(p.id) >= 2;
  }

  /* Procent ur en loggpost oavsett modulens fältnamn */
  function entryPct(e) {
    if (!e) return null;
    if (typeof e.pct === 'number') return e.pct;
    const correct = (typeof e.score === 'number') ? e.score
                  : (typeof e.totalCorrect === 'number') ? e.totalCorrect
                  : (typeof e.correct === 'number') ? e.correct : null;
    if (correct !== null && typeof e.total === 'number' && e.total > 0) {
      return Math.round((correct / e.total) * 100);
    }
    return null;
  }

  /* Statuschip-text för ett spelkort: senaste resultat eller "Ny! ✨".
     Loggarna är nyast-först (unshift), så [0] är senaste posten. */
  function gameStatusChip(game, profile) {
    const p = profile || currentProfile;
    const keyFn = GAME_LOG_KEYS[game];
    if (!p || !keyFn) return 'Ny! ✨';

    const logs = keyFn(p.id).map(readLog).filter(l => l.length > 0);
    if (logs.length === 0) return 'Ny! ✨';

    // Vid flera loggar (addsub): ta den färskaste av loggarnas senaste poster
    const latest = logs
      .map(l => l[0])
      .sort((a, b) => new Date(b && b.date || 0) - new Date(a && a.date || 0))[0];

    const pct = entryPct(latest);
    if (pct === null) {
      const count = logs.reduce((sum, l) => sum + l.length, 0);
      return `🎯 ${count} spelade`;
    }
    const medal = MP.getMedal(pct);
    return `${medal || '⭐'} Senast ${pct} %`;
  }

  /* "Spelade idag/igår/i förrgår/3 jun" */
  function lastPlayedText(profileId) {
    const dates = allLogs(profileId)
      .flatMap(log => log.map(e => e && e.date).filter(Boolean))
      .map(d => new Date(d))
      .filter(d => !isNaN(d));
    if (dates.length === 0) return null;
    const last = new Date(Math.max(...dates));
    const days = Math.floor((new Date().setHours(0,0,0,0) - new Date(last).setHours(0,0,0,0)) / 86400000);
    if (days <= 0) return 'Spelade idag';
    if (days === 1) return 'Spelade igår';
    if (days === 2) return 'Spelade i förrgår';
    return 'Spelade ' + last.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
  }

  /* Medaljräkning över alla loggar (🥉 vid ≥75 %) */
  function countMedals(profileId) {
    return allLogs(profileId)
      .flatMap(log => log)
      .filter(e => { const pct = entryPct(e); return pct !== null && pct >= 75; })
      .length;
  }

  function profileMetaText(p) {
    const medals = countMedals(p.id);
    const played = lastPlayedText(p.id);
    if (!played) return 'Ny spelare ✨';
    return `🥇 ${medals} medalj${medals === 1 ? '' : 'er'} · ${played}`;
  }

  /* ── Profilrendering ──────────────────────────────── */
  function renderProfiles() {
    const list = document.getElementById('profiles-list');
    const noMsg = document.getElementById('no-profiles-msg');
    const profiles = Store.getProfiles();

    if (profiles.length === 0) {
      list.innerHTML = '';
      noMsg.classList.remove('hidden');
      document.getElementById('btn-show-delete').classList.add('hidden');
      return;
    }

    noMsg.classList.add('hidden');
    document.getElementById('btn-show-delete').classList.remove('hidden');

    list.innerHTML = profiles.map(p => `
      <div class="profile-card animate-pop-in" onclick="App.selectProfile('${p.id}')">
        <div class="avatar avatar-md">${p.avatar}</div>
        <div style="flex:1;min-width:0">
          <div class="profile-name">${escapeHtml(p.name)}</div>
          <div class="profile-meta">${escapeHtml(profileMetaText(p))}</div>
        </div>
        <div class="profile-actions" onclick="event.stopPropagation()">
          <button class="btn-delete-profile" onclick="App.confirmDeleteProfile('${p.id}')" title="Ta bort profil" aria-label="Ta bort ${escapeHtml(p.name)}">
            <svg class="icn"><use href="#i-trash"/></svg>
          </button>
        </div>
        <svg class="icn chev" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
      </div>
    `).join('');
  }

  /* ── Navigation ───────────────────────────────────── */
  function showHome() {
    currentProfile = null;
    renderProfiles();
    Router.show('screen-home');
  }

  function showCreateProfile() {
    document.getElementById('profile-name-input').value = '';
    selectedAvatar = AVATARS[0];
    renderAvatarPicker();
    Router.show('screen-create-profile');
    setTimeout(() => document.getElementById('profile-name-input').focus(), 400);
  }

  function createProfile() {
    const nameEl = document.getElementById('profile-name-input');
    const name = nameEl.value.trim();

    if (!name) {
      nameEl.classList.add('animate-shake');
      nameEl.focus();
      setTimeout(() => nameEl.classList.remove('animate-shake'), 600);
      return;
    }

    const profile = Store.addProfile(name, selectedAvatar);
    currentProfile = profile;
    Sound.play('fanfare');
    Confetti.burst(50);
    showGameSelect();
  }

  function selectProfile(id) {
    currentProfile = Store.getProfile(id);
    if (!currentProfile) return;
    Sound.play('click');
    showGameSelect();
  }

  function showGameSelect() {
    if (!currentProfile) { showHome(); return; }

    document.getElementById('banner-avatar').textContent = currentProfile.avatar;
    document.getElementById('banner-name').textContent   = currentProfile.name;
    const helloName = document.getElementById('hello-name');
    if (helloName) helloName.textContent = currentProfile.name;

    renderHero();
    renderGameStatus();
    Router.show('screen-game-select');
  }

  /* Hero-slot i spelväljaren.
     Villkor <2 test  → "kom igång"-kort som pekar mot spelen.
     Villkor ≥2 test  → Dagens träning-slot; innehållet (adaptiv motor)
     är Fas 4, så TILLS VIDARE visas kom igång-kortet med anpassad text. */
  function renderHero() {
    const hero = document.getElementById('daily-hero');
    if (!hero || !currentProfile) return;

    if (shouldShowDailyTraining(currentProfile)) {
      hero.innerHTML = `
        <div class="hero-inner">
          <span class="hero-emoji">🎯</span>
          <div>
            <span class="hero-badge">✨ Smart träning</span>
            <h2>Dagens träning</h2>
            <p>Byggs just nu – snart tränar du på precis det du behöver! 🛠️</p>
            <small>Fortsätt spela så länge – varje test gör din träning smartare 💜</small>
          </div>
        </div>`;
    } else {
      hero.innerHTML = `
        <div class="hero-inner">
          <span class="hero-emoji">🚀</span>
          <div>
            <span class="hero-badge">✨ Kom igång</span>
            <h2>Kom igång!</h2>
            <p>Välj ett spel här nedanför och kör dina två första test 🌟</p>
            <small>Sen låser du upp Dagens träning – smart träning på just dina tal</small>
          </div>
        </div>`;
    }
  }

  /* Fyll spelkortens statuschips (senaste resultat eller "Ny! ✨") */
  function renderGameStatus() {
    document.querySelectorAll('[data-game-status]').forEach(el => {
      el.textContent = gameStatusChip(el.dataset.gameStatus, currentProfile);
    });
  }

  function startGame(game) {
    if (!currentProfile) { showHome(); return; }
    Sound.play('click');

    // Stoppa ev. löpande Mult-timer vid spelbyte (gäller ALLA spel i routingen)
    if (typeof MultGame !== 'undefined' && MultGame.stopTimer) MultGame.stopTimer();

    const screenMap = {
      multiplication: 'screen-multiplication',
      clock:          'screen-clock',
      friends:        'screen-friends',
      nationella:     'screen-nationella-select',
      addsub:         'screen-addsub',
      multdiv:        'screen-multdiv',
    };

    const screen = screenMap[game];
    if (!screen) return;
    Router.show(screen);

    // Initiera respektive modul
    if (game === 'multiplication' && typeof MultGame !== 'undefined') {
      MultGame.init(currentProfile);
    } else if (game === 'clock' && typeof ClockGame !== 'undefined') {
      ClockGame.init(currentProfile);
    } else if (game === 'friends' && typeof FriendsGame !== 'undefined') {
      FriendsGame.init(currentProfile);
    } else if (game === 'nationella' && typeof NationellaHub !== 'undefined') {
      NationellaHub.init(currentProfile);
    } else if (game === 'addsub' && typeof PlatsvardeGame !== 'undefined') {
      PlatsvardeGame.init(currentProfile);
    } else if (game === 'multdiv' && typeof MultDivGame !== 'undefined') {
      MultDivGame.init(currentProfile);
    }
  }

  function goBackToGameSelect() {
    // Stoppa ev. löpande Mult-timer när spelet lämnas
    if (typeof MultGame !== 'undefined' && MultGame.stopTimer) MultGame.stopTimer();
    showGameSelect();
  }

  /* ── Ta bort profiler ─────────────────────────────── */
  function showDeleteProfiles() {
    const profiles = Store.getProfiles();
    const list = document.getElementById('delete-profiles-list');
    list.innerHTML = profiles.map(p => `
      <div class="delete-profile-row">
        <div class="avatar avatar-sm">${p.avatar}</div>
        <div class="delete-name">${escapeHtml(p.name)}</div>
        <button class="btn btn-danger btn-sm" onclick="App.confirmDeleteProfile('${p.id}')">
          <svg class="icn"><use href="#i-trash"/></svg> Ta bort
        </button>
      </div>
    `).join('');
    document.getElementById('modal-delete-profiles').classList.remove('hidden');
  }

  function hideDeleteProfiles() {
    document.getElementById('modal-delete-profiles').classList.add('hidden');
  }

  function confirmDeleteProfile(id) {
    const profile = Store.getProfile(id);
    if (!profile) return;
    hideDeleteProfiles();
    document.getElementById('confirm-delete-msg').textContent =
      `Vill du ta bort profilen "${profile.name}"? All data raderas permanent!`;
    document.getElementById('btn-confirm-delete-yes').onclick = () => {
      Store.deleteProfile(id);
      hideConfirmDelete();
      renderProfiles();
    };
    document.getElementById('modal-confirm-delete').classList.remove('hidden');
  }

  function hideConfirmDelete() {
    document.getElementById('modal-confirm-delete').classList.add('hidden');
  }

  /* ── Tangentbordsnavigation ───────────────────────── */
  function setupKeyboardNav() {
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        hideDeleteProfiles();
        hideConfirmDelete();
      }
      if (e.key === 'Enter') {
        const screen = Router.getCurrent();
        if (screen === 'screen-create-profile') createProfile();
      }
    });

    // Klick utanför modal stänger
    ['modal-delete-profiles','modal-confirm-delete'].forEach(id => {
      document.getElementById(id).addEventListener('click', function(e) {
        if (e.target === this) {
          this.classList.add('hidden');
        }
      });
    });
  }

  /* ── Hjälpfunktioner ──────────────────────────────── */
  function getCurrentProfile() { return currentProfile; }

  function escapeHtml(str) {
    return MP.escapeHtml(str);
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('sv-SE', { day:'numeric', month:'short', year:'numeric' });
    } catch(_) { return ''; }
  }

  /* ── Publik API ───────────────────────────────────── */
  return {
    init,
    showHome,
    showCreateProfile,
    createProfile,
    selectProfile,
    selectAvatar,
    showGameSelect,
    startGame,
    goBackToGameSelect,
    showDeleteProfiles,
    hideDeleteProfiles,
    confirmDeleteProfile,
    hideConfirmDelete,
    getCurrentProfile,
    shouldShowDailyTraining,
    gameStatusChip,
    // Hjälpfunktioner tillgängliga för moduler
    Sound,
    Confetti,
    Store,
    escapeHtml,
  };
})();

/* ── PWA-uppdatering ──────────────────────────────────── */
function checkForUpdate() {
  if (!('serviceWorker' in navigator)) {
    showUpdateToast('Service Worker stöds inte i den här webbläsaren.', 3000);
    return;
  }

  navigator.serviceWorker.getRegistration().then(reg => {
    if (!reg) {
      showUpdateToast('Du kör senaste versionen ✅', 2000);
      return;
    }

    // Helper: be SW ta över och ladda om sidan
    function activateAndReload(sw) {
      sw.postMessage({ type: 'SKIP_WAITING' });
      // controllerchange-lyssnaren sköter reload, men som backup:
      setTimeout(doReload, 2500);
    }

    // Om en ny SW redan väntar (ovanligt p.g.a. skipWaiting i install, men kan hända)
    if (reg.waiting) {
      showUpdateToast('Uppdatering hittad – laddar om...', 1400, true);
      activateAndReload(reg.waiting);
      return;
    }

    // Lyssna på ny SW som hittas under reg.update()
    reg.addEventListener('updatefound', function onFound() {
      reg.removeEventListener('updatefound', onFound);
      const newSW = reg.installing;
      if (!newSW) return;
      showUpdateToast('Uppdatering hittad – installerar...', 30000);
      newSW.addEventListener('statechange', function() {
        if (this.state === 'installed' && reg.waiting) {
          // Hamnade i waiting (borde inte hända med skipWaiting i install)
          showUpdateToast('Uppdatering klar – laddar om...', 1400, true);
          activateAndReload(reg.waiting);
        }
        // Om skipWaiting i install gäller går den direkt installed→activating→activated
        // och controllerchange-lyssnaren hanterar reload
      });
    });

    reg.update().then(() => {
      // reg.update() kan resolva innan installation börjar —
      // updatefound-lyssnaren ovan fångar det. Om inget hittades:
      if (!reg.waiting && !reg.installing) {
        showUpdateToast('Du kör senaste versionen ✅', 2000);
      }
    }).catch(() => {
      showUpdateToast('Kunde inte söka uppdatering (offline?)', 2500);
    });
  });
}

function doReload() {
  // window.location.reload() är opålitligt i iOS PWA standalone-läge
  window.location.href = window.location.href;
}

function showUpdateToast(msg, duration, willReload) {
  duration   = duration   || 2000;
  willReload = willReload || false;
  const existing = document.getElementById('update-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'update-toast';
  toast.textContent = msg;
  toast.style.cssText = [
    'position:fixed', 'bottom:72px', 'left:50%', 'transform:translateX(-50%)',
    'background:rgba(30,41,59,0.95)', 'color:#fff', 'padding:10px 22px',
    'border-radius:24px', 'font-size:14px', 'font-weight:700',
    'box-shadow:0 4px 20px rgba(0,0,0,0.3)', 'z-index:9999',
    'white-space:nowrap', 'max-width:90vw', 'text-align:center',
    'transition:opacity 0.3s',
  ].join(';');
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
      if (willReload) doReload();
    }, 350);
  }, duration);
}

/* Initiera när DOM är redo */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  // Sätt versionsnummer på uppdateringsknappen
  const updateBtn = document.getElementById('update-btn');
  if (updateBtn) updateBtn.textContent = `Sök uppdatering (${APP_VERSION})`;
  // PWA: registrera service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
    // Ny SW tog över → ladda om sidan direkt
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      doReload();
    });
  }
});
