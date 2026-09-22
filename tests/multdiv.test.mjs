/* tests/multdiv.test.mjs — stegbyggarna i js/multdiv.js (multiplikation + kort division) */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const MD = require('../js/multdiv.js');
const { buildPlan, buildDivPlan, digitsOf } = MD._internals;
const { planMultSteps, planDivSteps, planMultHelpQueue, planDivHelpQueue,
        divStepText, divHelpAsk, divHelpAck, tabellradHTML } = MD.__test;

/* ── Talrymden = generatorernas intervall (genProblem 466–489, genDivProblem 556–578) ── */
function* multSpace() {
  for (let a = 10; a <= 99; a++) for (let b = 2; b <= 9; b++) yield [a, b, b <= 4 ? 1 : 2];
  for (let a = 100; a <= 999; a++) for (let b = 2; b <= 9; b++) if (a * b <= 9999) yield [a, b, 3];
  for (let a = 12; a <= 99; a++) for (let b = 12; b <= 99; b++) if (a % 10 && b % 10) yield [a, b, 4];
}
function* divSpace() {
  for (let d = 2; d <= 5; d++) for (let q = 10; q <= Math.floor(99 / d); q++) yield [q * d, d, 2];
  for (let d = 2; d <= 9; d++) for (let q = Math.ceil(100 / d); q <= Math.floor(999 / d); q++) yield [q * d, d, 4];
}

function refPassInto(steps, pass, rowKey, shift, finalPass) {
  for (const c of pass.cols) {
    const g = c.col + shift;
    steps.push({ t: 'highlight', phase: 'mult', aCol: c.col, mCol: shift, g, rowKey });
    if (c.last) {
      if (c.prod > 9) {
        steps.push({ t: 'calc',       phase: 'mult', ...c, g, rowKey });
        steps.push({ t: 'write_full', phase: 'mult', ...c, g, rowKey });
      } else {
        steps.push({ t: 'write_simple', phase: 'mult', ...c, g, rowKey });
      }
    } else if (c.prod > 9) {
      steps.push({ t: 'calc',        phase: 'mult', ...c, g, rowKey });
      steps.push({ t: 'over9',       phase: 'mult', ...c, g, rowKey });
      steps.push({ t: 'write_carry', phase: 'mult', ...c, g, rowKey });
    } else {
      steps.push({ t: 'write_simple', phase: 'mult', ...c, g, rowKey });
    }
    if (c.carryIn > 0 && !(finalPass && c.last))
      steps.push({ t: 'mem_strike', phase: 'mult', val: c.carryIn, g, rowKey });
    if (!c.last && c.carryOut > 0) steps.push({ t: 'mem_place', phase: 'mult', carryOut: c.carryOut, g, rowKey });
  }
}
function refAddInto(steps, add) {
  for (const c of add.cols) {
    const single = (c.x === null || c.y === null) && c.carryIn === 0;
    steps.push({ t: 'highlight', phase: 'add', g: c.col, rowKey: 'ans' });
    if (!c.last && c.sum > 9) {
      steps.push({ t: 'calc',        phase: 'add', ...c, g: c.col, rowKey: 'ans' });
      steps.push({ t: 'over9',       phase: 'add', ...c, g: c.col, rowKey: 'ans' });
      steps.push({ t: 'write_carry', phase: 'add', ...c, g: c.col, rowKey: 'ans' });
    } else {
      steps.push({ t: 'write_simple', phase: 'add', ...c, g: c.col, rowKey: 'ans', single });
    }
    if (c.carryIn > 0 && !c.last)
      steps.push({ t: 'mem_strike', phase: 'add', val: c.carryIn, g: c.col, rowKey: 'ans' });
    if (!c.last && c.carryOut > 0) steps.push({ t: 'mem_place', phase: 'add', carryOut: c.carryOut, g: c.col, rowKey: 'ans' });
  }
}
function refMultSteps(pl) {
  const steps = [];
  if (pl.kind === 'simple') refPassInto(steps, pl.pass, 'ans', 0, true);
  else {
    steps.push({ t: 'phase', which: 1 }); refPassInto(steps, pl.p1, 'p1', 0, false);
    steps.push({ t: 'phase', which: 2 }); refPassInto(steps, pl.p2, 'p2', 1, false);
    steps.push({ t: 'phase', which: 3 }); refAddInto(steps, pl.add);
  }
  steps.push({ t: 'done' });
  return steps;
}

