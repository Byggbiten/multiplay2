# Lärdomslogg – Geografi

En post per runda: vad som inte fungerade och varför, vad lösningen blev, och vad rollen lärde sig.

---

## Runda 0 · 2026-10-19 · Första mockupen (`brainstorm/07`), före samtalet
*(Den här rundan gjordes före rollens tid och är återgiven ur loggen 19/10.)*
- **Vad som inte fungerade:** mockupen byggdes innan Dennis hade beskrivit hur han tänkte. Hans kommentar: "lite för
  snabb med att bygga mockupen innan vi hade brainstormat". Upplägget (Lär dig per landsdel, tre frågetyper i varv,
  läxbokens nummer i centrum) fick i stort sett göras om.
- **Varför:** en ny modul byggdes som facit utan ett samtal om Dennis bild av den.
- **Lösning:** samtalet (`brainstorm/08`) och beslut D24–D29 före nästa mockup.
- **Lärdom:** vid en ny modul kommer samtalet före mockupen. Den lärdomen finns redan i `AGENT_CONTEXT.md`.

## Runda 1 · 2026-10-19 · Mockupen omgjord efter D24–D29 (`7cbe5d5`)
- **Vad som inte fungerade:**
  - **Träffregeln.** "Litet landskap vinner inom en kant runt hela sig" tog för mycket från grannarna: Hälsingland
    fick 26 px i helbild. Det syntes först när träffytan mättes i ett rutnät, inte när trycken prövades i varje
    landskaps mitt (25 av 25 träffade rätt även med den dåliga regeln).
  - **Krasch från Upptäck direkt till Test.** Kartans `reset` körde den gamla vyns namnregel mot det nya
    tillståndet. Felet syntes bara i den följden av vyer.
  - **Språket.** Där stod "Visby ligger i Gotland" (öar tar "på"), "Du har lagt hela hela Sverige" och den klumpiga
    meningen "Skölden är Blekinges".
  - **Upptäck avslöjade svar.** Minnesstödet lyste upp och namngav grannar som ännu låg i dimma.
  - **Testets fel-steg** saknade tokenkontroll efter kamerarörelsen.
  - **Blomplanschernas beskärning.** Med ett enda värde för alla 25 försvann blomman i fem av dem.
- **Varför:** kontrollerna jämförde bara punkter, inte ytor. Flödet prövades skärm för skärm och inte i följd.
  Texterna lästes inte samlat. Beskärningen kontrollerades bara på Medelpad.
- **Lösning:**
  - Träffen: en skiva på 44 px runt det lilla landskapets mitt, och kanten bara ute i havet. Mätt med
    `hitReport`.
  - `reset` nollar namnregeln först.
  - `inL()` för "på" vid öar.
  - Minnesstödet lyser bara upp grannar som redan är hittade.
  - `FLOWER_Y` per plansch, satt efter en kontaktbild av alla 25.
- **Lärdom:**
  - Mät ytor, inte bara punkter.
  - Kör flöden genom flera vyer i följd.
  - Läs `allTexts()` i sin helhet.
  - Granska hela beståndet när en enskild bild ser rätt ut.

## Runda 2 · 2026-10-19 · D30: Dennis första prov (`e1a1b27`)
- **Vad som inte fungerade:**
  - **Dubbelval.** Man valde ett läge och fick sedan samma val en gång till.
  - **Faktan efter rätt svar.** Den roterade och visade inte det Dennis ville se (största till ytan, skölden).
  - **Dubbeltryck.** Det zoomade.
  - **Testet.** Det tog bara tio frågor och inte hela området.
  - **Pärmen.** Den hade bara upplåst eller låst.

  Allt detta var val jag hade gjort själv och lagt fram som "val att döma". Några av dem blev fel.
- **Inom rundan:**
  - Faktarutans värsta fall (rätt efter fel + "kommer tillbaka" + lång fakta) behövde 142 px mot 104.
  - Mitt eget testskript klickade Nästa innan det lugna fel-steget var klart, och det såg ut som ett fel.
- **Varför:** frågor om interaktionen ställdes inte före bygget:
  - Ska ett rätt svar gå vidare själv?
  - Var väljer man område?
  - Ska dubbeltryck zooma?
  - Vad räknas som framsteg i pärmen?
  - Hur många frågor har testet?
- **Lösning:**
  - Områdeskorten blev ingången, och ett tryck startar.
  - Dubbeltryck zoomar inte; ett andra tryck på samma ställe inom 350 ms ignoreras.
  - Pärmen fick brons, silver och guld.
  - Testet tar alla landskap i området.
  - "Kommer tillbaka" flyttades till frågan, så att faktarutan räcker.
