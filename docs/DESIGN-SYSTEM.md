# Multiplay designsystem v26 — klasskatalog

För modul-agenter i Fas 3 slice 2. Källa: `design-lab/index.html` (målbild
v2.1, LÅST) + `.project-context/DESIGN-LOCK-MULTIPLAY.md`. Allt nedan finns i
`styles/app.css`. Modulspecifik CSS läggs i modulens egen style-injektion
(uppstallning-mönstret) — rör ALDRIG app.css eller index.html.

**Absoluta regler:** ingen `backdrop-filter` · en vy = en skärm utan scroll
(1180×820, 820×1180, 390×844 + stress 390×664) · SVG som UI-ikoner, emoji
endast som INNEHÅLL ·
klockfärger tim BLÅ `#3b82f6` / minut RÖD `#ef4444` överallt ·
spring-easing `var(--spring)` · ambient-animationer små/få/pausbara
(`body.no-anim` pausar allt, `prefers-reduced-motion` respekteras).

## 1. Modulaccent — så färgas komponenterna

Alla komponenter läser `--accent`, `--accent-light`, `--accent-2`, `--deep`
(rubriker/mörk text), `--glow` (skuggfärg) och `--tint` (ljus yta).
Modulroten sätter gruppen — färdiga temablock finns redan:

| Tema | Sätts automatiskt på | Palett |
|---|---|---|
| `.theme-mult` | `.screen-multiplication`, `#mult-root` | lila magi `#9333ea` |
| `.theme-clock` | `.screen-clock`, `#clock-root` | drömhimmel `#2f6fe4`/guld |
| `.theme-friends` | `.screen-friends`, `#friends-root` | lila `#7c3aed`/gult |
| `.theme-np` | alla `#screen-np-*` + `#screen-nationella-select` | varm korall `#e85a4f` |
| `.theme-plus` | `.screen-addsub` (addsub + uppställning) | grön/mint `#0e9f6e` |

Egen vy? Sätt bara temaklassen på valfri container, eller manuellt:

```css
#min-root { --accent: var(--mult-acc); --accent-light: var(--mult-acc-l);
            --accent-2: var(--mult-acc2); --deep: var(--mult-deep);
            --glow: var(--mult-glow2); --tint: var(--mult-tint); }
```

OBS klockan: `--clock-primary` är **låst till `#3b82f6`** (= `--time-h`,
timvisaren). Klocktemats UI-accent är `--clock-acc` (`#2f6fe4`). Använd
`--time-h`/`--time-m`/`--time-k` för ALL tidspedagogik (visare, digital, text).

## 2. Skelett för en vy (no-scroll-mönstret)

```html
<div class="app-header">
  <button class="btn-back" onclick="...">Tillbaka</button>
  <span class="header-title">Modulnamn</span>
  <button class="icon-btn" aria-label="Historik">
    <svg class="icn"><use href="#i-history"/></svg>
  </button> <!-- eller <span style="width:52px"></span> som spacer -->
</div>
<div class="wrap">           <!-- max 720px, flex-kolumn, flex:1 -->
  ... innehåll som fyller höjden (flex:1 / align-content:space-evenly) ...
</div>
```

`.screen` (index.html äger den) är `height:100%`, flex-kolumn, `overflow-y:
auto` som nödventil — men målet är **0 px overflow**. Låt huvudpanelen ha
`flex:1; min-height:0` och centrera med `.vcenter` eller
`justify-content:center`. Grid som ska fylla höjd: `flex:1;
align-content:space-evenly`.

**Landskap ≥1100 (t.ex. iPad 1180×820):** `.screen` får beräknad symmetrisk
sidopadding och `.wrap` breddas till max 1040 px, hårdcentrerad. Modulen
behöver inte göra något — men panel/kolumn med egen `max-width` MÅSTE ha
`margin-left/right:auto` (eller centrerande förälder), annars blir
kompositionen osymmetrisk.

## 2b. Quiz-mallen (FAS 3.2) — uppgiften äger skärmen

Test-/frågevyer (mult/clock/tenfriends m.fl.) ska nå ≥55 % täckning:
monumental typografi, stora svarsytor, progress som kapsel i headern
(inget eget progressband). Tre generella klasser finns i app.css:

| Klass | Användning |
|---|---|
| `.q-hero` | Frågekort som flex-växer och skalar med skärmhöjden. Frågetexten läggs direkt i elementet (Baloo, `clamp(2.5rem, 12vh, 6rem)`, tabular-nums, generös vh-baserad padding). Sekundär rad: `<span class="q-sub">…</span>` |
| `.q-answers-fill` | Svarsgrid (2 kolumner) som flex-växer och fyller ledig höjd; radhöjd/knapphöjd `clamp(64px, 12vh, 120px)`, knapparna fyller sina rader. Använd med `.answer-option`-knappar |
| `.header-progress` | Progress-kapsel i headerns HÖGERSEKTION (i stället för spacer): pill med `.progress-bar` + `.hp-label` |

