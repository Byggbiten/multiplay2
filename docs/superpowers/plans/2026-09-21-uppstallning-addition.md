# Uppställd addition — ny pedagogik · Implementationsplan

> **För agentiska arbetare:** OBLIGATORISK SUB-SKILL: använd `superpowers:subagent-driven-development` eller `superpowers:executing-plans`. Stegen använder checkbox (`- [ ]`).

**Mål:** Bygga in den beslutade additionspedagogiken i `js/uppstallning.js` — tiokompis-genväg vid exakt 10, tankerutan, summan som tal i marginalen, komplementet från största talet, samt de två minnessiffre-hålen — i både demo och övningsläge.

**Arkitektur:** All kolumnlogik bryts först ut ur `buildDemoSteps()` till en **ren funktion** `planAdditionColumns(numA, numB, colCount, opts)` som är testbar utan DOM. Regeländringarna sker därefter enbart i den funktionen och verifieras uttömmande med vitest. Rendering och animation (`executeStep`, `showStepBubble`) konsumerar de nya stegtyperna. Övningsläget byggs sist, mot samma stegdata.

**Teknik:** Vanilla JS, IIFE-moduler, vitest 3.2.4. Ingen build. Inga nya beroenden.

## Globala villkor

- **Facit:** `.project-context/UPPSTALLNING-ADDITION-SPEC.md`. Varje bubbeltext, stegkedja, animationslängd och CSS-klass hämtas därifrån verbatim. Skriv aldrig en text ur minnet.
- **Mockupen är referensimplementation:** `design-lab/tiokompis-barnvy.html`. Vid tvekan om en rörelse — läs mockupens kod, härma inte på känsla.
- **Gren:** `dev`. `main` rörs inte. Ingen push till `main` i någon uppgift.
- **Två lager:** kolumnen är pappret (strukna siffror, små amber-siffror, minnessiffran) och står still när den skrivits. Brickorna är kvantiteterna och är det enda som rör sig.
- **En idé per steg.** Max en kort mening i bubblan. Ingen aritmetik i texten som barnet måste räkna ut.
- **Inget objekt får skapas och förstöras i samma steg.**
- **Minnessiffrans livscykel är låst** (`.project-context/MINNESSIFFER-KONCEPT.md`): skrivs liten, vilar, används, STRYKS — aldrig suddas. Röd `#dc2626`, roterad −4°.
- **Platsvärdesfärger låsta:** ental `#22c55e`, tiotal `#3b82f6`, hundratal `#ef4444`.
- **Rörs inte:** subtraktionsgrenen, `js/multdiv.js`, "en vy = en skärm".
- **`sw.js` `CACHE_VERSION` höjs i sista uppgiften, inte före.**

---

## Filstruktur

| Fil | Ansvar | Åtgärd |
|---|---|---|
| `js/uppstallning.js` | steglogik + rendering + övningsläge | ändras |
| `tests/uppstallning.test.mjs` | enhetstester för den rena stegbyggaren | skapas |
| `sw.js` | cache-version | ändras (sist) |

`js/uppstallning.js` är 2 114 rader och gör mycket. Planen delar **inte** upp filen — det vore en orelaterad ombyggnad mitt i en pedagogikändring. Men den rena funktionen som bryts ut i uppgift 1 är första steget mot att kunna göra det senare.

---

### Uppgift 1: Bryt ut stegbyggaren och lås dagens beteende

Detta är nätet under allt annat. Ingen regel ändras här — bevisbördan är att utbrytningen ändrar **ingenting**.

**Filer:**
- Ändra: `js/uppstallning.js:494–555` (`buildDemoSteps`), samt filens slut (export)
- Skapa: `tests/uppstallning.test.mjs`

**Gränssnitt:**
- Producerar: `planAdditionColumns(numA, numB, colCount, opts) -> Array<Step>` — ren funktion, inga sidoeffekter, läser inget modultillstånd. `opts` är `{ compTo, memTo }` med defaultvärden `'oversta'` i denna uppgift (= dagens beteende). `Step` är samma serialiserbara objekt som i dag.
- `UppstallningGame.__test = { planAdditionColumns }` exponeras för tester; `module.exports` sätts enligt mönstret i `js/shared.js:161`.

- [ ] **Steg 1: Skriv karakteriseringstestet**

Kör dagens `buildDemoSteps`-aritmetik i testet och jämför mot den utbrutna funktionen över hela talrymden.

