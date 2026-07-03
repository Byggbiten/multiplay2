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
    .nphub { flex:1; min-height:0; width:100%; display:flex; flex-direction:column;
      justify-content:center; align-items:center; gap:clamp(12px,2.2vh,22px); }
    .nphub .section-title { width:100%; padding:0; flex-shrink:0; }
    .nphub .me-chip { flex-shrink:0; }
    .nphub-cards { width:100%; flex:1; min-height:0; max-height:min(56vh,480px);
      display:grid; grid-template-columns:1fr; grid-auto-rows:1fr;
      gap:clamp(12px,2vh,20px); }
    .npcard { position:relative; overflow:hidden; display:flex; align-items:center;
      gap:clamp(14px,2vw,22px); text-align:left; width:100%;
      min-height:clamp(96px,15vh,170px);
      padding:clamp(14px,2.2vh,24px) clamp(18px,3vw,28px);
      background:var(--glass); border:1px solid var(--glass-line);
      border-radius:var(--radius-lg); box-shadow:var(--shadow-panel);
      cursor:pointer; transition:transform .3s var(--spring), box-shadow .3s; }
    .npcard::after { content:''; position:absolute; left:0; top:0; bottom:0; width:6px;
      background:linear-gradient(180deg,var(--accent),var(--accent-light));
      border-radius:0 6px 6px 0; }
    .npcard:hover { transform:translateY(-4px) scale(1.01); box-shadow:0 16px 40px var(--glow); }
    .npcard:active { transform:scale(.98); }
    .npico { width:clamp(60px,10vh,92px); height:clamp(60px,10vh,92px);
      border-radius:24px; display:grid; place-items:center;
      font-size:clamp(30px,5vh,48px); flex-shrink:0;
      background:linear-gradient(135deg,var(--tint),#fff);
      border:1px solid var(--glass-line); box-shadow:0 4px 12px var(--glow); }
    .npcard-body { flex:1; min-width:0; display:flex; flex-direction:column;
      align-items:flex-start; gap:3px; }
    .npcard b { font-family:var(--font-head); font-weight:700;
      font-size:clamp(19px,2.8vh,25px); color:var(--deep); line-height:1.15; }
    .npcard small { color:var(--ink-soft); font-size:clamp(12.5px,1.8vh,15px); font-weight:700; }
    .npstat { display:inline-flex; align-items:center; gap:6px; margin-top:7px;
      font-size:12.5px; font-weight:800; color:var(--deep);
      background:color-mix(in srgb, var(--accent) 10%, white 60%);
      padding:4px 12px; border-radius:var(--radius-full); }
    .npstat-new { background:linear-gradient(135deg,var(--accent),var(--accent-light));
      color:#fff; }
    .npbar { width:min(240px,70%); height:6px; margin-top:8px; border-radius:99px;
      background:color-mix(in srgb, var(--accent) 14%, white 50%); overflow:hidden; }
    .npbar i { display:block; height:100%; border-radius:inherit;
      background:linear-gradient(90deg,var(--accent),var(--accent-light)); }
    .nphub-chev { width:26px; height:26px; color:var(--accent); flex-shrink:0; margin-left:auto; }
    @media (min-width:1000px) {
      .nphub-cards { grid-template-columns:repeat(2,1fr); max-height:min(52vh,420px); }
      .npcard { flex-direction:column; justify-content:center; text-align:center;
        gap:clamp(10px,2vh,18px); min-height:0; }
      .npcard::after { top:0; bottom:auto; left:0; right:0; width:auto; height:6px;
        border-radius:0 0 6px 6px; }
      .npcard-body { flex:0 0 auto; align-items:center; text-align:center; }
      .nphub-chev { display:none; }
    }
  `;

  /* ── Status ur delmodulernas loggar/stats ─────────────── */
  function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (_) { return fallback; }
  }

  function statMuntligt() {
    const m = readJSON(`np_matte_muntligt_stats_${profile.id}`, null);
    if (!m || !m.totalSessions) return null;
    const last = (m.sessions && m.sessions[0]) || null;
    const pct  = last && last.total ? Math.round(last.correct / last.total * 100) : null;
    const n    = m.totalSessions === 1 ? '1 prov' : `${m.totalSessions} prov`;
    return { label: last ? `Senast ${last.correct}/${last.total} · ${n}` : n, pct };
  }

  function statSkriftlig() {
    const s = readJSON(`np_matte_skriftlig_stats_${profile.id}`, null);
    if (!s || !s.plays) return null;
    const pct = Math.max(0, Math.min(100, Math.round(s.bestScore / 20 * 100)));
    const n   = s.plays === 1 ? '1 prov' : `${s.plays} prov`;
    return { label: `Bäst ${s.bestScore}/20 · ${n}`, pct };
  }

  function statMatte() {
    const m = statMuntligt(), s = statSkriftlig();
    const mData = readJSON(`np_matte_muntligt_stats_${profile.id}`, null);
    const sData = readJSON(`np_matte_skriftlig_stats_${profile.id}`, null);
    const count = ((mData && mData.totalSessions) || 0) + ((sData && sData.plays) || 0);
    if (!count) return null;
    const pct = m ? m.pct : (s ? s.pct : null);
    return { label: count === 1 ? '1 prov klarat' : `${count} prov klarade`, pct };
  }

  function statSvenska() {
    const log = readJSON(`np_svenska_log_${profile.id}`, []);
    if (!log.length) return null;
    const prov  = log.filter(e => e.type === 'prov');
    const texts = log.length - prov.length;
    const parts = [];
    if (prov.length) parts.push(prov.length === 1 ? '1 prov' : `${prov.length} prov`);
    if (texts)       parts.push(texts === 1 ? '1 text' : `${texts} texter`);
    const pct = prov.length && prov[0].total
      ? Math.max(0, Math.min(100, Math.round(prov[0].score / prov[0].total * 100)))
      : null;
    return { label: parts.join(' · '), pct };
  }

  function statusHtml(s) {
    if (!s) return `<span class="npstat npstat-new">Ny! ✨</span>`;
    const medal = s.pct == null ? '🏅' :
      s.pct === 100 ? '🥇' : s.pct >= 75 ? '🥈' : s.pct >= 50 ? '🥉' : '💪';
    const bar = s.pct == null ? '' : `<span class="npbar"><i style="width:${s.pct}%"></i></span>`;
    return `<span class="npstat num">${medal} ${s.label}</span>${bar}`;
  }

  function hubCard(c) {
    return `
      <button class="npcard" onclick="${c.onclick}">
        <span class="npico">${c.icon}</span>
        <span class="npcard-body">
          <b>${c.label}</b>
          <small>${c.desc}</small>
          ${statusHtml(c.stat)}
        </span>
        <svg class="icn nphub-chev"><use href="#i-chevron"/></svg>
      </button>`;
  }

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

      <div class="floaties"><span style="top:7%;right:9%">✨</span><span style="bottom:12%;left:6%;animation-delay:2s">📚</span></div>
      <div class="wrap">
        <div class="nphub">
          <div class="me-chip">
            <span class="avatar avatar-sm">${profile.avatar}</span>
            <b>${escHtml(profile.name)}</b>
          </div>
          <div class="section-title">Välj ämne</div>
          <div class="nphub-cards">
            ${hubCard({ icon: '🔢', label: 'Matematik Åk 3',
              desc: 'Tabeller, diagram, chans och mer 📊',
              onclick: 'NationellaHub.showMatteSelect()', stat: statMatte() })}
            ${hubCard({ icon: '📖', label: 'Svenska Åk 3',
              desc: 'Läsförståelse, begrepp och skriva ✏️',
              onclick: 'NationellaHub.startSvenska()', stat: statSvenska() })}
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

      <div class="floaties"><span style="top:7%;right:9%">✨</span><span style="bottom:12%;left:6%;animation-delay:2s">🔢</span></div>
      <div class="wrap">
        <div class="nphub">
          <div class="me-chip">
            <span class="avatar avatar-sm">${profile.avatar}</span>
            <b>${escHtml(profile.name)}</b>
          </div>
          <div class="section-title">Välj delmodul</div>
          <div class="nphub-cards">
            ${hubCard({ icon: '🗣️', label: 'Muntlig del Åk 3',
              desc: '10 uppgifter – tabeller, diagram och chans 🎲',
              onclick: 'NationellaHub.startMatteMuntligt()', stat: statMuntligt() })}
            ${hubCard({ icon: '✏️', label: 'Skriftlig del Åk 3',
              desc: '20 uppgifter – tabeller, diagram och mer 📝',
              onclick: 'NationellaHub.startMatteSkriftlig()', stat: statSkriftlig() })}
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
