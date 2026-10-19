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
- D22 Ny modul Geografi, som börjar med Sveriges landskap ◐ · *numren visas inte → D33*
- D23 Sammanslagna grenar på GitHub tas bort
- D24 Geografi → Sverige → Sveriges landskap (struktur) ✎ menyn i Geografi
- D25 Städerna: största staden, plus en väsentligt stor stad där den finns
- D26 Sköldar och blommor laddas ner från Wikimedia ✎ även djuren
- D27 Sveriges landskap, första versionen: spellägena, pusslet och samlarpärmen ◐ · *Vad heter det? utan nummer → D33*
- D28 Städerna godkända; skolans vana går före där den skiljer
- D29 Bildkällorna bakom en liten informationsknapp
- D30 Geografi efter första provet: Nästa, rikare snabbfakta, ett tryck per val, inget dubbeltryck, sköldar i nivåer, test per område ◐ · *snabbfaktan → D31*
- D31 Faktarutan efter rätt svar är standardiserad ✎ uppställningen → D32
- D32 Pusslet med namn, två svårighetsgrader och generös placering; faktarutan som prydligt rutnät
- D33 Läxbokens nummer tas bort ur Geografi
- D34 Blandad ordning är standard i Träna och Test
- D35 Geografimockupen godkänd: byggs in i appen och livesätts
- D36 Offentligt repo: inga uppgifter om testare; "Här bor du" är en inställning ✎ inga utpekande kombinationer ✎ rimlig nivå
- D37 Matteprov 4:an i Multiplikation, första provet Matteprov 1 ✎ bladens struktur, isolerat i provet ✎ minst lika svårt
- D38 Matteprovet: kladdyta, stegvis hjälp vid upprepade fel, skräddarsytt prov av det som var svårt

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
- **Varför:** Barnet räknar rätt men saknar pappersvanan; appen ska nöta in strukturen.
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
- **Källa:** Dennis 2026-09-23, fynd i barntestet: "alla rätta svar på flersvarsinmatningen va nere till
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
- **Status:** ◐ siffrorna ur läxboken visas inte i modulen → **D33**. Ordningen och nyckeln i `landskap-laxbok.json` används
  fortfarande internt.
- **Beslut:** en ny modul Geografi. Första delen är Sveriges landskap: siffrorna 1–25 ur läxboken förs in i en
  färgkarta (`Sveriges_landskap_farg.svg`). Upplägget är öppet (P8).
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
- **Status:** ◐ Vad heter det? frågar bara efter namn, inte efter läxbokens nummer → **D33**.
- **Beslut:** första versionen har Utforska (landskapskort), Träna med Upptäck Sverige, Vad heter det?, städerna,
  djur/blommor/sköldar, **pusslet** och **samlarpärmen**, samt Test. Resan genom Sverige och Vem är jag? väntar.
  Frågor om landskapsdjur och landskapsblommor visar **bild + text**, inte bara bild. **Landskapssköldarna** är med,
  både på korten och som frågor.
- **Källa:** Dennis 2026-10-19: "Ta med pusslet och samlarpärmen i första versionen. och gällande 'vems landskapsdjur
  är det här?' Inte bara visa bild, utan visa bild + text. och glöm inte landskapssköldarna"

## D28 · 2026-10-19 · Städerna godkända; skolans vana går före där den skiljer
- **Beslut:** listan i `referens/sverige-landskap/landskap-fakta.json` (största tätorten + en väsentligt stor stad,
  D25) gäller. Det finns ingen officiell lista över landskapens "huvudstäder". Där skolans vana skiljer sig från
  storleken går skolan före: Södermanland → Eskilstuna (Södertälje andra), Öland → Borgholm (Färjestaden andra).
  Dalarna står kvar som Borlänge med Falun som andra stad. Båda städerna visas på landskapskortet.
- **Källa:** Dennis 2026-10-19: "Städerna ser bra ut. Om det inte finns nån slags lista på vad som räknas som
  landskapets 'huvudstad' eller liknande så kör vi på ditt. … falun är historiskt sett mer utav en huvudstad, men
  borlänge är ju större. Så du har rätt i din lista och vi kör på den om det inte finns någon 'officiel lista' …
  Så som du själv pekade ut med eskilstuna. skolboken får gå före"

## D29 · 2026-10-19 · Bildkällorna bakom en liten informationsknapp
- **Beslut:** upphovspersoner och licenser för bilderna (krav för CC BY/CC BY-SA, `referens/sverige-landskap/bilder.json`)
  visas bakom en liten informationsknapp i Geografi, så att de inte stör.
