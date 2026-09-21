/* tests/platsvarde.test.mjs */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

/* Minimal DOM-attrapp: modulen rör bara style/innerHTML/classList på
   element den slår upp med getElementById. Okända id:n får ett tomt element,
   så att t.ex. confetti-container och pv-feedback aldrig blir null. */
function fakeEl(id) {
  return {
    id, style: {}, innerHTML: '', textContent: '', className: '', disabled: false,
    dataset: {}, children: [],
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
      toggle(c, on) {
        if (on === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); }
        else { on ? this._s.add(c) : this._s.delete(c); }
      },
      contains(c) { return this._s.has(c); },
    },
    querySelector() { return null; }, querySelectorAll() { return []; },
    appendChild(c) { this.children.push(c); }, remove() {},
    getBoundingClientRect() { return { width: 300, height: 160 }; },
    addEventListener() {},
  };
}
function makeDoc() {
  const els = {};
  return {
    els,
    getElementById(id) { if (!(id in els)) els[id] = fakeEl(id); return els[id]; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    createElement(tag) { return fakeEl(tag); },
  };
}

globalThis.App = { Sound: { play() {} }, Confetti: { burst() {} } };
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
globalThis.requestAnimationFrame = fn => fn();

const PV = require('../js/platsvarde.js');
const { generateQuestions, setStateForTest, getState } = PV.__test;

describe('B1 — fyra unika alternativ (granskning B1)', () => {
  it('10 000 slumpade pass: aldrig dubbletter, rätt svar exakt en gång', () => {
    let dubbletter = 0;
    for (let i = 0; i < 10000; i++) {
      const q = generateQuestions().find(x => x.type === 'B1');
      expect(q.options.length).toBe(4);
      if (new Set(q.options).size !== 4) dubbletter++;
      expect(q.options.filter(o => o === q.correct).length).toBe(1);
      q.options.forEach(o => expect(o).toBeGreaterThanOrEqual(100));
    }
    expect(dubbletter).toBe(0);
  });
});

describe('A2 — distraktorer är platsvärdesförväxlingar (granskning B2)', () => {
  it('10 000 pass: fyra unika, rätt med, alla k×10^p, inga två skiljer med exakt 1', () => {
    let grannar = 0, felform = 0;
    for (let i = 0; i < 10000; i++) {
      const q = generateQuestions().find(x => x.type === 'A2');
      expect(q.options.length).toBe(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options.filter(o => o === q.correct).length).toBe(1);
      q.options.forEach(o => { if (!/^[1-9]0{0,2}$/.test(String(o))) felform++; });
      for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) {
        if (Math.abs(q.options[a] - q.options[b]) === 1) grannar++;
      }
    }
    expect(felform).toBe(0);
    expect(grannar).toBe(0);
  });
});

describe('D6/D7 — frågeföljd och A3-pool', () => {
  it('passet har två C1 och två C2 (D6), A3-poolen är 4 unika siffror 1–9 (D7)', () => {
    for (let i = 0; i < 2000; i++) {
      const qs = generateQuestions();
      expect(qs.map(q => q.type)).toEqual(['A1','A2','A3','B1','B2','C1','C2','C2','D1','D2']);
      const a3 = qs[2];
      expect(a3.options.length).toBe(4);
      expect(new Set(a3.options).size).toBe(4);
      expect(a3.options).toContain(a3.correct);
      a3.options.forEach(o => { expect(o).toBeGreaterThanOrEqual(1); expect(o).toBeLessThanOrEqual(9); });
      const c3 = qs[7];
      expect(c3.options.length).toBe(4);
      expect(new Set(c3.options).size).toBe(4);
      expect(c3.options).toContain(c3.correct);
    }
  });
});

