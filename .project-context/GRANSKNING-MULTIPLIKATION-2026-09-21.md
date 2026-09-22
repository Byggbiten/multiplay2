# GRANSKNING · UPPSTÄLLD MULTIPLIKATION — 2026-09-21

**Granskad kod:** `js/multdiv.js` (2 411 rader, gren `dev`, HEAD 0af6b26), multiplikationsgrenen
(`gameKind === 'mult'`, `plan.kind === 'simple' | 'twostep'`). Divisionen ingår inte.
**Måttstock:** reglerna i `.project-context/UPPSTALLNING-ADDITION-SPEC.md` kap 1 och
"Globala villkor" i `docs/superpowers/plans/2026-09-21-uppstallning-addition.md`;
minnessiffrans livscykel i `.project-context/MINNESSIFFER-KONCEPT.md`; modulspecen
`MULTDIV-SPEC.md` (origin/renovering).
**Mätning:** 390×844, ljust läge, `http://localhost:5312/`. Tal tvingade via stubbad
`Math.random`: nivå 1 = 32·3, nivå 2 = 28·8 (8·8 = 64 ⇒ minne 6), nivå 3 = 789·9
(minnen 8 och 8), nivå 4 = 98·78 (p1 = 784, p2 = 686, minnen 6, 5, 1, 1).
Tidsmätning med MutationObserver på `#md-table-wrap` från klick på "Nästa steg" tills
knappen låses upp. Skärmbilder i `/tmp/gransk-multiplikation/` (27 filer).
Ingen kod är ändrad.

---

## 1. Vad modulen gör

Multiplikationen delar stegmotor, tabell, hjälpkö och fritt läge med kort division i
samma IIFE. En ren mattekärna (`singlePass` 396, `addPass` 416, `buildPlan` 435) räknar
fram en plan som är facit för alla tre lägen. Demon bygger en steglista
(`passStepsInto` 611, `addStepsInto` 638, `buildDemoSteps` 684) av stegtyperna
`highlight → calc → over9 → write_carry → mem_strike → mem_place` per kolumn, med
`write_simple`/`write_full` för kolumner utan spill respektive sista kolumnen; nivå 4
lägger `phase`-steg mellan delprodukt 1, delprodukt 2 (förskjuten ett steg vänster utan
nolla, `+` framför, 1241–1249) och slutadditionen. Bubblan sätts före animationen
(`demoNextStep` 815–822). Minnessiffrorna bor i en minnesspalt till höger om
faktorraden (`.md-memcol`, 195; `renderMemCol` 1105) och appendas hela uppgiften,
strukna som ostrukna. Hjälpläget (`buildHelpQueue` 1481) ställer tabellfrågan och
minnespåminnelsen som två frågor, låter barnet TAPPA minnets plats (`memTapSlot` 1700)
och stryka det använda (`memTap` 1721), med livlinor (1895). Fria läget är ett
miniräknarfält (1253, `exFreePress` 2138) med frivillig minnesväljare 1–9 (1750) och
glömd-minnessiffra-detektion (`noCarryAnswer` 452).

---

## 2. Uppmätt sekvens (demo, 390×844)

Tider = från klick tills "Nästa steg" låses upp igen (`executeStep` 862–931).

| Stegtyp | Bubbla | Rörelse | Tid |
|---|---|---|---|
| `highlight` | **tom** (730) | glow/dim på faktorceller | 50 ms (865) |
| `calc` | "8 · 8 = 64" | **ingen** | 50 ms (868) |
| `over9` | "64... det är mer än 9! 🤔" | faktorcellerna pulsar rött (`md-prob`, 176) | 1 100 ms (885) |
| `write_carry` | "Vi skriver 4:an — 6:an blir minnessiffra! ➡️" | 4:an droppar i cellen (1081) | 800 ms (899) |
| `mem_place` | "6:an skrivs som minnessiffra här 👇" | amber-token skapas i svarscellen, glider 700 ms till spalten, tonas ut 300 ms, röd `.mem-digit` poppar in | ≈1 500 ms (901–916, 1126–1156) |
| `mem_strike` | "Nu stryker vi 8:an — den är använd! Så vet vi att den inte räknas igen. ✏️" | penndrag 250 ms | 900 ms (923) |
| `write_simple` | "2 · 8 = 16, plus 6 i minne = 22" | en siffra droppar | 300 + 700 ms (892) |
| `write_full` | "78 — sista kolumnen, så hela 78 får plats! ✅" | två siffror, 300 ms isär | 300 + 800 ms (925–931) |
| `phase` | "7:an är tiotal — därför …" | B-siffran pulsar | 1 200 / 600 ms (878) |

