# Plan: D48, övningsbladens yta som standard i multiplikationen och kort division

2026-11-12. Beslut: D48 och D48 ✎ (VD:n personligen; bara polering, logik och pedagogik rörs inte; jämför också
övningsbladen mot multiplikationen). Facit för ytan: `js/ovningsblad.js` (knappsatsen `padHTML`, kladden `kladdHTML`,
berömmet `cheer`).

## Inventering (skärmbilder i 390 × 797, dev-spegeln)

| Del | Övningsbladen (standard) | Multiplikation, Räkna med hjälp | Multiplikation, Räkna själv |
|---|---|---|---|
| Inmatning | direkt i rutan med fokus | ett eget svarsfält ovanför knappsatsen; svaret flyttas sedan till cellen | direkt i cellen |
| Knappsats | 5 × 2 fyrkantiga vita brickor, full bredd | 5 × 2 runda knappar med kant, smalare | 3 × 4 rutnät, hög Klar till höger |
| Sudda | bricka med ikon, i raden med svarsknappen | rund knapp | bricka under 7:an |
| Svarsknapp | bred, "Svara" / "Nästa ruta" → "Klar", ljus tills något skrivits | "Skriv svaret…" (grå) → "Klar ✓" | hög "Klar" |
| Hjälp | "Ledtråd 2 kvar" i kortet (Själv) | gul "Livlina (2 kvar)" i knappraden | gul "Livlina 2" under knappsatsen |
| Kladd | ikonrad överst: Rita, Sudda, Ångra, Gör om, Rensa | textknappar nederst: Rita, Sudd, Rensa (ingen Ångra) | samma |
| Beröm | konfetti + snurrande ord när uppgiften är klar (v79) | "Rätt!"-text | "Rätt!"-text |
| Rubrik | "Själv 1/3" i en bricka | "1/5" | "1/5" |

Dennis 12/11: cellinmatningen i multiplikationen "är inte så smart" (erkänd brist).

## Det övningsbladen saknar jämfört med multiplikationen

- **Man kan fastna för gott.** Själv: efter två ledtrådar säger appen bara "Inte riktigt – försök igen" om och om igen
  (`sfCheck`). Med hjälp: varje fråga upprepas utan att hjälpen ökar (`typeAnswer`). Multiplikationen och
  Matteprovet har hjälptrappan (fel → ledtråd → en bit → svaret och Nästa, D38).
- **Det som blev fel kommer inte tillbaka.** Matteprovets nötloop lägger en uppgift med fel sist i passet igen
  (1/8 → 2/9); övningsbladens omgång har ett fast antal uppgifter.

## Dennis val (D48 ✎ 12/11)

1. Räkna med hjälp skriver **direkt i cellen** med fokus (inget eget svarsfält).
2. Hjälpknappen heter **Ledtråd** överallt.
3. Övningsbladen får **hjälptrappan** (fel → försök igen → ledtråd → svaret och Nästa). Fel uppgifter kommer inte
   tillbaka.

## Skivor

1. Övningsbladens hjälptrappa (`js/ovningsblad.js`: `typeAnswer`, `sfCheck` och modulernas egna rättningar). **Klar 12/11:**
   alla åtta moduler i Själv och sju i Med hjälp spelade med bara fel svar till Nästa uppgift, utan beröm (Vilket tal? i
   Med hjälp har bara tryckval och är oförändrad).
2. Multiplikationen och kort division (`js/multdiv.js`), bara ytan: knappsatsen och svarsknappen som övningsbladens,
   inmatning direkt i cellen i Räkna med hjälp, Ledtråd i stället för Livlina, kladden med ikoner och Ångra/Gör om,
   berömmet med konfetti och snurrande ord. Logik, steg, texter i stegen och hjälptrappan rörs inte.
   **Klar 12/11** i fyra steg: kladden (ikonrad, Ångra/Gör om, 44 px), knappsatsen i båda lägena och Ledtråd, svaret
   i en ruta i frågan (multisiffriga svar som 24 kan inte stå i en cell; flygningen till cellen är kvar), berömmet via
   `Ovningsblad.cheer` när uppgiften är klar och rätt (inte i Matteprovet).
3. Svep före/efter i båda lägena och nivåerna, skärmbilder bredvid övningsbladen, Dennis provar.