describe('multiplikationens nya stegkedja (GRANSKNING A1/A2/B1/B3/B6)', () => {
  const MULT_TYPES = new Set(['phase', 'calc', 'memjoin', 'mem_strike', 'carry_up', 'write_down', 'move_down', 'write_full', 'done']);

  /* Forvantad kedja per kolumn, harledd ur planen — samma regler som
     passStepsInto/addStepsInto ska folja. */
  function kolumnKedja(c, finalPass, isAdd) {
    const out = [];
    const bothNull = isAdd && c.x === null && c.y === null;
    const single = isAdd && (c.x === null || c.y === null) && !bothNull;
    if (single && c.carryIn === 0) return ['move_down'];
    out.push('calc');
    if (c.carryIn > 0 && !bothNull) out.push('memjoin');
    if (c.carryIn > 0 && !(finalPass && c.last)) out.push('mem_strike');
    if (c.last) out.push(!isAdd && c.extra !== null ? 'write_full' : 'write_down');
    else if (c.carryOut > 0) out.push('carry_up', 'write_down');
    else out.push('write_down');
    return out;
  }
  function forvantad(pl) {
    const t = [];
    if (pl.kind === 'simple') pl.pass.cols.forEach(c => t.push(...kolumnKedja(c, true, false)));
    else {
      t.push('phase'); pl.p1.cols.forEach(c => t.push(...kolumnKedja(c, false, false)));
      t.push('phase'); pl.p2.cols.forEach(c => t.push(...kolumnKedja(c, false, false)));
      t.push('phase'); pl.add.cols.forEach(c => t.push(...kolumnKedja(c, true, true)));
    }
    t.push('done');
    return t;
  }

  it('bara kanda stegtyper, inga tomma steg (highlight/over9 finns inte)', () => {
    const fel = new Set();
    for (const [a, b, lv] of multSpace())
      for (const s of planMultSteps(buildPlan(a, b, lv))) if (!MULT_TYPES.has(s.t)) fel.add(s.t);
    expect([...fel]).toEqual([]);
  });

  it('kedjan per kolumn foljer regeln: calc → memjoin → mem_strike → delning', () => {
    const avv = [];
    for (const [a, b, lv] of multSpace()) {
      const pl = buildPlan(a, b, lv);
      const fick = planMultSteps(pl).map(s => s.t);
      if (JSON.stringify(fick) !== JSON.stringify(forvantad(pl))) avv.push(`${a}·${b}`);
    }
    expect(avv).toEqual([]);
  });

  it('siffrorna som skrivs bildar produkten — varje rad, hela rymden', () => {
    const fel = [];
    const join = ds => ds.reduce((n, d, i) => n + (d || 0) * Math.pow(10, i), 0);
    for (const [a, b, lv] of multSpace()) {
      const pl = buildPlan(a, b, lv);
      const rows = { ans: [], p1: [], p2: [] };
      for (const s of planMultSteps(pl)) {
        if (s.t === 'write_down' || s.t === 'move_down') rows[s.rowKey][s.g] = s.write;
        if (s.t === 'write_full') { rows[s.rowKey][s.g] = s.write; rows[s.rowKey][s.g + 1] = s.extra; }
      }
      if (pl.kind === 'simple') { if (join(rows.ans) !== a * b) fel.push(`${a}·${b}`); }
      else {
        if (join(rows.p1) !== pl.p1.value) fel.push(`${a}·${b} p1`);
        if (join(rows.p2) / 10 !== pl.p2.value) fel.push(`${a}·${b} p2`);
        if (join(rows.ans) !== a * b) fel.push(`${a}·${b} ans`);
      }
    }
    expect(fel).toEqual([]);
  });

  it('minnet: carry_up bar carryOut, memjoin bar carryIn; strykningen kommer DIREKT efter memjoin', () => {
    const fel = [];
    for (const [a, b, lv] of multSpace()) {
      const st = planMultSteps(buildPlan(a, b, lv));
      st.forEach((s, i) => {
        if (s.t === 'carry_up' && !(s.carryOut > 0 && !s.last)) fel.push(`${a}·${b} carry_up`);
        if (s.t === 'memjoin' && !(s.carryIn > 0)) fel.push(`${a}·${b} memjoin`);
        if (s.t === 'mem_strike' && st[i - 1].t !== 'memjoin' && !(st[i - 1].t === 'calc' && st[i - 1].memOnly)) fel.push(`${a}·${b} strike-ordning`);
        if (s.t === 'carry_up' && st[i + 1].t !== 'write_down') fel.push(`${a}·${b} carry_up utan write_down`);
      });
    }
    expect(fel).toEqual([]);
  });

  it('granskningens fyra tal: verbatim kedja', () => {
    const t = (a, b, lv) => planMultSteps(buildPlan(a, b, lv)).map(s => s.t).join(' ');
    expect(t(32, 3, 1)).toBe('calc write_down calc write_down done');
    expect(t(28, 8, 2)).toBe('calc carry_up write_down calc memjoin write_full done');
    expect(t(789, 9, 3)).toBe('calc carry_up write_down calc memjoin mem_strike carry_up write_down calc memjoin write_full done');
    expect(t(98, 78, 4)).toBe([
      'phase', 'calc carry_up write_down', 'calc memjoin mem_strike write_full',
      'phase', 'calc carry_up write_down', 'calc memjoin mem_strike write_full',
      'phase', 'move_down', 'calc carry_up write_down', 'calc memjoin mem_strike carry_up write_down', 'calc memjoin write_down',
      'done'].join(' '));
  });

  it('91·12: tusentalet ar bara minnet (memOnly) — foods ur minnessiffran, inget strykkrav', () => {
    const st = planMultSteps(buildPlan(91, 12, 4));
    const add = st.filter(s => s.phase === 'add');
    const last = add.filter(s => s.g === 3).map(s => s.t);
    expect(last).toEqual(['calc', 'write_down']);
    expect(add.find(s => s.g === 3 && s.t === 'calc').memOnly).toBe(true);
    expect(add.find(s => s.g === 3 && s.t === 'calc').base).toBe(1);
  });
});

