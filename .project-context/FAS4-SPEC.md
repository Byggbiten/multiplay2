# FAS4-SPEC — Dagens träning + Capybara-samlingen

**STATUS 2026-07-05: FAS 4 KOMPLETT.** v33 (Dagens träning) LIVE,
v34 (Capybara-samlingen, 24 kort) LIVE, v35 (bakåtknappen) pushad.
Bokförd rest: NP-modulerna + Platsvärde saknar capy-hooks (medvetet
scope steg 2 — läggs till vid behov); Minnesmästare-policyn för
division väntar på Dennis-beslut; nivå 1-division d=4 har få tal.

Beslutad av Dennis 2026-07-03 ("kör enligt rekommendationen").
Ordning: 1) Dagens träning (v33) → 2) Belöningssystem/samlarkort (v34)
→ 3) Android-bakåtknapp (v35). Barnens direktiv: korten är KAWAII
CAPYBAROR i olika utstyrslar med ordvitsnamn.

## Steg 1 — Dagens träning (v33)

**Motorn:** läser befintlig per-tal-statistik (mult_stats_<id> — attempts/
correct per tal) och väljer de 3 svåraste talen (samma logik som Stats-
vyns "Träna mer på dessa": lägst träffprocent, minst N försök). Dagens
urval seedas på dagens datum + profil-id så innehållet är stabilt över
dagen men varierar dag till dag.

**Hero-kortet** (slot + gate ≥2 test finns sedan v25): visar riktigt
innehåll: "3 tal väntar på dig! ✨ 7·8 · 6·7 · 9·6 — precis de du övar
på" + Starta-knapp. Fallback när mult-data saknas men andra spel
spelats: föreslå svagaste modulen ("Dags att träna Klockan? Senast
8/10") med direktlänk. Efter avklarat dagens pass: hero visar "Klart
för idag! 🌟 Kom tillbaka i morgon" + möjlighet att köra igen (extra
pass påverkar inte dagens-status).

**Passet:** riktad runda via Gångertabellens befintliga quiz-maskineri
(fokuserad träning finns redan): 3 svåraste talen × 2 = 6 frågor,
flerval, retry-köns semantik, first-try-poäng. Loggas (daily_log_<id>)
med datum → streak-data för framtida capybara-upplåsningar. Resultatvy
med uppmuntran; ingen medaljpåverkan på tabellstatistiken utöver
ordinarie recordAnswer.

**Teknik:** ny liten modul js/daily.js (window.DailyTraining): urval +
hero-innehåll + passtart. app.js renderHero anropar den. multiplication.js
exponerar vid behov ett parametriserat fokuserad-träning-API (tal-lista
in, callback ut) — ÅTERANVÄND, duplicera inte quiz-flödet. sw.js v33.
Barn-UX-lagen + no-scroll gäller. Radera daily_log_ vid profilradering.

## Steg 2 — Capybara-samlingen (v34) 🦫

**BARNENS DIREKTIV (Mira & Zelda, 2026-07-03):** korten är kawaii
capybaror i olika utstyrslar med ordvitsnamn: t.ex. Wizard-Capy
(trollkarlshatt), Rock-ybara (rockare med gitarr), och i samma anda.

**Kortpool (~24 st, 3 rariteter per designlåset):**
- Illustrationer: KOMPONERBAR SVG — en gemensam gullig bas-capybara
  (rund, kawaii-ögon, rosiga kinder) + per kort: tillbehör (hatt/
  instrument/rekvisita), färgtema och bakgrundsplatta. Ger konsekvent
  stil utan 24 handritade unika bilder. Legendariska får extra effekter
  (gnistror, gradient-päls).
- Namnförslag (Dennis/barnen får stryka/lägga till före v34-bygget):
  Vanliga: Sov-Capy 💤, Glass-bara 🍦, Bad-Capy 🛁 (capybaror älskar
  bad!), Fotbolls-bara ⚽, Målar-Capy 🎨, Kock-ybara 👨‍🍳, Cykel-Capy,
  Blomster-bara 🌸, Läs-Capy 📚, Sjörövar-bara 🏴‍☠️.
  Sällsynta: Wizard-Capy 🧙 (barnens!), Rock-ybara 🎸 (barnens!),
  Astro-Capy 🚀, Ninja-bara 🥷, Prinsess-Capy 👑, Doktor-bara 🩺,
  Detektiv-Capy 🔍, Vinter-bara ⛷️.
  Legendariska: Guld-Capy ✨ (gyllene päls), Regnbågs-bara 🌈,
  Drak-Capy 🐉, Stjärn-bara 🌟, Minnesmästar-Capy 🏆 (endast via
  Minnesmästare-stjärnor), Matte-Capy 🧮 (samla alla medaljer).
- **Upplåsningsregler:** kort vinns vid milstolpar — avklarade test,
  medaljer, Dagens träning-streaks (3/7 dagar), Minnesmästare-stjärnor,
  100 %-pass. Reglerna viktas så det ALLTID är nära till nästa kort i
  början (första kortet efter första testet). Slumpat kort ur rätt
  raritetspool vid upplåsning; NYTT KORT-momentet på resultatvyn per
  målbilden; Samlingen-vyn per målbilden (skimmer, "?"-silhuetter,
  "X av 24").
- Lagring: capy_cards_<id> (radera vid profilradering). Aldrig förlora
  kort. Dubblett-skydd: alltid olåst kort om något återstår.

## Steg 3 — Android-bakåtknapp (v35)

pushState per skärm + popstate → App-navigering bakåt istället för att
lämna appen; i test-flöden → samma bekräftelse som Avsluta.
