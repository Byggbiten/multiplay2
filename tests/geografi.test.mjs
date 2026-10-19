/* tests/geografi.test.mjs — Geografi, Sveriges landskap (js/geografi-logic.js, js/geografi-data.js,
   MP.spreadShuffle och MP.createDrill med sameKey i js/shared.js, Capy-händelsen landskap).
   Datat mot källan i referens/, urvalet och blandningen (D34), extratillfällets avstånd, lådorna och
   pärmens nivåer (D30, D35), faktarutans särskilda rader (D31), flervalets platser (D17), testet per
   område (D30), hemlandskapet (D36, av från början), snäppradien (D32) och ett textsvep (D33). */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const MP = require('../js/shared.js');
globalThis.MP = MP;
const GD = require('../js/geografi-data.js');
const GL = require('../js/geografi-logic.js');
const Capy = require('../js/capy.js');
const C = Capy._test;
const SP = MP.spaced;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function seeded(seed) { return () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }; }
const adjSame = (o, key) => o.some((x, i) => i > 0 && key(x) === key(o[i - 1]));

/* ── Datat ─────────────────────────────────────────────── */
describe('appens data stämmer med källan i referens/', () => {
  const lax = JSON.parse(fs.readFileSync(path.join(ROOT, 'referens/landskap-laxbok.json'), 'utf8'));
  const fak = JSON.parse(fs.readFileSync(path.join(ROOT, 'referens/sverige-landskap/landskap-fakta.json'), 'utf8')).landskap;
  const bil = JSON.parse(fs.readFileSync(path.join(ROOT, 'referens/sverige-landskap/bilder.json'), 'utf8')).filer;
  it('25 landskap i läxbokens ordning, med namn, landsdel och path ur landskap-laxbok.json', () => {
    expect(GD.landskap.map(l => [l.nr, l.namn, l.landsdel, l.path])).toEqual(lax.map(l => [l.nr, l.namn, l.landsdel, l.path]));
  });
  it('städer, blomma, djur, rang och "Visste du?" ur landskap-fakta.json', () => {
    for (const l of GD.landskap) {
      const f = fak[String(l.nr)];
      expect(l.stad).toEqual([f.storsta_stad.namn, ...(f.ocksa_stor_stad ? [f.ocksa_stor_stad.namn] : [])]);
      expect([l.blomma, l.djur, l.yta_rang, l.invanare_rang]).toEqual([f.blomma, f.djur, f.yta_rang, f.invanare_rang]);
      expect(l.visste).toEqual(f.visste_du.map(v => v.text));
      expect(l.bilder).toEqual(f.bilder);
    }
  });
  it('75 bildkällor ur bilder.json, och varje bild och kartan finns i assets/geografi/sverige/', () => {
    expect(GD.bilder.map(b => [b.fil, b.upphov, b.licens, b.kallsida])).toEqual(bil.map(b => [b.fil, b.upphov, b.licens, b.kallsida]));
    for (const b of GD.bilder) expect(fs.existsSync(path.join(ROOT, 'assets/geografi/sverige', b.fil)), b.fil).toBe(true);
    for (const l of GD.landskap) for (const v of Object.values(l.bilder)) expect(fs.existsSync(path.join(ROOT, 'assets/geografi/sverige', v)), v).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'assets/geografi/sverige/karta.svg'))).toBe(true);
  });
});

/* ── Blandningen (D34) ─────────────────────────────────── */
describe('MP.spreadShuffle', () => {
  it('ger en permutation, aldrig samma nyckel två gånger i rad (500 lottningar med par)', () => {
    const items = [1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 8].map((n, i) => ({ n, i }));
    const r = seeded(7);
    for (let k = 0; k < 500; k++) {
      const o = MP.spreadShuffle(items, { key:x => x.n, sig:x => x.i, r });
      expect(o.map(x => x.i).sort((a, b) => a - b)).toEqual(items.map(x => x.i));
      expect(adjSame(o, x => x.n)).toBe(false);
    }
  });
  it('med minnet: två rundor i rad får aldrig samma ordning', () => {
    const items = [1, 2, 3, 4, 5].map(n => ({ n })), memo = {};
    let prev = null;
    for (let k = 0; k < 300; k++) {
      const o = MP.spreadShuffle(items, { key:x => x.n, memo, memoKey:'x' }).map(x => x.n).join();
      expect(o).not.toBe(prev); prev = o;
    }
  });
  it('rör inte originalet', () => {
    const items = [{ n:1 }, { n:2 }, { n:3 }]; const copy = JSON.stringify(items);
    MP.spreadShuffle(items, { key:x => x.n }); expect(JSON.stringify(items)).toBe(copy);
  });
});

