# Multiplay

En PWA där Mira, 10 år, tränar skolmatte: gångertabellen, klockan, uppställning, division, platsvärde,
10-kompisar och nationella prov. Dennis bygger den åt henne; pedagogiken är det viktiga.

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
| Ett beslut och varför | `.project-context/DECISIONS.md` (D1–D36) |
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
| Milstolpe (release), före komprimering, sessionens slut | hela passet (15 § 3a), städkontrollen tills Rent |
| Ny dag | ny loggfil; första avsnittet pekar på gårdagens "Nästa steg" |

Städkontrollen: `python3 -I ~/OneDrive/claude-verkstad/skills/rutiner-och-verktyg/snippets/stadkontroll.py .`

## Agenter
| Roll | Agent-id | Rapport | Överlämning + logg |
|---|---|---|---|
| Geografi (mockupen, bygget) | `acf985ddd0b12ab7f` | dagens logg | `agenter/geografi/OVERLAMNING.md`, `LOGG.md` |

Väck en levande expert med SendMessage till id:t. Ny session: agenterna finns inte längre – starta rollen (samma
agenttyp, med skrivverktyg) med sin överlämning och logg först och skriv in det nya id:t här.

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
  `rsync -a --delete --exclude '.git' --exclude 'node_modules' --exclude '.claude' --exclude 'design-lab' ./ ~/multiplay-dev/`
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
