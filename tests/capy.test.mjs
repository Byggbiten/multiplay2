/* tests/capy.test.mjs — Capybara-samlingen (js/capy.js), v59
   Nivåerna vanlig → silver → guld, migreringen från gamla formatet,
   köposter med skäl, skälstexterna och tabellhändelsen. */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

/* capy.js använder globala MP och localStorage – en enkel minnesbutik räcker */
const mem = new Map();
globalThis.localStorage = {
  getItem: k => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => { mem.set(k, String(v)); },
  removeItem: k => { mem.delete(k); },
};
globalThis.MP = require('../js/shared.js');
const Capy = require('../js/capy.js');
const MG = require('../js/multiplication.js');
const C = Capy._test;
const { CARDS, TOTAL } = C;

const ids = rar => CARDS.filter(c => c.rar === rar).map(c => c.id);
const DAY = '2026-09-23', NOW = '2026-09-23T10:00:00.000Z';
/* Samling där alla kort har nivån t (valfritt: undantag) */
function allAt(t, except = {}) {
  let cards = {};
  for (const c of CARDS) {
    const tier = except[c.id] !== undefined ? except[c.id] : t;
    for (let k = 1; k <= tier; k++) cards = C.grant(cards, c.id, null, NOW);
  }
  return cards;
}

const profile = { id: 'p1', name: 'Mira' };
let calls;
beforeEach(() => {
  mem.clear();
  calls = { unlock: [], allDone: 0 };
  C.ui.showUnlock = (card, tier, reason) => calls.unlock.push({ id: card.id, tier, reason });
  C.ui.showAllDone = () => { calls.allDone++; };
});
afterEach(() => { vi.restoreAllMocks(); });
const readCardsRaw = () => JSON.parse(mem.get('capy_cards_p1'));
const readStateRaw = () => JSON.parse(mem.get('capy_state_p1'));

/* ── Migreringen ─────────────────────────────────────────── */
describe('migrering från gamla formatet { kortId: ISO-datum }', () => {
  const OLD = {
    sov: '2026-07-03T08:00:00.000Z', glass: '2026-07-10T09:30:00.000Z', wizard: '2026-08-01T12:00:00.000Z',
    guld: '2026-08-20T15:00:00.000Z', minnesmastare: '2026-09-01T07:00:00.000Z',
  };

  it('varje gammal post blir tier 1 med sitt datum och reason:null', () => {
    const n = C.normalizeCards(OLD);
    expect(Object.keys(n).sort()).toEqual(Object.keys(OLD).sort());
    for (const [id, date] of Object.entries(OLD)) {
      expect(n[id]).toEqual({ tier: 1, got: [{ tier: 1, date, reason: null }] });
    }
  });

  it('okända kort-id och andra sanna värden följer med – inget tappas', () => {
    const n = C.normalizeCards({ ...OLD, framtidskort: '2026-09-02T00:00:00.000Z', bad: true });
    expect(Object.keys(n)).toHaveLength(7);
    expect(n.framtidskort.tier).toBe(1);
    expect(n.bad).toEqual({ tier: 1, got: [{ tier: 1, date: null, reason: null }] });
  });

  it('nytt format läses oförändrat, och blandat gammalt/nytt går ihop', () => {
    const nu = { glass: { tier: 2, got: [{ tier: 1, date: 'a', reason: 'Du gjorde tre test till' }, { tier: 2, date: 'b', reason: 'Minnesmästare' }] } };
    const n = C.normalizeCards({ ...nu, sov: OLD.sov });
    expect(n.glass).toEqual(nu.glass);
    expect(n.sov.tier).toBe(1);
  });

  it('award() på en gammal profil behåller alla gamla kort med datum och lägger till ett nytt', () => {
    mem.set('capy_cards_p1', JSON.stringify(OLD));
    const got = Capy.award(profile, { type: 'test', data: { module: 'clock', pct: 50 } });
    expect(got).not.toBeNull();
    const saved = readCardsRaw();
    expect(Object.keys(saved)).toHaveLength(6);
    for (const [id, date] of Object.entries(OLD)) {
      expect(saved[id]).toEqual({ tier: 1, got: [{ tier: 1, date, reason: null }] });
    }
    expect(OLD[got.card.id]).toBeUndefined();
    expect(saved[got.card.id].got[0].reason).toBe('Första testet i Klockan');
  });

  it('en gammal profil med alla 24 kort (och allDoneShown) går vidare till silver', () => {
    const old24 = {}; CARDS.forEach(c => { old24[c.id] = '2026-08-01T00:00:00.000Z'; });
    mem.set('capy_cards_p1', JSON.stringify(old24));
    mem.set('capy_state_p1', JSON.stringify({ ...C.defaultState(), tests: 40, allDoneShown: true, pending: [] }));
    const got = Capy.award(profile, { type: 'test', data: { module: 'mult', pct: 50 } });
    expect(got).toBeNull(); // test 41: ingen milstolpe
    const got2 = Capy.award(profile, { type: 'test', data: { module: 'mult', pct: 50 } }); // test 42: var 3:e
    expect(got2.tier).toBe(2);
    const saved = readCardsRaw();
    expect(Object.keys(saved)).toHaveLength(24);
    expect(saved[got2.card.id].got).toEqual([
      { tier: 1, date: '2026-08-01T00:00:00.000Z', reason: null },
      { tier: 2, date: expect.any(String), reason: 'Du gjorde tre test till' },
    ]);
    expect(calls.allDone).toBe(0);
  });
});

