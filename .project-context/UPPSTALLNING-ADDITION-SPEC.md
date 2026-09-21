# UPPSTÄLLNING · ADDITION — KONSTRUKTIONSSPEC

**Facit:** `design-lab/tiokompis-barnvy.html` (2 422 rader, gren `dev`).
**Måltavla:** `js/uppstallning.js` (2 114 rader), additionsgrenen.
**Status:** kontrakt. Allt nedan är läst ur de två filerna; inget är hämtat ur minnet.
Radhänvisningar skrivs `fil:rad`. Mockupen refereras `mockup:rad`, appen `app:rad`.

**Valda lägen (och bara dessa beskrivs).** Mockupen har elva växlar i verktygsraden;
de är jämförelsealternativ, inte produkt. Valt är:

| Växel | Valt | Konstant i mockupen |
|---|---|---|
| Räkningen | **Egen uträkning** (tankerutan) | `calcMode='box'` (mockup:372) |
| Rutans plats | **I flödet** | `placeMode='flow'` (mockup:372) |
| Lånet | **Ett steg** | `lendMode='ett'` (mockup:372) |
| Utlyftet | **Ihop** | `liftMode='ihop'` (mockup:373) |
| Summan | **Eget steg** | `sumMode='eget'` (mockup:373) |
| Summans väg | **Ur pappret** | `sumWay='ur'` (mockup:373) |
| Komplementet | **Största talet** | `compTo='storsta'` (mockup:373) |
| Minnet går till | **Största talet** | `memTo='storsta'` (mockup:373) |
| 10-brickan | **kolumnens platsvärdesfärg** | `badgeColorClass()` mockup:1343–1348 |
| Ljud | **på** | `soundOn=true` (mockup:371) |
| Märk problemet | verkningslös när Utlyftet = Ihop (mockup:775) | — |

**Förkastat** (byggs inte, nämns bara här): `calcMode='col'` (I kolumnen),
`placeMode='over'` (Över kladden), `lendMode='tva'` (Två steg),
`liftMode='eget'` (Eget steg), `sumMode='retur'` (I återvändandet),
`sumWay='glid'` (Glider ut), `compTo='oversta'`, `memTo='oversta'`,
`markMode` i båda lägen (utan verkan i den valda kombinationen), samt
10-brickans färglägen lila/blå-fast. Därmed förkastas också stegtyperna
`add_over9`, `add_ten`, `add_left` som egna steg och CSS-klasserna
`.tk-badge.badge-purple`, `.tk-badge.lonely`, `.tk-badge.tk-chipfly` och
`#up-think.overlay`, som ingen JS-rad i mockupen någonsin sätter.

---

## 1. Principerna

Sex regler. De gäller varje steg i additionsgrenen och är den måttstock en
granskare mäter bygget mot.

**P1 — Tvålagersmodellen.** Kolumnen är *pappret*: de skrivna siffrorna, de
strukna siffrorna, de små amber-siffrorna (`.small-new-digit`, app:166) och den
röda minnessiffran (`.mem-digit`, app:180). När något är skrivet i kolumnen står
det **still för alltid** — det får aldrig flytta sig, skalas om eller tas bort
under uppgiften. Brickan är *kvantiteten*: `.tk-badge` i högermarginalen är
summan som ett tal (`12`, inte `10 + 2`), och det är det enda objektet som rör
sig. Brickans egna siffror hör hemma i var sin kolumn — `1`:an i tiotalen,
`2`:an i entalen. Konsekvens i kod: avläsningspulsen `nf-read-glow`
(mockup:592–595) får bara ändra `text-shadow`, aldrig `transform`, därför att en
skriven siffra som skalas om flyttar sig (den är ankrad nere till höger i cellen
via `.small-new-digit{position:absolute;bottom:2px;right:4px}`) och då står
pappret inte längre still.

