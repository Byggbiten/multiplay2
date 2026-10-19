# referens/sverige-landskap/ — faktaunderlag för Sveriges landskap

Underlag för Geografi → Sverige → Sveriges landskap (D22, D24–D27; D27: djur och blommor visas som bild + text). Framtaget 2026-10-19. Ingen appkod använder
filerna ännu. Städerna väntar på Dennis godkännande (D25).

| Fil / mapp | Vad |
|---|---|
| `landskap-fakta.json` | En post per landskap, nyckel = läxbokens nummer 1–25 (`../landskap-laxbok.json`). Fält: `nr`, `namn`, `landsdel`, `storsta_stad`, `ocksa_stor_stad`, `motivering_stad`, `blomma` (+ `blomma_not`), `djur`, `yta_km2`, `yta_rang`, `invanare` (antal + datum), `invanare_rang`, `visste_du` (2 fakta med egen källa var), `bilder` (sökvägar), `kallor` (URL + hämtdatum per fält). |
| `vapen/<nr>-<namn>.svg` | De 25 landskapsvapnen (sköldarna, utan hertigkrona) som SVG. |
| `blommor/<nr>-<namn>.jpg` | En bild per landskapsblomma, botaniska planscher. |
| `djur/<nr>-<namn>.jpg` | En bild per landskapsdjur, foton (laxen är en illustration). 25 olika djur, inget delas mellan landskap. |
| `bilder.json` | En post per bildfil (75 st): källsida på Commons, nedladdnings-URL, licens, upphovsperson, vad appen måste visa, och kontrollen av filen. |

## Källor

| Fält | Källa |
|---|---|
| nr, namn, landsdel | `../landskap-laxbok.json` (läxboken) |
| Städer | Tätorternas faktarutor på sv.wikipedia: landskap och folkmängd 2023. Folkmängden kommer enligt Wikipedia från SCB, *Statistiska tätorter 2023* (publicerad 2024-11-28). SCB:s sida är inte öppnad direkt. |
| Blomma | Naturhistoriska riksmuseet, Den virtuella floran, "Landskapsblommor" (urvalet följer Nationalencyklopedin). Sidan finns inte längre; läst i Internet Archives kopia från 2019-12-21. Alternativ och historik: sv.wikipedia "Landskapsblommor". |
| Djur | Naturhistoriska riksmuseet, "Vilket djur hör till vilket landskap?" (2013). Läst i Internet Archives kopia från 2013-04-26. Samma lista som sv.wikipedia "Landskapsdjur". |
| Yta | sv.wikipedia "Landskap i Sverige", tabellen Sveriges landskap (landareal, vatten ej medräknat). |
| Invånare | SCB, *Folkmängd i landskapen den 31 december 2024*, läst via sv.wikipedias mall `Stat/Sverige/Landskap/Befolkning`. SCB listar tabellen under "Tabeller som inte längre uppdateras", så 2024 är det senaste året som finns. |
| Visste du | Var fakta har sin egen källa i `visste_du[].kalla`. Rangerna är räknade ur ytan och invånarna ovan. |
| Bilder | Wikimedia Commons; licens och upphovsperson per fil i `bilder.json`. |

## Tumregeln för städerna (D25)

- `storsta_stad` = den största tätorten (SCB 2023) som ligger i landskapet – utom där skolans vana går före (D28): Södermanland (Eskilstuna före Södertälje) och Öland (Borgholm före Färjestaden). Där står den största tätorten i `ocksa_stor_stad`. Fältnamnet behålls; i appen heter raden "Stad". Det finns ingen officiell lista över landskapens "huvudstäder" – landskapen har ingen förvaltande roll.
- `ocksa_stor_stad` = nästa tätort om den har **minst cirka 50 000 invånare eller minst hälften av den största
  stadens folkmängd**. Högst en andra stad; övriga kandidater står i `motivering_stad`.
- Tätorter som är delar av Stockholms- eller Göteborgsområdet (Upplands Väsby och Sollentuna, Tumba, Nordöstra
  Göteborg) räknas inte som egna städer.
