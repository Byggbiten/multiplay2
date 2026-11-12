# Multiplay

En PWA där barn tränar skolmatte: gångertabellen, klockan, uppställning, division, platsvärde, 10-kompisar och
nationella prov. Dennis bygger den; pedagogiken är det viktiga.

**Personan (D36).** Mira är appens persona: ett påhittat barn i målgruppen (7–10 år). Fynd från riktiga barntester
skrivs "barntestet" eller "testbarnet", utan namn, ålder, skola eller familj; fynd från en agent som spelar personan
skrivs "rollspelet" ("genomspelet" när det inte går att se vilket). Mira och Zelda används annars bara som generiska
namn i uppgifterna.

- **Stack / drift / git:** vanilla JS (IIFE-moduler, inget byggsteg), `localStorage` per profil, service worker.
  Live på https://byggbiten.github.io/multiplay2/ (GitHub Pages) från grenen `main` i `Byggbiten/multiplay2`.
  Allt arbete sker på `dev`. Push till `dev` är stående godkänt; ingen force-push.
- **Användarmanual:** `MANUAL.md` (vad barnet och föräldern ser, per modul och version).
- **Rutiner:** skillen `rutiner-och-verktyg` gäller, inklusive `references/15-ordning-och-reda.md`.

## Session-start (gör alltid, i ordning)
1. Läs den här filen.
2. Läs senaste filen i `logg/` — slutet ("Läget nu", "Nästa steg") säger var vi är.
3. Läs `TODO.md`, `.project-context/OPEN_QUESTIONS.md` och de senaste posterna i `.project-context/DECISIONS.md`.
4. Ska du röra en modul: dess rad i `.project-context/DESIGN.md`, och specen eller mockupen den pekar på.

## Var hittar jag vad
| Söker | Fil |
|---|---|
| Var vi slutade | senaste `logg/` |
| Ett beslut och varför | `.project-context/DECISIONS.md` (D1–D48) |
| Det olösta | `.project-context/OPEN_QUESTIONS.md` |
| Vad vi bygger: moduler, `shared.js`, lagringsnycklar | `.project-context/DESIGN.md` |
| Specar och planer | `.project-context/SPEC-*.md`, `.project-context/PLAN-RENOVERING.md` |
| Avfärdade idéer, arbetsvanor | `.project-context/AGENT_CONTEXT.md` |
| Granskningar och tankepass | `brainstorm/README.md` |
| Mockuper som är facit | `design-lab/README.md` |
| Underlag, designsystemets klasskatalog | `referens/README.md` |
| Att göra | `TODO.md` |
| Kod, dev, test, release, ångra | `README.md` |
| Hur appen ser ut för användaren | `MANUAL.md` |

## Ordning och reda
Filernas roller och rutinen: `rutiner-och-verktyg/references/15-ordning-och-reda.md`. Kort: en sak har en
plats; loggen slutar med "Läget nu" + "Nästa steg"; beslut som D-poster med Dennis ord; inga kladd- eller
förbrukade filer i repot (scratch hör hemma i scratchpad); `git add` med explicita sökvägar.

**När Dennis säger "ordning och reda":** kör hela passet i 15 § 3a – logg (Läget nu/Nästa steg), beslut, frågor,
plan och TODO, historik, register och rent repo, CLAUDE.md, subagenter, lärdomar, städkontrollen tills Rent.
Inte bara städning. "… och fortsätt" = kör passet och fortsätt med första punkten i loggens "Nästa steg".

| Tillfälle | Gör |
|---|---|
| Dennis beslutar något | D-post med hans ord; stryk besvarad fråga; rad i loggen |
| En punkt blir klar | bocka och stryk i TODO |
| En fil skapas | rätt mapp + rad i registret |
| Ett fel rättas | loggraden "Varför fångade inte motorn detta?" + testet som fångar feltypen, provat mot felet först (15 § 5–6) |
| En subagent rapporterar | fynden in i TODO med id; rapporten sparad i projektet (`brainstorm/`) |
| En subagent levererar UI | granska själv innan det går till Dennis: egna skärmbilder i 390 × 797 av varje steg som ändrats, i alla nivåer (Lättare och Svårare är olika flöden) + förklaringsprov av en granskare utan kontext (ui-skolan steg 5); agentens egen mätning räknas inte som bevis |
| En agentroll startas | kontor `agenter/<roll>/` med `OVERLAMNING.md` + `LOGG.md`, rad i `agenter/README.md`, id i tabellen Agenter nedan |
| En agentrunda är klar | överlämningen beskriver läget nu, ny lärdom står i rollens `LOGG.md` (också det granskningen hittade), id:t i tabellen stämmer |
| Milstolpe (release), före komprimering, sessionens slut | hela passet (15 § 3a), städkontrollen tills Rent |
| Ny dag | ny loggfil; första avsnittet pekar på gårdagens "Nästa steg" |
| Efter en kontextkomprimering | läs om den här filen och loggens "Läget nu"/"Nästa steg" innan något annat; arbetssättet (D46) gäller oavsett vad sammanfattningen säger |
| Före en komprimering | beslut från passet som D-poster, metoder i den här filen, loggen aktuell, städkontrollen Rent |
| Ett delmål är nått | mät kontexten (`mcp__ccd_session_mgmt__get_usage`, fältet `context.percentUsed`) och skriv procenten i loggen; vid 80 % eller mer: hela passet och sedan komprimering, långt före den automatiska vid 97 % |
| Något nytt byggs eller ändras i en vy | jämför med appens övriga vyer: samma knappsats, svarsknapp, kladd, färger och ord; avvikelse kräver ett beslut (D-post), annars är det en fråga i OPEN_QUESTIONS (se P18) |

