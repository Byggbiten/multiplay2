/* ============================================================
   MULTIPLAY – NP Svenska Åk 3: Textbank
   Globala konstanter – laddas INNAN np-svenska.js
   ============================================================ */
'use strict';

/* ── BERÄTTANDE TEXTER (10 st) ───────────────────────────── */
const NARRATIVE_TEXTS = [

  {
    id: 'story_birthday',
    type: 'narrative',
    title: 'Födelsedagspresenten',
    text: `Erik skulle fylla nio år på lördag. Han hade länge drömt om en ny cykel. Hans gamla cykel var rostig och den vänstra bromsen fungerade inte.
Redan på fredagskvällen försökte Erik lista ut vad presenten kunde vara. Han smög ner i källaren med sin ficklampa. Under en stor filt låg något som liknade en cykel. Det luktade nytt gummi och metall.
På lördagsmorgonen väcktes Erik av att hela familjen sjöng för honom. Hans bror Marko och hans kompis Susanne stod vid sängen med ett paket.
"Det är inte cykeln," sade pappa och log konstigt. "Cyklar kostar för mycket pengar."
Erik öppnade paketet. Det var nya cykelhandskar och en hjälm i grönt och gult.
"Men nu kan du gå ner i källaren," sade pappa.
Erik sprang nerför trappan. Pappa drog av filten. Där stod en glänsande röd cykel med silver stänkskärmar.
"Jag visste det!" skrek Erik. "Det luktade ny cykel!"
Resten av dagen cyklade Erik, Marko och Susanne nerför den branta backen vid skogen. Det var den bästa födelsedag Erik någonsin hade haft.`,
    characters: ['Erik', 'Marko', 'Susanne', 'pappa', 'bror'],
    questions: {
      locate: [
        { q: 'Hur många år fyller Erik?', options: ['Sju år', 'Åtta år', 'Nio år', 'Tio år'], correct: 2 },
        { q: 'Vilken färg hade den nya cykeln?', options: ['Blå', 'Grön', 'Röd', 'Gul'], correct: 2 },
        { q: 'Vad var fel på Eriks gamla cykel?', options: ['Det saknades ett hjul', 'Den vänstra bromsen fungerade inte', 'Sadeln var trasig', 'Styret var böjt'], correct: 1 }
      ],
      interpret: [
        { q: 'Varför sade pappa att cyklar kostar för mycket?', options: ['Han hade inte råd', 'Han ville att Erik inte skulle gissa presenten', 'Han ville att Erik skulle spara sina egna pengar', 'Han hade glömt köpa en cykel'], correct: 1 },
        { q: 'Hur visste Erik att det var en cykel under filten?', options: ['Han hade sett pappa köpa den', 'Marko hade berättat det', 'Det luktade nytt gummi och han såg formen', 'Han hade läst ett kvitto'], correct: 2 }
      ],
      order: {
        events: [
          'Erik smög ner i källaren med ficklampan.',
          'Familjen sjöng för Erik på morgonen.',
          'Erik öppnade paketet med handskar och hjälm.',
          'Pappa drog av filten och avslöjade den röda cykeln.'
        ],
        correctOrder: [0, 1, 2, 3]
      },
      whoDidWhat: {
        q: 'Vilka cyklade nerför den branta backen vid skogen?',
        allNames: ['Erik', 'Marko', 'Susanne', 'pappa', 'mamma'],
        correctNames: ['Erik', 'Marko', 'Susanne']
      },
      detailPick: {
        q: 'Vilka saker nämns i texten?',
        options: ['ficklampa', 'filt', 'skateboard', 'cykelhandskar', 'fotboll', 'hjälm'],
        correct: [0, 1, 3, 5]
      },
      summaries: {
        bad: 'Erik fick en cykel i present.',
        medium: 'Erik fyllde nio år och fick en röd cykel i present av sin pappa. Han hade gissat att den stod i källaren.',
        good: 'Erik fyllde nio år och hoppades på en ny cykel. Han smög ner i källaren och kände att det luktade nytt gummi under en stor filt. Pappa låtsades att cyklar kostade för mycket – men till slut avslöjades den glänsande röda cykeln, och Erik skrek att han visste det hela tiden.'
      }
    }
  },

  {
    id: 'story_dog',
    type: 'narrative',
    title: 'Hunden som rymde',
    text: `Det var en vanlig tisdag när hunden Knugen försvann. Lisa och hennes bror Kalle hade glömt stänga grinden när de kom hem från skolan.
Mamma ringde ut dem direkt. "Knugen är borta! Gå och leta!" De sprang upp på gatan och ropade.
Gransen Bengt kom ut och hörde på. "Jag såg en hund springa mot parkens damm för en kvart sedan," sade han.
Lisa och Kalle sprang till dammen men hunden var inte där. De letade i buskarna och bakom skolans cykeltak. Ingenting.
Lisa ville gråta men Kalle sade: "Farmor! Farmor bor nära. Knugen brukar gå dit."
De sprang tre kvarter bort till farmors hus. Farmor stod vid dörren och log. "Letar ni efter er hund?"
Knugen låg inne i farmors hall och åt av en skål med köttfärs. Hans svans viftade som en propeller.
"Han ringde på dörrklockan!" sade farmor. "Jag har aldrig sett en hund göra det förut."
Lisa kramade Knugen hårt och lovade sig själv att aldrig glömma att stänga grinden igen.`,
    characters: ['Lisa', 'Kalle', 'mamma', 'farmor', 'Bengt'],
    questions: {
      locate: [
        { q: 'Varför rymde Knugen?', options: ['Han var arg', 'Grinden hade lämnats öppen', 'Han var hungrig', 'Porten var trasig'], correct: 1 },
        { q: 'Vem hade sett Knugen springa mot dammen?', options: ['Mamma', 'Farmor', 'Gransen Bengt', 'En okänd förbipasserande'], correct: 2 },
        { q: 'Vad åt Knugen hos farmor?', options: ['Hundmat ur burk', 'Köttfärs', 'Knäckebröd', 'Soppa'], correct: 1 }
      ],
      interpret: [
        { q: 'Hur visste Kalle att de skulle gå till farmor?', options: ['Farmor hade ringt', 'Knugen brukade besöka farmor', 'Han hade sett Knugens spår', 'Gransen Bengt berättade det'], correct: 1 },
        { q: 'Vad menar texten när den säger att Knugens svans viftade "som en propeller"?', options: ['Svansen var skadad', 'Svansen snurrade fort runt', 'Svansen viftade snabbt av glädje', 'Svansen lyfte hunden från marken'], correct: 2 }
      ],
      order: {
        events: [
          'Lisa och Kalle glömde stänga grinden.',
          'Gransen Bengt berättade att han sett Knugen.',
          'De letade vid dammen och skolans cykeltak.',
          'De hittade Knugen hos farmor.'
        ],
        correctOrder: [0, 1, 2, 3]
      },
      whoDidWhat: {
        q: 'Vilka sprang och letade efter Knugen?',
        allNames: ['Lisa', 'Kalle', 'mamma', 'farmor', 'Bengt'],
        correctNames: ['Lisa', 'Kalle']
      },
      detailPick: {
        q: 'Vilka platser nämns i texten?',
        options: ['parkens damm', 'skolan', 'affären', 'farmors hus', 'lekplatsen', 'biblioteket'],
        correct: [0, 1, 3]
      },
      summaries: {
        bad: 'Hunden rymde men de hittade den.',
        medium: 'Lisa och Kalles hund Knugen rymde när de glömde stänga grinden. De letade överallt och hittade honom till slut hos farmor.',
        good: 'Lisa och Kalle glömde stänga grinden efter skolan och hunden Knugen försvann. De letade vid dammen och skolan utan att hitta honom. Det var Kalle som kom på att Knugen brukar besöka farmor – och där låg han i hallen och åt köttfärs, nöjd och med viftande svans.'
      }
    }
  },

  {
    id: 'story_newkid',
    type: 'narrative',
    title: 'Den nya eleven',
    text: `På måndagsmorgonen kom en ny elev in i klassrummet. Han hette Leo och hade mörkt lockigt hår. Han såg ut som om han ville vara osynlig.
Fröken Andersson visade Leo till en tom plats bredvid Sara. "Leo har precis flyttat hit från Göteborg," sade fröken.
Under rasten stod Leo ensam vid staketet och tittade på när de andra spelade fotboll. Sara gick fram till honom.
"Kan du spela fotboll?" frågade hon.
"Lite," mumlade Leo.
"Kom med då," sade Sara och tog honom i armen.
Leo sparkade bollen och det gick rakt in i mål. Tobias och Mia jublade.
"Det var ett jättebra mål!" skrek Tobias.
Leo log för första gången den dagen. Det var ett litet leende, men det räckte.
I matsalen satte sig Sara, Mia och Tobias bredvid Leo. De frågade om Göteborg och havet och om han hade ett husdjur.
"En kanin," sade Leo. "Hon heter Snö."
"En kanin som heter Snö!" sade Mia. "Det är det coolaste namnet jag hört!"
Leo log igen. Den här gången var leendet lite större.`,
    characters: ['Leo', 'Sara', 'Mia', 'Tobias', 'fröken Andersson'],
    questions: {
      locate: [
        { q: 'Varifrån hade Leo precis flyttat?', options: ['Stockholm', 'Malmö', 'Göteborg', 'Uppsala'], correct: 2 },
        { q: 'Vad heter Leos husdjur?', options: ['Snöboll', 'Snö', 'Fluffis', 'Päls'], correct: 1 },
        { q: 'Var stod Leo under rasten?', options: ['På fotbollsplanen', 'Vid staketet', 'I klassrummet', 'I korridoren'], correct: 1 }
      ],
      interpret: [
        { q: 'Varför såg Leo ut "som om han ville vara osynlig"?', options: ['Han hade sovit dåligt', 'Han var blyg och nervös i den nya klassen', 'Han gillade inte skolan', 'Han var sjuk'], correct: 1 },
        { q: 'Vad visar det att Leos leende var "lite större" i slutet?', options: ['Han var hungrig', 'Han kände sig mer välkommen och trygg', 'Han hade lärt sig ett knep', 'Han tänkte på sin kanin'], correct: 1 }
      ],
      order: {
        events: [
          'Leo kom in i klassrummet och fick en plats bredvid Sara.',
          'Under rasten stod Leo ensam vid staketet.',
          'Sara bad Leo att vara med och spela fotboll.',
          'I matsalen satt de tillsammans och pratade om Göteborg.'
        ],
        correctOrder: [0, 1, 2, 3]
      },
      whoDidWhat: {
        q: 'Vilka jublade när Leo gjorde mål?',
        allNames: ['Leo', 'Sara', 'Mia', 'Tobias', 'fröken Andersson'],
        correctNames: ['Tobias', 'Mia']
      },
      detailPick: {
        q: 'Vilka saker eller platser nämns i texten?',
        options: ['staketet', 'matsalen', 'biblioteket', 'fotbollsplan', 'gympasal', 'klassrummet'],
        correct: [0, 1, 3, 5]
      },
      summaries: {
        bad: 'En ny elev kom till klassen.',
        medium: 'Leo var en ny elev som var blyg. Sara hjälpte honom att komma in i gruppen och han spelade fotboll och pratade med klassen.',
        good: 'Leo var ny i klassen och vågade knappt synas. Han stod ensam vid staketet under rasten tills Sara bad honom att spela fotboll. Han sköt ett mål och fick beröm – och för första gången log han. I matsalen berättade han om sin kanin Snö, och leendet blev lite större för varje minut.'
      }
    }
  },

  {
    id: 'story_bikerace',
    type: 'narrative',
    title: 'Cykeltävlingen',
    text: `Varje sommar anordnade byn en cykeltävling för barn. I år hade Emil och Frida bestämt sig för att vinna.
Emil hade tränat varje dag i tre veckor. Han hade pumpat däcken hårt och smörjt kedjan. Frida hade lärt sig att ta kurvorna snabbt utan att bromsa.
Starten gick vid den gamla ladan. Dömaren, en gammal man med vit mustasch, blåste i visslan.
Emil tog täten direkt. Han cyklade fort nerför backen och kände vinden i håret. Men i den sista kurvan tog han den för brett. Cykeln sladdade och Emil föll.
Frida cyklade förbi. Men hon stannade.
"Emil! Är du okej?"
Emil reste sig. Hans knä blödde lite men cykeln var hel. "Fortsätt! Cykla!" skrek han.
Frida tvekade. Sedan cyklade hon vidare och korsade mållinjen som etta.
Dömaren gav Frida en gul rosett. Emil kom in som trea. Men det var han som applåderade högst av alla.
"Du vann för att du tränade på kurvorna," sade Emil. "Nästa år tränar jag kurvor också."
Frida log. "Nästa år kanske du vinner."`,
    characters: ['Emil', 'Frida', 'Viktor', 'pappa', 'dömaren'],
    questions: {
      locate: [
        { q: 'Var gick starten för tävlingen?', options: ['Vid skolan', 'Vid den gamla ladan', 'Vid torget', 'Vid sjön'], correct: 1 },
        { q: 'Vilket pris fick Frida?', options: ['En silverpokal', 'En gul rosett', 'En medalj', 'En blå rosett'], correct: 1 },
        { q: 'Som vilken placering kom Emil in i mål?', options: ['Etta', 'Tvåa', 'Trea', 'Fyra'], correct: 2 }
      ],
      interpret: [
        { q: 'Varför stannade Frida trots att hon var på väg att vinna?', options: ['Hennes cykel gick sönder', 'Hon ville kontrollera att Emil inte var skadad', 'Hon tröttnade', 'Hon hade glömt vilken väg hon skulle ta'], correct: 1 },
        { q: 'Vad visar det att Emil applåderade "högst av alla" fast han förlorade?', options: ['Han ljög', 'Han var en god förlorare och beundrade Fridas seger', 'Han var lättad att det var slut', 'Han var arg på dömaren'], correct: 1 }
      ],
      order: {
        events: [
          'Dömaren blåste i visslan och tävlingen startade.',
          'Emil tog täten nerför backen.',
          'Emil föll i den sista kurvan.',
          'Frida korsade mållinjen som etta.'
        ],
        correctOrder: [0, 1, 2, 3]
      },
      whoDidWhat: {
        q: 'Vem hade tränat på att ta kurvorna snabbt?',
        allNames: ['Emil', 'Frida', 'Viktor', 'pappa', 'dömaren'],
        correctNames: ['Frida']
      },
      detailPick: {
        q: 'Vilka saker nämns i texten?',
        options: ['vissla', 'rosett', 'hjälm', 'kedja', 'tält', 'däck'],
        correct: [0, 1, 3, 5]
      },
      summaries: {
        bad: 'Frida vann cykeltävlingen.',
        medium: 'Emil och Frida tävlade i en cykeltävling. Emil föll i en kurva men Frida vann och fick en gul rosett.',
        good: 'Emil och Frida hade båda tränat hårt inför bycykelns tävling. Emil tog täten men föll i sista kurvan. Frida stannade och frågade om han mådde bra – men Emil skrek åt henne att fortsätta. Hon vann, och Emil applåderade högst av alla. Han lovade att träna på kurvorna till nästa år.'
      }
    }
  },

  {
    id: 'story_fishing',
    type: 'narrative',
    title: 'Fisketuren',
    text: `Morfar hade lovat Noa och Stina att de skulle fiska vid Långsjön hela sommardagen. De packade smörgåsar, äpplen och saft i en ryggsäck.
Tidigt på morgonen gick de ner till bryggan. Albin, Noas bäste vän, fick följa med i sista minuten.
Morfar lärde dem att sätta maskar på kroken. Stina vägrade röra maskarna och morfar hjälpte henne.
I tre timmar satt de tysta och väntade. Stinas lina rörde sig men det var bara ett blad.
Sedan kände Noa att något drog kraftigt i hans lina. Han ryckte till och drog upp det – en stor abborre, minst 30 centimeter.
"Det är den störste fisken jag sett på hela sommaren!" utbrast morfar.
Noa höll upp fisken och strålade. Men när han försökte flytta den till hinken halkade den ur hans händer och plötsade ner i sjön igen.
Det blev tyst.
"Jag kan ta en bild på dig i alla fall," sade morfar mjukt och höll upp kameran.
Noa skrattade. "En bild på en tom hand."
De åt sina smörgåsar i solen. Det var en bra dag ändå.`,
    characters: ['Noa', 'Stina', 'Albin', 'morfar', 'mamma'],
    questions: {
      locate: [
        { q: 'Var fiskade de?', options: ['Havsstranden', 'Långsjön', 'Floden', 'Dammen i parken'], correct: 1 },
        { q: 'Hur stor var abborren som Noa drog upp?', options: ['Minst 10 cm', 'Minst 20 cm', 'Minst 30 cm', 'Minst 50 cm'], correct: 2 },
        { q: 'Varför hjälpte morfar Stina?', options: ['Hon hade inte eget spö', 'Hon vägrade röra maskarna', 'Hon var rädd för vatten', 'Hon var för liten'], correct: 1 }
      ],
      interpret: [
        { q: 'Varför sade morfar mjukt "Jag kan ta en bild på dig i alla fall"?', options: ['Han var arg på Noa', 'Han ville trösta Noa som var ledsen att fisken rymde', 'Han saknade kameran', 'Han ville visa bilden för mamma'], correct: 1 },
        { q: 'Vad menas med att det "plötsade" ner i sjön?', options: ['Fisken hoppa högt', 'Fisken föll ner i vattnet med ett plopp-ljud', 'Noa lade varsamt ner fisken', 'Fisken kröp ur handen'], correct: 1 }
      ],
      order: {
        events: [
          'De packade ryggsäcken och gick till bryggan.',
          'Morfar lärde dem att sätta maskar på kroken.',
          'Noa drog upp en stor abborre.',
          'Fisken halkade ur handen och föll i sjön igen.'
        ],
        correctOrder: [0, 1, 2, 3]
      },
      whoDidWhat: {
        q: 'Vilka satte maskar på kroken själva?',
        allNames: ['Noa', 'Stina', 'Albin', 'morfar', 'mamma'],
        correctNames: ['Noa', 'Albin', 'morfar']
      },
      detailPick: {
        q: 'Vilka saker packades eller nämns i texten?',
        options: ['smörgåsar', 'saft', 'parasoll', 'äpplen', 'fiskehink', 'ryggsäck'],
        correct: [0, 1, 3, 5]
      },
      summaries: {
        bad: 'Noa och morfar fiskade vid en sjö.',
        medium: 'Noa, Stina och Albin fiskade med morfar. Noa fick en stor abborre men den föll tillbaka i sjön.',
        good: 'Morfar tog med Noa, Stina och Albin på fisketur till Långsjön. De väntade länge och Stina vägrade röra maskarna. Till slut fick Noa en stor abborre – men när han skulle flytta den halkade den ur händerna och försvann ner i sjön. Morfar erbjöd sig att ta en bild ändå, och Noa skrattade åt tanken på en bild av en tom hand.'
      }
    }
  },

  {
    id: 'story_forest',
    type: 'narrative',
    title: 'Det gamla trädet',
    text: `Maja, Björn och Lena brukade leka i skogen bakom huset varje sommarlov. En dag hittade de ett enormt gammalt träd med tjock, skrynklig bark.
"Titta!" utbrast Björn och pekade. I barken var det inristat flera namn: "Ulla 1968", "Bertil 1970" och "Kerstin & Sture 1975".
"Det är kanske morfars kompisar," viskade Maja.
De klättrade upp i trädet och åt sina medhavda smörgåsar bland grenarna. Hunden Rex skällde nere på marken.
Sedan var det dags att gå hem, men de visste inte åt vilket håll. Alla träd såg lika ut.
"Vi följer Rex," sade Lena bestämt.
Rex nosade runt och sprang sedan iväg mot norr. De följde efter. Efter fem minuter kom de ut på den välkända stigen nära huset.
Pappa stod och väntade vid grinden med armarna i kors.
"Ni var borta i två timmar!" sade han, men hans röst var mjuk.
"Vi hittade ett magiskt träd," sade Maja och visade sina foton på telefonen.
Pappa tittade länge på bilderna. "Kerstin är er mormor," sade han tyst.`,
    characters: ['Maja', 'Björn', 'Lena', 'pappa', 'Rex'],
    questions: {
      locate: [
        { q: 'Vilket år var det senaste inskriptionen i trädet?', options: ['1968', '1970', '1975', '1980'], correct: 2 },
        { q: 'Åt vilket håll sprang Rex?', options: ['Söder', 'Väster', 'Öster', 'Norr'], correct: 3 },
        { q: 'Hur länge var barnen borta?', options: ['En halvtimme', 'En timme', 'Två timmar', 'Tre timmar'], correct: 2 }
      ],
      interpret: [
        { q: 'Varför viskade Maja att namnen kanske var morfars kompisar?', options: ['Hon var rädd för att väcka skogsfåglar', 'Årtalen var gamla och visade att det rörde sig om vuxna för länge sedan', 'Hon var sjuk i halsen', 'Hon ville inte att Björn skulle höra'], correct: 1 },
        { q: 'Vad menas med att pappa stod "med armarna i kors"?', options: ['Han var kall och frös', 'Han tränade armmusklerna', 'Han var lite orolig eller irriterad', 'Han imiterade ett träd'], correct: 2 }
      ],
      order: {
        events: [
          'De hittade det gamla trädet med inristade namn.',
          'De klättrade upp och åt smörgåsar.',
          'De gick vilse och följde Rex hem.',
          'Pappa berättade att Kerstin var deras mormor.'
        ],
        correctOrder: [0, 1, 2, 3]
      },
      whoDidWhat: {
        q: 'Vilka klättrade upp i trädet?',
        allNames: ['Maja', 'Björn', 'Lena', 'pappa', 'Rex'],
        correctNames: ['Maja', 'Björn', 'Lena']
      },
      detailPick: {
        q: 'Vilka saker nämns i texten?',
        options: ['smörgåsar', 'telefon', 'karta', 'bark', 'ficklampa', 'grind'],
        correct: [0, 1, 3, 5]
      },
      summaries: {
        bad: 'Barnen hittade ett gammalt träd i skogen.',
        medium: 'Maja, Björn och Lena hittade ett gammalt träd med inristade namn. De gick vilse men hittade hem med hjälp av hunden Rex.',
        good: 'Maja, Björn och Lena hittade ett enormt gammalt träd med namn inristade sedan 1968. De klättrade upp och åt smörgåsar men gick sedan vilse på vägen hem. Hunden Rex ledde dem rätt. Hemma visade de pappa bilderna och han blev tyst – en av namnen, Kerstin, var deras mormor.'
      }
    }
  },

  {
    id: 'story_snowstorm',
    type: 'narrative',
    title: 'Den stora snöstormen',
    text: `Det kom en meter snö under natten. Oskar vaknade och såg att hela trädgården var vit. Det var så mycket snö att ytterdörren kärvar.
Mamma och Oskar grävde sig ut med spadar. Grannen fru Lund var gammal och bodde ensam. Hennes brevlåda var begravd under ett snöberg.
"Vi måste hjälpa fru Lund," sade mamma.
De gick dit och skottade hennes uppfart, trappan och hennes brevlåda. Fru Lund tittade ut genom fönstret och log stort.
Sedan öppnade hon dörren och kom ut med en bricka med varm choklad och pepparkakor.
"Ni är de snällaste grannarna i hela stan," sade hon.
Oskar drack chokladen och kände värmen sprida sig. Sedan sade Vera, hans lillasyster som också hade gett sig ut, att hon ville bygga en snögubbe.
Brevbäraren Håkan kom förbi och stannade till. "Det är den vackraste snögubben jag sett i år," sade han och log.
Snögubben hade en morot som näsa och knappar av kastanjer. Fru Lund gav dem en gammal halsduk att hänga runt snögubbens hals.
Det var en av vinterns bästa dagar.`,
    characters: ['Oskar', 'Vera', 'mamma', 'fru Lund', 'brevbäraren'],
    questions: {
      locate: [
        { q: 'Hur mycket snö kom under natten?', options: ['En halvmeter', 'En meter', 'Tio centimeter', 'Två meter'], correct: 1 },
        { q: 'Vad hade snögubben för näsa?', options: ['En knapp', 'En sten', 'En morot', 'En pinne'], correct: 2 },
        { q: 'Vad gav fru Lund dem att dricka?', options: ['Te', 'Varm choklad', 'Saft', 'Mjölk'], correct: 1 }
      ],
      interpret: [
        { q: 'Varför gick mamma och Oskar till fru Lund?', options: ['De ville låna en spade', 'Fru Lund var gammal och ensam och behövde hjälp', 'De skulle hälsa på', 'Fru Lund hade bett om hjälp'], correct: 1 },
        { q: 'Vad visar det att fru Lund kom ut med varm choklad och pepparkakor?', options: ['Hon ville bli av med dem', 'Hon var tacksam för hjälpen och ville ge något tillbaka', 'Det var hennes frukost', 'Hon hade gjort det av misstag'], correct: 1 }
      ],
      order: {
        events: [
          'Oskar vaknade och såg den stora snön.',
          'Mamma och Oskar skottade fru Lunds uppfart.',
          'Fru Lund kom ut med varm choklad.',
          'Vera och Oskar byggde en snögubbe.'
        ],
        correctOrder: [0, 1, 2, 3]
      },
      whoDidWhat: {
        q: 'Vilka skottade snö hos fru Lund?',
        allNames: ['Oskar', 'Vera', 'mamma', 'fru Lund', 'brevbäraren'],
        correctNames: ['Oskar', 'mamma']
      },
      detailPick: {
        q: 'Vilka saker nämns i texten?',
        options: ['spade', 'halsduk', 'handskar', 'pepparkakor', 'snöbollar', 'kastanjer'],
        correct: [0, 1, 3, 5]
      },
      summaries: {
        bad: 'Det kom mycket snö och de byggde en snögubbe.',
        medium: 'Oskar och mamma hjälpte grannen fru Lund att skotta snö. Sedan fick de varm choklad och byggde en snögubbe.',
        good: 'En stor snöstorm kom under natten och täckte allt. Oskar och mamma insåg att den gamla grannen fru Lund behövde hjälp och skottade hennes uppfart. Som tack kom fru Lund ut med varm choklad och pepparkakor. Efteråt byggde Oskar och Vera en snögubbe med morotnäsa och kastanjeknappar – brevbäraren kallade den vackrast i stan.'
      }
    }
  },

  {
    id: 'story_magician',
    type: 'narrative',
    title: 'Trollkarlen i parken',
    text: `En lördag satt Elin, Hugo och Nils på en parkbänk när en man i svart hatt ställde upp ett litet tält.
"Välkommen till Trollkarlen Magnussons föreställning!" ropade han.
En kvinna bredvid, hans assistent Siri, delade ut flygblad. En liten folkmassa samlades.
Trollkarlens första trick var att få en blomma att försvinna och sedan dyka upp igen bakom Hugo öra.
"Hur gör du det?" utbrast Hugo med stora ögon.
"En trollkarl avslöjar aldrig sina hemligheter," sade Magnusson och log mystiskt.
Sedan frågade han om ett frivilligt barn ville hjälpa till. Elin räckte upp handen och fick komma fram.
Magnusson sade åt Elin att hålla en tom ask. Han viftade med sin trollstav och sade "Sim sala bim!" och bad Elin att öppna asken. Inuti låg en liten riktig mus.
Elin skrek till men log sedan. Musen hette Pricken och var tam.
Parkens vakt Anders gick förbi och skakade på huvudet, men han log också.
På vägen hem pratade de bara om Pricken och undrade var musen gömts.`,
    characters: ['Elin', 'Hugo', 'Nils', 'Magnusson', 'Siri'],
    questions: {
      locate: [
        { q: 'Vad hette trollkarlen?', options: ['Magnus', 'Magnusson', 'Manfred', 'Martinsson'], correct: 1 },
        { q: 'Var dök blomman upp efter att den försvunnit?', options: ['I Elins ficka', 'Bakom Hugo öra', 'I hatten', 'Under bänken'], correct: 1 },
        { q: 'Vad fanns inuti asken som Elin höll?', options: ['En papegoja', 'En mus', 'En blomma', 'En diamant'], correct: 1 }
      ],
      interpret: [
        { q: 'Varför sade Magnusson "En trollkarl avslöjar aldrig sina hemligheter"?', options: ['Han var arg på Hugo', 'Han ville bevara spänningen och mysteriet', 'Han visste inte svaret', 'Han pratade med Siri'], correct: 1 },
        { q: 'Varför log parkens vakt trots att han skakade på huvudet?', options: ['Han kände Magnusson', 'Han var trött', 'Föreställningen var rolig trots att han kanske inte borde tillåta den', 'Han log åt Pricken'], correct: 2 }
      ],
      order: {
        events: [
          'Magnusson ställde upp ett litet tält i parken.',
          'Blomman försvann och dök upp bakom Hugos öra.',
          'Elin räckte upp handen och fick komma fram.',
          'En mus hittades inuti asken Elin höll.'
        ],
        correctOrder: [0, 1, 2, 3]
      },
      whoDidWhat: {
        q: 'Vilka var med och tittade på föreställningen?',
        allNames: ['Elin', 'Hugo', 'Nils', 'Magnusson', 'Siri'],
        correctNames: ['Elin', 'Hugo', 'Nils']
      },
      detailPick: {
        q: 'Vilka saker nämns i texten?',
        options: ['trollstav', 'ask', 'flygblad', 'trollhatt', 'tält', 'spegel'],
        correct: [0, 1, 2, 4]
      },
      summaries: {
        bad: 'Barnen såg en trollkarl.',
        medium: 'Elin, Hugo och Nils såg en trollkarl i parken. Elin fick hjälpa till och hittade en mus i en ask.',
        good: 'En lördag stötte Elin, Hugo och Nils på trollkarlen Magnusson i parken. Han fick en blomma att försvinna och dyka upp bakom Hugos öra. Elin valde att hjälpa till och höll en tom ask – men när hon öppnade den låg det en tam mus inuti. Hela vägen hem undrade de var musen hade gömts.'
      }
    }
  },

  {
    id: 'story_map',
    type: 'narrative',
    title: 'Den hemliga kartan',
    text: `Alma hittade ett vikt papper under en lös golvplanка i gammelfars källare. Det var en gammal karta ritad med tusch och det luktade gammalt.
"Joel! Tilda! Kom hit!" ropade hon.
Kartan visade trädgården, ett stort träd, tre steg åt vänster och ett kryss vid rosenrabatten.
"Det är en skatt!" viskade Joel.
Gammelfar satt i sin stol och sov. Katten Misse smög runt benen på dem.
De smög ut i trädgården och hittade det stora äppelträdet. De räknade tre steg åt vänster och stod då vid rosenrabatten.
Alma grävde med händerna i den mjuka jorden. Joel fick spade ur förrådet. Tilda höll vakt.
Under tio centimeter jord hittade de en rostig plåtburk. Inuti låg tio gamla mynt av silver och ett litet brev på gulnat papper.
Brevet löd: "Till den modiga som hittar detta. Dessa mynt köpte jag 1955. Bevara dem. – Gammelfar, 7 år gammal."
Alma läste brevet högt. De tittade på varandra.
"Han var lika gammal som vi!" viskade Tilda.`,
    characters: ['Alma', 'Joel', 'Tilda', 'gammelfar', 'Misse'],
    questions: {
      locate: [
        { q: 'Var hittade Alma kartan?', options: ['Under en sten i trädgården', 'Under en lös golvplanка i källaren', 'I en bok på hyllan', 'I gammelfars ficka'], correct: 1 },
        { q: 'Hur många mynt hittade de i burken?', options: ['Fem', 'Åtta', 'Tio', 'Tolv'], correct: 2 },
        { q: 'Vilket år köpte gammelfar mynten?', options: ['1945', '1950', '1955', '1960'], correct: 2 }
      ],
      interpret: [
        { q: 'Varför viskade barnen hela tiden?', options: ['De var förkylda', 'De ville inte väcka gammelfar eller avslöja hemligheten', 'Det var tyst i huset', 'Tilda bad dem viska'], correct: 1 },
        { q: 'Vad kände barnen när de läste att gammelfar var lika gammal som de när han gömde skatten?', options: ['De blev besvikna', 'De kände en koppling till en ung version av gammelfar', 'De förstod inte brevet', 'De ville sälja mynten'], correct: 1 }
      ],
      order: {
        events: [
          'Alma hittade kartan under golvplankan.',
          'De hittade äppelträdet och räknade tre steg åt vänster.',
          'Joel hämtade en spade ur förrådet.',
          'De hittade plåtburken med mynt och ett brev.'
        ],
        correctOrder: [0, 1, 2, 3]
      },
      whoDidWhat: {
        q: 'Vilka grävde efter skatten?',
        allNames: ['Alma', 'Joel', 'Tilda', 'gammelfar', 'Misse'],
        correctNames: ['Alma', 'Joel']
      },
      detailPick: {
        q: 'Vilka saker nämns i texten?',
        options: ['karta', 'spade', 'ficklamp', 'plåtburk', 'nyckel', 'mynt'],
        correct: [0, 1, 3, 5]
      },
      summaries: {
        bad: 'Barnen hittade en skatt i trädgården.',
        medium: 'Alma hittade en hemlig karta och de följde den till trädgården. Där grävde de upp en plåtburk med gamla mynt.',
        good: 'Alma hittade en hemlig karta i gammelfars källare och övertygade Joel och Tilda om att det var en skatt. De följde kartans anvisningar i trädgården och grävde upp en rostig plåtburk med tio silvermynt och ett brev. Brevet avslöjade att gammelfar hade gömt skatten när han var lika gammal som de var nu – och det fick dem att tystna av häpnad.'
      }
    }
  },

  {
    id: 'story_sea',
    type: 'narrative',
    title: 'Utflykt till havet',
    text: `Klass 3B hade länge väntat på sin utflykt till havet. Fröken Bergström hade berättat om maneter och krabbor i veckor.
Wilma satt bredvid sin bästa kompis Sam på bussen. Iris satt bakom och sjöng en sång hon hittat på.
Stranden var sandig och vindstilla. Klassen delade upp sig i grupper om tre.
Wilma, Sam och Iris hittade direkt en manet nära vattenbrynet. Den var genomskinlig och lila och stor som Sams hand.
"Rör inte!" sade fröken Bergström. "Maneter kan stickas."
Sam tog ett foto med sin tablett. Iris ritade manetens form i sanden med ett snäckskal.
Wilma hittade sedan en stor rosig snäcka och höll den mot örat. "Jag hör havet!" utbrast hon.
"Det är luften som rör sig inne i snäckan," förklarade fröken Bergström.
De samlade snäckor i en hink. Wilma fick den finaste – en spiralavlång snäcka med rosa och vit rand.
På bussen hem sov Iris med snäckor i knäet. Wilma och Sam pratade om att komma tillbaka nästa sommar.`,
    characters: ['Wilma', 'Sam', 'Iris', 'fröken Bergström', 'klasskompisar'],
    questions: {
      locate: [
        { q: 'Vad satt de i på vägen till havet?', options: ['Tåg', 'Bil', 'Buss', 'Cykel'], correct: 2 },
        { q: 'Hur stor var maneten de hittade?', options: ['Lika stor som ett mynt', 'Lika stor som Sams hand', 'Lika stor som Wilmas huvud', 'Lika stor som en tallrik'], correct: 1 },
        { q: 'Vad fick Wilma för snäcka?', options: ['En rund, brun snäcka', 'En platt, grå snäcka', 'En spiralavlång med rosa och vit rand', 'En liten, gul snäcka'], correct: 2 }
      ],
      interpret: [
        { q: 'Varför sade fröken Bergström "Rör inte"?', options: ['Maneten var sällsynt och måste skyddas', 'Maneter kan stickas och göra ont', 'Wilma var allergisk', 'Maneten var giftig för alla'], correct: 1 },
        { q: 'Vad visar det att Iris sov med snäckor i knäet på bussen hem?', options: ['Hon var trött och hade haft en rolig dag', 'Hon ville ta hem snäckorna till sin mamma', 'Hon var sjuk', 'Snäckorna hörde hemma i hennes ryggsäck'], correct: 0 }
      ],
      order: {
        events: [
          'Klassen åkte buss till havet.',
          'De hittade en manet nära vattenbrynet.',
          'Wilma höll en snäcka mot örat och hörde havet.',
          'På bussen hem sov Iris med snäckor i knäet.'
        ],
        correctOrder: [0, 1, 2, 3]
      },
      whoDidWhat: {
        q: 'Vilka hittade maneten nära vattenbrynet?',
        allNames: ['Wilma', 'Sam', 'Iris', 'fröken Bergström', 'Erik'],
        correctNames: ['Wilma', 'Sam', 'Iris']
      },
      detailPick: {
        q: 'Vilka saker nämns i texten?',
        options: ['snäcka', 'hink', 'spade', 'tablett', 'solkräm', 'snäckskal'],
        correct: [0, 1, 3, 5]
      },
      summaries: {
        bad: 'Klassen åkte till havet och hittade en manet.',
        medium: 'Klass 3B åkte på utflykt till havet. Wilma, Sam och Iris hittade en manet och samlade snäckor.',
        good: 'Klass 3B åkte på länge väntad havs utflykt. Wilma, Sam och Iris hittade en genomskinlig lila manet som fröken Bergström varnade dem för att röra. De samlade snäckor och Wilma fick en spiralavlång med rosa och vit rand. På hemvägen sov Iris med snäckorna i knäet och Wilma och Sam planerade redan nästa besök.'
      }
    }
  }
];

