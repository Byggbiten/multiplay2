# GRANSKNING · UPPSTÄLLD SUBTRAKTION — 2026-09-21

**Granskat:** subtraktionsgrenen i `js/uppstallning.js` (gren `dev`, 3 317 rader). Ren läsning + mätning, ingen kod ändrad.
**Måttstock:** `.project-context/UPPSTALLNING-ADDITION-SPEC.md` kap. 1 och "Globala villkor" i `docs/superpowers/plans/2026-09-21-uppstallning-addition.md`. Additionsgrenen är facit och har inte granskats.
**Mätmiljö:** Playwright, egen kontext 390×844 (isMobile, DPR 2) mot `http://localhost:5312/`. Tal tvingade fram genom att stubba `Math.random` med en kö före `startDemo()`/`startExercise()`. Tider mätta med `MutationObserver` + `performance.now()` från trycket på "Nästa steg". Skärmbilder i `/tmp/gransk-subtraktion/`.
Varje fil:rad och mätvärde nedan är läst eller mätt; inget ur minnet.

---

## 1. Vad modulen gör

Subtraktionen använder "vänd om"-metoden (koden kallar den *Kompletteringsmetoden*, `js/uppstallning.js:863`): när övre siffran är mindre än undre räknas skillnaden åt andra hållet (`b − a = diff`), och svaret blir `10 − diff`. Stegbyggaren (`buildDemoSteps`, rad 853–890) går kolumn för kolumn och skapar `sub_highlight` (rad 866), och antingen `sub_calc` (rad 884) när det går, eller kedjan `sub_cant`/`sub_cant_double` (870) → ev. `sub_borrow` H→T vid dubbellån (874) → `sub_flip_borrow` (879, strykning + T→E-lån i ett steg) → `sub_ten_minus` (882). Renderingen ligger i `executeStep` (rad 1379–1516), texterna i `bubbleHTML` (rad 1640–1672). Lånet visas som en `+10`-token som flyger mellan cellerna (`animateBorrowToken`, 1806–1841) och en `.borrow-ten`-markör "10" ovanför kolumnen (`showBorrowTen`, 1744–1754), som stryks när den använts (`useBorrowTen`, 1756–1760). Övningsläget med hjälp bygger per-kolumn-data i `preprocessExSteps` (923–944), visar en lånaknapp (2489–2492), spelar upp samma steg som demon via `exDoBorrow`/`exContinueBorrow` (2678–2722) och öppnar sedan en numpad. Fria läget delar additionens nya cellinmatning (`.free-keys`, 2452–2471).

---

## 2. Fynd, rangordnade

### A — pedagogisk lögn / teleport

**A1. `sub_flip_borrow` säger tre saker och avslöjar svaret ett steg för tidigt.**
Belägg: `js/uppstallning.js:1656–1660`. Bubblan för 405 − 187 lyder verbatim: *"Vi vänder om: 7 − 5 = 2, lånar 1 från 10 → 9 / Svaret blir 10 − 2 = 8 💡"* (D1 steg 3, skärmbild `D1-step3-t250.png`). Det är tre led (vänd om, låna, svaret) och två räkneoperationer i text. Nästa steg, `sub_ten_minus` (1666–1668), säger sedan samma sak igen: *"10 − 2 = 8 ✅"* och skriver 8:an. Slutsatsen står alltså i steget FÖRE det steg som producerar den (regel 1, 3, 13). Mätt: hela texten visas vid t=0 medan rörelserna kommer vid 0 / 505 / 1006 ms och steget släpps vid 2 479 ms.
Fix: dela `sub_flip_borrow` i tre steg (vänd om · låna · tian landar) och flytta "Svaret blir …" till `sub_ten_minus`. **Storlek: M.**

**A2. Tian teleporterar: tokenen skapas och förstörs i samma steg, och markören landar innan tokenen lämnat källan.**
Belägg: `animateBorrowToken` (1806–1841) skapar `+10` (1819) och tar bort den (1836–1840). Mätt i `sub_flip_borrow` (D1 steg 3): `#borrow-ten-ental` "10" läggs till vid **1 006 ms** — i samma anrop som tokenen skapas (1445–1447: `showBorrowTen` före `animateBorrowToken`). Tokenen flyger 1 019→1 807 ms, tonar till opacity 0 och tas bort vid 2 160 ms. Under 800 ms syns alltså två tior samtidigt (`D1-step3-t1200.png`), och det som anländer är ingenting — markören stod redan där. I `sub_borrow` (1453–1484) är det tvärtom: tokenen är borta vid 1 555 ms och FÖRST DÅ skrivs "10" i tiotalskolumnen (D1 steg 2) — 350 ms av tomrum mellan flyg och landning. Bryter regel 4 och 2.
Fix: låt en enda bricka (`.borrow-ten`) födas i källkolumnen, flyga och BLI markören; ta bort `animateBorrowToken`. **Storlek: M.**

