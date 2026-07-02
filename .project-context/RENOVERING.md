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

## Arbetsmetod

GO v3:s BYGG-TEAM tillämpad här: orkestrerare kör allt shell; subagenter
skriver bara filer; kodgranskare på korrekthetskritisk logik före commit;
live-verifiering i iPad-viewport (768×1024) per UI-slice; commit per slice
med svensk rubrik. Designen är låst efter Fas 2 — granskare avvisar drift.

## Statuslogg

- 2026-07-02: Renovering beslutad. Fas 0 påbörjad.
