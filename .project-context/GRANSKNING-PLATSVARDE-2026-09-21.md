# Granskning: Platsvärde (`js/platsvarde.js`) — 2026-09-21

Ren läsning + mätning vid 390×844 och stress 390×664 (Playwright, Chromium, egen
browser-context mot `http://localhost:5312/?gransk=1`). Ingen kod ändrad.
Måttstock: `.project-context/UPPSTALLNING-ADDITION-SPEC.md` kap 1 (P1–P6) och
"Globala villkor" i `docs/superpowers/plans/2026-09-21-uppstallning-addition.md`,
plus `docs/DESIGN-SYSTEM.md` (absoluta regler rad 8–13, kontrollista rad 205–211).
Skärmbilder: `/tmp/gransk-platsvarde/`.

## Vad modulen gör

Ett quiz på 10 fasta frågor, alltid i samma ordning (rad 191–282): A1 tryck på rätt
position, A2 "vad är X värt", A3 "hur många X", B1 sätt ihop tal ur siffror, B2 dela
upp tal (tre fält + numpad), C1 tal→ord, C2 ord→tal, C1 igen (rad 263), D1 störst/minst,
D2 ordna fyra tal. Talen är tresiffriga utan nollor (`genNum3`, rad 178–183).
Rättning: två försök; första felet ger "Prova igen! 💪", andra felet visar
"Rätt svar: …" i text och går vidare efter 2,2 s; rätt ger konfetti och nästa fråga
efter 1,4 s (rad 814–831). Layout: rubrikrad + kort med frågan + ett Kladd-fält (canvas)
som tar 40 vh i stående läge (rad 300–309). Modulen har ingen stegvis demo och ingen
visuell platsvärdesmodell (inga brickor, inga rutor som fylls); det enda som rör sig är
en studsande 👇-pil, en glow på aktivt fält, hover-skalning och konfetti.

Konsekvens för regel 1–5: ingen text kommer efter någon rörelse, inget objekt skapas
och förstörs i samma steg, inget teleporterar — men bara därför att det visuella lagret
saknas helt. Modulen bryter inte mot P1–P5; den använder dem inte.

## Fynd, rangordnade

### A — pedagogisk lögn / blockerare

**A1. Fråga A1 låser sig efter första felet.** `js/platsvarde.js:682–694`.
Belägg (mätt, fråga 1, mål = ental, tryck på hundratal): alla tre rutorna får
`pointer-events: none` (`['none','none','none']`), rutan för rätt svar färgas grön
`rgba(34,197,94,0.25)` (rad 690), texten säger "❌ Prova igen! 💪" (rad 829),
rubriken står kvar på `1/10` efter 3 s, och Playwright-klick på rätt ruta timar ut
(`waiting for locator('#pv-digit-ental')`). Enda vägen ut är Avbryt.
Bilden säger "svaret är här" medan texten säger "prova igen" — och barnet kan inte
göra något av det. Skärmbild `q01-wrong1.png`.
Fix: färga och lås rutorna först när `isCorrect || attempts >= 2` (flytta blocket
rad 686–692 in i `processAnswer`-utfallen). Storlek: rader.

### B — sekvens-/frågebrott

**B1. Två rätta knappar i B1 i ~31 % av fallen.** `js/platsvarde.js:225–229`.
`b1Opts` är `[HTE, HET, ETH, THE]`; när två av siffrorna är lika (t.ex. `t === e`
ger `HTE === HET`) dubbleras det rätta talet. Sannolikhet 1 − 9·8·7/9³ = 30,9 %.
Fix: dra om siffrorna tills alla tre är olika, eller filtrera unika och fyll på.
Storlek: rader.

