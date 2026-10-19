/* tests/matteprov.test.mjs — Matteprov 4:an (D37), den rena logiken i js/matteprov-logic.js */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const L = require('../js/matteprov-logic.js');

/* Deterministisk slump så att ett fel går att återskapa */
function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const LEVELS = ['latt', 'svar'];
const N = 400;

/* En rad på pappret ur ett tal (index 0 = entalet), bredd W */
const cells = (v, W) => { const d = L.digitsOf(v); return Array.from({ length:W }, (_, i) => i < d.length ? d[i] : null); };

describe('provlistan', () => {
  it('Matteprov 1 har de fem momenten, och provets antal är satt per moment', () => {
    const P = L.PROVS[0];
    expect(P.title).toBe('Matteprov 1');
    expect(P.moments).toEqual(['tabell', 'tiotal', 'talsorter', 'uppstallning', 'problem']);
    for (const m of P.moments) expect(P.provCount[m]).toBeGreaterThan(0);
  });
  it('provet har uppgifter från alla fem momenten, i momentens ordning; tabellerna är ett blad med 20 tal', () => {
    for (const lv of LEVELS) {
      const items = L.buildProv('prov1', lv, seeded(7));
      const order = [...new Set(items.map(t => t.moment))];
      expect(order).toEqual(L.PROVS[0].moments);
      expect(items[0].type).toBe('sheet');
      expect(items[0].items.length).toBe(20);
      expect(new Set(items[0].items.map(x => x.key)).size).toBe(20);
      const marks = items.reduce((n, t) => n + (t.type === 'sheet' ? t.items.length : 1), 0);
      expect(marks).toBe(Object.values(L.PROVS[0].provCount).reduce((a, b) => a + b, 0));
    }
  });
  it('övningspasset: tabellerna är tabelltestet med 20 tal, övriga moment 8', () => {
    expect(L.ovaCount('tabell', 'latt')).toBe(20);
    expect(L.ovaCount('tabell', 'svar')).toBe(20);
    expect(L.ovaCount('uppstallning', 'svar')).toBe(8);
    const t = L.genMoment('tabell', 'svar', 20, seeded(3));
    expect(t.length).toBe(20);
    expect(new Set(t.map(x => x.key)).size).toBe(20);
  });
});