describe('MP.createDrill med sameKey (extratillfället)', () => {
  it('utan opts: samma insättning som förut (Gångertabellen och Klockan oförändrade)', () => {
    for (let s = 1; s < 60; s++) {
      const items = Array.from({ length:10 }, (_, i) => ({ q:i }));
      const r1 = seeded(s), r2 = seeded(s);
      const d = MP.createDrill(items, r1);
      const k = s % 7; for (let j = 0; j < k; j++) d.answer(true);
      const res = d.answer(false);
      const lo = k + 3, hi = 10, expected = lo >= hi ? hi : lo + Math.floor(r2() * (hi - lo + 1));
      expect(res.insertedAt).toBe(expected);
    }
  });
  it('minst två frågor emellan och inte bredvid samma landskap när det finns plats (500 prov)', () => {
    const r = seeded(3);
    for (let s = 0; s < 500; s++) {
      const items = GL.buildItems({ mode:'stad', area:'Götaland', order:'blandad' }, null, {}, r);
      const d = GL.createDrill(items, r);
      const k = Math.floor(r() * (items.length - 4));
      for (let j = 0; j < k; j++) d.answer(true);
      const res = d.answer(false), q = d.queue(), at = res.insertedAt;
      expect(at - k).toBeGreaterThanOrEqual(3);
      expect(q[at - 1].nr === q[at].nr && at - 1 !== k).toBe(false);
      if (q[at + 1]) expect(q[at + 1].nr).not.toBe(q[at].nr);
    }
  });
  it('extratillfället ställs igen och räknas på första försöket', () => {
    const d = GL.createDrill([{ nr:1 }, { nr:2 }, { nr:3 }, { nr:4 }, { nr:5 }], seeded(1));
    expect(d.answer(false).record).toBe(true);
    expect(d.answer(true).record).toBe(false);
    expect(d.queue().filter(x => x.nr === 1).length).toBe(2);
  });
});

/* ── Urvalet ────────────────────────────────────────────── */
describe('urvalet i Träna', () => {
  it('Upptäck tar alla landskap i området, Städerna båda städerna', () => {
    expect(GL.buildItems({ mode:'upptack', area:'Norrland', order:'blandad' }).length).toBe(9);
    expect(GL.buildItems({ mode:'upptack', area:'Sverige', order:'blandad' }).length).toBe(25);
    const st = GL.buildItems({ mode:'stad', area:'Götaland', order:'blandad' }).map(i => i.stad);
    expect(st.length).toBe(18);
    expect(st).toEqual(expect.arrayContaining(['Linköping', 'Norrköping', 'Borgholm', 'Färjestaden', 'Malmö', 'Helsingborg']));
  });
  it('blandat: ingen upprepning i rad, och samma runda tre gånger ger tre olika ordningar', () => {
    const memo = {};
    const runs = [0, 1, 2].map(() => GL.buildItems({ mode:'namn', area:'Norrland', order:'blandad' }, null, memo).map(i => i.nr).join());
    expect(new Set(runs).size).toBe(3);
    for (let k = 0; k < 300; k++) for (const [mode, area] of [['stad', 'Götaland'], ['stad', 'Sverige'], ['bild', 'Svealand'], ['upptack', 'Norrland']]) {
      expect(adjSame(GL.buildItems({ mode, area, order:'blandad', bild:'blandat' }, null, memo), x => x.nr)).toBe(false);
    }
  });
  it('blandat följer inte norr till söder (korrelation nära noll)', () => {
    const pts = [];
    for (let k = 0; k < 300; k++) GL.buildItems({ mode:'namn', area:'Sverige', order:'blandad' }).forEach((x, j) => pts.push([x.nr, j]));
    const mx = pts.reduce((a, b) => a + b[0], 0) / pts.length, my = pts.reduce((a, b) => a + b[1], 0) / pts.length;
    const cov = pts.reduce((a, b) => a + (b[0] - mx) * (b[1] - my), 0), vx = pts.reduce((a, b) => a + (b[0] - mx) ** 2, 0), vy = pts.reduce((a, b) => a + (b[1] - my) ** 2, 0);
    expect(Math.abs(cov / Math.sqrt(vx * vy))).toBeLessThan(0.1);
  });
  it('"Norr till söder" är läxbokens ordning', () => {
    expect(GL.buildItems({ mode:'upptack', area:'Svealand', order:'rak' }).map(i => i.nr)).toEqual([9, 11, 12, 13, 14, 15]);
  });
  it('hela Sverige (utom Upptäck): tolv frågor, övar först ur lådorna', () => {
    const view = nr => nr <= 5 ? 'ovar' : 'kan';
    const it = GL.buildItems({ mode:'namn', area:'Sverige', order:'blandad' }, view);
    expect(it.length).toBe(12);
    expect([1, 2, 3, 4, 5].every(n => it.some(x => x.nr === n))).toBe(true);
  });
  it('djur, blommor, sköldar: varannan fråga på kartan, varannan med namn', () => {
    const it = GL.buildItems({ mode:'bild', area:'Norrland', order:'blandad', bild:'djur', bildSvar:'blandat' });
    expect(it.some(x => x.svar === 'karta') && it.some(x => x.svar === 'namn')).toBe(true);
  });
});

