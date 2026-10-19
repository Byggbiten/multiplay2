# Överlämning – Geografi (levande expert)

**Roll:** byggde Geografi-mockupen (`design-lab/geografi-mockup.html`) och byggde in den i appen. Kan granska,
rätta och bygga vidare på modulen.
**Datum:** 2026-10-19.
**Läge:** Geografi är **live i v66** (Dennis: "livesätt v66"). `main` = `5349f5a`; återställningstaggen är
`live-fore-v66`. Grenen `geografi` är sammanslagen i `dev` (`4010076`) och borttagen lokalt och på GitHub; det
finns inga grenar kvar för modulen. Arbetet sker på `dev`. Byggets commits: `d1785ce` tillgångarna och datan,
`886cdfb` delad logik (`MP.createDrill` med `opts.sameKey`, `MP.spreadShuffle`, Capy), `61f4222` ren logik med
tester, `b90fec8` modulen och inkopplingen, `e18ec96` startsidans kortmått, `5d870e9` dokumenten.

## Läs först
1. `CLAUDE.md`, sedan `.project-context/DECISIONS.md` D22–D36 (D30–D34 ändrar mycket i D24–D29; D35 bygget,
   D36 integriteten och hemlandskapet).
2. `logg/2026-10-19.md`, avsnitten om Geografi, sist "Geografi inbyggd i appen".
3. `.project-context/DESIGN.md`, Geografi-raden och lagringsnycklarna.
4. Koden:
   - `js/geografi-logic.js`: den rena logiken (texter, urval, nivåer, snäppradie, validering), testad.
   - `js/geografi.js`: vyerna, kartmotorn `GeoMap`, pusslet, lagringen, Capy-krokarna, `_test`.
   - `js/geografi-data.js`: genererad, redigeras inte för hand (se nedan).
5. `referens/sverige-landskap/README.md` (källor, licenser, generatorn) och `agenter/geografi/LOGG.md`.

## Hur modulen är byggd

| Del | Var | Anmärkning |
|---|---|---|
| Data | `js/geografi-data.js` (`window.GEO_DATA`) | Genereras: `python3 -I referens/sverige-landskap/gen-geografi-data.py "$PWD"`. Kontrollerar namn och att bildfilerna finns. |
| Kartan och bilderna | `assets/geografi/sverige/{karta.svg,vapen,blommor,djur}` | `sw.js` förcachar kartan och modulens JS; bilderna cachas vid första användningen. |
| Ren logik | `js/geografi-logic.js` (`window.GeoLogic`, även CJS) | `buildItems`, `buildTest`, `createDrill`, `levelOf`, `nextLevelText`, `snapRadiusPx`, `validState`, `validSettings`, `allTexts` m.fl. |
| Vyerna | `js/geografi.js` (`GeoGame.init(profil)`) | En IIFE som bygger allt i `#geo-root` första gången; id:n har prefixet `g-`, klasserna `gb`/`gc`/`gs`/`mchip`/`gmodal` (inte mockupens `btn`/`card`/`screen`/`chip`/`modal`). |
| Lagring per profil | `geo_state_`, `geo_settings_`, `geo_puzzle_`, `geo_log_` | Rensas i `Store.deleteProfile`; loggen ger statuschippet (`GAME_LOG_KEYS.geografi`). |
| Hemlandskapet (D36) | Kugghjulet i Geografi-menyn → Inställningar | Inget från början; nålen i landskapets mitt och "Här bor du" bara för det valda. |
| Capy | `js/capy.js` | Pass och test med `module:'geo'`; guld i pärmen = händelsen `landskap` (köas, en gång per landskap, `st.geoLand`). |
| Delat | `js/shared.js` | `MP.createDrill(items, r, { sameKey })` och `MP.spreadShuffle`; utan `opts` exakt som förut. |
| Startsidan | `index.html`, `styles/app.css` | Brett kort under de sex. Mobilens spelkort 132 px (förut 156), korta höjden 90 (förut 104), det breda minst 44. |
| Dagens träning | `js/daily.js` (orörd) | `MODULES = ['mult', 'clock']`; Geografi ingår inte (D20), ett test vakar. |

## Verifierat 19/10 (före releasen)
- vitest 372 av 372 (39 i `tests/geografi.test.mjs`; de 333 äldre oförändrade).
- Dev-spegeln, Playwright med riktig touch via CDP: flödet 88 av 88, gesterna 35, pusslet 38 av 38, appens delar
  30 av 30, Gångertabellen och Klockan startar utan scroll och konsolfel. iPad 820 × 1180 och 1180 × 820: inget
  sticker ut.
- iOS-simulatorn, iPhone 17e som PWA (Appium/XCUITest, riktiga tryck): se loggen. Startsidans scroll hittades här.

