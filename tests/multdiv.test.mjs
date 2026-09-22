/* tests/multdiv.test.mjs — stegbyggarna i js/multdiv.js (multiplikation + kort division) */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const MD = require('../js/multdiv.js');
const { buildPlan, buildDivPlan, digitsOf } = MD._internals;
const { planMultSteps, planDivSteps, planMultHelpQueue, planDivHelpQueue, planAnchorWalk } = MD.__test;

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

describe('karakterisering — divisionens hjalpko ar oforandrad', () => {
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

describe('kort divisionens nya stegkedja (GRANSKNING A1/B1/B3/B4/B5/B6)', () => {
  const DIV_TYPES = new Set(['dskip', 'dtake', 'dask', 'dwalk_anchors', 'dwalk_pick',
                             'dwalk_gap', 'dwrite', 'drem_calc', 'drem_place',
                             'dstrike', 'done']);
  /* Ankarvandringen (22/9) ligger mellan fragan och svaret. q = 0 har
     ingen vandring — planAnchorWalk ger kind 'ingen' och dask gar rakt
     pa dwrite ("Ingen hel 6:a ryms").
     23/9: vandringens mitt ar TVA steg — dwalk_pick (valet + "hur mycket
     skiljer det?") och dwalk_gap (krocken). 'exakt' saknar dwalk_gap:
     ankaret AR talet, det finns inget avstand att mata. */
  function forvantad(pl, d) {
    const t = [];
    for (const s of pl.pass.steps) {
      if (s.skip) { t.push('dskip', 'dtake'); continue; }
      t.push('dask');
      const w = planAnchorWalk(s.cur, d);
      /* Ingen vandring nar den inte lar ut nagot: q = 0 (inget ryms) eller
         talet AR divisorn (Dennis 22/9, 816 ÷ 8: "lite lojlig"). */
      if (s.q > 0 && !w.tyst) {
        t.push('dwalk_anchors', 'dwalk_pick');
        // steg 0: ankaret ger redan kvotsiffran — inget att justera
        if (w.steg !== 0) t.push('dwalk_gap');
      }
      t.push('dwrite');
      if (s.rem > 0 && !s.last) t.push('drem_calc', 'drem_place');
      t.push('dstrike');
    }
    t.push('done');
    return t;
  }
  it('bara kanda stegtyper, dhl finns inte, sista siffran far dask (B3)', () => {
    const fel = new Set(), avv = [];
    for (const [n, d, lv] of divSpace()) {
      const pl = buildDivPlan(n, d, lv), st = planDivSteps(pl);
      for (const s of st) if (!DIV_TYPES.has(s.t)) fel.add(s.t);
      if (JSON.stringify(st.map(s => s.t)) !== JSON.stringify(forvantad(pl, d))) avv.push(`${n}÷${d}`);
    }
    expect([...fel]).toEqual([]);
    expect(avv).toEqual([]);
  });
  it('kvotsiffrorna som skrivs bildar kvoten, resterna stammer med naesta tal', () => {
    const fel = [];
    for (const [n, d, lv] of divSpace()) {
      const pl = buildDivPlan(n, d, lv), qs = [];
      let q = 0;
      for (const s of planDivSteps(pl)) {
        if (s.t === 'dwrite') { qs[s.g] = s.q; q = q * 10 + s.q; }
        if (s.t === 'drem_place' && s.rem * 10 + s.next !== pl.pass.steps.find(x => x.g === s.g - 1).cur) fel.push(`${n}÷${d} rest`);
      }
      if (q !== n / d) fel.push(`${n}÷${d}`);
    }
    expect(fel).toEqual([]);
  });
  it('granskningens tal: verbatim kedja', () => {
    const t = (n, d, lv) => planDivSteps(buildDivPlan(n, d, lv)).map(s => s.t).join(' ');
    const W = 'dwalk_anchors dwalk_pick dwalk_gap ';   // ankare + fråga + krock
    const P = 'dwalk_anchors dwalk_pick ';             // steg 0 — ingen krock
    /* 23/9: ETT ankare, och vandringen tiger nar talet gar jamnt upp utan
       att ankaret traffar. Mycket faller darfor bort. */
    // 84 ÷ 4: 8÷4 traffar ankaret (steg 0); 4÷4 gar jamnt ut med q=1 -> tyst
    expect(t(84, 4, 1)).toBe('dask ' + P + 'dwrite dstrike dask dwrite dstrike done');
    // 96 ÷ 4: 9÷4 steg 0 med rest; 16÷4 jamnt ut men ankaret 5 traffar inte -> tyst
    expect(t(96, 4, 2)).toBe('dask ' + P + 'dwrite drem_calc drem_place dstrike dask dwrite dstrike done');
    // 738 ÷ 3: 7÷3 steg 0; 13÷3 upp; 18÷3 jamnt ut, ankaret 5 traffar inte -> tyst
    expect(t(738, 3, 3)).toBe('dask ' + P + 'dwrite drem_calc drem_place dstrike dask ' + W +
                              'dwrite drem_calc drem_place dstrike dask dwrite dstrike done');
    // 336 ÷ 6: ledande hopp, 33÷6 steg 0, 36÷6 jamnt ut -> tyst
    expect(t(336, 6, 4)).toBe('dskip dtake dask ' + P + 'dwrite drem_calc drem_place dstrike dask dwrite dstrike done');
    // 612 ÷ 6: 6÷6 tyst (q=1), 1÷6 ingen vandring (q=0), 12÷6 traffar ankaret
    expect(t(612, 6, 4)).toBe('dask dwrite dstrike dask dwrite drem_calc drem_place dstrike dask ' + P + 'dwrite dstrike done');
    // 105 ÷ 3 (Dennis eget): 10÷3 upp med rest, 15÷3 traffar ankaret 5
    expect(t(105, 3, 4)).toBe('dskip dtake dask ' + W + 'dwrite drem_calc drem_place dstrike dask ' + P + 'dwrite dstrike done');
    // 816 ÷ 8: hundratalet tyst (talet AR divisorn), 16÷8 traffar ankaret 2
    expect(t(816, 8, 4)).toBe('dask dwrite dstrike dask dwrite drem_calc drem_place dstrike dask ' + P + 'dwrite dstrike done');
  });

  it('hjalpkon och demon ar samma kedja: varje siffra far en fraga i bada', () => {
    const avv = [];
    for (const [n, d, lv] of divSpace()) {
      const pl = buildDivPlan(n, d, lv);
      const demoAsk = planDivSteps(pl).filter(s => s.t === 'dask').map(s => s.g);
      const helpAsk = planDivHelpQueue(pl).filter(s => s.kind === 'divq').map(s => s.g);
      if (JSON.stringify(demoAsk) !== JSON.stringify(helpAsk)) avv.push(`${n}÷${d}`);
    }
    expect(avv).toEqual([]);
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

/* ── Ankarvandringen (Dennis 22/9) ────────────────────────────────────
   Livlinan ska ge VÄGEN, inte svaret. Vägen går via ett ankare barnet
   redan kan (1-, 2-, 5-, 10-tabellen) och ett kort avstånd därifrån.
   Testerna låser de tre egenskaper som gör vägen gåbar för ett barn:
   den stämmer, ankarna ramar in svaret, och steget är kort.          */
describe('ankarvandringen', () => {


  it('45 ÷ 7 ger Dennis egen vandring', () => {
    const w = planAnchorWalk(45, 7);
    expect(w.ankare.prod).toBe(35);          // 23/9: ETT ankare, inte ett par
    expect(w.bas).toEqual(w.ankare);         // bas ar alias for ankare
    expect(w.bas.prod).toBe(35);
    expect(w.kind).toBe('upp');
    expect(w.steg).toBe(1);
    expect(w.mellan).toBe(10);
    expect(w.q).toBe(6);
    expect(w.rest).toBe(3);
  });

  it('45 ÷ 9 landar rakt på ankaret', () => {
    const w = planAnchorWalk(45, 9);
    expect(w.kind).toBe('exakt');
    expect(w.bas.prod).toBe(45);
    expect(w.steg).toBe(0);
  });

  it('kvotsiffran och resten är alltid rätt', () => {
    const fel = [];
    for (let d = 2; d <= 9; d++) for (let c = 0; c < 10 * d; c++) {
      const w = planAnchorWalk(c, d);
      if (w.q * d + w.rest !== c) fel.push(`${c}÷${d}`);
      if (w.rest < 0 || w.rest >= d) fel.push(`${c}÷${d} rest ${w.rest}`);
    }
    expect(fel).toEqual([]);
  });

  it('steget från ankaret är aldrig mer än två', () => {
    const fel = [];
    for (let d = 2; d <= 9; d++) for (let c = d; c < 10 * d; c++) {
      const w = planAnchorWalk(c, d);
      if (w.steg > 2) fel.push(`${c}÷${d} steg ${w.steg}`);
    }
    expect(fel).toEqual([]);
  });

  it('basen plus steget är kvotsiffran, åt rätt håll', () => {
    const fel = [];
    for (let d = 2; d <= 9; d++) for (let c = d; c < 10 * d; c++) {
      const w = planAnchorWalk(c, d);
      const nadd = w.kind === 'ner' ? w.bas.n - w.steg : w.bas.n + w.steg;
      if (nadd !== w.q) fel.push(`${c}÷${d}: ${w.bas.n} ${w.kind} ${w.steg} gav ${nadd}, väntat ${w.q}`);
    }
    expect(fel).toEqual([]);
  });

  /* Dennis 23/9, efter Miras prov: ETT ankare ur 2/5/10. Paret visade ett
     tal som inte fanns i uppgiften ("Tva 3:or ar 6. Fem 3:or ar 15." —
     "Var kommer 15 ifran?"). Ettan utgar: "en 3:a ar 3" lar inte ut nagot. */
  it('ett ankare ur 2/5/10, narmast i antal steg, aldrig mer an tva steg', () => {
    const ok = [2, 5, 10], fel = [];
    for (let d = 2; d <= 9; d++) for (let c = d; c < 10 * d; c++) {
      const w = planAnchorWalk(c, d);
      if (Array.isArray(w.ankare)) fel.push(`${c}÷${d}: ankare ar fortfarande ett par`);
      if (!ok.includes(w.ankare.n)) fel.push(`${c}÷${d} ankare ${w.ankare.n}`);
      if (w.bas.n !== w.ankare.n) fel.push(`${c}÷${d}: bas och ankare skiljer`);
      if (w.steg > 2) fel.push(`${c}÷${d}: ${w.steg} steg`);
      // narmast i antal steg, vid lika det lagre
      const basta = ok.reduce((b, a) => Math.abs(w.q - a) < Math.abs(w.q - b) ? a : b, ok[0]);
      if (w.ankare.n !== basta) fel.push(`${c}÷${d}: valde ${w.ankare.n}, narmast ar ${basta}`);
    }
    expect(fel).toEqual([]);
  });

  it('ankarvalet per kvotsiffra ar Dennis tabell', () => {
    const facit = { 1: 2, 2: 2, 3: 2, 4: 5, 5: 5, 6: 5, 7: 5, 8: 10, 9: 10 };
    for (let d = 2; d <= 9; d++) for (let q = 1; q <= 9; q++) {
      expect(`q=${q} d=${d} -> ${planAnchorWalk(q * d, d).ankare.n}`)
        .toBe(`q=${q} d=${d} -> ${facit[q]}`);
    }
  });

  it('kvotsiffra 0 får ingen vandring', () => {
    for (let d = 2; d <= 9; d++) for (let c = 0; c < d; c++) {
      expect(planAnchorWalk(c, d).kind).toBe('ingen');
    }
  });
});

/* Dennis 22/9: 816 ÷ 8 gav en hel ankarvandring för att komma fram till
   att 8:an går upp i sig själv en gång. Vandringen finns för att ta sig
   fram till ett svar man inte ser — när man ser det ska den hålla tyst. */
describe('vandringen tiger nar den inte lar ut nagot', () => {
  const { planAnchorWalk, planDivSteps, anchorWalkRows } = require('../js/multdiv.js').__test;
  const { buildDivPlan } = require('../js/multdiv.js')._internals;

  it('talet ar divisorn: tyst', () => {
    for (let d = 2; d <= 9; d++) expect(planAnchorWalk(d, d).tyst).toBe(true);
  });

  /* Dennis 23/9, efter Miras 9 ÷ 3: ankaret sade "6 ar narmast" om ett tal
     som ar EXAKT tre 3:or, och hon trodde att hon raknat fel. Gar det jamnt
     upp bar talet sitt svar oppet — da ska vandringen tiga. Det gamla
     trivial-fallet (q = 1, jamnt ut) ar en delmangd av samma regel. */
  it('tyst nar det gar jamnt upp och ankaret inte traffar', () => {
    const fel = [];
    for (let d = 2; d <= 9; d++) for (let c = 0; c < 10 * d; c++) {
      const w = planAnchorWalk(c, d);
      if (w.kind === 'ingen') { if (w.tyst) fel.push(`${c}÷${d}: q=0 ska inte flaggas`); continue; }
      const vantat = w.rest === 0 && (w.q === 1 || w.steg !== 0);
      if (!!w.tyst !== vantat) fel.push(`${c}÷${d}: tyst ${w.tyst}, väntat ${vantat}`);
    }
    expect(fel).toEqual([]);
  });

  /* Varfor nedat-texten alltid behover saga hela-grupper-regeln: overskottet
     ar hela grupper exakt nar talet gar jamnt upp (bas*N - cur = steg*N
     <=> cur = q*N <=> rest = 0), och de fallen ar tysta. Faller det har
     testet har tyst-regeln lossats och r2b behover sin andra gren igen. */
  it('overskottet ar aldrig hela grupper i en SYNLIG vandring', () => {
    for (let d = 2; d <= 9; d++) for (let c = d; c < 10 * d; c++) {
      const w = planAnchorWalk(c, d);
      if (w.kind !== 'ner' || w.tyst) continue;
      expect(w.bas.prod - c).not.toBe(w.steg * d);
    }
  });

  it('9 ÷ 3 och 816 ÷ 8 tiger, 47 ÷ 9 och 44 ÷ 6 talar', () => {
    expect(planAnchorWalk(9, 3).tyst).toBe(true);    // jämnt ut, ankaret 6
    expect(planAnchorWalk(8, 8).tyst).toBe(true);    // talet är divisorn
    expect(planAnchorWalk(47, 9).tyst).toBe(false);  // rest kvar
    expect(planAnchorWalk(44, 6).tyst).toBe(false);  // rest kvar
  });

  it('gamla trivial-flaggan ar borta', () => {
    for (let d = 2; d <= 9; d++) for (let c = d; c < 10 * d; c++) {
      expect(planAnchorWalk(c, d).trivial).toBeUndefined();
    }
  });

  /* steg 0: ankaret ger redan kvotsiffran. Forr stalldes "8 − 5 = ?" och
     sedan "Blir nagot over? 8 − 5 = ?" — ordagrant samma subtraktion tva
     ganger. Ingen krock, ingen avstandsfraga. */
  it('steg 0 ger varken krock eller avstandsfraga', () => {
    const fel = [];
    for (let d = 2; d <= 9; d++) for (let c = d; c < 10 * d; c++) {
      const w = planAnchorWalk(c, d);
      if (w.tyst || w.steg !== 0) continue;
      const r = anchorWalkRows(c, d, 'kvot', 1);
      if (r.r2b) fel.push(`${c}÷${d} har r2b`);
      if (r.r2q) fel.push(`${c}÷${d} har avståndsfråga`);
    }
    expect(fel).toEqual([]);
  });

  it('816 ÷ 8: hundratalet far inga vandringssteg', () => {
    const steps = planDivSteps(buildDivPlan(816, 8));
    const kol2 = steps.filter(s => s.g === 2).map(s => s.t);
    expect(kol2).not.toContain('dwalk_anchors');
    expect(kol2).not.toContain('dwalk_pick');
    expect(kol2).toContain('dask');
    expect(kol2).toContain('dwrite');
  });

  it('816 ÷ 8 ger fortfarande 102', () => {
    const pl = buildDivPlan(816, 8);
    expect(pl.answer).toBe(102);
  });
});

/* ── Textsvepet ───────────────────────────────────────────────────────
   Dennis 22/9, efter att ha hittat samma fel tre gånger själv: "nu vill
   jag att du gör ett bättre jobb med att granska det jobb och resultat du
   får av subagenterna."

   Felen han hittade var inte geometriska — de satt i SPRÅKET, och mina
   mätningar av pixlar och nodidentitet kunde aldrig se dem. "6 för mycket
   — vi tar bort en 6:a" lade ett ANTAL bredvid ett OBJEKT med samma
   siffra, och barnet kan inte veta vilket som är vilket.

   Det här svepet läser varje mening i varje möjlig vandring (divisor 2–9,
   alla tal) och fäller den mekaniskt om samma heltal förekommer två
   gånger i samma mening. Det hittade ett sextonde fall av samma klass i
   upp-riktningen som ingen hade rapporterat.                          */
describe('textsvepet: ingen mening sager samma tal i tva roller', () => {
  const { planAnchorWalk, anchorWalkRows } = require('../js/multdiv.js').__test;
  const strip = h => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  /* 23/9: svepet raknade FOREKOMSTER, men regeln Dennis satte handlar om
     ROLLER — "ett ANTAL bredvid ett OBJEKT med samma siffra". Nar han bad
     om "Vi kan bara ta bort hela 4:or — sa vi tar bort en 4:a" namns
     divisorn tva ganger med flit, i SAMMA roll, och det ar just det som
     gor meningen otvetydig. Svepet skiljer darfor pa:
       objekt = "N:or" / "N:a" (saken man raknar)
       bart   = varje annat heltal (ett antal, ett tal, ett resultat)
     Fallt om samma tal star bart tva ganger, eller star bade som objekt
     och bart. Upprepat objekt ar tillatet. */
  const roller = txt => {
    const objekt = [...txt.matchAll(/(\d+):(?:or|a)\b/g)].map(m => m[1]);
    const bart = [...txt.replace(/(\d+):(?:or|a)\b/g, ' ').matchAll(/\d+/g)].map(m => m[0]);
    return { objekt, bart };
  };

  it('samma tal star aldrig i tva roller (antal vs objekt)', () => {
    const fel = [];
    for (let d = 2; d <= 9; d++) for (let c = d; c < 10 * d; c++) {
      const w = planAnchorWalk(c, d);
      if (w.kind === 'ingen' || w.tyst) continue;
      const r = anchorWalkRows(c, d, 'kvot', 1);
      for (const [namn, html] of [['r1', r.r1], ['r2a', r.r2a], ['r2b', r.r2b], ['r2q', r.r2q]]) {
        if (!html) continue;
        const txt = strip(html), { objekt, bart } = roller(txt), sedda = {};
        for (const t of bart) {
          sedda[t] = (sedda[t] || 0) + 1;
          if (sedda[t] > 1) { fel.push(`${c}÷${d} ${namn} (samma tal bart två ggr): "${txt}"`); break; }
        }
        for (const o of objekt)
          if (bart.includes(o)) { fel.push(`${c}÷${d} ${namn} (objekt + antal): "${txt}"`); break; }
      }
    }
    expect(fel).toEqual([]);
  });

  /* Vakten far inte slappa igenom de fall Dennis sjalv hittade. */
  it('vakten faller fortfarande de gamla krockarna', () => {
    const krock = t => {
      const { objekt, bart } = roller(t), sedda = {};
      for (const x of bart) { sedda[x] = (sedda[x] || 0) + 1; if (sedda[x] > 1) return true; }
      return objekt.some(o => bart.includes(o));
    };
    expect(krock('6 för mycket — vi tar bort en 6:a.')).toBe(true);
    expect(krock('Det skiljer 2 — då får en 2:a till plats.')).toBe(true);
    expect(krock('Vi kan bara ta bort hela 9:or — vi tar bort en: 9.')).toBe(true);
    expect(krock('30 är närmast. Hur långt är det från 30 upp till 44?')).toBe(true);
    // och slapper igenom det som ar otvetydigt
    expect(krock('Vi kan bara ta bort hela 4:or — så vi tar bort en 4:a. Då blir det 36.')).toBe(false);
    expect(krock('Hur långt över 39 är 40?')).toBe(false);
    expect(krock('Fem 6:or är 30.')).toBe(false);
  });

  it('antalet textformer ar litet nog att lasa igenom for hand', () => {
    const former = new Set();
    for (let d = 2; d <= 9; d++) for (let c = d; c < 10 * d; c++) {
      const w = planAnchorWalk(c, d);
      if (w.kind === 'ingen' || w.tyst) continue;
      const r = anchorWalkRows(c, d, 'kvot', 1);
      for (const [n, h] of [['r1', r.r1], ['r2a', r.r2a], ['r2b', r.r2b], ['r3', r.r3]])
        if (h) former.add(n + '|' + strip(h).replace(/\d+/g, '#'));
    }
    /* Växer den här förbi ~40 har någon lagt till en specialformulering
       som ingen läst igenom. Då ska svepet köras och texterna granskas. */
    expect(former.size).toBeLessThanOrEqual(40);
  });
});

/* ── Ovningslagets sanning ────────────────────────────────────────────
   Mira svarade fel sex ganger och fick "100 % — Perfekt! 🎉 — 5 av 5
   ratt — ⭐ Minnesmastare". helpTaskDone raknade poang villkorslost.
   Har pinnas KALLAN i stallet for DOM:en: hjalplaget maste ha samma
   villkorade rakning som fria laget redan hade.                       */
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
    // livlinan drar polletten FORST efter att vagen faktiskt visats
    expect(src).toMatch(/if \(!visaVagen\(\)\) return;\s*\n\s*lifelines--/);
  });

  it('fel svar forbrukas: nasta siffra borjar om', () => {
    expect(src).toMatch(/helpInputStale = true/);
    expect(src).toMatch(/if \(helpInputStale\) \{ helpInputStale = false; helpInput = k;/);
  });

  it('Capy far pct ur exScore — ingen egen sanning', () => {
    expect(src).toMatch(/Capy\.award\(profile, \{ type: 'test', data: \{ module: 'multdiv', pct: Math\.round\(\(exScore \/ 5\) \* 100\), memStar \} \}\)/);
  });
});

/* Tiger vandringen ska den tiga hela vagen — aven i hjalplagets fraga.
   For 9 ÷ 3 var det just "6 ar narmast" som fick Mira att tro att hon
   raknat fel, och raden kom fram i fragan aven nar animationen hoppades
   over.                                                                */
describe('tyst vandring lacker inte in i fragan', () => {
  const src = readFileSync(new URL('../js/multdiv.js', import.meta.url), 'utf8');
  it('askText returnerar bara fragan nar vandringen ar tyst', () => {
    expect(src).toMatch(/if \(r\.w\.tyst\) return divqHeadHTML\(item\);/);
  });
  it('q = 0 behaller sin ledtrad', () => {
    expect(src).toMatch(/if \(r\.w\.kind === 'ingen'\) return divqHeadHTML\(item\) \+ r\.r1;/);
  });
});
