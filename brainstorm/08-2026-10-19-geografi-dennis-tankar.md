# 08 · 2026-10-19 · Geografi – Dennis tankar och förslag på spellägen

Samtalet före mockupen (Dennis: "lite för snabb med att bygga mockupen innan vi hade brainstormat"). Ersätter inte
`07` – 07 är pedagogikunderlaget; det här är Dennis riktning och svaret med förslag.

## Dennis tankar (hans ord, sammanfattade nära ordalydelsen)

- **Modulen heter Geografi och får flera delar/spellägen.** Sverige först. Senare: Europa (länder: var de ligger,
  namn, huvudstad, flagga, antal invånare – "väldigt kort-fakta"), Asien, Afrika, Nordamerika, Sydamerika, Oceanien,
  världshaven.
- **Sverige – läroläge:** kartan med landskapen; klick på ett landskap ger snabbinfo: största stad, landskapsblomma,
  landskapsdjur, landskapssköld – "gärna och intressant fakta", t.ex. 3:e största till yta, folkrikast, 3:e flest
  invånare. "Här får du lite kreativ frihet."
- **Sverige – träning:** välj Norrland, Svealand, Götaland eller hela Sverige. Ordning: rak (1 och vidare) eller
  blandad.
- **Kartan ska gå att dra och nypa-zooma som Apples kartor** – unikt för Geografi. Inga bieffekter (t.ex. att text
  markeras). Ett tryck på ett landskap ska kännas av.
- **Stegvis svårare:** "I vilket landskap ligger denna stad?" (landskapets huvudstad eller största stad – det skolan
  lär ut), "Vilket landskap har detta landskapsdjur?" m.fl.
- **Test i slutet** – kallas test, inte prov, så att barnen inte stressas.
- **Som gångertabellen:** uppmuntrande, flera chanser, repetition; fel fråga kommer tillbaka så att det svåra nöts in.
- **Spelkänsla:** "Var ligger Medelpad?" → man trycker → det färgläggs och namnet står kvar, "uppvänt" som i
  memory, så att man ser sin framgång när hela Sverige blir upptäckt. "Kom med förslag på hur detta kan bli kul."

## Förslag (Claude, 19/10)

**Struktur.** Geografi → världsdelskort (Sverige öppen; Europa m.fl. syns som "kommer snart"). Inuti Sverige: tre
dörrar – **Utforska** (läroläget), **Träna** (spellägen med nivåer), **Test**. Kartmotorn (dra, zooma, tryck, dimma,
färgläggning) byggs generell så att Europa och de andra bara blir nya data (områden + fakta + flaggor).

**Utforska.** Fri karta med dra/nyp. Tryck på ett landskap → ett landskapskort glider upp: nummer och namn, landsdel,
största stad, blomma, djur, sköld, "Visste du?" (rang i yta och invånare, en kuriositet). Medelpad har nålen
"Här bor du". Faktan läses ur en datafil med källa per uppgift (15 § 7) – inget skrivs ur minnet.

**Spellägen i Träna** (alla med nötloop och lådor som i gångertabellen):
1. **Upptäck Sverige** (Dennis memory-idé, huvudläget): kartan börjar i dimma. "Var ligger Medelpad?" → rätt tryck
   färglägger landskapet och namnet står kvar. Fel tryck visar kort namnet på det man tryckte på ("Det där är
   Jämtland") – det lär också – och efter två fel pulserar rätt landskap. Fel frågor kommer tillbaka senare i
   rundan. Slut: hela Sverige upptäckt, firande. Val: område och ordning (1→25 eller blandat).
2. **Vad heter det?** Ett landskap lyser – välj namnet (och läxbokens nummer).
3. **Städerna:** "I vilket landskap ligger Sundsvall?" – tryck på kartan.
4. **Djur, blommor, sköldar:** "Vems landskapsdjur är …?", "Vems sköld är det här?".
5. **Pussel** (förslag): dra landskapsbitarna till rätt plats. Händerna lär sig formerna.
6. **Resan genom Sverige** (förslag): ett litet tåg/en bil reser från Skåne till Lappland; varje rätt svar för den
   vidare till nästa landskap. Lär grannarna.
7. **Vem är jag?** (förslag): ledtrådar en i taget (landsdel, granne, djur …) – gissa landskapet. Färre ledtrådar
   = fler stjärnor.

**Samlarpärmen** (förslag): varje landskap blir ett kort med sköld, djur och blomma som låses upp när landskapet
sitter (lådan "kan"). Hela Sverige = full pärm. Kopplas till capybarakorten som i övriga appen.

**Test.** Utan klocka. Blandat ur det man tränat; resultatet visas på kartan (grönt/gult) och som kvitto med
"Sett av en vuxen".

## Öppet till Dennis
- Vilken stad per landskap – finns en lista i Miras skolmaterial? Annars förslag från Claude som Dennis godkänner.
- Sköldar och blommor som bilder: hämtas som fria SVG (t.ex. Wikimedia Commons) – kräver Dennis ja för nedladdning.
- Vilka av förslagen 5–7 och samlarpärmen han vill ha med i första versionen.

## Utfall
Väntar på Dennis svar (19/10). Mockupen `design-lab/geografi-mockup.html` (från 07) står som förslag och görs om
efter detta samtal.
