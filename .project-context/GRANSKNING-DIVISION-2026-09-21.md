# GRANSKNING · KORT DIVISION — 2026-09-21

**Modul:** divisionsgrenen av `js/multdiv.js` (2 411 rader, gren `dev`, senaste divisionscommit `f04af1c` v36).
**Måttstock:** `.project-context/UPPSTALLNING-ADDITION-SPEC.md` kap. 1 (P1–P6) + planens "Globala villkor" + de 13 reglerna i uppdraget.
**Mätning:** egen headless Chromium (Playwright 1.59.1) vid 390×844, `Math.random` stubbad så att uppgifterna blev 84÷4 (n1), 96÷4 (n2), 738÷3 (n3), 336÷6 (n4, ledande hopp), 612÷6 (n4, nolla i kvoten). Alla tre lägen körda. Skärmbilder i `/tmp/gransk-division/` (`<tag>-demo-NN.png`, `<tag>-help-NN.png`, `n3-free-NN.png`, `verify-*.png`).
Ingen kod ändrad. Varje fil:rad och mätvärde nedan är läst ur filen eller mätt i webbläsaren.

---

## 1. Vad modulen gör

Divisionen delar fil, stegmotor, hjälpkö, livlinor, numpad och kladd med multiplikationen; skiljelinjen är `plan.kind === 'division'` (steg: 685, 1210) och `gameKind === 'div'` (594, 1442). Matte-kärnan `divPass()` (508–535) räknar siffra för siffra vänster→höger och ger en stegsekvens med `cur`, `q`, `rem`, `skip`/`fromSkip`, `last`. Generatorn `genDivProblem()` (556–578) slumpar kvot+divisor baklänges och verifierar nivåvillkoren på den framräknade sekvensen (`divLevelOk`, 541–553) — alla uppgifter går jämnt upp.

Pappret ritas av `buildDivTableHTML()` (1173–1207) i bråkstrecksnotation: platsvärdesetikett + täljarsiffra i `.md-cell` (id `md-n-g`), horisontellt streck, divisorn centrerad under (`md-d-0`), och till höger `= ` följt av en `.md-ansc`-ruta per kvotsiffra (`md-q-g`) — eller, i fria läget, ETT brett `.md-field` (`md-free-field`, rad 1191–1193).

Demon (`buildDivDemoSteps`, 665–682) ger per siffra: `dhl` (bara ljus/dimning, tom bubbla) → `dask` (frågan) → `dwrite` (kvotsiffran skrivs) → ev. `drem` (resten ritas som liten röd `.mem-digit` uppe till vänster om NÄSTA siffra, `divWriteRem` 1052–1063) → `dstrike` (penndrag över den färdiga täljarsiffran, `divStrikeDigit` 1068–1077). Hjälpläget (`buildDivHelpQueue`, 1464–1480) har samma kedja som frågor: `divq` → `divrem` → `divplace` (barnet tappar slot) → `divstrike` (barnet tappar siffran; sista siffran undantagen). Fria läget: kvoten i det breda fältet, `exFreePress` (2138–2152) appendar vänster→höger, `exFreeSubmit` (2163–2200) jämför mot `plan.answer` och kör glömd-rest-detektorn `divNoRemAnswer` (587–591).

---

## 2. Fynd, rangordnade

### A — pedagogisk lögn / teleport / modellbrott

