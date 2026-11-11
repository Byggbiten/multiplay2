/* tests/webblasare/band-svep.js — bandets svep i webbläsaren (övningsbladen, D44 ✎, runda 4–7).
   Körs i dev-spegeln (localhost:5312) i 390 × 797: ladda filen med en <script>-tagg och kör
     await window.bandSvep({ niva:'latt' })   och   await window.bandSvep({ niva:'svar' })
   Spelar varje modul (utom kort division och divisionstestet) med hjälp, i riktiga flöden ur generatorn (Svårare med
   hjälp skriver divisionen själv), och kontrollerar i varje steg med band:
     - bandet går inte genom siffror eller läsbar text och inte genom bilden,
     - det är inte längre än 2 gånger det raka avståndet,
     - startpunkten ligger BAND_START (3) ± 1 px från siffrornas egen kant, pilspetsen BAND_TIP (3) ± 1 px utanför rutans
       ram, också efter en storleksändring av kortet,
     - summabrickorna ligger inte på bilden,
     - kladden är minst 120 px.
   Ger { fel:[…], steg, band, ringar, kladdMin }. Inga fel = godkänt. (vitest kan inte mäta layout; därför här.) */
'use strict';
window.bandSvep = async function (o) {
  const niva = (o && o.niva) || 'latt', seeds = (o && o.seeds) || 2;
  const L = window.MatteProvLogic, MP = window.MatteProv;
  const w = ms => new Promise(r => setTimeout(r, ms));
  const q = s => document.querySelector(s), c = s => q(s).dispatchEvent(new MouseEvent('click', { bubbles:true }));
  const key = v => [...String(v)].forEach(x => c(`[data-act=key][data-k="${x}"]`));
  const fel = [], res = { steg:0, band:0, ringar:0, kladdMin:999 };
  const READ = '.mp-ask, .mp-text, .mp-prompt, .mp-plabel, .mp-pdone, .mp-sum';

  function kontrollera(id, steg, efterAndring) {
    const qq = q('#mp-q'), path = q('.mp-band path'), tipEl = q('.mp-band polygon');
    const kh = Math.round(q('#mp-canvas').getBoundingClientRect().height);
    if (!efterAndring && kh < res.kladdMin) { res.kladdMin = kh; res.kladdVar = `${id} steg ${steg}`; }
    /* summabrickorna får inte ligga på bilden */
    const bilder = [...q('#mp-q').querySelectorAll('.mp-grp, .mp-kidc, .mp-pile, .mp-line, .mp-bc')].map(e => e.getBoundingClientRect());
    q('#mp-q').querySelectorAll('.mp-sumov').forEach(e => { const s = e.getBoundingClientRect();
      if (bilder.some(b => s.left < b.right && s.right > b.left && s.top < b.bottom - 1 && s.bottom > b.top + 1)) fel.push(`${id} steg ${steg}: summabrickan ligger på bilden`); });
    if (!path) { if (q('.mp-bring')) res.ringar++; return; }
    res.band++;
    const srcEl = q('.mp-bsrc'), sort = srcEl.matches('.mp-ans') ? 'ruta' : srcEl.closest('.mp-frac') ? 'bråk' : srcEl.matches('.mp-near') ? 'bricka nära' : srcEl.closest('.mp-prompt, .mp-text') ? 'tal i text' : srcEl.matches('.pvd, .mp-tecol b') ? 'siffra' : srcEl.closest('.mp-bsp') ? 'delad talsort' : srcEl.closest('.mp-ptc') ? 'pengar' : 'bricka';
    res.sorter = res.sorter || {}; res.sorter[sort] = (res.sorter[sort] || 0) + 1;
    const qr = qq.getBoundingClientRect(), src = q('.mp-bsrc'), dst = q('#mp-q .mp-ans.focus, #mp-q .mp-nb.focus');
    /* hinder: siffror och läsbar text utanför källan och målet, och bilden */
    const hinder = [];
    const tw = document.createTreeWalker(qq, NodeFilter.SHOW_TEXT, { acceptNode:n => n.nodeValue.trim() && !src.contains(n.parentElement) && !dst.contains(n.parentElement) && !n.parentElement.closest('svg.mp-band') ? 1 : 2 });
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (!(/\d/.test(n.nodeValue) || n.parentElement.closest(READ))) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const r of rg.getClientRects()) hinder.push([r.left - qr.left, r.top - qr.top, r.right - qr.left, r.bottom - qr.top, n.nodeValue.trim()]);
    }
    qq.querySelectorAll('.mp-grp, .mp-kidc, .mp-pile, .mp-line, .mp-bc').forEach(e => { if (!e.contains(src)) { const r = e.getBoundingClientRect(); hinder.push([r.left - qr.left, r.top - qr.top, r.right - qr.left, r.bottom - qr.top, 'bild']); } });
    const len = path.getTotalLength(), genom = new Set();
    for (let i = 1; i < 60; i++) { const p = path.getPointAtLength(len * i / 60); for (const r of hinder) if (p.x > r[0] && p.x < r[2] && p.y > r[1] && p.y < r[3]) genom.add(r[4]); }
    if (genom.size) fel.push(`${id} steg ${steg}: genom ${[...genom].join('|')}`);
    const a = MP._digitsRect(src), z = dst.getBoundingClientRect();
    const rak = Math.max(20, Math.hypot((a.left + a.right - z.left - z.right) / 2, (a.top + a.bottom - z.top - z.bottom) / 2));
    if (len > 2 * rak || len > 220) fel.push(`${id} steg ${steg}: för långt (${Math.round(len)} px)`);
    /* fästpunkterna: starten BAND_START från siffrornas kant, spetsen BAND_TIP utanför ramen */
    const p0 = path.getPointAtLength(0), sx = p0.x + qr.left, sy = p0.y + qr.top;
    const avS = Math.min(...[a.top - sy, sy - a.bottom, a.left - sx, sx - a.right].filter(d => d > -0.5));
    if (Math.abs(avS - L.BAND_START) > 1) fel.push(`${id} steg ${steg}: starten ${avS.toFixed(1)} px från siffrorna`);
    const tp = tipEl.getAttribute('points').split(' ')[0].split(',').map(Number), tx = tp[0] + qr.left, ty = tp[1] + qr.top;
    const avT = Math.min(...[z.top - ty, ty - z.bottom, z.left - tx, tx - z.right].filter(d => d > -0.5));
    if (Math.abs(avT - L.BAND_TIP) > 1) fel.push(`${id} steg ${steg}: spetsen ${avT.toFixed(1)} px från rutan`);
  }

  MP.open({ id:'bandsvep', name:'Svep' }, () => {}, 'ovdiv'); await w(150);
  c(`[data-act=level][data-id=${niva}]`); await w(40); c('[data-act=ovamode][data-id=help]'); await w(40);
  for (const id of L.DIV_IDS.filter(x => x !== 'kortdiv' && x !== 'dtabell')) for (let k = 0; k < seeds; k++) {
    const rr = (() => { let x = 7 + k * 31; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; })();
    MP._force([L.genMoment(id, niva, 1, rr)[0]]); await w(350);
    let d = 0; while (q('[data-act=deal]') && d < 20) { c('[data-act=deal]'); d++; await w(220); } await w(150);
    for (let g = 0; g < 10 && !q('.mp-fb'); g++) {
      const I = MP._peek().IN, t = MP._peek().task;
      if (t.type === 'ts' && q('[data-act=split]')) { c('[data-act=split]'); await w(150); }
      await w(120); res.steg++; kontrollera(`${id}#${k}`, g);
      /* samma kontroll efter en storleksändring av kortet */
      if (q('.mp-band path')) { const qq = q('#mp-q'); qq.style.paddingLeft = '18px'; await w(200); kontrollera(`${id}#${k} (efter storleksändring)`, g, true); qq.style.paddingLeft = ''; await w(200); }
      const want = I.kind === 'boxes' ? t.fields[I.hb.i].ans : t.flow[I.k].ans[I.f];
      if (I.kind === 'boxes') { key(want); c('[data-act=hsvar]'); await w(160); if (q('[data-act=hnext]')) c('[data-act=hnext]'); await w(60); }
      else { key(want); if (q('[data-act=key][data-k=next]')) c('[data-act=key][data-k=next]'); else { c('#mp-klar'); await w(150); if (q('[data-act=padv]')) c('[data-act=padv]'); } await w(60); }
    }
  }
  if (res.kladdMin < 120) fel.push(`kladden ${res.kladdMin} px (${res.kladdVar})`);
  return Object.assign(res, { niva, fel });
};
