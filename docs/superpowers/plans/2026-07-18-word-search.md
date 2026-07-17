# Sopa de letras (Word Search) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new fully seeded "Sopa de letras" (Word Search) game to the SourcePlay monorepo, matching the Sudoku visual style and implementing dual pointer/mouse interaction.

**Architecture:** Create a new package `@sourceplay/wordsearch` under `packages/wordsearch`. The core logic handles seeded selection, collision-free grid placement, and double-occurrence checking. The UI handles responsive CSS grids, CSS variables, and dual click/drag selection.

**Tech Stack:** TypeScript, Vite, CSS, standard web APIs.

## Global Constraints

- **Theme variables**: Must use CSS variables from `@sourceplay/shared/style.css`.
- **Simplification**: Game screen must only contain "Reiniciar" and "Salir al menú" buttons.
- **Accents**: Accents/diaereses must be normalized, but `Ñ` must be preserved.
- **Grid sizes**:
  - Fácil: 10x10 grid, 6-8 words.
  - Medio: 13x13 grid, 8-12 words.
  - Difícil: 16x16 grid, 12-16 words.
  - Experto: 20x20 grid, 16-22 words.

---

### Task 1: Package Scaffolding & Monorepo Configuration

**Files:**
- Create: `packages/wordsearch/package.json`
- Create: `packages/wordsearch/tsconfig.json`
- Create: `packages/wordsearch/vite.config.ts`
- Create: `packages/wordsearch/index.html`
- Modify: `package.json` (Root)
- Modify: `scripts/assemble-build.js`

**Interfaces:**
- Produces: Scaffolding files for `@sourceplay/wordsearch` package, configuring compilation, Vite dev server, and build assembly paths.

- [ ] **Step 1: Create package.json for wordsearch**
  Write to `packages/wordsearch/package.json`:
  ```json
  {
    "name": "@sourceplay/wordsearch",
    "private": true,
    "version": "1.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build"
    },
    "dependencies": {
      "@sourceplay/shared": "*"
    }
  }
  ```

- [ ] **Step 2: Create tsconfig.json for wordsearch**
  Write to `packages/wordsearch/tsconfig.json`:
  ```json
  {
    "extends": "../../tsconfig.json",
    "compilerOptions": {
      "moduleResolution": "node"
    },
    "include": ["src/**/*", "vite.config.ts"]
  }
  ```

- [ ] **Step 3: Create vite.config.ts for wordsearch**
  Write to `packages/wordsearch/vite.config.ts`:
  ```typescript
  import { defineConfig } from 'vite';

  export default defineConfig({
    server: {
      port: 5176
    }
  });
  ```

- [ ] **Step 4: Create basic index.html placeholder**
  Write to `packages/wordsearch/index.html`:
  ```html
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sopa de Letras — SourcePlay</title>
    <script type="module">
      import { initTheme } from '@sourceplay/shared';
      initTheme();
    </script>
  </head>
  <body>
    <div id="app">Sopa de Letras Scaffold</div>
    <script type="module" src="/src/main.ts"></script>
  </body>
  </html>
  ```

- [ ] **Step 5: Create src/main.ts placeholder**
  Create directory `packages/wordsearch/src` and write to `packages/wordsearch/src/main.ts`:
  ```typescript
  import { createHeader } from '@sourceplay/shared';
  import './style.css';

  createHeader({ showBackButton: true });
  console.log('Wordsearch loaded');
  ```

- [ ] **Step 6: Create src/style.css placeholder**
  Write to `packages/wordsearch/src/style.css`:
  ```css
  @import "@sourceplay/shared/style.css";
  ```

- [ ] **Step 7: Register wordsearch in root package.json scripts**
  Modify `package.json` in the root folder to support wordsearch commands:
  ```json
  "dev": "concurrently \"npm run dev:selector\" \"npm run dev:sudoku\" \"npm run dev:nonogram\" \"npm run dev:wordsearch\"",
  "dev:wordsearch": "npm run dev --workspace=@sourceplay/wordsearch",
  ```

- [ ] **Step 8: Update assembly script**
  Modify `scripts/assemble-build.js` to include wordsearch:
  - Add path variables:
    ```javascript
    const wordsearchDist = path.join(__dirname, '../packages/wordsearch/dist');
    const targetWordsearchPath = path.join(selectorDist, 'games/wordsearch');
    ```
  - Add copying block:
    ```javascript
    if (fs.existsSync(wordsearchDist)) {
      console.log(`Copiando build de Sopa de letras de ${wordsearchDist} a ${targetWordsearchPath}...`);
      copyDirSync(wordsearchDist, targetWordsearchPath);
      console.log('¡Sopa de letras copiada con éxito!');
    } else {
      console.warn('Advertencia: Compilación de Sopa de letras no encontrada.');
    }
    ```

- [ ] **Step 9: Run install and build verify**
  Run: `npm install`
  Run: `npm run build:all`
  Verify that the build passes and files are created under `apps/selector/dist/games/wordsearch`.

---

### Task 2: Wordlist Extraction and Accent Cleaning

**Files:**
- Create: `packages/wordsearch/src/words.ts`
- Create: `packages/wordsearch/src/test-words.ts`
- Modify: `packages/wordsearch/src/core.ts`

**Interfaces:**
- Produces: `cleanWord(word: string): string` (accent-stripped uppercase word).
- Produces: `SPANISH_WORDS: string[]` (deduplicated dictionary of $\ge 5000$ Spanish words).