**A1. Resten skrivs osynlig: den landar i en cell som står på 28 % opacitet.**
Belägg: `divHighlight()` (1031–1047) dimmar alla täljarceller utom den aktuella: `else el.classList.add('dim')` (1046), `.md-cell.dim { opacity:0.28 }` (174). `drem`-steget skriver resten i NÄSTA cell — `divWriteRem(step.g - 1, step.rem)` (958) — som just då är dimmad. Mätt (738÷3, demo, steg 4): `md-n-1` computed opacity `0.28` med resten `1` som barn i cellen ⇒ resten ritas med effektiv opacitet 0,28 i exakt det steg bubblan säger "1:an ställer sig framför 3:an". Samma i steg 9 (`md-n-0`: 0.28). Skärmbild `verify-n3-step4-zoom.png`: 1:an är en blekrosa fläck ovanpå 7:ans röda glow. Resten blir fullt synlig först vid nästa `dhl`-tryck (steg 6: `cellOp 1`).
Konsekvens: texten före rörelsen är rätt (regel 2), men rörelsen syns inte — barnet får läsa om något som inte händer. Bryter regel 3/5 (pappret ska visa vad texten säger).
Fix: låt `drem` (och hjälpets `divplace`) lyfta dimningen på målcellen innan resten ritas, eller undanta `.md-divrem`/`.md-divslot` från förälderns opacitet genom att lägga dem utanför `.md-cell`. Storlek: liten (10–20 rader).

**A2. Samma fel i hjälpläget: PLACERA-slotten ligger i den dimmade cellen — träffytan syns knappt.**
Belägg: `renderDivSlot()` (1620–1629) appendar `.md-divslot` i `md-n-${divAwait.g}`; `showDivPlace()` (1611–1618) tar inte bort `dim`. Mätt (96÷4, hjälp, fasen "Var ska resten 1 stå? Tryck där!"): `cellClass: "md-cell md-ntap dim"`, `cellOp 0.28`, slot-box 16×19 px. Skärmbild `verify-help-slot-zoom.png` och `n2-help-04.png`: en nästan vit streckad ring över den bleka 6:an. Bubblan säger "Tryck där 👉" men pekar på ingenting synligt.
Fix: samma som A1. Storlek: liten (ingår i A1).

**A3. Fria läget är miniräknar-modellen som just revs ur additionen — ett brett fält, vänster→höger, högerjusterat.**
Belägg: kommentaren rad 31–32 ("Fritt läge: kvoten i miniräknar-fältet"); `buildDivTableHTML` byter ut kvotrutorna mot `<div class="md-field num" id="md-free-field">` (1191–1193); `.md-field { justify-content:flex-end … width:100% }` (271–272), `.md-diveq-free { flex:1 1 220px; max-width:340px }` (237); `exFreeInput += key // vänster→höger som man skriver` (2147); `exFreeMaxLen()` = `min(plan.width, 4)` (2096). Mätt (738÷3): fältet 213×38 px, siffrorna högerställda i fältet, blinkande caret efter sista siffran (`n3-free-02-wrong.png`: "212|" i ett rött fält 213 px brett).
Regel 10 säger celler. För kort division är riktningen dock INTE additionens: på papper skrivs kvoten efter `=` **vänster→höger**, en siffra per position, i takt med att man delar (det är hela poängen med "siffra för siffra" i spec-avsnittet "Beräkningsgång"). Demons och hjälpets `.md-ansc`-rutor (`md-q-g`, 1195) fylls redan så. Fria läget borde använda EXAKT de rutorna med fokusring som glider vänster→höger (motsvarigheten till additionens `exFreeCells`/`exFreePlaceRing`, `js/uppstallning.js` 2906–2963 — men spegelvänd riktning), inte ett fält. Ghost-rutan vid ledande hopp (`md-ghost`, 1195) faller då bort av sig själv.
Fix: ersätt fältgrenen i `buildDivTableHTML(true)` med kvotrutorna och bygg `exFree*` för division som cellinmatning vänster→höger (fokus börjar i högsta positionen, ⌫ backar åt vänster). Storlek: medel (≈120 rader; `exFreePress/Erase/Render/Submit` är gemensamma med multiplikationen, så grenen måste delas per `plan.kind`).

