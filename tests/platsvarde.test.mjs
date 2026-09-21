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
