/* tests/daily.test.mjs — Dagens träning (js/daily.js, v65)
   Urvalet ur Gångertabellens och Klockans lådor: prioritetsordningen, taket 8,
   att båda modulerna får plats, Gånger (upto), frysningen per dag (och att gamla
   frysta poster räknas om), inget pass utan data, inga andra moduler, texten
   på hjältekortet och streak med gamla och nya loggposter. */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

/* Modulerna läser localStorage och de globala MP/MultGame/ClockGame – en minnesbutik räcker */
let store = {};
globalThis.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; },
};
const MP = require('../js/shared.js');
globalThis.MP = MP;
const MG = require('../js/multiplication.js');
const CG = require('../js/clock.js');
globalThis.MultGame = MG;
globalThis.ClockGame = CG;
const DT = require('../js/daily.js');
const T = DT._test;
const SP = MP.spaced;

const DAY = '2026-09-24';
const P = { id: 'p1', name: 'Mira' };
const past = n => SP.addDays(DAY, -n);

/* Lådor: gångertabellen (alla 78 par, v2) och klockan (v1, per steg) */
function multBoxes(set = {}) {
  const pairs = {};
  for (let a = 1; a <= 12; a++) for (let b = a; b <= 12; b++) pairs[`${a}x${b}`] = SP.fresh();
  for (const k of Object.keys(set)) pairs[k] = { ...SP.fresh(), ...set[k] };
  store[`mult_boxes_${P.id}`] = JSON.stringify({ v: 2, pairs, passNo: 0 });
}
function clockBoxes(set = {}) {
  const steps = {};
  for (const k of Object.keys(set)) {
    const [step, key] = k.split('/');
    (steps[step] = steps[step] || {})[key] = { ...SP.fresh(), ...set[k] };
  }
  store[`clock_boxes_${P.id}`] = JSON.stringify({ v: 1, steps });
}
const due = d => ({ box: 'kan', level: 1, okDays: 3, due: d });
const ovar = n => ({ box: 'ovar', okDays: n });
const kan = () => ({ box: 'kan', level: 2, okDays: 3, due: SP.addDays(DAY, 5) });

/* Kandidater för det rena urvalet */
const C = (module, key, state, extra = {}) => ({ module, key, label: key, state, due: null, okDays: 0, order: 0, ...extra });

beforeEach(() => { store = {}; T.setToday(DAY); });
afterEach(() => { T.setToday(null); MG._test.setToday(null); CG._test.setToday(null); });

/* ── Det rena urvalet ───────────────────────────────────── */
describe('pickItems: prioritetsordningen', () => {
  it('dags igen (äldst due först), sedan övar (lägst okDays först), sedan en ny per modul', () => {
    const cands = [
      C('mult', '3x4', 'ovar', { okDays: 2 }),
      C('mult', '7x8', 'due', { due: past(1) }),
      C('mult', '6x7', 'due', { due: past(5) }),
      C('clock', 'halv/2:30', 'ovar', { okDays: 0 }),
      C('clock', 'hela/3:00', 'due', { due: past(3) }),
      C('mult', '1x1', 'ny', { order: 0 }), C('mult', '1x2', 'ny', { order: 1 }),
      C('clock', 'hela/1:00', 'ny', { order: 0 }), C('clock', 'hela/2:00', 'ny', { order: 1 }),
      C('mult', '2x2', 'kan'),
    ];
    const got = T.pickItems(cands, 'seed').map(i => i.key);
    expect(got).toEqual(['6x7', 'hela/3:00', '7x8', 'halv/2:30', '3x4', '1x1', 'hela/1:00']);
  });
  it('den nya är den första i lätt-först-ordning, inte den första i listan', () => {
    const got = T.pickItems([C('mult', '7x8', 'ovar'), C('mult', '9x9', 'ny', { order: 40 }), C('mult', '2x3', 'ny', { order: 3 })], 's');
    expect(got.map(i => i.key)).toEqual(['7x8', '2x3']);
  });
  it('kan-uppgifter som inte är dags igen kommer aldrig med', () => {
    const got = T.pickItems([C('mult', '7x8', 'ovar'), C('mult', '2x2', 'kan'), C('clock', 'hela/3:00', 'kan')], 's');
    expect(got.map(i => i.key)).toEqual(['7x8']);
  });
  it('lika läge avgörs seedat: samma seed ger samma urval, i vilken ordning kandidaterna än kommer', () => {
    const cands = []; for (let b = 1; b <= 12; b++) cands.push(C('mult', `3x${b}`.replace('3x1', '1x3').replace('3x2', '2x3'), 'ovar', { okDays: 1 }));
    const a = T.pickItems(cands, `${DAY}|p1`).map(i => i.key);
    const b = T.pickItems(cands.slice().reverse(), `${DAY}|p1`).map(i => i.key);
    expect(a).toEqual(b);
    const seeds = new Set(['2026-09-25|p1', '2026-09-26|p1', '2026-09-27|p1', `${DAY}|p2`].map(s => T.pickItems(cands, s).map(i => i.key).join()));
    expect(seeds.size).toBeGreaterThan(1);               // ett annat datum eller en annan profil ger ett annat urval
  });
});