```js
/* tests/uppstallning.test.mjs */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { planAdditionColumns } = require('../js/uppstallning.js').__test;

/* Referens: aritmetiken exakt som den står i app:503-510 före utbrytningen. */
function referens(numA, numB, colCount) {
  const digs = n => String(n).padStart(colCount, '0').split('').reverse().map(Number);
  const da = digs(numA), db = digs(numB), steps = [];
  let carryVal = 0;
  for (let c = 0; c < colCount; c++) {
    const a = da[c], b = db[c];
    const effectiveA = a + carryVal;
    const sum = effectiveA + b;
    const ans = sum % 10;
    const nextCarry = sum > 9 ? 1 : 0;
    steps.push({ type: 'add_highlight', col: c });
    if (sum > 9) {
      const behover = 10 - effectiveA;
      const kvar = b - behover;
      steps.push({ type: 'add_over9', col: c, a, b, carry_in: carryVal, sum, effectiveA });
      steps.push({ type: 'add_explain', col: c, a, b, carry_in: carryVal, effectiveA, behover, kvar, ans, nextCarry });
      steps.push({ type: 'add_cross',   col: c, a, b, carry_in: carryVal, effectiveA, behover, kvar, ans, nextCarry });
      steps.push({ type: 'add_carry_fly', col: c, nextCarry });
      steps.push({ type: 'add_result', col: c, a, b, kvar, ans, nextCarry });
    } else {
      steps.push({ type: 'add_simple', col: c, a, b, carry_in: carryVal, sum, ans });
    }
    if (carryVal && c < colCount - 1) steps.push({ type: 'add_mem_strike', col: c });
    carryVal = nextCarry;
  }
  if (carryVal) steps.push({ type: 'add_overflow', digit: carryVal });
  steps.push({ type: 'done' });
  return steps;
}

describe('planAdditionColumns — karakterisering av dagens beteende', () => {
  it('ger identisk steglista som referensen for alla tvasiffriga par', () => {
    const avvikelser = [];
    for (let a = 10; a <= 99; a++) {
      for (let b = 10; b <= 99; b++) {
        const cc = (a + b >= 100) ? 3 : 2;
        const fick = planAdditionColumns(a, b, cc, { compTo: 'oversta', memTo: 'oversta' });
        const vantat = referens(a, b, cc);
        if (JSON.stringify(fick) !== JSON.stringify(vantat)) avvikelser.push(`${a}+${b}`);
      }
    }
    expect(avvikelser).toEqual([]);
  });

  it('summan i steglistan stammer med riktig addition', () => {
    const fel = [];
    for (let a = 10; a <= 99; a++) {
      for (let b = 10; b <= 99; b++) {
        const cc = (a + b >= 100) ? 3 : 2;
        const steps = planAdditionColumns(a, b, cc, { compTo: 'oversta', memTo: 'oversta' });
        const siffror = [];
        for (const s of steps) {
          if (s.type === 'add_result' || s.type === 'add_simple') siffror[s.col] = s.ans;
          if (s.type === 'add_overflow') siffror[cc] = s.digit;
        }
        const summa = Number(siffror.map(d => d ?? 0).reverse().join(''));
        if (summa !== a + b) fel.push(`${a}+${b} gav ${summa}`);
      }
    }
    expect(fel).toEqual([]);
  });
});
```

- [ ] **Steg 2: Kör testet och se att det misslyckas**

Kör: `npm test -- tests/uppstallning.test.mjs`
Förväntat: FAIL — `Cannot read properties of undefined (reading 'planAdditionColumns')`, eftersom exporten inte finns än.

- [ ] **Steg 3: Bryt ut funktionen**

I `js/uppstallning.js`, ersätt kroppen av `buildDemoSteps()` (rad 494–555) så att additionsgrenen anropar en ny ren funktion. Subtraktionsgrenen flyttas **inte** — den ligger kvar i `buildDemoSteps`.

```js
/* Ren, testbar stegbyggare för addition. Läser inget modultillstånd. */
function planAdditionColumns(numA, numB, colCount, opts) {
  const o = Object.assign({ compTo: 'oversta', memTo: 'oversta' }, opts || {});
  const digs = n => String(n).padStart(colCount, '0').split('').reverse().map(Number);
  const da = digs(numA), db = digs(numB);
  const steps = [];
  let carryVal = 0;
  for (let c = 0; c < colCount; c++) {
    /* aritmetiken flyttas hit ORÖRD från rad 503–510 i detta steg */
    const a = da[c], b = db[c];
    const effectiveA = a + carryVal;
    const sum = effectiveA + b;
    const ans = sum % 10;
    const nextCarry = sum > 9 ? 1 : 0;
    steps.push({ type:'add_highlight', col:c });
    if (sum > 9) {
      const behover = 10 - effectiveA;
      const kvar = b - behover;
      steps.push({ type:'add_over9', col:c, a, b, carry_in:carryVal, sum, effectiveA });
      steps.push({ type:'add_explain', col:c, a, b, carry_in:carryVal, effectiveA, behover, kvar, ans, nextCarry });
      steps.push({ type:'add_cross', col:c, a, b, carry_in:carryVal, effectiveA, behover, kvar, ans, nextCarry });
      steps.push({ type:'add_carry_fly', col:c, nextCarry });
      steps.push({ type:'add_result', col:c, a, b, kvar, ans, nextCarry });
    } else {
      steps.push({ type:'add_simple', col:c, a, b, carry_in:carryVal, sum, ans });
    }
    if (carryVal && c < colCount - 1) steps.push({ type:'add_mem_strike', col:c });
    carryVal = nextCarry;
  }
  if (carryVal) steps.push({ type:'add_overflow', digit:carryVal });
  steps.push({ type:'done' });
  return steps;
}
```