Klickbudget: nivå 1 (32·3) 4 klick varav 2 tomma; nivå 2 (28·8) 8 steg; nivå 3 (789·9)
15 steg; nivå 4 (98·78) **36 steg**, varav 8 `highlight` (tom bubbla, inget rör sig
utom glow) och 6 `calc` (text, inget rör sig) — 14 av 36 klick utan rörelse.

Uppmätt stegföljd nivå 4, additionsfasen kolumn 2 (7 + 8 + minne 1 = 16):
`29 calc "7 + 8, plus 1 i minne = 16" → 30 over9 → 31 write_carry "Vi skriver 6:an — 1:an
blir minnessiffra!" → 32 mem_strike "Nu stryker vi 1:an" (den gamla) → 33 mem_place
"1:an skrivs som minnessiffra" (den nya)`.

---

## 3. Fynd, rangordnade

### A — pedagogisk lögn / teleport

**A1. Produkten finns aldrig på pappret; minnessiffran föds ur fel cell.**
`calc` (868) visar "8 · 8 = 64" som text i 50 ms utan något objekt; `over9` (880–885)
pulsar *faktorcellerna* `md-a-0`/`md-b-0` röda medan texten talar om 64; sedan skrivs
4:an, och i `mem_place` skapas 6:ans token med `src = md-ans-0` (905) — alltså ur cellen
där 4:an just skrevs (skärmbild `31-demo-n4-memplace-flyg.png`: den amber 6:an ligger
ovanpå 4:ans cell). Barnet ser aldrig 64 delas i 4 och 6; 6:an uppstår ur en cell som
innehåller 4. Bryter regel 5/6 (allt lösräknande på högersidan) och P5.
*Fix:* rita produkten som bricka "64" i högermarginalen i `calc` (samma
`rightMarginSpot`-idé som `uppstallning.js:2091`), och låt `write_carry`/`mem_place`
flytta brickans 4 till cellen och 6 till spalten. Storlek: M.

**A2. `mem_place` skapar och förstör ett objekt i samma steg (morf via fade).**
Token-div skapas 1132–1145 (amber `#fde68a`/`#d97706`, 1138), glider 700 ms, sätts
`opacity:0` vid 750 ms (1152) och `remove()` vid 1 100 ms (1154); först då får den redan
renderade röda `.mem-digit` `opacity:''` + `landing` (911–913, `md-memland` skalar 0.3→1.25).
Uppmätt: add div 4 ms → rm div 1 105 ms → landing 1 106 ms. Objektet byter dessutom
färg (amber → röd) och form (rund bricka → lutad siffra). Bryter regel 4 och 12.
*Fix:* låt själva brickan vara röd minnessiffra från start och bli kvar som `.mem-digit`
(flytta noden, ingen `remove`), som `flyChipToAnswer` i additionen. Storlek: S–M.

### B — sekvensbrott / text

**B1. Två idéer i ett steg: `write_carry`-texten annonserar minnet som händer i nästa steg.**
740: "Vi skriver 4:an — 6:an blir minnessiffra! ➡️" — i steget droppar bara 4:an;
6:an rör sig först i `mem_place`. Samma i hjälpläget 2014. Bryter regel 1 och 3
(texten om 6:an kommer ett steg *före* dess rörelse men bär också en annan idé).
*Fix:* "Vi skriver 4:an." i `write_carry`; låt 745 bära hela minnesidén. Storlek: S.

