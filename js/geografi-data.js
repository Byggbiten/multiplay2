/* ============================================================
   MULTIPLAY – Geografi: data för Sveriges landskap (window.GEO_DATA)
   GENERERAD – redigera inte för hand. Källan är:
     referens/landskap-laxbok.json            (ordningen norr till söder, landsdel, path-index i kartan)
     referens/sverige-landskap/landskap-fakta.json  (städer, blomma, djur, rang, "Visste du?", källor per fält)
     referens/sverige-landskap/bilder.json    (upphovsperson och licens per bild)
   Bilderna och kartan ligger i assets/geografi/sverige/. tests/geografi.test.mjs kontrollerar att
   den här filen stämmer med källan. Numren (nr) används bara internt (D33).
   ============================================================ */
'use strict';
(function () {
  const GEO_DATA = {
 "landskap": [
  {
   "nr": 1,
   "namn": "Lappland",
   "landsdel": "Norrland",
   "path": 1,
   "stad": [
    "Kiruna",
    "Gällivare"
   ],
   "blomma": "Fjällsippa",
   "djur": "Fjällräv",
   "yta_rang": 1,
   "invanare_rang": 21,
   "visste": [
    "Lappland är Sveriges största landskap. Det är ungefär en fjärdedel av hela Sverige.",
    "Sveriges högsta fjäll, Kebnekaise, ligger i Lappland."
   ],
   "bilder": {
    "vapen": "vapen/1-Lappland.svg",
    "blomma": "blommor/1-Lappland.jpg",
    "djur": "djur/1-Lappland.jpg"
   }
  },
  {
   "nr": 2,
   "namn": "Norrbotten",
   "landsdel": "Norrland",
   "path": 0,
   "stad": [
    "Luleå"
   ],
   "blomma": "Åkerbär",
   "djur": "Lavskrika",
   "yta_rang": 5,
   "invanare_rang": 14,
   "visste": [
    "Norrbotten fick sitt landskapsvapen 1995 – sist av alla Sveriges landskap.",
    "Norrbotten är det femte största landskapet till ytan."
   ],
   "bilder": {
    "vapen": "vapen/2-Norrbotten.svg",
    "blomma": "blommor/2-Norrbotten.jpg",
    "djur": "djur/2-Norrbotten.jpg"
   }
  },
  {
   "nr": 3,
   "namn": "Västerbotten",
   "landsdel": "Norrland",
   "path": 2,
   "stad": [
    "Umeå"
   ],
   "blomma": "Kung Karls spira",
   "djur": "Storspov",
   "yta_rang": 9,
   "invanare_rang": 12,
   "visste": [
    "Umeå i Västerbotten är den största staden i hela Norrland.",
    "Vid Norrforsen väster om Umeå finns hällristningar från stenåldern."
   ],
   "bilder": {
    "vapen": "vapen/3-Västerbotten.svg",
    "blomma": "blommor/3-Västerbotten.jpg",
    "djur": "djur/3-Västerbotten.jpg"
   }
  },
  {
   "nr": 4,
   "namn": "Ångermanland",
   "landsdel": "Norrland",
   "path": 20,
   "stad": [
    "Örnsköldsvik",
    "Härnösand"
   ],
   "blomma": "Styvmorsviol",
   "djur": "Bäver",
   "yta_rang": 6,
   "invanare_rang": 18,
   "visste": [
    "Ångermanlands vapen har tre laxar.",
    "Ångermanland är det sjätte största landskapet till ytan."
   ],
   "bilder": {
    "vapen": "vapen/4-Ångermanland.svg",
    "blomma": "blommor/4-Ångermanland.jpg",
    "djur": "djur/4-Ångermanland.jpg"
   }
  },
  {
   "nr": 5,
   "namn": "Jämtland",
   "landsdel": "Norrland",
   "path": 6,
   "stad": [
    "Östersund"
   ],
   "blomma": "Brunkulla",
   "djur": "Älg",
   "yta_rang": 2,
   "invanare_rang": 20,
   "visste": [
    "Jämtland är Sveriges näst största landskap till ytan.",
    "De flesta jämtar bor i trakten runt sjön Storsjön."
   ],
   "bilder": {
    "vapen": "vapen/5-Jämtland.svg",
    "blomma": "blommor/5-Jämtland.jpg",
    "djur": "djur/5-Jämtland.jpg"
   }
  },
  {
   "nr": 6,
   "namn": "Härjedalen",
   "landsdel": "Norrland",
   "path": 21,
   "stad": [
    "Sveg"
   ],
   "blomma": "Mosippa",
   "djur": "Brunbjörn",
   "yta_rang": 12,
   "invanare_rang": 25,
   "visste": [
    "Härjedalen har minst invånare av alla landskap – färre än 10 000.",
    "Härjedalen hörde förr till Norge. Det blev svenskt 1645."
   ],
   "bilder": {
    "vapen": "vapen/6-Härjedalen.svg",
    "blomma": "blommor/6-Härjedalen.jpg",
    "djur": "djur/6-Härjedalen.jpg"
   }
  },
  {
   "nr": 7,
   "namn": "Medelpad",
   "landsdel": "Norrland",
   "path": 22,
   "stad": [
    "Sundsvall"
   ],
   "blomma": "Gran",
   "djur": "Skogshare",
   "yta_rang": 17,
   "invanare_rang": 19,
   "visste": [
    "De två silvervita vågorna i Medelpads vapen är älvarna Indalsälven och Ljungan.",
    "Namnet Medelpad tros komma av gamla ord för \"i mitten\" och \"stig\" eller \"vattenväg\"."
   ],
   "bilder": {
    "vapen": "vapen/7-Medelpad.svg",
    "blomma": "blommor/7-Medelpad.jpg",
    "djur": "djur/7-Medelpad.jpg"
   }
  },
  {
   "nr": 8,
   "namn": "Hälsingland",
   "landsdel": "Norrland",
   "path": 23,
   "stad": [
    "Hudiksvall",
    "Bollnäs"
   ],
   "blomma": "Lin",
   "djur": "Lodjur",
   "yta_rang": 10,
   "invanare_rang": 17,
   "visste": [
    "Hälsingland fick först tall som landskapsblomma 1908 men ville hellre ha lin – och fick lin 1909.",
    "Hälsingland är det tionde största landskapet till ytan."
   ],
   "bilder": {
    "vapen": "vapen/8-Hälsingland.svg",
    "blomma": "blommor/8-Hälsingland.jpg",
    "djur": "djur/8-Hälsingland.jpg"
   }
  },
  {
   "nr": 9,
   "namn": "Dalarna",
   "landsdel": "Svealand",
   "path": 7,
   "stad": [
    "Borlänge",
    "Falun"
   ],
   "blomma": "Ängsklocka",
   "djur": "Berguv",
   "yta_rang": 4,
   "invanare_rang": 11,
   "visste": [
    "Dalarna är det fjärde största landskapet till ytan.",
    "Dalarnas största stad är Borlänge, men Falun är nästan lika stor."
   ],
   "bilder": {
    "vapen": "vapen/9-Dalarna.svg",
    "blomma": "blommor/9-Dalarna.jpg",
    "djur": "djur/9-Dalarna.jpg"
   }
  },
  {
   "nr": 10,
   "namn": "Gästrikland",
   "landsdel": "Norrland",
   "path": 8,
   "stad": [
    "Gävle"
   ],
   "blomma": "Liljekonvalj",
   "djur": "Tjäder",
   "yta_rang": 20,
   "invanare_rang": 16,
   "visste": [
    "Prinsessan Madeleine är hertiginna av Gästrikland – och av Hälsingland.",
    "Gävle i Gästrikland är den näst största staden i Norrland, efter Umeå."
   ],
   "bilder": {
    "vapen": "vapen/10-Gästrikland.svg",
    "blomma": "blommor/10-Gästrikland.jpg",
    "djur": "djur/10-Gästrikland.jpg"
   }
  },
  {
   "nr": 11,
   "namn": "Uppland",
   "landsdel": "Svealand",
   "path": 3,
   "stad": [
    "Stockholm",
    "Uppsala"
   ],
   "blomma": "Kungsängslilja",
   "djur": "Havsörn",
   "yta_rang": 11,
   "invanare_rang": 1,
   "visste": [
    "Uppland har flest invånare av alla Sveriges landskap.",
    "Sveriges huvudstad Stockholm är Upplands största stad."
   ],
   "bilder": {
    "vapen": "vapen/11-Uppland.svg",
    "blomma": "blommor/11-Uppland.jpg",
    "djur": "djur/11-Uppland.jpg"
   }
  },
  {
   "nr": 12,
   "namn": "Västmanland",
   "landsdel": "Svealand",
   "path": 5,
   "stad": [
    "Västerås"
   ],
   "blomma": "Mistel",
   "djur": "Rådjur",
   "yta_rang": 16,
   "invanare_rang": 9,
   "visste": [
    "Namnet Västmanland betyder \"västmännens land\". Det jämförs med Uppland, som ligger österut.",
    "Västmanland är det nionde folkrikaste landskapet."
   ],
   "bilder": {
    "vapen": "vapen/12-Västmanland.svg",
    "blomma": "blommor/12-Västmanland.jpg",
    "djur": "djur/12-Västmanland.jpg"
   }
  },
  {
   "nr": 13,
   "namn": "Värmland",
   "landsdel": "Svealand",
   "path": 10,
   "stad": [
    "Karlstad"
   ],
   "blomma": "Skogsstjärna",
   "djur": "Varg",
   "yta_rang": 7,
   "invanare_rang": 8,
   "visste": [
    "Värmland räknades förr till Götaland. Sedan 1815 hör det till Svealand.",
    "Värmland är det sjunde största landskapet till ytan."
   ],
   "bilder": {
    "vapen": "vapen/13-Värmland.svg",
    "blomma": "blommor/13-Värmland.jpg",
    "djur": "djur/13-Värmland.jpg"
   }
  },
  {
   "nr": 14,
   "namn": "Närke",
   "landsdel": "Svealand",
   "path": 9,
   "stad": [
    "Örebro"
   ],
   "blomma": "Gullviva",
   "djur": "Hasselmus",
   "yta_rang": 21,
   "invanare_rang": 13,
   "visste": [
    "Närke är det minsta landskapet i Svealand till ytan.",
    "Förr stavades Närke \"Nerike\". Det gamla namnet finns kvar i tidningen Nerikes Allehanda."
   ],
   "bilder": {
    "vapen": "vapen/14-Närke.svg",
    "blomma": "blommor/14-Närke.jpg",
    "djur": "djur/14-Närke.jpg"
   }
  },
  {
   "nr": 15,
   "namn": "Södermanland",
   "landsdel": "Svealand",
   "path": 4,
   "stad": [
    "Eskilstuna",
    "Södertälje"
   ],
   "blomma": "Vit näckros",
   "djur": "Fiskgjuse",
   "yta_rang": 15,
   "invanare_rang": 4,
   "visste": [
    "Södermanland betyder \"landet söder om Mälaren\".",
    "Södermanland kallas också Sörmland."
   ],
   "bilder": {
    "vapen": "vapen/15-Södermanland.svg",
    "blomma": "blommor/15-Södermanland.jpg",
    "djur": "djur/15-Södermanland.jpg"
   }
  },
  {
   "nr": 16,
   "namn": "Östergötland",
   "landsdel": "Götaland",
   "path": 24,
   "stad": [
    "Linköping",
    "Norrköping"
   ],
   "blomma": "Blåklint",
   "djur": "Knölsvan",
   "yta_rang": 14,
   "invanare_rang": 6,
   "visste": [
    "Vid Motala har man hittat spår av människor från mer än 8 000 år sedan.",
    "Östergötland är det sjätte folkrikaste landskapet."
   ],
   "bilder": {
    "vapen": "vapen/16-Östergötland.svg",
    "blomma": "blommor/16-Östergötland.jpg",
    "djur": "djur/16-Östergötland.jpg"
   }
  },
  {
   "nr": 17,
   "namn": "Dalsland",
   "landsdel": "Götaland",
   "path": 12,
   "stad": [
    "Åmål"
   ],
   "blomma": "Förgätmigej",
   "djur": "Korp",
   "yta_rang": 22,
   "invanare_rang": 23,
   "visste": [
    "Dalsland kallas ibland \"ett Sverige i miniatyr\".",
    "Dalsland har näst minst invånare av fastlandets landskap, efter Härjedalen."
   ],
   "bilder": {
    "vapen": "vapen/17-Dalsland.svg",
    "blomma": "blommor/17-Dalsland.jpg",
    "djur": "djur/17-Dalsland.jpg"
   }
  },
  {
   "nr": 18,
   "namn": "Bohuslän",
   "landsdel": "Götaland",
   "path": 13,
   "stad": [
    "Uddevalla",
    "Kungälv"
   ],
   "blomma": "Vildkaprifol",
   "djur": "Knubbsäl",
   "yta_rang": 19,
   "invanare_rang": 10,
   "visste": [
    "Bohuslän är Sveriges västligaste landskap.",
    "Bohuslän har fått sitt namn efter Bohus fästning vid Kungälv."
   ],
   "bilder": {
    "vapen": "vapen/18-Bohuslän.svg",
    "blomma": "blommor/18-Bohuslän.jpg",
    "djur": "djur/18-Bohuslän.jpg"
   }
  },
  {
   "nr": 19,
   "namn": "Västergötland",
   "landsdel": "Götaland",
   "path": 11,
   "stad": [
    "Göteborg",
    "Borås"
   ],
   "blomma": "Ljung",
   "djur": "Trana",
   "yta_rang": 8,
   "invanare_rang": 3,
   "visste": [
    "Västergötland har tredje flest invånare av alla landskap.",
    "Göta älv är Västergötlands största vattendrag."
   ],
   "bilder": {
    "vapen": "vapen/19-Västergötland.svg",
    "blomma": "blommor/19-Västergötland.jpg",
    "djur": "djur/19-Västergötland.jpg"
   }
  },
  {
   "nr": 20,
   "namn": "Halland",
   "landsdel": "Götaland",
   "path": 19,
   "stad": [
    "Halmstad",
    "Varberg"
   ],
   "blomma": "Hårginst",
   "djur": "Lax",
   "yta_rang": 18,
   "invanare_rang": 7,
   "visste": [
    "I Halland finns bara fyra runstenar, alla nära Halmstad.",
    "Halland är det sjunde folkrikaste landskapet."
   ],
   "bilder": {
    "vapen": "vapen/20-Halland.svg",
    "blomma": "blommor/20-Halland.jpg",
    "djur": "djur/20-Halland.jpg"
   }
  },
  {
   "nr": 21,
   "namn": "Småland",
   "landsdel": "Götaland",
   "path": 15,
   "stad": [
    "Jönköping",
    "Växjö"
   ],
   "blomma": "Linnea",
   "djur": "Utter",
   "yta_rang": 3,
   "invanare_rang": 5,
   "visste": [
    "Författaren Astrid Lindgren kom från Vimmerby i Småland.",
    "Småland är det tredje största landskapet till ytan."
   ],
   "bilder": {
    "vapen": "vapen/21-Småland.svg",
    "blomma": "blommor/21-Småland.jpg",
    "djur": "djur/21-Småland.jpg"
   }
  },
  {
   "nr": 22,
   "namn": "Gotland",
   "landsdel": "Götaland",
   "path": 14,
   "stad": [
    "Visby"
   ],
   "blomma": "Murgröna",
   "djur": "Igelkott",
   "yta_rang": 23,
   "invanare_rang": 22,
   "visste": [
    "Gotland är Sveriges största ö.",
    "Gotlands högsta punkt, Lojsta hed, är bara 82 meter över havet."
   ],
   "bilder": {
    "vapen": "vapen/22-Gotland.svg",
    "blomma": "blommor/22-Gotland.jpg",
    "djur": "djur/22-Gotland.jpg"
   }
  },
  {
   "nr": 23,
   "namn": "Öland",
   "landsdel": "Götaland",
   "path": 16,
   "stad": [
    "Borgholm",
    "Färjestaden"
   ],
   "blomma": "Ölandssolvända",
   "djur": "Näktergal",
   "yta_rang": 25,
   "invanare_rang": 24,
   "visste": [
    "Öland är Sveriges minsta landskap och näst största ö.",
    "Sedan 1972 går Ölandsbron mellan Öland och fastlandet."
   ],
   "bilder": {
    "vapen": "vapen/23-Öland.svg",
    "blomma": "blommor/23-Öland.jpg",
    "djur": "djur/23-Öland.jpg"
   }
  },
  {
   "nr": 24,
   "namn": "Blekinge",
   "landsdel": "Götaland",
   "path": 17,
   "stad": [
    "Karlskrona",
    "Karlshamn"
   ],
   "blomma": "Ek",
   "djur": "Ekoxe",
   "yta_rang": 24,
   "invanare_rang": 15,
   "visste": [
    "Blekinge kallas ofta \"Sveriges trädgård\".",
    "Blekinge är det minsta landskapet på fastlandet. Bara Öland är mindre."
   ],
   "bilder": {
    "vapen": "vapen/24-Blekinge.svg",
    "blomma": "blommor/24-Blekinge.jpg",
    "djur": "djur/24-Blekinge.jpg"
   }
  },
  {
   "nr": 25,
   "namn": "Skåne",
   "landsdel": "Götaland",
   "path": 18,
   "stad": [
    "Malmö",
    "Helsingborg"
   ],
   "blomma": "Prästkrage",
   "djur": "Kronhjort",
   "yta_rang": 13,
   "invanare_rang": 2,
   "visste": [
    "Skåne är Sveriges sydligaste landskap.",
    "Malmö i Skåne är Sveriges tredje största stad."
   ],
   "bilder": {
    "vapen": "vapen/25-Skåne.svg",
    "blomma": "blommor/25-Skåne.jpg",
    "djur": "djur/25-Skåne.jpg"
   }
  }
 ],
 "bilder": [
  {
   "fil": "vapen/1-Lappland.svg",
   "nr": 1,
   "landskap": "Lappland",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Lapplands_vapen_.svg"
  },
  {
   "fil": "vapen/2-Norrbotten.svg",
   "nr": 2,
   "landskap": "Norrbotten",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Norrbottens_vapen.svg"
  },
  {
   "fil": "vapen/3-Västerbotten.svg",
   "nr": 3,
   "landskap": "Västerbotten",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:V%C3%A4sterbottens_vapen.svg"
  },
  {
   "fil": "vapen/4-Ångermanland.svg",
   "nr": 4,
   "landskap": "Ångermanland",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:%C3%85ngermanlands_vapen.svg"
  },
  {
   "fil": "vapen/5-Jämtland.svg",
   "nr": 5,
   "landskap": "Jämtland",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:J%C3%A4mtlands_vapen.svg"
  },
  {
   "fil": "vapen/6-Härjedalen.svg",
   "nr": 6,
   "landskap": "Härjedalen",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:H%C3%A4rjedalens_vapen.svg"
  },
  {
   "fil": "vapen/7-Medelpad.svg",
   "nr": 7,
   "landskap": "Medelpad",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Medelpads_vapen.svg"
  },
  {
   "fil": "vapen/8-Hälsingland.svg",
   "nr": 8,
   "landskap": "Hälsingland",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:H%C3%A4lsinglands_vapen.svg"
  },
  {
   "fil": "vapen/9-Dalarna.svg",
   "nr": 9,
   "landskap": "Dalarna",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Dalarnas_vapen.svg"
  },
  {
   "fil": "vapen/10-Gästrikland.svg",
   "nr": 10,
   "landskap": "Gästrikland",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:G%C3%A4strikland_vapen_.svg"
  },
  {
   "fil": "vapen/11-Uppland.svg",
   "nr": 11,
   "landskap": "Uppland",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Upplands_vapen.svg"
  },
  {
   "fil": "vapen/12-Västmanland.svg",
   "nr": 12,
   "landskap": "Västmanland",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:V%C3%A4stmanlands_vapen.svg"
  },
  {
   "fil": "vapen/13-Värmland.svg",
   "nr": 13,
   "landskap": "Värmland",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:V%C3%A4rmlands_vapen.svg"
  },
  {
   "fil": "vapen/14-Närke.svg",
   "nr": 14,
   "landskap": "Närke",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:N%C3%A4rkes_vapen.svg"
  },
  {
   "fil": "vapen/15-Södermanland.svg",
   "nr": 15,
   "landskap": "Södermanland",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:S%C3%B6dermanlands_vapen.svg"
  },
  {
   "fil": "vapen/16-Östergötland.svg",
   "nr": 16,
   "landskap": "Östergötland",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:%C3%96sterg%C3%B6tland_vapen_.svg"
  },
  {
   "fil": "vapen/17-Dalsland.svg",
   "nr": 17,
   "landskap": "Dalsland",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Dalslands_vapen.svg"
  },
  {
   "fil": "vapen/18-Bohuslän.svg",
   "nr": 18,
   "landskap": "Bohuslän",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Bohusl%C3%A4ns_vapen.svg"
  },
  {
   "fil": "vapen/19-Västergötland.svg",
   "nr": 19,
   "landskap": "Västergötland",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:V%C3%A4sterg%C3%B6tlands_vapen.svg"
  },
  {
   "fil": "vapen/20-Halland.svg",
   "nr": 20,
   "landskap": "Halland",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Hallands_vapen.svg"
  },
  {
   "fil": "vapen/21-Småland.svg",
   "nr": 21,
   "landskap": "Småland",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Sm%C3%A5lands_vapen.svg"
  },
  {
   "fil": "vapen/22-Gotland.svg",
   "nr": 22,
   "landskap": "Gotland",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Gotlands_vapen.svg"
  },
  {
   "fil": "vapen/23-Öland.svg",
   "nr": 23,
   "landskap": "Öland",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:%C3%96lands_vapen.svg"
  },
  {
   "fil": "vapen/24-Blekinge.svg",
   "nr": 24,
   "landskap": "Blekinge",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Blekinges_vapen.svg"
  },
  {
   "fil": "vapen/25-Skåne.svg",
   "nr": 25,
   "landskap": "Skåne",
   "typ": "vapen",
   "upphov": "Leonid 2",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Sk%C3%A5nes_vapen.svg"
  },
  {
   "fil": "blommor/1-Lappland.jpg",
   "nr": 1,
   "landskap": "Lappland",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:305_Dryas_octopetala.jpg"
  },
  {
   "fil": "blommor/2-Norrbotten.jpg",
   "nr": 2,
   "landskap": "Norrbotten",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:310_Rubus_arcticus.jpg"
  },
  {
   "fil": "blommor/3-Västerbotten.jpg",
   "nr": 3,
   "landskap": "Västerbotten",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:570_Pedicularis_sceptrum-carolinum.jpg"
  },
  {
   "fil": "blommor/4-Ångermanland.jpg",
   "nr": 4,
   "landskap": "Ångermanland",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Viola_tricolor_styvmorsviol.jpg"
  },
  {
   "fil": "blommor/5-Jämtland.jpg",
   "nr": 5,
   "landskap": "Jämtland",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:407_Nigritella_nigra.jpg"
  },
  {
   "fil": "blommor/6-Härjedalen.jpg",
   "nr": 6,
   "landskap": "Härjedalen",
   "typ": "blomma",
   "upphov": "Flora Danica (1761–1883) – scientific and artistic contributors: Botanical authors: Jens Wilken Hornemann (1770–1841) Johan Martin Christian Lange (1818–1898) Frederik Michael Liebmann (1813–1856) Otto Frederik Müller (1730–1784) Georg Christian Oeder (1728–1791) Martin Vahl (1749–1804) Artistic contributors: Michael Rössler – chief artist (fascicles 1–3) Christian F. Müller – artist and engraver Johan Adolph Kittendorff – engraver Johan Theodor Bayer – artist Martin Rössler – artist Christian Gottlieb Kratzenstein – artist Various anonymous colourists and assistants",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Flora_Danica_Hft_01_Tab_0029.tif"
  },
  {
   "fil": "blommor/7-Medelpad.jpg",
   "nr": 7,
   "landskap": "Medelpad",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:495_Picea_abies.jpg"
  },
  {
   "fil": "blommor/8-Hälsingland.jpg",
   "nr": 8,
   "landskap": "Hälsingland",
   "typ": "blomma",
   "upphov": "Amédée Masclef",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:56_Linum_usitatissimum_L.jpg"
  },
  {
   "fil": "blommor/9-Dalarna.jpg",
   "nr": 9,
   "landskap": "Dalarna",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:562_Campanula_patula.jpg"
  },
  {
   "fil": "blommor/10-Gästrikland.jpg",
   "nr": 10,
   "landskap": "Gästrikland",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:390_Convallaria_majalis.jpg"
  },
  {
   "fil": "blommor/11-Uppland.jpg",
   "nr": 11,
   "landskap": "Uppland",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:384_Fritillaria_meleagris.jpg"
  },
  {
   "fil": "blommor/12-Västmanland.jpg",
   "nr": 12,
   "landskap": "Västmanland",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:363_Viscum_album.jpg"
  },
  {
   "fil": "blommor/13-Värmland.jpg",
   "nr": 13,
   "landskap": "Värmland",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:134_Trientalis_europaea.jpg"
  },
  {
   "fil": "blommor/14-Närke.jpg",
   "nr": 14,
   "landskap": "Närke",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:136_Primula_veris.jpg"
  },
  {
   "fil": "blommor/15-Södermanland.jpg",
   "nr": 15,
   "landskap": "Södermanland",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Nymphaea_alba_vit_n%C3%A4ckros.jpb.jpg"
  },
  {
   "fil": "blommor/16-Östergötland.jpg",
   "nr": 16,
   "landskap": "Östergötland",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:7_Centaurea_cyanus.jpg"
  },
  {
   "fil": "blommor/17-Dalsland.jpg",
   "nr": 17,
   "landskap": "Dalsland",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:81_Myosotis_scorpioides.jpg"
  },
  {
   "fil": "blommor/18-Bohuslän.jpg",
   "nr": 18,
   "landskap": "Bohuslän",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:66_Lonicera_periclymenum.jpg"
  },
  {
   "fil": "blommor/19-Västergötland.jpg",
   "nr": 19,
   "landskap": "Västergötland",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:147_Calluna_vulgaris.jpg"
  },
  {
   "fil": "blommor/20-Halland.jpg",
   "nr": 20,
   "landskap": "Halland",
   "typ": "blomma",
   "upphov": "Jan Kops",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Genista_pilosa_%E2%80%94_Flora_Batava_%E2%80%94_Volume_v7.jpg"
  },
  {
   "fil": "blommor/21-Småland.jpg",
   "nr": 21,
   "landskap": "Småland",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Linnaea_borealis_by_Lindman.jpg"
  },
  {
   "fil": "blommor/22-Gotland.jpg",
   "nr": 22,
   "landskap": "Gotland",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:249_Hedera_helix.jpg"
  },
  {
   "fil": "blommor/23-Öland.jpg",
   "nr": 23,
   "landskap": "Öland",
   "typ": "blomma",
   "upphov": "Frederik Michael Liebmann (1813-1856) (ed.). Original uploader was Wonne at nl.wikipedia",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Helianthemum_oelandicum.jpg"
  },
  {
   "fil": "blommor/24-Blekinge.jpg",
   "nr": 24,
   "landskap": "Blekinge",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:368_Quercus_robur.jpg"
  },
  {
   "fil": "blommor/25-Skåne.jpg",
   "nr": 25,
   "landskap": "Skåne",
   "typ": "blomma",
   "upphov": "Carl Axel Magnus Lindman",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:10_Chrysanthemum_leucanthemum.jpg"
  },
  {
   "fil": "djur/1-Lappland.jpg",
   "nr": 1,
   "landskap": "Lappland",
   "typ": "djur",
   "upphov": "Michael Haferkamp",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Arcticfox-3.jpg"
  },
  {
   "fil": "djur/2-Norrbotten.jpg",
   "nr": 2,
   "landskap": "Norrbotten",
   "typ": "djur",
   "upphov": "Ron Knight from Seaford, East Sussex, United Kingdom",
   "licens": "CC BY 2.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Siberian_Jay_(Perisoreus_infaustus)_(13667845783).jpg"
  },
  {
   "fil": "djur/3-Västerbotten.jpg",
   "nr": 3,
   "landskap": "Västerbotten",
   "typ": "djur",
   "upphov": "Ken Billington",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Curlew_(Numenius_arquata)_(12).jpg"
  },
  {
   "fil": "djur/4-Ångermanland.jpg",
   "nr": 4,
   "landskap": "Ångermanland",
   "typ": "djur",
   "upphov": "Per Harald Olsen",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Beaver_pho34.jpg"
  },
  {
   "fil": "djur/5-Jämtland.jpg",
   "nr": 5,
   "landskap": "Jämtland",
   "typ": "djur",
   "upphov": "C. Schultz",
   "licens": "CC BY 2.5",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Moose-Gustav.jpg"
  },
  {
   "fil": "djur/6-Härjedalen.jpg",
   "nr": 6,
   "landskap": "Härjedalen",
   "typ": "djur",
   "upphov": "Malene Thyssen",
   "licens": "CC BY 2.5",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Brown_bear_(Ursus_arctos_arctos)_running.jpg"
  },
  {
   "fil": "djur/7-Medelpad.jpg",
   "nr": 7,
   "landskap": "Medelpad",
   "typ": "djur",
   "upphov": "Правительство Волгоградской области",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Lepus_timidus_in_Volgograd_Oblast.jpg"
  },
  {
   "fil": "djur/8-Hälsingland.jpg",
   "nr": 8,
   "landskap": "Hälsingland",
   "typ": "djur",
   "upphov": "Bernard Landgraf (User:Baerni)",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Lynx_lynx_poing.jpg"
  },
  {
   "fil": "djur/9-Dalarna.jpg",
   "nr": 9,
   "landskap": "Dalarna",
   "typ": "djur",
   "upphov": "Photograph: Softeis",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Uhu-muc.jpg"
  },
  {
   "fil": "djur/10-Gästrikland.jpg",
   "nr": 10,
   "landskap": "Gästrikland",
   "typ": "djur",
   "upphov": "David Palmer",
   "licens": "CC BY 2.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:David_Palmer_Capercaillie.jpg"
  },
  {
   "fil": "djur/11-Uppland.jpg",
   "nr": 11,
   "landskap": "Uppland",
   "typ": "djur",
   "upphov": "Idalia Skalska",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Bielik1.jpg"
  },
  {
   "fil": "djur/12-Västmanland.jpg",
   "nr": 12,
   "landskap": "Västmanland",
   "typ": "djur",
   "upphov": "Marek Szczepanek",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Capreolus_capreolus_(Marek_Szczepanek).jpg"
  },
  {
   "fil": "djur/13-Värmland.jpg",
   "nr": 13,
   "landskap": "Värmland",
   "typ": "djur",
   "upphov": "Gary Kramer",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Front_view_of_a_resting_Canis_lupus_ssp.jpg"
  },
  {
   "fil": "djur/14-Närke.jpg",
   "nr": 14,
   "landskap": "Närke",
   "typ": "djur",
   "upphov": "Danielle Schwarz",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Haselmaus.jpg"
  },
  {
   "fil": "djur/15-Södermanland.jpg",
   "nr": 15,
   "landskap": "Södermanland",
   "typ": "djur",
   "upphov": "NASA",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:OspreyNASA.jpg"
  },
  {
   "fil": "djur/16-Östergötland.jpg",
   "nr": 16,
   "landskap": "Östergötland",
   "typ": "djur",
   "upphov": "Marek Szczepanek",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Cygnus_olor_2_(Marek_Szczepanek).jpg"
  },
  {
   "fil": "djur/17-Dalsland.jpg",
   "nr": 17,
   "landskap": "Dalsland",
   "typ": "djur",
   "upphov": "Diliff",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Corvus_corax_(Common_Raven),_Yosemite_NP,_CA,_US_-_Diliff_(cropped).jpg"
  },
  {
   "fil": "djur/18-Bohuslän.jpg",
   "nr": 18,
   "landskap": "Bohuslän",
   "typ": "djur",
   "upphov": "Marcel Burkhard",
   "licens": "CC BY-SA 2.0 de",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Seehund.jpg"
  },
  {
   "fil": "djur/19-Västergötland.jpg",
   "nr": 19,
   "landskap": "Västergötland",
   "typ": "djur",
   "upphov": "Marek Szczepanek",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Grus_grus_5_(Marek_Szczepanek).jpg"
  },
  {
   "fil": "djur/20-Halland.jpg",
   "nr": 20,
   "landskap": "Halland",
   "typ": "djur",
   "upphov": "Hartley, William W.",
   "licens": "Public domain",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Atlantischer_Lachs.jpg"
  },
  {
   "fil": "djur/21-Småland.jpg",
   "nr": 21,
   "landskap": "Småland",
   "typ": "djur",
   "upphov": "Mark Ehlers",
   "licens": "CC BY-SA 2.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Otter_frei.jpg"
  },
  {
   "fil": "djur/22-Gotland.jpg",
   "nr": 22,
   "landskap": "Gotland",
   "typ": "djur",
   "upphov": "Jörg Hempel",
   "licens": "CC BY-SA 2.0 de",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Erinaceus_europaeus_LC0119.jpg"
  },
  {
   "fil": "djur/23-Öland.jpg",
   "nr": 23,
   "landskap": "Öland",
   "typ": "djur",
   "upphov": "Dion Art",
   "licens": "CC BY-SA 4.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:%D0%92%D0%BE%D1%81%D1%82%D0%BE%D1%87%D0%BD%D1%8B%D0%B9_%D1%81%D0%BE%D0%BB%D0%BE%D0%B2%D0%B5%D0%B9_(Luscinia_luscinia),_%D0%91%D0%B8%D1%82%D1%86%D0%B5%D0%B2%D1%81%D0%BA%D0%B8%D0%B9_%D0%BB%D0%B5%D1%81.jpg"
  },
  {
   "fil": "djur/24-Blekinge.jpg",
   "nr": 24,
   "landskap": "Blekinge",
   "typ": "djur",
   "upphov": "J.F. Gaffard",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:Lucanus_cervus.jpg"
  },
  {
   "fil": "djur/25-Skåne.jpg",
   "nr": 25,
   "landskap": "Skåne",
   "typ": "djur",
   "upphov": "derivative work: Massimo Catarinella (talk) Red_deer_stag.jpg: Mehmet Karatay",
   "licens": "CC BY-SA 3.0",
   "kallsida": "https://commons.wikimedia.org/wiki/File:RedDeerStag.jpg"
  }
 ]
};
  if (typeof window !== 'undefined') window.GEO_DATA = GEO_DATA;
  if (typeof module !== 'undefined' && module.exports) module.exports = GEO_DATA;
})();