`buildDemoSteps()` blir:

```js
function buildDemoSteps() {
  if (mode === 'addition') return planAdditionColumns(numA, numB, colCount, ADD_OPTS);
  const steps = [];
  /* subtraktionsgrenen står kvar oförändrad här, inklusive sitt avslutande
     steps.push({ type:'done' }); */
  ...
  return steps;
}
```

Lägg överst i modulen: `const ADD_OPTS = { compTo: 'oversta', memTo: 'oversta' };` — ändras i uppgift 2.

Observera: `digs()` i den rena funktionen måste ge **samma** resultat som modulens befintliga `digs`. Läs modulens `digs` och kopiera dess beteende; om den skiljer sig, använd modulens och skicka in den.

Lägg till i det returnerade objektet (filens slut):

```js
    goBack,
    __test: { planAdditionColumns },
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = UppstallningGame;
```

- [ ] **Steg 4: Kör testet och se att det passerar**

Kör: `npm test -- tests/uppstallning.test.mjs`
Förväntat: PASS, 2 tester. Om det första misslyckas har utbrytningen ändrat beteende — rätta tills listan över avvikelser är tom. Hoppa aldrig över detta.

- [ ] **Steg 5: Kör hela sviten**

Kör: `npm test`
Förväntat: PASS. `tests/shared.test.mjs` ska vara opåverkad.

- [ ] **Steg 6: Verifiera i webbläsaren att demon fortfarande beter sig som förut**

Servern kör på port 5312 och läser `/Users/dennissendelbach/multiplay-dev`. Synka först:
`rsync -a --delete --exclude='.git' --exclude='node_modules' --exclude='.claude' "<repo>/" /Users/dennissendelbach/multiplay-dev/`
Öppna `http://localhost:5312/`, skapa en profil, gå till Uppställning → Addition → Demo och stega igenom en uppgift. Läs konsolen med `read_console_messages` — den ska vara tom.

- [ ] **Steg 7: Commit**

```bash
git add js/uppstallning.js tests/uppstallning.test.mjs
git commit -m "refactor: bryt ut planAdditionColumns som ren funktion

Ingen beteendeandring. Karakteriseringstester later alla 8100
tvasiffriga par mot den gamla aritmetiken och last fast dagens
steglista innan reglerna byggs om.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Uppgift 2: Största-talet-regeln

**Filer:**
- Ändra: `js/uppstallning.js` — `planAdditionColumns`, `ADD_OPTS`
- Ändra: `tests/uppstallning.test.mjs`

**Gränssnitt:**
- Konsumerar: `planAdditionColumns` från uppgift 1.
- Producerar: stegen bär nu `memRow`, `growRow`, `giveRow` (`'a'` eller `'b'`), `valA`, `valB`, `growVal`, `giveVal`. Uppgift 6 renderar mot dessa.

Aritmetiken står verbatim i spec §2.1. Kopiera därifrån.

- [ ] **Steg 1: Skriv testerna**

```js
describe('storsta-talet-regeln', () => {
  const OPTS = { compTo: 'storsta', memTo: 'storsta' };

  it('32+29: 9:an fylls till 10, inte 2:an', () => {
    const steps = planAdditionColumns(32, 29, 2, OPTS);
    const explain = steps.find(s => s.type === 'add_explain' && s.col === 0);
    expect(explain.growVal).toBe(9);
    expect(explain.behover).toBe(1);
    expect(explain.kvar).toBe(1);
  });

  it('47+35: oforandrat mot forr eftersom 7 redan ar storst', () => {
    const steps = planAdditionColumns(47, 35, 2, OPTS);
    const explain = steps.find(s => s.type === 'add_explain' && s.col === 0);
    expect(explain.growVal).toBe(7);
    expect(explain.behover).toBe(3);
    expect(explain.kvar).toBe(2);
  });

  it('kvar blir alltid minst 1 nar behover ar minst 1', () => {
    const fel = [];
    for (let a = 10; a <= 99; a++) for (let b = 10; b <= 99; b++) {
      const cc = (a + b >= 100) ? 3 : 2;
      for (const s of planAdditionColumns(a, b, cc, OPTS)) {
        if (s.type === 'add_explain' && s.behover >= 1 && s.kvar < 1) fel.push(`${a}+${b} kol ${s.col}`);
      }
    }
    expect(fel).toEqual([]);
  });

  it('summan ar fortfarande korrekt for alla par', () => {
    const fel = [];
    for (let a = 10; a <= 99; a++) for (let b = 10; b <= 99; b++) {
      const cc = (a + b >= 100) ? 3 : 2;
      const siffror = [];
      for (const s of planAdditionColumns(a, b, cc, OPTS)) {
        if (s.type === 'add_result' || s.type === 'add_simple') siffror[s.col] = s.ans;
        if (s.type === 'add_overflow') siffror[cc] = s.digit;
      }
      const summa = Number(siffror.map(d => d ?? 0).reverse().join(''));
      if (summa !== a + b) fel.push(`${a}+${b} gav ${summa}`);
    }
    expect(fel).toEqual([]);
  });
});
```

- [ ] **Steg 2: Kör och se att de misslyckas**

Kör: `npm test -- tests/uppstallning.test.mjs`
Förväntat: FAIL — `growVal` finns inte på stegen än.

- [ ] **Steg 3: Implementera aritmetiken**

Ersätt raderna för `effectiveA` / `behover` / `kvar` i `planAdditionColumns` med koden ur spec §2.1 (`memRow`, `memDigit`, `memNew`, `valA`, `valB`, `growRow`, `giveRow`, `growVal`, `giveVal`). Lägg de nya fälten på `add_over9`, `add_explain`, `add_cross` och `add_result`. Ändra `ADD_OPTS` till `{ compTo: 'storsta', memTo: 'storsta' }`.

Karakteriseringstestet från uppgift 1 anropar med `'oversta'` och ska fortsätta passera — det bevisar att gamla vägen finns kvar intakt.

- [ ] **Steg 4: Kör testerna**

Kör: `npm test`
Förväntat: PASS, alla. Karakteriseringstestet **måste** fortfarande vara grönt.

- [ ] **Steg 5: Commit**

```bash
git add js/uppstallning.js tests/uppstallning.test.mjs
git commit -m "feat: komplementet och minnet utgar fran storsta talet