**A3. Lögnstrykning när övre siffran är 0 eller när `b − a = b`.**
Belägg: `1404–1408` skriver ALLTID en liten röd "0" under den strukna övre siffran (`sp.textContent = 0`, rad 1407), och `1411–1417` skriver `diff` under den undre. För 40 − 18 (D2, `D2-40-18-step2-end.png`) stryks 0:an och en liten 0 skrivs under den; 8:an stryks och en liten 8 skrivs under den. För 100 − 55 (D3) samma sak: 0→0, 5→5. Barnet ser en siffra strykas och ersättas av sig själv. Den lilla 0:an under övre siffran används dessutom aldrig av något senare steg — den är ett dött objekt i alla fall.
Fix: skriv aldrig 0:an under övre siffran, och hoppa över vänd-om-strykningen helt när `a === 0`. **Storlek: S.**

**A4. Ledande nolla i svaret: "0 − 0 = 0" i en kolumn som är tom på pappret.**
Belägg: kolumnloopen (866–884) går över alla `colCount` kolumner; tabellen visar tomma celler när talet är kortare (`showA`/`showB`, 2281–2282) men stegen läser `db[c] = 0`. Kört: 100 − 55 → *"Kolumn H (hundratal): 0 − 0 — det går! ✅"*, *"0 − 0 = 0"*, svaret skrivs **0 4 5** (`D3-100-55-final.png`, undre H-cellen är tom). 8 − 3 på nivå 1 → svaret **0 5** med två helt tomma T-celler (`D5-8-3-final.png`). 15 − 7 → **0 8**. Slutbubblan säger sedan "= 45" / "= 5". Ingen skriver 045 på papper.
Fix: avsluta kolumnloopen när återstående `effA` och `db` är 0 och cellen är tom (och gör motsvarande i `preprocessExSteps`/`exCheckDone` så övningen inte kräver en 0:a). **Storlek: S.**

### B — sekvensbrott

**B1. Lånet har tre namn.** Texten säger *"lånar 1 från 4 → 3"* (1658), tokenen säger `+10` (1819), markören säger `10` (1751), övningen säger *"Du lånade en 10:a!"* (2548). Ett barn som just lärt sig platsvärde får "1", "+10" och "10" för samma sak inom 2,5 sekunder.
Fix: ett namn — "en tia" — i alla fyra texter och en enda bricka (följer av A2). **Storlek: S.**

**B2. Dubbellånet: två led i ett steg i demon, och inga ord alls i övningen.**
Belägg: `sub_borrow`-bubblan (1661–1665) lyder *"4 → 3 (ger ett tiotal till T) / T: 0 → 10 ✅"* — två rader, två händelser, och slutsatsen "0 → 10" sägs vid t=0 medan 10:an skrivs vid 1 555 ms. I övningsläget spelar `exContinueBorrow` (2703–2722) `interStep` + `flipStep` i följd utan att sätta någon bubbla: mätt **4 626 ms** animation (405 − 187, H1) medan bubblan står kvar på *"Vi vänder om: 7 − 5 = 2. Nu måste vi räkna ut 10 − 2 för att få svaret! 💡"* (2692) — en text som handlar om entalet medan hundratalet och tiotalet stryks.
Fix: dela `sub_borrow` i två steg (H lånar ut · T blir 10) och låt `exContinueBorrow` kalla `showStepBubble(step)` per steg som `exTenStepNext` gör. **Storlek: M.**

**B3. Tre–fyra siffror i samma kolumn efter andra lånet.**
Belägg: 523 − 187 (D7, `D7-final.png`): tiotalskolumnen visar 2 (struken), liten 0 (från A3), "1" ovanför (digit-new, 1459–1466) och struken "10" (markören) staplade i `bt-wrap` — och texten *"Vi vänder om: 8 − 1 = 7"* pekar på den lilla 1:an ovanför, inte på 2:an barnet ser stor. Efter körningen: `bt-wrap-tiotal` = `<span class="digit-new">1</span><div class="borrow-ten used">10</div>`.
Fix: följer av A3 (ingen 0:a) och C1 (egen rad för omskrivningen). **Storlek: S.**

