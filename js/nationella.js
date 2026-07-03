/* ============================================================
   MULTIPLAY – Nationella Prov: Navigationshub
   Hanterar: ämnesval (Matte/Svenska) och delmodul-val
   ============================================================ */
'use strict';

const NationellaHub = (() => {
  let profile = null;

  /* ── Init ─────────────────────────────────────────────── */
  function init(p) {
    profile = p;
    showSubjectSelect();
  }

  /* ── Modulspecifik CSS (rot-fyllnad, tokens) ─────────── */
  const HUB_CSS = `
    #nationella-root, #np-matte-select-root {
      flex:1; display:flex; flex-direction:column; min-height:0; width:100%;
    }
    .nphub-list { flex:1; display:flex; flex-direction:column;
      justify-content:center; gap:var(--space-4); min-height:0; }
    .nphub-chev { width:24px; height:24px; color:var(--accent); flex-shrink:0; margin-left:auto; }
  `;

  /* ── Ämnesval: Matematik / Svenska ───────────────────── */
  function showSubjectSelect() {
    const root = document.getElementById('nationella-root');
    root.innerHTML = `
      <style id="nphub-rs">${HUB_CSS}</style>
      <div class="app-header">
        <button class="btn-back" onclick="App.goBackToGameSelect()">Tillbaka</button>
        <span class="header-title">Nationella Prov Åk 3</span>
        <span style="width:80px"></span>
      </div>

      <div class="wrap">
        <div class="nphub-list">

          <!-- Spelarbanner -->
          <div class="player-banner">
            <div class="avatar avatar-lg">${profile.avatar}</div>
            <div class="player-info">
              <div class="player-name">${escHtml(profile.name)}</div>
              <div class="player-tagline">Välj ett ämne att träna 🎯</div>
            </div>
          </div>

          <!-- Ämnesval -->
          <div class="section-title">Välj ämne</div>

          <!-- Matematik (aktiv) -->
          <div class="game-card game-card-wide" style="cursor:pointer"
            onclick="NationellaHub.showMatteSelect()"
            role="button" tabindex="0">
            <span class="game-emoji">🔢</span>
            <div style="flex:1;min-width:0">
              <h3>Matematik Åk 3</h3>
              <p>Tabeller, diagram, chans och mer 📊</p>
            </div>
            <svg class="icn nphub-chev"><use href="#i-chevron"/></svg>
          </div>

          <!-- Svenska (aktiv) -->
          <div class="game-card game-card-wide" style="cursor:pointer"
            onclick="NationellaHub.startSvenska()"
            role="button" tabindex="0">
            <span class="game-emoji">📖</span>
            <div style="flex:1;min-width:0">
              <h3>Svenska Åk 3</h3>
              <p>Läsförståelse, begrepp och skriva ✏️</p>
            </div>
            <svg class="icn nphub-chev"><use href="#i-chevron"/></svg>
          </div>

        </div>
      </div>
    `;
    Router.show('screen-nationella-select');
  }

  /* ── Matte-delmodul-val ───────────────────────────────── */
  function showMatteSelect() {
    App.Sound.play('click');
    const root = document.getElementById('np-matte-select-root');
    root.innerHTML = `
      <style id="nphub-rs2">${HUB_CSS}</style>
      <div class="app-header">
        <button class="btn-back" onclick="NationellaHub.showSubjectSelect()">Tillbaka</button>
        <span class="header-title">Matematik Åk 3</span>
        <span style="width:80px"></span>
      </div>

      <div class="wrap">
        <div class="nphub-list">

          <!-- Spelarbanner -->
          <div class="player-banner">
            <div class="avatar avatar-lg">${profile.avatar}</div>
            <div class="player-info">
              <div class="player-name">${escHtml(profile.name)}</div>
              <div class="player-tagline">Välj delmodul att träna 📚</div>
            </div>
          </div>

          <!-- Delmodul: Muntlig del (aktiv) -->
          <div class="game-card game-card-wide" style="cursor:pointer"
            onclick="NationellaHub.startMatteMuntligt()"
            role="button" tabindex="0">
            <span class="game-emoji">🗣️</span>
            <div style="flex:1;min-width:0">
              <h3>Muntlig del Åk 3</h3>
              <p>10 uppgifter – tabeller, diagram och chans 🎲</p>
            </div>
            <svg class="icn nphub-chev"><use href="#i-chevron"/></svg>
          </div>

          <!-- Skriftlig del (aktiv) -->
          <div class="game-card game-card-wide" style="cursor:pointer"
            onclick="NationellaHub.startMatteSkriftlig()"
            role="button" tabindex="0">
            <span class="game-emoji">✏️</span>
            <div style="flex:1;min-width:0">
              <h3>Skriftlig del Åk 3</h3>
              <p>20 uppgifter – tabeller, diagram och mer 📝</p>
            </div>
            <svg class="icn nphub-chev"><use href="#i-chevron"/></svg>
          </div>

        </div>
      </div>
    `;
    Router.show('screen-np-matte-select');
  }

  /* ── Starta Matte Muntligt ────────────────────────────── */
  function startMatteMuntligt() {
    App.Sound.play('click');
    Router.show('screen-np-matte-muntligt');
    if (typeof NpMatteMuntligt !== 'undefined') {
      NpMatteMuntligt.init(profile);
    }
  }

  /* ── Starta Matte Skriftlig ───────────────────────────── */
  function startMatteSkriftlig() {
    App.Sound.play('click');
    Router.show('screen-np-matte-skriftlig');
    if (typeof NpMatteSkriftlig !== 'undefined') {
      NpMatteSkriftlig.init(profile);
    }
  }

  /* ── Starta Svenska ───────────────────────────────────── */
  function startSvenska() {
    App.Sound.play('click');
    Router.show('screen-np-svenska-select');
    if (typeof NpSvenska !== 'undefined') {
      NpSvenska.init(profile);
    }
  }

  /* ── Hjälp ───────────────────────────────────────────── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { init, showSubjectSelect, showMatteSelect, startMatteMuntligt, startMatteSkriftlig, startSvenska };
})();
