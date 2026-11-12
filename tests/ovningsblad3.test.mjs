/* tests/ovningsblad3.test.mjs — Övningsblad · Division, plan 3 (D47, D48): den rena logiken i js/ovningsblad-logic.js */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const O = require('../js/ovningsblad-logic.js');

function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const LV = ['easy', 'hard'];
const SEEDS = Array.from({ length: 60 }, (_, i) => i + 1);

describe('modulerna', () => {
  it('åtta moduler i tre avdelningar, var och en med antal per omgång', () => {
    expect(O.MODULES.map(m => m.id)).toEqual(['grp', 'tab', 'dz', 'kd', 'trap', 'prob', 'klur', 'venn']);
    expect([...new Set(O.MODULES.map(m => m.sec))]).toEqual(['GRUNDER', 'RÄKNA', 'TÄNKA']);
    for (const m of O.MODULES) expect(O.COUNT[m.id]).toBeGreaterThan(0);
  });
  it('en omgång har rätt antal uppgifter och inga dubbletter, på båda nivåerna', () => {
    for (const m of O.MODULES) for (const lv of LV) for (const s of SEEDS.slice(0, 15)) {
      const round = O.makeRound(m.id, lv, seeded(s));
      expect(round).toHaveLength(O.COUNT[m.id]);
      expect(new Set(round.map(t => JSON.stringify(t))).size).toBe(round.length);
    }
  });
});

describe('kort division: plan(n, d)', () => {
  it('5736 / 7 = 819, rest 3, börjar med 57 hundratal', () => {
    const P = O.plan('5736', 7);
    expect(P.quot).toBe('819'); expect(P.rest).toBe(3); expect(P.start).toBe(1);
    expect(P.steps.map(s => [s.cur, s.q, s.r])).toEqual([[57, 8, 1], [13, 1, 6], [66, 9, 3]]);
  });
  it('stämmer för alla tal: kvot · nämnare + rest = täljaren', () => {
    for (let n = 100; n < 10000; n += 37) for (let d = 2; d <= 9; d++) {
      const P = O.plan(String(n), d);
      expect(Number(P.quot) * d + P.rest).toBe(n);
      expect(P.rest).toBeLessThan(d);
    }
  });
  it('generatorn: rätt antal siffror, nämnaren efter nivå, ingen nolla i kvoten och minst en växling', () => {
    for (const lv of LV) for (const s of SEEDS) {
      const { n, d } = O.genKd(lv, seeded(s)), P = O.plan(n, d);
      expect(n).toHaveLength(lv === 'easy' ? 3 : 4);
      expect(d).toBeGreaterThanOrEqual(lv === 'easy' ? 2 : 3); expect(d).toBeLessThanOrEqual(lv === 'easy' ? 5 : 9);
      expect(P.steps.every(x => x.q > 0)).toBe(true);
      expect(P.steps.some(x => !x.last && x.r > 0)).toBe(true);
    }
  });
});

describe('problemlösning', () => {
  it('går jämnt ut, rätt storlek, och berättelserna upprepas inte i en omgång', () => {
    for (const lv of LV) for (const s of SEEDS) {
      const round = O.makeRound('prob', lv, seeded(s));
      expect(new Set(round.map(t => t.si)).size).toBe(round.length);
      for (const t of round) {
        expect(t.n).toBe(t.d * t.q);
        expect(String(t.n)).toHaveLength(lv === 'easy' ? 3 : 4);
        expect(O.plan(String(t.n), t.d).rest).toBe(0);
        expect(String(t.q)).not.toMatch(/0/);
      }
    }
  });
  it('varje berättelse har tal att trycka på och en svarsmening', () => {
    for (const st of O.STORIES) { for (const k of ['a', 'b', 'c', 'pre', 'post', 'unit']) expect(st[k]).toBeTruthy(); }
  });
});

describe('kluringar', () => {
  it('tänkta talet / a / b = k', () => {
    for (const lv of LV) for (const s of SEEDS) {
      const t = O.genKlur(lv, seeded(s));
      expect(t.tot / t.a).toBe(t.mid); expect(t.mid / t.b).toBe(t.k);
    }
  });
});

describe('Vilket tal? – exakt ett tal uppfyller båda ledtrådarna', () => {
  it('svaret är det enda talet i rätt område som kan delas med k, och alla tal är olika', () => {
    for (const lv of LV) for (const s of SEEDS) {
      const t = O.genVenn(lv, seeded(s));
      const fits = t.items.filter(it => O.vennFits(t, it) && it.n % t.k === 0);
      expect(fits.map(x => x.n)).toEqual([t.answer]);
      expect(new Set(t.items.map(x => x.n)).size).toBe(t.items.length);
      expect(t.items).toHaveLength(Object.values(O.SLOTS).flat().length);
      expect(lv === 'easy' ? [2, 5] : [3, 4, 5]).toContain(t.k);
    }
  });
  it('platserna ligger i sina figurer', () => {
    const { sq, ci } = O.SHAPES;
    const inSq = (x, y) => x > sq.x && x < sq.x + sq.w && y > sq.y && y < sq.y + sq.h, inCi = (x, y) => Math.hypot(x - ci.cx, y - ci.cy) < ci.r;
    for (const [x, y] of O.SLOTS.both) expect(inSq(x, y) && inCi(x, y)).toBe(true);
    for (const [x, y] of O.SLOTS.sqOnly) expect(inSq(x, y) && !inCi(x, y)).toBe(true);
    for (const [x, y] of O.SLOTS.ciOnly) expect(!inSq(x, y) && inCi(x, y)).toBe(true);
    for (const [x, y] of [...O.SLOTS.tri, ...O.SLOTS.out]) expect(inSq(x, y) || inCi(x, y)).toBe(false);
  });
});