**P2 — En idé per steg.** Varje steg säger **en** sak. Enda medvetna undantaget
är `add_lift` i läget "Ihop": meningen har två led ("blir mer än 9 — vi tittar på
dem en stund"), men det är *en* tanke och *en* rörelse (mockup:1937–1941).
Undantaget är skälet till att `add_over9` inte längre finns som eget steg
(mockup:775).

**P3 — Texten före eller samtidigt med rörelsen.** Bubbeltexten sätts innan
animationen startar: `next()` anropar `showBubble()` före `executeStep()`
(mockup:2018–2035), precis som appen gör i dag (`demoNextStep()`, app:622–623).
Enda stället där texten byts mitt i ett steg är `add_lend` i läget "Ett steg",
och då kommer den nya meningen **efter** att siffran landat, inte före
(mockup:1748–1751).

**P4 — Slutsatsen sist i sitt steg.** Ordningen inom ett steg går premiss →
rörelse → slutsats. `tf_pair`: minnet blinkar, paret pulsar + kapseln ritas, och
**först därefter** framträder 10-brickan (mockup:1591–1609). `add_ten_named`:
lånet pulsar, sugs in, och först då blir chipet en tia (mockup:1771–1777).

**P5 — Inget objekt får skapas och förstöras i samma steg.** Ingen
teleportering. `flyChipToAnswer()` (mockup:1374–1415) *flyttar* brickan, morfar
den till svarssiffrans utseende och förbrukar den först när siffran står i
cellen. `flyCopy()` skickar en **kopia** och låter originalet stå kvar, därför
att det som står på pappret ska stå kvar (mockup:1183–1190).

**P6 — Ingen aritmetik i bubbeltexten som barnet måste räkna ut.** Inga
likhetstecken med uträkning, inga subtraktioner. "3:an lämnar 5:an på riktigt,
så *5:an har 2 kvar* räcker som mening." Detta är den direkta motsatsen till
appens nuvarande `add_explain`-bubbla (app:910–921), som i en enda bubbla kör
fyra uträkningar på fyra rader.

---

## 2. Aritmetiken

### 2.1 Den nya uträkningen (verbatim ur mockup:738–759)

```js
for (let c = 0; c < colCount; c++){
  const a = da[c], b = db[c];
  /* 1. MINNET går till en av termerna. */
  const memRow   = (carryVal && o.memTo === 'storsta' && b > a) ? 'b' : 'a';
  const memDigit = (memRow === 'a') ? a : b;
  const memNew   = memDigit + carryVal;
  const valA = a + (memRow === 'a' ? carryVal : 0);
  const valB = b + (memRow === 'b' ? carryVal : 0);
  /* 2. KOMPLEMENTET fyller ett av talen till 10. */
  const growRow = (o.compTo === 'storsta' && valB > valA) ? 'b' : 'a';
  const giveRow = (growRow === 'a') ? 'b' : 'a';
  const growVal = (growRow === 'a') ? valA : valB;
  const giveVal = (growRow === 'a') ? valB : valA;
  const effectiveA = growVal;
  const sum  = valA + valB;
  const ans  = sum % 10;
  const nextCarry = sum > 9 ? 1 : 0;
  ...
  if (sum > 9){
    const behover = 10 - effectiveA;
    const kvar    = giveVal - behover;
```

Med de valda lägena (`memTo='storsta'`, `compTo='storsta'`) reduceras detta till:

* **mål** = `10`. Alltid. Det är den fasta punkten hela metoden vilar på.
* **källa** = `giveVal` = det *mindre* av de två talen efter att minnet lagts på.
* **behover** = `10 − growVal`, där `growVal` = det *större* av `valA`/`valB`.
* **kvar** = `giveVal − behover`.

**Största-talet-regeln, två gånger.**
`memRow` (mockup:741): minnessiffran läggs på den rad som har den största
siffran (`b > a` ⇒ nedre raden), inte alltid på den översta.
`growRow` (mockup:748): komplementet fyller den term som efter minnet är störst
(`valB > valA` ⇒ nedre raden), inte alltid den översta.
Följden är att **`kvar` alltid blir ≥ 1** så länge `behover ≥ 1`: en 9:a tar 1
av en 2:a, aldrig tvärtom. Lånet räcker därmed alltid.

**Minnessiffran läggs på största talet.** `memNew = memDigit + carryVal`
(mockup:743). Den skrivna röda 1:an i minnesraden rörs inte — den *kopieras* ner
i tankerutan (`flyCopy`, mockup:1706–1711) och stryks först i sitt eget steg
`add_mem_strike` (mockup:829).

### 2.2 Vad som ändras mot appen

Appen i dag, **app:503–510**:

```js
const effectiveA = a + carryVal;
const sum = effectiveA + b;
const ans = sum % 10;
const nextCarry = sum > 9 ? 1 : 0;
steps.push({ type:'add_highlight', col:c });
if (sum > 9) {
  const behover = 10 - effectiveA;
  const kvar = b - behover;
```

| | Appen (app:503–510) | Nytt (mockup:741–759) |
|---|---|---|
| Vart minnet går | alltid rad A (`effectiveA = a + carryVal`) | till största talet (`memRow`, mockup:741) |
| Vilket tal fylls till 10 | alltid rad A (`behover = 10 - effectiveA`) | största talet (`growRow`/`growVal`, mockup:748–750) |
| Vem lånar ut | alltid rad B (`kvar = b - behover`) | det mindre talet (`giveVal`, mockup:751) |
| `kvar` kan bli 0 | **ja** — 16,3 % av nivå-3-uppgifterna, 25,1 % av nivå 4 | nej, när `behover ≥ 1` |
| `behover` kan bli 0 | **ja** — se §7, Hål A | ja, men hanteras som eget fall |
| `sum` | `effectiveA + b` | `valA + valB` (identiskt värde) |
| `ans`, `nextCarry` | oförändrade | oförändrade |

`sum`, `ans` och `nextCarry` får **exakt samma värden** som i dag. Bara vägen dit
ändras. Svaret i `ans-cell` blir alltid detsamma som appen skriver i dag; inget
facit rubbas.

### 2.3 Nya fält som stegen måste bära

`base`-objektet i mockup:760–761 — varje komplement-, exakt-10- och
`10 + resten`-steg får alla dessa fält:

```js
{ col, a, b, carry_in, effectiveA, behover, kvar, ans, nextCarry, sum,
  growRow, giveRow, growVal, giveVal, valA, valB, memRow, memDigit, memNew }
```

Appens motsvarande steg bär i dag bara
`{ col, a, b, carry_in, effectiveA, behover, kvar, ans, nextCarry }`
(app:512–517). De åtta nya fälten är obligatoriska — bubbeltexterna i §3 läser
`growVal`, `giveVal`, `memDigit`, `memNew` och `kvar` direkt.

---

## 3. Stegkedjorna

`add_highlight` inleder varje kolumn (mockup:756) och `add_mem_strike` avslutar
den när kolumnen hade ett minne som inte är sista kolumnens
(`if (carryVal && c < colCount - 1)`, mockup:829 = app:523, oförändrat).

Färgkonstanter i texterna: `c` = `PVC[COL_KEYS[col]]` — `#22c55e` ental,
`#3b82f6` tiotal, `#ef4444` hundratal (mockup:291 = app:56). `MEM_AMBER` =
`#d97706` (mockup:294). Minnessiffrans röda i minnesraden är `#dc2626`
(`MEM_RED`, mockup:295).

### 3.a Kolumn som går direkt (summa ≤ 9)

Oförändrad mot appen.

| # | Stegtyp | Bubbeltext (verbatim, mockup:1973–1978) |
|---|---|---|
| 1 | `add_highlight` | *(tom)* |
| 2 | `add_simple` | se nedan |
| 3 | `add_mem_strike` (villkorat) | `Nu stryker vi <strong style="color:#dc2626">1</strong>:an — den är använd! Så vet vi att den inte räknas igen. ✏️` |

```html
<!-- add_simple, normalfallet -->
<span style="color:{c}">{a}</span> + <span style="color:{c}">{b}</span>{ + <span style="color:#d97706">{carry_in}</span> om minne } = <strong style="color:{c}">{sum}</strong>
```
```html
<!-- add_simple när a===0 && b===0 && carry_in (minneskolumnen längst till vänster) -->
Bara minnessiffran är kvar — <span style="color:#d97706">{carry_in}</span>:an flyttas ner! ✅
```

Exempel `47 + 35`, tiotalskolumnen:
`<span style="color:#3b82f6">4</span> + <span style="color:#3b82f6">3</span> + <span style="color:#d97706">1</span> = <strong style="color:#3b82f6">8</strong>`

### 3.b Exakt-10-kolumn (tiokompis-genvägen)

Villkor: `isExactTen(growVal, giveVal)` (mockup:301, 762) —
`growVal + giveVal === 10 && growVal >= 1 && giveVal >= 1`.
Ingen tankeruta, ingen strykning. **Att tankerutan uteblir är i sig beskedet
"den här såg du direkt".**

| # | Stegtyp | Flaggor | Bubbeltext |
|---|---|---|---|
| 1 | `add_highlight` | — | *(tom)* |
| 2 | `tf_pair` | — | se nedan |
| 3 | `add_carry_fly` | `tf:true, chip:true` | `<strong style="color:#d97706">1</strong>:an åker upp som minne. 👆` |
| 4 | `add_result` | `tf:true, chip:true` | `<strong style="color:{c}">{ans}</strong>:an åker ner i svaret. ✅` |
| 5 | `add_mem_strike` | villkorat | som 3.a |

```html
<!-- tf_pair utan minne (mockup:1905–1906) -->
<strong style="color:{c}">{a}</strong> och <strong style="color:{c}">{b}</strong> är tiokompisar — precis <strong>10</strong>! 💛
```
```html
<!-- tf_pair med minne (mockup:1899–1903) -->
<span style="color:{c}">{memDigit}</span> plus minnet <span style="color:#d97706">{carry_in}</span> är <strong>{memNew}</strong>. Och <strong style="color:{c}">{valA}</strong> och <strong style="color:{c}">{valB}</strong> är tiokompisar — precis <strong>10</strong>! 💛
```

Notera att `add_carry_fly`/`add_result` med `chip:true` vinner över `tf`-grenen i
`bubbleHTML` (mockup:1910–1913 resp. 1924) — bägge texterna ovan är
chip-varianten, vilket är den som gäller eftersom `chip:true` alltid sätts
(mockup:767–768).

Verifierat på `41 + 39` (ental) och `47 + 53` (ental och tiotal; tiotalet ger
minnesvarianten: *"5 plus minnet 1 är 6. Och 4 och 6 är tiokompisar — precis
10! 💛"*).

### 3.c Vanlig komplementkolumn (summa 11–18)

Villkor: `behover >= 1 && kvar >= 1` (mockup:769). Nio steg.

| # | Stegtyp | Flaggor | Bubbeltext |
|---|---|---|---|
| 1 | `add_highlight` | — | *(tom)* |
| 2 | `add_lift` | `box:true, merged:true` | `<span style="color:{c}">{a}</span> + <span style="color:{c}">{b}</span> blir mer än 9 — vi tittar på dem en stund. 🤔` |
| 3 | `add_need` | `box:true` | `<strong style="color:{c}">{growVal}</strong> behöver <strong style="color:{c}">{behover}</strong> för att bli <strong>10</strong>.` |
| 4 | `add_lend` | `box:true, split:false` | `Vi lånar <strong style="color:{c}">{behover}</strong>:an från <strong style="color:{c}">{giveVal}</strong>:an.` |
| 4b | *(samma steg, texten byts efter landningen)* | — | `<strong style="color:{c}">{giveVal}</strong>:an har <strong style="color:#d97706">{kvar}</strong> kvar.` |
| 5 | `add_ten_named` | `box:true` | `Nu är <strong style="color:{c}">{growVal}</strong>:an en hel tia.` |
| 6 | `add_return` | `box:true, way:'ur'` | `Nu skriver vi om det i uppställningen.` |
| 7 | `add_sum` | `box:true, way:'ur'` | `<strong>10</strong> och <strong style="color:#d97706">{kvar}</strong> är <strong style="color:{c}">{sum}</strong>.` |
| 8 | `add_carry_fly` | `nf:true, chip:true` | `<strong style="color:#d97706">1</strong>:an åker upp som minne. 👆` |
| 9 | `add_result` | `nf:true, chip:true` | `<strong style="color:{c}">{ans}</strong>:an åker ner i svaret. ✅` |

Steg 4b sätts av `setBubbleHTML(bubbleHTML({ ...step, type:'add_left' }))`
(mockup:1750) — alltså samma textfunktion, ingen dubblerad sträng.

Sista kolumnen (`col + 1 >= colCount`) byter steg 8:s text till
`<strong style="color:#d97706">1</strong>:an skrivs längst till vänster. 👆`
(mockup:1911–1913).

Verifierat på `47 + 35` ental (11 steg totalt i uppgiften), `26 + 37`,
`32 + 29`, `68 + 57`, `38 + 79`, `95 + 47` ental, `295 + 208` ental.

### 3.d Kolumn med minnessiffra in (tre brickor ner, minnet slås ihop)

Samma kedja som 3.c men med `add_memjoin` inskjutet direkt efter `add_lift`
(mockup:782–787). Tio steg. Tankerutan visar **tre** brickor: minnesettan (röd,
avskild med en punkt), `a` och `b` (mockup:1417–1432).

| # | Stegtyp | Flaggor | Bubbeltext |
|---|---|---|---|
| 1 | `add_highlight` | — | *(tom)* |
| 2 | `add_lift` | `box:true, merged:true` | `<span style="color:{c}">{a}</span> + <span style="color:{c}">{b}</span> + minnet blir mer än 9 — vi tittar på dem en stund. 🤔` |
| 3 | `add_memjoin` | `box:true` | `Minnet gör <strong style="color:{c}">{memDigit}</strong>:an till <strong style="color:{c}">{memNew}</strong>.` |
| 4 | `add_need` | `box:true` | som 3.c (läser `growVal`, som nu är `memNew` om minnet gick till största talet) |
| 5 | `add_lend` (+4b) | `box:true, split:false` | som 3.c |
| 6 | `add_ten_named` | `box:true` | som 3.c |
| 7 | `add_return` | `box:true, way:'ur'` | som 3.c |
| 8 | `add_sum` | `box:true, way:'ur'` | som 3.c |
| 9 | `add_carry_fly` | `nf:true, chip:true` | som 3.c |
| 10 | `add_result` | `nf:true, chip:true` | som 3.c |
| 11 | `add_mem_strike` | villkorat | som 3.a |

Verifierat, `68 + 57` tiotalskolumnen:
```
add_lift      6 + 5 + minnet blir mer än 9 — vi tittar på dem en stund. 🤔
add_memjoin   Minnet gör 6:an till 7.
add_need      7 behöver 3 för att bli 10.
add_lend      Vi lånar 3:an från 5:an.       → 5:an har 2 kvar.
add_ten_named Nu är 7:an en hel tia.
add_return    Nu skriver vi om det i uppställningen.
add_sum       10 och 2 är 12.
add_carry_fly 1:an åker upp som minne. 👆
add_result    2:an åker ner i svaret. ✅
add_mem_strike Nu stryker vi 1:an — den är använd! …
```
`38 + 79` tiotalskolumnen ger samma kedja, med minnet på **nedre** raden
(`b=7 > a=3` ⇒ `memRow='b'`, `memNew=8`): *"Minnet gör 7:an till 8."*

### 3.e Overflow-kolumnen

Två olika saker som lätt förväxlas.

**(i) Minneskolumnen — den som faktiskt inträffar.** När sista kolumnen saknar
siffror i båda talen men har ett minne (`a===0 && b===0 && carry_in`) är den en
vanlig `add_simple` med specialtext:
```html
Bara minnessiffran är kvar — <span style="color:#d97706">{carry_in}</span>:an flyttas ner! ✅
```
Steget är `add_highlight` → `add_simple`. Svaret droppar med `drop-down`.
Verifierat på `38 + 79`, `68 + 57`, `47 + 53` (hundratalskolumnen).

**(ii) `add_overflow` — steget som aldrig nås.** `if (carryVal) steps.push({
type:'add_overflow', digit:carryVal })` (mockup:832 = app:526) körs bara om det
går ett minne ut ur *sista* kolumnen. Med `colCountFor()` (mockup:298 =
app:456) blir `colCount` 3 så snart `a + b >= 100`, och `generatePair()`
(app:413–457) ger aldrig `a + b >= 1000` (nivå 4 förkastar det uttryckligen,
app:427; nivå 3 har `a, b ≤ 99` ⇒ summa ≤ 198). Steget är alltså **oåtkomligt
med nuvarande talintervall**. Behåll det som skyddsnät, oförändrat:

| # | Stegtyp | Bubbeltext (mockup:1982–1983) | Tid |
|---|---|---|---|
| 1 | `add_overflow` | `Minnessiffran <strong style="color:#ef4444">{digit}</strong> skrivs längst till vänster!` | 400 ms, ingen animation |

---

## 4. Animationerna

Alla tider nedan är **ofärdsskalade** ms, hämtade ur mockupens `executeStep()`
(mockup:1576–1880) och korsvis kontrollerade mot `phasesFor()`
(mockup:841–979), som är mockupens egen tidslinjedeklaration. I mockupen körs de
genom `after(ms, fn) = setTimeout(fn, Math.round(ms/speed))` (mockup:1023, 1025) och
`Ts(ms) = (ms/speed/1000).toFixed(3)+'s'` (mockup:1024). **I appen finns inget
fartreglage** — `speed` är 1, så `after(ms, fn)` blir `setTimeout(fn, ms)` och
`Ts(ms)` blir `(ms/1000)+'s'`. Behåll hjälparna; de gör tiderna läsbara på ett
ställe.

Easing-konstanter: `--spring: cubic-bezier(0.34,1.3,0.4,1)`,
`--smooth: cubic-bezier(0.4,0,0.2,1)` (app:  motsvarande finns redan i
`styles/app.css`; mockupen speglar dem i mockup:404–405).
Flygkurvan `cubic-bezier(0.25,0.46,0.45,0.94)` är appens egen ur
`animateCarryToken()` (app:1096–1097).

### 4.1 `add_highlight` (mockup:1577–1589)

`highlightCol(col)`; ta bort ev. `.nf-ghost`; `closeThink()`. `cb` efter **50 ms**.
`closeThink()` tar bort `.open` (max-height-transitionen `.42s var(--spring)`,
mockup:637–639) och tömmer rutans innehåll efter **420 ms**.
Klasser: `.col-cell.glow-ental|glow-tiotal|glow-hundratal` (keyframes `glow-g/b/r`,
1,1 s, oändlig) och `.col-cell.dim` — oförändrat från app:882–894.

### 4.2 `tf_pair` (mockup:1591–1609)

| Fas | Från → till (ms) | Vad | Klass/keyframe |
|---|---|---|---|
| minnet blinkar (bara om `carry_in`) | 0 → 400 | `.mem-digit` i minnesraden skalas 1 → 1,45 → 1 | `.tk-blink`, `@keyframes tk-blink` |
| paret pulsar | t₀ → t₀+300 | båda `.dw` skalas 1 → 1,34 → 1 | `.tk-pop`, `@keyframes tk-pop`, `var(--spring)` |
| kapseln ritas | t₀ → t₀+380 | `.tk-capsule` runt bägge cellerna, padding 7 px | `@keyframes tk-cap-in` |
| summan stiger ur pappret | t₀+400 → t₀+1560 | `riseSumChip()` — se 4.10 | — |

`t₀ = 400` om `carry_in`, annars `0`. `cb` vid `t₀+1560`.

### 4.3 `add_lift` (mockup:1674–1711)

| Fas | Från → till | Vad |
|---|---|---|
| paret pulsar | 0 → 300 | båda `.dw` får `.tk-pop` (bara när `merged`) |
| rutan fälls ut | 0 → 420 | `#up-think` får `.open`; `max-height 0 → 210px`, `.42s var(--spring)`; `opacity .28s var(--smooth)` |
| siffrorna lyfter | 180 → 780 | tre `flyCopy()` i **vy-koordinater** (`fixed:true`): `a` och `b` med `dur:600`, `easing cubic-bezier(0.34,1.3,0.4,1)`, `fontSize:'1.95rem'`, `color: PVC[col]`; minnesettan med `fontSize:'1.7rem'`, `color:#dc2626`. Vid landning: `.nf-chip.in` + `pop(chip, 300, 'pop')`, `.nf-op.in`, `.nf-dot.in` |
| minnet blinkar | 0 → 300 | `.mem-digit.tk-blink` (bara om `carry_in`) |
| cellerna blir spöken | 600 → 900 | `.col-cell.nf-vacated` (streckad ram) + `.dw.nf-vacated` (`opacity:.18`, `.3s var(--smooth)`) |

`cb` vid **960 ms**. `measure()` anropas direkt efter `.open` sätts.
`fixed:true` är inte kosmetik: en absolutpositionerad flykt inuti
`#up-table-wrap` räknas in i `#up-left`s `scrollHeight` och blåste upp
höjdmätaren med ~90 px (mockup:1194–1197).

### 4.4 `add_memjoin`, tankerutans variant (mockup:1639–1662)

| Fas | Från → till | Vad |
|---|---|---|
| minnesbrickan glider | 0 → 520 | `transform: translateX({tR.left − mR.left}px) scale(.7)`, `cubic-bezier(0.34,1.06,0.5,1)`; `opacity 1 → 0` över `.26s var(--smooth)` med `.3s` fördröjning; punkten `.nf-dot` tonar ut på `.24s` |
| brickan förbrukas | 560 | `mem.remove()`, `dot.remove()`, `tgt.textContent = memNew` |
| siffran pulsar | 560 → 900 | `pop(tgt, 340, 'pop')` |

`cb` vid **980 ms**. Den skrivna röda 1:an i minnesraden rörs inte.

### 4.5 `add_need` (mockup:1713–1719)

| Fas | Från → till | Vad |
|---|---|---|
| siffran pulsar | 0 → 300 | `pop(chipEl(growRow), 300, 'pop')` |
| spök-siffran tänds | 180 → 560 | `drawGhost()` skapar `.nf-ghost.inline` **direkt efter** grow-chipet (`insertAdjacentElement('afterend')`), `@keyframes nf-ghost-in` 380 ms, slutopacitet `.40` |

`cb` vid **560 ms**. Spöket är 36×36 px, `font-size:1.35rem`, färgat
`PVC[COL_KEYS[col]]`, streckad ram.

### 4.6 `add_lend`, "Ett steg" (mockup:1721–1755)

| Fas | Från → till | Vad |
|---|---|---|
| lånet flyger | 0 → 620 | `flyCopyIn(thinkCard(), chip[giveRow] → ghost, String(behover), {dur:620, easing:'cubic-bezier(0.25,0.46,0.45,0.94)', fontSize:'1.5rem', color:PVC[col], sound:true})` — **inne i tankerutan**, inte över uppställningen |
| platsen fylls | 640 → 940 | `.nf-ghost.filled` (opacitet 1, hel ram, `box-shadow 0 5px 16px rgba(0,0,0,.14)`) + `pop(ghost, 300, 'pop')` |
| givaren blir skyldig | 640 | `chip[giveRow]` får `.owing` (`opacity:.38`, streckad ram) |
| omskrivningen | 920 → 1220 | `.owing` tas bort, `chip.textContent = kvar`, `pop(chip, 300, 'pop')` |
| ny mening i bubblan | 1340 | `setBubbleHTML(bubbleHTML({...step, type:'add_left'}))` |

`cb` vid **1580 ms**. Ljud: `playCarrySound()` (400→800 Hz, 0,25 s).

### 4.7 `add_ten_named` (mockup:1771–1777)

| Fas | Från → till | Vad |
|---|---|---|
| lånet pulsar | 0 → 300 | `pop(ghost, 300, 'pop')` |
| lånet sugs in | 120 → 440 | `.nf-ghost.fading` (`opacity 0`, `scale(.68)`, `.3s var(--smooth)`), tas bort efter 320 ms |
| 10-brickan | 400 → 760 | `chipToTen()`: chipets innehåll byts till `<span class="tk-d">1</span><span class="tk-d">0</span>`, klasserna `.isten` + `badgeColorClass(col)` läggs på, `pop(chip, 320, 'pop')` |

`cb` vid **760 ms**.

### 4.8 `add_return`, "Ur pappret" (mockup:1801–1845)

| Fas | Från → till | Vad |
|---|---|---|
| cellerna vaknar | 0 | `.nf-vacated` tas bort från `.col-cell` och `.dw` |
| PAPPER: resten hem | 0 → 500 | `flyCopy(chip[giveRow] → dw[giveRow], String(kvar), {dur:500, easing:'cubic-bezier(0.25,0.46,0.45,0.94)', fixed:true, fontSize:'1.5rem', color:PVC[col], endColor:'#d97706'})` → vid landning `crossRow(giveRow, col, kvar)` |
| källchipet göms | 40 | `srcB.style.visibility = 'hidden'` |
| PAPPER: 10:an hem | 260 → 760 | samma flykt med texten `'10'` → `crossRow(growRow, col, '10')` |
| rutan töms | 260 → 680 | `.nf-think-row` `opacity → 0` över `.42s var(--smooth)` |
| rutan fälls ihop | 900 → 1320 | `.nf-think.leaving` (`opacity .25`, `scale(.97)`) + `closeThink()` |

`cb` vid **1420 ms** (`sumMode === 'eget'`).
`crossRow()` (mockup:1237–1249) sätter `.dw.crossed` — appens befintliga
`@keyframes strike-draw` (0,42 s, 0,05 s fördröjning, `rotate(-22deg)`) — och
lägger en `.small-new-digit` i `#d97706` med
`land-bounce-flex 400ms ease-out both`, fördröjd 240 ms.

### 4.9 `add_sum`, "Ur pappret" (mockup:1789–1799 → `riseSumChip`)

Se 4.10. `cb` vid **1160 ms**.

### 4.10 `riseSumChip()` — summan stiger ur pappret (mockup:1517–1539)

| Fas | Från → till | Vad |
|---|---|---|
| brickan skapas osynlig | 0 | `drawSumChip()`: `.tk-badge.tk-sum` + `badgeColorClass(col)`, `min-width:62px`, parkerad på `rightMarginSpot()` — fri marginal till **höger om hela tabellen**, samma x hela uppgiften igenom; y centrerad på sifferraderna. `animation:none; opacity:0` |
| pappret pulsar | 0 → 520 | varje källa får `animation: nf-read-glow 520ms ease-in-out both` (bara `text-shadow`, aldrig `transform`) |
| avläsningen färdas ut | 200 → 720 | per källa `flyCopyIn(document.body, src → chip, src.textContent.trim(), {dur:520, easing:'cubic-bezier(0.34,1.06,0.5,1)', fixed:true, fontSize:'1.2rem', color:'#d97706', endColor:PVC[col], fade:true})` |
| brickan formas | 760 → 1140 | `chip.style.animation = 'tk-badge-in 380ms cubic-bezier(0.34,1.3,0.4,1) both'` |

`cb` vid **1160 ms**. Källorna kommer ur `paperSources(col)` (mockup:1506–1512):
för varje rad `dw.querySelector('.small-new-digit') || dw` — alltså den lilla
amber-siffran om kolumnen är struken, annars själva siffran. **Siffrorna på
pappret rörs aldrig; det är en avläsning, inte en flytt.**

### 4.11 `add_carry_fly` med `chip:true` (mockup:1611–1637)

| Fas | Från → till | Vad |
|---|---|---|
| 1:an lämnar summan | 0 | `.sum-tens`-spanet får `.gone` (`opacity:0;width:0`) |
| flyger upp | 0 → 700 | `flyBadgeDigit(d1, carryEl(col+1), {dur:700, easing:'cubic-bezier(0.25,0.46,0.45,0.94)', fontSize:'1.5rem', color:'#ffffff', endColor:'#dc2626', endTransform:'rotate(-4deg) scale(0.86)', sound:true})` — elementet är `.tk-fly`, storlek `max(26, sR.width + 12)` px |
| landar som minnessiffra | 720 → 1170 | flygelementet tas bort vid 720; `carries[col+1] = 1`; `updateCarryRow()` skriver `.mem-digit` (`land-bounce-flex 0.45s`) |

`cb` vid **1170 ms**. Utan nästa kolumn: `after(100, cb)`.

### 4.12 `add_result` med `chip:true` (mockup:1847–1863 → `flyChipToAnswer`)

| Fas | Från → till | Vad |
|---|---|---|
| kapseln tonar bort (bara `tf`) | 150 → 500 | `.tk-capsule.fading` (`opacity 0`, `.35s var(--smooth)`), tas bort vid 500 |
| siffran åker ner | 0 → 560 | samma element flyttas: `.fly-fixed` (position:fixed, z-index 40), `transition: left/top 560ms cubic-bezier(0.34,1.12,0.5,1)` |
| blir svarssiffra | 308 → 588 | `background:transparent; boxShadow:none; color:PVC[col]; padding:0; minWidth:0; fontSize:2.2rem` — alla med `280ms var(--smooth)` |
| landar | 600 → 1020 | `fillAns(col, value, 'land-bounce-flex 360ms ease-out both')`; `chip.remove()` |

`cb` vid **1020 ms**. **Brickan klonas inte** — samma element hela vägen, det
förbrukas först när siffran står i cellen (P5).

### 4.13 Oförändrade steg

`add_simple` / `add_result` utan `chip`: `after(300)` → `fillAns()` med
`drop-down 550ms ease-out both`; `cb` vid 1000 ms (mockup:1862).
`add_mem_strike`: `strikeMemDigit()` (SVG-penndraget, `mem-strike-draw` 0,25 s);
`cb` vid 600 ms (mockup:1873–1875 = app:728–731).
`add_overflow`: `cb` vid 400 ms (mockup:1877–1878 = app:733–735).

### 4.14 Ljud

`playCarrySound()` anropas **bara** från flyghjälparna: `flyToken()`
(mockup:1138), `flyBadgeDigit()` när `opts.sound` (mockup:1173) och
`flyCopyIn()` när `opts.sound` (mockup:1215). I den valda kedjan betyder det
exakt två ljud per komplementkolumn: `add_lend` och `add_carry_fly`.
Appens `playCarrySound()` (app:1958–1969) skapar en ny `AudioContext` per
anrop; mockupen återanvänder en och skapar den först efter en användargest
(mockup:1552–1570). **Ta med mockupens variant** — annars varnar webbläsaren i
konsolen, och konsolen ska vara tom i granskningen.

---

## 5. CSS-kontraktet

### 5.1 Redan i appen — kopierat oförändrat, får inte dupliceras

Följande använder mockupen rakt av ur `BASE_CSS`. Radhänvisningarna är appens:

`#uppstallning-root` (app:68), `#up-main` (70), `#up-left` (71–72),
`#up-right` (73), landskaps-/porträttreglerna (78–87),
`#up-table-wrap` (133–135), `.up-table` (136), `.col-cell` (137–141),
`.col-cell.dim` (142), `.col-cell.glow-*` (143–145), `.col-cell.problem-cell`
(146), `.carry-cell` (147–149), `.ans-cell` (150–153), `.ans-cell.filled` (156),
`.dw` (157–158), `.dw.crossed::after` (159–162), `.small-new-digit` (166–167),
`.bt-wrap` (170–172), `.mem-digit` (180–183), `.mem-digit.used` (184),
`.mem-digit .mem-strike` (185–189), `.mem-digit.pulse` (190),
`.thought-bubble` (210–215), `.up-scratch` (246–249), `.up-canvas` (250–253).

Keyframes som redan finns: `strike-draw` (256), `drop-down` (264),
`land-bounce-flex` (274), `fade-up-flex` (279), `glow-g/b/r` (283/287/291),
`prob-pulse` (295), `bubble-in` (299), `mem-strike-draw` (317),
`mem-digit-pulse` (318).

### 5.2 Nytt — måste läggas till i `BASE_CSS`

Verbatim ur mockupen. Inget av detta finns i `js/uppstallning.js` i dag
(kontrollerat: noll träffar på `tk-`, `nf-` och `up-think` i hela filen).

**Kapseln kring paret** (mockup:544–551)
```css
.tk-capsule{position:absolute;z-index:6;pointer-events:none;
  border-radius:22px;border:3px solid #7c3aed;
  background:rgba(255,255,255,0.42);
  box-shadow:0 6px 20px rgba(124,58,237,0.26), inset 0 0 0 6px rgba(250,204,21,0.9);
  animation:tk-cap-in .38s var(--spring) both;}
@keyframes tk-cap-in{0%{transform:scale(.82);opacity:0;}65%{transform:scale(1.04);opacity:1;}
  100%{transform:scale(1);opacity:1;}}
.tk-capsule.fading{transition:opacity .35s var(--smooth);opacity:0;}
```

**Summebrickan (10-brickan)** (mockup:554–563, 570–579, 588)
```css
.tk-badge{position:absolute;z-index:8;pointer-events:none;display:flex;align-items:center;
  gap:1px;padding:4px 12px;border-radius:var(--radius-full);
  background:linear-gradient(135deg,#7c3aed,#a78bfa);
  box-shadow:0 7px 20px rgba(124,58,237,.45), inset 0 1px 0 rgba(255,255,255,.35);
  font-family:var(--font-head);font-weight:800;font-size:1.5rem;color:#fff;line-height:1;
  animation:tk-badge-in .35s var(--spring) both;}
@keyframes tk-badge-in{0%{transform:scale(.4);opacity:0;}65%{transform:scale(1.16);opacity:1;}
  100%{transform:scale(1);opacity:1;}}
.tk-badge .tk-d{display:inline-block;transition:opacity .18s var(--smooth);}
.tk-badge .tk-d.gone{opacity:0;width:0;overflow:hidden;}
.tk-badge.badge-blue{background:linear-gradient(135deg,#3b82f6,#93c5fd);
  box-shadow:0 7px 20px rgba(59,130,246,.45), inset 0 1px 0 rgba(255,255,255,.35);}
.tk-badge.badge-green{background:linear-gradient(135deg,#22c55e,#86efac);
  box-shadow:0 7px 20px rgba(34,197,94,.45), inset 0 1px 0 rgba(255,255,255,.35);}
.tk-badge.badge-red{background:linear-gradient(135deg,#ef4444,#fca5a5);
  box-shadow:0 7px 20px rgba(239,68,68,.45), inset 0 1px 0 rgba(255,255,255,.35);}
.tk-badge.fading{transition:opacity .3s var(--smooth),transform .3s var(--smooth);
  opacity:0;transform:scale(.7);}
.tk-badge.tk-sum{min-width:62px;justify-content:center;}
```
Grundregelns lila gradient i `.tk-badge` skrivs alltid över av
`badgeColorClass()`, som bara returnerar `badge-green` / `badge-blue` /
`badge-red` (mockup:1343–1348). Behåll ändå lila som fallback.
**Uteslut** `.tk-badge.badge-purple` (mockup:568), `.tk-badge.lonely`
(mockup:576) och `.tk-badge.tk-chipfly` (mockup:598–599) — ingen JS-rad sätter
dem i det valda läget.

**Flygande siffror** (mockup:581–585)
```css
.tk-fly{position:absolute;z-index:22;pointer-events:none;display:grid;place-items:center;
  font-family:var(--font-head);font-weight:800;line-height:1;}
.tk-fly.fly-fixed{position:fixed;z-index:40;}
.tk-badge.fly-fixed{position:fixed;z-index:40;}
```

**Avläsningspulsen och pulsarna** (mockup:592–605)
```css
@keyframes nf-read-glow{
  0%,100%{ text-shadow:none; }
  45%{ text-shadow:0 0 9px currentColor, 0 0 3px currentColor; }
}
.dw.tk-pop{animation:tk-pop .3s var(--spring) both;}
@keyframes tk-pop{0%{transform:scale(1);}45%{transform:scale(1.34);}100%{transform:scale(1);}}
.carry-cell .mem-digit.tk-blink{animation:tk-blink .4s ease-in-out both;}
@keyframes tk-blink{0%,100%{transform:rotate(-4deg) scale(1);}
  50%{transform:rotate(-4deg) scale(1.45);}}
```

**Spökkonturen** (mockup:613–626)
```css
.nf-ghost{position:absolute;z-index:7;pointer-events:none;display:grid;place-items:center;
  border-radius:12px;border:2.5px dashed currentColor;background:rgba(255,255,255,0.55);
  font-family:var(--font-head);font-weight:800;font-size:1.45rem;line-height:1;opacity:.40;
  animation:nf-ghost-in .38s var(--spring) both;}
@keyframes nf-ghost-in{0%{transform:scale(.6);opacity:0;}
  65%{transform:scale(1.12);opacity:.48;}100%{transform:scale(1);opacity:.40;}}
.nf-ghost.filled{opacity:1;background:rgba(255,255,255,0.96);border-style:solid;
  box-shadow:0 5px 16px rgba(0,0,0,.14);}
.nf-ghost.pop{animation:tk-pop .3s var(--spring) both;}
.nf-ghost.inline{position:static;width:36px;height:36px;font-size:1.35rem;
  margin-left:-3px;flex:0 0 auto;align-self:center;}
.nf-ghost.fading{transition:opacity .3s var(--smooth),transform .3s var(--smooth);
  opacity:0;transform:scale(.68);}
```

**Siffror mitt i en förändring** (mockup:630–633)
```css
.dw.nf-owing > span{opacity:.34;transition:opacity .25s var(--smooth);}
.col-cell.nf-vacated{border-style:dashed;}
.dw.nf-vacated > span{opacity:.18;transition:opacity .3s var(--smooth);}
```
`.dw.nf-owing` används bara i det förkastade `calcMode='col'`; behåll den inte.

**Tankerutan** (mockup:637–640, 649–682)
```css
#up-think{max-height:0;opacity:0;overflow:hidden;flex-shrink:0;
  transition:max-height .42s var(--spring),opacity .28s var(--smooth);}
#up-think.open{max-height:210px;opacity:1;}
#up-think.off{display:none;}
.nf-think{background:linear-gradient(140deg,#f7f2ff,#eef6ff);border:2.5px dashed #c4b5fd;
  border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);padding:7px 10px 9px;position:relative;}
.nf-think-title{font-family:var(--font-head);font-weight:700;font-size:12.5px;
  color:var(--friends-deep);text-align:center;margin-bottom:3px;}
.nf-think-row{display:flex;align-items:center;justify-content:center;gap:9px;min-height:54px;
  position:relative;}
.nf-chip{min-width:50px;height:50px;padding:0 9px;border-radius:14px;background:#fff;
  border:2.5px solid currentColor;display:grid;place-items:center;
  font-family:var(--font-head);font-weight:800;font-size:1.95rem;line-height:1;
  box-shadow:0 4px 14px rgba(93,63,158,.13);opacity:0;
  transition:opacity .22s var(--smooth);}
.nf-chip.in{opacity:1;}
.nf-chip.owing{opacity:.38;border-style:dashed;}
.nf-chip.pop{animation:tk-pop .32s var(--spring) both;}
.nf-chip.nf-mem{min-width:38px;height:42px;font-size:1.5rem;border-width:2px;border-style:dashed;}
.nf-dot{font-family:var(--font-head);font-weight:800;font-size:1.5rem;color:#94a3b8;
  margin:0 -3px;opacity:0;transition:opacity .22s var(--smooth);}
.nf-dot.in{opacity:1;}
.nf-chip.isten{border:none;padding:0 12px;color:#fff;gap:1px;display:flex;align-items:center;
  background:linear-gradient(135deg,#7c3aed,#a78bfa);
  box-shadow:0 7px 20px rgba(124,58,237,.42), inset 0 1px 0 rgba(255,255,255,.35);}
.nf-chip.isten.badge-blue{background:linear-gradient(135deg,#3b82f6,#93c5fd);
  box-shadow:0 7px 20px rgba(59,130,246,.42), inset 0 1px 0 rgba(255,255,255,.35);}
.nf-chip.isten.badge-green{background:linear-gradient(135deg,#22c55e,#86efac);
  box-shadow:0 7px 20px rgba(34,197,94,.42), inset 0 1px 0 rgba(255,255,255,.35);}
.nf-chip.isten.badge-red{background:linear-gradient(135deg,#ef4444,#fca5a5);
  box-shadow:0 7px 20px rgba(239,68,68,.42), inset 0 1px 0 rgba(255,255,255,.35);}
.nf-op{font-family:var(--font-head);font-weight:800;font-size:1.5rem;color:#64748b;
  opacity:0;transition:opacity .22s var(--smooth);}
.nf-op.in{opacity:1;}
.nf-think.leaving{transition:opacity .3s var(--smooth),transform .3s var(--smooth);
  opacity:.25;transform:scale(.97);}
```
`#up-think.overlay`-reglerna (mockup:643–648) hör till det förkastade läget
"Över kladden" och byggs inte.

`--shadow-sm` (styles/app.css:171) och `--friends-deep` (styles/app.css:74)
används av `.nf-think`/`.nf-think-title`; de finns i `styles/app.css` och behöver
inte deklareras om i `BASE_CSS`.

### 5.3 DOM som måste till

`renderDemoView()` (app:590–614) bygger i dag
`#up-table-wrap → #up-bubble → #up-next-area` inuti `#up-left`.
Lägg till `<div id="up-think" class="off"></div>` **mellan** `#up-table-wrap`
och `#up-bubble` (mockupens ordning, mockup:705).
`class="off"` sätts när kolumnen inte använder tankerutan.

Tabellen: mockupen bytte appens `id`-schema mot `data-row`/`data-col`
(mockup:1036–1078). **Behåll appens id-schema** (`cell-row-a-ental`,
`dw-a-ental`, `ans-ental`, `carry-ental`, app:1176/1178/1200/1168) och låt
hjälparna `cellEl/dwEl/ansEl/carryEl` slå upp via `getElementById` — då rörs
inte `buildTableHTML()` (app:1154–1235), som övningsläget och
subtraktionsgrenen delar.

---

## 6. Måtten

### 6.1 Regeln

* **Uppställningen får aldrig scrolla.** `#up-left{overflow-y:auto}` (app:71) gör
  att en för hög uppgift tyst börjar scrolla i stället för att larma.
  Mätvärdet är `left.scrollHeight > left.clientHeight + 1` (mockup:2104).
* **Kladdytan får aldrig understiga sitt minimum.** `#up-right{min-height:150px}`
  i porträtt (app:86) är golvet. `SCRATCH_MIN = 150` (mockup:2086).
* **Referensramen är 390 × 844 px** (iPhone-innermått). `FRAME_H = 844`
  (mockup:2086).
* Behovet räknas `need = header + #up-left.scrollHeight + 150` (mockup:2102).
  `need > 844` **eller** scroll **eller** kladdyta < 150 ⇒ underkänt
  (mockup:2107).

### 6.2 Mätvärden per tal

Uppmätta i mockupen, 390 × 844, fart 2×, hela uppgiften genomspelad.
Header = **68 px** i samtliga fall. Vilande uppgift (ingen bubbla, ingen
tankeruta) = **340 px**, `need` = **558 px**, kladdyta 441 px.

| Tal | Kolumntyper | Max `need` | Uppgiften max | Minsta kladdyta | Tankerutan | Marginal |
|---|---|---|---|---|---|---|
| 47 + 35 | komplement + direkt | 698 px | 480 px | 300 px | 98 px | +146 px |
| 26 + 37 | komplement + direkt | 698 px | 480 px | 300 px | 98 px | +146 px |
| 68 + 57 | komplement + komplement m. minne | **720 px** | 502 px | **278 px** | 98 px | +124 px |
| 41 + 39 | exakt-10 + direkt | 600 px | 382 px | 398 px | 0 px | +244 px |
| 47 + 53 | exakt-10 + exakt-10 | 622 px | 404 px | 376 px | 0 px | +222 px |
| 63 + 37 | exakt-10 + exakt-10 | 622 px | 404 px | 376 px | 0 px | +222 px |
| 38 + 57 | komplement + direkt | 698 px | 480 px | 300 px | 98 px | +146 px |
| 38 + 79 | komplement + komplement m. minne | **720 px** | 502 px | **278 px** | 98 px | +124 px |
| 32 + 29 | komplement + direkt | 698 px | 480 px | 300 px | 98 px | +146 px |

Sämsta fallet är **720 px av 844** — 124 px marginal, kladdytan 278 px, ingen
scroll. Tankerutan i flödet kostar 98 px + 8 px flex-gap; den två-radiga
`add_lift`-bubblan ("+ minnet") kostar ytterligare 22 px.

**Gräns att hålla vid bygget:** `#up-think.open{max-height:210px}` är ett tak,
inte en höjd. Den uppmätta höjden är 98 px både med och utan minnesbricka. Om
tankerutan någonsin växer förbi 210 px klipps den tyst — höj taket, öka inte
innehållet.

---

## 7. De två minnessiffre-hålen

Ingetdera är löst i mockupen. Båda är krav att bygga.

### 7.1 Hål A — ceremonin utan innehåll

**Vad appen gör i dag.** När `effectiveA` redan är 10 blir
`behover = 10 - 10 = 0` (app:509) och `kvar = b - 0 = b` (app:510). Inget
behöver lånas — men `buildDemoSteps()` kör ändå hela kedjan
`add_over9 → add_explain → add_cross → add_carry_fly → add_result`
(app:511–517), och `add_cross` (app:660–685) stryker över en siffra för att
skriva dit samma siffra.

**Verifierat exempel `95 + 47`, tiotalskolumnen** (`a=9`, `b=4`, `carry_in=1`).
Appens bubbla, ordagrant ur `showStepBubble()` app:913–916:

```html
<span style="color:#3b82f6">9</span> + <span style="color:#d97706">1</span> = <strong>10</strong> (<span style="color:#d97706">1</span>:an är minnessiffran).<br>
<span style="color:#3b82f6">10</span>:ans 10-kompis är <strong>0</strong>.<br>
Vi tar <strong>0</strong> från <span style="color:#3b82f6">4</span>: 4 − 0 = 4 (kvar från <span style="color:#3b82f6">4</span>:an blir <strong>4</strong>).<br>
Så <span style="color:#3b82f6">4</span> blir <strong>4</strong> och <span style="color:#3b82f6">9</span>:an blir <strong>10</strong>! 💡
```

och därefter, `add_cross`, app:925:

```html
Vi stryker och skriver om: <span style="color:#3b82f6">4</span> → <strong>4</strong>, <span style="color:#3b82f6">9</span> → <strong>10</strong> (<span style="color:#3b82f6">9</span> + <span style="color:#d97706">1</span> minne + <strong>0</strong> lån = 10) ✏️
```

**Hur ofta.** Räknat på `generatePair()`s faktiska intervall (app:422–427),
3 000 000 dragningar per nivå samt uttömmande på nivå 3:

* Appens nuvarande regel (minnet alltid till översta talet): **8,0 %** av
  uppgifterna på nivå 3 (talintervall 40–99, uttömmande: 7,96 % av 3 390
  giltiga par) och **6,3 %** på nivå 4.
* **Med den nya största-talet-regeln växer klassen till 14,6 % (nivå 3) och
  12,0 % (nivå 4)**, eftersom minnet nu också kan landa på nedre raden och göra
  *den* till en tia. Villkoret blir `max(a, b) === 9 && carry_in === 1`, inte
  `a === 9 && carry_in === 1`. Hålet är alltså **viktigare** efter omläggningen,
  inte mindre viktigt.

**Vad mockupen gör.** `buildSteps()` har ett reservfall (mockup:817–823) som
redan hoppar över komplementstegen:
```js
} else {
  steps.push({ type:'add_sum', ...base, box:false, way:'ur' });
  steps.push({ type:'add_carry_fly', ...base, nf:true, chip:true });
  steps.push({ type:'add_result', ...base, nf:true, chip:true });
}
```
Men **ingen av mockupens nio uppgifter träffar det** (kontrollerat: ingen
`CASES`-post har `max(a,b) === 9` i en kolumn med minne), och reservfallet
saknar minnessteget. Barnet ser en 9:a och en 4:a på pappret och får en bricka
som säger 14, utan att minnet någonsin nämnts.

**KRAV.**

1. **Klassificera kolumnen.** När `sum > 9`, `!isExactTen(growVal, giveVal)` och
   `behover === 0` är kolumnen av typen **`10 + resten`**. Kedjan blir:

| # | Stegtyp | Flaggor | Bubbeltext |
|---|---|---|---|
| 1 | `add_highlight` | — | *(tom)* |
| 2 | `add_memjoin` | `box:false` | `Minnet gör <strong style="color:{c}">{memDigit}</strong>:an till <strong style="color:{c}">{memNew}</strong>.` |
| 3 | `add_sum` | `box:false, way:'ur', nostrike:true` | `<strong>10</strong> och <strong style="color:{c}">{kvar}</strong> är <strong style="color:{c}">{sum}</strong>.` |
| 4 | `add_carry_fly` | `nf:true, chip:true` | `<strong style="color:#d97706">1</strong>:an åker upp som minne. 👆` |
| 5 | `add_result` | `nf:true, chip:true` | `<strong style="color:{c}">{ans}</strong>:an åker ner i svaret. ✅` |
| 6 | `add_mem_strike` | villkorat | oförändrat |

   **Ingen `add_lift`, ingen tankeruta, ingen `add_need`, ingen `add_lend`,
   ingen `add_ten_named`, ingen `add_return`, ingen strykning.**

2. **`95 + 47`, tiotalskolumnen** ger alltså ordagrant:
```html
Minnet gör <strong style="color:#3b82f6">9</strong>:an till <strong style="color:#3b82f6">10</strong>.
```
```html
<strong>10</strong> och <strong style="color:#3b82f6">4</strong> är <strong style="color:#3b82f6">14</strong>.
```
```html
<strong style="color:#d97706">1</strong>:an åker upp som minne. 👆
```
```html
<strong style="color:#3b82f6">4</strong>:an åker ner i svaret. ✅
```

3. **Specialfall `kvar === 0`** (`295 + 208`, tiotalskolumnen, `a=9`, `b=0`,
   `carry_in=1`): samma kedja, summan är 10:
```html
Minnet gör <strong style="color:#3b82f6">9</strong>:an till <strong style="color:#3b82f6">10</strong>.
```
```html
<strong>10</strong> och <strong style="color:#3b82f6">0</strong> är <strong style="color:#3b82f6">10</strong>.
```
   Följt av `1`:an upp och `0`:an ner. Verifierat att `ans === 0` och
   `nextCarry === 1` i det fallet.

4. **Flaggan `nostrike:true` styr två saker.**
   a) Färgen på `kvar` i `add_sum`-texten blir kolumnens platsvärdesfärg i
      stället för amber `#d97706`. Amber betyder i hela appen "omskriven siffra
      på pappret"; här är ingenting omskrivet, och en amber 4:a vid sidan av en
      ostruken blå 4:a vore en lögn om vilket lager siffran tillhör.
   b) `paperSources(col)` måste för detta fall returnera **tre** källor: de två
      `.dw`-elementen *och* `.mem-digit` i `carry-cell` för kolumnen. Annars
      läser avläsningspulsen `9` och `4` och bildar `14` ur intet.
      Minnessiffrans kopia flyger med `color:#dc2626` och `endColor:PVC[col]`.
      Tiderna i `riseSumChip()` ändras inte.