describe('pickItems: taket och fördelningen', () => {
  it('högst 8 uppgifter, och nya får bara plats när dags igen och övar inte fyller taket', () => {
    const cands = [];
    for (let i = 1; i <= 12; i++) cands.push(C('mult', `${i}x12`, 'due', { due: past(i) }));
    cands.push(C('mult', '1x1', 'ny'));
    const got = T.pickItems(cands, 's');
    expect(got).toHaveLength(8);
    expect(got.every(i => i.state === 'due')).toBe(true);
    expect(got[0].key).toBe('12x12');                    // äldst due först
    const few = T.pickItems([C('mult', '7x8', 'ovar'), C('mult', '1x1', 'ny'), C('clock', 'hela/1:00', 'ny')], 's');
    expect(few.map(i => i.key)).toEqual(['7x8', '1x1', 'hela/1:00']);
  });
  it('fördelningen följer vad som väntar: ingen fast kvot', () => {
    const cands = [];
    for (let i = 1; i <= 6; i++) cands.push(C('mult', `${i}x9`, 'due', { due: past(10) }));
    cands.push(C('clock', 'hela/3:00', 'due', { due: past(2) }), C('clock', 'halv/2:30', 'ovar'));
    const got = T.pickItems(cands, 's');
    expect(got.filter(i => i.module === 'mult')).toHaveLength(6);
    expect(got.filter(i => i.module === 'clock')).toHaveLength(2);
  });
  it('har båda modulerna något i prioritet 1–2 får båda minst en plats', () => {
    const cands = [];
    for (let i = 1; i <= 12; i++) cands.push(C('mult', `${i}x12`, 'due', { due: past(20 + i) }));
    cands.push(C('clock', 'halv/2:30', 'ovar', { okDays: 2 }));   // sämst prioritet av alla
    const got = T.pickItems(cands, 's');
    expect(got).toHaveLength(8);
    expect(got.filter(i => i.module === 'clock').map(i => i.key)).toEqual(['halv/2:30']);
    expect(got.filter(i => i.module === 'mult')).toHaveLength(7);
    // den som fick lämna platsen är gångertabellens sista (yngst due)
    expect(got.some(i => i.key === '5x12')).toBe(false);
    // och omvänt
    const rev = [];
    for (let s = 0; s < 12; s++) rev.push(C('clock', `hela/${s + 1}:00`, 'due', { due: past(30) }));
    rev.push(C('mult', '7x8', 'ovar', { okDays: 2 }));
    expect(T.pickItems(rev, 's').filter(i => i.module === 'mult').map(i => i.key)).toEqual(['7x8']);
  });
  it('en modul med bara nya uppgifter tar ingen plats från prioritet 1–2', () => {
    const cands = [];
    for (let i = 1; i <= 12; i++) cands.push(C('mult', `${i}x12`, 'ovar'));
    cands.push(C('clock', 'hela/1:00', 'ny'));
    const got = T.pickItems(cands, 's');
    expect(got.filter(i => i.module === 'clock')).toHaveLength(0);
  });
});