- **Källa:** Dennis 2026-10-19: "och gällande att upphovspersonerna nämns. Lägg det som nån liten informationsknapp
  nånstans i appen. så att det inte är något som störs."

## D30 · 2026-10-19 · Geografi efter första provet av mockupen
- **Status:** ◐ punkt 2 (snabbfaktan som roterar) ersatt av **D31**.
- **Beslut:**
  1. **Nästa efter rätt svar.** Ett rätt svar i Träna går inte vidare av sig självt; barnet trycker "Nästa" och
     hinner läsa snabbfaktan.
  2. **Rikare snabbfakta.** Efter varje rätt svar visas landskapets sköld, och en fakta som roterar mellan
     placeringen i yta eller invånare (etta och sista sägs rakt ut: "Sveriges största landskap till ytan",
     "Sveriges folkrikaste landskap"), staden, blomman eller djuret med bild och text, och "Visste du?".
  3. **Ett tryck per val, inget val två gånger.** Hemvyns områdeskort (Norrland, Svealand, Götaland, Hela Sverige)
     är ingången till träning, och knappen "Träna" på hemvyn tas bort. "Träna <område>" har ordningen överst och
     de fyra lägena som rutor där ett tryck startar; namn eller läxbokens nummer, och djur, blommor, sköldar eller
     blandat, är knappar i sina rutor. Det blir två tryck från hemvyn till första frågan. Pussel och Test: ett tryck
     visar områdena, och ett tryck på ett område startar.
  4. **Dubbeltryck zoomar inte.** Kartan zoomas bara med nyp (och med mushjulet). Ett tryck räknas direkt. Ett
     snabbt dubbeltryck zoomar varken kartan eller sidan och väljer inte samma landskap två gånger.
  5. **Upptäck för hela Sverige börjar med hela landet i bild.**
  6. **Samlarpärmen i nivåer.** Sköldarna låses upp i brons, silver och guld. Förslaget i mockupen:
     - brons: landskapet är övat
     - silver: landskapet "kan" i lådorna (rätt tre olika dagar)
     - guld: "kan" och rätt på första försöket i alla sex frågetyper (kartan, namnet, staden, djuret, blomman och
       skölden)
     Kortet visar nivån. Det stora kortet säger vad som krävs till nästa nivå. Räknaren visar "N kort · x silver ·
     y guld".
  7. **Testet tar alla landskap i det valda området** (Hela Sverige = alla 25). Ett fel visar svaret och testet
     går vidare, utan nötloop.
  8. **Pusslet räknas inte in i framstegen.**
- **Källa:** Dennis 2026-10-19:
  - Om snabbfaktan och Träna: "Klickar nästa, så hon hinner läsa snabbfaktan. men nu fick man då inte se saker som
    'om det är det största landskapet sett till ytan? landskapssköld?' i övrigt gillar jag dina förslag. … Det
    upplevs lite dubbeljobbat. Att man klickar på nånting och väljer ett läge, sen så får man samma val än gång
    till. Försök om du kan konsolidera dessa steg."
  - Rättelsen samma dag: "Dubbeltryck zoomar. <- dubbeltryck ska inte ooma. bara 2 fingara med nyp eller liknande
    för zooma ut. Upptäck börjar med hela landet i bild. Ja. Ett kort i pärmen låses upp när hon kan landskapet.
    Ja, man kan väl låsa upp landskapens landskapssköldar, med brons, silver och guld beroende på hur mycket man
    tränat på dem. Testet har tio frågor utan nötning. Testet borde ha samtliga landskap för valt område. Väljer
    man hela sverige så är det alla landskap som skall tränas. Pusslet räknas inte in i framstegen."

## D31 · 2026-10-19 · Faktarutan efter rätt svar är standardiserad
- **Beslut:** efter varje rätt svar, i alla lägen i Träna (och i Test), har rutan samma uppställning på fasta platser:
  - landskapets sköld
  - stad (största staden enligt D28, med den andra staden som "och …")
  - djur
  - blomma
  En rad till visas bara när landskapet har en utmärkande placering: rang 1, 2, 24 eller 25 i `yta_rang` eller
  `invanare_rang` i `referens/sverige-landskap/landskap-fakta.json`, högst två rader. Placeringarna skrivs som
  "Sveriges största/näst största/näst minsta/minsta landskap till ytan", "Sveriges folkrikaste/näst folkrikaste
  landskap" och "Näst minst folk/Minst folk av alla landskap". Saknas en sådan placering visas ingen rad.
  "Visste du?" visas inte i rutan, bara på landskapskortet i Utforska. Rutan har samma höjd varje gång.
  Enligt JSON får sju landskap raden: Lappland, Jämtland, Härjedalen, Uppland, Öland (två rader), Blekinge och
  Skåne.