describe('hjalpkon (GRANSKNING B2/B5/B6/B7)', () => {
  const KINDS = new Set(['phase', 'mult', 'add', 'trivial', 'memstrike', 'memplace', 'memwrite', 'flydown']);

  function kolumnKo(c, finalPass, isAdd) {
    const out = [];
    const bothNull = isAdd && c.x === null && c.y === null;
    const single = isAdd && (c.x === null || c.y === null) && !bothNull;
    if (single && c.carryIn === 0) return ['trivial'];
    if (!(single && c.carryIn > 0)) out.push('table');
    if (c.carryIn > 0 && !bothNull) out.push('mem');
    if (c.carryIn > 0 && !(finalPass && c.last)) out.push('memstrike');
    if (!c.last && c.carryOut > 0) out.push('memplace', 'memwrite');
    else out.push('flydown');
    return out;
  }
  const tagOf = it => it.kind === 'mult' || it.kind === 'add' ? it.step : it.kind;

  it('bara kanda faser, ordningen per kolumn: fraga → minne → stryk → placera/skriv eller flydown', () => {
    const avv = [];
    for (const [a, b, lv] of multSpace()) {
      const pl = buildPlan(a, b, lv);
      const fick = planMultHelpQueue(pl).map(tagOf);
      const want = [];
      if (pl.kind === 'simple') pl.pass.cols.forEach(c => want.push(...kolumnKo(c, true, false)));
      else {
        want.push('phase'); pl.p1.cols.forEach(c => want.push(...kolumnKo(c, false, false)));
        want.push('phase'); pl.p2.cols.forEach(c => want.push(...kolumnKo(c, false, false)));
        want.push('phase'); pl.add.cols.forEach(c => want.push(...kolumnKo(c, true, true)));
      }
      if (JSON.stringify(fick) !== JSON.stringify(want)) avv.push(`${a}·${b}`);
      for (const it of planMultHelpQueue(pl)) if (!KINDS.has(it.kind)) avv.push(`${a}·${b} ${it.kind}`);
    }
    expect(avv).toEqual([]);
  });

  it('forvantade svar: table = tabellfakta, mem = med minne, memwrite = siffran i rutan, memplace = minnet', () => {
    const fel = [];
    for (const [a, b, lv] of multSpace()) {
      for (const it of planMultHelpQueue(buildPlan(a, b, lv))) {
        if (it.step === 'table' && it.kind === 'mult' && it.base !== it.aDig * it.m) fel.push(`${a}·${b} table`);
        if (it.step === 'mem' && it.kind === 'mult' && it.prod !== it.base + it.carryIn) fel.push(`${a}·${b} mem`);
        if (it.step === 'mem' && it.kind === 'add' && it.sum !== it.base + it.carryIn) fel.push(`${a}·${b} addmem`);
        if (it.kind === 'memwrite' && it.write !== (it.prod !== undefined ? it.prod : it.sum) % 10) fel.push(`${a}·${b} memwrite`);
        if (it.kind === 'memplace' && !(it.val >= 1 && it.val <= 8)) fel.push(`${a}·${b} memplace ${it.val}`);
      }
    }
    expect(fel).toEqual([]);
  });

  it('siffrorna barnet skriver (memwrite/flydown/trivial) bildar produkten', () => {
    const fel = [];
    const join = ds => ds.reduce((n, d, i) => n + (d || 0) * Math.pow(10, i), 0);
    for (const [a, b, lv] of multSpace()) {
      const pl = buildPlan(a, b, lv), rows = { ans: [], p1: [], p2: [] };
      for (const it of planMultHelpQueue(pl)) {
        if (it.kind === 'memwrite' || it.kind === 'trivial') rows[it.rowKey][it.g] = it.write;
        if (it.kind === 'flydown') { rows[it.rowKey][it.g] = it.write; if (it.extra) rows[it.rowKey][it.g + 1] = it.extra; }
      }
      if (join(rows.ans) !== a * b) fel.push(`${a}·${b}`);
      if (pl.kind === 'twostep' && (join(rows.p1) !== pl.p1.value || join(rows.p2) / 10 !== pl.p2.value)) fel.push(`${a}·${b} delprodukt`);
    }
    expect(fel).toEqual([]);
  });

  it('28·8 och 98·78 sista kolumnen (B7): verbatim faser', () => {
    const t = (a, b, lv) => planMultHelpQueue(buildPlan(a, b, lv)).map(tagOf).join(' ');
    expect(t(28, 8, 2)).toBe('table memplace memwrite table mem flydown');
    const sista = planMultHelpQueue(buildPlan(98, 78, 4)).filter(it => it.rowKey === 'ans' && it.g === 3);
    expect(sista.map(tagOf)).toEqual(['mem', 'flydown']);
    expect(sista[0].single).toBe(true);
  });
});

