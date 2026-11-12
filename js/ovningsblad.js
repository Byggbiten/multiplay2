/* ============================================================
   MULTIPLAY – Övningsblad · Division, plan 3 (D47, D48)
   Åtta moduler i Grunder · Räkna · Tänka, i lägena Med hjälp och
   Själv (semistöd, brainstorm/17), för telefon och iPad. Porterad
   från facit design-lab/ovningsblad-plan3.html; tänket står i
   .project-context/METOD-OVNINGSBLAD.md. Logiken (talen, stegen,
   Venndiagrammet) ligger i js/ovningsblad-logic.js. Nås från
   divisionens lägesvy i js/multdiv.js. Allt ligger under #ov-root.
   ============================================================ */
'use strict';

const Ovningsblad = (() => {
const O = window.OvningsbladLogic;
const CSS = `
/* Mockup för plan 3 (D47, brainstorm/16), byggd av VD:n själv. Steg 1: hubben, kort division med tvåsiffrig
   nämnare och trappan. Stil C (D44 ✎): platsvärdesfärger, lila = härifrån, orange = hit, ingen felsignal (D39). */
#ov-root{--ink:#3b1d6e;--soft:#6d5a96;--acc:#0f766e;--deep:#4c1d95;--lila:#7c3aed;--org:#fb923c;--peach:#fff1e6;
  --pvTu:#7c3aed;--pvH:#dc2626;--pvT:#2563eb;--pvE:#16a34a;
  --bg:linear-gradient(160deg,#fdf4ff 0%,#fce7f3 34%,#eff6ff 68%,#f0fdf4 100%)}
#ov-root *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
#ov-root{display:flex;flex-direction:column;flex:1;min-height:0;width:100%}
#ov-root .app{flex:1;min-height:0;width:100%;max-width:560px;margin:0 auto;display:flex;flex-direction:column;padding:4px 10px 10px;gap:6px;overflow:hidden;position:relative}
#ov-root .top{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:44px}
#ov-root .back{display:flex;align-items:center;gap:4px;border:0;border-radius:22px;background:rgba(255,255,255,.85);padding:0 14px;height:40px;font:800 14px Nunito;color:var(--deep);cursor:pointer}
#ov-root .back svg{width:16px;height:16px}
#ov-root .ttl{font:800 20px 'Baloo 2';color:#134e4a}
#ov-root .prog{min-width:70px;text-align:right;font:800 13px Nunito;color:var(--soft);background:rgba(255,255,255,.85);border-radius:22px;padding:10px 14px}
#ov-root .card{flex:none;background:rgba(255,255,255,.72);border-radius:24px;padding:10px 12px;display:flex;flex-direction:column;gap:6px;position:relative}
#ov-root .top,#ov-root .pad,#ov-root .seg,#ov-root .tiles,#ov-root .sec{flex:none}
#ov-root .ask{font:900 15.5px/1.28 Nunito;color:#134e4a;min-height:40px}
#ov-root .ask .ok{display:block;font:800 13px Nunito;color:#15803d}
#ov-root .ask .soft{display:block;font:800 13px Nunito;color:#b45309}
#ov-root .head{font:800 19px 'Baloo 2';letter-spacing:.02em}
#ov-root .pad{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
#ov-root .pad button{height:44px;border:0;border-radius:14px;background:rgba(255,255,255,.95);font:800 22px 'Baloo 2';color:var(--deep);cursor:pointer;box-shadow:0 2px 6px rgba(93,63,158,.1)}
#ov-root .pad .wide{grid-column:span 4;background:#e6f4f1;color:#134e4a;font:900 17px Nunito;border:2px solid #99d5c9}
#ov-root .pad .wide.go{background:var(--acc);color:#fff;border-color:var(--acc)}
#ov-root .pad .er svg{width:22px;height:22px}
#ov-root .pad .wide svg{width:20px;height:20px;vertical-align:-3px}
#ov-root .kladd{flex:1;min-height:100px;background:rgba(255,255,255,.6);border-radius:20px;padding:8px 10px;display:flex;flex-direction:column;gap:6px}
/* platsvärdesfärger */
#ov-root .Tu{color:var(--pvTu)}
#ov-root .H{color:var(--pvH)}
#ov-root .T{color:var(--pvT)}
#ov-root .E{color:var(--pvE)}
/* ── hubben ── */
#ov-root .seg{display:flex;background:rgba(255,255,255,.72);border-radius:14px;padding:3px;gap:3px}
#ov-root .seg button{flex:1;min-height:44px;border:0;border-radius:11px;background:transparent;font:800 14px Nunito;color:var(--soft);cursor:pointer}
#ov-root .seg button.on{background:var(--acc);color:#fff}
#ov-root .sec{font:900 12px Nunito;letter-spacing:.08em;color:var(--soft);margin:6px 4px 0}
#ov-root .tiles{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#ov-root .tile{display:flex;align-items:center;gap:10px;min-height:58px;border:0;border-radius:16px;background:rgba(255,255,255,.9);padding:8px 10px;text-align:left;font:800 14.5px/1.15 Nunito;color:var(--deep);cursor:pointer;box-shadow:0 2px 8px rgba(93,63,158,.08)}
#ov-root .tile b{flex:0 0 30px;height:30px;border-radius:10px;background:#3b8f82;color:#fff;display:flex;align-items:center;justify-content:center;font:800 15px 'Baloo 2'}
#ov-root .tile small{display:block;font:700 11.5px Nunito;color:var(--soft);margin-top:2px}
#ov-root .tile.later{opacity:.55;cursor:default}
#ov-root .tile.new{box-shadow:0 0 0 2px #a78bfa,0 2px 8px rgba(93,63,158,.08)}
/* ── kort division ── */
#ov-root .kd{display:flex;align-items:flex-end;justify-content:center;gap:6px;margin-top:4px}
#ov-root .fr{display:flex;flex-direction:column;align-items:stretch}
#ov-root .numrow{display:flex;align-items:flex-end;gap:9px;padding:0 2px 0 10px;border-bottom:3.5px solid var(--deep)}
#ov-root .dg{position:relative;width:30px;height:52px;display:flex;align-items:flex-end;justify-content:center;font:800 36px/1 'Baloo 2';border-radius:10px;transition:background .25s,box-shadow .25s}
#ov-root .dg .cap{position:absolute;top:-2px;left:0;right:0;text-align:center;font:900 10px Nunito}
#ov-root .dg.grp{background:#fff7ed;box-shadow:0 0 0 2.5px var(--org)}
#ov-root .dg.dim{opacity:.35}
#ov-root .rs{position:absolute;left:-21px;top:12px;min-width:24px;height:20px;padding:0 3px;border-radius:7px;font:800 15px/20px 'Baloo 2';color:var(--lila);text-align:center}
#ov-root .rs.slot{border:2px dashed #c4b5fd;background:#fff}
#ov-root .den{display:flex;justify-content:center;font:800 32px 'Baloo 2';color:var(--deep);padding-top:2px}
#ov-root .den span{background:#f3e8ff;border-radius:10px;padding:0 10px}
#ov-root .eqs{font:800 34px 'Baloo 2';color:var(--deep);padding-bottom:18px}
#ov-root .qbox{display:flex;align-items:flex-end;gap:4px;padding-bottom:12px}
#ov-root .box{position:relative;width:36px;height:48px;border-radius:12px;border:3px dashed #a7d8cf;background:#fff;display:flex;align-items:center;justify-content:center;font:800 30px 'Baloo 2'}
#ov-root .box .cap{position:absolute;top:-17px;left:0;right:0;text-align:center;font:900 10px Nunito}
#ov-root .box.focus{border-style:solid;border-color:#0f766e;box-shadow:0 0 0 3px var(--org)}
#ov-root .box.done{border-style:solid;border-color:#86efac;background:#f0fdf4}
#ov-root .box.rest{border-color:#c4b5fd;color:var(--lila)}
#ov-root .comma{font:800 26px 'Baloo 2';color:var(--deep);padding-bottom:6px}
#ov-root .restlab{font:900 12px Nunito;color:var(--lila);align-self:center;margin-bottom:-14px}
/* tankeraden: nämnarens tabell */
#ov-root .think{background:#faf5ff;border-radius:16px;padding:8px 10px;display:flex;flex-direction:column;gap:5px;min-height:92px}
#ov-root .think .tt{font:900 12px Nunito;color:var(--lila);letter-spacing:.04em}
#ov-root .row{display:flex;align-items:center;gap:8px;min-height:32px;padding:0 10px;border-radius:10px;font:800 21px 'Baloo 2';color:var(--deep);background:#fff;opacity:0;transform:translateY(6px);transition:opacity .35s,transform .35s,background .25s,box-shadow .25s;cursor:pointer;position:relative}
#ov-root .row.in{opacity:1;transform:none}
#ov-root .row .cmp{margin-left:auto;font:800 13px Nunito;color:var(--soft)}
#ov-root .row.over{color:#a8a29e}
#ov-root .row.over::after{content:"";position:absolute;left:8px;right:8px;top:50%;height:2.5px;background:#a8a29e;transform:scaleX(0);transform-origin:left;transition:transform .45s}
#ov-root .row.over.struck::after{transform:scaleX(1)}
#ov-root .row.pick{box-shadow:0 0 0 2.5px var(--lila);background:#f5f3ff}
#ov-root .row.nope{background:var(--peach)}
#ov-root .sub{display:flex;align-items:center;justify-content:center;gap:8px;font:800 22px 'Baloo 2';color:var(--deep);min-height:40px}
#ov-root .sub .box{width:auto;min-width:56px;height:44px;padding:0 6px}
/* knappar i kortet */
#ov-root .next{align-self:center;border:0;border-radius:16px;background:var(--acc);color:#fff;font:900 16px Nunito;min-height:46px;padding:0 22px;cursor:pointer;display:flex;align-items:center;gap:8px}
#ov-root .next svg{width:18px;height:18px}
#ov-root .ghost{align-self:center;border:2px solid #c4b5fd;border-radius:14px;background:#fff;color:var(--lila);font:900 14px Nunito;min-height:44px;padding:0 16px;cursor:pointer}
/* flygning */
.ov-fly{position:fixed;z-index:50;pointer-events:none;font:800 30px 'Baloo 2';color:var(--lila);transition:transform .7s cubic-bezier(.34,1.2,.4,1)}
/* ── trappan ── */
#ov-root .trap{display:grid;grid-template-columns:repeat(7,30px);grid-auto-rows:32px;justify-content:center;margin-top:2px}
#ov-root .c{display:flex;align-items:center;justify-content:center;font:800 24px 'Baloo 2';color:var(--deep);position:relative}
#ov-root .c.bt{border-top:3px solid var(--deep)}
#ov-root .c.Tu{color:var(--pvTu)}
#ov-root .c.H{color:var(--pvH)}
#ov-root .c.T{color:var(--pvT)}
#ov-root .c.E{color:var(--pvE)}
#ov-root .c.bl{border-left:3px solid var(--deep)}
#ov-root .c.ul{border-bottom:2.5px solid #94a3b8}
#ov-root .c.minus{color:var(--soft);font-size:20px}
#ov-root .c.lit{background:#fff7ed;border-radius:8px;box-shadow:0 0 0 2.5px var(--org)}
#ov-root .c.src{background:#f5f3ff;border-radius:8px;box-shadow:0 0 0 2.5px var(--lila)}
#ov-root .c.ghostc{color:transparent}
#ov-root .c.drop{animation:ov-drop .7s cubic-bezier(.34,1.2,.4,1)}
@keyframes ov-drop{from{transform:translateY(-64px)}to{transform:none}}
#ov-root .c.appear{animation:ov-fade .5s}
@keyframes ov-fade{from{opacity:0}to{opacity:1}}
#ov-root .mirror{display:flex;gap:10px;align-items:stretch;justify-content:center}
#ov-root .mirror .mini{background:#fff;border-radius:14px;padding:6px 10px;font:800 22px 'Baloo 2';color:var(--deep);display:flex;flex-direction:column;align-items:center;gap:2px}
#ov-root .mirror .mini small{font:900 11px Nunito;color:var(--soft)}
#ov-root .hl{background:#f5f3ff;border-radius:6px;box-shadow:0 0 0 2px var(--lila);color:var(--lila);padding:0 2px}
#ov-root .why{display:none;background:#f5f3ff;border-radius:14px;padding:6px 10px;font:800 13px/1.45 Nunito;color:var(--deep)}
#ov-root .why.on{display:block}
#ov-root .why>b{color:var(--lila);margin-right:2px}
#ov-root .mn{display:inline-block;vertical-align:-1px;margin:0 1px}
#ov-root .mn.note{width:17px;height:10px;border-radius:2px}
#ov-root .mn.coin{width:11px;height:11px;border-radius:50%}
#ov-root .mn.Tu{background:#a78bfa}
#ov-root .mn.H{background:#f87171}
#ov-root .mn.T{background:#60a5fa}
#ov-root .mn.E{background:#4ade80}
#ov-root .mx{font:800 12px Nunito;color:var(--soft);margin-left:3px}
#ov-root .dg.struck::before{content:"";position:absolute;left:3px;right:3px;top:60%;height:3px;background:#94a3b8;transform:rotate(-55deg);border-radius:2px}
#ov-root .dg.struck{opacity:.55}
#ov-root .rs.struck{opacity:.5;text-decoration:line-through}
#ov-root .box.ans{border-color:#22c55e;box-shadow:0 0 0 3px #bbf7d0,0 0 18px rgba(34,197,94,.45);transform:scale(1.07);transition:transform .4s,box-shadow .4s}
#ov-root .box.rest.ans{border-color:#7c3aed;box-shadow:0 0 0 3px #ddd6fe,0 0 18px rgba(124,58,237,.4)}
#ov-root .c.ans{background:#f0fdf4;border-radius:8px;box-shadow:0 0 0 2.5px #22c55e}
#ov-root .c.restans{background:#f5f3ff;border-radius:8px;box-shadow:0 0 0 2.5px #7c3aed}
#ov-root .c.pair,#ov-root .sm.pair{background:#fff7ed;border-radius:7px;box-shadow:0 0 0 2.5px var(--org);transition:box-shadow .3s}
#ov-root .answer{display:flex;align-items:baseline;justify-content:center;gap:6px;font:800 22px 'Baloo 2';color:var(--deep);background:#fff;border-radius:16px;padding:6px 14px;box-shadow:0 2px 10px rgba(93,63,158,.12)}
#ov-root .answer .aq{font-size:30px;color:#15803d}
#ov-root .answer .ar{font-size:30px;color:var(--lila)}
#ov-root .mini .sm{font-size:14px;color:var(--lila);padding:0 2px}
#ov-root .story{font:800 16px/1.45 Nunito;color:var(--deep);background:#fff;border-radius:16px;padding:10px 12px}
#ov-root .tok{display:inline-block;padding:0 6px;border-radius:8px;background:#f3e8ff;font-family:'Baloo 2';font-size:18px;transition:box-shadow .3s}
#ov-root .tok.litok{box-shadow:0 0 0 2.5px var(--lila)}
#ov-root .bar{display:flex;flex-direction:column;gap:3px}
#ov-root .barlab{text-align:center;font:800 15px 'Baloo 2';color:var(--lila)}
#ov-root .barrow{display:flex;gap:4px;height:40px}
#ov-root .barrow .seg1{flex:1;border-radius:10px;background:#ede9fe;border:2.5px solid #a78bfa}
#ov-root .barrow .part{flex:1;border-radius:10px;background:#f5f3ff;border:2.5px dashed #a78bfa;display:flex;align-items:center;justify-content:center;font:800 15px 'Baloo 2';color:var(--soft);animation:ov-fade .5s}
#ov-root .barrow .part.filled{background:#f0fdf4;border:2.5px solid #86efac;color:#15803d}
#ov-root .opts{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
#ov-root .opt{min-height:46px;min-width:110px;border:2.5px solid #ddd6fe;border-radius:14px;background:#fff;font:800 20px 'Baloo 2';color:var(--deep);cursor:pointer;padding:0 12px}
#ov-root .opt.bank{min-width:80px;font-size:17px}
#ov-root .opt.nope{background:var(--peach);border-color:#fdba74}
#ov-root .opt.okopt{border-color:#22c55e;background:#f0fdf4;color:#15803d}
#ov-root .opt.ring{box-shadow:0 0 0 3px #bbf7d0,0 0 14px rgba(34,197,94,.45);border-radius:50px}
#ov-root .ansbig{display:inline-block;font:800 26px 'Baloo 2';color:#15803d;background:#f0fdf4;border-radius:12px;padding:0 12px;box-shadow:0 0 0 3px #bbf7d0,0 0 16px rgba(34,197,94,.4)}
#ov-root .venn{width:100%;height:auto;background:#fff;border-radius:16px}
#ov-root .venn .sh{fill:none;stroke:#94a3b8;stroke-width:2.5}
#ov-root .venn .both{fill:#a78bfa;opacity:0;transition:opacity .6s}
#ov-root .venn .both.on{opacity:.28}
#ov-root .venn .vn circle{fill:#fff;stroke:#c4b5fd;stroke-width:2}
#ov-root .venn .vn text{text-anchor:middle;font:800 17px 'Baloo 2';fill:var(--deep)}
#ov-root .venn .vn{cursor:pointer;transition:opacity .4s}
#ov-root .venn .vn.out{opacity:.18}
#ov-root .venn .vn.nope circle{fill:var(--peach);stroke:#fdba74}
#ov-root .venn .vn.win circle{fill:#f0fdf4;stroke:#22c55e;stroke-width:3}
#ov-root .dzrow{display:flex;align-items:center;justify-content:center;gap:8px;font:800 30px 'Baloo 2';color:var(--deep);background:#fff;border-radius:16px;padding:6px 10px;position:relative}
#ov-root .dzrow small{position:absolute;left:10px;top:4px;font:900 10px Nunito;color:var(--soft);letter-spacing:.05em}
#ov-root .dzrow.orig{padding-top:16px}
#ov-root .dzrow.flip{padding-top:16px;background:#faf5ff}
#ov-root .dzn{min-width:30px;text-align:center}
#ov-root .dzq{display:inline-flex;align-items:center;justify-content:center;min-width:44px;height:44px;border-radius:12px;border:3px dashed var(--org);color:var(--org)}
#ov-root .dzn.ansq{color:#15803d;background:#f0fdf4;border-radius:12px;padding:0 8px;box-shadow:0 0 0 3px #bbf7d0,0 0 16px rgba(34,197,94,.4)}
#ov-root .dzrow .box{width:auto;min-width:76px;padding:0 6px}
#ov-root .carry{font:800 20px 'Baloo 2';color:var(--deep);background:#f0fdf4;border-radius:14px;padding:6px 14px;box-shadow:0 0 0 2px #bbf7d0}
#ov-root .carry b{color:#15803d}
#ov-root .dzrow.two{flex-direction:column;gap:4px;font-size:26px}
#ov-root .dzrow.two>div{display:flex;align-items:center;gap:8px}
#ov-root .dzrow.two .dzq{min-width:44px;height:36px}
#ov-root .dzrow.two .box{height:40px;font-size:24px}
#ov-root .dzrow.two{font-size:24px!important;gap:2px!important}
#ov-root .dzrow.flip.two{padding-top:14px}
#ov-root .heap{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;padding:5px 8px;border-radius:16px;border:2.5px dashed #fdba74;background:#fff7ed;cursor:pointer;min-height:40px}
#ov-root .ball{width:14px;height:14px;border-radius:50%;background:#475569;display:inline-block}
#ov-root .ball.gone{visibility:hidden;width:0;margin:0}
#ov-root .bags{display:flex;flex-wrap:wrap;gap:5px;justify-content:center}
#ov-root .bag{position:relative;display:flex;gap:2px;padding:11px 5px 5px;border-radius:12px;border:2.5px solid #a78bfa;background:#f5f3ff;transition:opacity .3s}
#ov-root .bag b{position:absolute;top:-10px;left:50%;transform:translateX(-50%);font:800 13px 'Baloo 2';background:#7c3aed;color:#fff;border-radius:10px;padding:0 6px}
#ov-root .ball.in{width:9px;height:9px}
#ov-root .gdiv{display:flex;align-items:center;justify-content:center;gap:6px;font:800 26px 'Baloo 2';color:var(--deep)}
#ov-root .frac2{display:flex;flex-direction:column;align-items:center;gap:3px}
#ov-root .frac2 .box{height:36px!important}
#ov-root .frac2 .fl{width:56px;height:3.5px;background:var(--deep);border-radius:2px}
#ov-root .gdiv .box{width:auto;min-width:48px;height:42px;padding:0 4px}
#ov-root .box .cap{white-space:nowrap}
#ov-root .tgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px}
#ov-root .trow{display:flex;align-items:center;justify-content:flex-end;gap:6px;font:800 20px 'Baloo 2';color:var(--deep);border-radius:12px;padding:2px 6px}
#ov-root .trow.on{background:#fff7ed;box-shadow:0 0 0 2px var(--org)}
#ov-root .trow .box{width:44px;height:38px;font-size:22px}
#ov-root .note{font:800 12.5px/1.35 Nunito;color:var(--soft);text-align:center}
/* ══ Själv med semistöd (brainstorm/17) ══ */
#ov-root .inp{cursor:pointer}
#ov-root .box.ans{border-style:solid;background:#f0fdf4}
#ov-root .box.rest.ans{background:#f5f3ff}
#ov-root .box.lead{opacity:.3}
#ov-root .box.miss,#ov-root .ri.miss,#ov-root .rs.miss,#ov-root .es.miss{background:var(--peach)!important;border-color:#fdba74!important}
#ov-root .rs.slot.inp::after{content:"";position:absolute;inset:-12px -5px}
#ov-root .rs.focus,#ov-root .ri.focus{border:2px solid #0f766e!important;box-shadow:0 0 0 2px var(--org)}
#ov-root .kd.self{margin-top:14px}
#ov-root .pad button:focus{outline:none}
#ov-root .kd.self .numrow{gap:15px;padding-left:16px}
#ov-root .kd.self .box{width:31px}
#ov-root .kd.self .dg{cursor:pointer;width:27px}
#ov-root .kd.self .rs{left:-18px;top:15px;min-width:17px;height:20px;padding:0 1px;font-size:15px;line-height:16px;border-radius:6px}
#ov-root .qwrap{display:flex;flex-direction:column;align-items:flex-end;gap:12px;padding-bottom:4px}
#ov-root .qrow{display:flex;gap:3px}
#ov-root .rrow{display:flex;align-items:center;gap:6px;font:900 13px Nunito;color:var(--lila)}
#ov-root .tools{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
#ov-root .tool{min-height:44px;border:2px solid #c4b5fd;border-radius:14px;background:#fff;color:var(--lila);font:900 14px Nunito;padding:0 14px;cursor:pointer}
#ov-root .tool small{font:800 11px Nunito;color:var(--soft);margin-left:2px}
#ov-root .tool.on{background:#f5f3ff;border-color:var(--lila)}
#ov-root .tool:disabled{opacity:.5;cursor:default}
#ov-root .ask .hint{display:block;font:900 11.5px Nunito;color:var(--lila);letter-spacing:.06em}
#ov-root .ask .kv{display:block;font:800 12.5px/1.3 Nunito;color:var(--soft);margin-top:2px}
#ov-root .actrow{display:flex;justify-content:center}
#ov-root .actrow:empty{display:none}
#ov-root #grpcard .sub:empty{display:none}
/* tomma rader tar ingen plats, så att kladden behåller 100 px */
#ov-root .remsa{background:#faf5ff;border-radius:14px;padding:6px 8px 8px}
#ov-root .remsa .tt{font:900 11.5px Nunito;color:var(--lila);letter-spacing:.04em;margin-bottom:3px}
#ov-root .rg{display:grid;grid-template-columns:repeat(10,1fr);gap:3px}
#ov-root .rc{display:flex;flex-direction:column;align-items:center;gap:1px}
#ov-root .rc small{font:800 11px Nunito;color:var(--soft)}
#ov-root .ri{width:100%;height:30px;border-radius:8px;border:2px dashed #c4b5fd;background:#fff;display:flex;align-items:center;justify-content:center;font:800 17px 'Baloo 2';color:var(--deep)}
#ov-root .box.tb{width:auto;height:27px;align-self:start;border-width:2px;border-radius:8px;font-size:21px;justify-content:flex-end;padding:0 6px;margin:0 1px;z-index:1}
#ov-root .box.tb.ans{transform:none}
#ov-root .box.sm{width:auto;min-width:52px;height:42px;font-size:24px;padding:0 6px}
#ov-root .c.tapme{cursor:pointer}
#ov-root .c.moved{opacity:.35}
#ov-root #flips .dzrow.flip{padding:4px 8px 4px 82px;font-size:26px;min-height:50px}
#ov-root #flips .dzrow.flip small{top:50%;transform:translateY(-50%);width:68px;line-height:1.25}
#ov-root #flips .box.sm{height:38px}
#ov-root .kgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
#ov-root .kgrid .dzrow{padding:16px 4px 6px!important;gap:4px!important;font-size:21px!important}
#ov-root .kgrid .dzrow.two>div{height:42px;display:flex;align-items:center;justify-content:center;gap:4px;padding:0 4px;border-radius:12px}
#ov-root .kgrid .box,#ov-root .kgrid .box.sm{min-width:38px!important;height:36px!important;font-size:21px!important;padding:0 4px}
#ov-root .kgrid .dzq{min-width:32px!important;height:32px!important}
#ov-root .kgrid .dzn{min-width:0}
#ov-root .kgrid .fop{font-size:21px;min-width:8px}
#ov-root .fop{font:800 26px 'Baloo 2';color:var(--lila);min-width:18px;text-align:center}
#ov-root .dzrow.two>div.on{background:#fff7ed;border-radius:12px;box-shadow:0 0 0 2.5px var(--org);padding:2px 8px}
#ov-root .dzrow.two>div{padding:2px 8px}
#ov-root .dz0{font-style:normal;position:relative;cursor:pointer}
#ov-root .dz0.struck::after{content:"";position:absolute;left:-1px;right:-1px;top:52%;height:3px;background:#94a3b8;transform:rotate(-55deg);border-radius:2px}
#ov-root .dz0.struck{opacity:.5}
#ov-root .venn .vn .xx{stroke:#3b1d6e;stroke-width:4;stroke-linecap:round;opacity:0;transition:opacity .25s}
#ov-root .venn .vn.x .xx{opacity:1}
#ov-root .venn .vn.x circle{fill:#e2e8f0;stroke:#94a3b8}
#ov-root .venn .vn.x text{opacity:.3}
#ov-root .venn .ripple{fill:none;stroke:#7c3aed;stroke-width:3;opacity:0;transform-box:fill-box;transform-origin:center;pointer-events:none}
#ov-root .venn .ripple.go{animation:ov-ripple .9s ease-out 2}
@keyframes ov-ripple{from{transform:scale(.6);opacity:.9}to{transform:scale(1.7);opacity:0}}
#ov-root .vlegend{display:flex;align-items:center;justify-content:center;gap:6px;font:900 14px Nunito;color:var(--lila)}
#ov-root .vlegend svg{width:34px;height:34px}
#ov-root .vlegend svg.arr{width:22px;height:22px}
#ov-root .vdots{display:flex;gap:5px;justify-content:center;align-items:center}
#ov-root .vdots i{width:16px;height:16px;border-radius:50%;border:2px solid #c4b5fd;background:#fff;position:relative;transition:background .25s}
#ov-root .vdots i.x{background:#e2e8f0;border-color:#94a3b8}
#ov-root .vdots i.x::before,#ov-root .vdots i.x::after{content:"";position:absolute;left:-1px;right:-1px;top:5px;height:2.5px;background:#3b1d6e;border-radius:2px;transform:rotate(45deg)}
#ov-root .vdots i.x::after{transform:rotate(-45deg)}
#ov-root .vdots i.one{border-color:#22c55e;box-shadow:0 0 0 3px #bbf7d0}
#ov-root .vdots b{font:900 13px Nunito;color:var(--soft);margin-left:6px}
#ov-root .ball.sel{background:var(--lila);box-shadow:0 0 0 2px #ddd6fe}
#ov-root .heap.self{cursor:default}
#ov-root .heap.self .ball{cursor:pointer;width:18px;height:18px}
#ov-root .bag.self{padding:6px}
#ov-root .expr{display:flex;justify-content:center;gap:8px;align-items:center}
#ov-root .es{min-width:76px;height:46px;border-radius:12px;border:3px dashed #a7d8cf;background:#fff;display:flex;align-items:center;justify-content:center;font:800 24px 'Baloo 2';color:var(--deep);cursor:pointer}
#ov-root .es.op{min-width:46px}
#ov-root .opsb{display:flex;gap:8px;justify-content:center}
#ov-root .opsb button{width:56px;height:46px;border-radius:14px;border:2.5px solid #ddd6fe;background:#fff;font:800 24px 'Baloo 2';color:var(--deep);cursor:pointer}
#ov-root .tok.tap{cursor:pointer;box-shadow:0 0 0 2px #c4b5fd;border:0;color:var(--deep);font-weight:800;min-height:32px;padding:0 10px;margin:2px 0;touch-action:manipulation}
#ov-root .es.op{border-style:dashed;padding:0}
#ov-root .expr .box.sm{min-width:80px;height:46px}
#ov-root .kctl{display:flex;align-items:center;justify-content:center;gap:6px;font:800 22px 'Baloo 2';color:var(--deep);background:#fff;border-radius:16px;padding:16px 8px 6px;position:relative}
#ov-root .kctl small{position:absolute;left:10px;top:3px;font:900 10px Nunito;color:var(--soft);letter-spacing:.05em}
#ov-root .kctl .box.sm{min-width:44px}
#ov-root .selfb{font:900 10px Nunito;background:#ede9fe;color:var(--lila);border-radius:7px;padding:2px 5px;vertical-align:1px}
#ov-root .prog{white-space:nowrap;min-width:0!important;padding:10px 10px!important}
#ov-root .ttl{white-space:nowrap}
/* ══ lägen: telefon och iPad, stående och liggande (brainstorm/17 varv 3) ══ */
#ov-root .kbtn{display:none!important}
#ov-root .app.pl{max-width:none;display:grid;grid-template-columns:1fr minmax(220px,34%);grid-template-rows:auto 1fr;gap:6px 12px}
#ov-root .app.pl>.top{grid-column:1/-1}
#ov-root .app.pl>.card{grid-column:1;grid-row:2;min-height:0;overflow:hidden;display:block}
#ov-root .app.pl>.pad{grid-column:2;grid-row:2;align-self:start}
#ov-root .app.pl>.kladd{display:none}
#ov-root .app.pl .kbtn{display:flex!important}
#ov-root .app.pl.klopen>.pad{display:none}
#ov-root .app.pl.klopen>.kladd{display:flex;grid-column:2;grid-row:2}
#ov-root .app.ip{max-width:none;padding:16px 24px 24px;gap:12px}
#ov-root .app.ip>.card,#ov-root .app.ip>.pad,#ov-root .app.ip>.top{width:100%;max-width:620px;align-self:center}
#ov-root .app.ip .pad button,#ov-root .app.il .pad button{height:60px;font-size:28px;border-radius:16px}
#ov-root .app.il{max-width:none;display:grid;grid-template-columns:1fr 440px;grid-template-rows:auto auto 1fr;gap:12px 20px;padding:16px 24px 24px}
#ov-root .app.il>.top{grid-column:1/-1}
#ov-root .app.il>.card{grid-column:1;grid-row:2/4;align-self:start;max-height:100%;overflow:auto}
#ov-root .app.il>.pad{grid-column:2;grid-row:2}
#ov-root .app.il>.kladd{grid-column:2;grid-row:3}
#ov-root .app.hubv.pl,#ov-root .app.hubv.il{display:flex;overflow:auto}
/* ── i appen: märken i hubben, kvittot, kladdens knappar, telefon liggande ── */
#ov-root .tile em.badge{margin-left:auto;font:900 11px Nunito;font-style:normal;background:#fef3c7;color:#92400e;border-radius:8px;padding:2px 6px;align-self:flex-start}
#ov-root .tile em.badge.g{background:#dcfce7;color:#166534}
#ov-root .tile{position:relative}
#ov-root .kvcard{align-items:center;gap:12px;padding:22px 16px}
#ov-root .kvbig{display:flex;align-items:center;gap:10px;font:800 54px 'Baloo 2';color:var(--deep)}
#ov-root .kvbig small{font-size:28px;color:var(--soft)}
#ov-root .kvbig svg{width:44px;height:44px;color:#16a34a}
#ov-root .kvnote{font:900 16px/1.35 Nunito;color:#134e4a;text-align:center}
#ov-root .kvbtns{display:flex;flex-direction:column;gap:8px;align-items:center}
#ov-root .kladd .scbar{display:flex;align-items:center;gap:5px}
#ov-root .kladd .kl{flex:1;font:900 12px Nunito;color:#134e4a;letter-spacing:.05em}
#ov-root .scb{width:44px;height:36px;border-radius:10px;border:2px solid #cfe9e3;background:#fff;display:flex;align-items:center;justify-content:center;color:#134e4a;cursor:pointer;padding:0}
#ov-root .scb.on{background:#3b8f82;border-color:#3b8f82;color:#fff}
#ov-root .scb.off{opacity:.35}
#ov-root .scb svg{width:20px;height:20px}
#ov-root .kcanvas{flex:1;min-height:40px;width:100%;display:block;touch-action:none;cursor:crosshair;border:2px dashed #bfe0d9;border-radius:14px;background:rgba(255,255,255,.5)}
#ov-root svg{display:inline-block;vertical-align:middle}
#ov-root .pad .wide,#ov-root .next{display:flex;align-items:center;justify-content:center;gap:6px}
/* kort division med hjälp ryms också på 375 px breda telefoner */
#ov-root .kd:not(.self) .numrow{gap:6px}
#ov-root .kd:not(.self) .qbox{gap:2px}
#ov-root .kd:not(.self) .qbox .box{width:33px}
#ov-root .kd:not(.self) .dg{width:27px}
@media (max-width:389px){#ov-root .card{padding:10px 8px}#ov-root .kd.self .numrow{gap:12px}}
#ov-root .cardin{display:contents}
#ov-root .app.pl .cardin{display:flex;flex-direction:column;gap:6px;transform-origin:top center}
#ov-root .app.fitv>.card{overflow:hidden;display:block}
#ov-root .app.pl .venn{max-width:250px;align-self:center}
#ov-root .app.fitv .cardin{display:flex;flex-direction:column;gap:6px;transform-origin:top center}

`;

const $ = (s, r = app) => r.querySelector(s);
let app = null;   /* sätts i open() */
let SPEED = 1;   /* 1 i appen; genomspelningen i webbläsaren kör snabbare via _speed */
/* GEN räknas upp för varje ny vy. En paus eller flygning från en vy som lämnats (Avsluta mitt i en animation) slutar
   tyst i stället för att fortsätta i nästa vy. */
let GEN = 0;
const W = ms => { const g = GEN; return new Promise(r => setTimeout(() => { if (g === GEN) r(); }, ms * SPEED)); };
const PACE = 900; /* barnets takt: en förflyttning åt gången (Dennis: "för fort och osynkat") */
const ic = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  erase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M8 5h12v14H8l-6-7z"/><path d="M11 9l6 6M17 9l-6 6" stroke-linecap="round"/></svg>'
};
let view = 'hub';

/* ── gemensamt: knappsats och kladd (övningsbladens, D48) ── */
let padHandler = null, typed = '';
function padHTML(label = 'Svara') {
  const k = [1,2,3,4,5,6,7,8,9,0].map(n => `<button data-k="${n}">${n}</button>`).join('');
  return `<div class="pad" id="pad">${k}<button class="er" data-k="e" aria-label="Sudda">${ic.erase}</button><button class="wide" data-k="ok">${ic.check} ${label}</button></div>`;
}
/* kladdHTML() och ritkoden finns längre ner (appens kladd, D48) */
function bindApp() {
app.addEventListener('click', e => {
  const b = e.target.closest('[data-k]'); if (!b || !padHandler) return;
  const k = b.dataset.k;
  if (k === 'e') typed = typed.slice(0, -1);
  else if (k === 'ok') { padHandler(typed); return; }
  else if (typed.length < 5) typed += k;
  const f = $('.inp.focus') || $('.box.focus'); if (f) setVal(f, typed);
  if (SF && SF.onType) SF.onType();
  else if (SF && padHandler === sfOk) sfLabel();
  else { const ok = $('#pad .wide'); if (ok) ok.classList.toggle('go', typed.length > 0); }
});
app.addEventListener('click', e => {   /* telefon liggande: kladden bakom en knapp, över knappsatsen */
  const k = e.target.closest('[data-kl]'); if (!k) return;
  const on = app.classList.toggle('klopen'); k.textContent = on ? 'Knappar' : 'Kladd';
  if (on) requestAnimationFrame(scSync);
});
app.addEventListener('click', e => {   /* kladdens knappar */
  const b = e.target.closest('[data-sc]'); if (!b) return;
  ({ pen: () => scTool(false), erase: () => scTool(true), undo: scUndo, redo: scRedo, clear: scClear })[b.dataset.sc]();
});
}

/* ══ Själv med semistöd (brainstorm/17): appen ger det pappret ger – uppställningen, platsen, att stryka och kryssa –
   men aldrig tanken: ingen pil, ingen varför-rad, inga tabellrader, ingen rättning ruta för ruta. Knappen heter
   "Nästa ruta" tills allt är ifyllt och sedan "Klar" (D39 ✎). Vid Klar blir rutor som inte stämmer persika och töms.
   Ledtråd högst två gånger per uppgift, och kvittot visar det. Strykningar, restrutor och räkneremsa rättas aldrig. ══ */
let MODE = 'help', LEVEL = 'hard', SF = null;
const SELF = () => MODE === 'self';
function setVal(el, v) {
  let s = el.querySelector('.v'); if (!s) { s = document.createElement('span'); s.className = 'v'; el.appendChild(s); }
  s.textContent = v; if (v !== '') el.classList.remove('miss');
}
const getVal = el => { const s = el && el.querySelector('.v'); return s ? s.textContent : ''; };
const toolsHTML = (extra = '') => `<div class="tools">${extra}<button class="tool" id="hintBtn">Ledtråd <small>2 kvar</small></button></div>`;
const remsaBtn = '<button class="tool" id="remsaBtn">Räkneremsa</button>';
function remsaHTML(d) {   /* barnet skriver nämnarens tabell själv; den rättas inte */
  return `<div class="remsa" id="remsa" hidden><div class="tt">${d}:ANS TABELL – SKRIV SJÄLV</div><div class="rg">${[1,2,3,4,5,6,7,8,9,10].map(m => `<div class="rc"><small>·${m}</small><span class="ri" id="ri${m}"></span></div>`).join('')}</div></div>`;
}
function sfInit(o) {
  SF = { tries: 0, boxes: [], acc: o.acc || { miss: false, hints: 0 }, hint: o.hint, onRight: o.onRight, grow: o.grow, more: o.more };
  sfAdd(o.boxes || []);
  sfAdd([...app.querySelectorAll('.ri')].map(el => ({ el, chain: false, need: false })));
  padHandler = sfOk;
  const hb = $('#hintBtn'); if (hb) { hb.onclick = sfHint; sfHintLabel(); }
  const rb = $('#remsaBtn'); if (rb) rb.onclick = () => { const r = $('#remsa'); r.hidden = !r.hidden; rb.classList.toggle('on', !r.hidden); };
  const first = SF.boxes.find(b => b.chain); if (first) sfFocus(first.el); else sfLabel();
}
function sfAdd(list) {
  list.forEach(b => {
    b = { chain: true, need: true, ...b };
    b.el.classList.add('inp');
    b.el.onclick = e => { e.stopPropagation(); if (SF && !SF.done) sfFocus(b.el); };
    SF.boxes.push(b);
  });
  sfLabel();
}
function sfFocus(el) {
  if (!el) return;
  app.querySelectorAll('.focus').forEach(x => x.classList.remove('focus'));
  el.classList.add('focus'); typed = getVal(el); sfLabel();
}
const sfFull = () => SF.boxes.every(b => !b.need || getVal(b.el) !== '') && !(SF.more && SF.more());
function sfLabel() {
  const w = $('#pad .wide'); if (!w || !SF || SF.done) return;
  const k = sfFull(); w.innerHTML = `${ic.check} ${k ? 'Klar' : 'Nästa ruta'}`; w.classList.toggle('go', k);
}
function sfOk() {
  if (!SF || SF.done) return;
  if (sfFull()) return sfCheck();
  const i = SF.boxes.findIndex(b => b.el.classList.contains('focus'));
  const empty = b => b.chain && b.need && getVal(b.el) === '';
  let nx = SF.boxes.find((b, j) => j > i && empty(b));
  if (!nx && SF.grow && SF.grow()) return;
  nx = nx || SF.boxes.find(empty) || SF.boxes.find(b => b.need && getVal(b.el) === '');
  if (nx) sfFocus(nx.el);
}
const kvText = () => `Kvittot: ${SF.acc.miss ? 'rätt efter nytt försök' : 'rätt på första försöket'} · ${SF.acc.hints ? `med ${SF.acc.hints} ledtråd${SF.acc.hints > 1 ? 'ar' : ''}` : 'utan ledtråd'}`;
function sfCheck() {
  SF.tries++;
  const bad = SF.boxes.filter(b => b.ok && !b.ok(getVal(b.el)));
  if (bad.length) {
    SF.acc.miss = true;
    bad.forEach(b => { setVal(b.el, ''); b.el.classList.add('miss'); });
    ask(`<span class="soft">Inte riktigt – försök igen.</span>${bad.length === 1 ? 'Rutan som blev tom stämmer inte.' : `De ${bad.length} rutorna som blev tomma stämmer inte.`}`);
    sfFocus(bad[0].el); return;
  }
  SF.done = true; padHandler = null;
  app.querySelectorAll('.focus').forEach(x => x.classList.remove('focus'));
  const w = $('#pad .wide'); if (w) w.classList.remove('go');
  const tl = $('.tools'); if (tl) tl.style.display = 'none';   /* klart: verktygen gör ingen nytta längre */
  SF.onRight(kvText());
}
function sfHintLabel() {
  const hb = $('#hintBtn'); if (!hb || !SF) return;
  const left = 2 - SF.acc.hints;
  hb.innerHTML = left > 0 ? `Ledtråd <small>${left} kvar</small>` : 'Inga ledtrådar kvar';
  hb.disabled = left <= 0 || !!SF.done;
}
function sfHint() {
  if (!SF || SF.done || SF.acc.hints >= 2) return;
  SF.acc.hints++;
  ask(`<span class="hint">LEDTRÅD ${SF.acc.hints}</span>${SF.hint(SF.acc.hints)}`);
  sfHintLabel();
}
/* Ledtråden i kort division och trappan: 1 = frågan för steget man står på (var man börjar), 2 = raden i tabellen
   som är för stor. Aldrig svaret. Steget = första kvotsiffran som är tom. */
function stepHint(n, qOf, light) {
  const cs = P.steps.find(s => getVal(qOf(s)) === '') || P.steps[0];
  if (n === 1) {
    if (light) light(cs);
    return `${cs === P.steps[0] && cs.i > 0 ? `${D} får inte plats i ${N[0]}. ` : ''}Hur många gånger får ${D} plats i <b>${cs.cur}</b>?`;
  }
  return `En rad ur ${D}:ans tabell: ${D} · ${cs.q + 1} = ${D * (cs.q + 1)}. Den är större än ${cs.cur}.`;
}
/* Restrutan behöver inte fyllas för att Klar ska komma: går det jämnt ut är tom ruta (eller 0) rätt, annars rättas
   den vid Klar. Annars fastnar barnet på "Nästa ruta" när det inte skriver 0 (Dennis 12/11, 2856 / 4). */
const restOk = r => v => v === String(r) || (r === 0 && v === '');

/* Flyg ett känt tal från ett element till ett annat (bandet/flygningen flyttar bara kända tal).
   Ordningen är alltid: pilen ritas (barnet ser vart), en paus, sedan glider talet längs pilen. Dennis: "animationer där
   siffror flyttas i förklarande steg eller pilar … är superbra", men inte för snabbt. */
const ov = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
ov.setAttribute('style', 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:40;overflow:visible');
ov.innerHTML = '<defs><marker id="ov-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#7c3aed"/></marker></defs>';
document.body.appendChild(ov);
function arrow(a, b) {
  const x1 = a.left + a.width / 2, y1 = a.top + a.height / 2, x2 = b.left + b.width / 2, y2 = b.top + b.height / 2;
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  const p1 = Math.min(a.width, a.height) / 2 + 4, p2 = Math.min(b.width, b.height) / 2 + 6;   /* utanför rutorna */
  const sx = x1 + dx / len * p1, sy = y1 + dy / len * p1, ex = x2 - dx / len * p2, ey = y2 - dy / len * p2;
  let nx = -dy / len, ny = dx / len; if (ny > 0) { nx = -nx; ny = -ny; }   /* böj alltid uppåt, bort från raden under */
  const bend = Math.min(36, len / 4), mx = (sx + ex) / 2 + nx * bend, my = (sy + ey) / 2 + ny * bend;
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', `M${sx} ${sy} Q${mx} ${my} ${ex} ${ey}`);
  p.setAttribute('fill', 'none'); p.setAttribute('stroke', '#7c3aed'); p.setAttribute('stroke-width', '3');
  p.setAttribute('stroke-dasharray', '6 6'); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('marker-end', 'url(#ov-ah)');
  ov.appendChild(p); p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
  return { p, mx, my };
}
async function fly(from, to, text) {
  const gen = GEN;
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  const ar = arrow(a, b);
  await W(PACE);                                            /* först pilen: vart ska talet? */
  const f = document.createElement('div'); f.className = 'ov-fly'; f.textContent = text; f.style.transition = 'none';
  document.body.appendChild(f);
  const fw = f.getBoundingClientRect();
  const ax = a.left + a.width / 2, ay = a.top + a.height / 2, bx = b.left + b.width / 2, by = b.top + b.height / 2;
  f.style.left = (ax - fw.width / 2) + 'px'; f.style.top = (ay - fw.height / 2) + 'px';
  const t0 = performance.now(), dur = PACE * 1.3 * SPEED;
  await new Promise(res => {
    const step = now => {
      let t = Math.min(1, (now - t0) / dur); t = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const x = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * ar.mx + t * t * bx, y = (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * ar.my + t * t * by;
      f.style.transform = `translate(${x - ax}px,${y - ay}px)`;
      if (gen !== GEN) { f.remove(); ar.p.remove(); return; }
      if (t < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
  f.remove(); await W(250); ar.p.remove();
}


/* ── Kort division och trappan med samma tal: 5736 / 7 = 819, rest 3 (D47 ✎: ensiffrig nämnare, större tal) ── */
let N = '5736', D = 7;
/* platsvärdena räknas från talets längd: i ett tresiffrigt tal är första siffran hundratal, inte tusental */
const CLS4 = ['Tu','H','T','E'], CAP = { Tu:'T', H:'H', T:'T', E:'E' };
const PLACE4 = ['tusental','hundratal','tiotal','ental'];
let CLS = CLS4, PLACE = PLACE4;
/* Stegen räknas fram ur talet, så att samma motor bär alla tal */
const plan = (n, d) => O.plan(n, d);
let P = plan(N, D);
function setTask(n, d) { N = String(n); D = d; P = plan(N, D); const o = 4 - N.length; CLS = CLS4.slice(o); PLACE = PLACE4.slice(o); MONEY = MONEY4.slice(o); }
let KD = {};
/* ny vy: gamla pilar och flygande tal bort, och väntande animationer från förra vyn slutar */
function clearFx() { GEN++; ov.querySelectorAll(':scope > path').forEach(p => p.remove()); document.querySelectorAll('.ov-fly').forEach(e => e.remove()); }
function kdShell(title) {
  clearFx(); SF = null; app.classList.remove('hubv', 'klopen');
  return `<div class="top"><button class="back" data-hub>${ic.back}Avsluta</button><div class="ttl">${title}</div><button class="back kbtn" data-kl>Kladd</button><div class="prog">${SELF() ? '<small class="selfb">Själv</small> ' : ''}${RUN ? `${RUN.i + 1}/${RUN.tasks.length}` : ''}</div></div>`;
}
const ask = (html) => { $('#ask').innerHTML = html; };
const act = (html, fn) => { const a = $('#act'); a.innerHTML = html; const b = a.querySelector('button'); if (b && fn) b.onclick = fn; };
const nextBtn = (label = 'Nästa') => `<button class="next">${label} ${ic.next}</button>`;
const waitNext = (label) => new Promise(res => act(nextBtn(label), () => { act(''); res(); }));
async function showRows(rows, target) {
  const th = $('#think'); th.querySelectorAll('.row').forEach(r => r.remove());
  for (const m of rows) {
    const p = D * m, over = p > target;
    th.insertAdjacentHTML('beforeend', `<div class="row${over ? ' over' : ''}" data-m="${m}">${D} · <span class="m">${m}</span> = ${p}<span class="cmp">${over ? 'större än ' + target : 'får plats'}</span></div>`);
    const r = th.lastElementChild; await W(60); r.classList.add('in');
    await W(PACE);
    if (over) { r.classList.add('struck'); await W(PACE / 2); }
  }
}
function pickRow(target, right) {
  return new Promise(res => {
    ask(`Hur många gånger får ${D} plats i <b>${target}</b>? Tryck på raden.`);
    $('#think').querySelectorAll('.row').forEach(r => r.onclick = () => {
      const m = +r.dataset.m;
      if (m === right) { r.classList.add('pick'); $('#think').querySelectorAll('.row').forEach(x => x.onclick = null); res(r); }
      else { ERR = true; r.classList.add('nope'); setTimeout(() => r.classList.remove('nope'), 900);
        ask(`<span class="soft">Inte riktigt – försök igen.</span>${D * m > target ? `${D * m} är större än ${target}.` : `Det finns en rad som får plats.`}`); }
    });
  });
}
function typeAnswer(box, right, q) {
  return new Promise(res => {
    app.querySelectorAll('.box').forEach(b => b.classList.remove('focus'));
    box.classList.add('focus'); typed = ''; box.textContent = '';
    padHandler = v => {
      if (v !== '' && +v === right) { padHandler = null; box.classList.remove('focus'); box.classList.add('done'); $('#pad .wide').classList.remove('go'); res(); }
      else { ERR = true; ask(`<span class="soft">Inte riktigt – försök igen.</span>${q}`); typed = ''; box.textContent = ''; }
    };
  });
}
const rows2 = s => [s.q, s.q + 1];   /* raden som passar och raden som är för stor (också 7 · 10) */

/* ── kort division ── */
function kdView(o) {
  view = 'kd'; typed = ''; padHandler = null;
  KD = o || {}; if (KD.task) setTask(KD.task.n, KD.task.d);
  if (SELF()) return kdSelf();
  const nq = N.length - P.start;
  app.innerHTML = kdShell(KD.title || 'Kort division') + `
  <div class="card" id="card">
    <div class="ask" id="ask"></div>
    <div class="why" id="why"></div>
    <div class="kd">
      <div class="fr">
        <div class="numrow">${[...N].map((d, i) => `<div class="dg ${CLS[i]}" id="d${i}"><span class="cap ${CLS[i]}">${CAP[CLS[i]]}</span>${d}${i > 0 ? `<span class="rs" id="rs${i}"></span>` : ''}</div>`).join('')}</div>
        <div class="den"><span>${D}</span></div>
      </div>
      <div class="eqs">=</div>
      <div class="qbox">${P.steps.map(s => `<div class="box" id="q${s.i}"><span class="cap ${CLS[s.i]}">${CAP[CLS[s.i]]}</span></div>`).join('')}<span class="comma">,</span><div class="box rest" id="qR"><span class="cap" style="color:var(--lila)">rest</span></div></div>
    </div>
    <div class="think" id="think"><div class="tt">${D}:ANS TABELL</div></div>
    <div class="sub" id="sub"></div>
    <div id="act" style="display:flex;justify-content:center;min-height:46px"></div>
  </div>` + padHTML() + kladdHTML();
  afterRender();
  kdRun();
}
function grp(ix) { app.querySelectorAll('.dg').forEach((d, i) => { d.classList.toggle('grp', ix.includes(i)); d.classList.toggle('dim', ix.length > 0 && i < Math.min(...ix)); }); }
/* ── Varför? Pengar gör talsorterna konkreta: tusenlappar, hundralappar, tior och kronor, i platsvärdets färger.
   Dennis: "jag förstår inte 'varför' siffrorna flyttas som de görs … mera förklaringar". Varje flytt får en mening. */
const MONEY4 = [
  { one:'tusenlapp', many:'tusenlappar', cls:'Tu', k:'note' }, { one:'hundralapp', many:'hundralappar', cls:'H', k:'note' },
  { one:'tia', many:'tior', cls:'T', k:'coin' }, { one:'krona', many:'kronor', cls:'E', k:'coin' }];
let MONEY = MONEY4;
const nm = (n, i) => `${n} ${n === 1 ? MONEY[i].one : MONEY[i].many}`;
function iconsM(n, m, max = 14) {
  const one = `<i class="mn ${m.k} ${m.cls}"></i>`;
  return n <= max ? one.repeat(n) : `${one.repeat(3)}<span class="mx">… ${n} st</span>`;
}
const icons = (n, i, max) => iconsM(n, MONEY[i], max);
function why(html) { const w = $('#why'); if (w) { w.innerHTML = html ? `<b>Varför?</b> ${html}` : ''; w.classList.toggle('on', !!html); } }
/* Texterna böjs efter talet (1 tusenlapp → "den", 2 tior → "de"), och en nolla blir "inga" (språksvepet 12/11) */
const den = n => n === 1 ? 'den' : 'de', Den = n => n === 1 ? 'Den' : 'De', dem = n => n === 1 ? 'den' : 'dem';   /* subjekt de, objekt dem */
const have = (n, i) => n ? `Med ${nm(n, i)} som vi redan har blir det` : `Vi har inga andra ${MONEY[i].many}, så det blir`;
function startWhy() {
  const s0 = P.steps[0];
  if (s0.i === 0) return `Tänk att ${N} kr ska delas lika mellan ${D}. Vi börjar med ${MONEY[0].many}.`;
  const a = P.ds[0];
  return `Tänk att ${N} kr ska delas lika mellan ${D}. ${nm(a, 0)} ${icons(a, 0)} räcker inte till ${D}.
    Vi växlar ${dem(a)} till ${a * 10} ${MONEY[1].many}. ${have(P.ds[1], 1)} ${s0.cur} ${MONEY[1].many}.`;
}
const giveWhy = s => `Varje person får ${nm(s.q, s.i)}. Därför står ${s.q} i ${PLACE[s.i]}et.`;
const prodWhy = s => `${D} personer får ${s.q} var: ${D} · ${s.q} = ${s.p} ${MONEY[s.i].many} delas ut.`;
const restWhy = s => s.r === 0 ? `Allt gick jämnt ut – inget blir kvar av ${MONEY[s.i].many}.`
  : s.last ? `${nm(s.r, s.i)} ${icons(s.r, s.i)} blir kvar. ${Den(s.r)} räcker inte till alla, så det är resten.`
  : `${nm(s.r, s.i)} ${icons(s.r, s.i)} räcker inte till alla ${D}. ${Den(s.r)} ska inte slängas – ${den(s.r)} växlas.`;
const swapWhy = s => { const nx = P.ds[s.i + 1];
  return `${nm(s.r, s.i)} ${icons(s.r, s.i)} växlas till ${s.r * 10} ${MONEY[s.i + 1].many} ${icons(s.r * 10, s.i + 1)}.
    ${have(nx, s.i + 1)} ${s.r * 10 + nx} ${MONEY[s.i + 1].many}.`; };

async function kdRun() {
  const s0 = P.steps[0];
  const first = [...N].slice(0, s0.i + 1).join('');
  ask(s0.i > 0 ? `${D} får inte plats i ${N[0]}. Vi börjar med <b>${first}</b> ${PLACE[s0.i]}.` : `Vi börjar med <b>${first}</b> ${PLACE[0]}.`);
  why(startWhy());
  await W(PACE); grp([...Array(s0.i + 1).keys()]);
  for (const s of P.steps) {
    await waitNext(`Visa ${D}:ans tabell`);
    why('');
    ask(`Hur många gånger får ${D} plats i <b>${s.cur}</b>? Titta i tabellen.`);
    await showRows(rows2(s), s.cur);
    const r = await pickRow(s.cur, s.q);
    ask(`<span class="ok">Rätt!</span>${D} · ${s.q} = ${s.p}. ${s.q} skrivs i ${PLACE[s.i]}et.`);
    why(giveWhy(s));
    await W(PACE / 2); await fly(r.querySelector('.m'), $('#q' + s.i), String(s.q));
    $('#q' + s.i).insertAdjacentText('beforeend', s.q); $('#q' + s.i).classList.add('done');
    await waitNext();
    if (s.r === 0) {
      /* går det jämnt ut behövs ingen subtraktion (Dennis: "om det går jämt ut behövs inte 28-28") */
      ask(`${D} · ${s.q} = ${s.p}, precis lika mycket som ${s.cur}. Inget blir över.`);
      $('#sub').innerHTML = `<div class="box done" id="sb" style="visibility:hidden">0</div>`;
    } else {
      const q = `Hur mycket blir över? Räkna ${s.cur} − ${s.p}.`;
      ask(q); why(prodWhy(s)); $('#sub').innerHTML = `${s.cur} − ${s.p} = <div class="box" id="sb"></div>`;
      await typeAnswer($('#sb'), s.r, q);
    }
    why(restWhy(s));
    /* det som är klart stryks, så att man inte tappar bort sig (som i appens kort division) */
    for (let k = 0; k <= s.i; k++) { $('#d' + k).classList.add('struck'); const rs = $('#rs' + k); if (rs) rs.classList.add('struck'); }
    if (!s.last && s.r === 0) {
      const nx = P.ds[s.i + 1];
      ask(`Inget blev över. Vi fortsätter med <b>${nx}</b> ${PLACE[s.i + 1]}.`);
      grp([s.i + 1]); $('#sub').innerHTML = '';
    } else if (!s.last) {
      const nx = P.ds[s.i + 1];
      ask(`<span class="ok">Rätt!</span>${s.r} ${PLACE[s.i]} är kvar. Den lilla siffran ${s.r} skrivs framför ${nx}:an.`);
      await waitNext('Varför där?');
      why(swapWhy(s));
      const rs = $('#rs' + (s.i + 1)); rs.classList.add('slot');
      await fly($('#sb'), rs, String(s.r)); rs.textContent = s.r;
      grp([s.i + 1]); $('#sub').innerHTML = '';
      ask(`Nu står det <b>${s.r * 10 + nx}</b> ${PLACE[s.i + 1]}: den lilla ${s.r}:an och ${nx}:an hör ihop.`);
    } else {
      await fly($('#sb'), $('#qR'), String(s.r)); $('#qR').insertAdjacentText('beforeend', s.r); $('#qR').classList.add('done');
      grp([]); $('#sub').innerHTML = '';
      P.steps.forEach(x => $('#q' + x.i).classList.add('ans')); $('#qR').classList.add('ans');
      ask(`<span class="ok">Klart!</span>Svaret är <b>${P.quot}</b>, rest <b>${P.rest}</b>.`);
      why(`Varje person fick ${P.quot} kr, och ${P.rest} kr blev över.`);
      await W(PACE);
      $('#think').innerHTML = `<div class="tt">KONTROLL</div><div class="row in" style="cursor:default">${D} · ${P.quot} + ${P.rest} = ${N}<span class="cmp" style="color:#15803d">som täljaren</span></div>`;
      if (KD.onDone) act(`<button class="next">Tillbaka till berättelsen ${ic.next}</button>`, KD.onDone);
      else finish({ first: !ERR, hints: 0 });
    }
  }
}

/* ── trappan: samma tal ── */
let T = null;
function trapView() {
  setTask(TASK.n, TASK.d);
  view = 'trap'; typed = ''; padHandler = null;
  if (SELF()) return trapSelf();
  const rows = 2 + 2 * P.steps.length, cols = N.length + 2, cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push(`<div class="c" id="c${r}_${c}"></div>`);
  app.innerHTML = kdShell('Trappan') + `
  <div class="card">
    <div class="ask" id="ask"></div>
    <div class="why" id="why"></div>
    <div class="trap" id="trap" style="grid-template-columns:repeat(${cols},30px);grid-auto-rows:25px">${cells.join('')}</div>
    <div class="sub" id="sub"></div>
    <div id="act" style="display:flex;justify-content:center;min-height:46px"></div>
  </div>` + padHTML() + kladdHTML();
  afterRender();
  const C = (r, c) => $(`#c${r}_${c}`);
  /* kolumn 0 = nämnaren, kolumn 1+k = täljarens siffra k; rad 0 = kvoten, rad 1 = talet */
  C(1, 0).textContent = D;
  [...N].forEach((d, k) => { const e = C(1, 1 + k); e.textContent = d; e.classList.add(CLS[k], 'bt'); });
  C(1, 1).classList.add('bl');
  T = { C }; trapRun();
}
function put(C, row, endCol, num, cls) {   /* skriv ett tal högerjusterat så att sista siffran hamnar i endCol */
  const s = String(num); [...s].forEach((d, k) => { const e = C(row, endCol - s.length + 1 + k); e.textContent = d; if (cls) e.classList.add(...cls); });
}
async function trapRun() {
  const { C } = T;
  const think = (h) => { $('#sub').innerHTML = h; };
  const s0 = P.steps[0];
  ask(`I trappan skriver vi allt vi räknar. ${s0.i > 0 ? `${D} får inte plats i ${N[0]}, så vi börjar med` : 'Vi börjar med'} <b>${s0.cur}</b>.`);
  why(startWhy());
  let row = 1;
  const lit = (r, a, b, on) => { for (let c = a; c <= b; c++) C(r, c).classList.toggle('lit', on); };
  lit(1, 1, 1 + s0.i, true);
  for (const s of P.steps) {
    const col = 1 + s.i, len = String(s.cur).length;
    await waitNext(`Visa ${D}:ans tabell`);
    why('');
    think(`<div class="think" id="think" style="flex:1;min-height:0"><div class="tt">${D}:ANS TABELL</div></div>`);
    ask(`Hur många gånger får ${D} plats i <b>${s.cur}</b>?`);
    await showRows(rows2(s), s.cur);
    const r = await pickRow(s.cur, s.q);
    ask(`<span class="ok">Rätt!</span>${s.q} skrivs ovanför, över ${PLACE[s.i]}et.`);
    why(giveWhy(s));
    await W(PACE / 2); await fly(r.querySelector('.m'), C(0, col), String(s.q)); C(0, col).textContent = s.q; C(0, col).classList.add(CLS[s.i]);
    await waitNext();
    think('');
    ask(`Under ${s.cur} skriver vi ${s.q} gånger ${D}: <b>${s.p}</b>.`);
    why(prodWhy(s) + ' Vi skriver det under, för att se vad som blir kvar.');
    await W(PACE / 2);
    const pl = String(s.p).length, pr = row + 1;
    C(pr, col - pl).textContent = '−'; C(pr, col - pl).classList.add('minus');
    for (let k = 0; k < pl; k++) { const e = C(pr, col - pl + 1 + k); e.textContent = String(s.p)[k]; e.classList.add('appear', 'ul'); await W(PACE / 2); }
    for (let c = col - len + 1; c <= col; c++) C(pr, c).classList.add('ul');
    await waitNext();
    lit(row, col - len + 1, col, false);
    if (s.r === 0) { ask(`${D} · ${s.q} = ${s.p}, precis lika mycket som ${s.cur}. Inget blir över.`); why(''); }
    else {
      const q = `Hur mycket blir över? Räkna ${s.cur} − ${s.p}.`;
      ask(q); why(''); think(`${s.cur} − ${s.p} = <div class="box" id="sb"></div>`);
      await typeAnswer($('#sb'), s.r, q);
      think('');
    }
    const rr = row + 2; put(C, rr, col, s.r, ['appear']);
    why(restWhy(s));
    if (!s.last) {
      const nx = P.ds[s.i + 1];
      ask(`<span class="ok">Rätt!</span>${s.r} blev över. Nu flyttar vi ner nästa siffra, ${nx}.`);
      await waitNext(`Varför flyttar vi ner ${nx}?`);
      why(swapWhy(s));
      await waitNext(`Flytta ner ${nx}`);
      C(1, col + 1).classList.add('src');
      await fly(C(1, col + 1), C(rr, col + 1), String(nx));
      C(rr, col + 1).textContent = nx; C(rr, col + 1).classList.add(CLS[s.i + 1]); C(1, col + 1).classList.remove('src');
      row = rr; const nl = String(s.r * 10 + nx).length;
      lit(row, col + 1 - nl + 1, col + 1, true);
      ask(`Nu står det <b>${s.r * 10 + nx}</b> ${PLACE[s.i + 1]}, samma tal som i kort division.`);
    } else {
      C(rr, col).style.color = 'var(--lila)';
      /* Svaret får fokus: kvoten och resten lyser, och svaret står för sig (Dennis: "själva svaret behöver få lite fokus") */
      P.steps.forEach(x => C(0, 1 + x.i).classList.add('ans'));
      for (let c = col - String(s.r).length + 1; c <= col; c++) C(rr, c).classList.add('restans');
      ask(`<span class="ok">Klart!</span>Svaret är <b>${P.quot}</b>, rest <b>${P.rest}</b>.`);
      why(`Varje person fick ${P.quot} kr, och ${P.rest} kr blev över.`);
      think(`<div class="answer"><span>${N} / ${D} =</span> <b class="aq">${P.quot}</b><span>, rest</span> <b class="ar">${P.rest}</b></div>`);
      finish({ first: !ERR, hints: 0 }, `<button class="ghost" id="cmpBtn">Jämför med kort division</button>`);
      $('#cmpBtn').onclick = async () => {
        act('');
        /* Spegeln (valfri): VARJE rest i trappan är en liten siffra i kort division, och det som blir över sist är resten */
        const mid = P.steps.filter(x => !x.last);
        let kd = '';
        [...N].forEach((d, k) => { const sm = mid.find(x => x.i + 1 === k); kd += (sm ? `<sup class="sm" id="sm${k}">${sm.r}</sup>` : '') + `<span class="${CLS[k]}">${d}</span>`; });
        think(`<div class="mirror"><div class="mini"><small>KORT DIVISION</small><span>${kd} = ${P.quot}, rest <span class="sm" id="smR">${P.rest}</span></span></div></div>`);
        const rcells = k => { const x = P.steps[k], r = 3 + 2 * k, c = 1 + x.i; const L = String(x.r).length; return [...Array(L).keys()].map(j => C(r, c - L + 1 + j)); };
        for (let k = 0; k < P.steps.length; k++) {
          const x = P.steps[k];
          app.querySelectorAll('.pair').forEach(e => e.classList.remove('pair'));
          rcells(k).forEach(e => e.classList.add('pair'));
          if (!x.last) {
            const nx = P.ds[x.i + 1];
            $('#sm' + (x.i + 1)).classList.add('pair');
            ask(`Efter ${PLACE[x.i]}en blev <b>${x.r}</b> över. I kort division är det den lilla ${x.r}:an framför ${nx}:an.`);
            why(`${nm(x.r, x.i)} ${icons(x.r, x.i)} växlas till ${x.r * 10} ${MONEY[x.i + 1].many}. Trappan skriver ut det, kort division skriver bara den lilla siffran.`);
            await waitNext(k + 1 < P.steps.length - 1 ? 'Nästa växling' : 'Och sist?');
          } else {
            $('#smR').classList.add('pair');
            ask(`Sist blev <b>${x.r}</b> över. Det finns inget mer att växla till, så det är resten – i båda.`);
            why(`Varje växling i trappan är en liten siffra i kort division, och det som blir över sist är resten.`);
            finish(null);
          }
        }
      };
    }
  }
}

/* ── Problemlösning (31, 32a, 34b): berättelse → stapelmodellen → välj uträkning → räkna i kort division → svarsbanken ── */
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);   /* platsen lottas (D17) */
let PROB = null;
function probView(back) {
  view = 'prob'; typed = ''; padHandler = null;
  const { n, d, q } = TASK, st = O.STORIES[TASK.si];
  PROB = { n, d, q, st, acc: back && PROB && PROB.acc ? PROB.acc : { miss: false, hints: 0 } };
  if (SELF()) return probSelf(back);
  app.innerHTML = kdShell('Problemlösning') + `
  <div class="card">
    <div class="story" id="story">${st.a}<b class="tok" id="tN">${n}</b>${st.b}<b class="tok" id="tD">${d}</b>${st.c}</div>
    <div class="why" id="why"></div>
    <div class="bar" id="bar"><div class="barlab" id="barlab">${n} ${st.unit}</div><div class="barrow" id="barrow"><div class="seg1"></div></div></div>
    <div class="ask" id="ask"></div>
    <div class="opts" id="opts"></div>
    <div class="sub" id="sub"></div>
    <div id="act" style="display:flex;justify-content:center;min-height:46px"></div>
  </div>` + padHTML() + kladdHTML();
  afterRender();
  if (back) return probEnd();
  probRun();
}
async function probRun() {
  const { n, d } = PROB;
  ask('Läs berättelsen. Vad ska delas, och i hur många delar?');
  await waitNext('Rita stapeln');
  /* stapelmodellen: hela sträckan som en stapel, delad i d lika delar */
  why(`Allt, ${n} ${PROB.st.unit}, är en stapel. Det ska delas i ${d} lika delar, så stapeln delas i ${d}.`);
  $('#tN').classList.add('litok');
  await W(PACE);
  $('#barrow').innerHTML = Array.from({ length: d }, () => '<div class="part"><span>?</span></div>').join('');
  $('#tD').classList.add('litok');
  await W(PACE);
  ask('Vilken uträkning ger svaret på frågan? Tryck på den.');
  const right = `${n} / ${d}`;
  const opts = shuffle([right, `${n} · ${d}`, `${n} − ${d}`, `${n} + ${d}`]);
  $('#opts').innerHTML = opts.map(o => `<button class="opt" data-o="${o}">${o}</button>`).join('');
  await new Promise(res => $('#opts').querySelectorAll('.opt').forEach(b => b.onclick = () => {
    if (b.dataset.o === right) { b.classList.add('okopt'); $('#opts').querySelectorAll('.opt').forEach(x => x.onclick = null); res(); }
    else { ERR = true; b.classList.add('nope'); setTimeout(() => b.classList.remove('nope'), 900);
      const o = b.dataset.o;
      ask(`<span class="soft">Inte riktigt – försök igen.</span>${o.includes('·') ? 'Gånger gör det större. Vi ska dela.' : o.includes('−') ? `Minus tar bort ${d}. Vi ska dela i ${d} delar.` : 'Plus gör det större. Vi ska dela.'}`); }
  }));
  ask(`<span class="ok">Rätt!</span>${right}: det delas i ${d} lika delar.`);
  why(`Lika delar betyder division. Stapelns ${d} delar är svaret på ${right}.`);
  await waitNext('Räkna i kort division');
  /* räkna i kort division med hjälp, sedan tillbaka hit */
  setTask(String(n), d);
  kdView({ title: 'Problemlösning', onDone: () => probView(true) });
}
async function probEnd() {
  const { n, d, q, st } = PROB;
  $('#barrow').innerHTML = Array.from({ length: d }, () => '<div class="part"><span>?</span></div>').join('');
  /* uträkningen följer med tillbaka, så att man inte behöver räkna om (Dennis 12/11) */
  $('#opts').innerHTML = `<div class="carry">Din uträkning: ${n} / ${d} = <b id="carryQ">${q}</b></div>`;
  ask('Svara nu på frågan i berättelsen.');
  why('Kvoten är hur mycket det blir i en av de lika delarna.');
  $('#sub').innerHTML = `${st.pre} <div class="box" id="sb"></div> ${st.post}`;
  await typeAnswer($('#sb'), q, 'Titta på din uträkning.');
  /* förståelseprovet: svaret fyller stapelns delar */
  ask(`<span class="ok">Klart!</span>${st.pre} <b>${q}</b> ${st.post}`);
  const parts = [...$('#barrow').querySelectorAll('.part')];
  await fly($('#carryQ'), parts[0], String(q));
  for (const p of parts) { p.innerHTML = `<span>${st.unit.length <= 2 && d <= 5 ? `${q} ${st.unit}` : q}</span>`; p.classList.add('filled'); await W(PACE / 3); }
  why(`${d} delar med ${q} i varje blir allt: ${d} · ${q} = ${n}.`);
  done();
}

/* ── Kluringar (32b) som "vänd på det" (Dennis 12/11): frågan uppställd som två divisioner, baklänges som gångertal ── */
function klurView() {
  view = 'klur'; typed = ''; padHandler = null;
  const { a, b, k, mid, tot } = TASK;   /* tänkta talet tot: tot / a = mid, mid / b = k */
  if (SELF()) return klurSelf(a, b, k, mid, tot);
  const qb = id => `<span class="dzq" id="${id}">?</span>`;
  app.innerHTML = kdShell('Kluringar') + `
  <div class="card">
    <div class="story">Vilket tal tänker jag på? Först delar jag det med <b class="tok">${a}</b>. Sedan delar jag svaret med <b class="tok">${b}</b>. Då får jag <b class="tok">${k}</b>.</div>
    <div class="kgrid">   <!-- varje frågerad har sin vända rad bredvid sig; man börjar nerifrån (bakifrån) -->
      <div class="dzrow orig two"><small>FRÅGAN</small>
        <div>${qb('kT')} / <span class="dzn" id="kA">${a}</span> = ${qb('kM1')}</div>
        <div>${qb('kM2')} / <span class="dzn" id="kB">${b}</span> = <span class="dzn" id="kK">${k}</span></div></div>
      <div class="dzrow flip two" id="flip" style="visibility:hidden"><small>VÄND PÅ DET</small>
        <div id="fr2" style="visibility:hidden"><span class="dzn" id="f2x"></span> · <span class="dzn" id="f2y"></span> = <div class="box" id="f2z"></div></div>
        <div id="fr1"><span class="dzn" id="f1x"></span> · <span class="dzn" id="f1y"></span> = <div class="box" id="f1z"></div></div></div>
    </div>
    <div class="why" id="why"></div>
    <div class="ask" id="ask"></div>
    <div id="act" style="display:flex;justify-content:center;min-height:46px"></div>
  </div>` + padHTML() + kladdHTML();
  afterRender();
  klurRun(a, b, k, mid, tot);
}
async function klurRun(a, b, k, mid, tot) {
  ask('Rutan i mitten är svaret efter första delningen.');
  why(`Vi vet bara slutet: ${k}. Därför börjar vi bakifrån.`);
  await waitNext('Vänd på det');
  $('#flip').style.visibility = 'visible';
  why(`Om något delat med ${b} blir ${k}, så är något ${b} gånger ${k}. Division baklänges är gånger.`);
  await fly($('#kK'), $('#f1x'), String(k)); $('#f1x').textContent = k;
  await fly($('#kB'), $('#f1y'), String(b)); $('#f1y').textContent = b;
  let q = `Räkna ${k} · ${b}.`; ask(q);
  await typeAnswer($('#f1z'), mid, q);
  ask(`<span class="ok">Rätt!</span>Svaret efter första delningen är <b>${mid}</b>.`);
  await fly($('#f1z'), $('#kM2'), String(mid)); $('#kM2').textContent = mid; $('#kM2').className = 'dzn';
  await fly($('#f1z'), $('#kM1'), String(mid)); $('#kM1').textContent = mid; $('#kM1').className = 'dzn';
  await waitNext('Och talet?');
  $('#fr2').style.visibility = 'visible';
  why(`Om talet delat med ${a} blir ${mid}, så är talet ${a} gånger ${mid}.`);
  await fly($('#kM1'), $('#f2x'), String(mid)); $('#f2x').textContent = mid;
  await fly($('#kA'), $('#f2y'), String(a)); $('#f2y').textContent = a;
  q = `Räkna ${mid} · ${a}.`; ask(q);
  await typeAnswer($('#f2z'), tot, q);
  await fly($('#f2z'), $('#kT'), String(tot)); $('#kT').textContent = tot; $('#kT').className = 'dzn ansq';
  ask(`<span class="ok">Klart!</span>Talet är <b>${tot}</b>.`);
  why(`Kontroll framåt: ${tot} / ${a} = ${mid}, och ${mid} / ${b} = ${k}. Det stämmer.`);
  done();
}

/* ── Vilket tal? (26b): Venndiagram, med hjälp tonas tal bort ledtråd för ledtråd (uteslutning) ── */
/* ── Vilket tal? (26b): Venndiagrammet, genererat med exakt ett svar (OvningsbladLogic.genVenn). Med hjälp tonas tal
   bort ledtråd för ledtråd (uteslutning). Området som ledtråd 1 pekar ut kan vara snittet, en figur utan den andra
   eller triangeln; det lila fältet ritas med en klippning eller en mask. ── */
const REGION_SHAPE = {
  both:   '<circle cx="185" cy="110" r="78" clip-path="url(#ov-sqc)" class="both" id="both"/>',
  sqOnly: '<rect x="40" y="30" width="150" height="150" mask="url(#ov-noci)" class="both" id="both"/>',
  ciOnly: '<circle cx="185" cy="110" r="78" mask="url(#ov-nosq)" class="both" id="both"/>',
  tri:    '<polygon points="215,205 335,120 335,222" class="both" id="both"/>',
};
function vennSVG(t, self) {
  return `<svg class="venn" viewBox="0 0 340 230" id="venn">
    <defs><clipPath id="ov-sqc"><rect x="40" y="30" width="150" height="150"/></clipPath>
      <mask id="ov-noci"><rect width="340" height="230" fill="#fff"/><circle cx="185" cy="110" r="78" fill="#000"/></mask>
      <mask id="ov-nosq"><rect width="340" height="230" fill="#fff"/><rect x="40" y="30" width="150" height="150" fill="#000"/></mask></defs>
    <rect x="40" y="30" width="150" height="150" class="sh"/><circle cx="185" cy="110" r="78" class="sh"/><polygon points="215,205 335,120 335,222" class="sh"/>
    ${REGION_SHAPE[t.region]}
    ${t.items.map(it => `<g class="vn" data-n="${it.n}" transform="translate(${it.x},${it.y})"><circle r="16"/><text dy="6">${it.n}</text>${self ? '<path class="xx" d="M-13 -13L13 13M13 -13L-13 13"/>' : ''}</g>`).join('')}
    ${self ? '<circle class="ripple" id="ripple" r="18"/>' : ''}
  </svg>`;
}
const listSv = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' och ' + a[a.length - 1];
function vennView() {
  view = 'venn'; typed = ''; padHandler = null;
  if (SELF()) return vennSelf();
  const t = TASK;
  app.innerHTML = kdShell('Vilket tal?') + `
  <div class="card">
    <div class="story" id="clue">Talet är <b class="tok" id="c1">${t.clue1}</b>. Det kan delas <b class="tok" id="c2">${t.clue2}</b>.</div>
    <div class="why" id="why"></div>
    ${vennSVG(t, false)}
    <div class="ask" id="ask"></div>
    <div id="act" style="display:flex;justify-content:center;min-height:46px"></div>
  </div>` + kladdHTML();
  afterRender();
  vennRun(t);
}
async function vennRun(t) {
  const gs = [...app.querySelectorAll('.vn')], item = g => t.items.find(it => it.n === +g.dataset.n);
  ask('Läs ledtrådarna en i taget. Vi stryker de tal som inte passar.');
  why('Varje ledtråd tar bort tal. Till slut finns bara ett kvar.');
  await waitNext('Ledtråd 1');
  $('#c1').classList.add('litok'); $('#both').classList.add('on');
  ask(`Talet är ${t.clue1}: bara talen i det lila området.`);
  await W(PACE);
  for (const g of gs) if (!O.vennFits(t, item(g))) { g.classList.add('out'); await W(120); }
  const left = t.items.filter(it => O.vennFits(t, it)).map(it => it.n);
  why(`Talen utanför det lila området är strukna. Kvar: ${listSv(left)}.`);
  await waitNext('Ledtråd 2');
  $('#c2').classList.add('litok');
  ask(`Kan delas ${t.clue2}: vilket av talen som är kvar går att dela med ${t.k} utan rest?`);
  await W(PACE);
  for (const g of gs) { const n = +g.dataset.n; if (!g.classList.contains('out') && n % t.k) { g.classList.add('out'); await W(300); } }
  const gone = left.filter(n => n % t.k);
  why(`${listSv(gone.map(n => `${n} / ${t.k} = ${Math.floor(n / t.k)} rest ${n % t.k}`))}. ${gone.length === 1 ? 'Det stryks' : 'De stryks'}. Bara ett tal är kvar.`);
  ask('Tryck på talet.');
  await new Promise(res => gs.forEach(g => g.onclick = () => {
    const n = +g.dataset.n;
    if (n === t.answer) { g.classList.add('win'); gs.forEach(x => x.onclick = null); res(); }
    else { ERR = true; g.classList.add('nope'); setTimeout(() => g.classList.remove('nope'), 900);
      ask(`<span class="soft">Inte riktigt – försök igen.</span>${!O.vennFits(t, item(g)) ? `${n} är inte ${t.clue1}.` : `${n} går inte jämnt att dela med ${t.k}.`}`); }
  }));
  ask(`<span class="ok">Klart!</span>Talet är <b>${t.answer}</b>.`);
  why(`${t.answer} är ${t.clue1}, och ${t.answer} / ${t.k} = ${t.answer / t.k} utan rest.`);
  done();
}

/* ── 10, 100 och 1000: vänd på det. Originalfrågan står kvar, den vända raden flyger fram under (Dennis 12/11).
   Texterna byggs ur talen: A = "a / ? = c" (det okända i mitten), B = "? / p = c" (det okända först). ── */
const PIDX = { 1000: 0, 100: 1, 10: 2 };
function dzText(t) {
  const m = MONEY4[PIDX[t.p]], zeros = String(t.p).length - 1;
  if (t.kind === 'A') return {
    q: `Vad ska ${t.a} delas med för att bli ${t.c}?`,
    flipWhy: `Om ${t.a} delat med något blir ${t.c}, så blir ${t.a} delat med ${t.c} just det något.`,
    calcWhy: `${t.a} är ${t.c} ${m.many} ${iconsM(t.c, m)}. Delat på ${t.c} blir det 1 ${m.one} var: ${t.p}.`,
    check: `Kontroll: ${t.a} / ${t.p} = ${t.c}.` };
  return {
    q: `Vilket tal delat med ${t.p} blir ${t.c}?`,
    flipWhy: `Om något delat med ${t.p} blir ${t.c}, så är något ${t.p} gånger så stort som ${t.c}. Division baklänges är gånger.`,
    calcWhy: `${t.c} ${m.many} ${iconsM(t.c, m)} är ${t.ans} kronor. ${t.p} · ${t.c} = ${t.ans}.`,
    check: `Kontroll: ${t.ans} / ${t.p} = ${t.c}. Stryk ${['en nolla', 'två nollor', 'tre nollor'][zeros - 1]} i ${t.ans}, så blir det ${t.c}.` };
}
function dzView() {
  view = 'dz'; typed = ''; padHandler = null;
  if (SELF()) return dzSelf();
  const t = TASK;
  const cell = (v, id) => v === '?' ? `<span class="dzq" id="${id}">?</span>` : `<span class="dzn" id="${id}">${v}</span>`;
  app.innerHTML = kdShell('10, 100 och 1000') + `
  <div class="card">
    <div class="ask" id="ask"></div>
    <div class="dzrow orig"><small>FRÅGAN</small>${cell(t.a, 'oa')} / ${cell(t.b, 'ob')} = ${cell(t.c, 'oc')}</div>
    <div class="why" id="why"></div>
    <div class="dzrow flip" id="flip" style="visibility:hidden"><small>VÄND PÅ DET</small><span class="dzn" id="fx"></span> <span id="fop">${t.op}</span> <span class="dzn" id="fy"></span> = <div class="box" id="fz"></div></div>
    <div id="act" style="display:flex;justify-content:center;min-height:46px"></div>
  </div>` + padHTML() + kladdHTML();
  afterRender();
  dzRun(t);
}
async function dzRun(t) {
  const tx = dzText(t);
  ask(tx.q);
  why('Det okända står inte sist. Då vänder vi på frågan, så att det okända hamnar där vi kan räkna fram det.');
  await waitNext('Vänd på det');
  $('#flip').style.visibility = 'visible';
  why(tx.flipWhy);
  /* talen flyger från frågan till den vända raden: frågan står kvar ovanför */
  const src = v => ['oa', 'ob', 'oc'].map(id => $('#' + id)).find(e => e.textContent === String(v));
  await fly(src(t.x), $('#fx'), String(t.x)); $('#fx').textContent = t.x;
  await fly(src(t.y), $('#fy'), String(t.y)); $('#fy').textContent = t.y;
  await waitNext('Räkna');
  why(tx.calcWhy);
  const q = `Räkna ${t.x} ${t.op} ${t.y}.`;
  ask(q);
  await typeAnswer($('#fz'), t.ans, q);
  /* svaret flyger tillbaka upp till frågetecknet */
  ask('<span class="ok">Rätt!</span>Nu flyttar vi svaret till frågan.');
  const qm = $('#ob').textContent === '?' ? $('#ob') : $('#oa');
  await fly($('#fz'), qm, String(t.ans)); qm.textContent = t.ans; qm.className = 'dzn ansq';
  ask(`<span class="ok">Klart!</span>${t.a === '?' ? t.ans : t.a} / ${t.b === '?' ? t.ans : t.b} = ${t.c}.`);
  why(tx.check);
  done();
}

/* ── Dela och gruppera (Grunder): ringa in grupper med hoppräkning, skriv divisionen själv, kontrollera med gånger.
   Lättare går jämnt ut (ingen rest), Svårare har rest. ── */
function grpView() {
  view = 'grp'; typed = ''; padHandler = null;
  if (SELF()) return grpSelf();
  const { name, tot, g, q, r } = TASK;
  app.innerHTML = kdShell('Dela och gruppera') + `
  <div class="card" id="grpcard">
    <div class="story">${name} har <b class="tok" id="gT">${tot}</b> bollar. <b class="tok" id="gG">${g}</b> bollar ryms i varje påse. ${r ? 'Hur många påsar blir fulla, och hur många bollar blir över?' : 'Hur många påsar blir det?'}</div>
    <div class="why" id="why"></div>
    <div class="heap" id="heap">${'<i class="ball"></i>'.repeat(tot)}</div>
    <div class="bags" id="bags"></div>
    <div class="ask" id="ask"></div>
    <div class="gdiv" id="gdiv" style="visibility:hidden">
      <div class="frac2"><div class="box" id="gN"></div><div class="fl"></div><div class="box" id="gD"></div></div>
      <span>=</span><div class="box" id="gQ"><span class="cap">påsar</span></div>${r ? `<span>,</span><div class="box rest" id="gR"><span class="cap" style="color:var(--lila)">över</span></div>` : ''}
    </div>
    <div class="sub" id="sub"></div>
    <div id="act" class="actrow"></div>
  </div>` + padHTML() + kladdHTML();
  afterRender();
  grpRun(tot, g, q, r);
}
/* Utdelningen: bollarna hoppar en och en från högen till sin plats i påsen, utan pil (Dennis 12/11: "för lång tid",
   "pilen behövs inte", "cirklarna rör sig ut som innan" – samma rörelse som Matteprovets animateDeal). Påsen läggs in
   först och kortet hinner passas in (fitCard) innan något mäts; förflyttningen räknas om till kortets skala. */
async function deal(balls, bag) {
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const from = balls.map(b => b.getBoundingClientRect()), ins = [...bag.querySelectorAll('.ball.in')];
  balls.forEach(b => { b.style.visibility = 'hidden'; });
  const dur = 420, gap = 90;
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) ins.forEach((b, k) => {
    const r = b.getBoundingClientRect(), a = from[k] || from[0], s = (r.width / b.offsetWidth) || 1;
    const dx = (a.left + a.width / 2 - r.left - r.width / 2) / s, dy = (a.top + a.height / 2 - r.top - r.height / 2) / s;
    b.animate([{ transform: `translate(${dx}px,${dy}px) scale(${(a.width / r.width).toFixed(2)})` }, { transform: 'none' }],
      { duration: dur * SPEED, delay: k * gap * SPEED, easing: 'cubic-bezier(.34,1.3,.4,1)', fill: 'backwards' });
  });
  await W(dur + gap * (ins.length - 1) + 60);
  balls.forEach(b => b.classList.add('gone'));
}
async function grpRun(tot, g, q, r) {
  ask(`Tryck på högen: varje tryck lägger ${g} bollar i en påse.`);
  why(`Vi gör som på riktigt: en påse i taget, och vi räknar bollarna i hopp om ${g}.`);
  let n = 0;
  await new Promise(res => {
    $('#heap').onclick = async () => {
      if ($('#heap').dataset.busy) return; $('#heap').dataset.busy = 1;
      const balls = [...$('#heap').querySelectorAll('.ball:not(.gone)')].slice(0, g);
      n++;
      $('#bags').insertAdjacentHTML('beforeend', `<div class="bag" id="bag${n}"><b>${n * g}</b>${'<i class="ball in"></i>'.repeat(g)}</div>`);
      await deal(balls, $('#bag' + n));
      ask(`${n} ${n === 1 ? 'påse' : 'påsar'}: ${n * g} bollar. ${tot - n * g >= g ? 'Tryck igen.' : ''}`);
      delete $('#heap').dataset.busy;
      if (tot - n * g < g) { $('#heap').onclick = null; res(); }
    };
  });
  if (r) {
    why(`${r} ${r === 1 ? 'boll räcker' : 'bollar räcker'} inte till en påse till. ${r === 1 ? 'Den blir' : 'De blir'} över.`);
    ask(`<span class="ok">Klart!</span>${q} fulla påsar och ${r} ${r === 1 ? 'boll' : 'bollar'} över.`);
  } else {
    why('Alla bollar ligger i påsar. Inget blir över.');
    ask(`<span class="ok">Klart!</span>${q} påsar, och inget blir över.`);
  }
  await waitNext('Skriv divisionen');
  /* barnet skriver täljare och nämnare själv (Ingårs form) */
  $('#gdiv').style.visibility = 'visible';
  why('Täljaren är alla bollar från början. Nämnaren är hur många som ryms i en påse.');
  let qq = 'Hur många bollar fanns från början? Det står i berättelsen.'; ask(qq);
  await typeAnswer($('#gN'), tot, qq);
  qq = 'Hur många bollar ryms i en påse?'; ask(qq);
  await typeAnswer($('#gD'), g, qq);
  ask('Nu flyttar vi svaren från påsarna.');
  why(r ? 'Antalet fulla påsar är kvoten. Det som blev över är resten.' : 'Antalet påsar är kvoten.');
  await fly($('#bag' + q).querySelector('b'), $('#gQ'), String(q)); $('#gQ').insertAdjacentText('beforeend', q); $('#gQ').classList.add('done');
  if (r) { await fly($('#heap'), $('#gR'), String(r)); $('#gR').insertAdjacentText('beforeend', r); $('#gR').classList.add('done'); }
  await waitNext('Kontrollera med gånger');
  /* kontrollen: faktorerna lyser medan barnet räknar, täljaren först efteråt (B1) */
  $('#gD').classList.add('ans'); $('#gQ').classList.add('ans');
  qq = r ? `Räkna ${g} · ${q} + ${r}.` : `Räkna ${g} · ${q}.`; ask(qq);
  why(r ? `${q} påsar med ${g} i varje, plus ${r} över, ska bli alla bollarna.` : `${q} påsar med ${g} i varje ska bli alla bollarna.`);
  $('#sub').innerHTML = `${g} · ${q}${r ? ` + ${r}` : ''} = <div class="box" id="sb"></div>`;
  await typeAnswer($('#sb'), tot, qq);
  $('#gN').classList.add('ans');
  ask(`<span class="ok">Klart!</span>${tot} / ${g} = <b>${q}</b>${r ? `, rest <b>${r}</b>` : ''}. Samma som täljaren.`);
  why(`${g} · ${q}${r ? ` + ${r}` : ''} = ${tot}, precis alla bollarna.`);
  done();
}

/* ── Divisionstabellen (Grunder): 20 tal i rutnät; med hjälp visas gångertalet bakom divisionen ── */
function tabView() {
  view = 'tab'; typed = ''; padHandler = null;
  const items = TASK;
  if (SELF()) return tabSelf(items);
  app.innerHTML = kdShell('Divisionstabellen') + `
  <div class="card">
    <div class="ask" id="ask"></div>
    <div class="tgrid">${items.map(([a, b], i) => `<div class="trow" id="tr${i}"><span>${a} / ${b} =</span><div class="box" id="tb${i}"></div></div>`).join('')}</div>
    <div class="why" id="why"></div>
    <div id="act" style="display:flex;justify-content:center;min-height:46px"></div>
  </div>` + padHTML() + kladdHTML();
  afterRender();
  (async () => {
    for (let i = 0; i < items.length; i++) {
      const [a, b] = items[i], q = a / b;
      app.querySelectorAll('.trow').forEach(r => r.classList.remove('on')); $('#tr' + i).classList.add('on');
      ask(`${a} / ${b} = ?`);
      why(`Tänk gånger: ${b} · ? = ${a}.`);
      await typeAnswer($('#tb' + i), q, `Tänk gånger: ${b} · ? = ${a}. Vilket tal i ${b}:ans tabell ger ${a}?`);
    }
    ask('<span class="ok">Klart!</span>Alla tio är ifyllda.');
    why('Varje division har ett gångertal bakom sig. Den som kan tabellerna kan dividera.');
    done();
  })();
}

/* ══════════ SJÄLV, modul för modul (brainstorm/17, tabellen i varv 2) ══════════ */

/* Kort division: uppställningen med en ruta under varje siffra (antalet rutor avslöjar inte var man börjar; en
   tom ruta eller 0 först är rätt), små restrutor framför siffrorna, strykning med tryck, räkneremsan. */
function kdSelf() {
  app.innerHTML = kdShell(KD.title || 'Kort division') + `
  <div class="card" id="card">
    <div class="ask" id="ask"></div>
    <div class="kd self">
      <div class="fr">
        <div class="numrow">${[...N].map((d, i) => `<div class="dg ${CLS[i]}" id="d${i}"><span class="cap ${CLS[i]}">${CAP[CLS[i]]}</span>${d}${i > 0 ? `<span class="rs slot" id="rs${i}"></span>` : ''}</div>`).join('')}</div>
        <div class="den"><span>${D}</span></div>
      </div>
      <div class="eqs">=</div>
      <div class="qwrap"><div class="qrow">${P.steps.map(s => `<div class="box" id="q${s.i}"><span class="cap ${CLS[s.i]}">${CAP[CLS[s.i]]}</span></div>`).join('')}</div>
        <div class="rrow">rest <div class="box rest" id="qR"></div></div></div>
    </div>
    ${toolsHTML(remsaBtn)}${remsaHTML(D)}
    <div id="act" class="actrow"></div>
  </div>` + padHTML('Nästa ruta') + kladdHTML();
  afterRender();
  ask(`Räkna ${N} / ${D} själv. Skriv kvoten och resten i rutorna.<span class="kv">Tryck på en siffra för att stryka den. De små rutorna är för det som blir över.</span>`);
  app.querySelectorAll('.kd.self .dg').forEach(d => d.onclick = e => { if (!e.target.closest('.rs')) d.classList.toggle('struck'); });
  sfInit({   /* rutorna visar hur många siffror svaret har – det bjuder vi på (D47 ✎) */
    acc: KD.acc,
    boxes: [...P.steps.map(s => ({ el: $('#q' + s.i), ok: v => v === String(s.q) })),
      { el: $('#qR'), need: false, ok: restOk(P.rest) },
      ...[...N].slice(1).map((_, k) => ({ el: $('#rs' + (k + 1)), chain: false, need: false }))],
    hint: n => stepHint(n, s => $('#q' + s.i), cs => grp(cs === P.steps[0] ? [...Array(cs.i + 1).keys()] : [cs.i])),
    onRight: kv => {
      grp([]);
      P.steps.forEach(s => $('#q' + s.i).classList.add('ans')); $('#qR').classList.add('ans');
      if (getVal($('#qR')) === '') setVal($('#qR'), '0');
      ask(`<span class="ok">Klart!</span>${N} / ${D} = <b>${P.quot}</b>, rest <b>${P.rest}</b>.<span class="kv">${kv}</span>`);
      if (KD.onDone) act(nextBtn('Tillbaka till berättelsen'), KD.onDone);
      else done();
    } });
}

/* Trappan: rutnätet växer en rad i taget (formen avslöjas inte i förväg). Barnet skriver kvoten överst, produkten och
   resten, och flyttar ner nästa siffra genom att trycka på den – den hamnar i rutan, utan pil. */
function trapSelf() {
  const rows = 2 + 2 * P.steps.length, cols = N.length + 2, cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push(`<div class="c" id="c${r}_${c}" style="grid-row:${r + 1};grid-column:${c + 1}"></div>`);
  app.innerHTML = kdShell('Trappan') + `
  <div class="card">
    <div class="ask" id="ask"></div>
    <div class="trap self" id="trap" style="grid-template-columns:repeat(${cols},32px);grid-auto-rows:30px">${cells.join('')}</div>
    ${toolsHTML(remsaBtn)}${remsaHTML(D)}
    <div id="act" class="actrow"></div>
  </div>` + padHTML('Nästa ruta') + kladdHTML();
  afterRender();
  const C = (r, c) => $(`#c${r}_${c}`);
  C(1, 0).textContent = D;
  [...N].forEach((d, k) => { const e = C(1, 1 + k); e.textContent = d; e.classList.add(CLS[k], 'bt'); });
  C(1, 1).classList.add('bl');
  const tb = (r, c1, c2, id) => { const e = document.createElement('div'); e.className = 'box tb'; e.id = id; e.style.gridRow = String(r + 1); e.style.gridColumn = `${c1 + 1} / ${c2 + 2}`; $('#trap').appendChild(e); return e; };
  const step = i => P.steps.find(s => s.i === i);
  const qs = [...N].map((_, k) => step(k) ? tb(0, 1 + k, 1 + k, 'tq' + k) : null);   /* bara över svarets siffror (D47 ✎) */
  const total = 2 * P.steps.length, moved = new Set(); let grown = 0;
  const qFilled = () => qs.filter(e => e && getVal(e) !== '').length;
  function addRow() {
    const k = Math.floor(grown / 2), s = P.steps[k], col = 1 + s.i, len = String(s.cur).length;
    let e;
    if (grown % 2 === 0) {           /* raden med det som delas ut */
      const r = 2 + 2 * k;
      C(r, col - len).textContent = '−'; C(r, col - len).classList.add('minus');
      for (let c = col - len + 1; c <= col; c++) C(r, c).classList.add('ul');
      e = tb(r, col - len + 1, col, 'tp' + k); sfAdd([{ el: e, ok: v => v === String(s.p) }]);
    } else {                         /* raden med det som blir över */
      e = tb(3 + 2 * k, col - len + 1, col, 'tr' + k); sfAdd([{ el: e, need: false, ok: restOk(s.r) }]);
    }
    e.classList.add('appear'); grown++; sfFocus(e);
  }
  function grow() {
    if (grown >= total) return false;
    const k = Math.floor(grown / 2);
    if (grown % 2 === 0 && k > 0 && !moved.has(k)) { ask('Flytta ner nästa siffra: tryck på den i talet.'); return true; }
    if (grown % 2 === 0 && qFilled() < k + 1) { ask(k === 0 ? 'Skriv först kvotens första siffra i rätt ruta överst.' : 'Skriv nästa siffra i kvoten överst.'); return true; }
    addRow(); return true;
  }
  [...N].forEach((d, j) => {
    const e = C(1, 1 + j); e.classList.add('tapme');
    e.onclick = () => {
      if (!SF || SF.grown) return;
      const k = P.steps.findIndex(s => s.i === j);
      if (k < 1 || moved.has(k)) return;
      if (grown < 2 * k) { ask('<span class="soft">Inte än.</span>Ta siffrorna i tur och ordning: räkna klart raden ovanför först.'); return; }
      const t = C(1 + 2 * k, 1 + j); t.textContent = d; t.classList.add(CLS[j], 'drop'); e.classList.add('moved'); moved.add(k);
      if (qFilled() >= k + 1) addRow(); else { ask('Skriv nästa siffra i kvoten överst.'); sfFocus(qs[j]); }
    };
  });
  ask(`Räkna ${N} / ${D} i trappan. Kvoten skrivs överst, en siffra i taget.<span class="kv">Under talet skriver du det som delas ut och det som blir över. Nästa ruta ger nästa rad.</span>`);
  sfInit({
    boxes: P.steps.map(s => ({ el: qs[s.i], chain: false, ok: v => v === String(s.q) })),
    grow, more: () => grown < total,
    hint: n => stepHint(n, s => qs[s.i], cs => { if (cs === P.steps[0]) for (let c = 1; c <= 1 + cs.i; c++) C(1, c).classList.add('lit'); }),
    onRight: kv => {
      app.querySelectorAll('.c.lit').forEach(x => x.classList.remove('lit'));
      P.steps.forEach(s => qs[s.i].classList.add('ans'));
      $('#tr' + (P.steps.length - 1)).classList.add('rest', 'ans');
      app.querySelectorAll('[id^="tr"].tb').forEach(e => { if (getVal(e) === '') setVal(e, '0'); });
      ask(`<span class="ok">Klart!</span>${N} / ${D} = <b>${P.quot}</b>, rest <b>${P.rest}</b>.<span class="kv">${kv}</span>`);
      done();
    } });
  sfFocus(qs[P.start]);
}

/* Problemlösning: barnet bygger uträkningen genom att trycka på talen i berättelsen och på räknesättet (inget
   flerval), räknar i kort division (Själv) och svarar i meningen. Ingen stapel. */
function probSelf(back) {
  const { n, d, q, st } = PROB;
  app.innerHTML = kdShell('Problemlösning') + `
  <div class="card">
    <div class="story">${st.a}<button class="tok tap" data-t="${n}">${n}</button>${st.b}<button class="tok tap" data-t="${d}">${d}</button>${st.c}</div>
    <div class="ask" id="ask"></div>
    <div id="work" style="display:flex;flex-direction:column;gap:8px"></div>
    ${toolsHTML()}
    <div id="act" class="actrow"></div>
  </div>` + padHTML('Nästa ruta') + kladdHTML();
  afterRender();
  if (back) {
    $('#work').innerHTML = `<div class="carry">Din uträkning: ${n} / ${d} = <b>${q}</b></div><div class="sub">${st.pre} <div class="box" id="sb"></div> ${st.post}</div>`;
    ask('Svara nu på frågan i berättelsen.');
    sfInit({ acc: PROB.acc, boxes: [{ el: $('#sb'), ok: v => v === String(q) }],
      hint: () => 'Kvoten i din uträkning är svaret: hur mycket det blir i en av delarna.',
      onRight: kv => { $('#sb').classList.add('ans'); ask(`<span class="ok">Klart!</span>${st.pre} <b>${q}</b> ${st.post}<span class="kv">${kv}</span>`); done(); } });
    return;
  }
  /* Talen i berättelsen är riktiga knappar (Safari på iPhone tar inte tryck på vanlig text), och rutorna går också att
     fylla med knappsatsen (D48), så att det fungerar hur barnet än försöker (Dennis 12/11: "Här kan jag inte trycka"). */
  $('#work').innerHTML = `<div class="dzrow orig"><small>UTRÄKNING</small><div class="expr"><div class="box sm" id="e1"></div><button class="es op" id="eo"></button><div class="box sm" id="e2"></div></div></div>
    <div class="opsb">${['/', '·', '−', '+'].map(o => `<button data-op="${o}">${o}</button>`).join('')}</div>`;
  ask('Skriv uträkningen: tryck på talen i berättelsen, eller skriv dem, och välj ett räknesätt.');
  const e1 = $('#e1'), e2 = $('#e2'), eo = $('#eo');
  sfInit({ acc: PROB.acc, boxes: [{ el: e1 }, { el: e2 }],
    hint: k => k === 1 ? `${st.what[0].toUpperCase() + st.what.slice(1)} ska delas i ${d} lika delar. Vilket räknesätt delar?` : 'Talet som delas står först, sedan antalet delar.',
    onRight: () => {} });
  const full = () => getVal(e1) && getVal(e2) && eo.textContent;
  const label = () => { const w = $('#pad .wide'); w.innerHTML = `${ic.check} ${full() ? 'Räkna' : 'Nästa ruta'}`; w.classList.toggle('go', !!full()); act(full() ? nextBtn('Räkna') : '', check); };
  const check = () => {
    if (getVal(e1) === String(n) && eo.textContent === '/' && getVal(e2) === String(d)) {
      padHandler = null; SF.onType = null; SF.done = true;
      app.querySelectorAll('.focus').forEach(x => x.classList.remove('focus'));
      const w = $('#pad .wide'); w.innerHTML = `${ic.check} Nästa ruta`; w.classList.remove('go');
      ask(`<span class="ok">Rätt!</span>Räkna nu ${n} / ${d} i kort division.`);
      act(nextBtn('Räkna i kort division'), () => { setTask(String(n), d); kdView({ title: 'Problemlösning', onDone: () => probView(true), acc: PROB.acc }); });
    } else {
      PROB.acc.miss = true; setVal(e1, ''); setVal(e2, ''); eo.textContent = '';
      [e1, eo, e2].forEach(x => x.classList.add('miss')); sfFocus(e1); label();
      ask('<span class="soft">Inte riktigt – försök igen.</span>Läs berättelsen en gång till.');
    }
  };
  SF.onType = label;
  padHandler = () => {   /* svarsknappen: nästa tomma ruta, sedan Räkna */
    const empty = [e1, e2].find(x => getVal(x) === '');
    if (empty) sfFocus(empty);
    else if (!eo.textContent) ask('Välj ett räknesätt: tryck på / · − eller +.');
    else check();
  };
  app.querySelectorAll('.tok.tap').forEach(t => t.onclick = () => {
    const f = [e1, e2].find(x => x.classList.contains('focus') && getVal(x) === '') || [e1, e2].find(x => getVal(x) === '');
    if (!f) return;
    setVal(f, t.dataset.t); f.classList.remove('miss');
    const nx = [e1, e2].find(x => getVal(x) === ''); sfFocus(nx || f); label();
  });
  app.querySelectorAll('[data-op]').forEach(b => b.onclick = () => { eo.textContent = b.dataset.op; eo.classList.remove('miss'); label(); });
  eo.onclick = () => { eo.textContent = ''; label(); };
  label();
}

/* Kluringar Själv – stegen ges, räkningen gör barnet (Dennis 12/11: "en kompromiss där de får hjälp i vilket steg man
   skall göra, men inte få allt serverat"). Frågeraden för steget lyser, och raden "Vänd på det" har gånger färdigt
   (verktyget från Med hjälp). Barnet väljer talen, räknar och skriver svaret i frågan. Inga pilar, ingen flygning,
   inget varför, ingen rättning före Klar. Mittenrutan är en ruta som syns i båda raderna. */
function klurSelf(a, b, k, mid, tot) {
  const bx = id => `<div class="box sm" id="${id}"></div>`;
  const fl = n => `${bx('s' + n + 'a')}<span class="fop">·</span>${bx('s' + n + 'b')}<span>=</span>${bx('s' + n + 'c')}`;
  app.innerHTML = kdShell('Kluringar') + `
  <div class="card">
    <div class="story">Vilket tal tänker jag på? Först delar jag det med <b class="tok">${a}</b>. Sedan delar jag svaret med <b class="tok">${b}</b>. Då får jag <b class="tok">${k}</b>.</div>
    <div class="ask" id="ask"></div>
    <div class="kgrid">   <!-- samma uppställning som Med hjälp: frågeraden till vänster, dess vända rad till höger -->
      <div class="dzrow orig two"><small>FRÅGAN</small>
        <div id="rowA">${bx('kT')} / <span class="dzn">${a}</span> = <span class="dzq" id="mA">?</span></div>
        <div id="rowB">${bx('kM')} / <span class="dzn">${b}</span> = <span class="dzn">${k}</span></div></div>
      <div class="dzrow flip two"><small>VÄND PÅ DET</small><div id="st2"></div><div id="st1">${fl(1)}</div></div>
    </div>
    ${toolsHTML()}
    <div id="act" class="actrow"></div>
  </div>` + padHTML('Nästa ruta') + kladdHTML();
  afterRender();
  const kM = $('#kM'), mA = $('#mA');
  let step = 1;
  const lit = r => { ['rowA', 'st2'].forEach(id => $('#' + id).classList.toggle('on', r === 'A')); ['rowB', 'st1'].forEach(id => $('#' + id).classList.toggle('on', r === 'B')); };
  lit('B');
  ask(`<span class="hint">STEG 1 · BÖRJA BAKIFRÅN</span>Vilket tal delat med ${b} blir ${k}? Vänd på det och räkna med gånger.`);
  const row = n => ['a', 'b', 'c'].map(s => ({ el: $('#s' + n + s) }));
  sfInit({
    boxes: [...row(1), { el: kM, ok: v => v === String(mid) }],
    more: () => step < 2,
    grow: () => {
      if (step >= 2) return false;
      step = 2; lit('A');
      $('#st2').innerHTML = fl(2);
      sfAdd([...row(2), { el: $('#kT'), ok: v => v === String(tot) }]);
      ask(`<span class="hint">STEG 2</span>Vilket tal delat med ${a} blir ${getVal(kM) || '?'}? Vänd på det igen, och skriv talet i den första rutan.`);
      sfFocus($('#s2a')); return true;
    },
    hint: n => step === 1
      ? (n === 1 ? `Om något delat med ${b} blir ${k}, så är det ${b} gånger så stort som ${k}.` : `Raden blir ${k} · ${b}.`)
      : (n === 1 ? `Om talet delat med ${a} blir ${mid}, så är talet ${a} gånger så stort som ${mid}.` : `Raden blir ${mid} · ${a}.`),
    onRight: kv => { lit(''); $('#kT').classList.add('ans'); ask(`<span class="ok">Klart!</span>Talet är <b>${tot}</b>. ${tot} / ${a} = ${mid}, och ${mid} / ${b} = ${k}.<span class="kv">${kv}</span>`); done(); } });
  /* mittenrutan: det barnet skriver i rad B syns i rad A */
  SF.onType = () => { mA.textContent = getVal(kM) || '?'; mA.className = getVal(kM) ? 'dzn' : 'dzq'; sfLabel(); };
  /* kT står i frågan från början men fylls i steg 2 */
  $('#kT').onclick = () => { if (step < 2) ask('Börja bakifrån: steg 1 först.'); };
}

/* Vilket tal?: barnet kryssar själv (ett tryck = kryss, ett till = ångra). När ett tal är kvar svarar man med det.
   Inget tonas bort, inget lila område (det är ledtråd 1). Ingen knappsats (D47 ✎). */
function vennSelf() {
  /* Visuellt stöd framför text (Dennis 12/11: "helst med visuellt stöd än text"): en bildförklaring (tal → överkryssat
     tal), en kort förevisning där ett tal utanför alla figurer kryssas och krysset försvinner igen, och prickar som
     räknar ner till ett. */
  const t = TASK;
  const pic = x => `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="${x ? '#e2e8f0' : '#fff'}" stroke="${x ? '#94a3b8' : '#c4b5fd'}" stroke-width="2.5"/><text x="20" y="26" text-anchor="middle" font-family="Baloo 2" font-weight="800" font-size="16" fill="#3b1d6e" opacity="${x ? .3 : 1}">9</text>${x ? '<path d="M8 8L32 32M32 8L8 32" stroke="#3b1d6e" stroke-width="4" stroke-linecap="round"/>' : ''}</svg>`;
  app.innerHTML = kdShell('Vilket tal?') + `
  <div class="card">
    <div class="story">Talet är <b class="tok">${t.clue1}</b>. Det kan delas <b class="tok">${t.clue2}</b>.</div>
    <div class="vlegend">${pic(false)}<svg viewBox="0 0 24 24" class="arr"><path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="#7c3aed" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>${pic(true)}<span>tryck = stryk</span></div>
    ${vennSVG(t, true)}
    <div class="vdots" id="vdots">${t.items.map(() => '<i></i>').join('')}<b id="vleft"></b></div>
    <div class="ask" id="ask"></div>
    ${toolsHTML()}
    <div id="act" class="actrow"></div>
  </div>` + kladdHTML();
  afterRender();
  const gs = [...app.querySelectorAll('.vn')];
  ask('Stryk talen som inte passar, tills ett är kvar.');
  sfInit({ boxes: [], onRight: () => {},
    hint: n => { if (n === 1) { $('#both').classList.add('on'); return `Det lila området är ${t.clue1}.`; } return `Tal som kan delas jämnt med ${t.k}: ${[1, 2, 3, 4, 5, 6, 7, 8].map(i => i * t.k).join(', ')} …`; } });
  padHandler = null;
  const answer = g => {
    SF.tries++;
    if (+g.dataset.n === t.answer) {
      SF.done = true; g.classList.add('win'); $('.tools').style.display = 'none';
      ask(`<span class="ok">Klart!</span>Talet är <b>${t.answer}</b>.<span class="kv">${kvText()}</span>`); done();
    } else { SF.acc.miss = true; g.classList.add('nope'); ask('<span class="soft">Inte riktigt – försök igen.</span>Läs ledtrådarna en gång till.'); }
  };
  const upd = () => {
    const left = gs.filter(g => !g.classList.contains('x'));
    [...app.querySelectorAll('#vdots i')].forEach((d, k) => { d.classList.toggle('x', k >= left.length); d.classList.toggle('one', left.length === 1 && k === 0); });
    $('#vleft').textContent = `${left.length} kvar`;
    act(left.length === 1 ? nextBtn(`Talet är ${left[0].dataset.n}`) : '', () => answer(left[0]));
  };
  /* förevisningen: tryckringen pulserar på ett tal utanför alla figurer, krysset kommer och går – avbryts vid tryck */
  const demoIt = t.items.find(it => it.reg === 'out'), demo = gs.find(g => +g.dataset.n === demoIt.n), rip = $('#ripple');
  rip.setAttribute('cx', demoIt.x); rip.setAttribute('cy', demoIt.y);
  let demoOn = true;
  const stopDemo = () => { if (!demoOn) return; demoOn = false; rip.remove(); demo.classList.remove('x'); };
  rip.classList.add('go');
  setTimeout(() => { if (demoOn) demo.classList.add('x'); }, 1100);
  setTimeout(() => { if (demoOn) demo.classList.remove('x'); }, 2600);
  setTimeout(stopDemo, 3000);
  gs.forEach(g => g.onclick = () => { if (SF.done) return; stopDemo(); g.classList.toggle('x'); gs.forEach(x => x.classList.remove('nope')); upd(); });
  upd();
}


/* 10, 100 och 1000 Själv – samma kompromiss som Kluringar: raden "Vänd på det" står färdig med räknesättet, barnet
   skriver talen i den nya ordningen, räknar och skriver svaret i frågan. Siffror stryks med tryck (nollorna). */
function dzSelf() {
  const t = TASK, tx = dzText(t);
  const digs = v => `<span class="dzn">${[...String(v)].map(c => `<i class="dz0">${c}</i>`).join('')}</span>`;
  const cell = v => v === '?' ? `<div class="box sm" id="dq"></div>` : digs(v);
  const bx = id => `<div class="box sm" id="${id}"></div>`;
  app.innerHTML = kdShell('10, 100 och 1000') + `
  <div class="card">
    <div class="ask" id="ask"></div>
    <div class="dzrow orig"><small>FRÅGAN</small>${cell(t.a)} / ${cell(t.b)} = ${cell(t.c)}</div>
    <div id="flips"><div class="dzrow flip"><small>VÄND PÅ DET</small>${bx('fa')}<span class="fop">${t.op}</span>${bx('fb')}<span>=</span>${bx('fc')}</div></div>
    ${toolsHTML()}
    <div id="act" class="actrow"></div>
  </div>` + padHTML('Nästa ruta') + kladdHTML();
  afterRender();
  ask(`${tx.q}<span class="kv">Vänd på frågan så att det okända hamnar sist. Räkna, och skriv svaret i frågan. Tryck på en siffra för att stryka den.</span>`);
  app.querySelectorAll('.dz0').forEach(z => z.onclick = () => z.classList.toggle('struck'));
  sfInit({ boxes: [{ el: $('#fa') }, { el: $('#fb') }, { el: $('#fc') }, { el: $('#dq'), ok: v => v === String(t.ans) }],
    hint: n => n === 1 ? tx.flipWhy : tx.calcWhy,
    onRight: kv => {
      $('#dq').classList.add('ans');
      ask(`<span class="ok">Klart!</span>${t.a === '?' ? t.ans : t.a} / ${t.b === '?' ? t.ans : t.b} = ${t.c}.<span class="kv">${kv}</span>`);
      done();
    } });
}

/* Dela och gruppera: Svårare utan bild – berättelsen, divisionen och kontrollen skrivs av barnet. Lättare har kvar
   bilden, men barnet ringar in påsarna själv (5 bollar i taget), utan hoppräkning. */
function grpSelf() {
  const { name, tot, g, q, r } = TASK, easy = r === 0;
  const bx = (id, cap, rest) => `<div class="box sm${rest ? ' rest' : ''}" id="${id}">${cap ? `<span class="cap"${rest ? ' style="color:var(--lila)"' : ''}>${cap}</span>` : ''}</div>`;
  app.innerHTML = kdShell('Dela och gruppera') + `
  <div class="card">
    <div class="story">${name} har <b class="tok">${tot}</b> bollar. <b class="tok">${g}</b> bollar ryms i varje påse. ${easy ? 'Hur många påsar blir det?' : 'Hur många påsar blir fulla, och hur många bollar blir över?'}</div>
    ${easy ? `<div class="heap self" id="heap">${'<i class="ball"></i>'.repeat(tot)}</div><div class="bags" id="bags"></div>` : ''}
    <div class="ask" id="ask"></div>
    <div class="gdiv" style="margin-top:10px"><div class="frac2">${bx('gN')}<div class="fl"></div>${bx('gD')}</div><span>=</span>${bx('gQ', 'påsar')}${easy ? '' : `<span>,</span>${bx('gR', 'över', true)}`}</div>
    <div class="kctl"><small>KONTROLL</small>${bx('k1')}<span>·</span>${bx('k2')}${easy ? '' : `<span>+</span>${bx('k3')}`}<span>=</span>${bx('k4')}</div>
    ${toolsHTML()}
    <div id="act" class="actrow"></div>
  </div>` + padHTML('Nästa ruta') + kladdHTML();
  afterRender();
  ask(easy ? `Gör påsar: tryck på ${g} bollar, så blir de en påse. Skriv sedan divisionen och kontrollen.` : 'Skriv divisionen och kontrollen själv.');
  if (easy) $('#heap').onclick = e => {
    const b = e.target.closest('.ball'); if (!b) return;
    b.classList.toggle('sel');
    const sel = [...$('#heap').querySelectorAll('.ball.sel')];
    if (sel.length === g) { sel.forEach(x => x.remove()); $('#bags').insertAdjacentHTML('beforeend', `<div class="bag self">${'<i class="ball in"></i>'.repeat(g)}</div>`); }
  };
  const pair = other => v => { const o = getVal($('#' + other)); return (v === String(g) && o === String(q)) || (v === String(q) && o === String(g)); };
  const boxes = [{ el: $('#gN'), ok: v => v === String(tot) }, { el: $('#gD'), ok: v => v === String(g) }, { el: $('#gQ'), ok: v => v === String(q) }];
  if (!easy) boxes.push({ el: $('#gR'), ok: v => v === String(r) });
  boxes.push({ el: $('#k1'), ok: pair('k2') }, { el: $('#k2'), ok: pair('k1') });
  if (!easy) boxes.push({ el: $('#k3'), ok: v => v === String(r) });
  boxes.push({ el: $('#k4'), ok: v => v === String(tot) });
  sfInit({ boxes,
    hint: n => n === 1 ? 'Täljaren är alla bollar från början. Nämnaren är hur många som ryms i en påse.' : `Kontrollen: påsarna gånger bollarna i varje påse${easy ? '' : ', plus de som blev över'}, ska bli alla bollarna.`,
    onRight: kv => { $('#gQ').classList.add('ans'); if (!easy) $('#gR').classList.add('ans');
      ask(`<span class="ok">Klart!</span>${tot} / ${g} = <b>${q}</b>${easy ? '' : `, rest <b>${r}</b>`}.<span class="kv">${kv}</span>`); done(); } });
}

/* Divisionstabellen: rutnätet utan "Tänk gånger". Ledtråden visar gångertalet för rutan man står i. */
function tabSelf(items) {
  app.innerHTML = kdShell('Divisionstabellen') + `
  <div class="card">
    <div class="ask" id="ask"></div>
    <div class="tgrid">${items.map(([a, b], i) => `<div class="trow" id="tr${i}"><span>${a} / ${b} =</span><div class="box" id="tb${i}"></div></div>`).join('')}</div>
    ${toolsHTML()}
    <div id="act" class="actrow"></div>
  </div>` + padHTML('Nästa ruta') + kladdHTML();
  afterRender();
  ask('Skriv svaren. Tryck på en ruta för att välja den.');
  sfInit({ boxes: items.map(([a, b], i) => ({ el: $('#tb' + i), ok: v => v === String(a / b) })),
    hint: n => { const i = Math.max(0, items.findIndex((_, j) => $('#tb' + j).classList.contains('focus'))); const [a, b] = items[i];
      return n === 1 ? `Tänk gånger: ${b} · ? = ${a}.` : `Räkna i ${b}-hopp: ${b}, ${2 * b}, ${3 * b} … tills du når ${a}.`; },
    onRight: kv => { ask(`<span class="ok">Klart!</span>Alla tio stämmer.<span class="kv">${kv}</span>`); done(); } });
}


/* ══════════ Stommen: hubben, omgången, kvittot, lagringen, kladden och lägena ══════════ */
let RUN = null, TASK = null, ERR = false, profile = null, onBack = null, ROOT = null;
const KEY = () => `ovningsblad_${profile && profile.id}`;
function readSt() { try { return JSON.parse(localStorage.getItem(KEY())) || {}; } catch (_) { return {}; } }
function writeSt(s) {
  try { if (window.MP && MP.safeSetItem) MP.safeSetItem(KEY(), JSON.stringify(s)); else localStorage.setItem(KEY(), JSON.stringify(s)); } catch (_) {}
}
function savePrefs() { const s = readSt(); s.mode = MODE; s.level = LEVEL; writeSt(s); }

function hub() {
  clearFx();
  view = 'hub'; padHandler = null; SF = null; RUN = null; TASK = null;
  app.classList.add('hubv'); app.classList.remove('klopen');
  const st = readSt();
  const badge = id => {
    const r = st.res && st.res[id];
    if (!r || r.level !== LEVEL || r.mode !== MODE) return '';
    return `<em class="badge${r.of && r.ok / r.of >= 0.6 ? ' g' : ''}">${r.of === 1 ? 'Klart' : `${r.ok}/${r.of}`}</em>`;
  };
  const tile = m => `<button class="tile" data-open="${m.id}"><b>${m.nr}</b><span>${m.name}<small>${m.sub}</small></span>${badge(m.id)}</button>`;
  const sg = (key, cur, opts) => `<div class="seg" style="flex:1">${opts.map(o => `<button data-${key}="${o.id}" class="${cur === o.id ? 'on' : ''}" aria-pressed="${cur === o.id}">${o.name}</button>`).join('')}</div>`;
  app.innerHTML = `<div class="top"><button class="back" data-out>${ic.back}Tillbaka</button><div class="ttl">Övningsblad</div><div style="width:86px"></div></div>
  <div style="display:flex;gap:8px">${sg('lv', LEVEL, O.LEVELS)}${sg('md', MODE, O.MODES)}</div>
  ${['GRUNDER', 'RÄKNA', 'TÄNKA'].map(sec => `<div class="sec">${sec}</div><div class="tiles">${O.MODULES.filter(m => m.sec === sec).map(tile).join('')}</div>`).join('')}
  <p class="note">${MODE === 'help' ? 'Med hjälp visar varje steg och varför.' : 'Själv: du räknar, appen ger uppställningen. Ledtråd finns om du kör fast.'}</p>`;
  app.querySelector('[data-out]').onclick = () => { if (onBack) onBack(); };
  app.querySelectorAll('[data-open]').forEach(b => b.onclick = () => startModule(b.dataset.open));
  app.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => { LEVEL = b.dataset.lv; savePrefs(); hub(); });
  app.querySelectorAll('[data-md]').forEach(b => b.onclick = () => { MODE = b.dataset.md; savePrefs(); hub(); });
  applySize();
}

const VIEWS = { kd: () => kdView({ task: TASK }), trap: () => trapView(), prob: () => probView(), klur: () => klurView(),
  venn: () => vennView(), dz: () => dzView(), grp: () => grpView(), tab: () => tabView() };
function startModule(id) { RUN = { id, tasks: O.makeRound(id, LEVEL), i: 0, results: [] }; runTask(); }
function runTask() { ERR = false; PROB = null; TASK = RUN.tasks[RUN.i]; VIEWS[RUN.id](); }
/* en uppgift är klar: resultatet sparas en gång, och knappen leder till nästa uppgift eller kvittot */
function finish(res, extra = '') {
  if (!RUN) return;
  if (res && RUN.results.length === RUN.i) RUN.results.push(res);
  const last = RUN.i + 1 >= RUN.tasks.length;
  act(`${extra}<button class="next" id="nextTask">${last ? 'Se kvittot' : 'Nästa uppgift'} ${ic.next}</button>`);
  $('#nextTask').onclick = () => { if (last) kvitto(); else { RUN.i++; runTask(); } };
}
const done = () => finish(SF ? { first: !SF.acc.miss, hints: SF.acc.hints } : { first: !ERR, hints: 0 });
/* kvittot (D39): beröm från 60 %, annars bara antalet; Själv visar också ledtrådarna */
function kvitto() {
  const sum = O.summary(RUN.results), id = RUN.id, m = O.MODULES.find(x => x.id === id);
  const st = readSt(); st.res = st.res || {};
  st.res[id] = { level: LEVEL, mode: MODE, ok: sum.ok, of: sum.of, hints: sum.hints, at: Date.now() };
  writeSt(st);
  const tail = ' direkt';   /* som Matteprov: "Du fick 1 av 3 rätt direkt" fungerar i alla tre formerna av MP.resultNote */
  /* Divisionstabellen är ett blad med tio tal: kvittot säger det, inte "1 av 1" */
  const note = sum.of === 1 ? (sum.ok ? `Alla tio rätt${tail}!` : 'Alla tio är rätt nu.')
    : window.MP && MP.resultNote ? MP.resultNote(sum.ok, sum.of, tail) : `Du fick ${sum.ok} av ${sum.of} rätt${tail}.`;
  app.innerHTML = kdShell(m.name) + `
  <div class="card kvcard">
    <div class="kvbig${sum.high ? ' good' : ''}">${sum.high ? ic.check : ''}${sum.of === 1 ? '' : `<span>${sum.ok}<small>/${sum.of}</small></span>`}</div>
    <div class="kvnote">${note}</div>
    ${MODE === 'self' ? `<p class="note">${sum.hints ? `Ledtrådar: ${sum.hints}` : 'Utan ledtråd'}</p>` : ''}
    <div class="kvbtns"><button class="next" id="again">En omgång till ${ic.next}</button><button class="ghost" id="tohub">Till övningsbladen</button></div>
  </div>`;
  afterRender();
  $('#again').onclick = () => startModule(id);
  $('#tohub').onclick = hub;
}

function afterRender() {
  const h = $('[data-hub]'); if (h) h.onclick = hub;
  scSetup(); applySize();
}

/* ── Lägena (brainstorm/17 varv 3, D47 ✎): telefon stående, telefon liggande (två spalter, kladden bakom en knapp,
   kortet krymps så att det ryms), iPad stående och liggande (stor kladd). iPad-texten skalas med iPad-planen (D45). ── */
function sizeClass() {
  const w = window.innerWidth, h = window.innerHeight;
  if (w > h && h < 520) return 'pl';
  if (Math.min(w, h) >= 700) return w > h ? 'il' : 'ip';
  return 'pp';
}
let SIZE = 'pp';
function applySize() {
  if (!app) return;
  const s = sizeClass();
  if (s !== SIZE || !app.classList.contains(s)) {
    app.classList.remove('pp', 'pl', 'ip', 'il', 'klopen'); app.classList.add(s); SIZE = s;
    const kb = $('[data-kl]'); if (kb) kb.textContent = 'Kladd';
  }
  fitCard(); requestAnimationFrame(scSync);
}
/* Kortet krymps (transform, inte zoom – zoom skalar inte text på iOS) när det inte ryms:
   - telefon liggande: så att kortet ryms i sin spalt bredvid knappsatsen (D47 ✎);
   - telefon stående: bara så mycket att kladden får sina 100 px (små telefoner, t.ex. 375 × 667), aldrig under 60 %. */
let fitQ = false;
function fitCard() {
  const card = $('.card'); if (!card) return;
  let inner = card.firstElementChild;
  if (!inner || !inner.classList.contains('cardin') || card.children.length > 1) {
    inner = document.createElement('div'); inner.className = 'cardin';
    while (card.firstChild) inner.appendChild(card.firstChild);
    card.appendChild(inner);
  }
  inner.style.transform = ''; card.style.height = ''; app.classList.remove('fitv');
  if (SIZE === 'pl') {
    const cs = getComputedStyle(card), room = card.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const z = Math.min(1, room / Math.max(1, inner.offsetHeight + 2));
    if (z < 1) inner.style.transform = `scale(${Math.max(0.55, z).toFixed(3)})`;
    return;
  }
  if (SIZE !== 'pp') return;
  const kl = $('.kladd'); if (!kl || getComputedStyle(kl).display === 'none') return;
  /* kladden har min-height 100 px; mät det som syns ovanför appens nederkant */
  const ab = app.getBoundingClientRect().bottom - parseFloat(getComputedStyle(app).paddingBottom), kr = kl.getBoundingClientRect();
  const need = 100 - (Math.min(kr.bottom, ab) - kr.top);
  if (need <= 1) return;
  app.classList.add('fitv');
  const H = inner.offsetHeight, cardH = card.offsetHeight, z = Math.max(0.6, (H - need) / H);
  card.style.height = Math.round(cardH - H * (1 - z)) + 'px';
  inner.style.transform = `scale(${z.toFixed(3)})`;
}

/* ── Kladden: appens kladd (D48), samma ritkod som matteprov.js scratchHTML/scSetup: penna, sudd, Ångra/Gör om, rensa ── */
const SC_IC = {
  pen: '<path d="M4 20l1.2-4.4L15.6 5.2a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.4 18.8z"/><path d="M13.8 7l3.2 3.2"/>',
  erase: '<path d="M8.5 19.5h11"/><path d="M4.6 14.6l8.8-8.8a2 2 0 0 1 2.8 0l2.4 2.4a2 2 0 0 1 0 2.8L12 17.6a2 2 0 0 1-2.8 0z"/><path d="M8.8 10.4l5.2 5.2"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  clear: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>' };
function kladdHTML() {
  const b = (k, label, on) => `<button class="scb${on ? ' on' : ''}" id="ov-sc-${k}" data-sc="${k}" aria-label="${label}" title="${label}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${SC_IC[k]}</svg></button>`;
  return `<div class="kladd"><div class="scbar"><span class="kl">KLADD</span>${b('pen', 'Rita', true)}${b('erase', 'Sudda')}${b('undo', 'Ångra')}${b('redo', 'Gör om')}${b('clear', 'Rensa kladden')}</div><canvas id="ov-canvas" class="kcanvas"></canvas></div>`;
}
function createHistory() {
  let ops = [], idx = 0;
  return {
    push(op) { ops.length = idx; ops.push(op); idx = ops.length; },
    undo() { if (idx > 0) { idx--; return true; } return false; },
    redo() { if (idx < ops.length) { idx++; return true; } return false; },
    canUndo() { return idx > 0; }, canRedo() { return idx < ops.length; },
    visible() { const live = ops.slice(0, idx); let k = -1; live.forEach((o, i) => { if (o.type === 'clear') k = i; }); return live.slice(k + 1); },
    reset() { ops = []; idx = 0; } };
}
let scCanvas = null, scCtx = null, scDrawing = false, scErasing = false, scObs = null, scHist = createHistory(), scStroke = null;
function scSetup() {
  if (scObs) { scObs.disconnect(); scObs = null; }
  scCanvas = $('#ov-canvas'); scCtx = null; scErasing = false; scHist.reset(); scStroke = null;
  if (!scCanvas) return;
  requestAnimationFrame(() => {
    if (!scCanvas || !scCanvas.isConnected) return;
    const r = scCanvas.getBoundingClientRect();
    scCanvas.width = Math.max(Math.round(r.width) || 300, 60); scCanvas.height = Math.max(Math.round(r.height) || 120, 40);
    scCtx = scCanvas.getContext('2d');
    scCanvas.addEventListener('pointerdown', scPD); scCanvas.addEventListener('pointermove', scPM);
    scCanvas.addEventListener('pointerup', scPU); scCanvas.addEventListener('pointercancel', scPU);
    if (typeof ResizeObserver !== 'undefined') { scObs = new ResizeObserver(scSync); scObs.observe(scCanvas); }
    scButtons();
  });
}
function scSync() {
  if (!scCanvas || !scCtx || !scCanvas.isConnected) return;
  const w = Math.round(scCanvas.clientWidth), h = Math.round(scCanvas.clientHeight);
  if (!w || !h || (Math.abs(w - scCanvas.width) < 2 && Math.abs(h - scCanvas.height) < 2)) return;
  scCanvas.width = w; scCanvas.height = h; scRedraw();
}
function scSeg(op, a, b) {
  scCtx.globalCompositeOperation = op.erase ? 'destination-out' : 'source-over';
  scCtx.lineWidth = op.erase ? 20 : b[2];
  scCtx.strokeStyle = '#0d9488'; scCtx.lineCap = 'round'; scCtx.lineJoin = 'round';
  scCtx.beginPath(); scCtx.moveTo(a[0], a[1]); scCtx.lineTo(b[0], b[1]); scCtx.stroke();
}
function scDrawOp(op) { const P = op.pts; if (P.length === 1) scSeg(op, P[0], P[0]); for (let i = 1; i < P.length; i++) scSeg(op, P[i - 1], P[i]); }
function scRedraw() {
  if (!scCtx || !scCanvas) return;
  scCtx.globalCompositeOperation = 'source-over'; scCtx.clearRect(0, 0, scCanvas.width, scCanvas.height);
  for (const op of scHist.visible()) if (op.type === 'stroke') scDrawOp(op);
}
function scButtons() {
  const u = $('#ov-sc-undo'), r = $('#ov-sc-redo');
  if (u) u.classList.toggle('off', !scHist.canUndo());
  if (r) r.classList.toggle('off', !scHist.canRedo());
}
function scPos(e) { const r = scCanvas.getBoundingClientRect(); return [(e.clientX - r.left) * (scCanvas.width / r.width), (e.clientY - r.top) * (scCanvas.height / r.height)]; }
function scPD(e) {
  if (!scCtx) return;
  e.preventDefault(); scDrawing = true;
  const [x, y] = scPos(e);
  scStroke = { type: 'stroke', erase: scErasing, pts: [[x, y, 2 + (e.pressure || 0.5) * 3]] };
  try { scCanvas.setPointerCapture(e.pointerId); } catch (_) {}
}
function scPM(e) {
  if (!scDrawing || !scCtx || !scStroke) return;
  e.preventDefault();
  const [x, y] = scPos(e), pt = [x, y, 2 + (e.pressure || 0.5) * 3];
  scSeg(scStroke, scStroke.pts[scStroke.pts.length - 1], pt); scStroke.pts.push(pt);
}
function scPU() { if (scDrawing && scStroke && scStroke.pts.length > 1) { scHist.push(scStroke); scButtons(); } scDrawing = false; scStroke = null; }
function scTool(erase) { scErasing = erase; const p = $('#ov-sc-pen'), e = $('#ov-sc-erase'); if (p) p.classList.toggle('on', !erase); if (e) e.classList.toggle('on', erase); }
function scClear() { if (scHist.visible().length) { scHist.push({ type: 'clear' }); scRedraw(); scButtons(); } }
function scUndo() { if (scHist.undo()) { scRedraw(); scButtons(); } }
function scRedo() { if (scHist.redo()) { scRedraw(); scButtons(); } }

/* ── Öppna övningsbladen (från divisionens lägesvy i multdiv.js) ── */
function open(p, back) {
  profile = p; onBack = back || null;
  ROOT = document.getElementById('ov-root');
  if (!ROOT) return;
  if (!ROOT._ovBound) {
    ROOT.innerHTML = `<style>${CSS}</style><div class="app pp" id="ov-app"></div>`;
    app = ROOT.querySelector('#ov-app');
    bindApp();
    window.addEventListener('resize', applySize);
    new MutationObserver(() => { if (fitQ || SIZE === 'ip' || SIZE === 'il') return; fitQ = true; requestAnimationFrame(() => { fitQ = false; fitCard(); }); })
      .observe(app, { childList: true, subtree: true, characterData: true });
    if (document.fonts) document.fonts.ready.then(fitCard);
    ROOT._ovBound = true;
  }
  const st = readSt(); MODE = st.mode === 'self' ? 'self' : 'help'; LEVEL = st.level === 'easy' ? 'easy' : 'hard';
  hub();
  if (typeof Router !== 'undefined') Router.show('screen-ovningsblad');
}

return { open, _t: () => ({ TASK, P, RUN, MODE, LEVEL, SIZE }), _speed: v => { SPEED = v; } };   /* _t: bara för genomspelningen i webbläsaren */
})();
if (typeof window !== 'undefined') window.Ovningsblad = Ovningsblad;
