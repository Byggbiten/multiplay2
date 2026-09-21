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

/* ── Uppgift 7: ovningslagets per-kolumndata ─────────────────────────────
   needsTenFriend ar borta. Varje kolumn maste ha ETT vagval, annars faller
   ovningslaget tyst ner i numpaden och slutar undervisa metoden.          */
describe('ovningslagets per-kolumndata', () => {
  const OPTS = { compTo: 'storsta', memTo: 'storsta' };
  it('varje kolumn far ett vagval som inte ar odefinierat', () => {
    const fel = [];
    for (const [a, b] of [[47,35],[68,57],[41,39],[95,47],[295,208],[32,29]]) {
      const cc = (a >= 100 || b >= 100 || a + b >= 100) ? 3 : 2;
      const steps = planAdditionColumns(a, b, cc, OPTS);
      for (let c = 0; c < cc; c++) {
        const iKol = steps.filter(s => s.col === c).map(s => s.type);
        const harVag = iKol.includes('tf_pair') || iKol.includes('add_lend')
                    || iKol.includes('add_sum') || iKol.includes('add_simple');
        if (!harVag) fel.push(`${a}+${b} kol ${c}: ${iKol.join(',')}`);
      }
    }
    expect(fel).toEqual([]);
  });
});

/* ── Uppgift 7: vagvalet som ersatter needsTenFriend ─────────────────────
   exColumnPlan() ar den rena delen av preprocessExSteps(): den klassar
   kolumnen och plockar ut de demo-steg ovningslaget ska spela upp innan
   barnet far skriva svarssiffran. add_result ar ALDRIG med — den siffran
   ar barnets jobb.                                                        */
