# KORT DIVISION — pedagogisk modell och stegkedja

**Status:** **GODKÄND av Dennis 23/9 2026** mot `design-lab/kort-division-mockup.html` — *"Det här va exakt hur bra som helst. Animationerna va perfekta, det va smooth och sömlöst och perfekt förklarat. EXAKT så där vill jag ha det i liveversionen."*
**Avgjorda växlar:** 1 "för mycket"-brickan **På** · 2 faktatexten **Talord** · 3 fakta i demon **Eget klick** · 4 brickans form **Piller** `6 · 7 = 42`. Mockupens beteende är facit; §8 punkt 6–10 avgörs därmed åt mockupens håll (faktan visas före frågan i hjälpläget, inget `42 − 42 = 0` i fall C, Nästa efter kvittens / automatiskt efter tryck, restens plats som i dag). Utöver mockupen tas fyra Mira-fynd med som inte ändrar det Dennis såg: ord vid första felsvaret, `klart`-steget, 42-brickan står kvar till `rest`, fall B säger "hela 1:an blir rest".
**Ersätter:** ankarvandringen (2/5/10-ankare, upp/ner-stegning, tyst-regeln) — riven i sin helhet.
**Måttstock (Dennis 23/9):** *"barnen ska i minsta möjliga mån känna 'vad hände nu och varför?'. Det skall kännas självklart så att de kan öva in rutinen och tänket. Appen är inte till för att sätta barnen på prov, utan för att genom repetition och visuell pedagogisk och logisk följd göra det så självklart som möjligt varför ett tal räknas ut på ett visst sätt, så de lär sig att räkna i stället för att lära sig svara snabbt."*

---

## 1. Varför ankarvandringen revs

Den försökte lära ut TVÅ saker samtidigt: kort division (rutinen) och uppskattning via benchmark-tal (en strategi för den som inte kan tabellen). Den andra läckte i varje kantfall: par av ankare som inte hörde till talet ("var kommer 15 ifrån?"), "närmast" när inget val fanns, "6 är närmast" om en nia, "1 för mycket → ta bort 4", "6 · 2 = 12 och räkna baklänges" för 7 ÷ 6. Fem rundor av lagning, varje lagning ett nytt hål.

Dennis 23/9: *"Jag tror att det är bättre att appen direkt visar utifrån gångertabellen vilket tal som är närmast. Dvs inte strikt förhålla oss till x2 x5 och x10. Och i de fall där det går jämnt ut så skall alltid det visas som ankarsiffrorna gör. På bilden tror jag barnen lättare förstår kopplingen mellan gångertabellen och division om den visar 6 × 7 = 42."*

## 2. Modellen — en mening

**Vid varje siffra visar appen den största rad i divisorns tabell som får plats, som ett synligt objekt: `6 · 7 = 42`.** Alltid. Även när det går jämnt ut. Det är det enda nya objektet barnet möter, och det är samma objekt varje gång.

Kopplingen tabell ↔ division är hela poängen med kort division. Allt annat (rest, flytt, strykning) är rutin runt den.

## 3. De fyra fallen per siffra

`cur` = arbetstalet vid positionen (rest·10 + siffran), `N` = divisorn, `q = ⌊cur / N⌋`, `r = cur − qN`.

| fall | villkor | vad som händer |
|---|---|---|
| **A** ryms inte, första siffran | `cur < N`, ledande position | ingen kvotsiffra; nästa siffra tas med |
| **B** ryms inte, mitt i talet | `cur < N`, ej ledande | kvotsiffran **0** skrivs; hela `cur` blir rest |
| **C** går jämnt ut | `r = 0` | fakta `N · q = cur`; skriv q |
| **D** med rest | `r > 0` | fakta `N · q = qN` får plats; skriv q; rest r ställer sig framför nästa siffra |

Sista siffran har alltid `r = 0` i appens uppgifter (nivåerna genererar jämna divisioner). Om det ändras: fall D utan flytt, resten står kvar som slutrest.

## 4. Stegkedjan — demo ("Titta och lär")

Ett klick per steg. En idé per steg. Texten står innan rörelsen börjar. Slutsatsen sist i sitt eget steg. Inget föds och dör i samma steg.

### Fall C — går jämnt ut (42 ÷ 6)

