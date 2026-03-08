# NP_MATTE_MUNTLIGT.md – Kontextfil för framtida sessioner

> **Syfte:** Den här filen ger kontext åt Claude Code (eller annan AI-assistent) som återupptar utveckling av MULTIPLAY-appen. Läs den FÖRST.

---

## Projektöversikt

**MULTIPLAY** är en pedagogisk PWA (Progressive Web App) riktad till en 9-årig flicka i åk 3 i Sverige. Appen är byggd med vanilla JavaScript (inga ramverk), HTML och CSS. Den körs som en PWA på iPad med Apple Pencil.

### Tech stack
- **Vanilla JS** – IIFE-moduler, inga bundlers, inga ramverk
- **HTML** – allt i en enda `index.html` med `<section class="screen">`-baserad routing
- **CSS** – custom properties i `styles/app.css`, per-modul paletter
- **PWA** – manifest.json + sw.js för offline-stöd
- **localStorage** – all data lagras lokalt per profil

### Arkitekturmönster
Varje spelmodul följer samma mönster:
1. En IIFE som returnerar ett objekt med minst `init(profile)`
2. Renderar all HTML i en root-div via `innerHTML`
3. Registreras i `App.startGame()` med ett screen-ID
4. Använder `Sound`, `Confetti`, `Store` från `App`-objektet

---

## Vad som finns (befintligt)

| Modul | Fil | Screen-ID | Beskrivning |
|-------|-----|-----------|-------------|
| Gångertabellen | `js/multiplication.js` | screen-multiplication | Träna 1–12:ans tabell |
| Klockan | `js/clock.js` | screen-clock | Lär dig klockan |
| 10-Kompisar | `js/tenfriends.js` | screen-friends | Talpar som blir 10 |

## Vad som lagts till (Nationella Prov) – STATUS: ✅ KLART 2026-03-08

| Modul | Fil | Screen-ID | Status |
|-------|-----|-----------|--------|
| NP-navigation | `js/nationella.js` | screen-nationella-select, screen-np-matte-select | ✅ Klar |
| Matte Muntligt | `js/np-matte-muntligt.js` | screen-np-matte-muntligt | ✅ Klar |

### Ändringar i befintliga filer
- **`styles/app.css`**: NP-paletten (`--np-*`) lagd till i `:root`
- **`index.html`**: Spelkort för Nationella Prov + 3 nya screens + 2 nya script-taggar
- **`js/app.js`**: `startGame()` hanterar nu `'nationella'` → `NationellaHub.init(profile)`

### Navigationsflöde
```
Spelväljaren → Nationella Prov Åk 3 (spelkort game-np)
  → screen-nationella-select (NationellaHub.showSubjectSelect)
    → Matematik Åk 3 (aktiv) → screen-np-matte-select
      → Muntlig del (aktiv) → screen-np-matte-muntligt ← BYGGT ✅
      → Skriftlig del (gråtonad placeholder, TODO)
    → Svenska Åk 3 (gråtonad placeholder, TODO)
```

---

## Spelets 10 kategorier

| # | Kategori | Svarstyp | Visuellt stöd |
|---|----------|----------|---------------|
| 1 | Läsa av tabell | choice/free | HTML-tabell |
| 2 | Läsa av diagram | choice/free | SVG-stapeldiagram |
| 3 | Flest eller färst | choice | Tabell/diagram |
| 4 | Fler eller färre | free | Tabell/diagram |
| 5 | Berätta hur du tänker | oral | Varierar |
| 6 | Sannolikhet och chans | choice | SVG kulpåsar/snurra |
| 7 | Tillsammans | free | Tabell |
| 8 | Dubblering | free | Text/tabell |
| 9 | Halvering | free | Text/tabell |
| 10 | Berätta hur du tänker | oral | Varierar |

Varje kategori har en generator som slumpar tema, namn, värden och frågetyp. Inga frågor är hårdkodade.

---

## Viktiga designbeslut

1. **Kladdyta (canvas)** finns på varje fråga – stödjer Apple Pencil med tryckkänslighet via PointerEvent
2. **Belöningar** är slumpade och överdrivna – konfetti, hjärtan, stjärnor, emojis + varierade ljud
3. **Felhantering** är mjuk – max 2 försök, sedan visas rätt svar utan hård feedback
4. **Muntliga frågor** har en "Vi har pratat klart"-knapp för vuxen – räknas alltid som godkänt
5. **Varje pass = 10 frågor** i fast ordning (en per kategori)
6. **Resultat** sparas i localStorage med nyckel `np_matte_muntligt_stats_{profileId}`

---

## CSS custom properties (NP-modulen)

```css
--np-bg:        linear-gradient(135deg, #fef9c3 0%, #fce7f3 50%, #ede9fe 100%);
--np-primary:   #7c3aed;
--np-secondary: #f472b6;
--np-accent:    #fbbf24;
--np-light:     #fef3c7;
--np-glow:      rgba(124, 58, 237, 0.4);
```

---

## Framtida arbete (ej byggt ännu)

- [ ] Svenska Åk 3 – helt ny modul
- [ ] Skriftlig del Matte – ytterligare delmodul under Matte
- [ ] Statistik/historik-vy för NP-resultaten
- [ ] PDF-export av resultat
- [ ] Fler varianter inom varje kategori (fler teman, fler frågetyper)
- [ ] Svårighetsgrader (lätt/medel/svår)
- [ ] Animerad snurra som faktiskt snurrar vid sannolikhetsfrågor

---

## Filstruktur

```
Multiplay/
├── index.html              ← Alla screens, inline CSS, script-taggar
├── manifest.json           ← PWA-manifest
├── sw.js                   ← Service worker
├── DESIGN.md               ← Designsystem (färger, typsnitt, animationer)
├── MANUAL.md               ← Användarmanual
├── NP_MATTE_MUNTLIGT.md    ← DENNA FIL – kontextfil
├── styles/
│   └── app.css             ← Alla CSS custom properties och globala klasser
└── js/
    ├── app.js              ← Huvud-app: Router, Store, Sound, Confetti, App
    ├── multiplication.js   ← Gångertabellen
    ├── clock.js            ← Klockan
    ├── tenfriends.js       ← 10-Kompisar
    ├── nationella.js       ← NP-navigationshub
    └── np-matte-muntligt.js ← Matte Muntligt-spelet
```

---

## Konventioner att följa

- **Språk i kod:** Engelska variabelnamn, svenska i UI-text
- **Modulnamn:** PascalCase IIFE (t.ex. `NpMatteMuntligt`)
- **CSS-prefix:** `np-` för NP-modulens klasser
- **localStorage-nycklar:** `np_matte_muntligt_stats_{profileId}`
- **Touch first:** Alla interaktioner designade för touch/pencil
- **Min knappstorlek:** 56px höjd (DESIGN.md)
- **Inga externa dependencies** – allt vanilla JS + Web Audio API + Canvas API
