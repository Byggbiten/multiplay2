/* ============================================================
   MULTIPLAY – Geografi: ren logik (window.GeoLogic)
   DOM-fri: texterna, faktan, urvalet och blandningen, nivåerna i
   samlarpärmen, testet och snäppradien. Facit för beteendet är
   design-lab/geografi-mockup.html (D24–D36). Testas i tests/geografi.test.mjs.
   Laddas efter shared.js och geografi-data.js. Exporteras även som CJS för vitest.
   ============================================================ */
'use strict';

(function () {
  const MPx = (typeof window !== 'undefined' && window.MP) ? window.MP : require('./shared.js');
  const GD  = (typeof window !== 'undefined' && window.GEO_DATA) ? window.GEO_DATA : require('./geografi-data.js');
  const SP = MPx.spaced;

  /* ── Landskapen (ordningen norr till söder; nr används bara internt, D33) ── */
  const LANDSKAP = GD.landskap.map(l => ({ nr:l.nr, namn:l.namn, landsdel:l.landsdel, path:l.path }));
  const BY = {}; for (const l of GD.landskap) BY[l.nr] = l;
  const ALL = LANDSKAP.map(l => l.nr);
  const NAME = nr => BY[nr].namn;
  const LANDSDELAR = ['Norrland', 'Svealand', 'Götaland'];
  const NRS_OF = ld => LANDSKAP.filter(l => l.landsdel === ld).map(l => l.nr);
  const AREAS = ['Norrland', 'Svealand', 'Götaland', 'Sverige'];
  const areaNrs = a => a === 'Sverige' ? ALL.slice() : NRS_OF(a);
  const AREA_NAME = { Norrland:'Norrland', Svealand:'Svealand', Götaland:'Götaland', Sverige:'Hela Sverige' };
  const AREA_IN = a => a === 'Sverige' ? 'hela Sverige' : a;
  /* Faktan i samma form som källan (landskap-fakta.json): F(nr).storsta_stad.namn, .visste_du[i].text osv. */
  const F = nr => {
    const l = BY[nr];
    return { namn:l.namn, landsdel:l.landsdel, blomma:l.blomma, djur:l.djur, yta_rang:l.yta_rang, invanare_rang:l.invanare_rang,
      storsta_stad:{ namn:l.stad[0] }, ocksa_stor_stad:l.stad[1] ? { namn:l.stad[1] } : null,
      visste_du:l.visste.map(text => ({ text })), bilder:l.bilder };
  };

  /* ── Språket ── */
  const TALORD = ['noll','ett','två','tre','fyra','fem','sex','sju','åtta','nio','tio','elva','tolv','tretton','fjorton','femton','sexton','sjutton','arton','nitton','tjugo'];
  const antal = n => n <= 20 ? TALORD[n] : n === 25 ? 'tjugofem' : String(n);   // antal skrivs i ord
  const gen = n => /s$/.test(n) ? n : n + 's';                                   // genitiv: Medelpads
  const lc = s => /^Kung /.test(s) ? s : s[0].toLowerCase() + s.slice(1);        // "Kung Karls spira" behåller versalen
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const inL = nr => (nr === 22 || nr === 23 ? 'på ' : 'i ') + NAME(nr);           // öarna: på Gotland, på Öland
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const kanTxt = (k, total) => k >= total ? `Du kan alla ${antal(total)} landskap` : k === 0 ? 'Du kan inga landskap än' : `Du kan ${antal(k)} av ${antal(total)} landskap`;

  /* ── Grannar (mätta i kartan, se mockupen) och minnesstöd ── */
  const NB = { 1:[2,3,4,5], 2:[1,3], 3:[1,2,4], 4:[1,3,5,7], 5:[1,4,6,7], 6:[5,7,8,9], 7:[4,5,6,8], 8:[6,7,9,10],
    9:[6,8,10,12,13], 10:[8,9,11], 11:[10,12,15], 12:[9,11,13,14,15], 13:[9,12,14,17,19], 14:[12,13,15,16,19], 15:[11,12,14,16],
    16:[14,15,21], 17:[13,18,19], 18:[17,19], 19:[13,14,17,18,20,21], 20:[19,21,25], 21:[16,19,20,24,25], 22:[], 23:[], 24:[21,25], 25:[20,21,24] };
  /* "Nära" = grannar, plus öarna: Gotland och Öland förväxlas med varandra, Öland ligger tätt intill Småland */
  const NEAR = nr => [...NB[nr], ...({ 21:[23], 22:[23], 23:[21, 22] }[nr] || [])];
  const isNear = (t, g) => g !== t && NEAR(t).includes(g);
  function nearText(g, t){
    if ([22, 23].includes(g) && [22, 23].includes(t)) return `${NAME(g)} är också en ö.`;
    if ((g === 21 && t === 23) || (g === 23 && t === 21)) return `${NAME(g)} ligger tätt intill ${NAME(t)}.`;
    return `${NAME(g)} är granne med ${NAME(t)}.`;
  }
  const CUE = {
    1:  { text:'Lappland är störst av alla landskap. Det ligger högst upp.', ref:[] },
    2:  { text:'Norrbotten ligger bredvid Lappland, vid havet.', ref:[1] },
    3:  { text:'Västerbotten ligger under Norrbotten, vid havet.', ref:[2] },
    4:  { text:'Ångermanland ligger under Västerbotten, vid havet.', ref:[3] },
    5:  { text:'Jämtland ligger inne i landet, mellan Lappland och Härjedalen.', ref:[1, 6] },
    6:  { text:'Härjedalen ligger under Jämtland.', ref:[5] },
    7:  { text:'Medelpad ligger mellan Ångermanland och Hälsingland.', ref:[4, 8] },
    8:  { text:'Hälsingland ligger under Medelpad, vid havet.', ref:[7] },
    9:  { text:'Dalarna ligger under Härjedalen. Det är störst i Svealand.', ref:[6] },
    10: { text:'Gästrikland ligger under Hälsingland, längst ner i Norrland.', ref:[8] },
    11: { text:'Uppland ligger vid havet, under Gästrikland.', ref:[10] },
    12: { text:'Västmanland ligger mellan Dalarna och Södermanland.', ref:[9, 15] },
    13: { text:'Värmland ligger under Dalarna, längst till vänster i Svealand.', ref:[9] },
    14: { text:'Närke är litet. Det ligger mellan Värmland och Södermanland.', ref:[13, 15] },
    15: { text:'Södermanland ligger under Uppland, vid havet.', ref:[11] },
    16: { text:'Östergötland ligger under Södermanland, vid havet.', ref:[15] },
    17: { text:'Dalsland är litet. Det ligger under Värmland.', ref:[13] },
    18: { text:'Bohuslän är en smal remsa vid havet, bredvid Dalsland.', ref:[17] },
    19: { text:'Västergötland ligger mellan de stora sjöarna Vänern och Vättern.', ref:[], lakes:true },
    20: { text:'Halland ligger vid havet, mellan Västergötland och Skåne.', ref:[19, 25] },
    21: { text:'Småland är störst i Götaland.', ref:[] },
    22: { text:'Gotland är en stor ö, långt ute i havet.', ref:[] },
    23: { text:'Öland är en smal ö, tätt intill Småland.', ref:[21] },
    24: { text:'Blekinge ligger under Småland, bredvid Skåne.', ref:[21, 25] },
    25: { text:'Skåne ligger längst ner i Sverige.', ref:[] },
  };

  /* ── Faktan för barn: rangen ur landskap-fakta.json (1 = störst) ── */
  function ytaText(nr){
    const N = NAME(nr), r = BY[nr].yta_rang;
    if (r === 1) return `${N} är Sveriges största landskap till ytan.`;
    if (r === 2) return `${N} är näst störst till ytan.`;
    if (r === 3) return `${N} är tredje störst till ytan.`;
    if (r <= 8) return `${N} är ett av de största landskapen till ytan.`;
    if (r <= 17) return `${N} är mellanstort till ytan.`;
    if (r <= 22) return `${N} är ett av de minsta landskapen till ytan.`;
    if (r === 23) return `${N} är tredje minst till ytan.`;
    if (r === 24) return `${N} är näst minst till ytan.`;
    return `${N} är Sveriges minsta landskap till ytan.`;
  }
  function invText(nr){
    const N = NAME(nr), r = BY[nr].invanare_rang;
    if (r === 1) return `${N} är Sveriges folkrikaste landskap.`;
    if (r === 2) return `${N} har näst flest invånare.`;
    if (r === 3) return `${N} har tredje flest invånare.`;
    if (r <= 8) return `${N} är ett av de folkrikaste landskapen.`;
    if (r <= 17) return `${N} har ett mellanstort antal invånare.`;
    if (r <= 22) return `${N} har ganska få invånare.`;
    if (r === 23) return `${N} har tredje färst invånare.`;
    if (r === 24) return `${N} har näst färst invånare.`;
    return `${N} har minst invånare av alla Sveriges landskap.`;
  }
  const cities = nr => BY[nr].stad.slice();
  /* Faktarutan efter rätt svar (D31): en särskild rad bara vid rang 1, 2, 24 eller 25 i yta eller invånare, högst två */
  const SPECIAL = {
    yta:{ 1:'Sveriges största landskap till ytan', 2:'Sveriges näst största landskap till ytan', 24:'Sveriges näst minsta landskap till ytan', 25:'Sveriges minsta landskap till ytan' },
    inv:{ 1:'Sveriges folkrikaste landskap', 2:'Sveriges näst folkrikaste landskap', 24:'Näst minst folk av alla landskap', 25:'Minst folk av alla landskap' },
  };
  const specialFacts = nr => [SPECIAL.yta[BY[nr].yta_rang], SPECIAL.inv[BY[nr].invanare_rang]].filter(Boolean).slice(0, 2);
  const BILD_WORD = { djur:'landskapsdjur', blomma:'landskapsblomma', skold:'landskapssköld' };
  /* Pusslets korta fakta efter en lagd bit (D27) */
  const FACT_KINDS = ['rank', 'stad', 'bild'];
  function cityFact(nr){ const c = cities(nr); return c.length > 1 ? `Städerna ${inL(nr)} är ${c[0]} och ${c[1]}.` : `Staden ${inL(nr)} är ${c[0]}.`; }
  function factOf(nr, kind, v){
    const N = NAME(nr);
    if (kind === 'rank') return v % 2 ? { icon:'people', text:invText(nr) } : { icon:'ruler', text:ytaText(nr) };
    if (kind === 'stad') return { icon:'city', text:cityFact(nr) };
    const b = v % 2 ? 'djur' : 'blomma'; return { icon:b === 'djur' ? 'paw' : 'flower', text:`${gen(N)} ${BILD_WORD[b]} är ${lc(BY[nr][b])}.` };
  }

  /* ── Lägena och texterna i spelet ── */
  const MODES = [
    { id:'upptack', name:'Upptäck Sverige', icon:'eye', desc:'Hitta landskapen. Kartan blir färg.' },
    { id:'namn', name:'Vad heter det?', icon:'bulb', desc:'Ett landskap lyser. Välj namnet.' },
    { id:'stad', name:'Städerna', icon:'city', desc:'I vilket landskap ligger staden?' },
    { id:'bild', name:'Djur, blommor, sköldar', icon:'paw', desc:'Vems är det här? Välj vad du vill se:' },
  ];
  const PRAISE = ['Rätt!', 'Snyggt!', 'Helt rätt!', 'Bra hittat!'];
  const MODE_NAME = { upptack:'Upptäck Sverige', namn:'Vad heter det?', stad:'Städerna', bild:'Djur, blommor, sköldar', test:'Test' };
  const BILD_TITLE = { djur:'Landskapsdjur', blomma:'Landskapsblommor', skold:'Landskapssköldar', blandat:'Blandade bilder' };
  const bildName = (nr, b) => b === 'djur' ? BY[nr].djur : b === 'blomma' ? BY[nr].blomma : null;
  const usesOptions = it => it.kind === 'namn' || (it.kind === 'bild' && it.svar === 'namn');
  function promptHTML(it){
    if (it.kind === 'var') return `Var ligger <em>${NAME(it.nr)}</em>?`;
    if (it.kind === 'namn') return 'Vad heter det markerade landskapet?';
    if (it.kind === 'stad') return `I vilket landskap ligger <em>${esc(it.stad)}</em>?`;
    return it.bild === 'djur' ? 'Vems landskapsdjur är det här?' : it.bild === 'blomma' ? 'Vems landskapsblomma är det här?' : 'Vems landskapssköld är det här?';
  }
  function rightMain(it){
    const N = NAME(it.nr);
    if (it.kind === 'var') return `Där ligger ${N}.`;
    if (it.kind === 'namn') return `Det markerade landskapet är ${N}.`;
    if (it.kind === 'stad') return `${it.stad} ligger ${inL(it.nr)}.`;
    const b = bildName(it.nr, it.bild);
    return b ? `${cap(lc(b))} är ${gen(N)} ${BILD_WORD[it.bild]}.` : `Det är ${gen(N)} landskapssköld.`;
  }
  /* Bekräftelsen i faktarutan (D32): kort, eftersom rutan själv visar stad, djur och blomma */
  function boxMain(it){
    const N = NAME(it.nr);
    if (it.kind === 'var') return `Där ligger ${N}.`;
    if (it.kind === 'namn') return `Det är ${N}.`;
    if (it.kind === 'stad') return `${it.stad} ligger ${inL(it.nr)}.`;
    return `Det är ${gen(N)}.`;
  }
  /* Det barnet ska veta efter ett fel (kort, en mening) */
  function answerLine(it){
    if (it.kind === 'stad' || it.kind === 'bild') return rightMain(it);
    return CUE[it.nr].text;
  }
  /* Förklaringen efter fel i flervalet: klickstyrd, en idé per steg, slutsatsen sist */
  function optSteps(it, g){
    const t = it.nr, G = NAME(g), T = NAME(t), steps = [];
    if (it.kind === 'namn'){
      steps.push({ text:isNear(t, g) ? nearText(g, t) : `Du valde ${G}. ${G} ligger här.`, acts:[{ do:'bad', nr:g }] });
      steps.push({ text:`Det markerade landskapet är ${T}.`, acts:[{ do:'here', nr:t }], done:true });
    } else {
      const gb = bildName(g, it.bild);
      steps.push({ text:gb ? `${gen(G)} ${BILD_WORD[it.bild]} är ${lc(gb)}.` : `Du valde ${G}. ${gen(G)} sköld ser annorlunda ut.`, acts:[{ do:'bad', nr:g }] });
      steps.push({ text:rightMain(it), acts:[{ do:'here', nr:t }], done:true });
    }
    steps.push({ text:CUE[t].text, acts:CUE[t].ref.filter(n => n !== g).map(n => ({ do:'ref', nr:n })) });
    return steps;
  }

  /* ── Flervalet: grannar och samma landsdel; ordningen lottas (D17) ── */
  function shuf(a, r){ const o = a.slice(); for (let i = o.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; }
  function nameOptions(t, r){
    r = r || Math.random;
    const near = shuf(NEAR(t), r), same = shuf(NRS_OF(BY[t].landsdel).filter(n => n !== t && !near.includes(n)), r);
    const pick = [...near.slice(0, 2), ...same, ...near.slice(2), ...shuf(ALL, r)].filter((n, i, a) => n !== t && a.indexOf(n) === i).slice(0, 3);
    return shuf([t, ...pick], r).map(n => ({ nr:n, ok:n === t, text:NAME(n) }));
  }

  /* ── Urvalet och blandningen (D34) ──
     cfg = { mode:'upptack'|'namn'|'stad'|'bild', area, order:'blandad'|'rak', bild:'djur'|'blomma'|'skold'|'blandat', bildSvar:'blandat'|'karta'|'namn' }
     viewOf(nr) = lådans vis-värde ('ny'|'ovar'|'kan'|'due'), för hela Sverige (tolv frågor ur lådorna, övar först).
     memo = minnet för "inte samma ordning som förra rundan" (ett objekt per profil och session). */
  const RANK = { ovar:0, due:1, ny:2, kan:3 };
  function prioritize(items, viewOf, r){ return items.map(it => ({ it, k:RANK[viewOf ? viewOf(it.nr) : 'ny'] + r() * 0.9 })).sort((a, b) => a.k - b.k).map(x => x.it); }
  const itemSig = x => x.nr + (x.stad || '') + (x.kind || '') + (x.bild || '');
  function spread(items, memo, memoKey, r){ return MPx.spreadShuffle(items, { key:x => x.nr, sig:itemSig, memo, memoKey, r }); }
  function buildItems(cfg, viewOf, memo, r){
    r = r || Math.random;
    const nrs = areaNrs(cfg.area);
    let items;
    if (cfg.mode === 'stad') items = nrs.flatMap(n => cities(n).map((c, i) => ({ nr:n, kind:'stad', stad:c, ci:i })));
    else if (cfg.mode === 'bild'){
      const K = ['djur', 'blomma', 'skold'], off = Math.floor(r() * 3), sv = cfg.bildSvar || 'blandat';
      items = nrs.map((n, i) => ({ nr:n, kind:'bild', bild:cfg.bild === 'blandat' ? K[(i + off) % 3] : cfg.bild, svar:sv === 'blandat' ? ((i + off) % 2 ? 'namn' : 'karta') : sv }));
    }
    else if (cfg.mode === 'namn') items = nrs.map(n => ({ nr:n, kind:'namn' }));
    else items = nrs.map(n => ({ nr:n, kind:'var' }));
    if (cfg.mode !== 'upptack' && cfg.area === 'Sverige') items = prioritize(items, viewOf, r).slice(0, 12);
    return cfg.order === 'rak' ? items.sort((a, b) => a.nr - b.nr || (a.ci || 0) - (b.ci || 0)) : spread(items, memo, `${cfg.mode}|${cfg.area}|${cfg.bild || ''}`, r);
  }
  /* Testet (D30): alla landskap i området, en gång var, i blandade frågetyper (alla sex), utan nötloop */
  const TEST_KINDS = ['var', 'namn', 'stad', 'djur', 'blomma', 'skold'];
  function buildTest(area, memo, r){
    r = r || Math.random;
    const nrs = spread(areaNrs(area).map(nr => ({ nr })), memo, 'test|' + area, r).map(x => x.nr);
    let kinds = [];
    while (kinds.length < nrs.length) kinds = kinds.concat(shuf(TEST_KINDS, r));
    return nrs.map((nr, i) => { const k = kinds[i];
      if (k === 'stad') return { nr, kind:'stad', stad:cities(nr)[r() < 0.5 ? 0 : cities(nr).length - 1] };
      if (k === 'djur' || k === 'blomma' || k === 'skold') return { nr, kind:'bild', bild:k, svar:'namn' };
      if (k === 'namn') return { nr, kind:'namn' };
      return { nr, kind:'var' }; });
  }
  /* Nötloopen: MP.createDrill med D34-placeringen av extratillfället (inte bredvid samma landskap) */
  const createDrill = (items, r) => MPx.createDrill(items, r, { sameKey:it => it.nr });

  /* ── Samlarpärmens nivåer (D30, D35) ──
     brons = övat (lådan inte längre "ny"), silver = kan (lådan "kan" eller "dags igen"),
     guld = kan + rätt på första försöket minst en gång i var och en av de sex frågetyperna.
     Pusslet räknas inte. */
  const GOLD_KINDS = [['karta', 'Kartan'], ['namn', 'Namnet'], ['stad', 'Staden'], ['djur', 'Djuret'], ['blomma', 'Blomman'], ['skold', 'Skölden']];
  const LEVEL = ['', 'brons', 'silver', 'guld'], LEVEL_NAME = ['Låst', 'Brons', 'Silver', 'Guld'];
  const kindKey = it => it.kind === 'var' ? 'karta' : it.kind === 'bild' ? it.bild : it.kind;
  function levelOf(st, kinds, day){
    const v = SP.vis(st || SP.fresh(), day);
    if (v === 'ny') return 0;
    if (v !== 'kan' && v !== 'due') return 1;
    return GOLD_KINDS.every(([k]) => (kinds || []).includes(k)) ? 3 : 2;
  }
  function nextLevelText(nr, L, okDays){
    const N = NAME(nr);
    if (L === 1){ const d = Math.min(3, okDays || 0); return { head:'Brons', text:`Till silver: svara rätt om ${N} på tre olika dagar. Klart hittills: ${d === 1 ? 'en dag' : `${antal(d)} dagar`} av tre.` }; }
    if (L === 2) return { head:'Silver', text:'Till guld: svara rätt i alla sex frågetyperna.', chips:true };
    return { head:'Guld', text:`Du kan allt om ${N}!` };
  }
  const lockedText = nr => `Kortet låses upp i brons när du har övat på det här landskapet. Det ligger i ${BY[nr].landsdel}.`;

  /* ── Pusslet: snäppradien (D32) ──
     Generös – halva bitens minsta mått, minst 40 px – men högst 70 % av avståndet till närmaste
     grannbits mittpunkt, så att en bit som släpps på grannens plats inte snäpper. Golv 24 px. */
  const snapRadiusPx = (minDimPx, nearestNeighbourPx) => Math.max(24, Math.min(Math.max(40, 0.5 * minDimPx), 0.7 * nearestNeighbourPx));

  /* ── Lagringen (per profil) ── */
  function validState(o){
    const out = { v:1, boxes:{}, kinds:{} };
    const b = o && typeof o === 'object' && o.boxes && typeof o.boxes === 'object' ? o.boxes : {};
    const k = o && typeof o === 'object' && o.kinds && typeof o.kinds === 'object' ? o.kinds : {};
    for (const nr of ALL){
      const st = b[nr];
      out.boxes[nr] = st && SP.BOXES.includes(st.box) ? { ...SP.fresh(), ...st } : SP.fresh();
      out.kinds[nr] = Array.isArray(k[nr]) ? k[nr].filter(x => GOLD_KINDS.some(g => g[0] === x)) : [];
    }
    return out;
  }
  /* Inställningarna (D36): hemlandskapet väljs av en vuxen; från början inget */
  function validSettings(o){
    const home = o && typeof o === 'object' && Number.isInteger(o.home) && BY[o.home] ? o.home : null;
    return { home };
  }

  /* ── Alla texter som modulen kan visa (för genomläsning och test) ── */
  function allTexts(){
    const t = new Set();
    for (const n of ALL){
      t.add(CUE[n].text); t.add(ytaText(n)); t.add(invText(n)); BY[n].visste.forEach(x => t.add(x));
      for (const g of NEAR(n)) t.add(nearText(g, n));
      const its = [{ nr:n, kind:'var' }, { nr:n, kind:'namn' }, ...cities(n).map(c => ({ nr:n, kind:'stad', stad:c })), ...['djur', 'blomma', 'skold'].map(b => ({ nr:n, kind:'bild', bild:b, svar:'namn' }))];
      for (const it of its){ t.add(promptHTML(it).replace(/<[^>]+>/g, '')); t.add(rightMain(it)); t.add(boxMain(it)); t.add(answerLine(it));
        const g = NEAR(n)[0] || (n === 1 ? 2 : 1); optSteps(it, g).forEach(s => t.add(s.text)); optSteps(it, n === 25 ? 1 : 25).forEach(s => t.add(s.text)); }
      for (const k of FACT_KINDS) for (let v = 0; v < 2; v++) t.add(factOf(n, k, v).text);
      specialFacts(n).forEach(x => t.add(x));
      [1, 2, 3].forEach(L => t.add(nextLevelText(n, L, 1).text)); t.add(lockedText(n));
    }
    MODES.forEach(m => { t.add(m.name); t.add(m.desc); });
    PRAISE.forEach(x => t.add(x));
    return [...t];
  }

  const GeoLogic = {
    LANDSKAP, BY, ALL, NAME, F, LANDSDELAR, NRS_OF, AREAS, areaNrs, AREA_NAME, AREA_IN,
    antal, gen, lc, cap, inL, esc, kanTxt,
    NB, NEAR, isNear, nearText, CUE,
    ytaText, invText, cities, cityFact, SPECIAL, specialFacts, FACT_KINDS, factOf, BILD_WORD,
    MODES, PRAISE, MODE_NAME, BILD_TITLE, bildName, usesOptions, promptHTML, rightMain, boxMain, answerLine, optSteps,
    nameOptions, buildItems, buildTest, TEST_KINDS, createDrill,
    GOLD_KINDS, LEVEL, LEVEL_NAME, kindKey, levelOf, nextLevelText, lockedText,
    snapRadiusPx, validState, validSettings, allTexts,
  };
  if (typeof window !== 'undefined') window.GeoLogic = GeoLogic;
  if (typeof module !== 'undefined' && module.exports) module.exports = GeoLogic;
})();