| # | steg | ruta (ordagrant) | rörelse |
|---|---|---|---|
| 1 | `fraga` | **Hur många 6:or ryms i 42?** | kolumnen lyser; divisorn pulsar |
| 2 | `fakta` | **Sju 6:or är precis 42.** | brickan `6 · 7 = 42` föds ur divisorn och talet, landar i högermarginalen |
| 3 | `skriv` | **Vi skriver 7 i tiotalet.** | 7:an lossnar ur brickan och flyger ner i kvotrutan (som har etiketten T); brickan förbrukas när siffran står |
| 4 | `stryk` | **Hundratalet och tiotalet är klara — 42 är räknat. Vi stryker dem.** | penndrag över båda täljarsiffrorna |

*Strykningar namnger alltid **kolumnen**, aldrig siffrans värde (beslut 23/9): "Tiotalet är klart", inte "4:an är klar". Det svarar på "varför är 4:an klar nu?" (den blev en del av 42) och löser "vilken 2:a?" när kvoten och täljaren har samma siffra i samma kolumn.*

### Fall D — med rest (444 ÷ 6, tiotalet: 44)

| # | steg | ruta | rörelse |
|---|---|---|---|
| 1 | `fraga` | **Hur många 6:or ryms i 44?** | som ovan |
| 2 | `fakta` | **Sju 6:or är 42 — det får plats. Åtta vore 48, för mycket.** | brickan `6 · 7 = 42` föds och landar; en tonad, överstruken bricka `6 · 8 = 48` landar intill och **står kvar tills 7:an flyger** — då tonar den bort, för valet är gjort *(se §8.1)* |
| 3 | `skriv` | **Vi skriver 7 i tiotalet.** | 7:an lossnar ur brickan och flyger ner i kvotrutan; **brickan `6 · 7 = 42` står kvar** (7:an i den tonad); 48-brickan tonar bort |
| 4 | `rest` | **44 − 42 = 2. Resten är 2.** | 42:an i brickan glöder tillsammans med 44 på pappret; brickan `2` föds ur dem, landar i marginalen; **först nu** förbrukas 42-brickan |

*Brickan `6 · 7 = 42` får inte försvinna i `skriv` (Mira 23/9: "42:an är borta — jag fick komma ihåg 42 i huvudet"). Subtraktionen i `rest` refererar till 42, så 42 måste stå på skärmen tills subtraktionen är gjord. Det som flyger i `skriv` är siffran 7, inte likheten.*

*"Resten är 2", inte "Två blir över" (beslut 23/9): resten heter resten från födseln. I 72 ÷ 6 är resten 1 och kvotsiffran som just skrevs också 1 — "Ett blir över" pekar då på fel etta.*
| 5 | `flytta` | **Resten 2 ställer sig framför 4:an i entalet — nu står det 24.** | brickan flyger till platsen uppe till vänster om nästa siffra och blir resten som står där; nästa siffra lyser upp med resten så de läses som ett tal |
| 6 | `stryk` | **Tiotalet är klart — vi stryker det.** | penndrag |

*"Resten 2" — ordet **resten** pekar ut vilken 2:a (kvoten kan ha samma siffra). "Nu står det 24" — nästa fråga börjar då med ett tal barnet redan sett bildas, i stället för ett det måste sätta ihop självt. Fall A säger redan "nu har vi 42" på samma sätt.*

### Fall A — ryms inte, första siffran (4 i 420 ÷ 6)

| # | steg | ruta | rörelse |
|---|---|---|---|
| 1 | `fraga` | **Hur många 6:or ryms i 4?** | kolumnen lyser |
| 2 | `ryms_inte` | **Ingen — 6 är större än 4. En nolla först skriver vi inte.** | divisorn och siffran glimtar mot varandra |
| 3 | `ta_med` | **Vi tar med 2:an i tiotalet — nu har vi 42.** | tiotalssiffran lyser upp tillsammans med hundratalet; de läses som ett tal |

*Regeln "en nolla först skriver vi inte" sägs i demon också (beslut 23/9) — annars får barnet aldrig veta varför ingen 0 skrivs här men väl i tiotalet (fall B). Samma regel, samma ord, i alla lägen.*

Därefter fall C eller D på 42.

### Fall B — ryms inte, mitt i talet (1 i 612 ÷ 6)

