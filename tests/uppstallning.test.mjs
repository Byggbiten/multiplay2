/* tests/uppstallning.test.mjs */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { planAdditionColumns } = require('../js/uppstallning.js').__test;

/* Referens: aritmetiken exakt som den står i app:503-510 före utbrytningen. */
function referens(numA, numB, colCount) {
  const digs = n => String(n).padStart(colCount, '0').split('').reverse().map(Number);
  const da = digs(numA), db = digs(numB), steps = [];
  let carryVal = 0;
  for (let c = 0; c < colCount; c++) {
    const a = da[c], b = db[c];
    const effectiveA = a + carryVal;
    const sum = effectiveA + b;
    const ans = sum % 10;
    const nextCarry = sum > 9 ? 1 : 0;
    steps.push({ type: 'add_highlight', col: c });
    if (sum > 9) {
      const behover = 10 - effectiveA;
      const kvar = b - behover;
      steps.push({ type: 'add_over9', col: c, a, b, carry_in: carryVal, sum, effectiveA });
      steps.push({ type: 'add_explain', col: c, a, b, carry_in: carryVal, effectiveA, behover, kvar, ans, nextCarry });
      steps.push({ type: 'add_cross',   col: c, a, b, carry_in: carryVal, effectiveA, behover, kvar, ans, nextCarry });
      steps.push({ type: 'add_carry_fly', col: c, nextCarry });
      steps.push({ type: 'add_result', col: c, a, b, kvar, ans, nextCarry });
    } else {
      steps.push({ type: 'add_simple', col: c, a, b, carry_in: carryVal, sum, ans });
    }
    if (carryVal && c < colCount - 1) steps.push({ type: 'add_mem_strike', col: c });
    carryVal = nextCarry;
  }
  if (carryVal) steps.push({ type: 'add_overflow', digit: carryVal });
  steps.push({ type: 'done' });
  return steps;
}

describe('planAdditionColumns — karakterisering av dagens beteende', () => {
  it('ger identisk steglista som referensen for alla tvasiffriga par', () => {
    const avvikelser = [];
    for (let a = 10; a <= 99; a++) {
      for (let b = 10; b <= 99; b++) {
        const cc = (a + b >= 100) ? 3 : 2;
        const fick = planAdditionColumns(a, b, cc, { compTo: 'oversta', memTo: 'oversta' });
        const vantat = referens(a, b, cc);
        if (JSON.stringify(fick) !== JSON.stringify(vantat)) avvikelser.push(`${a}+${b}`);
      }
    }
    expect(avvikelser).toEqual([]);
  });

  it('summan i steglistan stammer med riktig addition', () => {
    const fel = [];
    for (let a = 10; a <= 99; a++) {
      for (let b = 10; b <= 99; b++) {
        const cc = (a + b >= 100) ? 3 : 2;
        const steps = planAdditionColumns(a, b, cc, { compTo: 'oversta', memTo: 'oversta' });
        const siffror = [];
        for (const s of steps) {
          if (s.type === 'add_result' || s.type === 'add_simple') siffror[s.col] = s.ans;
          if (s.type === 'add_overflow') siffror[cc] = s.digit;
        }
        const summa = Number(siffror.map(d => d ?? 0).reverse().join(''));
        if (summa !== a + b) fel.push(`${a}+${b} gav ${summa}`);
      }
    }
    expect(fel).toEqual([]);
  });
});

describe('storsta-talet-regeln', () => {
  const OPTS = { compTo: 'storsta', memTo: 'storsta' };

  it('32+29: 9:an fylls till 10, inte 2:an', () => {
    const steps = planAdditionColumns(32, 29, 2, OPTS);
    const explain = steps.find(s => s.type === 'add_explain' && s.col === 0);
    expect(explain.growVal).toBe(9);
    expect(explain.behover).toBe(1);
    expect(explain.kvar).toBe(1);
  });

  it('47+35: oforandrat mot forr eftersom 7 redan ar storst', () => {
    const steps = planAdditionColumns(47, 35, 2, OPTS);
    const explain = steps.find(s => s.type === 'add_explain' && s.col === 0);
    expect(explain.growVal).toBe(7);
    expect(explain.behover).toBe(3);
    expect(explain.kvar).toBe(2);
  });

  /* Undantaget: en exakt-10-kolumn (growVal + giveVal === 10, bada >= 1) lanar
     ut HELA det mindre talet, sa kvar blir 0. Den kolumnen tar tiokompis-
     genvagen och kor aldrig komplementvagen (spec kap 3b) — den byggs i
     uppgift 3. Testet mater darfor invarianten utanfor den klassen, och
     kontrollerar samtidigt att undantaget inte ar nagot annat. */
  const arExaktTio = s => s.growVal >= 1 && s.giveVal >= 1 && s.growVal + s.giveVal === 10;

  it('kvar blir alltid minst 1 nar behover ar minst 1 (utanfor exakt-10)', () => {
    const fel = [];
    for (let a = 10; a <= 99; a++) for (let b = 10; b <= 99; b++) {
      const cc = (a + b >= 100) ? 3 : 2;
      for (const s of planAdditionColumns(a, b, cc, OPTS)) {
        if (s.type === 'add_explain' && s.behover >= 1 && s.kvar < 1 && !arExaktTio(s)) {
          fel.push(`${a}+${b} kol ${s.col}`);
        }
      }
    }
    expect(fel).toEqual([]);
  });

  it('undantaget ar exakt-10-klassen och inget annat', () => {
    const fel = [];
    for (let a = 10; a <= 99; a++) for (let b = 10; b <= 99; b++) {
      const cc = (a + b >= 100) ? 3 : 2;
      for (const s of planAdditionColumns(a, b, cc, OPTS)) {
        if (s.type === 'add_explain' && arExaktTio(s) && s.kvar !== 0) {
          fel.push(`${a}+${b} kol ${s.col}: exakt-10 men kvar ${s.kvar}`);
        }
      }
    }
    expect(fel).toEqual([]);
  });

  it('summan ar fortfarande korrekt for alla par', () => {
    const fel = [];
    for (let a = 10; a <= 99; a++) for (let b = 10; b <= 99; b++) {
      const cc = (a + b >= 100) ? 3 : 2;
      const siffror = [];
      for (const s of planAdditionColumns(a, b, cc, OPTS)) {
        if (s.type === 'add_result' || s.type === 'add_simple') siffror[s.col] = s.ans;
        if (s.type === 'add_overflow') siffror[cc] = s.digit;
      }
      const summa = Number(siffror.map(d => d ?? 0).reverse().join(''));
      if (summa !== a + b) fel.push(`${a}+${b} gav ${summa}`);
    }
    expect(fel).toEqual([]);
  });
});
