# Överlämning – Matteprov (levande expert)

**Roll:** byggde Matteprov 4:an med Matteprov 1 (multiplikation, kapitel 2) och förvaltar det. Kan granska, rätta och
bygga vidare, och lägga till nästa prov.
**Datum:** 2026-10-19, D41 tillagt 2026-10-21 (gren `matteprov-metod`).
**Läge:** live i **v69** (`live-fore-v69` är återställningspunkten; v67 hade rundorna 1–3, v68 runda 4, v69 rundorna
5–6 och samordnarens resultatregel). Arbetet sker på `dev`. Rundornas grenar är sammanslagna och borttagna:
`matteprov`, `matteprov-hjalp`, `matteprov-kladd`, `matteprov-radfraga`, `matteprov-snall`, `matteprov-enknapp`.
Vitest 19/10: hela sviten 468, varav 75 i `tests/matteprov.test.mjs`.

## Läs först
1. `CLAUDE.md` (absoluta regler: pedagogiken, språket, 390 × 844 utan scroll, 44 px, inga emojis i nytt).
2. `.project-context/DECISIONS.md`:
   - **D37** – provet, minst lika svårt som det svårare bladet.
   - **D38 med sex ✎** – kladd, hjälptrappa och mitt prov; ensiffrig faktor med delprodukter; appen leder
     uppställningen; tvåsiffrig med tankerad; anteckningsrutor och kompakt knappsats; raderna fylls med en fråga
     (ändrar D37: appen får vara något lättare än provet); ångra och gör om i kladden.
   - **D39 med tre ✎** – snällare app (inget argt ljud, inget rött för fel, ord som "Inte riktigt"); en knapp som
     byter namn; problemlösningen i ledda steg; resultatraden.
   - **D40 med ✎** – Multiplikation nivå 4: den osynliga nollan, pekningen, siffrorna i platsvärdesfärg (multdiv).
   - **D41** – uppställningen i provet: välj räknesätt, Minnessiffra (förval, samma metodik och motor som D40)
     eller Dela upp (D38:s delprodukter).
3. `.project-context/DESIGN.md`: raden Matteprov 4:an och lagringsnyckeln `matteprov_`.
4. `MANUAL.md`, avsnittet "Matteprov 4:an" (vad barnet ser).
5. `agenter/matteprov/LOGG.md` (rundorna 1–6 och lärdomarna).

## Filerna

| Fil | Roll |
|---|---|
| `js/matteprov-logic.js` (`window.MatteProvLogic`, även CJS) | All ren logik: provlistan, generatorer per moment och nivå, facit, rättning, hjälptrappor, radfrågan, problemlösningens steg, knappens läge, det som var svårt, mitt prov, kladdens historik. Testad. |
| `js/matteprov.js` (`window.MatteProv`) | UI:t: provlistan, provsidan, Så här gör du, passen (öva, tabelltest, prov, mitt prov, sprint), kvittot, kladden, knappsatsen. All CSS är injicerad under `#mp-root`. |
| `tests/matteprov.test.mjs` | 75 tester. |
| `js/multdiv.js` | Kortet "Matteprov 4:an" i Multiplikationens lägesvy, `openProv()` och (D41) kroken `runTask`: räknar EN uppställning med minnessiffra och lämnar tillbaka `{ outcome, cls, facts }`. Isolerad: `host` är null i multdivs egna lägen. |
| `js/shared.js` | Matteprovet använder `MP.createDrill`, `MP.receiptFor`, `MP.bindHold`, `MP.spaced.fmtDay`, `MP.resultNote` (resultatraden, D39 ✎) och `MP.praiseFor`. Inget i shared.js är matteprovets eget. |
| `index.html`, `sw.js`, `js/app.js` | Skärmen `#screen-matteprov` / `#mp-root`, scripten i precache, nyckeln i `Store.deleteProfile`. Felljudet `App.Sound` 'wrong' är ett mjukt "hmm" (D39, samordnaren). |

## Viktiga funktioner (logikfilen)
- **Data:** `PROVS` (provlistan), `MOMENTS`, `LEVELS`, `SHOP`, `NAMES` (generiska, D36).
- **Generatorer och pass:** `genTabell`, `genTiotal`, `genTalsorter`, `genUpp(level, 'en'|'tva')`, `genProblem`,
  `genSprint`, `makeSheet`; `buildProv` (alltid `PROV_LEVEL = 'svar'`), `buildWeakPass`, `buildMittProv`.
- **Rättning:** `check(t, resp)` per typ (`num`, `tio`, `te`, `upp`, `sheet`). Tabelltestet: `checkSheet` ger `null`
  för tomma rutor, aldrig fel. `classifyUpp` rättar bara summan (`summinne`, `addition`, `fel`). `classifyTiotal`.