/* ── Flervalet (D17) ─────────────────────────────────────── */
describe('svarsalternativen', () => {
  it('fyra olika namn med det rätta, för alla 25', () => {
    for (const t of GL.ALL) {
      const o = GL.nameOptions(t);
      expect(o.length).toBe(4); expect(new Set(o.map(x => x.nr)).size).toBe(4);
      expect(o.filter(x => x.ok).map(x => x.nr)).toEqual([t]);
    }
  });
  it('ingen platsbias: rätt svar lika ofta på varje plats (4 000 lottningar)', () => {
    const c = [0, 0, 0, 0], r = seeded(11);
    for (let i = 0; i < 4000; i++) c[GL.nameOptions(1 + (i % 25), r).findIndex(x => x.ok)]++;
    for (const n of c) { expect(n).toBeGreaterThan(850); expect(n).toBeLessThan(1150); }
  });
  it('alternativen följer inte norr till söder (stigande ordning ungefär som slumpen, ≈ 1/24)', () => {
    let asc = 0;
    for (let i = 0; i < 4000; i++) { const o = GL.nameOptions(1 + (i % 25)).map(x => x.nr); if (o.every((x, j) => !j || x > o[j - 1])) asc++; }
    expect(asc).toBeLessThan(260);
  });
});

/* ── Testet (D30) ───────────────────────────────────────── */
describe('testet per område', () => {
  it('alla landskap i området, en gång var; hela Sverige = 25', () => {
    for (const a of GL.AREAS) {
      const t = GL.buildTest(a);
      expect(t.map(x => x.nr).sort((x, y) => x - y)).toEqual(GL.areaNrs(a).slice().sort((x, y) => x - y));
      expect(adjSame(t, x => x.nr)).toBe(false);
    }
    expect(GL.buildTest('Sverige').length).toBe(25);
  });
  it('blandade frågetyper (alla sex förekommer i hela Sverige)', () => {
    const kinds = new Set(GL.buildTest('Sverige').map(GL.kindKey));
    expect([...kinds].sort()).toEqual(['blomma', 'djur', 'karta', 'namn', 'skold', 'stad']);
  });
});