**A4. Fria läget har ingenstans att skriva resterna — pappret saknar det som boken kräver.**
Belägg: `buildDivTableHTML(freeMode=true)` (1173–1207) ritar täljarcellerna utan tappbar rest-slot (`tap` är `() => ''` när `freeMode`, 1181–1182); multiplikationens fria läge har däremot en frivillig tappbar minnesspalt (`renderMemCol`, 1120–1122, `memColMode === 'free'`). Detektorn (2185–2189) svarar "Kolla resterna — de följer med till nästa siffra! 👆" och pekar uppåt på ett papper där ingen rest någonsin kan stå.
Konsekvens: barnet tvingas hålla mellanresterna i huvudet eller på kladden — tvärtemot spec-meningen "mellanresten är divisionens levande anteckning". Bryter regel 6 (lösräknande på talets högersida) och P1-tanken att pappret bär anteckningarna.
Fix: samma frivilliga slot som multiplikationen — tapp uppe till vänster om en täljarsiffra öppnar en liten sifferväljare (mönstret `memPick`, finns redan för mult) och skriver en röd `.md-divrem`. Storlek: medel (≈60 rader, återanvänder `divWriteRem` + `memPick`).

### B — sekvensbrott / flera idéer per steg / aritmetik i texten

**B1. `drem`-bubblan har tre led och en subtraktion barnet ska räkna ut.**
Verbatim (764–766): `"9 − 8 = 1 blir över — 1:an ställer sig framför 6:an: nu har vi 16!"` (led 1: subtraktion; led 2: placering; led 3: nytt tal). Vid `q === 0`: `"Hela 1:an blir över — den ställer sig framför 2:an: nu har vi 12!"` (två led). Mätt bubbelhöjd 64 px (två rader) mot 42 px för alla andra steg.
Regel 1 (en idé, ingen aritmetik) och P6. Jämför additionens facit: "3:an lämnar 5:an … 5:an har 2 kvar".
Fix: dela i två steg — `drem_calc` ("1 blir över") och `drem_place` ("1:an ställer sig framför 6:an") — och låt "nu har vi 16" vara nästa `dask`:s premiss ("Hur många hela 4:or ryms i 16?" säger det redan). Storlek: liten (≈15 rader i `buildDivDemoSteps` + `stepBubbleHTML` + `executeStep`).

**B2. `dwrite` säger slutsatsen först och motiveringen sist — bakvänt mot regel 3.**
Verbatim (754–759): `"2 stycken! För 2 · 4 = 8"`; hjälpets kvittens (1980–1984): `"Rätt! 2 stycken — för 2 · 4 = 8 ✅"`. Två led, och multiplikationen i texten är en uträkning (P6). Skrivningen (`writeDigit`, 951–953) sker samtidigt som texten — texten borde då bara vara slutsatsen.
Fix: `"2 stycken!"` räcker som `dwrite`; kontrollen `2 · 4 = 8` hör hemma i frågesteget som ledtråd eller i livlinan (1908–1911), inte som eftersats. Storlek: liten.

**B3. Sista siffran får ingen fråga i demon men får det i hjälpläget — kedjorna är olika.**
Belägg: `buildDivDemoSteps` 670–674: `if (s.remIn > 0 && s.rem === 0) { steps.push({ t:'dwrite' }) } else { dask; dwrite }` ⇒ för "16 ÷ 4" hoppas `dask` över och bubblan blir en färdig likhet `"16 ÷ 4 = 4, precis jämnt! ✅"` (757). Hjälpkön (1464–1480) ställer däremot alltid `divq` ("Hur många hela 4:or ryms i 16?"). Mätt: demo n2 steg 6–7 = `dhl` (tom) → `dwrite` (likhet); hjälp n2 fas 4 = fråga → svar → "Rätt! 16 ÷ 4 = 4, precis jämnt!".
Regel 9 (rätt ordning slår färre steg) och regel 13 (texten ska låta som det enkla fallet). "Precis jämnt" är dessutom en likhet med både division och svar — aritmetik i text.
Fix: ta bort specialfallet i 670–674 så att varje siffra får `dask` → `dwrite`; behåll "precis jämnt ✅" som kort eftersats i `dwrite` när `rem === 0` och `remIn > 0`. Storlek: liten (5 rader).