- **En knapp (D39 ✎):** `oneButton(vals, open)` ger 'next' så länge en öppen ruta är tom, annars 'klar';
  `nextEmpty` hittar nästa tomma ruta. `sheetEmpty` räknar tomma.
- **Problemlösningen i ledda steg (D39 ✎):** varje uppgift har `t.flow` (steg med `q`, `op`, `ans`, `unit`);
  `checkProbStep` (gånger och plus i valfri ordning, minus inte), `probStepHint`, `probStepBit`, `probHelpStep`,
  `probConclusion` ("Uttrycket blir 200 − 5 · 28 = 60 kr").
- **Uppställningen:** `makeUpp` (`parts` vid ensiffrig faktor, `p1`/`p2` vid tvåsiffrig), `uppFacitRows`,
  `uppRowsOrder`, `uppOpenRows` (summan låst tills raderna är klara), radfrågan `rowQuestion`/`rowBook`/
  `rowHelpStep`/`rowHint`, anteckningsrutorna `thinkNotes`/`noteMark`, summans tankerad `thinkSteps(t, 's', …)`.
- **Hjälptrappan för övriga moment:** `helpStep(n, nBits)`, `helpHint`, `helpBits`.
- **Det som var svårt:** `tagsCovered`, `tagsHard(t, cls, detail)`, `recordOutcome` (glöms efter `FORGET_AFTER = 3`
  rätt direkt i rad), `hardList`, `tagLabel`, `genForTag`.
- **Kladden:** `createHistory()` (Ångra/Gör om, Rensa är ett drag).

## Räknesätten i uppställningen (D41)
- **Växeln** `Räkna med: Minnessiffra | Dela upp` står överst i "Så här gör du" för uppställningen (på provsidan fanns
  inte plats i 390 × 797, uppmätt 49 px för mycket; provsidan visar "Räknesätt: …" under momentet). Valet sparas som
  `upMethod` i `matteprov_{id}` (`uppMethod`, `setUpMethod`), förval Minnessiffra.
- **Minnessiffra:** `renderTask` lämnar uppgiften till `runMinne`, som anropar `MultDivGame.runTask({ a:top, b:bot,
  mode, … })` på multiplikationens skärm (`Router.silent`, ingen historikpost). `uppEngineMode(method, S.mode)`:
  Öva/svag/not = `help` (Räkna med hjälp: appen leder en kolumn i taget, så att barnet lär sig ordningen), prov och
  mitt prov = `free` (Räkna själv: vid tvåsiffrig faktor skriver barnet rad 1, rad 2 med den grå nollan, som läraren
  rättar, och summan; vid ensiffrig bara svaret. D41 ✎. Trappan: först en tyst rad som pekar på raden som inte
  stämmer (`freeCheck`), sedan radens facit som hjälpbit, en rad i taget, och kommer samma rad igen visas svaret). `minneDone` bokför utfallet med
  `taskDone(t, outcome, cls, { facts })`: nötloopen, kvittot och `recordOutcome` som vanligt. Felklassen `minne`
  ger taggen `upp:minne` ("Minnessiffran"), `facts` ger tabelltaggarna.
- **Dela upp:** D38-flödet nedan, oförändrat. Den orange ramen fanns redan där (`.lit`); siffrorna i texten är inte
  färgkodade i Dela upp (multdivs ref-mekanism finns bara i multdiv).

## Designval som gäller
- **Isolerat i provet.** Allt som avviker från appens sätt att ställa upp och lösa tal (bladens rutnät, grå nollan,
  "="-raderna, delprodukterna, radfrågan, mallarna i problemlösningen, den kompakta knappsatsen) bor bara i
  matteprovets filer. Multdiv:s nivå 1–4 och resten av appen beter sig som förut.
- **Nivån.** "Gör provet" och "Mitt prov" byggs alltid på Svårare, minst det svårare bladets nivå (vitest bygger 300
  prov och mäter varje uppgift). Lättare/Svårare är bara trappsteg i Öva. Appen får vara något lättare än det skarpa
  provet, eftersom den är till för att träna inför provet (D38 ✎).
- **En knapp som byter namn (D39 ✎).** Bredvid ⌫ finns en enda knapp i full bredd. I lägen med flera rutor heter
  den "Nästa tal"/"Nästa ruta" och hoppar till nästa tomma ruta; när varje ruta är ifylld heter den Klar (eller
  Svara) och rättar; suddas en ruta tom heter den Nästa igen. I uppställningens radfrågor: Svara eller Nästa, vid
  den grå nollan ett avstängt Svara, Klar först i summan.
- **Problemlösningen i ledda steg (D39 ✎).** Varje steg är en fråga med mallen `[ ] op [ ] = [ ]`; prislistan och
  tidigare svar går att trycka på; nästa steg visas först när det förra stämmer; varje steg rättas vid Svara, i Öva
  och prov; slutsatsen med uttrycket sist. Knappsatsen har inga räknetecken.