- [ ] **Step 1: Write script to fetch and format Spanish wordlist**
  Create a temporary script `packages/wordsearch/scratch/download-words.js` to pull 5000+ words from the raw GitHub list, filter for lengths 4-10, remove accents (preserving Ñ), deduplicate, and write out to `src/words.ts`:
  ```javascript
  const fs = require('fs');
  const https = require('https');
  const path = require('path');

  const url = 'https://raw.githubusercontent.com/mazyvan/most-common-spanish-words/master/most-common-spanish-words-v4.txt';
  const outputPath = path.join(__dirname, '../src/words.ts');

  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const lines = data.split('\n');
      const uniqueWords = new Set();
      
      const clean = (w) => {
        return w.trim()
          .toLowerCase()
          .replace(/[áä]/g, 'a')
          .replace(/[éë]/g, 'e')
          .replace(/[íï]/g, 'i')
          .replace(/[óö]/g, 'o')
          .replace(/[úü]/g, 'u')
          .toUpperCase();
      };

      for (let line of lines) {
        const word = clean(line);
        if (/^[A-ZÑ]{4,15}$/.test(word)) {
          uniqueWords.add(word);
        }
      }

      const list = Array.from(uniqueWords);
      console.log(`Fetched ${list.length} valid words.`);

      const content = `export const SPANISH_WORDS = ${JSON.stringify(list, null, 2)};\n`;
      fs.writeFileSync(outputPath, content);
      console.log('Saved src/words.ts');
    });
  });
  ```

- [ ] **Step 2: Run download script**
  Run: `node packages/wordsearch/scratch/download-words.js`
  Verify that `packages/wordsearch/src/words.ts` is created and contains over 5000 unique words.

- [ ] **Step 3: Create core.ts with cleanWord function**
  Write to `packages/wordsearch/src/core.ts`:
  ```typescript
  export function cleanWord(word: string): string {
    return word
      .toLowerCase()
      .replace(/[áä]/g, 'a')
      .replace(/[éë]/g, 'e')
      .replace(/[íï]/g, 'i')
      .replace(/[óö]/g, 'o')
      .replace(/[úü]/g, 'u')
      .toUpperCase();
  }
  ```

- [ ] **Step 4: Create word validation test script**
  Write to `packages/wordsearch/src/test-words.ts`:
  ```typescript
  import { SPANISH_WORDS } from './words';
  import { cleanWord } from './core';

  function testWordlist() {
    console.log('Testing wordlist...');
    if (SPANISH_WORDS.length < 5000) {
      throw new Error(`Wordlist too small: ${SPANISH_WORDS.length}`);
    }
    const cleanTest = cleanWord('áéíóúüñ');
    if (cleanTest !== 'AEIOUUN') {
      throw new Error(`Accent cleaning failed: ${cleanTest}`);
    }
    console.log('Wordlist test PASSED. Word count:', SPANISH_WORDS.length);
  }

  testWordlist();
  ```

- [ ] **Step 5: Run tests**
  Run: `npx vite-node packages/wordsearch/src/test-words.ts`
  Expected output: `Wordlist test PASSED. Word count: <count>` (where count $\ge 5000$).

---

### Task 3: Seeded Generation Logic & Duplicate Prevention

**Files:**
- Create: `packages/wordsearch/src/rng.ts`
- Modify: `packages/wordsearch/src/core.ts`
- Create: `packages/wordsearch/src/test-gen.ts`

**Interfaces:**
- Produces: `generateWordSearch(difficulty: string, seedStr: string): WordSearchBoard`
- Interface `WordSearchBoard`:
  ```typescript
  export interface WordSearchBoard {
    grid: string[][];      // G x G grid of letters
    words: string[];       // Target words to find
    seed: string;          // Seed used
    difficulty: string;    // Difficulty level
  }
  ```

- [ ] **Step 1: Write rng.ts helper**
  Write to `packages/wordsearch/src/rng.ts`:
  ```typescript
  export function mulberry32(a: number): () => number {
    return function(): number {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  export function hashSeed(str: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  export function randomSeed(): number {
    return (Date.now() ^ Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0;
  }

  export function parseSeed(str: string): number {
    const clean = str.trim();
    if (/^\d+$/.test(clean)) {
      return parseInt(clean, 10) >>> 0;
    }
    return hashSeed(clean);
  }
  ```

