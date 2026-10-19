/* D39 · Snällare app: inga dömande ord i det barnet ser.
   Svepet läser varje modul i js/ (utom matteprovet, som sköts för sig), tar bort kommentarerna
   och larmar om en synlig sträng innehåller "Fel!", "Fel svar" eller "Tyvärr". */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const MP = require('../js/shared.js');
const JS = join(dirname(fileURLToPath(import.meta.url)), '..', 'js');
const FILES = readdirSync(JS).filter(f => f.endsWith('.js') && !f.startsWith('matteprov'));
const BANNED = /Fel!|Fel svar|Tyvärr/i;

/* Kommentarerna bort, strängarna kvar (radbrytningarna står kvar, så radnumren stämmer).
   Går tecken för tecken och håller reda på strängar ('…', "…", `…` med ${…} i flera nivåer)
   och reguljära uttryck, så att "//" i en adress eller ' i /'/ inte förvirrar svepet. */
function stripComments(src) {
  let out = '', i = 0;
  const st = [];                      // 'code' | "'" | '"' | '`'; ${ i en mall lägger 'code' överst
  const depth = [];                   // klammerdjup per 'code'-nivå inne i en mall
  let prev = '';                      // senaste tecken i koden som inte är blanktecken
  const top = () => st.length ? st[st.length - 1] : 'code';
  while (i < src.length) {
    const c = src[i], n = src[i + 1], s = top();
    if (s === "'" || s === '"') {
      out += c;
      if (c === '\\') { out += n || ''; i += 2; continue; }
      if (c === s || c === '\n') st.pop();
      i++; continue;
    }
    if (s === '`') {
      out += c;
      if (c === '\\') { out += n || ''; i += 2; continue; }
      if (c === '`') { st.pop(); prev = '`'; i++; continue; }
      if (c === '$' && n === '{') { out += n; st.push('code'); depth.push(0); i += 2; prev = '{'; continue; }
      i++; continue;
    }
    // kod
    if (c === '/' && n === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') {
      const e = src.indexOf('*/', i + 2), end = e < 0 ? src.length : e + 2;
      out += src.slice(i, end).replace(/[^\n]/g, ''); i = end; continue;
    }
    if (c === '/' && (prev === '' || '(,=:[!&|?{};+-*%<>~^'.includes(prev) || /\b(return|typeof|in|of)$/.test(out.trimEnd()))) {
      let j = i + 1, cls = false;     // ett reguljärt uttryck: hoppa till dess avslutande /
      while (j < src.length && src[j] !== '\n') {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '[') cls = true; else if (src[j] === ']') cls = false;
        else if (src[j] === '/' && !cls) break;
        j++;
      }
      out += src.slice(i, j + 1); i = j + 1; prev = '/'; continue;
    }
    if (c === "'" || c === '"' || c === '`') { st.push(c); out += c; i++; continue; }
    if (st.length && s === 'code') {
      if (c === '{') depth[depth.length - 1]++;
      if (c === '}') {
        if (depth[depth.length - 1] === 0) { st.pop(); depth.pop(); out += c; i++; continue; }
        depth[depth.length - 1]--;
      }
    }
    if (!/\s/.test(c)) prev = c;
    out += c; i++;
  }
  return out;
}
function hits(src) {
  return stripComments(src).split('\n').map((l, k) => [k + 1, l]).filter(([, l]) => BANNED.test(l));
}

describe('D39: inga dömande ord i modulerna', () => {
  it('svepet ser strängar men inte kommentarer', () => {
    expect(hits("// Fel svar → samma fråga igen\n/* Tyvärr */\nconst a = 1;")).toEqual([]);
    expect(hits("const t = 'Fel!';").length).toBe(1);
    expect(hits('el.innerHTML = `<b>Tyvärr</b>`;').length).toBe(1);
    expect(hits("const u = 'https://x.se'; const v = 'Fel svar';").length).toBe(1);
  });

  it.each(FILES)('%s', f => {
    const found = hits(readFileSync(join(JS, f), 'utf8')).map(([n, l]) => `${f}:${n}: ${l.trim().slice(0, 120)}`);
    expect(found).toEqual([]);
  });
});

describe('D39: resultatraden', () => {
  it('säger vad barnet klarade, aldrig "rätt" som dom', () => {
    expect(MP.resultNote(5, 5)).toBe('Du klarade alla 5!');
    expect(MP.resultNote(4, 5)).toBe('Du klarade 4 av 5 – nästan alla!');
    expect(MP.resultNote(7, 10)).toBe('Du klarade 7 av 10 – de andra övar vi mer på');
    expect(MP.resultNote(0, 10)).toBe('De här övar vi mer på');
    expect(MP.resultNote(7, 10, ' på första försöket')).toBe('Du klarade 7 av 10 på första försöket – de andra övar vi mer på');
    [0, 1, 3, 9, 10].forEach(c => expect(MP.resultNote(c, 10)).not.toMatch(/rätt|fel|tyvärr/i));
  });
});
