# 12 · 2026-11-11 · iPad: mätning och förslag (D45)

Mätning per vy i iframe med iPad-storlekar (768 × 1024, 820 × 1180, 1032 × 1376, stående och liggande) mot 390 × 844.
Sammanfattning av rapporten; inget ändrat.

## Nuläget
- Två sorters vyer. **Låsta kolumner** (gångertabellen 440 px, klockan 520, matteprovet 560, geografin 560 via
  `#geo-root{max-width:560px}`) blir "iPhone i mitten": 37–68 % av bredden på iPad Air, 32–54 % på Pro 13; stora tomma
  band (gångertabellens huvudvy glapp 381–575 px). **Helskärmsvyer** (uppställning, M&D, platsvärde, NP) fyller ytan,
  men uppgiften och texten är iPhone-stora och resten är tom kladd.
- Text 12–16 px median på iPad i de flesta vyer; capybarasamlingens etiketter 9 px.
- iPhone fyller 89–97 % utan scroll i alla vyer (referensen).
- Skalfaktor k = min(b/390, h/844): stående 1,21 / 1,40 / 1,63; liggande 0,91 / 0,97 / 1,22. Förstoring hjälper bara
  i stående läge; liggande behöver två spalter.

## Förslag
1. `--k` på `html` (skript i index.html, bara när kortsidan ≥ 600 px; k = min(b/390, h/844) avrundat nedåt, 1–1,6).
2. Engångsomskrivning av `Npx` till `calc(var(--k,1)*Npx)` i app.css och modulernas CSS (≈ 4 600 värden, 15 filer;
   för hand: 58 JS-px-strängar, ≈ 230 clamp med vw/vh, media-regler). Gamla iPad-media-regler rivs (annars dubbel
   förstoring). iPhone blir pixelidentisk (k = 1).
3. Vitest som larmar på nakna px i CSS; regel i CLAUDE.md.
4. Mätsidan (sju storlekar, larm vid scroll) som regressionsskydd före release.
5. Två spalter i liggande läge (och stående Pro 13): geografi (karta | fråga), matteprovets uppgift, klockan,
   gångertabellen, matteprovets provsida – först som 2–3 alternativ till Dennis (ui-skolan).
- Valt bort: rem (spårbarheten mot mockupen försvinner), meta-viewport (klipper i liggande läge, instabil),
  transform/zoom (suddigt; zoom skalar inte text på iPadOS).

## Plan
S0 k-motor, mätsida, px-test, iPhone-facit (½ d) · S1 app.css + rivning (1 d) · S2–S7 modul för modul (½–1 d var) ·
S8 två spalter i liggande läge, alternativ först (2–3 d) · S9 prov som PWA i iPad-simulatorn och på riktig iPad (½ d).
Totalt ≈ 8–11 agentdagar.

## Risker
Rivning (granskas adversarialt), höjden (mått som följer bredden), kladdens canvasupplösning, krock med andra grenar,
PWA-läget oprövat.

## Bifynd (inte åtgärdade)
1. Spelväljaren scrollar 106 px på 768 × 1024 (`min-height:232px` i 700–899-regeln).
2. Gångertabellens huvudvy scrollar 31 px på 1024 × 768.
3. Kladdknapparna Rita/Sudd/Rensa 30 px och 10-kompisars kontrollknappar 36 px – under 44 px även på iPhone.
4. NP matte skriftlig/muntlig injicerar `display:flex` på sin skärm; kan ligga kvar under nästa vy.
5. Emojis kvar i hubbar och knappar (A&S, M&D, uppställning, NP).

## Utfall
Väntar på Dennis beslut om metod och om bygget ska starta.
