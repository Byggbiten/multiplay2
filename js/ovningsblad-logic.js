/* ============================================================
   MULTIPLAY – Övningsblad · Division, plan 3 (D47, D48), ren logik
   DOM-fri: modulerna, uppgifterna per modul och nivå, stegen i kort
   division (plan) och Venndiagrammet. Laddas före js/ovningsblad.js
   och exporteras även som CJS för vitest. Talen och berättelserna är
   egna (lärarens blad är bara förebild för strukturen, D37).
   Facit för vyerna: design-lab/ovningsblad-plan3.html.
   ============================================================ */
'use strict';

(function () {

  const rnd = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const shuffle = (r, a) => a.map(v => [r(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

  /* Modulerna i hubben (D47): Grunder · Räkna · Tänka */
  const MODULES = [
    { id:'grp',  sec:'GRUNDER', nr:1, name:'Dela och gruppera', sub:'lika delar, grupper, rest' },
    { id:'tab',  sec:'GRUNDER', nr:2, name:'Divisionstabellen', sub:'gånger bakom varje' },
    { id:'dz',   sec:'GRUNDER', nr:3, name:'10, 100 och 1000',  sub:'vänd på det' },
    { id:'kd',   sec:'RÄKNA',   nr:4, name:'Kort division',     sub:'stora tal, steg för steg' },
    { id:'trap', sec:'RÄKNA',   nr:5, name:'Trappan',           sub:'samma tal, steg för steg' },
    { id:'prob', sec:'TÄNKA',   nr:6, name:'Problemlösning',    sub:'skriv uträkningen, räkna' },
    { id:'klur', sec:'TÄNKA',   nr:7, name:'Kluringar',         sub:'vänd på det' },
    { id:'venn', sec:'TÄNKA',   nr:8, name:'Vilket tal?',       sub:'cirkel, kvadrat, triangel' },
  ];
  /* uppgifter per omgång (Divisionstabellen är ett blad med tio tal) */
  const COUNT = { grp:4, tab:1, dz:4, kd:3, trap:2, prob:3, klur:3, venn:3 };
  const LEVELS = [{ id:'easy', name:'Lättare' }, { id:'hard', name:'Svårare' }];
  const MODES = [{ id:'help', name:'Med hjälp' }, { id:'self', name:'Själv' }];

  /* ── Kort division: stegen räknas fram ur talet, så att samma motor bär alla tal (METOD 3) ── */
  function plan(n, d) {
    n = String(n);
    const ds = [...n].map(Number); let i = 0, cur = ds[0];
    while (cur < d && i < ds.length - 1) { i++; cur = cur * 10 + ds[i]; }
    const steps = [];
    for (; i < ds.length; i++) {
      const q = Math.floor(cur / d), r = cur - q * d;
      steps.push({ i, cur, q, p: q * d, r, last: i === ds.length - 1 });
      if (i < ds.length - 1) cur = r * 10 + ds[i + 1];
    }
    return { ds, start: steps[0].i, steps, quot: steps.map(s => s.q).join(''), rest: steps[steps.length - 1].r };
  }
  /* Ett tal som är bra att dela: inga 0 i kvoten ("0 gånger" är inget steg att lära sig på), minst en växling
     (en rest som flyttas till nästa siffra), och på Svårare börjar man ibland med två siffror. */
  function goodDiv(n, d) {
    const P = plan(n, d);
    return P.steps.every(s => s.q > 0) && P.steps.some(s => !s.last && s.r > 0);
  }
  function genKd(level, r) {
    const digits = level === 'easy' ? 3 : 4;
    for (let k = 0; k < 500; k++) {
      const d = level === 'easy' ? rnd(r, 2, 5) : rnd(r, 3, 9);
      const n = rnd(r, Math.pow(10, digits - 1), Math.pow(10, digits) - 1);
      if (goodDiv(n, d)) return { n: String(n), d };
    }
    return level === 'easy' ? { n: '573', d: 4 } : { n: '5736', d: 7 };
  }

  /* ── Problemlösning: egna berättelser, delning i lika delar som går jämnt ut ── */
  const STORIES = [
    { a:'Stafettbanan är ', b:' meter. Den delas i ', c:' lika långa sträckor. Hur lång är en sträcka?', pre:'En sträcka är', post:'meter.', unit:'m', what:'banan' },
    { a:'Biblioteket får ', b:' nya böcker. De ställs lika på ', c:' hyllor. Hur många böcker står på varje hylla?', pre:'På varje hylla står', post:'böcker.', unit:'böcker', what:'böckerna' },
    { a:'Klassen har samlat ', b:' kronor. Pengarna delas lika mellan ', c:' lag. Hur mycket får varje lag?', pre:'Varje lag får', post:'kronor.', unit:'kr', what:'pengarna' },
    { a:'Ett tåg kör ', b:' km på ', c:' dagar, lika långt varje dag. Hur långt kör tåget per dag?', pre:'Tåget kör', post:'km per dag.', unit:'km', what:'sträckan' },
    { a:'Det finns ', b:' pärlor. De delas lika i ', c:' burkar. Hur många pärlor blir det i varje burk?', pre:'I varje burk blir det', post:'pärlor.', unit:'pärlor', what:'pärlorna' },
    { a:'En bonde har ', b:' äpplen. Hon packar dem lika i ', c:' lådor. Hur många äpplen hamnar i varje låda?', pre:'I varje låda hamnar', post:'äpplen.', unit:'äpplen', what:'äpplena' },
  ];
  function genProb(level, r, used) {
    const free = STORIES.map((s, i) => i).filter(i => !(used && used.includes(i)));
    const si = pick(r, free.length ? free : STORIES.map((s, i) => i));
    const digits = level === 'easy' ? 3 : 4;
    for (let k = 0; k < 500; k++) {
      const d = level === 'easy' ? rnd(r, 2, 5) : rnd(r, 3, 9);
      const q = rnd(r, Math.ceil(Math.pow(10, digits - 1) / d), Math.floor((Math.pow(10, digits) - 1) / d));
      const n = q * d;
      if (!String(q).includes('0') && goodDiv(n, d)) return { si, n, d, q };
    }
    return { si, n: 2856, d: 4, q: 714 };
  }

  /* ── Kluringar: "först delar jag med a, sedan med b, då får jag k" (32b), löses baklänges ── */
  function genKlur(level, r) {
    const easy = level === 'easy';
    for (let k = 0; k < 100; k++) {
      const a = easy ? rnd(r, 2, 3) : rnd(r, 2, 6), b = easy ? rnd(r, 2, 3) : rnd(r, 2, 6), end = easy ? rnd(r, 2, 5) : rnd(r, 2, 9);
      if (a === b && k < 50) continue;
      const mid = end * b, tot = mid * a;
      return { a, b, k: end, mid, tot };
    }
    return { a: 3, b: 2, k: 4, mid: 8, tot: 24 };
  }

  /* ── Vilket tal? Venndiagrammet. Platserna ligger fast i figurerna (viewBox 340 × 230, som i mockupen), talen och
     ledtrådarna lottas så att EXAKT ett tal uppfyller båda ledtrådarna. ── */
  const SHAPES = { sq: { x: 40, y: 30, w: 150, h: 150 }, ci: { cx: 185, cy: 110, r: 78 }, tri: '215,205 335,120 335,222' };
  const SLOTS = {
    both:   [[148, 82], [126, 118], [160, 146]],
    sqOnly: [[62, 58], [70, 152]],
    ciOnly: [[236, 58], [244, 150]],
    tri:    [[300, 196], [318, 165]],
    out:    [[306, 28], [46, 208]],
  };
  const REGION_TEXT = {
    both:   'inuti både cirkeln och kvadraten',
    sqOnly: 'inuti kvadraten men inte i cirkeln',
    ciOnly: 'inuti cirkeln men inte i kvadraten',
    tri:    'inuti triangeln',
  };
  function genVenn(level, r) {
    const easy = level === 'easy';
    const region = easy ? pick(r, ['both', 'both', 'tri']) : pick(r, ['both', 'sqOnly', 'ciOnly', 'tri']);
    const k = easy ? pick(r, [2, 5]) : pick(r, [3, 4, 5]);
    const max = easy ? 40 : 60;
    const used = new Set();
    const multiple = () => { for (;;) { const v = k * rnd(r, 2, Math.floor(max / k)); if (!used.has(v)) { used.add(v); return v; } } };
    const nonMultiple = () => { for (;;) { const v = rnd(r, 5, max); if (v % k && !used.has(v)) { used.add(v); return v; } } };
    const items = [];
    for (const [reg, slots] of Object.entries(SLOTS)) {
      slots.forEach((xy, j) => {
        let n;
        if (reg === region) n = j === 0 ? multiple() : nonMultiple();          /* i målområdet: bara svaret kan delas */
        else n = (j === 0) ? multiple() : nonMultiple();                       /* utanför: också tal som kan delas, som lockbete */
        items.push({ n, x: xy[0], y: xy[1], reg });
      });
    }
    const answer = items.find(it => it.reg === region && it.n % k === 0).n;
    return { region, k, items: shuffle(r, items), answer, clue1: REGION_TEXT[region], clue2: `jämnt med ${k}` };
  }
  const vennFits = (t, it) => it.reg === t.region;

  /* ── 10, 100 och 1000: "a / ? = c" (det okända i mitten) och "? / p = c" (det okända först); vänd på det ── */
  function genDz(level, r, prevKind) {
    const ps = level === 'easy' ? [10, 100] : [10, 100, 1000];
    const p = pick(r, ps);
    const kind = prevKind === 'A' ? 'B' : prevKind === 'B' ? 'A' : pick(r, ['A', 'B']);
    if (kind === 'A') {                       /* a / ? = c  →  a / c = ? */
      const c = rnd(r, 2, 9), a = c * p;
      return { kind, p, a, b: '?', c, ans: p, op: '/', x: a, y: c };
    }
    const c = level === 'easy' ? rnd(r, 2, 9) : pick(r, [rnd(r, 2, 9), rnd(r, 11, 60)]);
    return { kind, p, a: '?', b: p, c, ans: c * p, op: '·', x: p, y: c };   /* ? / p = c  →  p · c = ? */
  }

  /* ── Dela och gruppera: bollar i påsar. Lättare utan rest, Svårare med rest ── */
  const NAMES = ['Ali', 'Sam', 'Noa', 'Ella', 'Leo', 'Maja', 'Ines', 'Omar'];
  function genGrp(level, r) {
    const name = pick(r, NAMES);
    if (level === 'easy') {
      const g = pick(r, [2, 5, 10]), q = g === 10 ? rnd(r, 2, 3) : rnd(r, 2, 6);
      return { name, tot: g * q, g, q, r: 0 };
    }
    for (;;) {
      const g = rnd(r, 3, 9), q = rnd(r, 2, 6), rest = rnd(r, 1, g - 1), tot = g * q + rest;
      if (tot <= 50) return { name, tot, g, q, r: rest };
    }
  }

  /* ── Divisionstabellen: tio olika tal ur tabellerna ── */
  function genTab(level, r) {
    const tables = level === 'easy' ? [2, 3, 5, 10] : [2, 3, 4, 5, 6, 7, 8, 9];
    const out = [], seen = new Set();
    while (out.length < 10) {
      const b = pick(r, tables), q = rnd(r, 2, level === 'easy' ? 10 : 9), a = b * q;
      if (seen.has(a + '/' + b)) continue;
      seen.add(a + '/' + b); out.push([a, b]);
    }
    return out;
  }

  /* en omgång: COUNT uppgifter, olika tal (och berättelser) i samma omgång */
  function makeRound(id, level, r) {
    r = r || Math.random;
    const n = COUNT[id], out = [], seen = new Set();
    let guard = 0;
    while (out.length < n && guard++ < 200) {
      let t;
      if (id === 'kd' || id === 'trap') t = genKd(level, r);
      else if (id === 'prob') t = genProb(level, r, out.map(x => x.si));
      else if (id === 'klur') t = genKlur(level, r);
      else if (id === 'venn') t = genVenn(level, r);
      else if (id === 'dz') t = genDz(level, r, out.length ? out[out.length - 1].kind : null);
      else if (id === 'grp') t = genGrp(level, r);
      else if (id === 'tab') t = genTab(level, r);
      const key = JSON.stringify(id === 'venn' ? [t.region, t.k, t.answer] : t);
      if (seen.has(key)) continue;
      seen.add(key); out.push(t);
    }
    return out;
  }

  /* kvittot: rätt på första försöket, ledtrådar; D39: under 60 % bara antalet */
  function summary(results) {
    const of = results.length, ok = results.filter(x => x.first).length, hints = results.reduce((a, x) => a + (x.hints || 0), 0);
    return { ok, of, hints, high: of > 0 && ok / of >= 0.6 };
  }

  /* Berömmet när en uppgift är klar (Dennis 12/11: "Konfetti och så där", "snurrande text", "coola ord som den yngre
     generationen gillar", "varierat så det inte bara är samma samma"). Tre nivåer som korten i Capy: vanlig,
     sällsynt och legendarisk, så att barnet ser fram emot nästa. Varje nivå är en påse som töms innan den fylls på
     igen, och samma ord kommer aldrig två gånger i rad. Inga ord med tvetydig bibetydelse (rizz, gyatt, Ohio, sus). */
  const HYPE = {
    common: ['Slay!', 'W!', 'Fire!', 'Sheesh!', 'Grymt!', 'Ate!', 'No cap!', 'Sjukt bra!', 'Ballt!', 'Snyggt!', 'Easy!',
      'Boom!', 'Galet bra!', 'Stenhårt!'],
    rare: ['Sigma!', 'GOAT!', 'Big W!', 'Aura +1000', 'Goated!', 'Main character!', 'Ate that!', 'Hjärnkraft +100',
      'Mattegeni!', 'Absolute cinema!', 'Matte-boss!', 'Insane!'],
    legend: ['Six seven!', 'Aura +9000', 'Sigma-räknare!', 'GOAT-nivå!', 'Mega-slay!', 'Ultra-W!', 'Legendariskt!'],
  };
  const HYPE_ODDS = { legend: 0.06, rare: 0.24 };   /* resten vanliga */
  function hypePicker(rand = Math.random) {
    const bags = {}; let last = '';
    const draw = tier => {
      if (!bags[tier] || !bags[tier].length) {
        const b = HYPE[tier].slice();
        for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
        if (b.length > 1 && b[b.length - 1] === last) [b[0], b[b.length - 1]] = [b[b.length - 1], b[0]];
        bags[tier] = b;
      }
      return bags[tier].pop();
    };
    return () => {
      const x = rand(), tier = x < HYPE_ODDS.legend ? 'legend' : x < HYPE_ODDS.legend + HYPE_ODDS.rare ? 'rare' : 'common';
      const word = draw(tier); last = word;
      return { word, tier };
    };
  }

  const API = { MODULES, COUNT, LEVELS, MODES, plan, goodDiv, genKd, STORIES, genProb, genKlur, SHAPES, SLOTS, REGION_TEXT, genVenn, vennFits,
    genDz, NAMES, genGrp, genTab, makeRound, summary, HYPE, hypePicker };
  if (typeof window !== 'undefined') window.OvningsbladLogic = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