- **Tätorter i två eller flera landskap:**
  - Stockholm (Uppland och Södermanland) räknas till Uppland. Skälen: Dennis exempel i D25 sätter Stockholm och
    Uppsala i samma landskap, och artikeln Uppland kallar Stockholm "Upplands största stad". Då blir Södertälje
    störst i Södermanland.
  - Göteborg (Västergötland, Bohuslän, Halland) räknas till Västergötland. Artikeln Göteborg säger att allt utom
    större delen av Hisingen ligger i Västergötland.
  - Vänersborg (Västergötland och Dalsland) räknas till Västergötland. Dalslandsdelen är stadsdelen Katrinedal.
- Gränsfall att döma: Piteå är 48 % av Luleå och kom inte med. Borgholm (Öland) och Kungälv (Bohuslän) kom med
  bara genom halvregeln.

## Licenser: vad appen måste göra

- **Vapnen:** alla 25 är ritade av Leonid 2 på Commons, licens CC BY-SA 3.0. Appen måste ange upphovsperson och
  licens. Ändras en fil, t.ex. beskärs eller färgas om, ska den delas under samma licens.
- **Blommorna:** alla 25 är Public domain (Lindman, Flora Danica, Flora Batava, Masclef). Inget krav, men källan bör
  stå med.
- **Djuren:** 5 Public domain, 20 under CC BY eller CC BY-SA (2.0, 2.0 de, 2.5, 3.0, 4.0). De 20 kräver att
  upphovsperson och licens anges i appen, t.ex. i en vy "Bildkällor" som läses ur `bilder.json`.
- Allt är hämtat från upload.wikimedia.org. Bilder över 300 kB är hämtade som Commons egna miniatyrer, 500 px breda
  (`version` i `bilder.json`). Största filen är 232 kB.
- **Planscherna har text.** Lindmans planscher har växtens namn tryckt längst ner, och några har ett annat namn än
  landskapsblomman (fjällvippa, konvalje, duvkulla). Flora Danica-planscherna har en färg- och måttskala. Beskär
  bilderna innan de används som fråga; varje fil har en `obs` i `bilder.json`.

## Kontrollerat

- 25 poster i `landskap-fakta.json`; inget fält är `null` utom `ocksa_stor_stad` där ingen andra stad finns.
- 25 vapen: giltig SVG (XML med `<svg>`-rot), storleken lika med Commons uppgift. Renderade i en kontaktbild och
  granskade för hand; Härjedalen, Medelpad och Ångermanland jämförda mot blasoneringen. Filerna är samma som
  faktarutorna i landskapsartiklarna använder (Skåne: den äldre `Skånes vapen.svg` i samma serie).
- 25 blommor och 25 djur: giltig JPEG (öppnad med PIL), storlek > 0, högst 232 kB. Motivet granskat i kontaktbild;
  arten jämförd mot filens beskrivning på Commons. Skogsharen är *Lepus timidus* och näktergalen *Luscinia
  luscinia* (den svenska näktergalen), inte de felaktiga arterna som listan "Landskapsdjur" på Wikipedia visar.

## Osäkert eller inte belagt

- **Ytan** har ingen källa i Wikipedia-tabellen. Landskapsartiklarnas faktarutor ger andra värden för Dalsland (3 715),
  Gotland (3 183,7 med insjöar), Västerbotten (15 538), Öland (1 347) och Skåne (10 939). Rangordningen blir
  densamma med vilken som helst av siffrorna. Södermanland (8 388) och Västmanland (8 363) skiljer bara 25 km².
- **SCB-filerna** (landskapens folkmängd, tätorterna) är inte öppnade direkt; värdena är lästa ur Wikipedia som
  återger dem.
- **Vad skolböcker anger** för Stockholm, Södermanland och Öland är inte kontrollerat. Mira får lära sig det
  skolan säger; jämför med läxboken.
- **Blommor med två namn:** Dalarna (ängsklocka eller blåklocka), Härjedalen (mosippa eller fjällviol), Blekinge
  (ek, ibland kungsljus), Medelpad (gran, enstaka gånger smörboll). Filen följer NRM; alternativen står i
  `blomma_not`.
- **Barnböckernas namn** är inte kontrollerade mot någon barnbok. Namnen är NRM:s, med versal först
  ("Förgätmigej" där NRM skriver "äkta förgätmigej").
- **Medelpad-artikeln** säger 13:e största yta och 16:e största befolkning. Det stämmer inte med tabellen och SCB
  (17:e och 19:e), så artikelns siffror används inte.
