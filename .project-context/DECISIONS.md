# DECISIONS — varför vi valde vad

En post per beslut: datum, beslut, varför, källa = Dennis ordagranna ord. Ändras ett beslut senare får det
nya beslutet en egen post, och den gamla en statusrad (◐ delvis ersatt av Dn). Justering i samma diskussion
märks ✎, beslut på prov ◇. Inget raderas.

Datum = när Dennis skrev det, enligt sessionens tidsstämplar (svensk tid). Där en spec eller kodkommentar
daterar annorlunda (kort division "23/9") gäller datumet här.

## Innehåll

**Grunden (sommaren 2026)**

- D1 Renovering 2026 ◐ · *delvis ersatt → D14, D20*
- D2 Levande minnessiffror

**Uppställning och division (21–23/9)**

- D3 Räkna med hjälp stegas med klick, ingen autouppspelning
- D4 Lägenas roller
- D5 Kort division med tabellrad ◐ · *Räkna själv → D6*
- D6 Räkna själv i division
- D7 Samma för multiplikationens Räkna själv
- D8 Klar-knappens glans tas bort i alla moduler

**Gångertabellen (23/9)**

- D9 Gångertabellens mockup in i dev med möjlighet att ångra ◐ · *hemvyn → D12, D15*
- D10 Omvända frågor i flerval
- D11 Påfyllning över tid
- D12 Övningspass med nötloop och kvitto
- D13 Upp till 10:an är standard, 11 och 12 är extraval
- D14 Capybarakort i silver och guld i stället för nya kort
- D15 Hemvyn: kompakt karta, snabbval 1–10 med medaljer, lektionen i Lär dig strategin
- D16 Läget De svåra talen
- D17 Flervalets plats lottas

**Klockan och Dagens träning (23–24/9)**

- D18 Klockans trappa ✎ · *lektionerna → D19*
- D19 Animerade klocklektioner
- D20 Dagens träning bara för gångertabellen och klockan

**Repot och nästa modul (19/10)**

- D21 Ordning och reda införs i repot
- D22 Ny modul Geografi, som börjar med Sveriges landskap
- D23 Sammanslagna grenar på GitHub tas bort
- D24 Geografi → Sverige → Sveriges landskap (struktur) ✎ menyn i Geografi
- D25 Städerna: största staden, plus en väsentligt stor stad där den finns
- D26 Sköldar och blommor laddas ner från Wikimedia ✎ även djuren
- D27 Sveriges landskap, första versionen: spellägena, pusslet och samlarpärmen

---

## D1 · 2026-07-02 · Renovering 2026
- **Status:** ◐ delvis ersatt av **D14** (belöningssystemet: capybarakorten uppgraderas till silver och guld) och
  **D20** (den adaptiva träningen, Dagens träning, gäller bara gångertabellen och klockan). Planen är genomförd
  till och med Fas 4; se avbockningen överst i `PLAN-RENOVERING.md`.
- **Beslut:** fasplanen i `.project-context/PLAN-RENOVERING.md`: designlabb med låst målbild, tre nya funktioner
  (adaptiv träning, Plus & Minus, belöningssystem 2.0), retry-köns låsta semantik, designlagarna (en vy = en
  skärm, klockans färgkodning).
- **Källa:** PLAN-RENOVERING.md: "Beslutad av Dennis 2026-07-02 efter fullständig granskning". Hans ordagranna
  ord finns inte i repot.

## D2 · 2026-07-03 · Levande minnessiffror
- **Beslut:** minnessiffran skrivs liten, vilar, används, stryks och står kvar som spår — som på papper. Se
  `.project-context/SPEC-MINNESSIFFROR.md`. Införd i v30.
- **Varför:** Mira räknar rätt men saknar pappersvanan; appen ska nöta in strukturen.
- **Källa:** Dennis 2026-07-03: "bygg det" (enligt SPEC-MINNESSIFFROR).