Städkontrollen: `python3 -I ~/OneDrive/claude-verkstad/skills/rutiner-och-verktyg/snippets/stadkontroll.py .`

## Agenter
| Roll | Agent-id | Rapport | Överlämning + logg |
|---|---|---|---|
| Geografi (mockupen, bygget) | `acf985ddd0b12ab7f` | dagens logg | `agenter/geografi/OVERLAMNING.md`, `LOGG.md` |
| Matteprov (Matteprov 4:an D37–D42, övningsblad för division D44) | `a820dd6909744826e` | dagens logg | `agenter/matteprov/OVERLAMNING.md`, `LOGG.md` |
| Uppställd multiplikation och kort division (multdiv, D40–D43, motorrundan) | `a566d8b8d8411628d` | dagens logg | `agenter/multdiv/OVERLAMNING.md`, `LOGG.md` |

VD:n skriver sina dokument i en egen arbetskopia (`git worktree add ~/multiplay-wt-docs origin/dev -b docs-tmp`,
push `HEAD:dev`) när en agent arbetar i huvudkopian – annars hamnar commits på agentens gren (hände 11/11).
Väck en levande expert med SendMessage till id:t. Ny session: agenterna finns inte längre – starta rollen (samma
agenttyp, med skrivverktyg) med sin överlämning och logg först och skriv in det nya id:t här.

**Repot är minnet.** Allt som behövs för att ta över – beslut, metoder, läget, varje agents arbete – står i repot,
inte i chatten eller i en agents kontext. En ny session eller en ny agent ska kunna börja från repot ensamt.

**Kontoren (`agenter/`).** Varje byggande roll har ett kontor; det är det som håller rollen levande mellan
sessioner. Parallella arbetare i samma uppdrag delar ett kontor (en överlämning, en loggrad per arbetare).
Granskare utan kontext får inget kontor – deras fynd skrivs in i den byggande rollens `LOGG.md`. Varje agent
skriver om sin `OVERLAMNING.md` och lägger lärdomar i `LOGG.md` *före* varje rapport, så att vem som helst kan ta
över när som helst; VD:n kontrollerar datumet vid varje rapport och skickar tillbaka en rapport utan uppdaterat kontor. Vid "ordning och
reda": varje kontor som rörts sedan förra passet ska ha överlämning och logg från samma dag som rollens senaste
commit (`git log -1 -- agenter/<roll>` mot `git log -1 --author` för rollens kod).

## Absoluta regler

- Påstå bara det som är uppmätt eller kontrollerat; ett värde som finns i en källa läses därifrån (15 § 7).

**Version och release**
- `APP_VERSION` i `js/app.js` = `CACHE_VERSION` i `sw.js`, och båda höjs vid varje release.
- Release: hela sviten grön → tagga `live-fore-vNN` på `origin/main` → `git merge --no-ff dev` till `main` och
  pusha → verifiera att den publicerade `js/app.js` visar den nya versionen. Kommandona: `README.md`.
- Större ändring: tagga `fore-<namn>` på `dev`, bygg på en egen gren och merga `--no-ff` till `dev`, så att
  `git revert -m 1` ångrar hela ändringen (D9).

**Dev och test**
- Dev-spegeln synkas med
  `rsync -a --delete --exclude '.git' --exclude 'node_modules' --exclude '.claude' --exclude 'design-lab' --exclude '_privat' ./ ~/multiplay-dev/`
  och serveras på `:5312` (`~/multiplay-dev-server.py`), på telefon via `https://macbook-pro.tail3c8e5a.ts.net:8445`.
- Mockuper i `design-lab/` serveras på `:5420` från repots rot (så att de når `referens/`), adress
  `/design-lab/<fil>.html`; på telefon `https://macbook-pro.tail3c8e5a.ts.net:8446/design-lab/<fil>.html`.
- Tester: `npx vitest run`. Hela sviten ska vara grön före varje commit som rör kod.
- Webbläsarpanelens koordinatklick hamnar fel under emulering — driv den med `element.click()`. UI-test i
  iOS-simulatorn sker som PWA på iPhone 17e.

**Pedagogiken** (Dennis måttstock, `SPEC-KORT-DIVISION.md`: barnen ska i minsta möjliga mån känna "vad hände nu och
varför?")
- Ett steg är en idé.
- Texten står innan rörelsen börjar.
- Slutsatsen kommer sist, i ett eget steg.
- Allt är klickstyrt; ingenting spelas upp av sig självt (D3).

**Språket**
- Samma tal får aldrig ha två roller i samma mening.
- Inga jämförelseord som förutsätter ett val som inte gjordes ("närmast" när det bara fanns ett alternativ).
- Peka ut siffror med deras plats ("tiotalet", "resten 2"), inte bara med värdet.
- Flervalets plats lottas, så att platsen aldrig avslöjar svaret (D17).

**Gränssnittet**
- 390 × 844 utan scroll, träffytor ≥ 44 px, inga emojis i nytt (SVG som ikoner).
- Ingen felsignal (D39): inget rött för fel svar (mjuk persika), inget surr (felljudet högst en gång per uppgift),
  "Inte riktigt – försök igen" i stället för "Fel". Resultat med `MP.resultNote`: beröm från 60 %, under 60 % bara
  "Du fick 3 av 10 rätt". `tests/snallare.test.mjs` larmar om "Fel!", "Fel svar" och "Tyvärr".
- En svarsknapp i taget (D39 ✎): i lägen med flera rutor heter knappen Nästa tills allt är ifyllt och sedan Klar.
