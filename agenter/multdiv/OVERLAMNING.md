# Överlämning – Uppställd multiplikation (multdiv, levande expert)

**Roll:** byggde och förvaltar den uppställda multiplikationen i `js/multdiv.js`: nivå 4 med den osynliga nollan
(D40), pekningen med färgade siffror, delraderna i Räkna själv och kroken som matteprovet lånar motorn genom (D41).
Kan granska, rätta och bygga vidare. Divisionen bor i samma fil, men den här rollen har bara rört dess texter
(täljar- och kvotsiffrorna som ref).
**Datum:** 2026-10-21.
**Läge:** live i **v70** (`main` = `ea258a3`, återställningspunkt `live-fore-v70`). Arbetet sker på `dev`. Dagens
grenar (`niva4`, `farg-siffror`, `matteprov-metod`, `matteprov-nollor`) är sammanslagna och borttagna.
Vitest 21/10: hela sviten 503, varav 61 i `tests/multdiv.test.mjs` och 85 i `tests/matteprov.test.mjs`.

## Läs först
1. `CLAUDE.md`: pedagogiken (ett steg är en idé, texten före rörelsen, slutsatsen sist, klickstyrt), språket (ett
   tal har bara en roll per mening, platsord), gränssnittet (390 × 844 och 797 utan scroll, ingen felsignal, en
   svarsknapp i taget).
2. `.project-context/DECISIONS.md`:
   - **D40 med tre ✎**: nivå 4 med minnessiffran kvar, den osynliga nollan i en grå ruta och blandade tal; ✎
     förklara nollan och målcellerna; ✎ siffrorna i texten färgkodas och cellen pulserar; ✎ orange ram på de
     aktuella rutorna.
   - **D41 med tre ✎**: matteprovets uppställning med växeln Minnessiffra / Dela upp (Minnessiffra förval, samma
     motor); ✎ delraderna och nollan även i Räkna själv (ändrar D7 för tvåsiffrig faktor, besvarar P15); ✎ grå
     nollor i Dela upp; ✎ nollorna förklaras med siffrans värde och sätts före gångertalet.
   - D3–D7 (lägena), D39 (snällt: ingen felsignal, en svarsknapp i taget).
3. `.project-context/DESIGN.md`: raden Multiplikation och division (och Matteprov 4:an för kroken).
4. Huvudkommentaren överst i `js/multdiv.js` (v30–v37, D40, D40 ✎, D41).
5. `agenter/multdiv/LOGG.md` och, för matteprovets sida, `agenter/matteprov/OVERLAMNING.md`.

## Tillståndet nu

**Nivåerna och generatorn.** Nivå 1–3 är orörda (`genProblem`, ensiffrig faktor). Nivå 4 ("Svårast – blandat")
drar typ ur en blandad påse med en av varje (`drawL4Type`, `L4_TYPES`) och bygger talet med `genL4`:
- `3x1` och `4x1`: tre- eller fyrsiffrigt · 2–9, minst två minnessiffror (`carryCount`);
- `2x2`: 12–98 · 12–98 utan nolla i entalet;
- `3x2`: 101–999 · 12–59 (samordnaren breddade från 12–19, som bladet), utan nolla i entalet.
Påsen ger jämn fördelning och högst två av samma typ i rad. `buildPlan` väljer form efter faktorn: ensiffrig ⇒
`simple`, tvåsiffrig ⇒ `twostep`.

**Motorn med fem kolumner.** `NCOL = 5`; etiketterna E T H T TT (`LBL`), femte färgen bärnsten (`COLV`, `chip-amber`),
`PV_NAMN` till tiotusentalet, `freshCarries()`. `singlePass`, `addPass` och `noCarryAnswer` var redan
breddoberoende.

**Den osynliga nollan** (`#md-p2-0`, `.md-zero`, färgerna `#d9dde3`/`#9aa3ae`, nollan `#64748b`):
- *Titta och lär:* fasen rad 2 är ett eget steg före rad 2:s första gångertal. Texten förklarar med siffrans
  värde: "2 står i tiotalet och är värd 20. 20 är 2 · 10. 10 har en nolla – därför en nolla i entalet först."
  (med 1 i tiotalet utan mellanmeningen). Sedan faller nollan in (`showZero`). Bubblan är fast 88 px vid `twostep`.
- *Räkna med hjälp:* samma text i bubblan; nollan kommer av sig själv, knappen väntar tills den står.
- *Räkna själv:* nollan står ljusgrå från början, med raden "Rad 2 räknar med tiotal, därför en nolla i entalet."
- Additionen: entalskolumnen säger "Nollan lägger inte till något — 3:an åker ner i entalet."