- **Lärdom:**
  - Lägg fram interaktionsvalen som konkreta frågor med en bild före bygget, inte som en lista efteråt.
  - När ett testskript ger fel, kontrollera först om skriptet väntar på samma sak som barnet ser, t.ex. att
    knappen syns.

## Runda 3 · 2026-10-19 · D31: standardiserad faktaruta (`dea8247`)
- **Vad som inte fungerade:** höjdmätningen sa att alla 300 kombinationer rymdes, men skärmbilden av Öland visade
  att "Ölandssolvända" klipptes i högerkanten.
- **Varför:** mätningen kontrollerade bara höjden. `overflow: hidden` gömde bredden.
- **Lösning:** mätningen kontrollerar nu också bredden (`scrollWidth` mot `clientWidth`, och högerkanten mot rutans
  kant). Djurkolumnen tar sin naturliga bredd, och etiketterna blev mindre.
- **Lärdom:**
  - En ruta kan läcka åt två håll; mät båda.
  - Titta alltid på minst en skärmbild av det värsta fallet, även när siffrorna är gröna.

## Runda 4 · 2026-10-19 · D32: pusslet och faktarutan som rutnät (`69744bf`)
- **Vad som inte fungerade:**
  - **Pusslet var för lätt.** De streckade inre gränserna visade var bitarna skulle ligga, och bitarna hade inga
    namn.
  - **Pussel-valet.** Med nivåknapparna sköts den nedre raden in under bubblan.
  - **Faktarutans mätning.** Med `space-evenly` ligger sista barnet alltid i botten, så mätningen gav 117 av 117 och
    var meningslös.
  - **Faktarutans värsta fall.** Lovordet efter fel plus en lång svarsmening blev tre rader.
  - **Snäppradien.** Den behövde ett golv. Dalsland/Bohuslän (13 px) och Öland/Blekinge (22 px) ligger närmare
    varandra än så i hela Sverige.
- **Varför:**
  - Pusslets svårighet hade aldrig prövats ur barnets synvinkel.
  - Den nya vyn hade ingen kontroll av att knapparna syns.
  - Mätmetoden förutsatte att innehållet låg överst i rutan.
- **Lösning:**
  - Ytterkonturen ritas som ett eget lager, och landskapens fyllning med kant i samma färg täcker de inre
    gränserna.
  - Två nivåer, "Med gränser" och "Utan gränser".
  - Namnet följer med ovanför fingret.
  - Radien är min(max(40 px, halva minsta måttet), 70 % av grannavståndet), med golv på 24 px.
  - Rutnätet i pussel-valet fick `minmax(0, 1fr)`, och en kontroll att alla knappar syns.
  - Rutans höjd mäts som summan av barnens höjder.
  - En kort bekräftelse i rutan (`boxMain`).
- **Lärdom:**
  - Pröva varje bit också "på grannens plats", inte bara på sin egen.
  - Varje ny vy får en kontroll av att allt syns.
  - Byt mätmetod när layouten ändras.

## Runda 5 · 2026-10-19 · D33 och D34: inga nummer, blandad ordning (`0728948`)
- **Vad som inte fungerade:**
  - **Numren.** Läxbokens nummer fanns i hela mockupen (kartan, kortet, pärmen, Vad heter det?), men de var bara en
    tillfällighet i en läxa.
  - **Ordningen.** Rak ordning norr till söder var förvald och kändes förutsägbar.
  - **Mitt testskript.** Det byggs ur en generator, och en ersättning med ett dubblerat ankare misslyckades tyst, så
    den gamla versionen kördes. När körningen sedan kraschade låg ett gammalt `texts.json` kvar och såg ut som nya
    fynd.
- **Varför:**
  - Jag tog D22:s siffror som en bärande del av modulen utan att fråga om de skulle vara kvar efter läxan.
  - Rak ordning valdes som förval för att den var lätt att verifiera, inte för barnets skull.
  - Generatorn kontrollerade inte att varje ersättning faktiskt gjordes.
- **Lösning:**
  - Numren är borttagna överallt, och ordningen heter "Norr till söder".
  - `spreadShuffle`: ny lottning varje runda, aldrig samma landskap i rad.
  - Extratillfället placeras minst två frågor bort och inte bredvid samma landskap.
  - Ett eget blandningstest: 500 rundor per läge, korrelation −0,004 med norr–söder.
  - Generatorns ersättningar kontrolleras med räkning av ankaret.