```html
<div class="app-header">
  <button class="btn-back" onclick="...">Tillbaka</button>
  <span class="header-title">7:ans tabell</span>
  <span class="header-progress">
    <span class="progress-bar"><i style="width:40%"></i></span>
    <span class="hp-label num">4/10</span>
  </span>
</div>
<div class="wrap">
  <div class="q-hero">7 × 8 = ?<span class="q-sub">Fråga 4 av 10</span></div>
  <div class="q-answers-fill">
    <button class="answer-option num">54</button>
    <button class="answer-option num">56</button>
    <button class="answer-option num">63</button>
    <button class="answer-option num">48</button>
  </div>
</div>
```

Både `.q-hero` och `.q-answers-fill` är flex-barn — lägg dem direkt i
`.wrap` (som är flex-kolumn) så delar de på höjden. Mobilanpassning av
`.header-progress` ingår (≤430).

## 3. Komponentkatalog

| Klass | Användning |
|---|---|
| `.card` | EN kortstil: frostat glas (solid halvtransparens). `<div class="card">...` |
| `.card-title` / `.panel-title` | Rubrikrad i kort med ikon: `<div class="card-title"><svg class="icn" style="color:var(--accent)"><use href="#i-stats"/></svg>Rubrik</div>` |
| `.btn` | Basknapp (pill, 52px). Kombinera: `.btn-primary` (accentgradient), `.btn-secondary` (glas + accentram), `.btn-ghost` (transparent + ram), `.btn-lg`/`.btn-sm`, `.btn-block` |
| `.icon-btn` | Rund 52px ikonknapp: `<button class="icon-btn" aria-label="…"><svg class="icn"><use href="#i-back"/></svg></button>` |
| `.btn-back` | Tillbaka-pill med inbyggd SVG-pil (via mask). Bara text i knappen: `<button class="btn-back">Tillbaka</button>` |
| `.chip` + `.chip-active` | Val-chips: `<button class="chip chip-active">10 min</button>`. Guldvariant: lägg till `.chip-gold`. Grupp-wrapper: `.chips` |
| `.segmented` | Segmentväljare med morphing-indikator (JS-snutt i §5): `<div class="segmented"><span class="seg-ind"></span><button class="chip-active">A</button><button>B</button></div>` |
| `.progress-bar > i` | `<div class="progress-bar"><i style="width:50%"></i></div>` (shimmer ingår) |
| `.answer-option` | Flervalsknapp; states `.correct` (pop) / `.wrong` (wiggle), `disabled` dimmas |
| `.numpad` / `.numpad-key` | 3-kolumns numpad; `.key-delete`, `.key-ok`, `.key-wide`, `.key-full` |
| `.input` / `.input-answer` | Textfält resp. stort centrerat svarsfält (Baloo, tabular-nums) |
| `.modal-overlay` + `.modal` + `.modal-title` | Dialog (overlay utan blur). Toggle med `.hidden` |
| `.history-list` / `.history-item` | EN historikstil för alla moduler: `<div class="history-item"><span class="history-icon">🥇</span><div class="history-main"><div class="history-title">7:ans tabell</div><div class="history-sub">3 juni · 12 frågor</div></div><span class="history-value num">92 %</span></div>` |
| `.result-hero` | Resultatvy: `.result-pct` (gradient-procent) + `.result-medal` (emoji) + `.result-medal-label` + `.result-msg` + `.result-note` + `.result-actions` |
| `.timer-pill` | Kompakt timer: `<span class="timer-pill num"><svg class="icn"><use href="#i-timer"/></svg>12:34</span>` |
| `.table-card` | Tabellkort (rutnät): `.table-number`, `.table-percent`, `.table-medal`, state `.selected` |
| `.stat-row` | Nyckeltalsrad: `.stat-label` + `.stat-value` |
| `.game-card` / `.grid-cards` | Spelväljarens kort (accentstripe + `.game-meta`-chip + `.game-new`-badge); `.game-card-wide` för liggande |
| `.profile-card` | Profilkort: `.profile-name`, `.profile-meta`, `.chev` |
| `.avatar` | `-sm/-md/-lg/-xl`; `.avatar-picker` + `.avatar-option.selected` |
| `.section-title` | Rubrik med gradientlinje |
| `.floaties` | Max 3–4 ambient-emoji per vy: `<div class="floaties"><span style="top:8%;left:8%">✨</span>...</div>` |
| `.num` | `font-variant-numeric: tabular-nums` — sätt på ALLA siffror/statistik |
| `.range-input` | Slider med accenttumme |

**Motion-verktyg:** keyframes `drill-fwd`/`drill-back`/`sink` (vybyte),
`pop-yes`, `wiggle`, `bounce-in`, `medal-spin`, `shimmer`, `new-pulse`,
`floaty`, `confetti-fall`, `burst` (+ `.burst`-klassen för stjärnregn vid
rätt svar). Easing: `var(--spring)` = `cubic-bezier(0.34,1.3,0.4,1)`,
`var(--smooth)`. `.screen.active` får drill-in automatiskt.