- [ ] **Step 2: Implement generateWordSearch in core.ts**
  Append to `packages/wordsearch/src/core.ts`:
  ```typescript
  import { SPANISH_WORDS } from './words';
  import { mulberry32, parseSeed } from './rng';

  export interface WordSearchBoard {
    grid: string[][];
    words: string[];
    seed: string;
    difficulty: string;
  }

  const DIRECTIONS = [
    { x: 1, y: 0 },   // H Right
    { x: -1, y: 0 },  // H Left
    { x: 0, y: 1 },   // V Down
    { x: 0, y: -1 },  // V Up
    { x: 1, y: 1 },   // D Down-Right
    { x: -1, y: 1 },  // D Down-Left
    { x: 1, y: -1 },  // D Up-Right
    { x: -1, y: -1 }  // D Up-Left
  ];

  export function generateWordSearch(difficulty: string, seedStr: string): WordSearchBoard {
    let size = 13;
    let wordCount = 10;

    switch (difficulty) {
      case 'facil':
        size = 10;
        wordCount = 7; // range 6-8
        break;
      case 'medio':
        size = 13;
        wordCount = 10; // range 8-12
        break;
      case 'dificil':
        size = 16;
        wordCount = 14; // range 12-16
        break;
      case 'experto':
        size = 20;
        wordCount = 19; // range 16-22
        break;
    }

    const numericSeed = parseSeed(seedStr);
    let attempt = 0;

    while (attempt < 1000) {
      const prng = mulberry32(numericSeed + attempt);
      const board = tryGenerateBoard(size, wordCount, prng, seedStr, difficulty);
      if (board) {
        return board;
      }
      attempt++;
    }

    throw new Error('Failed to generate board after 1000 attempts');
  }

  function tryGenerateBoard(
    size: number,
    wordCount: number,
    prng: () => number,
    seedStr: string,
    difficulty: string
  ): WordSearchBoard | null {
    // 1. Filter dictionary
    const pool = SPANISH_WORDS.filter(w => w.length >= 4 && w.length <= size);
    if (pool.length < wordCount) return null;

    // 2. Select N random words deterministically
    const selectedWords: string[] = [];
    const usedIndices = new Set<number>();
    while (selectedWords.length < wordCount) {
      const idx = Math.floor(prng() * pool.length);
      if (!usedIndices.has(idx)) {
        usedIndices.add(idx);
        selectedWords.push(pool[idx]);
      }
    }

    // 3. Sort descending by length to make placement easier
    selectedWords.sort((a, b) => b.length - a.length);

    // 4. Initialize grid
    const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));

    // 5. Place words
    for (const word of selectedWords) {
      let placed = false;
      // Try up to 500 times to place the word
      for (let pTry = 0; pTry < 500; pTry++) {
        const startX = Math.floor(prng() * size);
        const startY = Math.floor(prng() * size);
        const dir = DIRECTIONS[Math.floor(prng() * DIRECTIONS.length)];

        if (canPlaceWord(grid, word, startX, startY, dir, size)) {
          placeWord(grid, word, startX, startY, dir);
          placed = true;
          break;
        }
      }
      if (!placed) return null; // placement failed, discard grid
    }

    // 6. Fill empty cells with random letters matching Spanish frequencies
    const alphabet = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (grid[y][x] === '') {
          grid[y][x] = alphabet[Math.floor(prng() * alphabet.length)];
        }
      }
    }

    // 7. Verify no accidental double occurrences of selected words
    for (const word of selectedWords) {
      const occurrences = countWordOccurrences(grid, word, size);
      if (occurrences !== 1) {
        return null; // fails condition of exactly 1 occurrence, discard grid
      }
    }

    return {
      grid,
      words: selectedWords,
      seed: seedStr,
      difficulty
    };
  }

  function canPlaceWord(
    grid: string[][],
    word: string,
    startX: number,
    startY: number,
    dir: { x: number; y: number },
    size: number
  ): boolean {
    let curX = startX;
    let curY = startY;

    for (let i = 0; i < word.length; i++) {
      if (curX < 0 || curX >= size || curY < 0 || curY >= size) return false;
      const cellVal = grid[curY][curX];
      if (cellVal !== '' && cellVal !== word[i]) return false;
      curX += dir.x;
      curY += dir.y;
    }
    return true;
  }

  function placeWord(
    grid: string[][],
    word: string,
    startX: number,
    startY: number,
    dir: { x: number; y: number }
  ): void {
    let curX = startX;
    let curY = startY;
    for (let i = 0; i < word.length; i++) {
      grid[curY][curX] = word[i];
      curX += dir.x;
      curY += dir.y;
    }
  }

  export function countWordOccurrences(grid: string[][], word: string, size: number): number {
    let count = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        for (const dir of DIRECTIONS) {
          if (checkWordAt(grid, word, x, y, dir, size)) {
            count++;
          }
        }
      }
    }
    return count;
  }

  function checkWordAt(
    grid: string[][],
    word: string,
    startX: number,
    startY: number,
    dir: { x: number; y: number },
    size: number
  ): boolean {
    let curX = startX;
    let curY = startY;
    for (let i = 0; i < word.length; i++) {
      if (curX < 0 || curX >= size || curY < 0 || curY >= size) return false;
      if (grid[curY][curX] !== word[i]) return false;
      curX += dir.x;
      curY += dir.y;
    }
    return true;
  }
  ```

- [ ] **Step 3: Create board generation test script**
  Write to `packages/wordsearch/src/test-gen.ts`:
  ```typescript
  import { generateWordSearch } from './core';

  function testGenerator() {
    console.log('Testing board generator...');
    const b1 = generateWordSearch('medio', 'sourceplay');
    const b2 = generateWordSearch('medio', 'sourceplay');

    // Test determinism
    if (JSON.stringify(b1.grid) !== JSON.stringify(b2.grid)) {
      throw new Error('Determinism check failed: boards generated from the same seed differ!');
    }

    // Test distinct word lists
    const b3 = generateWordSearch('medio', 'anotherseed');
    if (JSON.stringify(b1.words) === JSON.stringify(b3.words)) {
      throw new Error('Word variety check failed: same words picked for different seeds!');
    }

    // Verify word counts
    if (b1.words.length !== 10) {
      throw new Error(`Expected 10 words, got ${b1.words.length}`);
    }

    console.log('Generator test PASSED. Words chosen:', b1.words.join(', '));
  }

  testGenerator();
  ```