**B2. A2 har distraktorer utan platsvärdesmening.** `js/platsvarde.js:207–210`.
Poolen blir `[värde, siffra, siffra×10 eller ×100]` + "föregående + 1" (rad 209).
Mätt fråga 2 (165, ental): alternativen `51, 5, 52, 50`. För tiotal blir det t.ex.
`60, 6, 600, 601`, för hundratal `200, 2, 20, 21`. Barnet kan utesluta 51/52/601/21
utan att förstå något. Skärmbild `q02-start.png`.
Fix: pool = siffran × {1, 10, 100} + grannsiffrans värde i samma position.
Storlek: timme.

**B3. A2 färgar alla alternativ i målpositionens färg.** `js/platsvarde.js:485`
(`renderMonoColor(opt, PV_COLORS[q.target])`). Mätt fråga 2: alla siffror i alla fyra
knappar `rgb(34,197,94)`. När målet är tiotal står "600" helblått fast 6:an är ett
hundratal — färgkoden (regel 12) säger något annat än siffran.
Fix: `renderColoredNumber(opt)` som i B1/C2/D1, eller neutral färg i knapparna.
Storlek: rad.

**B4. A1:s knappar bär svaret.** `js/platsvarde.js:458–465`. Varje ruta har
etiketten `Hundratal/Tiotal/Ental` i 10 px (rad 464) i samma färg som frågeordet
(rad 456). Uppgiften blir ordmatchning — inte platsvärde. Skärmbild `q01-start.png`.
Fix: neutrala rutor (ingen etikett, ingen positionsfärg) under frågan; etiketten och
färgen visas i facit. Storlek: timme.

**B5. Låsta platsvärdesfärger används för "störst = röd, minst = grön".**
`js/platsvarde.js:616` (`q.askMax ? PV_COLORS.hundratal : PV_COLORS.ental`) och
`639–641`. Mätt fråga 9: "störst" `rgb(239,68,68)`; fråga 10: "minst" `rgb(34,197,94)`,
"störst" `rgb(239,68,68)`. I modulen där färgkoden betyder mest får den här en
andra betydelse. Skärmbild `q09-start.png`, `q10-start.png`.
Fix: skriv orden i `var(--deep)` eller accent. Storlek: rad.

**B6. Facit är text utan bild, och visas i 2,2 s.** `js/platsvarde.js:824–825`.
Efter andra felet: "Rätt svar: 6 hundratal, 9 tiotal, 7 ental" (B2), eller
"111 → 737 → 845 → 851" (D2) — i `--text-sm` (rad 841–843), borta efter 2 200 ms
(rad 825). Ingen siffra visas i sin ruta, inget "låt siffrorna utföra det".
Skärmbild `q05-wrong2.png`, `q10-wrong2.png`.
Fix: fyll facit i frågans egna rutor/fält (B2:s tre fält, D2:s fyra slots) i
positionsfärg och byt timern mot en "Nästa"-knapp. Storlek: dag (alla nio typer).

### C — layout / träffyta / scroll / kontrast

**C1. Träffytor under 44 pt vid 390 (mätta `getBoundingClientRect`).**
| Element | Rad | Mått |
|---|---|---|
| Numpad `.pv-nk` | 348 | 40×40 (`clamp(40px,8vw,52px)`, 8vw = 31 px) |
| Fritextfält `.pv-decomp-field` | 330 | 40×40 |
| Ordna-knappar `.pv-order-btn` | 360 | 49,9×33,5 |
| Kladd: Rita/Sudd/Rensa | 397–403 | 115×30 |
| Avbryt | 376 | 92,5×36 |
| Ångra / Klar | 655–667 | 116,7×40 / 227,3×40 |
Godkända: valknappar 173×48,5–62,5, A1-rutor 52×82,5, slots 50×44, resultatknappar 48 höga.
Fix: `min-height:44px` + `clamp(44px, …)`; numpad 44 ger 3×44+2×6 = 144 px bredd,
ryms. Storlek: timme.