/* ── FAKTATEXTER (10 st) ─────────────────────────────────── */
const FACTUAL_TEXTS = [

  {
    id: 'facts_traffic',
    type: 'factual',
    title: 'I trafiken',
    text: `Varje dag rör sig tusentals människor i trafiken. Vissa kör bil, andra cyklar och många går till fots. Det är viktigt att alla följer trafikreglerna för att ingen ska skadas.
En fotgängare är en person som går till fots. Fotgängare ska gå på trottoaren, det vill säga den upphöjda gångbanan längs gatan. När man korsar gatan ska man använda övergångsstället.
Vid övergångsstället finns ofta ett trafikljus. Det röda ljuset betyder stopp och det gröna ljuset betyder gå. Den gröna gubben kan lysa olika länge beroende på hur bred gatan är.
En cyklist är en person som cyklar. Cyklister ska använda cykelvägen när det finns en. De måste ha fungerande bromsar och en ringklocka. På kvällen är det lag på att ha lykta på cykeln.
Cykelhjälm är viktigt för alla cyklister. Om man faller kan hjälmen skydda huvudet.
I korsningar måste alla fordon, det vill säga bilar, lastbilar och cyklar, köra sakta och kontrollera att det inte kommer andra fordon. Man ska lyssna på ljud från bilar och titta åt båda håll innan man korsar.`,
    questions: {
      locate: [
        { q: 'Vad kallas en person som går till fots?', options: ['Cyklist', 'Fotgängare', 'Trafikant', 'Vandrare'], correct: 1 },
        { q: 'Vad måste cyklister ha på cykeln på kvällen?', options: ['Reflex', 'Lykta', 'Ringklocka', 'Bromsljus'], correct: 1 },
        { q: 'Vad är en trottoar?', options: ['En cykelväg', 'En gångbana längs gatan', 'En korsning', 'En bilväg'], correct: 1 }
      ],
      concept: { q: 'Vad är ett "fordon" enligt texten?', options: ['Bara bilar', 'Bara cyklar', 'Bilar, lastbilar och cyklar', 'Bussar och tåg'], correct: 2 },
      inference: { q: 'Varför kan den gröna gubben lysa olika länge vid olika övergångsställen?', options: ['Det beror på vädret', 'Det beror på hur bred gatan är', 'Det beror på hur många bilar det finns', 'Det är slumpmässigt'], correct: 1 },
      summaries: {
        bad: 'Man måste följa trafikreglerna.',
        medium: 'Texten handlar om trafik. Fotgängare ska gå på trottoaren och cyklister ska ha hjälm och lykta.',
        good: 'Texten förklarar hur fotgängare, cyklister och fordon ska bete sig i trafiken. Fotgängare ska hålla sig till trottoaren och använda övergångsställen. Cyklister måste ha fungerande bromsar, ringklocka och lykta på kvällen. I korsningar måste alla sakta ner och kontrollera så att det inte kommer andra fordon.'
      }
    }
  },

  {
    id: 'facts_forest_animals',
    type: 'factual',
    title: 'Djur i den svenska skogen',
    text: `Sverige har många vilda djur som lever i skogen. Älg, räv och hare är tre vanliga djur som man kan få se om man är tyst och försiktig.
Älgen är det största djuret i den svenska skogen. En vuxen älg kan väga upp till 500 kilo. Älgen äter löv och kvistar och är ingen fara för människor om den inte är stressad.
Räven är ett mindre djur med röd päls och en lång, buskig svans. Rävar är aktiva både på dag och natt. De äter möss, fåglar och bär. Rävar bor i bo under marken som kallas för rävlya.
Haren har långa öron och bakben som är längre än frambenen. Det gör att haren kan springa mycket fort, upp till 70 kilometer i timmen. På vintern byter haren päls från brun till vit, vilket gör den svår att se i snön.
I skogen finns även spår av djuren i marken. Man kan se var ett djur har gått om man tittar noga på mjuk jord eller snö. En räv lämnar smala, prydliga spår i en rak linje. En hare lämnar spår med stora bakbensavtryck.
Det är viktigt att inte störa djuren i skogen. Håll dig på stigen och var tyst så kan du få se mer.`,
    questions: {
      locate: [
        { q: 'Hur fort kan en hare springa?', options: ['Upp till 30 km/h', 'Upp till 50 km/h', 'Upp till 70 km/h', 'Upp till 100 km/h'], correct: 2 },
        { q: 'Hur mycket kan en vuxen älg väga?', options: ['Upp till 200 kilo', 'Upp till 300 kilo', 'Upp till 400 kilo', 'Upp till 500 kilo'], correct: 3 },
        { q: 'Vad kallas rävens bo?', options: ['Rävhål', 'Rävlya', 'Rävkula', 'Rävhome'], correct: 1 }
      ],
      concept: { q: 'Varför byter haren päls på vintern?', options: ['För att den fryser', 'För att bli svår att se i snön', 'Det är naturlig åldring', 'För att attrahera en partner'], correct: 1 },
      inference: { q: 'Varför lämnar räven spår i en "rak linje"?', options: ['Räven är lat', 'Räven springer alltid rakt fram', 'Rävar sätter bakfötterna i exakt samma spår som framfötterna för att vara effektiva', 'Det är en slump'], correct: 2 },
      summaries: {
        bad: 'Det finns djur i skogen.',
        medium: 'Texten handlar om älg, räv och hare i den svenska skogen. De har olika egenskaper och lämnar spår.',
        good: 'Texten beskriver tre vanliga skogsdjur: älgen som är störst och kan väga 500 kg, räven med sin röda päls som bor i rävlya, och haren som springer upp till 70 km/h och byter till vit vinterpäls. Alla lämnar spår i snön – räven prydliga och raka, haren med stora bakbensavtryck. Man bör vara tyst och hålla sig på stigen för att se djuren.'
      }
    }
  },

  {
    id: 'facts_water',
    type: 'factual',
    title: 'Vattnets resa',
    text: `Vatten är viktigt för allt levande. Utan vatten kan varken människor, djur eller växter överleva.
Vi dricker vatten varje dag ur kranen hemma. Men hur kom det vattnet dit? Det har gjort en lång resa.
Vatten avdunstar från hav och sjöar när solen värmer det. Det stiger upp som ånga och bildar moln. Molnen blåser med vinden över land. När molnet är fullt av vatten regnar eller snöar det.
Regnvattnet rinner ner i marken och ut i floder och sjöar. Det samlas i vattenverk där det renas och görs säkert att dricka. Sedan pumpas det ut i rör och till slut ur din kran.
Det här kallas för vattnets kretslopp – vattnet rör sig i en stor cirkel utan att ta slut.
På vintern kan vatten frysa till is när temperaturen sjunker under noll grader. Is smälter när det blir varmare igen och blir till vatten.
I vissa länder finns det inte tillräckligt med rent vatten. Då kan barn och vuxna bli sjuka av att dricka smutsigt vatten. Därför är det viktigt att vi tar hand om vattnet och inte slösar.`,
    questions: {
      locate: [
        { q: 'Vad händer med vatten i ett vattenverk?', options: ['Det fryses till is', 'Det renas och görs säkert att dricka', 'Det avdunstar', 'Det pumpas ut i sjöar'], correct: 1 },
        { q: 'Vad kallas rörelsen där vatten rör sig i en stor cirkel?', options: ['Vattnets liv', 'Vattnets flöde', 'Vattnets kretslopp', 'Vattnets cykel'], correct: 2 },
        { q: 'Vid vilken temperatur fryser vatten?', options: ['Vid tio grader', 'Vid noll grader', 'Vid minus tio grader', 'Vid minus ett grad'], correct: 1 }
      ],
      concept: { q: 'Vad menas med att vatten "avdunstar"?', options: ['Det stelnar till is', 'Det rinner ner i marken', 'Det förvandlas till ånga och stiger uppåt', 'Det renas i vattenverket'], correct: 2 },
      inference: { q: 'Varför är det viktigt att inte slösa med vatten?', options: ['Vatten kostar mycket pengar', 'I många länder saknas rent vatten och det är en begränsad resurs', 'Kranvatten smakar illa om det slösas', 'Det är lag på det'], correct: 1 },
      summaries: {
        bad: 'Vatten är viktigt.',
        medium: 'Texten handlar om vattnets kretslopp – hur vatten avdunstar, bildar moln och regnar ner igen. Det renas i vattenverk.',
        good: 'Texten förklarar vattnets kretslopp: vatten avdunstar från hav och sjöar, bildar moln och faller som regn. Det renas i vattenverk och pumpas till kranar. Vatten kan även frysa till is och smälta igen. Texten poängterar att rent vatten saknas i vissa länder och att vi därför inte bör slösa.'
      }
    }
  },

  {
    id: 'facts_space',
    type: 'factual',
    title: 'Rymden och solen',
    text: `Rymden är oändligt stor. Den innehåller miljarder av stjärnor, planeter och galaxer.
Vår sol är en stjärna. Den är ungefär 150 miljoner kilometer från jorden. Solens värme och ljus gör det möjligt för liv på vår planet. Utan solen skulle det vara mörkt och iskall på jorden.
Jorden är en av åtta planeter som kretsar runt solen. Den tar 365 dagar, det vill säga ett år, att göra ett varv. Det är därför vi har år och årstider.
Månen kretsar runt jorden. Det tar 28 dagar för månen att göra ett varv runt jorden. Månen lyser inte med eget ljus – den reflekterar solens ljus.
Stjärnorna vi ser på natten är egentligen solliknande klot väldigt långt borta. En del stjärnor är så långt borta att deras ljus tar tusentals år att nå oss. Det vi ser på himlen är alltså ljus som lämnade stjärnan för länge sedan.
Astronauter är de människor som tränas för att åka ut i rymden. De bor och arbetar på den internationella rymdstationen, ISS, som kretsar runt jorden.`,
    questions: {
      locate: [
        { q: 'Hur långt är det från solen till jorden?', options: ['1,5 miljoner km', '15 miljoner km', '150 miljoner km', '1 500 miljoner km'], correct: 2 },
        { q: 'Hur lång tid tar det för månen att kretsa runt jorden?', options: ['7 dagar', '14 dagar', '28 dagar', '365 dagar'], correct: 2 },
        { q: 'Vad kallas de som tränas att åka ut i rymden?', options: ['Kosmonauter', 'Astronauter', 'Rymdfarare', 'Stjärnskådare'], correct: 1 }
      ],
      concept: { q: 'Vad menas med att månen "reflekterar" solens ljus?', options: ['Månen bränner sitt eget ljus', 'Månen studsar solljuset tillbaka mot oss', 'Månen är en liten sol', 'Månen drar till sig solljus'], correct: 1 },
      inference: { q: 'Om en stjärnas ljus tar 500 år att nå oss, vad ser vi egentligen?', options: ['Hur stjärnan ser ut idag', 'Hur stjärnan såg ut för 500 år sedan', 'Framtiden', 'En illusion utan stjärna'], correct: 1 },
      summaries: {
        bad: 'Rymden är stor och har stjärnor och planeter.',
        medium: 'Texten handlar om rymden, solen, månen och jordens bana. Astronauter arbetar på rymdstationen ISS.',
        good: 'Texten beskriver rymden: solen är 150 miljoner km bort och ger oss värme och ljus. Jorden tar 365 dagar att kretsa runt solen och månen tar 28 dagar att kretsa runt jorden – utan eget ljus, bara reflekterat solljus. Stjärnornas ljus kan ta tusentals år att nå oss, så det vi ser är ett gammalt ljus. Astronauter lever och arbetar på ISS.'
      }
    }
  },

  {
    id: 'facts_body',
    type: 'factual',
    title: 'Din kropp',
    text: `Kroppen är som en maskin med många delar som samarbetar. Hjärtat, lungorna, skelettet och musklerna har alla viktiga uppgifter.
Hjärtat är en muskel som pumpar blodet runt i kroppen. Det slår ungefär 70 gånger per minut när man är i vila. När man springer slår hjärtat fortare för att ge musklerna mer syre.
Lungorna tar in luft varje gång vi andas. I lungorna tas syret ur luften och hamnar i blodet. Sedan förs syret med blodet ut till alla kroppens celler.
Skelettet är kroppen inre ram. Det består av 206 ben hos en vuxen människa. Ben är hårda och starka men kan brytas vid ett fall. De läker om de får tid.
Musklerna sitter fast vid skelettet med senor. Musklerna drar ihop sig och drar i benen när vi rör oss. Vi har ungefär 640 muskler i kroppen.
Huden är kroppens största organ. Den skyddar oss mot bakterier och reglerar vår temperatur. När vi svettas kyler huden ner kroppen.
Det är viktigt att ta hand om kroppen: sova tillräckligt, äta bra mat, röra sig varje dag och dricka vatten.`,
    questions: {
      locate: [
        { q: 'Hur många gånger per minut slår hjärtat i vila?', options: ['50 gånger', '60 gånger', '70 gånger', '100 gånger'], correct: 2 },
        { q: 'Hur många ben har en vuxen människa?', options: ['106', '206', '306', '406'], correct: 1 },
        { q: 'Vad kallas det som fäster muskler vid skelettet?', options: ['Ligament', 'Senor', 'Leder', 'Brosk'], correct: 1 }
      ],
      concept: { q: 'Vad menas med att huden är kroppens "största organ"?', options: ['Huden väger mest', 'Huden täcker hela kroppen och har viktiga funktioner', 'Huden innehåller flest celler', 'Huden är viktigast'], correct: 1 },
      inference: { q: 'Varför slår hjärtat fortare när man springer?', options: ['Det är en reflex', 'Musklerna behöver mer syre och blodet måste pumpas snabbare', 'Hjärtat är rädd', 'Lungorna styr hjärtat'], correct: 1 },
      summaries: {
        bad: 'Kroppen har hjärta, lungor och skelett.',
        medium: 'Texten handlar om kroppens organ: hjärta, lungor, skelett, muskler och hud. Alla har viktiga uppgifter.',
        good: 'Texten förklarar hur kroppens viktigaste delar fungerar. Hjärtat pumpar blod 70 gånger per minut i vila, lungorna tar in syre, skelettet (206 ben) ger stöd, 640 muskler ger rörelse och huden skyddar och reglerar temperaturen. Texten avslutar med råd om sömn, mat, rörelse och vatten för att hålla kroppen frisk.'
      }
    }
  },

  {
    id: 'facts_seasons',
    type: 'factual',
    title: 'Årstiderna',
    text: `Sverige har fyra årstider: vår, sommar, höst och vinter. Var och en av dem ser olika ut och käns olika.
Våren börjar i mars eller april. Snön smälter, fåglarna sjunger och blommor börjar växa. Dagarna blir längre och solen stiger högre på himlen.
Sommaren är den varmaste årstiden. I Sverige kan det ibland bli 30 grader eller varmare. Midsommar är en stor högtid. I norra Sverige kan solen lysa hela natten på sommaren – det kallas midnattssol.
Hösten börjar i september. Löven på träden ändrar färg från grönt till gult, orange och rött. Sedan faller de till marken. Dagarna blir kortare och det börjar bli kallare.
Vintern är den kallaste årstiden. Det kan snöa och temperaturen kan sjunka långt under noll grader. I norra Sverige är det knappt någon sol alls på vintern – det kallas mörktid.
Årstiderna beror på att jorden lutar och kretsar runt solen. Den delen av jorden som lutar mot solen får mer ljus och värme, vilket ger sommar. Den del som lutar bort från solen får vinter.`,
    questions: [
        { q: 'Hur varmt kan det bli i Sverige på sommaren?', options: ['Upp till 20 grader', 'Upp till 25 grader', 'Upp till 30 grader', 'Upp till 40 grader'], correct: 2 },
        { q: 'Vad kallas det när solen lyser hela natten i norra Sverige?', options: ['Polarnatt', 'Midnattssol', 'Mörktid', 'Sommarsol'], correct: 1 },
        { q: 'När börjar hösten?', options: ['I juni', 'I juli', 'I augusti', 'I september'], correct: 3 }
    ],
    locateIdx: 0,
    concept: { q: 'Vad kallas det när det knappt är någon sol alls i norra Sverige på vintern?', options: ['Midnattssol', 'Polarnatt', 'Mörktid', 'Vinterdvala'], correct: 2 },
    inference: { q: 'Varför har Sverige olika årstider?', options: ['Vädret är slumpmässigt', 'Jorden lutar och kretsar runt solen', 'Havet styr temperaturen', 'Molnen bestämmer årstiderna'], correct: 1 },
    questions_obj: {
      locate: [
        { q: 'Hur varmt kan det bli i Sverige på sommaren?', options: ['Upp till 20 grader', 'Upp till 25 grader', 'Upp till 30 grader', 'Upp till 40 grader'], correct: 2 },
        { q: 'Vad kallas det när solen lyser hela natten i norra Sverige?', options: ['Polarnatt', 'Midnattssol', 'Mörktid', 'Sommarsol'], correct: 1 },
        { q: 'När börjar hösten?', options: ['I juni', 'I juli', 'I augusti', 'I september'], correct: 3 }
      ],
      concept: { q: 'Vad kallas det när det knappt är någon sol alls i norra Sverige på vintern?', options: ['Midnattssol', 'Polarnatt', 'Mörktid', 'Vinterdvala'], correct: 2 },
      inference: { q: 'Varför har Sverige olika årstider?', options: ['Vädret är slumpmässigt', 'Jorden lutar och kretsar runt solen', 'Havet styr temperaturen', 'Molnen bestämmer årstiderna'], correct: 1 },
      summaries: {
        bad: 'Sverige har fyra årstider.',
        medium: 'Texten handlar om de fyra årstiderna i Sverige. Varje årstid ser olika ut. På sommaren kan det vara midnattssol i norr.',
        good: 'Texten beskriver Sveriges fyra årstider. Våren börjar i mars med smältande snö och fågelsång. Sommaren kan ge 30 grader och midnattssol i norr. Hösten färgar löven och dagarna kortas. Vintern ger snö och mörktid i norr. Årstiderna beror på att jorden lutar och kretsar runt solen.'
      }
    }
  },

  {
    id: 'facts_food',
    type: 'factual',
    title: 'Matens väg från jord till bord',
    text: `Maten vi äter till middag har oftast gjort en lång resa. En morot som ligger på din tallrik kan ha växt på en åker mil bort.
Bönder sår och planterar växter på sina åkrar på våren. Under sommaren vattnas och sköts grödorna. På hösten skördas grödorna – det vill säga att bonden samlar in allt som vuxit.
Sedan åker grödorna lastbil till en fabrik eller ett lager. Där sorteras, rengörs och paketeras de. Morötter tvättas och läggs i påsar. Bröd bakas och lindas in.
Från fabriken åker maten till butiken. Butikerna tar emot stora leveranser varje morgon. Sedan placeras varorna på hyllorna så att du och dina föräldrar kan köpa dem.
Hemma förvarar man mat i kylen eller i skafferiet. Kall mat håller längre utan att bli dålig.
En del mat importeras – det vill säga köps från andra länder. Bananer och apelsiner odlas till exempel inte i Sverige utan hämtas från varmare länder.
Att inte kasta mat är viktigt. I Sverige kastas ungefär 700 000 ton mat varje år. Det är mat som krävt vatten, energi och arbete att producera.`,
    questions: {
      locate: [
        { q: 'När skördas grödorna från åkern?', options: ['På våren', 'På sommaren', 'På hösten', 'På vintern'], correct: 2 },
        { q: 'Hur mycket mat kastas i Sverige varje år?', options: ['70 000 ton', '700 000 ton', '7 000 000 ton', '7 000 ton'], correct: 1 },
        { q: 'Varifrån köps bananer och apelsiner?', options: ['Från svenska växthus', 'Från norska åkrar', 'Från varmare länder', 'Från danska bönder'], correct: 2 }
      ],
      concept: { q: 'Vad menas med att mat "importeras"?', options: ['Mat tillverkas i fabriker', 'Mat köps in från andra länder', 'Mat lagras länge i kyl', 'Mat skördas på hösten'], correct: 1 },
      inference: { q: 'Varför är det viktigt att inte kasta mat?', options: ['Det är förbjudet', 'Att producera mat kräver mycket vatten, energi och arbete', 'Maten kan bli giftig', 'Butikerna tjänar pengar på oss'], correct: 1 },
      summaries: {
        bad: 'Mat köps i butiken.',
        medium: 'Texten handlar om matens resa från åkern till bordet. Bönder odlar, sedan packas maten och skickas till butiker.',
        good: 'Texten följer matens resa: bönder sår på våren, skördar på hösten och maten transporteras till fabriker. Där sorteras och paketeras den innan butiken tar emot dagliga leveranser. En del mat importeras från varmare länder. Texten avslutar med att påpeka att 700 000 ton mat kastas i Sverige varje år och att detta är ett slöseri med resurser.'
      }
    }
  },

  {
    id: 'facts_library',
    type: 'factual',
    title: 'Biblioteket',
    text: `Biblioteket är en plats där alla är välkomna. Där kan man låna böcker, tidningar, filmer och musik helt gratis. Det enda du behöver är ett bibliotekskort.
Böckerna på biblioteket är ordnade i grupper. Faktaböcker och berättande böcker är på olika hyllor. Innanför pärmen på en bok finns ett nummer – det numret berättar var boken hör hemma.
Bibliotekarier är de som jobbar på biblioteket. De hjälper dig att hitta böcker och kan tipsa om vad du kan läsa härnäst. Om biblioteket inte har den bok du vill ha kan de beställa den från ett annat bibliotek.
Du kan låna en bok i tre veckor. Sedan måste den lämnas tillbaka, annars kan du få betala en avgift. Du kan även förlänga lånetiden via internet om du behöver mer tid.
Många bibliotek har särskilda hörn för barn med lägre hyllor och färgglada böcker. Där kan man sitta och läsa i bekväma fåtöljer. Ibland arrangerar bibliotek sagostunder där en bibliotekarie läser högt.
Biblioteket är inte bara för böcker. Det är en plats att tänka, lära sig och vara lugn. Alla som bor i Sverige har rätt att använda sitt närmaste bibliotek.`,
    questions: {
      locate: [
        { q: 'Hur länge kan man låna en bok?', options: ['En vecka', 'Två veckor', 'Tre veckor', 'En månad'], correct: 2 },
        { q: 'Vad heter de som jobbar på biblioteket?', options: ['Biblioteksvakter', 'Bibliotekarier', 'Bokvakter', 'Läsombud'], correct: 1 },
        { q: 'Vad händer om man inte lämnar tillbaka boken i tid?', options: ['Bibliotekskortet dras in', 'Man kan få betala en avgift', 'Boken räknas som stulen', 'Man får inte låna igen'], correct: 1 }
      ],
      concept: { q: 'Vad är ett "bibliotekskort"?', options: ['En biljett till sagostunder', 'Ett kort som ger dig rätt att låna på biblioteket', 'En bokklubbsmedlemskap', 'En rabattkupong'], correct: 1 },
      inference: { q: 'Varför kan bibliotekarien beställa en bok från ett annat bibliotek?', options: ['Det är billigare', 'Alla bibliotek delar böcker med varandra så fler kan läsa dem', 'Det är ett sätt att tjäna pengar', 'Boken finns bara i en stad'], correct: 1 },
      summaries: {
        bad: 'På biblioteket kan man låna böcker.',
        medium: 'Texten handlar om biblioteket – vad man kan låna, hur länge och vilka som arbetar där. Det finns barnhörn och sagostunder.',
        good: 'Texten berättar att biblioteket är gratis för alla med bibliotekskort. Man kan låna böcker, filmer och musik i tre veckor. Bibliotekarier hjälper till och kan beställa böcker från andra bibliotek. Barn har egna hörn med lägre hyllor och sagostunder. Texten poängterar att biblioteket är en plats att tänka och lära sig, öppen för alla i Sverige.'
      }
    }
  },

  {
    id: 'facts_fire',
    type: 'factual',
    title: 'Brandkåren',
    text: `Brandkåren är en organisation som räddar människor och byggnader vid bränder och olyckor. I Sverige finns det brandstationer i nästan varje stad och by.
Brandmännen och brandkvinnorna, som kallas brandmän, tränar varje dag. De övar på att släcka bränder, klippa upp bilar och rädda människor som fastnat. Träningen kräver styrka och snabbhet.
Brandfordon kallas brandbil eller brandbilstransport. Den röda brandbilen har en lång stege som kan nå upp till höga våningar. Den har också vattentankar, slangar och specialutrustning.
När larmet går måste brandmännen vara redo på 90 sekunder. Det är en av de snabbaste insatserna av alla nödetatenser i Sverige.
Brandmännen bär skyddskläder av specialmaterial som tål värme och eld. De bär också andningsapparater för att kunna andas inne i rökfyllda rum.
Att förebygga bränder är också brandkårens uppgift. De besöker skolor och berättar om brandsäkerhet. Hemma bör man ha en fungerande brandvarnare och veta var närmaste brandsläckare finns.
Om det börjar brinna ska man ringa 112 direkt och komma ut ur byggnaden. Man ska inte försöka släcka stora bränder själv.`,
    questions: {
      locate: [
        { q: 'Hur lång tid har brandmännen på sig att vara redo efter ett larm?', options: ['30 sekunder', '60 sekunder', '90 sekunder', '120 sekunder'], correct: 2 },
        { q: 'Vilket nummer ringer man om det börjar brinna?', options: ['110', '112', '114', '118'], correct: 1 },
        { q: 'Vad bär brandmännen för att kunna andas i rökfyllda rum?', options: ['Gasmask', 'Andningsapparat', 'Filtermask', 'Syrgastub'], correct: 1 }
      ],
      concept: { q: 'Vad menas med att "förebygga" bränder?', options: ['Att släcka bränder snabbt', 'Att hindra att bränder uppstår', 'Att reparera brandskador', 'Att träna brandmän'], correct: 1 },
      inference: { q: 'Varför bär brandmännen skyddskläder av specialmaterial?', options: ['För att se professionella ut', 'För att kläderna tål värme och skyddar dem i elden', 'Reglerna kräver det', 'Kläderna är vattentäta'], correct: 1 },
      summaries: {
        bad: 'Brandmän släcker bränder.',
        medium: 'Texten handlar om brandkåren – vad brandmän gör, vilka fordon de har och hur man ska agera vid brand.',
        good: 'Texten beskriver brandkåren och brandmännes arbete: de tränar dagligen på att släcka bränder och rädda människor. De har 90 sekunder på sig att vara redo efter larm. De bär värmeskyddande kläder och andningsapparater. Brandkåren förebygger också bränder via skolbesök. Vid brand ska man ringa 112 och lämna byggnaden – aldrig försöka släcka stora bränder själv.'
      }
    }
  },

  {
    id: 'facts_plants',
    type: 'factual',
    title: 'Hur växter växer',
    text: `Växter behöver tre saker för att växa: vatten, ljus och näring från jordens. Utan något av dessa stannar växten och kan dö.
En växt börjar som ett frö. Fröet läggs i jord och när det får vatten och värme börjar det gro. Ur fröet växer en liten planta med ett par blad.
Bladen är växtens fabrik. Genom en process som kallas fotosyntesen tar bladen upp solljus och koldioxid från luften. Sedan använder växten detta för att tillverka socker – som är växtens mat.
Rötterna är växtens sugkoppar. De växer ner i jordens och suger upp vatten och mineraler. Rötterna håller också fast växten i marken så att den inte blåser omkull.
Stammen är växtens transport. Den för vatten och näring från rötterna upp till bladen. Hos ett träd är stammen mycket tjock och stark och kallas ved.
När en blomma öppnar sig kan insekter komma och hämta nektar. Samtidigt bär de med sig pollen från blomma till blomma. Det kallas pollinering och gör att växten kan bilda frön. Fröna sprids med vinden, vatten eller djur – och en ny växt börjar sin resa.`,
    questions: {
      locate: [
        { q: 'Vad tre saker behöver växter för att växa?', options: ['Vatten, luft och näring', 'Vatten, ljus och näring', 'Ljus, luft och mineraler', 'Vatten, sol och koldioxid'], correct: 1 },
        { q: 'Vad kallas det när insekter bär pollen från blomma till blomma?', options: ['Spridning', 'Fotosyntesen', 'Pollinering', 'Groddning'], correct: 2 },
        { q: 'Vad kallas trädens tjocka stam?', options: ['Bark', 'Näring', 'Ved', 'Kärna'], correct: 2 }
      ],
      concept: { q: 'Vad är "fotosyntesen"?', options: ['Hur rötterna suger upp vatten', 'Hur bladen använder solljus och koldioxid för att göra mat', 'Hur blomman lockar insekter', 'Hur fröet gror'], correct: 1 },
      inference: { q: 'Varför är pollinering viktigt för växterna?', options: ['Det ger växterna vatten', 'Det gör att växterna kan bilda frön och föröka sig', 'Det ger växterna socker', 'Det skyddar bladen'], correct: 1 },
      summaries: {
        bad: 'Växter behöver vatten och sol.',
        medium: 'Texten handlar om hur växter växer – från frö till blomma. Rötter suger upp vatten, blad gör mat via fotosyntesen.',
        good: 'Texten förklarar växternas livscykel: ett frö gror när det får vatten och värme. Bladen gör mat via fotosyntesen med hjälp av solljus och koldioxid. Rötterna suger upp vatten och näring och håller fast växten. Stammen transporterar näring. Insekter pollinerar blommorna, vilket bildar frön som sprids – och cykeln börjar om.'
      }
    }
  }
];

