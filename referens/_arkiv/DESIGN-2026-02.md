# 🎨 MULTIPLAY – Designsystem & Designbeslut

> Referensdokument för hela projektet. Konsultera detta vid varje designbeslut.

---

## 🌈 Känsla & Vision

MULTIPLAY ska kännas som att öppna en ask med magiska saker. Appen riktar sig till flickor 7–10 år och ska väcka glädje, nyfikenhet och stolthet. Varje interaktion ska belönas visuellt. Designspråket är:

- **Magiskt** – stjärnor, glitter, regnbågar, mjuka glödeffekter
- **Gulligt** – rundade former, pastellfärger, söta emojis
- **Levande** – animationer på allt, ingenting är statiskt
- **Tryggt** – stora tydliga knappar, tydlig feedback, inga dolda element
- **Stolt** – medaljer, konfetti, uppmuntrande text – barnet ska känna sig duktig

---

## 🎨 Färgpalett

### Primärfärger (globala)
| Token | Hex | Användning |
|-------|-----|-----------|
| `--color-primary` | `#c084fc` | Huvudfärg, knappar, logotyp |
| `--color-primary-dark` | `#9333ea` | Hover-states, rubriker |
| `--color-secondary` | `#f472b6` | Accenter, highlights |
| `--color-accent` | `#fb923c` | CTA-knappar, viktiga element |
| `--color-yellow` | `#fbbf24` | Stjärnor, medaljer, glädje |
| `--color-success` | `#4ade80` | Rätt svar, framgång |
| `--color-error` | `#f87171` | Fel svar, varningar |
| `--color-info` | `#60a5fa` | Neutral info |

### Bakgrunder
```
Huvud-gradient: linear-gradient(135deg, #fdf4ff 0%, #fce7f3 40%, #eff6ff 75%, #f0fdf4 100%)
```
Mjukt regnbågsflöde från lila via rosa till blå till grön – som en saga.

### Per-modul paletter

#### ✖️ Gångertabellen – Lila Magi
```
--mult-bg:       linear-gradient(135deg, #fdf4ff, #ede9fe)
--mult-primary:  #9333ea  (djup lila)
--mult-secondary:#f97316  (varm orange)
--mult-accent:   #c084fc  (ljus lila/lavendel)
--mult-glow:     rgba(192, 132, 252, 0.4)
```
Känsla: Magisk trolldom, upphöjt och mystiskt med lila glöd.

#### 🕐 Klockan – Drömhimmel
```
--clock-bg:       linear-gradient(135deg, #eff6ff, #fef3c7)
--clock-primary:  #3b82f6  (himmelsblå)
--clock-secondary:#f59e0b  (solguld)
--clock-accent:   #93c5fd  (ljusblå)
--clock-glow:     rgba(147, 197, 253, 0.5)
```
Känsla: Himmel, sol och moln – dag och natt i ett sagoland.

#### 🤝 10-Kompisar – Solsken & Lila
```
--friends-bg:       linear-gradient(135deg, #fdf4ff, #fef9c3)
--friends-primary:  #7c3aed  (djup violett)
--friends-secondary:#eab308  (solguld)
--friends-accent:   #ddd6fe  (mjuk lila)
--friends-glow:     rgba(221, 214, 254, 0.6)
```
Känsla: Vänskap, värme, lekfullhet – som solsken genom lila löv.

---

## 🔤 Typografi

### Typsnitt
| Typ | Font | Vikter | Användning |
|-----|------|--------|-----------|
| **Rubriker** | `Bubblegum Sans` | 400 | Logotyp, spelnamn, stora titlar |
| **Brödtext** | `Nunito` | 400, 600, 700, 800, 900 | All text, knappar, siffror |

Importeras från Google Fonts.

### Skala
```
--text-xs:    0.75rem  (12px) – tiny labels
--text-sm:    0.875rem (14px) – sekundär text
--text-base:  1rem     (16px) – brödtext
--text-lg:    1.125rem (18px) – ingress, viktiga labels
--text-xl:    1.25rem  (20px) – underrubriker
--text-2xl:   1.5rem   (24px) – sektionsrubriker
--text-3xl:   1.875rem (30px) – sidtitlar
--text-4xl:   2.25rem  (36px) – logotyp, stora tal
--text-5xl:   3rem     (48px) – mega-display (resultatsiffror)
```

---

## 📐 Geometri & Spacing

### Border radius
```
--radius-sm:   8px   – chips, taggar
--radius-md:   16px  – inputs, cards
--radius-lg:   24px  – stora kort, modaler
--radius-xl:   32px  – spel-kort
--radius-full: 9999px – pills, avatarer, runda knappar
```
Allt är rundat. Inga hårda kanter.

