/* Tester för js/shared.js (window.MP / CJS-export) */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const MP = require('../js/shared.js');

describe('MP.createRetryQuiz', () => {
  it('12 tal, 1 fel: firstTryCorrect 11, pct 92, klar efter rättning', () => {
    const items = [1,2,3,4,5,6,7,8,9,10,11,12];
    const quiz = MP.createRetryQuiz(items);
    for (let i = 0; i < 12; i++) {
      const item = quiz.current();
      expect(item).toBe(items[i]);
      if (i === 4) {
        quiz.answer(false);                 // fel på första försöket
        expect(quiz.current()).toBe(items[4]); // samma tal igen
        quiz.answer(true);                  // rättat
      } else {
        quiz.answer(true);
      }
    }
    expect(quiz.isDone()).toBe(true);
    expect(quiz.current()).toBe(null);
    const s = quiz.stats();
    expect(s).toMatchObject({ total: 12, firstTryCorrect: 11, pct: 92 });
    expect(s.pct).toBeLessThanOrEqual(100);
    expect(quiz.progress()).toEqual({ answered: 12, total: 12 });
  });

  it('pct blir aldrig >100 – extra answer-anrop efter klart ignoreras', () => {
    const quiz = MP.createRetryQuiz([1, 2]);
    quiz.answer(true);
    quiz.answer(true);
    expect(quiz.isDone()).toBe(true);
    quiz.answer(true);
    quiz.answer(true);
    expect(quiz.stats().pct).toBe(100);
    expect(quiz.stats().firstTryCorrect).toBe(2);
    expect(quiz.progress()).toEqual({ answered: 2, total: 2 });
  });

  it('endReview: fel tal repeteras EN gång sist, utan att påverka poängen', () => {
    const quiz = MP.createRetryQuiz(['a', 'b', 'c'], { endReview: true });
    quiz.answer(true);            // a rätt
    quiz.answer(false);           // b fel (första försöket)
    quiz.answer(true);            // b rättat
    quiz.answer(true);            // c rätt
    // Huvudpasset klart – men repetitionen av b återstår
    expect(quiz.isDone()).toBe(false);
    expect(quiz.current()).toBe('b');
    expect(quiz.progress()).toEqual({ answered: 3, total: 3 });
    quiz.answer(false);           // fel i repetitionen → samma igen
    expect(quiz.current()).toBe('b');
    quiz.answer(true);            // repetitionen klar
    expect(quiz.isDone()).toBe(true);
    expect(quiz.current()).toBe(null);
    const s = quiz.stats();
    expect(s.firstTryCorrect).toBe(2);
    expect(s.pct).toBe(67);       // repetitionen påverkar inte poängen
    expect(s.pct).toBeLessThanOrEqual(100);
  });

  it('terminerar med endReview även vid många fel', () => {
    const quiz = MP.createRetryQuiz([1, 2], { endReview: true });
    let guard = 0;
    while (!quiz.isDone() && guard < 100) {
      guard++;
      // Svara fel varannan gång, rätt varannan – ska ändå terminera
      quiz.answer(guard % 2 === 0);
    }
    expect(quiz.isDone()).toBe(true);
    expect(guard).toBeLessThan(100);
  });

  it('tom items-array: klar direkt, pct 0', () => {
    const quiz = MP.createRetryQuiz([]);
    expect(quiz.isDone()).toBe(true);
    expect(quiz.current()).toBe(null);
    expect(quiz.stats()).toEqual({ total: 0, firstTryCorrect: 0, pct: 0, attempts: 0 });
    expect(quiz.progress()).toEqual({ answered: 0, total: 0 });
  });

  it('alla fel: pct 0 men klar efter rättning', () => {
    const quiz = MP.createRetryQuiz([1, 2, 3]);
    for (let i = 0; i < 3; i++) {
      quiz.answer(false);
      quiz.answer(true);
    }
    expect(quiz.isDone()).toBe(true);
    expect(quiz.stats().pct).toBe(0);
    expect(quiz.stats().firstTryCorrect).toBe(0);
  });

  it('regression klockan: 5 frågor, fel på fråga 2 → testet blir klart', () => {
    const questions = [{h:3,m:0},{h:7,m:25},{h:12,m:15},{h:6,m:30},{h:11,m:55}];
    const quiz = MP.createRetryQuiz(questions);
    quiz.answer(true);                       // fråga 1
    expect(quiz.current()).toBe(questions[1]);
    quiz.answer(false);                      // fråga 2 fel
    expect(quiz.current()).toBe(questions[1]); // SAMMA fråga igen (ingen rekursion/loop)
    quiz.answer(true);                       // rättad
    quiz.answer(true);                       // fråga 3
    quiz.answer(true);                       // fråga 4
    quiz.answer(true);                       // fråga 5
    expect(quiz.isDone()).toBe(true);
    expect(quiz.stats()).toMatchObject({ total: 5, firstTryCorrect: 4, pct: 80 });
  });

  it('regression 10-kompisar: 10 frågor, 1 fel → testet blir klart, 9/10', () => {
    const quiz = MP.createRetryQuiz([0,1,2,3,4,5,6,7,8,9]);
    for (let i = 0; i < 10; i++) {
      if (i === 7) { quiz.answer(false); quiz.answer(true); }
      else quiz.answer(true);
    }
    expect(quiz.isDone()).toBe(true);
    expect(quiz.stats()).toMatchObject({ total: 10, firstTryCorrect: 9, pct: 90 });
  });
});

