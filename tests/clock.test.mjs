/* tests/clock.test.mjs — Klockans trappa (js/clock-logic.js, js/clock.js, js/capy.js)
   Ordtexten för alla 144 femminuterstider, stegen och deras tider, de riktade
   felalternativen och deras platser, visarnas koppling och dragningen, medaljerna
   och lådorna per steg (MP.spaced), Hur lång tid, Capy-händelserna och ett
   textsvep över lektions- och förklaringstexterna. */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const MP = require('../js/shared.js');
const CL = require('../js/clock-logic.js');

function seeded(seed) { return () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }; }
const FIVES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

/* ── Ordtexten ────────────────────────────────────────────── */
describe('ordtexten för alla 144 femminuterstider (MP.timeToSwedish)', () => {
  const HW = ['tolv', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva'];
  const expected = (h, m) => {
    const H = HW[h % 12], N = HW[(h + 1) % 12];
    return { 0:H, 5:`fem över ${H}`, 10:`tio över ${H}`, 15:`kvart över ${H}`, 20:`tjugo över ${H}`, 25:`fem i halv ${N}`,
             30:`halv ${N}`, 35:`fem över halv ${N}`, 40:`tjugo i ${N}`, 45:`kvart i ${N}`, 50:`tio i ${N}`, 55:`fem i ${N}` }[m];
  };
  it('varje tid 1:00–12:55 har rätt ord, och fm/em ger samma ord', () => {
    let n = 0;
    for (let h = 1; h <= 12; h++) for (const m of FIVES) {
      expect(MP.timeToSwedish(h, m), `${h}:${m}`).toBe(expected(h, m));
      expect(MP.timeToSwedish(h + 12, m), `${h + 12}:${m}`).toBe(expected(h, m));
      n++;
    }
    expect(n).toBe(144);
  });
  it('halv, fem i halv, fem över halv och i-formerna säger nästa timme – också runt tolv', () => {
    expect(MP.timeToSwedish(2, 30)).toBe('halv tre');
    expect(MP.timeToSwedish(12, 30)).toBe('halv ett');
    expect(MP.timeToSwedish(11, 45)).toBe('kvart i tolv');
    expect(MP.timeToSwedish(0, 25)).toBe('fem i halv ett');
    expect(MP.timeToSwedish(23, 55)).toBe('fem i tolv');
  });
  it('digital tid: ord och dygnsdel', () => {
    expect(CL.digitalWords(14, 30)).toBe('halv tre på eftermiddagen');
    expect(CL.digitalWords(20, 15)).toBe('kvart över åtta på kvällen');
    expect(CL.digitalWords(8, 35)).toBe('fem över halv nio på morgonen');
    expect(CL.digitalWords(2, 0)).toBe('två på natten');
    expect(CL.digitalWords(10, 50)).toBe('tio i elva på förmiddagen');
    expect(CL.digitalWords(12, 0)).toBe('tolv mitt på dagen');
    for (let h = 0; h < 24; h++) expect(CL.periodOf(h)).toBeTruthy();
  });
});

/* ── Stegen och deras tider ───────────────────────────────── */
describe('trappan: vilka tider som hör till vilket steg', () => {
  it('sju steg i ordning, tolv tider i varje, inga dubbletter', () => {
    expect(CL.STEPS.map(s => s.id)).toEqual(['hela', 'halv', 'kvart', 'ftt', 'runt', 'digital', 'tid']);
    expect(CL.STEPS.map(s => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const s of CL.STEPS) {
      expect(s.tasks, s.id).toHaveLength(12);
      expect(new Set(s.tasks.map(t => t.key)).size, s.id).toBe(12);
      s.tasks.forEach(t => expect(t.step).toBe(s.id));
    }
  });
  it('de analoga stegen: varje timme 1–12 en gång, och minuterna hör till steget', () => {
    const allowed = { hela:[0], halv:[30], kvart:[15, 45], ftt:[5, 10, 20, 40, 50, 55], runt:[25, 35] };
    for (const id of Object.keys(allowed)) {
      const s = CL.stepById(id);
      expect(s.tasks.map(t => t.h).sort((a, b) => a - b), id).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      s.tasks.forEach(t => { expect(allowed[id]).toContain(t.m); expect(CL.stepOfMinute(t.m)).toBe(id); });
      expect(new Set(s.tasks.map(t => t.m)), id).toEqual(new Set(allowed[id]));        // alla minuter i steget förekommer
    }
    // varje femminuterstid hör till exakt ett analogt steg
    FIVES.forEach(m => expect(Object.keys(allowed).filter(id => allowed[id].includes(m))).toHaveLength(1));
  });
  it('kvart: både över och i; runt halv: både fem i halv och fem över halv', () => {
    const k = CL.stepById('kvart').tasks, r = CL.stepById('runt').tasks;
    expect(k.filter(t => t.m === 15)).toHaveLength(6); expect(k.filter(t => t.m === 45)).toHaveLength(6);
    expect(r.filter(t => t.m === 25)).toHaveLength(6); expect(r.filter(t => t.m === 35)).toHaveLength(6);
    expect(CL.stepById('ftt').tasks.filter(t => t.m < 30)).toHaveLength(6);
  });
  it('digital: 24-timmarstider, de flesta efter 12', () => {
    const d = CL.stepById('digital').tasks;
    d.forEach(t => { expect(t.kind).toBe('digital'); expect(t.h).toBeGreaterThanOrEqual(0); expect(t.h).toBeLessThan(24); });
    expect(d.filter(t => t.h > 12).length).toBeGreaterThanOrEqual(9);
    expect(d.map(t => t.key)).toContain('14:30');
  });
  it('rätt svar och målet för ställfrågan', () => {
    expect(CL.answerText(CL.taskByKey('halv', '2:30'))).toBe('halv tre');
    expect(CL.answerText(CL.taskByKey('digital', '14:30'))).toBe('halv tre på eftermiddagen');
    expect(CL.answerText(CL.taskByKey('tid', '5:15-6:45'))).toBe('1 timme och 30 minuter');
    expect(CL.targetTot(CL.taskByKey('tid', '12:40-1:25'))).toBe(CL.toTot(1, 25));
    // ställfrågan börjar aldrig på svaret
    for (const s of CL.STEPS) for (const t of s.tasks) if (t.kind !== 'dur') expect(CL.sameOnDial(CL.setStart(t), CL.targetTot(t)), t.key).toBe(false);
  });
});

/* ── Hur lång tid ─────────────────────────────────────────── */
describe('Hur lång tid: skillnaden', () => {
  it('hela femminuterssteg, högst 2 timmar, alltid framåt – också förbi tolv', () => {
    for (const t of CL.stepById('tid').tasks) {
      expect(t.mins % 5, t.key).toBe(0);
      expect(t.mins, t.key).toBeGreaterThan(0);
      expect(t.mins, t.key).toBeLessThanOrEqual(120);
      expect(CL.norm(CL.toTot(t.h1, t.m1) + t.mins) % 720).toBe(CL.toTot(t.h2, t.m2) % 720);
    }
    expect(CL.taskByKey('tid', '12:40-1:25').mins).toBe(45);
    expect(CL.taskByKey('tid', '8:50-9:05').mins).toBe(15);
    expect(CL.taskByKey('tid', '2:00-4:00').mins).toBe(120);
    expect(CL.diffFwd(CL.toTot(11, 30), CL.toTot(12, 10))).toBe(40);
  });
  it('orden: minuter, timmar, båda', () => {
    expect(CL.durWords(45)).toBe('45 minuter');
    expect(CL.durWords(60)).toBe('1 timme');
    expect(CL.durWords(90)).toBe('1 timme och 30 minuter');
    expect(CL.durWords(120)).toBe('2 timmar');
    expect(CL.durWords(125)).toBe('2 timmar och 5 minuter');
    expect(CL.durWords(1)).toBe('1 minut');
  });
  it('förklaringen: först hela timmar, sedan minuterna, summan sist', () => {
    const e = CL.explainSteps(CL.taskByKey('tid', '5:15-6:45'));
    expect(e).toHaveLength(4);
    expect(e[1].text).toMatch(/^Först hela timmar/);
    expect(e[1].go).toBe(CL.toTot(6, 15));
    expect(e[2].text).toMatch(/^Sedan minuterna/);
    expect(e[2].go).toBe(CL.toTot(6, 45));
    expect(e[3].text).toBe('Det tar 1 timme och 30 minuter.');
  });
});

/* ── Felalternativen ──────────────────────────────────────── */
const ALL_TASKS = CL.STEPS.flatMap(s => s.tasks);
describe('Läs klockan: riktade felalternativ', () => {
  it('fyra alternativ, exakt ett rätt, inga två lika – varje tid, många lottningar', () => {
    for (const t of ALL_TASKS) for (let s = 1; s <= 25; s++) {
      const o = CL.readOptions(t, seeded(s * 7919 + t.key.length));
      expect(o, t.key).toHaveLength(4);
      expect(o.filter(x => x.ok), t.key).toHaveLength(1);
      expect(o.find(x => x.ok).text).toBe(CL.answerText(t));
      expect(new Set(o.map(x => x.text)).size, `${t.key}: ${o.map(x => x.text)}`).toBe(4);
      o.filter(x => !x.ok).forEach(x => expect(x.text).not.toBe(CL.answerText(t)));
    }
  });
  it('felen är de barn gör: timme runt halv, över/i, fem i/över halv, omvända visare, 5 minuter', () => {
    const types = (key, step) => new Set(Array.from({ length:30 }, (_, s) => CL.readOptions(CL.taskByKey(step, key), seeded(s + 3))).flat().filter(x => !x.ok).map(x => x.type));
    // halv tre: halv två (en timme fel) finns alltid med
    for (let s = 1; s <= 30; s++) expect(CL.readOptions(CL.taskByKey('halv', '2:30'), seeded(s)).map(x => x.text)).toContain('halv två');
    // kvart över två ↔ kvart i två (över och i förväxlade, samma timord) finns alltid med
    for (let s = 1; s <= 30; s++) expect(CL.readOptions(CL.taskByKey('kvart', '2:15'), seeded(s)).map(x => x.text)).toContain('kvart i två');
    // fem i halv två ↔ fem över halv två finns alltid med
    for (let s = 1; s <= 30; s++) expect(CL.readOptions(CL.taskByKey('runt', '1:25'), seeded(s)).map(x => x.text)).toContain('fem över halv två');
    expect(types('3:00', 'hela')).toEqual(new Set(['timme', 'omvant', 'fem']));
    expect([...types('2:30', 'halv')]).toEqual(expect.arrayContaining(['timme', 'halvhel']));
    expect([...types('3:20', 'ftt')]).toEqual(expect.arrayContaining(['overi', 'timme']));
    // digital: 14 läst som 4, fel del av dygnet
    const dig = Array.from({ length:20 }, (_, s) => CL.readOptions(CL.taskByKey('digital', '14:30'), seeded(s))).flat().map(x => x.text);
    expect(dig).toContain('halv fem på eftermiddagen');
    expect(dig).toContain('halv två på eftermiddagen');
    expect(dig).toContain('halv tre på natten');
    // hur lång tid: timmar och minuter räknade var för sig (7:45 → 8:15 som 1 timme och 30 minuter)
    expect(CL.readOptions(CL.taskByKey('tid', '7:45-8:15'), seeded(1)).map(x => x.text)).toContain('1 timme och 30 minuter');
  });
  it('de riktade felen stämmer som tider', () => {
    const r = seeded(1);
    expect(CL.wordsT(CL.wrongTime('timme', 2, 30, r))).toBe('halv två');
    expect(CL.wordsT(CL.wrongTime('overi', 2, 15, r))).toBe('kvart i två');
    expect(CL.wordsT(CL.wrongTime('overi', 2, 45, r))).toBe('kvart över tre');
    expect(CL.wordsT(CL.wrongTime('halvfem', 2, 25, r))).toBe('fem över halv tre');
    expect(CL.wordsT(CL.wrongTime('omvant', 3, 0, r))).toBe('kvart över tolv');      // minutvisaren på 12, timvisaren på 3
    expect(CL.wordsT(CL.wrongTime('halvhel', 2, 30, r))).toBe('tre');
    expect(CL.wrongTime('overi', 2, 30, r)).toBe(null);
  });
  it('platsen avslöjar inte svaret: ingen plats har rätt svar i mer än 40 %', () => {
    for (const s of CL.STEPS) {
      const pos = [0, 0, 0, 0]; let n = 0;
      const r = seeded(s.n * 101);
      for (let rep = 0; rep < 200; rep++) for (const t of s.tasks) { pos[CL.readOptions(t, r).findIndex(x => x.ok)]++; n++; }
      pos.forEach((c, i) => expect(c / n, `${s.id} plats ${i}: ${pos}`).toBeLessThanOrEqual(0.4));
      pos.forEach((c, i) => expect(c / n, `${s.id} plats ${i}: ${pos}`).toBeGreaterThan(0.1));
    }
  });
  it('samma fråga igen får en ny ordning (lottas vid varje visning)', () => {
    const t = CL.taskByKey('halv', '2:30'), orders = new Set();
    const r = seeded(9);
    for (let i = 0; i < 20; i++) orders.add(CL.readOptions(t, r).map(x => x.text).join('|'));
    expect(orders.size).toBeGreaterThan(3);
  });
});

/* ── Visarna ──────────────────────────────────────────────── */
describe('visarna: kopplingen och dragningen', () => {
  it('minutvinkeln ger timvinkeln: timvisaren står h · 30° + m · 0,5°', () => {
    for (let h = 0; h < 24; h++) for (const m of FIVES) {
      const a = CL.handAngles(CL.toTot(h, m));
      expect(a.minute).toBe(m * 6);
      expect(a.hour).toBeCloseTo(((h % 12) * 30 + m * 0.5) % 360, 6);
    }
    expect(CL.handAngles(CL.toTot(2, 30)).hour).toBe(75);            // halvvägs mellan 2 (60°) och 3 (90°)
  });
  it('minuterna snäpper till 5', () => {
    expect(CL.snapMinute(0)).toBe(0);
    expect(CL.snapMinute(14)).toBe(0);
    expect(CL.snapMinute(16)).toBe(5);
    expect(CL.snapMinute(92)).toBe(15);
    expect(CL.snapMinute(359)).toBe(0);
    for (let a = 0; a < 360; a += 7) expect(CL.snapMinute(a) % 5).toBe(0);
  });
  it('dra minutvisaren: timmen följer med, och över 12 stegar timmen upp och ner', () => {
    let t = CL.toTot(2, 50);
    t = CL.dragMinute(t, 30);                                           // 50 → 5 medurs förbi 12
    expect([CL.hOf(t), CL.mOf(t)]).toEqual([3, 5]);
    t = CL.dragMinute(t, 330);                                          // 5 → 55 moturs förbi 12
    expect([CL.hOf(t), CL.mOf(t)]).toEqual([2, 55]);
    t = CL.dragMinute(CL.toTot(2, 0), 180);                             // halvt varv utan att passera 12
    expect([CL.hOf(t), CL.mOf(t)]).toEqual([2, 30]);
    // ett helt varv i små steg medurs = en timme fram
    let u = CL.toTot(11, 0);
    for (let a = 10; a <= 360; a += 10) u = CL.dragMinute(u, a % 360);
    expect([CL.hOf(u), CL.mOf(u)]).toEqual([12, 0]);
    // och förbi midnatt
    let v = CL.toTot(23, 40);
    for (let a = 250; a <= 480; a += 10) v = CL.dragMinute(v, a % 360);          // 40 → 20 minuter över nästa timme
    expect([CL.hOf(v), CL.mOf(v)]).toEqual([0, 20]);
  });
  it('dra timvisaren: snäpper till en timme med minuternas förskjutning kvar', () => {
    let t = CL.toTot(2, 30);
    t = CL.dragHour(t, 110);                                            // nära 3:30-läget (105°)
    expect([CL.hOf(t), CL.mOf(t)]).toEqual([3, 30]);
    t = CL.dragHour(CL.toTot(11, 15), 10);                              // förbi 12 medurs
    expect([CL.hOf(t), CL.mOf(t)]).toEqual([12, 15]);
    t = CL.dragHour(CL.toTot(12, 15), 340);                             // tillbaka moturs
    expect([CL.hOf(t), CL.mOf(t)]).toEqual([11, 15]);
  });
  it('trycket väljer visare: nära mitten vid timvisaren tar timvisaren, långt ut minutvisaren', () => {
    const t = CL.toTot(3, 0);                                           // timvisare 90°, minutvisare 0°
    expect(CL.pickHand(30, 92, t)).toBe('h');
    expect(CL.pickHand(80, 92, t)).toBe('m');
    expect(CL.pickHand(40, 5, t)).toBe('m');
  });
});

/* ── Medaljer och lådor per steg ─────────────────────────── */
describe('lådorna och medaljerna per steg (samma regler som gångertabellen)', () => {
  const D = '2026-09-01', day = n => MP.spaced.addDays(D, n);
  const answerAll = (B, stepId, ok, d) => CL.stepById(stepId).tasks.forEach(t => CL.recordBox(B, stepId, t.key, ok, d));
  it('Klockan och Gångertabellen använder samma utbrutna funktioner', () => {
    const MG = require('../js/multiplication.js')._test;
    expect(MG.applyAnswer).toBe(MP.spaced.applyAnswer);
    expect(MG.INTERVALS).toBe(MP.spaced.INTERVALS);
    expect(MG.createDrill).toBe(MP.createDrill);
    expect(MG.receiptFor).toBe(MP.receiptFor);
  });
  it('ingen → brons → silver → guld, tre olika dagar till Kan', () => {
    const B = {};
    expect(CL.stepMedal(B, 'halv', D)).toMatchObject({ medal:null, kan:0, total:12 });
    answerAll(B, 'halv', true, day(0));
    expect(CL.stepMedal(B, 'halv', day(0))).toMatchObject({ medal:'brons', kan:0 });
    answerAll(B, 'halv', true, day(0));                                  // samma dag räknas en gång
    expect(CL.stepMedal(B, 'halv', day(0)).kan).toBe(0);
    answerAll(B, 'halv', true, day(1));
    const half = CL.stepById('halv').tasks.slice(0, 6);
    half.forEach(t => CL.recordBox(B, 'halv', t.key, true, day(2)));
    expect(CL.stepMedal(B, 'halv', day(2))).toMatchObject({ medal:'silver', kan:6 });
    answerAll(B, 'halv', true, day(2));
    expect(CL.stepMedal(B, 'halv', day(2))).toMatchObject({ medal:'guld', kan:12, share:1, due:0 });
  });
  it('påfyllning: intervallen 1, 3, 7, 14, 30; Dags igen räknas som Kan och ger markeringen', () => {
    const B = {};
    [0, 1, 2].forEach(n => answerAll(B, 'kvart', true, day(n)));
    const k = CL.stepById('kvart').tasks[0].key;
    expect(B.kvart[k]).toMatchObject({ box:'kan', level:1, due:day(3) });
    expect(CL.stepMedal(B, 'kvart', day(3))).toMatchObject({ medal:'guld', due:12 });
    expect(CL.stepViews(B, 'kvart', day(3))[0]).toBe('due');
    answerAll(B, 'kvart', true, day(3));
    expect(B.kvart[k]).toMatchObject({ level:2, due:day(6) });
    let d = 6;
    for (const [lvl, gap] of [[3, 7], [4, 14], [5, 30], [6, 30]]) { answerAll(B, 'kvart', true, day(d)); expect(B.kvart[k]).toMatchObject({ level:lvl, due:day(d + gap) }); d += gap; }
  });
  it('fel på Kan ger Övar; sedan räcker två dagar', () => {
    const B = {};
    const k = CL.stepById('hela').tasks[0].key;
    [0, 1, 2].forEach(n => CL.recordBox(B, 'hela', k, true, day(n)));
    CL.recordBox(B, 'hela', k, false, day(5));
    expect(B.hela[k]).toMatchObject({ box:'ovar', okDays:0, relearn:true });
    CL.recordBox(B, 'hela', k, true, day(6));
    CL.recordBox(B, 'hela', k, true, day(7));
    expect(B.hela[k]).toMatchObject({ box:'kan', level:1 });
  });
  it('sparade lådor läses tillbaka; trasiga poster och okända steg stryks', () => {
    const B = {}; answerAll(B, 'runt', true, D);
    expect(CL.validBoxes({ v:1, steps:B }).runt).toEqual(B.runt);
    expect(CL.validBoxes({ v:1, steps:{ runt:{ '1:25':{ box:'x' } }, okänd:{} } })).toEqual({ runt:{} });
    expect(CL.validBoxes(null)).toEqual({});
  });
  it('minutkartan tonas ner i takt med att steget blir säkert', () => {
    expect(CL.mapLevel(null)).toBe(1);
    expect(CL.mapLevel('brons')).toBeGreaterThan(0);
    expect(CL.mapLevel('brons')).toBeLessThan(1);
    expect(CL.mapLevel('silver')).toBe(0);
    expect(CL.mapLevel('guld')).toBe(0);
  });
});

/* ── Varven och nötloopen ─────────────────────────────────── */
describe('övningspasset: varven', () => {
  it('Läs klockan före Ställ klockan; snabbvalen; varje varv ställer stegets tolv tider i lottad ordning', () => {
    expect(CL.roundTypes({ read:2, set:1 })).toEqual(['read', 'read', 'set']);
    expect(CL.PRESETS.map(p => p.k)).toEqual(['kort', 'vanligt', 'langt']);
    expect(CL.countsFrom(null)).toEqual({ read:2, set:2 });                      // Vanligt
    expect(CL.presetFor({ read:1, set:1 })).toBe('kort');
    const rounds = CL.buildRounds('halv', { read:1, set:1 }, seeded(4));
    expect(rounds.map(r => r.type)).toEqual(['read', 'set']);
    rounds.forEach(r => expect(r.items.map(x => x.key).sort()).toEqual(CL.stepById('halv').tasks.map(t => t.key).sort()));
    expect(rounds[0].items.map(x => x.key)).not.toEqual(CL.stepById('halv').tasks.map(t => t.key));
    expect(CL.planSummary(CL.passPlan('halv', { read:2, set:2 }))).toBe('Fyra varv · 48 frågor · ungefär 10 minuter');
    expect(CL.planSummary(CL.passPlan('halv', { read:0, set:0 }))).toBe('Välj minst ett varv.');
  });
  it('nötloopen (MP.createDrill) fungerar med klockans uppgifter: fel ger samma fråga direkt och en gång till senare', () => {
    const items = CL.buildRounds('kvart', { read:1, set:0 }, seeded(2))[0].items;
    const d = MP.createDrill(items, seeded(5));
    const first = d.current().key;
    const r = d.answer(false);
    expect(d.current()).toMatchObject({ key:first, retry:true });
    expect(r.insertedAt).toBeGreaterThanOrEqual(3);
    d.answer(true);
    expect(d.queue().filter(x => x.key === first)).toHaveLength(2);
    expect(d.queue().find(x => x.key === first && x.extra)).toBeTruthy();
  });
});

/* ── Capybara ─────────────────────────────────────────────── */
describe('Capybara: klockans pass och steg', () => {
  const store = {};
  globalThis.localStorage = { getItem:k => (k in store ? store[k] : null), setItem:(k, v) => { store[k] = String(v); }, removeItem:k => { delete store[k]; } };
  globalThis.MP = MP;
  const Capy = require('../js/capy.js');
  const C = Capy._test;
  const DAY = '2026-09-23';
  it('skälet: "Övningspass på klockan: Halv, fyra varv"', () => {
    const r = d => C.reasonFor('pass', { type:'ovningspass', data:{ module:'clock', pct:80, ...d } });
    expect(r({ stepName:'Halv', rounds:4 })).toBe('Övningspass på klockan: Halv, fyra varv');
    expect(r({ stepName:'Runt halv', rounds:1 })).toBe('Övningspass på klockan: Runt halv, ett varv');
    expect(r({ stepName:'Fem, tio, tjugo', rounds:2 })).toBe('Övningspass på klockan: Fem, tio, tjugo (två varv)');
    expect(r({ tables:[7], rounds:4, module:'mult' })).toBe('Övningspass i 7:ans tabell, fyra varv');     // gångertabellen som förut
    const st = C.defaultState();
    C.milestones(st, { type:'ovningspass', data:{ module:'clock', pct:50, stepName:'Halv', rounds:4 } }, DAY);
    expect(st.pending[0]).toEqual({ spec:'vanlig', reason:'Övningspass på klockan: Halv, fyra varv' });
  });
  it('"Du kan klockans steg Halv": en gång per steg, bara köad', () => {
    const st = C.defaultState();
    C.milestones(st, { type:'klocksteg', data:{ step:'halv', name:'Halv' } }, DAY);
    C.milestones(st, { type:'klocksteg', data:{ step:'halv', name:'Halv' } }, '2026-09-24');
    C.milestones(st, { type:'klocksteg', data:{ step:'kvart', name:'Kvart' } }, DAY);
    expect(st.pending).toEqual([
      { spec:'vanlig', reason:'Du kan klockans steg Halv' },
      { spec:'vanlig', reason:'Du kan klockans steg Kvart' },
    ]);
    const out = C.awardCore(C.defaultState(), {}, { type:'klocksteg', data:{ step:'halv', name:'Halv' } }, DAY, '2026-09-23T10:00:00Z');
    expect(out.card).toBe(null);                                        // ingen dragning mitt i en fråga
    expect(out.st.pending).toHaveLength(1);
    expect(C.reasonFor('klocksteg', { type:'klocksteg', data:{ name:'Digital tid' } })).not.toMatch(/\p{Extended_Pictographic}/u);
  });
  it('äldre tillstånd utan clockSteps fungerar', () => {
    const st = C.normState({ tests:3, pending:[] });
    expect(st.clockSteps).toEqual({});
  });
});

/* ── Textsvepet ───────────────────────────────────────────── */
/* Språkreglerna (Dennis filosofi):
   1. Samma tal får aldrig ha två roller i en mening. Talen läses både som siffror och som
      ord (fem, tio, tjugo, två–tolv): "Den pekar på 5 och det heter fem i halv" ger talet 5
      två roller (en siffra på urtavlan och minuterna i ord). "10 minuter heter tio över" är
      en roll: minuterna. Klockslag (14:30) och hela tidsnamn ("fem i halv fem") bär ingen roll:
      namnet är svaret och måste sägas som det heter.
   2. Inga jämförelseord som förutsätter ett val.
   3. Inga frågor: lektioner och förklaringar består av påståenden.
   4. Inga emojis. */
const COMPARE = /(?<!\p{L})(enklare|lättare|svårare|bättre|sämre|snabbare|smartare|enklast|lättast|bäst|snabbast)(?!\p{L})/iu;
const WORDNUM = { två:2, tre:3, fyra:4, fem:5, sex:6, sju:7, åtta:8, nio:9, tio:10, elva:11, tolv:12, tjugo:20 };
/* Alla tidsnamn med minuter, längsta först ("fem i halv fem" före "halv fem"). Bara timmen ("tre")
   räknas inte som namn: där gäller ordets roll som vanligt. */
const TIME_NAMES = [...new Set(Array.from({ length:144 }, (_, i) => MP.timeToSwedish(1 + Math.floor(i / 12), (i % 12) * 5)))]
  .filter(n => n.includes(' ')).sort((a, b) => b.length - a.length).map(n => new RegExp(`(?<!\\p{L})${n}(?!\\p{L})`, 'u'));
function sentences(text) { return text.split(/(?<=[.!?])\s+/).filter(Boolean); }
function roleOf(rest, isWord) {
  if (/^\s*(minut|minuter)(?!\p{L})/u.test(rest)) return 'minuter';
  if (/^\s*(timme|timmar)(?!\p{L})/u.test(rest)) return 'timmar';
  if (/^\s*steg(?!\p{L})/u.test(rest)) return 'steg';
  if (/^\s*(hela\s+)?varv(?!\p{L})/u.test(rest)) return 'varv';
  if (isWord && /^\s+(över|i)(?!\p{L})/u.test(rest)) return 'minuter';     // "fem över", "tio i": minuterna i ord
  return isWord ? 'ord' : 'siffra';
}
function problems(text) {
  const out = [];
  for (const s of sentences(text)) {
    let prose = s.replace(/\d{1,2}:\d{2}/g, ' TID ');
    for (const name of TIME_NAMES) prose = prose.split(name).join('TID');
    const roles = new Map();
    const note = (n, r) => { if (!roles.has(n)) roles.set(n, new Set()); roles.get(n).add(r); };
    for (const m of prose.matchAll(/\d+/g)) note(Number(m[0]), roleOf(prose.slice(m.index + m[0].length), false));
    for (const m of prose.matchAll(/(?<!\p{L})(två|tre|fyra|fem|sex|sju|åtta|nio|tio|elva|tolv|tjugo)(?!\p{L})/giu))
      note(WORDNUM[m[1].toLowerCase()], roleOf(prose.slice(m.index + m[0].length), true));
    for (const [n, r] of roles) if (r.size > 1) out.push(`${n} har två roller (${[...r].join(', ')}): ${s}`);
    if (COMPARE.test(s)) out.push(`jämförelseord: ${s}`);
    if (s.trim().endsWith('?')) out.push(`fråga: ${s}`);
    if (/\p{Extended_Pictographic}/u.test(s)) out.push(`emoji: ${s}`);
  }
  return out;
}
const form = t => t.replace(/\d{1,2}:\d{2}/g, 'TT').replace(/\d+/g, '#')
  .replace(/(?<!\p{L})(ett|två|tre|fyra|fem|sex|sju|åtta|nio|tio|elva|tolv|tjugo|kvart)(?!\p{L})/giu, 'W');

describe('textsvepet – lektioner och förklaringar', () => {
  it('meta: kontrollen fäller kända fel och släpper igenom rätt', () => {
    expect(problems('Den pekar på 5, det är 5 minuter.')).toHaveLength(1);
    expect(problems('Den pekar på 5 och det heter fem i halv.')).toHaveLength(1);
    expect(problems('Den röda visaren går två hela varv. Det är 2 timmar.')).toEqual([]);
    expect(problems('Den röda visaren går två hela varv: det är 2 timmar.')).toHaveLength(1);
    expect(problems('Vilken visare är enklare?').length).toBeGreaterThanOrEqual(2);
    expect(problems('Klockan är halv tre ⏰.')).toHaveLength(1);
    expect(problems('Titta på den röda visaren. Den pekar på 5. Det är 25 minuter.')).toEqual([]);
    expect(problems('Den blå visaren står mitt emellan 2 och 3. Halv betyder halvvägs till nästa timme: tre.')).toEqual([]);
    expect(problems('14:30 är halv tre på eftermiddagen.')).toEqual([]);
    expect(problems('Klockan är fem i halv fem.')).toEqual([]);                  // tidsnamnet är svaret
    expect(problems('Den pekar på 3, klockan är tre.')).toHaveLength(1);         // timordet har kvar sin roll
  });
  it('meta: svepet täcker varje lektion och varje förklaring för varje tid i varje steg', () => {
    const texts = CL.allTexts();
    for (const id of Object.keys(CL.LESSONS)) CL.LESSONS[id].forEach(s => expect(texts).toContain(s.text));
    expect(Object.keys(CL.LESSONS).sort()).toEqual(CL.STEPS.map(s => s.id).sort());
    for (const t of ALL_TASKS) for (const mode of ['read', 'set']) CL.explainSteps(t, mode).forEach(s => expect(texts).toContain(s.text));
    expect(texts.length).toBe(Object.values(CL.LESSONS).reduce((n, l) => n + l.length, 0) + ALL_TASKS.length * 2 * 4);
  });
  it('ingen text bryter mot språkreglerna', () => {
    const bad = [...new Set(CL.allTexts().flatMap(problems))];
    expect(bad).toEqual([]);
  });
  it('antalet textformer är genomläst: 98 (växer det, läs de nya formerna och höj talet)', () => {
    expect(new Set(CL.allTexts().map(form)).size).toBe(98);
  });
  it('förklaringen vid fel: fyra klickade steg, minutvisaren först, timvisaren sedan, slutsatsen sist', () => {
    for (const t of ALL_TASKS.filter(x => x.kind === 'time')) {
      const e = CL.explainSteps(t, 'read');
      expect(e.map(x => x.hl), t.key).toEqual(['m', 'm', 'h', 'both']);
      expect(e[3].text).toBe(`Klockan är ${CL.answerText(t)}.`);
      expect(e[3].done).toBe(true);
    }
    expect(CL.explainSteps(CL.taskByKey('runt', '2:35'), 'read').map(x => x.text)).toEqual([
      'Titta på den röda visaren. Den pekar på 7. Det är 35 minuter.',
      '35 minuter är 5 minuter efter halv. Det heter fem över halv.',
      'Den blå visaren har gått lite förbi mitten mellan 2 och 3. Halv betyder halvvägs till nästa timme: tre.',
      'Klockan är fem över halv tre.',
    ]);
    // Dennis exempel: fem i halv tre
    const fih = CL.explainSteps({ kind:'time', h:2, m:25 }, 'read').map(x => x.text);
    expect(fih[0]).toBe('Titta på den röda visaren. Den pekar på 5. Det är 25 minuter.');
    expect(fih[1]).toMatch(/Det heter fem i halv\.$/);
    expect(fih[2]).toMatch(/Halv betyder halvvägs till nästa timme: tre\.$/);
    expect(fih[3]).toBe('Klockan är fem i halv tre.');
    // ställfrågan: klockan ställs rätt i första steget
    expect(CL.explainSteps({ kind:'time', h:2, m:25 }, 'set')[0]).toMatchObject({ go:true, text:'Den röda visaren ska peka på 5. Det är 25 minuter.' });
    // digital: kopplingen till urtavlan och orden
    const dg = CL.explainSteps(CL.taskByKey('digital', '14:30'));
    expect(dg[0]).toMatchObject({ show:'analog', text:'Titta på timmen: 14. Efter 12 börjar urtavlan om, så 14 är 2 på eftermiddagen.' });
    expect(dg[3].text).toBe('14:30 är halv tre på eftermiddagen.');
  });
  it('halvlektionen: halv tre betyder halvvägs till tre, med visaren som glider och timmens första halva färgad', () => {
    const L = CL.LESSONS.halv;
    const go = L.find(s => s.acts.some(a => a.do === 'go'));
    expect(go.acts.find(a => a.do === 'go').t).toBe(CL.toTot(2, 30));
    expect(L.some(s => s.acts.some(a => a.do === 'fill' && a.from === 0 && a.to === 30))).toBe(true);
    expect(L.some(s => s.acts.some(a => a.do === 'arc'))).toBe(true);
    expect(L[L.length - 1].text).toBe('Halv tre betyder halvvägs till tre.');
    // texten före rörelsen: varje steg har en text, och rörelsen ligger i acts
    for (const id in CL.LESSONS) CL.LESSONS[id].forEach(s => { expect(typeof s.text).toBe('string'); expect(Array.isArray(s.acts)).toBe(true); });
  });
});