- [ ] **Step 4: Run generator test**
  Run: `npx vite-node packages/wordsearch/src/test-gen.ts`
  Expected output: `Generator test PASSED` with lists of chosen words.

---

### Task 4: UI layout & Styles

**Files:**
- Modify: `packages/wordsearch/index.html`
- Modify: `packages/wordsearch/src/style.css`

**Interfaces:**
- Produces: HTML structure and CSS layouts that adapt automatically to variables and screen sizes, mirroring Sudoku.

- [ ] **Step 1: Write index.html structure**
  Replace contents of `packages/wordsearch/index.html`:
  ```html
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sopa de Letras — SourcePlay</title>
    <script type="module">
      import { initTheme } from '@sourceplay/shared';
      initTheme();
    </script>
  </head>
  <body>
    <div class="app">
      <!-- MENÚ DE INICIO -->
      <div id="startMenu" class="view">
        <header class="game-local-header">
          <h1>Sopa de Letras</h1>
          <p class="menu-subtitle">Selecciona una dificultad para jugar</p>
        </header>

        <div class="menu-content">
          <div class="diff-vertical-grid" id="menuDiffGrid"></div>
          
          <div class="seed-section">
            <span class="seed-label">Semilla personalizada (opcional):</span>
            <input type="text" id="menuSeedInput" placeholder="Escribe una semilla propia…">
          </div>

          <button class="btn primary bold-btn" id="startGameBtn">Empezar Partida</button>
        </div>
      </div>

      <!-- PANTALLA DE JUEGO (Oculta por defecto) -->
      <div id="gameArea" class="view hidden">
        <header class="game-local-header">
          <h1>Sopa de Letras</h1>
        </header>

        <div class="ticket">
          <span>Semilla&nbsp;<b id="seedLabel">—</b></span>
          <span class="diff-tag" id="diffTag">—</span>
        </div>

        <div class="board-wrap">
          <div id="board"></div>
        </div>

        <div class="controls">
          <!-- LISTADO DE PALABRAS -->
          <div class="word-list-container">
            <h3>Palabras a buscar:</h3>
            <div id="wordList" class="word-list"></div>
          </div>

          <!-- CONTROLES DE SALIDA / REINICIO -->
          <div class="row-line">
            <button class="btn primary" id="restartGameBtn">Reiniciar</button>
            <button class="btn ghost" id="exitToMenuBtn">Salir al menú</button>
          </div>

          <div class="status-row">
            <span id="progressLabel">0 / 0</span>
            <span id="timer">00:00</span>
          </div>
        </div>
      </div>
    </div>

    <!-- TOAST NOTIFICACIONES -->
    <div class="toast" id="toast"></div>

    <!-- OVERLAY DE VICTORIA -->
    <div class="overlay" id="winOverlay">
      <div class="modal">
        <h2>¡Sopa Resuelta!</h2>
        <p id="winStats"></p>
        <button class="btn primary" id="winReplayBtn">Jugar otra partida</button>
      </div>
    </div>

    <!-- DIALOGO DE CONFIRMACION -->
    <div class="overlay" id="confirmOverlay">
      <div class="modal">
        <h2 id="confirmTitle">¿Confirmar acción?</h2>
        <p id="confirmDesc">Se perderá el progreso de la partida actual.</p>
        <div class="row-line" style="margin-top: 18px;">
          <button class="btn" id="confirmCancelBtn">Cancelar</button>
          <button class="btn primary" id="confirmOkBtn">Confirmar</button>
        </div>
      </div>
    </div>

    <script type="module" src="/src/main.ts"></script>
  </body>
  </html>
  ```

