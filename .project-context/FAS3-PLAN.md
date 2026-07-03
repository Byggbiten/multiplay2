# FAS 3 — Design-implementation över hela appen (v25)

Beslut Dennis 2026-07-03: implementera nya designen över SAMTLIGA vyer och
moduler i ett svep, utan per-modul-återkoppling. Spec: DESIGN-LOCK-MULTIPLAY.md
+ design-lab/index.html (målbild v2.1, LÅST). Mål: Multiplay-main → v25.

## Scope-gräns

- Fas 3 = DESIGN (utseende, komponentsystem, no-scroll, klockfärger).
  Logiken rörs INTE (quiz-flöden, poäng, lagring är Fas 1-verifierade).
- Dagens träning-heron: bygg "kom igång"-kortet + hero-slot med villkoret
  ≥2 spelade test — men adaptiv-motorn och samlarkorten är FAS 4.
  Samlingen-vyn byggs INTE i Fas 3.

## Slices

1. **Designsystem + app-skal** (EN agent, äger styles/app.css + index.html
   + js/app.js + sw.js): tokens ur målbilden, komponentklasser, Baloo 2 +
   Nunito, SVG-ikoner, hem/profiler + spelväljare (5 kort + kom igång-slot),
   klasskatalog skrivs till Multiplay-main/docs/DESIGN-SYSTEM.md.
2. **Modul-fan-out** (parallella agenter, EFTER slice 1; får INTE röra
   app.css/index.html — modulspecifik CSS läggs i modulens egen
   style-injektion, uppstallning-mönstret):
   - multiplication.js (lila magi)
   - clock.js (drömhimmel + röd/blå-lagen i ALLA klockvyer)
   - tenfriends.js (lila/gult, mörk text på gula ytor)
   - uppstallning.js + platsvarde.js (grön/mint; A&S-hubben per målbild)
   - nationella.js + np-matte-muntligt/skriftlig + np-svenska (korall;
     komponentsystem för ram/knappar/resultat, inre specialvyer behåller
     layout men får tokens)
3. **Grind:** vitest 45/45 → ux-vakt-granskning mot DESIGN-LOCK →
   no-scroll-mätning per vy × 3 viewports (768×1024, 1024×768, 390×844)
   → live-klickrunda alla spel → commit v25 → push main.

## Regler för alla agenter

- Bevara ALLA id:n, publika API:er och onclick-kontrakt (mult-root,
  screen-*, App.*, spelens routing) — designbyte, inte refaktor.
- En vy = en skärm utan scroll (iPad-lägena absolut krav).
- Klockfärgerna: tim BLÅ #3b82f6 / minut RÖD #ef4444 i visare+digital+text.
- Emojis = innehåll, SVG = UI-ikoner. Svensk copy behålls.
- Ingen backdrop-filter. Ambient-animationer små/få/pausbara.

## Status

- 2026-07-03: Fas 3 startad. Slice 1 dispatchad.
- 2026-07-03: FAS 3 KLAR → v25 LIVE. Slice 1 + 5 modulagenter + grind
  (vitest 45/45, ux-vakt, no-scroll 0 overflow i 3 viewports, live-
  regression mult 92 %). Ux-vaktens Tier 1 (klocklagen i NP-skriftlig)
  + fynd 3/7 + timer-chip-klipp + dubbelemoji åtgärdade före push.

## FAS 3.1 — NP-konsolidering (bokförd rest från ux-vakt, ej blockerande)

- np-svenska: eget headersystem (.svk-header/.svk-btn-back/.svk-title i
  9 vyer) + egen knappfamilj .svk-btn + .svk-choice ~40px → byt till
  katalogens .app-header/.btn-back/.answer-option
- Avbryt-mitt-i-test: enhetlig app-modal "Avsluta testet?" i tenfriends,
  multiplication, platsvarde, np-skriftlig, np-muntligt (idag mix av
  direkt-avbryt och native confirm())
- .player-banner → .me-chip i nationella/np-skriftlig/np-svenska
- NP:s egna inline-numpads → katalogens .numpad/.numpad-key
- Touch-targets <48px: canvas-verktygsknappar (np-modulerna), .svk-canvas-btn
- Gemensam --ok/--err-token i app.css (idag olika gröna per modul)
- Enhetlig header-spacer-bredd (52 vs 80px)

## FAS 3.2 — Yteffektivitet (Dennis-mandat 2026-07-03, → v26)

Grund: designgranskning på riktiga enhetsmått (1180×820, 820×1180,
390×844 + stress 390×664). Passform 0 scroll överallt ✓; täckningsgrad
spretade 26–91 %. Mandat: fixa enligt Apple-standard.

1. QUIZ-MALLEN (mult/clock/tenfriends test- och frågevyer, 27–36 % →
   mål ≥55 %): uppgiften äger skärmen — monumental typografi, stora
   svarsytor, progress som kapsel i headern (inget eget band).