En 9:a tar 1 av en 2:a, aldrig tvartom. Galler bade vilken term som
fylls till 10 och vilken term minnessiffran laggs pa. Beslut Dennis
2026-09-20, spec kap 2.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Uppgift 3: Tiokompis-genvägen vid exakt 10

Stegkedjan och bubbeltexterna står i spec §3b. Nya stegtypen heter `tf_pair`.

**Filer:**
- Ändra: `js/uppstallning.js` — `planAdditionColumns`, `executeStep`, `showStepBubble`, `BASE_CSS`
- Ändra: `tests/uppstallning.test.mjs`

**Gränssnitt:**
- Producerar: steg `{ type:'tf_pair', col, valA, valB, sum:10, memSaid }`. `memSaid` är `true` när ett föregående `add_memjoin` redan nämnt minnet (uppgift 5 sätter den).

- [ ] **Steg 1: Skriv testerna**

```js
describe('exakt-10-genvagen', () => {
  const OPTS = { compTo: 'storsta', memTo: 'storsta' };

  it('41+39: entalen far tf_pair, inga komplementsteg', () => {
    const typer = planAdditionColumns(41, 39, 2, OPTS).filter(s => s.col === 0).map(s => s.type);
    expect(typer).toContain('tf_pair');
    expect(typer).not.toContain('add_explain');
    expect(typer).not.toContain('add_cross');
  });

  it('41+39 ger 80', () => {
    const siffror = [];
    for (const s of planAdditionColumns(41, 39, 2, OPTS)) {
      if (s.type === 'add_result' || s.type === 'add_simple') siffror[s.col] = s.ans;
    }
    expect(Number(siffror.reverse().join(''))).toBe(80);
  });

  it('ingen kolumn med bada termerna minst 1 och summa 10 kor komplementvagen', () => {
    const fel = [];
    for (let a = 10; a <= 99; a++) for (let b = 10; b <= 99; b++) {
      const cc = (a + b >= 100) ? 3 : 2;
      const steps = planAdditionColumns(a, b, cc, OPTS);
      for (const s of steps) {
        if (s.type === 'add_explain' && s.valA >= 1 && s.valB >= 1 && s.valA + s.valB === 10) {
          fel.push(`${a}+${b} kol ${s.col}`);
        }
      }
    }
    expect(fel).toEqual([]);
  });
});
```

- [ ] **Steg 2: Kör och se att de misslyckas**

Kör: `npm test -- tests/uppstallning.test.mjs`
Förväntat: FAIL — `tf_pair` produceras inte.

- [ ] **Steg 3: Implementera i stegbyggaren**