describe('fria lagets minnesspalt raknas i rattningen (B5)', () => {
  const { planCarries, memMismatch } = MD.__test;
  it('planCarries: minnena i den ordning barnet moter dem', () => {
    expect(planCarries(buildPlan(28, 8, 2))).toEqual([6]);
    expect(planCarries(buildPlan(789, 9, 3))).toEqual([8, 8]);
    expect(planCarries(buildPlan(98, 78, 4))).toEqual([6, 5, 1, 1]);
    expect(planCarries(buildPlan(32, 3, 1))).toEqual([]);
  });
  it('memMismatch: forsta avvikelsen pekas ut, tomt = inget att anmarka pa', () => {
    expect(memMismatch([], [6])).toBeNull();
    expect(memMismatch([6], [6])).toBeNull();
    expect(memMismatch([5], [6])).toEqual({ pos: 0, wrote: 5, want: 6 });
    expect(memMismatch([6, 5, 2], [6, 5, 1, 1])).toEqual({ pos: 2, wrote: 2, want: 1 });
    expect(memMismatch([3], [])).toEqual({ pos: 0, wrote: 3, want: null });
  });
});

describe('fria lagets rester raknas i rattningen (division A4)', () => {
  const { planRests, restMismatch } = MD.__test;
  it('planRests: resten hamnar framfor NASTA siffra (g-1), aldrig efter sista', () => {
    expect(planRests(buildDivPlan(96, 4, 2))).toEqual({ 0: 1 });
    expect(planRests(buildDivPlan(738, 3, 3))).toEqual({ 1: 1, 0: 1 });
    expect(planRests(buildDivPlan(336, 6, 4))).toEqual({ 0: 3 });
    expect(planRests(buildDivPlan(612, 6, 4))).toEqual({ 0: 1 });
    expect(planRests(buildDivPlan(84, 4, 1))).toEqual({});
  });
  it('restMismatch: forsta avvikelsen vanster->hoger, saknade rester ar ok', () => {
    expect(restMismatch({}, { 0: 1 })).toBeNull();
    expect(restMismatch({ 0: 1 }, { 0: 1 })).toBeNull();
    expect(restMismatch({ 0: 2 }, { 0: 1 })).toEqual({ g: 0, wrote: 2, want: 1 });
    expect(restMismatch({ 1: 1, 0: 3 }, { 1: 1, 0: 1 })).toEqual({ g: 0, wrote: 3, want: 1 });
    expect(restMismatch({ 1: 2 }, {})).toEqual({ g: 1, wrote: 2, want: null });
  });
});


/* ── KORT DIVISION — modellen (spec §3–4, mockupen som facit, Dennis dom 23/9) ──
   Ren byggare över hela generatorrymden: fem fall per siffra, kvotsiffrorna
   bildar kvoten, resterna stämmer med nästa tal, och de fyra talen ur
   mockupen ger texterna ordagrant, steg för steg. */
