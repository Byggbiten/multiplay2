# Multiplay

Pedagogisk matteapp (PWA, vanilla JS, ingen build) för barn 7–10 år, svenska.
Tre spel idag: Gångertabellen, Klockan, 10-Kompisar. Fjärde (Plus & Minus)
planerad. All data i localStorage, profil-scopad. Edit-maskin: main.

## Ny session? Börja här

**Läs `.project-context/RENOVERING.md`** — pågående renovering med fasplan,
Dennis låsta beslut och per-slice-grind. Följ den.

## Hur vi jobbar (kortversion)

- **Arbetsmetod:** GO v3:s BYGG-TEAM — orkestrerare kör allt shell,
  subagenter skriver bara filer, kodgranskare före commit, Tier 1/2/3-fynd
  med fil:rad.
- **Primär enhet: iPad/surfplatta** — live-verifiera varje UI-slice i
  768×1024-viewport (Claude Preview, statisk server via launch.json
  "multiplay", port 5310). Mobil 390px sekundär.
- **Design:** `DESIGN.md` (barnmagi-designsystemet). Efter Fas 2 gäller
  design-lab-målbilden som LÅST spec — drift avvisas.
- **Test:** `npx vitest run` — ren logik i `js/shared.js` ska ha tester.
  Grind före commit: vitest grönt + live-verifiering.
- **Git:** GitHub `github.com/Byggbiten/multiplay2`, branch master.
  Commit per slice, svensk rubrik. Push vid sessionsslut.
- **Stack-regler:** vanilla JS (IIFE-moduler på window), inga ramverk,
  inga build-steg. `js/shared.js` laddas först och exponerar `window.MP`
  (+ CJS-export för vitest). Nya hjälpare läggs där — duplicera ALDRIG
  logik mellan modulerna igen.
- **Service worker:** network-first för HTML/JS/CSS. Bumpa `CACHE`-versionen
  i sw.js vid varje release ändå (hängslen + livrem).