- [ ] **Step 2: Add CSS stylesheet matching Sudoku styling**
  Replace contents of `packages/wordsearch/src/style.css`:
  ```css
  @import "@sourceplay/shared/style.css";

  html, body {
    overflow: hidden;
    height: 100%;
  }

  body {
    background:
      repeating-linear-gradient(0deg, rgba(33,31,26,0.035) 0px, rgba(33,31,26,0.035) 1px, transparent 1px, transparent 28px),
      repeating-linear-gradient(90deg, rgba(33,31,26,0.035) 0px, rgba(33,31,26,0.035) 1px, transparent 1px, transparent 28px),
      var(--paper);
    color: var(--ink);
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: background-color 0.25s ease, color 0.25s ease;
  }

  .app {
    width: 100%;
    max-width: 440px;
    padding: 0 14px;
    height: calc(100dvh - 76px);
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    min-height: 0;
    overflow: hidden;
  }

  .game-local-header {
    text-align: center;
    margin-bottom: 2px;
  }
  .game-local-header h1 {
    font-family: 'Fraunces', serif;
    font-weight: 900;
    font-size: clamp(24px, 5.5vh, 32px);
    margin: 0;
    letter-spacing: -0.01em;
    color: var(--ink);
    transition: color 0.25s ease;
  }
  .menu-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--ink-soft);
  }

  .ticket {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--paper-deep);
    border: 1.5px dashed var(--ink-soft);
    border-radius: 4px;
    padding: 5px 12px;
    margin: 4px 0 6px;
    font-size: 11px;
    letter-spacing: 0.03em;
    transition: background-color 0.25s ease, border-color 0.25s ease;
  }
  .ticket b {
    color: var(--teal-deep);
    transition: color 0.25s ease;
  }
  .ticket .diff-tag {
    background: var(--ink);
    color: var(--paper);
    padding: 1px 7px;
    border-radius: 3px;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 9.5px;
    letter-spacing: 0.08em;
    transition: background-color 0.25s ease, color 0.25s ease;
  }

  .board-wrap {
    position: relative;
    background: var(--paper);
    border: 3px solid var(--ink);
    border-radius: 4px;
    padding: 4px;
    box-shadow: 0 4px 0 -2px rgba(33,31,26,0.12);
    width: 100%;
    max-width: min(100%, 39vh);
    aspect-ratio: 1;
    margin: 0 auto;
    transition: background-color 0.25s ease, border-color 0.25s ease;
  }
  #board {
    display: grid;
    width: 100%;
    aspect-ratio: 1;
    user-select: none;
    touch-action: none; /* Crucial for custom touch dragging drag select */
  }
  .cell {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--paper);
    border: 1px solid var(--line);
    cursor: pointer;
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    -webkit-tap-highlight-color: transparent;
    container-type: inline-size;
    transition: background-color 0.15s ease, color 0.15s ease;
  }
  .cell .letter {
    font-size: 55cqw;
    line-height: 1;
    z-index: 2;
  }

  /* Temporary dragging highlight styling */
  .cell.selecting {
    background-color: var(--amber-soft);
  }

  /* Found words highlight styling */
  .cell.selected-word {
    background-color: var(--same);
    color: var(--teal-deep);
  }
  .cell.start-cell {
    background-color: var(--amber);
    color: var(--ink);
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
  }

  .word-list-container {
    background: var(--paper-deep);
    border: 2px solid var(--ink);
    border-radius: var(--radius);
    padding: 8px 12px;
    max-height: 14vh;
    overflow-y: auto;
  }
  .word-list-container h3 {
    margin: 0 0 6px 0;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .word-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
    font-size: 12px;
  }
  .word-item {
    font-weight: 700;
    transition: color 0.25s, text-decoration 0.25s;
  }
  .word-item.found {
    text-decoration: line-through;
    color: var(--ink-soft);
    opacity: 0.6;
  }

  /* Buttons & Row layouts */
  .row-line {
    display: flex;
    gap: 8px;
    width: 100%;
  }
  .btn {
    flex: 1;
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    font-size: 13px;
    padding: 10px 16px;
    border: 2px solid var(--ink);
    border-radius: var(--radius);
    background-color: var(--paper);
    color: var(--ink);
    cursor: pointer;
    text-align: center;
    transition: background-color 0.15s, color 0.15s, transform 0.05s;
  }
  .btn:hover {
    background-color: var(--ink);
    color: var(--paper);
  }
  .btn:active {
    transform: translateY(1px);
  }
  .btn.primary {
    background-color: var(--teal);
    color: var(--paper);
  }
  .btn.primary:hover {
    background-color: var(--teal-deep);
  }
  .btn.ghost {
    background-color: transparent;
    border-color: transparent;
  }
  .btn.ghost:hover {
    background-color: rgba(33,31,26,0.06);
    color: var(--ink);
  }

  .menu-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 12px;
  }
  .diff-vertical-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .diff-vertical-btn {
    width: 100%;
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    font-size: 14px;
    padding: 12px;
    border: 2px solid var(--ink);
    border-radius: var(--radius);
    background-color: var(--paper);
    color: var(--ink);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .diff-vertical-btn:hover {
    background-color: var(--paper-deep);
  }
  .diff-vertical-btn.active {
    background-color: var(--ink);
    color: var(--paper);
  }

  .seed-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .seed-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--ink-soft);
  }
  .seed-section input {
    font-family: 'Space Mono', monospace;
    padding: 10px;
    border: 2px solid var(--ink);
    border-radius: var(--radius);
    background-color: var(--paper);
    color: var(--ink);
  }

  .status-row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 700;
    color: var(--ink-soft);
    padding: 2px 4px;
  }

  .hidden {
    display: none !important;
  }

  /* MODALS & OVERLAYS */
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(33, 31, 26, 0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }
  .overlay.show {
    opacity: 1;
    pointer-events: auto;
  }
  .modal {
    background: var(--paper);
    border: 3px solid var(--ink);
    border-radius: 6px;
    padding: 20px;
    max-width: 320px;
    width: 90%;
    box-shadow: 0 8px 0 -2px rgba(33, 31, 26, 0.2);
    text-align: center;
    transform: scale(0.95);
    transition: transform 0.2s ease;
  }
  .overlay.show .modal {
    transform: scale(1);
  }
  .modal h2 {
    font-family: 'Fraunces', serif;
    margin: 0 0 10px 0;
    font-size: 24px;
  }
  .modal p {
    font-size: 12px;
    color: var(--ink-soft);
    margin: 0 0 16px 0;
  }

  /* TOAST */
  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: var(--ink);
    color: var(--paper);
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    opacity: 0;
    pointer-events: none;
    transition: transform 0.25s ease, opacity 0.25s ease;
    z-index: 10000;
  }
  .toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  ```

---

### Task 5: Gameplay Logic & Selection Engine

**Files:**
- Modify: `packages/wordsearch/src/main.ts`