**B4. `dhl` är ett tomt "Nästa steg"-tryck — bubblan töms och knappen hoppar 42–64 px.**
Belägg: `case 'dhl': return ''` (749), `showStepBubble()` sätter `area.innerHTML = ''` när texten är tom (836), bubblan ligger i flödet över knappen (`<div id="md-bubble">` 804 före `md-next-area` 805). Mätt (738÷3): knappens `top` = 200 (bubbla 0 px) → 242 (42 px) → 264 (`drem`, 64 px) → 242 → **200** vid nästa `dhl` → 242 … Vid varje ny siffra åker knappen upp under fingret och sedan ner igen. `dhl` tar 50 ms (935–937) och visar bara glow/dimning.
Regel 8/9 och P1 (pappret står still — här flyttar sig hela vyn under fingret). Additionens facit håller bubblan i fast höjd.
Fix: ge `#md-bubble` en `min-height` motsvarande två rader (≈64 px vid 390) och slå ihop `dhl` med `dask` (highlight + fråga i samma steg — det är EN idé: "titta på den här siffran, hur många …"). Storlek: liten (CSS 1 rad + 3 rader i stegbyggaren).

**B5. Rest-siffran "ställer sig framför" men ingenting flyttar — texten beskriver en rörelse pappret inte gör.**
Belägg: `divWriteRem` (1052–1063) skapar spannet på plats och kör `landing` (`md-memland`, 365–369: scale 0.3→1.25→1, opacity 0→1). Ingen källa, ingen bana. Multiplikationens `mem_place` flyger däremot en token (`animateTokenTo`, 1126–1160). Teleport i strikt mening är det inte (inget skapas och förstörs i samma steg — regel 4 hålls), men P1/regel 5 säger att det enda som rör sig är kvantiteten, och här säger texten "ställer sig framför" om något som poppar fram.
Bedömning: på papper SKRIVS resten (den är en anteckning, inte en bricka) — så "poppa fram" är rätt modell, texten är fel. Hänger ihop med B1.
Fix: skriv texten som en skrivhandling ("vi skriver 1:an framför 6:an"), inte som en förflyttning. Storlek: liten (textrad 765).

**B6. `dskip`-bubblan har tre led.**
Verbatim (752–753): `"6:or i 3? Det går inte — vi tar med nästa siffra: 33!"` (fråga, dom, handling). Hjälpet upprepar samma text (1857) plus knappen "Vi tar med nästa siffra! →" (1860).
Fix: "6:or i 3? Det går inte." som eget steg, "Vi tar med 3:an — nu har vi 33!" som nästa (glow på båda flyttar då från `dhl` till steg två). Storlek: liten.

**B7. Hjälpets "Rätt"-kvittens efter fel-tap står kvar bredvid berömmet.**
Belägg: `divTapSlot` (1631–1642) tömmer inte `#md-feedback`; städningen sker först i `advanceHelp` (1552) 800 ms senare. Mätt: efter fel-tap + rätt tap visas samtidigt bubblan "Precis där! 🎯 Nu har vi 16!" och rutan "Nästan — resten ska stå här 👉" (`n2-help-05.png`). Motstridiga budskap i samma vy.
Fix: töm feedback-rutan först i `divTapSlot` och `divDigitTap` (1 rad var). Storlek: trivial.

### C — layout / träffyta / scroll

