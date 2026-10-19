# Överlämning – Geografi (levande expert)

**Roll:** bygger och verifierar Geografi-mockupen (`design-lab/geografi-mockup.html`). Kan också granska när
modulen byggs in i appen.
**Datum:** 2026-10-19.
**Mockupens version:** commit `0728948` på `dev` (D24–D34 inarbetade).
**Status:** Dennis har godkänt mockupen ("det ser jättebra ut", 19/10). Nästa steg är att bygga in den i appen,
efter ett ordning och reda-pass.

## Läs först
1. `CLAUDE.md`, sedan `.project-context/DECISIONS.md` D22–D34. D30–D34 ändrar mycket i D24–D29.
2. `logg/2026-10-19.md`, avsnitten om Geografi. Där står vad som verifierats i varje runda, med siffror.
3. `design-lab/geografi-mockup.html`. Läs kommentarerna vid kartmotorn (`GeoMap`), träffregeln, `sayFact`,
   `snapRadius`, `spreadShuffle` och `createDrill`.
4. `referens/sverige-landskap/README.md` (källor, licenser, osäkert) och `referens/README.md`.
5. `agenter/geografi/LOGG.md` (den här rollens lärdomar).

## Vad som är byggt och verifierat (i mockupen)

| Del | Beslut | Verifierat |
|---|---|---|
| Menyn Geografi: nio moduler, bara Sverige öppen → Sverige (landskapen; sjöar och städer "Kommer snart") → Sveriges landskap | D24 | Flödet |
| Kartmotorn: dra, nyp, tröghet, gränser som fjädrar, mushjul. Dubbeltryck zoomar inte. Ett tryck räknas direkt; ett andra tryck på samma ställe inom 350 ms ignoreras | D24, D30 | 35 gestkontroller med riktig touch via CDP |
| Träffregeln: en skiva på 44 px runt mittpunkten för små landskap, annars landskapet under fingret, i havet det närmaste inom 12 px eller kanten | – | Varje landskaps mitt träffar rätt, 25 av 25, i helbild och inzoomat |
| Utforska med landskapskort: sköld, stad (och "också"), blomma och djur som bild och text, rang i ord, "Visste du?", "Här bor du" | D24, D27, D28 | Flödet; bilderna laddas |
| Hemvyn: områdeskorten (medaljer ur lådorna) är ingången till Träna; dörrarna Utforska, Pussel, Samlarpärm och Test; informationsknapp till bildkällorna (75 rader) | D29, D30 | Flödet; två tryck till första frågan |
| Träna <område>: ordningen (Blandad förvald, Norr till söder) och fyra lägen där ett tryck startar | D30, D33, D34 | Flödet; inget val förekommer två gånger |
| Nötloop som i gångertabellen; Nästa efter rätt svar; standardiserad faktaruta (sköld, Stad/Djur/Blomma i tabell, särskild rad vid rang 1, 2, 24 eller 25) | D30–D32 | 25 landskap × alla bekräftelser: inget klipps; det högsta är 103 av 117 px; Nästa står på y 778 |
| Pussel: områdesval med "Med gränser" och "Utan gränser", namn på bitarna, generös snäppradie som bara snäpper till den egna platsen | D32 | 37 kontroller med riktig touch, 85 av 85 släpp, 0 av 55 till grannens plats |
| Samlarpärmen i brons, silver och guld | D30 | Flödet; nivåerna nås genom träning och test |
| Test per område med alla landskap, utan nötloop, kvitto med "Sett av en vuxen" | D30 | Flödet; hela Sverige ger 25 |
| Inga läxboksnummer någonstans | D33 | 943 texter genomsökta; inga nummerbrickor |
| Blandad ordning: ny lottning varje runda, aldrig samma landskap i rad, extratillfället minst två frågor bort | D34 | 500 rundor per läge; korrelation med norr–söder −0,004 |

## Öppna punkter
- **Nivåregeln i pärmen** (brons = övat, silver = kan, guld = alla sex frågetyperna) är mitt förslag. Dennis
  godkände mockupen som helhet, men regeln har inte bekräftats separat. Han skrev tidigare "ett kort låses upp när
  hon kan landskapet". Fråga om brons vid "övat" är rätt.