| # | steg | ruta | rörelse |
|---|---|---|---|
| 1 | `fraga` | **Hur många 6:or ryms i 1?** | |
| 2 | `ryms_inte` | **Ingen — 6 är större än 1. Vi skriver 0 i tiotalet, och hela 1:an blir rest.** | 0 skrivs i kvotrutan; 1:an på pappret glöder |
| 3 | `flytta` | **Resten 1 ställer sig framför 2:an i entalet — nu står det 12.** | brickan `1` föds ur siffran och flyger till platsen |

*"…och hela 1:an blir rest" (Mira 23/9: "Rest 1? Ingen sa rest, ingen räknade minus."). I fall D räknas resten fram synligt (44 − 42 = 2); i fall B dras inget bort, så resten måste ändå **sägas** — annars dyker den upp från ingenstans. I hjälpläget ställs frågan **"Hur mycket blir rest?"** → 1, så barnet gör samma sak här som i fall D.*
| 4 | `stryk` | **Tiotalet är klart — vi stryker det.** | |

### Fall B′ — inget kvar att dela (0 i 420 ÷ 6, entalet)

När `cur = 0` (ingen rest och siffran är 0) finns inget att fråga om. "Hur många 6:or ryms i 0?" är en fråga utan mening för ett barn. Ett steg:

| # | steg | ruta | rörelse |
|---|---|---|---|
| 1 | `inget_kvar` | **Inget kvar att dela — vi skriver 0 i entalet.** | 0 skrivs i kvotrutan |
| 2 | `stryk` | **Entalet är klart — vi stryker det.** | penndrag (rutinen stryker varje siffra) |

### Slutsteget — svaret sägs

Efter sista strykningen kommer ett eget steg i **båda** lägena:

| # | steg | ruta | rörelse |
|---|---|---|---|
| — | `klart` | **Klart! 444 ÷ 6 = 74.** *(kontrollrad under, dämpad: 74 · 6 = 444)* | kvotrutorna glöder tillsammans |

*Mira 23/9: "sidan säger aldrig svaret — jag fick läsa ihop 7 och 0 själv och tänka 'jaha, 70 då?'". Uppgiften är inte klar när sista siffran är struken; den är klar när barnet ser hela kvoten som ett tal. Appen har redan detta steg (`doneBubbleHTML`); mockupen saknade det.*

### Resten stryks aldrig

Den lilla röda resten framför nästa siffra står kvar när allt annat är struket. Det är bokens notation och Dennis beslut från v36 — resten är inte en siffra i talet, den är en anteckning om vad som fördes över. Behålls.

## 5. De tre lägena

| | Titta och lär | Räkna med hjälp | Räkna själv |
|---|---|---|---|
| syfte (Dennis) | se rutinen | *vara med* — trycka fram, placera, välja, i rätt ordning | säkerställa att de faktiskt kan |
| `fakta`-brickan | visas, som steg | visas **innan** kvotfrågan — barnet får läsa av den; det är inte där räknandet ska ske | visas inte; livlinan visar den |
| kvotsiffran | flyger själv | barnet skriver den (numpad) | barnet skriver hela kvoten |
| resten | räknas ut i rutan | barnet räknar: **44 − 42 = ?** (numpad) | barnet skriver den i restplatsen (frivilligt, rättas) |
| flytt | animeras | barnet trycker på platsen | — |
| strykning | animeras | barnet trycker på siffran | — |
| fel svar | — | **redan från första felet ord**: "Hmm — prova igen!" + fel siffran suddas; från andra felet "för högt/för lågt"; efter tredje: vägen visas gratis | "Inte riktigt — ändra och prova igen" |

*Mira 23/9, om mockupen som bara skakade: "Inget 'Nej', inget rött, inget 'prova igen'. Jag väntade flera sekunder och trodde att den hängt sig." En skakning utan ord är inte återkoppling. Appen säger redan "Hmm, prova igen! 💪" — specen slår fast att det ska stå kvar, och att fel siffran suddas så nästa tryck börjar om.*
| livlina | — | ger svaret på aktuell fråga | ger `fakta`-brickan för siffran där fokusringen står |

**Räkna med hjälp** ställer alltså två räknefrågor per siffra: kvotsiffran och resten. Inte avståndsfrågan från ankarvandringen — den fanns för att motivera stegningen, och stegningen är borta.

