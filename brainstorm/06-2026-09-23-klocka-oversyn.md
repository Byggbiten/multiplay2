# Klockan — översyn med visuell pedagogik som måttstock (2026-09-23)

Tankepass på Dennis fråga 23/9 kl. 21:04: *"Vad tycker du om klockmodulen? Om du med min filosofi och tänk om
visuell pedagogik och lärande gör en översyn där. Ser du potential för förbättring?"* Sammanfattat i efterhand
(2026-10-19) ur sessionen. Besluten står i `.project-context/DECISIONS.md` (D18, D19).

## Läget före

En lekklocka och ett prov, inget däremellan som lär ut hur man läser klockan. Lekklockan visade analog, digital
och ord med blå timmar och röda minuter. Testet hade fem läsfrågor och fem ställfrågor; efter ett fel visades
facit i 1,5 sekunder.

## Det som saknades

1. **Ingen trappa.** Barn lär sig hela timmar, halv, kvart, fem/tio/tjugo och sist runt halv. Testet blandade allt
   från första frågan.
2. **"Halv" förklarades aldrig** — halv tre betyder halvvägs till tre, den vanligaste förvirringen.
3. **Ett fel gav bara facit**, aldrig varför.
4. **Visarna gick inte att dra.** Plus och minus hoppade i steg; när minutvisaren dras och timvisaren följer
   långsamt syns varför timvisaren står mittemellan vid halv.
5. **Slumpade felalternativ.** De verkliga felen är en timme fel runt halv, "kvart över"/"kvart i",
   "fem i halv"/"fem över halv" och omvänt lästa visare.
6. **Ingen nötning:** inga pass, ingen påfyllning, inget kvitto, inga medaljer.

## Förslagen

- **Klockans trappa** som hemvy med medalj per steg.
- **En lektion per steg**, klickstyrd; i "halv" glider timvisaren halvvägs mot nästa siffra.
- **Minutkartan som stödhjul:** "över"-halvan, "i"-halvan, fältet runt halv och minuttalen utanför urtavlan.
  Tonas ner i takt med att hon klarar steget.
- **Dra visarna** för att ställa klockan; timvisaren följer minutvisaren.
- **Riktade felalternativ** byggda på de verkliga felen; svarsplatsen lottas.
- **Nötning som i gångertabellen:** pass, påfyllning, kvitto, capybarakort.
- Ett sjunde steg "Hur lång tid?". Lekklockan kvar med dragbara visare, testet som litet val längst ner.

## Dennis tillägg samma kväll (22:00)

Animerade lektioner: varför det heter "20 i" (20 minuter kvar *innan* åtta, i:et betonat i båda orden; samma med
"över"), femminuterssteg som räknas ihop 5 + 5 + 5 + 5 = 20, specialfallen fem i/fem över halv, minus 12 och
12 + 12 = 24 för digital tid, referenspunkter för när barn och vuxna går och lägger sig, och "Nu får du försöka!"
efter varje visning — fel ger *"nästan rätt! Bra försök, låt mig visa!"*, rätt ger beröm och förklaringen ändå.
Se D19.

Två egna beslut som Claude tog under bygget: "Nästan rätt!" sägs bara när svaret faktiskt var nära, och i Öva-passen
visas förklaringen bara vid fel (den bekräftande förklaringen hör till lektionens försök).

## Utfall

- Ingen mockup; Dennis: *"Gör en förbättrad version i dev-mode"* → **D18**, byggt direkt på grenen `klocka-v2`
  med återställningstaggen `fore-klocka-v2`.
- v63: `ce8c5b2` (logiken i `js/clock-logic.js`), `0b946fe` (trappan i appen), sammanslagen `1792d69`. Lådorna,
  nötloopen och kvittot bröts först ut till `js/shared.js` (`3f0a990`) så att Klockan delar Gångertabellens regler.
  Trappan fick sju steg: hela timmar, halv, kvart, fem/tio/tjugo, runt halv, digital tid, hur lång tid.
- v64: lektionerna enligt D19, `61539cd` och `2d6347c`, sammanslagen `3f03ba5` (tagg `fore-klocklektioner`).
- Live med release v64 `9df03a0` (24/9 06:25).
- Kvar som öppna frågor: P5 (tolv fasta tider per steg), P6 (fingerdraget aldrig provat på riktig telefon),
  P7 (emojis i klocktestets gamla resultatvy).