**Interfaces:**
- Consumes: `generateWordSearch` and interfaces from `packages/wordsearch/src/core.ts`
- Produces: Responsive event management on board, dual pointer drag/click highlights, found word updates, visual cross-outs, and game flow loop.

- [ ] **Step 1: Write state declaration and core configuration in main.ts**
  Replace contents of `packages/wordsearch/src/main.ts`:
  ```typescript
  import { createHeader } from '@sourceplay/shared';
  import { generateWordSearch, WordSearchBoard } from './core';
  import { randomSeed } from './rng';
  import './style.css';

  // Constants
  const DIFFICULTIES: Record<string, { label: string; size: number }> = {
    facil: { label: 'Fácil', size: 10 },
    medio: { label: 'Medio', size: 13 },
    dificil: { label: 'Difícil', size: 16 },
    experto: { label: 'Experto', size: 20 }
  };
  const DIFFICULTY_ORDER = ['facil', 'medio', 'dificil', 'experto'];

  // Game State variables
  let currentDifficulty = 'medio';
  let activeBoard: WordSearchBoard | null = null;
  let foundWords = new Set<string>();
  let timerId: number | null = null;
  let startTime = 0;
  let elapsedTime = 0;

  // Selection state
  let isDragging = false;
  let startCell: { x: number; y: number } | null = null;
  let currentCell: { x: number; y: number } | null = null;

  // DOM Elements
  const startMenuView = document.getElementById('startMenu') as HTMLDivElement;
  const gameAreaView = document.getElementById('gameArea') as HTMLDivElement;
  const menuDiffGrid = document.getElementById('menuDiffGrid') as HTMLDivElement;
  const menuSeedInput = document.getElementById('menuSeedInput') as HTMLInputElement;
  const startGameBtn = document.getElementById('startGameBtn') as HTMLButtonElement;
  const boardEl = document.getElementById('board') as HTMLDivElement;
  const wordListEl = document.getElementById('wordList') as HTMLDivElement;
  const seedLabelEl = document.getElementById('seedLabel') as HTMLElement;
  const diffTagEl = document.getElementById('diffTag') as HTMLElement;
  const progressLabelEl = document.getElementById('progressLabel') as HTMLElement;
  const timerEl = document.getElementById('timer') as HTMLElement;
  const restartGameBtn = document.getElementById('restartGameBtn') as HTMLButtonElement;
  const exitToMenuBtn = document.getElementById('exitToMenuBtn') as HTMLButtonElement;
  const toastEl = document.getElementById('toast') as HTMLDivElement;

  // Confirm Overlay elements
  const confirmOverlay = document.getElementById('confirmOverlay') as HTMLDivElement;
  const confirmCancelBtn = document.getElementById('confirmCancelBtn') as HTMLButtonElement;
  const confirmOkBtn = document.getElementById('confirmOkBtn') as HTMLButtonElement;
  let onConfirmCallback: (() => void) | null = null;

  // Win Overlay elements
  const winOverlay = document.getElementById('winOverlay') as HTMLDivElement;
  const winStatsEl = document.getElementById('winStats') as HTMLParagraphElement;
  const winReplayBtn = document.getElementById('winReplayBtn') as HTMLButtonElement;

  // Initialize shared header
  createHeader({ showBackButton: true });

  // Draw difficulty buttons
  function initMenu(): void {
    menuDiffGrid.innerHTML = '';
    DIFFICULTY_ORDER.forEach((key) => {
      const btn = document.createElement('button');
      btn.className = 'diff-vertical-btn';
      btn.textContent = DIFFICULTIES[key].label;
      btn.dataset.key = key;
      if (key === currentDifficulty) btn.classList.add('active');
      
      btn.addEventListener('click', () => {
        const btns = menuDiffGrid.querySelectorAll('.diff-vertical-btn');
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDifficulty = key;
      });
      menuDiffGrid.appendChild(btn);
    });
  }
  ```

- [ ] **Step 2: Add Timer and Toast functionality to main.ts**
  Append to `packages/wordsearch/src/main.ts`:
  ```typescript
  function formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function startTimer(): void {
    stopTimer();
    startTime = Date.now() - elapsedTime * 1000;
    timerId = window.setInterval(() => {
      elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      timerEl.textContent = formatTime(elapsedTime);
    }, 1000);
  }

  function stopTimer(): void {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  let toastTimeout: number | null = null;
  function showToast(msg: string): void {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    if (toastTimeout !== null) clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2000);
  }
  ```

- [ ] **Step 3: Add Game start and setup logic in main.ts**
  Append to `packages/wordsearch/src/main.ts`:
  ```typescript
  startGameBtn.addEventListener('click', () => {
    let seed = menuSeedInput.value.trim();
    if (!seed) seed = String(randomSeed());
    setupGame(currentDifficulty, seed);
  });

  function setupGame(difficulty: string, seed: string): void {
    activeBoard = generateWordSearch(difficulty, seed);
    foundWords.clear();
    elapsedTime = 0;
    timerEl.textContent = '00:00';
    startTimer();

    seedLabelEl.textContent = seed;
    diffTagEl.textContent = DIFFICULTIES[difficulty].label;

    renderBoard();
    renderWordList();
    updateProgress();

    startMenuView.classList.add('hidden');
    gameAreaView.classList.remove('hidden');
  }

  function renderBoard(): void {
    if (!activeBoard) return;
    const { grid, difficulty } = activeBoard;
    const size = DIFFICULTIES[difficulty].size;

    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    boardEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.x = String(x);
        cell.dataset.y = String(y);

        const letterSpan = document.createElement('span');
        letterSpan.className = 'letter';
        letterSpan.textContent = grid[y][x];
        cell.appendChild(letterSpan);

        boardEl.appendChild(cell);
      }
    }
    setupInteraction();
  }

  function renderWordList(): void {
    if (!activeBoard) return;
    wordListEl.innerHTML = '';
    activeBoard.words.forEach(word => {
      const el = document.createElement('span');
      el.className = 'word-item';
      el.id = `word-item-${word}`;
      el.textContent = word;
      wordListEl.appendChild(el);
    });
  }

  function updateProgress(): void {
    if (!activeBoard) return;
    progressLabelEl.textContent = `${foundWords.size} / ${activeBoard.words.length}`;
  }
  ```

