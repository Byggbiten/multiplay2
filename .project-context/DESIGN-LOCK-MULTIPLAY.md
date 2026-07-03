# DESIGN-LOCK-MULTIPLAY — låst visuell + UX-spec

**Status: LÅST 2026-07-03** av Dennis ("Det ser bra ut", de tre delfrågorna
avgjorda enligt Claudes rekommendation). Pill sker via Dennis-godkännande,
aldrig genom tyst drift. Granskare (ux-vakt) avvisar avvikelser.

## 1. Den låsta artefakten

**`design-lab/index.html`** (målbild v2.1) är kanonisk visuell + UX-spec.
Öppna i webbläsare, växla enhetslägen (iPad porträtt / iPad landskap /
mobil), kör `labAudit()` i konsolen. Prototypen är *spec, inte
produktionskod* — appen byggs i befintlig vanilla-JS-stack men ska se ut
och bete sig som målbilden.

## 2. Låst designspråk — "barnmagi × Apple-polish"

- Behåll det magiska/gulliga/pastelliga (målgrupp flickor 7–10) — appen
  blir ALDRIG seriös/korporativ.
- ETT komponentsystem för alla moduler: en knappfamilj (primary/secondary/
  ghost i modulens accentfärg), en kortstil, en header (SVG-tillbaka +
  centrerad titel), en modal, en historik-liststil.
- Ljusa frostade paneler (utan backdrop-filter — solida halvtransparenser
  av prestandaskäl) på regnbågs-gradientbakgrunden.
- **Typografi:** Baloo 2 (rubriker/siffror, tabular-nums på statistik) +
  Nunito (brödtext).
- **Ikonografi:** handgjorda runda inline-SVG för UI-element; emojis
  behålls som INNEHÅLL (avatarer, belöningar, feedback) — aldrig som
  UI-ikoner.
- **Per-modul-paletter:** Gångertabellen lila magi · Klockan drömhimmel
  (blå/guld) · 10-Kompisar lila/gult · Addition & Subtraktion grön/mint ·
  Nationella Prov varm korall.
- **Motion:** spring-easing cubic-bezier(0.34,1.3,0.4,1), morphing-
  indikator på segmentväljare, drill-in mellan vyer, konfetti/stjärnregn
  vid framgång, `prefers-reduced-motion` respekteras. Ambient-animationer
  små, få (<8/vy) och pausbara via `body.no-anim`.

## 3. Designlagar (absoluta)

1. **En vy = en skärm, ingen scroll.** iPad porträtt (768×1024) och
   landskap (1024×768): absolut krav för ALLA vyer. Mobil 390×844: stark
   strävan; klockan, testflöden, spelväljare och resultat MÅSTE rymmas.
   Verifieras med labAudit()-mönstret per slice (0 overflow).
2. **Innehållet fyller skärmen** (Dennis 2026-07-03): ingen topp-ankrad
   vy med stort tomrum under — skala upp nyckelkomponenter (klockan,
   kortgrid) i iPad-porträtt; vertikalcentrera det som inte kan skalas.
3. **Klockans färgkodning:** timvisare BLÅ #3b82f6 (tjock/kort),
   minutvisare RÖD #ef4444 (tunn/lång); digital tid timmar blå · kolon
   mörk · minuter röda; svensk tidstext timord blå · minutord röda (inkl
   "halv") · bindeord mörka. Sambandet visare ↔ digital ↔ text ska SYNAS.

## 4. Låsta produktbeslut (2026-07-03)

- **Samlarkort:** exakt tre sällsynthetsnivåer — Vanlig / Sällsynt /
  Legendarisk — med olika gradientramar + skimmer på upplåsta, "?"-
  silhuett på låsta.
- **"Dagens träning"** (adaptiv träning): visas i spelväljaren först när
  profilen har ≥2 spelade test totalt. Innan dess visas ett "kom igång"-
  kort som pekar mot spelen. Innehållet är ALLTID riktig data (svåraste
  talen ur statistiken) — aldrig fejk.
- **Svårighetsskala 1–4** i Addition & Subtraktion med växt-emoji +
  beskrivning (🌱 Tal 0–20 / 🌿 Tvåsiffrigt / 🌾 Över hundra /
  🌳 Med minnessiffra resp. Med lån). Redan live sedan v23.
- **Spelväljaren:** Dagens träning-hero överst + fem spelkort
  (Gångertabellen, Klockan, 10-Kompisar, Nationella Prov, Addition &
  Subtraktion med egen hubb: Platsvärde / Uppställd addition /
  Uppställd subtraktion).

## 5. Vad som INTE är låst

Exakta pixelvärden, copytexter utanför nyckelbegreppen, antal samlarkort
(24 i målbilden är exempel), NP-modulernas inre vyer (designas i Fas 3
enligt komponentsystemet). Vid tveksamhet: följ målbilden, fråga Dennis
vid genuina val.