/* ── Lådorna och pärmens nivåer (D30, D35) ─────────────── */
describe('samlarpärmens nivåer', () => {
  const day = d => `2026-10-${String(d).padStart(2, '0')}`;
  it('låst → brons (övat) → silver (kan, tre dagar) → guld (alla sex frågetyperna)', () => {
    const st = SP.fresh(), kinds = [];
    expect(GL.levelOf(st, kinds, day(1))).toBe(0);
    SP.applyAnswer(st, true, day(1)); expect(GL.levelOf(st, kinds, day(1))).toBe(1);
    SP.applyAnswer(st, true, day(2)); expect(GL.levelOf(st, kinds, day(2))).toBe(1);
    SP.applyAnswer(st, true, day(3)); expect(GL.levelOf(st, kinds, day(3))).toBe(2);
    for (const [k] of GL.GOLD_KINDS.slice(0, 5)) kinds.push(k);
    expect(GL.levelOf(st, kinds, day(3))).toBe(2);
    kinds.push('skold'); expect(GL.levelOf(st, kinds, day(3))).toBe(3);
    expect(GL.levelOf(st, kinds, day(9))).toBe(3);          // "dags igen" räknas som kan
    SP.applyAnswer(st, false, day(9)); expect(GL.levelOf(st, kinds, day(9))).toBe(1);   // fel på kan → övar
  });
  it('frågetypernas nycklar', () => {
    expect([{ kind:'var' }, { kind:'namn' }, { kind:'stad' }, { kind:'bild', bild:'djur' }, { kind:'bild', bild:'blomma' }, { kind:'bild', bild:'skold' }].map(GL.kindKey))
      .toEqual(['karta', 'namn', 'stad', 'djur', 'blomma', 'skold']);
  });
  it('lagringen tål trasig data', () => {
    const v = GL.validState({ boxes:{ 7:{ box:'kan', okDays:3, level:1, due:'2026-10-20' }, 8:{ box:'x' } }, kinds:{ 7:['karta', 'fel'], 8:'x' } });
    expect(v.boxes[7].box).toBe('kan'); expect(v.boxes[8]).toEqual(SP.fresh()); expect(v.boxes[1]).toEqual(SP.fresh());
    expect(v.kinds[7]).toEqual(['karta']); expect(v.kinds[8]).toEqual([]);
    expect(Object.keys(GL.validState(null).boxes).length).toBe(25);
  });
  it('texten till nästa nivå', () => {
    expect(GL.nextLevelText(7, 1, 1).text).toBe('Till silver: svara rätt om Medelpad på tre olika dagar. Klart hittills: en dag av tre.');
    expect(GL.nextLevelText(7, 2).text).toBe('Till guld: svara rätt i alla sex frågetyperna.');
    expect(GL.lockedText(20)).toBe('Kortet låses upp i brons när du har övat på det här landskapet. Det ligger i Götaland.');
  });
});

/* ── Faktarutan (D31) ───────────────────────────────────── */
describe('faktarutans särskilda rader', () => {
  it('bara rang 1, 2, 24 eller 25: sju landskap, Öland med två rader', () => {
    const got = GL.ALL.map(n => [GL.NAME(n), GL.specialFacts(n)]).filter(([, r]) => r.length);
    expect(got).toEqual([
      ['Lappland', ['Sveriges största landskap till ytan']],
      ['Jämtland', ['Sveriges näst största landskap till ytan']],
      ['Härjedalen', ['Minst folk av alla landskap']],
      ['Uppland', ['Sveriges folkrikaste landskap']],
      ['Öland', ['Sveriges minsta landskap till ytan', 'Näst minst folk av alla landskap']],
      ['Blekinge', ['Sveriges näst minsta landskap till ytan']],
      ['Skåne', ['Sveriges näst folkrikaste landskap']],
    ]);
  });
  it('kort bekräftelse; öarna tar "på"', () => {
    expect(GL.boxMain({ nr:23, kind:'stad', stad:'Borgholm' })).toBe('Borgholm ligger på Öland.');
    expect(GL.boxMain({ nr:22, kind:'bild', bild:'skold' })).toBe('Det är Gotlands.');
    expect(GL.boxMain({ nr:7, kind:'var' })).toBe('Där ligger Medelpad.');
  });
});

/* ── Hemlandskapet (D36) ────────────────────────────────── */
describe('hemlandskapet', () => {
  it('av från början; bara ett giltigt landskap sparas', () => {
    expect(GL.validSettings(undefined)).toEqual({ home:null });
    expect(GL.validSettings({})).toEqual({ home:null });
    expect(GL.validSettings({ home:99 })).toEqual({ home:null });
    expect(GL.validSettings({ home:'7' })).toEqual({ home:null });
    expect(GL.validSettings({ home:7 })).toEqual({ home:7 });
  });
  it('inget landskap är hårdkodat som hem i modulen', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js/geografi.js'), 'utf8');
    expect(/===\s*7\b|MEAS\[7\]|pin\(true\)\s*;|Medelpad/.test(src)).toBe(false);
  });
});

