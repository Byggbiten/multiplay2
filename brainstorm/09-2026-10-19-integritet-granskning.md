# 09 · 2026-10-19 · Integritetsgranskning av det offentliga repot (D36)

Repot (`Byggbiten/multiplay2`) och appen på GitHub Pages är offentliga. Två granskare läste repot efter att Dennis
bett om "en utredning om vart och hur mycket detta förekommer", inför en rensning som inte får skada appen. Den här
sammanfattningen är medvetet sanerad: den räknar upp kategorier och åtgärder, inte de uppgifter som skyddas (D36).

## Granskare A – appen (kod och innehåll på `dev` och `main`)
- **Hög risk:** inga fynd i appens filer.
- **Medel:** kodkommentarer och tester där personan framstod som ett verkligt testbarn (ett tjugotal rader), Dennis
  som beslutsfattare i ett fyrtiotal kommentarer, README-rubriken, en mockups förinställning med ett barns resultat,
  en årskursmarkör i en kommentar på `main`, och författaren i repots första commit.
- **Låg:** generiska namn i uppgifter (`NAMES`, berättelser, rättstavning) – får stå enligt D36.
- **Åtgärdsprincip:** byts ett namn i en uppgift måste rätt svar, felalternativ och namnlistor ändras samtidigt;
  rättningen jämför strängar. Därför rördes inte uppgifterna.

## Granskare B – dokument, git-historik och GitHub
- **Aktuella filer:** rensningen på `dev` hade inte nått `main` (Pages): en sökväg med ett användarnamn, README-raden
  och bokreferenser låg kvar på den publicerade sajten.
- **Dokumenten:** personan framstod som ett verkligt barn ("…s fynd", "…s läxbok", citat med datum och klockslag),
  och D36 räknade själv upp vad som rensats – det visade vad man skulle leta efter.
- **Historiken:** äldre commits innehåller uppgifter som inte står i aktuella filer. Alternativen (låta vara,
  skriva om och force-pusha, göra repot privat, nytt rent repo) vägdes; ingen fork, stjärna eller watcher syns.
- **GitHub:** repots beskrivning och en annan repobeskrivning på samma konto kopplade personan till kontot.

## Utfall
- **Dennis beslut (D36 ✎ "rimlig nivå"):** namnen får stå i frågor och svar; det som skyltar i onödan rensas; repot
  ligger kvar under Byggbiten, kontot byts inte och historiken skrivs inte om.
- **Rensat på grenen `integritet`** (sammanslagen i `dev`, live i v66): personan Mira (regel i CLAUDE.md),
  "barntestet"/"testbarnet" för riktiga barntester, "rollspelet"/"genomspelet" för agentens genomspel; README neutral;
  D36 omskriven utan uppräkning. Bara kommentarer i kod och tester – inga strängar som användaren ser, inga
  testförväntningar.
- **GitHub:** beskrivningarna för `multiplay2` ("Matteträning för barn (PWA)") och `lavaspelet` ("Plattformsspel
  byggt från en barnteckning") neutrala, på Dennis ja.
- **v66 live:** den publicerade sajten är sanerad (den gamla docs-planen svarar 404, README neutral).
- **Privat underlag** om barnen ligger i gitignorerade `.project-context/_privat/` och i Claudes minne; synkkommandot
  till dev-spegeln undantar `_privat/`.
