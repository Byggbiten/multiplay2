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

  /* ── Ämnesval: Matematik / Svenska ───────────────────── */
  function showSubjectSelect() {
    const root = document.getElementById('nationella-root');
    root.innerHTML = `
      <div class="app-header" style="border-bottom-color:rgba(124,58,237,0.2)">
        <button class="btn-back" style="background:var(--np-light);color:var(--np-primary)"
          onclick="App.goBackToGameSelect()">Tillbaka</button>
        <span class="header-title" style="color:var(--np-primary)">📝 Nationella Prov Åk 3</span>
        <div style="width:80px"></div>
      </div>

      <div style="padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-4)">

        <!-- Spelarbanner -->
        <div class="player-banner">
          <div class="avatar avatar-lg">${profile.avatar}</div>
          <div class="player-info">
            <div class="player-name">${escHtml(profile.name)}</div>
            <div class="player-tagline">Välj ett ämne att träna 🎯</div>
          </div>
        </div>

        <!-- Ämnesval -->
        <div style="font-weight:800;font-size:var(--text-lg);color:var(--np-primary);margin-top:var(--space-2)">
          Välj ämne
        </div>

        <!-- Matematik (aktiv) -->
        <div class="card" style="
          display:flex;align-items:center;gap:var(--space-5);
          padding:var(--space-5);cursor:pointer;
          background:linear-gradient(135deg,#fef9c3 0%,#fce7f3 100%);
          border:2px solid rgba(124,58,237,0.2);
          transition:transform 0.2s var(--ease-bounce),box-shadow 0.2s;
        "
          onclick="NationellaHub.showMatteSelect()"
          onmouseenter="this.style.transform='translateY(-3px)';this.style.boxShadow='var(--shadow-lg)'"
          onmouseleave="this.style.transform='';this.style.boxShadow=''"
          role="button" tabindex="0">
          <div style="
            font-size:2.5rem;width:64px;height:64px;
            display:flex;align-items:center;justify-content:center;
            border-radius:var(--radius-lg);
            background:linear-gradient(135deg,#fef9c3,#fce7f3);
          ">🔢</div>
          <div style="flex:1">
            <div style="font-family:var(--font-heading);font-size:var(--text-2xl);color:var(--np-primary)">
              Matematik Åk 3
            </div>
            <div style="font-size:var(--text-sm);color:var(--color-text-muted);font-weight:700;margin-top:4px">
              Tabeller, diagram, chans och mer 📊
            </div>
          </div>
          <div style="font-size:var(--text-2xl);opacity:0.5">›</div>
        </div>

        <!-- Svenska (inaktiv) -->
        <div class="card" style="
          display:flex;align-items:center;gap:var(--space-5);
          padding:var(--space-5);
          background:rgba(200,200,200,0.15);
          border:2px dashed rgba(150,150,150,0.3);
          opacity:0.6;
          cursor:not-allowed;
        ">
          <div style="
            font-size:2.5rem;width:64px;height:64px;
            display:flex;align-items:center;justify-content:center;
            border-radius:var(--radius-lg);
            background:rgba(200,200,200,0.2);
          ">📖</div>
          <div style="flex:1">
            <div style="font-family:var(--font-heading);font-size:var(--text-2xl);color:#999">
              Svenska Åk 3
            </div>
            <div style="font-size:var(--text-sm);color:#bbb;font-weight:700;margin-top:4px">
              Kommer snart! 🔜
            </div>
          </div>
          <div style="
            font-size:var(--text-xs);font-weight:800;
            background:rgba(150,150,150,0.2);color:#aaa;
            padding:4px 10px;border-radius:var(--radius-full);
            white-space:nowrap;
          ">Kommer snart</div>
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
      <div class="app-header" style="border-bottom-color:rgba(124,58,237,0.2)">
        <button class="btn-back" style="background:var(--np-light);color:var(--np-primary)"
          onclick="NationellaHub.showSubjectSelect()">Tillbaka</button>
        <span class="header-title" style="color:var(--np-primary)">🔢 Matematik Åk 3</span>
        <div style="width:80px"></div>
      </div>

      <div style="padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-4)">

        <!-- Spelarbanner -->
        <div class="player-banner">
          <div class="avatar avatar-lg">${profile.avatar}</div>
          <div class="player-info">
            <div class="player-name">${escHtml(profile.name)}</div>
            <div class="player-tagline">Välj delmodul att träna 📚</div>
          </div>
        </div>

        <!-- Delmodul: Muntlig del (aktiv) -->
        <div class="card" style="
          display:flex;align-items:center;gap:var(--space-5);
          padding:var(--space-5);cursor:pointer;
          background:linear-gradient(135deg,#ede9fe 0%,#fce7f3 100%);
          border:2px solid rgba(124,58,237,0.2);
          transition:transform 0.2s var(--ease-bounce),box-shadow 0.2s;
        "
          onclick="NationellaHub.startMatteMuntligt()"
          onmouseenter="this.style.transform='translateY(-3px)';this.style.boxShadow='var(--shadow-lg)'"
          onmouseleave="this.style.transform='';this.style.boxShadow=''"
          role="button" tabindex="0">
          <div style="
            font-size:2.5rem;width:64px;height:64px;
            display:flex;align-items:center;justify-content:center;
            border-radius:var(--radius-lg);
            background:linear-gradient(135deg,#ede9fe,#fce7f3);
          ">🗣️</div>
          <div style="flex:1">
            <div style="font-family:var(--font-heading);font-size:var(--text-2xl);color:var(--np-primary)">
              Muntlig del Åk 3
            </div>
            <div style="font-size:var(--text-sm);color:var(--color-text-muted);font-weight:700;margin-top:4px">
              10 uppgifter – tabeller, diagram och chans 🎲
            </div>
          </div>
          <div style="font-size:var(--text-2xl);opacity:0.5">›</div>
        </div>

        <!-- Skriftlig del (aktiv) -->
        <div class="card" style="
          display:flex;align-items:center;gap:var(--space-5);
          padding:var(--space-5);cursor:pointer;
          background:linear-gradient(135deg,#eff6ff 0%,#ecfeff 100%);
          border:2px solid rgba(37,99,235,0.2);
          transition:transform 0.2s var(--ease-bounce),box-shadow 0.2s;
        "
          onclick="NationellaHub.startMatteSkriftlig()"
          onmouseenter="this.style.transform='translateY(-3px)';this.style.boxShadow='var(--shadow-lg)'"
          onmouseleave="this.style.transform='';this.style.boxShadow=''"
          role="button" tabindex="0">
          <div style="
            font-size:2.5rem;width:64px;height:64px;
            display:flex;align-items:center;justify-content:center;
            border-radius:var(--radius-lg);
            background:linear-gradient(135deg,#eff6ff,#ecfeff);
          ">✏️</div>
          <div style="flex:1">
            <div style="font-family:var(--font-heading);font-size:var(--text-2xl);color:#2563eb">
              Skriftlig del Åk 3
            </div>
            <div style="font-size:var(--text-sm);color:var(--color-text-muted);font-weight:700;margin-top:4px">
              20 uppgifter – tabeller, diagram och mer 📝
            </div>
          </div>
          <div style="font-size:var(--text-2xl);opacity:0.5">›</div>
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

  /* ── Hjälp ───────────────────────────────────────────── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { init, showSubjectSelect, showMatteSelect, startMatteMuntligt, startMatteSkriftlig };
})();