5. **`add_memjoin` med `box:false` måste fungera utan tankeruta.** Mockupens
   icke-box-gren finns (mockup:1663–1672) och gör: `.mem-digit` blinkar 250 ms
   (`tk-blink`), sedan `flyCopy(mem-digit → cellEl(memRow, col), String(carry_in),
   {dur:550, easing:'cubic-bezier(0.25,0.46,0.45,0.94)', fontSize:'1.2rem',
   color:'#d97706', endColor:'#d97706', fade:true})`, därefter `pop(dw, 300)`;
   `cb` vid **1140 ms**. Den grenen är skriven för det förkastade läget
   `calcMode='col'` och har aldrig körts — den måste provköras.

### 7.2 Hål B — nollan som blir en etta

**Vad problemet är.** När den siffra minnet läggs på är `0` — t.ex.
`0 + 9 + minne 1` — blir `memNew = 1`, och flödet skulle kunna påstå
"1 och 9 är tiokompisar" fast barnet ser en nolla och en nia på pappret.

**Vad som faktiskt händer i mockupens kod, med de valda lägena.** Eftersom
`memTo='storsta'` och `b = 9 > a = 0` går minnet till **nedre** raden
(mockup:741): `valB = 10`, `valA = 0`, `growVal = 10`, `giveVal = 0`,
`behover = 0`. `isExactTen(10, 0)` är falskt (`giveVal >= 1` faller), så
kolumnen hamnar i reservfallet — **inte** i `tf_pair`. Den påstådda
tiokompis-lögnen uppstår alltså bara med det förkastade `memTo='oversta'`, där
`valA = 1`, `valB = 9` och `isExactTen(9, 1)` är sant.

