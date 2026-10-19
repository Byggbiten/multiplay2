# Multiplay

PWA där barn tränar skolmatte. Vanilla JS utan byggsteg, live på https://byggbiten.github.io/multiplay2/ från
grenen `main`; arbete sker på `dev`. Börja i `CLAUDE.md`. Användarmanual: `MANUAL.md`.

## Kommandon

**Test** (vitest, `tests/*.test.mjs`; agenternas worktrees under `.claude/` är undantagna):

```bash
npx vitest run
```

**Dev** — spegeln `~/multiplay-dev` serveras utan cache av `~/multiplay-dev-server.py` på port 5312:

```bash
rsync -a --delete --exclude '.git' --exclude 'node_modules' --exclude '.claude' --exclude 'design-lab' ./ ~/multiplay-dev/
python3 ~/multiplay-dev-server.py          # om den inte redan är igång
# dator: http://127.0.0.1:5312/   telefon: https://macbook-pro.tail3c8e5a.ts.net:8445
```

**Mockuper** i `design-lab/`:

```bash
python3 -m http.server 5420                # i repots rot (mockuperna läser bilder ur referens/)
# dator: http://127.0.0.1:5420/design-lab/<fil>.html   telefon: https://macbook-pro.tail3c8e5a.ts.net:8446/design-lab/<fil>.html
```

**Större ändring** — tagg före, egen gren, merge utan snabbspolning:

```bash
git tag -a fore-<namn> dev -m "Dev före <vad>"
git checkout -b <namn> dev
# … commits …
git checkout dev && git merge --no-ff <namn> -m "Merge <namn>: <vad> (vNN)"
git push origin dev --follow-tags
```

**Release** — höj först `APP_VERSION` i `js/app.js` och `CACHE_VERSION` i `sw.js` till samma vNN på `dev`:

```bash
npx vitest run                             # hela sviten grön
git fetch origin
git tag -a live-fore-vNN origin/main -m "Main (live) före release vNN — v<förra>"
git checkout main && git merge --ff-only origin/main
git merge --no-ff dev -m "release vNN: <vad>"
git push origin main live-fore-vNN
git checkout dev
curl -s https://byggbiten.github.io/multiplay2/js/app.js | grep APP_VERSION   # ska visa vNN (GitHub Pages kan dröja en minut)
```

**Ångra** en större ändring på dev, eller en release på main:

```bash
git revert -m 1 <merge-commit>             # ångrar hela grenen; taggen fore-<namn> / live-fore-vNN visar läget före
```

## Filerna

| Fil | Ansvar |
|---|---|
| `index.html` | Alla skärmar (`<section class="screen">`), spelväljaren, SVG-ikonerna, script-taggarna i laddningsordning |
| `styles/app.css` | Designsystemet: tokens, temaklasser per modul, komponentklasser (katalog: `referens/DESIGN-SYSTEM.md`) |
| `sw.js` | Service workern: `CACHE_VERSION`, network-first för html/js/css |
| `manifest.json`, `icon-*.png` | PWA-manifestet och ikonerna |
| `js/shared.js` | `window.MP`: lådorna (`MP.spaced`), nötloopen (`MP.createDrill`), kvittot, retry-kön, loggar, medaljer; laddas först |
| `js/app.js` | Routing, profiler och `Store`, ljud, konfetti, spelväljarens status, `APP_VERSION` |
| `js/daily.js` | Dagens träning: urval ur Gångertabellens och Klockans lådor, passet och slutskärmen |
| `js/capy.js` | Capybara-samlingen: 24 SVG-kort i nivåerna Nytt kort, silver, guld, och händelserna som ger dem |
| `js/multiplication.js` | Gångertabellen: hubben, övningspasset, strategierna, Öva, De svåra talen, Rekordrunda, statistik |
| `js/clock-logic.js` | Klockans DOM-fria logik: stegen och tiderna, orden, felalternativen, visarna, lektionerna som data |
| `js/clock.js` | Klockans gränssnitt: trappan, lektionerna, passet med dragbara visare, Lekklockan, Klocktest |
| `js/tenfriends.js` | 10-kompisar: övning och test |
| `js/np-matte-muntligt.js` | Nationella prov åk 3, matte muntlig del: tio kategorier med slumpade frågor |
| `js/np-matte-skriftlig.js` | Nationella prov åk 3, matte skriftlig del |
| `js/np-svenska-texts.js` | Textbanken för NP svenska; laddas före `np-svenska.js` |
| `js/np-svenska.js` | Nationella prov åk 3, svenska |
| `js/nationella.js` | Hubben för Nationella prov: ämne och delprov |
| `js/platsvarde.js` | Platsvärde: tio frågor per pass om positioner, tal och talord |
| `js/uppstallning.js` | Uppställd addition och subtraktion: demo, hjälpläge och Räkna själv |
| `js/multdiv.js` | Uppställd multiplikation och kort division: demo, hjälpläge och Räkna själv |
| `tests/` | En testfil per modul med ren logik; textsvep för språkreglerna |
| `design-lab/` | Klickbara mockuper som är facit (register: `design-lab/README.md`) |

**Levande experter:** `agenter/` – en mapp per roll med överlämning och lärdomslogg (register: `agenter/README.md`).