describe('kort division — stegkedjan ur modellen', () => {
  const TYPES = new Set(['fraga', 'ryms_inte', 'ta_med', 'inget_kvar', 'fakta', 'skriv', 'rest', 'flytta', 'stryk', 'klart']);
  function forvantad(pl) {
    const t = [];
    for (const s of pl.pass.steps) {
      if (s.skip) { t.push('fraga', 'ryms_inte', 'ta_med'); continue; }                    // A
      if (s.cur === 0) { t.push('inget_kvar', 'stryk'); continue; }                        // B′
      if (s.q === 0) { t.push('fraga', 'ryms_inte'); if (!s.last) t.push('flytta'); t.push('stryk'); continue; } // B
      t.push('fraga', 'fakta', 'skriv');                                                   // C / D
      if (s.rem > 0) { t.push('rest'); if (!s.last) t.push('flytta'); }
      t.push('stryk');
    }
    t.push('klart');
    return t;
  }
  it('bara kända stegtyper; fallen A/B/B′/C/D uttömmande över hela rymden', () => {
    const fel = new Set(), avv = [], sedda = new Set();
    for (const [n, d, lv] of divSpace()) {
      const pl = buildDivPlan(n, d, lv), st = planDivSteps(pl);
      for (const s of st) if (!TYPES.has(s.t)) fel.add(s.t);
      if (JSON.stringify(st.map(s => s.t)) !== JSON.stringify(forvantad(pl))) avv.push(`${n}÷${d}`);
      for (const s of pl.pass.steps) sedda.add(s.skip ? 'A' : s.cur === 0 ? 'B′' : s.q === 0 ? 'B' : s.rem > 0 ? 'D' : 'C');
    }
    expect([...fel]).toEqual([]);
    expect(avv).toEqual([]);
    expect([...sedda].sort()).toEqual(['A', 'B', 'B′', 'C', 'D']);
  });
  it('varje arbetstal cur ∈ N..10N−1 för N ∈ 2..9 får en fakta-rad som stämmer', () => {
    const fel = [];
    for (let N = 2; N <= 9; N++) for (let cur = N; cur < 10 * N; cur++) {
      const q = Math.floor(cur / N), r = cur - q * N;
      const txt = divStepText({ t: 'fakta', N, cur, q, prod: q * N, r, g: 1 });
      if (!txt.includes(`${N}:${q === 1 ? 'a' : 'or'}`)) fel.push(`${cur}÷${N}: ${txt}`);
      if (r === 0 && !txt.endsWith(`är precis ${cur}.`)) fel.push(`${cur}÷${N}: ${txt}`);
      if (r > 0 && !(txt.includes(`är ${q * N} — det får plats.`) && txt.endsWith(`vore ${(q + 1) * N}, för mycket.`))) fel.push(`${cur}÷${N}: ${txt}`);
    }
    expect(fel).toEqual([]);
  });
  it('kvotsiffrorna som skrivs bildar kvoten, resterna stämmer med nästa tal', () => {
    const fel = [];
    for (const [n, d, lv] of divSpace()) {
      const pl = buildDivPlan(n, d, lv), st = planDivSteps(pl);
      let q = 0;
      for (const s of st) {
        if (s.t === 'skriv' || (s.t === 'ryms_inte' && s.zero) || s.t === 'inget_kvar') q = q * 10 + (s.q || 0);
        if (s.t === 'flytta') {
          const nx = pl.pass.steps.find(x => x.g === s.toG);
          if (!nx || nx.cur !== s.newCur) fel.push(`${n}÷${d} flytt ${s.newCur}`);
        }
        if (s.t === 'stryk' && s.gs.length === 2 && !s.fromSkip) fel.push(`${n}÷${d} två strykningar utan fall A`);
      }
      if (q !== n / d) fel.push(`${n}÷${d} kvot ${q}`);
    }
    expect(fel).toEqual([]);
  });

  const kedja = (n, d) => planDivSteps(buildDivPlan(n, d, 4)).filter(s => s.t !== 'klart').map(divStepText);
  it('420 ÷ 6 — A · C · B′ — ordagrant ur mockupen', () => {
    expect(kedja(420, 6)).toEqual([
      'Hur många 6:or ryms i 4?',
      'Ingen — 6 är större än 4. En nolla först skriver vi inte.',
      'Vi tar med 2:an i tiotalet — nu har vi 42.',
      'Hur många 6:or ryms i 42?',
      'Sju 6:or är precis 42.',
      'Vi skriver 7 i tiotalet.',
      'Hundratalet och tiotalet är klara — 42 är räknat. Vi stryker dem.',
      'Inget kvar att dela — vi skriver 0 i entalet.',
      'Entalet är klart — vi stryker det.',
    ]);
  });
  it('444 ÷ 6 — A · D · C', () => {
    expect(kedja(444, 6)).toEqual([
      'Hur många 6:or ryms i 4?',
      'Ingen — 6 är större än 4. En nolla först skriver vi inte.',
      'Vi tar med 4:an i tiotalet — nu har vi 44.',
      'Hur många 6:or ryms i 44?',
      'Sju 6:or är 42 — det får plats. Åtta vore 48, för mycket.',
      'Vi skriver 7 i tiotalet.',
      '44 − 42 = 2. Resten är 2.',
      'Resten 2 ställer sig framför 4:an i entalet — nu står det 24.',
      'Hundratalet och tiotalet är klara — 44 är räknat. Vi stryker dem.',
      'Hur många 6:or ryms i 24?',
      'Fyra 6:or är precis 24.',
      'Vi skriver 4 i entalet.',
      'Entalet är klart — vi stryker det.',
    ]);
  });
  it('612 ÷ 6 — C · B · C', () => {
    expect(kedja(612, 6)).toEqual([
      'Hur många 6:or ryms i 6?',
      'En 6:a är precis 6.',
      'Vi skriver 1 i hundratalet.',
      'Hundratalet är klart — vi stryker det.',
      'Hur många 6:or ryms i 1?',
      'Ingen — 6 är större än 1. Vi skriver 0 i tiotalet, och hela 1:an blir rest.',
      'Resten 1 ställer sig framför 2:an i entalet — nu står det 12.',
      'Tiotalet är klart — vi stryker det.',
      'Hur många 6:or ryms i 12?',
      'Två 6:or är precis 12.',
      'Vi skriver 2 i entalet.',
      'Entalet är klart — vi stryker det.',
    ]);
  });
  it('72 ÷ 6 — D med q = 1 · C', () => {
    expect(kedja(72, 6)).toEqual([
      'Hur många 6:or ryms i 7?',
      'En 6:a är 6 — det får plats. Två vore 12, för mycket.',
      'Vi skriver 1 i tiotalet.',
      '7 − 6 = 1. Resten är 1.',
      'Resten 1 ställer sig framför 2:an i entalet — nu står det 12.',
      'Tiotalet är klart — vi stryker det.',
      'Hur många 6:or ryms i 12?',
      'Två 6:or är precis 12.',
      'Vi skriver 2 i entalet.',
      'Entalet är klart — vi stryker det.',
    ]);
  });
  it('klick per uppgift i demon (första steget körs vid öppning): 8 / 12 / 11 / 9', () => {
    const klick = (n, d) => kedja(n, d).length - 1;
    expect([klick(420, 6), klick(444, 6), klick(612, 6), klick(72, 6)]).toEqual([8, 12, 11, 9]);
  });
});