**B4. `sub_cant`/`sub_cant_double` säger två saker, visar en.**
Belägg: 1648–1655, verbatim *"⚠️ 5 − 7 går inte! / Vi lånar ett tiotal från nästa kolumn 🔄"* resp. *"… / Tiotalet är 0 — vi måste låna från hundratalet! 🔄"*. Rörelsen (1383–1395) är 1 100 ms puls på den EGNA kolumnens två celler (`problem-cell`, CSS rad 190); grannkolumnen som ska låna ut pekas aldrig ut.
Fix: en mening ("5 − 7 går inte — vi lånar") och pulsa källkolumnen i stället för problemcellerna. **Storlek: S.**

**B5. Allt räknande sker i bubbeltexten; subtraktionen har ingen arbetsyta.**
Belägg: "7 − 5 = 2" och "10 − 2 = 8" finns bara som text (1658, 1660, 1667). Additionens `.nf-work`/`rightMarginSpot` (1949–1970, 2091) används inte av något sub-steg. Tokenen flyger mellan cellerna inne i tabellen (mätt left 182,6 → 232,6 px inom `#up-table-wrap`, dvs. från H-cellen till T-cellen); ingenting sker till höger om talet (regel 6).
Fix: räkna "vänd om" i `.nf-work` på högersidan med samma bricka som additionen, och låt bubblan bara namnge idén. **Storlek: M.**

### C — layout, träffyta, scroll

**C1. Lånet landar i sidhuvudet, ovanpå kolumnbokstaven.**
Belägg: `.bt-wrap { position:absolute; bottom:100%; left:50% }` (CSS 214–216) sitter i `cell-row-a` (2297). Mätt: `bt-wrap-ental` med markören = [244, 87, 24×23] medan cellen börjar vid y=108 och `thead` upptar y≈67–104 — markören täcker "E" (`D1-step3-t1200.png`, `H1-numpad.png`). Med `digit-new` + `borrow-ten` staplade (D7) blir `bt-wrap-tiotal` [194, 69, 24×41] och täcker hela "T". Det finns ingen rad för lånet, till skillnad från additionens minnesrad (`carryRowHTML`, 2284–2291, som bara byggs för addition).
Fix: bygg lånraden som en egen tabellrad (samma mönster som `carryRowHTML`) så pappret har plats där barnet faktiskt skriver. **Storlek: S.**

**C2. Nästa-knappen hoppar mellan stegen.**
Belägg: mätt i D7: `#up-bubble` 42 px → 64 px när tvåradstexten i A1 visas; `#up-next-btn` flyttar från y=336 till y=358 och kladden krymper 360 → 338 px. Knappen barnet ska trycka på rör sig mitt i sekvensen.
Fix: följer av A1 (en rad per steg); annars `min-height` på bubblan för två rader. **Storlek: S.**

**C3. Textstorlekar på pappret vid 390 pt.** Mätt: `.small-new-digit` 9,28 px (CSS 210–211), `.borrow-ten` 11,2 px (217), `.digit-new` 12 px (208). Klasserna delas med additionen och `.small-new-digit` är additionens facit; noteras som mätvärde, inte som subtraktionsfynd. Träffytor är inte berörda (inget är klickbart här).

### D — polish

**D1. Emoji som ikoner.** ⚠️ 🔄 💡 ✅ i bubblorna (1649–1671), 🎉 i "Klart!" (1673), 👆 på lånaknappen (2492), ⏳ i "Lånar..." (2683), 💪 i "Hmm, prova igen!" (2672). Regel 11.
Fix: ta bort dem eller byt till `<svg class="icn"><use href="#i-…">`. **Storlek: S.**

**D2. Omskrivningen ovanför kolumnen har kolumnfärg, inte röd penna.** `digit-new` får `PVC[srcKey]` (1441, 1463, 1476) medan `small-new-digit` (1406, 1415) och `borrow-ten` (CSS 217) är `#dc2626`. Regel 12: lån = röd penna.
Fix: `sp.style.color = '#dc2626'` på de tre ställena. **Storlek: S.**