describe('pickItems: inget pass utan data, inga andra moduler', () => {
  it('allt nytt eller inget spelat → null', () => {
    expect(T.pickItems([], 's')).toBe(null);
    expect(T.pickItems([C('mult', '1x1', 'ny'), C('clock', 'hela/1:00', 'ny')], 's')).toBe(null);
  });
  it('kandidater från andra moduler förekommer aldrig', () => {
    const got = T.pickItems([C('friends', 'x', 'due', { due: past(9) }), C('multdiv', 'y', 'ovar'), C('mult', '7x8', 'ovar')], 's');
    expect(got.map(i => i.module)).toEqual(['mult']);
  });
});

/* ── Modulernas kandidater (de äger sitt format) ─────────── */
describe('modulernas kandidater', () => {
  it('Gångertabellen: inom Gånger (standard 10, inställningen 12 ger 11:an och 12:an)', () => {
    multBoxes({ '7x8': ovar(1), '11x12': due(past(2)) });
    let c = MG.dailyCandidates(P, DAY);
    expect(c).toHaveLength(55);                          // 1–10: 55 unika par
    expect(c.every(x => x.module === 'mult')).toBe(true);
    expect(c.some(x => x.key === '11x12')).toBe(false);
    expect(c.find(x => x.key === '7x8')).toMatchObject({ state: 'ovar', okDays: 1, label: '7 × 8' });
    store[`mult_settings_${P.id}`] = JSON.stringify({ upto: '12' });
    c = MG.dailyCandidates(P, DAY);
    expect(c).toHaveLength(78);
    expect(c.find(x => x.key === '11x12')).toMatchObject({ state: 'due', due: past(2) });
  });
  it('Gångertabellen: order är lätt-först (samma ordning som passet), och läsningen skriver inget', () => {
    const c = MG.dailyCandidates(P, DAY);
    expect(c.map(x => x.order)).toEqual(c.map((_, i) => i));
    const sorted = MG._test.pairsUpTo(10).slice().sort(MG._test.easyFirst).map(([a, b]) => MG._test.KEY(a, b));
    expect(c.map(x => x.key)).toEqual(sorted);
    expect(store[`mult_boxes_${P.id}`]).toBeUndefined();
  });
  it('Gångertabellen utan lådor: byggs ur statistiken som modulen själv gör', () => {
    store[`mult_stats_${P.id}`] = JSON.stringify({ '7x8': { correct: 1, total: 2 } });
    expect(MG.dailyCandidates(P, DAY).find(x => x.key === '7x8').state).toBe('ovar');
  });
  it('Klockan: trappans ordning, nyckeln steg/tid och etiketten i ord', () => {
    clockBoxes({ 'halv/2:30': due(past(1)) });
    const c = CG.dailyCandidates(P, DAY);
    expect(c).toHaveLength(84);
    expect(c[0]).toMatchObject({ module: 'clock', key: 'hela/1:00', label: 'klockan ett', state: 'ny', order: 0 });
    expect(c.find(x => x.key === 'halv/2:30')).toMatchObject({ state: 'due', label: 'halv tre' });
    expect(c.find(x => x.key === 'digital/14:30').label).toBe('14:30');
    expect(c.find(x => x.key.startsWith('tid/')).label).toMatch(/ till /);
    expect(CG.dailyLabelHTML('halv/2:30')).toContain('t-m');
  });
});