- **Lärdom:**
  - Fråga om underlagets tillfälligheter: "ska X vara kvar efter läxan?"
  - Förvalet ska tjäna barnet, inte testet.
  - Lita aldrig på en utdatafil från en körning som kraschat.

## Runda 6 · 2026-10-19 · Bygget in i appen (D35, D36), grenen `geografi` (`d1785ce`–`e18ec96`)
- **Vad som inte fungerade:**
  - **Firandets knappar** gjorde ingenting: mallarnas klassnamn hade döpts om (`btn` → `gb`), men selektorn
    `.cbtns .btn` i samma funktion hade inte det.
  - **Pusslet kraschade** på mockupens `$('app')`, som inte finns i appen.
  - **Startsidan scrollade som PWA.** Med sju kort mätte Chromium i 390 × 844 utan scroll, men i simulatorn
    (390 × 797, statusraden tar 47 px) scrollade sidan 24 px och det breda kortet trycktes ihop till 22 px.
  - **Capy-överlägget** låg över resultatet och tog de riktiga trycken i testet; det är appens vanliga beteende,
    inte ett fel i modulen.
  - Första dubbeltrycket i simulatorn mätte fel: två separata action-anrop med kontextbyte emellan blev två tryck
    med för lång paus, och kartans zoom hade ändrats av kortet som öppnades före.
- **Varför:** omdöpningen gjordes med textersättning på kända mallar, inte på alla selektorer. Startsidan mättes bara
  i webbläsarens höjd, inte i PWA:ns.
- **Lösning:**
  - Selektorn rättad och `$('app')` → `ROOT`; ett test söker nu efter mockupens gamla klassnamn i selektorer och
    `$('app')`, och det fångar båda felen i den obearbetade versionen.
  - Geografi som brett kort; mobilens spelkort 132 px (förut 156), den korta höjden 90 (förut 104), det breda minst
    44. Mätt i tio storlekar med och utan Dagens träning.
  - Mockupens tester gick mot appen genom en `window.MOCK`-yta över `GeoGame._test`: 88 + 35 + 38 kontroller, plus
    30 för appens egna delar.
- **Lärdom:**
  - Vid inbyggnad av en mockup: döp om klasser i ALLA strängar som är selektorer, och låt ett test leta kvarlevor.
  - Mät startsidan och varje vy i PWA-höjden (390 × 797) innan "ingen scroll" påstås.
  - Mockupens tester är värda att återanvända: en tunn kompatibilitetsyta gav full täckning direkt.

## Runda 7 · 2026-10-19 · Releasen v66 och sammanslagningen
- **Vad som hände:** Dennis sa "livesätt v66". Grenen `geografi` slogs samman i `dev` (`4010076`) tillsammans med
  grenen `integritet` (rensningen enligt D36: personan Mira, barntest och rollspel), och båda grenarna togs bort
  lokalt och på GitHub. `main` = `5349f5a`, återställningstaggen `live-fore-v66`. Under sammanslagningen rensades
  `referens/README.md` från sökvägar till hämtade filer, och dev-spegelns synk undantar nu `_privat/`.
- **Vad som inte fungerade:** min överlämning beskrev ett läge (gren, inte mergad) som var inaktuellt så snart
  releasen gjordes, och handlingslistan pekade på en granskning av en gren som inte längre finns.
- **Lösning:** överlämningen omskriven efter releasen: v66 live, inga grenar, de öppna punkterna och nästa steg
  (Dennis synpunkter, nästa del av Geografi enligt D24).
- **Lärdom:** en överlämning skrivs om vid varje milstolpe (release, sammanslagning), inte bara när rollens eget arbete
  är klart; läget i den ska gå att kontrollera mot `git log` och taggarna.

## Genomgående lärdom (sju rundor)
Flera rundor gav nya önskemål som en tidigare fråga hade kunnat fånga:
- Ska ett rätt svar gå vidare själv?
- Ska rutan vara fast eller rotera?
- Ska dubbeltryck zooma?
- Hur många frågor ska testet ha?
- Ska numren vara kvar?
- Blandat eller i ordning som förval?
- Hur svårt ska pusslet vara?

Nästa gång, före bygget: gå igenom varje interaktion och varje förval med Dennis med en bild eller en klickbar skiss,
och fråga särskilt om det som kommer från ett tillfälligt underlag. Det sparar rundor.
