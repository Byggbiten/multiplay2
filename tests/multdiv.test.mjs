/* tests/multdiv.test.mjs — stegbyggarna i js/multdiv.js (multiplikation + kort division) */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const MD = require('../js/multdiv.js');
const { buildPlan, buildDivPlan, digitsOf } = MD._internals;
/* Texterna bär ref-markeringar (D40 ✎) — de ordagranna jämförelserna gäller orden */
const ord = h => h.replace(/<[^>]+>/g, '');
const { planMultSteps, planDivSteps, planMultHelpQueue, planDivHelpQueue,
        divStepText, divHelpAsk, divHelpAck, tabellradHTML, multStepText, multLitCells } = MD.__test;

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
  const { planCarries } = MD.__test;
  it('planCarries: minnena i den ordning barnet moter dem', () => {
    expect(planCarries(buildPlan(28, 8, 2))).toEqual([6]);
    expect(planCarries(buildPlan(789, 9, 3))).toEqual([8, 8]);
    expect(planCarries(buildPlan(98, 78, 4))).toEqual([6, 5, 1, 1]);
    expect(planCarries(buildPlan(32, 3, 1))).toEqual([]);
  });
});

/* Dennis 23/9: i Räkna själv skriver barnet inte resterna (de hålls i
   kladden) — restMismatch och rest-platserna är rivna. planRests lever:
   den styr vilka rester som landar på pappret vid rätt svar. */