/* ── Nivåordningen ───────────────────────────────────────── */
describe('nivåordningen', () => {
  it('levelOf: 0 så länge ett kort saknas, 1 när alla är vanliga, 2 när alla är silver, 3 allt guld', () => {
    expect(C.levelOf({})).toBe(0);
    expect(C.levelOf(allAt(3, { sov: 0 }))).toBe(0);
    expect(C.levelOf(allAt(1))).toBe(1);
    expect(C.levelOf(allAt(2, { drak: 1 }))).toBe(1);
    expect(C.levelOf(allAt(2))).toBe(2);
    expect(C.levelOf(allAt(3))).toBe(3);
  });

  it('23 kort + silverfas: varje dragning ger det saknade kortet, aldrig silver', () => {
    for (const spec of ['vanlig', 'sallsynt', 'legendarisk', 'viktad', 'matte', 'memmaster']) {
      const cards = allAt(1, { rock: 0 });
      expect(C.resolveDraw(spec, cards, C.defaultState()).id, spec).toBe('rock');
    }
  });

  it('72 utdelningar från tom samling: aldrig silver före alla 24, aldrig guld före alla silver, sedan null', () => {
    const specs = ['vanlig', 'sallsynt', 'legendarisk', 'viktad', 'matte', 'memmaster'];
    let cards = {};
    const st = C.defaultState();
    for (let i = 0; i < 72; i++) {
      const card = C.resolveDraw(specs[i % specs.length], cards, st);
      expect(card, `utdelning ${i + 1}`).not.toBeNull();
      cards = C.grant(cards, card.id, null, NOW);
      const tiers = CARDS.map(c => C.tierOf(cards, c.id));
      if (tiers.some(t => t === 0)) expect(Math.max(...tiers)).toBeLessThanOrEqual(1);
      if (tiers.some(t => t <= 1)) expect(Math.max(...tiers)).toBeLessThanOrEqual(2);
    }
    expect(CARDS.every(c => C.tierOf(cards, c.id) === 3)).toBe(true);
    expect(C.resolveDraw('viktad', cards, st)).toBeNull();
  });

  it('grant lägger en rad per nivå och behåller de tidigare', () => {
    let cards = C.grant({}, 'glass', 'Första testet i Klockan', 'd1');
    cards = C.grant(cards, 'glass', 'Du gjorde tre test till', 'd2');
    cards = C.grant(cards, 'glass', 'Minnesmästare', 'd3');
    expect(cards.glass).toEqual({ tier: 3, got: [
      { tier: 1, date: 'd1', reason: 'Första testet i Klockan' },
      { tier: 2, date: 'd2', reason: 'Du gjorde tre test till' },
      { tier: 3, date: 'd3', reason: 'Minnesmästare' },
    ] });
  });
});

