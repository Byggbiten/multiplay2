# AGENT_CONTEXT — mjuk kontext

## Vem och varför

- Multiplay byggs av Dennis för ett barn, i dokumenten kallat Mira (10 år). Mira är också ett av appens generiska namn; efternamn, ort och skola skrivs aldrig i repot (D36). Appen är en PWA; mars-dokumentet nämner iPad
  med Apple Pencil, och arbetet sedan september mäts i telefonformat 390 × 844. Capybara-samlingen kom från Mira och
  Zeldas önskemål (juli 2026).
- Dennis måttstock för all pedagogik (22/9, citerad i `SPEC-KORT-DIVISION.md`): barnen ska i minsta möjliga mån
  känna "vad hände nu och varför?". Appen är inte till för att sätta barnen på prov, utan för att genom repetition
  och visuell, logisk följd göra det självklart varför ett tal räknas ut på ett visst sätt.
- Metoderna kommer ur Miras mattebok (Mitt i Prick 4A m.fl.) och Dennis egna bilder, till exempel subtraktionen som
  "en strid mellan försvararna som är överst och anfallarna som är nedan" (22/9).
- Dennis dömer mot konkreta, klickbara mockuper, helst prövade av Mira på telefonen.

## Projekthistorik

- **Feb–mars 2026:** appen byggs (gångertabell, klocka, 10-kompisar), designsystemet i `referens/_arkiv/DESIGN-2026-02.md`,
  Nationella prov åk 3 (mars).
- **2–6 juli:** renoveringen (D1, `PLAN-RENOVERING.md`): `shared.js` och vitest, ny design v25–v26, uppställd
  multiplikation och kort division, levande minnessiffror (D2), Dagens träning och Capybara-samlingen. v22–v37.
- **20–24 september:** den stora pedagogiska omgången, v38–v65. Se `logg/2026-09-24.md`.
- **19 oktober:** ordning och reda (D21); nästa modul är Geografi (D22). Se `logg/2026-10-19.md`.

## Avfärdade idéer

- **Ankartal och ankarvandring i division** (22/9, ersatt av D5). Ankare ×2/×5/×10 och stegning upp eller ner till
  talet lärde ut två saker samtidigt och läckte i varje kantfall: "var kommer 15 ifrån?", "6 är närmast" om en nia,
  "1 för mycket → ta bort 4". Dennis: "det här med ankar siffror inte riktigt funkar".
- **Autouppspelad hjälpvandring** (22/9). Hjälpläget stegas med klick, aldrig som film (D3).
- **Ord som "närmast"** (22/9). De förutsätter ett val som aldrig gjordes: "14 är närmast" när 14 var enda
  alternativet (`88bb184`, `e7a5d63`). Gäller alla jämförelseord.
- **Nya capybarabilder** (23/9). Ersatt av silver och guld på de 24 befintliga korten (D14).
- **Layoutalternativen för Räkna själv i Uppställning** (21/9): glider upp, bred 5 × 2, kladd i helskärm. De offrade
  kladdytan; Dennis: "Näe, jag tyckte inget blev särskilt bra." Kvar som jämförelser i `design-lab/inmatning-barnvy.html`.
- **"9 är 7 mer än 2"** som förklaring i subtraktionens vändning (21/9). Dennis: "förvirrar nog mer […] I det där
  fallet hade jag nog lärt ut 9-2=7 bara vanligt enkelt".

## Arbetsvanor som fungerat

- **Kedjan:** spec → klickbar mockup → Mira-test, gärna en agent som spelar barn → Dennis dömer → bygge på egen gren →
  verifiering i panelen → release. Kort division (D5) och gångertabellen (D9) gick hela vägen så.
- **Barnrollspel hittar språkfel som kodgranskning missar.** En agent som spelar Mira (10 år) och klickar igenom
  alla lägen hittade "läs av brickan", den försvunna 42:an och knappar som svalde tryck.
- **Textsvep som vakt.** Alla bubbeltexter genereras ur mallar och svepas i testerna mot språkreglerna
  (`tests/multdiv.test.mjs`, `tests/clock.test.mjs`).
- **VD/orkestrator:** Dennis arbetssätt sedan 20/9 är att Claude leder och granskar, Opus-agenter tar de svåra
  uppdragen och Sonnet de enkla. Parallella agenter arbetar i egna worktrees under `.claude/worktrees/`
  (undantagna i `vitest.config.mjs`).
- **UI-test:** Dennis bad 21/9 om UI-tester i iOS-simulatorn på iPhone 17e som PWA. I webbläsarpanelen hamnar
  koordinatklick fel under emulering; driv den med `element.click()`.

## Webbläsarpanelen

- Felet att service workern inte registreras är en egenhet hos panelen, inte appens. På telefon krävs https
  (Tailscale-adresserna i `CLAUDE.md`).

- **Ny modul: samtal före mockup (19/10).** Geografins tankepass och mockup byggdes direkt ur Dennis material. Dennis:
  "lite för snabb med att bygga mockupen innan vi hade brainstormat". Vid en ny modul: hör hans tankar först, sedan
  tankepass och mockup.
