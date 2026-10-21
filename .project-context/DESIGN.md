# DESIGN — vad vi bygger

Multiplay är en PWA i vanilla JS utan byggsteg. Allt data ligger i `localStorage` per profil, utan inloggning.
Varje modul är en IIFE på `window` som renderar sig i en egen root i `index.html`. Den här filen pekar; koden och
specarna är sanningen. Användarens bild av funktionerna: `MANUAL.md`.

## Modulerna

Spelväljaren i `index.html` har sex kort och ett hjältekort för Dagens träning.

| Modul | Filer | Vad den gör | Facit |
|---|---|---|---|
| Gångertabellen | `js/multiplication.js` | Hubb med kompakt tabellkarta, Träna en tabell (1–10 med medaljer), övningspass med nötloop och kvitto, Lär dig strategin (rektangeln, Så krymper tabellen), Öva blandat, De svåra talen, Rekordrunda, Statistik och logg. Lådor med påfyllning (D9–D17). | `design-lab/gangertabell-mockup.html`, `brainstorm/05` |
| Klockan | `js/clock.js`, `js/clock-logic.js` | Klockans trappa med sju steg och medaljer, lektioner med "Nu får du försöka", minutkartan, pass med dragbara visare och förklaring vid fel, kvitto; Lekklockan och Klocktest (D18, D19). Logiken och texterna är DOM-fri data i `clock-logic.js`. | `brainstorm/06` |
| Multiplikation och division | `js/multdiv.js` | Uppställd multiplikation och kort division, nivå 1–4, i tre lägen: Titta och lär, Räkna med hjälp, Räkna själv (D3–D7). Multiplikationens nivå 4 (D40) blandar 3 · 1, 4 · 1, 2 · 2 och 3 · 2 ur en påse (`genL4`/`drawL4Type`); formen väljs efter faktorn (`buildPlan`), motorn har fem kolumner (`NCOL`). Rad 2 har en grå ruta med den osynliga nollan (`showZero`) i Titta och lär och Räkna med hjälp; i Räkna själv (D41 ✎) har tvåsiffrig faktor raderna med nollan ljusgrå från början, rad för rad med "Nästa rad"/Klar, summan låst tills raderna har siffror (`freeRowCols`, `freeAnsLocked`, `freeButtonMode`, `freeNextRow`), rättning per rad med glömd minnessiffra per rad och i summan (`freeCheck`). På nivå 4 lyser faktorcellerna och målrutan samtidigt (`multLitCells`) och texterna säger platsen (`multStepText`). På alla nivåer (D40 ✎) skrivs siffror i texten som pekar på en cell med `ref()`, i cellens färg, och cellen pulserar en gång (`pulseRefs`). Källan är `multRefs`, samma för text och pekning. Divisionen pekar ut täljar- och kvotsiffror; resttexterna är orörda. Lägesvyn för multiplikation har kortet Matteprov 4:an (D37). | `SPEC-KORT-DIVISION.md`, `design-lab/kort-division-mockup.html`, `SPEC-MINNESSIFFROR.md` |
| Matteprov 4:an | `js/matteprov.js` (UI), `js/matteprov-logic.js` (ren logik, vitest) | Nås från Multiplikationens lägesvy. Datadriven provlista (`PROVS`); Matteprov 1 har fem moment i övningsbladens form: tabelltestet (20 tal, /20), tiotal/hundratal med "="-rader, TE med tre rader, uppställning med den grå nollan och minnessiffror, problemlösning där barnet skriver uttrycket och räknar gånger först. Öva = "Så här gör du" + nötloop (`MP.createDrill`); Gör provet = alltid Svårare-nivå, kvitto per moment, "Sett av en vuxen" (`MP.bindHold`), "Öva på det som var svårt"; Tabellsprint 4 min / 48 tal. D38: kladden (multdiv:s ritkod, kopierad in i matteprov.js) under knappsatsen; hjälptrappan i Öva och prov (`helpStep`/`helpHint`/`helpBits`); kvittot skiljer rätt direkt / med hjälp / fick svaret; det som var svårt sparas per typ och glöms efter tre rätt direkt (`recordOutcome`), "Mitt prov" (`buildMittProv`). Uppställning: ensiffrig faktor med en delprodukt per rad, förskjuten, med grå rutor där appen sätter nollorna före radens fråga och förklarar dem med siffrans värde (D41 ✎: `rowZeros`, `zeroSteps`, `zeroBookText`, `uppRowFlow`); tvåsiffrig med rad 1, rad 2 med grå nolla, summa; raderna fylls med en fråga och bokförs av appen (`rowQuestion`/`rowBook`/`rowHelpStep`/`rowHint`), tvåsiffrig med anteckningsrutor (`thinkNotes`/`noteMark`) och barnets egen nolla i den grå rutan; summan ruta för ruta (`classifyUpp` rättar bara summan); minnesrutorna i summan väntar på en siffra utan att ta fokus (D41 ✎, `memCellTap`/`memCellKey`, `IN.mw`); summans tankerad (`thinkSteps`); kladden med Ångra/Gör om (`createHistory`); kompakt knappsats (5 + 5 + ⌫/Nästa/Klar) bara i matteprovet. Appen får vara något lättare än provet (D38 ✎). Snällt (D39): tomma rutor rättas aldrig (`checkSheet` ger `null`); EN knapp bredvid ⌫ som heter Nästa tal/Nästa ruta tills allt är ifyllt och sedan Klar (`oneButton`, `nextEmpty`, D39 ✎); tabelltestets andra omgång tömmer de orange rutorna, problemlösningen i ledda steg med mallar (`t.flow`, `checkProbStep`, `probStepHint`, `probStepBit`, `probConclusion`; prislistan och tidigare svar går att trycka på), inget rött för fel, första "försök igen" tyst, och ett test sveper koden efter "Fel", "fel!" och "Du glömde". Allt som avviker från appens sätt att ställa upp bor bara här; multdiv:s nivå 1–4 är orörda. En svarsknapp i taget (`padHTML`). Problemlösningens genomgång har en egen Svårare-version. D41: uppställningen har två räknesätt (`UPP_METHODS`, `uppMethod`, sparat som `upMethod`, förval Minnessiffra; växeln överst i Så här gör du). Minnessiffra räknas av multdiv-motorn via kroken `MultDivGame.runTask` (`uppEngineMode`: Öva = hjälpläget, prov och mitt prov = fria läget med raderna och den grå nollan, och matteprovets hjälptrappa per rad); utfallet (direkt/hjälp/svaret, felklass, tabellfakta) bokförs i kvittot och "det som var svårt" (`upp:minne`). Dela upp är D38-metoden. Live sedan v67/v68. (D37, D38) | `tests/matteprov.test.mjs` |
| Addition och subtraktion | `js/uppstallning.js`, `js/platsvarde.js` | Kortet "Addition & Subtraktion": uppställd addition och subtraktion i samma tre lägen, med minnessiffror och lånekedjan; Platsvärde som eget quiz. | `SPEC-UPPSTALLNING-ADDITION.md`, `design-lab/tiokompis-*.html`, `design-lab/inmatning-barnvy.html` |
| 10-kompisar | `js/tenfriends.js` | Talpar som blir 10: övning och test. | — |
| Nationella prov åk 3 | `js/nationella.js`, `js/np-matte-muntligt.js`, `js/np-matte-skriftlig.js`, `js/np-svenska.js`, `js/np-svenska-texts.js` | Hubb för matematik (muntlig och skriftlig del) och svenska. | `SPEC-NP-MATTE-MUNTLIGT.md` (historisk) |
| Dagens träning | `js/daily.js` | Hjältekortet: plockar ur lådorna i Gångertabellen och Klockan, ett pass med båda, gemensam slutskärm (D20). | — |
| Capybara-samlingen | `js/capy.js` | 24 samlarkort som komponerbara SVG:er, nivåerna Nytt kort, silver och guld med "Så fick du den" (D14). | — |
| Geografi | `js/geografi.js`, `js/geografi-logic.js`, `js/geografi-data.js` (genererad ur `referens/sverige-landskap/`), `assets/geografi/sverige/` | Geografi → Sverige → Sveriges landskap (v66): Utforska, Träna i fyra lägen med nötloop och blandad ordning (D34), Pussel i två nivåer, Samlarpärmen brons/silver/guld, Test per område med kvitto, bildkällorna, hemlandskap per profil (D36). Numren bara internt (D33). Ingår inte i Dagens träning (D20). (D22, D24–D36) | `design-lab/geografi-mockup.html` (införd i v66) |

