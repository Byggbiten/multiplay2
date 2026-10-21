# Logg – Uppställd multiplikation (multdiv)

Rollens lärdomslogg: en post per runda. Tillståndet nu: `OVERLAMNING.md`.

## Runda 1 · 2026-10-21 · Nivå 4: den osynliga nollan och blandade tal (D40), gren `niva4`
- **Vad som inte fungerade:** rad 2 på nivå 4 saknade rutan i entalet (Dennis skärmbild 67 · 29), så barnet såg inte
  varför raden flyttas. Nivå 4 hade bara tvåsiffrigt · tvåsiffrigt, medan det svårare bladet blandar fyra sorter.
- **Byggt:** den grå rutan med nollan i demon och hjälpläget, nivå 4 som en påse med 3 · 1, 4 · 1, 2 · 2 och 3 · 2,
  motorn till fem kolumner, formen efter faktorn. Efter Dennis förtydligande: faktorcellerna och målrutan lyser
  samtidigt, och texterna säger platsen; nivå 1–3 behöll sina ord.
- **Rättat:** fria lägets rätta svar kunde dra in nästa uppgift efter Avsluta (`finishTask` utan `exGen`-kontroll),
  hittat när panelen hoppade tillbaka in i en övning.
- **Lärdom:** när en ny regel ska gälla bara en nivå, gör villkoret explicit (`isD40`) och lås de gamla texterna
  ordagrant i ett test. Annars glider nivå 1–3 med utan att någon märker det.

## Runda 2 · 2026-10-21 · Siffrorna i texten färgkodas och pulserar (D40 ✎), gren `farg-siffror`
- **Vad som inte fungerade:** i "Först räknar vi 98 · 5 — entalssiffran i 65" gick det inte att se vilken 5:a som
  menades. Gamla texter färgade siffror efter målkolumnen, inte efter sin egen cell, och färgade produkter som inte
  står i någon cell.
- **Byggt:** `ref(plats, värde)` och `multRefs` som enda källa för text och pekning; `pulseRefs` slår upp noderna
  innan stegets rörelse flyttar dem. Divisionen fick refs för täljar- och kvotsiffror; resttexterna är orörda.
- **Rättat:** divisionens ordagranna tester jämför nu orden utan taggar.
- **Lärdom:** en markering som bär sin plats (`data-ref`) gör påståendet "texten och cellen pekar på samma sak"
  testbart; ett mutationsprov (b-cellen pekad fel) fällde två tester, så svepet var inte tomt.

## Runda 3 · 2026-10-21 · Matteprovets räknesätt via kroken runTask (D41), gren `matteprov-metod`
- **Vad som inte fungerade:** matteprovet hade bara delprodukter per siffra, medan multiplikationen lär ut
  minnessiffran, som Dennis förespråkar.
- **Byggt:** `runTask`, en isolerad krok som räknar en uppgift i hjälpläget eller fria läget och lämnar utfall,
  felklass och tabellfakta. Matteprovet använder hjälpläget i Öva och fria läget i provet.
- **Rättat:** multdivs nivå ändrades till 4 av en lånad uppgift (återställs nu efter varje uppgift).
- **Lärdom:** låna motorn i stället för att kopiera den, men spara och återställ allt den delade motorn ändrar.

## Runda 4 · 2026-10-21 · Delraderna och nollan i Räkna själv (D41 ✎, P15), samma gren
- **Vad som inte fungerade:** Dennis: "den där nollan i grå ruta saknades". Räkna själv visade bara svarsraden (D7),
  men läraren rättar nollan på rad 2.
- **Byggt:** rad 1, rad 2 med nollan och summan i fria läget; "Nästa rad" tills allt har siffror, sedan Klar;
  summan låst; `freeCheck` rättar raderna före summan med glömd minnessiffra per rad.
- **Rättat:** en lånad uppgift som lämnats utan Avsluta följde med in i multdivs egna lägen (rubriken "82 · 68 1/1"
  i en vanlig övning); den släpps nu i lägesvyn och när egna övningar startar.
- **Lärdom:** "barnet räknar i kladden" räcker inte när läraren rättar en mellanrad. Mät kladdens höjd i varje
  tillstånd: bubbla och ledtrådsruta samtidigt tog den ner till 74 px.

## Runda 5 · 2026-10-21 · Nollorna i Dela upp och ordningen (D41 ✎), gren `matteprov-nollor`
- **Vad som inte fungerade:** de förskjutna raderna i Dela upp hade tomma prickrutor (4819 · 9). När nollorna väl
  fanns kom de efter svaret, och förklaringen sade inte varför just så många.
- **Byggt:** i matteprovet grå rutor med nollor som sätts före radens fråga och förklaras med siffrans värde (Öva i
  steg, provet en rad med "därför"). I multdiv fick rad 2 samma förklaring ("2 står i tiotalet och är värd 20 …").
- **Rättat:** meningar där samma tal hade två roller ("Rad 2: 2 står i …", "100 är 1 · 100"); radens nummer blev en
  etikett, och för siffran 1 hoppas mellanmeningen över. Ett svep i vitest vaktar regeln.
- **Lärdom:** ordningen är en del av pedagogiken. Lägg den som ren data (`uppRowFlow`) så att den går att testa, och
  svep språkregeln maskinellt i stället för att läsa exemplen.

## Runda 6 · 2026-10-21 · Minnessiffran utan fokusbyte (kontroll), gren `minne-fokus`
- **Uppdrag:** kontrollera om fria läget (Räkna själv, och matteprovets minnessiffreläge via `runTask`) byter fokus
  när en minnessiffra sätts, som matteprovets Dela upp gjorde.
- **Utfall:** nej. Fria läget har ingen minnesinmatning: spalten har ingen plats och ingen väljare, och minnessiffrorna
  landar först vid rätt svar. Uppmätt i webbläsaren (82 · 68): fokus står kvar på `md-p1-1` efter ett tryck i spalten.
  Ingen ändring i `js/multdiv.js`.
- **Lärdom:** kontrollera "samma fel här?" genom att mäta fokus före och efter i det andra läget, inte genom att
  läsa koden; minnesspalten beter sig olika i hjälpläget (väljare) och fria läget (bara landning).