**Pekningen.** `multRefs(step, pl)` är den enda källan: faktorcellerna (a, b) eller delsummornas siffror (x, y) och
målrutan eller -rutorna. Texterna (`multStepText`, `multHelpText`, `askText`, `helpExprHTML`) skriver siffror med
`ref(plats, värde)`: fet, i cellens platsvärdesfärg, `data-ref` (`md-<rad>-<g>`, `mem:cur`, `chip:0`); produkter och
summor är bara feta. `multLitCells` läser samma `multRefs`. `pulseRefs` låter de utpekade noderna pulsera en gång
(Web Animations, 180 ms efter texten). Nivå 1–3 har sina gamla ord, bara färgerna är nya. På nivå 4 (`isD40`)
säger texterna platsen ("Det hör till entalet.", "3:an skrivs i entalet.", "Tiotalet: 8 + 7 är 15.").
**Den orange ramen** (samordnarens D40 ✎): `.md-glow`/`.active-col` får `#fb923c` och animationen `md-focus`.

**Delraderna i Räkna själv** (tvåsiffrig faktor): `exFreeGrid` med `p1`, `p2`, `ans`, `exFreeRow`; `freeRowCols`,
`freeRowValue`, `freeAnsLocked` (summan låst tills båda raderna har siffror), `freeButtonMode`/`freeNextRow`
(knappen "Nästa rad" tills allt har siffror, sedan Klar), `freeCheck` (raderna rättas före summan; glömd
minnessiffra per rad och i summan; raden som inte stämmer blir milt persika, `md-soft`). Ensiffrig faktor, nivå 1–3
och divisionen har bara svarsraden.

**Kroken `runTask`** (D41): `MultDivGame.runTask({ a, b, mode:'help'|'free', profile, title, right, exitMsg,
exitAsk, onDone, onExit })` räknar en uppgift på multiplikationens skärm (`Router.silent`) och lämnar
`{ outcome:'direkt'|'hjalp'|'svar', cls, facts }`. `host` är null i multdivs egna lägen; `showModeSelect`,
`startExercise` och `startDemo` släpper en lånad uppgift som lämnats utan Avsluta. Nivå, räknesätt och läge
återställs efter varje lånad uppgift (`hostRestore`). Matteprovet (`runMinne`/`minneDone` i `js/matteprov.js`)
använder `help` i Öva och `free` i provet och Mitt prov, med en hjälptrappa per rad (`hostFreeWrong`,
`hostBitHTML(pl, rad)`): först en tyst ledtråd, sedan radens facit, och kommer samma rad igen visas svaret i grått.
Utfallet bokförs i kvittot och i "det som var svårt" (`upp:minne`, tabellfakta).

## Samordnarens två rättningar 21/10 (`6edd0a9`)
- `showZero`: nollans ruta behåller den orange ramen (`md-glow`) så länge texten visas; nästa stegs belysning rensar.
- Hjälpläget: bara rutor i den rad som räknas just nu får `active-col` (Dennis: "sista rutan här i totalsumman. den
  behöver inte lysa förrän den är aktuell").

## Kalibrering
- **Mät i webbläsaren** (localhost:5312, dev-spegeln via rsync) i 390 × 844 och 797: `scrollHeight`, `#md-left`
  overflow, kladdens höjd (`#md-canvas`), bubblans höjd. Panelen delas: ange `tabId`, kontrollera `location.origin`.
  En dold panel strypar timers; driv långa förlopp i bakgrunden (`__bg`) och läs av i korta anrop.
- **Testkrokar:** `__test.forceNext(a, b)` (mult och div), `__test.peek()`, `_internals.genL4`, `__test.hostActive()`.
- **Falsklarm:** "An unknown error occurred when fetching the script" är panelens service worker, inte appen.
- **Svårt:** text som är för lång hoppar knappsatsen; alltid mäta bubblan vid nya meningar.

## Kända begränsningar
- **Kladdens höjd i 390 × 797:** Räkna själv med tvåsiffrig faktor 165 px från början, 108 px med ledtrådsraden,
  95 px när hjälpbiten står i bubblan (matteprovets prov). Hjälpläget: 90 px under rad 2:s tvåradiga fråga.
- **P14:** skakningar vid fel svar finns kvar, och demon pulserar tiotalssiffran rött i fasen rad 2 (`md-prob`).
- **P13:** i Räkna själv räknas en siffra följd av Klar som ett försök.
- Dela upp har färgade siffror i förklaringen men ingen ref-puls (mekanismen finns bara i multdiv).

## Nästa steg
- Vänta på Dennis synpunkter på v70.
- P13 och P14 med Dennis.
