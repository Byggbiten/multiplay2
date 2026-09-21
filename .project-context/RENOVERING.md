# RENOVERING — Multiplay 2026

Beslutad av Dennis 2026-07-02 efter fullständig granskning (3 parallella
granskare + live-verifiering). Detta dokument är planens sanning; uppdatera
statusloggen längst ner vid varje slice.

## Dennis låsta beslut (2026-07-02)

1. **Design:** Mini-designlabb — klickbar HTML-målbild på uppdaterat
   designspråk ("barnmagi × Apple-polish"). Dennis godkänner och LÅSER
   målbilden innan implementation (GO v3-modellen, jfr design-lab/b.html).
2. **Nya funktioner (alla tre):**
   - Adaptiv träning — svåraste talen prioriteras automatiskt (bygger på
     befintlig per-tal-statistik)
   - Nytt spel: Plus & Minus (addition/subtraktion 0–20), byggs på shared.js
   - Belöningssystem 2.0 — samlarkort/stickers utöver medaljerna
3. **Primär enhet: surfplatta/iPad** (~768–1024px). Mobil fungerar men är
   sekundär. Live-verifiering per slice sker i iPad-viewport.

## Syfte & målgrupp (oförändrat)

Pedagogisk matteapp för barn (flickor 7–10 år), svenska. Magisk, gullig,
uppmuntrande — aldrig bestraffande. Ingen inloggning; allt i localStorage.

## Fasplan

| Fas | Innehåll | Grind |
|---|---|---|
| 0 | Projektkontext (detta dokument + CLAUDE.md) | — |
| 1 | Fundament: `js/shared.js` (retry-kö m.m.) + vitest + ALLA buggfixar | vitest grönt + live-verifiering + kodgranskare |
| 2 | Designlabb: `design-lab/index.html` klickbar målbild | **DENNIS GODKÄNNER & LÅSER** |
| 3 | Design-implementation över alla moduler + ikoner + history-hantering | per-slice-grind |
| 4 | Nya funktioner: adaptiv träning, Plus & Minus, belöningar 2.0 | per-slice-grind |
| 5 | Slutgranskning: en iter via iterativ-granskningsrutin + push | Dennis |

## Kända buggar som Fas 1 fixar (verifierade 2026-07-02)

Tier 1:
- clock.js:283 — Del 1: oändlig rekursion (stack overflow) efter ett fel
- clock.js:372 — Del 2: evig frågeloop efter ett fel; `_retryQueue` död
- tenfriends.js:249 — testet avslutas aldrig efter ett fel
- multiplication.js:416 — `correct` dubbelräknas efter fel → >100 % + fel medalj
- app.js:395 — `escapeHtml` escapar inte `'` → JS-injektion via profilnamn i onclick

Tier 2:
- multiplication.js:361 — "Börja testa direkt" visar svaret på första frågan (`phase='show'` hårdkodad)
- multiplication.js:165 — null-krasch om timer löper ut utanför huvudvyn; timern överlever spelbyte (app.js stoppar den aldrig)
- sw.js — cache-first utan uppdateringsväg; ikonfiler saknas helt; fonts cachas aldrig
- clock.js:685 — hela timmar visas "tolv (tolv)"; rad 686 död kod
- app.js:144 — profilradering lämnar `mult_stats_*`, `mult_log_*`, `clock_log_*`, `friends_log_*`
- Digitalt klocktest genererar bara 1–12 trots att svensk digital-standard är 24h

Skjuts till Fas 3 (kräver ny design/vyer): history/popstate, header-kollision
på mobil, kontrastfixar (vit-på-gult, amber-tidtext), Avbryt-confirm i test,
synlig radera-knapp på touch, konsekvent historik-åtkomst, inline-styles → klasser.

## Retry-köns låsta semantik (Fas 1, delad för alla spel)

- Varje tal ställs; **första försöket** avgör poängen.
- Fel svar → samma tal ställs om DIREKT tills rätt (barnet fixar det nu).
- Träningsläge (ej test): fel tal läggs dessutom EN gång sist som repetition
  (påverkar inte poäng).
- Klart när alla tal besvarats rätt minst en gång. Terminering garanterad.
- `pct = firstTryCorrect/total`, aldrig >100. Progress = avklarade tal/total.

## Designlagar (Dennis 2026-07-03 — gäller målbilden OCH implementationen)

1. **En vy = en skärm, ingen scroll.** Varje vy ska rymmas i viewporten i
   valt läge. iPad porträtt + landskap: absolut krav. Mobil 390px: stark
   strävan (klockan, testflöden, spelväljare, resultat MÅSTE rymmas).
   Klockmodulen är viktigast av alla. UI-testas per vy × läge (labAudit()).