I `planAdditionColumns`, före komplementgrenen: om `valA + valB === 10 && valA >= 1 && valB >= 1`, pusha `tf_pair` i stället för `add_over9`/`add_explain`/`add_cross`, och behåll `add_carry_fly` + `add_result`. Villkoret och fältuppsättningen står i spec §3b.

- [ ] **Steg 4: Implementera rendering och text**

`executeStep`: nytt `else if (step.type === 'tf_pair')` med faserna och tiderna ur spec §4. `showStepBubble`: texten verbatim ur spec §3b. Nya CSS-klasser ur spec §5 läggs i `BASE_CSS`.

- [ ] **Steg 5: Kör testerna och verifiera i webbläsaren**

Kör: `npm test` → PASS.
Synka spegeln, öppna demon, kör ett tal som ger exakt 10 i entalen. Kontrollera mot spec §3b att texterna stämmer ordagrant och att ingen siffra stryks i den kolumnen.

- [ ] **Steg 6: Commit**

```bash
git add js/uppstallning.js tests/uppstallning.test.mjs
git commit -m "feat: tiokompis-genvag nar entalssumman blir exakt 10

Ingen strykning, ingen siffra skrivs om - pa papper skriver barnet
ingenting overkryssat dar. Spec kap 3b.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Uppgift 4: Hål A — termen är redan 10

Kraven står i spec §7.1. **Läs hela §7.1 innan du skriver en rad.**

Efter uppgift 2 drabbar detta **14,6 %** av uppgifterna på nivå 3 och 12,0 % på nivå 4 — största-talet-regeln fördubblade klassen, eftersom villkoret blev `max(a,b) === 9 && carry_in === 1` i stället för `a === 9 && carry_in === 1`.

**Filer:**
- Ändra: `js/uppstallning.js` — `planAdditionColumns`, `executeStep`, `showStepBubble`
- Ändra: `tests/uppstallning.test.mjs`

- [ ] **Steg 1: Skriv testerna**

```js
describe('hal A: termen ar redan 10 efter minnet', () => {
  const OPTS = { compTo: 'storsta', memTo: 'storsta' };

  it('95+47 tiotalen: inga komplementsteg, ingen strykning', () => {
    const kol1 = planAdditionColumns(95, 47, 3, OPTS).filter(s => s.col === 1).map(s => s.type);
    expect(kol1).not.toContain('add_explain');
    expect(kol1).not.toContain('add_cross');
    expect(kol1).toContain('add_memjoin');
    expect(kol1).toContain('add_sum');
  });

  it('295+208 tiotalen: resten ar 0', () => {
    const steg = planAdditionColumns(295, 208, 3, OPTS).find(s => s.type === 'add_sum' && s.col === 1);
    expect(steg.sum).toBe(10);
    expect(steg.ans).toBe(0);
    expect(steg.kvar).toBe(0);
  });

  it('ingen kolumn kor komplementvagen med behover 0', () => {
    const fel = [];
    for (let a = 40; a <= 99; a++) for (let b = 40; b <= 99; b++) {
      if (a + b < 100) continue;
      for (const s of planAdditionColumns(a, b, 3, OPTS)) {
        if (s.type === 'add_explain' && s.behover === 0) fel.push(`${a}+${b} kol ${s.col}`);
      }
    }
    expect(fel).toEqual([]);
  });

  it('summan ar korrekt for hela niva 3 uttommande', () => {
    const fel = [];
    for (let a = 40; a <= 99; a++) for (let b = 40; b <= 99; b++) {
      if (a + b < 100) continue;
      const siffror = [];
      for (const s of planAdditionColumns(a, b, 3, OPTS)) {
        if (s.type === 'add_result' || s.type === 'add_simple') siffror[s.col] = s.ans;
        if (s.type === 'add_overflow') siffror[3] = s.digit;
      }
      const summa = Number(siffror.map(d => d ?? 0).reverse().join(''));
      if (summa !== a + b) fel.push(`${a}+${b} gav ${summa}`);
    }
    expect(fel).toEqual([]);
  });
});
```

- [ ] **Steg 2: Kör och se att de misslyckas**

Kör: `npm test -- tests/uppstallning.test.mjs`
Förväntat: FAIL på alla fyra.

- [ ] **Steg 3: Implementera**

Enligt spec §7.1. Tre krav som inte finns i mockupen och som är lätta att missa:
1. `add_memjoin` med `box:false` måste komma **först** — annars får barnet en bricka som säger 14 utan att minnet nämnts.
2. `paperSources()` måste returnera **tre** källor (båda siffrorna *och* minnessiffran), annars föds summan ur intet och bryter mot regeln att inget objekt får uppstå osynligt.
3. Ingen strykning i kolumnen — hon skriver ingen strykning på pappret heller.

- [ ] **Steg 4: Kör testerna**

Kör: `npm test` → PASS, alla, inklusive karakteriseringstestet.

- [ ] **Steg 5: Verifiera i webbläsaren**

Kör `95 + 47` och `295 + 208` i demon. Läs bubbeltexterna och jämför ord för ord mot spec §7.1. Kontrollera att ingen siffra stryks i den kolumnen.

- [ ] **Steg 6: Commit**

```bash
git add js/uppstallning.js tests/uppstallning.test.mjs
git commit -m "fix: ingen lanceremoni nar termen redan ar 10