- **Träffytor i helbild.** I spelets karta med hela Sverige (k ≈ 0,31) är många landskap 22–47 px, och i Norrlands
  vy är fyra landskap 38–41 px. Barnet behöver nypa. Ett nyp ×3 ger alla 43 px eller mer. I Utforskas helbild har
  Dalsland 29 px.
- **Ingenting är provat på en riktig iPhone.** Skydden mot sidzoom och textmeny i Safari (`gesturestart`,
  `-webkit-touch-callout`, `touch-action`) är bara verifierade i Chromium.
- **Nålen "Här bor du"** står i Medelpads mitt, eftersom det inte finns någon källa för Sundsvalls läge i kartan.
- **Färgkartans licens** är inte kontrollerad (`referens/README.md`). Det går för en privat app, men den måste
  kontrolleras om appen blir offentlig.
- **Blomplanschernas beskärning** (`FLOWER_Y`) är satt för hand efter en kontaktbild av alla 25. Kontrollera den
  igen om bilderna byts.
- **Extratillfället i slutet av en runda.** När det inte finns plats två frågor bort hamnar det sist och kan då
  komma direkt efter. Det fallet är inte provat.
- **Resan genom Sverige och Vem är jag?** väntar enligt D27.

## Kalibrering

**Servrar och verktyg**
- Mockupen serveras från repots rot: `http://127.0.0.1:5420/design-lab/geografi-mockup.html`; på telefon
  `https://macbook-pro.tail3c8e5a.ts.net:8446/…`. Den hämtar `../referens/…` med fetch, så den fungerar inte som
  `file://`.
- **Känt falsklarm:** webbläsarpanelen spärrar adresser som inte är localhost. Tailscale-adressen ser därför trasig
  ut i panelen fast den fungerar på telefonen (den svarade 200). Panelens koordinatklick hamnar fel under emulering;
  driv i stället med `element.click()` eller Playwright.
- Playwright 1.63 finns i `~/.npm/_npx/e41f203b7505f1fb/node_modules`. Kör med
  `NODE_PATH=… node skript.cjs`. Kontexten är 390 × 844 med `hasTouch`, `isMobile` och `deviceScaleFactor` 2.
- Skripten från 19/10 låg i sessionens scratchpad (`…/scratchpad/geo2/`: `t-map.cjs`, `t-flow3.cjs` via
  `gen3.py`, `t-pussel.cjs`, `t-blanda.cjs`, `t-ruta5.cjs`). De försvinner med sessionen, och metoden står nedan.

**Gester**
- Använd riktig touch via CDP: `Input.dispatchTouchEvent` med en eller två `touchPoints`. Det ger äkta
  pekarhändelser och prövar `touch-action` och markering.
- Kontrollerna:
  - panorering
  - glid och tryck under glid
  - studs
  - nyp (punkten mellan fingrarna ska stå still, 0,0 px)
  - zoomtak och zoomgolv
  - dubbeltryck (ingen zoom, ett val)
  - tryck med två fingrar
  - långt tryck (`getSelection()` tom)
  - `visualViewport.scale` = 1
  - mushjul
- `MOCK.ptr`, `MOCK.tapNr` och `MOCK.drop` skickar syntetiska PointerEvents genom samma kedja. De duger för
  flöden men inte för att pröva bieffekter.

**Träffytor**
- `MOCK.hitReport(mapKey)` kör samma `hit()` på ett rutnät med 2 px steg. "disc" är den största cirkel som ryms i
  landskapets träffyta.
- Mät i den vy barnet faktiskt ser (spelets karta passad på området), inte bara i Utforska.

**Faktarutan**
- Med `justify-content: space-evenly` ligger sista barnets underkant alltid i botten. Mät därför summan av barnens
  höjder mot tillgänglig höjd, och kontrollera dessutom att inget barn ligger utanför rutan.
