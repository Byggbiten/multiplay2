/* tests/multdiv.test.mjs — stegbyggarna i js/multdiv.js (multiplikation + kort division) */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const MD = require('../js/multdiv.js');
const { buildPlan, buildDivPlan, digitsOf } = MD._internals;
const { planMultSteps, planDivSteps, planMultHelpQueue, planDivHelpQueue } = MD.__test;

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

/* ── Referens: dagens byggare, ordagrant (multdiv.js 611–697 fore utbrytningen) ── */
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
function refDivSteps(pl) {
  const steps = [], nd = digitsOf(pl.a);
  for (const s of pl.pass.steps) {
    steps.push({ t: 'dhl', ...s });
    if (s.skip) { steps.push({ t: 'dskip', ...s }); continue; }
    if (s.remIn > 0 && s.rem === 0) steps.push({ t: 'dwrite', ...s });
    else { steps.push({ t: 'dask', ...s }); steps.push({ t: 'dwrite', ...s }); }
    if (s.rem > 0 && !s.last) steps.push({ t: 'drem', ...s });
    const gsDone = s.fromSkip ? [s.g + 1, s.g] : [s.g];
    steps.push({ t: 'dstrike', gs: gsDone, digits: gsDone.map(g => nd[g]), last: s.last });
  }
  steps.push({ t: 'done' });
  return steps;
}
function refMultHelp(pl) {
  const q = [];
  const memQ = (c, g, finalPass) => {
    if (c.carryIn > 0 && !(finalPass && c.last)) q.push({ kind: 'memstrike', val: c.carryIn });
    if (!c.last && c.carryOut > 0) q.push({ kind: 'memplace', val: c.carryOut, srcG: g });
  };
  const passQ = (pass, rowKey, shift, finalPass) => {
    for (const c of pass.cols) {
      const g = c.col + shift;
      if (c.carryIn > 0) {
        q.push({ kind: 'mult', ...c, g, rowKey, mCol: shift, step: 'table' });
        q.push({ kind: 'mult', ...c, g, rowKey, mCol: shift, step: 'mem' });
      } else q.push({ kind: 'mult', ...c, g, rowKey, mCol: shift });
      memQ(c, g, finalPass);
    }
  };
  if (pl.kind === 'simple') passQ(pl.pass, 'ans', 0, true);
  else {
    q.push({ kind: 'phase', which: 1 }); passQ(pl.p1, 'p1', 0, false);
    q.push({ kind: 'phase', which: 2 }); passQ(pl.p2, 'p2', 1, false);
    q.push({ kind: 'phase', which: 3 });
    for (const c of pl.add.cols) {
      const single = (c.x === null || c.y === null) && c.carryIn === 0;
      const bothNull = c.x === null && c.y === null;
      if (single) q.push({ kind: 'trivial', ...c, g: c.col, rowKey: 'ans' });
      else if (c.carryIn > 0 && !bothNull) {
        if (c.x !== null && c.y !== null) q.push({ kind: 'add', ...c, g: c.col, rowKey: 'ans', step: 'table' });
        q.push({ kind: 'add', ...c, g: c.col, rowKey: 'ans', step: 'mem' });
      } else q.push({ kind: 'add', ...c, g: c.col, rowKey: 'ans' });
      memQ(c, c.col, true);
    }
  }
  return q;
}
function refDivHelp(pl) {
  const q = [], nd = digitsOf(pl.a);
  for (const s of pl.pass.steps) {
    if (s.skip) { q.push({ kind: 'dskip', rowKey: 'q', ...s }); continue; }
    q.push({ kind: 'divq', rowKey: 'q', ...s });
    if (s.rem > 0 && !s.last) {
      if (s.q > 0) q.push({ kind: 'divrem', rowKey: 'q', ...s });
      q.push({ kind: 'divplace', rowKey: 'q', ...s });
    }
    if (!s.last) {
      if (s.fromSkip) q.push({ kind: 'divstrike', strikeG: s.g + 1, digit: nd[s.g + 1] });
      q.push({ kind: 'divstrike', strikeG: s.g, digit: nd[s.g] });
    }
  }
  return q;
}

describe('karakterisering — hjalpkon och divisionen ar oforandrade', () => {
  it('planMultHelpQueue == dagens buildHelpQueue over hela generatorrymden', () => {
    const avv = [];
    for (const [a, b, lv] of multSpace()) {
      const pl = buildPlan(a, b, lv);
      if (JSON.stringify(planMultHelpQueue(pl)) !== JSON.stringify(refMultHelp(pl))) avv.push(`${a}·${b}`);
    }
    expect(avv).toEqual([]);
  });
  it('planDivSteps == dagens buildDivDemoSteps over hela generatorrymden', () => {
    const avv = [];
    for (const [n, d, lv] of divSpace()) {
      const pl = buildDivPlan(n, d, lv);
      if (JSON.stringify(planDivSteps(pl)) !== JSON.stringify(refDivSteps(pl))) avv.push(`${n}÷${d}`);
    }
    expect(avv).toEqual([]);
  });
  it('planDivHelpQueue == dagens buildDivHelpQueue over hela generatorrymden', () => {
    const avv = [];
    for (const [n, d, lv] of divSpace()) {
      const pl = buildDivPlan(n, d, lv);
      if (JSON.stringify(planDivHelpQueue(pl)) !== JSON.stringify(refDivHelp(pl))) avv.push(`${n}÷${d}`);
    }
    expect(avv).toEqual([]);
  });
});

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