**D3. `sub_highlight` är ett tomt tryck.** Steget tar 50 ms (1379–1381) och säger *"Kolumn E (ental): 5 − 7 — hmm..."* (1646); nästa tryck säger *"⚠️ 5 − 7 går inte!"*. Två tryck för samma idé. Additionen har motsvarande `add_highlight`, så mönstret är delat; men subtraktionens text är den enda som upprepas i nästa steg.
Fix: låt `sub_cant` bära highlight-texten och ta bort det separata steget för lånefallet. **Storlek: S.**

**D4. Skrivet objekt byts ut.** `existing.replaceWith(wrapper)` (1425–1434) ersätter `digit-new` "10" med en ny div "1̶0̶ 9" när tiotalet lånar vidare (D3 steg 3, 503 ms). Visuellt rätt — det ser ut som på papper — men objektet försvinner ur DOM:en, vilket P1 förbjuder. `dw.classList.add('crossed')` sätts dessutom om på redan strukna celler (1421, 1400) utan effekt.
Fix: lägg 9:an bredvid i samma wrapper i stället för att ersätta. **Storlek: S.**

**D5. Bubbelspråket.** "Kolumn E (ental):" / "Kolumn H (hundratal):" (1642–1646) och versal-rubriken "FYLL I ENTALET" (2507–2510) är klassrumsspråk; additionens facit säger vad som händer, inte var. **Storlek: S.**

---

## 3. Bubbeltexterna verbatim (led räknade)

| Steg | Text (405 − 187, 523 − 187) | Led |
|---|---|---|
| sub_highlight | "Kolumn E (ental): 5 − 7 — hmm..." / "Kolumn T (tiotal): 9 − 8 — det går! ✅" | 2 |
| sub_cant | "⚠️ 3 − 7 går inte! / Vi lånar ett tiotal från nästa kolumn 🔄" | 2 |
| sub_cant_double | "⚠️ 5 − 7 går inte! / Tiotalet är 0 — vi måste låna från hundratalet! 🔄" | 3 |
| sub_borrow | "4 → 3 (ger ett tiotal till T) / T: 0 → 10 ✅" | 2 |
| sub_flip_borrow | "Vi vänder om: 7 − 5 = 2, lånar 1 från 10 → 9 / Svaret blir 10 − 2 = 8 💡" | 3 (+ svaret) |
| sub_ten_minus | "10 − 2 = 8 ✅" | 1 |
| sub_calc | "9 − 8 = 1" | 1 |
| done | "Klart! 🎉 405 − 187 = 218" | 1 |
| övning, låna | "⚠️ 5 − 7 går inte! Tiotalet är 0 — du behöver låna från hundratalet." | 3 |
| övning, efter låna | "Vi vänder om: 7 − 5 = 2. Nu måste vi räkna ut 10 − 2 för att få svaret! 💡" | 2 |
| övning, numpad | "Du lånade en 10:a! Vad är 10 − 2?" | 2 |

## 4. Tidslinjer (ms efter tryck, 405 − 187)

- **sub_cant_double:** 0 problem-puls på E-cellerna · 1 106 släpp.
- **sub_borrow (H→T):** 2 H stryks + "3" ovanför · 403 `+10` skapas i H · 1 204 tonar · 1 555 tas bort OCH T stryks + "10" ovanför · 2 106 släpp.
- **sub_flip_borrow (E):** 0 E-a stryks + liten "0", E-b stryks + liten "2" · 505 T stryks igen, "10" ersätts med "1̶0̶ 9" · 1 006 markör "10" i E OCH `+10` skapas i T · 1 807 tonar · 2 160 tas bort · 2 479 släpp.
- **sub_ten_minus:** 0 markören stryks · 402 "8" faller ner i svarscellen · 1 154 släpp.
- **sub_calc:** 301 svarssiffran · 1 045 släpp.

## 5. Vad som är bra och inte ska röras

