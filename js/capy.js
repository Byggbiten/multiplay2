/* ============================================================
   MULTIPLAY – Capybara-samlingen (window.Capy)  · FAS 4 steg 2, v34

   Belöningssystemet barnen önskat: 24 samlarkort med kawaii-
   capybaror i utstyrslar (Mira & Zeldas direktiv 2026-07-03).

   Tre delar:
   1) KORTPOOLEN  – komponerbar SVG: EN gemensam bas-capybara
      (rund, stora glansiga ögon, rosiga kinder, platt capybara-
      nos) + per kort tillbehör, färgtema och bakgrundsplatta.
      Legendariska får extra effekter (gnistror, gradient-päls).
   2) MOTORN      – Capy.award(profile, event) anropas som REN
      SIDOEFFEKT från resultatflödena (aldrig före poäng/logg,
      får aldrig kasta – hookarna har try/catch). Milstolpar
      köas (pending) så inget kort någonsin går förlorat; max
      ETT kort delas ut per resultat.
   3) VYERNA      – NYTT KORT-overlayn (flip + skimmer + konfetti)
      och Samlingen (screen-collection / #capy-root).

   Lagring (raderas i Store.deleteProfile):
     capy_cards_<id>  – { kortId: ISO-datum } (aldrig förlora kort)
     capy_state_<id>  – milstolpe-räknare + pending-kö
   ============================================================ */
'use strict';

