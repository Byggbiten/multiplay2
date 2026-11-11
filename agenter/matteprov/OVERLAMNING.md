# Överlämning – Matteprov (levande expert)

**Roll:** byggde Matteprov 4:an med Matteprov 1 (multiplikation, kapitel 2) och förvaltar det. Kan granska, rätta och
bygga vidare, och lägga till nästa prov.
**Datum:** 2026-10-19; D41 2026-10-21 (gren `matteprov-metod`); D42 2026-10-21 (gren `matteprov-hjalplage`).
**Läge:** live i **v73** med D42 (runda 10; grenen `matteprov-hjalplage` är sammanslagen). Rundorna 7–9 gick ut i
v70–v72. Tidigare: v67 rundorna 1–3, v68 runda 4, v69 rundorna 5–6
och samordnarens resultatregel. Arbetet sker på `dev`. Rundornas grenar är sammanslagna och borttagna:
`matteprov`, `matteprov-hjalp`, `matteprov-kladd`, `matteprov-radfraga`, `matteprov-snall`, `matteprov-enknapp`.
Vitest 21/10 (efter D42): hela sviten 515, varav 97 i `tests/matteprov.test.mjs`.

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
   - **D42** – Öva får Räkna med hjälp (förval) och Räkna själv; med hjälp leder appen under körningen, ruta för
     ruta. Provet räknas själv.
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

## Räkna med hjälp / Räkna själv (D42)
- **Valet** `Med hjälp | Själv` står på provsidan på samma rad som Lättare/Svårare (uppmätt i 390 × 797: ingen scroll,
  knapparna 85 × 44 px; sidan hade 19 px kvar, så en egen rad fick inte plats). Sparas som `ovaMode` i
  `matteprov_{id}` (`ovaMode(st)`, `setOvaMode`), förval Med hjälp. `passHelp(mode, passMode)`: hjälp bara i Öva
  (`ova`, `svag`, `not`) och bara med Med hjälp; `prov` (provet och mitt prov) är alltid själv. UI:ts `helpOn()`.
- **Med hjälp i tiotal och TE:** `freshInput` ger `IN.hb = { i, sw, outc, ack, msg, adv }`; rutorna fylls en i taget
  (senare rutor låsta och tonade, klara gröna). Frågeraden (`askHTML`) visar kvittensen efter förra rutan
  (`boxAck`), frågan om rutan med fokus (`boxAsk`) och hjälpens rad efter fel. Knappen heter Svara och rättar bara
  rutan (`helpBoxAnswer`); fel: "Inte riktigt – försök igen" tyst, sedan `boxHint`, sedan svaret i rutan och "Nästa
  ruta" (`hbAdvance`). Uppgiftens utfall: sista rutan visad ⇒ svaret, någon hjälp ⇒ med hjälp. Slutvyn visar talet
  och svaret ("8 · 40 = 320").
- **Lysande siffror och färger:** `boxAsk` returnerar `lit` ('x:<plats>', 'y:<plats>', 'a', 'b:T', 'b:E', 'box:<i>')
  och texten med tokens `[[siffror:plats]]`; `tokHTML` färgar dem (`pvE`, `pvT`, `pvH`, `pvTu`, `pvTT`), `pvRef`
  ritar faktorerna med en färg per siffra och orange ram på de lysande (`.lit`). Ett tal ritas i en `pvn`-span, annars
  delar flexraden upp siffrorna ("5 0 · 6 0", rättat under verifieringen).
- **Problemlösningen:** stegens fråga fanns redan; med hjälp lyser priset som hör till ett gångersteg (`.pick.lit`).
- **Uppställningen:** `uppEngineMode(method, passMode, mode)`: Minnessiffra med hjälp = multdivs hjälpläge, själv och
  provet = fria läget via `runTask`. Dela upp är det ledda flödet i båda lägena.