- [ ] **Step 4: Implement Selection Interaction logic (Drag & Click dual mechanic)**
  Append to `packages/wordsearch/src/main.ts`:
  ```typescript
  function setupInteraction(): void {
    if (!activeBoard) return;
    const cells = boardEl.querySelectorAll('.cell') as NodeListOf<HTMLDivElement>;

    const getCoord = (el: HTMLElement) => {
      return {
        x: parseInt(el.dataset.x || '0', 10),
        y: parseInt(el.dataset.y || '0', 10)
      };
    };

    const getCellAt = (x: number, y: number): HTMLDivElement | null => {
      return boardEl.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    };

    const getPathCells = (
      start: { x: number; y: number },
      end: { x: number; y: number }
    ): { x: number; y: number }[] => {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const stepX = Math.sign(dx);
      const stepY = Math.sign(dy);

      // Validate straight horizontal, vertical or 45-degree diagonal
      if (dx !== 0 && dy !== 0 && Math.abs(dx) !== Math.abs(dy)) {
        return [];
      }

      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      const path = [];
      for (let i = 0; i <= steps; i++) {
        path.push({
          x: start.x + i * stepX,
          y: start.y + i * stepY
        });
      }
      return path;
    };

    const updateSelectingHighlight = () => {
      cells.forEach(c => c.classList.remove('selecting'));
      if (startCell && currentCell) {
        const path = getPathCells(startCell, currentCell);
        path.forEach(pt => {
          const el = getCellAt(pt.x, pt.y);
          if (el) el.classList.add('selecting');
        });
      }
    };

    const handleStart = (cell: HTMLDivElement) => {
      const coord = getCoord(cell);
      if (startCell && !isDragging) {
        // Fallback Click Selection - second tap
        const path = getPathCells(startCell, coord);
        if (path.length > 0) {
          commitSelection(path);
          startCell = null;
          currentCell = null;
        } else {
          // If second tap is not aligned, make it the new start cell
          cells.forEach(c => c.classList.remove('start-cell'));
          startCell = coord;
          cell.classList.add('start-cell');
        }
      } else {
        // Initial drag selection or single start cell tap
        isDragging = true;
        startCell = coord;
        currentCell = coord;
        cells.forEach(c => c.classList.remove('start-cell'));
        cell.classList.add('start-cell');
        updateSelectingHighlight();
      }
    };

    const handleMove = (cell: HTMLDivElement) => {
      if (!isDragging || !startCell) return;
      const coord = getCoord(cell);
      if (currentCell && currentCell.x === coord.x && currentCell.y === coord.y) return;
      currentCell = coord;
      updateSelectingHighlight();
    };

    const handleEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      if (startCell && currentCell) {
        const path = getPathCells(startCell, currentCell);
        if (path.length > 0) {
          commitSelection(path);
          startCell = null;
          currentCell = null;
        } else {
          // Keep start cell highlighted for the dual click fallback
          cells.forEach(c => c.classList.remove('selecting'));
        }
      }
    };

    // Add pointer events for drag select
    cells.forEach(cell => {
      cell.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        cell.releasePointerCapture(e.pointerId); // Enable moves over other elements
        handleStart(cell);
      });

      cell.addEventListener('pointerenter', () => {
        handleMove(cell);
      });
    });

    // Touch event fallbacks for smooth dragging on mobile
    boardEl.addEventListener('touchmove', (e) => {
      if (!isDragging || !startCell) return;
      const touch = e.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
      const cell = target?.closest('.cell') as HTMLDivElement | null;
      if (cell) handleMove(cell);
    }, { passive: true });

    window.addEventListener('pointerup', handleEnd);
  }

  function commitSelection(path: { x: number; y: number }[]): void {
    if (!activeBoard) return;
    const { grid, words } = activeBoard;

    let selectedWord = '';
    path.forEach(pt => {
      selectedWord += grid[pt.y][pt.x];
    });

    const reversedWord = selectedWord.split('').reverse().join('');
    let matchedWord = '';

    if (words.includes(selectedWord) && !foundWords.has(selectedWord)) {
      matchedWord = selectedWord;
    } else if (words.includes(reversedWord) && !foundWords.has(reversedWord)) {
      matchedWord = reversedWord;
    }

    const cells = boardEl.querySelectorAll('.cell') as NodeListOf<HTMLDivElement>;
    cells.forEach(c => c.classList.remove('selecting'));

    if (matchedWord) {
      foundWords.add(matchedWord);
      showToast(`¡Encontrado: ${matchedWord}!`);

      // Apply permanent highlighting
      path.forEach(pt => {
        const el = boardEl.querySelector(`.cell[data-x="${pt.x}"][data-y="${pt.y}"]`);
        if (el) el.classList.add('selected-word');
      });

      // Strike through word item
      const itemEl = document.getElementById(`word-item-${matchedWord}`);
      if (itemEl) itemEl.classList.add('found');

      updateProgress();

      // Check win condition
      if (foundWords.size === words.length) {
        triggerWin();
      }
    } else {
      // Clear start cell style
      cells.forEach(c => c.classList.remove('start-cell'));
    }
  }
  ```