const Capy = (() => {

  /* ── Lagringsnycklar ─────────────────────────────────── */
  const CARDS_KEY = id => `capy_cards_${id}`;
  const STATE_KEY = id => `capy_state_${id}`;

  /* ══════════════════════════════════════════════════════
     1) KORTPOOLEN – 24 kort (10 vanliga · 8 sällsynta · 6 legendariska)
     acc = tillbehörs-nyckel för SVG-kompositören nedan.
  ══════════════════════════════════════════════════════ */
  const CARDS = [
    /* ---- VANLIGA (10) ---- */
    { id:'sov',       name:'Sov-Capy',          emoji:'💤', rar:'vanlig', acc:'sov',
      bg:['#e6e0fb','#cfc3f5'], flavor:'Sov-Capy drömmer om multiplikation… zzz 💤' },
    { id:'glass',     name:'Glass-bara',        emoji:'🍦', rar:'vanlig', acc:'glass',
      bg:['#ffe9f2','#ffd1e5'], flavor:'Glass-bara bjuder på en kula för varje rätt svar! 🍦' },
    { id:'bad',       name:'Bad-Capy',          emoji:'🛁', rar:'vanlig', acc:'bad',
      bg:['#dff4ff','#bfe6fb'], flavor:'Capybaror ÄLSKAR bad – precis som Bad-Capy! 🛁' },
    { id:'fotboll',   name:'Fotbolls-bara',     emoji:'⚽', rar:'vanlig', acc:'fotboll',
      bg:['#e3f9e9','#c4f0d2'], flavor:'Fotbolls-bara gör mål varje gång du tränar! ⚽' },
    { id:'malar',     name:'Målar-Capy',        emoji:'🎨', rar:'vanlig', acc:'malar',
      bg:['#fff1e2','#ffdec2'], flavor:'Målar-Capy målar dina framsteg i regnbågens färger 🎨' },
    { id:'kock',      name:'Kock-ybara',        emoji:'🍳', rar:'vanlig', acc:'kock',
      bg:['#fdf6e3','#f7e8c3'], flavor:'Kock-ybara rör ihop en soppa av siffror! 🍲' },
    { id:'cykel',     name:'Cykel-Capy',        emoji:'🚲', rar:'vanlig', acc:'cykel',
      bg:['#e2f7f3','#c2ece4'], flavor:'Cykel-Capy trampar på – precis som du! 🚲' },
    { id:'blomster',  name:'Blomster-bara',     emoji:'🌸', rar:'vanlig', acc:'blomster',
      bg:['#ffeef5','#fcd6e8'], flavor:'Blomster-bara blommar när du övar 🌸' },
    { id:'las',       name:'Läs-Capy',          emoji:'📚', rar:'vanlig', acc:'las',
      bg:['#f4eee2','#e8dcc4'], flavor:'Läs-Capy har läst ALLA mattetal – två gånger 📚' },
    { id:'sjorovar',  name:'Sjörövar-bara',     emoji:'🏴‍☠️', rar:'vanlig', acc:'sjorovar',
      bg:['#e3ecf5','#c8d9ea'], flavor:'Arrr! Sjörövar-bara har hittat en skatt: dig! 🏴‍☠️' },

    /* ---- SÄLLSYNTA (8) ---- */
    { id:'wizard',    name:'Wizard-Capy',       emoji:'🧙', rar:'sallsynt', acc:'wizard',
      bg:['#efe4ff','#d9c2fb'], flavor:'Wizard-Capy trollar fram rätt svar – simsalabim! 🧙' },
    { id:'rock',      name:'Rock-ybara',        emoji:'🎸', rar:'sallsynt', acc:'rock',
      bg:['#ffe4ec','#fcc3d9'], flavor:'Rock-ybara spelar ett solo för dina framsteg! 🎸' },
    { id:'astro',     name:'Astro-Capy',        emoji:'🚀', rar:'sallsynt', acc:'astro',
      bg:['#dfe6fb','#bccbf5'], flavor:'Astro-Capy räknar stjärnor i rymden 🚀' },
    { id:'ninja',     name:'Ninja-bara',        emoji:'🥷', rar:'sallsynt', acc:'ninja',
      bg:['#e4e7ef','#c6ccdd'], flavor:'Ninja-bara smyger fram till rätt svar 🥷' },
    { id:'prinsess',  name:'Prinsess-Capy',     emoji:'👑', rar:'sallsynt', acc:'prinsess',
      bg:['#ffeef8','#fbd0ec'], flavor:'Prinsess-Capy bjuder in dig till mattebalen 👑' },
    { id:'doktor',    name:'Doktor-bara',       emoji:'🩺', rar:'sallsynt', acc:'doktor',
      bg:['#e4f5fb','#c6e8f5'], flavor:'Doktor-bara säger: träning är bästa medicinen! 🩺' },
    { id:'detektiv',  name:'Detektiv-Capy',     emoji:'🔍', rar:'sallsynt', acc:'detektiv',
      bg:['#f2ead9','#e4d4b4'], flavor:'Detektiv-Capy har spårat upp alla svåra tal 🔍' },
    { id:'vinter',    name:'Vinter-bara',       emoji:'⛷️', rar:'sallsynt', acc:'vinter',
      bg:['#e8f4ff','#cde5fb'], flavor:'Vinter-bara susar nerför pisterna – full fart! ⛷️' },

    /* ---- LEGENDARISKA (6) ---- */
    { id:'guld',      name:'Guld-Capy',         emoji:'✨', rar:'legendarisk', acc:'guld',
      bg:['#fff4d6','#fbd88a'], flavor:'WOW! Guld-Capy skiner precis lika starkt som du ✨' },
    { id:'regnbage',  name:'Regnbågs-bara',     emoji:'🌈', rar:'legendarisk', acc:'regnbage',
      bg:['#e8f4ff','#ffe4f4'], flavor:'Regnbågs-bara sprider färg över hela samlingen 🌈' },
    { id:'drak',      name:'Drak-Capy',         emoji:'🐉', rar:'legendarisk', acc:'drak',
      bg:['#ddf5ec','#b3e6d4'], flavor:'Drak-Capy vaktar samlingens största skatt – dig! 🐉' },
    { id:'stjarn',    name:'Stjärn-bara',       emoji:'🌟', rar:'legendarisk', acc:'stjarn',
      bg:['#e2e4fb','#c3c8f7'], flavor:'Stjärn-bara lyser upp natthimlen åt dig 🌟' },
    { id:'minnesmastare', name:'Minnesmästar-Capy', emoji:'🏆', rar:'legendarisk', acc:'minnesmastare',
      bg:['#fdf0d5','#f6dc9d'], flavor:'Minnesmästar-Capy bugar för ditt superminne! 🏆' },
    { id:'matte',     name:'Matte-Capy',        emoji:'🧮', rar:'legendarisk', acc:'matte',
      bg:['#f0e6ff','#d8c4fa'], flavor:'MATTE-CAPY! Du har samlat alla medaljer – legendariskt! 🧮' },
  ];

  const RAR_LABEL = { vanlig:'Vanlig', sallsynt:'Sällsynt', legendarisk:'Legendarisk' };
  const TOTAL = CARDS.length; // 24
  const byId = {};
  CARDS.forEach(c => { byId[c.id] = c; });

  /* ══════════════════════════════════════════════════════
     SVG-KOMPOSITÖREN
     Bas-capybaran ritas EN gång (kawaii: knubbig kropp, stort
     huvud med platt nos-parti, små öron, STORA glansiga ögon,
     rosiga kinder, små tassar) och färgsätts/kläs per kort.
  ══════════════════════════════════════════════════════ */
  let uid = 0;

  /* Standardpäls (varmbrun #b08968-familjen) */
  const FUR = { fur:'#b08968', furD:'#96714f', muz:'#cfae8a', belly:'#c9a985' };

  function sparkle(x, y, r, fill, op) {
    return `<path d="M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28} Z" fill="${fill}" opacity="${op || 0.9}"/>`;
  }

  /* Bas-capybaran. o: {fur,furD,muz,belly,eyes:'open'|'sleepy'|'none',plain} */
  function capyBody(o) {
    const fur = o.fur, furD = o.furD, muz = o.muz;
    let eyes = '';
    if (o.eyes === 'sleepy') {
      eyes = `<path d="M37 39q5 4.4 10 0" stroke="#2f2333" stroke-width="2.8" fill="none" stroke-linecap="round"/>
              <path d="M73 39q5 4.4 10 0" stroke="#2f2333" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
    } else if (o.eyes !== 'none') {
      eyes = `<circle cx="42" cy="38" r="5.4" fill="#2f2333"/><circle cx="44" cy="36" r="2" fill="#fff"/>
              <circle cx="78" cy="38" r="5.4" fill="#2f2333"/><circle cx="80" cy="36" r="2" fill="#fff"/>`;
    }
    const face = o.plain ? '' : `
      ${eyes}
      <ellipse cx="54" cy="54" rx="2.6" ry="1.9" fill="#5f4632"/>
      <ellipse cx="66" cy="54" rx="2.6" ry="1.9" fill="#5f4632"/>
      <path d="M56 61q4 3.4 8 0" stroke="#5f4632" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="34" cy="49" rx="4.8" ry="3.4" fill="#f2a0b5" opacity="0.85"/>
      <ellipse cx="86" cy="49" rx="4.8" ry="3.4" fill="#f2a0b5" opacity="0.85"/>`;
    return `
      <ellipse cx="60" cy="86" rx="31" ry="21" fill="${fur}"/>
      <ellipse cx="60" cy="91" rx="18" ry="11" fill="${o.belly || FUR.belly}" opacity="${o.plain ? 0 : 0.55}"/>
      <ellipse cx="46" cy="104" rx="7" ry="4.6" fill="${furD}"/>
      <ellipse cx="74" cy="104" rx="7" ry="4.6" fill="${furD}"/>
      <circle cx="38" cy="15" r="7" fill="${furD}"/><circle cx="82" cy="15" r="7" fill="${furD}"/>
      ${o.plain ? '' : `<circle cx="38" cy="14" r="3" fill="#8a6a4f"/><circle cx="82" cy="14" r="3" fill="#8a6a4f"/>`}
      <rect x="29" y="15" width="62" height="54" rx="26" fill="${fur}"/>
      ${o.plain ? '' : `<rect x="42" y="45" width="36" height="23" rx="11.5" fill="${muz}"/>`}
      ${face}`;
  }

  /* Tillbehör per kort: { back, front, eyes, fur-override } */
  function accessory(key, u) {
    switch (key) {

      case 'sov': return { eyes:'sleepy', front: `
        <path d="M30 24 Q56 2 90 9 L82 21 Q56 13 36 31 Q30 29 30 24 Z" fill="#8f7fd6"/>
        <rect x="29" y="17" width="58" height="8" rx="4" fill="#b3a6e8" transform="rotate(-6 58 21)"/>
        <circle cx="91" cy="12" r="5" fill="#fff"/>
        <text x="100" y="30" font-family="'Baloo 2',cursive" font-weight="800" font-size="13" fill="#8f7fd6">z</text>
        <text x="106" y="20" font-family="'Baloo 2',cursive" font-weight="800" font-size="10" fill="#b3a6e8">z</text>` };

      case 'glass': return { front: `
        <path d="M89 90 L103 90 L96 111 Z" fill="#e8b26b" stroke="#c98f43" stroke-width="1.2"/>
        <path d="M91 96 L101 96 M90 92 L102 92" stroke="#c98f43" stroke-width="0.9"/>
        <circle cx="92" cy="85" r="6" fill="#f9c6d8"/><circle cx="100" cy="85" r="6" fill="#fdf0c2"/>
        <circle cx="96" cy="79" r="5.4" fill="#fff"/><circle cx="96" cy="74.6" r="2.4" fill="#ef4444"/>` };

      case 'bad': return { front: `
        <path d="M8 97 Q20 90 32 97 T56 97 T80 97 T104 97 L112 97 L112 116 L8 116 Z" fill="#7cc4f0" opacity="0.9"/>
        <path d="M8 100 Q22 94 36 100 T64 100 T92 100 T112 100" stroke="#a8d9f7" stroke-width="3" fill="none"/>
        <circle cx="24" cy="91" r="3" fill="#fff" opacity="0.8"/><circle cx="31" cy="87" r="2" fill="#fff" opacity="0.7"/>
        <ellipse cx="95" cy="92" rx="6" ry="4.6" fill="#fbd75b"/>
        <circle cx="100" cy="87" r="3.6" fill="#fbd75b"/>
        <path d="M103 87 L107 88 L103 89.6 Z" fill="#f59e0b"/>
        <circle cx="101.4" cy="86" r="0.9" fill="#2f2333"/>` };

      case 'fotboll': return { front: `
        <circle cx="93" cy="98" r="10.5" fill="#fff" stroke="#2f2333" stroke-width="1.6"/>
        <polygon points="93,93 97.6,96.4 95.8,101.6 90.2,101.6 88.4,96.4" fill="#2f2333"/>
        <path d="M93 87.5 L93 93 M97.6 96.4 L103 94.6 M95.8 101.6 L98.6 106.4 M90.2 101.6 L87.4 106.4 M88.4 96.4 L83 94.6" stroke="#2f2333" stroke-width="1.2"/>` };

      case 'malar': return { front: `
        <ellipse cx="46" cy="12" rx="17" ry="7.5" fill="#e85a4f" transform="rotate(-8 46 12)"/>
        <circle cx="46" cy="5" r="2.4" fill="#c73e33"/>
        <ellipse cx="25" cy="95" rx="12" ry="9" fill="#e8cfa7" stroke="#c9a26d" stroke-width="1.2"/>
        <circle cx="20" cy="92" r="2" fill="#ef4444"/><circle cx="26" cy="90" r="2" fill="#3b82f6"/>
        <circle cx="31" cy="93" r="2" fill="#22c55e"/><circle cx="29" cy="98" r="2" fill="#f59e0b"/>
        <path d="M34 103 L46 91" stroke="#8a6a4f" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M46 91 L49 88" stroke="#9333ea" stroke-width="3.6" stroke-linecap="round"/>` };

      case 'kock': return { front: `
        <circle cx="45" cy="9" r="8" fill="#fff"/><circle cx="60" cy="5" r="9" fill="#fff"/><circle cx="75" cy="9" r="8" fill="#fff"/>
        <rect x="43" y="7" width="34" height="12" fill="#fff"/>
        <rect x="43" y="17" width="34" height="5" rx="2.5" fill="#e5e7eb"/>
        <path d="M95 84 Q104 76 106 82 Q108 88 99 90 L94 104" stroke="#b48a5a" stroke-width="3.4" fill="none" stroke-linecap="round"/>` };

      case 'cykel': return { front: `
        <path d="M31 22 Q60 -2 89 22 L85 27 Q60 10 35 27 Z" fill="#34b3a0" stroke="#238b7c" stroke-width="1.2"/>
        <path d="M45 15 L48 24 M60 11 L60 21 M75 15 L72 24" stroke="#238b7c" stroke-width="2"/>
        <path d="M34 26 Q34 36 42 40 M86 26 Q86 36 78 40" stroke="#238b7c" stroke-width="1.6" fill="none"/>
        <path d="M86 96 Q92 88 100 92 M100 92 L100 84 M95 84 L105 84" stroke="#475569" stroke-width="2.6" fill="none" stroke-linecap="round"/>` };

      case 'blomster': return { front: (() => {
        const flower = (x, y, c) => `
          <circle cx="${x - 3.4}" cy="${y}" r="2.5" fill="${c}"/><circle cx="${x + 3.4}" cy="${y}" r="2.5" fill="${c}"/>
          <circle cx="${x}" cy="${y - 3.4}" r="2.5" fill="${c}"/><circle cx="${x}" cy="${y + 3.4}" r="2.5" fill="${c}"/>
          <circle cx="${x}" cy="${y}" r="2.4" fill="#fbbf24"/>`;
        return `<path d="M32 18 Q60 6 88 18" stroke="#4ade80" stroke-width="3" fill="none"/>
          ${flower(36, 17, '#f472b6')}${flower(48, 12, '#c084fc')}${flower(60, 10, '#fb7185')}
          ${flower(72, 12, '#60a5fa')}${flower(84, 17, '#f472b6')}`;
      })() };

      case 'las': return { front: `
        <circle cx="42" cy="38" r="8.6" fill="rgba(255,255,255,0.35)" stroke="#5f4632" stroke-width="2"/>
        <circle cx="78" cy="38" r="8.6" fill="rgba(255,255,255,0.35)" stroke="#5f4632" stroke-width="2"/>
        <path d="M50.6 37 Q60 33 69.4 37" stroke="#5f4632" stroke-width="2" fill="none"/>
        <path d="M36 97 Q48 90 60 97 Q72 90 84 97 L84 110 Q72 103 60 110 Q48 103 36 110 Z" fill="#fff" stroke="#c9a26d" stroke-width="1.4"/>
        <path d="M60 97 L60 110" stroke="#c9a26d" stroke-width="1.4"/>
        <path d="M42 100 Q51 95 57 99 M42 104 Q51 99 57 103 M63 99 Q69 95 78 100 M63 103 Q69 99 78 104" stroke="#94a3b8" stroke-width="1" fill="none"/>` };

      case 'sjorovar': return { front: `
        <path d="M24 22 Q60 -8 96 22 Q78 12 60 12 Q42 12 24 22 Z" fill="#2f2333"/>
        <path d="M24 22 Q42 16 60 16 Q78 16 96 22 Q78 26 60 26 Q42 26 24 22 Z" fill="#463850"/>
        <circle cx="60" cy="12" r="3" fill="#fff"/><path d="M56.6 16 L63.4 16 M58 18 L62 18" stroke="#fff" stroke-width="1.2"/>
        <circle cx="78" cy="38" r="7" fill="#2f2333"/>
        <path d="M30 30 L86 44" stroke="#2f2333" stroke-width="2.6"/>` };

      case 'wizard': return { front: `
        <ellipse cx="60" cy="21" rx="31" ry="7" fill="#7c3aed"/>
        <path d="M40 20 Q57 -16 76 -2 Q66 0 71 8 Q76 16 80 20 Q60 13 40 20 Z" fill="#8b5cf6"/>
        <path d="M40 20 Q60 26 80 20" stroke="#fbbf24" stroke-width="2.4" fill="none"/>
        ${sparkle(52, 8, 2.6, '#fde68a')}${sparkle(66, 4, 2, '#fff')}
        <path d="M92 100 L106 82" stroke="#8a6a4f" stroke-width="3" stroke-linecap="round"/>
        ${sparkle(108, 79, 4, '#fbbf24')}${sparkle(102, 72, 2, '#fde68a')}` };

      case 'rock': return { front: `
        <rect x="29" y="14" width="62" height="9" rx="4.5" fill="#ef4444"/>
        <path d="M91 18 Q101 14 103 22 Q98 22 96 27 Z" fill="#ef4444"/>
        <ellipse cx="88" cy="94" rx="10" ry="9" fill="#f97316" stroke="#c2570b" stroke-width="1.4"/>
        <ellipse cx="90" cy="83" rx="6.6" ry="6" fill="#f97316" stroke="#c2570b" stroke-width="1.4"/>
        <circle cx="88" cy="94" r="3.4" fill="#7c3413"/>
        <path d="M92 79 L104 57" stroke="#8a5a3b" stroke-width="4" stroke-linecap="round"/>
        <rect x="100" y="52" width="8" height="7" rx="2" fill="#475569" transform="rotate(28 104 55)"/>
        <path d="M87 92 L102 62 M89.5 93.5 L104 64" stroke="#fde68a" stroke-width="0.9"/>` };

      case 'astro': return { back: `
        ${sparkle(14, 24, 3, '#fff', 0.8)}${sparkle(106, 18, 2.4, '#fff', 0.7)}${sparkle(104, 62, 2, '#fde68a', 0.7)}${sparkle(16, 70, 2, '#fde68a', 0.6)}`,
        front: `
        <circle cx="60" cy="40" r="35" fill="rgba(191,226,255,0.28)" stroke="#e3f0ff" stroke-width="3"/>
        <path d="M32 28 Q40 16 52 12" stroke="#fff" stroke-width="2.4" fill="none" opacity="0.7" stroke-linecap="round"/>
        <rect x="40" y="72" width="40" height="8" rx="4" fill="#e5e7eb"/>
        <circle cx="60" cy="5" r="3" fill="#ef4444"/><path d="M60 8 L60 14" stroke="#94a3b8" stroke-width="2"/>` };

      case 'ninja': return { front: `
        <rect x="29" y="14" width="62" height="11" rx="5.5" fill="#334155"/>
        <path d="M91 18 Q103 12 106 20 L96 24 Q104 26 100 32 L92 25 Z" fill="#334155"/>
        <circle cx="60" cy="19.5" r="3" fill="#94a3b8"/>` };

      case 'prinsess': return { front: `
        <path d="M40 16 L44 2 L52 12 L60 0 L68 12 L76 2 L80 16 Q60 21 40 16 Z" fill="#fbbf24" stroke="#d97706" stroke-width="1.4"/>
        <circle cx="44" cy="4" r="1.8" fill="#f472b6"/><circle cx="60" cy="2" r="1.8" fill="#60a5fa"/><circle cx="76" cy="4" r="1.8" fill="#f472b6"/>
        <circle cx="60" cy="13" r="2.2" fill="#ec4899"/>
        <path d="M44 70 Q60 78 76 70" stroke="#f9a8d4" stroke-width="2" fill="none"/>
        <circle cx="52" cy="73.6" r="1.6" fill="#f472b6"/><circle cx="60" cy="75" r="1.6" fill="#f472b6"/><circle cx="68" cy="73.6" r="1.6" fill="#f472b6"/>` };

      case 'doktor': return { front: `
        <path d="M42 5 Q60 -3 78 5 L76 12 Q60 6 44 12 Z" fill="#e5e7eb"/>
        <circle cx="60" cy="6" r="5.4" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1.2"/>
        <circle cx="60" cy="6" r="2.4" fill="#f8fafc"/>
        <path d="M46 70 Q46 90 60 90 Q74 90 74 70" stroke="#475569" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="60" cy="95" r="5.6" fill="#94a3b8" stroke="#475569" stroke-width="1.6"/>
        <circle cx="60" cy="95" r="2.6" fill="#e2e8f0"/>` };

      case 'detektiv': return { front: `
        <path d="M32 21 Q60 -4 88 21 Z" fill="#b48a5a"/>
        <ellipse cx="60" cy="21" rx="30" ry="5" fill="#9c7250"/>
        <path d="M45 12 L48 18 M60 8 L60 15 M75 12 L72 18" stroke="#8a6a4f" stroke-width="1.6"/>
        <circle cx="93" cy="88" r="9.5" fill="rgba(214,238,255,0.55)" stroke="#475569" stroke-width="3.2"/>
        <path d="M100 95 L108 103" stroke="#475569" stroke-width="4.4" stroke-linecap="round"/>` };

      case 'vinter': return { back: `
        ${sparkle(16, 30, 2.6, '#bfdbfe', 0.9)}${sparkle(106, 40, 2.2, '#bfdbfe', 0.8)}${sparkle(102, 14, 2.6, '#dbeafe', 0.9)}`,
        front: `
        <path d="M32 20 Q60 -6 88 20 Z" fill="#60a5fa"/>
        <rect x="32" y="16" width="56" height="8" rx="4" fill="#3b82f6"/>
        <path d="M38 18 L38 22 M46 17 L46 23 M54 16 L54 24 M62 16 L62 24 M70 17 L70 23 M78 18 L78 22" stroke="#93c5fd" stroke-width="1.6"/>
        <circle cx="60" cy="0" r="5" fill="#fff"/>
        <path d="M40 68 Q60 76 80 68 L80 75 Q60 83 40 75 Z" fill="#ef4444"/>
        <rect x="72" y="72" width="8" height="16" rx="3" fill="#ef4444"/>
        <path d="M73.6 84 L73.6 87 M76 84 L76 87 M78.4 84 L78.4 87" stroke="#fecaca" stroke-width="1.2"/>` };

      case 'guld': return {
        fur: { fur:`url(#${u}-fur)`, furD:'#d98f06', muz:'#fde68a', belly:'#fef3c7' },
        back: `${sparkle(18, 26, 4, '#fbbf24')}${sparkle(104, 20, 3, '#fde68a')}${sparkle(108, 66, 2.6, '#fbbf24')}${sparkle(12, 74, 2.6, '#fde68a')}`,
        defs: `<linearGradient id="${u}-fur" x1="0" y1="0" x2="1" y2="1">
                 <stop offset="0%" stop-color="#fcd34d"/><stop offset="55%" stop-color="#f5b73c"/><stop offset="100%" stop-color="#e8960f"/>
               </linearGradient>`,
        front: `${sparkle(30, 12, 3, '#fff')}${sparkle(90, 8, 2.4, '#fff')}${sparkle(96, 96, 3.2, '#fbbf24')}` };

      case 'regnbage': return {
        fur: { fur:`url(#${u}-fur)`, furD:'#c084fc', muz:'#fde8f4', belly:'#fff' },
        defs: `<linearGradient id="${u}-fur" x1="0" y1="0" x2="1" y2="1">
                 <stop offset="0%" stop-color="#f9a8d4"/><stop offset="30%" stop-color="#fcd34d"/>
                 <stop offset="60%" stop-color="#86efac"/><stop offset="100%" stop-color="#93c5fd"/>
               </linearGradient>`,
        back: `
        <path d="M10 60 A50 50 0 0 1 110 60" stroke="#f87171" stroke-width="5" fill="none" opacity="0.75"/>
        <path d="M16 60 A44 44 0 0 1 104 60" stroke="#fbbf24" stroke-width="5" fill="none" opacity="0.75"/>
        <path d="M22 60 A38 38 0 0 1 98 60" stroke="#4ade80" stroke-width="5" fill="none" opacity="0.75"/>
        <path d="M28 60 A32 32 0 0 1 92 60" stroke="#60a5fa" stroke-width="5" fill="none" opacity="0.75"/>`,
        front: `${sparkle(20, 90, 3, '#f9a8d4')}${sparkle(100, 88, 3, '#93c5fd')}` };

      case 'drak': return {
        back: `
        <path d="M30 62 Q4 34 10 64 Q0 66 14 76 Q6 82 30 84 Z" fill="#34d399" stroke="#0e9f6e" stroke-width="1.6"/>
        <path d="M90 62 Q116 34 110 64 Q120 66 106 76 Q114 82 90 84 Z" fill="#34d399" stroke="#0e9f6e" stroke-width="1.6"/>`,
        front: `
        <path d="M42 16 L46 4 L52 15 Z" fill="#0e9f6e"/><path d="M68 15 L74 4 L78 16 Z" fill="#0e9f6e"/>
        <path d="M84 62 Q92 58 90 66 Q96 66 90 71 Q86 70 84 66 Z" fill="#fb923c"/>
        ${sparkle(104, 26, 3, '#6ee7b7')}${sparkle(16, 22, 2.6, '#6ee7b7')}` };

      case 'stjarn': return {
        back: `
        ${sparkle(16, 22, 4, '#fbbf24')}${sparkle(104, 16, 3, '#fde68a')}${sparkle(108, 58, 2.6, '#fbbf24')}${sparkle(12, 62, 2.4, '#fde68a')}${sparkle(100, 100, 3, '#fbbf24')}`,
        front: `
        <path d="M60 70 l3.2 6.6 7.2 1 -5.2 5 1.2 7.2 -6.4 -3.4 -6.4 3.4 1.2 -7.2 -5.2 -5 7.2 -1 Z" fill="#fbbf24" stroke="#d97706" stroke-width="1.2"/>
        <path d="M20 96 L32 82" stroke="#8a6a4f" stroke-width="3" stroke-linecap="round"/>
        <path d="M32 74 l2.4 5 5.4 0.8 -3.9 3.8 0.9 5.4 -4.8 -2.6 -4.8 2.6 0.9 -5.4 -3.9 -3.8 5.4 -0.8 Z" fill="#fde68a" stroke="#d97706" stroke-width="1"/>` };

      case 'minnesmastare': return { front: `
        <path d="M34 20 Q26 34 34 46 M36 22 Q30 33 36 44" stroke="#4ade80" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path d="M86 20 Q94 34 86 46 M84 22 Q90 33 84 44" stroke="#4ade80" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path d="M50 86 L70 86 L70 92 Q70 101 60 101 Q50 101 50 92 Z" fill="#fbbf24" stroke="#d97706" stroke-width="1.4"/>
        <path d="M50 88 Q42 88 44 82 M70 88 Q78 88 76 82" stroke="#d97706" stroke-width="2.4" fill="none"/>
        <rect x="56" y="100" width="8" height="5" fill="#d97706"/>
        <rect x="51" y="105" width="18" height="4.6" rx="2" fill="#b45309"/>
        <path d="M60 89 l1.7 3.4 3.7 0.5 -2.7 2.6 0.6 3.7 -3.3 -1.8 -3.3 1.8 0.6 -3.7 -2.7 -2.6 3.7 -0.5 Z" fill="#fff7db"/>
        ${sparkle(88, 92, 3, '#fbbf24')}${sparkle(32, 92, 2.6, '#fde68a')}` };

      case 'matte': return {
        back: `
        <text x="12" y="34" font-family="'Baloo 2',cursive" font-weight="800" font-size="15" fill="#9333ea" opacity="0.8">×</text>
        <text x="102" y="30" font-family="'Baloo 2',cursive" font-weight="800" font-size="14" fill="#f472b6" opacity="0.8">+</text>
        <text x="104" y="74" font-family="'Baloo 2',cursive" font-weight="800" font-size="13" fill="#60a5fa" opacity="0.8">=</text>
        <text x="10" y="76" font-family="'Baloo 2',cursive" font-weight="800" font-size="13" fill="#fbbf24" opacity="0.9">÷</text>`,
        front: `
        <polygon points="32,13 60,3 88,13 60,23" fill="#1f2937"/>
        <rect x="52" y="16" width="16" height="6" rx="2" fill="#374151"/>
        <path d="M88 13 L88 26" stroke="#fbbf24" stroke-width="2"/>
        <circle cx="88" cy="29" r="2.6" fill="#fbbf24"/>
        <circle cx="60" cy="78" r="6.4" fill="#fbbf24" stroke="#d97706" stroke-width="1.4"/>
        <text x="60" y="81.6" text-anchor="middle" font-family="'Baloo 2',cursive" font-weight="800" font-size="8" fill="#7c4a03">%</text>
        ${sparkle(96, 94, 3, '#c084fc')}${sparkle(24, 94, 2.6, '#f0abfc')}` };

      default: return {};
    }
  }

  /* Komplett kort-SVG (bakgrundsplatta + bas + tillbehör) */
  function cardSVG(card) {
    const u = 'cp' + (++uid);
    const acc = accessory(card.acc, u) || {};
    const fur = acc.fur || FUR;
    const leg = card.rar === 'legendarisk';
    return `
      <svg class="capy-svg" viewBox="0 0 120 120" role="img" aria-label="${MP.escapeHtml(card.name)}">
        <defs>
          <linearGradient id="${u}-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${card.bg[0]}"/><stop offset="100%" stop-color="${card.bg[1]}"/>
          </linearGradient>
          ${acc.defs || ''}
        </defs>
        <rect x="3" y="3" width="114" height="114" rx="20" fill="url(#${u}-bg)"/>
        ${leg ? `<circle cx="60" cy="56" r="44" fill="#fff" opacity="0.28"/>` : ''}
        ${acc.back || ''}
        ${capyBody({ fur: fur.fur, furD: fur.furD, muz: fur.muz, belly: fur.belly, eyes: acc.eyes || 'open' })}
        ${acc.front || ''}
      </svg>`;
  }

  /* Låst kort: mörk capybara-silhuett + "?" */
  function silhouetteSVG() {
    return `
      <svg class="capy-svg" viewBox="0 0 120 120" aria-hidden="true">
        <rect x="3" y="3" width="114" height="114" rx="20" fill="rgba(255,255,255,0.28)"/>
        <g opacity="0.5">${capyBody({ fur:'#8f7fc0', furD:'#7b6bad', muz:'#8f7fc0', eyes:'none', plain:true })}</g>
        <text x="60" y="64" text-anchor="middle" font-family="'Baloo 2',cursive" font-weight="800" font-size="40" fill="#6d5a96" opacity="0.85">?</text>
      </svg>`;
  }

  /* ══════════════════════════════════════════════════════
     2) LAGRING + UPPLÅSNINGSMOTORN
  ══════════════════════════════════════════════════════ */
  function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (_) { return fallback; }
  }

  function readCards(profileId) { return readJSON(CARDS_KEY(profileId), {}); }

  function saveCards(profileId, cards) {
    return MP.safeSetItem(CARDS_KEY(profileId), JSON.stringify(cards));
  }

  function defaultState() {
    return {
      tests: 0,                       // avklarade test (alla moduler)
      medals: { b:false, s:false, g:false }, // sedda medalj-nivåer
      perfect: {},                    // 100 %-pass per modul (engångs)
      memStars: 0,                    // Minnesmästare-stjärnor
      s3: false, s7: false,           // daily-streak 3 / 7 (engångs)
      matteGiven: false,              // alla medaljer → Matte-Capy (engångs)
      lastDaily: '',                  // dubblettskydd: 1 daily-event/dag
      allDoneShown: false,            // varm grattis-text visad
      pending: [],                    // kö av intjänade dragningar
    };
  }

  function readState(profileId) {
    const st = readJSON(STATE_KEY(profileId), null);
    const def = defaultState();
    if (!st || typeof st !== 'object') return def;
    // Robust mot äldre/trasig state – fyll i saknade fält
    Object.keys(def).forEach(k => { if (st[k] === undefined) st[k] = def[k]; });
    if (!Array.isArray(st.pending)) st.pending = [];
    return st;
  }

  function saveState(profileId, st) {
    MP.safeSetItem(STATE_KEY(profileId), JSON.stringify(st));
  }

  function cardCount(profileId) {
    return Object.keys(readCards(profileId)).length;
  }

  function dayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /* ── Dragning: slumpat OLÅST kort ur rätt pool ─────────
     Poolordning vid tom pool (dubblettskydd): vanlig → sällsynt
     → generisk legendarisk → vilket olåst kort som helst. */
  const GENERIC_LEG = ['guld', 'regnbage', 'drak', 'stjarn'];

  function unowned(cards, rar) {
    return CARDS.filter(c => c.rar === rar && !cards[c.id]);
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function anyUnowned(cards) {
    return CARDS.filter(c => !cards[c.id]);
  }

  function drawFromChain(cards, chain) {
    for (const rar of chain) {
      const pool = (rar === 'legendarisk')
        ? GENERIC_LEG.map(id => byId[id]).filter(c => !cards[c.id])
        : unowned(cards, rar);
      if (pool.length > 0) return pick(pool);
    }
    const rest = anyUnowned(cards);
    return rest.length > 0 ? pick(rest) : null;
  }

  function resolveDraw(spec, cards, st) {
    const ownedCount = Object.keys(cards).length;

    if (spec === 'matte') {
      if (!cards['matte']) return byId['matte'];
      return drawFromChain(cards, ['legendarisk', 'sallsynt', 'vanlig']);
    }
    if (spec === 'memmaster') {
      // Chans på Minnesmästar-Capy: 50 % per stjärna, garanterad från 3:e
      if (!cards['minnesmastare'] && (st.memStars >= 3 || Math.random() < 0.5)) {
        return byId['minnesmastare'];
      }
      return drawFromChain(cards, ['sallsynt', 'vanlig', 'legendarisk']);
    }
    if (spec === 'legendarisk') return drawFromChain(cards, ['legendarisk', 'sallsynt', 'vanlig']);
    if (spec === 'sallsynt')    return drawFromChain(cards, ['sallsynt', 'vanlig', 'legendarisk']);
    if (spec === 'vanlig')      return drawFromChain(cards, ['vanlig', 'sallsynt', 'legendarisk']);

    // 'viktad': vanliga kort först, senare mer sällsynta
    const pRare = ownedCount < 4 ? 0.15 : ownedCount < 9 ? 0.35 : 0.55;
    const first = Math.random() < pRare ? 'sallsynt' : 'vanlig';
    const second = first === 'sallsynt' ? 'vanlig' : 'sallsynt';
    return drawFromChain(cards, [first, second, 'legendarisk']);
  }

  /* ── Milstolpar per event ──────────────────────────────
     event = { type:'test'|'daily', data:{...} }
       test:  { module, pct, memStar? }
       daily: { pct, streak }
     Returnerar upplåst kort eller null. REN SIDOEFFEKT:
     får aldrig påverka quiz-/poängsemantiken. */
  function award(profile, event) {
    if (!profile || !profile.id || !event || !event.data) return null;
    const id = profile.id;
    const st = readState(id);
    const cards = readCards(id);
    const d = event.data;

    if (event.type === 'test') {
      st.tests++;
      // Första kortet direkt efter första testet – alltid ett vanligt kort
      if (st.tests === 1) st.pending.push('vanlig');
      // Var 3:e avklarat test
      else if (st.tests % 3 === 0) st.pending.push('viktad');

      // Ny medalj-nivå (första gången per nivå)
      const pct = typeof d.pct === 'number' ? d.pct : null;
      if (pct !== null) {
        const lvl = pct >= 95 ? 'g' : pct >= 85 ? 's' : pct >= 75 ? 'b' : null;
        if (lvl && !st.medals[lvl]) {
          st.medals[lvl] = true;
          st.pending.push(lvl === 'b' ? 'viktad' : 'sallsynt');
        }
        // Alla medalj-nivåer samlade → Matte-Capy
        if (st.medals.b && st.medals.s && st.medals.g && !st.matteGiven) {
          st.matteGiven = true;
          st.pending.push('matte');
        }
        // 100 %-pass: legendarisk dragning, en gång per modul
        if (pct === 100 && d.module && !st.perfect[d.module]) {
          st.perfect[d.module] = true;
          st.pending.push('legendarisk');
        }
      }
      // Minnesmästare-stjärna
      if (d.memStar) {
        st.memStars++;
        if (st.memStars <= 3) st.pending.push('memmaster');
        else if (st.memStars % 5 === 0) st.pending.push('viktad');
      }
    } else if (event.type === 'daily') {
      // Endast första avklarade passet per dag räknas (inte "Kör igen")
      const today = dayStr();
      if (st.lastDaily !== today) {
        st.lastDaily = today;
        const streak = typeof d.streak === 'number' ? d.streak : 0;
        if (streak >= 3 && !st.s3) { st.s3 = true; st.pending.push('sallsynt'); }
        if (streak >= 7 && !st.s7) { st.s7 = true; st.pending.push('legendarisk'); }
        if (d.pct === 100 && !st.perfect.daily) {
          st.perfect.daily = true;
          st.pending.push('legendarisk');
        }
      }
    }

    // Dela ut max ETT kort per resultat – resten väntar i kön
    let unlocked = null;
    if (st.pending.length > 0) {
      const spec = st.pending.shift();
      unlocked = resolveDraw(spec, cards, st);
      if (unlocked) {
        cards[unlocked.id] = new Date().toISOString();
        if (!saveCards(id, cards)) {
          // Quota-fel: kortet får ALDRIG tappas — lägg tillbaka specen i kön
          // och visa ingen overlay (barnet ska bara se kort som är sparade)
          st.pending.unshift(spec);
          unlocked = null;
        }
      } else {
        // Alla 24 ägs – varm grattis-text (en gång), töm kön
        st.pending = [];
        if (!st.allDoneShown) {
          st.allDoneShown = true;
          saveState(id, st);
          showAllDone(profile);
          return null;
        }
      }
    }
    saveState(id, st);
    if (unlocked) showUnlock(unlocked);
    return unlocked;
  }

  /* ══════════════════════════════════════════════════════
     3) NYTT KORT-OVERLAYN
  ══════════════════════════════════════════════════════ */
  function closeOverlay() {
    const el = document.getElementById('capy-overlay');
    if (el) el.remove();
  }

  function overlayShell(inner) {
    injectCSS();
    closeOverlay();
    const el = document.createElement('div');
    el.className = 'capy-ov';
    el.id = 'capy-overlay';
    el.addEventListener('click', e => { if (e.target === el) closeOverlay(); });
    el.innerHTML = inner;
    document.body.appendChild(el);
    return el;
  }

  function showUnlock(card) {
    const el = overlayShell(`
      <div class="capy-ov-in" role="dialog" aria-label="Nytt kort: ${MP.escapeHtml(card.name)}">
        <span class="capy-ov-badge">✦ NYTT KORT! ✦</span>
        <div class="capy-flip">
          <div class="capy-flip-in">
            <div class="capy-face capy-face-back"><span>?</span></div>
            <div class="capy-face capy-face-front">
              <div class="capy-cc capy-rar-${card.rar} capy-reveal">
                <div class="capy-cc-in">
                  ${cardSVG(card)}
                  <span class="capy-cc-name">${MP.escapeHtml(card.name)} ${card.emoji}</span>
                  <span class="capy-cc-rar">${RAR_LABEL[card.rar]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p class="capy-ov-txt">${MP.escapeHtml(card.flavor)}</p>
        <div class="capy-ov-actions">
          <button class="btn btn-primary" onclick="Capy._close()">Fortsätt</button>
          <button class="btn btn-ghost" onclick="Capy._close(); Capy.showCollection()">
            <svg class="icn"><use href="#i-star"/></svg>
            Se samlingen
          </button>
        </div>
      </div>`);

    // Fanfar + konfetti i flip-ögonblicket. Självstädande: körs bara
    // om overlayn fortfarande är kvar (exGen-mönstrets anda).
    setTimeout(() => {
      if (!el.isConnected) return;
      try {
        App.Sound.play('fanfare');
        App.Confetti.burst(card.rar === 'legendarisk' ? 160 : 100);
      } catch (_) { /* ljud/konfetti är grädde, aldrig krav */ }
    }, 750);
  }

  function showAllDone(profile) {
    overlayShell(`
      <div class="capy-ov-in" role="dialog" aria-label="Hela samlingen klar">
        <span class="capy-ov-badge">🦫 HELA SAMLINGEN! 🦫</span>
        <p class="capy-ov-done">Wow, ${MP.escapeHtml(profile.name)}!<br>Alla 24 capybaror bor nu hos dig 💜</p>
        <p class="capy-ov-txt">Du är en sann capybara-vän. Fortsätt träna – de hejar på dig allihop!</p>
        <div class="capy-ov-actions">
          <button class="btn btn-primary" onclick="Capy._close()">Tack! 🎉</button>
          <button class="btn btn-ghost" onclick="Capy._close(); Capy.showCollection()">Se samlingen</button>
        </div>
      </div>`);
    setTimeout(() => {
      const el = document.getElementById('capy-overlay');
      if (!el || !el.isConnected) return;
      try { App.Sound.play('fanfare'); App.Confetti.burst(180); } catch (_) {}
    }, 300);
  }

  /* ══════════════════════════════════════════════════════
     4) SAMLINGEN-VYN (screen-collection / #capy-root)
  ══════════════════════════════════════════════════════ */
  function showCollection() {
    const profile = App.getCurrentProfile();
    if (!profile) { App.showHome(); return; }
    injectCSS();
    App.Sound.play('click');

    const cards = readCards(profile.id);
    const n = Object.keys(cards).length;
    const pctW = Math.round((n / TOTAL) * 100);

    const grid = CARDS.map(c => {
      if (cards[c.id]) {
        return `
          <div class="capy-cc capy-rar-${c.rar}">
            <div class="capy-cc-in">
              ${cardSVG(c)}
              <span class="capy-cc-name">${MP.escapeHtml(c.name)}</span>
              <span class="capy-cc-rar">${RAR_LABEL[c.rar]}</span>
            </div>
          </div>`;
      }
      return `
        <div class="capy-locked" aria-label="Hemligt kort">
          ${silhouetteSVG()}
          <small>HEMLIGT</small>
        </div>`;
    }).join('');

    const root = document.getElementById('capy-root');
    if (!root) return;
    root.innerHTML = `
      <div class="floaties" aria-hidden="true">
        <span style="top:4%;left:6%">✨</span>
        <span style="top:9%;right:8%;animation-delay:2s">🌟</span>
      </div>
      <div class="app-header">
        <button class="btn-back" onclick="App.showGameSelect()">Tillbaka</button>
        <span class="header-title">Samlingen</span>
        <span style="width:52px" aria-hidden="true"></span>
      </div>
      <div class="wrap capy-wrap">
        <div class="card capy-progress">
          <b class="num">🦫 ${n} av ${TOTAL} kort</b>
          <div class="progress-bar"><i style="width:${pctW}%"></i></div>
        </div>
        <div class="capy-grid">${grid}</div>
        <p class="capy-hint">Träna och klara test för att låsa upp fler capybara-kompisar! ✨</p>
      </div>`;

    Router.show('screen-collection');
  }

  /* ══════════════════════════════════════════════════════
     MODUL-CSS (injiceras en gång – inga nya globala klasser
     i app.css, allt prefixat capy-)
  ══════════════════════════════════════════════════════ */
  function injectCSS() {
    if (document.getElementById('capy-css')) return;
    const s = document.createElement('style');
    s.id = 'capy-css';
    s.textContent = `
/* ---- Samlingen: accentgrupp (hem-paletten) ---- */
#capy-root{
  --accent:#9333ea; --accent-light:#c084fc; --accent-2:#f472b6;
  --deep:#5b21b6; --glow:rgba(192,132,252,.42); --tint:#fdf4ff;
  display:flex; flex-direction:column; height:100%;
}
.capy-wrap{flex:1; min-height:0; display:flex; flex-direction:column;}
.capy-progress{display:flex; align-items:center; gap:16px; padding:12px 18px; margin-bottom:12px;}
.capy-progress b{font-family:var(--font-head); font-size:18px; color:var(--deep); white-space:nowrap;}
.capy-progress .progress-bar{flex:1;}

/* ---- Rutnätet: iPad utan scroll, mobil scrollar INUTI rutnätet ---- */
.capy-grid{
  display:grid; grid-template-columns:repeat(6,1fr); gap:11px;
  flex:1; min-height:0; overflow-y:auto; padding:4px 2px;
  align-content:space-evenly;
  scrollbar-width:thin; scrollbar-color:#d8c6f7 transparent;
}
.capy-grid::-webkit-scrollbar{width:6px}
.capy-grid::-webkit-scrollbar-thumb{background:#d8c6f7;border-radius:99px}
.capy-hint{text-align:center; color:var(--ink-soft); font-weight:700; font-size:14px; margin-top:10px;}

/* ---- Kort med raritetsram ---- */
.capy-cc{border-radius:20px; padding:3px; position:relative; transition:transform .3s var(--spring);}
.capy-cc:hover{transform:translateY(-4px) rotate(-1deg) scale(1.03);}
.capy-rar-vanlig{background:linear-gradient(135deg,#f9a8d4,#c4b5fd); box-shadow:0 6px 18px rgba(196,181,253,.4);}
.capy-rar-sallsynt{background:linear-gradient(135deg,#60a5fa,#c084fc,#f472b6); box-shadow:0 6px 20px rgba(147,51,234,.35);}
.capy-rar-legendarisk{background:linear-gradient(135deg,#fbbf24,#fb923c,#f472b6); box-shadow:0 8px 24px rgba(251,146,60,.5);}
.capy-cc-in{
  position:relative; overflow:hidden; background:rgba(255,255,255,.94); border-radius:17px;
  padding:8px 6px 8px; display:flex; flex-direction:column; align-items:center; gap:3px;
}
/* Skimmer: bara vid hover + vid kort-reveal (GPU-budget) */
.capy-cc-in::after{
  content:''; position:absolute; inset:-60%; transform:rotate(20deg);
  background:linear-gradient(105deg,transparent 42%,rgba(255,255,255,.9) 50%,transparent 58%);
  translate:-120% 0; pointer-events:none;
}
.capy-cc:hover .capy-cc-in::after{animation:capyShine 1.2s ease-in-out;}
.capy-reveal .capy-cc-in::after{animation:capyShine 3s ease-in-out 2; animation-delay:1.1s;}
@keyframes capyShine{0%{translate:-120% 0}100%{translate:120% 0}}
.capy-svg{width:100%; height:auto; display:block; max-width:118px;}
.capy-cc-name{font-family:var(--font-head); font-weight:700; font-size:13px; color:var(--deep);
  line-height:1.1; text-align:center; white-space:nowrap; max-width:100%; overflow:hidden; text-overflow:ellipsis;}
.capy-cc-rar{font-size:9.5px; font-weight:900; letter-spacing:.09em; text-transform:uppercase;
  padding:2px 9px; border-radius:999px;}
.capy-rar-vanlig .capy-cc-rar{background:#fce7f3; color:#9d2463;}
.capy-rar-sallsynt .capy-cc-rar{background:#ede9fe; color:#5b21b6;}
.capy-rar-legendarisk .capy-cc-rar{background:linear-gradient(135deg,#fbbf24,#fcd34d); color:#7c4a03;}

/* ---- Låsta kort: "?"-silhuett ---- */
.capy-locked{
  border-radius:20px; border:2px dashed rgba(109,90,150,.35); background:rgba(255,255,255,.3);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
  padding:8px 6px; transition:transform .3s var(--spring);
}
.capy-locked:hover{transform:translateY(-3px);}
.capy-locked small{font-size:9px; font-weight:800; letter-spacing:.08em; color:rgba(109,90,150,.6);}

/* ---- NYTT KORT-overlayn ---- */
.capy-ov{
  position:fixed; inset:0; z-index:9500; display:flex; align-items:center; justify-content:center;
  background:rgba(40,28,64,.55); padding:20px; animation:capyOvIn .3s var(--smooth);
}
@keyframes capyOvIn{from{opacity:0}to{opacity:1}}
.capy-ov-in{
  --accent:#9333ea; --accent-light:#c084fc; --deep:#5b21b6; --glow:rgba(192,132,252,.42);
  background:rgba(255,255,255,.96); border:1px solid var(--glass-line); border-radius:26px;
  box-shadow:0 24px 70px rgba(0,0,0,.35); padding:22px 26px; text-align:center;
  max-width:min(92vw,380px); width:100%; animation:capyPop .5s var(--spring);
}
@keyframes capyPop{from{opacity:0; transform:scale(.86) translateY(16px)}to{opacity:1; transform:none}}
.capy-ov-badge{
  display:inline-flex; padding:5px 16px; border-radius:999px; margin-bottom:12px;
  background:linear-gradient(135deg,#f472b6,#c084fc); color:#fff; font-weight:900;
  font-size:12.5px; letter-spacing:.14em; box-shadow:0 6px 16px rgba(244,114,182,.45);
  animation:capyPulse 1.6s ease-in-out infinite;
}
@keyframes capyPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
.capy-flip{perspective:900px; width:180px; margin:0 auto;}
.capy-flip-in{
  position:relative; width:100%; transform-style:preserve-3d;
  animation:capyFlip .9s var(--spring) .55s forwards;
}
@keyframes capyFlip{from{transform:rotateY(0)}to{transform:rotateY(180deg)}}
.capy-face{backface-visibility:hidden; -webkit-backface-visibility:hidden;}
.capy-face-back{
  position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  border-radius:20px; background:linear-gradient(135deg,#c4b5fd,#f9a8d4);
  box-shadow:0 10px 26px rgba(147,51,234,.3);
}
.capy-face-back span{font-family:var(--font-head); font-weight:800; font-size:64px; color:#fff; text-shadow:0 3px 10px rgba(91,33,182,.4);}
.capy-face-front{transform:rotateY(180deg);}
.capy-ov .capy-cc-name{font-size:16px;}
.capy-ov .capy-cc-in{gap:5px; padding:10px 8px;}
.capy-ov-txt{color:var(--ink-soft); font-size:14px; font-weight:700; margin-top:12px;}
.capy-ov-done{font-family:var(--font-head); font-weight:800; font-size:24px; color:var(--deep); margin:6px 0 4px; line-height:1.25;}
.capy-ov-actions{display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:14px;}
.capy-ov-actions .btn{min-height:48px; font-size:15px;}

/* ---- Responsivt ---- */
@media (max-width:700px){
  .capy-grid{grid-template-columns:repeat(4,1fr); gap:8px; align-content:start;}
  .capy-cc{border-radius:16px; padding:2px;}
  .capy-cc-in{border-radius:14px; padding:6px 4px;}
  .capy-grid .capy-cc-name{font-size:10.5px;}
  .capy-grid .capy-cc-rar{display:none;}
  .capy-locked{padding:6px 4px;}
  .capy-locked small{font-size:8px;}
  .capy-progress{padding:9px 13px; gap:12px; margin-bottom:8px;}
  .capy-progress b{font-size:14.5px;}
  .capy-hint{display:none;}
  .capy-flip{width:150px;}
}
@media (min-width:1000px){
  .capy-grid{grid-template-columns:repeat(8,1fr);}
  .capy-grid .capy-cc-rar{display:none;}
}
@media (prefers-reduced-motion:reduce){
  .capy-flip-in{animation:none; transform:rotateY(180deg);}
  .capy-cc:hover{transform:none;}
}`;
    document.head.appendChild(s);
  }

  /* ── Publikt API ─────────────────────────────────────── */
  return {
    award,          // Capy.award(profile, {type, data}) – hookarnas ingång
    showCollection, // Samlingen-vyn
    cardCount,      // antal kort (hem-profilkortens chip)
    _close: closeOverlay,
  };
})();

if (typeof window !== 'undefined') window.Capy = Capy;
