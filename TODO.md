# TODO

## Öppet

- [ ] Senare modul: division med flersiffrig nämnare (trappan, nämnaren läggs till gång på gång), när barnet når dit (D47 ✎).
- [x] ~~D48: kort division och uppställd multiplikation får övningsbladens knappsats, svarsknapp och kladd (egen skiva efter rivningen; VD:n personligen, ingen subagent – D48 ✎). Bara polering: logik och pedagogik i multiplikationen rörs inte. Jämför också övningsbladen mot multiplikationen: fel som återkommer, aldrig misslyckas helt, flera försök, hjälp vidare. Dennis: cellinmatningen i multiplikationens motor "är inte så smart" (erkänd brist) – titta på den. Ta bort värdläget `runTask({ kind:'div' })` i `multdiv.js`, som inget anropar efter rivningen.~~ (12/11, v80 på dev: hjälptrappan i övningsbladen, kladden, knappsatsen, Ledtråd, svaret i frågan, berömmet; väntar på Dennis prov)
- [ ] Övningsbladens kladdknappar är 44 × 36 px (under 44 px-regeln); multiplikationens är 44 × 44. Gör övningsbladens lika och mät kladden på små telefoner.
- [ ] Döda CSS-regler i `multdiv.js` efter D48: `.md-free-keys`, `.md-numpad`, `.md-field-sm`, `.md-free-ll` (används inte längre). Värdläget `runTask({ kind:'div' })` likaså.
- [x] ~~Övningsblad plan 3: bygget i appen och v77~~ (12/11, `js/ovningsblad.js`, PLAN-OVNINGSBLAD-BYGGE.md)
- [x] ~~Riv den gamla övningsbladskoden (D44: `ovdiv`, `DIV_IDS`, typerna `dr ts dz pt kd prob`, bandet, `tests/ovningsblad.test.mjs`, `tests/webblasare/band-svep.js`) i `matteprov*.js` som egen skiva med granskning~~ (12/11, gren `riv-d44`: logik och skärmar för Matteprov 1 oförändrade enligt svep före/efter)
- [x] ~~Övningsbladen: Dennis prövar v77 på telefonen; ett förklaringsprov med en granskare utan kontext på appens vyer~~ – Dennis provade v79 och är nöjd; förklaringsprovet behövs inte nu (D47 ✎ 12/11)
- [ ] iPad-planen (D45 ✎, `brainstorm/12`) – fråga Dennis först, efter rivningen och D48 (D48 ✎ 12/11).
- [ ] Matteprov 1: rätta de 15 fynden i `brainstorm/11` (D44) – fråga Dennis först, efter rivningen och D48.
- [ ] P16, P17 (uppställningen): ta upp med Dennis.
- [ ] P14 (skakningar, röd puls): ta upp med Dennis.
- [ ] Matteprovet: ta bort den oanvända uttryckslogiken (`parseExpr`, `exprOk`, problemlösningsdelen av `check`) och dess tester, nu när problemlösningen går i ledda steg (D39 ✎).
- [ ] Matteprovet: test som jämför "Så här gör du" med nivåns uppgiftstyper (rotorsaken till att Svårare-genomgången saknades 19/10).
- [ ] P7: byt emoji-medaljen i Klocktestets resultatvy (`showTestResult` i `js/clock.js`) och 🎲-ikonen för gamla
      "Eget prov"-poster i Gångertabellens logg mot SVG (`MP.medalSVG` finns).
- [ ] P6: prova att dra visarna med ett riktigt finger på telefonen (PWA på en riktig telefon).
- [ ] P1: bygg en växel i kort-divisionsmockupen där faktan visas efter svaret i Räkna med hjälp, och låt ett barn
      pröva båda; Dennis dömer.
- [ ] P4: förslag på hur prickraden i Öva förklarar romb och ring, och spärr mot två genomgångar i följd — som mockup.
- [ ] P2, P3: ta upp med Dennis ("1 av 5 rätt"; Klart automatiskt efter ~3 s i hjälpläget, ingen "Klart"-text i
      Räkna själv).
- [ ] (Senare) P5: avgör om varje timme ska övas i både "över"- och "i"-form i Klockans Kvart och Runt halv.

## Klart

- [x] D42 Räkna med hjälp och Räkna själv i matteprovet – live i v73 2026-10-21.

- [x] Enklare förklaring av nollan (D41 ✎) – live i v72 2026-10-21.

- [x] Minnessiffran utan fokusbyte i matteprovet (D41 ✎) – live i v71 2026-10-21.

- [x] D41 matteprovets räknesätt (Minnessiffra/Dela upp), delraderna i Räkna själv, grå nollor i Dela upp – live i v70 2026-10-21.

- [x] D40 nivå 4: den osynliga nollan, pekningen av målceller, blandade tal, färgade siffror, orange ram – live i v70 2026-10-21.

- [x] D39 snällare app (matteprovet och övriga moduler, en knapp, ledda steg, resultatraden), live i v69 2026-10-19.

- [x] Matteprov 4:an med Matteprov 1 (D37), live i v67 2026-10-19.
- [x] Matteprovet runda 2–4 (D38: kladd, hjälptrappa, mitt prov, frågan per rad, ångra/gör om, en svarsknapp), live i v68 2026-10-19.

- [x] 2026-10-19 ~~Geografi inbyggd i appen och livesatt~~ i v66 (D35, D36); integriteten rensad (D36).
- [x] 2026-10-19 ~~P9: tio sammanslagna grenar på GitHub borttagna~~ (D23).
- [x] 2026-10-19 ~~De två gamla agent-worktrees borttagna~~; 18 sammanslagna lokala grenar raderade (kvar: `dev`, `main`).
- [x] 2026-10-19 Ordning och reda införd i repot (D21): CLAUDE.md, logg/, TODO, `.project-context/`,
      brainstorm/, referens/, design-lab/README.md.
- [x] 2026-09-24 v65 live: Dagens träning bara för Gångertabellen och Klockan (D20).
