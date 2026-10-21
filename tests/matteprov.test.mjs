/* tests/matteprov.test.mjs — Matteprov 4:an (D37), den rena logiken i js/matteprov-logic.js */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
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

describe('felklassningen i uppställningen (raderna bokförs av appen, bara summan rättas)', () => {
  it('17 · 32 och 687 · 8: facit är rätt, summan utan minne ger "summinne", annat fel "addition", tom "fel"', () => {
    for (const t of [L.makeUpp(17, 32), L.makeUpp(687, 8)]) {
      const F = L.uppFacitRows(t), W = t.width;
      expect(L.classifyUpp(t, F)).toBe('ok');
      expect(L.classifyUpp(t, Object.assign({}, F, { s:Array(W).fill(null) }))).toBe('fel');
      expect(L.classifyUpp(t, Object.assign({}, F, { s:cells(t.answer + 2, W) }))).toBe('addition');
    }
    const e = L.makeUpp(687, 8);
    expect(L.noCarrySumN(L.uppPlaces(e))).toBe(4496);                // 56 + 640 + 4800 utan minnet i hundratalet
    expect(L.classifyUpp(e, { s:cells(4496, 4) })).toBe('summinne');
    expect(L.uppFacitRows(e).r1).toEqual([null, 4, 6, null]);        // förskjuten, entalsrutan tom
  });
  it('glömd minnessiffra i summan hittas för många slumpade uppgifter', () => {
    const r = seeded(32);
    let hits = 0;
    for (let i = 0; i < N; i++) for (const lv of LEVELS) for (const t of L.genUppstallning(lv, 2, r)) {
      const nc = L.noCarrySumN(L.uppPlaces(t));
      if (nc === t.answer) continue;
      hits++;
      expect(L.classifyUpp(t, { s:cells(nc, Math.max(t.width, L.digitsOf(nc).length)) })).toBe('summinne');
    }
    expect(hits).toBeGreaterThan(N);
  });
  it('varje felklass har en egen återkoppling, och de borttagna klasserna finns inte kvar', () => {
    expect(Object.keys(L.UPP_FEEDBACK).sort()).toEqual(['addition', 'fel', 'summinne']);
    for (const k of Object.keys(L.UPP_FEEDBACK)) expect(L.UPP_FEEDBACK[k].length).toBeGreaterThan(10);
  });
});