describe('facit stämmer för många slumpade uppgifter', () => {
  for (const lv of LEVELS) {
    it(`alla moment, nivå ${lv}`, () => {
      const r = seeded(lv === 'latt' ? 11 : 12);
      for (let i = 0; i < N; i++) {
        for (const t of L.genTabell(lv, 1, r)) expect(t.answer).toBe(t.x * t.y);
        for (const t of L.genTiotal(lv, 1, r)) {
          expect(t.answer).toBe(t.x * t.y); expect(t.answer).toBe(t.fact * 10 ** t.zeros);
          expect(L.check(t, [t.fact, t.answer]).ok).toBe(true);
          expect(L.check(t, [t.fact, t.answer + 10]).ok).toBe(false);
        }
        for (const t of L.genTalsorter(lv, 1, r)) { expect(t.answer).toBe(t.a * t.b); expect(L.check(t, t.fields.map(f => f.ans)).ok).toBe(true); }
        for (const t of L.genUppstallning(lv, 2, r)) {
          expect(t.answer).toBe(t.x * t.y);
          if (t.two) { expect(t.p1 + t.p2).toBe(t.answer); expect(t.p2 % 10).toBe(0); }
          expect(L.check(t, L.uppFacitRows(t)).ok).toBe(true);
        }
        for (const t of L.genProblem(lv, 4, r)) {
          const v = Function('"use strict";return (' + t.expr.replace(/·/g, '*').replace(/−/g, '-') + ')')();
          expect(t.answer).toBe(v);
          expect(L.evalExpr(L.parseExpr(t.expr))).toBe(t.answer);
          const R = L.exprRows(L.parseExpr(t.expr));
          expect(L.check(t, { expr:t.expr, rows:R.boxes }).ok).toBe(true);
          expect(R.boxes[R.boxes.length - 1]).toBe(t.answer);
          expect(t.answer).toBeGreaterThan(0);
          expect(t.steps.length).toBe(2);
          expect(t.steps[1].text).toContain(String(t.answer));
        }
      }
    });
  }
  it('prisuppgifterna räknar med prislistans priser', () => {
    const r = seeded(5);
    for (let i = 0; i < N; i++) for (const t of L.genProblem('svar', 4, r)) {
      if (t.kind === 'kop2') { const ps = [...t.text.matchAll(/(\d+) /g)].map(m => +m[1]); expect(ps.length).toBe(2); }
      if (t.kind === 'tillbaka') expect(t.answer).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('nivåvillkoren håller', () => {
  it('tabellerna: Lättare ur 2, 3, 4, 5, 10; Svårare minst en faktor ur 3–9', () => {
    const r = seeded(21);
    for (let i = 0; i < N; i++) {
      const [e] = L.genTabell('latt', 1, r);
      expect([2, 3, 4, 5, 10].includes(e.x) || [2, 3, 4, 5, 10].includes(e.y)).toBe(true);
      const [h] = L.genTabell('svar', 1, r);
      expect([3, 4, 6, 7, 8, 9].includes(h.x) || [3, 4, 6, 7, 8, 9].includes(h.y)).toBe(true);
      expect(h.x).toBeGreaterThanOrEqual(2); expect(h.y).toBeGreaterThanOrEqual(2);
    }
  });
  it('tiotal: Lättare har exakt en faktor med nollor, Svårare har nollor i båda eller hundratal', () => {
    const r = seeded(22);
    let traps = 0;
    for (let i = 0; i < N; i++) {
      const [e] = L.genTiotal('latt', 1, r);
      expect((e.za > 0) !== (e.zb > 0)).toBe(true);
      const [h] = L.genTiotal('svar', 1, r);
      expect(h.zeros).toBeGreaterThanOrEqual(2);
      if (h.trap) traps++;
    }
    expect(traps).toBeGreaterThan(N * 0.2); // fällan (5 · 6 = 30) är vanlig på Svårare
  });
  it('talsorter: Lättare 2–5 gånger 12–49, Svårare 6–9 gånger 51–98, aldrig 0 eller 1 som ental', () => {
    const r = seeded(23);
    for (let i = 0; i < N; i++) {
      const [e] = L.genTalsorter('latt', 1, r);
      expect(e.a).toBeGreaterThanOrEqual(2); expect(e.a).toBeLessThanOrEqual(5);
      expect(e.b).toBeGreaterThanOrEqual(12); expect(e.b).toBeLessThanOrEqual(49);
      const [h] = L.genTalsorter('svar', 1, r);
      expect(h.a).toBeGreaterThanOrEqual(6); expect(h.a).toBeLessThanOrEqual(9);
      expect(h.b).toBeGreaterThanOrEqual(51); expect(h.b).toBeLessThanOrEqual(98);
      for (const t of [e, h]) expect(t.b % 10).toBeGreaterThan(1);
    }
  });
  it('uppställning med ensiffrig faktor: en delprodukt per siffra, förskjuten; det svåra är raderna och additionens minne', () => {
    const r = seeded(24);
    for (let i = 0; i < N; i++) {
      const e = L.genUpp('latt', 'en', r);
      expect(e.two).toBe(false);
      expect(e.top).toBeGreaterThanOrEqual(100); expect(e.top).toBeLessThanOrEqual(399);
      expect(e.bot).toBeGreaterThanOrEqual(2); expect(e.bot).toBeLessThanOrEqual(4);
      expect(e.answer).toBeLessThanOrEqual(999);
      expect(e.parts.length).toBe(3);
      expect(L.enAddCarries(e)).toBeGreaterThanOrEqual(1);
      const h = L.genUpp('svar', 'en', r);
      expect(h.parts.length).toBe(4);                                     // fyrsiffrigt: fyra rader + summan
      expect(L.enAddCarries(h)).toBeGreaterThanOrEqual(2);
      for (const t of [e, h]) {
        expect(L.digitsOf(t.top)).not.toContain(0);
        expect(t.parts.reduce((s, p) => s + p.place, 0)).toBe(t.answer);
        t.parts.forEach((p, k) => { expect(p.i).toBe(k); expect(p.val).toBe(t.bot * p.d); expect(p.place).toBe(p.val * 10 ** k); });
      }
    }
  });
  it('uppställning med tvåsiffrig faktor: Lättare utan minnessiffror i raderna, Svårare med', () => {
    const r = seeded(25);
    for (let i = 0; i < N; i++) {
      const e = L.genUpp('latt', 'tva', r);
      expect(e.two).toBe(true);
      expect(e.bot).toBeGreaterThanOrEqual(10); expect(e.top).toBeGreaterThanOrEqual(e.bot);
      expect(e.top).toBeLessThan(100);
      expect(L.hasCarry(e.top, e.ones) || L.hasCarry(e.top, e.tens)).toBe(false);
      expect(e.answer).toBeLessThanOrEqual(999);
      const h = L.genUpp('svar', 'tva', r);
      expect(h.two).toBe(true);
      expect(h.top).toBeGreaterThanOrEqual(h.bot);
      expect(L.hasCarry(h.top, h.ones)).toBe(true);
    }
  });
  it('det större talet står alltid överst, och uppgiftens text följer x · y', () => {
    const r = seeded(26);
    for (let i = 0; i < N; i++) for (const lv of LEVELS) for (const t of L.genUppstallning(lv, 2, r)) {
      expect(t.top).toBe(Math.max(t.x, t.y));
      expect(t.text).toBe(`${t.x} · ${t.y}`);
    }
  });
  it('problemlösning: Lättare bara billiga saker och 2–4 st, Svårare har växel och två gångertal', () => {
    const r = seeded(27);
    const kinds = new Set(), forms = new Set();
    for (let i = 0; i < N; i++) {
      for (const t of L.genProblem('latt', 4, r)) {
        if (t.shop) expect(t.text).not.toMatch(/boll/);
        if (t.kind === 'ordning') expect(t.expr).toMatch(/^\d · \d \+ \d\d$/);
      }
      for (const t of L.genProblem('svar', 4, r)) { kinds.add(t.kind); if (t.kind === 'ordning') forms.add(t.expr.includes('−') ? 'minus' : 'tva'); }
    }
    expect([...kinds].sort()).toEqual(['kop2', 'omvand', 'ordning', 'tillbaka']);
    expect([...forms].sort()).toEqual(['minus', 'tva']);
  });
});

describe('felklassningen i uppställningen', () => {
  it('lärarens exempel 17 · 32: 224 + 320 = 544, nollan i den grå rutan', () => {
    const t = L.makeUpp(17, 32);
    expect(t.top).toBe(32); expect(t.bot).toBe(17);
    expect(t.p1).toBe(224); expect(t.p2).toBe(320); expect(t.answer).toBe(544);
    const W = t.width;
    expect(L.classifyUpp(t, { p1:cells(224, W), p2:cells(320, W), s:cells(544, W) })).toBe('ok');
    /* rad 2 skriven som 32 (nollan glömd), summan 256 */
    expect(L.classifyUpp(t, { p1:cells(224, W), p2:cells(32, W), s:cells(256, W) })).toBe('nolla');
    /* bara summan, räknad utan nollan */
    expect(L.classifyUpp(t, { s:cells(256, W) })).toBe('nolla');
    /* rad 2 rätt placerad men den grå rutan tom: räknas som glömd nolla */
    const grey = cells(320, W); grey[0] = null;
    expect(L.classifyUpp(t, { p1:cells(224, W), p2:grey, s:cells(544, W) })).toBe('nolla');
    /* rätt summa men en rad saknas: uträkningen ska synas */
    expect(L.classifyUpp(t, { s:cells(544, W) })).toBe('rader');
    expect(L.classifyUpp(t, { p1:cells(224, W), s:cells(544, W) })).toBe('rader');
  });
  it('hittar glömd nolla i många slumpade tvåsiffriga uppgifter', () => {
    const r = seeded(31);
    for (let i = 0; i < N; i++) for (const lv of LEVELS) {
      const t = L.genUpp(lv, 'tva', r), W = t.width, noZero = t.top * t.tens;
      expect(L.classifyUpp(t, { p1:cells(t.p1, W), p2:cells(noZero, W), s:cells(t.p1 + noZero, W) })).toBe('nolla');
      expect(L.check(t, { s:cells(t.p1 + noZero, W) }).cls).toBe('nolla');
    }
  });
  it('ensiffrig faktor: lärarens form 687 · 8 = 56 + 640 + 4800 = 5496 (raderna förskjutna, utan nolla)', () => {
    const t = L.makeUpp(687, 8), F = L.uppFacitRows(t);
    expect(t.parts.map(p => p.val)).toEqual([56, 64, 48]);
    expect(F.r1).toEqual([null, 4, 6, null]);                        // entalsrutan tom
    expect(F.r2).toEqual([null, null, 8, 4]);
    expect(L.classifyUpp(t, F)).toBe('ok');
    expect(L.classifyUpp(t, Object.assign({}, F, { r1:[4, 6, null, null] }))).toBe('plats');      // inte förskjuten
    expect(L.classifyUpp(t, Object.assign({}, F, { r1:[0, 4, 6, null] }))).toBe('ok');            // en nolla där är inte fel
    expect(L.classifyUpp(t, { s:F.s })).toBe('rader');                                              // bara summan
  });
  it('ensiffrig faktor: glömd minnessiffra kan bara gälla additionen', () => {
    const r = seeded(32);
    for (let i = 0; i < N; i++) for (const lv of LEVELS) {
      const t = L.genUpp(lv, 'en', r), F = L.uppFacitRows(t), places = t.parts.map(p => p.place);
      const nc = L.noCarrySumN(places);
      expect(nc).not.toBe(t.answer);                 // generatorn ger alltid minne i additionen
      const W = Math.max(t.width, L.digitsOf(nc).length);
      const rows = {}; for (const k of Object.keys(F)) if (k !== 's') rows[k] = F[k];
      expect(L.classifyUpp(t, Object.assign({}, rows, { s:cells(nc, W) }))).toBe('summinne');
      expect(L.classifyUpp(t, Object.assign({}, rows, { s:cells(t.answer + 1, W) }))).not.toBe('ok');
    }
  });
  it('hittar glömd minnessiffra i raderna och i additionen (tvåsiffrig, Svårare)', () => {
    const r = seeded(33);
    let rowHits = 0, addHits = 0;
    for (let i = 0; i < N; i++) {
      const t = L.genUpp('svar', 'tva', r), W = t.width + 1;
      const p1nc = L.noCarryPass(t.top, t.ones), p2nc = L.noCarryPass(t.top, t.tens) * 10;
      if (p1nc !== t.p1) { rowHits++; expect(L.classifyUpp(t, { p1:cells(p1nc, W), p2:cells(t.p2, W), s:cells(p1nc + t.p2, W) })).toBe('minne'); }
      else if (p2nc !== t.p2) { rowHits++; expect(L.classifyUpp(t, { p1:cells(t.p1, W), p2:cells(p2nc, W), s:cells(t.p1 + p2nc, W) })).toBe('minne'); }
      const sn = L.noCarrySum(t.p1, t.p2);
      if (sn !== t.answer) { addHits++; expect(L.classifyUpp(t, { p1:cells(t.p1, W), p2:cells(t.p2, W), s:cells(sn, W) })).toBe('minne'); }
    }
    expect(rowHits).toBeGreaterThan(N * 0.8);
    expect(addHits).toBeGreaterThan(0);
  });
  it('raderna rätt men summan fel ger "addition"; annat fel ger "fel"', () => {
    const t = L.makeUpp(79, 84), W = t.width;
    expect(L.classifyUpp(t, { p1:cells(t.p1, W), p2:cells(t.p2, W), s:cells(t.answer + 1, W) })).toBe('addition');
    const e = L.makeUpp(3, 254), F = L.uppFacitRows(e);
    expect(L.classifyUpp(e, Object.assign({}, F, { r0:cells(13, 4) }))).toBe('fel');
    expect(L.classifyUpp(e, F)).toBe('ok');
  });
  it('varje felklass har en egen återkoppling', () => {
    for (const k of ['nolla', 'minne', 'addition', 'fel', 'plats', 'summinne', 'rader']) expect(L.UPP_FEEDBACK[k].length).toBeGreaterThan(10);
    expect(L.UPP_FEEDBACK.nolla).toMatch(/grå rutan/);
    expect(L.UPP_FEEDBACK.minne).toMatch(/minnessiffran/);
  });
});

describe('tiotal: =-raderna, fällan och förklaringen', () => {
  it('8 · 40 = 8 · 4 tiotal = 32 tiotal = 320 och 50 · 60 = 5 · 6 hundratal = 30 hundratal = 3000', () => {
    const a = L.makeTiotal(8, 4, 0, 1);
    expect(a.given).toBe('8 · 4 tiotal'); expect(a.fields.map(f => f.ans)).toEqual([32, 320]);
    const b = L.makeTiotal(5, 6, 1, 1);
    expect(b.given).toBe('5 · 6 hundratal'); expect(b.fields.map(f => f.ans)).toEqual([30, 3000]);
    expect(L.makeTiotal(9, 4, 2, 0).given).toBe('9 · 4 hundratal');
    expect(L.check(b, [30, 300]).cls).toBe('nollfalla');
    expect(L.check(b, [24, 2400]).cls).toBe('tabell');
  });
  it('50 · 60 = 3000; 300 är nollfällan, 30000 fel antal nollor, 2400 fel tabellsvar', () => {
    const t = L.makeTiotal(5, 6, 1, 1);
    expect(t.answer).toBe(3000); expect(t.trap).toBe(true);
    expect(L.classifyTiotal(t, 3000)).toBe('ok');
    expect(L.classifyTiotal(t, 300)).toBe('nollfalla');
    expect(L.classifyTiotal(t, 30000)).toBe('nollor');
    expect(L.classifyTiotal(t, 2400)).toBe('tabell');
  });
  it('förklaringen visar tabellfaktumet först och nollorna sedan, slutsatsen sist', () => {
    const r = seeded(41);
    for (let i = 0; i < N; i++) for (const lv of LEVELS) {
      const [t] = L.genTiotal(lv, 1, r), st = L.explainTiotal(t);
      expect(st[0].text).toContain(t.given);
      expect(st[1].text).toContain(`${t.a} · ${t.b} = ${t.fact}`);
      expect(st[st.length - 1].last).toBe(true);
      expect(st[st.length - 1].text).toContain(L.fmt(t.answer));
      expect(st.length).toBe(t.trap ? 4 : 3);
    }
  });
});

describe('talsorter: leden summerar rätt', () => {
  it('rad 1 delar upp, rad 2 = a · T och a · E, rad 3 = summan av rad 2', () => {
    const r = seeded(51);
    for (let i = 0; i < N; i++) for (const lv of LEVELS) {
      const [t] = L.genTalsorter(lv, 1, r), f = t.fields.map(x => x.ans);
      expect(t.fields.map(x => x.row)).toEqual([1, 1, 2, 2, 3]);
      expect(f[0] + f[1]).toBe(t.b);
      expect(f[0] % 10).toBe(0);
      expect(f[2]).toBe(t.a * f[0]); expect(f[3]).toBe(t.a * f[1]);
      expect(f[2] + f[3]).toBe(t.answer);
      expect(f[4]).toBe(t.answer);
      expect(t.fields[4].text).toBe(`${f[2]} + ${f[3]}`);
      expect(L.checkTalsorter(t, f).ok).toBe(true);
      const bad = L.checkTalsorter(t, [f[0], f[1], f[2], f[3] + 1, f[4]]);
      expect(bad.ok).toBe(false); expect(bad.wrong).toEqual([false, false, false, true, false]);
    }
  });
  it('inget tal har två roller: faktorn, tiotalet, entalet, delarna och svaret är olika tal', () => {
    const r = seeded(52);
    for (let i = 0; i < N; i++) for (const lv of LEVELS) {
      const [t] = L.genTalsorter(lv, 1, r);
      expect(new Set([t.a, t.T, t.E, t.a * t.T, t.a * t.E, t.answer]).size).toBe(6);
    }
  });
  it('lärarens exempel 4 · 28 = 4 · 20 + 4 · 8 = 80 + 32 = 112', () => {
    const t = L.makeTalsorter(4, 28);
    expect(t.fields.map(f => f.ans)).toEqual([20, 8, 80, 32, 112]);
  });
});

describe('kvittot och sprinten', () => {
  it('per moment: grönt vid minst 75 %, gult annars; gula blir "öva på det som var svårt"', () => {
    const res = [
      ...Array(6).fill(0).map((_, i) => ({ moment:'tabell', ok:i < 5 })),       // 5/6 grön
      ...Array(4).fill(0).map((_, i) => ({ moment:'tiotal', ok:i < 2 })),       // 2/4 gul
      { moment:'talsorter', ok:true }, { moment:'talsorter', ok:true },          // 2/2 grön
      ...Array(4).fill(0).map((_, i) => ({ moment:'uppstallning', ok:i < 3 })), // 3/4 grön
      ...Array(4).fill(0).map(() => ({ moment:'problem', ok:false })),          // 0/4 gul
    ];
    const S = L.provSummary('prov1', res);
    expect(S.per.map(p => p.green)).toEqual([true, false, true, true, false]);
    expect(S.weak).toEqual(['tiotal', 'problem']);
    expect(S.ok).toBe(12); expect(S.total).toBe(20);
    const pass = L.buildWeakPass(S.weak, 'latt', seeded(1));
    expect(new Set(pass.map(t => t.moment))).toEqual(new Set(['tiotal', 'problem']));
    expect(pass.length).toBe(8);
  });
  it('sprinten: 48 tal, och skalan täcker 0–48 utan luckor', () => {
    expect(L.genSprint(seeded(2)).length).toBe(48);
    for (let n = 0; n <= 48; n++) expect(L.sprintBand(n)).toBeTruthy();
    for (let i = 1; i < L.SPRINT_BANDS.length; i++) expect(L.SPRINT_BANDS[i].lo).toBe(L.SPRINT_BANDS[i - 1].hi + 1);
    expect(L.SPRINT.secs).toBe(240);
  });
});

describe('namnen i uppgifterna (D36)', () => {
  it('texterna nämner aldrig ort, skola, klass, ålder eller veckodag', () => {
    const r = seeded(61);
    const bad = /(skola|klass|år gammal|åk |måndag|tisdag|onsdag|torsdag|fredag|lördag|söndag|bor i)/i;
    for (let i = 0; i < N; i++) for (const lv of LEVELS) for (const t of L.genProblem(lv, 4, r)) expect(t.text).not.toMatch(bad);
  });
});

describe('problemlösning: skriv uttrycket och räkna', () => {
  it('uttrycket läses med gånger först, i barnets egen ordning', () => {
    const t = L.makeTillbaka('Saga', L.SHOP.find(x => x.id === 'boll'), 6, 200);
    expect(t.expr).toBe('200 − 6 · 28'); expect(t.answer).toBe(32);
    expect(L.exprOk(t, '200 − 6 · 28')).toBe(true);
    expect(L.exprOk(t, '200-28·6')).toBe(true);
    expect(L.exprOk(t, '200 − 168')).toBe(false);       // inget gångertal: det är ett steg, inte uttrycket
    expect(L.exprOk(t, '6 · 28 − 200')).toBe(false);    // fel värde
    expect(L.exprOk(t, '200 − · 6')).toBe(false);       // går inte att läsa
    const R = L.exprRows(L.parseExpr('200 − 6 · 28'));
    expect(R.r1.map(x => x.box ? `[${x.v}]` : x.v)).toEqual([200, '[168]']);
    expect(R.boxes).toEqual([168, 32]);
    expect(L.check(t, { expr:'200 − 6 · 28', rows:[168, 32] }).ok).toBe(true);
    expect(L.check(t, { expr:'200 − 6 · 28', rows:[168, 42] }).cls).toBe('rakning');
    expect(L.check(t, { expr:'200 − 168', rows:[32] }).cls).toBe('uttryck');
  });
  it('två varor: båda gångertalen blir rutor i rad 1, summan i rad 2', () => {
    const t = L.makeKop2('Leo', L.SHOP[0], 3, L.SHOP[1], 2);
    expect(t.expr).toBe('3 · 7 + 2 · 4');
    expect(L.exprRows(L.parseExpr('2 · 4 + 3 · 7')).boxes).toEqual([8, 21, 29]);
    expect(L.check(t, { expr:'2·4+3·7', rows:[8, 21, 29] }).ok).toBe(true);
  });
  it('räkneordningen: uttrycket är givet, raderna räknas gånger först', () => {
    const t = L.makeOrdning('++', 5, 3, 6, 8);
    expect(t.needExpr).toBe(false);
    expect(L.check(t, { rows:[15, 48, 63] }).ok).toBe(true);
    expect(L.check(t, { rows:[15, 48, 168] }).ok).toBe(false);   // vänster till höger: (15 + 6) · 8
  });
  it('tabellbladet rättas per tal och ger antal rätt av 20', () => {
    const t = L.makeSheet('svar', seeded(9));
    const vals = t.items.map((x, i) => i < 17 ? x.answer : null);
    const c = L.check(t, vals);
    expect(c.okCount).toBe(17); expect(c.ok).toBe(false); expect(c.per.length).toBe(20);
  });
});

/* Dennis 19/10: "viktigt är att vårt prov vi bygger nu inte är lättare än underlaget".
   Provet byggs alltid på Svårare; varje uppgift mäts mot det svårare övningsbladets motsvarighet. */
describe('provet är aldrig lättare än underlaget', () => {
  const carriesInSum = (x, y) => L.noCarrySum(x, y) !== x + y;
  for (const chosen of LEVELS) it(`provet byggt med vald nivå ${chosen} håller bladets ribba (300 prov)`, () => {
    const r = seeded(chosen === 'latt' ? 101 : 102);
    for (let n = 0; n < 300; n++) {
      const P = L.buildProv('prov1', chosen, r);
      /* tabellerna: hela 1–10 utan ettor, tyngdpunkt 6–9 */
      const sh = P.find(t => t.type === 'sheet');
      expect(sh.items.length).toBe(20);
      for (const it of sh.items) { expect(Math.min(it.x, it.y)).toBeGreaterThanOrEqual(2); expect(Math.max(it.x, it.y)).toBeLessThanOrEqual(10); }
      expect(sh.items.filter(it => [6, 7, 8, 9].includes(it.x) || [6, 7, 8, 9].includes(it.y)).length).toBeGreaterThanOrEqual(12);
      /* tiotal och hundratal: alltid minst två nollor (80 · 70, 900 · 4), fällan finns, alla typer finns */
      const tio = P.filter(t => t.moment === 'tiotal');
      for (const t of tio) expect(t.zeros).toBeGreaterThanOrEqual(2);
      expect(tio.some(t => t.trap)).toBe(true);
      expect(tio.some(t => t.za >= 1 && t.zb >= 1)).toBe(true);
      expect(tio.some(t => Math.max(t.za, t.zb) >= 2)).toBe(true);
      expect(new Set(tio.map(t => t.key)).size).toBe(tio.length);       // inte 50 · 40 och 40 · 50 i samma prov
      /* TE: minst som 4 · 86 */
      for (const t of P.filter(t => t.moment === 'talsorter')) { expect(t.a * t.b).toBeGreaterThanOrEqual(344); expect(t.b).toBeGreaterThanOrEqual(51); }
      /* uppställning */
      const up = P.filter(t => t.moment === 'uppstallning');
      for (const t of up.filter(t => !t.two)) {
        expect(String(t.answer).length).toBeGreaterThanOrEqual(4);          // som 3 · 2475
        expect(String(t.top).length).toBeGreaterThanOrEqual(4);             // fyrsiffrigt: fyra delprodukter + summan
        expect(L.enAddCarries(t)).toBeGreaterThanOrEqual(2);                // minnessiffror i additionen
      }
      for (const t of up.filter(t => t.two)) {
        expect(String(t.answer).length).toBeGreaterThanOrEqual(4);          // som 286 · 17 och 79 · 84
        expect(t.top).toBeGreaterThanOrEqual(61);
        expect(L.carryCount(t.top, t.ones)).toBeGreaterThanOrEqual(1);      // minne i rad 1
        if (t.tens > 1) expect(L.carryCount(t.top, t.tens)).toBeGreaterThanOrEqual(1);   // och i rad 2
        expect(carriesInSum(t.p1, t.p2)).toBe(true);                        // och i summan
      }
      expect(up.filter(t => t.two).length).toBeGreaterThanOrEqual(2);
      expect(up.filter(t => !t.two).length).toBeGreaterThanOrEqual(2);
      /* problemlösning: växel som 200 − 6 · 26 och en omvänd uppgift som bladet, alla i två steg */
      const pr = P.filter(t => t.moment === 'problem');
      expect(pr.some(t => t.kind === 'tillbaka')).toBe(true);
      expect(pr.some(t => t.kind === 'omvand')).toBe(true);
      for (const t of pr) {
        expect(L.parseExpr(t.expr).length).toBeGreaterThanOrEqual(2);
        if (t.kind === 'tillbaka') { const [pay, rest] = t.expr.split(' − '); expect(+pay).toBeGreaterThanOrEqual(100); expect(eval(rest.replace('·', '*'))).toBeGreaterThanOrEqual(60); }
      }
    }
  });
  it('omvänd uppgift: 47 − 6 · 7 ger den sista domarens poäng', () => {
    const t = L.makeOmvand(6, 7, 5);
    expect(t.expr).toBe('47 − 6 · 7'); expect(t.answer).toBe(5);
    expect(L.check(t, { expr:'47 − 6 · 7', rows:[42, 5] }).ok).toBe(true);
  });
  it('omvänd uppgift: antalet domare, poängen och svaret är olika tal', () => {
    const r = seeded(77);
    for (let i = 0; i < N; i++) for (const t of L.genProblem('svar', 4, r).filter(t => t.kind === 'omvand')) {
      const [, k, p] = t.text.match(/(\d+) av dem ger (\d+) poäng/).map(Number);
      expect(new Set([k, k + 1, p, t.answer]).size).toBe(4);
    }
  });
  it('sprinten har bladets ribba: 48 tal på 4 minuter', () => {
    expect(L.SPRINT).toEqual({ secs:240, max:48 });
  });
});

/* ══ D38: hjälptrappan, det som var svårt och mitt prov ══ */
describe('hjälptrappan (D38)', () => {
  it('fel 1 = försök igen med ledtråd, 2 = bit 1, 3 = bit 2, 4 och fler = hela svaret', () => {
    expect([1, 2, 3, 4, 5, 9].map(n => L.helpStep(n))).toEqual(['retry', 'bit1', 'bit2', 'svar', 'svar', 'svar']);
    expect(L.helpStep(0)).toBe(null);
  });
  it('ensiffrig uppställning har en bit per rad: fyra rader ger hela svaret först vid sjätte felet', () => {
    expect([1, 2, 3, 4, 5, 6].map(n => L.helpStep(n, 4))).toEqual(['retry', 'bit1', 'bit2', 'bit3', 'bit4', 'svar']);
    const t = L.makeUpp(687, 8), b = L.helpBits(t, 'fel');
    expect(b.length).toBe(3);
    expect(b.map(x => new Set(x.fill.cells.map(c => c.row)).size)).toEqual([1, 2, 3]);    // rad 1, rad 1–2, rad 1–3
    expect(b[1].fill.cells.filter(c => c.row === 'r1').map(c => c.col)).toEqual([1, 2]);   // förskjuten
    for (const x of b) expect(x.fill.cells.some(c => c.row === 's')).toBe(false);
  });
  it('bitarna följer lösningsgången och ger aldrig bort slutsvaret', () => {
    const r = seeded(201);
    for (let i = 0; i < N; i++) {
      const [tio] = L.genTiotal('svar', 1, r), bt = L.helpBits(tio, 'fel');
      expect(bt[0].fill.boxes).toEqual({ 0:tio.fact });                 // tabellfaktumet först
      expect(bt[1].fill).toBe(null);                                     // sedan nollorna, i ord
      const [te] = L.genTalsorter('svar', 1, r), f = te.fields.map(x => x.ans), be = L.helpBits(te, 'fel');
      expect(be[0].fill.boxes).toEqual({ 0:f[0], 1:f[1] });              // uppdelningen
      expect(be[1].fill.boxes).toEqual({ 2:f[2], 3:f[3] });              // delarna
      for (const b of be) expect(Object.keys(b.fill.boxes)).not.toContain('4');
      const up = L.genUpp('svar', 'tva', r), bu = L.helpBits(up, 'fel');
      expect(bu[0].fill.cells.every(c => c.row === 'p1')).toBe(true);    // rad 1
      expect(bu[1].fill.cells.some(c => c.row === 'p2' && c.col === 0 && c.val === 0)).toBe(true);   // rad 2 med nollan
      for (const b of bu) expect(b.fill.cells.some(c => c.row === 's')).toBe(false);                  // summan ges aldrig
      const en = L.genUpp('svar', 'en', r), bn = L.helpBits(en, 'summinne');
      expect(bn.length).toBe(en.parts.length);                           // en bit per rad
      for (const b of bn) expect(b.fill.cells.some(c => c.row === 's')).toBe(false);
      for (const t of L.genProblem('svar', 4, r)) {
        const bp = L.helpBits(t, 'uttryck'), R = L.exprRows(L.parseExpr(t.expr));
        if (t.needExpr) { expect(bp[0].fill.expr).toBe(true); expect(bp[0].text).toContain(t.expr); }   // uttrycket först
        expect(Object.keys(bp[1].fill.boxes).map(Number)).not.toContain(R.boxes.length - 1);           // sista ledet ges inte
        expect(Object.values(bp[1].fill.boxes)).toContain(R.boxes[0]);                                  // första ledet
      }
    }
  });
  it('glömd nolla: första biten pekar på den grå rutan', () => {
    const t = L.makeUpp(17, 32), b = L.helpBits(t, 'nolla');
    expect(b[0].fill.cells).toEqual([{ row:'p2', col:0, val:0 }]);
    expect(b[0].fill.pulse).toBe(true);
    expect(b[0].text).toMatch(/grå rutan/);
    expect(L.helpHint(t, 'nolla')).toMatch(/grå rutan/);
  });
  it('ledtråden vid första felet innehåller inte svaret', () => {
    const r = seeded(202);
    for (let i = 0; i < N; i++) for (const t of [...L.genTiotal('svar', 1, r), ...L.genTalsorter('svar', 1, r), L.genUpp('svar', 'tva', r), ...L.genProblem('svar', 4, r)])
      expect(L.helpHint(t, 'fel')).not.toContain(String(t.answer));
  });
});

describe('det som var svårt sparas och glöms (D38)', () => {
  it('hjälp och svar sparas per typ och felklass, inte som exakta tal', () => {
    const h = {};
    L.recordOutcome(h, L.makeUpp(17, 32), 'svar', 'nolla', '2026-10-19');
    L.recordOutcome(h, L.makeTiotal(5, 6, 1, 1), 'hjalp', 'nollfalla', '2026-10-19');
    L.recordOutcome(h, { moment:'tabell', type:'num', x:8, y:7, answer:56 }, 'hjalp', 'fel', '2026-10-19');
    L.recordOutcome(h, L.makeTillbaka('Leo', L.SHOP[0], 6, 100), 'hjalp', 'uttryck', '2026-10-19');
    expect(Object.keys(h).sort()).toEqual(['prob:tillbaka', 'prob:uttryck', 'tab:7x8', 'tio:falla', 'tio:tvatiotal', 'upp:nolla', 'upp:tva'].sort());
    expect(h['upp:nolla'].level).toBe('svar');
    expect(h['tio:falla'].level).toBe('hjalp');
    expect(L.tagLabel('tab:7x8')).toBe('Tabellen 7 · 8');
    expect(L.tagLabel('upp:nolla')).toMatch(/grå rutan/);
  });
  it('glöms efter tre rätt direkt i rad, och ett nytt fel nollställer räkningen', () => {
    const h = {}, hard = L.makeUpp(17, 32);
    L.recordOutcome(h, hard, 'hjalp', 'nolla');
    const other = L.makeUpp(79, 84);                                  // täcker samma typer
    L.recordOutcome(h, other, 'direkt'); L.recordOutcome(h, other, 'direkt');
    expect(h['upp:nolla'].ok).toBe(2);
    L.recordOutcome(h, hard, 'hjalp', 'nolla');                       // fel igen
    expect(h['upp:nolla'].ok).toBe(0); expect(h['upp:nolla'].n).toBe(2);
    for (let i = 0; i < L.FORGET_AFTER; i++) L.recordOutcome(h, other, 'direkt');
    expect(h['upp:nolla']).toBeUndefined(); expect(h['upp:tva']).toBeUndefined();
  });
  it('en lyckad uppgift av en annan typ glömmer inget', () => {
    const h = {};
    L.recordOutcome(h, L.makeTiotal(5, 6, 1, 1), 'svar', 'nollfalla');
    for (let i = 0; i < 5; i++) L.recordOutcome(h, L.makeTiotal(7, 3, 1, 1), 'direkt');   // ingen fälla
    expect(h['tio:falla']).toBeTruthy();
    expect(h['tio:tvatiotal']).toBeUndefined();
  });
});

describe('mitt prov: bara de svåra typerna, minst Svårare (D38)', () => {
  const allTags = ['tab:7x8', 'tab:6x9', 'tio:falla', 'tio:tvatiotal', 'tio:hundratal', 'tio:tiotal', 'tio:tusental', 'te', 'upp:en', 'upp:tva',
    'upp:nolla', 'upp:rader', 'upp:minne', 'upp:minnesumma', 'prob:tillbaka', 'prob:omvand', 'prob:kop2', 'prob:ordning', 'prob:uttryck'];
  it('tomt underlag ger inget prov', () => { expect(L.buildMittProv({})).toEqual([]); });
  it('varje uppgift hör till en svår typ och håller provets nivågolv', () => {
    const r = seeded(301);
    for (let n = 0; n < 300; n++) {
      const pickN = 1 + Math.floor(r() * 14), hard = {};
      for (let k = 0; k < pickN; k++) hard[allTags[Math.floor(r() * allTags.length)]] = { level:r() < 0.5 ? 'svar' : 'hjalp', n:1, ok:0 };
      const P = L.buildMittProv(hard, r), tags = Object.keys(hard);
      expect(P.length).toBeGreaterThan(0);
      expect(P.length).toBeLessThanOrEqual(Math.max(L.MITT_MAX, Object.keys(hard).length) + 1);
      for (const t of P) {
        if (t.type === 'sheet') {
          for (const it of t.items) expect(tags).toContain(`tab:${Math.min(it.x, it.y)}x${Math.max(it.x, it.y)}`);
          continue;
        }
        expect(tags).toContain(t.forTag);
        if (t.forTag !== 'upp:minne' && t.forTag !== 'tio:tiotal') expect(L.tagsCovered(t)).toContain(t.forTag);
        if (t.moment === 'tiotal') expect(t.zeros).toBeGreaterThanOrEqual(2);
        if (t.moment === 'talsorter') expect(t.a * t.b).toBeGreaterThanOrEqual(344);
        if (t.moment === 'uppstallning') {
          expect(String(t.answer).length).toBeGreaterThanOrEqual(4);
          if (!t.two) { expect(t.parts.length).toBeGreaterThanOrEqual(4); expect(L.enAddCarries(t)).toBeGreaterThanOrEqual(2); }
          else { expect(t.top).toBeGreaterThanOrEqual(61); expect(L.noCarrySum(t.p1, t.p2)).not.toBe(t.answer); }
        }
        if (t.kind === 'tillbaka') expect(+t.expr.split(' − ')[0]).toBeGreaterThanOrEqual(100);
      }
      /* varje svår typ kommer med */
      for (const tag of tags) {
        if (tag.startsWith('tab:')) expect(P.some(t => t.type === 'sheet')).toBe(true);
        else expect(P.some(t => t.forTag === tag)).toBe(true);
      }
      /* typer som inte var svåra kommer inte med */
      const moments = new Set(tags.map(L.tagMoment));
      for (const t of P) expect(moments.has(t.moment)).toBe(true);
    }
  });
  it('kvittot räknar rätt direkt, rätt med hjälp och fick svaret; grönt bara på rätt direkt', () => {
    const res = [
      ...Array(4).fill(0).map((_, i) => ({ moment:'tiotal', ok:i < 2, outcome:i < 2 ? 'direkt' : i === 2 ? 'hjalp' : 'svar' })),
      { moment:'talsorter', ok:true, outcome:'direkt' }, { moment:'talsorter', ok:true, outcome:'direkt' },
    ];
    const S = L.provSummary('prov1', res), tio = S.per.find(p => p.id === 'tiotal');
    expect([tio.ok, tio.hjalp, tio.svar, tio.total]).toEqual([2, 1, 1, 4]);
    expect(tio.green).toBe(false);
    expect(S.per.find(p => p.id === 'talsorter').green).toBe(true);
  });
});

describe('uppställningens ordning: raderna först, summan sist (D38)', () => {
  it('ensiffrig 8288 · 7: rad för rad, summan låst tills alla rader är ifyllda', () => {
    const t = L.makeUpp(8288, 7), F = L.uppFacitRows(t), empty = {};
    expect(L.uppOpenRows(t, empty)).toEqual(['r0']);                                  // börja i entalet
    expect(L.uppOpenRows(t, { r0:F.r0 })).toEqual(['r0', 'r1']);
    expect(L.uppOpenRows(t, { r0:[6, null, null, null, null] })).toEqual(['r0']);     // halv rad räcker inte
    expect(L.uppRowSpan(t, 'r1')).toEqual([1, 2]);                                    // förskjuten ett steg
    const allRows = { r0:F.r0, r1:F.r1, r2:F.r2, r3:F.r3 };
    expect(L.uppOpenRows(t, allRows)).toEqual(['r0', 'r1', 'r2', 'r3', 's']);
    expect(L.uppOpenRows(t, Object.assign({}, allRows, { r2:null }))).toEqual(['r0', 'r1', 'r2']);
  });
  it('tvåsiffrig: rad 2 är inte ifylld utan nollan i den grå rutan', () => {
    const t = L.makeUpp(17, 32), F = L.uppFacitRows(t);
    expect(L.uppOpenRows(t, {})).toEqual(['p1']);
    expect(L.uppOpenRows(t, { p1:F.p1, p2:[null, 2, 3] })).toEqual(['p1', 'p2']);     // grå rutan tom
    expect(L.uppOpenRows(t, { p1:F.p1, p2:F.p2 })).toEqual(['p1', 'p2', 's']);
  });
  it('facit fyller alltid varje rads spann, för många slumpade uppgifter', () => {
    const r = seeded(401);
    for (let i = 0; i < N; i++) for (const lv of LEVELS) for (const t of L.genUppstallning(lv, 2, r)) {
      const F = L.uppFacitRows(t);
      for (const row of L.uppRowsOrder(t)) expect(L.uppRowFilled(t, row, F[row])).toBe(true);
      expect(L.uppOpenRows(t, F).slice(-1)[0]).toBe('s');
      /* hjälpens bitar fyller hela rader, så summan låses upp när alla bitar getts */
      const last = L.helpBits(t, 'fel').slice(-1)[0].fill, vals = {};
      for (const c of last.cells) { vals[c.row] = vals[c.row] || Array(t.width).fill(null); vals[c.row][c.col] = c.val; }
      if (t.two) { expect(L.uppRowFilled(t, 'p1', vals.p1)).toBe(true); expect(L.uppRowFilled(t, 'p2', vals.p2)).toBe(true); }
      else expect(L.uppOpenRows(t, vals).slice(-1)[0]).toBe('s');
    }
  });
});

describe('tankeraden (D38, variant A)', () => {
  const nums = s => (s.match(/\d+/g) || []).map(Number);
  it('82 · 68 och 286 · 17: leden som Dennis beskrev', () => {
    const a = L.makeUpp(82, 68);
    expect(L.thinkSteps(a, 'p1', 'ova')).toEqual(['Rad 1: 8 · 82 = 8 · 80 + 8 · 2', '= 640 + 16', '= 656. Skriv 656 på rad 1.']);
    expect(L.thinkSteps(a, 'p2', 'ova')).toEqual(['Rad 2 är tiotalet: skriv nollan i den grå rutan.', '6 · 82 = 6 · 80 + 6 · 2', '= 480 + 12', '= 492. Med nollan blir rad 2 4920.']);
    const b = L.makeUpp(286, 17);
    expect(L.thinkSteps(b, 'p1', 'ova')).toEqual(['Rad 1: 7 · 286 = 7 · 200 + 7 · 80 + 7 · 6', '= 1400 + 560 + 42', '= 2002. Skriv 2002 på rad 1.']);
    expect(L.thinkSteps(a, 's', 'ova', 0)).toEqual(['Entalet: 6 + 0.']);
    expect(L.thinkSteps(a, 's', 'ova', 1)).toEqual(['Tiotalet: 5 + 2.']);
    const e8 = L.makeUpp(8288, 7);                                     // 56, 56·10, 14·100, 56·1000
    expect(L.thinkSteps(e8, 's', 'ova', 0)).toEqual(['Entalet: 6.']);               // de förskjutna rutorna räknas inte
    expect(L.thinkSteps(e8, 's', 'ova', 1)).toEqual(['Tiotalet: 5 + 6.']);
    const e = L.makeUpp(687, 8);
    expect(L.thinkSteps(e, 'r0', 'ova')).toEqual(['Börja här: 8 · 7.', '8 · 7 = 56. Skriv det på rad 1.']);
  });
  it('leden stämmer för många slumpade uppgifter', () => {
    const r = seeded(501);
    for (let i = 0; i < N; i++) for (const lv of LEVELS) for (const t of L.genUppstallning(lv, 2, r)) {
      if (t.two) for (const row of ['p1', 'p2']) {
        const m = row === 'p1' ? t.ones : t.tens, st = L.thinkSteps(t, row, 'ova'), k = row === 'p1' ? 0 : 1;
        const terms = L.placeTerms(t.top);
        expect(terms.reduce((a, b) => a + b, 0)).toBe(t.top);                                   // uppdelningen
        expect(nums(st[k + 1]).reduce((a, b) => a + b, 0)).toBe(m * t.top);                    // delarna summerar
        expect(nums(st[k + 2])[0]).toBe(m * t.top);                                             // radens värde
        if (row === 'p2') expect(nums(st[k + 2]).slice(-1)[0]).toBe(t.p2);                      // med nollan
      } else for (const p of t.parts) expect(nums(L.thinkSteps(t, 'r' + p.i, 'ova')[1])).toContain(p.val);
    }
  });
  it('provläget visar bara uppdelningen, aldrig radens värde', () => {
    const r = seeded(502);
    for (let i = 0; i < N; i++) for (const t of L.genUppstallning('svar', 2, r)) {
      if (t.two) {
        const p1 = L.thinkSteps(t, 'p1', 'prov'), p2 = L.thinkSteps(t, 'p2', 'prov');
        expect(p1.length).toBe(1); expect(p2.length).toBe(2);
        expect(nums(p1.join(' '))).not.toContain(t.p1);
        expect(nums(p2.join(' '))).not.toContain(t.p2);
        if (t.tens > 1) expect(nums(p2.join(' '))).not.toContain(t.p2 / 10);   // 1 · 671 = 671 står redan överst
      } else for (const p of t.parts) {
        const st = L.thinkSteps(t, 'r' + p.i, 'prov');
        expect(st.length).toBe(1);
        if (p.val !== t.bot && p.val !== p.d) expect(nums(st[0])).not.toContain(p.val);
      }
      expect(L.thinkSteps(t, 's', 'prov', 1)).toEqual(['Lägg ihop raderna, kolumn för kolumn.']);
    }
  });
});

describe('tankeradens anteckningsrutor (D38 ✎)', () => {
  it('82 · 68 och 286 · 17: rutornas rätta värden', () => {
    const a = L.makeUpp(82, 68), n1 = L.thinkNotes(a, 'p1'), n2 = L.thinkNotes(a, 'p2');
    expect(n1.labels).toEqual(['8 · 80', '8 · 2']); expect(n1.prods).toEqual([640, 16]); expect(n1.sum).toBe(656);
    expect(n2.labels).toEqual(['6 · 80', '6 · 2']); expect(n2.prods).toEqual([480, 12]); expect(n2.sum).toBe(492);
    const b = L.thinkNotes(L.makeUpp(286, 17), 'p1');
    expect(b.labels).toEqual(['7 · 200', '7 · 80', '7 · 6']); expect(b.prods).toEqual([1400, 560, 42]); expect(b.sum).toBe(2002);
  });
  it('Öva rättar varje ruta; termerna summerar till radens värde för många slumpade uppgifter', () => {
    const r = seeded(601);
    for (let i = 0; i < N; i++) for (const lv of LEVELS) {
      const t = L.genUpp(lv, 'tva', r);
      for (const row of ['p1', 'p2']) {
        const n = L.thinkNotes(t, row);
        expect(n.prods.reduce((x, y) => x + y, 0)).toBe(n.sum);
        expect(n.sum * (row === 'p2' ? 10 : 1)).toBe(row === 'p1' ? t.p1 : t.p2);
        n.prods.forEach((v, j) => { expect(L.noteMark(t, row, j, String(v), 'ova')).toBe('ok'); expect(L.noteMark(t, row, j, String(v + 1), 'ova')).toBe('bad'); });
        expect(L.noteMark(t, row, n.prods.length, String(n.sum), 'ova')).toBe('ok');
        expect(L.noteMark(t, row, 0, '', 'ova')).toBe(null);
      }
    }
  });
  it('provläget rättar aldrig rutorna, varken rätt eller fel', () => {
    const r = seeded(602);
    for (let i = 0; i < N; i++) {
      const t = L.genUpp('svar', 'tva', r);
      for (const row of ['p1', 'p2']) {
        const n = L.thinkNotes(t, row);
        for (let j = 0; j <= n.prods.length; j++) for (const v of [String(j < n.prods.length ? n.prods[j] : n.sum), '1', '99999'])
          expect(L.noteMark(t, row, j, v, 'prov')).toBe(null);
      }
    }
  });
});