**B2. Aritmetik i texten som barnet ska räkna i huvudet.**
720–723: "2 · 8 = 16, plus 6 i minne = 22" (två uträkningar, inget objekt).
707/716 (additionsfasen): "7 + 8, plus 1 i minne = 16" — mellansumman 15 sägs aldrig.
Hjälpläget: efter "Rätt! 16 ✅" (1996–2001, inget skrivs) försvinner 16:et och nästa
fråga (1813–1814) kräver det ur minnet: "Har vi någon minnessiffra som ska med? 👀
Just det — 6:an! Vad blir 16 + 6?" — tre meningar, retorisk fråga som svarar sig själv.
Bryter regel 1, 6 och 13.
*Fix:* i demon: bricka "16" i marginalen (A1) → eget steg "plus 6:an i minne" → "22";
i hjälpläget: låt tabellsvaret stå kvar som bricka på högersidan tills minnesfrågan är
besvarad, och korta frågan till "Nu 6:an i minne — vad blir det?". Storlek: M.

**B3. Tomma och stilla steg kostar klick.**
`highlight` (730 → `''`, 863–865) ger ett klick med tom bubbla och 50 ms; `calc`
(867–868) ger ett klick med text men ingen rörelse. Nivå 4: 14 av 36 klick; nivå 1:
2 av 4. Bryter regel 9 (rätt ordning slår färre steg — men ett steg utan idé är inget steg).
*Fix:* slå ihop `highlight` in i `calc` (glow + bubbla i samma steg) i `passStepsInto`
614/`addStepsInto` 641 och ge `calc` brickan från A1 som rörelse. Storlek: S.

**B4. Nivå 4-additionen lovar additionens pedagogik men kör multiplikationsmotorn.**
736: "Till sist adderar vi delprodukterna — som vanlig uppställd addition! ➕" — sedan
följer samma `calc/over9/write_carry` (638–653), inga tiokompis-steg, inga brickor,
och additionens minnessiffra hamnar i minnesspalten bredvid `·78`-raden (memcol
y = 140 px i tabellytan 58–312), ovanför både delprodukterna och svarsraden, i stället
för ovanför kolumnen som i additionen. Barnet får två olika "additioner" i appen.
*Fix:* antingen bygg fas 3 på `planAdditionColumns` + brickorna (stor), eller minst
placera additionsfasens minne i en minnescell ovanför kolumnen och byt texten till
"Nu adderar vi raderna" utan löftet. Storlek: L (eller S för textfixen).

**B5. Barnet matar aldrig in minnets värde — appen delar talet.**
Hjälpläget: efter tabellsvaret 64 skriver appen 4:an och säger "Var ska minnessiffran
6? Tryck där den ska stå! 👉" (1580); `memTapSlot` 1700–1713 tar värdet ur
`memAwait.val`. Barnet väljer bara plats. Fria läget: valfri sifferväljare 1–9
(1750–1760) som aldrig påverkar rättningen. Det moment som är hela poängen med
uppställd multiplikation — "vilken siffra skrivs, vilken går upp" — utförs aldrig av
barnet, och minnen > 1 (6, 8, 5) matas aldrig in någonstans.
*Fix:* i hjälpläget: efter "64" två cellfrågor "Vilken siffra skriver vi här?" (4) och
"Vilken blir minnessiffra?" (6) innan PLACERA-fasen. Storlek: M.

**B6. Stryk och placera med samma siffra i följd.**
Uppmätt nivå 4 steg 31–33: "…1:an blir minnessiffra!" → "Nu stryker vi 1:an" (den
gamla) → "1:an skrivs som minnessiffra" (den nya). Ordningen i `passStepsInto` 632–634
lägger strykningen *efter* skrivsteget, så den nya 1:an annonseras innan den gamla är
struken. Samma i hjälpkön 1489–1491.
*Fix:* flytta `mem_strike` till direkt efter användningen (före `over9`/`write_*`),
så "använd → stryk → räkna vidare" blir ordningen. Storlek: S.