/* ── Inkopplingen i appen (D35) ─────────────────────────── */
describe('inkopplingen', () => {
  const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
  it('profilens nycklar rensas och loggen ger statuschippet', () => {
    const app = read('js/app.js');
    for (const k of ['geo_state_', 'geo_settings_', 'geo_puzzle_', 'geo_log_']) expect(app).toContain('`' + k + '${id}`');
    expect(app).toMatch(/geografi:\s*id => \[`geo_log_\$\{id\}`\]/);
  });
  it('Dagens träning tar inte med Geografi (D20)', () => {
    const m = read('js/daily.js').match(/const MODULES = \[([^\]]*)\]/);
    expect(m).not.toBeNull();
    expect(m[1]).not.toMatch(/geo/);
  });
  it('service workern förcachar kartan men inte de 75 bilderna', () => {
    const sw = read('sw.js'), assets = sw.slice(sw.indexOf('const ASSETS'), sw.indexOf('];', sw.indexOf('const ASSETS')));
    expect(assets).toContain('./assets/geografi/sverige/karta.svg');
    expect(assets).not.toMatch(/geografi\/sverige\/(vapen|blommor|djur)\//);
    expect(sw.match(/CACHE_VERSION = '(v\d+)'/)[1]).toBe(read('js/app.js').match(/APP_VERSION = '(v\d+)'/)[1]);
  });
});

/* ── Pusslet (D32) ──────────────────────────────────────── */
describe('snäppradien', () => {
  it('generös men alltid under grannens mittpunkt (när grannen ligger över golvet)', () => {
    for (const [dim, nn] of [[300, 82], [40, 48], [120, 300], [20, 31], [60, 40]]) {
      const r = GL.snapRadiusPx(dim, nn);
      expect(r).toBeGreaterThanOrEqual(24);
      if (0.7 * nn >= 24) expect(r).toBeLessThan(nn);
    }
    expect(GL.snapRadiusPx(200, 1000)).toBe(100);
    expect(GL.snapRadiusPx(10, 1000)).toBe(40);
  });
});

/* ── Texterna (D33 m.fl.) ───────────────────────────────── */
describe('textsvep', () => {
  const T = GL.allTexts();
  it('inga läxboksnummer', () => {
    expect(T.filter(t => /nummer|läxbok/i.test(t))).toEqual([]);
    const digits = T.filter(t => /\d/.test(t));
    const visste = new Set(GD.landskap.flatMap(l => l.visste.map(v => v)));
    expect(digits.filter(t => ![...visste].some(v => t.includes(v)))).toEqual([]);
  });
  it('öarna tar "på", inget dubblerat ord', () => {
    expect(T.filter(t => /\bi (Gotland|Öland)\b/.test(t))).toEqual([]);
    expect(T.filter(t => /(?<!\p{L})(\p{L}+) \1(?!\p{L})/iu.test(t))).toEqual([]);   // \b räknar inte å/ä/ö som bokstäver
    expect(['hela hela Sverige', 'är är'].every(t => /(?<!\p{L})(\p{L}+) \1(?!\p{L})/iu.test(t))).toBe(true);   // kontrollen fångar felet
  });
});

/* ── Capy (v66) ─────────────────────────────────────────── */
describe('Capy: Geografi', () => {
  it('landskap i guld köar ett vanligt kort, en gång per landskap', () => {
    const st = C.defaultState();
    C.milestones(st, { type:'landskap', data:{ nr:7, name:'Medelpad' } }, '2026-10-19');
    C.milestones(st, { type:'landskap', data:{ nr:7, name:'Medelpad' } }, '2026-10-20');
    expect(st.pending).toEqual([{ spec:'vanlig', reason:'Guld i samlarpärmen: Medelpad' }]);
    expect(st.geoLand[7]).toBe('2026-10-19');
  });
  it('händelsen drar inget kort själv (köas till nästa resultat)', () => {
    const out = C.awardCore(C.defaultState(), {}, { type:'landskap', data:{ nr:1, name:'Lappland' } }, '2026-10-19', '2026-10-19T10:00:00Z');
    expect(out.card).toBe(null); expect(out.st.pending.length).toBe(1);
  });
  it('övningspassets skäl och modulens namn', () => {
    expect(C.reasonFor('pass', { type:'ovningspass', data:{ module:'geo', modeName:'Upptäck Sverige', areaName:'Norrland' } })).toBe('Övningspass i Geografi: Upptäck Sverige, Norrland');
    expect(C.reasonFor('first', { type:'test', data:{ module:'geo' } })).toBe('Första testet i Geografi');
  });
  it('äldre tillstånd utan geoLand får ett tomt', () => {
    const st = C.defaultState(); delete st.geoLand;
    expect(C.normState(st).geoLand).toEqual({});
  });
});
