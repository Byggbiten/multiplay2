/* tests/ovningsblad.test.mjs — Övningsblad · Division (D44 ✎), den rena logiken i js/matteprov-logic.js */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const L = require('../js/matteprov-logic.js');

function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const LEVELS = ['latt', 'svar'];
const OV = L.PROVS.find(p => p.id === 'ovdiv');
const all = (moment, lv, seed, n) => L.genMoment(moment, lv, n || L.ovaCount(moment), seeded(seed));
const facit = t => t.fields.map(f => f.ans);

describe('övningsbladen: inget prov', () => {
  it('är en egen post av typen ovning med tretton moduler, utan provantal', () => {
    expect(OV.kind).toBe('ovning');
    expect(OV.moments).toEqual(L.DIV_IDS);
    expect(Object.keys(OV.provCount)).toHaveLength(0);
    for (const id of OV.moments) expect(L.MOMENTS.find(m => m.id === id)).toBeTruthy();
  });
  it('provlistan visar inte övningsbladen, och övningsbladen har ingen provknapp', () => {
    const src = readFileSync(new URL('../js/matteprov.js', import.meta.url), 'utf8');
    expect(src).toMatch(/L\.PROVS\.filter\(p => p\.kind !== 'ovning'\)/);
    const ov = src.slice(src.indexOf('function showOvning'), src.indexOf('function mittCard'));
    expect(ov).not.toMatch(/startprov|Gör provet|data-act="mitt"|sprint/);
    expect(ov).toMatch(/Öva mer på/);
  });
  it('Mitt prov tar aldrig upp övningsbladens typer', () => {
    for (const tag of ['drest', 'kortdiv:tre-rest', 'talsort', 'dz:kvot', 'dproblem:rest']) expect(L.genForTag(tag, seeded(1))).toBeNull();
  });
  it('Kort division lånar motorn på nivå 3 (med rest), aldrig nivå 4 (decimaler)', () => {
    const src = readFileSync(new URL('../js/multdiv.js', import.meta.url), 'utf8');
    expect(src).toMatch(/difficulty = div \? 3 : 4/);
  });
});

describe('alla moduler ger uppgifter på båda nivåerna', () => {
  for (const id of L.DIV_IDS) for (const lv of LEVELS) it(`${id} ${lv}`, () => {
    for (let s = 1; s <= 40; s++) {
      const items = all(id, lv, s);
      expect(items.length).toBe(L.ovaCount(id));
      for (const t of items) expect(t.moment).toBe(id);
    }
  });
});

describe('divisionen i rutor (dela, grupper, kontrollera, rest, ingår)', () => {
  const mods = ['dela', 'grupper', 'dkontroll', 'drest', 'ingar'];
  it('facit: n = d · kvot + rest, rest < d, och facit rättas som rätt', () => {
    for (const m of mods) for (const lv of LEVELS) for (let s = 1; s <= 60; s++) for (const t of all(m, lv, s)) {
      expect(t.d * t.q + t.r).toBe(t.n);
      expect(t.r).toBeLessThan(t.d);
      expect(t.rest).toBe(t.r > 0);
      expect(L.check(t, facit(t)).ok).toBe(true);
    }
  });
  it('inga lika tal i olika roller och inga dubbelsiffror (designregel 9)', () => {
    for (const m of mods) for (const lv of LEVELS) for (let s = 1; s <= 60; s++) for (const t of all(m, lv, s)) {
      const roles = t.rest ? [t.n, t.d, t.q, t.r, t.d * t.q] : [t.n, t.d, t.q];
      expect(new Set(roles).size).toBe(roles.length);
      expect(L.twinDigits(t.n)).toBe(false);
    }
  });
  it('nivågolv: Svårare har större nämnare eller skriver divisionen själv; rest bara där modulen har rest', () => {
    for (let s = 1; s <= 40; s++) {
      expect(all('drest', 'svar', s).every(t => t.n >= 20 && t.rest)).toBe(true);
      expect(all('dela', 'svar', s).every(t => t.write && !t.rest)).toBe(true);
      expect(all('dela', 'latt', s).every(t => !t.write && t.kGiven && t.pic === 'dela')).toBe(true);
      expect(all('grupper', 'latt', s).every(t => t.pic === 'grupp')).toBe(true);
      expect(all('ingar', 'latt', s).every(t => t.write && t.prompt.startsWith('Hur många gånger ingår'))).toBe(true);
      expect(all('dkontroll', 'latt', s).every(t => !t.pic && t.kontroll)).toBe(true);
    }
  });
  it('kontrollen får skrivas d · kvot eller kvot · d, men inte samma tal två gånger', () => {
    const t = L.makeDr({ n:23, d:4, moment:'drest', rest:true });
    const v = facit(t), i1 = L.drField(t, 'k1'), i2 = L.drField(t, 'k2');
    const sw = v.slice(); [sw[i1], sw[i2]] = [v[i2], v[i1]];
    expect(L.check(t, sw).ok).toBe(true);
    const same = v.slice(); same[i2] = v[i1];
    expect(L.check(t, same).ok).toBe(false);
  });
  it('fel kvot eller rest: bara divisionen pekas ut, och för stor rest är en egen felklass', () => {
    const t = L.makeDr({ n:23, d:4, moment:'drest', rest:true });     // 5, rest 3
    const v = facit(t); v[L.drField(t, 'q')] = 4; v[L.drField(t, 'r')] = 7;
    v[L.drField(t, 'k2')] = 4; v[L.drField(t, 'k3')] = 7;
    const res = L.check(t, v);
    expect(res.cls).toBe('stor');
    expect(res.wrong.filter(Boolean).length).toBe(2);
    expect(L.helpHint(t, res.cls)).toMatch(/mindre än 4/);
  });
  it('bilden: varje tryck delar ut ett varv eller ringar in en grupp, och resten blir kvar', () => {
    const t = L.makeDr({ n:17, d:3, moment:'drest', pic:'grupp', rest:true });
    expect(L.picMax(t)).toBe(5);
    expect(L.picLeft(t, 5)).toBe(2);
    expect(L.dealDone(t)).toMatch(/räcker det inte/);
  });
});