**C2. B2 scrollar vid 390×664.** `js/platsvarde.js:302, 309`. Mätt: kortet 385 px,
`#pv-left` 327 px (`scrollHeight 399 > clientHeight 327`); raden ⌫ / 0 / ✓ ligger
under kanten. Övriga vyer: 327/327. Skärmbild `s664-q05-b2.png`.
Fix: lägg numpaden till höger om de tre fälten (grid 2 kolumner) så kortet blir
~250 px. Storlek: timme.

**C3. Dött tomrum vid 390×844.** Kortet slutar vid y = 200 (A1) / 301 (A2) / 440 (B2);
Kladd börjar vid y = 498. 200–300 px rosa tomrum, ~35 % av skärmen på A1.
`docs/DESIGN-SYSTEM.md` rad 207–208: "quiz-vyer ≥55 % täckning". Skärmbild `q01-start.png`.
Fix: låt siffror/knappar växa med `flex:1` i `#pv-left` (större A1-rutor, större
valknappar) i stället för fasta padding-värden. Storlek: timme.

**C4. 👇-pilen täcker rubriken.** `js/platsvarde.js:336–338, 707`. Mätt: pilen
`[31,78,16,26]`, rubriken "Dela upp: 697" ligger y 75–95 — pilen står på "l" i "Dela".
Skärmbild `q05-start.png`.
Fix: `top:calc(100% + 2px)` (under fältet) eller ta bort pilen — glow-ramen räcker.
Storlek: rad.

**C5. Grön `#22c55e` som liten text.** A1-etiketter 10 px (rad 464), ordna-knappar
12,94 px (rad 650), B2-etiketten "ental" 15 px (rad 555). Beräknad kontrast
#22c55e mot vit: 2,3:1 (blå 3,7:1, röd 3,8:1). Färgen är låst — men låst som
siffer-/ramfärg, inte som brödtext.
Fix: färgen som ram/bakgrund, texten i `var(--deep)`; siffror ≥24 px vikt 900 får
behålla färgen. Storlek: timme.

**C6. `height:100vh` på `#addsub-root`.** `js/platsvarde.js:300`. `.screen` är
redan `height:100%` (`styles/app.css:355–358`) och `#addsub-root` `flex:1`
(`app.css:2131–2137`). I iOS Safari utan standalone är 100vh högre än synlig vy,
och Kladd-knapparna (y 798–828 vid 844) hamnar under verktygsfältet. Ej mätt —
Playwright har inget verktygsfält.
Fix: ta bort raden (eller `100dvh`). Storlek: rad.

**C7. Textstorlekar för barn.** Ordna-knappar 12,94 px (rad 360, `--text-sm`),
Kladd-etikett 10 px (rad 392), A1-etiketter 10 px (rad 464), Kladd-knappar 11 px
(rad 397). Fix: ≥14 px överallt, ≥16 på det barnet läser för att svara.
Storlek: timme (hänger ihop med C1).

### D — polish

**D1. Emoji som UI-ikoner** (DS rad 9, 211): ✏️🖊️🧹🗑️ (rad 393–403), 👇 (707),
↩ ✓ (660, 666), ⌫ ✓ (560), ❌ ✅ 💪 🌟 (829, 840), hubb-ikoner 🧮➕➖ (66–72).
Fix: `<svg class="icn"><use href="#i-…"/></svg>`; ⌫/✓ som SVG. Storlek: timme.

**D2. Native `confirm()` på Avbryt** (rad 998) — samma mönster som
`np-matte-muntligt.js:666` och `np-matte-skriftlig.js:1228`, så appgemensamt beslut.

**D3. Konfetti (60 emoji, 3 s, rad 851–860) faller över nästa fråga** som visas
efter 1,4 s (rad 821). Fix: nästa fråga efter 3 s eller konfetti 1,2 s. Rad.

**D4. Fel valknapp markeras inte vid "Prova igen"** (rad 826–829) — barnet kan
trycka samma igen. A1 gör det (rad 691), valknapparna inte. Fix: `opacity:.4` +
`pointer-events:none` på den tryckta knappen. Rader.