`js/app.js` äger routing, profiler, `Store`, ljud, konfetti och `APP_VERSION`. `sw.js` cachar appen
(`CACHE_VERSION`, network-first för HTML/JS/CSS).

## Delade delar i `js/shared.js` (`window.MP`, även CJS för vitest)

- `MP.spaced` — lådorna och påfyllningen (ny, övar, kan; intervall 1/3/7/14/30 dagar; medaljen ur lådorna), D11.
- `MP.createDrill` — nötloopen i ett varv: fel ger samma fråga direkt igen och en gång till senare, D12. Med
  `opts.sameKey` (bara Geografi) hamnar extratillfället inte bredvid samma nyckel (D34).
- `MP.spreadShuffle` — blandad ordning utan samma nyckel två gånger i rad och med en ny lottning jämfört med förra gången (D34, Geografi).
- Kvittot efter ett pass: `MP.receiptFor`, `MP.durTxt`, `MP.praiseFor`, `MP.fmtWhen`, `MP.fmtStamp`, och
  `MP.bindHold` för "Sett av en vuxen".
- Äldre delar: `MP.createRetryQuiz` (retry-kön, `PLAN-RENOVERING.md`), `MP.createLog`, `MP.getMedal`,
  `MP.medalSVG`, `MP.timeToSwedish`, `MP.shuffle`, `MP.escapeHtml`, `MP.safeSetItem`.