- **Uppställningen (Dela upp).** Ensiffrig faktor: en delprodukt per siffra, varje rad ett steg åt vänster; rutorna till
  höger om en förskjuten rad är grå, och appen sätter nollorna där innan radens fråga (D41 ✎, `rowZeros`,
  `uppRowFlow`). Förklaringen bygger på siffrans värde (`zeroSteps`: Öva tre klickstyrda steg, tiotalet två,
  provet ett med "därför"); kvittensen `zeroBookText` slutar med "Raden blir 7200.". Summans tankerad räknar
  nollorna. Språkregeln sveps i vitest (inget tal två gånger i en mening). Tvåsiffrig: rad 1,
  rad 2 som börjar med barnets egen nolla i den grå rutan, summan. Appen frågar per rad och bokför svaret på rätt
  plats; summan skriver barnet själv, ruta för ruta. Tankeraden, de lysande siffrorna och anteckningsrutorna är
  vägvisning och räknas inte som hjälp.
- **Snällt (D39).** Inget rött som betyder fel: milt orange för "inte riktigt ännu", neutral grå för ett visat svar,
  grönt för rätt, lila för minnesrutorna. Ord: "Inte riktigt – försök igen", "Nästan!". Första "försök igen" är tyst;
  tabelltestet och sprinten har inget felljud. Tomma rutor rättas aldrig. Kvittot: "Klarade direkt / Med hjälp /
  Övar vi mer på"; grönt räknar bara klarade direkt. Ett test sveper koden och alla genererade texter efter "Fel",
  "fel!" och "Du glömde".
- **Resultatregeln (D39 ✎, samordnaren).** `MP.resultNote` och matteprovets resultatrader (`resHead`, kvittots rad):
  från 60 % "Du klarade 7 av 10 – Bra kämpat! 💪", alla rätt "Du klarade alla 10!", under 60 % bara "Du fick 3 av 10
  rätt", med neutral ram. Emojin är Dennis val.
- **Språket:** samma tal får aldrig ha två roller i samma mening; generatorerna stoppar krockar och tester vakar.
  Inga avskrivna tal från bladen (upphovsrätt).

## Kända begränsningar och skuld
- **Oanvänd uttryckslogik (TODO).** `parseExpr`, `exprOk`, `exprRows`, `exprText`, `checkProblem` och
  problemlösningsdelen av `check` och `helpBits` används inte längre av gränssnittet (problemlösningen går i ledda
  steg). De och deras tester ska tas bort; punkten står i `TODO.md`. Ta också bort `explainSteps`-grenen för
  problemlösning i `js/matteprov.js` och kontrollera `tagsCovered` (`prob:uttryck` finns kvar bara för att gamla
  sparade taggar ska glömmas).
- **Kladdens höjd på korta skärmar.** I 390 × 700 med hjälptext vid fyrsiffrigt · ensiffrigt är kladden nere vid
  golvet (cirka 57–63 px). Inget scrollar. På skärmar ≤ 760 px ligger kladdens verktyg som ikoner i hörnet.
- **Testkroken `MatteProv._force(items, prov)`** startar ett pass med givna uppgifter; bara för test i webbläsaren.
- **Webbläsarpanelen** kan inte registrera service workern (det är panelen, inte appen). Panelen delas med andra
  agenter: ange alltid `tabId` och kontrollera `location.origin` (en annan server, :5330, tog över fliken en gång).
- Gamla poster i `matteprov_{id}.provs.prov1.hard` kan ha taggar som inte längre skapas (`upp:plats`, `upp:rader`,
  `upp:minne`, `prob:uttryck`); de ger en uppgift av närmaste typ och glöms efter tre rätt.

## Så läggs Matteprov 2 till
1. En post i `PROVS` i `js/matteprov-logic.js`: `{ id:'prov2', title:'Matteprov 2', sub:'…', moments:[…],
   provCount:{ … } }`. Provlistan och provsidan ritas ur `PROVS`; lagringen är redan per prov-id (`provs[provId]`).
2. Nya moment: lägg dem i `MOMENTS`, en generator i `GEN`, en typ i `check()`, och UI i `questionHTML`/`padHTML`/
   `freshInput` i `js/matteprov.js` (följ en knapp-regeln och D39). "Så här gör du" i `introSteps`.
3. Det som var svårt: taggar i `tagsCovered`/`tagsHard`, etikett i `TAG_LABEL`, uppgift i `genForTag`.
4. Nivågolv som vitest (mönstret "provet är aldrig lättare än underlaget"), och lägg de nya texterna i svepet.
5. MANUAL och DESIGN; kontrollera 390 × 844, 797 och 700 med kladden.

## Nästa steg
- Vänta på Dennis och barnets synpunkter på v69.
- TODO: ta bort den oanvända uttryckslogiken (se ovan).
