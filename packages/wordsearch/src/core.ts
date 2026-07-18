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

const FORWARD_DIRECTIONS = [
  { x: 1, y: 0 },   // H Right
  { x: 0, y: 1 },   // V Down
  { x: 1, y: 1 }    // D Down-Right
];

const BACKWARD_DIRECTIONS = [
  { x: -1, y: 0 },  // H Left
  { x: 0, y: -1 },  // V Up
  { x: -1, y: 1 },  // D Down-Left
  { x: 1, y: -1 },  // D Up-Right
  { x: -1, y: -1 }  // D Up-Left
];

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

function getDirection(difficulty: string, prng: () => number): { x: number; y: number } {
  let backwardProb = 0.5;
  switch (difficulty) {
    case 'facil':
      backwardProb = 0.0;
      break;
    case 'medio':
      backwardProb = 0.15;
      break;
    case 'dificil':
      backwardProb = 0.30;
      break;
    case 'experto':
      // Under experto, all 8 directions are equally likely
      return DIRECTIONS[Math.floor(prng() * DIRECTIONS.length)];
  }

  if (prng() < backwardProb) {
    return BACKWARD_DIRECTIONS[Math.floor(prng() * BACKWARD_DIRECTIONS.length)];
  } else {
    return FORWARD_DIRECTIONS[Math.floor(prng() * FORWARD_DIRECTIONS.length)];
  }
}

export function generateWordSearch(difficulty: string, seedStr: string): WordSearchBoard {
  let size = 10;
  let wordCount = 8;

  switch (difficulty) {
    case 'facil':
      size = 7;
      wordCount = 6;
      break;
    case 'medio':
      size = 10;
      wordCount = 8;
      break;
    case 'dificil':
      size = 13;
      wordCount = 11;
      break;
    case 'experto':
      size = 16;
      wordCount = 14;
      break;
  }

  const numericSeed = parseSeed(seedStr);
  let attempt = 0;

  const pool = SPANISH_WORDS.filter(w => w.length >= 4 && w.length <= size);

  while (attempt < 1000) {
    const prng = mulberry32(numericSeed + attempt);
    const board = tryGenerateBoard(size, wordCount, prng, seedStr, difficulty, pool);
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
  difficulty: string,
  pool: string[]
): WordSearchBoard | null {
  // 1. Filter dictionary
  if (pool.length < wordCount) return null;

  // 2. Select N random words deterministically
  const selectedWords: string[] = [];
  const usedIndices = new Set<number>();
  let pickAttempts = 0;
  while (selectedWords.length < wordCount && pickAttempts < 2000) {
    pickAttempts++;
    const idx = Math.floor(prng() * pool.length);
    if (usedIndices.has(idx)) continue;

    const candidate = pool[idx];
    const hasConflict = selectedWords.some(w => w.includes(candidate) || candidate.includes(w));
    if (!hasConflict) {
      usedIndices.add(idx);
      selectedWords.push(candidate);
    }
  }
  if (selectedWords.length < wordCount) return null;

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
      const dir = getDirection(difficulty, prng);

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
    const isPalindrome = word === word.split('').reverse().join('');
    const expected = isPalindrome ? 2 : 1;
    if (occurrences !== expected) {
      return null; // fails condition of expected occurrences, discard grid
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