describe('vagvalet per kolumn', () => {
  const { exColumnPlan } = require('../js/uppstallning.js').__test;
  const OPTS = { compTo: 'storsta', memTo: 'storsta' };
  const plan = (a, b, cc, c, extra) =>
    exColumnPlan(planAdditionColumns(a, b, cc, { ...OPTS, ...extra }), c);

  it('47+35 entalen ar en komplementkolumn', () => {
    expect(plan(47, 35, 2, 0).kind).toBe('complement');
  });

  it('41+39 entalen ar en tiokompiskolumn', () => {
    expect(plan(41, 39, 2, 0).kind).toBe('exact10');
  });

  it('95+47 tiotalen ar 10 + resten', () => {
    expect(plan(95, 47, 3, 1).kind).toBe('tenPlusRest');
  });

  it('47+35 tiotalen gar direkt', () => {
    const p = plan(47, 35, 2, 1);
    expect(p.kind).toBe('simple');
    expect(p.queue).toEqual([]);
  });

  it('korta vagen behaller tian i kon — annars laser summan ostruket papper', () => {
    const typer = plan(32, 29, 2, 0, { difficulty: 4 }).queue.map(s => s.type);
    expect(typer).toEqual(['add_need', 'add_lend', 'add_ten', 'add_sum', 'add_carry_fly']);
  });

  it('kon innehaller aldrig add_result — svarssiffran ar barnets jobb', () => {
    const fel = [];
    for (let a = 10; a <= 99; a++) for (let b = 10; b <= 99; b++) {
      const cc = (a + b >= 100) ? 3 : 2;
      const steps = planAdditionColumns(a, b, cc, OPTS);
      for (let c = 0; c < cc; c++) {
        if (exColumnPlan(steps, c).queue.some(s => s.type === 'add_result')) fel.push(`${a}+${b} kol ${c}`);
      }
    }
    expect(fel).toEqual([]);
  });

  it('varje kolumn med summa over 9 far en icke-tom ko och ett vagval', () => {
    const fel = [];
    for (let a = 10; a <= 99; a++) for (let b = 10; b <= 99; b++) {
      const cc = (a + b >= 100) ? 3 : 2;
      for (const d of [1, 2, 3, 4]) {
        const steps = planAdditionColumns(a, b, cc, { ...OPTS, difficulty: d });
        for (let c = 0; c < cc; c++) {
          const p = exColumnPlan(steps, c);
          const direkt = steps.some(s => s.type === 'add_simple' && s.col === c);
          if (direkt && p.kind !== 'simple') fel.push(`${a}+${b} niva ${d} kol ${c}: ${p.kind}`);
          if (!direkt && (p.kind === 'simple' || !p.queue.length)) fel.push(`${a}+${b} niva ${d} kol ${c}: tomt vagval`);
        }
      }
    }
    expect(fel).toEqual([]);
  });

  it('varje ko slutar med add_carry_fly — minnet placeras fore svaret', () => {
    const fel = [];
    for (let a = 10; a <= 99; a++) for (let b = 10; b <= 99; b++) {
      const cc = (a + b >= 100) ? 3 : 2;
      const steps = planAdditionColumns(a, b, cc, OPTS);
      for (let c = 0; c < cc; c++) {
        const q = exColumnPlan(steps, c).queue;
        if (q.length && q[q.length - 1].type !== 'add_carry_fly') fel.push(`${a}+${b} kol ${c}`);
      }
    }
    expect(fel).toEqual([]);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   SUBTRAKTION — planSubtractionColumns
   ══════════════════════════════════════════════════════════════════════════ */

/* Alla giltiga par per niva, uttommande, exakt som generatePair() drar dem
   (js/uppstallning.js, subtraktionsgrenen i generatePair). Niva 4:s forsta
   gren: hA 3–9, eA 1–4, a = hA·100 + eA; hB 1..hA−1, tB 1–5, eB = min(eA+3+r, 9)
   med r 0–4. Andra grenen: a 300–899, b 150–449, a > b och minst ett lan.
   colCount ar 3 nar numA >= 100, annars 2 (generatePair, sista raden). */
function subPar() {
  const par = [];
  const cc = a => a >= 100 ? 3 : 2;
  const hasBorrow = (a, b) => (a % 10) < (b % 10) || (Math.floor(a/10) % 10) < (Math.floor(b/10) % 10);
  for (let a = 5; a <= 20; a++) for (let b = 1; b <= a - 1; b++) par.push([1, a, b, cc(a)]);
  for (let a = 30; a <= 99; a++) for (let b = 10; b <= 29; b++) if (a > b) par.push([2, a, b, cc(a)]);
  for (let a = 100; a <= 198; a++) for (let b = 10; b <= 99; b++) if (a - b >= 1 && a - b <= 99) par.push([3, a, b, 3]);
  for (let hA = 3; hA <= 9; hA++) for (let eA = 1; eA <= 4; eA++) {
    const a = hA * 100 + eA;
    for (let hB = 1; hB <= hA - 1; hB++) for (let tB = 1; tB <= 5; tB++) for (let r = 0; r <= 4; r++) {
      const b = hB * 100 + tB * 10 + Math.min(eA + 3 + r, 9);
      if (a > b) par.push([4, a, b, 3]);
    }
  }
  for (let a = 300; a <= 899; a++) for (let b = 150; b <= 449; b++) if (a > b && hasBorrow(a, b)) par.push([4, a, b, 3]);
  return par;
}

const { planSubtractionColumns } = require('../js/uppstallning.js').__test;

/* Referens: dagens buildDemoSteps-gren for subtraktion, verbatim, fore
   utbrytningen (js/uppstallning.js:853–890 pa dev). */
function referensSub(numA, numB, colCount) {
  const digs = n => [n % 10, Math.floor(n/10) % 10, Math.floor(n/100) % 10];
  const da = digs(numA), db = digs(numB), steps = [];
  const effA = [...da];
  for (let c = 0; c < colCount; c++) {
    steps.push({ type:'sub_highlight', col:c, a:effA[c], b:db[c] });
    if (effA[c] < db[c]) {
      const diff = db[c] - effA[c];
      const isDouble = c + 1 < colCount && effA[c+1] === 0 && c + 2 < colCount;
      steps.push({ type: isDouble ? 'sub_cant_double' : 'sub_cant', col:c, a:effA[c], b:db[c] });
      if (isDouble) {
        steps.push({ type:'sub_borrow', srcCol:c+2, dstCol:c+1, srcNew:effA[c+2]-1, dstNew:effA[c+1]+10, mainCol:c });
        effA[c+2]--; effA[c+1] += 10;
      }
      steps.push({ type:'sub_flip_borrow', col:c, a:effA[c], b:db[c], diff, srcCol:c+1, srcNew:effA[c+1]-1 });
      effA[c+1]--;
      steps.push({ type:'sub_ten_minus', col:c, diff, ans:10-diff });
    } else {
      steps.push({ type:'sub_calc', col:c, a:effA[c], b:db[c], diff:effA[c]-db[c] });
    }
  }
  steps.push({ type:'done' });
  return steps;
}

/* Svaret som steglistan skriver: en siffra per kolumn ur sub_ten_minus.ans
   eller sub_calc.diff, last fran hogsta kolumnen med svar ned till entalen.
   Strangen (inte talet) jamfors — "045" ar inte "45" pa papper. */
function subSvar(steps) {
  const siffror = [];
  for (const s of steps) {
    if (s.type === 'sub_ten_minus') siffror[s.col] = s.ans;
    if (s.type === 'sub_calc')      siffror[s.col] = s.diff;
  }
  let str = '';
  for (let c = siffror.length - 1; c >= 0; c--) str += (siffror[c] ?? '·');
  return str;
}

describe('planSubtractionColumns — karakterisering av dagens beteende', () => {
  /* A4 (granskning 21/9) andrade regeln for ledande nollor. Referensen
     galler darfor bara for par dar svaret fyller alla kolumner — dar ska
     ingenting ha andrats. */
  it('ger identisk steglista som referensen nar ingen ledande nolla uppstar', () => {
    const avvikelser = [];
    /* bEmpty ar ett avsiktligt nytt falt (A4): bubblan ska inte saga "3 − 0"
       nar undre cellen ar tom. Sjalva stegen och deras ordning ar oforandrade. */
    const utanBEmpty = steps => steps.map(({ bEmpty, ...s }) => s);
    for (const [niva, a, b, cc] of subPar()) {
      if (String(a - b).length !== cc) continue;
      if (JSON.stringify(utanBEmpty(planSubtractionColumns(a, b, cc))) !== JSON.stringify(referensSub(a, b, cc))) {
        avvikelser.push(`niva ${niva}: ${a}-${b}`);
      }
    }
    expect(avvikelser).toEqual([]);
  });
});

/* ── A4: ledande nolla ────────────────────────────────────────────────────
   100 − 55 skrevs "0 4 5", 8 − 3 skrevs "0 5". Kolumner utan siffror ska
   inte fa ett svar, och svaret ur steglistan ska vara a − b utan ledande
   nollor — for ALLA giltiga par i alla fyra nivaerna.                     */
describe('A4: ledande nolla', () => {
  it('svaret ur steglistan ar a − b utan ledande nollor, alla nivaer', () => {
    const fel = [];
    for (const [niva, a, b, cc] of subPar()) {
      const fick = subSvar(planSubtractionColumns(a, b, cc));
      if (fick !== String(a - b)) fel.push(`niva ${niva}: ${a}-${b} gav ${fick}`);
    }
    expect(fel).toEqual([]);
  });

  it('ingen kolumn utan siffror far nagot steg alls', () => {
    const fel = [];
    for (const [niva, a, b, cc] of subPar()) {
      const lenA = String(a).length;
      for (const s of planSubtractionColumns(a, b, cc)) {
        if (s.col !== undefined && s.col >= lenA) fel.push(`niva ${niva}: ${a}-${b} kol ${s.col} ${s.type}`);
      }
    }
    expect(fel).toEqual([]);
  });

  it('100 − 55: hundratalet far inget svar; 8 − 3: tiotalet far inget steg', () => {
    const h = planSubtractionColumns(100, 55, 3).filter(s => s.col === 2).map(s => s.type);
    expect(h).toEqual([]);
    const t = planSubtractionColumns(8, 3, 2).filter(s => s.col === 1).map(s => s.type);
    expect(t).toEqual([]);
  });

  it('30 − 29: tiotalet har siffror men blir en ledande nolla — eget steg utan svar', () => {
    const t = planSubtractionColumns(30, 29, 2).filter(s => s.col === 1).map(s => s.type);
    expect(t).toEqual(['sub_highlight', 'sub_zero_lead']);
  });

  it('entalen far alltid ett svar, aven nar a === b', () => {
    expect(subSvar(planSubtractionColumns(7, 7, 2))).toBe('0');
  });
});