Appen sa 'Vi tar 0 fran 4: 4 - 0 = 4' och strok over en fyra for att
skriva dit en fyra. Kolumnen ar 10 + resten; komplementstegen hoppas
over helt. Drabbade 14,6 % av uppgifterna pa niva 3. Spec kap 7.1.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Uppgift 5: Hål B — översta siffran är 0 och minnet finns

Kraven står i spec §7.2. Observera slutsatsen där: med `memTo='storsta'` kan fallet **inte** uppstå som tiokompis-påstående, eftersom minnet går till 9:an och kolumnen hamnar i hål A. Bygg ändå `memSaid`-flaggan och minnessteget defensivt — regeln ska hålla även om `memTo` ändras.

**Filer:**
- Ändra: `js/uppstallning.js` — `planAdditionColumns`, `showStepBubble`
- Ändra: `tests/uppstallning.test.mjs`

- [ ] **Steg 1: Skriv testet**

```js
describe('hal B: oversta siffran ar 0 med minne', () => {
  it('med memTo oversta namns minnet fore tiokompis-pastaendet', () => {
    const steps = planAdditionColumns(205, 199, 3, { compTo: 'storsta', memTo: 'oversta' });
    const kol1 = steps.filter(s => s.col === 1);
    const iMemjoin = kol1.findIndex(s => s.type === 'add_memjoin');
    const iPair    = kol1.findIndex(s => s.type === 'tf_pair');
    expect(iMemjoin).toBeGreaterThanOrEqual(0);
    expect(iPair).toBeGreaterThan(iMemjoin);
    expect(kol1[iPair].memSaid).toBe(true);
  });
});
```

- [ ] **Steg 2: Kör och se att det misslyckas**

Kör: `npm test -- tests/uppstallning.test.mjs`
Förväntat: FAIL — `add_memjoin` saknas i den kolumnen.

- [ ] **Steg 3: Implementera**

Enligt spec §7.2: `add_memjoin` pushas före `tf_pair` när `carry_in` är 1, och `tf_pair` får `memSaid:true` så att texten inte upprepar minnet.

- [ ] **Steg 4: Kör testerna**

Kör: `npm test` → PASS.

- [ ] **Steg 5: Commit**

```bash
git add js/uppstallning.js tests/uppstallning.test.mjs
git commit -m "fix: minnessteget talar fore tiokompis-pastaendet

Annars pastar appen '1 och 9 ar tiokompisar' medan barnet ser en nolla
och en nia. Spec kap 7.2.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Uppgift 6: Tankerutan, brickorna och animationerna

Detta är den visuella hälften. Allt står i spec §3c, §3d, §4 och §5, och mockupen är referensimplementation.

**Filer:**
- Ändra: `js/uppstallning.js` — `planAdditionColumns` (stegtyper), `executeStep`, `showStepBubble`, `buildTableHTML`, `BASE_CSS`, `renderDemoView`

**Gränssnitt:**
- Nya stegtyper enligt spec §3c/§3d: `add_lift`, `add_need`, `add_lend`, `add_ten_named`, `add_sum`, `add_return`, `add_memjoin`.
- `add_carry_fly` och `add_result` behålls men konsumerar nu summebrickan.

- [ ] **Steg 1: Skriv stegordningstestet**

```js
describe('stegordningen i komplementkolumner', () => {
  const OPTS = { compTo: 'storsta', memTo: 'storsta' };
  it('47+35 entalen foljer spec kap 3c', () => {
    const typer = planAdditionColumns(47, 35, 2, OPTS).filter(s => s.col === 0).map(s => s.type);
    expect(typer).toEqual([
      'add_highlight', 'add_lift', 'add_need', 'add_lend',
      'add_ten_named', 'add_sum', 'add_return', 'add_carry_fly', 'add_result',
    ]);
  });
  it('summan skapas fore att den anvands', () => {
    const typer = planAdditionColumns(47, 35, 2, OPTS).map(s => s.type);
    expect(typer.indexOf('add_sum')).toBeLessThan(typer.indexOf('add_carry_fly'));
  });
});
```

Den exakta listan hämtas ur spec §3c — om den skiljer sig från ovan, **följ specen** och rätta testet.

- [ ] **Steg 2: Kör och se att det misslyckas**

Kör: `npm test -- tests/uppstallning.test.mjs` → FAIL.

- [ ] **Steg 3: Implementera stegtyperna i stegbyggaren**

Enligt spec §3c och §3d.

- [ ] **Steg 4: Implementera rendering, CSS och animationer**

`BASE_CSS` utökas med klasserna ur spec §5 som är märkta som nya. `executeStep` får ett fall per ny stegtyp med faserna och millisekundvärdena ur spec §4. `showStepBubble` får texterna verbatim ur §3c/§3d. Tankerutan renderas i `renderDemoView` enligt §5.

- [ ] **Steg 5: Kör testerna**

Kör: `npm test` → PASS.

- [ ] **Steg 6: Verifiera mot mockupen, sida vid sida**

Öppna mockupen `http://localhost:5312/design-lab/tiokompis-barnvy.html` och appen `http://localhost:5312/` bredvid varandra i 390×844. Kör **samma tal** i båda: `47+35`, `68+57`, `41+39`, `47+53`, `32+29`, `95+47`, `295+208`.