Gångertabellen, Klockan och Geografi använder samma lådor, nötloop och kvitto; Dagens träning bygger på Gångertabellen och Klockan.

## Lagringsnycklar

Globalt: `multiplay_profiles` (profilerna). Per profil, med profilens id som suffix `_{id}`; alla rensas när en
profil tas bort (`Store.deleteProfile` i `js/app.js`):

| Modul | Nycklar |
|---|---|
| Gångertabellen | `mult_stats_`, `mult_log_`, `mult_boxes_`, `mult_record_`, `mult_settings_`, `mult_ovpass_` |
| Klockan | `clock_log_`, `clock_boxes_`, `clock_ovpass_` |
| 10-kompisar | `friends_log_` |
| Uppställning | `uppstallning_log_` |
| Platsvärde | `platsvarde_log_` |
| Multiplikation och division | `multdiv_log_` |
| Matteprov 4:an | `matteprov_` (vald nivå, räknesättet `upMethod` (D41), och per prov: senaste övning per moment, provens och mitt provs kvitton med "Sett av en vuxen", sprintens bästa, `hard` = det som var svårt per typ, D38) |
| Nationella prov | `np_svenska_log_`, `np_matte_muntligt_stats_`, `np_matte_skriftlig_stats_` |
| Dagens träning | `daily_log_`, `daily_state_` |
| Capybara-samlingen | `capy_cards_`, `capy_state_` |
| Geografi | `geo_state_` (lådan och frågetyperna per landskap, pärmens firande), `geo_settings_` (hemlandskapet, D36), `geo_puzzle_` (pusslets bockar), `geo_log_` (pass och test) |

En ny modul som sparar per profil lägger sina nycklar i `Store.deleteProfile`.

## Specar och planer

| Fil | Vad |
|---|---|
| `SPEC-KORT-DIVISION.md` | Kort division med tabellraden: de fyra fallen, stegkedjan per läge, livlinan, tajming, textsvepet (D5). |
| `SPEC-UPPSTALLNING-ADDITION.md` | Konstruktionsspec för additionens pedagogik: stegkedjor, animationer, CSS-kontrakt, mått, övningsläget. |
| `SPEC-MINNESSIFFROR.md` | Levande minnessiffror: livscykeln, demo, hjälpläge, fria läget (D2). |
| `SPEC-NP-MATTE-MUNTLIGT.md` | Kontextfil för Nationella prov, matte muntligt, från mars 2026 (historisk). |
| `PLAN-RENOVERING.md` | Renoveringen juli 2026 med avbockad status (D1). |
