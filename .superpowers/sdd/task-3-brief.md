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
