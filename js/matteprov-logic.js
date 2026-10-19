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
    { id:'tabell',       nr:1, title:'Tabellerna 1–10',             desc:'Gångertabellerna, säkert och snabbt' },
    { id:'tiotal',       nr:2, title:'Gånger tiotal och hundratal', desc:'Som 8 · 40 och 50 · 60' },
    { id:'talsorter',    nr:3, title:'Dela upp i tiotal och ental', desc:'Som 4 · 28 = 4 · 20 + 4 · 8' },
    { id:'uppstallning', nr:4, title:'Uppställning',                desc:'Med en- och tvåsiffrig faktor' },
    { id:'problem',      nr:5, title:'Problemlösning i två steg',   desc:'Prislistan och gånger först' },
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
    return t;
  }
  function genUpp(level, kind, r) {
    r = r || Math.random;
    for (let g = 0; g < 5000; g++) {
      let top, bot;
      if (kind === 'en') {
        if (level === 'svar') {
          /* minst bladets svåraste: fyrsiffrigt gånger ensiffrigt (3 · 2475) eller som 7 · 934 */
          if (r() < 0.5) { top = rint(r, 1000, 4999); bot = rint(r, 2, 9); }
          else           { top = rint(r, 600, 999);   bot = rint(r, 6, 9); }
          if (carryCount(top, bot) < 2) continue;
        } else {
          top = rint(r, 100, 399); bot = rint(r, 2, 4);
          if (top * bot > 999 || !hasCarry(top, bot)) continue;
        }
        if (top % 10 === 0) continue;
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
  /* Bedömningen: rows = { p1, p2, s } med siffror per kolumn (null = tom).
     Rätt = båda raderna och summan stämmer, med nollan i den grå rutan (som på provet,
     där uträkningen ska synas). Felklass:
       'rader'    summan stämmer men en rad saknas
       'nolla'    glömde nollan i den grå rutan (rad 2 = top · tiotalet utan nolla,
                  eller summan räknad som om nollan saknades)
       'minne'    glömde minnessiffran (i en rad eller i additionen)
       'addition' raderna stämmer men summan inte
       'fel'      annat */
  function classifyUpp(t, rows) {
    const s = rowValue(rows.s);
    if (!t.two) {
      if (s === t.answer) return 'ok';
      if (s !== null && s === noCarryPass(t.top, t.bot)) return 'minne';
      return 'fel';
    }
    const p1 = rowValue(rows.p1), p2 = rowValue(rows.p2);
    const p2cells = rows.p2 || [];
    const p2written = p2 !== null;
    const greyZero = p2cells[0] === 0;
    const noZero = t.top * t.tens;                         // 1 · 32 = 32 i stället för 320
    if (s === t.answer && p1 === t.p1 && p2 === t.p2 && greyZero) return 'ok';
    if (s === t.answer && (p1 === null || !p2written)) return 'rader';
    if (p2written && (!greyZero || p2 === noZero)) return 'nolla';
    if (s !== null && s === (p1 === null ? t.p1 : p1) + noZero) return 'nolla';
    const p1nc = noCarryPass(t.top, t.ones), p2nc = noCarryPass(t.top, t.tens) * 10;
    if ((p1 !== null && p1 !== t.p1 && p1 === p1nc) || (p2 !== null && p2 !== t.p2 && p2 === p2nc)) return 'minne';
    if (s !== null && s !== t.answer && (s === noCarrySum(p1 === null ? t.p1 : p1, p2 === null ? t.p2 : p2) || s === noCarrySum(p1nc, p2nc))) return 'minne';
    if (p1 === t.p1 && p2 === t.p2 && s !== t.answer) return 'addition';
    return 'fel';
  }
  const UPP_FEEDBACK = {
    rader:'Summan stämmer! Skriv också båda raderna, med nollan i den grå rutan. På provet ska uträkningen synas.',
    nolla:'Du glömde nollan i den grå rutan. Raden för tiotalet börjar alltid med en nolla där.',
    minne:'Du glömde minnessiffran. Skriv den liten ovanför och lägg till den i nästa kolumn.',
    addition:'Raderna stämmer. Räkna additionen en gång till, kolumn för kolumn.',
    fel:'Jämför med facit, kolumn för kolumn.',
  };
  /* Facit per rad som siffror per kolumn (för att visa svaret på pappret) */
  function uppFacitRows(t) {
    const W = t.width, row = v => { const d = digitsOf(v); return Array.from({ length:W }, (_, i) => i < d.length ? d[i] : null); };
    return t.two ? { p1:row(t.p1), p2:row(t.p2), s:row(t.answer) } : { s:row(t.answer) };
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
  function checkSheet(t, vals) {
    const per = t.items.map((it, i) => (vals || [])[i] === it.answer);
    return { ok:per.every(Boolean), cls:'sheet', per, okCount:per.filter(Boolean).length };
  }
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
    const per = P.moments.map(id => {
      const R = results.filter(x => x.moment === id);
      const ok = R.filter(x => x.ok).length, total = R.length;
      const pct = total ? Math.round(100 * ok / total) : 0;
      return { id, ok, total, pct, green:total > 0 && pct >= GREEN_PCT };
    });
    const ok = results.filter(x => x.ok).length;
    return { per, ok, total:results.length, weak:per.filter(p => p.total && !p.green).map(p => p.id) };
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
    makeSheet, checkSheet, genMoment, ovaCount, buildProv, buildWeakPass, check, provSummary,
  };
  if (typeof window !== 'undefined') window.MatteProvLogic = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