**Fall A i hjälpläget.** Barnet svarar 0 på "Hur många 6:or ryms i 4?" — och ingen 0 skrivs, till skillnad från fall B. Det är en riktig regel i kort division (ledande nolla skrivs inte) och den ska sägas, annars ser samma handling ut att få olika följd: kvittens **"Rätt — ingen. En nolla först skriver vi inte. Vi tar med 2:an i tiotalet — nu har vi 42."**

**Kvittenser i hjälpläget** följer demons text för samma steg, med "Rätt —" framför. Inga egna formuleringar.

**Fall B′ i hjälpläget är en fråga, inte ett berättat steg** (beslut 23/9): **"Inget kvar att dela — vad skriver vi?"** → barnet skriver 0 → kvittens "Rätt — 0 i entalet." Läget finns för att barnet ska *göra*; ett steg där det bara trycker Nästa mitt i en rad av frågor känns som "varför frågade den inte mig?".

## 6. Livlinans innehåll — tabellraden

För barn som inte kan 6 · 7 direkt: livlinan visar **tabellraden runt svaret**, för det är så barn faktiskt räknar (räkna uppåt tills det blir för mycket):

> 6 · 6 = 36 · **6 · 7 = 42** · ~~6 · 8 = 48~~
> 42 får plats i 44. 48 är för mycket.

Tre rader, mittersta betonad, sista överstruken. Inga ord om "ankare" eller "närmast".

## 7. Animationsgrammatik (gäller redan i modulen — behålls)

- Pappret står stilla. Brickor rör sig.
- Allt lösräknande i högermarginalen, till höger om allt som ritas (kvotrutorna inräknade).
- En bricka föds ur de celler den kommer ifrån (glöd på källorna, brickan poppar in), lever tills den förbrukas, och förbrukas genom att **bli** något på pappret (kvotsiffran, resten). Samma nod hela vägen.
- Texten skrivs innan rörelsen startar.
- Bubblan har fast höjd per läge — knappen och knappsatsen står still.
- Träffytor ≥ 44 pt. Ingen scroll vid 390 × 844.
- **Kvotrutorna bär H/T/E-etiketter** (små, i platsvärdesfärg, ovanför), precis som täljaren. "Vi skriver 7 i tiotalet" måste peka på en ruta som heter tiotalet. (Beslut 23/9 — mockupen visade att rutorna var namnlösa.)
- Knappen som låses under en rörelse ska **synas** låst (tonad), och låset släpper inom 900 ms.

## 8. Öppna frågor till Dennis (visas i mockupen som växlar)

1. **"För mycket"-brickan i fall D.** Visa `6 · 8 = 48` överstruken bredvid, eller bara `6 · 7 = 42`? Med: barnet ser *varför* det blev 7 och inte 8. Utan: ett objekt färre. Mira klagade på en andra siffra "från ingenstans" — men det var 5 · 3 = 15 när talet var 6, alltså en orelaterad rad. Två *intilliggande* rader i samma tabell är något annat.
   *Utan brickan* lyder faktatexten **"Sju 6:or är 42 — det får plats i 44."** — "får plats" behöver en motpart att få plats *i*, annars hänger orden i luften (beslut 23/9). Med brickan: "Sju 6:or är 42 — det får plats. Åtta vore 48, för mycket."