**C1. Träffytor under 44 pt — fyra ställen.**
- Täljarcellen som barnet ska stryka: `.md-cell { width:clamp(38px,7vw,64px) }` (169) ⇒ 7vw = 27,3 px vid 390 ⇒ **38×38** (mätt `box:[38,38]`, `::after content:none` — ingen förstoring, till skillnad från minnesspaltens `#md-memcol .mem-digit::after { inset:-14px }` (212–213)).
- PLACERA-slotten: `.mem-slot { width:1.05em; height:1.3em }` (208) med font `clamp(0.85rem,2.1vw,1.45rem)` ⇒ 13,6 px ⇒ mätt box 16×19; `::after inset:-12px` (251) ⇒ **40×43**.
- Numpad: `.md-nk { width:clamp(38px,6.6vw,58px) }` (265) ⇒ 6.6vw = 25,7 ⇒ **38×38** (mätt, alla tio knappar), i både hjälp- och fria läget.
- Hjälpfältet: `.md-field-sm { min-height:clamp(34px,6vw,50px) }` (283) ⇒ **34 px** hög (mätt 352×34).
Fix: `.md-cell.md-ntap::after { inset:-6px }`, slot-`::after inset:-14px`, numpad `clamp(44px,…)` och `md-field-sm` min 44. Storlek: liten (CSS).

**C2. Rest-siffran är 13,6 px och ligger över grannens ram.**
Belägg: `.mem-digit { font-size:clamp(0.85rem,2.1vw,1.45rem) }` (197–200) ⇒ 13,6 px vid 390; `.md-cell .md-divrem { top:-9px; left:-10px }` (247). Mätt box 11×16 px, x = 94 medan föregående cell slutar vid 93 (738÷3) ⇒ resten hänger på gränsen mellan cellerna, ovanpå den strukna siffrans ram och (i skrivsteget) ovanpå glowen (`md-glow`, 352–355) på cellen intill. Se `verify-n3-step9-zoom.png`.
Fix: minst 16 px, och reservera en fast rest-spalt i `.md-fraccol` (ett tomt `span` med bredd 0.8em före cellen) så resten får eget utrymme i stället för negativ offset. Storlek: liten.

**C3. Ledande hopp lämnar ett 38 px hål efter `=`.**
Belägg: `md-ghost` på `md-q-${skipG}` (1195); `.md-ghost` behåller bredden (173). Mätt (336÷6): `=` slutar vid x≈200, första skrivna kvotsiffran börjar vid 248 (`q1`), ghost `q2` [206,102,38,38] tom. `n4skip-demo-done.png`: "=   [5][6]". I boken står "= 56". Försvinner med A3 om rutorna genereras från `plan.width` i stället för täljarlängden.
Fix: generera kvotrutorna från `digitsOf(plan.answer).length` (ingen ghost). Storlek: trivial.

**C4. Rubriken "Kort division – Övning" radbryter vid 390.**
Mätt: två rader i `n2-help-00.png` (`.header-title`, 1426). Demon ("– Demo") får plats. Ingen scroll uppstår (tabellen börjar ändå vid y=58) men headern ser trasig ut.
Fix: "Kort division" räcker (räknaren 1/5 till höger säger redan att det är övning). Storlek: trivial.

**C5. Ingen scroll, kladden ok — konstaterat.**
Mätt vid 390×844: `documentElement.scrollHeight` 844 = viewport i alla lägen; `#md-left.scrollHeight === clientHeight` (212 demo, 411 hjälp, 354 fritt). Kladd-canvas 493 px (demo), 294 px (hjälp), 351 px (fritt) — alla ≥ 150 px. Regel 8 hålls. (390×664 ej mätt — utanför uppdraget.)

### D — polish

**D1. Rubrikrad över numpaden i fria läget.** `#md-free-label` (2080), 11 px versaler: "SKRIV KVOTEN MED SIFFRORNA" / "TRYCK KLAR ✓ NÄR DU ÄR SÄKER" (2132–2134). Dennis tog bort motsvarande rad i additionen 21/9 ("rutorna, fokusringen och markören säger redan vad som ska göras", `js/uppstallning.js` 2453–2455). Faller med A3.