- **Källa:** Dennis 2026-10-19: "Men jag vill ändå att rutan ska vara standardiserad. Så den skall alltid visa
  största stad, landskapsdjur, landskapsblomma, landskapssköld och sen 'om det finns någon särskild fakta, t.ex.
  lappland är störst, jämtland är näst störst, eller folkrikaste eller minsta etc.' så skall det vara med."

## D32 · 2026-10-19 · Pusslet med namn och två svårighetsgrader; faktarutan som rutnät
- **Beslut:**
  1. **Pusslets bitar har namn.** Namnet står under biten i brickan och följer med ovanför fingret medan biten dras.
  2. **Två svårighetsgrader**, valda på samma skärm som området (ett tryck startar): "Med gränser" visar
     landskapsgränserna i underlaget, och "Utan gränser" visar bara områdets yttre kontur (kusten och yttergränsen).
     Lagda bitar visas med sina gränser och sin färg. Firandet säger vilken nivå som spelades, och en bock på valet
     visar klara område och nivå. Det räknas inte in i lådorna (D30).
  3. **Generös placering.** En bit som släpps nära nog snäpper på plats. Radien är halva bitens minsta mått, minst
     40 px, men högst 70 % av avståndet till närmaste grannbits mitt, med ett golv på 24 px. En bit snäpper bara till
     sin egen plats. En bit som släpps långt bort glider tillbaka med en vänlig text.
  4. **Faktarutan som rutnät** (ändrar uppställningen i D31): skölden större och centrerad till vänster; till höger
     lovordet och en kort bekräftelse, sedan Stad, Djur och Blomma i en tabell med värdena på samma kant, och sist
     den särskilda raden. Innehållet fördelas jämnt i rutans fasta höjd. Bekräftelsen i rutan är kort ("Där ligger
     Öland.", "Det är Ölands.", "Färjestaden ligger på Öland."), eftersom rutan visar resten; de längre meningarna
     står kvar i förklaringarna.
- **Källa:** Dennis 2026-10-19:
  - "pusslet va kul. Men bitarna har inget namn. Så man vet inte riktid vad man drar. och det blir lite för lätt
    etftersom underlagsbilden är streckad på ett sätt som lätt gör att man förstår vart den skall passa. Jag tänker
    att man tar bort landskapsgränserna på 'pusselt' alltså där man skall drag and droppa bitarna, och så är appen
    tillräckligt generös med placeringen av bitarna så att de landar rätt när man släpper dem nära nog. och den här
    rutan med informationen kan struktureras snyggare så att man använder informationsrutan mer yt-effektivt."
  - Tillägget samma dag: "det där med pusslet förresten. Jag kom på att det kan ju vara som 2 st svårighetsgrader.
    En där man tydligt ser gränserna där man släpper landskapen. och en där man inte ser dem"

## D33 · 2026-10-19 · Läxbokens nummer tas bort ur Geografi
- **Beslut:** numren 1–25 ur läxboken visas inte någonstans i modulen:
  - Vad heter det? frågar bara efter namnet och startar med ett tryck.
  - Kartan har inga nummer; namnen visas där de ryms.
  - Landskapskortet, samlarpärmen, kvittot, testet och bildkällorna har inga nummerbrickor. Låsta kort i pärmen visar
    en sköldsilhuett i landsdelens färg med "?".
  - Ordningen "Rak" heter "Norr till söder" (samma ordning som numren hade).
  `referens/landskap-laxbok.json` står kvar som underlag; dess ordning och nycklar används internt.
- **Källa:** Dennis 2026-10-19 (om knappen "Läxbokens nummer" i Vad heter det?): "den där behövs inte. läxbokens
  nummer kan vi strunta i. det va bara för att […] läxa va upplagd just så just denna gång"

## D34 · 2026-10-19 · Blandad ordning är standard i Träna och Test
- **Beslut:** blandad ordning är förvald i alla lägen i Träna och i Test. "Norr till söder" finns kvar som val. Varje
  runda lottas på nytt och får inte samma ordning som förra rundan med samma val. Samma landskap kommer aldrig två
  gånger i rad, inte heller Städernas två städer i samma landskap. Extratillfället efter ett fel kommer minst två
  frågor senare och inte bredvid samma landskap, när rundan har plats för det.
- **Källa:** Dennis 2026-10-19: "Jag märker att när man tränar och övar, så går det i ordning topp till botten, vilket
  är väldigt repetitivt och förutsägbart. jag tänker att det borde vara lite mer 'randomiserat'"

## D35 · 2026-10-19 · Geografimockupen godkänd: byggs in i appen och livesätts
- **Beslut:** `design-lab/geografi-mockup.html` (commit `0728948`, D24–D34) är godkänd. Den byggs in i appen som
  modulen Geografi → Sverige → Sveriges landskap, på en egen gren med taggen `fore-geografi`, och livesätts efter
  granskning. Ordning och reda körs före bygget. Regeln för pärmens nivåer (brons = övat, silver = kan, guld = kan i
  alla frågetyper) gäller som den står i mockupen.
- **Källa:** Dennis 2026-10-19: "det ser jättebra ut. Kör en ordning och reda-rutin, sen livesätter vi detta"

## D36 · 2026-10-19 · Offentligt repo: inga uppgifter om testare
- **Beslut:** Repot är offentligt. Inga uppgifter om testare (efternamn, ort, skola, klass, ålder, familj) i spårade
  filer. Namn i appen är generiska. "Här bor du" i Geografi är en inställning per profil, av från början. Repot
  ligger kvar under Byggbiten, och historiken skrivs inte om.
- **Källa:** Dennis 2026-10-19: "Alternativ 2, […] och kör bygget" (alternativ 2: nålen "Här bor du" visas bara som
  en inställning i appen).
- ✎ **2026-10-19, vad som inte får stå:** förnamn som Mira, Zelda och Julian är generiska namn i appen och får stå,
  men aldrig i en kombination som pekar ut ett verkligt barn. Personuppgifter rensade enligt D36. Källa: Dennis: "Jag
  har lagt in lite blandade namn som bara ska vara generiska. mira är ett av dem tror jag. Men det ska inte vara så
  att Mira […] blir exakt utpekad".
- ✎ **2026-10-19, rimlig nivå:** namnen får stå i frågor och svar. Det som rensas är det som skyltar i onödan, där
  barnet framstår som en verklig person bakom appen. Mira är appens persona (CLAUDE.md). Källa: Dennis: "Mira och
  Zelda får förekomma i appen som svar eller i en fråga. Men! det får som sagt inte bli att det är uppenbart så att
  det är […]" och "Byggbiten får finnas kvar. […] jag vill som sagt inte skylta i onödan. Så vi håller det på en
  rimlig nivå där vi inte måste byta konto eller riva upp appen från början".

## D37 · 2026-10-19 · Matteprov 4:an i Multiplikation, första provet är Matteprov 1
- **Beslut:** lägesvyn i Multiplikation (under Svårighetsgrad) får knappen "Matteprov 4:an". Den leder till en lista
  med prov som läggs ut löpande, alla om multiplikation. Det första heter "Matteprov 1" och bygger på lärobokens
  kapitel 2 i åk 4: tabellerna 1–10, gånger tiotal och hundratal, talsorter (T och E), uppställning med en- och
  tvåsiffrig faktor (nollan i den grå rutan) och problemlösning i två steg, i en lättare och en svårare nivå som
  övningsbladen. Uppgifterna är egna och liknar övningsbladen; inget skrivs av ordagrant (bladen är upphovsrättsskyddade).
- **Källa:** Dennis 2026-10-19: "Skulle vi kunna läsa övningsbladen och göra dem till ett matteprov som ligger där
  jag markerat i bilden? Knappen kan heta matteprov 4:an. klickar man där så kommer vi löpande lägga ut matteprov som
  har med multiplikation att göra. och detta vi gör nu döps till matteprov 1" och "provet måste som sagt anpassas
  efter appen. Så jag räknar inte med att provet blir 'rakt av'. men att vi kommer nära".
- ✎ **2026-10-19, isolerat i provet:** provet följer bladens uppställning och lösningsgång (rutnätet, nollan i den grå
  rutan, =-raderna, uttrycket först). Det som avviker från appens sätt i övrigt gäller bara matteprovet; resten av appen
  ändras inte. Källa: Dennis: "Försök att följa testens struktur för att lösa problemen och ställa upp talen." och "det
  vi gör nu om det avviker från multiplays sätt att ställa upp och lösa tal i övrigt skall bara ske isolerat i detta
  matteprov. vi ändrar inte hela appen i övrigt".
- ✎ **2026-10-19, minst lika svårt:** provet får inte vara lättare än underlaget; "Gör provet" ligger på det svårare
  bladets nivå eller strax över. Lättare/Svårare finns kvar som trappsteg i övningen. Källa: Dennis: "viktigt är att
  vårt prov vi bygger nu inte är lättare än underlaget. Det skall vara 'lika svårt' och om det måste gå åt något håll,
  så får det vara lite svårare. Bättre att hon får jobba lite extra i appen och sedan glänsa på provet".

## D38 · 2026-10-19 · Matteprovet: kladdyta, stegvis hjälp och ett skräddarsytt prov
- **Beslut:** matteprovet får appens kladdyta, så att barnet kan räkna vid sidan av. Provet är ett övningsprov och får
  hjälpmedel: svarar barnet fel flera gånger kliver appen in med en bit av lösningen i taget, och går det ändå inte
  visas hela svaret och barnet går vidare. Appen kommer ihåg det som var extra svårt och sätter ihop ett skräddarsytt
  prov av det.
- **Källa:** Dennis 2026-10-19: "jag tror att de behöver 'kladd-ytan' om de skall kunna lösa dessa tal." och "eftersom
  vårt prov är till för att de skall träna på prov. så bör vi ändå slänga in lite hjälpmedel. T.ex. att om de svarar
  fel många gånger, så kanske appen kliver in och hjälper dem. Kanske att de inte ger bort hela svaret, men bitar, men
  går det ändå inte så får de hela svaret och får gå vidare. så får appen i slutet komma ihåg vad som va extra svårt
  så att den samlar ihop ett skräddarsytt prov där man får öva på det som va svårt".
- ✎ **2026-10-19, ensiffrig faktor med delprodukter:** uppställning med ensiffrig faktor räknas med en delprodukt per
  siffra på egen rad (687 · 8: 56, sedan 64 förskjutet ett steg, sedan 48 förskjutet två steg) och adderas till en
  slutsumma. Tvåsiffrig faktor behåller rad 1, rad 2 med den grå nollan och summan. Gäller bara matteprovet (D37).
  Källa: Dennis: "Här hade jag önskat att man först räknade ut 8x7= 56 och sedan när man räknar 8x8 så sker det raden
  under förskjutet 1 steg åt vänster så att man bygger på alla uträkningar och sedan får dem i celler efter deras
  värde (ental, tiotal, hundratal etc) och sedan adderar ihop det till en slutsumma."
- ✎ **2026-10-19, appen leder uppställningen:** appen ber om delproduktsmetoden och visar var barnet ska börja och vad
  som räknas (aktiv ruta, siffrorna som lyser, en kort rad). Vägvisningen räknas inte som hjälp i kvittot. Källa:
  Dennis: "i våran app så är det tyvärr begränsat med utrymme. Så då är det inte mer än rätt att appen visar detta och
  ber om det sättet. och att appen guider barnen vart de skall börja. Det är som sagt till för att träna på prov."
- ✎ **2026-10-19, tvåsiffrig faktor med tankerad:** skolans två rader (rad 1, rad 2 med den grå nollan, summan) står
  kvar; en tankerad ovanför räknar varje rad med talsorter (8 · 82 = 8 · 80 + 8 · 2 = 640 + 16 = 656). I Öva visas
  alla led; i provet bara uppdelningen, resten kommer som bitar i hjälptrappan. Valt framför en rad per sifferpar,
  som blir för lång vid tresiffrigt · tvåsiffrigt och avviker från provets uppställning. Källa: Dennis: "denna vy
  behöver lite kärlek. för hur de skall på ett pedagogiskt sätt kunna räkna ut detta och summera ihop delsummor när de
  har så lite yta att jobba med" och, om alternativen, "enligt din rekomendation".
- ✎ **2026-10-19, anteckningsrutor i tankeraden och kompakt knappsats:** tankeraden får små inmatningsrutor (8 · 80 =
  [ ], 8 · 2 = [ ], [ ] + [ ] = [ ]) där barnet antecknar delsummorna; i Öva rättas de, i provet är de fria
  anteckningar. Knappsatsen i matteprovet blir tre rader (siffrorna 2 × 5) så att kladden växer. Källa: Dennis: "men
  [barnet] har ingenstans att anteckna 640 + 16 så hon kan summera det. kanske sifferinmatningen skall bli mindre? så
  hon får kladdyta? eller har du något tips?"
