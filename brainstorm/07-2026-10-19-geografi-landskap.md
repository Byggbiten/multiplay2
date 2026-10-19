# Geografi: hur lär sig ett barn Sveriges landskap? (2026-10-19)

Tankepass inför modulen Geografi (D22, P8). Dennis vill att läxbokens siffror 1–25 förs in i färgkartan, så att Mira
kan lära sig landskapen. Det här är Claudes förslag och inga beslut. Facit för förslaget är
`design-lab/geografi-mockup.html`.

Källorna nedan är välkända standardverk. De anges ur minnet och har inte slagits upp på nätet i det här passet.
Där stödet är svagt eller bara erfarenhet står det.

## Uppgiften

Mira går i årskurs 4 och bor i Sundsvall, i Medelpad. Läxboken visar en karta med siffrorna 1–25, och hon ska kunna
namnet på varje siffra. Det är tre saker att lära sig:

- var landskapet ligger
- vad det heter
- vilket nummer det har i läxboken

Underlaget finns i `referens/`. Kartan är `sveriges-landskap-farg.svg`, och kopplingen nummer–namn–landsdel–path står
i `landskap-laxbok.json`.

## Vad forskningen säger, och vad det betyder här

1. **Hämta ur minnet och sprid ut övningen.** Att försöka minnas ger mer än att läsa om. Det kallas testeffekten
   (Roediger & Karpicke 2006). Övning utspridd över flera dagar sitter bättre än samma mängd på en gång (Cepeda m.fl.
   2006). Dunlosky m.fl. (2013) ger båda teknikerna sitt högsta betyg av tio studietekniker. Stödet är starkt.
   *Här:* samma lådor och nötloop som i Gångertabellen och Klockan (`MP.spaced`, `MP.createDrill`). Ett landskap
   räknas som "kan" när hon svarat rätt tre olika dagar, och sedan kommer det tillbaka för påfyllning.
2. **Dela upp i grupper.** Tjugofem namn på en gång är för mycket. Indelade i kategorier blir de lättare att minnas
   (Miller 1956 om "chunks", Bower m.fl. 1969 om hierarkiskt ordnade listor). Landsdelarna Norrland, Svealand och
   Götaland är en färdig indelning, och färgkartan visar den redan med beige, gult och blått. Stödet är starkt.
   Det finns en fälla. Människor bedömer ett läge efter den grupp det hör till och missar undantagen (Stevens & Coupe
   1978: Reno ligger väster om San Diego, fast Nevada ligger öster om Kalifornien). Läxbokens numrering har två
   sådana undantag. Nummer 9 är Dalarna, som hör till Svealand. Nummer 10 är Gästrikland, som hör till Norrland.
   *Här:* en trappa per landsdel (9, 6 och 10 landskap) och sist Hela Sverige. Undantagen får egna steg i
   lektionerna.
3. **Öva båda riktningarna.** Det man tränat i en riktning sitter i den riktningen. Det man övar bör likna det man
   ska kunna, vilket kallas transfer-appropriate processing (Morris, Bransford & Franks 1977). Repot har samma
   resonemang om omvända frågor i `brainstorm/05`, och där är stödet måttligt.
   *Här:* tre frågetyper. Den första är plats till namn: "Var ligger Dalarna?", där hon trycker på kartan. Den andra
   är namn till plats: "Vilket landskap är markerat?", med fyra namn att välja bland. Den tredje är nummer och namn
   som i läxboken: "Vad heter nummer 12?" och "Vilket nummer har Närke?". Den tredje liknar läxförhöret mest.
4. **Använd ankare och referenspunkter.** Barn bygger sin bild av ett område från kända punkter, sedan vägar och
   sist en överblick (Siegel & White 1975). Det man redan känner används som referens för det nya (Sadalla m.fl.
   1980). Mira bor i Medelpad, mitt på kusten (numren visas inte i modulen, D33). Stödet är måttligt till starkt.
   *Här:* "Du bor i Medelpad! Sundsvall ligger här" med en nål på kartan. Sedan beskrivs grannarna utifrån
   Medelpad: Ångermanland ovanför och Hälsingland under.
5. **Ge minnesstöd i grannar och form.** Ett ord tillsammans med en bild minns man bättre än bara ordet, enligt
   Paivios teori om dubbel kodning (1971). Formminnen som "Skåne längst ner" och "Gotland och Öland är öarna" är
   beprövad skolpraxis. Studier om just landskapsformer känner jag inte till, så den delen är erfarenhet.
   *Här:* varje landskap har en kort mening om läge, granne eller form, till exempel "Medelpad ligger mellan
   Ångermanland och Hälsingland", "Lappland är störst av alla landskap" och "Bohuslän är en smal remsa vid havet".
   Grannarna är mätta i kartan och inte gissade. Två landskap räknas som grannar när kanterna ligger närmare än 2,5
   enheter längs minst åtta punkter. Meningen nämns igen vid fel, och då lyser grannen upp.
