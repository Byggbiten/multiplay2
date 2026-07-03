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
