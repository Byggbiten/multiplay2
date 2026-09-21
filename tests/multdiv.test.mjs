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

describe('karakterisering — utbrytningen andrar ingenting', () => {
  it('planMultSteps == dagens buildDemoSteps over hela generatorrymden', () => {
    const avv = [];
    for (const [a, b, lv] of multSpace()) {
      const pl = buildPlan(a, b, lv);
      if (JSON.stringify(planMultSteps(pl)) !== JSON.stringify(refMultSteps(pl))) avv.push(`${a}·${b}`);
    }
    expect(avv).toEqual([]);
  });
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