6. **Börja stort och förfina sedan.** Helheten uppfattas före delarna (Navon 1977, "forest before trees"). Reigeluths
   elaborationsteori bygger undervisning som en zoomlins: först översikten, sedan detaljerna. Stödet för principen är
   gott. Hur det ska tillämpas på kartor är en tolkning.
   *Här:* varje lektion börjar med hela Sverige och de tre landsdelarna och zoomar sedan in. I fråga (a) zoomar
   kartan i steg. Först trycker hon ungefär där landskapet ligger, och därefter på landskapet.

## Små landskap måste gå att träffa

På en telefon på 390 × 844 blir kartan över hela Sverige som mest ungefär 470 px hög. Öland är då under 5 px brett.
Därför zoomar fråga (a) alltid in tills varje landskap är stort nog att trycka på:

- **Svealand och Götaland** visas direkt inzoomade.
- **Norrland** delas i två vyer. Den norra har Lappland, Norrbotten och Västerbotten, och den södra Ångermanland till
  Gästrikland. Det första trycket väljer vy.
- **Hela Sverige** tar ett tryck mer: först landsdelen (för Norrland den norra eller södra delen), sedan landskapet.

Dessutom har små landskap en generös träffyta. Om landskapet är smalare än 44 px på skärmen får det en osynlig kant
runt sig. Kanten är precis så bred att landskapet blir 44 px, plus 6 px marginal, och ett tryck inom kanten räknas
som ett tryck på landskapet. Öland i Götalands vy får en kant på ungefär 22 px. I labbet kan träffytorna visas med
"Träffytor: Visa".

Träffytorna är mätta i mockupen med samma beräkning som trycken. För varje landskap mättes den största cirkel som
ryms helt i dess träffyta. I fråga (a) är den minsta cirkeln 47 px, för Närke. Mätningen står i loggen.

## Förslaget i korthet

- **Hemvyn "Sveriges landskap":** färgkartan med läxbokens siffror. Det första trycket zoomar in, och nästa tryck
  visar namnet. Med växeln Läxboken/Lådor visar kartan i stället lådorna: vitt är nytt, gult övar, grönt kan och
  ljusgrönt är dags igen. Bredvid kartan står trappan med fyra steg i höjd med sin landsdel: Norrland, Svealand,
  Götaland och Hela Sverige, med medaljer enligt samma regler som i Gångertabellen och Klockan.
- **Lär dig:** en klickstyrd lektion per landsdel. Hela Sverige visas först med de tre landsdelarna. Sedan zoomar
  kartan in, och landskapen tänds ett i taget i läxbokens ordning med nummer, namn och minnesstöd. Därefter kommer
  undantagen (9 och 10), ankaret Medelpad och slutsatsen ("Norrland har nio landskap"). Lektionen avslutas med
  "Nu får du försöka!" och tre försök, ett av varje frågetyp, och de bemöts som i Klockan. Rätt svar ger beröm och en
  bekräftande mening. Fel svar ger "Nästan rätt!" om svaret var en granne och annars "Bra försök! Låt mig visa."
  Sedan blinkar det rätta landskapet, grannen nämns och hon får samma uppgift igen.
- **Öva:** ett pass med ett varv per frågetyp, nötloop och kvitto med "Sett av en vuxen". En landsdel tar alla sina
  landskap i varje varv, som stegen i Klockan. Hela Sverige tar tio landskap per varv ur lådorna, med dem hon övar
  först. Felalternativen är grannar och landskap i samma landsdel, och ordningen lottas (D17). I nummerfrågorna
  lottas också hur många alternativ som ligger under och över det rätta numret.

## Språket

Läxbokens nummer skrivs med siffror ("nummer 7"); numren visas inte längre, D33. Antal skrivs med ord ("Norrland har nio landskap"). Då kan samma
tal inte få två roller i samma mening.

Jämförelseord används bara när det finns något att jämföra med. "Lappland är störst av alla landskap" jämför med
alla 25. Om Gotland stod det först "den stora ön", men det skrevs om till "en stor ö", eftersom Öland inte har
visats än när Gotland tänds.

## Utfall

**Förslag till Dennis, mockup `design-lab/geografi-mockup.html`.** Inget är byggt i appen. Mira bör prova mockupen
innan Dennis dömer. Det här bör Dennis ta ställning till:

1. Trappan har fyra steg: tre landsdelar och Hela Sverige, utan stegnummer så att de inte krockar med läxbokens
   siffror.
2. Fråga (a) zoomar i steg. Norrland delas i en norra och en södra vy, och Hela Sverige tar två tryck.
3. Namnlappen på kartan visar bara namnet, och siffran står kvar ovanför.
4. Ett rätt svar i Öva går vidare av sig självt efter ungefär en sekund, som i Klockans pass. Allt annat stegas med
   klick.
5. Modultemat är havsgrönt (`#0f8b8d`). Det är en ny accentgrupp, eftersom inget befintligt tema passar kartans
   färger.
6. Hela Sverige tar tio landskap per varv. En landsdel tar alla sina landskap i varje varv.

Inga D-poster än. P8 står öppen tills Dennis dömt mockupen.
