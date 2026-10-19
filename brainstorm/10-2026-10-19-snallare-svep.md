# 10 · 2026-10-19 · Snällare återkoppling i hela appen (D39)

Svep av en agent i egen arbetskopia (grenen `snallare-svep`, commit `5067e60`, mergad till dev). Uppdraget: ord,
färger och ljud vid fel svar i alla moduler utom matteprovet (som en annan agent gjorde samtidigt). Pedagogik och
logik orörda. Sammanfattning av rapporten.

## Ändrat
- **Ord:** dömande text ("Fel!", "Fel svar", "Tyvärr", "Prova igen! 💪", "Fortsätt öva!", "N av M rätt") ersatt med
  "Inte riktigt – försök igen", "Så här blir det: X", "Bra kämpat!" och `MP.resultNote` ("Du klarade 7 av 10 – de
  andra övar vi mer på"). Kvittonas "Fel som rättades" heter "Blev rätt på nytt försök". Gäller shared, multiplication,
  clock, multdiv, uppstallning, platsvarde, tenfriends, np-matte-skriftlig, np-matte-muntligt, np-svenska, geografi.
- **Färger:** rött för fel svar → persika (`#fff3e6` / `#fdba74` / `#9a3412`); på geografikartan prickad grå kontur
  (persika krockade med bärnstenen som visar rätt plats). ❌/✗ borta; ○ i detaljlistor.
- **Ljud:** felljudet spelas högst en gång per uppgift/fråga/kolumn i stället för vid varje försök.
- **Test:** `tests/snallare.test.mjs` sveper js/ (utom matteprov) efter "Fel!", "Fel svar", "Tyvärr" i strängar;
  provat mot gamla `np-svenska.js` (föll på "❌ Fel!") innan det blev grönt.

## Kvar som det var (rött med pedagogisk betydelse)
Minnessiffror och mellanrester, hundratalets platsvärdesfärg, klockans minutfärg, "Här bor du"-nålen, "✗ Falskt" i
sant/falskt, ⌫-knappar och profilradering.

## Utfall
- D39 genomförd i övriga moduler; släpps med v69.
- Öppna frågor till Dennis: P13 (Klar efter en enda siffra i fria lägen) och P14 (skakningar vid fel och röd puls i
  demon).
- Inte klickat i webbläsaren: platsvärde, 10-kompisar, NP-modulerna och resultatskärmarna (enhetstest och
  kodgranskning).