/* Fixa årstidertexten (den har dubbel struktur) */
(function fixSeasonsText() {
  const t = FACTUAL_TEXTS.find(t => t.id === 'facts_seasons');
  if (t && t.questions_obj) {
    t.questions = t.questions_obj;
    delete t.questions_obj;
    delete t.locateIdx;
  }
})();

/* ── STÖDORD I MENING (Kat 11) ───────────────────────────── */
const WORD_IN_SENTENCE_POOL = [
  {
    word: 'fotgängare',
    sentences: [
      'En fotgängare är en person som går till fots på trottoaren.',
      'Fotgängaren cyklade snabbt förbi skolan.',
      'Pappa parkerade fotgängaren i garaget.'
    ],
    correct: 0
  },
  {
    word: 'cykelhjälm',
    sentences: [
      'Cykelhjälmen hällde vatten på blommorna.',
      'Hon hade på sig en cykelhjälm för att skydda huvudet.',
      'Cykelhjälmen körde förbi på motorvägen.'
    ],
    correct: 1
  },
  {
    word: 'trottoar',
    sentences: [
      'Trottoaren seglade ut på havet.',
      'Barnen spelade fotboll på trottoaren mitt i gatan.',
      'Vi gick på trottoaren längs gatan för att hålla oss borta från bilarna.'
    ],
    correct: 2
  },
  {
    word: 'avdunsta',
    sentences: [
      'Vattnet i pölen börjar avdunsta när solen skiner starkt.',
      'Molnen avdunstar ner i sjön på vintern.',
      'Is avdunstar direkt till is utan att smälta.'
    ],
    correct: 0
  },
  {
    word: 'skelett',
    sentences: [
      'Skelettet är kroppens inre ram som ger oss form och stöd.',
      'Vi drack skelettet till frukost med en sked.',
      'Skelettet blåste bort i stormen.'
    ],
    correct: 0
  },
  {
    word: 'bibliotekarie',
    sentences: [
      'Bibliotekarien körde brandbilen till olyckan.',
      'Bibliotekarien hjälpte mig hitta en bok om rymden.',
      'Vi köpte en bibliotekarie i affären för tio kronor.'
    ],
    correct: 1
  },
  {
    word: 'skörd',
    sentences: [
      'Bonden samlade in sin skörd av morötter och potatis på hösten.',
      'Skörden simmar i havet utanför Sverige.',
      'Vi lade skörden i fickan och gick hem.'
    ],
    correct: 0
  },
  {
    word: 'pollinering',
    sentences: [
      'Pollineringen sjunger i träden på morgonen.',
      'Utan pollinering kan blommorna inte bilda frön.',
      'Bonden använde pollinering för att skörda vete.'
    ],
    correct: 1
  },
  {
    word: 'brandvarnare',
    sentences: [
      'Brandvarnaren simmar i sjön om sommaren.',
      'Hemma bör man ha en fungerande brandvarnare som larmar vid rök.',
      'Brandvarnaren åt upp all mat i köket.'
    ],
    correct: 1
  },
  {
    word: 'rävlya',
    sentences: [
      'Räven sover och föder sina ungar i en rävlya under marken.',
      'Vi åt frukost i rävlyan vid havet.',
      'Rävlyan flög högt över skogen.'
    ],
    correct: 0
  }
];