describe('MP.timeToSwedish', () => {
  it.each([
    [3, 0,  'tre'],            // hel timme utan "(tre)"-buggen
    [15, 0, 'tre'],
    [0, 0,  'tolv'],
    [6, 30, 'halv sju'],
    [14, 45,'kvart i tre'],
    [7, 25, 'fem i halv åtta'],
    [7, 35, 'fem över halv åtta'],
    [23, 55,'fem i tolv'],
    [12, 15,'kvart över tolv'],
    [12, 30,'halv ett'],
    [9, 5,  'fem över nio'],
    [9, 10, 'tio över nio'],
    [9, 20, 'tjugo över nio'],
    [9, 40, 'tjugo i tio'],
    [9, 50, 'tio i tio'],
  ])('(%i,%i) → "%s"', (h, m, expected) => {
    expect(MP.timeToSwedish(h, m)).toBe(expected);
  });

  it('faller tillbaka till digitalt format för udda minuter', () => {
    expect(MP.timeToSwedish(9, 7)).toBe('09:07');
  });
});

describe('MP.escapeHtml', () => {
  it('escapar enkelfnutt', () => {
    expect(MP.escapeHtml("O'Hara")).toBe('O&#39;Hara');
  });
  it('escapar & < > "', () => {
    expect(MP.escapeHtml('<b>"&')).toBe('&lt;b&gt;&quot;&amp;');
  });
});

describe('MP.resultTier', () => {
  it.each([
    [100, 'excellent'],
    [90,  'excellent'],
    [89,  'good'],
    [70,  'good'],
    [69,  'ok'],
    [50,  'ok'],
    [49,  'practice'],
    [0,   'practice'],
  ])('%i%% → %s', (pct, tier) => {
    expect(MP.resultTier(pct)).toBe(tier);
  });
});

describe('MP.getMedal', () => {
  it.each([
    [100, '🥇'],
    [95,  '🥇'],
    [94,  '🥈'],
    [85,  '🥈'],
    [84,  '🥉'],
    [75,  '🥉'],
    [74,  ''],
    [0,   ''],
  ])('%i%% → "%s"', (pct, medal) => {
    expect(MP.getMedal(pct)).toBe(medal);
  });
  it('null/undefined → tom sträng', () => {
    expect(MP.getMedal(null)).toBe('');
    expect(MP.getMedal(undefined)).toBe('');
  });
});

describe('MP.shuffle', () => {
  it('returnerar NY array med samma element', () => {
    const arr = [1, 2, 3, 4, 5];
    const out = MP.shuffle(arr);
    expect(out).not.toBe(arr);
    expect(arr).toEqual([1, 2, 3, 4, 5]);   // originalet orört
    expect([...out].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('MP.feedbackMessage', () => {
  it('ger uppmuntrande svensk text för alla nivåer', () => {
    expect(MP.feedbackMessage(100).msg).toContain('PERFEKT');
    for (const pct of [0, 40, 60, 75, 90, 100]) {
      const fb = MP.feedbackMessage(pct);
      expect(typeof fb.msg).toBe('string');
      expect(fb.msg.length).toBeGreaterThan(0);
      expect(typeof fb.emoji).toBe('string');
    }
  });
});
