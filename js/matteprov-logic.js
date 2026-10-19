/* ============================================================
   MULTIPLAY – Matteprov 4:an, ren logik (D37)
   DOM-fri: provlistan, momenten, generatorer per moment och nivå,
   facit, felklassning och kvittots bedömning. Laddas före
   js/matteprov.js och exporteras även som CJS för vitest.
   Uppgifterna är egna och följer bara övningsbladens STRUKTUR
   (inga tal, priser eller texter är avskrivna, D37).
   ============================================================ */
'use strict';

(function () {

  /* ── Provlistan: ett nytt prov = en ny post här ─────────────── */
  const MOMENTS = [
    { id:'tabell',       nr:1, short:'Tabellerna',           title:'Tabellerna 1–10',             desc:'Gångertabellerna, säkert och snabbt' },
    { id:'tiotal',       nr:2, short:'Tiotal, hundratal',    title:'Gånger tiotal och hundratal', desc:'Som 8 · 40 och 50 · 60' },
    { id:'talsorter',    nr:3, short:'Dela upp T och E',     title:'Dela upp i tiotal och ental', desc:'Som 4 · 28 = 4 · 20 + 4 · 8' },
    { id:'uppstallning', nr:4, short:'Uppställning',         title:'Uppställning',                desc:'Med en- och tvåsiffrig faktor' },
    { id:'problem',      nr:5, short:'Problemlösning',       title:'Problemlösning i två steg',   desc:'Prislistan och gånger först' },
  ];
  const PROVS = [
    { id:'prov1', title:'Matteprov 1', sub:'Multiplikation', moments:MOMENTS.map(m => m.id),
      /* uppgifter per moment i "Gör provet" */
      provCount:{ tabell:20, tiotal:4, talsorter:2, uppstallning:4, problem:4 } },
  ];
  const LEVELS = [{ id:'latt', name:'Lättare' }, { id:'svar', name:'Svårare' }];
  const OVA_COUNT = 8;          // uppgifter i ett övningspass
  const TABELLTEST_COUNT = 20;  // tabelltestet: 20 tal i två kolumner, /20
  const SPRINT = { secs:240, max:48 };
  /* Tabellsprintens resultatintervall: bladets åtta steg om sex (1–6 … 43–48), parvis sammanslagna */
  const SPRINT_BANDS = [
    { lo:0,  hi:12, name:'Fortsätt nöta' },
    { lo:13, hi:24, name:'Bra fart' },
    { lo:25, hi:36, name:'Riktigt snabbt' },
    { lo:37, hi:48, name:'Tabellproffs' },
  ];
  const GREEN_PCT = 75;         // momentet blir grönt i kvittot vid minst 75 % rätt

  /* Generiska, blandade namn (D36): aldrig ihop med ort, skola, klass, ålder eller veckodag */
  const NAMES = ['Alva', 'Omar', 'Saga', 'Leo', 'Nora', 'Ali', 'Elsa', 'Hugo', 'Mira', 'Liam', 'Zelda', 'Noah', 'Ines', 'Theo'];

  /* Prislistan: egna saker och egna priser. Lättare använder bara de billiga. */
  const SHOP = [
    { id:'penna',   one:'penna',         many:'pennor',        price:7 },
    { id:'sudd',    one:'sudd',          many:'sudd',          price:4 },
    { id:'block',   one:'block',         many:'block',         price:15 },
    { id:'linjal',  one:'linjal',        many:'linjaler',      price:9 },
    { id:'boll',    one:'boll',          many:'bollar',        price:28 },
    { id:'dekal',   one:'klistermärke',  many:'klistermärken', price:3 },
  ];
  const CHEAP = ['penna', 'sudd', 'linjal', 'dekal', 'block'];

  /* ── Hjälpare ───────────────────────────────────────────────── */
  const rint = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const shuffle = (r, arr) => { const o = arr.slice(); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; };
  function digitsOf(n) { const d = []; let x = Math.max(0, Math.floor(n)); do { d.push(x % 10); x = Math.floor(x / 10); } while (x > 0); return d; }
  /* Talet som barnet läser: 4 siffror utan mellanrum, 5+ med (12 000) */
  function fmt(n) {
    const s = String(n);
    return s.length >= 5 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : s;
  }

  /* ══════════════════════════════════════════════════════════
     1. TABELLERNA 1–10
  ══════════════════════════════════════════════════════════ */
  function genTabell(level, n, r) {
    r = r || Math.random;
    const A = level === 'svar' ? [3, 4, 6, 7, 8, 9, 6, 7, 8, 9] : [2, 3, 4, 5, 10, 2, 3, 4, 5];
    const out = [], seen = new Set();
    let guard = 0;
    while (out.length < n && guard++ < 2000) {
      const a = pick(r, A), b = rint(r, 2, 10);              // ettorna är gratis och tas inte med
      const k = Math.min(a, b) + 'x' + Math.max(a, b);
      if (seen.has(k) && guard < 1500) continue;
      seen.add(k);
      const [x, y] = r() < 0.5 ? [a, b] : [b, a];
      out.push({ moment:'tabell', type:'num', x, y, answer:x * y, key:'tab' + k, text:`${x} · ${y}` });
    }
    return out;
  }
  /* Sprinten: blandat ur hela tabellen 1–10 (inga ettor, de är gratis) */
  function genSprint(r) {
    r = r || Math.random;
    const out = [];
    let prev = '';
    while (out.length < SPRINT.max) {
      const x = rint(r, 2, 10), y = rint(r, 2, 10), k = x + 'x' + y;
      if (k === prev) continue;
      prev = k;
      out.push({ moment:'tabell', type:'num', x, y, answer:x * y, key:'sp' + k, text:`${x} · ${y}` });
    }
    return out;
  }
  function sprintBand(n) { return SPRINT_BANDS.find(b => n >= b.lo && n <= b.hi) || SPRINT_BANDS[0]; }

  /* ══════════════════════════════════════════════════════════
     2. GÅNGER TIOTAL OCH HUNDRATAL
     Fällan: när tabellsvaret själv slutar på 0 (5 · 6 = 30) får
     svaret en nolla mer än faktorerna har (50 · 60 = 3000).
  ══════════════════════════════════════════════════════════ */
  const TRAP_PAIRS = [[5, 6], [4, 5], [5, 8], [2, 5], [5, 2], [6, 5], [8, 5], [5, 4]];
  const UNIT = ['ental', 'tiotal', 'hundratal', 'tusental', 'tiotusental'];
  /* Bladets form med "="-rader: 8 · 40 = 8 · 4 tiotal  (given)
                                    = [32] tiotal       (rad 1, barnet)
                                    = [320]             (rad 2, barnet) */
  function makeTiotal(a, b, za, zb) {
    const x = a * Math.pow(10, za), y = b * Math.pow(10, zb);
    const fact = a * b, zeros = za + zb, unit = UNIT[zeros];
    return { moment:'tiotal', type:'tio', x, y, a, b, za, zb, fact, zeros, unit, trap:fact % 10 === 0,
             answer:x * y, key:`tio${Math.min(x, y)}x${Math.max(x, y)}`, text:`${fmt(x)} · ${fmt(y)}`, given:`${a} · ${b} ${unit}`,
             fields:[{ ans:fact }, { ans:x * y }] };
  }
  function genTiotal(level, n, r) {
    r = r || Math.random;
    const out = [], seen = new Set();
    let guard = 0;
    while (out.length < n && guard++ < 2000) {
      let a, b, za, zb;
      const trap = level === 'svar' ? r() < 0.4 : r() < 0.15;
      if (trap) [a, b] = pick(r, TRAP_PAIRS); else { a = rint(r, 2, 9); b = rint(r, 2, 9); }
      if (level === 'svar') {
        /* båda tiotal (80 · 70) eller hundratal gånger ental/tiotal */
        const form = pick(r, [[1, 1], [1, 1], [2, 0], [0, 2], [2, 1]]);
        [za, zb] = form;
      } else {
        /* en faktor är ett tiotal eller hundratal (8 · 40, 7 · 500, 900 · 4) */
        [za, zb] = pick(r, [[0, 1], [1, 0], [0, 1], [0, 2], [2, 0]]);
      }
      /* Svårare (= provets nivå): de fyra första har alltid bladets svåraste typer –
         fällan (50 · 60), två tiotal (80 · 70), hundratal gånger ental (900 · 4) och en fälla till */
      if (level === 'svar' && out.length < 4) {
        const k = out.length;
        if (k === 0 || k === 3) [a, b] = pick(r, TRAP_PAIRS);
        [za, zb] = k === 0 || k === 1 ? [1, 1] : k === 2 ? pick(r, [[2, 0], [0, 2]]) : pick(r, [[2, 0], [0, 2], [2, 1], [1, 1]]);
      }
      const t = makeTiotal(a, b, za, zb);
      if (seen.has(t.key) && guard < 1500) continue;
      seen.add(t.key);
      out.push(t);
    }
    return level === 'svar' ? shuffle(r, out) : out;
  }
  /* 'ok' | 'nollfalla' (räknade bort tabellsvarets egen nolla) | 'nollor' (fel antal nollor)
     | 'tabell' (rätt nollor, fel tabellsvar) | 'fel' */
  function classifyTiotal(t, ans) {
    if (ans === t.answer) return 'ok';
    if (!(ans > 0)) return 'fel';
    const p = z => t.fact * Math.pow(10, z);
    if (t.trap && ans === p(t.zeros - 1)) return 'nollfalla';
    for (const z of [t.zeros - 2, t.zeros - 1, t.zeros + 1, t.zeros + 2]) if (z >= 0 && ans === p(z)) return 'nollor';
    const q = ans / Math.pow(10, t.zeros);              // nollorna rätt, tabellsvaret fel (2400 för 50 · 60)
    if (Number.isInteger(q) && q > 0 && q <= 100 && q !== t.fact) return 'tabell';
    return 'fel';
  }
  /* Rad för rad: (resp = [rad 1, rad 2]) */
  function checkTiotal(t, resp) {
    const f = resp ? resp[0] : null, a = resp ? resp[1] : null;
    const wrong = [f !== t.fact, a !== t.answer];
    if (!wrong[0] && !wrong[1]) return { ok:true, cls:'ok', wrong };
    if (wrong[0]) return { ok:false, cls:'tabell', wrong };
    return { ok:false, cls:classifyTiotal(t, a), wrong };
  }
  /* Förklaringen, ett steg i taget: tabellfaktumet först, nollorna sedan */
  function explainTiotal(t) {
    const why = t.za && t.zb ? ` ${UNIT[t.za]} gånger ${UNIT[t.zb]} blir ${t.unit}.` : '';
    const st = [];
    st.push({ text:`${t.text} är ${t.given}.${why}` });
    st.push({ text:`Räkna tabellen: ${t.a} · ${t.b} = ${t.fact}. Det blir ${t.fact} ${t.unit}.` });
    if (t.trap) st.push({ text:`Se upp: tabellsvaret ${t.fact} har redan en egen nolla. Den ska stå kvar.` });
    st.push({ text:`${t.fact} ${t.unit} är ${fmt(t.answer)}.`, last:true });
    return st;
  }

  /* ══════════════════════════════════════════════════════════
     3. TALSORTER: 4 · 28 = 4 · 20 + 4 · 8 = 80 + 32 = 112
  ══════════════════════════════════════════════════════════ */
  /* Bladets form: "4 · 28" med T och E ovanför, sedan tre "="-rader som barnet fyller i:
       = 4 · [20] + 4 · [8]    (rad 1: dela upp i tiotal och ental)
       = [80] + [32]           (rad 2: räkna delarna)
       = [112]                 (rad 3: lägg ihop) */
  function makeTalsorter(a, b) {
    const T = Math.floor(b / 10) * 10, E = b % 10;
    const fields = [
      { row:1, ans:T },
      { row:1, ans:E },
      { row:2, text:`${a} · ${T}`, ans:a * T },
      { row:2, text:`${a} · ${E}`, ans:a * E },
      { row:3, text:`${a * T} + ${a * E}`, ans:a * b },
    ];
    return { moment:'talsorter', type:'te', a, b, T, E, fields, answer:a * b, key:`te${a}x${b}`, text:`${a} · ${b}` };
  }
  const TE_MIN = 4 * 86;    // bladets minsta svåra TE-uppgift
  function genTalsorter(level, n, r) {
    r = r || Math.random;
    const out = [], seen = new Set();
    let guard = 0;
    while (out.length < n && guard++ < 2000) {
      let a, b;
      if (level === 'svar') { a = rint(r, 6, 9); b = rint(r, 51, 98); if (a * b < TE_MIN) continue; }   // minst bladets 4 · 86
      else                  { a = rint(r, 2, 5); b = rint(r, 12, 49); }
      if (b % 10 === 0 || b % 10 === 1) continue;   // ett ental att räkna, inte bara att skriva
      const t = makeTalsorter(a, b);
      /* Språket: samma tal får aldrig ha två roller i samma mening (4 · 25 ger 4 · 5 = 20 bredvid tiotalet 20) */
      if (new Set([a, t.T, t.E, a * t.T, a * t.E, t.answer]).size < 6) continue;
      if (seen.has(t.key) && guard < 1500) continue;
      seen.add(t.key);
      out.push(t);
    }
    return out;
  }
  /* Vilka rutor är fel? vals = fem tal i fältens ordning (null = tomt) */
  function checkTalsorter(t, vals) {
    const wrong = t.fields.map((f, i) => vals[i] !== f.ans);
    return { ok:!wrong.some(Boolean), wrong };
  }

  /* ══════════════════════════════════════════════════════════
     4. UPPSTÄLLNING — skolans metod med den grå rutan
     Det större talet står överst (top), det mindre under (bot).
     Tvåsiffrig faktor: rad 1 = top · entalet, rad 2 = top · tiotalet
     skrivet som tiotal: nollan i den GRÅ rutan längst till höger,
     sist summan. (Appens nivå 4 i multdiv skriver rad 2 förskjuten
     utan nolla; den rörs inte, D37.)
  ══════════════════════════════════════════════════════════ */
  /* Minnessiffror i en rad: bara kolumner FÖRE den sista (sista kolumnen skrivs hel) */
  function hasCarry(a, m) { return carryCount(a, m) > 0; }
  function carryCount(a, m) { let c = 0, n = 0; const ds = digitsOf(a); ds.forEach((d, i) => { const p = d * m + c; c = Math.floor(p / 10); if (i < ds.length - 1 && c > 0) n++; }); return n; }
  /* Glömd minnessiffra: varje kolumn skrivs mod 10, minnet läggs aldrig till
     (sista kolumnen skrivs hel) — samma regel som multdiv:s noCarryAnswer. */
  function noCarryPass(a, m) {
    const ad = digitsOf(a), ds = [];
    for (let c = 0; c < ad.length; c++) {
      const prod = ad[c] * m;
      if (c === ad.length - 1) digitsOf(prod).forEach(d => ds.push(d));
      else ds.push(prod % 10);
    }
    return ds.reduce((n, d, i) => n + d * Math.pow(10, i), 0);
  }
  function noCarrySum(x, y) {
    const d1 = digitsOf(x), d2 = digitsOf(y), len = Math.max(d1.length, d2.length), ds = [];
    for (let c = 0; c < len; c++) {
      const s = (d1[c] || 0) + (d2[c] || 0);
      if (c === len - 1) digitsOf(s).forEach(d => ds.push(d)); else ds.push(s % 10);
    }
    return ds.reduce((n, d, i) => n + d * Math.pow(10, i), 0);
  }
  function makeUpp(x, y) {
    const top = Math.max(x, y), bot = Math.min(x, y);
    const two = bot >= 10, ones = bot % 10, tens = Math.floor(bot / 10);
    const answer = top * bot;
    const t = { moment:'uppstallning', type:'upp', x, y, top, bot, two, ones, tens, answer,
                width:digitsOf(answer).length, key:`up${top}x${bot}`, text:`${x} · ${y}` };
    if (two) { t.p1 = top * ones; t.p2 = top * tens * 10; }
    /* Ensiffrig faktor (Dennis 19/10, skärmbild 687 · 8): en delprodukt per siffra, var och en på
       egen rad, förskjuten ett steg åt vänster per siffra (entalsrutan tom, ingen nolla), sedan
       summan. parts[i] = bot · siffran på plats i, skriven från kolumn i. */
    else t.parts = digitsOf(top).map((d, i) => ({ i, d, val:bot * d, place:bot * d * Math.pow(10, i) }));
    return t;
  }
  /* Additionens minnessiffror för flera tal: { col, val } (kolumnen de går till) */
  function addCarries(nums) {
    const len = Math.max(...nums.map(n => digitsOf(n).length)), out = [];
    let c = 0;
    for (let col = 0; col < len; col++) {
      const sum = nums.reduce((s, n) => s + (Math.floor(n / Math.pow(10, col)) % 10), 0) + c;
      c = Math.floor(sum / 10);
      if (c > 0 && col < len - 1) out.push({ col:col + 1, val:c });
      else if (c > 0) out.push({ col:col + 1, val:c });
    }
    return out.filter(x => x.col < digitsOf(nums.reduce((a, b) => a + b, 0)).length);
  }
  /* Glömd minnessiffra i additionen: varje kolumn mod 10, sista kolumnen hel */
  function noCarrySumN(nums) {
    const len = Math.max(...nums.map(n => digitsOf(n).length)), ds = [];
    for (let col = 0; col < len; col++) {
      const sum = nums.reduce((s, n) => s + (Math.floor(n / Math.pow(10, col)) % 10), 0);
      if (col === len - 1) digitsOf(sum).forEach(d => ds.push(d)); else ds.push(sum % 10);
    }
    return ds.reduce((n, d, i) => n + d * Math.pow(10, i), 0);
  }
  const enAddCarries = t => addCarries(t.parts.map(p => p.place)).length;
  const EN_TOP_MIN = 1000;   // fyrsiffrigt i provet (mätt i 390 × 844 med kladden)
  function genUpp(level, kind, r) {
    r = r || Math.random;
    for (let g = 0; g < 5000; g++) {
      let top, bot;
      if (kind === 'en') {
        /* Delproduktsmetoden: det svåra är antalet rader och additionens minnessiffror.
           Svårare: fyrsiffrigt (som 3 · 2475) = fyra rader + summan, minst två minnessiffror i additionen.
           Lättare: tresiffrigt, minst en. Inga nollor i det övre talet (en rad med 0 är tom pedagogik). */
        if (level === 'svar') { top = rint(r, EN_TOP_MIN, 9999); bot = rint(r, 3, 9); }
        else                  { top = rint(r, 100, 399); bot = rint(r, 2, 4); if (top * bot > 999) continue; }
        if (digitsOf(top).includes(0)) continue;
        if (enAddCarries(makeUpp(top, bot)) < (level === 'svar' ? 2 : 1)) continue;
      } else {
        if (level === 'svar') {
          /* minst bladets svåraste: tresiffrigt gånger tvåsiffrigt (286 · 17, 638 · 12) eller
             stora tvåsiffriga (79 · 84, 98 · 64). Minnessiffror i rad 1, i rad 2 (när tiotalet
             är större än 1; 1 · 286 kan inte ge minne) och i summan. */
          const three = r() < 0.5;
          if (three) { top = rint(r, 200, 999); bot = rint(r, 12, 29); }
          else       { top = rint(r, 61, 99);   bot = rint(r, 61, 99); }
          if (bot > top) [top, bot] = [bot, top];
          const o = bot % 10, te = Math.floor(bot / 10);
          if (o < 2 || top % 10 === 0) continue;
          if (carryCount(top, o) < 1 || (te > 1 && carryCount(top, te) < 1)) continue;
          if (noCarrySum(top * o, top * te * 10) === top * bot) continue;   // summan ska ha minne
        } else {
          /* inga minnessiffror i raderna (som 32 · 21 och 14 · 22) */
          top = rint(r, 12, 49); bot = rint(r, 11, 34);
          if (bot > top) [top, bot] = [bot, top];
          if (top % 10 === 0 || bot % 10 === 0 || top * bot > 999) continue;
          if (hasCarry(top, bot % 10) || hasCarry(top, Math.floor(bot / 10))) continue;
        }
        if (bot > top) [top, bot] = [bot, top];
        if (bot < 10) continue;
      }
      return r() < 0.5 ? makeUpp(top, bot) : makeUpp(bot, top);
    }
    return makeUpp(32, 17);
  }
  function genUppstallning(level, n, r) {
    r = r || Math.random;
    const out = [], seen = new Set();
    let guard = 0;
    while (out.length < n && guard++ < 500) {
      const t = genUpp(level, out.length % 2 === 0 ? 'en' : 'tva', r);
      if (seen.has(t.key) && guard < 400) continue;
      seen.add(t.key); out.push(t);
    }
    return out;
  }
  /* En rad på pappret: siffror per kolumn (index 0 = entalet), null = tom ruta */
  function rowValue(cells) {
    if (!cells || !cells.some(d => d !== null && d !== undefined)) return null;
    return cells.reduce((n, d, i) => n + (d == null ? 0 : d) * Math.pow(10, i), 0);
  }
  /* Bedömningen (D38 ✎ "raderna fylls med en fråga"): delproduktsraderna bokförs av appen efter en
     fråga per rad, så de är alltid rätt när summan rättas. Det som kan bli fel är summan:
       'summinne' glömd minnessiffra i additionen, 'addition' annat räknefel i summan, 'fel' tom summa. */
  function uppPlaces(t) { return t.two ? [t.p1, t.p2] : t.parts.map(p => p.place); }
  function classifyUpp(t, rows) {
    const s = rowValue(rows.s);
    if (s === t.answer) return 'ok';
    if (s === null) return 'fel';
    return s === noCarrySumN(uppPlaces(t)) ? 'summinne' : 'addition';
  }
  const UPP_FEEDBACK = {
    summinne:'Raderna stämmer. Glöm inte minnessiffrorna när du lägger ihop.',
    addition:'Raderna stämmer. Räkna additionen en gång till, kolumn för kolumn.',
    fel:'Lägg ihop raderna, en kolumn i taget från höger.',
  };

  /* RADFRÅGAN (Dennis 19/10, skärmbild 4689 · 6: "om appen frågar rakt ut: vad är 9 x 6? och man svarar 54,
     så bokförs det in automatiskt på sin rätta plats"). Ensiffrig faktor: en fråga per delprodukt.
     Tvåsiffrig: anteckningsrutorna, och radsumman (656) är radens svar; rad 2 börjar med nollan i den
     grå rutan som barnet skriver själv. Svaret skrivs som ett vanligt tal (vänster till höger) och
     bokförs på rätt platsvärde. Fel per rad: 1 = försök igen, 2 = ledtråd, 3 = svaret (bokförs). */
  function rowQuestion(t, row) {
    if (!t.two) {
      const p = t.parts[+row.slice(1)];
      return { text:`Vad är ${t.bot} · ${p.d}?`, answer:p.val };
    }
    const N = thinkNotes(t, row);
    return { text:`${N.prods.join(' + ')}`, answer:N.sum, notes:N };
  }
  /* Rutorna som svaret bokförs i: { row, col, val } (tvåsiffrig rad 2 börjar ett steg in, efter nollan) */
  function rowBook(t, row, value) {
    const v = value == null ? rowQuestion(t, row).answer : value;
    const start = t.two ? (row === 'p2' ? 1 : 0) : +row.slice(1);
    return digitsOf(v).map((d, k) => ({ row, col:start + k, val:d }));
  }
  const ROW_HELP = ['retry', 'hint', 'svar'];
  function rowHelpStep(n) { return n <= 0 ? null : ROW_HELP[Math.min(n, ROW_HELP.length) - 1]; }
  function rowHint(t, row) {
    if (!t.two) {
      const p = t.parts[+row.slice(1)], a = t.bot, b = p.d;
      if (b === 1) return 'Ett gånger ett tal är talet självt.';
      return `${a} · ${b - 1} = ${a * (b - 1)}. Lägg till en ${a}:a.`;
    }
    const N = thinkNotes(t, row);
    return `Uppdelningen: ${N.labels.map((l, j) => `${l} = ${N.prods[j]}`).join(' och ')}. Lägg ihop dem.`;
  }

  /* Ordningen på pappret (Dennis 19/10: "man måste fylla i allting ovanför där man fyller i slutsumman
     innan man får lov att fylla i slutsumman"): raderna fylls i tur och ordning, summan låses upp sist.
     En rad är ifylld när den har siffror i hela sitt spann: från startrutan (entalet, rad r{i} i kolumn i,
     tiotalets rad i den grå rutan) och lika många rutor som delprodukten har siffror. */
  function uppRowsOrder(t) { return t.two ? ['p1', 'p2'] : t.parts.map(p => 'r' + p.i); }
  function uppRowSpan(t, row) {
    if (row === 'p1') return [0, digitsOf(t.p1).length];
    if (row === 'p2') return [0, digitsOf(t.p2).length];
    const p = t.parts[+row.slice(1)];
    return [p.i, digitsOf(p.val).length];
  }
  function uppRowFilled(t, row, cells) {
    const [s, n] = uppRowSpan(t, row);
    for (let c = s; c < s + n; c++) if (!cells || cells[c] == null) return false;
    return true;
  }
  /* Raderna som går att skriva i: alla fram till och med den första som inte är ifylld; 's' först när alla är det */
  function uppOpenRows(t, vals) {
    const out = [];
    for (const r of uppRowsOrder(t)) { out.push(r); if (!uppRowFilled(t, r, vals && vals[r])) return out; }
    return out.concat(['s']);
  }

  /* TANKERADEN (Dennis 19/10, variant A): vägvisning ovanför rutnätet, ett led i taget och klickstyrt,
     så att texten står innan barnet skriver. Räknas inte som hjälp. I provet (mode 'prov') visas bara
     uppdelningen; resten av leden kommer bara som bitar i hjälptrappan efter fel (D37: inte lättare).
     row: 'p1' | 'p2' | 'r{i}' | 's'; col: kolumnen med fokus (bara för summan). */
  const PLACE = ['Entalet', 'Tiotalet', 'Hundratalet', 'Tusentalet', 'Tiotusentalet'];
  function placeTerms(n) { return digitsOf(n).map((d, i) => d * Math.pow(10, i)).filter(x => x > 0).reverse(); }   // 286 → [200, 80, 6]
  function thinkSteps(t, row, mode, col) {
    const prov = mode === 'prov';
    if (row === 's') {
      const nums = t.two ? [t.p1, t.p2] : t.parts.map(p => p.place);
      const c = col || 0, starts = t.two ? [0, 0] : t.parts.map(p => p.i);      // förskjutna rutor är tomma, inte nollor
      const ds = nums.map(n => Math.floor(n / Math.pow(10, c)) % 10).filter((d, k) => c >= starts[k] && nums[k] >= Math.pow(10, c));
      const carry = addCarries(nums).some(x => x.col === c);
      if (prov) return [`Lägg ihop raderna, kolumn för kolumn.`];
      return [`${PLACE[c] || 'Kolumnen'}: ${ds.join(' + ')}${carry ? ' + minnessiffran' : ''}.`];
    }
    return [];
  }

  /* TANKERADENS ANTECKNINGSRUTOR (Dennis 19/10: "hon har ingenstans att anteckna 640 + 16"), tvåsiffrig faktor:
       8 · 80 = [ ]   8 · 2 = [ ]        (en ruta per term i överfaktorn)
       640 + 16 = [ ]                    (barnets egna tal speglas; summan är radens värde)
     Rutnätets rad fylls alltid i av barnet. noteMark: Öva rättar rutan direkt ('ok'/'bad');
     provet rättar aldrig (null) och visar inga värden. Rutorna räknas inte i nötloop eller trappa. */
  function thinkNotes(t, row) {
    const m = row === 'p1' ? t.ones : t.tens, terms = placeTerms(t.top);
    return { m, terms, labels:terms.map(x => `${m} · ${x}`), prods:terms.map(x => m * x), sum:m * t.top };
  }
  function noteMark(t, row, j, val, mode) {
    if (mode === 'prov' || val === '' || val == null) return null;   // radsumman rättas i båda lägena av radfrågan, inte här
    const N = thinkNotes(t, row), want = j < N.terms.length ? N.prods[j] : N.sum;
    return +val === want ? 'ok' : 'bad';
  }

  /* Facit per rad som siffror per kolumn (för att visa svaret på pappret) */
  function uppFacitRows(t) {
    const W = t.width, row = v => { const d = digitsOf(v); return Array.from({ length:W }, (_, i) => i < d.length ? d[i] : null); };
    if (t.two) return { p1:row(t.p1), p2:row(t.p2), s:row(t.answer) };
    const out = { s:row(t.answer) };
    for (const p of t.parts) { const r = row(p.place); for (let c = 0; c < p.i; c++) r[c] = null; out['r' + p.i] = r; }   // förskjuten: ingen nolla
    return out;
  }

  /* ══════════════════════════════════════════════════════════
     5. PROBLEMLÖSNING I TVÅ STEG
  ══════════════════════════════════════════════════════════ */
  const item = id => SHOP.find(s => s.id === id);
  const qtyName = (it, q) => `${q} ${q === 1 ? it.one : it.many}`;
  function makeKop2(name, i1, q1, i2, q2) {
    const A = q1 * i1.price, B = q2 * i2.price;
    return { moment:'problem', type:'prob', kind:'kop2', unit:'kr', shop:true, needExpr:true, answer:A + B, key:`k${i1.id}${q1}${i2.id}${q2}`,
      expr:`${q1} · ${i1.price} + ${q2} · ${i2.price}`,
      text:`${name} köper ${qtyName(i1, q1)} och ${qtyName(i2, q2)}. Hur mycket kostar det tillsammans?`,
      steps:[{ text:`Steg 1, gånger först: ${q1} · ${i1.price} = ${A} kr och ${q2} · ${i2.price} = ${B} kr.` },
             { text:`Steg 2, lägg ihop: ${A} + ${B} = ${A + B} kr.`, last:true }] };
  }
  function makeTillbaka(name, it, q, pay) {
    const A = q * it.price;
    return { moment:'problem', type:'prob', kind:'tillbaka', unit:'kr', shop:true, needExpr:true, answer:pay - A, key:`t${it.id}${q}${pay}`,
      expr:`${pay} − ${q} · ${it.price}`,
      text:`${name} köper ${qtyName(it, q)} och betalar med ${pay} kr. Hur mycket får ${name} tillbaka?`,
      steps:[{ text:`Steg 1, vad kostar det: ${q} · ${it.price} = ${A} kr.` },
             { text:`Steg 2, ta bort det från ${pay} kr: ${pay} − ${A} = ${pay - A} kr.`, last:true }] };
  }
  /* Omvänd uppgift (bladets form: alla utom en är kända, summan är given) */
  function makeOmvand(k, p, x) {
    const total = k * p + x;
    return { moment:'problem', type:'prob', kind:'omvand', unit:'poäng', shop:false, needExpr:true, answer:x, key:`om${k}x${p}p${x}`,
      expr:`${total} − ${k} · ${p}`,
      text:`${k + 1} domare ger poäng i en hopptävling. ${k} av dem ger ${p} poäng var. Totalt får hopparen ${total} poäng. Hur många poäng gav den sista domaren?`,
      steps:[{ text:`Steg 1, gånger först: de ${k} domarna gav ${k} · ${p} = ${k * p} poäng.` },
             { text:`Steg 2, ta bort det från ${total}: ${total} − ${k * p} = ${x} poäng.`, last:true }] };
  }
  function makeOrdning(op, a, b, c, d) {
    if (op === '+') return { moment:'problem', type:'prob', kind:'ordning', needExpr:false, answer:a * b + c, key:`o${a}x${b}p${c}`, expr:`${a} · ${b} + ${c}`,
      text:'Räkna. Gånger först!', steps:[{ text:`Steg 1, gånger först: ${a} · ${b} = ${a * b}.` }, { text:`Steg 2, sedan plus: ${a * b} + ${c} = ${a * b + c}.`, last:true }] };
    if (op === '-') return { moment:'problem', type:'prob', kind:'ordning', needExpr:false, answer:a * b - c, key:`o${a}x${b}m${c}`, expr:`${a} · ${b} − ${c}`,
      text:'Räkna. Gånger först!', steps:[{ text:`Steg 1, gånger först: ${a} · ${b} = ${a * b}.` }, { text:`Steg 2, sedan minus: ${a * b} − ${c} = ${a * b - c}.`, last:true }] };
    return { moment:'problem', type:'prob', kind:'ordning', needExpr:false, answer:a * b + c * d, key:`o${a}x${b}p${c}x${d}`, expr:`${a} · ${b} + ${c} · ${d}`,
      text:'Räkna. Gånger först!', steps:[{ text:`Steg 1, båda gångertalen först: ${a} · ${b} = ${a * b} och ${c} · ${d} = ${c * d}.` },
                                          { text:`Steg 2, sedan plus: ${a * b} + ${c * d} = ${a * b + c * d}.`, last:true }] };
  }
  function genProblemOne(level, kind, r) {
    const name = pick(r, NAMES);
    if (kind === 'kop2') {
      const pool = level === 'svar' ? SHOP.map(s => s.id) : CHEAP;
      const [a, b] = shuffle(r, pool);
      const qa = level === 'svar' ? rint(r, 3, 6) : rint(r, 2, 4), qb = level === 'svar' ? rint(r, 2, 5) : rint(r, 2, 3);
      return makeKop2(name, item(a), qa, item(b), qb);
    }
    if (kind === 'omvand') {
      /* antalet domare och poängen får inte vara samma tal (två roller i samma mening) */
      for (;;) { const k = rint(r, 5, 8), p = rint(r, 6, 9), x = rint(r, 3, 10); if (p !== k && p !== k + 1 && x !== k && x !== k + 1 && x !== p) return makeOmvand(k, p, x); }
    }
    if (kind === 'tillbaka') {
      const it = item(pick(r, level === 'svar' ? SHOP.map(s => s.id) : CHEAP));
      const q = level === 'svar' ? rint(r, 4, 8) : rint(r, 2, 5);
      const cost = q * it.price;
      if (level === 'svar' && cost < 60) return genProblemOne(level, kind, r);   // som 200 − 6 · 26: växel på en hel sedel
      const pay = level === 'svar' ? [100, 200, 500].find(p => p > cost && p - cost >= 5) : [50, 100, 200, 500].find(p => p > cost && p - cost >= 5) || 500;
      return makeTillbaka(name, it, q, pay);
    }
    /* ordning */
    if (level === 'svar') {
      const f = pick(r, ['-', '++']);
      if (f === '-') { const a = rint(r, 6, 9), b = rint(r, 6, 9), c = rint(r, 11, a * b - 5); return makeOrdning('-', a, b, c); }
      return makeOrdning('++', rint(r, 3, 9), rint(r, 3, 9), rint(r, 3, 9), rint(r, 3, 9));
    }
    return makeOrdning('+', rint(r, 2, 9), rint(r, 2, 9), rint(r, 11, 49));
  }
  function genProblem(level, n, r) {
    r = r || Math.random;
    const kinds = level === 'svar' ? ['tillbaka', 'omvand', 'kop2', 'ordning'] : ['kop2', 'ordning', 'kop2', 'tillbaka'];
    const out = [], seen = new Set();
    let guard = 0;
    while (out.length < n && guard++ < 2000) {
      const t = genProblemOne(level, kinds[out.length % kinds.length], r);
      if (seen.has(t.key) && guard < 1500) continue;
      seen.add(t.key); out.push(t);
    }
    return out;
  }

  /* ── Uttrycket barnet skriver: tal, ·, + och − ──────────────
     parseExpr('200 − 6 · 26') → [{ sign:-1? , factors:[…] }, …] eller null om det inte går att läsa.
     Barnet får skriva uttrycket i valfri ordning; det godkänns om det har minst ett gångertal,
     minst två termer (två steg) och blir svaret. */
  function parseExpr(str) {
    const toks = String(str || '').replace(/\s+/g, '').replace(/[*x×]/g, '·').replace(/-/g, '−').match(/\d+|[·+−]|./g);
    if (!toks || !toks.length) return null;
    const terms = [];
    let sign = 1, factors = [], expectNum = true;
    for (const k of toks) {
      if (/^\d+$/.test(k)) { if (!expectNum || k.length > 4) return null; factors.push(+k); expectNum = false; }
      else if (k === '·') { if (expectNum) return null; expectNum = true; }
      else if (k === '+' || k === '−') { if (expectNum) return null; terms.push({ sign, factors }); sign = k === '+' ? 1 : -1; factors = []; expectNum = true; }
      else return null;
    }
    if (expectNum) return null;
    terms.push({ sign, factors });
    return terms;
  }
  const termVal = tm => tm.factors.reduce((a, b) => a * b, 1);
  function evalExpr(terms) { return terms ? terms.reduce((s, tm) => s + tm.sign * termVal(tm), 0) : null; }
  function exprText(terms) {
    return terms.map((tm, i) => (i ? (tm.sign > 0 ? ' + ' : ' − ') : (tm.sign < 0 ? '−' : '')) + tm.factors.join(' · ')).join('');
  }
  function exprOk(t, str) {
    const terms = parseExpr(str);
    if (!terms) return false;
    return terms.length >= 2 && terms.some(tm => tm.factors.length >= 2) && evalExpr(terms) === t.answer;
  }
  /* Stegraderna ur uttrycket, gånger först:
     rad 1 = varje gångerterm blir en ruta, övriga tal står kvar; rad 2 = [svaret]. */
  function exprRows(terms) {
    const r1 = terms.map((tm, i) => ({
      op:i ? (tm.sign > 0 ? '+' : '−') : (tm.sign < 0 ? '−' : ''),
      box:tm.factors.length >= 2, v:termVal(tm),
    }));
    return { r1, answer:evalExpr(terms), boxes:r1.filter(x => x.box).map(x => x.v).concat([evalExpr(terms)]) };
  }
  /* resp = { expr:'…', rows:[rutornas tal i ordning] } */
  function checkProblem(t, resp) {
    resp = resp || {};
    const exprStr = t.needExpr ? resp.expr : t.expr;
    const eOk = t.needExpr ? exprOk(t, exprStr) : true;
    if (!eOk) return { ok:false, cls:'uttryck' };
    const R = exprRows(parseExpr(exprStr)), vals = resp.rows || [];
    const wrong = R.boxes.map((v, i) => vals[i] !== v);
    return { ok:!wrong.some(Boolean), cls:wrong.some(Boolean) ? 'rakning' : 'ok', wrong };
  }

  /* ══════════════════════════════════════════════════════════
     PASS OCH PROV
  ══════════════════════════════════════════════════════════ */
  const GEN = { tabell:genTabell, tiotal:genTiotal, talsorter:genTalsorter, uppstallning:genUppstallning, problem:genProblem };
  function genMoment(moment, level, n, r) { return GEN[moment](level, n, r || Math.random); }
  /* Tabellerna som bladets tabelltest: 20 tal i två kolumner på EN sida, rättas med /20 */
  function makeSheet(level, r) {
    return { moment:'tabell', type:'sheet', items:genTabell(level, TABELLTEST_COUNT, r || Math.random), key:'sheet' };
  }
  /* D39: en tom ruta rättas aldrig (per[i] = null) och räknas inte som fel. Klar rättar bara när inga rutor
     är tomma (sheetEmpty === 0); annars visar appen hur många som är kvar. */
  const isEmpty = v => v === null || v === undefined || v === '';
  function sheetEmpty(vals, idxs) {
    const I = idxs || (vals || []).map((_, i) => i);
    return I.filter(i => isEmpty((vals || [])[i])).length;
  }
  function checkSheet(t, vals) {
    const per = t.items.map((it, i) => isEmpty((vals || [])[i]) ? null : +(vals[i]) === it.answer);
    const empty = per.filter(x => x === null).length;
    return { ok:per.every(x => x === true), cls:'sheet', per, okCount:per.filter(x => x === true).length, empty, canGrade:empty === 0 };
  }
  function sheetLeftText(n) { return n === 1 ? 'Du har 1 tal kvar. Fyll i det, sedan trycker du Klar.' : `Du har ${n} tal kvar. Fyll i alla, sedan trycker du Klar.`; }
  /* Övningspassets storlek: tabellerna = tabelltestet (20 tal), annars 8 */
  function ovaCount(moment) { return moment === 'tabell' ? TABELLTEST_COUNT : OVA_COUNT; }
  /* Provet: momenten i bladens ordning. Tabellerna är tabelltestet (ett blad med 20 tal).
     Provet ligger ALLTID på Svårare (= det svårare bladets nivå eller strax över, Dennis 19/10:
     "inte lättare än underlaget"); Lättare/Svårare är bara trappsteg i Öva. */
  const PROV_LEVEL = 'svar';
  function buildProv(provId, _level, r) {
    const level = PROV_LEVEL;
    r = r || Math.random;
    const P = PROVS.find(p => p.id === provId) || PROVS[0];
    const out = [];
    for (const m of P.moments) {
      if (m === 'tabell') out.push(makeSheet(level, r));
      else out.push(...genMoment(m, level, P.provCount[m], r));
    }
    return out;
  }
  /* "Öva på det som var svårt": de gula momenten, delade på ungefär OVA_COUNT uppgifter */
  function buildWeakPass(moments, level, r) {
    r = r || Math.random;
    if (!moments.length) return [];
    const per = Math.max(2, Math.ceil(OVA_COUNT / moments.length));
    const out = [];
    for (const m of moments) out.push(...genMoment(m, level, per, r));
    return out;
  }
  /* Rätta en uppgift. resp beror på typen:
     num → tal (eller null), tio → [rad 1, rad 2], te → fem tal, prob → { expr, rows },
     upp → { p1, p2, s } (siffror per kolumn), sheet → 20 tal */
  function check(t, resp) {
    if (t.type === 'num') { const ok = resp === t.answer; return { ok, cls:ok ? 'ok' : 'fel' }; }
    if (t.type === 'tio') return checkTiotal(t, resp);
    if (t.type === 'prob') return checkProblem(t, resp);
    if (t.type === 'sheet') return checkSheet(t, resp);
    if (t.type === 'te') { const c = checkTalsorter(t, resp || []); return { ok:c.ok, cls:c.ok ? 'ok' : 'fel', wrong:c.wrong }; }
    if (t.type === 'upp') { const cls = classifyUpp(t, resp || {}); return { ok:cls === 'ok', cls }; }
    return { ok:false, cls:'fel' };
  }
  /* Kvittot: rätt per moment och färgen (grön/gul) */
  function provSummary(provId, results) {
    const P = PROVS.find(p => p.id === provId) || PROVS[0];
    /* D38: ok = rätt direkt; hjalp = rätt med hjälp; svar = fick svaret. Grönt räknar bara "rätt direkt". */
    const per = P.moments.map(id => {
      const R = results.filter(x => x.moment === id);
      const ok = R.filter(x => x.ok).length, total = R.length;
      const hjalp = R.filter(x => x.outcome === 'hjalp').length, svar = R.filter(x => x.outcome === 'svar').length;
      const pct = total ? Math.round(100 * ok / total) : 0;
      return { id, ok, hjalp, svar, total, pct, green:total > 0 && pct >= GREEN_PCT };
    }).filter(p => p.total > 0 || !results.some(x => x.mitt));
    const ok = results.filter(x => x.ok).length;
    return { per, ok, total:results.length, weak:per.filter(p => p.total && !p.green).map(p => p.id) };
  }

  /* ══════════════════════════════════════════════════════════
     D38: HJÄLPTRAPPAN — fel ger först en ledtråd, sedan en bit av lösningen i taget,
     till sist hela svaret och Nästa. Bitarna följer momentets lösningsgång.
  ══════════════════════════════════════════════════════════ */
  const HELP_STEPS = ['retry', 'bit1', 'bit2', 'svar'];
  /* n = antal fel på uppgiften hittills (1, 2, 3, …); nBits = antal bitar (2, utom ensiffrig
     uppställning som har en bit per rad). Returnerar 'retry', 'bit1' … 'bitN' eller 'svar'. */
  function helpStep(n, nBits) {
    nBits = nBits || 2;
    if (n <= 0) return null;
    if (n === 1) return 'retry';
    return n - 1 <= nBits ? 'bit' + (n - 1) : 'svar';
  }

  /* Ledtråden vid första felet (inget av svaret ges bort) */
  function helpHint(t, cls) {
    if (t.type === 'tio') return { nollfalla:'Se upp med nollan i tabellsvaret. Den ska stå kvar.', nollor:'Räkna nollorna en gång till.',
      tabell:'Kolla tabellsvaret på första raden.' }[cls] || `Skriv om till ${t.unit} först, som på första raden.`;
    if (t.type === 'te') return `Dela upp ${t.b} i tiotal och ental. Räkna sedan varje del för sig.`;
    if (t.type === 'upp') return { summinne:'Glöm inte minnessiffrorna när du lägger ihop raderna.',
      addition:'Räkna additionen igen, en kolumn i taget från höger.' }[cls] || 'Lägg ihop raderna, en kolumn i taget från höger.';
    if (t.type === 'prob') {
      if (cls === 'uttryck') return { kop2:'Skriv ett gångertal för varje sort och lägg ihop dem.', tillbaka:'Vad kostar sakerna? Ta sedan bort det från det som betalas.',
        omvand:'Räkna först poängen från domarna som ger lika. Ta sedan bort dem från summan.' }[t.kind] || 'Skriv ett uttryck med gånger i.';
      return 'Räkna gånger först, sedan plus eller minus.';
    }
    if (t.type === 'num') {
      const k = Math.min(t.x, t.y) > 2 ? Math.min(t.x, t.y) - 1 : null;
      return k ? `Ta ett gångertal du kan, som ${k} · ${Math.max(t.x, t.y)}, och lägg till.` : 'Räkna upp i tabellen.';
    }
    return 'Försök igen.';
  }

  /* Bit 1 och bit 2. fill beskriver vad som skrivs in åt barnet:
       boxes: { rutans index: tal }       (tio, te, prob-raderna)
       expr:  true                         (prob: uttrycket ges)
       cells: [{ row, col, val }], mem: [{ col, val }], pulse  (upp)
     Text utan fill = en ledtråd utan att rutan fylls. */
  function helpBits(t, cls) {
    if (t.type === 'tio') return [
      { text:`${t.a} · ${t.b} = ${t.fact}. Det blir ${t.fact} ${t.unit}.`, fill:{ boxes:{ 0:t.fact } } },
      { text:`${t.fact} ${t.unit}: skriv ${t.fact} och lägg till ${['', 'en nolla', 'två nollor', 'tre nollor', 'fyra nollor'][t.zeros]} efter.` +
        (t.trap ? ` Nollan i ${t.fact} står kvar.` : ''), fill:null },
    ];
    if (t.type === 'te') {
      const f = t.fields.map(x => x.ans);
      return [
        { text:`Första raden: ${t.b} = ${f[0]} + ${f[1]}.`, fill:{ boxes:{ 0:f[0], 1:f[1] } } },
        { text:`Andra raden: ${t.a} · ${f[0]} = ${f[2]} och ${t.a} · ${f[1]} = ${f[3]}. Lägg ihop dem.`, fill:{ boxes:{ 2:f[2], 3:f[3] } } },
      ];
    }
    if (t.type === 'upp') {
      /* summans bitar: först additionens minnessiffror, sedan de två högra siffrorna i summan */
      const mem = addCarries(uppPlaces(t)), sd = digitsOf(t.answer);
      return [
        { text:mem.length ? 'Minnessiffrorna står nu ovanför raderna. Lägg till dem när du räknar.' : 'Räkna en kolumn i taget, entalet först.', fill:{ mem, cells:[] } },
        { text:'De två högra siffrorna i summan står nu där. Räkna resten.', fill:{ mem, cells:[{ row:'s', col:0, val:sd[0] }, { row:'s', col:1, val:sd[1] }] } },
      ];
    }
    if (t.type === 'prob') {
      const R = exprRows(parseExpr(t.expr)), first = {};
      R.boxes.slice(0, -1).forEach((v, i) => { first[i] = v; });
      const last = R.r1.map(x => (x.op ? ` ${x.op} ` : '') + x.v).join('');
      if (t.needExpr) return [
        { text:`Uttrycket: ${t.expr}.`, fill:{ expr:true } },
        { text:`Gånger först: ${R.r1.filter(x => x.box).map(x => `${x.v}`).join(' och ')}. Räkna sedan ${last}.`, fill:{ expr:true, boxes:first } },
      ];
      const k = Object.keys(first);
      return [
        { text:`Gånger först: börja med ${t.expr.split(/ [+−] /)[0]} = ${first[0]}.`, fill:{ boxes:{ 0:first[0] } } },
        { text:`Räkna sedan ${last}.`, fill:{ boxes:first, n:k.length } },
      ];
    }
    if (t.type === 'num') {
      const a = Math.min(t.x, t.y), b = Math.max(t.x, t.y);
      return a > 2
        ? [{ text:`${a - 1} · ${b} = ${(a - 1) * b}.`, fill:null }, { text:`${(a - 1) * b} + ${b} = ?`, fill:null }]
        : [{ text:`Räkna ${b}, ${2 * b}, …`, fill:null }, { text:`${a} · ${b} är ${a} stycken ${b}:or.`, fill:null }];
    }
    return [{ text:'', fill:null }, { text:'', fill:null }];
  }
  /* Minnessiffrorna i ett pass: { col, val } över kolumnen de går till */
  function carriesOf(a, m) {
    const ds = digitsOf(a), out = [];
    let c = 0;
    ds.forEach((d, i) => { const p = d * m + c; c = Math.floor(p / 10); if (i < ds.length - 1 && c > 0) out.push({ col:i + 1, val:c }); });
    return out;
  }

  /* ══════════════════════════════════════════════════════════
     D38: DET SOM VAR SVÅRT — typer och felklasser per moment, inte exakta tal.
     Sparas per profil i matteprov_{id} (provSt.hard). En typ glöms när barnet
     klarat den direkt FORGET_AFTER gånger i rad. (MP.spaced passar inte: den räknar
     olika dagar och kräver ett "ny"-läge; här ska det glömmas samma vecka.)
  ══════════════════════════════════════════════════════════ */
  const FORGET_AFTER = 3;
  const TAG_LABEL = {
    'tio:falla':'Nollfällan, som 50 · 60', 'tio:tvatiotal':'Tiotal gånger tiotal', 'tio:hundratal':'Hundratal gånger ental',
    'tio:tiotal':'Tiotal gånger ental', 'tio:tusental':'Hundratal gånger tiotal',
    'te':'Dela upp i tiotal och ental',
    'upp:en':'Uppställning, ensiffrig faktor', 'upp:tva':'Uppställning, tvåsiffrig faktor', 'upp:nolla':'Nollan i den grå rutan',
 'upp:minnesumma':'Minne i summan',
    'prob:tillbaka':'Växel', 'prob:omvand':'Omvända uppgifter', 'prob:kop2':'Två sorters varor', 'prob:ordning':'Gånger först',
    'prob:uttryck':'Skriva uttrycket',
  };
  function tagLabel(tag) {
    if (tag.startsWith('tab:')) { const [a, b] = tag.slice(4).split('x'); return `Tabellen ${a} · ${b}`; }
    return TAG_LABEL[tag] || tag;
  }
  const tagMoment = tag => tag.startsWith('tab:') ? 'tabell' : tag.startsWith('tio:') ? 'tiotal' : tag === 'te' ? 'talsorter' : tag.startsWith('upp:') ? 'uppstallning' : 'problem';
  function tioType(t) { const hi = Math.max(t.za, t.zb); return t.za && t.zb ? (hi >= 2 ? 'tio:tusental' : 'tio:tvatiotal') : hi >= 2 ? 'tio:hundratal' : 'tio:tiotal'; }
  /* Allt en uppgift övar (en lyckad uppgift räknas för alla dessa) */
  const factTag = (a, b) => `tab:${Math.min(a, b)}x${Math.max(a, b)}`;
  function tagsCovered(t) {
    if (t.moment === 'tabell') return [factTag(t.x, t.y)];
    if (t.type === 'tio') return [tioType(t)].concat(t.trap ? ['tio:falla'] : []);
    if (t.type === 'te') return ['te'];
    if (t.type === 'upp') {
      const sumMem = noCarrySumN(uppPlaces(t)) !== t.answer ? ['upp:minnesumma'] : [];
      if (!t.two) return ['upp:en'].concat(sumMem, t.parts.map(p => factTag(t.bot, p.d)));   // varje radfråga är ett tabellfaktum
      return ['upp:tva', 'upp:nolla'].concat(sumMem);
    }
    if (t.type === 'prob') return [`prob:${t.kind}`].concat(t.needExpr ? ['prob:uttryck'] : []);
    return [];
  }
  /* Det som var svårt i en uppgift som krävde hjälp: typen + felklassen.
     Uppställningen skickar även detaljerna: { rows:[rader som fick hjälp], grey:true om nollan blev fel } */
  function tagsHard(t, cls, detail) {
    if (t.moment === 'tabell') return tagsCovered(t);
    if (t.type === 'tio') return [tioType(t)].concat(t.trap ? ['tio:falla'] : []);
    if (t.type === 'te') return ['te'];
    if (t.type === 'upp') {
      const d = detail || {}, out = [t.two ? 'upp:tva' : 'upp:en'];
      if (cls === 'summinne' || cls === 'addition') out.push('upp:minnesumma');
      if (d.grey) out.push('upp:nolla');
      if (!t.two) for (const r of d.rows || []) { const p = t.parts[+r.slice(1)]; out.push(factTag(t.bot, p.d)); }
      return out;
    }
    if (t.type === 'prob') return [`prob:${t.kind}`].concat(cls === 'uttryck' ? ['prob:uttryck'] : []);
    return [];
  }
  /* outcome: 'direkt' | 'hjalp' | 'svar'. hard = { tag: { level, n, ok, last } } (muteras och returneras) */
  function recordOutcome(hard, t, outcome, cls, day, detail) {
    hard = hard || {};
    if (outcome === 'direkt') {
      for (const tag of tagsCovered(t)) if (hard[tag]) {
        hard[tag].ok = (hard[tag].ok || 0) + 1;
        if (hard[tag].ok >= FORGET_AFTER) delete hard[tag];
      }
      return hard;
    }
    for (const tag of tagsHard(t, cls, detail)) {
      const h = hard[tag] || { level:'hjalp', n:0, ok:0 };
      h.n++; h.ok = 0; h.last = day || null;
      if (outcome === 'svar') h.level = 'svar';
      hard[tag] = h;
    }
    return hard;
  }
  const MOMENT_ORDER = MOMENTS.map(m => m.id);
  /* De svåra typerna i ordning: momentens ordning, "fick svaret" före "fick hjälp" */
  function hardList(hard) {
    return Object.keys(hard || {}).sort((a, b) =>
      MOMENT_ORDER.indexOf(tagMoment(a)) - MOMENT_ORDER.indexOf(tagMoment(b)) ||
      (hard[a].level === 'svar' ? 0 : 1) - (hard[b].level === 'svar' ? 0 : 1) || hard[b].n - hard[a].n);
  }
  /* En ny uppgift av samma svåra typ, på minst Svårare */
  function genForTag(tag, r) {
    const lv = 'svar';
    if (tag.startsWith('tio:')) {
      const form = { 'tio:falla':pick(r, [[1, 1], [2, 0], [0, 2]]), 'tio:tvatiotal':[1, 1], 'tio:tiotal':[1, 1],
        'tio:hundratal':pick(r, [[2, 0], [0, 2]]), 'tio:tusental':pick(r, [[2, 1], [1, 2]]) }[tag] || [1, 1];
      let a, b;
      if (tag === 'tio:falla') [a, b] = pick(r, TRAP_PAIRS);
      else do { a = rint(r, 3, 9); b = rint(r, 3, 9); } while ((a * b) % 10 === 0);
      return makeTiotal(a, b, form[0], form[1]);
    }
    if (tag === 'te') return genTalsorter(lv, 1, r)[0];
    if (tag === 'upp:en') return genUpp(lv, 'en', r);
    if (tag === 'upp:minnesumma') return genUpp(lv, r() < 0.5 ? 'en' : 'tva', r);
    if (tag.startsWith('upp:')) return genUpp(lv, 'tva', r);
    if (tag === 'prob:uttryck') return genProblemOne(lv, pick(r, ['kop2', 'tillbaka', 'omvand']), r);
    if (tag.startsWith('prob:')) return genProblemOne(lv, tag.slice(5), r);
    return null;
  }
  /* Mitt prov: bara de svåra typerna, två nya uppgifter per typ (tabellfakta som ett eget blad) */
  const MITT_PER_TAG = 2, MITT_MAX = 14;
  function buildMittProv(hard, r) {
    r = r || Math.random;
    const tags = hardList(hard), out = [], seen = new Set();
    const facts = tags.filter(t => t.startsWith('tab:'));
    if (facts.length) {
      const items = [];
      for (const f of facts) { const [a, b] = f.slice(4).split('x').map(Number); items.push([a, b], [b, a]); }
      const uniq = items.filter(([a, b], i) => items.findIndex(([c, d]) => c === a && d === b) === i).slice(0, TABELLTEST_COUNT);
      out.push({ moment:'tabell', type:'sheet', key:'mittsheet',
        items:shuffle(r, uniq).map(([x, y]) => ({ moment:'tabell', type:'num', x, y, answer:x * y, key:`tab${x}x${y}`, text:`${x} · ${y}` })) });
    }
    /* varje svår typ får minst en uppgift; två var när det ryms inom MITT_MAX */
    const rest = tags.filter(t => !t.startsWith('tab:'));
    const per = rest.length * MITT_PER_TAG <= MITT_MAX ? MITT_PER_TAG : 1;
    for (const tag of rest) {
      let made = 0, guard = 0;
      while (made < per && guard++ < 50) {
        const t = genForTag(tag, r);
        if (!t || seen.has(t.key)) continue;
        seen.add(t.key); out.push(Object.assign(t, { forTag:tag })); made++;
      }
    }
    return out.sort((a, b) => MOMENT_ORDER.indexOf(a.moment) - MOMENT_ORDER.indexOf(b.moment));
  }

  /* KLADDENS HISTORIK (D38 ✎ "ångra … i flera steg" och Gör om): en lista med drag (penndrag, suddrag,
     rensa) och en pekare. Kladden ritas om från början av listan; Rensa är ett drag och går att ångra.
     Ett nytt drag efter en ångring tömmer Gör om. Ren logik, testad i vitest. */
  function createHistory() {
    let ops = [], idx = 0;
    return {
      push(op) { ops.length = idx; ops.push(op); idx = ops.length; },
      undo() { if (idx > 0) { idx--; return true; } return false; },
      redo() { if (idx < ops.length) { idx++; return true; } return false; },
      canUndo() { return idx > 0; },
      canRedo() { return idx < ops.length; },
      /* dragen som syns: allt efter den senaste Rensa före pekaren */
      visible() { const live = ops.slice(0, idx); let k = -1; live.forEach((o, i) => { if (o.type === 'clear') k = i; }); return live.slice(k + 1); },
      reset() { ops = []; idx = 0; },
      size() { return { ops:ops.length, idx }; },
    };
  }

  const API = {
    MOMENTS, PROVS, LEVELS, OVA_COUNT, TABELLTEST_COUNT, SPRINT, SPRINT_BANDS, GREEN_PCT, NAMES, SHOP,
    digitsOf, fmt,
    genTabell, genSprint, sprintBand,
    genTiotal, makeTiotal, classifyTiotal, checkTiotal, explainTiotal, UNIT,
    genTalsorter, makeTalsorter, checkTalsorter,
    genUpp, genUppstallning, makeUpp, noCarryPass, noCarrySum, rowValue, classifyUpp, UPP_FEEDBACK, uppFacitRows, hasCarry, carryCount,
    genProblem, makeKop2, makeTillbaka, makeOrdning, parseExpr, evalExpr, exprText, exprOk, exprRows, checkProblem,
    makeOmvand, PROV_LEVEL, TE_MIN,
    makeSheet, checkSheet, sheetEmpty, sheetLeftText, genMoment, ovaCount, buildProv, buildWeakPass, check, provSummary,
    uppRowsOrder, uppRowSpan, uppRowFilled, uppOpenRows, thinkSteps, placeTerms, thinkNotes, noteMark,
    uppPlaces, rowQuestion, rowBook, rowHelpStep, rowHint, createHistory, factTag,
    HELP_STEPS, helpStep, helpHint, helpBits, carriesOf, addCarries, noCarrySumN, enAddCarries, EN_TOP_MIN,
    FORGET_AFTER, tagLabel, tagMoment, tagsCovered, tagsHard, recordOutcome, hardList, genForTag, buildMittProv, MITT_PER_TAG, MITT_MAX,
  };
  if (typeof window !== 'undefined') window.MatteProvLogic = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
