/* tests/multiplication.test.mjs — Gångertabellen (js/multiplication.js)
   Svarsalternativ, omvända frågor, lådorna (påfyllning över tid), migreringen
   ur statistiken, passbygget och ett textsvep över strategitexterna. */
import { describe, it, expect, afterEach } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const MG = require('../js/multiplication.js');
const T = MG._test;
const { KEY, PAIRS, distractors, options, reverseOptions, applyAnswer, freshPair, vis, visMap, counts,
        leftToLearn, pairsFromStats, addDays, buildPass, schedulePass, strategyTexts, waysFor, orient } = T;

const ALL = []; for (let a = 1; a <= 12; a++) for (let b = 1; b <= 12; b++) ALL.push([a, b]);
function seeded(seed) { return () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }; }

afterEach(() => T.setToday(null));

/* ── Distraktorer ─────────────────────────────────────────── */
describe('distractors – alla 144 tal', () => {
  it('tre olika alternativ, aldrig rätt svar, alla positiva', () => {
    for (const [a, b] of ALL) {
      const d = distractors(a, b);
      expect(d, `${a}×${b}`).toHaveLength(3);
      expect(new Set(d).size, `${a}×${b}`).toBe(3);
      expect(d.includes(a * b), `${a}×${b}`).toBe(false);
      expect(d.every(v => Number.isInteger(v) && v >= 1), `${a}×${b}`).toBe(true);
    }
  });

  it('alternativ på båda sidor om svaret (utom 1 × 1: inget positivt tal ligger under 1)', () => {
    for (const [a, b] of ALL) {
      const c = a * b, d = distractors(a, b);
      if (c === 1) { expect(d.every(v => v > 1)).toBe(true); continue; }
      expect(d.some(v => v < c), `${a}×${b} under`).toBe(true);
      expect(d.some(v => v > c), `${a}×${b} över`).toBe(true);
    }
  });

  it('udda svar har alltid minst ett udda alternativ', () => {
    for (const [a, b] of ALL) {
      const c = a * b;
      if (c % 2) expect(distractors(a, b).some(v => v % 2), `${a}×${b}`).toBe(true);
    }
  });

  it('raka grannar går först: 4 × 6 får 20, 28 och 18', () => {
    expect(distractors(4, 6).sort((x, y) => x - y)).toEqual([18, 20, 28]);
    expect(options(4, 6)).toEqual([18, 20, 24, 28]);
  });
});

/* ── Omvända frågor ───────────────────────────────────────── */
describe('reverseOptions – alla 144 tal', () => {
  it('fyra alternativ med exakt ett rätt, oavsett slump', () => {
    for (const [a, b] of ALL) for (let s = 1; s <= 6; s++) {
      const o = reverseOptions(a, b, seeded(a * 97 + b * 13 + s));
      expect(o, `${a}×${b}`).toHaveLength(4);
      expect(o.filter(x => x.ok), `${a}×${b} ok`).toHaveLength(1);
      expect(o.filter(x => x.v === a * b), `${a}×${b} värde`).toHaveLength(1);
      expect(o.find(x => x.ok).v).toBe(a * b);
      expect(new Set(o.map(x => x.label)).size).toBe(4);
      o.forEach(x => expect(x.a * x.b).toBe(x.v));
    }
  });
});