/* ── Hjälpkön (spec §5): frågor där mockupen har frågor, tryck där den
   har tryck, kvittens = demons text med "Rätt —" framför. ── */
describe('kort division — hjälpkön', () => {
  const KINDS = new Set(['divq', 'divrest', 'divrestb', 'divzero', 'divplace', 'divstrike']);
  const cost = q => q.reduce((a, it) => a + (it.kind === 'divstrike' ? it.gs.length : 2), 0);
  it('bara kända poster; varje fråga bär sitt svar; demon och hjälpen är samma kedja', () => {
    const fel = [];
    for (const [n, d, lv] of divSpace()) {
      const pl = buildDivPlan(n, d, lv), q = planDivHelpQueue(pl), st = planDivSteps(pl);
      for (const it of q) {
        if (!KINDS.has(it.kind)) fel.push(`${n}÷${d} ${it.kind}`);
        if (['divq', 'divrest', 'divrestb', 'divzero'].includes(it.kind) && typeof it.answer !== 'number') fel.push(`${n}÷${d} ${it.kind} utan svar`);
        if (it.kind === 'divq' && it.answer !== (it.fall === 'A' || it.fall === 'B' ? 0 : it.q)) fel.push(`${n}÷${d} kvotsvar`);
        if (it.kind === 'divrest' && it.answer !== it.r) fel.push(`${n}÷${d} restsvar`);
        if (it.kind === 'divrestb' && it.answer !== it.cur) fel.push(`${n}÷${d} fall B: resten är hela talet`);
        if (it.kind === 'divzero' && it.answer !== 0) fel.push(`${n}÷${d} B′`);
      }
      const demoFragor = st.filter(s => s.t === 'fraga').map(s => s.g), hjalpFragor = q.filter(i => i.kind === 'divq').map(i => i.g);
      if (JSON.stringify(demoFragor) !== JSON.stringify(hjalpFragor)) fel.push(`${n}÷${d} olika frågor`);
      const demoStryk = st.filter(s => s.t === 'stryk').length, hjalpStryk = q.filter(i => i.kind === 'divstrike').length;
      if (demoStryk !== hjalpStryk) fel.push(`${n}÷${d} olika strykningar`);
    }
    expect(fel).toEqual([]);
  });
  it('420 ÷ 6: frågor, tryck och kvittenser ordagrant', () => {
    const q = planDivHelpQueue(buildDivPlan(420, 6, 4));
    expect(q.map(i => [i.kind, divHelpAsk(i), divHelpAck(i)])).toEqual([
      ['divq', 'Hur många 6:or ryms i 4?', 'Rätt — ingen. En nolla först skriver vi inte. Vi tar med 2:an i tiotalet — nu har vi 42.'],
      ['divq', 'Hur många 6:or ryms i 42?', 'Rätt — vi skriver 7 i tiotalet.'],
      ['divstrike', 'Hundratalet och tiotalet är klara — 42 är räknat. Tryck på dem, så stryker vi dem.', ''],
      ['divzero', 'Inget kvar att dela — vad skriver vi?', 'Rätt — 0 i entalet.'],
      ['divstrike', 'Entalet är klart — tryck på det, så stryker vi det.', ''],
    ]);
  });
  it('612 ÷ 6: fall B frågar "Hur mycket blir rest?" och placerar resten', () => {
    const q = planDivHelpQueue(buildDivPlan(612, 6, 4));
    expect(q.map(i => [i.kind, divHelpAsk(i), divHelpAck(i)])).toEqual([
      ['divq', 'Hur många 6:or ryms i 6?', 'Rätt — vi skriver 1 i hundratalet.'],
      ['divstrike', 'Hundratalet är klart — tryck på det, så stryker vi det.', ''],
      ['divq', 'Hur många 6:or ryms i 1?', 'Rätt — ingen. 6 är större än 1. Vi skriver 0 i tiotalet, och hela 1:an blir rest.'],
      ['divrestb', 'Hur mycket blir rest?', 'Rätt — resten är 1.'],
      ['divplace', 'Tryck på platsen framför 2:an i entalet — där ska resten 1 stå.', 'Rätt — resten 1 ställer sig framför 2:an i entalet — nu står det 12.'],
      ['divstrike', 'Tiotalet är klart — tryck på det, så stryker vi det.', ''],
      ['divq', 'Hur många 6:or ryms i 12?', 'Rätt — vi skriver 2 i entalet.'],
      ['divstrike', 'Entalet är klart — tryck på det, så stryker vi det.', ''],
    ]);
  });
  it('444 ÷ 6: restfrågan "44 − 42 = ?" och platsen', () => {
    const q = planDivHelpQueue(buildDivPlan(444, 6, 4));
    expect(q.map(i => i.kind)).toEqual(['divq', 'divq', 'divrest', 'divplace', 'divstrike', 'divq', 'divstrike']);
    expect(divHelpAsk(q[2])).toBe('44 − 42 = ?');
    expect(divHelpAck(q[2])).toBe('Rätt — 44 − 42 = 2. Resten är 2.');
    expect(divHelpAck(q[3])).toBe('Rätt — resten 2 ställer sig framför 4:an i entalet — nu står det 24.');
  });
  it('klick i hjälpläget (svar/tryck + Nästa, strykning per kolumn): 9 / 13 / 13 / 10', () => {
    const k = (n, d) => cost(planDivHelpQueue(buildDivPlan(n, d, 4)));
    expect([k(420, 6), k(444, 6), k(612, 6), k(72, 6)]).toEqual([9, 13, 13, 10]);
  });
  it('livlinans tabellrad (spec §6)', () => {
    expect(tabellradHTML(6, 44, 1)).toBe(
      '<span class="md-tr"><span>6 · 6 = 36</span><span class="md-trs"> · </span><strong>6 · 7 = 42</strong>' +
      '<span class="md-trs"> · </span><s>6 · 8 = 48</s></span><span class="md-trn">42 får plats i 44. 48 är för mycket.</span>');
    // Mira 23/9: "Precis 6." läste hon om tre gånger — jämnt fall sägs som det är
    expect(tabellradHTML(6, 42, 1)).toContain('42 går jämnt ut. 48 är för mycket.');
    // okänd kolumn får aldrig bli "spalt NaN"
    expect(tabellradHTML(6, 1, undefined)).not.toMatch(/NaN|undefined/);
    expect(tabellradHTML(6, 7, 1)).not.toContain('6 · 0');
    expect(tabellradHTML(6, 1, 1)).toBe('Ingen — 6 är större än 1. Vi skriver 0 i tiotalet, och hela 1:an blir rest.');
  });
});