describe('10, 100 och 1000', () => {
  it('frågan stämmer, och omgången växlar mellan de två formerna', () => {
    for (const lv of LV) for (const s of SEEDS.slice(0, 20)) {
      const round = O.makeRound('dz', lv, seeded(s));
      for (const t of round) {
        const a = t.a === '?' ? t.ans : t.a, b = t.b === '?' ? t.ans : t.b;
        expect(a / b).toBe(t.c);
        expect(lv === 'easy' ? [10, 100] : [10, 100, 1000]).toContain(t.p);
      }
      for (let i = 1; i < round.length; i++) expect(round[i].kind).not.toBe(round[i - 1].kind);
    }
  });
});

describe('dela och gruppera, divisionstabellen', () => {
  it('Lättare utan rest, Svårare med rest och högst 50 bollar', () => {
    for (const s of SEEDS) {
      const e = O.genGrp('easy', seeded(s)), h = O.genGrp('hard', seeded(s));
      expect(e.r).toBe(0); expect(e.g * e.q).toBe(e.tot);
      expect(h.r).toBeGreaterThan(0); expect(h.r).toBeLessThan(h.g); expect(h.g * h.q + h.r).toBe(h.tot); expect(h.tot).toBeLessThanOrEqual(50);
    }
  });
  it('tabellen: tio olika tal som går jämnt ut', () => {
    for (const lv of LV) for (const s of SEEDS) {
      const items = O.genTab(lv, seeded(s));
      expect(items).toHaveLength(10);
      expect(new Set(items.map(x => x.join('/'))).size).toBe(10);
      for (const [a, b] of items) expect(a % b).toBe(0);
    }
  });
});

describe('kvittot (D39)', () => {
  it('räknar första försöket och ledtrådarna, och säger om det är 60 % eller mer', () => {
    expect(O.summary([{ first: true, hints: 1 }, { first: false, hints: 0 }, { first: true, hints: 2 }])).toEqual({ ok: 2, of: 3, hints: 3, high: true });
    expect(O.summary([{ first: false }, { first: true }, { first: false }]).high).toBe(false);
  });
});

/* Inkopplingen och felklasserna som genomspelningen 12/11 hittade (15 § 5–6: testet fångar feltypen) */
import { readFileSync } from 'node:fs';
const src = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
describe('inkopplingen i appen', () => {
  it('index.html laddar logiken före vyerna och har skärmen', () => {
    const h = src('index.html');
    const a = h.indexOf('<script src="js/ovningsblad-logic.js">'), b = h.indexOf('<script src="js/ovningsblad.js">');
    expect(a).toBeGreaterThan(0); expect(a).toBeLessThan(b);
    expect(h).toMatch(/id="screen-ovningsblad"[\s\S]{0,80}id="ov-root"/);
  });
  it('servicearbetaren cachar båda filerna, och profilens nyckel tas bort med profilen', () => {
    expect(src('sw.js')).toMatch(/'\.\/js\/ovningsblad-logic\.js'/);
    expect(src('sw.js')).toMatch(/'\.\/js\/ovningsblad\.js'/);
    expect(src('js/app.js')).toMatch(/`ovningsblad_\$\{id\}`/);
  });
  it('divisionens knapp Övningsblad öppnar plan 3', () => {
    expect(src('js/multdiv.js')).toMatch(/kind === 'div' && window\.Ovningsblad\) return Ovningsblad\.open\(profile, back\)/);
  });
});
describe('vyerna: felklasser från porteringen av mockupen', () => {
  const v = src('js/ovningsblad.js');
  it('inga selektorer mot mockupens #app (roten heter #ov-app)', () => { expect(v).not.toMatch(/['"`]#app[ .]/); });
  it('ingen lokal variabel som skuggar done()', () => { expect(v).not.toMatch(/\b(let|var) done\b/); expect(v.match(/\bconst done\b/g)).toHaveLength(1); });
  it('ingen labbkod kvar (go, syncLab, DZ, VN)', () => { expect(v).not.toMatch(/\bgo\(|syncLab|\bDZ\[|\bVN\b/); });
  it('Router nås som global const, inte som window.Router', () => { expect(v).not.toMatch(/window\.Router/); });
  it('pauser och flygningar från en lämnad vy slutar (GEN), och varje ny vy räknar upp', () => {
    expect(v).toMatch(/const W = ms => \{ const g = GEN;/);
    expect(v).toMatch(/function clearFx\(\) \{ GEN\+\+;/);
    expect(v).toMatch(/function kdShell\(title\) \{\n  clearFx\(\);/);
  });
});
