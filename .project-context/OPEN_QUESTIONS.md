# OPEN_QUESTIONS — det olösta

Öppna frågor står under `## Öppna`. Besvarad fråga flyttas till `## Besvarade`, stryks `~~text~~ → Dn` och raderas
aldrig. Nya frågor får nästa P-nummer.

## Öppna

### Uppställning och division

- **P1 Faktan före eller efter svaret i Räkna med hjälp.** I kort division visas tabellraden (`6 · 7 = 42`) innan
  barnet svarar på kvotfrågan, som i mockupen. Mira invände två gånger: läget blir "läs av brickan", och hon vill se
  faktan efter svaret eller när hon trycker Livlina (`SPEC-KORT-DIVISION.md` §8 punkt 6). Dennis valde involvering
  (D4), men ordningen är inte prövad igen.
- **P2 "1 av 5 rätt".** Formuleringen mot antalet avklarade uppgifter: säger den vad barnet faktiskt gjort?
- **P3 Klart i hjälpläget och i Räkna själv.** Klart går vidare automatiskt efter ungefär 3 sekunder i hjälpläget,
  och Räkna själv saknar texten "Klart". Ska det vara så? (Iakttaget i genomspelen 22–23/9; inte omkontrollerat i
  koden 19/10.)

### Gångertabellen

- **P4 Prickraden i Öva.** Prickraden saknar förklaring av romb och ring, och två genomgångar kan komma i följd.
  (Dennis 23/9: "jag hänger inte riktigt med i ordningen".)

### Klockan

- **P5 Tolv fasta tider per steg.** Varje steg har tolv tider, en per timme; i Kvart och Runt halv har varje timme en
  fast form (antingen "över" eller "i"). Förväxlingen finns alltid bland felalternativen. Räcker det, eller ska båda
  formerna övas för varje timme?
- **P6 Dra visarna med ett riktigt finger.** Draget är bara provat med simulerade händelser i webbläsarpanelen,
  aldrig på en riktig telefon.
- **P7 Emojis och slumpade alternativ i gamla vyer.** Klocktestets resultatvy visar fortfarande en emoji-medalj
  (`MP.feedbackMessage` i `showTestResult`, `js/clock.js`). Eget matteprov hade slumpade alternativ; det togs bort ur
  hubben i v58. Kontrollerat 19/10: dess vyer finns inte kvar i `js/multiplication.js`. Kvar är loggens etikett
  "Eget prov" med ikonen 🎲 för gamla poster, och `runCustomSession`, som Fokuserad träning i Statistik använder.

### Geografi

- **P8 Geografimodulens upplägg och pedagogik.** Hur Sveriges landskap ska läras ut och övas (D22): lägen, frågetyper,
  kartans interaktion, hur läxbokens numrering 1–25 används, och om modulen delar lådorna och nötloopen i
  `js/shared.js`. Förslag 19/10: `brainstorm/07-2026-10-19-geografi-landskap.md` och `design-lab/geografi-mockup.html`,
  med sex val att döma i tankepassets Utfall.

## Besvarade

- ~~P9 Grenarna på GitHub: ska de tio sammanslagna grenarna tas bort?~~ → D23