describe('frågorna ruta för ruta (Med hjälp): korta, entydiga, rätt ruta lyser', () => {
  it('varje ruta har en fråga, en ledtråd utan svaret och lyser sin egen ruta', () => {
    for (const m of ['dela', 'grupper', 'dkontroll', 'drest', 'ingar', 'talsort', 'dz', 'pengar']) for (const lv of LEVELS) for (let s = 1; s <= 20; s++) for (const t of all(m, lv, s)) {
      t.fields.forEach((f, i) => {
        const a = L.boxAsk(t, i);
        expect(a.text.length).toBeLessThan(70);
        expect(a.lit).toContain('box:' + i);
        expect(L.askPlain(L.boxHint(t, i))).not.toMatch(new RegExp(`(^|\\D)= ?${f.ans}(\\D|$)`));
      });
    }
  });
  it('frågan om kontrollens ruta säger vad som ska skrivas (inte "nämnaren gånger kvoten", som kan läsas som en uträkning)', () => {
    const t = L.makeDr({ n:23, d:4, moment:'drest', rest:true });
    expect(L.boxAsk(t, L.drField(t, 'k2')).text).toBe('Skriv kvoten.');
    expect(L.boxAsk(t, L.drField(t, 'k3')).text).toBe('Skriv resten.');
  });
});

describe('varje talsort, 10/100/1000, pengar', () => {
  it('talsort: varje siffra går jämnt att dela, kvoten stämmer, Svårare har en nolla', () => {
    for (const lv of LEVELS) for (let s = 1; s <= 80; s++) for (const t of all('talsort', lv, s)) {
      for (const f of t.fields) expect(f.dig % t.d).toBe(0);
      expect(+t.fields.map(f => f.ans).join('')).toBe(t.n / t.d);
      if (lv === 'svar') expect(t.fields.slice(1).some(f => f.dig === 0)).toBe(true);
    }
  });
  it('dz: rutorna visar svarets form, en per siffra, och Svårare har alla tre former', () => {
    for (const lv of LEVELS) for (let s = 1; s <= 40; s++) for (const t of all('dz', lv, s)) {
      expect(t.n).toBe(t.q * t.d);
      expect(+t.fields.map(f => f.ans).join('')).toBe(t.answer);
    }
    const forms = new Set(all('dz', 'svar', 3).map(t => t.form));
    expect([...forms].sort()).toEqual(['kvot', 'namnare', 'taljare']);
  });
  it('pengar: summa = antal · pris + över, över < pris', () => {
    for (const lv of LEVELS) for (let s = 1; s <= 40; s++) for (const t of all('pengar', lv, s)) {
      expect(t.q * t.price + t.r).toBe(t.sum);
      expect(t.r).toBeLessThan(t.price);
      expect(L.check(t, facit(t)).ok).toBe(true);
    }
  });
});

