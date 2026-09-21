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

  /* Uppgift 6: komplementvagens barare ar add_need (spec kap 3c), inte det
     borttagna add_explain. Samma falt, samma aritmetik — annan stegtyp. */
  it('32+29: 9:an fylls till 10, inte 2:an', () => {
    const steps = planAdditionColumns(32, 29, 2, OPTS);
    const behov = steps.find(s => s.type === 'add_need' && s.col === 0);
    expect(behov.growVal).toBe(9);
    expect(behov.behover).toBe(1);
    expect(behov.kvar).toBe(1);
  });

  it('47+35: oforandrat mot forr eftersom 7 redan ar storst', () => {
    const steps = planAdditionColumns(47, 35, 2, OPTS);
    const behov = steps.find(s => s.type === 'add_need' && s.col === 0);
    expect(behov.growVal).toBe(7);
    expect(behov.behover).toBe(3);
    expect(behov.kvar).toBe(2);
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
        if (s.type === 'add_need' && s.behover >= 1 && s.kvar < 1 && !arExaktTio(s)) {
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
        if (s.type === 'add_need' && arExaktTio(s) && s.kvar !== 0) {
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

describe('exakt-10-genvagen', () => {
  const OPTS = { compTo: 'storsta', memTo: 'storsta' };

  it('41+39: entalen far tf_pair, inga komplementsteg', () => {
    const typer = planAdditionColumns(41, 39, 2, OPTS).filter(s => s.col === 0).map(s => s.type);
    expect(typer).toContain('tf_pair');
    expect(typer).not.toContain('add_need');
    expect(typer).not.toContain('add_lend');
  });

  it('41+39 ger 80', () => {
    const siffror = [];
    for (const s of planAdditionColumns(41, 39, 2, OPTS)) {
      if (s.type === 'add_result' || s.type === 'add_simple') siffror[s.col] = s.ans;
    }
    expect(Number(siffror.reverse().join(''))).toBe(80);
  });

  it('ingen kolumn med bada termerna minst 1 och summa 10 kor komplementvagen', () => {
    const fel = [];
    for (let a = 10; a <= 99; a++) for (let b = 10; b <= 99; b++) {
      const cc = (a + b >= 100) ? 3 : 2;
      const steps = planAdditionColumns(a, b, cc, OPTS);
      for (const s of steps) {
        if (s.type === 'add_need' && s.valA >= 1 && s.valB >= 1 && s.valA + s.valB === 10) {
          fel.push(`${a}+${b} kol ${s.col}`);
        }
      }
    }
    expect(fel).toEqual([]);
  });
});

describe('hal A: termen ar redan 10 efter minnet', () => {
  const OPTS = { compTo: 'storsta', memTo: 'storsta' };

  it('95+47 tiotalen: inga komplementsteg, ingen strykning', () => {
    const kol1 = planAdditionColumns(95, 47, 3, OPTS).filter(s => s.col === 1).map(s => s.type);
    expect(kol1).not.toContain('add_need');
    expect(kol1).not.toContain('add_lend');
    expect(kol1).not.toContain('add_lift');
    expect(kol1).toContain('add_memjoin');
    expect(kol1).toContain('add_sum');
  });

  it('295+208 tiotalen: resten ar 0', () => {
    const steg = planAdditionColumns(295, 208, 3, OPTS).find(s => s.type === 'add_sum' && s.col === 1);
    expect(steg.sum).toBe(10);
    expect(steg.ans).toBe(0);
    expect(steg.kvar).toBe(0);
  });

  it('ingen kolumn kor komplementvagen med behover 0', () => {
    const fel = [];
    for (let a = 40; a <= 99; a++) for (let b = 40; b <= 99; b++) {
      if (a + b < 100) continue;
      for (const s of planAdditionColumns(a, b, 3, OPTS)) {
        if (s.type === 'add_need' && s.behover === 0) fel.push(`${a}+${b} kol ${s.col}`);
      }
    }
    expect(fel).toEqual([]);
  });

  it('summan ar korrekt for hela niva 3 uttommande', () => {
    const fel = [];
    for (let a = 40; a <= 99; a++) for (let b = 40; b <= 99; b++) {
      if (a + b < 100) continue;
      const siffror = [];
      for (const s of planAdditionColumns(a, b, 3, OPTS)) {
        if (s.type === 'add_result' || s.type === 'add_simple') siffror[s.col] = s.ans;
        if (s.type === 'add_overflow') siffror[3] = s.digit;
      }
      const summa = Number(siffror.map(d => d ?? 0).reverse().join(''));
      if (summa !== a + b) fel.push(`${a}+${b} gav ${summa}`);
    }
    expect(fel).toEqual([]);
  });
});

/* ── Uppgift 5: hål B — nollan som blir en etta ───────────────────────────
   Med memTo:'storsta' kan fallet inte uppstå: minnet gar alltid till den
   storsta siffran, sa memDigit blir aldrig 0 i en kolumn som gar over 9.
   Kravet byggs anda, for ADD_OPTS kan vandas tillbaka till 'oversta' om
   Mitt i Prick 4A visar sig lara ut det oversta talet. Spec kap 7.2.       */
describe('hal B: siffran minnet laggs pa ar 0', () => {
  const OPTS = { compTo: 'storsta', memTo: 'oversta' };

  it('205+199 tiotalen: minnet namns fore tiokompis-pastaendet', () => {
    const kol1 = planAdditionColumns(205, 199, 3, OPTS).filter(s => s.col === 1);
    const iMemjoin = kol1.findIndex(s => s.type === 'add_memjoin');
    const iPair    = kol1.findIndex(s => s.type === 'tf_pair');
    expect(iMemjoin).toBeGreaterThanOrEqual(0);
    expect(iPair).toBeGreaterThan(iMemjoin);
    expect(kol1[iPair].memSaid).toBe(true);
    expect(kol1[iMemjoin].memDigit).toBe(0);
    expect(kol1[iMemjoin].memNew).toBe(1);
  });

  it('47+53 tiotalen: minnet landar pa en 4:a, sa inget eget memjoin-steg', () => {
    const kol1 = planAdditionColumns(47, 53, 3, { compTo: 'storsta', memTo: 'storsta' })
      .filter(s => s.col === 1);
    expect(kol1.some(s => s.type === 'add_memjoin')).toBe(false);
    const pair = kol1.find(s => s.type === 'tf_pair');
    expect(pair.memSaid).toBeUndefined();
  });

  it('memDigit 0 intraffar aldrig med storsta-regeln', () => {
    const traffar = [];
    for (let a = 10; a <= 99; a++) for (let b = 10; b <= 99; b++) {
      const cc = (a + b >= 100) ? 3 : 2;
      for (const s of planAdditionColumns(a, b, cc, { compTo: 'storsta', memTo: 'storsta' })) {
        if (s.type === 'add_memjoin' && s.memDigit === 0) traffar.push(`${a}+${b} kol ${s.col}`);
      }
    }
    expect(traffar).toEqual([]);
  });
});

/* ── Uppgift 6: stegordningen i komplementkolumner ───────────────────────
   Planens forvantade lista satte add_sum FORE add_return. Spec kap 3c har
   motsatt ordning (6 add_return, 7 add_sum) och mockupen bygger sa
   (sumWay 'ur', mockup:806-808): pappret skrivs forst, och summan stiger
   ur det som DA star skrivet. Specen galler — testet foljer specen.       */
describe('stegordningen i komplementkolumner', () => {
  const OPTS = { compTo: 'storsta', memTo: 'storsta' };

  it('47+35 entalen foljer spec kap 3c', () => {
    const typer = planAdditionColumns(47, 35, 2, OPTS).filter(s => s.col === 0).map(s => s.type);
    expect(typer).toEqual([
      'add_highlight', 'add_lift', 'add_need', 'add_lend',
      'add_ten_named', 'add_return', 'add_sum', 'add_carry_fly', 'add_result',
    ]);
  });

  it('68+57 tiotalen foljer spec kap 3d — add_memjoin direkt efter add_lift', () => {
    const typer = planAdditionColumns(68, 57, 3, OPTS).filter(s => s.col === 1).map(s => s.type);
    expect(typer).toEqual([
      'add_highlight', 'add_lift', 'add_memjoin', 'add_need', 'add_lend',
      'add_ten_named', 'add_return', 'add_sum', 'add_carry_fly', 'add_result',
      'add_mem_strike',
    ]);
  });

  it('summan skapas fore att den anvands', () => {
    const typer = planAdditionColumns(47, 35, 2, OPTS).map(s => s.type);
    expect(typer.indexOf('add_sum')).toBeLessThan(typer.indexOf('add_carry_fly'));
  });

  it('add_explain och add_cross ar borta ur additionsvagen', () => {
    const traffar = [];
    for (let a = 10; a <= 99; a++) for (let b = 10; b <= 99; b++) {
      const cc = (a + b >= 100) ? 3 : 2;
      for (const d of [1, 2, 3, 4]) {
        for (const s of planAdditionColumns(a, b, cc, { ...OPTS, difficulty: d })) {
          if (s.type === 'add_explain' || s.type === 'add_cross' || s.type === 'add_over9') {
            traffar.push(`${a}+${b} niva ${d}: ${s.type}`);
          }
        }
      }
    }
    expect(traffar).toEqual([]);
  });
});

/* ── Uppgift 6, Dennis beslut: tankerutan hoppas over vid sma lan ────────
   behover <= SKIP_BOX_MAX_BORROW OCH niva >= 3 ⇒ kort vag utan utlyft.
   Pa niva 1-2 oppnas rutan alltid, sa att metoden kanns likadan varje
   gang medan hon lar sig den.                                             */
describe('tankerutan hoppas over vid sma lan pa svara nivaer', () => {
  const OPTS = { compTo: 'storsta', memTo: 'storsta' };

  it('32+29 pa niva 4: inget utlyft, men samma slut', () => {
    const typer = planAdditionColumns(32, 29, 2, { ...OPTS, difficulty: 4 })
      .filter(s => s.col === 0).map(s => s.type);
    expect(typer).toEqual([
      'add_highlight', 'add_need', 'add_lend', 'add_ten',
      'add_sum', 'add_carry_fly', 'add_result',
    ]);
  });

  it('32+29 pa niva 2: rutan oppnas anda', () => {
    const typer = planAdditionColumns(32, 29, 2, { ...OPTS, difficulty: 2 })
      .filter(s => s.col === 0).map(s => s.type);
    expect(typer).toContain('add_lift');
    expect(typer).toContain('add_return');
  });

  it('47+35 pa niva 4: lanet ar 3, sa rutan oppnas', () => {
    const typer = planAdditionColumns(47, 35, 2, { ...OPTS, difficulty: 4 })
      .filter(s => s.col === 0).map(s => s.type);
    expect(typer).toContain('add_lift');
  });

  it('utan difficulty i opts oppnas rutan — forvalet ar den langa vagen', () => {
    const typer = planAdditionColumns(32, 29, 2, OPTS).filter(s => s.col === 0).map(s => s.type);
    expect(typer).toContain('add_lift');
  });

  it('korta vagen slutar likadant som den langa', () => {
    const fel = [];
    for (let a = 40; a <= 99; a++) for (let b = 40; b <= 99; b++) {
      if (a + b < 100) continue;
      const steps = planAdditionColumns(a, b, 3, { ...OPTS, difficulty: 3 });
      for (let c = 0; c < 3; c++) {
        const t = steps.filter(s => s.col === c).map(s => s.type);
        if (!t.includes('add_need')) continue;
        const svans = t.slice(t.indexOf('add_sum'));
        if (svans.join(',').indexOf('add_sum,add_carry_fly,add_result') !== 0) {
          fel.push(`${a}+${b} kol ${c}: ${t.join(',')}`);
        }
      }
    }
    expect(fel).toEqual([]);
  });
});