## D3 · 2026-09-22 · Räkna med hjälp stegas med klick, ingen autouppspelning
- **Beslut:** varje steg i Räkna med hjälp kommer när barnet klickar. Ingenting spelas upp av sig självt.
  "Animeras" betyder att ett klick på Nästa steg sätter igång en rörelse.
- **Varför:** hjälpläget hade börjat köra vandringen själv (`f28a36b` "hjälplägets vandring stegas av barnet,
  inte av en klocka").
- **Källa:** Dennis 2026-09-22 kl. 14.39–14.41: "näe, man ska ju klicka för varje steg. inte att den skall spelas
  som en alldelles för snabb film?" / "Ja, jag förstår inte hur du drog den slutsatsen. det va aldrig på tapeten" /
  "animeras menar jag att man klickar på "nästa steg" så sker en animation där man ser siffrorna röra sig."

## D4 · 2026-09-22 · Lägenas roller
- **Beslut:** Titta och lär visar rutinen och får spolas igenom. Räkna med hjälp är till för att barnet ska vara
  med: trycka fram, placera och välja i rätt ordning. Räkna själv säkerställer att barnet faktiskt kan.
- **Varför:** frågan om faktabrickan i hjälpläget gjorde läget till "läs av brickan" (se P1).
- **Källa:** Dennis 2026-09-22 kl. 17.58: "Räkna med hjälp är mest till för att de skall vara mer involverade. Så
  att upplevelsen är att de trycker på ett svar eller en plats för att komma vidare, och läget är till för att öva
  upp motoriken och ordningen och strukturen och ordningsföljden. Se och lär kan de bara "spola igenom" om de skulle
  vara lata, men här ska räkna själv säkerställa att de faktiskt är med och engagerade"

## D5 · 2026-09-22 · Kort division med tabellrad
- **Status:** ◐ delvis ersatt av **D6** — i Räkna själv skrivs ingen rest (specens §5 sa "barnet skriver den i
  restplatsen").
- **Beslut:** vid varje siffra visar appen den största raden i divisorns tabell som får plats, som ett synligt
  objekt (`6 · 7 = 42`), även när det går jämnt ut. Ersätter ankarvandringen (×2/×5/×10-ankare, 22/9), som aldrig
  blev en egen D-post; se AGENT_CONTEXT. Spec: `.project-context/SPEC-KORT-DIVISION.md`, facit
  `design-lab/kort-division-mockup.html`. Införd i v54.
- **Varför:** ankarna lärde ut två saker samtidigt och läckte i varje kantfall; kopplingen gångertabell ↔ division
  är hela poängen.
- **Källa:** Dennis 2026-09-22 kl. 20.10: "jag tänkt och inser att det här med ankar siffror inte riktigt funkar
  som vi har nu. Jag tror att det är bättre att appen direkt visar utifrån gångertabellen vilket tal som är
  närmast. Dvs. Inte strikt förhålla oss till x2 x5 och x10. Och i de fall där der går jämt ut så skall alltid det
  visas som ankarsiffrorna gör. Tex. På bilden så tror jag barnen lättare förstår kopplingen mellan gångertabellen
  om division om den visar 6x7=42." Godkänd mot mockupen kl. 21.41: "Det här va exakt hur bra som helst. […]
  EXAKT så där vill jag ha det i liveversionen."

## D6 · 2026-09-23 · Räkna själv i division
- **Beslut:**
  - Ingen restinmatning; resten syns i uträkningen när svaret är rätt.
  - Ingen instruktionsruta.
  - En liten livlina under 9:an och under Klar.
  - 0:an lika stor som övriga siffror.
  - Kladden direkt mot sifferinmatningen, utan mellanrum.
- **Varför:** i Räkna själv är barnet beroende av kladden och behöver ytan. Byggt i `a21adf3` (v55).
- **Källa:** Dennis 2026-09-23 kl. 07.25: "i räkna själv så kör vi inte att man skriver in rest själv. Däremot om
  man svarar rätt på hela talet så skall restsiffran synas i uträkningen. […] Jag tycker att den där rutan som
  säger "skriv in kvoten i rutorna efter...." den rutan tar vi bort i räkna själv-läget. Liv-lineknappen får bli
  mycket mindre. kanske att den ligger under 9:an i sifferinmataren och under klar-knappen. så klar blir inte lika
  hög och 0:an blir lika stor som de övriga knapparna. och själva kladd-ytan ska inte ha någon spaceing till
  sifferinmatarkomponenten."

## D7 · 2026-09-23 · Samma för multiplikationens Räkna själv
- **Beslut:** D6 gäller även Räkna själv i uppställd multiplikation. Byggt i `ac66b13` (v56).
- **Källa:** Dennis 2026-09-23 kl. 08.11: "vi gör samma ändringar i multiplikationsmodulens räkna själv-läge"

## D8 · 2026-09-23 · Klar-knappens glans tas bort i alla moduler
- **Beslut:** Klar-knappen glänser inte längre med jämna mellanrum. Byggt i `ac66b13` (v56).
- **Källa:** Dennis 2026-09-23 kl. 08.13: "du kan även passa på att i samtliga moduler ta bort den där animationen
  eller vad det är. det som gör att "klar-knappen" glänser med jämna mellanrum när den inte är helgrön"

## D9 · 2026-09-23 · Gångertabellens mockup in i dev med möjlighet att ångra
- **Status:** ◐ delvis ersatt av **D12** och **D15** — hemvyn ser inte längre ut som i mockupen.
- **Beslut:** `design-lab/gangertabell-mockup.html` förs in i appen. Större ändringar taggas `fore-<namn>` och
  byggs på en egen gren, så att en `git revert -m 1` ångrar dem (regeln i `CLAUDE.md`). Införd i v57.
- **Källa:** Dennis 2026-09-23 kl. 09.42: "nämen jag gillar det du har gjort. Kan du föra in detta i
  dev-versionen?Med möjlighet att ånrga det och återgå till en tidigare version"

## D10 · 2026-09-23 · Omvända frågor i flerval
- **Beslut:** i flerval visas ibland svaret, och barnet väljer gångertalet. Alternativen är grannar i samma tabell,
  bara ett är rätt, och bara kända tal frågas baklänges (ungefär var fjärde fråga), och bara i flerval. Inställningen "omvända frågor" är på som standard.
- **Varför:** Dennis krav var bevis. Faktan lagras i den riktning man övat den, så vägen från svar till faktor måste
  tränas för sig — och den vägen är precis den som divisionen kräver (D5). Stödet är måttligt; se `brainstorm/05`.
- **Källa:** Dennis 2026-09-23 kl. 08.39: "Kanske också vid flervalsinmatning, så skall ibland inte frågan vara
  X * Y = ?, utan att svaret visas. och så skall man välja rätt gångertabell. […] eller är det dumt? det skall bara
  införlivas om det finns bevis för att det är bra"

## D11 · 2026-09-23 · Påfyllning över tid
- **Beslut:** varje tal har en låda (ny, övar, kan). Ett tal blir "kan" efter rätt svar tre olika dagar; därefter
  kommer det tillbaka efter 1, 3, 7, 14 och 30 dagar. Fel på ett kan-tal flyttar det till övar. Reglerna ligger i
  `MP.spaced` i `js/shared.js` och delas med Klockan.
- **Källa:** Dennis 2026-09-23 kl. 09.46: "Så att hon inte klarar dem 1 gång, och sen är de klara för gott. utan att
  de kanske behöver "påfyllning" för att visa att man kan över tid?" — och kl. 09.48: "jag vill ha det"

## D12 · 2026-09-23 · Övningspass med nötloop och kvitto
- **Beslut:** Träna en tabell eller flera i ett övningspass med varv av tre slag: Se svaret först, Flerval och Fri inmatning. Fel svar
  visar svaret, samma fråga kommer direkt igen och en gång till senare i varvet (`MP.createDrill`). Passet slutar
  med ett kvitto med "Sett av en vuxen". Eget matteprov togs bort ur hubben. Byggt i v58.
- **Källa:** Dennis 2026-09-23 kl. 10.21: "tanken är inte att sätta barn på prov, utan tanken är att få dem att
  nöta. Så svarar de fel, så visar appen svaret, sen kommer fråga upp igen direkt efteråt och så skall de försöka
  svara rätt igen. men sen kommer samma fråga upp en gång till randomiserat i efterföljande ordning. […] Kanske att
  det skall heta. Ställ in ett övningspass."

## D13 · 2026-09-23 · Upp till 10:an är standard, 11 och 12 är extraval
- **Beslut:** inställningen "Tabeller och gånger" har standard 10; 11 och 12 väljs till. Byggt i v58.
- **Källa:** Dennis 2026-09-23 kl. 10.41: "Lägg också till att default för appen ska vara upp till 10:ans tabell.
  11 och 12 skall behandlas lite som extra-val."

## D14 · 2026-09-23 · Capybarakort i silver och guld i stället för nya kort
- **Beslut:** de 24 korten får nivåerna Nytt kort, silver och guld (72 belöningar), och varje nivå sparar när och
  varför hon fick den ("Så fick du den"). Byggt i v59.
- **Källa:** Dennis 2026-09-23 kl. 10.23: "Sen att de skall kunna se sin "samling" nånstans, och se "hur de fick
  den/förtjänade den"." — och kl. 10.26: "om man har alla kort, så uppgraderas ett befintligt kort till att bli
  silver, och guld. på så sätt blir våra 24 kort x 3."

## D15 · 2026-09-23 · Hemvyn: kompakt karta, snabbval 1–10 med medaljer, lektionen i Lär dig strategin
- **Beslut:** tabellkartan krymper, och ytan blir snabbval 1–10 med medaljer (Träna en tabell). Lektionen
  "Så krymper tabellen" flyttas till Lär dig strategin. Byggt i v60.
- **Källa:** Dennis 2026-09-23 kl. 13.16–13.21: "Jag klickade på, så krymper tabellen. men jag fattade inte direkt
  vad det va som hände och vad den finns för" / "ytan vi sparar så kan vi göra som ett snabbval, för att välja ne
  tabell och komma direkt till en tabell för att sätta igång och träna? och på dem kan det vara medaljer som vi
  hade innan?"

## D16 · 2026-09-23 · Läget De svåra talen
- **Beslut:** ett eget läge med de 21 paren utan enkel genväg. Byggt i v62.
- **Källa:** Dennis 2026-09-23 kl. 20.34: "den där matrisen som visar vilka tal som man bör lära sig. de 21
  styckna. Det borde finnas ett läga där man jobbar med just dem."

## D17 · 2026-09-23 · Flervalets plats lottas
- **Beslut:** alternativens ordning lottas vid varje visning, och likaså hur många som ligger under och över
  svaret, så att varken platsen på skärmen eller storleksordningen avslöjar rätt svar. Byggt i v61.
- **Källa:** Dennis 2026-09-23 kl. 20.32, Miras fynd: "alla rätta svar på flersvarsinmatningen va nere till
  vänster när hon körde 3:ans tabell. så hon pepprade bara den knappen då hon räknade ut det"

## D18 · 2026-09-23 · Klockans trappa
- **Status:** ✎ kompletterad samma kväll av **D19** (lektionerna).
- **Beslut:** Klockan får en trappa med sju steg och medaljer (hela timmar, halv, kvart, fem/tio/tjugo, runt halv,
  digital tid, hur lång tid), lektioner, minutkarta, dragbara visare, riktade felalternativ och pass med påfyllning
  och kvitto. Byggt direkt i dev utan mockup, v63. Se `brainstorm/06`.
- **Källa:** Dennis 2026-09-23 kl. 21.04: "På klockan finns det bara test. Inte några egentliga ”övningslägen”." —
  och kl. 21.10: "Gör en förbättrad version i dev-mode"

## D19 · 2026-09-23 · Animerade klocklektioner
- **Beslut:**
  - Bindeorden betonas: i/innan, över/gått över.
  - Femminuterssteg räknas ihop: 5 + 5 + 5 + 5 = 20.
  - Minus 12 och 12 + 12 = 24 för digital tid.
  - Referenspunkter: när barn och vuxna går och lägger sig.
  - "Nu får du försöka!" efter varje visning.
  - Fel: "Nästan rätt! Bra försök, låt mig visa!" (✎ Claude: "Nästan rätt!" bara när svaret var nära).
  - Förklaringen kommer även vid rätt svar (✎ Claude: i lektionerna; i Öva bara vid fel).
  Byggt i v64.
- **Källa:** Dennis 2026-09-23 kl. 22.00: "Varför heter det 20 i? Jo för det är 20 minuter kvar Innan kl är 8. […]
  Att visa övningsläge med animationer är guld för barn. Speciellt om det böandas med lite ”Nu får du försöka!” […]
  svarar de fel så säger appen: nästan rätt! Bra försök, låt mig visa!"

## D20 · 2026-09-24 · Dagens träning bara för gångertabellen och klockan
- **Beslut:** Dagens träning plockar ur lådorna (kartorna) i Gångertabellen och Klockan och inget annat. Byggt i v65.
  Ersätter den adaptiva Dagens träning över alla moduler från v33 (D1).
- **Källa:** Dennis 2026-09-24 kl. 07.09: "Eftersom den ligger bland modulväljaren, så är nog uppfattningen att den
  gäller över alla moduler, men jag tycker att den borde bara förhålla sig till gångertabellen och klockan."

## D21 · 2026-10-19 · Ordning och reda införs i repot
- **Beslut:** repot följer `rutiner-och-verktyg/references/15-ordning-och-reda.md`: CLAUDE.md, logg/, TODO.md,
  DECISIONS, OPEN_QUESTIONS, DESIGN och AGENT_CONTEXT i `.project-context/`, brainstorm/ och referens/ med register.
- **Källa:** Dennis 2026-10-19 kl. 07.26: "Jag har ett litet nytt sätt att organisera repot som jag tror att jag
  delvis har skrivit in i /anthropic-skills:rutiner-och-verktyg Jag kallar det ordning och reda."

## D22 · 2026-10-19 · Ny modul Geografi, som börjar med Sveriges landskap
- **Beslut:** en ny modul Geografi. Första delen är Sveriges landskap: siffrorna 1–25 ur Miras läxbok förs in i en
  färgkarta (`Sveriges_landskap_farg.svg`, i Dennis Hämtade filer). Upplägget är öppet (P8).
- **Källa:** Dennis 2026-10-19 kl. 07.26: "Jag vill ha en till modul. Geografi. Jag tänkte att vi börjar med
  Sveriges landskap […] I den så har de angett i siffror. Så jag tänker att vi för in siffrorna i den där bilden jag
  hittade."

## D23 · 2026-10-19 · Sammanslagna grenar på GitHub tas bort
- **Beslut:** grenar som redan finns i `dev` tas bort på GitHub, så att repot inte bär redundanta grenar. Kvar:
  `main` (live, GitHub Pages), `dev` och `renovering` (25 egna commits). Utfört 19/10: capy-nivaer, dagens-v2,
  flerval-ordning, gangertabell-pass, gangertabell-v2, klocka-v2, klocklektioner, master, svara-talen och tabellval –
  var och en kontrollerad att ha 0 commits utanför `origin/dev`; Pages publicerar från `main`. Lokalt rensat på samma
  sätt (`git branch -d`). Framöver: en egen gren tas bort lokalt och på GitHub när den är sammanslagen i `dev`;
  återställningstaggarna `fore-*` och `live-fore-*` står kvar.
- **Varför:** ordning och reda – inga redundanta filer eller grenar som "spökar".
- **Källa:** Dennis 2026-10-19: "Om det inte är något som är av vikt så kan du ta bort dem. Jag vet inte vad de är
  eller varför det finns, men som sagt. tanken med ordning och reda rutin är som sagt att hålla välstädat repo, och
  att inte redunanta filer ligger kvar och spökar"

## D24 · 2026-10-19 · Geografi → Sverige → Sveriges landskap (struktur)
- **Beslut:** huvudmodulen heter **Geografi**. Första delen heter **Sverige**, och dess första innehåll är **Sveriges
  landskap**. Sverige byggs senare ut (t.ex. sjöar, städer). Geografi byggs ut med fler delar: Europa (länder, var de
  ligger, huvudstad, flagga, invånare – "väldigt kort-fakta"), Asien, Afrika, Nordamerika, Sydamerika, Oceanien,
  världshaven. Inom Sveriges landskap: läroläge (Utforska, landskapskort), träning per landsdel eller hela Sverige i rak
  eller blandad ordning, kartan med dra och nyp-zoom som Apples kartor utan bieffekter, svårare steg (städer, djur),
  Test utan stress, nötning som i gångertabellen, och "Upptäck Sverige" där landskapen färgläggs som i memory.
  Ersätter mockupens upplägg i `design-lab/geografi-mockup.html` (från `brainstorm/07`); se `brainstorm/08`.
- **Källa:** Dennis 2026-10-19: "Huvudmodulen heter geografi - och denna ska heta Sverige. Och sen väl i sverige kanske
  man bygger ut den med diverse. Nu är det sveriges landskap. Senare kanske det är sjöar eller städer mm." Riktningen i
  övrigt: hans meddelande samma dag, återgivet i `brainstorm/08`.
- ✎ **2026-10-19, menyn i Geografi:** ett tryck på Geografi visar ett nytt val med egna, valbara moduler: **Sverige,
  Europa, de andra världsdelarna (Asien, Afrika, Nordamerika, Sydamerika, Oceanien), Hela världen och Världens hav.**
  Varje val är en egen modul i Geografi. Källa: Dennis: "Geografi med Europa och de andra världsdelarna mm, det blir som
  egna valbara moduler i geografi. … klickar på geografi -> Sedan väljer man ett nytt val där. de olika valen är:
  Sverige, Europa, och så de andra världsdelarna och hela världen. Världens hav"

## D25 · 2026-10-19 · Städerna: största staden, plus en väsentligt stor stad där den finns
- **Beslut:** varje landskap får sin största stad. Ligger ytterligare en väsentligt stor stad i landskapet tas den med
  (t.ex. Uppland: Stockholm och Uppsala). Listan tas fram med källa och godkänns av Dennis.
- **Källa:** Dennis 2026-10-19: "Ta den största staden - men använd din AI-hjärna ifall en väsentligt stor stad också
  ligger där. t.ex. som Stockholm som är största stad och huvudstad, men uppsala är för liten för att ignorera."

## D26 · 2026-10-19 · Sköldar och blommor laddas ner från Wikimedia
- **Beslut:** landskapssköldar och landskapsblommor hämtas som bilder från Wikimedia Commons, med licens och källa
  antecknade per fil i `referens/`.
- **Källa:** Dennis 2026-10-19: "Ja, ladda ned fårn wikimedia".
- ✎ **2026-10-19:** landskapsdjuren får också bilder, eftersom frågorna visar bild + text (D27).

## D27 · 2026-10-19 · Sveriges landskap, första versionen: spellägena, pusslet och samlarpärmen
- **Beslut:** första versionen har Utforska (landskapskort), Träna med Upptäck Sverige, Vad heter det?, städerna,
  djur/blommor/sköldar, **pusslet** och **samlarpärmen**, samt Test. Resan genom Sverige och Vem är jag? väntar.
  Frågor om landskapsdjur och landskapsblommor visar **bild + text**, inte bara bild. **Landskapssköldarna** är med,
  både på korten och som frågor.
- **Källa:** Dennis 2026-10-19: "Ta med pusslet och samlarpärmen i första versionen. och gällande 'vems landskapsdjur
  är det här?' Inte bara visa bild, utan visa bild + text. och glöm inte landskapssköldarna"