describe('kort division (motorns typer)', () => {
  it('varje typ stämmer med sin beskrivning', () => {
    const r = seeded(9);
    for (const ty of Object.keys(L.KD_TYPES)) for (let k = 0; k < 30; k++) {
      const t = L.genKdType(ty, r), p = L.dPass(t.n, t.d);
      expect(String(t.n).length).toBe(L.KD_TYPES[ty].len);
      expect(L.KD_TYPES[ty].ok(p)).toBe(true);
      expect(t.q * t.d + t.r).toBe(t.n);
    }
  });
  it('Svårare har tre- och fyrsiffrigt, nollor och rest', () => {
    const items = [1, 2, 3, 4, 5].flatMap(s => all('kortdiv', 'svar', s));
    expect(items.every(t => t.n >= 100)).toBe(true);
    expect(items.some(t => t.r > 0)).toBe(true);
    expect(items.some(t => t.qzero || t.skip)).toBe(true);
    expect(items.some(t => t.n >= 1000)).toBe(true);
  });
  it('motorns klasser blir "Öva mer på" i kort division, tabellfakta i divisionstabellen', () => {
    const t = L.makeKd(586, 3, 'tre-rest');
    const tags = L.tagsHard(t, 'mellanrest', { facts:[[3, 9]] });
    expect(tags).toEqual(['kortdiv:tre-rest', 'kortdiv:mellan', 'dtab:27/3']);
    expect(tags.map(L.tagMoment)).toEqual(['kortdiv', 'kortdiv', 'dtabell']);
  });
});

describe('begrepp, problemlösning och slutledning i ledda steg', () => {
  it('varje steg rättar sitt facit som rätt; division och minus i bestämd ordning', () => {
    for (const m of ['begrepp', 'dproblem', 'slutled']) for (const lv of LEVELS) for (let s = 1; s <= 40; s++) for (const t of all(m, lv, s)) {
      for (const st of t.flow) {
        expect(L.checkProbStep(st, st.ans.map(String)).ok).toBe(true);
        if (st.op === '/') {
          expect(st.ans[0]).toBe(st.ans[1] * st.ans[2] + (st.rest ? st.ans[3] : 0));
          if (st.ans[0] !== st.ans[1]) expect(L.checkProbStep(st, [st.ans[1], st.ans[0], st.ans[2], st.ans[3]].map(String)).ok).toBe(false);
        }
      }
      expect(t.concl).toBeTruthy();
    }
  });
  it('restens betydelse: "behövs" är kvoten plus en, och frågan är entydig', () => {
    for (let s = 1; s <= 40; s++) for (const t of all('dproblem', 'svar', s).filter(x => x.kind === 'behovs')) {
      const [n, d, q, r] = t.flow[0].ans;
      expect(t.answer).toBe(q + 1);
      expect(r).toBeGreaterThanOrEqual(2);
      expect(t.text).toMatch(/för att alla ska få plats/);
    }
    for (let s = 1; s <= 40; s++) for (const t of all('dproblem', 'svar', s).filter(x => x.kind === 'rest'))
      expect(t.text).toMatch(/blir fulla, och hur många .* blir över/);
  });
  it('inga lika tal i olika roller i problemtexten, inga dubbelsiffror i det totala', () => {
    for (const lv of LEVELS) for (let s = 1; s <= 40; s++) for (const t of all('dproblem', lv, s)) {
      const [n, d, q] = t.flow[0].ans;
      expect(new Set([n, d, q]).size).toBe(3);
      expect(L.twinDigits(n)).toBe(false);
    }
  });
});