**B7. Additionens sista kolumn i hjälpläget öppnar med en retorisk fråga utan föregående svar.**
Kolumn med `x === null` eller `y === null` och minne hoppar tabellfrågan (1525) men
får ändå 1813-texten: "Har vi någon minnessiffra som ska med? 👀 Just det — 1:an! Vad
blir 6 + 1?" (uppmätt 98·78, sista kolumnen). "Just det" svarar på en fråga som aldrig
ställdes. *Fix:* egen text för ensam-siffra-plus-minne: "Här står 6:an och 1:an i minne — vad blir det?". Storlek: XS.

### C — layout / träffyta / scroll

**C1. Knappsatsen är 38×38 px i hjälp- och fritt läge.**
264–265: `clamp(38px,6.6vw,58px)`; 6,6 vw vid 390 = 25,7 px ⇒ 38 px (uppmätt 38×38).
Minnesväljaren 34×34 (1756–1758, uppmätt). Under 44-golvet (regel 7). Additionen
löste samma sak i `uppstallning.js:259–260` med `clamp(48px,12vw,64px)` och
`.free-keys`. ⌫ 52×44, livlina 141×44, Klar 147×44 (hjälp) och 64×48/280×48 (fritt) är ok.
*Fix:* samma clamp som additionen; väljaren minst 44. Storlek: S.

**C2. Minnessiffrans träffyta är under 44 px på bredden.**
`.mem-digit` 197–200 med `::after{inset:-14px}` 212–213. Uppmätt: nivå 4
(`.md-l4`, 216: 11,5 px font) 9,0×13,8 px ⇒ 37×42 px; nivå 2 10,6×16,3 ⇒ 39×44;
slot nivå 4 13,5×16,2 ⇒ 41×44; slot nivå 2 16×19 ⇒ 44×47. Strykfasen är den mest
träffkänsliga (fel tap ⇒ vägledning + tappad Minnesmästare, 1590).
*Fix:* `inset:-18px` eller `min-width:44px` på pseudoelementet; alternativt gör
siffran större i spalten. Storlek: XS.

