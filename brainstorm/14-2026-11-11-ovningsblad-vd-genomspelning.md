# 14 · Övningsblad · Division – VD:ns egen genomspelning efter runda 7

2026-11-11. Dennis: "När den är klar så vill jag att du personligen skall spela igenom alla delar som hör till
divisionsprovet och ta skärmdumpar och analysera och försöka hitta förbättringar."

**Så gjordes det.** Dev-spegeln (grenen `ovningsblad-runda7`, `f667aa1`) i 390 × 797, egen styrning i webbläsaren.
Spelat: introt (Dela lika), Dela lika (Lättare med hjälp, alla steg; Lättare själv), Hur många grupper (Svårare med
hjälp, alla steg; Svårare själv), Kontrollera (Lättare), Rest (Svårare, tallinjen), Ingår (Lättare), Varje talsort
(Lättare, tiotal och ental), 10/100/1000 (Svårare), Pengar (Lättare), Begrepp (Svårare), Problemlösning (Svårare),
Slutledning (Lättare, alla steg), Divisionstestet (alla 20, ett fel med flit, Klar), Kort division (Svårare med
hjälp, första steget). Inte spelat: Själv i alla moduler, Svårare i alla moduler.

Dennis eget fall (Grupper, Svårare, nämnaren) är rättat: ring på "6" i frågan och på nämnarrutan, "4 grupper" först
i kvotens steg.

## A · Tydliga fel (rättas direkt)

| Id | Modul | Fel |
|---|---|---|
| A1 | Pengar | Bandet från "4 gånger" går vågrätt genom kolumnrubrikerna "Priset på ett" och "Hur många får du?". "4 gånger" står inte ovanför sin ruta. Svepet räknar inte rubrikerna (`.mp-pth`) som text. |
| A2 | Begrepp (Svårare) | Stegtexten säger "Vad ska stå under strecket?" men rutan i fokus, och bandet från 91, är täljaren ovanför. |
| A3 | Divisionstestet | Efter Klar ligger raden "Kontrollera: 10 · ? = 30 ?" över rutan "Du har 19 klara". Räknaren uppe till höger visar "/20" utan tal. |
| A4 | Slutledning | Brickan "6" står kvar och svävar över rutorna när den redan är använd. "fem" står bara som ord, så nämnarens ruta saknar både källa och hjälp. |
| A5 | Dela lika, Rest (kontrollen) | Det korta bandet från kvoten till kontrollens ruta går genom etiketten "kvot". |
| A6 | Kort division | Kolumnerna heter T H T E: både tusental och tiotal heter "T". |

## B · Förbättringar (pedagogik och form)

| Id | Var | Förslag |
|---|---|---|
| B1 | Kontrollen i alla moduler | "Vad blir 2 · 7?" ringar in täljaren 14, så barnet skriver av svaret i stället för att räkna. Ringa in faktorerna 2 och 7 under steget, och visa "= täljaren" med en bock först efter svaret. |
| B2 | Grupper, Svårare, täljarens steg | "Hur många är det från början?" har ingen hjälp alls. Med hjälp: grupperna får löpande summa (6, 12, 18, 24), alltså hoppräkning, och den sista summan är källan. |
| B3 | Varje talsort, 10/100/1000, Problemlösning, Begrepp | Bilden och bråket är små och trånga, medan kladden tar halva skärmen. Låt bilden och rutorna växa och ge kladden det som blir över (golv 120 px). |
| B4 | Ingår, Kontrollera | Grupperna trängs på två rader, och nummerbrickorna ligger över ramarna. Det behövs luft eller mindre prickar per grupp. |
| B5 | Kort division | Den ser ut som en annan app: annan knappsats, separat svarsfält, "Livlina", "Skriv svaret…" och kladdknappar med text. Låt den dela knappsatsen och kladden med de andra bladen. |
| B6 | Introt | Små bilder i ett tomt kort. Barnen står i en annan uppställning än i uppgiften. Bråket saknar täljare, nämnare och kvot, och bandet visas aldrig. Introt bör visa uppgiftens egen vy, steg för steg, med bandet. |
| B7 | Varje talsort | "Vad blir 6/2?" bör sägas med talsorten: "6 tiotal delat med 2". |
| B8 | Slutledning, Lättare | Uppgiften är abstrakt för en tvåa ("Vilket tal tänker jag på?" med rest). Den behöver en bild: grupper och resten, som i Rest. |

## Det som fungerar

- Summabrickan rakt ovanför rutan med ett kort band (Dela, Grupper, Rest, Ingår).
- Ringen när ingen fri väg finns.
- Nedtoningen i grått.
- Kvittot ("14/2 = 7. Kontroll: 2 · 7 = 14.").
- "Titta en gång till på de orange" i Divisionstestet.
- Själv utan band.
