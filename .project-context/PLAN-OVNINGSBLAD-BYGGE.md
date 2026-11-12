# Plan: övningsbladen plan 3 in i appen (v77)

2026-11-12. Dennis: "Då bygger vi in det här till våran dev-version och driftsätter sedan?" Facit är mockupen
`design-lab/ovningsblad-plan3.html` (godkänd i Med hjälp och Själv, alla lägen, D47 ✎). Tänket: `METOD-OVNINGSBLAD.md`.
VD:n bygger själv (D47 ✎). Gren `ovningsblad3`, tagg `fore-ovningsblad3` på dev, merge `--no-ff` (D9).

## Upplägg

- **Egen modul**, inte en del av Matteprov-motorn: `js/ovningsblad-logic.js` (ren logik, testbar i node) och
  `js/ovningsblad.js` (vyerna, porterade från mockupen, allt under `#ov-root`). Skärmen `screen-ovningsblad` i
  `index.html`. Knappen "Övningsblad" i divisionens lägesvy (`multdiv.js` `openProv`) öppnar `Ovningsblad.open`.
- **Den gamla övningsbladskoden** (D44, 13 blad i `matteprov*.js`, `tests/ovningsblad.test.mjs`) kopplas bort men
  rivs i en egen skiva efter v77, med egen granskning ("grön svit bevisar inget om rivning").
- **Kladden** är appens (ritkod som i `matteprov.js` `scratchHTML`/`scSetup`, pennan, suddet, Ångra/Gör om).
- **Lagring** per profil: `ovningsblad_${id}` = `{ mode, level, res: { [modul]: { level, mode, ok, of, hints, at } } }`,
  och nyckeln står i `app.js` listan över profilens nycklar.
- **Lägen:** telefon stående som mockupen; telefon liggande (låg höjd) två spalter, kladden bakom knappen, kortet
  krymps (D47 ✎); iPad stående/liggande via mediafrågor (stor kladd).

## Talen (generatorer, en per modul och nivå)

| Modul | Lättare | Svårare | Uppgifter per omgång |
|---|---|---|---|
| Kort division | tresiffrigt tal, nämnare 2–5 | fyrsiffrigt, nämnare 3–9 | 3 |
| Trappan | tresiffrigt, nämnare 2–5 | fyrsiffrigt, nämnare 3–9 | 2 |
| Problemlösning | berättelse, tresiffrigt / 2–5, går jämnt ut | fyrsiffrigt / 3–9, jämnt | 3 |
| Kluringar | delare 2–3, slutet 2–5 | delare 2–6, slutet 2–9 | 3 |
| Vilket tal? | delbar med 2 eller 5 | delbar med 3, 4 eller 5 | 3 |
| 10, 100 och 1000 | 10 och 100 | 10, 100 och 1000 | 4 |
| Dela och gruppera | 2, 5 eller 10 per grupp, ingen rest | 3–9 per grupp, med rest | 4 |
| Divisionstabellen | tabellerna 2, 3, 5, 10 | 2–9 | 1 blad med 10 tal |

Kvotens siffror är aldrig 0 (inga "0 gånger"-steg). Venndiagrammet genereras med exakt ett tal som uppfyller båda
ledtrådarna. Kvitto efter omgången: "x av n rätt på första försöket", ledtrådar, och under 60 % bara antalet (D39).

## Skivor

1. Logiken och testerna (`ovningsblad-logic.js`, `tests/ovningsblad3.test.mjs`).
2. Vyerna (`ovningsblad.js`): hubben, de åtta modulerna i båda lägena, omgång och kvitto, kladden, lagringen.
3. Inkopplingen: `index.html`, `sw.js`, `app.js`, `multdiv.js`; MANUAL, DESIGN, README.
4. Granskning: svep alla moduler × lägen × nivåer × storlekar i dev-spegeln, slarvigt flöde, kontextfritt
   förklaringsprov, Dennis prövar på telefonen.
5. Release v77 (README), sedan rivningen av den gamla koden som egen skiva.

## Läget

- Klart 12/11: skiva 1–4 (svep i webbläsaren: alla 32 omgångar till kvittot, lägena 375 × 667 till 1180 × 820,
  språksvep), merge till dev, release v77 och v78 (böjningen "växlar dem"). Kvar: Dennis prov på telefonen, ett
  förklaringsprov utan kontext och rivningen av den gamla koden (TODO).
- Avvikelser från planen: kortet krymps också i telefon stående när kladden annars blir under 100 px (små telefoner);
  iPad skalar inte texten än (zoom fungerar inte på iPadOS, `--k` kommer med iPad-planen D45); läget Med hjälp räknar
  "direkt" som utan fel; förklaringsprovet är Dennis eget prov av mockupen (vyerna är desamma), inget nytt prov med
  en granskare utan kontext före v77 – Dennis bad om driftsättning direkt efter bygget.
