# MULTDIV-SPEC — Multiplikation & Division med uppställning (åk 4)

Beslutad av Dennis 2026-07-03. Målgrupp: Mira, född 2016, börjar åk 4.
Modulen är SYSKON till Uppställd addition/subtraktion: samma tre lägen
(Titta och lär / Räkna själv med hjälp / utan hjälp), nivåskala 1–4,
barn-UX-lagen, kladd-lagen, miniräknar-inmatning i fritt läge,
demo-motorns text-i-fas-mönster (bubbla FÖRE animation, v28).

## Dennis låsta beslut

1. Division = **kort division** (divisorn till vänster, kvoten skrivs
   siffra för siffra OVANFÖR täljaren, mellanrester som små siffror
   framför nästa täljarsiffra). INTE liggande stolen.
2. **Eget spelkort** i spelväljaren: "Multiplikation & Division",
   egen hubbvy med två val (Uppställd multiplikation / Kort division)
   + svårighetschips 1–4. Egen palett (turkos/teal + solgul accent —
   ledig färgfamilj). Modul-id 'multdiv', root #multdiv-root.
3. Multiplikation nivå 4 = tvåsiffrigt × tvåsiffrigt MED delprodukter.

## Multiplikation med uppställning

Uppställning: faktor A överst, × B under (högerställt), svar under
strecket, minnessiffror som små siffror i minne-raden (samma visuella
som additionens carry-rad).

**Beräkningsgång (ensiffrig faktor B), per kolumn höger→vänster:**
siffra × B + ev. minnessiffra → om ≤9: skriv siffran. Om >9: skriv
entalssiffran, skicka upp tiotalssiffran som minnessiffra. SISTA
kolumnen: skriv hela värdet (kan bli 2 siffror → svaret växer vänster).

**Bubbel-språk (återanvänd additionens metaforer, men OBS: minnessiffran
kan vara 1–8, aldrig säg "10:an"):**
- highlight: (tom, markera kolumn)
- calc: "7 × 6 = 42" (gångertabells-koppling!)
- over9: "42... det är mer än 9! 🤔"
- write+carry: "Vi skriver 2:an — och skickar upp 4:an som minnessiffra! ⬆️"
- med minne: "2 × 6 = 12, plus 4 i minne = 16"
- sista kolumn 2-siffrig: "18 plus 1 i minne = 19 — sista kolumnen, så
  hela 19 får plats! ✅"

**Nivåer:**
| Nivå | Innehåll | Exempel |
|---|---|---|
| 1 🌱 | 2-siffrigt × (2–4), INGEN minnessiffra (varje siffra×B ≤ 9) | 23 × 2 = 46 |
| 2 🌿 | 2-siffrigt × ensiffrigt (2–9), GARANTERAT minst en minnessiffra | 23 × 4 = 92 |
| 3 🌾 | 3-siffrigt × ensiffrigt, minst en minnessiffra, svar ≤ 9999 | 327 × 6 = 1962 |
| 4 🌳 | 2-siffrigt × 2-siffrigt med delprodukter | 34 × 26 = 884 |

**Nivå 4-pedagogik (delprodukter) — LAYOUT ENLIGT MIRAS MATTEBOK
(Dennis foto 2026-07-03, exempel 56 · 43 = 2408):**
```
      5 6
    · 4 3
    ─────
    1 6 8     ← 56 · 3 (entalsraden)
+ 2 2 4       ← 56 · 4 (tiotalsraden), FÖRSKJUTEN ett steg åt vänster
  ─────          UTAN platshållar-nolla, med + framför
  2 4 0 8
```
Rad 2 skrivs alltså förskjuten — INTE med nolla. Bubbel-språk: "4:an är
tiotal — därför börjar vi skriva ett steg åt vänster!". Sist ADDITION av
delprodukterna med additionens befintliga pedagogik-språk (inkl.
minnessiffror i additionen). I uppställningen används bokens
multiplikationstecken **·** (mittpunkt) — i bubbeltexterna får "7 · 6"
också användas för konsekvens med boken (Gångertabellen-modulen behåller
sitt ×; multdiv följer åk 4-bokens notation). Demo visar alla tre
faserna. Hjälpläge nivå 4: numpad per delproduktsiffra + additionsfasen.
Fritt läge: barnet skriver slutsvaret.

## Hjälplägets frågeflöde + livlinor (Dennis 2026-07-03, v31)

**Tvåstegsfrågan** (ersätter "Vad är 4 · 7 + 1 (minne)?" — för långt tänk):
1. Först BARA tabellfrågan: "Vad är 4 · 7?" → barnet svarar 28.
2. Om minnessiffra finns: retorisk påminnelse som eget steg: "Har vi
   någon minnessiffra som ska med? 👀 Just det — 1:an! Vad blir
   28 + 1?" → barnet svarar 29. Utan minne: bara steg 1.
Gäller alla kolumnfrågor med carryIn (även nivå 4:s additionsfas:
"Vad är 6 + 4?" → minnespåminnelsen separat).

