# MINNESSIFFER-KONCEPT — "Levande minnessiffror" (v30)

Beslutad av Dennis 2026-07-03 ("bygg det"). Bakgrund: appen ska träna
PAPPERSVANAN — minnessiffrans livscykel: skrivs liten → vilar → används
→ STRYKS (aldrig suddas) → kvarstår som spår. Mira räknar rätt men
saknar strukturen; appen ska nöta in den. Källa: svensk standardmetodik
(Mitt i Prick 4A, Matteboken, Eddler) + Dennis foto ur Miras bok.

## Omfattning v30

- uppstallning.js: ADDITION (minne-raden). Subtraktion RÖRS INTE (lånen
  stryks redan synligt och suddas inte).
- multdiv.js: MULTIPLIKATION alla nivåer (minnesspalten), inkl nivå 4
  där delprodukt 1:s strukna minnen står kvar när delprodukt 2 räknas.
- Division berörs inte (mellanrester är redan pappers-korrekta).

## Visuell standard (BÅDA modulerna — identisk)

- Klass `.mem-digit`: liten (~60 % av talstorlek), lätt roterad (−4°),
  RÖD pennfärg (#dc2626-familj, AA-säkrad mot bakgrunden) — som i Miras
  bok. Ersätter amber i minnes-sammanhang (amber kvar i bubbeltext-
  färgning är ok, men själva siffrorna på "papperet" är röda).
- `.mem-digit.used`: struken med animerat snett penndrag (SVG-linje med
  lätt vobbel, ritas på ~250 ms) + opacity 0.5. STÅR KVAR hela uppgiften.
- INGET raderas under en uppgift. Ny uppgift = tomt papper.
- Placering: addition = befintliga minne-cellerna ovanför kolumnerna.
  Multiplikation = MINNESSPALT till höger om faktorraden (per Dennis
  foto: "1̶ 2" bredvid ·43-raden); varje ny minnessiffra appendas EFTER
  föregående (strukna som ostrukna), radbryt vid behov.

## Demo ("Titta och lär") — nya steg

- PLACERING är eget steg: "1:an skrivs som minnessiffra här 👇" +
  siffran ritas på sin plats (i fas, v28-mönstret).
- STRYKNING är eget steg efter användningen: "Nu stryker vi 1:an — den
  är använd! Så vet vi att den inte räknas igen. ✏️" + penndraget ritas.

## Hjälpläget — barnet utför livscykeln (kärnträningen)

Nya faser i hjälpkön (deterministiska steg, inga races):
1. PLACERA: efter korrekt kolumnsvar som ger minnessiffra: "Var ska
   minnessiffran?" — rimliga mål pulserar svagt; barnet TAPPAR rätt
   plats (nästa kolumns minnescell resp. minnesspalten-nästa-slot) →
   siffran skrivs. Fel tap → mild vägledning ("Nästan — den ska stå
   här 👉" med rätt plats markerad), inget poängstraff, tappa igen.
2. STRYKA: efter kolumnen där minnet ANVÄNTS besvarats rätt: siffran
   pulserar + "Stryk minnessiffran — den är använd!" → barnet tappar
   den → penndrag. Strykfasen är ett krav för att gå vidare (det ÄR
   träningen) men formuleras alltid positivt; tap någon annanstans →
   "Titta — 1:an är inte struken än 👀".
- MINNESMÄSTARE ⭐: klaras ALLA placera+stryk-moment i passet utan
  fel-tap/vägledning → stjärna + "Minnesmästare!" i resultatvyn.
  Aldrig något negativt vid miss — bara utebliven bonus.
- **SISTA minnessiffran undantas (Dennis 2026-07-03):** minnessiffran
  vars användning sker i uppgiftens SISTA beräkningssteg behöver inte
  strykas (inget kommande att förväxla med) — stryk-fasen skippas där,
  i både demo och hjälpläge, och momentet räknas inte i Minnesmästare.
  Alla minnessiffror FÖRE den sista har kvar strykkravet. (Nivå 4:
  delprodukternas minnen är aldrig "sista" — bara additionsfasens
  sista minne kan vara det.)

## Fria läget — frivillig minnesspalt + smart feedback

- Minnesrutorna/minnesspalten är TAPPBARA (frivilliga, som papper):
  tap på tom → liten sifferväljare 1–9 → skrivs; tap på skriven →
  stryks; tap på struken → rensas. Påverkar ALDRIG rättningen.
- **Glömd-minnessiffra-detektion:** vid fel svar, simulera algoritmen
  med alla carryIn = 0 (kolumnvärde skrivs mod 10, carry genereras men
  adderas aldrig). Matchar barnets svar simuleringen → riktad feedback:
  "Nästan! Kolla minnessiffrorna — någon vill vara med! 👆" istället
  för generisk. (Multiplikation nivå 4: simulera hela kedjan inkl
  delprodukter och slutaddition med samma regel.) Förbrukar första-
  försöket som vanligt — bara TEXTEN är smartare.

## Tekniska kontrakt

- Inga poäng-/quiz-semantikändringar. v28-demomönstret (bubbla före
  animation). Barn-UX-lagen. No-scroll alla 4 viewports (minnesspalten
  får inte bredda mult-tabellen till overflow på 390px — krymp/radbryt).
- Per-modul-CSS (ingen delad fil ändras); klassnamnen `.mem-digit`/
  `.used` är GEMENSAM konvention båda modulerna följer.
- sw.js v29→v30, app.js APP_VERSION v30.