2. **Talord eller siffra i `fakta`-texten.** "Sju 6:or är 42" eller "7 · 6 = 42"? Talordet läses; siffran matchar brickan.
3. **Ska `fakta` vara ett eget klick i demon**, eller visas med frågan? Eget klick = en idé per steg. Med frågan = ett klick färre per siffra.
4. **Brickans form.** Mockupen ritar faktan som ett piller med hela likheten, `6 · 7 = 42`. Appens befintliga bricka är en stor siffra med `·7=42` litet under. Pillret visar hela kopplingen; sifferbrickan är det barnet redan känner igen från multiplikationen. Dennis dömer mot bilden.
5. **"För mycket"-brickans livslängd.** Om den finns: står kvar tills 7:an flyger (valet är gjort) och tonar då — inte försvinner av sig själv mitt i ett steg ("vart tog 48 vägen?").
6. **Faktan före eller efter svaret i hjälpläget.** Dennis 22/9: läget är till för att *vara med*, att läsa av brickan är OK där. Mira 23/9, efter att ha spelat mockupen: *"Varje 'hur många ryms'-fråga har svaret på pappret innan jag svarat. Jag läste bara av 7:an. Fast på 6:an är jag osäker, och det var skönt att se 6 · 7 = 42 **efter** att jag svarat. Jag vill ha det efteråt, eller när jag trycker Livlina, inte innan."* Hennes förslag är inte "ta bort brickan" utan "visa den som belöning efter svaret". Det behåller involveringen och ger tabellkopplingen — men barnet räknar först. Dennis dömer.
7. **`42 − 42 = 0` i fall C?** Mira: *"I 444 fick jag se 44 − 42 = 2. Här hoppar den över minusräkningen — borde det inte stå 42 − 42 = 0?"* Konsekvens (samma form i C och D, rutinen blir en) mot ett klick till per jämn siffra. Rekommendation: ta med det — rutinen ska vara *en* rutin.
8. **Nästa eller automatiskt i hjälpläget.** Mockupen kräver Nästa efter en kvittens men går vidare av sig själv efter ett tryck (placera, stryk). Mira: *"Jag visste aldrig vilket som gällde."* En regel: antingen alltid Nästa efter varje kvittens (förutsägbart, fler klick) eller alltid automatiskt efter tryck och Nästa bara efter knappsatsfrågor (som nu, men sagt). Dennis dömer.
9. **Att se 42 som ett tal.** Fall A säger "nu har vi 42", men 4:an och 2:an står kvar i varsin ruta och Mira letade efter ett "42". Ett tunt streck under båda, eller en gemensam glöd, kan bära det utan att pappret ändras. Förslag, inte krav.
10. **Restens plats.** Rutan barnet ska trycka på är 20 × 24 pt synligt (44 träffyta) och Mira tryckte ändå på siffran intill. Förslag: låt trycket på **nästa siffra** placera resten framför den — det är ju dit resten ska. Dennis dömer.

**Miras val på växlarna** (23/9, efter genomspel): 1 **På** ("den strukna raden är hela poängen — men jag måste kunna läsa den"), 2 **Talord** ("så säger vi i skolan"), 3 **Eget klick** ("jag vill få frågan först och tänka"), 4 **Piller** ("sifferbrickans undertext är för liten"). Plus: med brickan Av var *"Sju 6:or är 42 — det får plats i 44"* den tydligaste meningen på hela sidan — behåll "i 44" även med brickan På.

## 9. Tajming

| rörelse | längd |
|---|---|
| bricka föds | 500 ms |
| bricka flyger till kvotruta / restplats | 600 ms |
| penndrag | 400 ms |
| kolumnen lyser | 300 ms |
| steg låst efter klick | högst **900 ms** — och knappen ska **synas** låst (tonad) |

Mira mätte att tryck inom ~1 s svaldes utan att något syntes: 12 av 29 tryck. Låset får vara kort och måste synas.

## 10. Klick per uppgift (demo), att jämföra mot i dag

420 ÷ 6: A(3) + C(4) + B-liknande 0÷6… → räknas ut i mockupen och rapporteras. Målet är färre än i dag (v53: 12–17 för tresiffrigt) utan att en enda idé slås ihop med en annan.

## 11. Textsvep

Alla texter ovan genereras ur samma mallar för `N ∈ 2..9`, `cur ∈ N..10N−1`. Kraven från 22–23/9 gäller: inga två roller för samma tal i samma mening; inga jämförande ord som förutsätter ett val som inte gjordes; varje siffra som pekas ut bär sitt platsvärde när samma värde syns flera gånger. Sveptesterna i `tests/multdiv.test.mjs` skrivs om mot de nya mallarna.

**Två medvetna undantag:**
- `q = 1`: faktan lyder "En 6:a är precis 6" (`N · 1 = N`). Samma tal i två roller, men självreferensen är sann och ofrånkomlig — en sexa *är* sex. Svepet undantar `q = 1` för raden `fakta`.
- `rest`: "44 − 42 = 2" är aritmetik i rutan. Additionsspecen P6 förbjuder aritmetik som *ersätter* en rörelse barnet borde se — men här *är* subtraktionen steget, precis som "10 − 5 = 5" i subtraktionens lånekedja (Dennis 21/9). Tillåtet.