För varje tal och varje steg: samma bubbeltext, samma rörelse, samma ordning. Avvikelse = fel i appen, inte i mockupen.

Mät också:
- uppställningen får aldrig scrolla (`scrollHeight === clientHeight`)
- kladdytan får aldrig understiga spec §6:s minimum
- konsolen tom (`read_console_messages`)
- inget brickelement skapas och tas bort i samma steg

- [ ] **Steg 7: Ta bort `add_explain` och `add_cross` ur additionsvägen**

Efter uppgift 2 är aritmetiken radmedveten (`growRow`/`giveRow`) men
`showStepBubble` och `add_cross` läser fortfarande `step.a`/`step.b`. För
`32 + 29` gav det rätt siffror men fel formulering: bubblan sa *"Vi tar 1 från
9"* i stället för från 2:an, och `10` skrevs under 2:an i stället för under
9:an. Det är ett medvetet mellanläge mellan uppgift 2 och den här uppgiften.

Spec §3c:s kedja innehåller varken `add_explain` eller `add_cross`. När den är
på plats är båda **döda för addition** (subtraktionen har egna stegtyper). Ta
bort dem ur additionsgrenen i `planAdditionColumns`, och ta bort deras grenar i
`executeStep` och `showStepBubble` om ingen annan stegtyp använder dem — grepa
hela filen först. Lämnas de kvar blir de en fälla: radfast kod som ser levande
ut.

Kontrollera med `grep -n "add_explain\|add_cross" js/uppstallning.js` att de
bara förekommer i legacy-vägen (om den behålls) och ingenstans i den nya.

- [ ] **Steg 8: Commit**

```bash
git add js/uppstallning.js
git commit -m "feat: tankerutan, summebrickan och de nya animationerna

Paret lyfts ur kolumnen och rakans i en egen ruta; pappret skrivs
forst och summan stiger ur det som ett tal i hogermarginalen, vars
siffror sedan gar till minnesraden och svarscellen. Spec kap 3-5.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Uppgift 7: Övningsläget

Spec §8 listar de nio funktioner som måste ändras. **Kritiskt:** `needsTenFriend: !!overStep` (`js/uppstallning.js:578`) blir `false` för varje kolumn så snart `add_over9` slutar produceras — då slutar övningsläget tyst att undervisa metoden. Uppgift 6 får inte commitas utan att denna uppgift följer direkt efter.

**Filer:**
- Ändra: `js/uppstallning.js` — `preprocessExSteps`, `exBubbleMsg`, `showExColUI`, `exTenStep1/2/3`, fasmodellen `exTenPhase`, samt övriga funktioner som spec §8 namnger

- [ ] **Steg 1: Skriv testet för per-kolumndata**

```js
describe('ovningslagets per-kolumndata', () => {
  const OPTS = { compTo: 'storsta', memTo: 'storsta' };
  it('varje kolumn far ett vagval som inte ar odefinierat', () => {
    const fel = [];
    for (const [a, b] of [[47,35],[68,57],[41,39],[95,47],[295,208],[32,29]]) {
      const cc = (a >= 100 || b >= 100 || a + b >= 100) ? 3 : 2;
      const steps = planAdditionColumns(a, b, cc, OPTS);
      for (let c = 0; c < cc; c++) {
        const iKol = steps.filter(s => s.col === c).map(s => s.type);
        const harVag = iKol.includes('tf_pair') || iKol.includes('add_lend')
                    || iKol.includes('add_sum') || iKol.includes('add_simple');
        if (!harVag) fel.push(`${a}+${b} kol ${c}: ${iKol.join(',')}`);
      }
    }
    expect(fel).toEqual([]);
  });
});
```

- [ ] **Steg 2: Kör testet**

Kör: `npm test -- tests/uppstallning.test.mjs`. Om det redan passerar efter uppgift 6 — bra, det är ett skyddsnät, inte en drivare. Gå vidare.

- [ ] **Steg 3: Implementera enligt spec §8**

Ersätt `needsTenFriend` med ett vägval som täcker alla fyra fallen (direkt, tiokompis, komplement, redan-tio). Uppdatera fasmaskinen och knapptexterna därefter.

- [ ] **Steg 4: Verifiera övningsläget i webbläsaren**

Gå igenom övningsläget för `47+35`, `41+39`, `95+47` och `32+29`. Varje kolumn ska gå att lösa, knapparna ska stämma med fasen, och metoden som lärs ut ska vara **samma** som demons. Konsolen tom.

- [ ] **Steg 5: Commit**

```bash
git add js/uppstallning.js tests/uppstallning.test.mjs
git commit -m "feat: ovningslaget lar ut samma metod som demon