/* ── Sällsyntheten vid uppgradering ──────────────────────── */
describe('sällsyntheten gäller även uppgraderingar', () => {
  const st = C.defaultState();
  it('silverfasen: vanlig/sällsynt/legendarisk dragning uppgraderar ett kort av samma sällsynthet', () => {
    for (let s = 0; s < 40; s++) {
      const cards = allAt(1);
      expect(C.resolveDraw('vanlig', cards, st).rar).toBe('vanlig');
      expect(C.resolveDraw('sallsynt', cards, st).rar).toBe('sallsynt');
      const leg = C.resolveDraw('legendarisk', cards, st);
      expect(['guld', 'regnbage', 'drak', 'stjarn']).toContain(leg.id);
    }
  });

  it('guldfasen: bara silverkort är valbara, och sällsyntheten följs', () => {
    const cards = allAt(2, { wizard: 3, rock: 3 });
    for (let s = 0; s < 40; s++) {
      const c = C.resolveDraw('sallsynt', cards, st);
      expect(c.rar).toBe('sallsynt');
      expect(C.tierOf(cards, c.id)).toBe(2);
    }
  });

  it('saknas ett kort av sällsyntheten följs reservkedjan (sällsynt → vanlig)', () => {
    const exc = {}; ids('sallsynt').forEach(id => { exc[id] = 2; });
    const cards = allAt(1, exc);
    for (let s = 0; s < 30; s++) expect(C.resolveDraw('sallsynt', cards, st).rar).toBe('vanlig');
  });

  it('legendarisk utan generiska kvar → sällsynt; Matte- och Minnesmästar-Capy nås via sista reserven', () => {
    const exc = {}; [...ids('vanlig'), ...ids('sallsynt'), 'guld', 'regnbage', 'drak', 'stjarn'].forEach(id => { exc[id] = 2; });
    const cards = allAt(1, exc);
    for (let s = 0; s < 30; s++) expect(['matte', 'minnesmastare']).toContain(C.resolveDraw('legendarisk', cards, st).id);
  });

  it("'matte' uppgraderar Matte-Capy när den är på fasens nivå", () => {
    expect(C.resolveDraw('matte', allAt(1), st).id).toBe('matte');
    expect(C.resolveDraw('matte', allAt(2, { matte: 3 }), st).rar).toBe('legendarisk');
  });

  it("'memmaster' ger Minnesmästar-Capy från 3:e stjärnan, annars sällsynt kedja", () => {
    expect(C.resolveDraw('memmaster', allAt(1), { ...st, memStars: 3 }).id).toBe('minnesmastare');
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    expect(C.resolveDraw('memmaster', allAt(1), { ...st, memStars: 1 }).rar).toBe('sallsynt');
  });
});

/* ── Allt guld ───────────────────────────────────────────── */
describe('allt guld ger showAllDone', () => {
  it('awardCore: allDone en gång, kön töms', () => {
    const st = C.normState({ ...C.defaultState(), pending: ['viktad'] });
    const r = C.awardCore(st, allAt(3), { type: 'test', data: { pct: 50 } }, DAY, NOW);
    expect(r.card).toBeNull();
    expect(r.allDone).toBe(true);
    expect(r.st.pending).toEqual([]);
    const r2 = C.awardCore(r.st, allAt(3), { type: 'test', data: { pct: 50 } }, DAY, NOW);
    expect(r2.allDone).toBe(false);
  });

  it('award(): showAllDone när sista kortet redan är guld, aldrig för tidigt', () => {
    mem.set('capy_cards_p1', JSON.stringify(allAt(3, { drak: 2 })));
    mem.set('capy_state_p1', JSON.stringify({ ...C.defaultState(), tests: 2, pending: [] }));
    const got = Capy.award(profile, { type: 'test', data: { module: 'mult', pct: 50 } }); // test 3
    expect(got.card.id).toBe('drak');
    expect(got.tier).toBe(3);
    expect(calls.allDone).toBe(0);
    for (let i = 0; i < 3; i++) Capy.award(profile, { type: 'test', data: { module: 'mult', pct: 50 } }); // test 6
    expect(calls.allDone).toBe(1);
    for (let i = 0; i < 3; i++) Capy.award(profile, { type: 'test', data: { module: 'mult', pct: 50 } }); // test 9
    expect(calls.allDone).toBe(1);
  });
});

