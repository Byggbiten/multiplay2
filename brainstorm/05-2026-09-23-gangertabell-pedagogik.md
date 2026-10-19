# Gångertabellen — vad kan bli mer pedagogiskt? (2026-09-23)

Tankepass på Dennis fråga 23/9 kl. 08:20: *"Är det något där som kan bli mer pedagogiskt? finns det någon
bevisad pedagogik eller visuellt sätt som vi kan ha nytta av för att barn enklare skall kunna ta in och förstå
och lära sig gångertabellerna? Vi brainstormar"*. Sammanfattat i efterhand (2026-10-19) ur sessionen; Claudes
förslag, inte beslut. Besluten står i `.project-context/DECISIONS.md` (D9–D17).

## Läget före

Modulen var en ren drillmaskin: den visade tabellen, frågade och räknade rätt och fel, men lärde inte ut hur man
räknar ut ett tal man inte kan.

- "Lär dig först" var en lista med tolv rader, utan bild och utan samband mellan raderna.
- Den interaktiva träningen visade svaret och frågade direkt efter, så svaret hämtades ur korttidsminnet.
- Felalternativen var slumptal 1–5 från rätt svar; att svaret är jämnt räckte ofta. Riktiga misstag är grannar i tabellen.
- Ett fel gav ingen väg till svaret.
- Statistiken per tal användes grovt (fokusträning vid minst fyra försök och under 75 % rätt).

## Idéerna

1. **Härledda fakta.** Räkna ut det man inte kan från det man kan: ×2 dubbelt, ×4 dubbelt dubbelt, ×8 en gång
   till; ×5 hälften av ×10; ×9 = ×10 minus en gång; ×6 = ×5 plus en gång; 7 × 8 = 5 × 8 + 2 × 8. Strategiundervisning
   plus övning slår ren drill (Woodward, Baroody).
2. **Rektangelmodellen.** 7 × 8 som 7 rader med 8 prickar; uppdelningen syns som ett streck genom rektangeln, och
   samma rektangel vriden visar att 7 × 8 = 8 × 7. Rimmar med tabellraden i divisionen (`6 · 7 = 42`).
3. **Den krympande tabellen.** 144 rutor; stryk det hon redan kan (1, 10, 2, 5) och räkna vändningarna en gång —
   kvar blir ungefär 20 svåra tal. En karta som tänds ruta för ruta gör målet synligt.
4. **Hämta ur minnet med jämna mellanrum.** Inkrementell repetition: ungefär nio kända tal blandas med ett nytt.
   Ett lådsystem per tal ersätter 75 %-tröskeln.
5. **Omvända frågor** (Dennis idé 08:39: svaret visas och barnet väljer gångertalet). Stödet är måttligt: faktan
   lagras i den riktning den övats (Rickard, Campbell), och vägen från svar till faktor är just den som divisionen
   kräver. Förslaget: ungefär var fjärde flervalsfråga, grannar i samma tabell som alternativ, bara ett rätt
   alternativ, bara tal hon redan övar.
6. **Tempo utan klockångest.** Tidspress tidigt ger mattestress (Boaler); strategin först, tempot sist, och tävla
   mot sitt eget förra resultat i stället för en klocka.

## Rekommendationen

Ett nytt "Lär dig" med rektangeln, klickstyrt som divisionen; ett fel visar strategin och frågan kommer tillbaka
senare; tabellkartan som framstegsvy; en smartare övningsmotor med lådor, tabellgrannar som felalternativ och paus
mellan att visa och fråga. Två öppna val gick till mockupen som reglage: fast strategi eller barnets val, och klocka
eller eget rekord.

## Utfall

- Mockup: `design-lab/gangertabell-mockup.html` (`80905da`), med reglage för strategi, tempo och omvända frågor.
- Dennis: *"jag gillar det du har gjort. Kan du föra in detta i dev-versionen?"* → **D9**. Övriga beslut samma dag:
  D10 (omvända frågor), D11 (påfyllning), D12 (övningspass), D13 (upp till 10), D14 (capybarakort i silver och guld),
  D15 (hemvyn), D16 (De svåra talen), D17 (flervalets plats lottas).
- Byggt, versionerna v57–v62:
  - v57 `3e4794f`: mockupen i appen — tabellkarta, strategier, smart övning, lådor med påfyllning
  - v58 `fce21ec`: övningspass med nötloop och kvitto, ny hemvy
  - v59 `c35a9b0`: capybarakort i silver och guld
  - v60 `e6f5305`: Träna en tabell med medaljer, kompakt karta
  - v61 `e45cc04`: svarsplatsen lottas
  - v62 `048413b`: läget De svåra talen
- Live med release v62 `30b5c58` (23/9).
- Standardinställningarna i `js/multiplication.js` (`SET`) är fast strategi, eget rekord i stället för klocka,
  omvända frågor på och upp till 10.