/* ── Textsvepet (spec §11) ────────────────────────────────────────────
   Varje mening i varje fall, för divisor 2–9 och alla arbetstal, i demon
   och hjälpläget. Regeln handlar om ROLLER: samma tal får inte stå både
   som OBJEKT (det man räknar: "6:or", "6:a") och som ANTAL/TAL (bart) i
   samma mening. En siffra som pekas ut i talet ("4:an", "1:an") är samma
   sak som talet och räknas inte som en andra roll. Upprepning i samma
   roll ("44 − 42 = 2. Resten är 2.") är avsiktlig.
   Medvetet undantag: q = 1 — "En 6:a är precis 6" — självreferensen är
   sann (spec §11); samma tal på samma rad i frågan ("ryms i 6?"). */
describe('textsvepet: ingen mening säger samma tal i två roller', () => {
  const strip = h => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const roller = txt => {
    const objekt = [...txt.matchAll(/(\d+):(?:or|a)\b/g)].map(m => m[1]);
    const bart = [...txt.replace(/(\d+):(?:or|an|a)\b/g, ' ').matchAll(/\d+/g)].map(m => m[0]);
    return { objekt, bart };
  };
  const krock = txt => { const { objekt, bart } = roller(txt); return objekt.some(o => bart.includes(o)); };
  const allaTexter = () => {
    const ut = [];
    for (const [n, d, lv] of divSpace()) {
      const pl = buildDivPlan(n, d, lv);
      for (const s of planDivSteps(pl)) if (s.t !== 'klart') ut.push({ n, d, s, txt: strip(divStepText(s)), self: s.cur === s.N || (s.t === 'fakta' && s.q === 1) });
      for (const i of planDivHelpQueue(pl)) {
        ut.push({ n, d, s: i, txt: strip(divHelpAsk(i)), self: i.cur === i.N });
        const a = divHelpAck(i); if (a) ut.push({ n, d, s: i, txt: strip(a), self: i.cur === i.N });
      }
    }
    return ut;
  };
  it('samma tal står aldrig som objekt och antal i samma mening (utom q = 1)', () => {
    const fel = [];
    for (const x of allaTexter()) {
      if (x.self) continue;                       // q = 1: "En 6:a är 6" (spec §11) / "ryms i 6?"
      for (const mening of x.txt.split(/(?<=[.?!])\s+/)) if (krock(mening)) fel.push(`${x.n}÷${x.d} ${x.s.t || x.s.kind}: "${mening}"`);
    }
    expect(fel).toEqual([]);
  });
  it('vakten fäller fortfarande de gamla krockarna', () => {
    expect(krock('6 för mycket — vi tar bort en 6:a.')).toBe(true);
    expect(krock('Det skiljer 2 — då får en 2:a till plats.')).toBe(true);
    expect(krock('Sju 6:or är precis 42.')).toBe(false);
    expect(krock('Ingen — 6 är större än 1. Vi skriver 0 i tiotalet, och hela 1:an blir rest.')).toBe(false);
  });
  const JAMFORANDE = /\b(närmast|närmare|bäst|bättre|hellre|i stället för)\b/i;
  it('inga jämförande ord som förutsätter ett val som inte gjordes', () => {
    const fel = [];
    for (const x of allaTexter()) if (JAMFORANDE.test(x.txt)) fel.push(`${x.n}÷${x.d}: "${x.txt}"`);
    expect(fel).toEqual([]);
  });
  it('antalet textformer är litet nog att läsa igenom för hand', () => {
    const former = new Set();
    for (const x of allaTexter()) former.add(x.txt.replace(/\d+/g, '#').replace(/entalet|tiotalet|hundratalet|tusentalet/g, '@'));
    expect(former.size).toBeLessThanOrEqual(50);
  });
});

