# Metoden för övningsbladen – så tänker vi

Skriven 2026-11-12 av VD:n efter att Dennis godkänt kort division och trappan i `design-lab/ovningsblad-plan3.html`
("din mockup på kort divison är mycket bra", "trappen ser jättebra ut", "Jag tyckte om denna förklaring. den fick mig
att förstå"). Den här filen är tänket bakom varje vy. En agent som tar över övningsbladen läser den först, efter
CLAUDE.md, och tänker likadant. Besluten finns i DECISIONS (D44, D46, D47, D48 med ✎). Här står *hur* man arbetar
fram en vy och *varför* den ser ut som den gör.

## 1. Arbetsgången (D46, D47 ✎)

1. **Underlaget först.** Läs lärarens blad och Dennis kommentarer. Han döper ibland om filer till sina tankar
   ("hur fasen ska man ens tänka här?"). Kontrollera underlaget innan planen byggs: tvåsiffrig nämnare kom in i D47 och
   fick strykas, eftersom häftet bara har ensiffrig.
2. **Tankepass i varv** (`brainstorm/16`). Sortera kritiken efter vad den egentligen säger. Pröva planen mot barnet,
   pedagogiken, pappret, appens enhetlighet och tekniken. Skriv om planen.
3. **Mockup, en vy i taget**, byggd av VD:n själv. Dennis bedömer konkret UI, inte beskrivningar.
4. **Spela igenom själv** i 390 × 797 med skärmbild före varje leverans. Felen hittas där: en tvetydig fråga när två
   rader "får plats", en ikon utan storlek, en rad som är för bred.
5. **Dennis ord blir D-post samma stund**, och loggen skrivs.

## 2. Pedagogiken: varje rörelse ska kunna förklaras

- **Pilen först, sedan rörelsen** (D47 ✎). En streckad lila pil ritas från talet till rutan. Sedan kommer en paus,
  och därefter glider talet längs pilen. Takten är ungefär 900 ms per förflyttning, och glidningen tar ungefär 1,2 s.
  Pilen startar i *själva siffran* (till exempel `.m` i tabellraden) och böjer uppåt, bort från text. Dennis: "det är
  superbra … väldigt pedagogisk", men "lite väl snabbt".
- **Varje flytt har ett varför** (D47 ✎). Raden "Varför?" står i en lila ruta ovanför uppställningen. Det som är
  abstrakt görs konkret med **pengar i platsvärdets färger**: tusenlappar (lila), hundralappar (röda), tior (blå) och
  kronor (gröna), som små ikoner i texten. Växlingen är kärnan: "1 hundralapp växlas till 10 tior. Med de 3 vi redan
  har blir det 13 tior." Dennis förstod först med den: "jag förstår inte 'varför' siffrorna flyttas … mera
  förklaringar".
- **Knappen frågar varför innan något flyttas:** "Varför där?" och "Varför flyttar vi ner 3?". Förklaringen kommer
  före rörelsen.
- **Det som är klart stryks** (snett streck), så att barnet inte tappar bort sig.
- **Svaret får fokus i slutet:** kvoten lyser grönt och resten lila, och svaret står för sig i stor stil.
- **Tabellen bredvid, aldrig i huvudet.** Raderna i nämnarens tabell visas en i taget: kandidaten, och sedan raden
  som är för stor med överstrykning och texten "större än …". Visa aldrig två rader som båda "får plats", för då blir
  frågan tvetydig. Frågan lyder "Hur många gånger får 7 plats i 57?", och barnet trycker på raden.
- **Barnet gör tanken, appen flyttar.** Barnet väljer raden och räknar subtraktionen själv. Pilen och flygningen
  flyttar bara tal som redan är kända (D47: bandet tänker inte åt barnet).
- **Förståelseprovet:** efter en uppgift med hjälp ska barnet kunna säga varför svaret blev som det blev.
- **Mindre är mer.** En förklaring som pekar ut en detalj utan sammanhang förvirrar (jämförelsen som bara visade den
  första resten). Antingen visas hela mönstret, alla växlingar i par, eller ingenting. Jämförelser är valfria knappar.

## 3. Formen

- Stil C (D44 ✎), övningsbladens knappsats, svarsknapp och kladd (D48), 390 × 797 utan skroll, kladden ≥ 100 px.
- Platsvärdesfärger på siffror, rutor och pengar: Tu lila, H röd, T blå, E grön. Rest och resten är lila.
- Lila betyder härifrån, orange betyder hit och fokus, grönt betyder rätt och svar. Ingen felsignal (D39): fel visas i
  persika med "Inte riktigt – försök igen." och en kort ledtråd ("63 är större än 57.").
- Talen räknas fram ur uppgiften med en generell motor (`plan(n, d)` i mockupen), aldrig per exempel. Då fungerar
  förklaringarna för vilket tal som helst.

## 4. Det Dennis inte vill ha

- Moduler som tränar samma tanke (Dela lika, Grupper och Kontrollera var "exakt samma sak").
- Bilder som pynt. Blocken var värda något först när de förklarade växlingen.
- Animationer som är för snabba eller osynkade, och text som säger något annat än rutan.
- Uppgifter där man "gör rätt och får rätt" utan att förstå varför.
