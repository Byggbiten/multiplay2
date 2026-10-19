# Överlämning – Matteprov (levande expert)

**Roll:** byggde Matteprov 4:an med Matteprov 1 (multiplikation, kapitel 2) och förvaltar det. Kan granska, rätta och
bygga vidare, och lägga till nästa prov.
**Datum:** 2026-10-19.
**Läge:** live i **v68** (`live-fore-v68` är återställningspunkten; v67 hade rundorna 1–3). Arbetet sker på `dev`.
Rundornas grenar är sammanslagna och borttagna: `matteprov` (D37), `matteprov-hjalp`, `matteprov-kladd` och
`matteprov-radfraga` (D38 med ✎). Sista ändringen före v68 gjorde samordnaren: en knapp i taget i uppställningen
(`eb988f8`).

## Läs först
1. `CLAUDE.md` (absoluta regler: pedagogiken, språket, 390 × 844 utan scroll, 44 px, inga emojis).
2. `.project-context/DECISIONS.md` **D37** och **D38 med alla sex ✎**. Ordningen: D37 (provet, minst lika svårt),
   D38 (kladd, hjälptrappa, mitt prov), ✎ ensiffrig faktor med delprodukter, ✎ appen leder uppställningen,
   ✎ tvåsiffrig med tankerad, ✎ anteckningsrutor och kompakt knappsats, ✎ raderna fylls med en fråga (ändrar D37:
   appen får vara något lättare), ✎ ångra och gör om i kladden.
3. `.project-context/DESIGN.md`: raden Matteprov 4:an och lagringsnyckeln `matteprov_`.
4. `MANUAL.md`, avsnittet "Matteprov 4:an" (vad barnet ser).
5. `agenter/matteprov/LOGG.md` (rundorna 1–4 och lärdomarna).

## Filerna

| Fil | Roll |
|---|---|
| `js/matteprov-logic.js` (`window.MatteProvLogic`, även CJS) | All ren logik: provlistan, generatorer per moment och nivå, facit, felklassning, hjälptrappan, radfrågan, det som var svårt, mitt prov, kladdens historik. Testad. |
| `js/matteprov.js` (`window.MatteProv`) | UI:t: provlistan, provsidan, Så här gör du, passen (öva, tabelltest, prov, mitt prov, sprint), kvittot, kladden, knappsatsen. All CSS är injicerad under `#mp-root`. |
| `tests/matteprov.test.mjs` | 59 tester (hela sviten 431, 19/10). |
| `js/multdiv.js` | Bara kortet "Matteprov 4:an" i Multiplikationens lägesvy och `openProv()`. Inget annat i multdiv rörs. |
| `index.html`, `sw.js`, `js/app.js` | Skärmen `#screen-matteprov` / `#mp-root`, de två scripten i precache, nyckeln i `Store.deleteProfile`. |

## Viktiga funktioner (logikfilen)
- **Data:** `PROVS` (provlistan), `MOMENTS`, `LEVELS`, `SHOP`, `NAMES` (generiska, D36).
- **Generatorer:** `genTabell`, `genTiotal`, `genTalsorter`, `genUpp(level, 'en'|'tva')`, `genProblem`, `genSprint`,
  `makeSheet`. Bygga pass: `buildProv` (alltid `PROV_LEVEL = 'svar'`), `buildWeakPass`, `buildMittProv`.
- **Rättning:** `check(t, resp)` per typ: `num`, `tio`, `te`, `prob`, `upp`, `sheet`. `classifyUpp` rättar bara
  summan (`summinne`, `addition`, `fel`). `classifyTiotal` (`nollfalla`, `nollor`, `tabell`). `exprOk`/`exprRows` för
  uttrycket.
- **Uppställningen:** `makeUpp` (`parts` vid ensiffrig faktor, `p1`/`p2` vid tvåsiffrig), `uppFacitRows`,
  `uppRowsOrder`, `uppOpenRows` (summan låst tills raderna är ifyllda), radfrågan `rowQuestion`/`rowBook`/
  `rowHelpStep`/`rowHint`, anteckningsrutorna `thinkNotes`/`noteMark`, summans tankerad `thinkSteps(t, 's', …)`.
- **Hjälptrappan:** `helpStep(n, nBits)`, `helpHint`, `helpBits`.
- **Det som var svårt:** `tagsCovered`, `tagsHard(t, cls, detail)`, `recordOutcome` (glöms efter `FORGET_AFTER = 3`
  rätt direkt i rad), `hardList`, `tagLabel`, `genForTag`.
- **Kladden:** `createHistory()` (Ångra/Gör om, Rensa är ett drag).