/* ── Lådorna: påfyllning över tid ─────────────────────────── */
describe('lådorna – reglerna vid varje svar', () => {
  const D1 = '2026-09-01';
  const day = n => addDays(D1, n);

  it('tre olika dagar krävs för kan; samma dag räknas en gång', () => {
    const st = freshPair();
    applyAnswer(st, true, day(0));
    expect(st.box).toBe('ovar'); expect(st.okDays).toBe(1);
    applyAnswer(st, true, day(0)); applyAnswer(st, true, day(0));
    expect(st.okDays).toBe(1); expect(st.box).toBe('ovar');
    applyAnswer(st, true, day(1));
    expect(st.okDays).toBe(2); expect(st.box).toBe('ovar');
    applyAnswer(st, true, day(3));
    expect(st.box).toBe('kan'); expect(st.level).toBe(1); expect(st.due).toBe(day(4));
  });

  it('intervallen växer 1, 3, 7, 14, 30 och sedan 30; rätt före due ändrar ingenting', () => {
    const st = { ...freshPair(), box:'kan', level:1, due:day(1) };
    applyAnswer(st, true, day(0));                          // före due
    expect(st).toMatchObject({ box:'kan', level:1, due:day(1) });
    let d = 1;
    const gaps = [];
    for (let i = 0; i < 6; i++) {
      applyAnswer(st, true, day(d));
      const next = st.due;
      gaps.push(Math.round((new Date(next) - new Date(day(d))) / 86400000));
      d = Math.round((new Date(next) - new Date(D1)) / 86400000);
    }
    expect(gaps).toEqual([3, 7, 14, 30, 30, 30]);
    expect(st.level).toBe(7);
  });

  it('kan + fel ger övar och okDays 0; sedan räcker 2 dagar, med level 1', () => {
    const st = { ...freshPair(), box:'kan', level:3, due:day(5), okDays:3, lastOk:day(0) };
    applyAnswer(st, false, day(2));
    expect(st.box).toBe('ovar'); expect(st.okDays).toBe(0);
    applyAnswer(st, true, day(2));                          // samma dag som felet räknas (rätt efter felet)
    expect(st.box).toBe('ovar'); expect(st.okDays).toBe(1);
    applyAnswer(st, true, day(4));
    expect(st.box).toBe('kan'); expect(st.level).toBe(1); expect(st.due).toBe(day(5));
    // faller det igen räcker åter två dagar
    applyAnswer(st, false, day(6));
    applyAnswer(st, true, day(7)); applyAnswer(st, true, day(8));
    expect(st.box).toBe('kan');
  });

  it('övar + fel stannar övar med okDays 0; ny + fel stannar ny', () => {
    const o = { ...freshPair(), box:'ovar', okDays:2, lastOk:day(1) };
    applyAnswer(o, false, day(2));
    expect(o).toMatchObject({ box:'ovar', okDays:0 });
    const n = freshPair();
    applyAnswer(n, false, day(0));
    expect(n.box).toBe('ny');
  });

  it('kan visas bleknat ("Dags igen") när due passerats, inte före', () => {
    const st = { ...freshPair(), box:'kan', level:2, due:day(3) };
    expect(vis(st, day(2))).toBe('kan');
    expect(vis(st, day(3))).toBe('due');
    expect(vis(st, day(9))).toBe('due');
    applyAnswer(st, true, day(9));                          // påfyllning: grönt igen
    expect(vis(st, day(9))).toBe('kan');
  });

  it('räknaren "tal kvar att lära" räknar ny + övar; bleknade kan räknas inte dit', () => {
    const P = pairsFromStats({}, D1);
    P['2x3'] = { ...freshPair(), box:'kan', level:1, due:day(0) };
    P['2x4'] = { ...freshPair(), box:'kan', level:1, due:day(5) };
    P['2x5'] = { ...freshPair(), box:'ovar', okDays:1 };
    const V = visMap(P, day(1));
    expect(counts(V)).toEqual({ kan:1, due:1, ovar:1, ny:75 });
    expect(leftToLearn(V)).toBe(76);
  });

  it('testkroken för idag', () => {
    T.setToday('2026-09-23');
    expect(T.today()).toBe('2026-09-23');
    T.setToday(null);
    expect(T.today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

/* ── Migreringen ur statistiken ──────────────────────────── */
describe('migreringen: statistik → lådor', () => {
  const D = '2026-09-23';
  it('a×b och b×a slås ihop; ≥3 försök och ≥90 % → kan, ≥1 försök → övar, annars ny', () => {
    const P = pairsFromStats({
      '3x7': { correct:2, total:2 }, '7x3': { correct:1, total:1 },   // 3/3 → kan
      '4x6': { correct:1, total:2 }, '6x4': { correct:2, total:2 },   // 3/4 = 75 % → övar
      '2x2': { correct:9, total:10 },                                  // 90 % → kan
      '8x9': { correct:1, total:1 },                                   // 1 försök → övar
      '5x5': { correct:0, total:0 },                                   // inga försök → ny
    }, D);
    expect(P['3x7'].box).toBe('kan'); expect(P['3x7'].level).toBe(1);
    expect(P['4x6']).toMatchObject({ box:'ovar', okDays:1 });
    expect(P['2x2'].box).toBe('kan');
    expect(P['8x9']).toMatchObject({ box:'ovar', okDays:1 });
    expect(P['5x5'].box).toBe('ny');
    expect(P['7x7'].box).toBe('ny');
    expect(Object.keys(P)).toHaveLength(78);
  });

  it('tom statistik ger 78 nya tal – ingen kunskap hittas på', () => {
    const P = pairsFromStats({}, D);
    expect(counts(visMap(P, D))).toEqual({ kan:0, due:0, ovar:0, ny:78 });
  });

  it('kan får due utspritt 1–7 dagar fram, fast per par', () => {
    const stats = {};
    for (const [a, b] of PAIRS) stats[`${a}x${b}`] = { correct:5, total:5 };
    const P = pairsFromStats(stats, D), P2 = pairsFromStats(stats, D);
    const offs = PAIRS.map(([a, b]) => Math.round((new Date(P[KEY(a, b)].due) - new Date(D)) / 86400000));
    expect(Math.min(...offs)).toBe(1); expect(Math.max(...offs)).toBe(7);
    expect(new Set(offs).size).toBe(7);
    expect(PAIRS.every(([a, b]) => P[KEY(a, b)].due === P2[KEY(a, b)].due)).toBe(true);
    expect(counts(visMap(P, D)).due).toBe(0);                // inget har bleknat första dagen
  });
});

/* ── Passbygget ──────────────────────────────────────────── */
const kk = it => KEY(it.a, it.b);
function checkPass(items, label) {
  expect(items.length, label).toBeGreaterThan(0);
  items.forEach((it, i) => {
    if (i > 0) expect(kk(it) === kk(items[i - 1]), `${label}: samma tal två gånger i rad vid ${i}`).toBe(false);
    if (it.kind === 'intro') {
      const later = items.slice(i + 1).filter(x => x.kind === 'q' && kk(x) === kk(it));
      expect(later.length, `${label}: nytt tal ${kk(it)} frågas`).toBeGreaterThan(0);
      expect(items[i + 1] && kk(items[i + 1]) === kk(it), `${label}: frågas direkt efter introduktionen`).toBe(false);
      expect(items.slice(0, i).some(x => kk(x) === kk(it)), `${label}: frågas före introduktionen`).toBe(false);
    }
  });
  const known = items.filter(it => it.kind === 'q' && !it.isNew);
  expect(known.length, label).toBeLessThanOrEqual(9);
}

describe('passbygget', () => {
  const D = '2026-09-23';

  it('tom statistik: ett vettigt pass, nya tal lätt-först, aldrig direkt efter introduktionen', () => {
    const items = buildPass(pairsFromStats({}, D), 1000, D);
    checkPass(items, 'tomt');
    const intros = items.filter(it => it.kind === 'intro');
    expect(intros.length).toBeGreaterThanOrEqual(2);
    expect(intros.map(kk)).toEqual(['1x1', '1x10', '1x2'].slice(0, intros.length));
    expect(items.filter(it => it.kind === 'q').length).toBeGreaterThanOrEqual(4);
    expect(items[0].kind).toBe('intro');
  });

  it('mockupens form när det finns nio kända: K, nytt, K, K, K, fråga, K, K, K, fråga, K, K', () => {
    const P = pairsFromStats({}, D);
    for (const [a, b] of PAIRS) if (a <= 3 || b === 10 || a === 10) P[KEY(a, b)] = { ...freshPair(), box:'kan', level:1, due:addDays(D, 3) };
    const items = buildPass(P, 1234, D);
    expect(items.map(it => it.kind === 'intro' ? 'N' : it.isNew ? 'q' : 'K').join('')).toBe('KNKKKqKKKqKK');
    checkPass(items, 'mockupform');
  });

  it('nästan tomt läge (ett, två, tre kända) håller isär introduktion och fråga', () => {
    for (let n = 1; n <= 6; n++) {
      const P = pairsFromStats({}, D);
      PAIRS.slice(0, n).forEach(([a, b]) => { P[KEY(a, b)] = { ...freshPair(), box:'ovar', okDays:1 }; });
      for (let s = 0; s < 20; s++) checkPass(buildPass(P, 1000 + s * 7, D), `${n} kända, seed ${s}`);
    }
  });

  it('slumpade lägen: reglerna håller alltid', () => {
    const r = seeded(42);
    for (let t = 0; t < 300; t++) {
      const P = {};
      const pNy = r(), pOv = r();
      for (const [a, b] of PAIRS) {
        const x = r();
        P[KEY(a, b)] = x < pNy ? freshPair()
          : x < pNy + (1 - pNy) * pOv ? { ...freshPair(), box:'ovar', okDays:1 }
          : { ...freshPair(), box:'kan', level:1, due:addDays(D, Math.floor(r() * 9) - 4) };
      }
      checkPass(buildPass(P, 1000 + t, D), `läge ${t}`);
    }
  });

  it('Öva prioriterar bleknade kan-tal, äldst due först, sedan övar', () => {
    const P = pairsFromStats({}, D);
    const dueKeys = ['6x7', '7x8', '4x9'];
    for (const [a, b] of PAIRS) P[KEY(a, b)] = { ...freshPair(), box:'kan', level:2, due:addDays(D, 5) };
    dueKeys.forEach((k, i) => { P[k] = { ...freshPair(), box:'kan', level:2, due:addDays(D, -1 - i) }; });
    ['3x3', '5x7'].forEach(k => { P[k] = { ...freshPair(), box:'ovar', okDays:1 }; });
    const known = buildPass(P, 77, D).filter(it => it.kind === 'q').map(kk);
    dueKeys.forEach(k => expect(known).toContain(k));
    ['3x3', '5x7'].forEach(k => expect(known).toContain(k));

    // Fler bleknade än platser: de nio med äldst due tas
    const Q = pairsFromStats({}, D);
    PAIRS.forEach(([a, b], i) => { Q[KEY(a, b)] = { ...freshPair(), box:'kan', level:2, due:addDays(D, -1 - (i % 20)) }; });
    const oldest = PAIRS.map(([a, b]) => ({ k:KEY(a, b), due:Q[KEY(a, b)].due })).sort((x, y) => x.due < y.due ? -1 : x.due > y.due ? 1 : 0);
    const picked = buildPass(Q, 5, D).filter(it => it.kind === 'q').map(kk);
    expect(picked).toHaveLength(9);
    const cutoff = oldest[8].due;
    picked.forEach(k => expect(Q[k].due <= cutoff).toBe(true));
  });

  it('samma läge och frö ger samma pass (hubbens rad och passet stämmer överens)', () => {
    const P = pairsFromStats({ '3x7': { correct:1, total:1 } }, D);
    expect(buildPass(P, 99, D)).toEqual(buildPass(P, 99, D));
  });

  it('det nya talet ritas med den lättare faktorn som rader', () => {
    expect(orient([7, 10])).toEqual({ a:10, b:7 });
    expect(orient([2, 8])).toEqual({ a:2, b:8 });
    expect(orient([1, 12])).toEqual({ a:1, b:12 });
  });

  it('schemaläggaren stryker hellre än ställer ett tal direkt efter sig själv', () => {
    const r = schedulePass([], [{ a:3, b:4 }]);
    expect(r.items.map(it => it.kind)).toEqual(['intro']);
    expect(r.dropped).toBe(2);
  });
});

/* ── Slutbildens sammanfattning ──────────────────────────── */
describe('slutbilden', () => {
  it('ett påfyllt tal sägs som "fylldes på"', () => {
    const after = pairsFromStats({}, '2026-09-23');
    const V = visMap(after, '2026-09-23');
    expect(T.endSummaryFor([{ k:'3x7', from:'due', to:'kan' }], V)).toBe('Ett tal fylldes på. Nu är det 78 tal kvar att lära.');
    expect(T.endSummaryFor([{ k:'3x7', from:'ny', to:'ovar' }, { k:'4x7', from:'ny', to:'ovar' }, { k:'6x7', from:'kan', to:'ovar' }], V))
      .toBe('Två tal blev gula och ett gick tillbaka till gult. Nu är det 78 tal kvar att lära.');
  });
});

/* ── Textsvepet: alla strategitexter ─────────────────────── */
/* Språkreglerna från mockupen:
   1. Samma tal får aldrig ha två roller i en mening (t.ex. både antal rader och antal prickar).
      Likheter (7 × 3 = 21) bär inga roller; de stryks före kontrollen. Identiteter som är
      själva poängen – "7 prickar är 7", "7 i varje är 7 tior" – är en roll: mängden.
   2. Inga jämförelseord som förutsätter ett val (enklare, lättare, bättre ...).
   3. Inga frågor med två rimliga svar: den enda frågan är vägvalet. */
const COMPARE = /\b(enklare|lättare|svårare|bättre|sämre|snabbare|smartare|enklast|lättast|bäst|snabbast)\b/i;
const QUESTIONS_OK = new Set(['Vilken vill du ta?']);
function sentences(text) { return text.split(/(?<=[.!?])\s+/).filter(Boolean); }
function roleOf(rest) {
  if (/^\s*(rad|rader|raderna)\b/.test(rest)) return 'rader';
  if (/^\s*(prick|prickar)\b/.test(rest)) return 'mängd';
  if (/^\s*i varje\b/.test(rest)) return 'mängd';
  if (/^\s*(tior|tia)\b/.test(rest)) return 'mängd';
  if (/^:(a|an|or)\b/.test(rest)) return 'siffra';
  return 'mängd';
}
function problems(text) {
  const out = [];
  for (const s of sentences(text)) {
    const prose = s.replace(/\d+(\s*[×+−-]\s*\d+)+(\s*=\s*\d+)?/g, ' EQ ');
    const roles = new Map();
    for (const m of prose.matchAll(/\d+/g)) {
      const n = m[0], r = roleOf(prose.slice(m.index + n.length));
      if (!roles.has(n)) roles.set(n, new Set());
      roles.get(n).add(r);
    }
    for (const [n, r] of roles) if (r.size > 1) out.push(`${n} har två roller (${[...r].join(', ')}): ${s}`);
    if (COMPARE.test(s)) out.push(`jämförelseord: ${s}`);
    if (s.endsWith('?') && !QUESTIONS_OK.has(s)) out.push(`fråga: ${s}`);
    if (/\p{Extended_Pictographic}/u.test(s)) out.push(`emoji: ${s}`);
  }
  return out;
}
function sweep() {
  const texts = [];
  for (const [a, b] of ALL) texts.push(...strategyTexts(a, b));
  return texts;
}
const form = t => t.replace(/\d+/g, '#');

describe('textsvepet – strategitexterna', () => {
  it('meta: kontrollen fäller kända fel och släpper igenom rätt', () => {
    expect(problems('3 × 3 är 3 rader med 3 prickar i varje.')).toHaveLength(1);
    expect(problems('6 för mycket — vi tar bort en 6:a.')).toHaveLength(1);
    expect(problems('Vilken väg är enklare?').length).toBeGreaterThanOrEqual(1);
    expect(problems('Hur mycket?')).toHaveLength(1);
    expect(problems('7 × 8 är 7 rader med 8 prickar i varje.')).toEqual([]);
    expect(problems('Ta bort de 3 raderna igen. De har 3 × 8 = 24 prickar.')).toEqual([]);
    expect(problems('Det finns två vägar. Vilken vill du ta?')).toEqual([]);
  });

  it('meta: svepet täcker varje väg för alla 144 tal', () => {
    const walks = ALL.reduce((s, [a]) => s + waysFor(a).length, 0);
    expect(walks).toBe(17 * 12);
    const texts = sweep();
    for (const [a, b] of ALL) waysFor(a).forEach((w, k) =>
      T.strategySteps(a, b, k).forEach(st => expect(texts).toContain(st.text)));
  });

  it('ingen text bryter mot språkreglerna', () => {
    const bad = [...new Set(sweep().flatMap(problems))];
    expect(bad).toEqual([]);
  });

  it('antalet textformer är genomläst: 45 (växer det, läs de nya formerna och höj talet)', () => {
    const forms = new Set(sweep().map(form));
    expect(forms.size).toBe(45);
  });

  it('vändsteget: förklaringen efter vändningen står i samma ordning som texten', () => {
    // "8 × 3 är lika mycket som 3 × 8" följs av 3 × 8 i rubrik, rektangel och text
    expect(T.TXT.wrongSwap(8, 3)).toBe('Inte riktigt. 8 × 3 är lika mycket som 3 × 8.');
    expect(T.introText(3, 8)).toBe('3 × 8 är 3 rader med 8 prickar i varje.');
  });
});

/* ═══════════════════════════════════════════════════════════
   v58: Gånger 1–10/11/12, övningspasset (nötloopen, varven, kvittot)
   och Capybara-regeln för övningspasset
═══════════════════════════════════════════════════════════ */
const { pairsUpTo, shrinkSteps, normCounts, roundTypes, presetFor, PRESETS, cleanTables, buildRounds,
        passPlan, planSummary, createDrill, receiptFor, praiseFor, durTxt } = T;

describe('Gånger: 1–10 döljer 11:an och 12:an', () => {
  const D = '2026-09-23';
  it('räknarna räknar bara talen upp till 10 (55 par), lådorna för 11 och 12 rörs inte', () => {
    const P = pairsFromStats({}, D);
    P['7x11'] = { ...freshPair(), box:'ovar', okDays:1 };
    P['12x12'] = { ...freshPair(), box:'kan', level:1, due:addDays(D, -2) };
    P['3x4'] = { ...freshPair(), box:'kan', level:1, due:addDays(D, 3) };
    const V10 = visMap(P, D, 10);
    expect(Object.keys(V10)).toHaveLength(55);
    expect(Object.keys(V10).some(k => k.split('x').some(n => +n > 10))).toBe(false);
    expect(counts(V10)).toEqual({ kan:1, due:0, ovar:0, ny:54 });
    expect(leftToLearn(V10)).toBe(54);
    const V11 = visMap(P, D, 11);
    expect(Object.keys(V11)).toHaveLength(66);
    expect(counts(V11)).toEqual({ kan:1, due:0, ovar:1, ny:64 });
    const V12 = visMap(P, D, 12);
    expect(counts(V12)).toEqual({ kan:1, due:1, ovar:1, ny:75 });
    expect(P['7x11'].box).toBe('ovar');                      // dolda lådor ligger kvar
    expect(pairsUpTo(10)).toHaveLength(55);
  });

  it('Öva blandat med 1–10 tar aldrig med 11:an eller 12:an', () => {
    const r = seeded(7);
    for (let t = 0; t < 120; t++) {
      const P = {};
      for (const [a, b] of PAIRS) {
        const x = r();
        P[KEY(a, b)] = x < .4 ? freshPair() : x < .7 ? { ...freshPair(), box:'ovar', okDays:1 } : { ...freshPair(), box:'kan', level:1, due:addDays(D, Math.floor(r() * 9) - 4) };
      }
      const items = buildPass(P, 1000 + t, D, 10);
      checkPass(items, `läge ${t}`);
      expect(items.every(it => it.a <= 10 && it.b <= 10), `läge ${t}`).toBe(true);
    }
  });

  it('standard är upp till 10; ett sparat värde gäller före standard', () => {
    expect(T.UPTO_DEFAULT).toBe('10');
    expect(T.settingsFrom(null).upto).toBe('10');
    expect(T.settingsFrom({}).upto).toBe('10');
    expect(T.settingsFrom({ strat:'valj', tempo:'klocka', rev:'av', answer:'free' }))       // profil från v57: inget upto sparat
      .toEqual({ strat:'valj', tempo:'klocka', rev:'av', answer:'free', upto:'10' });
    expect(T.settingsFrom({ upto:'12' }).upto).toBe('12');
    expect(T.settingsFrom({ upto:'11' }).upto).toBe('11');
    expect(T.settingsFrom({ upto:12 }).upto).toBe('12');
    expect(T.settingsFrom({ upto:'9' }).upto).toBe('10');                                  // ogiltigt → standard
  });

  it('Så krymper tabellen räknar rätt i 10×10, 11×11 och 12×12', () => {
    expect(T.shrinkRemain(10)).toEqual([100, 81, 64, 49, 36, 21, 21]);
    expect(T.shrinkRemain(11)).toEqual([121, 100, 81, 64, 49, 36, 21, 21]);
    expect(T.shrinkRemain(12)).toEqual([144, 121, 100, 81, 64, 36, 21, 21]);
    expect(shrinkSteps(10).map(s => s.text(21)).join(' ')).not.toMatch(/11|12/);
    // v60: "rutor", inte "tal" – får inte förväxlas med hemvyns "N tal kvar att lära"
    expect(shrinkSteps(10)[6].text(21)).toBe('Kvar blir 21 svåra rutor. Dem övar vi på.');
    for (const n of [10, 11, 12]) expect(shrinkSteps(n).slice(-1)[0].text(21)).not.toMatch(/\btal\b|kvar att lära/);
  });

  it('Så krymper tabellen följer Gånger', () => {
    expect(shrinkSteps(12)).toHaveLength(8);
    expect(shrinkSteps(11)).toHaveLength(8);
    expect(shrinkSteps(10)).toHaveLength(7);
    expect(shrinkSteps(10)[0].text()).toBe('Hela tabellen har 100 rutor. Nu stryker vi en del i taget.');
    expect(shrinkSteps(10).some(s => s.rm && s.rm.some(n => n > 10))).toBe(false);
    expect(shrinkSteps(11).find(s => s.rm && s.rm.includes(11)).rm).toEqual([11]);
    for (const n of [10, 11, 12]) shrinkSteps(n).forEach(s => expect(problems(s.text(40))).toEqual([]));
  });
});

describe('övningspasset – varvbygget', () => {
  it('stegarna ger varven i ordningen lätt till svårt, 0–4 per stegare', () => {
    expect(roundTypes({ free:1, choice:2, show:1 })).toEqual(['show', 'choice', 'choice', 'free']);
    expect(roundTypes({ show:0, choice:0, free:0 })).toEqual([]);
    expect(normCounts({ show:9, choice:-2, free:'2' })).toEqual({ show:4, choice:0, free:2 });
    expect(roundTypes({ show:4, choice:4, free:4 })).toHaveLength(12);
  });

  it('snabbvalen sätter bara stegarna', () => {
    const by = k => PRESETS.find(p => p.k === k).c;
    expect(roundTypes(by('kort'))).toEqual(['choice', 'free']);
    expect(roundTypes(by('vanligt'))).toEqual(['show', 'choice', 'choice', 'free']);
    expect(roundTypes(by('langt'))).toEqual(['show', 'choice', 'choice', 'choice', 'free', 'free']);
    expect(presetFor({ show:1, choice:2, free:1 })).toBe('vanligt');
    expect(presetFor({ show:2, choice:2, free:1 })).toBe(null);
    PRESETS.forEach(p => expect(Object.keys(p.c).sort()).toEqual(['choice', 'free', 'show']));
  });

  it('Se svaret först går i ordning 1, 2, 3 …, tabell för tabell; övriga varv har samma frågor blandat', () => {
    const rounds = buildRounds({ tables:[8, 7], counts:{ show:1, choice:1, free:1 } }, 10, seeded(3));
    expect(rounds.map(r => r.type)).toEqual(['show', 'choice', 'free']);
    expect(rounds[0].items.map(it => `${it.a}x${it.b}`)).toEqual([
      ...[1,2,3,4,5,6,7,8,9,10].map(m => `7x${m}`), ...[1,2,3,4,5,6,7,8,9,10].map(m => `8x${m}`)]);
    const key = it => `${it.a}x${it.b}`;
    for (const r of rounds.slice(1)) {
      expect(r.items).toHaveLength(20);
      expect(r.items.map(key).sort()).toEqual(rounds[0].items.map(key).sort());
      expect(r.items.map(key)).not.toEqual(rounds[0].items.map(key));
    }
  });

  it('11:an och 12:an är extraval: de kan väljas även med Gånger upp till 10; plan och summering', () => {
    expect(cleanTables([12, 7, 7, 11, 3, 13, 0])).toEqual([3, 7, 11, 12]);
    const x = buildRounds({ tables:[11], counts:{ show:1 } }, 10);
    expect(x[0].items.map(it => `${it.a}x${it.b}`)).toEqual([1,2,3,4,5,6,7,8,9,10].map(m => `11x${m}`));
    expect(passPlan({ tables:[11, 12], counts:{ choice:1 } }, 10)).toMatchObject({ tables:[11, 12], questions:20 });
    const pl = passPlan({ tables:[7], counts:{ show:1, choice:2, free:1 } }, 10);
    expect(pl).toMatchObject({ tables:[7], rounds:4, questions:40 });
    expect(pl.minutes).toBe(8);                                  // 10·14 + 20·10 + 10·12 s ≈ 8 min
    expect(planSummary(pl)).toBe('Fyra varv · 40 frågor · ungefär 8 minuter');
    expect(planSummary(passPlan({ tables:[], counts:{ choice:1 } }, 12))).toBe('Välj minst en tabell.');
    expect(planSummary(passPlan({ tables:[3], counts:{} }, 12))).toBe('Välj minst ett varv.');
  });

  it('summeringen: inget tal har två roller i samma rad', () => {
    for (let n = 1; n <= 12; n++) for (const c of [{ show:1 }, { choice:4 }, { show:4, choice:4, free:4 }, { free:2 }]) {
      const s = planSummary(passPlan({ tables:[1,2,3,4,5,6,7,8,9,10,11,12].slice(0, n), counts:c }, 12));
      const nums = s.match(/\d+/g) || [];
      expect(new Set(nums).size, s).toBe(nums.length);
      expect(problems(s), s).toEqual([]);
    }
  });
});

/* Kör ett varv med givna fel. wrongs(slot, försök) → true om svaret ska vara fel. */
function runDrill(items, wrongs, seed = 1) {
  const d = createDrill(items, seeded(seed));
  const log = [], recorded = [];
  for (let guard = 0; !d.isDone() && guard < 10000; guard++) {
    const cur = d.current();
    const tries = log.filter(x => x.pos === d.progress().done).length;
    const ok = !wrongs(cur, tries);
    const res = d.answer(ok);
    log.push({ pos:d.progress().done - (ok ? 1 : 0), a:cur.a, b:cur.b, extra:cur.extra, retry:cur.retry, ok, ...res });
    if (res.record) recorded.push({ a:cur.a, b:cur.b, ok });      // appens recordAnswer körs bara här
  }
  return { d, log, recorded };
}
const ten = [1,2,3,4,5,6,7,8,9,10].map(m => ({ a:7, b:m }));

describe('nötloopen (createDrill)', () => {
  it('allt rätt: varje fråga ställs en gång, varvet tar slut', () => {
    const { d, log, recorded } = runDrill(ten, () => false);
    expect(d.isDone()).toBe(true);
    expect(log).toHaveLength(10);
    expect(recorded).toHaveLength(10);
    expect(d.queue()).toHaveLength(10);
    expect(d.current()).toBe(null);
    expect(d.answer(true)).toBe(null);
  });

  it('fel ger samma fråga direkt igen tills den blir rätt', () => {
    const d = createDrill(ten, seeded(5));
    d.answer(true); d.answer(true);                              // 7×1, 7×2
    expect(d.current()).toMatchObject({ a:7, b:3, retry:false });
    d.answer(false);
    expect(d.current()).toMatchObject({ a:7, b:3, retry:true });
    d.answer(false); d.answer(false);
    expect(d.current()).toMatchObject({ a:7, b:3, retry:true });
    d.answer(true);
    expect(d.current()).toMatchObject({ a:7, b:4, retry:false });
  });

  it('exakt ett extratillfälle, minst två frågor bort, på en slumpad plats', () => {
    const spots = new Set();
    for (let seed = 1; seed <= 60; seed++) {
      const d = createDrill(ten, seeded(seed));
      d.answer(true);                                            // 7×1
      const r = d.answer(false);                                 // 7×2 fel (index 1)
      expect(r.insertedAt).toBeGreaterThanOrEqual(1 + 3);
      d.answer(false);                                           // fel igen: inget nytt extra
      d.answer(true);
      const q = d.queue();
      expect(q).toHaveLength(11);
      const pos = q.map((x, i) => x.b === 2 ? i : -1).filter(i => i >= 0);
      expect(pos).toHaveLength(2);
      expect(q[pos[1]].extra).toBe(true);
      expect(pos[1] - pos[0] - 1).toBeGreaterThanOrEqual(2);     // två andra frågor emellan
      spots.add(pos[1]);
    }
    expect(spots.size).toBeGreaterThan(3);                       // platsen slumpas
  });

  it('inget extra på extratillfället: fel där ger samma loop men ingen ny fråga', () => {
    const { d, log } = runDrill(ten, (cur, tries) => cur.b === 4 && tries < 2);   // 7×4 fel två gånger varje gång den ställs
    const q = d.queue();
    expect(q.filter(x => x.b === 4)).toHaveLength(2);
    expect(q).toHaveLength(11);
    const extraAsks = log.filter(x => x.b === 4 && x.extra);
    expect(extraAsks.map(x => x.ok)).toEqual([false, false, true]);
    expect(extraAsks.every(x => x.insertedAt === null)).toBe(true);
  });

  it('nära slutet läggs extrat sist', () => {
    for (const wrongAt of [8, 9]) {
      const { d, log } = runDrill(ten, (cur, tries) => cur.b === wrongAt + 1 && !cur.extra && tries === 0);
      const q = d.queue();
      expect(q[q.length - 1]).toMatchObject({ b:wrongAt + 1, extra:true });
      expect(log.find(x => x.insertedAt !== null && x.insertedAt !== undefined).insertedAt).toBe(10);
    }
  });

  it('recordAnswer bara på första försöket, inklusive extratillfället', () => {
    const { d, log, recorded } = runDrill(ten, (cur, tries) => [3, 6].includes(cur.b) && tries < (cur.extra ? 1 : 3));
    // 7×3 och 7×6: tre fel + rätt; extratillfällena: ett fel + rätt
    expect(recorded).toHaveLength(12);                            // 10 frågor + 2 extratillfällen
    expect(recorded.filter(x => !x.ok)).toHaveLength(4);          // första försöken som var fel
    expect(log.filter(x => x.retry).every(x => x.record === false)).toBe(true);
    expect(d.stats()).toEqual({ asked:12, firstOk:8, wrongFirst:4, attempts:log.length });
  });

  it('varvet tar alltid slut, även med många fel', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const r = seeded(seed * 13);
      const items = [3, 7].flatMap(a => [1,2,3,4,5,6,7,8,9,10,11,12].map(b => ({ a, b })));
      const { d, recorded } = runDrill(items, () => r() < .45, seed);
      expect(d.isDone()).toBe(true);
      const extras = d.queue().filter(x => x.extra).length;
      expect(extras).toBeLessThanOrEqual(items.length);
      expect(recorded).toHaveLength(items.length + extras);
      const ids = d.queue().filter(x => x.extra).map(x => x.id);
      expect(new Set(ids).size).toBe(ids.length);                // högst ett extra per fråga
    }
  });
});

describe('kvittot', () => {
  it('siffrorna summeras över varven', () => {
    const rc = receiptFor([
      { type:'show', asked:11, firstOk:10, wrongFirst:1 },
      { type:'choice', asked:12, firstOk:10, wrongFirst:2 },
      { type:'free', asked:10, firstOk:10, wrongFirst:0 },
    ], 8 * 60000 + 20500);
    expect(rc).toEqual({ correct:30, total:33, pct:91, fixed:3, secs:501, rounds:['show', 'choice', 'free'] });
    expect(durTxt(rc.secs)).toBe('8 min 21 s');
    expect(durTxt(45)).toBe('45 s');
    expect(durTxt(120)).toBe('2 min');
  });

  it('ett körts varv ger samma siffror i kvittot', () => {
    const { d } = runDrill(ten, (cur, tries) => cur.b === 5 && tries === 0 && !cur.extra);
    const st = d.stats();
    const rc = receiptFor([{ type:'choice', ...st }], 1000);
    expect(rc).toMatchObject({ correct:10, total:11, fixed:1, pct:91 });
  });

  it('passets förklaringstext följer språkreglerna för alla 144 tal', () => {
    for (const [a, b] of ALL) {
      const e = T.passExplainFor(a, b);
      expect(e.ea * e.eb).toBe(a * b);
      expect(problems(e.text), `${a}×${b}`).toEqual([]);
    }
    expect(T.passExplainFor(7, 2).text).toBe('7 × 2 är lika mycket som 2 × 7. 2 × 7 är 2 rader med 7 prickar i varje.');
  });

  it('berömmet är aldrig negativt och varierar med resultatet', () => {
    const texts = [0, 30, 59, 60, 84, 85, 99, 100].map(praiseFor);
    expect(new Set(texts).size).toBe(4);
    texts.forEach(t => expect(/inte|tyvärr|dåligt|sämre|fel svar/i.test(t), t).toBe(false));
  });
});

describe('Capybara: övningspasset', () => {
  const Capy = require('../js/capy.js');
  const { milestones, defaultState } = Capy._test;
  const ev = pct => ({ type:'ovningspass', data:{ module:'mult', pct } });
  /* v59: köposter är { spec, reason } (gamla strängar kan finnas kvar i kön) */
  const specs = st => st.pending.map(p => typeof p === 'string' ? p : p.spec);

  it('första övningspasset per dag ger ett vanligt kort först i kön, andra samma dag inte', () => {
    const st = defaultState();
    st.pending = ['viktad'];                                     // något som redan väntade
    milestones(st, ev(50), '2026-09-23');
    expect(specs(st)[0]).toBe('vanlig');
    expect(st.tests).toBe(1);
    const n = st.pending.length;
    milestones(st, ev(50), '2026-09-23');
    expect(specs(st).filter(x => x === 'vanlig')).toHaveLength(1);
    expect(st.pending.length).toBe(n);                           // tests = 2: ingen dragning
    milestones(st, ev(50), '2026-09-23');                        // tests = 3: var 3:e test
    expect(specs(st).slice(-1)[0]).toBe('viktad');
    milestones(st, ev(50), '2026-09-24');                        // ny dag
    expect(specs(st)[0]).toBe('vanlig');
    expect(specs(st).filter(x => x === 'vanlig')).toHaveLength(2);
  });

  it('dagens vanliga kort och var 3:e test ger inte dubbelt samma pass', () => {
    const st = defaultState(); st.tests = 2;
    milestones(st, ev(10), '2026-09-23');
    expect(specs(st)).toEqual(['vanlig']);
  });

  it('medaljlogiken via pct gäller som för test', () => {
    const st = defaultState();
    milestones(st, ev(100), '2026-09-23');
    expect(st.medals).toEqual({ b:false, s:false, g:true });
    expect(specs(st)).toEqual(['vanlig', 'sallsynt', 'legendarisk']);
    expect(st.perfect.mult).toBe(true);
    milestones(st, ev(100), '2026-09-23');                       // ingen ny legendarisk för samma modul
    expect(specs(st).filter(x => x === 'legendarisk')).toHaveLength(1);
  });

  it('testhändelsen beter sig som förut', () => {
    const st = defaultState();
    milestones(st, { type:'test', data:{ module:'mult', pct:80 } }, '2026-09-23');
    expect(specs(st)).toEqual(['vanlig', 'viktad']);
    milestones(st, { type:'daily', data:{ pct:100, streak:3 } }, '2026-09-23');
    milestones(st, { type:'daily', data:{ pct:100, streak:3 } }, '2026-09-23');
    expect(specs(st)).toEqual(['vanlig', 'viktad', 'sallsynt', 'legendarisk']);
  });
});

/* ═══════════════════════════════════════════════════════════
   v60: Träna en tabell – medaljerna på lådorna, snabbvalet och
   hemvyn utan lektionen
═══════════════════════════════════════════════════════════ */
describe('medaljerna (Träna en tabell)', () => {
  const D = '2026-09-23';
  const kan = (due = addDays(D, 3)) => ({ ...freshPair(), box:'kan', level:1, due });
  const ovar = () => ({ ...freshPair(), box:'ovar', okDays:1 });
  /* Lådor där tabell t:s tal t × 1 … t × n får tillståndet f(m) */
  function withTable(t, n, f) {
    const P = pairsFromStats({}, D);
    for (let m = 1; m <= n; m++) P[KEY(t, m)] = f(m);
    return P;
  }

  for (const n of [10, 12]) {
    it(`ingen, brons, silver, guld inom upto ${n}`, () => {
      // ingen: något tal är fortfarande nytt (även om resten är Kan)
      let P = withTable(7, n, m => m === 3 ? freshPair() : kan());
      expect(T.tableMedal(P, 7, n, D)).toMatchObject({ medal:null, kan:n - 1, total:n, due:0 });
      // brons: allt övat, inget nytt, färre än hälften Kan
      P = withTable(7, n, m => m <= Math.ceil(n / 2) - 1 ? kan() : ovar());
      expect(T.tableMedal(P, 7, n, D).medal).toBe('brons');
      P = withTable(7, n, ovar);
      expect(T.tableMedal(P, 7, n, D)).toMatchObject({ medal:'brons', kan:0 });
      // silver: minst hälften Kan
      P = withTable(7, n, m => m <= n / 2 ? kan() : ovar());
      expect(T.tableMedal(P, 7, n, D)).toMatchObject({ medal:'silver', kan:n / 2 });
      P = withTable(7, n, m => m === 1 ? ovar() : kan());
      expect(T.tableMedal(P, 7, n, D).medal).toBe('silver');
      // guld: alla Kan
      P = withTable(7, n, () => kan());
      expect(T.tableMedal(P, 7, n, D)).toMatchObject({ medal:'guld', kan:n, total:n, share:1, due:0 });
    });

    it(`Dags igen räknas som Kan och ger markeringen (upto ${n})`, () => {
      const P = withTable(8, n, m => m % 2 ? kan(addDays(D, -1)) : kan());   // varannan har passerat due
      const V = visMap(P, D, n);
      expect(V[KEY(8, 1)]).toBe('due');
      const m = T.tableMedal(P, 8, n, D);
      expect(m.medal).toBe('guld');
      expect(m.due).toBe(n / 2);
      // samma regel som Capy-händelsen 'tabell'
      expect(T.fullTables(P, n, [8])).toEqual([8]);
      // ingen Dags igen → ingen markering
      expect(T.tableMedal(withTable(8, n, () => kan()), 8, n, D).due).toBe(0);
      // Dags igen på ett övar-fyllt tal ändrar inte att medaljen byggs på lådan
      const Q = withTable(8, n, m => m === 2 ? kan(addDays(D, -5)) : ovar());
      expect(T.tableMedal(Q, 8, n, D)).toMatchObject({ medal:'brons', kan:1, due:1 });
    });
  }

  it('andelen rätt används inte: bara lådorna räknas', () => {
    // 100 % rätt i statistiken men bara ett försök per tal → övar, inte kan
    const stats = {}; for (let m = 1; m <= 10; m++) stats[`6x${m}`] = { correct:1, total:1 };
    const P = pairsFromStats(stats, D);
    expect(T.tableMedal(P, 6, 10, D).medal).toBe('brons');
  });

  it('talen utanför Gånger räknas inte (tabell 7 med upto 10 ignorerar 7 × 11, 7 × 12)', () => {
    const P = pairsFromStats({}, D);
    for (let m = 1; m <= 10; m++) P[KEY(7, m)] = kan();
    expect(T.tableMedal(P, 7, 10, D).medal).toBe('guld');
    expect(T.tableMedal(P, 7, 12, D).medal).toBe(null);
  });

  it('snabbvalen: 1–10 alltid, 11 och 12 under Extra bara när Gånger når dit', () => {
    expect(T.quickTables(10)).toEqual({ main:[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], extra:[] });
    expect(T.quickTables(11).extra).toEqual([11]);
    expect(T.quickTables(12).extra).toEqual([11, 12]);
  });

  it('medaljerna är SVG utan emojis, och de tre skiljer sig åt', () => {
    const svgs = [null, ...T.MEDALS].map(k => T.medalSVG(k));
    svgs.forEach(s => { expect(s.startsWith('<svg')).toBe(true); expect(/\p{Extended_Pictographic}/u.test(s)).toBe(false); });
    expect(new Set(svgs).size).toBe(4);
  });
});

describe('snabbvalet bygger passet', () => {
  it('rätt tabell och de sparade varven', () => {
    const saved = { tables:[3, 4], counts:{ show:0, choice:2, free:2 } };
    const cfg = T.quickPassCfg(7, saved);
    expect(cfg).toEqual({ tables:[7], counts:{ show:0, choice:2, free:2 } });
    const rounds = buildRounds(cfg, 10, seeded(3));
    expect(rounds.map(r => r.type)).toEqual(['choice', 'choice', 'free', 'free']);
    rounds.forEach(r => {
      expect(r.items).toHaveLength(10);
      expect(r.items.every(it => it.a === 7)).toBe(true);
      expect(r.items.map(it => it.b).sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
    expect(passPlan(cfg, 12)).toMatchObject({ tables:[7], rounds:4, questions:48 });
  });

  it('utan sparat pass (eller med noll varv) gäller Vanligt', () => {
    const vanligt = PRESETS.find(p => p.k === 'vanligt').c;
    expect(T.quickPassCfg(5, null).counts).toEqual(vanligt);
    expect(T.quickPassCfg(5, { tables:[5], counts:{ show:0, choice:0, free:0 } }).counts).toEqual(vanligt);
    expect(T.quickPassCfg(12, null).tables).toEqual([12]);
  });
});

describe('hemvyn (v60)', () => {
  const html = T.trainerHTML();
  const section = id => { const m = html.match(new RegExp(`<section class="gscr" id="mt-scr-${id}">([\\s\\S]*?)</section>`)); return m ? m[1] : ''; };

  it('hemvyns karta har inte kvar lektionen', () => {
    const hub = section('hub');
    expect(hub).toContain('id="mt-hubMap"');
    expect(hub).not.toMatch(/shrink|krymper|mindre än du tror|lesson/i);
    expect(hub).not.toMatch(/rowbtn/);
  });

  it('lektionen ligger i Lär dig strategin, före tabellerna, med en egen karta', () => {
    const learn = section('learn');
    expect(learn).toContain('Tabellen är mindre än du tror');
    expect(learn.indexOf('mt-learnChap')).toBeLessThan(learn.indexOf('mt-learnTabs'));
    expect(learn).toContain('id="mt-lessonMap"');
  });

  it('ordningen uppifrån: karta, Träna en tabell, varvraden, tre rutor, Statistik/Logg', () => {
    const hub = section('hub');
    const order = ['mt-hubMap', 'mt-hubTCard', 'mt-vrEdit', 'mt-goPrac', 'mt-goLearn', 'mt-goRec', 'mt-goStats', 'mt-goLog'].map(id => hub.indexOf(id));
    order.forEach(i => expect(i).toBeGreaterThan(-1));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(problems('Kvar blir 21 svåra rutor. Dem övar vi på.')).toEqual([]);
    expect(/\p{Extended_Pictographic}/u.test(hub + section('tstart') + section('learn'))).toBe(false);
  });
});
