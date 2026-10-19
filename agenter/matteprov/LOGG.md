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
