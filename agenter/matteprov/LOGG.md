# Lärdomslogg – Matteprov

En post per runda: vad som byggdes, vad som rättades och varför, och vad rollen lärde sig.

---

## Runda 1 · 2026-10-19 · Matteprov 1 (D37), gren `matteprov`
- **Byggt:** kortet i Multiplikationens lägesvy, provlistan ur `PROVS`, provsidan med fem moment, Så här gör du,
  nötloopen, "Gör provet" med kvitto och "Sett av en vuxen", tabellsprinten. Under rundan kom tre tillägg: följ
  bladens form (tabelltest 20 tal /20, "="-rader, TE med tre rader, uttrycket i problemlösningen), allt avvikande
  bara i provet, och provet minst lika svårt som det svårare bladet (nya golv och 300-provstest).
- **Rättat under verifieringen:** "Rätt!" visade nästa uppgifts text (nötloopen hade redan gått vidare); facit visades
  helt i stället för rad för rad; tal med två roller i samma mening (4 · 5 = 20 bredvid tiotalet 20, "6 av dem ger
  6 poäng"); speglade dubbletter (50 · 40 och 40 · 50); ett pris som råkade vara bladets.
- **Lärdom:** rita återkopplingen på uppgiften som besvarades, inte på den aktuella. Språkregeln behöver en kontroll
  i generatorn och ett test, inte bara läsning. Mät nivån mot underlaget i vitest i stället för att lita på
  intervallen.

## Runda 2 · 2026-10-19 · Kladd, hjälptrappa, mitt prov (D38), gren `matteprov-hjalp`
- **Byggt:** appens kladd (multdiv:s ritkod kopierad in, kladd-lagen), hjälptrappan i Öva och prov, kvittot med rätt
  direkt / med hjälp / fick svaret, det som var svårt per typ som glöms efter tre rätt, "Mitt prov". Under rundan:
  ensiffrig faktor med delprodukter per rad, raderna i ordning med summan låst, vägvisning, tvåsiffrig med tankerad.
- **Rättat:** `readResp` skickade bara p1/p2/s, så ensiffriga rader nådde aldrig rättningen; mitt prov tappade hela
  moment när det fanns många svåra typer (taket); tomma rutor blev gröna i facit; en hjälptext gav 50 px overflow.
- **Lärdom:** när en ny radtyp läggs till, kontrollera hela vägen från inmatning till rättning. Ett tak i ett urval
  ska fördela, inte klippa. Mät höjden även i hjälpläget, inte bara i startläget.

## Runda 3 · 2026-10-19 · Anteckningsrutor och kompakt knappsats, gren `matteprov-kladd`
- **Byggt:** anteckningsrutor i tankeraden för tvåsiffrig faktor (rättas i Öva, aldrig i provet), knappsatsen 5 + 5
  + ⌫/Nästa/Klar, regler för korta skärmar (kladdens verktyg i hörnet, lägre faktorsiffror, minnesraden först när
  summan låses upp). Mätt i 390 × 844, 797 och 700.
- **Rättat:** summans tankerad räknade förskjutna tomrutor som nollor ("6 + 0 + 0 + 0"); tre termer bröt raden;
  CSS för korta skärmar förlorade på specificitet.
- **Lärdom:** en tom ruta är inte en nolla; skilj dem i logiken. Mät tre höjder och hjälpläget innan rapport.

## Runda 4 · 2026-10-19 · Frågan per rad, ångra och gör om, gren `matteprov-radfraga`
- **Byggt:** appen frågar per delproduktsrad och bokför svaret på rätt plats (texten först, sedan en kort rörelse);
  rad 2 börjar med barnets nolla; trappa per rad; bara summan rättas; felklasserna som inte längre kan hända är
  borttagna. Kladden fick Ångra och Gör om i flera steg (`createHistory`, Rensa går att ångra). Efter rundan lade
  samordnaren till "en knapp i taget" och släppte v68.
- **Varför:** cellinmatning från höger gav inverterade tal när barnet skrev ett tvåsiffrigt svar i den ordning det
  läses.
- **Rättat:** en ledtråd som bröt raden i 390 × 700; kladdens golv på korta skärmar.
- **Lärdom:** när inmatningen ställer till det för barnet, flytta platsvärdet till appen och låt barnet svara som det
  tänker. Ta bort det som inte längre kan hända, både i koden och i testerna.

## Runda 5 · 2026-10-19 · Snällare (D39), gren `matteprov-snall`
- **Vad som inte fungerade:** i tabelltestet var Klar den framträdande knappen fast den rättar hela bladet, och tomma
  rutor räknades som fel. Ett svar och Klar gav "1 av 20 rätt", 19 röda rutor och ett argt ljud.
- **Varför:** två knappar var aktiva samtidigt med samma tyngd, och rättningen skilde inte på tomt och fel.
- **Byggt:** "Nästa tal" är huvudknappen tills bladet är fyllt; Klar med tomma rutor rättar inget och säger hur många
  som är kvar; tomma rutor ger `null`, aldrig fel. Inget rött för fel, vänliga ord, tyst första försök. Vitest för
  tomma rutor och ett svep efter dömande ord i koden och i alla genererade texter.
- **Lärdom:** gå igenom varje läge och fråga vilka två knappar som kan förväxlas; den som avslutar ska inte vara
  framträdande förrän det går att avsluta. Tomt är inte fel.

## Runda 6 · 2026-10-19 · En knapp, och problemlösning i steg (D39 ✎), gren `matteprov-enknapp`
- **Vad som inte fungerade:** två knappar (Nästa och Klar) var aktiva samtidigt i lägen med flera rutor. I
  problemlösningen fick barnet ett tomt uttrycksfält och en ✓-knapp utan text, utan att veta hur det skulle skriva.
- **Varför:** gränssnittet krävde att barnet redan kunde formen (ett helt uttryck) i stället för att leda det dit.
- **Byggt:** en knapp som heter Nästa tills varje ruta är ifylld, sedan Klar (`oneButton`, `nextEmpty`); tabelltestets
  andra omgång tömmer de orange rutorna. Problemlösningen i ledda steg med mallen `[ ] op [ ] = [ ]` per steg,
  tryckbar prislista och tryckbara tidigare svar, trappa per steg och slutsatsen med uttrycket sist.
- **Rättat under verifieringen:** slutvyn visade inte sista steget; panelen bytte flik till en annan server (5330)
  mitt i genomklickningen, så webbläsarverktygen kördes mot fel sida.
- **Lärdom:** när barnet ska lära sig en form, låt appen bära formen (mallen) och låt barnet fylla talen; visa formen
  som helhet i slutsatsen. Ange alltid flikens id i webbläsarverktygen när panelen delas.

## Ordning och reda · 2026-10-19 · Efter v69
- **Lärdom:** en text som värderar resultatet ("bra kämpat") är inte neutral för alla barn; under en gräns ska bara
  resultatet stå (samordnarens `MP.resultNote`). När jag skriver ord till kvitton: fråga om meningen dömer, inte bara
  om den innehåller "fel".
- **Lärdom:** när en funktion ersätts (uttrycket → ledda steg) ska den gamla tas bort i samma runda, med sina tester;
  annars blir den skuld som någon annan måste läsa. Den står nu i TODO.

## Runda 7 · 2026-10-21 · Räknesätten i uppställningen (D41), gren `matteprov-metod`
- **Vad som inte fungerade:** provets uppställning hade bara delprodukter per siffra (D38 ✎), medan den vanliga
  multiplikationen lär ut minnessiffran (D40), som Dennis förespråkar. Barnet fick två olika sätt utan att kunna välja.
- **Byggt:** växeln Minnessiffra | Dela upp överst i "Så här gör du" (förval Minnessiffra, sparad per profil, gäller
  i Öva, provet och mitt prov; provsidan visar valet under momentet). Minnessiffra räknas av multdiv-motorn via
  kroken `MultDivGame.runTask` (Öva = med hjälp, provet = själv med hjälptrappan), och utfallet bokförs här
  (`runMinne`, `minneDone`, taggen `upp:minne`, tabellfakta). Dela upp är oförändrat. Vitest: hela sviten 492.
- **Avvikelse:** växeln fick inte plats på provsidan i 390 × 797 (uppmätt 49 px för mycket med Mitt prov-kortet), så
  den står i "Så här gör du"; provsidan visar bara valet.
- **Lärdom:** när två moduler ska lära ut samma sak, låna motorn i stället för att kopiera den; en isolerad krok
  med ett utfall tillbaka (direkt, hjälp, svaret, felklass) räcker för att provets bokföring ska fungera som förut.

## Runda 7 ✎ · 2026-10-21 · Raderna och den grå nollan i Räkna själv (D41 ✎, P15)
- **Vad som inte fungerade:** Dennis: "den där nollan i grå ruta saknades". Provets minnessiffreläge (multdivs fria
  läge) visade bara svarsraden, men läraren rättar nollan på rad 2.
- **Byggt (i multdiv, som provet lånar):** vid tvåsiffrig faktor visar Räkna själv rad 1, rad 2 med nollan ljusgrå från
  början och summan; "Nästa rad" tills allt har siffror, sedan Klar; summan låst tills raderna har siffror; rättning
  per rad (`freeCheck`, glömd minnessiffra per rad och i summan); hjälptrappan med en rad i taget. Uppmätt i 390 × 797:
  kladden 165 px från början, minst 95 px när hjälpbiten står i bubblan (108 px med ledtrådsraden utanför provet).
- **Lärdom:** "barnet räknar i kladden" räcker inte när läraren rättar en mellanrad; det som rättas på pappret ska
  finnas på appens papper.

## Runda 8 · 2026-10-21 · Nollorna i Dela upp (D41 ✎), gren `matteprov-nollor`
- **Vad som inte fungerade:** Dennis, skärmbild 4819 · 9: "Skulle inte dessa celler vara gråade, och när det är dags
  så skall 0:an föras in?" Rutorna till höger om de förskjutna raderna var tomma och prickade.
- **Byggt:** grå rutor (som den osynliga nollan) i de förskjutna raderna; appen sätter nollorna **före** radens fråga
  (Dennis: "sätt dit nollorna innan du löser det som skall gångras ... annars kanske de skriver in dem i fel cell"),
  och förklarar dem med siffrans värde (Dennis: "gör det pedagogiskt, så att de förstår varför de fyller i x-antal
  nollor"): värdet, varför antalet (100 har två nollor), nollorna en i taget; i provet en rad med "därför". Facit och
  bokföringen har nollorna, summans tankerad räknar dem. Minnessiffreläget (multdiv fas 2) fick samma förklaring.
- **Uppmätt i 390 × 797:** ingen scroll; kladden minst 85 px under den tvåradiga förklaringen i Öva.
- **Lärdom:** ordningen är en del av pedagogiken — det som ska stå på pappret före en uträkning ska komma före frågan,
  annars hamnar svaret i fel ruta. Lägg ordningen som ren data (`uppRowFlow`) så att den går att testa.

## Runda 9 · 2026-10-21 · Minnessiffran utan fokusbyte (D41 ✎), gren `minne-fokus`
- **Vad som inte fungerade:** Dennis (8 · 1416, summafasen): "när man skall sätta minnessiffra så skiftar cellerna
  fokus". Ett tryck på en minnesruta flyttade fokus dit, och efter siffran gick fokus tillbaka; fokusringen hoppade
  två gånger för en enda siffra.
- **Byggt:** minnesrutan väntar på en siffra (`IN.mw`) medan summans fokus står kvar; siffran eller ⌫ gäller den
  väntande rutan; andra trycket tömmer den. Logiken är ren (`memCellTap`/`memCellKey`) och testad.
- **Kontrollerat:** multdivs Räkna själv (och därmed provets minnessiffreläge) har ingen minnesinmatning i fria läget;
  minnessiffrorna landar först vid rätt svar, så inget fokus byts där.
- **Lärdom:** en hjälpruta som barnet fyller i "vid sidan av" ska inte låna huvudfokus; ge den ett eget väntläge, så
  står barnets plats i talet still.

## Runda 10 · 2026-10-21 · Räkna med hjälp och Räkna själv (D42), gren `matteprov-hjalplage`
- **Vad som inte fungerade:** Dennis: "modul 2 och 3 i matteprovet förstår jag inte intuitivt vad jag skall göra när
  jag sätter igång. Barn har en förmåga att snabbt klicka förbi instruktioner". All vägledning låg i "Så här gör du"
  före uppgiften; under själva uppgiften stod bara "Räkna. Skriv i rutorna."
- **Byggt:** valet Med hjälp | Själv på provsidan (sparat, förval Med hjälp, provet alltid själv). Med hjälp fylls
  tiotal och TE ruta för ruta med en fråga om rutan i fokus, lysande siffror i platsvärdesfärg (samma färg i frågan),
  kvittens efter rätt svar och trappan per ruta; problemlösningens pris lyser; Minnessiffra följer valet. Vitest för
  valet, att det används, att provet räknas själv, frågetexterna för slumpade uppgifter och ett språksvep.
- **Rättat under verifieringen:** siffrorna i ett tal blev egna flexobjekt och fick mellanrum ("5 0 · 6 0") – ett
  tal ska ritas som en enhet.
- **Lärdom:** hjälp som barnet kan klicka förbi hjälper inte; lägg frågan där barnet redan tittar (över rutan med
  fokus) och låt den vara en fråga, inte en uppmaning. Mät färgade tal i flexrader: färg per siffra får inte bryta
  talet.

## Efter runda 10 · 2026-10-21 · Frågan som kunde besvaras på två sätt (samordnaren, v73)
- **Vad som inte fungerade:** "Dela 28: hur många är tiotalen?" kan besvaras med 2 (antalet tiotal), men rutan väntar
  20 (tiotalens värde). Testerna kontrollerade bara att texten var den förväntade, inte vad ett barn skulle svara.
- **Lösning:** "Dela 28: vad är tiotalen värda?" (samordnaren; `boxAsk`, testet och MANUAL).
- **Lärdom:** frågor ska testas mot vad ett barn skulle svara, inte bara mot förväntad text. Läs frågan bokstavligt,
  lista de rimliga svaren och kontrollera att bara rutans svar passar; "hur många" frågar efter ett antal, "vad är …
  värd" efter ett värde.


## 2026-11-11 · Övningsblad · Division (D44 ✎)
- Matteprov 2 byggdes om till övningsblad efter Dennis kursändring: tretton moduler, inget prov. Dev (v75) mergad in;
  den lånade korta divisionen går nu på multdivs nivå 3 (nivå 4 är decimaler sedan v75).
- **Fel:** Lättare "Ingår hur många gånger?" ritades inte (kontrollens första ruta byggdes även när modulen saknar
  kontroll). **Varför fångade inte testerna det:** vitest kör bara logiken; rendreringen prövades först i svepet i
  webbläsaren (alla moduler × nivå × läge). **Lärdom:** svep varje modul i båda nivåerna och lägena i webbläsaren
  innan rapport; ett modulval som stänger av en del av mallen ska prövas i rendreringen.

## 2026-11-11 · Runda 2: stil C på alla tretton moduler
- Dennis valde C · Brickor ("C - Brickor är bäst. men glöm inte bort att vi färgkodar siffrorna …"), bandet ("exakt
  sådana där små visuella hjälpmedel") och flygningen; först Kontrollera som provmodul ("toppen, då kör vi"), sedan resten.
- **Fel:** verktyget försvann efter första tryck på högen, och fanns kvar i Själv. Nötloopen lämnar en ny kopia av
  uppgiften vid varje anrop, så `t.pic` som sattes i `freshInput` levde inte kvar, och förra uppgiftens verktyg följde
  med till nästa. **Lösning:** verktyget sparas i `IN` med uppgiftens nyckel och läggs på i `curTask`.
  **Lärdom:** muterar man uppgiften i UI:t, kontrollera att det är samma objekt nästa gång.
- Genomspelning (Lättare med hjälp, Svårare själv, alla moduler utom motorn): inga fel, ingen skroll i 390 × 797,
  bandet i varje ruta med hjälp, inget band eller verktyg i Själv. Rättat under svepet: bandet från en täljarsiffra tog
  vägen runt bråket ("1 klistermärken" blev singular).
- **Fel (Dennis):** när bandet stod blev hela kortet blekt, även det i fokus. Orsak: bandets SVG fick en vit, halvgenomskinlig
  bakgrund av en allmän regel och låg över allt. **Lösning:** ingen bakgrund på bandet; i stället tonas bara det som inte
  hör till steget ned (`.mp-fm … :not(.mp-keep)`), och källan, målrutan och deras föräldrar får `mp-keep`. Mätt i alla
  moduler med hjälp: effektiv opacitet 1 på källa, mål och band. **Lärdom:** en blek skärmbild är ett fynd, inte
  panelens fel; mät `getComputedStyle` och vad som ligger överst (`elementFromPoint`) innan man skyller på verktyget.

## 2026-11-11 · Runda 3: bandet startar i svaret
- Dennis om skärmbilden: "Där pekar ju strecket och det som skall vara i fokus lite missvisande". Bandet gick från grupp
  6:s prickar och bara den gruppen var stark, fast svaret var antalet grupper. Rättat: summan under bilden som bricka
  ("6 grupper", "2 över") är källan, allt som räknas är starkt, och bandet tar aldrig ett tal som inte är svaret.
- **Varför fångade inte testerna det:** svepet mätte att bandet fanns och att fokus var opakt, inte vad bandet pekade
  ut. **Lärdom:** mät källan mot svaret i varje steg (`mp-bsrc` mot rutans facit); mätningen hittade också att
  bandstartens närmaste-element-gissning gav falska fel, därför markeras källan nu i DOM.

## 2026-11-11 · Runda 4: bandet går aldrig genom text, och det är kort
- Samordnarens granskning: bandet gick genom "kvot", genom frågan, genom nämnaren och genom stegets text; talen i
  frågan var för nedtonade. Dennis: "det blir ju inte heller bra om den streckade linjen blir överdrivet lång" och
  "det får bli en slags 'bästa möjliga kompromiss i vissa lägen'".
- Byggt: poängsatt väg (`bandRoute`, `bandScore`), hårda hinder (siffror, läsbar text) och mjuka (etiketter, bilder),
  ring i stället för band när ingen väg duger, etiketterna under rutan, brickorna nära mallen, nedtoning i gråskala.
- **Varför fångade inte testerna det:** svepet mätte att bandet fanns och var opakt, aldrig vad det korsade eller hur
  långt det var. **Lärdom:** ett visuellt hjälpmedel ska mätas mot det det ska undvika; svepet räknar nu korsad text
  och längd mot det raka avståndet i varje steg (alla moduler: ingen korsning, inget över 2 gånger).
- Första försöket, en väg runt hindren i ett rutnät, gav fria men långa och slingriga band; det togs bort när Dennis
  satte längdgränsen.

## 2026-11-11 · Runda 5: bandet pekar inte fel
- Samordnaren mätte två vilseledande vägar: ut åt höger genom "grupper" och in i kvotrutan underifrån (såg ut att gå
  till kontrollen), och ut från botten av "54" förbi "2" (såg ut att komma från nämnaren).
- **Varför fångade inte testerna det:** poängen såg bara korsad text och längd, inte riktning eller närhet till andra
  tal. **Lärdom:** ett band läses som en pil från det närmaste talet till det den pekar på; mät sidorna, närheten och
  att vägen inte går genom ändarnas egna rutor. Test för de två uppmätta vägarna.