- **Själv:** som förut: instruktionsraden, alla rutor öppna, en knapp (Nästa ruta → Klar).
- **Samordnarens ändring efter runda 10:** TE:s första fråga heter "Dela 28: vad är tiotalen värda?" (inte "hur
  många är tiotalen?"), eftersom ett barn kan svara 2 när rutan väntar 20 (`boxAsk`, testet och MANUAL uppdaterade).
- **Kalibrering för frågetexter:** testa varje fråga mot vad ett barn skulle svara, inte bara mot förväntad text. Läs
  frågan bokstavligt och skriv upp de rimliga svaren (antalet eller värdet? siffran eller talet?); svarar frågan på
  något annat än rutan väntar, skriv om den. Gäller alla nya frågor i boxAsk, rowQuestion och problemlösningens steg.

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
- **Minnesrutorna i summan (D41 ✎).** Ett tryck på en lila minnesruta gör att den väntar (`IN.mw`, klassen `wait`);
  summans fokus (`IN.f`) rörs aldrig. Nästa siffra eller ⌫ gäller minnesrutan, sedan är den klar. Andra trycket på
  en väntande ruta tömmer den. Ren logik: `memCellTap`/`memCellKey` (vitest). `IN.back` finns inte längre.
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

## Övningsblad · Division (D44 ✎, 2026-11-11, gren `matteprov2`, ej mergad)
Inget prov: posten `ovdiv` (`kind:'ovning'`) i `PROVS` med tretton moduler (`DIV_IDS`). Nås från kortet
**Övningsblad** i Kort divisions lägesvy (`openProv` → `MatteProv.open(p, back, 'ovdiv')`); provlistan visar den
inte. Sidan är `showOvning`: nivå och Med hjälp/Själv, modulerna i ett rutnät, märket "Öva mer på" (`hardFor`) eller
"Klart". Varje modul: Så här gör du (`divIntroSteps`) → nötloopen → "Bra nött!"-kvittot. Ingen Gör provet, inget Mitt
prov (`genForTag` ger null för divisionens taggar).
- **Typen `dr`** (`makeDr`, moduler dela, grupper, dkontroll, drest, ingar): mallen `[n]/[d] = [kvot], rest [rest]` och
  `Kontrollera: [d] · [kvot] + [rest] = [n]`; `write` = barnet skriver täljare och nämnare; `kGiven` = nämnaren står i
  kontrollen (Lättare). `pic` 'dela'/'grupp'/'linje' är interaktiv: varje tryck på högen (eller tallinjen) delar ut ett
  varv, ringar in en grupp eller tar ett hopp (`IN.made`, `picMax`, `picLeft`); med hjälp först (`IN.dealPending`,
  `dealAsk`, `dealDone`), sedan rutorna. Rättning `checkDrest`: kontrollen i valfri ordning, och den rättas först när
  divisionen stämmer; felklasser kvot/stor/kontroll/skriv.
- **ts** (talsort, block i talsortens färg), **dz** (10/100/1000, en ruta per siffra, kvot/nämnare/täljare saknas),
  **pt** (pengar, 33b-tabellens rad), **kd** (kort division i motorn, `runTask({ kind:'div' })` på multdivs nivå 3),
  **sheet** för divisionstabellen, **prob** för begrepp, problemlösning och slutledning (steg med `op:'/'` och
  `rest:true` ger ", rest [ ]").
- Designreglerna (brainstorm/11) som är inbyggda: fel ruta töms och får fokus (`markBad` för `DIVBOX`), rest lila
  (`.mp-ans.rest`, högen som blir över), talen i bråket, frågan och tidigare svar går att trycka på (`pick` för rutor),
  kontrollen som mall, inga lika tal i olika roller eller dubbelsiffror (`distinct`, `twinDigits`).
- Tester: `tests/ovningsblad.test.mjs` (48).

### Runda 2: stil C · Brickor (D44 ✎, 2026-11-11, gren `ovningsblad-runda2`, ej mergad)
- Stilen ligger i de delade renderarna för övningsbladen (`isOv(t)` släpper inte in Matteprov 1): `pvHTML`/`pvText`
  (siffror i platsvärdesfärg i rutor, bråk, frågor och brickor; rest lila), `fracHTML(…, lab)` med etiketterna
  täljare/nämnare och `capW` (kvot, rest), `tileText` (talen i texten är brickor att trycka på).
- **Bandet** (`drawBand`, `bandSource`, `bandWant`): bara Med hjälp och bara den aktuella tomma rutan; källan är det
  tryckbara tal som är svaret (gruppens nummer, kvoten, resten, täljaren, priset), annars det som lyser. Från täljaren
  går bandet ut åt höger runt bråket. **Flygningen** (`flyTo`): vid tryck på ett tal och när hjälpen visar svaret;
  `animateDeal` låter bollarna och hoppet röra sig från högen.
- **Verktyget är hjälpen** (`toolOf`, `prepTool`, `IN.tool`/`toolKey`; nötloopen ger nya kopior av uppgiften, därför
  läggs verktyget på i `curTask`): Kontrollera och Ingår får högen (eller tallinjen över 40), Pengar tallinjen i kronor,
  10/100/1000 nollor att stryka med ett tryck, Varje talsort block som delas med ett tryck (`split`), divisionstestet
  kontrollen under bladet (`mp-skh`). Själv: inget verktyg, inget band, ingen stegtext i problemlösningen.
- Lättare: 2:an, 5:an och 10:an, tvåsiffrigt (`EASY_D`); `digitClash` i alla generatorer.

**Regel för bandet och fokus (Dennis 11/11, runda 3):** det som är i fokus och bandets start ska vara exakt det tal
barnet ska skriva, inget annat. `bandSource` tar bara ett tryckbart tal med rutans svar (`[data-act=pick][data-v=svar]`);
finns det inte på skärmen blir det inget band. Allt som lyser (det som räknas) och deras föräldrar har full styrka
(`mp-keep`); resten tonas ned. Gruppernas nummer, barnens antal, högen och tallinjens siffror är inte källor; i stället
står summan under bilden som bricka (`picSum`: "6 grupper", "4 till varje barn", "6 hopp", "2 över"). Per modul, steg
med band (genomgånget i webbläsaren 11/11, källan märks `mp-bsrc`):
- Dela lika, Hur många grupper, Kontrollera, Rest, Ingår: kvoten ← summan "q grupper/till varje/hopp"; resten ← "r över";
  kontrollens nämnare ← nämnaren i bråket; kvoten och resten i kontrollen ← kvot- och restrutan; svaret ← täljaren
  (bandet går runt bråket på höger sida); täljare och nämnare när barnet skriver divisionen ← brickorna i frågan.
- Varje talsort: rutan ← brickan med andelen som visas när blocken delats ("3"); före delningen inget band.
- 10/100/1000 (kvot): varje ruta ← samma siffra i täljaren; nämnaren och täljaren som saknas: inget band.
- Pengar: hur många ← "q gånger"; över ← "r kr över".
- Begrepp, Problemlösning, Slutledning: rutan ← brickan i texten eller svaret från förra steget; tal som inte står som
  siffra (som "två" eller ett nytt svar) får inget band.

1. En post i `PROVS` i `js/matteprov-logic.js`: `{ id:'prov2', title:'Matteprov 2', sub:'…', moments:[…],
   provCount:{ … } }`. Provlistan och provsidan ritas ur `PROVS`; lagringen är redan per prov-id (`provs[provId]`).
2. Nya moment: lägg dem i `MOMENTS`, en generator i `GEN`, en typ i `check()`, och UI i `questionHTML`/`padHTML`/
   `freshInput` i `js/matteprov.js` (följ en knapp-regeln och D39). "Så här gör du" i `introSteps`.
3. Det som var svårt: taggar i `tagsCovered`/`tagsHard`, etikett i `TAG_LABEL`, uppgift i `genForTag`.
4. Nivågolv som vitest (mönstret "provet är aldrig lättare än underlaget"), och lägg de nya texterna i svepet.
5. MANUAL och DESIGN; kontrollera 390 × 844, 797 och 700 med kladden.

**Regler för bandet (runda 4, Dennis 11/11): fri väg och kort band, som bästa möjliga kompromiss.**
- Fri väg: bandet går aldrig genom läsbar text eller siffror (frågan, uppgiften, stegets rad, alla tal). Att snudda vid
  en etikett (täljare, nämnare, kvot, Kontrollera) eller en bild kostar lite i poängen men är tillåtet.
- Kort band: helst högst 1,5 gånger det raka avståndet och 160 px, aldrig över 2 gånger eller 220 px, högst ett hörn.
- `L.bandRoute` poängsätter kurvor mellan alla par av sidor och vägar med ett rundat hörn (längd mot rakt avstånd,
  straff för etiketter och bilder och för att gå över 1,5 gånger); bästa poäng vinner. Ingen godkänd väg: inget band,
  källan och rutan får den lila ringen (`mp-bring`), och talet flyger som förut när det trycks.
- Hellre flytta källan än dra långt: etiketterna kvot och rest står under rutan; Kontrollera står till vänster på raden;
  i problemlösning, begrepp och slutledning upprepas stegets tal (ur texten och svaren från förra stegen) som brickor
  nära mallen, i en division i höjd med täljaren och nämnaren.
- Kompromisser som valts: bandet får snudda vid etiketter (en kort väg som tydligt visar kopplingen väger tyngre);
  kontrollens sista ruta (svaret = täljaren) och Ingår:s första steg (täljaren ur frågan) får oftast ringen, för att
  vägen skulle gå genom siffror; i 10/100/1000 får rutorna ringen, för att täljarens siffror står tätt intill.
- Runda 5 (samordnarens mätning: vägar som pekade fel): hårda spärrar i `bandRoute` utöver text och längd:
  sidorna vänder sig mot varandra (`sidesFace`: källan ovanför målet ⇒ aldrig in underifrån), bandet går aldrig in i
  källans eller målets egen ruta (`entersRect`), andra tal har 10 px marginal (också startpricken), och orden i
  summabrickan räknas som text. Med hjälp står svaret ur bilden som bricka mitt ovanför kvot- eller restrutan
  (`.mp-above`, plats reserverad med `has-above`), så att bandet blir ett kort lodrätt fall. Kostnad: kladden blir
  ungefär 55 px lägre i de stegen (Svårare, Hur många grupper: cirka 70 px kvar).
- Runda 6 (Dennis: "Flytta '9 grupper'"): kopian ovanför rutan är borta. Summan ur bilden står ovanför sin ruta
  (`pill` i `drHTML`, `.mp-sumov`): talbrickan med mittlinjen rakt ovanför kvot- eller restrutan, bandet cirka 30 px
  rakt ner. Utan rest: "9 grupper" / "4 i varje" / "6 hopp" med ordet till höger (`sum1`). Med rest står båda på samma
  rad med orden ovanför talen (`sum2`), "över" och restrutans etikett "rest" i samma lila. I problemlösning står
  etiketterna täljare/nämnare till vänster om brickorna, så att bandet går fritt. Kladden är minst 121 px (Dela lika,
  Lättare med hjälp); kulorna är 13 px och barnens ikon 18 px för att det ska rymmas.
- Nedtoningen är gråskala, inte genomskinlighet, så att kontrasten behålls; frågan och brickorna i uppgiften tonas
  aldrig ned. Pilspetsen slutar 3 px utanför rutans ram (runda 7, nedan).

**Runda 7 (gren `ovningsblad-runda7`, ej mergad): standardmetoden för alla band.**
Dennis: "fästpunkterna för strecket blir programmatiskt bra, istället för 'ungefär eller uppskattade'" och "nånting
som funkar oavsett vilken siffra det gäller". En metod för alla källor och mål, inga specialvägar:
- **Källan mäts på siffrornas egen ruta:** `digitsRect(el)` i `js/matteprov.js` är en `Range` över elementets text
  (`getBoundingClientRect` på rangen), inte brickans eller radens ruta. Det fungerar lika för en- och flersiffriga tal,
  decimaltal med komma, platsvärdesfärgade spann, bråkets täljare och nämnare, en siffra i ett flersiffrigt tal,
  tallinjens siffror, kvot- och restrutan och pengar. Ett element utan siffror mäts med sin ram. `anchorRect(el, källa)`
  väljer: källa ⇒ siffrorna, mål ⇒ rutans ram (ramen ingår). `anchorOf(el, sida, avstånd, källa)` ger punkten mitt på
  en sida med avståndet utanför.
- **Konstanterna** i `js/matteprov-logic.js`: `BAND_START = 3` (starten 3 px från siffrornas kant, mitt på sidan mot
  målet), `BAND_TIP = 3` (pilspetsen 3 px utanför rutans ram, rör den aldrig), `BAND_ARROW = 6` (pilens längd; kurvan
  slutar `BAND_GAP = 9` px från ramen). `bandRoute` lägger handtagen vinkelrätt ut från sidorna (fast andel av
  avståndet) och ritar rakt när start och mål står i linje.
- **Ritas när layouten är stabil:** `scheduleBand()` väntar på `document.fonts.ready` och två bildrutor, och ritar om
  vid storleksändring (`ResizeObserver` på `#mp-q`, 60 ms). Rita aldrig bandet direkt i `renderTask`.
- **Bilden är hård:** grupperingarna, barnen, högen, tallinjen och blocken (`pic` i hindren) får aldrig korsas; finns
  ingen kort väg blir det ringen på källan och rutan.
- **Summabrickan bara i kvot- och reststeget** med hjälp: i täljar- och nämnarstegen syns inte "5 grupper", och
  nämnarstegen lyser bara frågan och nämnarrutan, inte grupperna. Nämnarens källa är talet i frågan ("3" i "Grupper med
  3 i varje"); finns ingen fri kort väg dit får "3" och rutan den lila ringen.
- **Svepet i webbläsaren:** `tests/webblasare/band-svep.js`. Synka dev-spegeln, öppna `localhost:5312` i 390 × 797,
  ladda filen med en `<script>`-tagg och kör `await bandSvep({ niva:'latt' })` och `({ niva:'svar' })` (kör den i
  bakgrunden i sidan och läs resultatet efteråt; ett svep tar över 45 s). Det spelar alla moduler med hjälp i riktiga
  flöden ur generatorn och kontrollerar i varje steg: inget genom siffror, text eller bild; inte över 2 gånger det raka
  eller 220 px; starten 3 ± 1 px från siffrorna och spetsen 3 ± 1 px utanför ramen, också efter en storleksändring;
  summabrickan inte på bilden; kladden minst 120 px. `res.sorter` räknar källornas sorter. **Båda nivåerna ska svepas.**

## Nästa steg
- Övningsbladen: Dennis provar grenen `matteprov2`; återstår slutledning med figurer (26b/35c) och tabellformen i 36a.
- Vänta på Dennis synpunkter på D42 (live i v73).
- Möjligt nästa: Med hjälp även i Dela upp och tabelltestet om Dennis vill (nu: Dela upp är alltid ledd, tabelltestet
  har ingen extra hjälp).
- TODO: ta bort den oanvända uttryckslogiken (se ovan).

**Efter runda 9 (samordnaren 21/10):** nollornas förklaring förenklad efter Dennis ("nästan lite som en
tungvrickare"): "8:an i hundratalet är egentligen 800." / "Vi skriver två nollor först – sedan räknar vi bara med
8:an." (`zeroSteps`); provet en rad med samma tanke. Testerna uppdaterade.