describe('snällt och utan emojis', () => {
  it('ingen text i modulerna säger fel, och den nya koden har inga emojis', () => {
    const texts = [];
    for (const m of L.DIV_IDS) for (const lv of LEVELS) for (const t of all(m, lv, 3)) {
      if (t.fields) t.fields.forEach((_, i) => { if (t.type !== 'num') texts.push(L.boxAsk(t, i).text, L.boxHint(t, i), L.boxAck(t, i)); });
      if (t.flow) t.flow.forEach((_, k) => texts.push(L.probStepHint(t, k)));
      if (t.type !== 'sheet') texts.push(L.helpHint(t, 'fel'));
    }
    for (const x of texts) expect(x).not.toMatch(/Fel!|Fel svar|Tyvärr/);
    const src = readFileSync(new URL('../js/matteprov.js', import.meta.url), 'utf8');
    const ov = src.slice(src.indexOf('D44 ✎: Övningsblad · Division, stil C'), src.indexOf('/* Slutsatsen efter sista rutan */'));
    expect(ov.length).toBeGreaterThan(1000);
    expect(ov).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});

describe('runda 2 (brainstorm/13): Lättare för åk 2 och täljarens siffror', () => {
  it('Lättare håller sig till 2:an, 5:an och 10:an, med tvåsiffriga tal', () => {
    for (const m of ['dela', 'grupper', 'dkontroll', 'drest', 'ingar', 'kortdiv', 'dtabell'])
      for (let s = 1; s <= 30; s++) for (const t of all(m, 'latt', s)) {
        const d = t.d != null ? t.d : t.y, n = t.n != null ? t.n : t.x;
        expect(L.EASY_D).toContain(d);
        expect(n).toBeLessThanOrEqual(100);
      }
  });
  it('täljarens siffror är aldrig nämnaren (505/5, 24/2)', () => {
    for (const m of ['dela', 'grupper', 'dkontroll', 'drest', 'ingar', 'kortdiv', 'talsort']) for (const lv of LEVELS)
      for (let s = 1; s <= 30; s++) for (const t of all(m, lv, s)) expect(L.digitClash(t.n, t.d)).toBe(false);
  });
});

describe('fokus i full styrka (Dennis 11/11)', () => {
  it('bandet har ingen bakgrund, och nedtoningen undantar källan, målrutan och deras föräldrar', () => {
    const src = readFileSync(new URL('../js/matteprov.js', import.meta.url), 'utf8');
    expect(src).toMatch(/\.mp-band\{[^}]*background:none!important/);
    expect(src).toMatch(/\.mp-q\.mp-fm :is\([^)]*\):not\(\.mp-keep\):not\(\.mp-prompt \*\)\{filter/);
    expect(src).toMatch(/for \(const e of \[src, focus, \.\.\.q\.querySelectorAll\('\.lit'\)\]\) for \(let x = e; x && x !== q; x = x\.parentElement\) x\.classList\.add\('mp-keep'\)/);
  });
  it('bandet startar bara i exakt det tal barnet ska skriva (Dennis 11/11): ingen reserv i det som lyser', () => {
    const src = readFileSync(new URL('../js/matteprov.js', import.meta.url), 'utf8');
    const bs = src.slice(src.indexOf('function bandSource'), src.indexOf('function bandWant'));
    expect(bs).toMatch(/\[data-act="pick"\]\[data-v="\$\{want\}"\]/);
    expect(bs).not.toMatch(/\.lit, |querySelectorAll\('\.mp-frac \.lit/);
  });
});

describe('runda 4: bandet korsar aldrig text, siffror, etiketter eller bilder', () => {
  const R = (l, t, w, h) => ({ l, t, r:l + w, b:t + h });
  /* Dela lika i 390 × 797, förenklat: summan "6 grupper" ovanför, etiketten "kvot" ovanför kvotrutan */
  const box = R(0, 0, 360, 300), src = R(150, 100, 30, 26), dst = R(160, 170, 46, 46);
  const H = r => Object.assign(r, { hard:true }), S = r => Object.assign(r, { hard:false });
  const kvot = S(R(168, 155, 30, 12)), grupper = S(R(184, 104, 60, 18)), tal30 = H(R(100, 160, 40, 30));
  const rects = [kvot, grupper, tal30];
  it('dagens raka väg (källans underkant till rutans överkant) fångas av kontrollen: den korsar etiketten', () => {
    const s = { x:165, y:128 }, e = { x:183, y:168 };
    const old = L.bezierPts(s, { x:165, y:148 }, { x:183, y:148 }, e, 40);
    expect(L.pathHits(old, rects)).toBe(true);
  });
  it('vägen som väljs är kort, går inte genom siffror eller text och slutar strax utanför rutans kant', () => {
    const route = L.bandRoute(src, dst, rects, box);
    expect(route).toBeTruthy();
    expect(L.pathHits(route.pts, rects.filter(r => r.hard))).toBe(false);
    const straight = Math.hypot((dst.l + dst.r) / 2 - (src.l + src.r) / 2, (dst.t + dst.b) / 2 - (src.t + src.b) / 2);
    expect(L.ptsLen(route.pts)).toBeLessThanOrEqual(Math.min(L.BAND_HARD_MAX, L.BAND_HARD_RATIO * straight));
    const e = route.end, out = e.x < dst.l || e.x > dst.r || e.y < dst.t || e.y > dst.b;
    expect(out).toBe(true);
    const gap = Math.min(Math.abs(e.x - dst.l), Math.abs(e.x - dst.r), Math.abs(e.y - dst.t), Math.abs(e.y - dst.b));
    expect(gap).toBe(L.BAND_GAP);
  });
  it('finns ingen fri väg blir det inget band (källan får ringen i stället)', () => {
    const wall = [R(0, 130, 360, 30), R(0, 0, 140, 300), R(215, 0, 145, 300), R(0, 220, 360, 80), R(0, 0, 360, 95)].map(H);
    expect(L.bandRoute(src, dst, wall, box)).toBeNull();
  });
  it('grova fall larmar: ett band genom frågan eller längre än 2 gånger det raka avståndet blir inget band', () => {
    const fraga = H(R(0, 127, 360, 42));                     // frågans rad mellan källan och rutan, hela bredden
    expect(L.bandRoute(src, dst, [fraga], box)).toBeNull();
    const far = R(10, 10, 30, 26), near = R(300, 260, 46, 30);
    const r2 = L.bandRoute(far, near, [], box);
    expect(r2 === null || L.ptsLen(r2.pts) <= L.BAND_HARD_MAX).toBe(true);
  });
  it('drawBand använder vägen och tonar ned med gråskala (kontrasten behålls), aldrig frågan', () => {
    const src2 = readFileSync(new URL('../js/matteprov.js', import.meta.url), 'utf8');
    expect(src2).toMatch(/L\.bandRoute\(/);
    expect(src2).toMatch(/:not\(\.mp-keep\):not\(\.mp-prompt \*\)\{filter:grayscale\(1\)/);
    expect(src2).toMatch(/mp-bring/);
  });
});

describe('runda 5: bandet vilseleder inte (sidorna vänder sig mot varandra)', () => {
  /* de två vägarna samordnaren mätte i 390 × 797 */
  const cub = d => { const n = d.match(/-?\d+(\.\d+)?/g).map(Number); return L.bezierPts({ x:n[0], y:n[1] }, { x:n[2], y:n[3] }, { x:n[4], y:n[5] }, { x:n[6], y:n[7] }, 40); };
  it('Hur många grupper: ut åt höger, ner genom kvotrutan och in underifrån – underkänns', () => {
    const S = { l:135, t:160, r:163.8, b:190 }, T = { l:195, t:202, r:248, b:246.3 };   // brickan "8" och kvotrutan
    const pts = cub('M165.8 174.8 C 202.9 174.8, 221.7 290.3, 221.7 253.3');
    expect(L.sidesFace(S, T, 'r', 'b')).toBe(false);
    expect(L.entersRect(pts, T)).toBe(true);
    const r = L.bandRoute(S, T, [], { l:0, t:0, r:360, b:330 });
    expect(r === null || L.entersRect(r.pts, T) === false).toBe(true);
    if (r) expect(r.end.dir).not.toBe('up');
  });
  it('Problemlösning: ut från botten av "54" förbi "2" till täljaren – underkänns', () => {
    const S = { l:18, t:112, r:48, b:134.4 }, T = { l:125.2, t:96, r:171, b:136 }, two = { l:18, t:150, r:48, b:175, hard:true, pad:10 };
    const pts = cub('M32.8 136.4 C 32.8 170.2, 84.4 115.9, 118.2 115.9');
    expect(L.sidesFace(S, T, 'b', 'l')).toBe(false);
    expect(L.bandScore(pts, [two], 90)).toBeNull();
    const r = L.bandRoute(S, T, [two], { l:0, t:0, r:360, b:330 });
    expect(r).toBeTruthy();
    expect(r.pts[0].x).toBeGreaterThan(S.r);           // ut åt höger, mot täljaren
  });
});

describe('runda 7: Dennis fall, Hur många grupper Svårare med hjälp, nämnaren 15/3', () => {
  /* uppmätt i 390 × 797 (runda 6-koden): källan "3" i "Grupper med 3 i varje", målet nämnarrutan, grupperna och
     summabrickan emellan. Bilderna (ringarna) märks pic:true. */
  const R = (l, t, r, b, o) => Object.assign({ l, t, r, b }, o || {});
  const S = R(191, 56, 221, 86), T = R(123, 244, 176, 288), box = R(2, 2, 360, 400);
  const rects = [R(95, 58, 190, 78, { hard:true }), R(222, 58, 271, 78, { hard:true }),
    R(156, 87, 163, 106, { hard:true, pad:10 }), R(221, 87, 228, 106, { hard:true, pad:10 }),
    R(155, 92, 212, 117, { pic:true }), R(220, 92, 277, 117, { pic:true }), R(90, 92, 147, 117, { pic:true }),
    R(229, 157, 241, 192, { hard:true, pad:10 }), R(210, 232, 263, 276, {})];
  it('ingen väg genom grupperna: ringen i stället för band', () => {
    expect(L.bandRoute(S, T, rects, box)).toBeNull();
  });
});