**D2. Emoji som ikoner.** Livlineknappen `🛟 Livlina (2 kvar)` (1892), lägeskorten `👀 🤝 💪` i `.md-aico` (1363, 1368, 1373), "⌫" som text i knapp (2087, 1874). Regel 11: SVG. Bubblornas 🤔 ✅ ✏️ 🎉 ⭕ 👉 🎯 är innehåll och kan stå kvar. Delas med multiplikationen.

**D3. Klart-bubblan bär två likheter.** (769–770, 2062–2063): `"Klart! 🎉 96 ÷ 4 = 24 — kolla: 24 · 4 = 96!"`. Spec-beslutad verifiering; men två likheter i en mening. Överväg att lägga "kolla"-delen som egen rad.

**D4. Sista siffran stryks i demon men inte av barnet.** `buildDivHelpQueue` 1473 `if (!s.last)`; demon stryker alltid (678 + kommentar 664). Dokumenterat beslut ("sista-minnes-principen", MINNESSIFFER-KONCEPT.md rad 56) — men barnets färdiga papper ser annorlunda ut än demons (`n2-help-end.png` vs `n2-demo-done.png`). Ingen fix föreslås; noteras för Dennis.

**D5. Fältets `shake`-klass hänger kvar efter rätt svar.** Mätt `fieldCls: "md-field num shake has-digits correct"` efter rätt Klar (2166–2175 tar inte bort `shake`). Kosmetiskt.

**D6. Timingar (mätta, ms tills knappen låses upp):** `dhl` 52–60 · `dask` 1002–1011 · `dskip` 1208 · `dwrite` 803–810 · `drem` 904–913 · `dstrike` 902–913 · Klart-bubblan +1 800 efter sista steget (826). Alla ligger i rimligt spann; inget att ändra.

---

## 3. Bubbeltexterna verbatim (demo) — antal led

| Steg | Text (96÷4 / 336÷6 / 612÷6) | Led |
|---|---|---|
| `dhl` | *(tom)* | 0 |
| `dask` | "Hur många hela 4:or ryms i 9? 🤔" | 1 |
| `dwrite` | "2 stycken! För 2 · 4 = 8" | 2 |
| `dwrite` (jämnt) | "16 ÷ 4 = 4, precis jämnt! ✅" | 1 (likhet) |
| `dwrite` (noll) | "Ingen hel 6:a ryms i 1 — vi skriver 0 i kvoten! ⭕" | 2 |
| `drem` | "9 − 8 = 1 blir över — 1:an ställer sig framför 6:an: nu har vi 16!" | 3 |
| `drem` (q=0) | "Hela 1:an blir över — den ställer sig framför 2:an: nu har vi 12!" | 2 |
| `dskip` | "6:or i 3? Det går inte — vi tar med nästa siffra: 33!" | 3 |
| `dstrike` | "9:an är klar — vi stryker den! ✏️" / "3:an och 3:an är klara — vi stryker dem! ✏️" | 1 |
| `done` | "Klart! 🎉 96 ÷ 4 = 24 — kolla: 24 · 4 = 96!" | 2 |

Hjälpläget: "Hur många hela 4:or ryms i 9? 🤔" (1) · "Blir något över? 9 − 8 = ?" (2, men frågan ÄR uträkningen — spec-beslut) · "Var ska resten 1 stå? Tryck där! 👉" (1) · "Precis där! 🎯 Nu har vi 16!" (2) · "9:an är klar — stryk den! ✏️" (1) · "Struken! ✏️ Nu ser vi att 9:an är klar." (2) · fel: "Hmm, prova igen! 💪" · livlina: "Det ryms 2 hela 4:or i 9 — skriv in det själv! ✍️".

---

## 4. Bråkstrecksnotationen (v36) — vad som ritas och i vilken ordning