**D5. Canvas dimensioneras en gång** (rad 906–909, ingen resize-lyssnare) →
rotation sträcker ritningen; pennan är `#3b82f6` (rad 939) = tiotalsfärgen.
Fix: neutral penna (`var(--deep)`), `ResizeObserver`. Timme.

**D6. C3 är en kopia av C1** (rad 258–263, `type: 'C1'`): två tal→ord, ett ord→tal.
Fix: gör den tredje till C2 eller till en egen typ. Rad.

**D7. A3-poolen kan innehålla 0** (rad 216–219, `(a3Dig + d) % 10`) fast talen
saknar nollor → gratis uteslutning. Fix: `d` från 1–9 utan modulo. Rad.

**D8. B2 fyller hundratal→ental** (rad 733, aktivt fält stegar 0→1→2), dvs.
vänster→höger i talet. Regel 10 säger höger→vänster i fria lägen. Att döma:
"dela upp" läses naturligt från hundratalet. Ingen fix föreslås utan Dennis.

## Vad som är bra och inte ska röras

- `PV_COLORS` (rad 29) är exakt de låsta värdena; mätt `rgb(239,68,68)`,
  `rgb(59,130,246)`, `rgb(34,197,94)` på siffrorna i A1/A2/A3/B1/B2/C1/C2/D1/D2.
- `renderColoredNumber` (rad 440–447) färgar per position konsekvent i B1, C2, D1,
  D2, slots och facit — rätt modell, bara A2 (B3) avviker.
- B2: ✓ är inaktiv tills alla tre fält är fyllda (rad 718–720, 745) — inget "fel
  försök på tomt"; vid fel behålls det ifyllda (mätt: fälten kvar, ✓ aktiv) så barnet
  rättar i stället för att skriva om; ⌫ på tomt fält backar till föregående (rad 727–729).
- D2: klick på fylld slot eller på placerad knapp tar tillbaka talet (rad 753–800),
  Klar inaktiv tills fyra ligger (rad 792–800), Ångra tar senaste.
- Ingen scroll i någon vy vid 390×844: dokument 844/844, `#pv-left` ≤ 435/435,
  hubb 844/844, resultat 844/844. Vid 664 scrollfritt utom B2 (C2).
- Kladd-ytan: canvas 356×266 vid 844, 356×195 vid 664 — över 150 px-kravet.
- `numberToSwedish` (rad 964–973) ger korrekta talord ("ett" + "hundra",
  "tvåhundraåttiotvå", "femhundratrettioett").
- `genNum3` utan nollor (rad 175–180) undviker "noll tiotal"-fällan i A2/A3/B2.
- Konsolen: inga meddelanden eller fel efter omladdning och ett helt pass (10 frågor,
  två fel per fråga, resultatvy).

## Metodnoter

- Den delade Playwright-fliken kördes samtidigt av en annan session
  (multdiv-demon stegades fram mitt i mitt pass, två gånger). Fråga 1–5 mättes i den
  delade fliken innan störningen; fråga 6–10, resultat, stresstest och konsol i en
  egen browser-context (`?gransk=1`). Alla mätvärden ovan är från ostörda vyer.
- Profilen "Gransk" skapades i båda contexterna (localStorage per context).
- iOS-verktygsfältets effekt (C6) är inte mätt.

## Skärmbilder (`/tmp/gransk-platsvarde/`)

`01-hub.png` · `q01-start.png` `q01-wrong1.png` `q01-correct.png` (A1) ·
`q02-start/wrong1/wrong2.png` (A2) · `q03-*` (A3) · `q04-*` (B1) ·
`q05-start/filled/wrong1/wrong2.png` (B2) · `q06-*`, `q08-*` (C1) · `q07-*` (C2) ·
`q09-*` (D1) · `q10-start/filled/wrong1/wrong2.png` (D2) · `11-result.png` ·
`s664-hub.png` `s664-q01.png` `s664-q05-b2.png` `s664-q10-d2.png` (stress 390×664).