- Mät också bredden: `scrollWidth` mot `clientWidth`, och högerkanten mot rutans högerkant.
- Kör alla 25 landskap × båda lovorden × alla bekräftelser (`MOCK.boxMain`). Kontrollera att Nästa står på samma y.
- Jämför kartans storlek mot förra committen: `git show <commit>:design-lab/geografi-mockup.html >
  design-lab/_tmp-forra.html`, mät, och ta bort filen direkt efteråt.

**Pusslet**
- Pröva alla bitar i alla områden med riktig touch: släpp inom 0,85 × radien åt ett slumpat håll (ska snäppa) och
  på närmaste grannens mitt (ska inte snäppa). Under 24 px grannavstånd (Dalsland/Bohuslän, Öland/Blekinge i hela
  Sverige) snäpper biten ändå, till sin egen plats.

**Kända falsklarm i egna tester**
- `innerText` ger versaler där CSS har `text-transform: uppercase` ("SETT AV EN VUXEN"). Matcha skiftlägesokänsligt.
- `fill` och `stroke` har en övergång på 0,45 s. Läs computed style först efter minst 0,5 s.
- Skärmbilder tagna precis efter `goto` fångar intoningen. Vänta cirka 0,7 s.
- I testläget är Nästa dold medan det lugna fel-steget pågår. Ett klick då ignoreras, vilket inte är ett fel i
  appen.
- Landskapskortet, som ligger utanför bild när det är stängt, räknas av en naiv kontroll av "sticker ut under
  kanten". Undanta `.sheet:not(.on)`.
- `texts.json` skrivs bara i slutet av flödesskriptet. Kraschar körningen ligger en gammal fil kvar.
- I `t-map` står träffytorna under 44 px som FEL. Det är kända mätvärden (se Öppna punkter), inte regressioner.

**Svårt**
- Träffytor för små landskap i helbild.
- Att få den fasta faktarutan att rymmas utan att kartan krymper.
- Att anpassa testskript efter varje ny runda, där en dubblerad ersättningsankare gav tysta missar.

## Nästa steg (när mockupen byggs in i appen)
1. Tagga `fore-geografi` på `dev` och bygg på en egen gren som mergas `--no-ff` (D9). Lägg till modulens rad i
   `.project-context/DESIGN.md` med dess lagringsnycklar.
2. **`createDrill` avviker.** Mockupens kopia har D34-placeringen av extratillfället (minst två frågor bort, inte
   bredvid samma landskap). Det måste föras in i `js/shared.js` (`MP.createDrill`) med ett test, och resten av
   appens användare av `createDrill` måste prövas. Samma sak gäller `spreadShuffle` (ny lottning, aldrig samma
   landskap i rad), som bör bli en delad hjälpare.
3. **Tillgångar.** Flytta bilderna (vapen, blommor, djur) och JSON-filerna från `referens/` till appens tillgångar,
   lägg dem i service workerns cache (`sw.js`) och höj `APP_VERSION` och `CACHE_VERSION`. Kartan läses i dag med
   fetch ur `referens/sveriges-landskap-farg.svg`. Bildkällornas vy ska läsa den flyttade `bilder.json`.
4. **Koppla till appen:**
   - lådorna (`MP.spaced`) per profil i `localStorage`, en låda per landskap, och frågetyperna per landskap för guld
   - Capybarakorten (D14), där det passar med pärmens nivåer
   - kvittot och "Sett av en vuxen" till appens logg
   - medaljerna (`MP.medalSVG`)
5. **Tester (vitest)** för den rena logiken:
   - `hit()`-reglerna
   - `snapRadius`
   - `specialFacts` (de sju landskapen)
   - `level()`
   - `spreadShuffle`
   - `buildItems`/`buildTest`
   - språkgenomläsningen (`allTexts`)

   Därtill en kontroll av rutans höjd och bredd, och av att inget scrollar.
6. UI-test som PWA på iPhone 17e i simulatorn, särskilt gesterna i Safari och att sidan inte zoomar.
7. Ta upp de öppna punkterna ovan med Dennis innan release, särskilt nivåregeln.