/* ── Dagens urval ur lådorna ───────────────────────────── */
describe('selection: frysningen per dag', () => {
  it('urvalet fryses i daily_state för dagen och ändras inte när lådorna ändras', () => {
    multBoxes({ '7x8': due(past(1)), '6x7': ovar(0) });
    clockBoxes({ 'halv/2:30': ovar(1) });
    const first = DT.selection(P, DAY);
    expect(first.map(i => i.key)).toEqual(['7x8', '6x7', 'halv/2:30', '1x1', 'hela/1:00']);
    const st = JSON.parse(store[`daily_state_${P.id}`]);
    expect(st).toMatchObject({ v: 2, date: DAY });
    multBoxes({}); clockBoxes({});                       // lådorna nollställs under dagen
    expect(DT.selection(P, DAY)).toEqual(first);
    expect(DT.selection(P, SP.addDays(DAY, 1))).toBe(null);   // nästa dag räknas om: nu finns ingen data
  });
  it('en gammal frusen post med bara tal räknas om', () => {
    store[`daily_state_${P.id}`] = JSON.stringify({ date: DAY, tal: [{ a: 7, b: 8 }, { a: 6, b: 7 }, { a: 9, b: 6 }] });
    clockBoxes({ 'kvart/1:15': ovar(2) });
    const got = DT.selection(P, DAY);
    expect(got.map(i => i.key)).toContain('kvart/1:15');
    expect(JSON.parse(store[`daily_state_${P.id}`]).v).toBe(2);
  });
  it('trasiga frysta poster och poster med andra moduler räknas om', () => {
    multBoxes({ '7x8': ovar(0) });
    store[`daily_state_${P.id}`] = JSON.stringify({ v: 2, date: DAY, items: [{ module: 'friends', key: 'x', state: 'due' }] });
    expect(DT.selection(P, DAY).map(i => i.key)).toEqual(['7x8', '1x1', 'hela/1:00']);
    store[`daily_state_${P.id}`] = '{inte json';
    expect(DT.selection(P, DAY)[0].key).toBe('7x8');
  });
  it('inget pass utan data: ny profil ger Kom igång och inget fryses', () => {
    expect(DT.selection(P, DAY)).toBe(null);
    expect(DT.heroContent(P)).toBe(null);
    expect(DT.hasWork(P)).toBe(false);
    expect(store[`daily_state_${P.id}`]).toBeUndefined();
  });
  it('bara Kan (inget dags igen, inget att öva) → ingen Dagens träning, och det fryses inte', () => {
    multBoxes({ '7x8': kan() });
    expect(DT.hasWork(P)).toBe(false);
    expect(DT.heroContent(P)).toBe(null);
    expect(store[`daily_state_${P.id}`]).toBeUndefined();
    multBoxes({ '7x8': kan(), '6x7': ovar(1) });            // hon spelar senare samma dag
    expect(DT.hasWork(P)).toBe(true);
  });
  it('andra modulers loggar ger ingen Dagens träning', () => {
    store[`friends_log_${P.id}`] = JSON.stringify([{ date: new Date().toISOString(), score: 3, total: 10 }]);
    store[`uppstallning_log_${P.id}`] = JSON.stringify([{ date: new Date().toISOString(), pct: 20 }]);
    expect(DT.heroContent(P)).toBe(null);
  });
});

/* ── Hjältekortet ─────────────────────────────────────── */
describe('hjältekortet', () => {
  it('läget träna: uppgifterna och en text som säger vad och varför', () => {
    multBoxes({ '7x8': due(past(1)), '6x7': due(past(1)), '4x9': ovar(1) });
    clockBoxes({ 'halv/2:30': due(past(2)) });
    const h = DT.heroContent(P);
    expect(h.läge).toBe('träna');
    expect(h.items.every(i => ['mult', 'clock'].includes(i.module))).toBe(true);
    expect(h.text).toBe('Två tal och en klocktid är dags att visa igen. Sedan lite att öva på och något nytt.');
  });
  it('texterna: dags igen, att öva, något nytt', () => {
    const I = (module, state) => ({ module, state, key: 'k' });
    expect(T.heroText([I('mult', 'due'), I('mult', 'due'), I('mult', 'due'), I('mult', 'due'), I('clock', 'due'), I('clock', 'due')]))
      .toBe('Fyra tal och två klocktider är dags att visa igen.');
    expect(T.heroText([I('mult', 'ovar'), I('clock', 'ovar'), I('clock', 'ovar'), I('clock', 'ny')])).toBe('Du övar vidare på ett tal och två klocktider. Sedan något nytt.');
    expect(T.heroText([I('clock', 'due')])).toBe('En klocktid är dags att visa igen.');
    expect(T.rightTxt(9, 11)).toBe('9 av 11');
    expect(T.rightTxt(11, 11)).toBe('Alla 11');
  });
  it('läget klart efter dagens pass, med dagar i rad', () => {
    multBoxes({ '7x8': ovar(1) });
    DT.markDone(P, { correct: 2, total: 3 }, DT.selection(P, DAY), []);
    T.setToday(MP.spaced.fmtDay(new Date()));
    const h = DT.heroContent(P);
    expect(h).toEqual({ läge: 'klart', streak: 1 });
  });
});