/* ── STAVNING & INTERPUNKTION (Kat 12) ──────────────────── */
const SPELLING_POOL = [
  {
    correct: 'Erik gick till skolan med sin ryggsäck.',
    wrong: [
      'erik gick till skolan med sin ryggsäck.',
      'Erik gick till skolan med sin ryggsäck',
      'Erik gick till Skolan med sin ryggsäck.'
    ]
  },
  {
    correct: 'Hunden sprang snabbt genom parken.',
    wrong: [
      'hunden sprang snabbt genom parken.',
      'Hunden sprang snabbt genom parken',
      'Hunden sprang snabbt genum parken.'
    ]
  },
  {
    correct: 'Fröken Andersson läste en saga för klassen.',
    wrong: [
      'fröken Andersson läste en saga för klassen.',
      'Fröken Andersson läste en saga för klassen',
      'Fröken Andersson läste en saga för Klassen.'
    ]
  },
  {
    correct: 'Det regnade mycket under hela veckan.',
    wrong: [
      'det regnade mycket under hela veckan.',
      'Det regnade mycket under hela veckan',
      'Det rägnade mycket under hela veckan.'
    ]
  },
  {
    correct: 'Maja hittade en gammal karta i källaren.',
    wrong: [
      'maja hittade en gammal karta i källaren.',
      'Maja hittade en gammal karta i källaren',
      'Maja hittade en gammal karta i källaren!'
    ]
  },
  {
    correct: 'Solen skiner starkt på sommaren.',
    wrong: [
      'solen skiner starkt på sommaren.',
      'Solen skiner starkt på sommaren',
      'Solen skinner starkt på sommaren.'
    ]
  },
  {
    correct: 'Katten satt på taket och tittade ner.',
    wrong: [
      'katten satt på taket och tittade ner.',
      'Katten satt på taket och tittade ner',
      'Katten satt på Taket och tittade ner.'
    ]
  },
  {
    correct: 'Barnen lekte i trädgården efter middagen.',
    wrong: [
      'barnen lekte i trädgården efter middagen.',
      'Barnen lekte i trädgården efter middagen',
      'Barnen lekte i trädgården efter middagen?'
    ]
  }
];