Det betyder inte att hålet är borta: med `memTo='storsta'` blir `0 + 9 + minne 1`
i stället ett `10 + resten`-fall enligt §7.1, och där är minnessteget obligatoriskt
av exakt samma skäl.

**Hur ofta.** En kolumn där den siffra minnet läggs på är `0`: **0,64 %** av
uppgifterna på nivå 4 (3 000 000 dragningar), **0 %** på nivå 3 (a-siffrorna
ligger i 4–9 och b-siffrorna kan inte bli den mindre nollan i en kolumn med
minne där summan går över 9). Detta bekräftar de 0,6 % som uppdraget anger.

**KRAV.**

1. **Minnessteget talar alltid först när `memDigit === 0`.** I `buildDemoSteps()`
   läggs `add_memjoin` in **före** `tf_pair` och före `10 + resten`-kedjan när
   `carry_in && memDigit === 0`. Texten är den som `bubbleHTML`s
   `add_memjoin`-gren redan producerar för `memDigit=0, memNew=1` — alltså
   ordagrant:
```html
Minnet gör <strong style="color:{c}">0</strong>:an till <strong style="color:{c}">1</strong>.
```
   Ingen ny sträng behöver skrivas.

2. **När `add_memjoin` har talat får `tf_pair` inte upprepa minnet.** Sätt
   `memSaid:true` på `tf_pair`-steget och låt `bubbleHTML` då använda kortformen
   (mockup:1905–1906) i stället för minnesformen (mockup:1899–1903):