## Öppna punkter
- **Nivåregeln i pärmen** (brons = övat, silver = kan, guld = alla sex frågetyperna) är mitt förslag och inte
  bekräftad av Dennis separat. Fråga om brons vid "övat" är rätt.
- **Startsidans lägre spelkort** (156 → 132 px på mobil, korta höjden 104 → 90) påverkar alla moduler på
  startsidan. Behövdes för att sju kort ska rymmas utan scroll som PWA. Dennis provar det i v66.
- **Träffytor i helbild.** I spelets karta med hela Sverige är många landskap under 44 px (Medelpad 29, Dalsland 24);
  barnet behöver nypa. Samma värden som i mockupen.
- **Capy-överlägget** kommer över resultatet efter pass och test, som i de andra modulerna. Det täcker kvittots
  håll-knapp tills det stängs.
- **Bildkällorna och färgkartans licens** se `referens/README.md`; kartans licens är inte kontrollerad.
- **Extratillfället i slutet av en runda** (när det inte finns plats två frågor bort) är inte provat i appen.
- **Ingen riktig iPhone** är provad av mig; simulatorn ersätter den inte för Safaris gester fullt ut. Dennis
  synpunkter från telefonen avgör.
- Resan genom Sverige och Vem är jag? väntar enligt D27.

## Kalibrering

**Servrar och verktyg**
- Mockupen serveras från repots rot: `http://127.0.0.1:5420/design-lab/geografi-mockup.html`; på telefon
  `https://macbook-pro.tail3c8e5a.ts.net:8446/…`. Den hämtar `../referens/…` (JSON) och `../assets/geografi/…`
  (kartan, bilderna) med fetch, så den fungerar inte som `file://`.
- **Känt falsklarm:** webbläsarpanelen spärrar adresser som inte är localhost. Tailscale-adressen ser därför trasig
  ut i panelen fast den fungerar på telefonen (den svarade 200). Panelens koordinatklick hamnar fel under emulering;
  driv i stället med `element.click()` eller Playwright.
- Playwright 1.63 finns i `~/.npm/_npx/e41f203b7505f1fb/node_modules`. Kör med
  `NODE_PATH=… node skript.cjs`. Kontexten är 390 × 844 med `hasTouch`, `isMobile` och `deviceScaleFactor` 2.
- Skripten från 19/10 låg i sessionens scratchpad och finns inte kvar: `geo2/` mot mockupen, `geo3/` mot appen
  (`lib.cjs` med `openApp()`, som lägger en `window.MOCK`-yta över `GeoGame._test` så att mockupens tester går mot
  appen; `t-flow3`, `t-map`, `t-pussel`, `t-app`, `t-mc`, `t-start4`), `sim/` för simulatorn (`simlib.py`, `s2.py`).
  Metoden står här; bygg om skripten efter den.
- **Appen:** dev-spegeln synkas med rsync enligt CLAUDE.md (kommandot undantar numera även `_privat/`) och serveras på :5312 av `~/multiplay-dev-server.py`
  (no-store). Testprofil via `localStorage` eller `Store.addProfile`, sedan `App.selectProfile(id)` och
  `App.startGame('geografi')`. `GeoGame._test` har `goto`, `answer`, `drop`, `preset`, `setToday` (datumkroken),
  `box`, `level`, `MAPS`, `MEAS`, `PL`, `PZ`. Stäng Capy-överlägget (`Capy._close()`) före riktiga tryck efter ett
  pass eller test.
- **Simulatorn:** iPhone 17e `3C0FE374-…` har webclipen MULTIPLAY (localhost:5312). `appium --port 4723`, sedan
  `~/arbetskopia/apps/Byggbiten-Liggare/.project-context/uitest/appiumlib.py`: `new_session(udid)`,
  `open_webclip('MULTIPLAY')`, `webview()`, `js()`. Riktiga tryck med W3C-actions i NATIVE-läget; webbvyns
  överkant ligger 47 pt ned (844 − innerHeight 797). Sessionen dör efter cirka en minut utan kommando – skapa en ny.
  Dubbeltryck måste skickas som en enda action-kedja, annars blir det två separata tryck.
- **Startsidan mäts i PWA-höjden** 390 × 797, inte bara 844.

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

## Nästa steg
1. **Dennis synpunkter på v66** (telefonen, startsidans kortmått, nivåregeln i pärmen) tas in som D-poster och
   rättas på `dev`, med release enligt CLAUDE.md.
2. **Nästa del av Geografi enligt D24:** inom Sverige sjöar eller städer, därefter Europa (länder, var de ligger,
   huvudstad, flagga, invånare) och de andra valen i menyn. Samtalet med Dennis kommer före mockupen (lärdomen från
   runda 0), och kartmotorn, lådorna, pärmen och testet återanvänds.
3. Ändras datan: redigera `referens/sverige-landskap/*.json`, kör generatorn och testerna.