## Designval som gäller
- **Isolerat i provet.** Allt som avviker från appens sätt att ställa upp och lösa tal (grå nollan, bladens rutnät,
  "="-raderna, uttrycket, delprodukterna, radfrågan, den kompakta knappsatsen) bor bara i matteprovets filer.
  Multdiv:s nivå 1–4 och resten av appen beter sig som förut (Dennis: "vi ändrar inte hela appen i övrigt").
- **Nivån.** "Gör provet" och "Mitt prov" byggs alltid på Svårare, minst det svårare bladets nivå (vitest bygger 300
  prov och mäter varje uppgift). Lättare/Svårare är bara trappsteg i Öva. Sedan ✎ "raderna fylls med en fråga" får
  appen vara något lättare än det skarpa provet, eftersom den är till för att träna inför provet.
- **Uppställningen.** Ensiffrig faktor: en delprodukt per siffra, varje rad ett steg åt vänster (tom ruta, ingen
  nolla). Tvåsiffrig faktor: rad 1, rad 2 som börjar med barnets egen nolla i den grå rutan, sedan summan.
  **Frågan per rad:** appen frågar ("Vad är 9 · 6?") och bokför svaret på rätt plats; vid tvåsiffrig är radsumman i
  anteckningsrutorna svaret. Summan skriver barnet själv, ruta för ruta från höger. Summan är låst tills raderna
  är klara.
- **En knapp i taget** (samordnarens sista ändring): under radfrågan bara Svara/Nästa i full bredd; vid den grå nollan
  ett avstängt Svara; Klar först i summan (`padHTML`).
- **Vägvisning är inte hjälp:** tankeraden, de lysande siffrorna och anteckningsrutorna räknas inte i kvittot. Hjälp
  är trappan: ledtråd → bit → bit → hela svaret (uppgiften), eller försök igen → ledtråd → svaret (raden).
- **Provet säger rätt/fel per uppgift** och har trappan (D38). Kvittot skiljer rätt direkt / med hjälp / fick svaret;
  grönt räknar bara rätt direkt.
- **Språket:** samma tal får aldrig ha två roller i samma mening; generatorerna stoppar krockar (TE, domaruppgiften),
  och tester vakar. Inga avskrivna tal från bladen (upphovsrätt): priser och exempel är egna.

## Kända begränsningar
- **Kladdens höjd på korta skärmar.** I 390 × 700 med en hjälptext synlig är kladden nere vid golvet (cirka 57–63 px
  vid fyrsiffrigt · ensiffrigt). Inget scrollar, men ritytan är liten. På skärmar ≤ 760 px ligger kladdens verktyg
  som ikoner i hörnet och faktorernas siffror är lägre. Mätt 19/10: 82 · 68 har 187 px i 390 × 797.
- **Testkroken `MatteProv._force(items, prov)`** startar ett pass med givna uppgifter. Den är bara för test i
  webbläsaren, som multdiv:s `__test`, och anropas aldrig av appen.
- Webbläsarpanelen kan inte registrera service workern ("An unknown error occurred when fetching the script"); det är
  panelen, inte appen.
- Gamla poster i `matteprov_{id}.provs.prov1.hard` kan ha taggar som inte längre skapas (`upp:plats`, `upp:rader`,
  `upp:minne`); `genForTag` ger då en tvåsiffrig uppgift och etiketten visas som taggen. De glöms efter tre rätt.

## Så läggs Matteprov 2 till
1. Lägg en post i `PROVS` i `js/matteprov-logic.js`: `{ id:'prov2', title:'Matteprov 2', sub:'…', moments:[…],
   provCount:{ … } }`. Provlistan och provsidan ritas ur `PROVS`; lagringen är redan per prov-id
   (`provs[provId]`).
2. Nya moment: lägg dem i `MOMENTS` (id, nr, short, title, desc), en generator i `GEN`, en typ i `check()`, och
   UI för typen i `questionHTML`/`padHTML`/`freshInput` i `js/matteprov.js`. Lägg "Så här gör du" i `introSteps`.
3. Det som var svårt: taggar i `tagsCovered`/`tagsHard`, etikett i `TAG_LABEL`, uppgift i `genForTag`.
4. Nivågolv: lägg provets golv som vitest (mönstret "provet är aldrig lättare än underlaget").
5. Uppdatera `MANUAL.md` och DESIGN-raden; kontrollera 390 × 844, 797 och 700 med kladden.

## Nästa steg
- Vänta på Dennis och barnets synpunkter på v68.
- Öppet: kladdens höjd i 390 × 700 vid fyrsiffrigt · ensiffrigt med hjälptext (om det inte räcker: tresiffrigt på
  korta skärmar, eller en mindre hjälptext).