```html
<strong style="color:{c}">{valA}</strong> och <strong style="color:{c}">{valB}</strong> är tiokompisar — precis <strong>10</strong>! 💛
```
   Utan `memSaid` behålls minnesformen — det är den som `47 + 53`s
   tiotalskolumn använder i dag och den fungerar (*"5 plus minnet 1 är 6. Och 4
   och 6 är tiokompisar — precis 10! 💛"*).

3. **`add_memjoin` med `box:false` före `tf_pair`** måste inte öppna tankerutan.
   Samma animation och samma 1 140 ms som i §7.1 punkt 5.

---

## 8. Övningsläget

Övningsläget är i dag **helt beroende av de gamla stegtyperna** och slutar
undervisa metoden i samma sekund demon byggs om. Det är inte en följdändring att
skjuta på; det är en del av skivan.

### 8.1 Bindningen som brister

`preprocessExSteps()` (app:558–587) letar upp demons steg per kolumn:

```js
const overStep     = steps.find(s => s.type === 'add_over9'      && s.col === c);
const explainStep  = steps.find(s => s.type === 'add_explain'    && s.col === c);
const crossStep    = steps.find(s => s.type === 'add_cross'      && s.col === c);
const carryFlyStep = steps.find(s => s.type === 'add_carry_fly'  && s.col === c);
const resultStep   = steps.find(s => (s.type === 'add_result' || s.type === 'add_simple') && s.col === c);
```
och sätter `needsTenFriend: !!overStep` (app:578).

Efter omläggningen finns **inte** `add_explain` och `add_cross` längre, och
`add_over9` byggs inte alls i det valda läget (`merged` är sant, mockup:774–775).
Därmed blir `needsTenFriend` **false för varje kolumn**, och `showExColUI()`
faller igenom alla tre 10-kompis-grenarna (app:1361, 1367, 1372) rakt ner till
numpad-grenen (app:1377–1389). Barnet får bubblan
`Vad är <strong>7</strong> + <strong>5</strong>? ` (app:1433–1436) och ska gissa
12:ans entalssiffra utan att någon metod visats. `exTenStep2()` (app:1583–1598)
skulle dessutom anropa `executeStep(colData.crossStep)` med `undefined`.

### 8.2 Vad som måste ändras, funktion för funktion

**`preprocessExSteps()` (app:558–587).** Byt de fem `find`-anropen mot en
per-kolumn-kö. Behåll `correctAnswer` och `nextCarry` (app:572–573) — de läses
från `resultStep`/`calcStep` och fungerar oförändrat. Nytt fält:

```js
kind: 'simple' | 'exact10' | 'complement' | 'tenPlusRest',
queue: steps.filter(s => s.col === c && DEMO_TYPES.has(s.type))   // i ordning
```
där `DEMO_TYPES` = `add_lift, add_memjoin, add_need, add_lend, add_ten_named,
add_return, add_sum, tf_pair, add_carry_fly`. **`add_result` ingår inte** —
svarssiffran är barnets jobb. `needsTenFriend` tas bort som begrepp; de tre
subtraktionsfälten (`flipStep`, `interStep`, `needsBorrow`, `isDouble`,
app:574–577) rörs inte.

**`exTenPhase` (app:37).** Kommentaren *"0=visa 'Tryck för att se', 1=visa
förklaring, 2=animation körd, 3=carry körd"* blir fel. Ny innebörd:
**index i `queue`**, 0…`queue.length`. Initieringen `exTenPhase = [0,0,0]`
(app:1268) står kvar.

**`showExColUI()` (app:1318–1390).** De tre grenarna `isTenFriend && tenPhase
=== 0|1|2` (app:1361–1376) ersätts av **en** gren:

* `phase === 0 && queue.length` → den gula lockknappen (app:1363–1365,
  texten `👆 Tryck här för att se hur! 🔢` behålls).
* `0 < phase < queue.length` → `btn-primary btn-block` med texten
  `Nästa steg` + `#i-play`, som anropar `exTenStepNext()`.
* `phase >= queue.length` → numpaden (app:1377–1389), oförändrad.

**`exBubbleMsg()` (app:1392–1442).** Grenarna app:1404–1427 (`isTenFriend &&
tenPhase 0/1/2/≥3`) ersätts av ett enda anrop till **samma** textfunktion som
demon använder, så att demo och övning säger ordagrant samma sak:
`msg = bubbleHTML(queue[phase])`. Det förutsätter att `showStepBubble()`s
innehåll bryts ut till en ren `bubbleHTML(step)` utan sidoeffekter — mockupens
struktur (mockup:1889–1988 + `setBubbleHTML`, mockup:1992–1997) är mallen.
Den sista prompten före numpaden (app:1425–1427) — i dag
`Kvar: <strong>5</strong> − <strong>3</strong> = ? Fyll i!` — måste bort: den
nya metoden frågar inte efter `b − behover`. Ersätt med:
```html
Vad är sista siffran i <strong style="color:{c}">{sum}</strong>?
```
Grenarna `needsBorrow` (app:1399–1402), `demoBorrowTens` (app:1429–1431) och
subtraktionsgrenen (app:1438–1439) rörs inte.

**`exTenStep1/2/3` (app:1574–1628).** De tre slås ihop till **en**:

```js
function exTenStepNext(){
  if (exInputLocked) return;
  const c = exCurrentCol, q = exColData[c].queue, step = q[exTenPhase[c]];
  ...
  executeStep(step, () => { exTenPhase[c]++; exInputLocked = false; showExColUI(c); });
}
```
Undantaget som **måste bevaras** är `add_carry_fly`: i dag initierar
`exTenStep3()` (app:1600–1628) inte flygningen utan lämnar över till barnets tap
(`memPhase = { kind:'place', col: c + 1, srcCol: c }`, app:1621, med bubblan
`Var ska minnessiffran? 🤔 Tryck på rätt ruta!`, app:1625). Den mekaniken —
"levande minnessiffror" — flyttas rakt över: när `step.type === 'add_carry_fly'`
och `step.nextCarry && c + 1 < colCount`, kör inte `executeStep`, utan sätt
`memPhase` som i dag. `memTableTap()` (app:1631–1690) anropar därefter
`animateCarryToken()`; **den måste bytas mot `flyBadgeDigit()` från summebrickan**
(§4.11), annars flyger en gul token upp medan brickan i marginalen står kvar med
sin 1:a och pappret ljuger. Efter landningen sätts `exTenPhase[src]++` i stället
för `= 3` (app:1651).

**`exSubmitCol()` (app:1455–1523).** Två ändringar:
1. Rad 1474: `!exColData[exCurrentCol].needsTenFriend` byts mot
   `exColData[exCurrentCol].kind === 'simple'` — annars flyger carry-token två
   gånger i en komplementkolumn.
2. När kolumnen har en summebricka kvar i marginalen ska det korrekta svaret
   landa med `flyChipToAnswer(sumChip(), col, correctDigit, …)` (§4.12) i
   stället för att skrivas direkt i `ans-cell` (app:1466–1472). Brickan får
   aldrig lämnas kvar när kolumnen är klar.

**`renderExLayout()` (app:1277–1304).** Lägg in
`<div id="up-think" class="off"></div>` mellan `#up-table-wrap` och
`#ex-bubble`, annars kastar `add_lift` på `t.innerHTML` när `thinkEl()` är
`null`.

**Publikt API (app:2103–2113).** `exTenStep1, exTenStep2, exTenStep3` (app:2108)
byts mot `exTenStepNext`. Alla `onclick`-strängar i `showExColUI()` följer med.

**`helpMode === false` (fria läget).** `exFreeInit/exFreePress/exFreeSubmit`
och `freeMemTap` rörs inte alls — det läget visar ingen metod.

---

## 9. Vad som INTE ändras

* **Subtraktionsgrenen.** `buildDemoSteps()`s else-gren (app:527–551),
  `executeStep`-fallen `sub_highlight`, `sub_cant`, `sub_cant_double`,
  `sub_flip_borrow`, `sub_borrow`, `sub_ten_minus`, `sub_calc`
  (app:737–874), bubbeltexterna (app:948–979), `showBorrowTen`/`useBorrowTen`
  (app:1053–1070), `animateBorrowToken` (app:1115–1151), `playBorrowSound`
  (app:1971–1983), `.borrow-ten`/`.digit-new`/`@keyframes borrow-glow`
  (app:174–177, 164–165, 303). Rör ingenting av det.
* **`js/multdiv.js`.** Utanför skivan.
* **Minnessiffrans livscykel.** `.mem-digit` (app:180–190): röd `#dc2626`,
  roterad `-4deg`, `font-family:var(--font-head)`. Den **stryks, suddas aldrig**
  — `updateCarryRow()` skriver endast till (app:1020–1033), `strikeMemEl()`
  lägger på `MEM_STRIKE_SVG` och `.used` (app:1038–1043), och sista kolumnens
  minne stryks inte (app:523 / mockup:829). Tap-ytan `.mem-digit::after
  {inset:-14px}` och `.carry-cell::after {inset:-10px -4px}` (app:191–192)
  behålls.
* **Platsvärdesfärgerna.** `PVC = { ental:'#22c55e', tiotal:'#3b82f6',
  hundratal:'#ef4444' }` (app:56). 10-brickan tar kolumnens färg men
  uppställningens siffror byter aldrig färg. Amber `#d97706` betyder fortfarande
  och bara "omskriven siffra på pappret".
* **"En vy = en skärm".** `#uppstallning-root{height:100vh;overflow:hidden}`
  (app:68) och `#up-main{overflow:hidden}` (app:70) står kvar. Tankerutan ligger
  **i flödet** inuti `#up-left` — inte som overlay — och måste därför rymmas i
  höjdbudgeten enligt §6.
* **Lägesvyn, svårighetschipsen, resultatvyn, loggningen** (app:1240–1253,
  2090–2100) och `generatePair()` (app:413–457). Talintervallen ändras inte.

---

## 10. Frågor specen inte besvarar

1. **Amber eller platsvärdesfärg på `kvar` i `10 + resten`-fallet.** §7.1 punkt 4a
   föreskriver platsvärdesfärg med motiveringen att ingenting är omskrivet. Det
   är ett beslut jag har fattat, inte något mockupen visar. Om Dennis hellre vill
   ha genomgående amber i `add_sum` är ändringen en rad och `nostrike`-flaggan
   kan behållas enbart för `paperSources`.
2. **Hur `10 + resten`-kolumnen ska kännas i övningsläget.** §8 ger kedjan, men
   inte om lockknappen (`👆 Tryck här för att se hur! 🔢`) är rätt ton för en
   kolumn där det inte finns något knep att se.
3. **Tröskeln för när tankerutan är onödig.** Mockupen öppnar den för varje
   komplementkolumn, även `9 + 2`, där `behover = 1`. Om det finns en undre
   gräns (t.ex. `behover === 1` klaras utan ruta) är den inte bestämd.
4. **`MINNESSIFFER-KONCEPT.md`.** Mockupen citerar dokumentet (mockup:317) som
   källa för "appen ska nöta in strukturen". Filen finns inte i repot — varken i
   roten eller i `docs/`. Om den finns någon annanstans bör den läsas innan
   `add_return` ifrågasätts, eftersom det är den regeln som motiverar att
   strykningen alltid landar i kolumnen.
5. **Nivå 1 och 2.** Alla frekvenssiffror i §7 gäller nivå 3 och 4. Nivå 1
   (summa ≤ 20) och nivå 2 (summa < 100) är inte genomräknade, och nivå 1 har
   ensiffriga tal där `colCount` är 2 — kedjorna bör provköras där också.
6. **Reducerad rörelse.** Mockupen har
   `@media (prefers-reduced-motion:reduce)` i labbskalet (mockup:185–188) men
   **inte** i `PHONE_CSS`. Vad som ska hända med `riseSumChip` och
   `flyChipToAnswer` när rörelse är avstängd är obestämt.