describe('B6 — facit landar i frågans egna rutor och väntar på Nästa', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllTimers();
    globalThis.document = makeDoc();
  });

  it('B2: efter två fel står rätt siffror i fälten, numpad-tryck ignoreras, ingen timer', () => {
    const q = { level: 'B', type: 'B2', num: 697, correct: { h: 6, t: 9, e: 7 } };
    setStateForTest({ questions: [q], qIndex: 0, currentQ: q, attempts: 0, inputLocked: false, score: 0 });
    const fyll = (a, b, c) => { PV.decompPress(a); PV.decompPress(b); PV.decompPress(c); PV.decompPress('✓'); };
    fyll('1', '2', '3');            // fel 1 → prova igen, fälten kvar
    expect(getState().inputLocked).toBe(false);
    PV.decompPress('⌫'); PV.decompPress('⌫'); PV.decompPress('⌫'); PV.decompPress('⌫');
    fyll('9', '6', '7');            // fel 2 → facit
    const st = getState();
    expect(st.attempts).toBe(2);
    expect(st.inputLocked).toBe(true);
    expect(document.getElementById('pv-dc-val-0').textContent).toBe('6');
    expect(document.getElementById('pv-dc-val-1').textContent).toBe('9');
    expect(document.getElementById('pv-dc-val-2').textContent).toBe('7');
    expect(document.getElementById('pv-feedback').innerHTML).toMatch(/pv-next/);
    vi.advanceTimersByTime(10000);
    expect(getState().qIndex).toBe(0);
    PV.decompPress('1');
    expect(document.getElementById('pv-dc-val-0').textContent).toBe('6');
  });

  it('D2: efter två fel ligger rätt ordning i de fyra platserna', () => {
    const q = { level: 'D', type: 'D2', nums: [845, 111, 851, 737], correct: [111, 737, 845, 851] };
    setStateForTest({ questions: [q], qIndex: 0, currentQ: q, attempts: 0, inputLocked: false, score: 0 });
    [845, 111, 851, 737].forEach(n => PV.handleOrderClick(n)); PV.submitOrder();
    expect(getState().inputLocked).toBe(false);
    PV.orderUndo(); PV.orderUndo(); PV.orderUndo(); PV.orderUndo();
    [851, 845, 737, 111].forEach(n => PV.handleOrderClick(n)); PV.submitOrder();
    expect(getState().attempts).toBe(2);
    [111, 737, 845, 851].forEach((n, i) => {
      const slot = document.getElementById(`pv-slot-${i}`);
      expect(slot.className).toMatch(/filled/);
      expect(slot.innerHTML.replace(/<[^>]+>/g, '')).toBe(String(n));
    });
    vi.advanceTimersByTime(10000);
    expect(getState().qIndex).toBe(0);
  });
});

describe('A1 — fel första tryck låser inte frågan (granskning A1)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllTimers(); // föregående tests 1,4 s-timer får inte spilla över
    globalThis.document = makeDoc();
    const q = { level: 'A', type: 'A1', num: 165, target: 'ental' };
    setStateForTest({ questions: [q], qIndex: 0, currentQ: q, attempts: 0, inputLocked: false, score: 0 });
  });

  it('efter ett fel: bara den tryckta rutan låses, rätt ruta får varken färg eller lås', () => {
    PV.handleDigitClick('hundratal');
    const st = getState();
    expect(st.attempts).toBe(1);
    expect(st.inputLocked).toBe(false);
    const box = id => document.getElementById(id);
    expect(box('pv-digit-hundratal').style.pointerEvents).toBe('none');
    expect(box('pv-digit-ental').style.pointerEvents).not.toBe('none');
    expect(box('pv-digit-tiotal').style.pointerEvents).not.toBe('none');
    // Svaret ges inte bort: rätt ruta får ingen grön bakgrund vid försök 1.
    expect(box('pv-digit-ental').style.background || '').not.toMatch(/34,\s*197,\s*94/);
  });

  it('en andra tryckning går igenom och rättas', () => {
    PV.handleDigitClick('hundratal');
    PV.handleDigitClick('ental');
    const st = getState();
    expect(st.attempts).toBe(2);
    expect(st.score).toBe(1);
    expect(st.inputLocked).toBe(true);
    expect(document.els['pv-feedback'].innerHTML).toMatch(/Rätt/);
  });

  it('två fel: rutorna låses, facit visas i rutorna, ingen timer går vidare', () => {
    PV.handleDigitClick('hundratal');
    PV.handleDigitClick('tiotal');
    const st = getState();
    expect(st.attempts).toBe(2);
    expect(st.inputLocked).toBe(true);
    expect(document.els['pv-digit-ental'].style.background).toMatch(/34,\s*197,\s*94/);
    // Facit står kvar tills barnet trycker vidare (B6): ingen automatisk nextQuestion.
    vi.advanceTimersByTime(10000);
    expect(getState().qIndex).toBe(0);
    expect(document.els['pv-feedback'].innerHTML).toMatch(/pv-next/);
  });
});
