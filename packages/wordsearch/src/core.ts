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
  let wordCount = 7;

  switch (difficulty) {
    case 'facil':
      size = 8;
      wordCount = 5;
      break;
    case 'medio':
      size = 10;
      wordCount = 7;
      break;
    case 'dificil':
      size = 12;
      wordCount = 8;
      break;
    case 'experto':
      size = 14;
      wordCount = 10;
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
  const placedDirections: { x: number; y: number }[] = [];
  for (let wIdx = 0; wIdx < selectedWords.length; wIdx++) {
    const word = selectedWords[wIdx];
    let placed = false;

    // For subsequent words, try to intersect with already placed letters first with a 25% probability to allow natural overlaps
    if (wIdx > 0 && prng() < 0.25) {
      const placement = tryPlaceWordWithIntersection(grid, word, size, difficulty, prng);
      if (placement) {
        placeWord(grid, word, placement.startX, placement.startY, placement.dir);
        placedDirections.push(placement.dir);
        placed = true;
      }
    }

    // Fallback to random placement if not placed by intersection (or if first word)
    if (!placed) {
      for (let pTry = 0; pTry < 500; pTry++) {
        const startX = Math.floor(prng() * size);
        const startY = Math.floor(prng() * size);
        const dir = getDirection(difficulty, prng);

        if (canPlaceWord(grid, word, startX, startY, dir, size)) {
          placeWord(grid, word, startX, startY, dir);
          placedDirections.push(dir);
          placed = true;
          break;
        }
      }
    }

    if (!placed) return null; // placement failed, discard grid
  }

  // 5.5 Validate that there is at least one horizontal, vertical, and diagonal word
  let hasH = false;
  let hasV = false;
  let hasD = false;
  for (const d of placedDirections) {
    if (d.y === 0) hasH = true;
    else if (d.x === 0) hasV = true;
    else hasD = true;
  }
  if (!hasH || !hasV || !hasD) {
    return null; // Discard grid and try again to ensure a mix of directions
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

function shuffleArray<T>(arr: T[], prng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
}

function isDirectionAllowedForDifficulty(dir: { x: number; y: number }, difficulty: string, prng: () => number): boolean {
  const isBackward = dir.x < 0 || dir.y < 0;
  if (!isBackward) return true; // Forward directions are always allowed

  let backwardProb = 0.5;
  switch (difficulty) {
    case 'facil':
      return false; // 0% backward
    case 'medio':
      backwardProb = 0.15;
      break;
    case 'dificil':
      backwardProb = 0.30;
      break;
    case 'experto':
      return true; // 100% allowed
  }

  return prng() < backwardProb;
}

function tryPlaceWordWithIntersection(
  grid: string[][],
  word: string,
  size: number,
  difficulty: string,
  prng: () => number
): { startX: number; startY: number; dir: { x: number; y: number } } | null {
  const occupied: { x: number; y: number; char: string }[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x] !== '') {
        occupied.push({ x, y, char: grid[y][x] });
      }
    }
  }

  if (occupied.length === 0) return null;

  shuffleArray(occupied, prng);

  for (const cell of occupied) {
    const matchingIndices: number[] = [];
    for (let i = 0; i < word.length; i++) {
      if (word[i] === cell.char) {
        matchingIndices.push(i);
      }
    }

    if (matchingIndices.length === 0) continue;
    shuffleArray(matchingIndices, prng);

    const candidateDirs = [...DIRECTIONS];
    shuffleArray(candidateDirs, prng);

    for (const i of matchingIndices) {
      for (const dir of candidateDirs) {
        if (!isDirectionAllowedForDifficulty(dir, difficulty, prng)) {
          continue;
        }

        const startX = cell.x - i * dir.x;
        const startY = cell.y - i * dir.y;

        if (canPlaceWord(grid, word, startX, startY, dir, size)) {
          return { startX, startY, dir };
        }
      }
    }
  }

  return null;
}