describe('fria lagets rester landar pa pappret vid ratt svar', () => {
  const { planRests } = MD.__test;
  it('planRests: resten hamnar framfor NASTA siffra (g-1), aldrig efter sista', () => {
    expect(planRests(buildDivPlan(96, 4, 2))).toEqual({ 0: 1 });
    expect(planRests(buildDivPlan(738, 3, 3))).toEqual({ 1: 1, 0: 1 });
    expect(planRests(buildDivPlan(336, 6, 4))).toEqual({ 0: 3 });
    expect(planRests(buildDivPlan(612, 6, 4))).toEqual({ 0: 1 });
    expect(planRests(buildDivPlan(84, 4, 1))).toEqual({});
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

  const kedja = (n, d) => planDivSteps(buildDivPlan(n, d, 4)).filter(s => s.t !== 'klart').map(s => ord(divStepText(s)));
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
    expect(q.map(i => [i.kind, ord(divHelpAsk(i)), ord(divHelpAck(i))])).toEqual([
      ['divq', 'Hur många 6:or ryms i 4?', 'Rätt — ingen. En nolla först skriver vi inte. Vi tar med 2:an i tiotalet — nu har vi 42.'],
      ['divq', 'Hur många 6:or ryms i 42?', 'Rätt — vi skriver 7 i tiotalet.'],
      ['divstrike', 'Hundratalet och tiotalet är klara — 42 är räknat. Tryck på dem, så stryker vi dem.', ''],
      ['divzero', 'Inget kvar att dela — vad skriver vi?', 'Rätt — 0 i entalet.'],
      ['divstrike', 'Entalet är klart — tryck på det, så stryker vi det.', ''],
    ]);
  });
  it('612 ÷ 6: fall B frågar "Hur mycket blir rest?" och placerar resten', () => {
    const q = planDivHelpQueue(buildDivPlan(612, 6, 4));
    expect(q.map(i => [i.kind, ord(divHelpAsk(i)), ord(divHelpAck(i))])).toEqual([
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
    // Genomspelet 23/9: "Precis 6." lästes om tre gånger — jämnt fall sägs som det är
    expect(tabellradHTML(6, 42, 1)).toContain('42 går jämnt ut. 48 är för mycket.');
    // okänd kolumn får aldrig bli "spalt NaN"
    expect(tabellradHTML(6, 1, undefined)).not.toMatch(/NaN|undefined/);
    expect(tabellradHTML(6, 7, 1)).not.toContain('6 · 0');
    expect(ord(tabellradHTML(6, 1, 1))).toBe('Ingen — 6 är större än 1. Vi skriver 0 i tiotalet, och hela 1:an blir rest.');
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
    // och minns fragan, sa ett andra tryck pa samma fraga ar gratis (genomspelet 23/9)
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

/* ── D40 (2026-10-21): nivå 4 blandat, den osynliga nollan, pekningen ── */
describe('D40: nivå 4 blandar fyra typer som det svårare övningsbladet', () => {
  const { genProblem, genL4, drawL4Type, L4_TYPES, singlePass } = MD._internals;
  const len = n => String(n).length;
  const carries = (a, m) => singlePass(a, m).cols.filter(c => !c.last && c.carryOut > 0).length;
  const typeOf = (a, b) => `${len(a)}x${len(b)}`;

  it('varje typ håller sina villkor (2000 lottningar per typ)', () => {
    const fel = [];
    for (const t of L4_TYPES) for (let i = 0; i < 2000; i++) {
      const { a, b, type } = genL4(t);
      if (type !== t || typeOf(a, b) !== t) fel.push(`${t}: ${a}·${b}`);
      if ((t === '3x1' || t === '4x1') && (b < 2 || b > 9 || carries(a, b) < 2)) fel.push(`${t} minne: ${a}·${b}`);
      if (t === '2x2' && (a % 10 === 0 || b % 10 === 0)) fel.push(`2x2 nolla: ${a}·${b}`);
      if (t === '3x2' && (b < 12 || b > 59 || b % 10 === 0 || a % 10 === 0)) fel.push(`3x2: ${a}·${b}`);
      if (String(a * b).length > 5) fel.push(`för brett: ${a}·${b}`);
    }
    expect(fel).toEqual([]);
  });

  it('genProblem(4): ungefär jämn fördelning, aldrig samma typ tre gånger i rad', () => {
    const seq = [];
    for (let i = 0; i < 4000; i++) { const { a, b } = genProblem(4); seq.push(typeOf(a, b)); }
    const n = Object.fromEntries(L4_TYPES.map(t => [t, seq.filter(x => x === t).length]));
    for (const t of L4_TYPES) expect(n[t]).toBeGreaterThanOrEqual(900);
    for (let i = 2; i < seq.length; i++) expect(seq[i] === seq[i - 1] && seq[i] === seq[i - 2]).toBe(false);
    expect(drawL4Type()).toMatch(/^(3x1|4x1|2x2|3x2)$/);
  });

  it('nivå 1–3 genererar samma typer som förut', () => {
    const fel = [];
    for (let i = 0; i < 3000; i++) {
      const p1 = genProblem(1), p2 = genProblem(2), p3 = genProblem(3);
      if (!(len(p1.a) === 2 && p1.b >= 2 && p1.b <= 4 && carries(p1.a, p1.b) === 0 && !singlePass(p1.a, p1.b).hasCarry)) fel.push(`1: ${p1.a}·${p1.b}`);
      if (!(len(p2.a) === 2 && p2.b >= 2 && p2.b <= 9 && singlePass(p2.a, p2.b).hasCarry)) fel.push(`2: ${p2.a}·${p2.b}`);
      if (!(len(p3.a) === 3 && p3.b >= 2 && p3.b <= 9 && p3.a * p3.b <= 9999 && singlePass(p3.a, p3.b).hasCarry)) fel.push(`3: ${p3.a}·${p3.b}`);
      for (const p of [p1, p2, p3]) if (p.type !== undefined) fel.push('typ på nivå 1–3');
      for (const [p, lv] of [[p1, 1], [p2, 2], [p3, 3]]) if (buildPlan(p.a, p.b, lv).kind !== 'simple') fel.push(`${lv}: inte simple`);
    }
    expect(fel).toEqual([]);
  });

  it('motorns facit för upp till fem kolumner: steg, hjälpkö och delprodukter, 3000 slumpade tal per typ', () => {
    const fel = [];
    const join = ds => ds.reduce((n, d, i) => n + (d || 0) * Math.pow(10, i), 0);
    let fem = 0;
    for (const t of L4_TYPES) for (let i = 0; i < 3000; i++) {
      const { a, b } = genL4(t), pl = buildPlan(a, b, 4);
      if (pl.answer !== a * b || pl.width !== len(a * b)) fel.push(`${a}·${b} plan`);
      if (pl.kind !== (b < 10 ? 'simple' : 'twostep')) fel.push(`${a}·${b} kind`);
      if (pl.width === 5) fem++;
      const rows = { ans: [], p1: [], p2: [] }, hrows = { ans: [], p1: [], p2: [] };
      for (const s of planMultSteps(pl)) {
        if (s.t === 'write_down' || s.t === 'move_down') rows[s.rowKey][s.g] = s.write;
        if (s.t === 'write_full') { rows[s.rowKey][s.g] = s.write; rows[s.rowKey][s.g + 1] = s.extra; }
        if ((s.g ?? 0) > 4) fel.push(`${a}·${b} kolumn ${s.g}`);
      }
      for (const it of planMultHelpQueue(pl)) {
        if (it.kind === 'memwrite' || it.kind === 'trivial') hrows[it.rowKey][it.g] = it.write;
        if (it.kind === 'flydown') { hrows[it.rowKey][it.g] = it.write; if (it.extra) hrows[it.rowKey][it.g + 1] = it.extra; }
      }
      for (const r of [rows, hrows]) {
        if (join(r.ans) !== a * b) fel.push(`${a}·${b} svar`);
        if (pl.kind === 'twostep' && (join(r.p1) !== pl.p1.value || join(r.p2) / 10 !== pl.p2.value)) fel.push(`${a}·${b} delprodukt`);
      }
      const nc = MD._internals.noCarryAnswer(pl);
      if (!Number.isFinite(nc)) fel.push(`${a}·${b} noCarry`);
    }
    expect(fel).toEqual([]);
    expect(fem).toBeGreaterThan(0);   // femsiffriga svar förekommer (4 · 1 och 3 · 2)
  });
});

describe('D40: den osynliga nollan och pekningen', () => {
  const strip = h => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const PV = ['entalet', 'tiotalet', 'hundratalet', 'tusentalet', 'tiotusentalet'];
  const src = readFileSync(new URL('../js/multdiv.js', import.meta.url), 'utf8');

  it('rad 2:s grå ruta finns bara i den tvåstegs-uppställningen (nivå 4 med tvåsiffrig faktor)', () => {
    // Rutan byggs bara i l4-grenen (twostep, inte fria läget) — nivå 1–3 är alltid 'simple'
    expect(src).toMatch(/const zeroCell = `<td><div class="md-ansc md-zero" id="md-p2-0"><\/div><\/td>`;/);
    expect(src).toMatch(/idx\.map\(i => i === 0 \? zeroCell : fillCell\('p2', i, i <= p2len\)\)/);
    expect(src).toMatch(/const l4 = plan\.kind === 'twostep' && !freeMode;/);
    for (let lv = 1; lv <= 3; lv++) for (let i = 0; i < 500; i++) {
      const { a, b } = MD._internals.genProblem(lv);
      expect(buildPlan(a, b, lv).kind).toBe('simple');
    }
    expect(buildPlan(67, 29, 4).kind).toBe('twostep');
    expect(buildPlan(483, 9, 4).kind).toBe('simple');
  });

  it('nollans steg: texten säger tiotal, vad siffran betyder och nollan i entalet', () => {
    const pl = buildPlan(67, 29, 4);
    const ph2 = planMultSteps(pl).find(s => s.t === 'phase' && s.which === 2);
    expect(strip(multStepText(ph2, pl))).toBe('Nu gångrar vi med ett tiotal (2 betyder 20). Därför fyller vi i en nolla här i entalet.');
    const ph3 = planMultSteps(pl).find(s => s.t === 'phase' && s.which === 3);
    expect(strip(multStepText(ph3, pl))).toContain('ental med ental, tiotal med tiotal');
  });

  it('pekningen: målrutan är kolumnen aCol + mCol (mult) eller kolumnen (add); högst faktorer + mål lyser', () => {
    const fel = [];
    for (const t of MD._internals.L4_TYPES) for (let i = 0; i < 800; i++) {
      const { a, b } = MD._internals.genL4(t), pl = buildPlan(a, b, 4);
      for (const s of planMultSteps(pl)) {
        if (s.t !== 'calc' && s.t !== 'move_down') continue;
        const lit = multLitCells(s, pl);
        if (s.phase === 'mult') {
          if (s.g !== s.aCol + s.mCol) fel.push(`${a}·${b} g`);
          if (lit.target[0] !== `md-${s.rowKey}-${s.g}`) fel.push(`${a}·${b} mål`);
          if (lit.src.length !== 2) fel.push(`${a}·${b} källor`);
          if (lit.target.length !== (s.last && s.extra !== null ? 2 : 1)) fel.push(`${a}·${b} sista`);
        } else {
          if (lit.target.join() !== `md-ans-${s.g}`) fel.push(`${a}·${b} summans ruta`);
          if (lit.src.length !== (s.memOnly ? 0 : s.single ? 1 : 2) && !(s.g === 0)) fel.push(`${a}·${b} add-källor`);   // memOnly: källan är minnessiffran
          if (s.g === 0 && !lit.src.includes('md-p2-0')) fel.push(`${a}·${b} nollan pekas inte ut`);
        }
        if (lit.src.length + lit.target.length > 4) fel.push(`${a}·${b} för många`);
      }
    }
    expect(fel).toEqual([]);
  });

  it('texterna pekar ut platsen: uträkning och skriv nämner målrutans platsord; rad 2 säger ett steg till vänster', () => {
    const fel = [];
    for (const t of MD._internals.L4_TYPES) for (let i = 0; i < 800; i++) {
      const { a, b } = MD._internals.genL4(t), pl = buildPlan(a, b, 4);
      for (const s of planMultSteps(pl)) {
        const txt = strip(multStepText(s, pl));
        if (s.t === 'calc' && s.phase === 'mult') {
          if (s.rowKey === 'p2' && s.g === 1) { if (!/Vi räknar tiotal, så svaret hamnar ett steg till vänster — i tiotalet\./.test(txt)) fel.push(`${a}·${b}: ${txt}`); }
          else if (!txt.endsWith(`Det hör till ${PV[s.g]}.`)) fel.push(`${a}·${b}: ${txt}`);
        }
        if (s.t === 'calc' && s.phase === 'add' && !txt.toLowerCase().startsWith(PV[s.g])) fel.push(`${a}·${b}: ${txt}`);
        if (s.t === 'write_down' && !txt.includes(`skrivs i ${PV[s.g]}`)) fel.push(`${a}·${b}: ${txt}`);
        if (s.t === 'carry_up' && !txt.includes('är minnessiffran')) fel.push(`${a}·${b}: ${txt}`);
        if (s.t === 'move_down' && s.g === 0 && pl.kind === 'twostep' && !txt.startsWith('Nollan lägger inte till något')) fel.push(`${a}·${b}: ${txt}`);
        if (/undefined|NaN|spalt/.test(txt)) fel.push(`${a}·${b}: ${txt}`);
      }
    }
    expect(fel).toEqual([]);
    const pl = buildPlan(67, 29, 4);
    const calc = planMultSteps(pl).filter(s => s.t === 'calc' && s.phase === 'mult').map(s => strip(multStepText(s, pl)));
    expect(calc[0]).toBe('7 · 9 är 63. Det hör till entalet.');
    expect(calc[2]).toBe('7 · 2 är 14. Vi räknar tiotal, så svaret hamnar ett steg till vänster — i tiotalet.');
  });

  it('nivå 1–3 behåller sina texter ordagrant', () => {
    const t = (a, b, lv) => planMultSteps(buildPlan(a, b, lv)).filter(s => s.t !== 'done').map(s => strip(multStepText(s, buildPlan(a, b, lv))));
    expect(t(28, 8, 2)).toEqual(['8 · 8 är 64', '6:an åker upp som minne. 👉', '4:an åker ner i svaret. ✅',
      '2 · 8 är 16', 'Minnessiffran 6 gör 16 till 22.', 'Sista kolumnen — hela 22 får plats! ✅']);
    expect(t(32, 3, 1)).toEqual(['2 · 3 är 6', '6:an åker ner i svaret. ✅', '3 · 3 är 9', '9:an åker ner i svaret. ✅']);
  });

  it('texterna säger aldrig samma tal i två roller och inga jämförelseord', () => {
    const JAMFORANDE = /\b(närmast|närmare|bäst|bättre|hellre|i stället för)\b/i;
    const fel = [];
    for (const t of MD._internals.L4_TYPES) for (let i = 0; i < 300; i++) {
      const { a, b } = MD._internals.genL4(t), pl = buildPlan(a, b, 4);
      for (const s of planMultSteps(pl)) { const x = strip(multStepText(s, pl)); if (JAMFORANDE.test(x)) fel.push(x); }
    }
    expect(fel).toEqual([]);
  });
});

/* ── D40 ✎ (2026-10-21): siffrorna i texten pekar på pappret ──────────
   Dennis: "kan du färgkoda dessa siffror så att man visuellt hänger med i
   vad man menar? [...] eller att de siffrorna [...] pulserar till". Varje
   färgad siffra i bubblan är en ref med en plats (data-ref); platsen ska
   bära just den siffran, färgen ska vara platsens, och det ska finnas
   något på pappret som kan pulsera. */
describe('D40 ✎: siffrorna i texten pekar på rätt cell', () => {
  const { genProblem } = MD._internals;
  const { multHelpText, askText, helpExprHTML } = MD.__test;
  const COLV = ['#22c55e', '#3b82f6', '#ef4444', '#a855f7', '#f59e0b'];
  const REF = /<strong class="md-ref" data-ref="([^"]+)" style="color:([^"]+)">(\d+)<\/strong>/g;
  const refsOf = h => [...h.matchAll(REF)].map(m => ({ where: m[1], color: m[2], val: +m[3] }));
  const dig = (n, i) => { const d = digitsOf(n); return i >= 0 && i < d.length ? d[i] : undefined; };
  /* Cellen finns i uppställningen och bär värdet: undefined = ingen sådan cell */
  function cellVal(id, pl) {
    const [, row, gs] = id.split('-'), g = +gs;
    if (row === 'a' || row === 'n') return dig(pl.a, g);
    if (row === 'b') return dig(pl.b, g);
    if (row === 'ans' || row === 'q') return g < pl.width ? dig(pl.answer, g) : undefined;
    if (pl.kind !== 'twostep') return undefined;
    if (row === 'p1') return dig(pl.p1.value, g);
    if (row === 'p2') return g === 0 ? 0 : dig(pl.p2.value, g - 1);
    return undefined;
  }
  /* Kontrollerar en text; mem = värdet på minnessiffran som används härnäst */
  function kolla(h, pl, ctx, fel, opt = {}) {
    const refs = refsOf(h);
    const fargade = (h.match(/style="color:/g) || []).length;
    if (fargade !== refs.length) fel.push(`${ctx}: färgad siffra utan plats: ${h}`);
    for (const r of refs) {
      if (r.where.startsWith('md-')) {
        const v = cellVal(r.where, pl);
        if (v !== r.val) fel.push(`${ctx}: ${r.where} bär ${v}, texten säger ${r.val}`);
        if (r.color !== COLV[+r.where.split('-').pop()]) fel.push(`${ctx}: ${r.where} fel färg`);
      } else {
        if (r.color !== '#dc2626') fel.push(`${ctx}: minnets färg`);
        if (r.where === 'mem:cur' && r.val !== opt.mem) fel.push(`${ctx}: mem:cur ${r.val} ≠ ${opt.mem}`);
        if (r.where === 'chip:0' && r.val !== opt.chip) fel.push(`${ctx}: chip:0 ${r.val} ≠ ${opt.chip}`);
        if (!['mem:cur', 'chip:0'].includes(r.where)) fel.push(`${ctx}: okänd plats ${r.where}`);
      }
    }
    return refs;
  }
  const uppgifter = () => {
    const ut = [];
    for (let lv = 1; lv <= 4; lv++) for (let i = 0; i < 400; i++) { const { a, b } = genProblem(lv); ut.push(buildPlan(a, b, lv)); }
    ut.push(buildPlan(98, 65, 4), buildPlan(67, 29, 4), buildPlan(91, 12, 4), buildPlan(987, 19, 4), buildPlan(8765, 9, 4));
    return ut;
  };

  it('Titta och lär: varje ref pekar på en cell som bär siffran, i cellens färg; minnet i minnets färg', () => {
    const fel = [];
    for (const pl of uppgifter()) {
      const mem = [];
      for (const s of planMultSteps(pl)) {
        if (s.t === 'done') continue;
        const cur = (mem.find(e => !e.used) || {}).val;
        kolla(multStepText(s, pl), pl, `${pl.a}·${pl.b} ${s.t}`, fel, { mem: cur, chip: s.carryOut });
        if (s.t === 'carry_up') mem.push({ val: s.carryOut, used: false });
        if (s.t === 'mem_strike') mem.find(e => !e.used).used = true;
      }
    }
    expect(fel).toEqual([]);
  });

  it('Räkna med hjälp: frågor, uttryck och kvittenser pekar rätt', () => {
    const fel = [];
    for (const pl of uppgifter()) {
      const mem = [];
      for (const it of planMultHelpQueue(pl)) {
        const ctx = `${pl.a}·${pl.b} ${it.kind}${it.step ? ':' + it.step : ''}`;
        const cur = (mem.find(e => !e.used) || {}).val;
        const o = { mem: cur, chip: it.val };
        if (['mult', 'add'].includes(it.kind)) {
          kolla(askText(it, pl), pl, ctx + ' fråga', fel, o);
          kolla(helpExprHTML(it, pl), pl, ctx + ' uttryck', fel, o);
          kolla(multHelpText(it.step === 'mem' ? 'mem' : 'table', it, pl, 99), pl, ctx + ' kvittens', fel, o);
        }
        if (it.kind === 'memwrite') { kolla(askText(it, pl), pl, ctx, fel, o); kolla(multHelpText('memwrite', it, pl), pl, ctx, fel, o); }
        if (it.kind === 'flydown') kolla(multHelpText('flydown', it, pl), pl, ctx, fel, o);
        if (it.kind === 'trivial') kolla(multHelpText('trivial', it, pl), pl, ctx, fel, o);
        if (it.kind === 'memstrike') kolla(multHelpText('strike', it, pl), pl, ctx, fel, o);
        if (it.kind === 'memplace') { kolla(multHelpText('pick', null, pl, it.val), pl, ctx, fel, { chip: it.val }); mem.push({ val: it.val, used: false }); }
        if (it.kind === 'memstrike') mem.find(e => !e.used).used = true;
      }
    }
    expect(fel).toEqual([]);
  });

  it('pekningen och texten har samma källa: uträkningens refs är exakt faktorcellerna/delsummecellerna', () => {
    const fel = [];
    for (const pl of uppgifter()) for (const s of planMultSteps(pl)) {
      if (s.t !== 'calc' || s.memOnly) continue;
      const refs = refsOf(multStepText(s, pl)).map(r => r.where);
      const lit = multLitCells(s, pl);
      const ok = s.single ? refs.length === 1 && lit.src.includes(refs[0])
                          : JSON.stringify(refs) === JSON.stringify(lit.src);
      if (!ok) fel.push(`${pl.a}·${pl.b} g${s.g}: ${refs} ≠ ${lit.src}`);
    }
    for (const pl of uppgifter()) for (const s of planMultSteps(pl)) {
      if (s.t !== 'write_down' && s.t !== 'write_full') continue;
      const refs = refsOf(multStepText(s, pl)).map(r => r.where).sort();
      if (JSON.stringify(refs) !== JSON.stringify(multLitCells(s, pl).target.slice().sort())) fel.push(`${pl.a}·${pl.b} ${s.t} g${s.g}`);
    }
    expect(fel).toEqual([]);
  });

  it('Dennis skärmbild, 98 · 65: 5:an är grön på båda ställena, 6:an står i textfärg', () => {
    const pl = buildPlan(98, 65, 4);
    const h = multStepText(planMultSteps(pl)[0], pl);
    expect(refsOf(h)).toEqual([
      { where: 'md-b-0', color: '#22c55e', val: 5 },
      { where: 'md-b-0', color: '#22c55e', val: 5 }]);
    expect(h.replace(/<[^>]+>/g, '')).toBe('Först räknar vi 98 · 5 — entalssiffran i 65! 👇');
    expect(h).toMatch(/i 6<strong class="md-ref" data-ref="md-b-0"/);
    // produkten är ingen cell och färgas inte
    const calc = planMultSteps(pl).find(s => s.t === 'calc');
    expect(multStepText(calc, pl)).toMatch(/är <strong>40<\/strong>\./);
  });

  it('kort division: täljarsiffran och kvotsiffran pekar rätt; rest-texterna är orörda', () => {
    const fel = [];
    for (let d = 2; d <= 9; d++) for (let q = Math.ceil(10 / d); q <= Math.floor(999 / d); q++) {
      const n = q * d, pl = buildDivPlan(n, d, 4), ctx = `${n}÷${d}`;
      for (const s of planDivSteps(pl)) if (s.t !== 'klart') {
        const refs = kolla(divStepText(s), pl, `${ctx} ${s.t}`, fel);
        if (['rest', 'flytta', 'fakta', 'stryk'].includes(s.t) && refs.length) fel.push(`${ctx} ${s.t} fick ref`);
      }
      for (const it of planDivHelpQueue(pl)) { kolla(divHelpAsk(it), pl, `${ctx} ${it.kind}`, fel); kolla(divHelpAck(it), pl, `${ctx} ${it.kind} ack`, fel); }
    }
    expect(fel).toEqual([]);
    const s612 = planDivSteps(buildDivPlan(612, 6, 4));
    expect(refsOf(divStepText(s612.find(s => s.t === 'skriv'))).map(r => r.where)).toEqual(['md-q-2']);
    expect(refsOf(divStepText(s612[0])).map(r => r.where)).toEqual(['md-n-2']);
  });

  it('pulsen: varje ref slås upp till en nod på pappret (källan i modulen)', () => {
    const src = readFileSync(new URL('../js/multdiv.js', import.meta.url), 'utf8');
    // refElement känner alla platstyper som texterna använder
    expect(src).toMatch(/if \(where === 'mem:cur'\) return currentMemNode\(\);/);
    expect(src).toMatch(/if \(where === 'chip:0'\)/);
    expect(src).toMatch(/return document\.getElementById\(where\);/);
    // båda bubblorna pulserar sina refs
    expect((src.match(/pulseRefs\(area\);/g) || []).length).toBe(2);
  });
});

/* ── D41: matteprovet lånar motorn (runTask) ── */
describe('D41: kroken runTask och dess utfall', () => {
  const { hostOutcome, hostBitHTML } = MD.__test;
  const log = o => Object.assign({ facts:[], minne:false, addition:false, lifeline:false, cls0:null }, o);
  it('Räkna med hjälp: helt rätt = direkt; fel svar eller livlina = med hjälp, med felklass och tabellfakta', () => {
    expect(hostOutcome({ mode:'help', log:log() }, true, true)).toEqual({ outcome:'direkt', cls:null, facts:[] });
    expect(hostOutcome({ mode:'help', log:log({ facts:[[2, 8]] }) }, false, true)).toEqual({ outcome:'hjalp', cls:null, facts:[[2, 8]] });
    expect(hostOutcome({ mode:'help', log:log({ minne:true }) }, false, true).cls).toBe('minne');
    expect(hostOutcome({ mode:'help', log:log({ addition:true }) }, false, true).cls).toBe('addition');
    expect(hostOutcome({ mode:'help', log:log({ lifeline:true }) }, true, true).outcome).toBe('hjalp');
  });
  it('Räkna själv: första Klar rätt = direkt, senare = med hjälp, visat svar = fick svaret', () => {
    expect(hostOutcome({ mode:'free', log:log(), revealed:false }, true, true).outcome).toBe('direkt');
    expect(hostOutcome({ mode:'free', log:log({ cls0:'minne' }), revealed:false }, true, false)).toEqual({ outcome:'hjalp', cls:'minne', facts:[] });
    expect(hostOutcome({ mode:'free', log:log({ cls0:'fel' }), revealed:true }, true, false).outcome).toBe('svar');
  });
  it('hjälpbiten: två rader vid tvåsiffrig faktor, minnessiffrorna vid ensiffrig', () => {
    const strip = h => h.replace(/<[^>]+>/g, '');
    expect(strip(hostBitHTML(buildPlan(82, 68, 4)))).toBe('Rad 1 är 82 · 8 = 656. Rad 2 är 82 · 60 = 4920. Lägg ihop dem.');
    expect(strip(hostBitHTML(buildPlan(687, 8, 4)))).toBe('Minnessiffrorna blir 5 och 6, från entalet och vänsterut.');
    expect(strip(hostBitHTML(buildPlan(4321, 2, 4)))).toBe('1 · 2 = 2, 2 · 2 = 4, 3 · 2 = 6, 4 · 2 = 8.');
  });
  it('kroken är isolerad: multdivs egna lägen går som förut när ingen uppgift är lånad', () => {
    const src = readFileSync(new URL('../js/multdiv.js', import.meta.url), 'utf8');
    expect(src).toMatch(/let host = null;/);
    expect(src).toMatch(/function finishTask\(correct\) \{\n\s+if \(host\) \{ hostFinish\(\); return; \}/);
    expect(src).toMatch(/\$\{host \? '' : freeLifelineBtnHTML\(\)\}/);
    expect(src).toMatch(/\} else if \(host\) \{\n\s+hostFreeWrong\(val\);\n\s+\} else \{/);
    // multdivs val (nivå, räknesätt, läge) återställs efter varje lånad uppgift
    expect(src).toMatch(/saved: \{ difficulty, gameKind, helpMode \}/);
    expect(src).toMatch(/\(\{ difficulty, gameKind, helpMode \} = h\.saved\);/);
    expect(typeof MD.runTask).toBe('function');
  });
});