/* ── Loggen och streak ─────────────────────────────────── */
describe('streak med gamla och nya loggposter', () => {
  const iso = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d.toISOString(); };
  beforeEach(() => T.setToday(MP.spaced.fmtDay(new Date())));
  it('gamla poster ({tal:["7x8"], score, total}) och nya ({v:2, tal med båda modulerna}) räknas lika', () => {
    store[`daily_log_${P.id}`] = JSON.stringify([
      { v: 2, tal: ['7x8', 'halv/2:30'], fylldes: ['7x8'], score: 5, total: 6, id: 3, date: iso(0) },
      { tal: ['7x8', '6x7', '9x6'], score: 6, total: 6, id: 2, date: iso(1) },
      { tal: ['3x4'], score: 4, total: 6, id: 1, date: iso(2) },
      { tal: ['3x4'], score: 4, total: 6, id: 0, date: iso(4) },
    ]);
    expect(DT.streak(P)).toBe(3);
    expect(T.doneToday(P.id)).toBe(true);
  });
  it('kedjan räknas från igår om dagens pass inte är gjort, och bryts av en tom dag', () => {
    store[`daily_log_${P.id}`] = JSON.stringify([{ tal: ['7x8'], score: 1, total: 1, date: iso(1) }, { tal: [], score: 1, total: 1, date: iso(2) }]);
    expect(DT.streak(P)).toBe(2);
    store[`daily_log_${P.id}`] = JSON.stringify([{ tal: ['7x8'], score: 1, total: 1, date: iso(2) }]);
    expect(DT.streak(P)).toBe(0);
    expect(DT.streak(null)).toBe(0);
  });
  it('markDone loggar nycklar från båda modulerna och ger en dag i rad', () => {
    DT.markDone(P, { correct: 7, total: 9 }, [{ module: 'mult', key: '7x8' }, { module: 'clock', key: 'halv/2:30' }], [{ module: 'mult', key: '7x8' }]);
    const log = JSON.parse(store[`daily_log_${P.id}`]);
    expect(log[0]).toMatchObject({ v: 2, tal: ['7x8', 'halv/2:30'], fylldes: ['7x8'], score: 7, total: 9 });
    expect(DT.streak(P)).toBe(1);
  });
});

describe('slutskärmen: det som fylldes på', () => {
  it('bara det som var dags igen när passet startade och satt på första försöket', () => {
    const items = [{ module: 'mult', key: '7x8', state: 'due' }, { module: 'clock', key: 'hela/3:00', state: 'due' }, { module: 'mult', key: '6x7', state: 'ovar' }, { module: 'clock', key: 'halv/2:30', state: 'due' }];
    const live = { '7x8': 'due', 'hela/3:00': 'ovar', '6x7': 'ovar', 'halv/2:30': 'due' };   // hela/3:00 föll till Övar tidigare i dag
    const first = { '7x8': true, 'hela/3:00': true, '6x7': true, 'halv/2:30': false };
    expect(T.filledItems(items, live, first).map(i => i.key)).toEqual(['7x8']);
  });
});
