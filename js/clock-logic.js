/* ============================================================
   MULTIPLAY – Klockans logik (window.ClockLogic), v64
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

  /* Fyra alternativ { text, type, ok, val }, ordningen lottad.
     val = felets tid i minuter sedan midnatt (Hur lång tid: längden i minuter), så att
     nearMiss kan avgöra om felet var nära. */
  function readOptions(task, r = Math.random){
    const correct = answerText(task);
    const prio = PRIO[task.kind === 'digital' ? 'digital' : task.kind === 'dur' ? 'tid' : stepOfMinute(task.m)];
    const cands = [];
    const add = (text, type, val) => { if (text && text !== correct && !cands.some(c => c.text === text)) cands.push({ text, type, ok:false, val }); };
    const txtOf = t => task.kind === 'digital' ? digitalWords(hOf(t), mOf(t)) : wordsT(t);
    const one = type => {
      if (task.kind === 'dur'){ const v = durWrong(type, task, r); return v && v > 0 ? { text:durWords(v), val:v } : null; }
      const t = wrongTime(type, task.h, task.m, r);
      if (t === null) return null;
      // siffra: 14 läst som 4, men delen av dygnet behålls ("halv fem på eftermiddagen")
      if (task.kind === 'digital' && type === 'siffra') return { text:`${wordsT(t)} ${periodPhrase(task.h, task.m)}`, val:t };
      return { text:txtOf(t), val:t };
    };
    const typed = [];
    for (const type of prio){ const o = one(type); if (o && o.text !== correct && !typed.some(c => c.text === o.text)) typed.push({ ...o, type }); }
    // de två mest typiska felen först, sedan ett av de övriga (lottat)
    typed.slice(0, 2).forEach(c => add(c.text, c.type, c.val));
    clockShuffle(typed.slice(2), r).forEach(c => { if (cands.length < 3) add(c.text, c.type, c.val); });
    // reserv: tio minuter, två timmar
    const fb = task.kind === 'dur'
      ? [task.mins + 10, task.mins - 10, task.mins + 15, task.mins + 20].filter(v => v > 0).map(v => ({ text:durWords(v), val:v }))
      : [10, -10, 120, -120, 15, -15].map(d => { const t = norm(targetTot(task) + d); return { text:txtOf(t), val:t }; });
    for (const o of fb){ if (cands.length >= 3) break; add(o.text, 'reserv', o.val); }
    const rightVal = task.kind === 'dur' ? task.mins : targetTot(task);
    return clockShuffle([{ text:correct, type:'ratt', ok:true, val:rightVal }, ...cands.slice(0, 3)], r);
  }

  /* ═══════════════════════════════════════════════════════════
     NÄSTAN RÄTT: ett fel är nära när det är 5 minuter fel, en timme fel
     runt halv (25–35 minuter), eller när "över" och "i" är förväxlade
     (också fem i halv ↔ fem över halv). Annars inte – appen säger aldrig
     "nästan rätt" om ett fel som inte är nära.
     given: tiden barnet svarade (minuter sedan midnatt), i Hur lång tid längden
     i minuter. mode: 'read' eller 'set' (en ställd klocka kan inte visa dygnsdelen).
  ═══════════════════════════════════════════════════════════ */
  function nearMiss(task, given, mode = 'read'){
    if (given === null || given === undefined || !Number.isFinite(given)) return null;
    if (task.kind === 'dur') return Math.abs(given - task.mins) === 5 ? 'fem' : null;
    const target = toTot(task.h, task.m);
    const span = task.kind === 'digital' && mode === 'read' ? DAY : HALF_DAY;
    const mod = x => ((x % span) + span) % span;
    const d = mod(given - target), dd = Math.min(d, span - d);
    if (dd === 0) return null;
    if (dd === 5) return 'fem';
    if (dd === 60 && task.m >= 25 && task.m <= 35) return 'timme';
    for (const type of ['overi', 'halvfem']){
      const w = wrongTime(type, task.h, task.m, Math.random);
      if (w !== null && mod(given - w) === 0) return 'overi';
    }
    return null;
  }
  const NEAR_LEAD = 'Nästan rätt! Bra försök, låt mig visa!';
  const FAR_LEAD = 'Bra försök! Låt mig visa.';
  const wrongLead = near => near ? NEAR_LEAD : FAR_LEAD;
  const PRAISE = ['Precis!', 'Snyggt räknat!', 'Helt rätt!', 'Rätt!'];
  const praise = i => PRAISE[((i % PRAISE.length) + PRAISE.length) % PRAISE.length];
  const CONFIRM = 'Precis som du redan räknat ut: ';

  /* ═══════════════════════════════════════════════════════════
     RÄKNINGEN: den röda visaren går i steg om 5 minuter och summan byggs
     i marginalen: "5", "5 + 5 = 10", "5 + 5 + 5 = 15" …
     countSpec(m): vad som räknas för minuterna m –
       över (5–30): det som har gått sedan 12 (0 → m)
       i (40–55):   det som är kvar till 12 (m → 60)
       fem i halv:  det som är kvar till halv (25 → 30)
       fem över halv: det som har gått sedan halv (30 → 35)
  ═══════════════════════════════════════════════════════════ */
  const sumText = k => k <= 1 ? '5' : `${Array(k).fill('5').join(' + ')} = ${5 * k}`;
  function countSpec(m){
    if (m === 0) return null;
    if (m === 25) return { from:25, to:30, c:'left' };
    if (m === 35) return { from:30, to:35, c:'gone' };
    if (m <= 30) return { from:0, to:m, c:'gone' };
    return { from:m, to:60, c:'left' };
  }
  /* Hur många minuter räkningen landar på (det som står i tidens namn) */
  const countTotal = m => { const c = countSpec(m); return c ? c.to - c.from : 0; };
  /* Stegets tid i räkningen: ryms alltid inom ungefär 2 sekunder */
  const countStepMs = n => Math.min(380, Math.floor(1600 / Math.max(1, n)));

  /* Digital tid: timmen på urtavlan. 13–23 → minus 12. 12 är 12, 00 är 12 (på natten). */
  function digitalHour(hh){
    const x = ((hh % 24) + 24) % 24;
    return { dial:(x % 12) || 12, minus:x > 12 };
  }

  /* ═══════════════════════════════════════════════════════════
     FÖRKLARINGEN (vid fel, och i bekräftande form vid rätt i lektionens
     försök): klickade steg byggda av lektionens byggstenar – räkningen
     med summan, betoningen av bindeordet och de tre representationerna.
     Varje steg: { text, acts, link?, done? } (samma format som lektionerna).
     mode 'read' (klockan visas) eller 'set' (klockan ställs rätt i första steget).
     opts.confirm: bekräftande form – "Precis som du redan räknat ut: …".
  ═══════════════════════════════════════════════════════════ */
  const MINORD = { 5:'fem', 10:'tio', 15:'kvart', 20:'tjugo' };
  const posOf = m => m === 0 ? 12 : m / 5;
  const lowFirst = s => s[0].toLowerCase() + s.slice(1);
  /* Räkningen på urtavlan för minuterna m (utan att visaren flyttas) */
  function countActs(m){
    const c = countSpec(m);
    const acts = [];
    if (m === 25 || m === 35) acts.push({ do:'map', parts:['nums', 'runt'] });
    if (c) acts.push({ do:'count', from:c.from, to:c.to, c:c.c });
    return acts;
  }
  function countLine(m){
    if (m === 0)  return 'När den röda visaren pekar rakt upp säger vi bara timmen.';
    if (m === 25 || m === 35) return 'Runt halv räknar vi från 6:an.';
    if (m <= 30)  return 'Vi räknar minuterna som har gått sedan 12.';
    return 'Vi räknar minuterna som är kvar till 12.';
  }
  /* Namnsteget: varför tiden heter som den heter, med bindeordet betonat */
  function nameStep(h, m){
    const H = h12(h), N = h12(h + 1), name = words(h, m);
    const words_ = { do:'words' };
    if (m === 0)  return { text:`Den blå visaren pekar på ${H}.`, acts:[words_, { do:'hl', w:'h' }, { do:'glow', h:H }] };
    // samma tal får inte ha två roller: "gått över fem med 5 minuter" → "gått över den hela timmen med 5 minuter"
    const hw = m === H ? 'den hela timmen' : hourWord(h), nw = 60 - m === N ? 'nästa hela timme' : hourWord(h + 1);
    if (m <= 20)  return { text:`Klockan har gått över ${hw} med ${m} minuter: ${name}.`, link:['över', 'gått över'],
                           acts:[words_, { do:'hl', w:'both' }, { do:'glow', h:H }] };
    if (m === 25) return { text:`Det är 5 minuter kvar innan halv: ${name}.`, link:['i', 'innan'], acts:[words_, { do:'hl', w:'both' }] };
    if (m === 30) return { text:`Den blå visaren står mitt emellan ${H} och ${N}. ${cap(name)} betyder halvvägs till ${hourWord(h + 1)}.`, link:['halv', 'halvvägs'],
                           acts:[words_, { do:'hl', w:'h' }, { do:'arc', from:H % 12, upto:0.5 }, { do:'glow', h:N }] };
    if (m === 35) return { text:`5 minuter har gått över halv: ${name}.`, link:['över', 'gått över'], acts:[words_, { do:'hl', w:'both' }] };
    return { text:`Det är ${60 - m} minuter kvar innan ${nw}: ${name}.`, link:['i', 'innan'],
             acts:[words_, { do:'hl', w:'h' }, { do:'glow', h:N }] };
  }
  /* Runt halv: timmen är densamma som vid halv */
  function halfHourStep(h, m){
    const H = h12(h), N = h12(h + 1);
    return { text:`Den blå visaren är nära mitten mellan ${H} och ${N}. Timmen är samma som vid ${words(h, 30)}.`,
             acts:[{ do:'hl', w:'h' }, { do:'arc', from:H % 12, upto:m / 60 }, { do:'glow', h:N }] };
  }
  function explainSteps(task, mode = 'read', opts = {}){
    const confirm = !!opts.confirm;
    if (task.kind === 'dur') return durExplain(task, confirm);
    const { h, m } = task, target = toTot(h, m), digital = task.kind === 'digital';
    const out = [];
    const goActs = mode === 'set' && !confirm ? [{ do:'go', t:target, near:true, ms:1000 }] : [];
    const trio = { do:'trio', on:true, digital, words:false };
    if (digital){
      const hh = ((h % 24) + 24) % 24, dh = digitalHour(hh);
      const first = hh > 12 ? `Timmen är ${hh}. Efter 12 tar vi minus 12.`
        : hh === 0 ? 'Timmen är 00. På urtavlan är det 12.'
        : `Timmen är ${pad2(hh)}. Före 12 behövs inget minus.`;
      out.push({ text:confirm ? CONFIRM + lowFirst(first) : first,
                 acts:[trio, ...(mode === 'read' ? [{ do:'showAnalog' }] : []), { do:'hl', w:'h' }, ...goActs, dh.minus ? { do:'minus12' } : { do:'glow', h:dh.dial }] });
      out.push({ text:m === 0 ? 'Minuterna är 00. Då säger vi bara timmen.' : `Minuterna är ${pad2(m)}. Den röda visaren pekar på ${posOf(m)}.`,
                 acts:[{ do:'sum', text:null }, { do:'hl', w:'m' }, ...countActs(m)] });
    } else if (confirm){
      const look = m === 0 ? `den röda visaren ${mode === 'set' ? 'ska peka' : 'pekar'} rakt upp, på 12.` : `den röda visaren ${mode === 'set' ? 'ska peka' : 'pekar'} på ${posOf(m)}.`;
      out.push({ text:CONFIRM + look, acts:[trio, { do:'hl', w:'m' }, ...countActs(m)] });
    } else {
      const look = mode === 'set'
        ? (m === 0 ? 'Den röda visaren ska peka rakt upp, på 12.' : `Den röda visaren ska peka på ${posOf(m)}.`)
        : (m === 0 ? 'Titta på den röda visaren. Den pekar rakt upp, på 12.' : `Titta på den röda visaren. Den pekar på ${posOf(m)}.`);
      out.push({ text:look, acts:[trio, { do:'hl', w:'m' }, ...goActs] });
      out.push({ text:countLine(m), acts:[{ do:'hl', w:'m' }, ...countActs(m)] });
    }
    out.push(nameStep(h, m));
    if (m === 25 || m === 35) out.push(halfHourStep(h, m));
    out.push({ text:digital ? `${digi(h, m)} är ${digitalWords(h, m)}.` : `Klockan är ${words(h, m)}.`, acts:[{ do:'hl', w:'both' }], done:true });
    return out;
  }
  function durExplain(task, confirm = false){
    const hrs = Math.floor(task.mins / 60), rest = task.mins % 60;
    const t1 = toTot(task.h1, task.m1), start = words(task.h1, task.m1), end = words(task.h2, task.m2);
    const hourTxt = hrs === 0 ? 'Först hela timmar: ett helt varv går förbi sluttiden. Här blir det inga hela timmar.'
      : hrs === 1 ? 'Först hela timmar: den röda visaren går ett helt varv. Det är 1 timme.'
      : `Först hela timmar: den röda visaren går två hela varv. Det är ${hrs} timmar.`;
    const minTxt = rest === 0 ? `Inga minuter till: klockan är redan ${end}.`
      : `Sedan minuterna: den röda visaren går ${rest / 5} steg.`;
    const first = `Vi börjar när klockan är ${start}.`;
    const from = task.m1;
    return [
      { text:confirm ? CONFIRM + lowFirst(first) : first,
        acts:[{ do:'time', t:t1 }, { do:'trio', on:true, digital:false, words:true }, { do:'hl', w:'both' }, { do:'chip', reset:true }] },
      { text:hourTxt, acts:[{ do:'hl', w:'m' }, ...(hrs ? [{ do:'go', t:t1 + hrs * 60, ms:1600 }, { do:'chip', text:durWords(hrs * 60) }] : [])] },
      { text:minTxt, acts:[{ do:'hl', w:'m' }, ...(rest ? [{ do:'count', from, to:from + rest, c:'gone', move:true }] : [])] },
      { text:`Det tar ${durWords(task.mins)}.`, acts:[{ do:'hl', w:'both' }, ...(hrs && rest ? [{ do:'chip', total:durWords(task.mins) }] : [])], done:true },
    ];
  }

  /* ═══════════════════════════════════════════════════════════
     LEKTIONERNA: klickstyrda på en stor klocka med digital tid och tiden i ord
     bredvid (de tre representationerna, synkrona). Varje steg är en idé;
     texten visas först, sedan rörelsen (acts), slutsatsen sist.
     link:[ordet i tiden, ordet i förklaringen] – de två lyser upp ihop.
     acts: time (sätt), go (rör visarna), hl (lys upp visare), trio (digital tid
     och ord under klockan), words (orden tänds), map (minutkartans lager),
     nums (minuttalen tänds ett i taget), hnums (timsiffrorna tänds), glow (en
     timsiffra lyser), fill, quarters, arc (timvisarens väg), count (räkningen i
     femsteg med summan), sum (en rad i marginalen), clear, ring24 (dygnsringen),
     rev (timvisaren går runt), minus12, lap (ett helt varv), bed (läggdags),
     pulse (den digitala klockan), chip (Hur lång tid).
     Efter demonstrationen: försöken (LESSON_TRIES), minst en läs- och en ställuppgift.
  ═══════════════════════════════════════════════════════════ */
  const T = (h, m) => toTot(h, m);
  const LESSONS = {
    hela: [
      { text:'Klockan har två visare. Den korta blå visar timmen.', acts:[{ do:'time', t:T(2, 40) }, { do:'hl', w:'h' }, { do:'hnums' }] },
      { text:'Den långa röda visar minuterna.', acts:[{ do:'clear' }, { do:'hl', w:'m' }] },
      { text:'När den röda visaren pekar rakt upp på 12 är det en hel timme.', acts:[{ do:'hl', w:'m' }, { do:'go', t:T(3, 0), ms:1200 }] },
      { text:'Den blå visaren pekar på 3. Klockan är tre.', acts:[{ do:'hl', w:'h' }, { do:'glow', h:3 }, { do:'trio', on:true }] },
    ],
    halv: [
      { text:'Klockan är två.', acts:[{ do:'time', t:T(2, 0) }, { do:'hl', w:'both' }, { do:'trio', on:true }] },
      { text:'Den röda visaren går ett halvt varv, från 12 till 6.', acts:[{ do:'hl', w:'m' }, { do:'count', from:0, to:30, c:'gone', move:true }] },
      { text:'Titta på den blå visaren. Den har också flyttat sig, halvvägs från 2 mot 3.', acts:[{ do:'hl', w:'h' }, { do:'arc', from:2, upto:0.5 }] },
      { text:'Halv tre betyder halvvägs till tre.', link:['halv', 'halvvägs'], acts:[{ do:'hl', w:'both' }, { do:'glow', h:3 }] },
      { text:'Den digitala klockan visar 02:30. Det har gått 30 minuter.', acts:[{ do:'pulse' }] },
    ],
    kvart: [
      { text:'Urtavlan kan delas i fyra lika stora delar. Varje del är en kvart.', acts:[{ do:'time', t:T(4, 0) }, { do:'hl', w:null }, { do:'quarters' }] },
      { text:'Den röda visaren går en del, från 12 till 3.', acts:[{ do:'trio', on:true }, { do:'hl', w:'m' }, { do:'count', from:0, to:15, c:'gone', move:true }] },
      { text:'Klockan har gått över fyra med en kvart: kvart över fyra.', link:['över', 'gått över'], acts:[{ do:'hl', w:'both' }, { do:'glow', h:4 }] },
      { text:'Den röda visaren fortsätter till 9.', acts:[{ do:'clear' }, { do:'quarters' }, { do:'sum', text:null }, { do:'hl', w:'m' }, { do:'go', t:T(4, 45), ms:1200 }] },
      { text:'Nu räknar vi det som är kvar till 12.', acts:[{ do:'count', from:45, to:60, c:'left' }] },
      { text:'Det är 15 minuter kvar innan fem: kvart i fem.', link:['i', 'innan'], acts:[{ do:'hl', w:'h' }, { do:'glow', h:5 }] },
    ],
    ftt: [
      { text:'Varje siffra på urtavlan är 5 minuter för den röda visaren.', acts:[{ do:'time', t:T(3, 0) }, { do:'trio', on:true }, { do:'hl', w:'m' }, { do:'nums' }] },
      { text:'Den röda visaren går två steg.', acts:[{ do:'count', from:0, to:10, c:'gone', move:true }] },
      { text:'Klockan har gått över tre med 10 minuter: tio över tre.', link:['över', 'gått över'], acts:[{ do:'hl', w:'both' }, { do:'glow', h:3 }] },
      { text:'Nu är klockan 07:40. Den röda visaren står på 8.', acts:[{ do:'clear' }, { do:'sum', text:null }, { do:'time', t:T(7, 40) }, { do:'hl', w:'m' }] },
      { text:'Vi räknar det som är kvar till 12.', acts:[{ do:'count', from:40, to:60, c:'left' }] },
      { text:'Det är 20 minuter kvar innan åtta: tjugo i åtta.', link:['i', 'innan'], acts:[{ do:'hl', w:'h' }, { do:'glow', h:8 }] },
      { text:'På högra halvan säger vi över. På vänstra halvan säger vi i.', acts:[{ do:'clear' }, { do:'hl', w:null }, { do:'map', parts:['nums', 'over', 'i'] }] },
    ],
    runt: [
      { text:'Halv åtta. Den röda visaren står på 6.', acts:[{ do:'time', t:T(7, 30) }, { do:'trio', on:true }, { do:'hl', w:'m' }, { do:'map', parts:['nums'] }] },
      { text:'Den röda visaren backar ett steg, till 5.', acts:[{ do:'go', t:T(7, 25), ms:700 }, { do:'count', from:25, to:30, c:'left' }] },
      { text:'Det är fem minuter kvar innan halv: fem i halv åtta.', link:['i', 'innan'], acts:[{ do:'hl', w:'both' }] },
      { text:'Nu går den röda visaren till 7.', acts:[{ do:'clear' }, { do:'hl', w:'m' }, { do:'go', t:T(7, 35), ms:900 }, { do:'count', from:30, to:35, c:'gone' }] },
      { text:'Fem minuter har gått över halv: fem över halv åtta.', link:['över', 'gått över'], acts:[{ do:'hl', w:'both' }] },
      { text:'Runt halv räknar vi från 6:an, inte från 12.', acts:[{ do:'clear' }, { do:'sum', text:null }, { do:'hl', w:'m' }, { do:'map', parts:['nums', 'runt'] }] },
      { text:'Timmen är samma som vid halv: halv åtta, fem i halv åtta, fem över halv åtta.', acts:[{ do:'time', t:T(7, 30) }, { do:'hl', w:'h' }, { do:'arc', from:7, upto:0.5 }, { do:'glow', h:8 }] },
    ],
    digital: [
      { text:'Den vanliga klockan har 12 timmar på urtavlan.', acts:[{ do:'time', t:T(0, 0) }, { do:'hl', w:'h' }, { do:'hnums' }] },
      { text:'Under ett dygn går den blå visaren runt två gånger. Första varvet är natten och förmiddagen.',
        acts:[{ do:'clear' }, { do:'trio', on:true, digital:true }, { do:'ring24', mode:'am' }, { do:'rev', t:T(12, 0), ms:1600 }] },
      { text:'Andra varvet är eftermiddagen och kvällen.', acts:[{ do:'ring24', mode:'pm', keep:true }, { do:'rev', t:24 * 60, ms:1600 }] },
      { text:'Ett dygn har 24 timmar: två varv med 12 timmar.', acts:[{ do:'sum', text:'12 + 12 = 24', cls:'h' }] },
      { text:'Den digitala klockan fortsätter räkna efter 12: 13, 14, 15 och så vidare.',
        acts:[{ do:'sum', text:null }, { do:'time', t:T(12, 0) }, { do:'ring24', mode:'pm', seq:true }] },
      { text:'Klockan är 13:00. 13 − 12 = 1.', acts:[{ do:'hl', w:'h' }, { do:'go', t:T(13, 0), ms:1000 }, { do:'minus12' }] },
      { text:'Vi tar minus 12 eftersom den blå visaren redan har gått ett helt varv. Ett varv är 12 timmar.', acts:[{ do:'hl', w:'h' }, { do:'lap' }] },
      { text:'Du lägger dig ungefär klockan 20:00: åtta på kvällen.',
        acts:[{ do:'clear' }, { do:'sum', text:null }, { do:'rev', t:T(20, 0), ms:900 }, { do:'bed', at:T(20, 0), who:'du' }, { do:'minus12' }] },
      { text:'Vuxna lägger sig ofta runt 22:30: halv elva på kvällen.',
        acts:[{ do:'go', t:T(22, 30), ms:1000 }, { do:'bed', at:T(22, 30), who:'vuxna' }, { do:'minus12' }] },
      { text:'Den blå visaren står mitt emellan 10 och 11. Halv elva betyder halvvägs till elva.', link:['halv', 'halvvägs'],
        acts:[{ do:'hl', w:'h' }, { do:'arc', from:10, upto:0.5 }, { do:'glow', h:11 }] },
      { text:'Före 12 behövs inget minus. Skolan börjar ungefär 08:00: åtta på morgonen.',
        acts:[{ do:'clear' }, { do:'sum', text:null }, { do:'ring24', mode:'am', all:true }, { do:'time', t:T(8, 0) }, { do:'hl', w:'h' }, { do:'glow', h:8 }] },
    ],
    tid: [
      { text:'Vi ska räkna tiden från kvart över tre till kvart i fem.', acts:[{ do:'time', t:T(3, 15) }, { do:'trio', on:true }, { do:'hl', w:'both' }, { do:'chip', reset:true }] },
      { text:'Först hela timmar. Den röda visaren går ett helt varv: det är 1 timme.', acts:[{ do:'hl', w:'m' }, { do:'go', t:T(4, 15), ms:1600 }, { do:'chip', text:'1 timme' }] },
      { text:'Ett varv till skulle gå förbi kvart i fem. Nu räknar vi minuter i stället.', acts:[{ do:'hl', w:null }] },
      { text:'Den röda visaren går från 3 till 9. Varje steg är 5 minuter.', acts:[{ do:'hl', w:'m' }, { do:'count', from:15, to:45, c:'gone', move:true }] },
      { text:'Ihop: 1 timme och 30 minuter.', acts:[{ do:'hl', w:'both' }, { do:'chip', total:'1 timme och 30 minuter' }] },
    ],
  };

  /* Försöken efter demonstrationen: tider ur stegets egna tolv (lådorna räknas som i Öva). */
  const LESSON_TRIES = {
    hela:    [['read', '7:00'], ['set', '5:00']],
    halv:    [['read', '6:30'], ['set', '3:30']],
    kvart:   [['read', '9:15'], ['read', '8:45'], ['set', '3:45']],
    ftt:     [['read', '10:40'], ['read', '5:50'], ['set', '9:20']],
    runt:    [['read', '1:25'], ['read', '2:35'], ['set', '3:35']],
    digital: [['read', '15:15'], ['read', '19:20'], ['set', '20:40']],
    tid:     [['read', '5:15-6:45'], ['set', '9:10-9:50']],
  };
  const lessonTries = id => (LESSON_TRIES[id] || []).map(([type, key]) => ({ type, key }));
  /* Försökets uppmaning (i bubblan) */
  const TRY_HEAD = 'Nu får du försöka! Med det vi nyss visade.';
  function tryPrompt(task, type, again = false){
    const head = again ? 'Nu du igen.' : TRY_HEAD;
    if (type === 'set'){
      if (task.kind === 'dur') return `${head} Klockan är ${words(task.h1, task.m1)}. Ställ klockan ${durWords(task.mins)} senare.`;
      return `${head} Ställ klockan på ${task.kind === 'digital' ? digi(task.h, task.m) : words(task.h, task.m)}.`;
    }
    if (task.kind === 'dur') return `${head} Hur lång tid är det från ${words(task.h1, task.m1)} till ${words(task.h2, task.m2)}?`;
    return `${head} Vad tror du klockan är här?`;
  }
  const RETRY_OK = 'Rätt! Bra att du försökte igen.';
  const LESSON_END = 'Bra jobbat! Nu kan du öva på hela steget.';

  /* Hur länge ett steg rör sig (ms): Nästa-knappen är låst så länge, högst ungefär 2 s */
  function actMs(a){
    switch (a.do){
      case 'go': return a.ms || 1200;
      case 'rev': return a.ms || 1600;
      case 'count': { const n = Math.round((a.to - a.from) / 5); return n * countStepMs(n); }
      case 'nums': return 12 * 120;
      case 'hnums': return 12 * 100;
      case 'fill': return 350;
      case 'quarters': case 'arc': return 300;
      case 'minus12': return 800;
      case 'ring24': return a.seq ? 12 * 110 : 0;
    }
    return 0;
  }
  const stepMs = st => st.acts.reduce((s, a) => s + actMs(a), 0);

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

  /* Alla texter barnet kan få se i lektioner och förklaringar (textsvepet):
     lektionerna, förklaringen vid fel och den bekräftande förklaringen (läs och ställ)
     för varje tid i varje steg, berömmet och inledningarna vid fel. */
  function allTexts(){
    const out = [];
    for (const id in LESSONS) LESSONS[id].forEach(s => out.push(s.text));
    for (const s of STEPS) for (const t of s.tasks) for (const mode of ['read', 'set']){
      explainSteps(t, mode).forEach(x => out.push(x.text));
      explainSteps(t, mode, { confirm:true }).forEach(x => out.push(x.text));
    }
    out.push(...PRAISE, NEAR_LEAD, FAR_LEAD, RETRY_OK, LESSON_END);
    return out;
  }
  /* Försökens uppmaningar (de får vara frågor) */
  function promptTexts(){
    const out = [];
    for (const id in LESSON_TRIES) for (const tr of lessonTries(id)){
      const t = taskByKey(id, tr.key);
      out.push(tryPrompt(t, tr.type), tryPrompt(t, tr.type, true));
    }
    return out;
  }

  return {
    DAY, HALF_DAY, norm, toTot, hOf, mOf, h12, pad2, digi, words, wordsT, hourWord,
    PERIODS, periodOf, periodPhrase, digitalWords, durWords, diffFwd,
    STEPS, stepById, stepOfMinute, answerText, targetTot, setStart, sameOnDial, taskByKey,
    handAngles, angleOf, angDist, snapMinute, dragMinute, dragHour, pickHand,
    PRIO, wrongTime, readOptions, explainSteps, nearMiss, wrongLead, NEAR_LEAD, FAR_LEAD, PRAISE, praise, CONFIRM,
    sumText, countSpec, countTotal, countStepMs, digitalHour,
    LESSONS, LESSON_TRIES, lessonTries, tryPrompt, TRY_HEAD, RETRY_OK, LESSON_END, actMs, stepMs, MAP_PARTS, mapLevel,
    stepViews, stepMedal, recordBox, validBoxes,
    RTYPES, RNAME, RHELP, PRESETS, RMAX, clampCount, normCounts, roundTypes, presetFor, countsFrom, buildRounds, passPlan, planSummary, varvTxt, talord, cap,
    kanTxt, allTexts, promptTexts, shuffle:clockShuffle,
  };
})();

if (typeof window !== 'undefined') window.ClockLogic = ClockLogic;
if (typeof module !== 'undefined' && module.exports) module.exports = ClockLogic;