2. HUBB-MALLEN (A&S 34 %, NP 26 %, mult-lägesval 28 % → mål ≥50 %):
   rikare kort (senaste resultat/progress/illustration) + centrera hela
   gruppen INKLUSIVE profilchip (A&S-kompositionsfelet).
3. LANDSKAP ≥1100 (riktig iPad 1180): centrera komposition, balansera
   mult-hubbens kolumner.
4. 10-KOMPISAR (Dennis-beslut): ta bort paren 0+10 och 10+0 överallt
   (chips, spinner 1–9, testgenerering 1–9); intjänad yta → större
   tio-rutnät/siffror.
5. KLADD-LAGEN (Dennis-beslut): i vyer med kladd (uppställning,
   platsvärde, NP-matte) får kladdytan expandera in i ALL ledig yta —
   oregelbunden form ok. OBS: canvas-bitmapp måste följa CSS-storleken.

## FAS 3.2 STATUS: KLAR → v26 LIVE (2026-07-03)

Sex layoutagenter + barn-UX-fixare + grind (45/45 vitest, CDP-mätning på
riktiga enhetsmått, 0 scroll överallt). Täckningsgrad: NP-hubb 26→53 %
(porträtt)/31→68 % (landskap), A&S 34→56/45→69, testfrågan 29→40/34→51
(visuellt verifierat: kortet äger skärmen — mätaren räknar bara text-ink).

**Barn-UX-lagen etablerad (Dennis 2026-07-03): "Barn som försöker göra
rätt ska aldrig straffas för missförstånd."** Alla bygg-ihop-svar-flöden
ska ha: (1) synlig startmarkör, (2) fungerande ångra, (3) Bekräfta släckt
tills svaret är komplett. Sex fällor fixade i v26 (Platsvärde Ordna/Dela
upp, NP-skriftlig fillSign/match/multi-free). Direkt-svarsflöden har
2-försöks-förlåtelse (befintligt, behålls). 10-kompisar per Dennis: bra
som den är. Kända icke-fixade småsaker: genMatch är död kod med TDZ-bugg
(koppla ej in utan fix); submitTrueFalse/MultiChoice saknar submit-guards
(ofarligt — knapparna är gated).

## INMATNINGSBESLUT Uppställning "utan hjälp" (Dennis 2026-07-03 → v27)

Fria lägets per-kolumn-rutor ERSÄTTS av miniräknar-modell: ETT svarsfält,
siffror skrivs vänster→höger (högsta talsort först, som man skriver tal:
876 = tryck 8, 7, 6), ⌫ tar sista, Klar gated tills ≥1 siffra, första
Klar-trycket avgör poängen (befintlig semantik), fel → rött + redigera.
Ledande-noll-låsningen behövs inte längre. "Med hjälp" och "Titta och
lär" behålls EXAKT som de är (pedagogiken kräver kolumn-för-kolumn).
Ersätter v22:s smarta markör I FRIA LÄGET — markör-mönstret lever kvar
i Platsvärde Dela upp och är fortsatt standard för flerfältsinmatning.

## STATUS v29–v30 (2026-07-03)

- v29 LIVE: Uppställd multiplikation (multdiv.js, Mira åk 4) per
  MULTDIV-SPEC + bokfotot; kort division = steg B (Kommer snart-kort).
  Encoding-incident: v28-bumpen mojibakade app.js/sw.js (77 rader) —
  reparerat + verifierat. LÄRDOM: versionsbump ALDRIG via PowerShell
  Get-Content/-replace — använd Edit-verktyget.
- v30 LIVE: Levande minnessiffror (MINNESSIFFER-KONCEPT.md) i addition
  + multiplikation. Kodgranskad; kvarvarande polish-rest: T3.2 prefixa
  .mem-*-klasserna per modul (.up-mem-*/.md-mem-*), T3.4 död mdCarries-
  bokföring i multdiv. Tas i division-steget eller Fas 4-städ.
- v31 LIVE: tvåstegsfråga + livlinor (2/runda, se-och-skriv-själv) +
  sista-minnes-undantag (Dennis-beslut).
- v32 LIVE: KORT DIVISION — multdiv-modulen KOMPLETT. Mellanrest-tänket
  (barnet placerar resten själv), livlinor delas, glömd-rest-detektor,
  verifierings-avslut (24·4=96). Tier 3-rest bokförd: nivå 1-division
  d=4 har bara 4 möjliga tal; glömd-rest-detektorn missar skip-fall;
  Minnesmästare räknar ej divisionens placeringar (policy-fråga för
  Dennis); .mem-*-klassprefix (T3.2) kvarstår.

## FAS 4 (kvar av renoveringen)

Adaptiv träning (Dagens träning-motorn — hero-slot + gate finns redan),
Belöningssystem 2.0 (samlarkort + Samlingen-vyn, 3 rariteter per lock),
history/popstate-hantering (bakåtknapp på Android).
