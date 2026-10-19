# design-lab/ — klickbara mockuper

Mockuperna är facit för det de visar: det Dennis godkänt i mockupen är det appen ska göra. De är fristående
HTML-filer, inte appkod, och följer inte med till dev-spegeln (`rsync --exclude 'design-lab'`). Servera dem på
`:5420` lokalt och `https://macbook-pro.tail3c8e5a.ts.net:8446` för telefon (se `CLAUDE.md`).

| Mockup | Facit för | Status |
|---|---|---|
| `tiokompis-exakt-10.html` | Uppställd addition när entalen blir exakt 10: tiokompis-genvägen i stället för kompletteringsmetoden. Spalt 0 är dåvarande flöde som jämförelse. | Godkänd 20/9 ("ditt förslag … blev superbra!"), införd `700b2a2` i v38, live i v38 |
| `tiokompis-barnvy.html` | Hela additionens nya pedagogik, en idé per steg: tankerutan, summebrickan, minnet från största talet. Valda växlar och förkastade alternativ står i `.project-context/SPEC-UPPSTALLNING-ADDITION.md`. | Godkänd 20–21/9 (valda lägen enligt specen), införd v38 (`022d04e` m.fl.), live i v38 |
| `inmatning-barnvy.html` | Räkna själv i Uppställning: svaret skrivs i cellerna från entalet, Enter-formad Klar-knapp, kladden direkt mot knappsatsen. De tre layoutalternativen i filen är förkastade jämförelser. | Avgjord 21/9 ("bättre som det är idag, förutom att cellinmatning passar bättre"), införd `8c32557` i v38, live i v38 |
| `kort-division-mockup.html` | Kort division med tabellraden (`6 · 7 = 42`) i alla tre lägena; spec `.project-context/SPEC-KORT-DIVISION.md`. | Godkänd 22/9 ("EXAKT så där vill jag ha det i liveversionen", D5), införd `50a618d` i v54, live v54. Räkna själv ändrat efteråt av D6 |
| `gangertabell-mockup.html` | Gångertabellens hubb: tabellkartan, Lär dig strategin (rektangeln), Öva med lådor och omvända frågor, Rekordrunda. | Godkänd 23/9 ("jag gillar det du har gjort", D9), införd `3e4794f` i v57, live v62. Hemvyn har ändrats efter mockupen (v58 övningspass, v60 Träna en tabell) |