**Livlinor:** 2 st per övningsrunda (5 uppgifter, hjälpläget — gäller
även division). Knapp "🛟 Livlina (X kvar)" synlig vid varje fråga;
disabled när 0 kvar. Klick → svaret VISAS i bubblan ("4 · 7 = 28 —
skriv in det själv! ✍️") MEN barnet MÅSTE skriva in det på numpaden
(pedagogik: se + skriva själv = fastnar; aldrig bläddra förbi).
Ingen poängpåverkan. Räknaren nollställs per runda.

## Kort division

Layout: divisorn till vänster, lodrätt avskiljare, täljaren till höger.
KVOTEN skrivs ovanför täljaren, siffra för siffra. Mellanrest skrivs som
LITEN siffra uppe till vänster om nästa täljarsiffra (9 rest 1 före 6 →
"¹6" läses sexton).

**Beräkningsgång, siffra för siffra vänster→höger:**
"Hur många HELA 4:or ryms i 9?" → 2 (för 2×4=8) → skriv 2 i kvoten
ovanför 9:an → rest 9−8=1 → lilla 1:an framför nästa siffra → "nu har vi
16" → "4:or i 16?" → 4 → skriv 4. Kvot: 24.
Specialfall: första siffran < divisorn (336÷6): "6:or i 3? Det går inte —
vi tar med nästa siffra: 33!" (ingen kvotsiffra skrivs över 3:an).

**Alla uppgifter går JÄMNT UPP (rest 0 i svaret).** Rest-svar (t.ex.
75÷4 = 18 rest 3) är en dokumenterad FRAMTIDA utbyggnad — inte nu.

**Nivåer:**
| Nivå | Innehåll | Exempel |
|---|---|---|
| 1 🌱 | 2-siffrigt ÷ (2–5), ingen mellanrest (varje siffra delbar) | 84 ÷ 4 = 21 |
| 2 🌿 | 2-siffrigt ÷ (2–5), MED mellanrest | 96 ÷ 4 = 24 |
| 3 🌾 | 3-siffrigt ÷ (2–5), mellanrester, ingen nolla i kvoten, första siffran ≥ divisorn | 738 ÷ 3 = 246 |
| 4 🌳 | 3-siffrigt ÷ (6–9) OCH/ELLER första siffran < divisorn ELLER nolla i kvoten | 336 ÷ 6 = 56, 612 ÷ 6 = 102 |

Generator-krav: konstruera BAKLÄNGES (slumpa kvot + divisor → täljare =
kvot × divisor) så jämn delning garanteras; verifiera nivåvillkoren på
den framräknade stegsekvensen, annars slumpa om.

**Bubbel-språk:**
- "Hur många hela 4:or ryms i 9?" → "2 stycken! För 2 × 4 = 8"
  (gångertabellen baklänges!)
- rest: "9 − 8 = 1 blir över — 1:an ställer sig framför 6:an: nu har vi 16!"
- jämnt: "16 ÷ 4 = 4, precis jämnt! ✅"
- klart: "Klart! 🎉 96 ÷ 4 = 24 — kolla: 24 × 4 = 96!" (verifiering med
  multiplikation — knyter ihop räknesätten)

## Lägen (samma kontrakt som uppstallning.js)

- **Titta och lär:** "Nästa steg"-knapp, bubbla FÖRE animation (v28-
  mönstret!), "Klart!"-bubbla med 1,8s lästid, "Ny uppgift"/"Tillbaka".
- **Räkna själv med hjälp:** guidade faser med framåtblickande knappar
  (mönstret från additionens exTenStep1–3), numpad per delsvar, fel →
  mild "prova igen" utan poängstraff, INGET facit-avslöjande i
  divisionens frågor ("Hur många 4:or i 16?" — svaret sägs inte).
  **Divisionens papperstänk (motsvarar minnessiffrorna):** mellanresten
  är divisionens levande anteckning — efter kvotsiffran frågas "Blir
  något över? 9 − 8 = ?" → barnet svarar resten → sedan PLACERA-fas:
  "Var ska resten stå?" → barnet TAPPAR platsen framför nästa
  täljarsiffra → liten röd ¹ skrivs (samma .mem-digit-pennstil).
  Rester stryks INTE (som på papper — de uppgår i nästa tal: "nu har
  vi 16"). Livlinorna (2/runda) gäller även divisionens frågor.
- **Utan hjälp:** miniräknar-fältet (v27-mönstret): svaret skrivs
  vänster→höger, ⌫, Klar gated (≥1 siffra), max 4 siffror, +1 poäng
  endast helrätt första Klar, 5 uppgifter, samma resultatvy.

## Teknik

- Ny fil `js/multdiv.js` (IIFE, window.MultDivGame, mönster från
  uppstallning.js). Egen style-injektion med tokens; .theme-multdiv
  (turkos) i app.css. Kladd-canvas ingår i övnings-/demovyerna
  (kladd-lagen). Loggnyckel `multdiv_log_<id>` via MP.createLog —
  LÄGG TILL i App.deleteProfile-rensningen + spelkortets statuschip.
- Spelväljaren: sjätte kortet "Multiplikation & Division" (✖️➗-SVG-ikon,
  turkos accentstripe) — layouten måste fortsatt klara no-scroll i
  1180×820, 820×1180, 390×844, 390×664.
- index.html: script-tagg + spelkort; app.js: routing 'multdiv' +
  screenMap + timer-stopp-vägen; sw.js: multdiv.js i ASSETS + v29.
- Demo-motor: EGEN stegmotor i multdiv.js enligt v28-mönstret (bubbla
  före executeStep) — kopiera inte off-by-one-buggen.

## Bygge i två steg

A. Modul-skelett + MULTIPLIKATION komplett (alla lägen, nivå 1–4) +
   app-integration (kort, routing, tema, sw).
B. DIVISION komplett i samma fil (hubben aktiverar valet).
Grind per steg: syntax, vitest, demo-steglogg (text/animation-fas),
fritt läge-poängtest, no-scroll 4 viewports, kodgranskare före push.
