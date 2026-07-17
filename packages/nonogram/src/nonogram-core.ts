import { mulberry32 } from './rng';

export type SizeKey = 'facil' | 'medio' | 'dificil' | 'experto';

export interface SizeConfig {
  label: string;
  rows: number;
  cols: number;
}

export const SIZES: Record<SizeKey, SizeConfig> = {
  facil:   { label: 'Fácil',   rows: 5,  cols: 5  },
  medio:   { label: 'Medio',   rows: 10, cols: 10 },
  dificil: { label: 'Difícil', rows: 15, cols: 15 },
  experto: { label: 'Experto', rows: 20, cols: 20 }
};

export const SIZE_ORDER: SizeKey[] = ['facil', 'medio', 'dificil', 'experto'];

export interface NonogramPuzzle {
  solution: number[];   // flat array: 1=filled, 0=empty
  rowClues: number[][]; // clue groups per row
  colClues: number[][]; // clue groups per column
  rows: number;
  cols: number;
}

/** Count consecutive segments of 1s in an array. Returns [] if all zero. */
function getClues(line: number[]): number[] {
  const clues: number[] = [];
  let count = 0;
  for (const v of line) {
    if (v === 1) {
      count++;
    } else if (count > 0) {
      clues.push(count);
      count = 0;
    }
  }
  if (count > 0) clues.push(count);
  return clues.length > 0 ? clues : [0];
}

/** Count distinct segments (groups of consecutive 1s) */
function countSegments(line: number[]): number {
  let segs = 0;
  let inSeg = false;
  for (const v of line) {
    if (v === 1 && !inSeg) { segs++; inSeg = true; }
    else if (v === 0) { inSeg = false; }
  }
  return segs;
}

/**
 * Generate a deterministic binary solution grid.
 * - Density ~55%
 * - Max 4 segments per row/column enforced by post-processing
 */
function generateSolution(rows: number, cols: number, rng: () => number, maxSegments: number): number[] {
  const grid = new Array(rows * cols).fill(0);

  // Initial random fill at ~55% density
  for (let i = 0; i < rows * cols; i++) {
    grid[i] = rng() < 0.55 ? 1 : 0;
  }

  // Post-process rows: if segments > maxSegments, reduce by merging or clearing
  for (let r = 0; r < rows; r++) {
    let attempts = 0;
    while (attempts < 50) {
      const row = grid.slice(r * cols, r * cols + cols);
      if (countSegments(row) <= maxSegments) break;
      // Randomly fill a 0 gap between segments to merge two segments
      let filled = false;
      for (let c = 1; c < cols - 1; c++) {
        if (row[c] === 0 && row[c - 1] === 1 && row[c + 1] === 1) {
          if (rng() < 0.7) {
            grid[r * cols + c] = 1;
            filled = true;
            break;
          }
        }
      }
      if (!filled) {
        // Find the smallest segment and clear it
        let minLen = Infinity;
        let minStart = -1;
        let cur = 0;
        let start = -1;
        for (let c = 0; c <= cols; c++) {
          const v = c < cols ? row[c] : 0;
          if (v === 1) {
            if (cur === 0) start = c;
            cur++;
          } else if (cur > 0) {
            if (cur < minLen) { minLen = cur; minStart = start; }
            cur = 0;
          }
        }
        if (minStart >= 0) {
          for (let c = minStart; c < minStart + minLen; c++) {
            grid[r * cols + c] = 0;
          }
        }
      }
      attempts++;
    }
  }

  // Post-process columns
  for (let c = 0; c < cols; c++) {
    let attempts = 0;
    while (attempts < 50) {
      const col = Array.from({ length: rows }, (_, r) => grid[r * cols + c]);
      if (countSegments(col) <= maxSegments) break;
      let filled = false;
      for (let r = 1; r < rows - 1; r++) {
        if (col[r] === 0 && col[r - 1] === 1 && col[r + 1] === 1) {
          if (rng() < 0.7) {
            grid[r * cols + c] = 1;
            filled = true;
            break;
          }
        }
      }
      if (!filled) {
        let minLen = Infinity;
        let minStart = -1;
        let cur = 0;
        let start = -1;
        for (let r = 0; r <= rows; r++) {
          const v = r < rows ? col[r] : 0;
          if (v === 1) {
            if (cur === 0) start = r;
            cur++;
          } else if (cur > 0) {
            if (cur < minLen) { minLen = cur; minStart = start; }
            cur = 0;
          }
        }
        if (minStart >= 0) {
          for (let r = minStart; r < minStart + minLen; r++) {
            grid[r * cols + c] = 0;
          }
        }
      }
      attempts++;
    }
  }

  return grid;
}

/** Compute all row and column clues from a solution grid */
function computeClues(solution: number[], rows: number, cols: number): { rowClues: number[][], colClues: number[][] } {
  const rowClues: number[][] = [];
  for (let r = 0; r < rows; r++) {
    rowClues.push(getClues(solution.slice(r * cols, r * cols + cols)));
  }

  const colClues: number[][] = [];
  for (let c = 0; c < cols; c++) {
    const col = Array.from({ length: rows }, (_, r) => solution[r * cols + c]);
    colClues.push(getClues(col));
  }

  return { rowClues, colClues };
}

/** Main entry: build a complete Nonogram puzzle from seed + size */
export function buildPuzzle(seedNum: number, sizeKey: SizeKey): NonogramPuzzle {
  const { rows, cols } = SIZES[sizeKey];
  const rng = mulberry32(seedNum);
  const MAX_SEGMENTS = 4;
  const solution = generateSolution(rows, cols, rng, MAX_SEGMENTS);
  const { rowClues, colClues } = computeClues(solution, rows, cols);
  return { solution, rowClues, colClues, rows, cols };
}

/** Check if player grid matches solution (crosses ignored, empty treated as 0) */
export function checkVictory(playerGrid: number[], solution: number[]): boolean {
  for (let i = 0; i < solution.length; i++) {
    const playerFilled = playerGrid[i] === 1;
    const solutionFilled = solution[i] === 1;
    if (playerFilled !== solutionFilled) return false;
  }
  return true;
}