describe('radfrågan (D38 ✎): appen frågar, barnet svarar, appen bokför på rätt plats', () => {
  it('4689 · 6: "Vad är 6 · 9?" = 54 bokförs med 4 i entalet och 5 i tiotalet', () => {
    const t = L.makeUpp(4689, 6);
    expect(L.rowQuestion(t, 'r0')).toEqual({ text:'Vad är 6 · 9?', answer:54 });
    expect(L.rowBook(t, 'r0')).toEqual([{ row:'r0', col:0, val:4 }, { row:'r0', col:1, val:5 }]);
    expect(L.rowBook(t, 'r1')).toEqual([{ row:'r1', col:1, val:8 }, { row:'r1', col:2, val:4 }]);   // 6 · 8 = 48, ett steg in
  });
  it('82 · 68: radsumman 656 bokförs i rad 1, 492 bokförs som 4920 efter barnets nolla', () => {
    const t = L.makeUpp(82, 68);
    expect(L.rowQuestion(t, 'p1').answer).toBe(656);
    expect(L.rowQuestion(t, 'p2').answer).toBe(492);
    expect(L.rowBook(t, 'p2')).toEqual([{ row:'p2', col:1, val:2 }, { row:'p2', col:2, val:9 }, { row:'p2', col:3, val:4 }]);   // grå rutan lämnas åt barnet
  });
  it('bokföringen ger facit för varje rad, för många slumpade uppgifter', () => {
    const r = seeded(402);
    for (let i = 0; i < N; i++) for (const lv of LEVELS) for (const t of L.genUppstallning(lv, 2, r)) {
      const F = L.uppFacitRows(t), vals = {};
      for (const row of L.uppRowsOrder(t)) {
        vals[row] = Array(t.width).fill(null);
        for (const c of L.rowBook(t, row)) vals[row][c.col] = c.val;
        if (row === 'p2') vals.p2[0] = 0;                                    // barnets nolla
        expect(vals[row]).toEqual(F[row]);
      }
      expect(L.uppOpenRows(t, vals).slice(-1)[0]).toBe('s');                 // summan låses upp
    }
  });
  it('trappan per rad: försök igen, ledtråd, svaret', () => {
    expect([1, 2, 3, 4].map(L.rowHelpStep)).toEqual(['retry', 'hint', 'svar', 'svar']);
    expect(L.rowHint(L.makeUpp(4689, 6), 'r0')).toBe('6 · 8 = 48. Lägg till en 6:a.');
    expect(L.rowHint(L.makeUpp(82, 68), 'p1')).toBe('Uppdelningen: 8 · 80 = 640 och 8 · 2 = 16. Lägg ihop dem.');
  });
  it('ledtråden innehåller aldrig radens svar (ensiffrig), för många slumpade uppgifter', () => {
    const r = seeded(403);
    for (let i = 0; i < N; i++) { const t = L.genUpp('svar', 'en', r); for (const p of t.parts) expect((L.rowHint(t, 'r' + p.i).match(/\d+/g) || []).map(Number)).not.toContain(p.val); }
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
  it('helpStep med fler bitar än två', () => {
    expect([1, 2, 3, 4, 5, 6].map(n => L.helpStep(n, 4))).toEqual(['retry', 'bit1', 'bit2', 'bit3', 'bit4', 'svar']);
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
      for (const up of [L.genUpp('svar', 'tva', r), L.genUpp('svar', 'en', r)]) {
        const bu = L.helpBits(up, 'summinne');                         // summans bitar: minnet, sedan två siffror
        expect(bu[0].fill.cells).toEqual([]);
        expect(bu[0].fill.mem).toEqual(L.addCarries(L.uppPlaces(up)));
        expect(bu[1].fill.cells.length).toBe(2);
        expect(L.digitsOf(up.answer).length).toBeGreaterThan(2);       // summan ges aldrig helt
      }
      for (const t of L.genProblem('svar', 4, r)) {
        const bp = L.helpBits(t, 'uttryck'), R = L.exprRows(L.parseExpr(t.expr));
        if (t.needExpr) { expect(bp[0].fill.expr).toBe(true); expect(bp[0].text).toContain(t.expr); }   // uttrycket först
        expect(Object.keys(bp[1].fill.boxes).map(Number)).not.toContain(R.boxes.length - 1);           // sista ledet ges inte
        expect(Object.values(bp[1].fill.boxes)).toContain(R.boxes[0]);                                  // första ledet
      }
    }
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
    L.recordOutcome(h, L.makeUpp(17, 32), 'svar', 'addition', '2026-10-19', { grey:true });
    L.recordOutcome(h, L.makeTiotal(5, 6, 1, 1), 'hjalp', 'nollfalla', '2026-10-19');
    L.recordOutcome(h, { moment:'tabell', type:'num', x:8, y:7, answer:56 }, 'hjalp', 'fel', '2026-10-19');
    L.recordOutcome(h, L.makeTillbaka('Leo', L.SHOP[0], 6, 100), 'hjalp', 'uttryck', '2026-10-19');
    expect(Object.keys(h).sort()).toEqual(['prob:tillbaka', 'tab:7x8', 'tio:falla', 'tio:tvatiotal', 'upp:minnesumma', 'upp:nolla', 'upp:tva'].sort());
    /* ensiffrig: en radfråga som fick hjälp sparas som tabellfaktumet */
    L.recordOutcome(h, L.makeUpp(4689, 6), 'hjalp', null, '2026-10-19', { rows:['r0'] });
    expect(h['tab:6x9'].level).toBe('hjalp'); expect(h['upp:en']).toBeTruthy();
    expect(h['upp:nolla'].level).toBe('svar');
    expect(h['tio:falla'].level).toBe('hjalp');
    expect(L.tagLabel('tab:7x8')).toBe('Tabellen 7 · 8');
    expect(L.tagLabel('upp:nolla')).toMatch(/grå rutan/);
  });
  it('glöms efter tre rätt direkt i rad, och ett nytt fel nollställer räkningen', () => {
    const h = {}, hard = L.makeUpp(17, 32);
    L.recordOutcome(h, hard, 'hjalp', null, null, { grey:true });
    const other = L.makeUpp(79, 84);                                  // täcker samma typer
    L.recordOutcome(h, other, 'direkt'); L.recordOutcome(h, other, 'direkt');
    expect(h['upp:nolla'].ok).toBe(2);
    L.recordOutcome(h, hard, 'hjalp', null, null, { grey:true });    // fel igen
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
    'upp:nolla', 'upp:minnesumma', 'prob:tillbaka', 'prob:omvand', 'prob:kop2', 'prob:ordning', 'prob:uttryck'];
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
        if (t.forTag !== 'tio:tiotal') expect(L.tagsCovered(t)).toContain(t.forTag);
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
    }
  });
});