Rendering (1173–1207), uppifrån: platsvärdesetiketter `H T E` (`.md-flbl`, färg per position) → täljarceller 38×38 med ram i positionens färg → `.md-fracbar` 4 px (232) → divisorn i grå cell (`#md-d-0`, 1202–1203) → till höger, vertikalt centrerad mot hela bråket, `=` + kvotrutor (streckade `.md-ansc`). Mätt: `=` centrum y=121 mot bråkstreckets y≈129 — ligger 8 px över strecket; acceptabelt.
Ordning per siffra i demon (mätt 96÷4): dimma/lys (52 ms) → fråga med puls på divisor + siffra (1 002 ms) → kvotsiffran droppar in i `md-q-1` (`md-drop`, 803 ms) → resten `1` poppar fram uppe till vänster om 6:an (904 ms, se A1) → penndraget över 9:an (907 ms, `md-pen` 0,25 s, siffran kvar på 55 %: `.md-cell.struck > span { opacity:0.55 }` 242). Mot specens skiss (`8̶ ²5̶ ¹2̶ / ───── = 1 4 2 / 6`) stämmer placeringen av rest-prefix (uppe till vänster om nästa siffra), strykningen av täljarsiffran och kvoten efter `=`. Fotot i sig har jag inte sett; specens beskrivning är det jag mätt mot.

Strykningen följer minnessiffrans livscykel: eget steg (678, 962–965), penndrag (`memStrikeSVG`-mönstret återanvänt som `.nstrike`, 1072–1076), siffran står kvar nedtonad, tas aldrig bort, rest-prefixen berörs inte (`.md-cell.struck > span:not(.md-divrem)`, 242). ✓

---

## 5. Vad som är bra och inte ska röras

- **Matte-kärnan** `divPass`/`divLevelOk`/`genDivProblem` (508–578): ren, vitest-bar, baklänges-konstruktion garanterar jämn delning, nivåvillkoren verifieras på stegsekvensen. Rör inte.
- **Texten före rörelsen** överallt: `demoNextStep` kör `showStepBubble()` före `executeStep()` (820–821). Regel 2 hålls i alla sex divisionsstegen.
- **Strykningen som eget steg** med penndrag, aldrig sudd, i både demo och hjälp (D4 undantaget är beslutat). Samma mönster som minnessiffran — behåll.
- **Rest-prefixen stryks aldrig** (242, 1051) — rätt enligt spec.
- **Hjälpets frågekedja avslöjar aldrig facit** i frågan (1806–1810) och livlinan tvingar barnet att skriva själv (1895–1917).
- **Platsvärdesfärgerna** ental grön / tiotal blå / hundratal röd (COLV, 101) på både täljare och kvotsiffra; resten röd `#dc2626` (199). Regel 12 hålls.
- **Ingen scroll, kladden ≥ 150 px** i alla tre lägen vid 390×844 (C5).
- **Glömd-rest-detektorn** (587–591, 2185–2189) träffar rätt fall (mätt 738÷3 → 212 ⇒ riktad hint) — behåll logiken, ge den bara ett papper att peka på (A4).
- **Fel-tap-hanteringen** utan poängstraff (1652–1663) och Minnesmästare-räkningen för stryk-momenten (1669, 1660).

---

## 6. Skärmbilder

`/tmp/gransk-division/`:
- `n2-demo-00…08.png`, `n2-demo-done.png` — 96÷4 steg för steg
- `n3-demo-00…13.png`, `n3-demo-done.png` — 738÷3
- `n4skip-demo-*.png` — 336÷6 (ledande hopp, ghost-rutan C3)
- `n4zero-demo-*.png` — 612÷6 (nolla i kvoten)
- `n1-demo-*.png` — 84÷4
- `n2-help-00…07.png`, `n2-help-end.png`; `n4skip-help-*.png` — hjälpläget (fel svar, fel-tap, placera, stryk)
- `n3-free-00…04.png` — fria läget (miniräknarfältet, glömd-rest-hinten)
- `verify-n3-step4-zoom.png`, `verify-n3-step9-zoom.png` — resten på 28 % (A1)
- `verify-help-slot-zoom.png` — den osynliga slotten (A2)
- `verify-help-strike.png` — stryk-fasen