### Spacing (8px grid)
```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

### Skuggor
```
--shadow-sm:  0 2px 8px rgba(192,132,252,0.15)
--shadow-md:  0 4px 20px rgba(192,132,252,0.25)
--shadow-lg:  0 8px 40px rgba(192,132,252,0.35)
--shadow-glow: 0 0 20px rgba(192,132,252,0.5)
```
Lila glödskuggor istället för grå/svarta – magiskt!

---

## ✨ Animationer

### Keyframes som definieras
| Namn | Effekt | Användning |
|------|--------|-----------|
| `bounce-in` | Studsar in från skala 0 | Element som dyker upp |
| `float` | Flytande upp/ner | Dekorationer, avatarer |
| `sparkle` | Pulserande skala | Stjärnor, medaljemojis |
| `wiggle` | Vänster/höger gugg | Fel svar |
| `shake` | Kraftig skak | Fel vid fri inmatning |
| `pop-in` | Snabb pop från 0→1.1→1 | Knappar, chips vid val |
| `slide-up` | Glider in underifrån | Kort, resultatvy |
| `slide-in-right` | Glider in från höger | Skärmbyten |
| `confetti-fall` | Faller ner + rotation | Konfetti vid 100% |
| `pulse-glow` | Lysande puls | Markerade element |
| `shimmer` | Glittrande svep | Progress bars |
| `spin-slow` | Långsam rotation | Klockdekoration |
| `rainbow-shift` | Regnbåge (hue-rotate) | Topp-resultat |
| `heart-beat` | Litet hjärtslag | Hjärtikoner |

### Rörelseduration
```
--duration-fast:   150ms  – hover/press feedback
--duration-normal: 300ms  – de flesta transitioner
--duration-slow:   500ms  – skärmbyten, modaler
--duration-slower: 800ms  – celebrationer, intro
--easing-bounce:   cubic-bezier(0.34, 1.56, 0.64, 1)  – det magiska studset
--easing-smooth:   cubic-bezier(0.4, 0, 0.2, 1)
--easing-spring:   cubic-bezier(0.175, 0.885, 0.32, 1.275)
```

---

## 🧩 Komponenter

### Knappar
- Minimum höjd: **56px** (touch-vänligt)
- Primär: Lila gradient (`#9333ea → #c084fc`) med vit text och glödskugga
- Sekundär: Rosa gradient (`#ec4899 → #f472b6`)
- Framgång: Grön gradient (`#22c55e → #4ade80`)
- Fara: Röd gradient (`#ef4444 → #f87171`)
- Ghost: Transparent med lila kantlinje
- Hover: scale(1.03) + starkare skugga
- Active: scale(0.97) – tryckkänsla

### Kort (Cards)
- Vit/halvtransparent bakgrund: `rgba(255,255,255,0.85)`
- Glassmorfism-variant: `backdrop-filter: blur(12px)`
- Border: `1px solid rgba(255,255,255,0.6)`
- Skugga: `var(--shadow-md)`
- Hover lift: translateY(-4px) + starkare skugga

### Inputs
- Höjd: **56px**
- Rundade: `border-radius: var(--radius-md)`
- Focus: Lila glow `box-shadow: 0 0 0 3px rgba(192,132,252,0.4)`
- Ingen standard-outline (ersätts med glow)

### Siffertangentbord (Numpad)
- 3×4 grid
- Varje tangent: **72px × 72px**, rund
- Mjuk grå bakgrund med hover-purpleglow
- Radera-knapp: röd accent

### Progress bar
- Höjd: 16px, helt rundad
- Fylls med lila→rosa gradient
- Shimmer-animation över fyllningen

### Medaljer
- 🥉 Brons: `linear-gradient(135deg, #cd7f32, #a0522d)` + glödskugga
- 🥈 Silver: `linear-gradient(135deg, #c0c0c0, #808080)` + glödskugga
- 🥇 Guld: `linear-gradient(135deg, #ffd700, #ffa500)` + glödskugga + sparkle-animation

### Avatarer
Emoji-baserade avatarer, 8 stycken:
`🤖 ⭐ 🐉 🦊 🧙 🧠 👧 👽`
- Visas i cirklar med färgglad bakgrund
- Selected: lila kant + glow + lätt zoom

---

## 🎮 Spelkort (Game Selector)
- Stora kort, hela bredden
- Varje spel har sin gradientbakgrund
- Ikon + namn + kort beskrivning
- Hover: lyft + rotera ikon lätt
- Aktiva animerade bakgrundselement (flytande stjärnor/former)

---

## 📱 Responsivitet
- **Mobile first** – designad för 375px bred skärm (iPhone standard)
- Max bredd för spelyta: **480px** centrerat på desktop
- Tablet 768px+: lite mer luft, större kort
- Desktop: Centrat med estetisk bakgrund runt spelkortet

---

## 🎊 Feedback-system
| Situation | Visuell effekt | Ljud |
|-----------|---------------|------|
| Rätt svar | Grön flash + ✓ + bounce | Pling (positiv ton) |
| Fel svar | Röd flash + ✗ + wiggle/shake | Buzz (negativ ton) |
| Ny medalj | Konfetti + zoom + sparkle | Fanfar |
| Klart prov | Konfetti-dusch + resultatvy | Celebration |
| Profil skapad | Pop-in animation + välkomsttext | |

---

## 🌟 Dekorativa element
- Flytande stjärnor (✨ 🌟 ⭐) i bakgrunden – CSS animation
- Regnbågsgradienter på logotyp och framgångselement
- Hjärtan (💕) och glitter-emojis i UI-detaljer
- Mjuka skuggor i spelfärgen (inte grå/svart)

---

*Dokumentet uppdateras om designbeslut ändras under projektet.*