describe('ovningslaget raknar bara helratt', () => {
  const src = readFileSync(new URL('../js/multdiv.js', import.meta.url), 'utf8');

  it('helpTaskDone raknar inte poang villkorslost', () => {
    const rad = src.split('\n').find(l => l.includes('if (helpTaskClean) exScore++'));
    expect(rad, 'helpTaskDone ska vara villkorad av helpTaskClean').toBeTruthy();
    expect(src).not.toMatch(/function helpTaskDone\(\)\s*\{\s*\n\s*exScore\+\+;/);
  });

  it('bade fel svar och fel tap gor passet orent', () => {
    // helpWrong (knappsatsen) och alla fyra memMistakes-stallen
    expect((src.match(/helpTaskClean = false/g) || []).length).toBeGreaterThanOrEqual(5);
  });

  it('Minnesmastaren kraver bade rena tap OCH inga fel svar', () => {
    expect(src).toMatch(/memStar = helpMode && memMoments > 0 && memMistakes === 0 && exWrongAnswers === 0/);
  });

  it('tredje felet visar vagen utan att kosta en livlina', () => {
    expect(src).toMatch(/if \(helpTries >= 3\) visaVagen\(\)/);
    // livlinan drar polletten FORST efter att vagen faktiskt visats —
    // och minns fragan, sa ett andra tryck pa samma fraga ar gratis (Mira 23/9)
    expect(src).toMatch(/if \(!visaVagen\(\)\) return;\s*\n\s*lifelineShownFor = item;\s*\n\s*lifelines--/);
    expect(src).toMatch(/lifelineShownFor === item\) \{ visaVagen\(\); return; \}/);
  });

  it('fel svar forbrukas: nasta siffra borjar om', () => {
    expect(src).toMatch(/helpInputStale = true/);
    expect(src).toMatch(/if \(helpInputStale\) \{ helpInputStale = false; helpInput = k;/);
  });

  it('Capy far pct ur exScore — ingen egen sanning', () => {
    expect(src).toMatch(/Capy\.award\(profile, \{ type: 'test', data: \{ module: 'multdiv', pct: Math\.round\(\(exScore \/ 5\) \* 100\), memStar \} \}\)/);
  });
});