2. **Klockans färgkodning (pedagogik):** timvisare BLÅ (#3b82f6, tjock/kort),
   minutvisare RÖD (#ef4444, tunn/lång); digital tid = timsiffror blå,
   kolon mörk, minutsiffror röda; svensk tidstext = timord blå, minutord
   röda (inkl "halv"), bindeord mörka. Barnet ska SE sambandet
   visare ↔ digital ↔ text via färgerna. Referens: colorizeTimeText,
   clock.js:745–779 (main-lineagen).

## Arbetsmetod

GO v3:s BYGG-TEAM tillämpad här: orkestrerare kör allt shell; subagenter
skriver bara filer; kodgranskare på korrekthetskritisk logik före commit;
live-verifiering i iPad-viewport (768×1024) per UI-slice; commit per slice
med svensk rubrik. Designen är låst efter Fas 2 — granskare avvisar drift.

## BASBYTE (Dennis beslut 2026-07-02, senare samma dag)

**Historik-klargörande 2026-07-03:** det finns bara EN utvecklingslinje.
`origin/master` är en äldre punkt på main-linjen (verifierat ancestor).
Lokala arbetskopian var utcheckad vid tidiga 3-spels-läget (2661eec) —
inte en separat omskrivning. Renoveringscommittarna ligger därför på en
gammal bas och är pushade till branchen **`renovering`** på GitHub
(origin/master lämnad orörd). `main` = riktiga appen (Dennis beslut):
Konsekvenser:
- Renoveringen byter bas till main-lineagen. Fundamentet (shared.js +
  buggfixar, byggt mot master) PORTERAS till main — de tre spelmodulerna
  är nära identiska mellan lineages så porteringen är hanterbar.
- Akut-patch av Uppställnings fria läge görs direkt på main (worktree
  `~/arbetskopia/apps/Multiplay-main`): dubbel poängräkning, smart markör
  (auto-hopp, valfri ordning), Klar-gating, ≥1000-guard, ledande nollor.
- Designlabbet omfattar även Uppställning/Platsvärde/NP-modulerna vid
  implementation (Fas 3), inte bara de fyra spelen.

## Statuslogg

- 2026-07-02: Renovering beslutad. Fas 0 påbörjad.
- 2026-07-02: Uppställning-undersökning: fritt läge (v21) har dubbel
  poängräkning (kan visa "10 av 5"), ingen auto-markör, Klar-utan-gating,
  ≥1000-svar utan tusentalsruta, ledande-noll-krav. Smart markör-modell
  beslutad. Basbyte till main beslutat.
- 2026-07-02 (kväll): FAS 1 KLAR på master: shared.js + vitest (45 gröna)
  + alla buggfixar, kodgranskad (2 Tier 2-fynd åtgärdade: dubbeltrycks-
  guards) + live-verifierad (mult 92 %, klocka 8/10, tiokompisar 9/10 med
  avsiktliga fel — inga krascher/loopar). Placeholder-ikoner genererade
  (riktiga görs efter designlås). Committad lokalt; push av master väntar
  på Dennis. FAS 2-ARTEFAKT klar: design-lab/index.html — väntar på
  Dennis godkännande/låsning. UPPSTÄLLNING-PATCHEN (v22, smart markör)
  kodgranskad GODKÄND, live-verifierad (4 av 5 med rättat fel) och
  PUSHAD LIVE till origin/main (GitHub Pages). Kvar till nästa session:
  portera fundamentet till main-lineagen (efter designlås), Fas 3–5.
  Live-siten bekräftad = main-lineagen (v21→v22); zip:en i publicerat/
  apps/main är 3-spels-omskrivningen, INTE live-versionen.
- 2026-07-03: v23 LIVE (svårighetsskala 1–4 i Uppställning, ny nivå 3
  "Över hundra" med colCount-fix). DESIGNEN LÅST av Dennis →
  DESIGN-LOCK-MULTIPLAY.md (fyller-skärmen, 3 rariteter, Dagens träning
  ≥2 test). Målbild v2.1 (fyllnad, labAudit 0 overflow + 0 bottengap).
  FAS PORTERING KLAR: fundamentet porterat till main → v24 LIVE
  (kodgranskad GODKÄND, 45/45 vitest, live-verifierad mult 92 %/klocka
  8/10/tiokompisar 9/10, alla 9 per-profil-nycklar rensas vid radering,
  v23→v24-SW-övergången verifierad självläkande). NÄSTA: Fas 3 —
  design-implementation över modulerna enligt DESIGN-LOCK, slice för
  slice med ux-vakt + labAudit-grind. Tier 3-rest från granskning:
  digital facit-visning i klocktest del 2 visar rå timme (t.ex. 14:45
  när 02:45 förväntas) — ta i Fas 3-klockslicen.