- **Texten kommer före rörelsen i demon.** `demoNextStep` (978–992) kallar `showStepBubble()` före `executeStep` — regel 2 hålls i varje steg (mätt: bubblan finns vid t≤2 ms i alla fall).
- **Pappret står still.** `#up-table-wrap` var [6, 58, 378×220] i alla uppmätta tillstånd, demo och övning. Inga skalningar av skrivna siffror.
- **Strykningarna landar där barnet skriver dem.** Struket tal, liten ny siffra, struken tia: "1̶0̶ 9" ovanför den strukna 0:an vid dubbellån (`D3-100-55-final.png`) är exakt vad ett barn skriver på papper. Behåll gestalten, byt bara var raden får plats (C1).
- **Markören stryks, raderas inte.** `useBorrowTen` (1756–1760) sätter `.used` (line-through, CSS 220) — samma livscykel som minnessiffran.
- **Slutsatsen sist i `sub_ten_minus`/`sub_calc`:** markören stryks vid 0, svaret faller vid ~400, steget släpps vid ~1 100.
- **Fria läget är redan ombyggt.** `showExColUI` (2452–2471) är lägesoberoende: `.free-keys` finns, tangenter mätta 84×47 px, "0" 174×47, Klar 96×204; inmatning i celler höger→vänster verifierad (efter "2": `ans-ental=2`, `ans-tiotal` aktiv); fel svar skakar och behåller siffrorna. Inget miniräknarfält.
- **Träffytor:** numpad 48×48 px (`clamp(48px,12vw,64px)`, 12 vw = 46,8 → 48; CSS 254–262), lånaknappen 378×58, Fortsätt 378×52, fria tangenter 47 px höga. Allt ≥ 44.
- **Ingen scroll i något läge:** `document.scrollHeight` = 844 och `#up-left` scrollHeight = clientHeight (348/370/384/456/449) i demo, hjälp med numpad, och fria läget på nivå 2 och 4. Kladden 252–360 px i alla tillstånd (≥ 150).
- **Övningen återanvänder demons ord för kö-stegen** (`exBubbleMsg` → `bubbleHTML(queue[phase])`, 2537–2540) och kräver rätt siffra per kolumn med mjuk "Hmm, prova igen!" (2672).
- **Talgeneratorn** garanterar lån på nivå 4 och dubbellån i hälften av fallen (679–690); nivå 3 ger "låna från 0 med hundratal 1 → 0" (100–109 − b).

## 6. Mätprotokoll

| Fall | Nivå | Tal | Väg | Skärmbilder |
|---|---|---|---|---|
| D1 | 4 | 405 − 187 | dubbellån (tiotal 0), sedan två raka kolumner | `D1-step*-t*.png`, `D1-step*-end.png`, `D1-final.png` |
| D2 | 2 | 40 − 18 | lån med övre 0 | `D2-40-18-step2-end.png`, `-step3-end.png`, `-final.png` |
| D3 | 3 | 100 − 55 | dubbellån från hundratal 1 → 0, ledande nolla | `D3-100-55-step2..4-end.png`, `-final.png` |
| D4 | 2 | 45 − 25 | diff 0 i entalet (går rakt) | `D4-45-25-final.png` |
| D5 | 1 | 8 − 3 | ensiffrigt, tom T-kolumn | `D5-8-3-final.png` |
| D6 | 1 | 15 − 7 | lån där tiotalet blir 0 | `D6-15-7-final.png` |
| D7 | 4 | 523 − 187 | två separata lån, andra lånet ur redan struken kolumn | `D7-start.png`, `D7-step2-t1130.png`, `D7-step2-end.png`, `D7-step5/6-end.png`, `D7-final.png` |
| H1 | 4 | 405 − 187 | hjälpläge: låna → Fortsätt → numpad → fel → rätt → klart | `H1-start.png`, `H1-after-borrow.png`, `H1-numpad.png`, `H1-col1.png`, `H1-done.png` |
| H2 | 2 | 40 − 18 | hjälpläge, enkelt lån | `H2-numpad.png` |
| F1 | 2 | 40 − 18 | fria läget: två siffror, fel, sudda, rätt | `F1-start.png`, `F1-wrong.png`, `F1-right.png` |
| F4 | 4 | slump | fria läget, tre kolumner, layout | `F4-start.png` |

Anm. 305 − 187 kan inte genereras: nivå 4:s dubbellånsgren (680–686) ger ental 1–4 i övre talet och tiotal 1–5 i undre; 405 − 187 (via andra grenen) är samma struktur och kördes i stället. Diff = 0 uppstår aldrig i `sub_flip_borrow` (kräver `a < b`), bara i `sub_calc` (D4).

Under mätningen visade sig Playwright-servern vara delad med en annan session (`__svep_i` i localStorage, skärm `screen-multdiv` aktiv i standardfliken); alla körningar gjordes därför i egna, engångs-kontexter som stängdes efter varje fall.
