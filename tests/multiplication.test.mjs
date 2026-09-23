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
