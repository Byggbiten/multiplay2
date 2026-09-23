/* ============================================================
   MULTIPLAY – Klockans logik (window.ClockLogic), v63
   Ren, DOM-fri logik för Klockans trappa: stegen och deras tider,
   ordtexterna, de riktade felalternativen, visarnas koppling och
   dragningen, lektionerna och förklaringarna vid fel (texterna är
   data här, så att textsvepet i tests/clock.test.mjs når dem),
   medaljerna och varven. UI:t ligger i js/clock.js.
   Laddas efter shared.js och före clock.js. CJS-export för vitest.
   ============================================================ */
'use strict';

const ClockLogic = (() => {

  const SH = (typeof MP !== 'undefined' && MP) || require('./shared.js');
  const SP = SH.spaced;

  /* ── Tid som minuter sedan midnatt (0–1439) ─────────── */
  const DAY = 1440, HALF_DAY = 720;
  const norm = t => ((t % DAY) + DAY) % DAY;
  const toTot = (h, m) => norm(h * 60 + m);
  const hOf = t => Math.floor(norm(t) / 60);
  const mOf = t => norm(t) % 60;
  const h12 = h => (((h % 12) + 12) % 12) || 12;          // 1–12
  const pad2 = n => String(n).padStart(2, '0');
  const digi = (h, m) => `${pad2(((h % 24) + 24) % 24)}:${pad2(m)}`;
  const TIMORD = ['tolv', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv'];
  const hourWord = h => TIMORD[h12(h) % 12];              // 0/12 → tolv
  const words = (h, m) => SH.timeToSwedish(h, m);         // 'fem i halv tre'
  const wordsT = t => words(hOf(t), mOf(t));

  /* ── Dygnsperioden ───────────────────────────────────
     Natt 0–5, morgon 6–9, förmiddag 10–11, eftermiddag 12–17, kväll 18–23.
     Klockan 12:00 heter "mitt på dagen". */
  const PERIODS = [
    { id:'natt',   name:'Natt',        phrase:'på natten',       from:0,  to:5 },
    { id:'morgon', name:'Morgon',      phrase:'på morgonen',     from:6,  to:9 },
    { id:'fm',     name:'Förmiddag',   phrase:'på förmiddagen',  from:10, to:11 },
    { id:'em',     name:'Eftermiddag', phrase:'på eftermiddagen', from:12, to:17 },
    { id:'kvall',  name:'Kväll',       phrase:'på kvällen',      from:18, to:23 },
  ];
  const periodOf = h => { const x = ((h % 24) + 24) % 24; return PERIODS.find(p => x >= p.from && x <= p.to); };
  const periodPhrase = (h, m) => (((h % 24) + 24) % 24 === 12 && m === 0) ? 'mitt på dagen' : periodOf(h).phrase;
  const digitalWords = (h, m) => `${words(h, m)} ${periodPhrase(h, m)}`;

  /* ── Tidsskillnad i ord: "45 minuter", "1 timme och 30 minuter", "2 timmar" ── */
  function durWords(mins){
    const h = Math.floor(mins / 60), r = mins % 60;
    const hs = h === 1 ? '1 timme' : `${h} timmar`, ms = r === 1 ? '1 minut' : `${r} minuter`;
    if (!h) return ms;
    return r ? `${hs} och ${ms}` : hs;
  }
  /* Skillnaden framåt från t1 till t2 på urtavlan (0–719 minuter) */
  const diffFwd = (t1, t2) => ((t2 - t1) % HALF_DAY + HALF_DAY) % HALF_DAY;

  /* ═══════════════════════════════════════════════════════════
     KLOCKANS TRAPPA: sju steg, tolv tider i varje.
     En tid är en uppgift med en egen låda (samma regler som gångertabellen).
     Tiderna är valda så att varje timme 1–12 finns med en gång per steg
     och minuterna i steget fördelas jämnt.
  ═══════════════════════════════════════════════════════════ */
  const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const MIN_STEP = { 0:'hela', 30:'halv', 15:'kvart', 45:'kvart', 5:'ftt', 10:'ftt', 20:'ftt', 40:'ftt', 50:'ftt', 55:'ftt', 25:'runt', 35:'runt' };
  const timeTask = (step, h, m) => ({ step, kind:'time', key:`${h}:${pad2(m)}`, h, m });
  const digiTask = (h, m) => ({ step:'digital', kind:'digital', key:digi(h, m), h, m });
  function durTask(h1, m1, h2, m2){
    const mins = diffFwd(toTot(h1, m1), toTot(h2, m2));
    return { step:'tid', kind:'dur', key:`${h1}:${pad2(m1)}-${h2}:${pad2(m2)}`, h1, m1, h2, m2, mins };
  }
  const STEPS = [
    { id:'hela',    n:1, name:'Hela timmar',     example:'klockan tre',                     ex:[3, 0],
      tasks:HOURS.map(h => timeTask('hela', h, 0)) },
    { id:'halv',    n:2, name:'Halv',            example:'halv tre',                        ex:[2, 30],
      tasks:HOURS.map(h => timeTask('halv', h, 30)) },
    { id:'kvart',   n:3, name:'Kvart',           example:'kvart över tre · kvart i tre',    ex:[3, 15],
      tasks:HOURS.map(h => timeTask('kvart', h, [15, 15, 45, 45][(h - 1) % 4])) },
    { id:'ftt',     n:4, name:'Fem, tio, tjugo', example:'tio över tre · tjugo i tre',      ex:[3, 10],
      tasks:HOURS.map(h => timeTask('ftt', h, [5, 10, 20, 40, 50, 55][(h - 1) % 6])) },
    { id:'runt',    n:5, name:'Runt halv',       example:'fem i halv tre · fem över halv tre', ex:[2, 25],
      tasks:HOURS.map(h => timeTask('runt', h, [25, 35, 35, 25][(h - 1) % 4])) },
    { id:'digital', n:6, name:'Digital tid',     example:'14:30 är halv tre på eftermiddagen', ex:[14, 30],
      tasks:[[13, 0], [14, 30], [15, 15], [16, 45], [17, 10], [19, 20], [20, 40], [21, 50], [22, 5], [23, 25], [8, 35], [18, 55]].map(([h, m]) => digiTask(h, m)) },
    { id:'tid',     n:7, name:'Hur lång tid?',   example:'kvart över tre till kvart i fem', ex:[3, 15],
      tasks:[[3, 0, 3, 30], [4, 0, 5, 0], [2, 0, 4, 0], [1, 15, 1, 45], [2, 20, 3, 40], [7, 45, 8, 15], [9, 10, 9, 50], [10, 20, 11, 5],
             [11, 30, 12, 10], [12, 40, 1, 25], [5, 15, 6, 45], [8, 50, 9, 5]].map(a => durTask(...a)) },
  ];
  STEPS.forEach(s => { s.short = s.name.replace(/\?$/, ''); });
  const stepById = id => STEPS.find(s => s.id === id) || null;
  /* Vilket steg en analog tid hör till (efter minuterna) */
  const stepOfMinute = m => MIN_STEP[m] || null;

  /* Rätt svar för en uppgift, i ord */
  function answerText(task){
    if (task.kind === 'digital') return digitalWords(task.h, task.m);
    if (task.kind === 'dur') return durWords(task.mins);
    return words(task.h, task.m);
  }
  /* Tiden visarna ska visa när uppgiften ställs (minuter sedan midnatt; jämförs modulo 12 timmar) */
  const targetTot = task => task.kind === 'dur' ? toTot(task.h2, task.m2) : toTot(task.h, task.m);
  /* Var klockan börjar i en ställfråga: klockan tolv – utom när svaret är tolv, då sex.
     Hur lång tid: starttiden. */
  function setStart(task){
    if (task.kind === 'dur') return toTot(task.h1, task.m1);
    return toTot(task.h, task.m) % HALF_DAY === 0 ? toTot(6, 0) : toTot(12, 0);
  }
  const sameOnDial = (t1, t2) => norm(t1) % HALF_DAY === norm(t2) % HALF_DAY;

  /* ═══════════════════════════════════════════════════════════
     VISARNA: kopplingen och dragningen
     Vinklar i grader, 0 = rakt upp, medurs.
  ═══════════════════════════════════════════════════════════ */
  /* Minutvisaren ger timvisaren: timvisaren står (h mod 12) · 30° + m · 0,5° */
  function handAngles(t){
    t = norm(t);
    return { hour:((t % HALF_DAY) / 2) % 360, minute:mOf(t) * 6 };
  }
  const angleOf = (dx, dy) => ((Math.atan2(dx, -dy) * 180 / Math.PI) + 360) % 360;
  const angDist = (a, b) => { const d = Math.abs(((a - b) % 360 + 360) % 360); return Math.min(d, 360 - d); };
  /* Minuterna snäpper till 5 */
  const snapMinute = ang => (Math.round(((ang % 360) + 360) % 360 / 30) * 5) % 60;
  /* Dra minutvisaren till vinkeln: minuterna snäpper till 5, timmen följer med.
     Över 12 stegar timmen upp (medurs) eller ner (moturs): kortaste vägen från där visaren var. */
  function dragMinute(t, ang){
    const m0 = mOf(t), m1 = snapMinute(ang);
    const d = ((m1 - m0 + 89) % 60) - 29;                  // −29 … 30 (ett halvt varv i ett ryck: framåt)
    return norm(t + d);
  }
  /* Dra timvisaren: den snäpper till en hel timme, med minuternas förskjutning kvar
     (minuterna ändras inte). Förbi 12 går dygnet vidare på kortaste vägen. */
  function dragHour(t, ang){
    const m = mOf(t), h0 = hOf(t) % 12;
    const h1 = ((Math.round((((ang - m * 0.5) % 360) + 360) % 360 / 30)) % 12);
    const d = ((h1 - h0 + 17) % 12) - 5;                   // −5 … 6
    return norm(t + d * 60);
  }
  /* Vilken visare ett tryck tar: nära mitten och nära timvisaren → timvisaren, annars minutvisaren.
     r = avstånd från mitten i urtavlans enheter (urtavlan har radie 87). */
  function pickHand(r, ang, t){
    const a = handAngles(t);
    const dh = angDist(ang, a.hour), dm = angDist(ang, a.minute);
    if (r <= 56 && dh <= 30) return 'h';
    if (r > 56 || dm <= 40) return 'm';
    return dh < dm ? 'h' : 'm';
  }

  /* ═══════════════════════════════════════════════════════════
     LÄS KLOCKAN: riktade felalternativ
     Varje fel bygger på ett fel barn faktiskt gör:
       timme   – en timme fel (runt halv: "halv två" när det är "halv tre")
       halvhel – halv tre läst som tre
       overi   – "över" och "i" förväxlade (samma timord)
       halvfem – "fem i halv" och "fem över halv" förväxlade
       omvant  – visarna lästa omvänt
       fem     – 5 minuter fel
       siffra  – digital: 14 läst som 4 (tio för lite dragit)
       period  – digital: rätt ord, fel del av dygnet
       kors    – hur lång tid: timmarna och minuterna räknade var för sig
       timmar  – hur lång tid: en timme fel
       steg    – hur lång tid: stegen räknade som minuter
     Exakt ett alternativ är rätt. Ordningen lottas vid varje visning.
  ═══════════════════════════════════════════════════════════ */
  const PRIO = {
    hela:  ['timme', 'omvant', 'fem'],
    halv:  ['timme', 'halvhel', 'omvant', 'fem'],
    kvart: ['overi', 'timme', 'omvant', 'fem'],
    ftt:   ['overi', 'timme', 'fem', 'omvant'],
    runt:  ['halvfem', 'timme', 'fem', 'omvant'],
    digital: ['siffra', 'timme', 'period', 'overi', 'halvfem', 'fem'],
    tid:   ['kors', 'fem', 'timmar', 'steg'],
  };
  /* Felet som tid (minuter sedan midnatt), eller null när felet inte finns för tiden */
  function wrongTime(type, h, m, r){
    const t = toTot(h, m);
    switch (type){
      case 'timme':   return m === 0 ? norm(t + (r() < 0.5 ? 60 : -60)) : m >= 25 ? norm(t - 60) : norm(t + 60);
      case 'halvhel': return m === 30 ? toTot(h + 1, 0) : null;
      case 'overi':
        if (m >= 5 && m <= 20) return toTot(h - 1, 60 - m);   // kvart över två → kvart i två
        if (m >= 40 && m <= 55) return toTot(h + 1, 60 - m);  // kvart i tre → kvart över tre
        return null;
      case 'halvfem': return (m === 25 || m === 35) ? toTot(h, 60 - m) : null;
      case 'omvant': {
        const H = m === 0 ? 12 : m / 5;                       // siffran minutvisaren pekar på
        const M = (Math.round(((h % 12) * 60 + m) / 12 / 5) * 5) % 60;   // timvisarens läge i minuter
        return toTot(H + (h >= 12 ? 12 : 0), M);
      }
      case 'fem':     return norm(t + (r() < 0.5 ? 5 : -5));
      case 'siffra':  return (h >= 13 && h <= 21) ? toTot(h - 10 + 12, m) : null;   // 14:30 → "4" → 16:30
      case 'period':  return toTot(h + 12, m);
    }
    return null;
  }
  function durWrong(type, task, r){
    const d = task.mins;
    switch (type){
      case 'fem':    return d + (r() < 0.5 ? 5 : -5);
      case 'timmar': return d > 60 ? d - 60 : d + 60;
      case 'kors': {
        const hd = ((task.h2 - task.h1) % 12 + 12) % 12;
        const v = hd * 60 + Math.abs(task.m2 - task.m1);
        return v !== d ? v : null;
      }
      case 'steg':   return d < 60 && d % 5 === 0 && d / 5 !== d ? d / 5 : null;
    }
    return null;
  }
  const clockShuffle = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* Fyra alternativ { text, type, ok }, ordningen lottad. */
  function readOptions(task, r = Math.random){
    const correct = answerText(task);
    const prio = PRIO[task.kind === 'digital' ? 'digital' : task.kind === 'dur' ? 'tid' : stepOfMinute(task.m)];
    const cands = [];
    const add = (text, type) => { if (text && text !== correct && !cands.some(c => c.text === text)) cands.push({ text, type, ok:false }); };
    const txtOf = t => task.kind === 'digital' ? digitalWords(hOf(t), mOf(t)) : wordsT(t);
    const one = type => {
      if (task.kind === 'dur'){ const v = durWrong(type, task, r); return v && v > 0 ? durWords(v) : null; }
      const t = wrongTime(type, task.h, task.m, r);
      if (t === null) return null;
      // siffra: 14 läst som 4, men delen av dygnet behålls ("halv fem på eftermiddagen")
      if (task.kind === 'digital' && type === 'siffra') return `${wordsT(t)} ${periodPhrase(task.h, task.m)}`;
      return txtOf(t);
    };
    const typed = [];
    for (const type of prio){ const text = one(type); if (text && text !== correct && !typed.some(c => c.text === text)) typed.push({ text, type }); }
    // de två mest typiska felen först, sedan ett av de övriga (lottat)
    typed.slice(0, 2).forEach(c => add(c.text, c.type));
    clockShuffle(typed.slice(2), r).forEach(c => { if (cands.length < 3) add(c.text, c.type); });
    // reserv: tio minuter, två timmar
    const fb = task.kind === 'dur'
      ? [task.mins + 10, task.mins - 10, task.mins + 15, task.mins + 20].filter(v => v > 0).map(v => durWords(v))
      : [10, -10, 120, -120, 15, -15].map(d => txtOf(targetTot(task) + d));
    for (const text of fb){ if (cands.length >= 3) break; add(text, 'reserv'); }
    return clockShuffle([{ text:correct, type:'ratt', ok:true }, ...cands.slice(0, 3)], r);
  }

  /* ═══════════════════════════════════════════════════════════
     FÖRKLARINGEN VID FEL: fyra klickade steg. hl = visaren som lyses upp.
     mode 'read' (klockan visas) eller 'set' (klockan ställs rätt i steg 1).
  ═══════════════════════════════════════════════════════════ */
  const MINORD = { 5:'fem', 10:'tio', 15:'kvart', 20:'tjugo' };
  function minuteRule(m){
    if (m === 0)  return 'När den röda visaren pekar rakt upp säger vi bara timmen.';
    if (m === 30) return '30 minuter är en halv timme. Det heter halv.';
    if (m === 25) return '25 minuter är 5 minuter före halv. Det heter fem i halv.';
    if (m === 35) return '35 minuter är 5 minuter efter halv. Det heter fem över halv.';
    if (m < 30)   return `${m} minuter efter hel timme heter ${MINORD[m]} över.`;
    return `Då är det ${60 - m} minuter kvar till nästa hel timme. Det heter ${MINORD[60 - m]} i.`;
  }
  function hourRule(h, m){
    const H = h12(h), N = h12(h + 1);
    if (m === 0)  return `Den blå visaren pekar på ${H}.`;
    if (m <= 20)  return `Den blå visaren har gått lite förbi ${H}. Vi säger timmen som har varit: ${hourWord(h)}.`;
    if (m === 30) return `Den blå visaren står mitt emellan ${H} och ${N}. Halv betyder halvvägs till nästa timme: ${hourWord(h + 1)}.`;
    if (m === 25) return `Den blå visaren står nästan mitt emellan ${H} och ${N}. Halv betyder halvvägs till nästa timme: ${hourWord(h + 1)}.`;
    if (m === 35) return `Den blå visaren har gått lite förbi mitten mellan ${H} och ${N}. Halv betyder halvvägs till nästa timme: ${hourWord(h + 1)}.`;
    return `Den blå visaren är nästan framme vid ${N}. Vi säger timmen som kommer: ${hourWord(h + 1)}.`;
  }
  function minuteLook(m, mode){
    const pre = mode === 'set' ? 'Den röda visaren ska peka' : 'Titta på den röda visaren. Den pekar';
    if (m === 0) return `${pre} rakt upp, på 12. Då är det en hel timme.`;
    return `${pre} på ${m / 5}. Det är ${m} minuter.`;
  }
  function explainSteps(task, mode = 'read'){
    if (task.kind === 'dur') return durExplain(task);
    const { h, m } = task;
    if (task.kind === 'digital'){
      const hh = ((h % 24) + 24) % 24, H = h12(h);
      const first = hh > 12
        ? `Titta på timmen: ${hh}. Efter 12 börjar urtavlan om, så ${hh} är ${H} ${periodOf(hh).phrase}.`
        : `Titta på timmen: ${hh}. Före 12 visar urtavlan samma timme.`;
      const hourSay = m === 0 ? `Vi säger bara timmen: ${hourWord(h)}.`
        : m <= 20 ? `Vi säger timmen som har varit: ${hourWord(h)}.`
        : m <= 35 ? `Halv betyder halvvägs till nästa timme: ${hourWord(h + 1)}.`
        : `Vi säger timmen som kommer: ${hourWord(h + 1)}.`;
      return [
        { text:first, hl:'h', show:'analog' },
        { text:`Minuterna är ${pad2(m)}. ${minuteRule(m)}`, hl:'m' },
        { text:hourSay, hl:'h' },
        { text:`${digi(h, m)} är ${digitalWords(h, m)}.`, hl:'both', done:true },
      ];
    }
    return [
      { text:minuteLook(m, mode), hl:'m', go:mode === 'set' },
      { text:minuteRule(m), hl:'m' },
      { text:hourRule(h, m), hl:'h' },
      { text:`Klockan är ${words(h, m)}.`, hl:'both', done:true },
    ];
  }
  function durExplain(task){
    const hrs = Math.floor(task.mins / 60), rest = task.mins % 60;
    const start = words(task.h1, task.m1), end = words(task.h2, task.m2);
    const hourTxt = hrs === 0 ? 'Först hela timmar: ett helt varv går förbi sluttiden. Här blir det inga hela timmar.'
      : hrs === 1 ? 'Först hela timmar: den röda visaren går ett helt varv. Det är 1 timme.'
      : `Först hela timmar: den röda visaren går två hela varv. Det är ${hrs} timmar.`;
    const minTxt = rest === 0 ? `Inga minuter till: klockan är redan ${end}.`
      : `Sedan minuterna: den röda visaren går ${rest / 5} steg. Det är ${rest} minuter.`;
    return [
      { text:`Vi börjar när klockan är ${start}.`, hl:'both', at:toTot(task.h1, task.m1) },
      { text:hourTxt, hl:'m', go:toTot(task.h1, task.m1) + hrs * 60, chip:hrs ? durWords(hrs * 60) : null },
      { text:minTxt, hl:'m', go:toTot(task.h1, task.m1) + task.mins, count:rest > 0, chip:rest ? `${rest} minuter` : null },
      { text:`Det tar ${durWords(task.mins)}.`, hl:'both', done:true, total:durWords(task.mins) },
    ];
  }

  /* ═══════════════════════════════════════════════════════════
     LEKTIONERNA: klickstyrda på en stor klocka. Varje steg är en idé;
     texten visas först, sedan rörelsen (acts), slutsatsen sist.
     acts: time (sätt), go (rör visarna), hl (lys upp visare), map (minutkartans
     lager), nums (minuttalen tänds ett i taget), fill (färga en del av urtavlan),
     quarters (fyra delar), arc (timvisarens väg), ring24, digi (digital tid under
     klockan), chip (räknaren i marginalen).
  ═══════════════════════════════════════════════════════════ */
  const T = (h, m) => toTot(h, m);
  const LESSONS = {
    hela: [
      { text:'Klockan har två visare: en kort blå och en lång röd.', acts:[{ do:'time', t:T(3, 0) }, { do:'hl', w:'both' }] },
      { text:'Den röda visaren pekar rakt upp, på 12. Då är det en hel timme.', acts:[{ do:'hl', w:'m' }] },
      { text:'Den blå visaren visar timmen. Den pekar på 3.', acts:[{ do:'hl', w:'h' }] },
      { text:'Klockan är tre.', acts:[{ do:'hl', w:'both' }, { do:'digi', text:'tre' }] },
      { text:'Nu går det en timme. Den röda visaren går ett helt varv, och den blå flyttar ett steg.', acts:[{ do:'hl', w:'m' }, { do:'go', t:T(4, 0), ms:2400 }] },
      { text:'Den blå visaren pekar på 4. Klockan är fyra.', acts:[{ do:'hl', w:'h' }, { do:'digi', text:'fyra' }] },
    ],
    halv: [
      { text:'Klockan är två. Den röda visaren pekar rakt upp, och den blå pekar på 2.', acts:[{ do:'time', t:T(2, 0) }, { do:'hl', w:'both' }, { do:'digi', text:'två' }] },
      { text:'Nu går den röda visaren ett halvt varv, från 12 ner till 6.', acts:[{ do:'hl', w:'m' }, { do:'go', t:T(2, 30), ms:2200 }] },
      { text:'Den första halvan av timmen har gått.', acts:[{ do:'fill', from:0, to:30, c:'gone' }] },
      { text:'Titta på den blå visaren. Den har också flyttat sig: den står mitt emellan 2 och 3.', acts:[{ do:'hl', w:'h' }, { do:'arc', from:2, upto:0.5 }] },
      { text:'Den är halvvägs till 3. Därför heter det halv tre.', acts:[{ do:'arcEnd', at:3 }, { do:'digi', text:'halv tre' }] },
      { text:'Halv tre betyder halvvägs till tre.', acts:[{ do:'hl', w:'both' }] },
    ],
    kvart: [
      { text:'Urtavlan kan delas i fyra lika stora delar. Varje del är en kvart.', acts:[{ do:'time', t:T(4, 0) }, { do:'hl', w:null }, { do:'quarters' }] },
      { text:'Den röda visaren går en del, från 12 till 3.', acts:[{ do:'hl', w:'m' }, { do:'go', t:T(4, 15), ms:1400 }, { do:'fill', from:0, to:15, c:'gone' }] },
      { text:'En kvart har gått sedan fyra. Det heter kvart över fyra.', acts:[{ do:'hl', w:'both' }, { do:'digi', text:'kvart över fyra' }] },
      { text:'Nu går den röda visaren vidare, ända till 9.', acts:[{ do:'hl', w:'m' }, { do:'go', t:T(4, 45), ms:1800 }, { do:'fill', from:0, to:45, c:'gone' }] },
      { text:'Nu är en kvart kvar till fem. Det heter kvart i fem.', acts:[{ do:'fill', from:45, to:60, c:'left' }, { do:'hl', w:'both' }, { do:'digi', text:'kvart i fem' }] },
      { text:'Kvart över: en kvart har gått. Kvart i: en kvart är kvar.', acts:[{ do:'hl', w:null }] },
    ],
    ftt: [
      { text:'Den röda visaren räknar minuter. Från en siffra till nästa går det 5 minuter.', acts:[{ do:'time', t:T(3, 0) }, { do:'hl', w:'m' }, { do:'nums' }] },
      { text:'Den högra halvan heter över. Där har timmen nyss börjat.', acts:[{ do:'map', parts:['nums', 'over'] }] },
      { text:'Den vänstra halvan heter i. Där är nästa timme nära.', acts:[{ do:'map', parts:['nums', 'over', 'i'] }] },
      { text:'Den röda visaren pekar på 2. Det är 10 minuter efter tre.', acts:[{ do:'hl', w:'m' }, { do:'go', t:T(3, 10), ms:900 }] },
      { text:'Det heter tio över tre.', acts:[{ do:'hl', w:'both' }, { do:'digi', text:'tio över tre' }] },
      { text:'Nu pekar den röda visaren på 8. Då är det 20 minuter kvar till fyra.', acts:[{ do:'hl', w:'m' }, { do:'go', t:T(3, 40), ms:1800 }] },
      { text:'Det heter tjugo i fyra.', acts:[{ do:'hl', w:'both' }, { do:'digi', text:'tjugo i fyra' }] },
    ],
    runt: [
      { text:'Klockan är halv tre. Den röda visaren pekar på 6.', acts:[{ do:'time', t:T(2, 30) }, { do:'hl', w:'m' }, { do:'map', parts:['nums'] }, { do:'digi', text:'halv tre' }] },
      { text:'Runt 6 finns ett eget fält, från 5 till 7.', acts:[{ do:'map', parts:['nums', 'runt'] }] },
      { text:'I fältet räknar vi från halv.', acts:[{ do:'hl', w:null }] },
      { text:'Den röda visaren går ett steg bakåt. Då är det fem minuter kvar till halv.', acts:[{ do:'hl', w:'m' }, { do:'go', t:T(2, 25), ms:700 }] },
      { text:'Det heter fem i halv tre.', acts:[{ do:'hl', w:'both' }, { do:'digi', text:'fem i halv tre' }] },
      { text:'Den blå visaren är nästan halvvägs till 3. Därför säger vi tre, precis som vid halv tre.', acts:[{ do:'hl', w:'h' }, { do:'arc', from:2, upto:0.5 }] },
      { text:'Nu går den röda visaren två steg framåt. Då har det gått fem minuter efter halv.', acts:[{ do:'hl', w:'m' }, { do:'go', t:T(2, 35), ms:900 }] },
      { text:'Det heter fem över halv tre.', acts:[{ do:'hl', w:'both' }, { do:'digi', text:'fem över halv tre' }] },
    ],
    digital: [
      { text:'En digital klocka räknar hela dygnet, från 00 till 23.', acts:[{ do:'time', t:T(12, 0) }, { do:'hl', w:null }, { do:'ring24', on:true }, { do:'digi', text:'12:00', digital:true }] },
      { text:'Efter 12 fortsätter den med 13, 14, 15 och så vidare.', acts:[{ do:'ring24', on:true, pop:true }] },
      { text:'13 är 1 på eftermiddagen. Ta bort 12, så får du timmen på urtavlan.', acts:[{ do:'hl', w:'h' }, { do:'go', t:T(13, 0), ms:1600 }, { do:'digi', text:'13:00', digital:true }] },
      { text:'Klockan 14:30 står den blå visaren mitt emellan 2 och 3.', acts:[{ do:'hl', w:'h' }, { do:'go', t:T(14, 30), ms:1800 }, { do:'digi', text:'14:30', digital:true }] },
      { text:'14:30 är halv tre på eftermiddagen.', acts:[{ do:'hl', w:'both' }, { do:'digi', text:'halv tre på eftermiddagen' }] },
      { text:'På kvällen fortsätter det: 20:15 är kvart över åtta på kvällen.', acts:[{ do:'hl', w:'both' }, { do:'time', t:T(20, 15) }, { do:'digi', text:'20:15', digital:true }] },
    ],
    tid: [
      { text:'Vi ska räkna tiden från kvart över tre till kvart i fem.', acts:[{ do:'time', t:T(3, 15) }, { do:'hl', w:'both' }, { do:'chip', reset:true }] },
      { text:'Först hela timmar. Den röda visaren går ett helt varv: det är 1 timme.', acts:[{ do:'hl', w:'m' }, { do:'go', t:T(4, 15), ms:2200 }, { do:'chip', text:'1 timme' }] },
      { text:'Ett varv till skulle gå förbi kvart i fem. Nu räknar vi minuter i stället.', acts:[{ do:'hl', w:null }] },
      { text:'Den röda visaren går 6 steg, från 3 till 9. Varje steg är 5 minuter, så det blir 30 minuter.', acts:[{ do:'hl', w:'m' }, { do:'count', t:T(4, 45) }, { do:'chip', text:'30 minuter' }] },
      { text:'Ihop: 1 timme och 30 minuter.', acts:[{ do:'hl', w:'both' }, { do:'chip', total:'1 timme och 30 minuter' }] },
    ],
  };

  /* ═══════════════════════════════════════════════════════════
     MINUTKARTAN (stödhjulet): vilka lager ett steg visar, och hur stark
     den är. I lektioner och förklaringar: full. I frågor: full utan medalj,
     nedtonad med brons, borta från silver (Visa hjälp tänder den alltid).
  ═══════════════════════════════════════════════════════════ */
  const MAP_PARTS = {
    hela:['nums', 'over', 'i'], halv:['nums', 'over', 'i'], kvart:['nums', 'over', 'i'], ftt:['nums', 'over', 'i'],
    runt:['nums', 'over', 'i', 'runt'], digital:['nums', 'over', 'i', 'runt'], tid:['nums'],
  };
  const mapLevel = medal => !medal ? 1 : medal === 'brons' ? 0.55 : 0;

  /* ═══════════════════════════════════════════════════════════
     LÅDOR OCH MEDALJER PER STEG (reglerna i MP.spaced)
     boxes = { [stegId]: { [tidens nyckel]: tillstånd } }
  ═══════════════════════════════════════════════════════════ */
  function stepViews(boxes, stepId, day){
    const s = stepById(stepId), b = (boxes && boxes[stepId]) || {};
    return s.tasks.map(t => b[t.key] ? SP.vis(b[t.key], day) : 'ny');
  }
  const stepMedal = (boxes, stepId, day) => ({ step:stepId, ...SP.medal(stepViews(boxes, stepId, day)) });
  function recordBox(boxes, stepId, key, ok, day){
    boxes[stepId] = boxes[stepId] || {};
    const st = boxes[stepId][key] || SP.fresh();
    boxes[stepId][key] = SP.applyAnswer(st, !!ok, day);
    return boxes;
  }
  function validBoxes(raw){
    if (!raw || typeof raw !== 'object' || raw.v !== 1 || !raw.steps || typeof raw.steps !== 'object') return {};
    const out = {};
    for (const s of STEPS){
      const b = raw.steps[s.id]; if (!b || typeof b !== 'object') continue;
      out[s.id] = {};
      for (const t of s.tasks){ const st = b[t.key]; if (st && SP.BOXES.includes(st.box)) out[s.id][t.key] = st; }
    }
    return out;
  }

  /* ═══════════════════════════════════════════════════════════
     ÖVNINGSPASSET: varv av två sorter, lätt till svårt.
     Varje varv ställer stegets tolv tider i lottad ordning.
  ═══════════════════════════════════════════════════════════ */
  const RTYPES = ['read', 'set'];
  const RNAME = { read:'Läs klockan', set:'Ställ klockan' };
  const RHELP = { read:'Fyra svar att välja bland.', set:'Dra visarna rätt.' };
  const PRESETS = [
    { k:'kort',    label:'Kort',    c:{ read:1, set:1 } },
    { k:'vanligt', label:'Vanligt', c:{ read:2, set:2 } },
    { k:'langt',   label:'Långt',   c:{ read:3, set:3 } },
  ];
  const RMAX = 4;
  const EST_S = { read:9, set:15 };
  const clampCount = v => Math.max(0, Math.min(RMAX, Math.round(Number(v) || 0)));
  const normCounts = c => { c = c || {}; return { read:clampCount(c.read), set:clampCount(c.set) }; };
  function roundTypes(counts){ const c = normCounts(counts), out = []; for (const t of RTYPES) for (let i = 0; i < c[t]; i++) out.push(t); return out; }
  const presetFor = counts => { const c = normCounts(counts); return (PRESETS.find(p => RTYPES.every(t => p.c[t] === c[t])) || {}).k || null; };
  const countsFrom = saved => saved && roundTypes(saved.counts || saved).length ? normCounts(saved.counts || saved) : { ...PRESETS[1].c };
  function buildRounds(stepId, counts, r = Math.random){
    const s = stepById(stepId);
    return roundTypes(counts).map(type => ({ type, items:clockShuffle(s.tasks, r).map(t => ({ key:t.key })) }));
  }
  const TALORD = ['noll', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv'];
  const talord = n => n <= 12 ? TALORD[n] : String(n);
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const varvTxt = n => `${cap(talord(n))} varv`;
  function passPlan(stepId, counts){
    const types = roundTypes(counts), per = stepById(stepId).tasks.length;
    const secs = types.reduce((s, t) => s + EST_S[t] * per, 0);
    return { types, rounds:types.length, perRound:per, questions:per * types.length, minutes:secs ? Math.max(1, Math.round(secs / 60)) : 0 };
  }
  function planSummary(pl){
    if (!pl.rounds) return 'Välj minst ett varv.';
    return `${varvTxt(pl.rounds)} · ${pl.questions} frågor · ungefär ${pl.minutes === 1 ? 'en minut' : `${pl.minutes} minuter`}`;
  }
  const taskByKey = (stepId, key) => stepById(stepId).tasks.find(t => t.key === key) || null;

  /* "Du kan N av 12 tider" – alla: "Du kan alla 12 tider" (samma tal får inte stå för två saker) */
  const kanTxt = (k, total) => k >= total ? `Du kan alla ${total} tider` : `Du kan ${k} av ${total} tider`;

  /* Alla texter barnet kan få se i lektioner och förklaringar (textsvepet) */
  function allTexts(){
    const out = [];
    for (const id in LESSONS) LESSONS[id].forEach(s => out.push(s.text));
    for (const s of STEPS) for (const t of s.tasks) for (const mode of ['read', 'set']) explainSteps(t, mode).forEach(x => out.push(x.text));
    return out;
  }

  return {
    DAY, HALF_DAY, norm, toTot, hOf, mOf, h12, pad2, digi, words, wordsT, hourWord,
    PERIODS, periodOf, periodPhrase, digitalWords, durWords, diffFwd,
    STEPS, stepById, stepOfMinute, answerText, targetTot, setStart, sameOnDial, taskByKey,
    handAngles, angleOf, angDist, snapMinute, dragMinute, dragHour, pickHand,
    PRIO, wrongTime, readOptions, explainSteps, minuteRule, hourRule,
    LESSONS, MAP_PARTS, mapLevel,
    stepViews, stepMedal, recordBox, validBoxes,
    RTYPES, RNAME, RHELP, PRESETS, RMAX, clampCount, normCounts, roundTypes, presetFor, countsFrom, buildRounds, passPlan, planSummary, varvTxt, talord, cap,
    kanTxt, allTexts, shuffle:clockShuffle,
  };
})();

if (typeof window !== 'undefined') window.ClockLogic = ClockLogic;
if (typeof module !== 'undefined' && module.exports) module.exports = ClockLogic;