/* ── Skälen ──────────────────────────────────────────────── */
describe('skälstexterna', () => {
  const reasons = (st, ev) => C.milestones(st, ev, DAY).pending.map(p => p.reason);

  it('test: första testet, tre test till, medaljer, 100 %, Matte-Capy', () => {
    const st = C.defaultState();
    expect(reasons(st, { type: 'test', data: { module: 'clock', pct: 50 } })).toEqual(['Första testet i Klockan']);
    st.pending = [];
    reasons(st, { type: 'test', data: { module: 'clock', pct: 50 } });
    expect(reasons(st, { type: 'test', data: { module: 'friends', pct: 100 } })).toEqual([
      'Du gjorde tre test till', 'Första gången 95 % eller mer', '100 % i 10-Kompisar',
    ]);
    st.pending = [];
    expect(reasons(st, { type: 'test', data: { module: 'uppstallning', pct: 80 } })).toEqual(['Första gången 75 % eller mer']);
    st.pending = [];
    expect(reasons(st, { type: 'test', data: { module: 'multdiv', pct: 88 } })).toEqual([
      'Första gången 85 % eller mer', 'Alla tre medaljerna samlade',
    ]);
    st.pending = [];
    expect(reasons(st, { type: 'test', data: { module: 'mult', pct: 100 } })).toEqual(['Du gjorde tre test till', '100 % i Gångertabellen']);
  });

  it('Minnesmästare och var femte stjärna', () => {
    const st = C.defaultState(); st.tests = 10;
    expect(reasons(st, { type: 'test', data: { module: 'multdiv', pct: 10, memStar: true } })).toEqual(['Minnesmästare']);
    st.memStars = 9; st.pending = []; st.tests = 10;
    expect(reasons(st, { type: 'test', data: { module: 'multdiv', pct: 10, memStar: true } })).toEqual(['Minnesmästare för 10:e gången']);
  });

  it('Dagens träning: tre och sju dagar i rad, 100 %', () => {
    const st = C.defaultState();
    expect(reasons(st, { type: 'daily', data: { pct: 100, streak: 7 } })).toEqual([
      'Tre dagar i rad med Dagens träning', 'Sju dagar i rad med Dagens träning', '100 % i Dagens träning',
    ]);
  });

  it('övningspass: tabeller och varv', () => {
    const r = ev => { const st = C.defaultState(); st.tests = 5; return reasons(st, { type: 'ovningspass', data: { module: 'mult', pct: 50, ...ev } })[0]; };
    expect(r({ tables: [7], rounds: 4 })).toBe('Övningspass i 7:ans tabell, fyra varv');
    expect(r({ tables: [7], rounds: 1 })).toBe('Övningspass i 7:ans tabell, ett varv');
    expect(r({ tables: [3, 7], rounds: 2 })).toBe('Övningspass i 3:ans och 7:ans tabell, två varv');
    expect(r({ tables: [2, 3, 7], rounds: 3 })).toBe('Övningspass i 2:ans, 3:ans och 7:ans tabell, tre varv');
    expect(r({ tables: [2, 3, 4, 5, 6], rounds: 6 })).toBe('Övningspass i fem tabeller, sex varv');
    expect(r({})).toBe('Dagens första övningspass');
    // Andra passet samma dag, var 3:e
    const st = C.defaultState(); st.lastOvningspass = DAY; st.tests = 2;
    expect(reasons(st, { type: 'ovningspass', data: { module: 'mult', pct: 50, tables: [7], rounds: 4 } })).toEqual(['Du gjorde tre pass till']);
  });

  it('tabell: "Du kan hela 7:ans tabell"', () => {
    expect(reasons(C.defaultState(), { type: 'tabell', data: { table: 7 } })).toEqual(['Du kan hela 7:ans tabell']);
  });

  it('inga emojis i skälen', () => {
    const texts = ['first', 'three', 'medal-b', 'medal-s', 'medal-g', 'matte', 'perfect', 'mem', 's3', 's7', 'pass', 'tabell']
      .map(k => C.reasonFor(k, { type: 'test', data: { module: 'mult', table: 7, tables: [7], rounds: 4, memCount: 10 } }));
    for (const t of texts) expect(t, t).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('skälet sparas på nivån som delas ut', () => {
    Capy.award(profile, { type: 'test', data: { module: 'clock', pct: 50 } });
    const [entry] = Object.values(readCardsRaw());
    expect(entry.got[0].reason).toBe('Första testet i Klockan');
    expect(calls.unlock[0].reason).toBe('Första testet i Klockan');
  });
});

/* ── Kön ─────────────────────────────────────────────────── */
describe('pending-kön', () => {
  it('gamla strängposter blir { spec, reason:null }, skräp rensas', () => {
    const st = C.normState({ tests: 4, pending: ['vanlig', 'sallsynt', { spec: 'legendarisk', reason: 'Minnesmästare' }, 42, null, ''] });
    expect(st.pending).toEqual([
      { spec: 'vanlig', reason: null }, { spec: 'sallsynt', reason: null }, { spec: 'legendarisk', reason: 'Minnesmästare' },
    ]);
    expect(st.tables).toEqual({});
  });

  it('award() drar en gammal strängpost; nivån sparas med reason:null', () => {
    mem.set('capy_state_p1', JSON.stringify({ tests: 4, medals: { b: false, s: false, g: false }, perfect: {}, pending: ['sallsynt'] }));
    const got = Capy.award(profile, { type: 'test', data: { module: 'mult', pct: 10 } }); // test 5: ingen milstolpe
    expect(got.card.rar).toBe('sallsynt');
    expect(got.reason).toBeNull();
    expect(readCardsRaw()[got.card.id].got[0].reason).toBeNull();
    expect(readStateRaw().pending).toEqual([]);
  });

  it('max ETT kort per resultat – resten ligger kvar i kön', () => {
    const got = Capy.award(profile, { type: 'test', data: { module: 'mult', pct: 100 } }); // första + 3 milstolpar
    expect(got).not.toBeNull();
    expect(Object.keys(readCardsRaw())).toHaveLength(1);
    expect(readStateRaw().pending.length).toBeGreaterThanOrEqual(2);
  });

  it('kvotfel: köposten läggs tillbaka, inget kort sparas, ingen overlay', () => {
    const orig = MP.safeSetItem;
    MP.safeSetItem = (k, v) => (k.startsWith('capy_cards_') ? false : orig(k, v));
    try {
      const got = Capy.award(profile, { type: 'test', data: { module: 'clock', pct: 50 } });
      expect(got).toBeNull();
      expect(calls.unlock).toHaveLength(0);
      expect(readStateRaw().pending[0]).toEqual({ spec: 'vanlig', reason: 'Första testet i Klockan' });
    } finally { MP.safeSetItem = orig; }
    const got = Capy.award(profile, { type: 'test', data: { module: 'clock', pct: 10 } });
    expect(got.reason).toBe('Första testet i Klockan');
  });
});

/* ── Tabellhändelsen ─────────────────────────────────────── */
describe("händelsen 'tabell'", () => {
  it('ges en gång per tabell och profil', () => {
    const st = C.defaultState();
    C.milestones(st, { type: 'tabell', data: { table: 7 } }, DAY);
    C.milestones(st, { type: 'tabell', data: { table: 7 } }, '2026-09-24');
    C.milestones(st, { type: 'tabell', data: { table: 3 } }, DAY);
    expect(st.pending).toEqual([
      { spec: 'vanlig', reason: 'Du kan hela 7:ans tabell' },
      { spec: 'vanlig', reason: 'Du kan hela 3:ans tabell' },
    ]);
    expect(st.tables).toEqual({ 7: DAY, 3: DAY });
  });

  it('köar bara (ingen dragning); resultatets award drar sedan kortet', () => {
    expect(Capy.award(profile, { type: 'tabell', data: { table: 7 } })).toBeNull();
    expect(calls.unlock).toHaveLength(0);
    expect(mem.get('capy_cards_p1')).toBeUndefined();
    const st = readStateRaw(); st.tests = 4; mem.set('capy_state_p1', JSON.stringify(st));
    const got = Capy.award(profile, { type: 'test', data: { module: 'mult', pct: 10 } }); // test 5: ingen egen milstolpe
    expect(got.reason).toBe('Du kan hela 7:ans tabell');
    expect(got.card.rar).toBe('vanlig');
  });

  it('krockar inte med övningspassets eget kort: passets kort först, tabellkortet vid nästa resultat', () => {
    Capy.award(profile, { type: 'tabell', data: { table: 7 } });
    const a = Capy.award(profile, { type: 'ovningspass', data: { module: 'mult', pct: 50, tables: [7], rounds: 4 } });
    expect(a.reason).toBe('Övningspass i 7:ans tabell, fyra varv');
    expect(calls.unlock).toHaveLength(1);
    expect(readStateRaw().pending).toEqual([{ spec: 'vanlig', reason: 'Du kan hela 7:ans tabell' }]);
    const b = Capy.award(profile, { type: 'test', data: { module: 'mult', pct: 10 } });
    expect(b.reason).toBe('Du kan hela 7:ans tabell');
  });

  it('i uppgraderingsfasen ger tabellen en uppgradering av ett vanligt kort', () => {
    const st = C.defaultState(); st.tests = 4;
    C.milestones(st, { type: 'tabell', data: { table: 7 } }, DAY);
    const r = C.awardCore(st, allAt(1), { type: 'test', data: { module: 'mult', pct: 10 } }, DAY, NOW);
    expect(r.tier).toBe(2);
    expect(r.card.rar).toBe('vanlig');
    expect(r.cards[r.card.id].got[1].reason).toBe('Du kan hela 7:ans tabell');
  });
});

describe('fullTables (multiplication.js): bara när alla N tal är kan', () => {
  const { fullTables, freshPair, PAIRS, KEY } = MG._test;
  const fresh = () => { const p = {}; for (const [a, b] of PAIRS) p[KEY(a, b)] = freshPair(); return p; };
  const kan = (p, a, b, due = '2026-12-01') => { p[KEY(a, b)] = { ...freshPair(), box: 'kan', level: 1, due }; };

  it('7:an klar först när 7×1 … 7×10 alla är kan', () => {
    const p = fresh();
    for (let m = 1; m <= 9; m++) kan(p, 7, m);
    expect(fullTables(p, 10, [7])).toEqual([]);
    p[KEY(7, 10)].box = 'ovar';
    expect(fullTables(p, 10, [7])).toEqual([]);
    kan(p, 7, 10);
    expect(fullTables(p, 10, [7, 10])).toEqual([7]);
  });

  it('"Dags igen" (due passerat) räknas som kan', () => {
    const p = fresh();
    for (let m = 1; m <= 10; m++) kan(p, 4, m, '2020-01-01');
    expect(fullTables(p, 10, [4])).toEqual([4]);
  });

  it('N styr: med 10 räknas inte 7×11/7×12; med 12 krävs de', () => {
    const p = fresh();
    for (let m = 1; m <= 10; m++) kan(p, 7, m);
    expect(fullTables(p, 10, [7])).toEqual([7]);
    expect(fullTables(p, 12, [7])).toEqual([]);
    kan(p, 7, 11); kan(p, 7, 12);
    expect(fullTables(p, 12, [7])).toEqual([7]);
  });

  it('tabeller över N räknas inte', () => {
    const p = fresh();
    for (let m = 1; m <= 12; m++) kan(p, 11, m);
    expect(fullTables(p, 10, [11])).toEqual([]);
    expect(fullTables(p, 12, [11])).toEqual([11]);
  });
});

/* ── Samlingens räknare och datum ────────────────────────── */
describe('räknaren och datumen', () => {
  it('"24 av 24 kort · 5 silver · 0 guld"; silver/guld visas först när silverfasen börjat', () => {
    expect(C.counterText(allAt(1, { sov: 0 }))).toBe('23 av 24 kort');
    const exc = {}; ['sov', 'glass', 'bad', 'wizard', 'guld'].forEach(id => { exc[id] = 2; });
    expect(C.counterText(allAt(1, exc))).toBe('24 av 24 kort · 5 silver · 0 guld');
    expect(C.counterText(allAt(2, { drak: 3 }))).toBe('24 av 24 kort · 24 silver · 1 guld');
  });

  it('datum som "23 sep 2026"', () => {
    expect(C.fmtDate('2026-09-23T10:00:00.000Z')).toBe('23 sep 2026');
    expect(C.fmtDate(null)).toBeNull();
    expect(C.fmtDate('trasigt')).toBeNull();
  });
});