## 4. Ikonbibliotek

Definieras som `<symbol>` i index.html; använd var som helst i DOM:en:

```html
<svg class="icn"><use href="#i-back"/></svg>
```

`#i-back` (tillbaka-pil) · `#i-chevron` (höger) · `#i-history` (klocka) ·
`#i-stats` (staplar) · `#i-plus` · `#i-switch` (byt-pilar) · `#i-play` (pil
höger) · `#i-refresh` · `#i-trash` · `#i-star` · `#i-timer`.
`svg.icn` = `fill:none; stroke:currentColor; stroke-width:2.4; round caps`.
Behöver du en ny ikon: rita 24×24 rundad stroke-SVG inline i modulens markup
(lägg INTE till symboler i index.html).

## 5. Segmentväljarens morphing-indikator (JS-snutt)

```js
function initSegmented(el, cb) {
  const btns = [...el.querySelectorAll('button')];
  const ind = el.querySelector('.seg-ind');
  function move(b) {
    if (ind) { ind.style.left = b.offsetLeft + 'px'; ind.style.width = b.offsetWidth + 'px'; }
    btns.forEach(x => x.classList.toggle('chip-active', x === b));
  }
  btns.forEach(b => b.addEventListener('click', () => { move(b); cb && cb(b); }));
  requestAnimationFrame(() => move(el.querySelector('button.chip-active') || btns[0]));
}
```

## 6. Legacy-alias (gamla namn, NYA utseendet)

Modulernas befintliga markup blir automatiskt restylad via dessa alias.
Vid restyling: byt gärna till kanoniska namnet (kolumn 2), men aliasen
fortsätter fungera.

| Legacy-klass | Kanonisk motsvarighet / status |
|---|---|
| `.card-glass` | = `.card` (blur borttagen) |
| `.card-game` | ≈ `.game-card` (utan accentstripe) |
| `.progress-container` / `.progress-fill` | = `.progress-bar > i` |
| `.chip.selected`, `.chip.on` | = `.chip.chip-active` |
| `.result-display` / `.result-score` / `.result-message` / `.result-sub` | ≈ `.result-hero`-familjen (score är nu alltid gradient-text) |
| `.timer-bar` (+ `.timer-warning`/`.timer-danger`) | ≈ `.timer-pill` |
| `.btn-accent`, `.btn-yellow`, `.btn-success`, `.btn-danger` | behålls (semantiska); nya vyer använder primary/secondary/ghost |
| `.btn-icon` | ≈ `.icon-btn` |
| `.player-banner` m. `player-name`/`player-tagline` | ersätts av `.me-chip`-mönstret vid restyling; behålls stylad tills dess |
| `.avatar-option.selected`, `.animate-*`, `.feedback-emoji`, `.ten-grid`, `.stat-row` | behålls som de är |
| `--ease-bounce`, `--ease-spring` | pekar nu båda på `var(--spring)` |
| `--color-text-muted` | nu `#6d5a96` (`--ink-soft`) |
| `--font-heading` | nu **Baloo 2** (Bubblegum Sans är borta) |

Legacy-tokens (`--mult-*`, `--clock-*`, `--np-*`, `--nps-*`, `--svk-*`,
`--pv-*`, `--color-*`, `--text-*`, `--space-*`, `--radius-*`, `--shadow-*`)
finns kvar med oförändrade/närliggande värden så gamla inline-styles inte
går sönder — men nya vyer ska använda accentgruppen + nya tokens.

## 7. Typografi & text på färg

- Rubriker/siffror: `var(--font-head)` (Baloo 2), vikt 700–800, färg `var(--deep)`.
- Brödtext: Nunito 600–800, `var(--ink)`; sekundärt `var(--ink-soft)`.
- På gula/guld-ytor: ALDRIG vit text — använd `var(--choco)` (`#7c4a03`).
- Statistik/tid: alltid `.num` (tabular-nums).

## 8. Checklista innan du lämnar en vy

1. `body.no-anim` + mät `scrollHeight <= clientHeight + 2` i 1180×820,
   820×1180, 390×844 och stress 390×664 (labAudit-mönstret).
2. Innehållet FYLLER skärmen (ingen topp-ankrad vy med tomrum under);
   quiz-vyer ≥55 % täckning (quiz-mallen §2b), hubbar ≥50 %.
3. Vid ≥1100: kompositionen ligger mittcentrerad med symmetriska
   marginaler (paneler med egen max-width har margin auto).
4. Inga `backdrop-filter`, inga emoji-UI-ikoner, inga nya globala klasser.
5. Alla id:n, `App.*`-onclick och modulens publika API oförändrade.
6. Klockvyer: blå/röd-lagen i visare + digital + svensk text.