/* ── SKRIVUPPGIFTER – BERÄTTANDE ─────────────────────────── */
const STORY_PROMPTS = [
  'Skriv en berättelse om en utflykt.',
  'Skriv en berättelse om ett djur som rymde.',
  'Skriv om en dag då något oväntat hände.',
  'Skriv om ett äventyr i skogen.',
  'Skriv om en resa du vill göra.',
  'Skriv om en gång du hjälpte någon.',
  'Skriv om den bästa dagen någonsin.',
  'Skriv om ett besök hos mormor eller morfar.',
  'Skriv om en hemlighet du hittat.',
  'Skriv om när du eller någon du känner var riktigt modig.'
];

/* ── SKRIVUPPGIFTER – FAKTATEXT MED STÖDORD ─────────────── */
const FACTS_PROMPTS = [
  {
    theme: 'Trafik',
    prompt: 'Skriv en faktatext om trafik.',
    words: ['cykla', 'gå', 'cyklist', 'fotgängare', 'cykelhjälm', 'trottoar', 'övergångsställe', 'trafikljus', 'broms', 'ringklocka', 'fordon', 'kontrollera']
  },
  {
    theme: 'Djur i skogen',
    prompt: 'Skriv en faktatext om djur i skogen.',
    words: ['älg', 'räv', 'hare', 'skog', 'bo', 'päls', 'vinter', 'spår', 'mat', 'natt', 'farlig', 'försiktig', 'tyst']
  },
  {
    theme: 'Vatten',
    prompt: 'Skriv en faktatext om vatten.',
    words: ['dricka', 'rent', 'kran', 'flod', 'hav', 'regn', 'moln', 'ånga', 'is', 'frysa', 'smälta', 'kretslopp', 'viktigt']
  },
  {
    theme: 'Rymden',
    prompt: 'Skriv en faktatext om rymden.',
    words: ['sol', 'måne', 'stjärna', 'planet', 'jord', 'rymd', 'astronaut', 'ljus', 'kretslopp', 'rymdstation', 'rotera', 'avstånd']
  },
  {
    theme: 'Kroppen',
    prompt: 'Skriv en faktatext om kroppen.',
    words: ['hjärta', 'lungor', 'skelett', 'muskler', 'hud', 'blod', 'syre', 'röra', 'sova', 'äta', 'dricka', 'organ']
  },
  {
    theme: 'Växter',
    prompt: 'Skriv en faktatext om hur växter växer.',
    words: ['frö', 'gro', 'rot', 'stam', 'blad', 'blomma', 'sol', 'vatten', 'jord', 'näring', 'fotosyntes', 'insekt', 'pollinering']
  },
  {
    theme: 'Brandkåren',
    prompt: 'Skriv en faktatext om brandkåren.',
    words: ['brand', 'brandman', 'brandbil', 'stege', 'vatten', 'larm', 'rädda', 'skyddskläder', '112', 'brandvarnare', 'farligt', 'hjälp']
  }
];