describe('tankeraden i summan (D38)', () => {
  it('en kolumn i taget; förskjutna tomrutor räknas inte; provet säger bara "kolumn för kolumn"', () => {
    const a = L.makeUpp(82, 68);
    expect(L.thinkSteps(a, 's', 'ova', 0)).toEqual(['Entalet: 6 + 0.']);
    expect(L.thinkSteps(a, 's', 'ova', 1)).toEqual(['Tiotalet: 5 + 2.']);
    const e8 = L.makeUpp(8288, 7);                                     // 56, 56·10, 14·100, 56·1000
    expect(L.thinkSteps(e8, 's', 'ova', 0)).toEqual(['Entalet: 6.']);
    expect(L.thinkSteps(e8, 's', 'ova', 1)).toEqual(['Tiotalet: 5 + 6.']);
    expect(L.thinkSteps(a, 's', 'prov', 1)).toEqual(['Lägg ihop raderna, kolumn för kolumn.']);
    expect(L.thinkSteps(a, 'p1', 'ova')).toEqual([]);                  // raderna har radfrågan i stället
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

describe('kladdens historik: ångra och gör om (D38 ✎)', () => {
  const st = n => ({ type:'stroke', n });
  it('ångra och gör om i flera steg', () => {
    const h = L.createHistory();
    h.push(st(1)); h.push(st(2)); h.push(st(3));
    expect(h.visible().map(o => o.n)).toEqual([1, 2, 3]);
    expect(h.undo()).toBe(true); expect(h.undo()).toBe(true);
    expect(h.visible().map(o => o.n)).toEqual([1]);
    expect(h.canRedo()).toBe(true);
    expect(h.redo()).toBe(true);
    expect(h.visible().map(o => o.n)).toEqual([1, 2]);
    h.undo(); h.undo(); expect(h.undo()).toBe(false);                 // inget mer att ångra
    expect(h.visible()).toEqual([]);
    h.redo(); h.redo(); h.redo(); expect(h.redo()).toBe(false);
    expect(h.visible().map(o => o.n)).toEqual([1, 2, 3]);
  });
  it('ett nytt drag efter en ångring tömmer Gör om', () => {
    const h = L.createHistory();
    h.push(st(1)); h.push(st(2)); h.undo();
    h.push(st(9));
    expect(h.canRedo()).toBe(false);
    expect(h.visible().map(o => o.n)).toEqual([1, 9]);
  });
  it('Rensa är ett drag som går att ångra och göra om', () => {
    const h = L.createHistory();
    h.push(st(1)); h.push(st(2)); h.push({ type:'clear' });
    expect(h.visible()).toEqual([]);
    h.undo(); expect(h.visible().map(o => o.n)).toEqual([1, 2]);
    h.redo(); expect(h.visible()).toEqual([]);
    h.push(st(3)); expect(h.visible().map(o => o.n)).toEqual([3]);
    h.reset(); expect(h.canUndo()).toBe(false); expect(h.visible()).toEqual([]);
  });
});

/* ══ D39: snällare – tomma rutor rättas inte, och inga dömande ord ══ */
describe('tabelltestet: tomma rutor rättas aldrig (D39)', () => {
  it('med tomma rutor rättas ingenting, och knappen är Nästa', () => {
    const t = L.makeSheet('svar', seeded(11));
    const vals = Array(20).fill(null); vals[0] = t.items[0].answer;          // som Dennis: ett svar, sedan Klar
    const c = L.check(t, vals);
    expect(c.canGrade).toBe(false);
    expect(c.empty).toBe(19);
    expect(c.per.filter(x => x === false).length).toBe(0);                // inget räknas som fel
    expect(c.per.filter(x => x === null).length).toBe(19);
    expect(L.sheetEmpty(vals)).toBe(19);
    expect(L.oneButton(vals)).toBe('next');                              // knappen heter Nästa, Klar finns inte
  });
  it('runda 2: bara de öppna rutorna räknas som kvar', () => {
    const vals = ['56', '', '12', '', '9'];
    expect(L.sheetEmpty(vals, [1, 2])).toBe(1);
    expect(L.sheetEmpty(vals, [0, 2, 4])).toBe(0);
  });
  it('alla ifyllda: Klar rättar, och bara ifyllda fel är "inte riktigt ännu"', () => {
    const t = L.makeSheet('svar', seeded(12)), vals = t.items.map((it, i) => i < 3 ? it.answer + 1 : it.answer);
    const c = L.check(t, vals);
    expect(c.canGrade).toBe(true); expect(c.okCount).toBe(17); expect(c.per.filter(x => x === false).length).toBe(3);
  });
});

describe('synlig text i matteprovet är snäll (D39)', () => {
  /* svep över källkoden utan kommentarer: inga "Fel", "fel!" eller "Du glömde" som barnet kan se */
  const strip = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
  for (const f of ['js/matteprov.js', 'js/matteprov-logic.js']) it(f, () => {
    const code = strip(readFileSync(new URL('../' + f, import.meta.url), 'utf8'));
    for (const re of [/\bFel\b/, /fel!/i, /Du glömde/, /rätt av 48/, /av \$\{[^}]+\} rätt/]) expect(code).not.toMatch(re);
  });
  it('alla genererade texter i Öva och prov (ledtrådar, förklaringar, frågor)', () => {
    const r = seeded(701), texts = [];
    for (let i = 0; i < 200; i++) for (const lv of LEVELS) {
      for (const t of [...L.genTiotal(lv, 2, r), ...L.genTalsorter(lv, 1, r), ...L.genUppstallning(lv, 2, r), ...L.genProblem(lv, 4, r)]) {
        for (const cls of ['fel', 'nollfalla', 'nollor', 'tabell', 'uttryck', 'summinne', 'addition']) texts.push(L.helpHint(t, cls));
        texts.push(...L.helpBits(t, 'fel').map(b => b.text));
        if (t.type === 'tio') texts.push(...L.explainTiotal(t).map(s => s.text));
        if (t.type === 'upp') for (const row of L.uppRowsOrder(t)) { texts.push(L.rowQuestion(t, row).text || '', L.rowHint(t, row)); }
        if (t.text) texts.push(t.text);
      }
    }
    texts.push(...Object.values(L.UPP_FEEDBACK));
    for (const s of texts) { expect(s).not.toMatch(/\bFel\b/); expect(s).not.toMatch(/fel!/i); expect(s).not.toMatch(/Du glömde/); }
  });
});

describe('en knapp: Nästa tills allt är ifyllt, sedan Klar (D39 ✎)', () => {
  it('tom ruta ger Nästa, alla ifyllda ger Klar, suddning ger Nästa igen', () => {
    const v = ['640', '', ''];
    expect(L.oneButton(v)).toBe('next');
    v[1] = '16'; expect(L.oneButton(v)).toBe('next');
    v[2] = '656'; expect(L.oneButton(v)).toBe('klar');
    v[1] = '1'; expect(L.oneButton(v)).toBe('klar');                   // ändrad men inte tom: fortfarande Klar
    v[1] = ''; expect(L.oneButton(v)).toBe('next');                    // suddad tom: Nästa igen
  });
  it('bara öppna rutor räknas (klara rader i tabelltestet, rutor som hjälpen fyllt)', () => {
    const v = ['56', '', '12', ''];
    expect(L.oneButton(v, [0, 2])).toBe('klar');
    expect(L.oneButton(v, [0, 1, 2])).toBe('next');
  });
  it('Nästa hoppar till nästa TOMMA ruta, runt om; -1 när inga är tomma', () => {
    const v = ['1', '', '3', '', '5'];
    expect(L.nextEmpty(v, 0)).toBe(1);
    expect(L.nextEmpty(v, 1)).toBe(3);
    expect(L.nextEmpty(v, 3)).toBe(1);                                  // runt om
    expect(L.nextEmpty(v, 0, [0, 2, 3, 4])).toBe(3);                    // ruta 1 är inte öppen
    expect(L.nextEmpty(['1', '2'], 0)).toBe(-1);
  });
  it('tabelltestet: 20 ifyllda ger Klar, en tom ger Nästa', () => {
    const t = L.makeSheet('latt', seeded(5)), vals = t.items.map(x => String(x.answer));
    expect(L.oneButton(vals)).toBe('klar');
    vals[7] = ''; expect(L.oneButton(vals)).toBe('next'); expect(L.nextEmpty(vals, 0)).toBe(7);
  });
});

describe('problemlösningens steg med mallar (D39 ✎)', () => {
  it('växel: "Vad kostar 5 bollar?" [5]·[28]=[140], sedan [200]−[140]=[60], slutsatsen med uttrycket', () => {
    const t = L.makeTillbaka('Saga', L.SHOP.find(x => x.id === 'boll'), 5, 200);
    expect(t.flow.map(s => [s.q, s.op, s.ans])).toEqual([['Vad kostar 5 bollar?', '·', [5, 28, 140]], ['Hur mycket får Saga tillbaka?', '−', [200, 140, 60]]]);
    expect(L.probConclusion(t)).toBe('Uttrycket blir 200 − 5 · 28 = 60 kr.');
  });
  it('två köp har tre steg; omvänd två; räkneordning med två gångertal tre', () => {
    expect(L.makeKop2('Leo', L.SHOP[0], 3, L.SHOP[1], 2).flow.map(s => s.op)).toEqual(['·', '·', '+']);
    const o = L.makeOmvand(6, 7, 5);
    expect(o.flow.map(s => [s.q, s.op, s.ans])).toEqual([['Vad gav de 6 domarna tillsammans?', '·', [6, 7, 42]], ['Vad gav den sista domaren?', '−', [47, 42, 5]]]);
    expect(L.makeOrdning('++', 5, 3, 6, 8).flow.map(s => s.op)).toEqual(['·', '·', '+']);
    expect(L.makeOrdning('-', 7, 8, 23).flow.map(s => s.ans)).toEqual([[7, 8, 56], [56, 23, 33]]);
  });
  it('gånger och plus i valfri ordning, minus inte; tomma rutor är inte rätt', () => {
    const t = L.makeTillbaka('Saga', L.SHOP.find(x => x.id === 'boll'), 5, 200);
    expect(L.checkProbStep(t.flow[0], ['28', '5', '140']).ok).toBe(true);
    expect(L.checkProbStep(t.flow[0], ['5', '28', '150']).wrong).toEqual([false, false, true]);
    expect(L.checkProbStep(t.flow[1], ['140', '200', '60']).ok).toBe(false);
    expect(L.checkProbStep(t.flow[1], ['200', '140', '60']).ok).toBe(true);
    expect(L.checkProbStep(t.flow[0], ['5', '5', '140']).ok).toBe(false);
  });
  it('för många slumpade uppgifter: stegen räknar rätt, bygger på varandra och slutar i svaret; uttrycket stämmer', () => {
    const r = seeded(801);
    for (let i = 0; i < N; i++) for (const lv of LEVELS) for (const t of L.genProblem(lv, 4, r)) {
      const prev = [];
      for (const st of t.flow) {
        const [a, b, c] = st.ans;
        expect(st.op === '·' ? a * b : st.op === '+' ? a + b : a - b).toBe(c);
        expect(L.checkProbStep(st, st.ans.map(String)).ok).toBe(true);
        if (st.op !== '·') expect(prev.includes(a) || prev.includes(b)).toBe(true);    // använder ett tidigare svar
        prev.push(c);
      }
      expect(t.flow[t.flow.length - 1].ans[2]).toBe(t.answer);
      const v = Function('"use strict";return (' + t.expr.replace(/·/g, '*').replace(/−/g, '-') + ')')();
      expect(v).toBe(t.answer);
      expect(L.probConclusion(t)).toContain(`${t.expr} = ${t.answer}`);
    }
  });
  it('språket: i stegens frågor har inget tal två roller', () => {
    const r = seeded(802);
    for (let i = 0; i < N; i++) for (const lv of LEVELS) for (const t of L.genProblem(lv, 4, r)) for (const st of t.flow) {
      const ns = (st.q.match(/\d+/g) || []);
      expect(new Set(ns).size).toBe(ns.length);
      for (let k = 0; k < st.ans.length; k++) expect(L.probStepHint(t, 0).length).toBeGreaterThan(10);
    }
  });
  it('trappan per steg: försök igen, talen i rutorna, svaret', () => {
    expect([1, 2, 3, 4].map(L.probHelpStep)).toEqual(['retry', 'bit', 'svar', 'svar']);
    const t = L.makeKop2('Leo', L.SHOP[0], 3, L.SHOP[1], 2);
    expect(L.probStepBit(t, 0).fill).toEqual({ 0:3, 1:7 });
    expect(L.probStepHint(t, 2)).toMatch(/Lägg ihop/);
  });
});

/* ── D41 (2026-10-21): räknesättet i uppställningen ─────────────────────
   Dennis: "man skall kunna växla mellan vilket räkningsläge man väljer [...] Eller om man hellre kör
   med detta minnessiffratänk. vilket jag förespråkar." Minnessiffra är förval; valet sparas per profil
   och gäller i Öva, Gör provet och Mitt prov. */
describe('D41: växeln Minnessiffra / Dela upp', () => {
  const src = readFileSync(new URL('../js/matteprov.js', import.meta.url), 'utf8');
  it('två lägen, Minnessiffra först och förvalt', () => {
    expect(L.UPP_METHODS.map(m => m.name)).toEqual(['Minnessiffra', 'Dela upp']);
    expect(L.uppMethod({})).toBe('minne');
    expect(L.uppMethod(null)).toBe('minne');
    expect(L.uppMethod({ upMethod:'dela' })).toBe('dela');
    expect(L.uppMethod({ upMethod:'något annat' })).toBe('minne');
  });
  it('minnessiffra: Öva och nötpassen räknas med hjälp, provet och mitt prov själv; dela upp går som förut', () => {
    for (const m of ['ova', 'svag', 'not']) expect(L.uppEngineMode('minne', m)).toBe('help');
    expect(L.uppEngineMode('minne', 'prov')).toBe('free');      // startProv(false) och startProv(true) har båda mode 'prov'
    for (const m of ['ova', 'svag', 'not', 'prov']) expect(L.uppEngineMode('dela', m)).toBe(null);
  });
  it('valet sparas per profil och läses när uppgiften visas (även i provet)', () => {
    expect(src).toMatch(/function setUpMethod\(m\) \{ const s = readSt\(\); s\.upMethod = m === 'dela' \? 'dela' : 'minne'; writeSt\(s\); \}/);
    expect(src).toMatch(/const eng = t\.type === 'upp' && !fb && !keep \? L\.uppEngineMode\(upMethod\(\), S\.mode\) : null;/);
    expect(src).toMatch(/S = \{ mode:'prov', mitt:!!mitt/);                 // provet och mitt prov har mode 'prov'
    expect(src).toMatch(/case 'method':\s+snd\('click'\); setUpMethod\(id\);/);
    // "Så här gör du" visar det valda läget, och växeln står överst där
    expect(src).toMatch(/if \(moment === 'uppstallning' && upMethod\(\) === 'minne'\) return minneIntroSteps\(\);/);
    expect(src).toMatch(/\$\{moment === 'uppstallning' \? methodSegHTML\(\) : ''\}/);
  });
  it('utfallet från multiplikationens motor bokförs: minnessiffran och tabellfakta blir det som var svårt', () => {
    const t = L.makeUpp(82, 68);
    const hard = L.tagsHard(t, 'minne', { rows:[], grey:false, facts:[[2, 8], [8, 6]] });
    expect(hard).toEqual(['upp:tva', 'upp:minne', 'tab:2x8', 'tab:6x8']);
    expect(L.tagLabel('upp:minne')).toBe('Minnessiffran');
    expect(L.tagsCovered(t)).toContain('upp:minne');                    // 82 · 8 har minne
    expect(L.tagsCovered(L.makeUpp(21, 3))).not.toContain('upp:minne'); // 21 · 3 har inget
    let h = L.recordOutcome({}, t, 'hjalp', 'minne', '2026-10-21', { facts:[[2, 8]] });
    expect(Object.keys(h).sort()).toEqual(['tab:2x8', 'upp:minne', 'upp:tva']);
    for (let i = 0; i < L.FORGET_AFTER; i++) h = L.recordOutcome(h, t, 'direkt', null, '2026-10-21');
    expect(h['upp:minne']).toBeUndefined();
    const g = L.genForTag('upp:minne', seeded(3));
    expect(g.type).toBe('upp');
  });
});