- [ ] **Step 5: Add Modals and Win/Reset flow to main.ts**
  Append to `packages/wordsearch/src/main.ts`:
  ```typescript
  function triggerWin(): void {
    stopTimer();
    winStatsEl.textContent = `Has completado la sopa en ${formatTime(elapsedTime)}.`;
    winOverlay.classList.add('show');
  }

  winReplayBtn.addEventListener('click', () => {
    winOverlay.classList.remove('show');
    startMenuView.classList.remove('hidden');
    gameAreaView.classList.add('hidden');
    menuSeedInput.value = '';
  });

  // Common Confirm modal helper
  function askConfirmation(title: string, desc: string, callback: () => void): void {
    onConfirmCallback = callback;
    document.getElementById('confirmTitle')!.textContent = title;
    document.getElementById('confirmDesc')!.textContent = desc;
    confirmOverlay.classList.add('show');
  }

  confirmCancelBtn.addEventListener('click', () => {
    confirmOverlay.classList.remove('show');
    onConfirmCallback = null;
  });

  confirmOkBtn.addEventListener('click', () => {
    confirmOverlay.classList.remove('show');
    if (onConfirmCallback) {
      onConfirmCallback();
      onConfirmCallback = null;
    }
  });

  // Game action listeners
  restartGameBtn.addEventListener('click', () => {
    askConfirmation('¿Reiniciar partida?', 'Se borrarán todas las palabras encontradas y se reiniciará el cronómetro.', () => {
      if (activeBoard) {
        setupGame(activeBoard.difficulty, activeBoard.seed);
      }
    });
  });

  exitToMenuBtn.addEventListener('click', () => {
    askConfirmation('¿Salir al menú?', 'Perderás el progreso de la partida actual.', () => {
      stopTimer();
      startMenuView.classList.remove('hidden');
      gameAreaView.classList.add('hidden');
    });
  });

  // Run menu init
  initMenu();
  ```

---

### Task 6: Game Registry and Monorepo Integration

**Files:**
- Modify: `apps/selector/src/main.ts:12-28`

- [ ] **Step 1: Update Launcher Selector Games Registry**
  Open `apps/selector/src/main.ts` and add `sopa-de-letras` to `GAMES_REGISTRY`:
  ```typescript
  const GAMES_REGISTRY: GameInfo[] = [
    {
      id: 'sudoku',
      title: 'Sudoku',
      description: 'Resuelve sudokus clásicos con semillas personalizadas y cuatro niveles de dificultad.',
      url: import.meta.env.DEV ? 'http://localhost:5174/' : './games/sudoku/index.html',
      imageUrl: './assets/covers/sudoku.jpg'
    },
    {
      id: 'nonogram',
      title: 'Nonograma',
      description: 'Descubre el patrón oculto usando las pistas numéricas de filas y columnas. Cuatro tamaños disponibles.',
      url: import.meta.env.DEV ? 'http://localhost:5175/' : './games/nonogram/index.html',
      imageUrl: './assets/covers/nonogram.jpg'
    },
    {
      id: 'wordsearch',
      title: 'Sopa de letras',
      description: 'Encuentra las palabras ocultas en la cuadrícula en horizontal, vertical o diagonal.',
      url: import.meta.env.DEV ? 'http://localhost:5176/' : './games/wordsearch/index.html',
      imageUrl: './assets/covers/wordsearch.jpg'
    }
  ];
  ```

- [ ] **Step 2: Generate Cover Image for Word Search**
  Generate a placeholder/cover image for the game selector using `generate_image` or copy/generate an asset at `apps/selector/public/assets/covers/wordsearch.jpg` (or standard folder structure). Let's see if selector public contains assets.
  Run: `npx vite-node -e "console.log(require('fs').existsSync('apps/selector/public/assets/covers/sudoku.jpg'))"`
  Wait, let's verify if `apps/selector/public/assets/covers/` is where they are stored, or look it up.
  Let's verify by checking the contents of the image selector path. Let's see where `sudoku.jpg` is located.
  Let's run a search for `sudoku.jpg` in the workspace.
  `git grep sudoku.jpg` or `grep_search` will reveal it.

- [ ] **Step 3: Run final builds**
  Run: `npm run build:all`
  Verify that compiling succeeds for `@sourceplay/selector`, `@sourceplay/sudoku`, `@sourceplay/nonogram`, and `@sourceplay/wordsearch`.

- [ ] **Step 4: Launch local dev server and test manually**
  Run: `npm run dev`
  Open `http://localhost:5173` (selector port) and test:
  1. Click "Sopa de letras" card.
  2. Test starting game in Fácil, Medio, Difícil, Experto.
  3. Verify drag select, click select, word matching, timer, restart, and exit to menu.