needsTenFriend ersatt av ett vagval som tacker alla fyra kolumnfallen.
Utan detta slutar ovningslaget tyst undervisa metoden. Spec kap 8.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Uppgift 8: Sluthärdning

**Filer:**
- Ändra: `sw.js` (`CACHE_VERSION`)

- [ ] **Steg 1: Kör hela sviten**

Kör: `npm test`
Förväntat: PASS, alla filer.

- [ ] **Steg 2: Uttömmande summakontroll över appens riktiga talintervall**

Skriv ett engångsskript i scratchpad-katalogen (inte i repot) som kör `planAdditionColumns` över samtliga par i alla fyra svårighetsnivåernas intervall (`js/uppstallning.js:418`, `:421`, `:424`, `:427`) och kontrollerar att den summa steglistan bygger stämmer med `a + b`. Förväntat: noll fel.

- [ ] **Steg 3: Avgör legacy-vägens öde**

Uppgift 2 införde en `legacy`-flagga i `planAdditionColumns`
(`js/uppstallning.js:503`): med `{compTo:'oversta', memTo:'oversta'}` pushas
dagens exakta stegobjekt, annars de nya fälten ur spec §2.3. Det gjordes för
att karakteriseringstestet jämför hela stegobjekt med `JSON.stringify` och
hade fällts av ovillkorliga extrafält.

Den vägen har gjort sitt jobb som skyddsnät genom hela bygget. Nu är frågan om
den ska stanna. **Ta inte bort den utan att fråga Dennis** — argumenten åt båda
håll:

- *Behåll:* `ADD_OPTS` är en rad, så hela största-talet-regeln kan vändas
  tillbaka om Mitt i Prick 4A visar sig lära ut det översta talet. Regeln är
  inte verifierad mot boken.
- *Ta bort:* två aritmetikvägar i samma funktion är skuld, och
  karakteriseringstestet pinnar då fast ett beteende vi medvetet övergett.

Om den behålls: dokumentera i en kommentar vid `ADD_OPTS` varför, och behåll
karakteriseringstestet. Om den tas bort: ta bort testet i samma commit och
säg det i meddelandet.

- [ ] **Steg 4: Höj cache-versionen**

I `sw.js`, höj `CACHE_VERSION` från `'v37'` till `'v38'`.

- [ ] **Steg 4: Live-verifiering i iPhone-simulatorn**

Kör appen som PWA i iPhone 17 e och gå igenom demon och övningsläget för minst `47+35`, `68+57`, `41+39` och `95+47`. Kontrollera att inget scrollar och att kladdytan finns kvar.

- [ ] **Steg 5: Commit och push till dev**

```bash
git add sw.js
git commit -m "chore: hoj CACHE_VERSION till v38

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
git push origin dev
```

**Stoppa här.** Sammanslagning till `main` sker inte i den här planen — den är live-appen och kräver Dennis uttryckliga ord.

---

## Öppna frågor som planen inte avgör

Spec §10 listar sex. Dessa tre kan blockera en uppgift och ska ställas till Dennis när de nås, inte gissas:

1. **Amber eller platsvärdesfärg** på `kvar` i `10 + resten`-fallet (uppgift 4). Specen väljer platsvärdesfärg; det är ett antagande.
2. **Tankerutans tröskel** (uppgift 6): mockupen öppnar rutan även för `9 + 2` där bara 1 lånas. Om den ska hoppas över vid `behover === 1` är obestämt.
3. **Reducerad rörelse** (uppgift 6): `prefers-reduced-motion` saknas i mockupens telefon-CSS. Vad som ska hända med brickornas rörelser är obestämt.

Och en fråga till Dennis som inte är teknisk: **stämmer största-talet-regeln med Mitt i Prick 4A?** `MINNESSIFFER-KONCEPT.md` namnger boken som källa men säger inget om vilken term som fylls till 10. Om boken alltid fyller den översta lär appen ut något annat än klassrummet. Regeln går att vända med en rad (`ADD_OPTS`), så det är inte blockerande — men det bör kontrolleras mot boken.
