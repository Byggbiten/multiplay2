/* ============================================================
   MULTIPLAY – Huvud-applikation
   Hanterar: routing, profiler, navigering, ljud, konfetti
   ============================================================ */
'use strict';

/* ── App-version (matchar CACHE_VERSION i sw.js) ────── */
const APP_VERSION = 'v4';

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
    localStorage.setItem(this.KEY, JSON.stringify(profiles));
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

/* ══════════════════════════════════════════════════════
   HUVUD-APP-OBJEKT
══════════════════════════════════════════════════════ */
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
        <div style="flex:1">
          <div class="profile-name">${escapeHtml(p.name)}</div>
          <div class="profile-meta">Skapad ${formatDate(p.created)}</div>
        </div>
        <div class="profile-actions" onclick="event.stopPropagation()">
          <button class="btn-delete-profile" onclick="App.confirmDeleteProfile('${p.id}','${escapeHtml(p.name)}')" title="Ta bort profil" aria-label="Ta bort ${escapeHtml(p.name)}">🗑️</button>
        </div>
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
    Router.show('screen-game-select');
  }

  function startGame(game) {
    if (!currentProfile) { showHome(); return; }
    Sound.play('click');

    const screenMap = {
      multiplication: 'screen-multiplication',
      clock:          'screen-clock',
      friends:        'screen-friends',
      nationella:     'screen-nationella-select',
      addsub:         'screen-addsub',
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
    }
  }

  function goBackToGameSelect() {
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
        <button class="btn btn-danger btn-sm" onclick="App.confirmDeleteProfile('${p.id}','${escapeHtml(p.name)}')">
          🗑️ Ta bort
        </button>
      </div>
    `).join('');
    document.getElementById('modal-delete-profiles').classList.remove('hidden');
  }

  function hideDeleteProfiles() {
    document.getElementById('modal-delete-profiles').classList.add('hidden');
  }

  function confirmDeleteProfile(id, name) {
    hideDeleteProfiles();
    document.getElementById('confirm-delete-msg').textContent =
      `Vill du ta bort profilen "${name}"? All data raderas permanent!`;
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
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
    reg.update().then(() => {
      if (reg.waiting) {
        showUpdateToast('Uppdatering hittad, laddar om...', 1500, true);
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else if (reg.installing) {
        showUpdateToast('Uppdatering hittad, laddar om...', 1500, true);
      } else {
        showUpdateToast('Du kör senaste versionen ✅', 2000);
      }
    }).catch(() => {
      showUpdateToast('Kunde inte söka uppdatering (offline?)', 2500);
    });
  });
}

function showUpdateToast(msg, duration, willReload) {
  duration  = duration  || 2000;
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
      if (willReload) window.location.reload();
    }, 350);
  }, duration);
}

/* Initiera när DOM är redo */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  // Sätt versionsnummer på uppdateringsknappen
  const updateBtn = document.getElementById('update-btn');
  if (updateBtn) updateBtn.textContent = `🔄 Sök uppdatering (${APP_VERSION})`;
  // PWA: registrera service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
    // Lyssna på controller-byte → ladda om automatiskt
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      showUpdateToast('Uppdatering hittad, laddar om...', 1200, true);
    });
  }
});