**C3. Fria läget skriver i ett brett miniräknarfält vänster→höger.**
1253 (`#md-free-field` i tabellen, `.md-field` 271) och `exFreePress` 2138 ("vänster→
höger som man skriver"). Uppmätt nivå 4: fältet 225×38 px; hjälpfältet 352×34 px.
Regel 10 kräver celler höger→vänster. *Fix:* rendera svarsraden som `.md-ansc`-celler
och skriv från entalet, som additionens fria läge (`uppstallning.js:2458`). Storlek: M.

**C4. "Nästa steg" hoppar 50 px mellan stegen.**
`#md-bubble` (804) saknar `min-height`; på `highlight`-stegen är bubblan 0 px hög
(uppmätt: bubbla 42 → 0 px, knappens top 297 → 255). Knappen flyttar sig under fingret
vartannat klick. *Fix:* `min-height` på `#md-bubble` — eller bort med tomma steg (B3).
Storlek: XS.

**C5. Uppmätt yta vid 390×844 (ingen scroll i något läge — bra):**
demo nivå 4: `#md-left` 382 px (tabell 254 + bubbla 42 + knapp 52), kladd-canvas 325 px;
hjälp nivå 2: left 466, canvas 242; hjälp nivå 4 med knappsats: left 539, **canvas 168 px**
(nära golvet 150); fritt nivå 4 med väljaren öppen: left 502, canvas 299. Celler 38×38
(nivå 1–3, 169) och 33×33 (nivå 4, 187–189). Hjälp nivå 4 är den enda vyn som
riskerar kladden om bubblan blir tvåradig.

### D — polish

**D1.** 745: "skrivs som minnessiffra här 👇" — spalten ligger uppe till höger, brickan
flyger uppåt. *Fix:* "här 👉" eller ingen pil. XS.
**D2.** `over9` pulsar cellerna med `#ef4444` (176) = hundratalsfärgen; problemet är
produkten, inte faktorerna. Försvinner med A1. XS.
**D3.** 747: strykningstexten är två meningar. *Fix:* "Nu stryker vi 6:an — den är
använd." XS.
**D4.** `write_full` skriver två siffror 300 ms isär (925–931) — två rörelser, en idé.
Tolerabelt, men entals- och tiotalssiffran kunde droppa ihop. XS.
**D5.** `renderMemCol` (1105–1124) river och återskapar hela spalten vid varje ändring
(loggen visar rm/add av alla strukna siffror i steg 15, 19, 27, 32, 33). Visuellt stilla,
men pappret byggs om. *Fix:* append/uppdatera bara den berörda noden. XS.
**D6.** Fel-tap-texten "Nästan — den ska stå här 👉" (1590–1600) står kvar i
`#md-feedback` när "Precis där! 🎯" visas (1710 rensar inte). XS.
**D7.** Nivå 2 ("Med minnessiffra") stryker aldrig något: tvåsiffrig faktor ⇒ minnet
används alltid i sista kolumnen ⇒ sista-minnes-undantaget (632, 1490) slår varje gång.
Strykvanan tränas först på nivå 3. Spec-enligt — men värt ett Dennis-beslut om nivå 2
ska heta något annat eller demon ändå visa strykningen. Beslut, inte kod.
**D8.** Fria läget nivå 4 saknar delproduktrader (1215: `l4 = twostep && !freeMode`):
barnet ser bara 98 · 78 och ett 4-siffrigt fält. Spec-enligt ("barnet skriver
slutsvaret"), kladden är 299 px. Beslut Dennis om raderna ska finnas som tomma celler.

---

## 4. Det som är bra och inte ska röras

- **Minnessiffrans livscykel är rätt byggd:** placeras i eget steg (901), vilar, stryks i
  eget steg med penndrag (918–923, 747), suddas aldrig, röd `#dc2626` roterad −4°
  (197–200), `.used` opacity 0,5 (201) — helt enligt MINNESSIFFER-KONCEPT. Strukna
  siffror står kvar genom alla tre faserna på nivå 4 (uppmätt spalt "6̶ 5̶ 1̶ 1" vid
  slutet). Sista-minnes-undantaget är konsekvent i demo (632, 651) och hjälpkö (1490).
- **Delprodukterna följer boken:** rad 2 förskjuten utan nolla, `+` framför, ghost-cell
  på position 0 (1241–1249), sista kolumnens tvåsiffriga värde växer åt vänster
  (`write_full` 925–931). Fas-texten "7:an är tiotal — därför börjar vi skriva ett steg
  åt vänster! 👈" (735) är en idé, en mening.
- **Texten sätts före rörelsen** överallt: `showStepBubble()` före `executeStep`
  (820–821); inget steg byter text mitt i.
- **Ren mattekärna** (`singlePass`, `addPass`, `buildPlan`, `noCarryAnswer`,
  `genProblem`) exponerad för vitest (2404–2405); nivåvillkoren verifieras på den
  framräknade kedjan (477–506). Glömd-minnessiffra-detektionen ger riktad feedback
  (2187–2195).
- **Tvåstegsfrågan** (1496–1503) och **livlinorna** som visar men inte fyller i
  (1895–1915) är rätt tänkta — de behöver bara texten från B2.
- **Platsvärdesfärgerna** är låsta rätt (`COLV` 101) i celler, etiketter och bubbeltext.
- **Ingen vy scrollar** vid 390×844 i något läge, kladden håller ≥150 px överallt (C5).
- **Emoji bara i text**, ikonerna i knapparna är SVG (`#i-play`, `#i-refresh`).

---

## 5. Skärmbilder

`/tmp/gransk-multiplikation/`: `00-lagesvy`, `05–06` nivå 1 demo, `10-demo-n2-step00…07`
(hela nivå 2-sekvensen), `20-demo-n3-*`, `30–32-demo-n4-*` (inkl. `31-…-memplace-flyg`
mitt i flygningen), `40–42-hjalp-n2-*`, `45–46-hjalp-n4-*`, `50–52-fritt-n4-*`.
