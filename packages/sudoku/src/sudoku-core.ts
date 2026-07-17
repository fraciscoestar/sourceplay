import { mulberry32 } from './rng';

export const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export type DifficultyKey = 'facil' | 'medio' | 'dificil' | 'experto';

export interface DifficultyConfig {
  label: string;
  clues: number;
}

export const DIFFICULTIES: Record<DifficultyKey, DifficultyConfig> = {
  facil: { label: 'Fácil', clues: 42 },
  medio: { label: 'Medio', clues: 34 },
  dificil: { label: 'Difícil', clues: 28 },
  experto: { label: 'Experto', clues: 23 }
};

export const DIFFICULTY_ORDER: DifficultyKey[] = ['facil', 'medio', 'dificil', 'experto'];

export function boxOf(r: number, c: number): number {
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}

export function shuffledArr<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

export function generateSolved(rng: () => number): number[] {
  const g = new Array(81).fill(0);
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);

  function fill(pos: number): boolean {
    if (pos === 81) return true;
    const r = Math.floor(pos / 9);
    const c = pos % 9;
    const b = boxOf(r, c);
    const used = rows[r] | cols[c] | boxes[b];
    const opts = shuffledArr(DIGITS, rng);

    for (const d of opts) {
      const bit = 1 << (d - 1);
      if (!(used & bit)) {
        g[pos] = d;
        rows[r] |= bit;
        cols[c] |= bit;
        boxes[b] |= bit;

        if (fill(pos + 1)) return true;

        g[pos] = 0;
        rows[r] &= ~bit;
        cols[c] &= ~bit;
        boxes[b] &= ~bit;
      }
    }
    return false;
  }

  fill(0);
  return g;
}

export function countSolutions(grid: number[], limit: number): number {
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);

  for (let i = 0; i < 81; i++) {
    const v = grid[i];
    if (v) {
      const r = Math.floor(i / 9);
      const c = i % 9;
      const b = boxOf(r, c);
      const bit = 1 << (v - 1);
      rows[r] |= bit;
      cols[c] |= bit;
      boxes[b] |= bit;
    }
  }

  const g = grid.slice();
  let count = 0;

  function pop(x: number): number {
    let c = 0;
    while (x) {
      x &= x - 1;
      c++;
    }
    return c;
  }

  function pickCell(): [number, number, number] {
    let best = -1;
    let bestMask = 0;
    let bestCount = 10;

    for (let i = 0; i < 81; i++) {
      if (g[i] === 0) {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const b = boxOf(r, c);
        const avail = (~(rows[r] | cols[c] | boxes[b])) & 0x1FF;
        const cnt = pop(avail);
        if (cnt < bestCount) {
          bestCount = cnt;
          best = i;
          bestMask = avail;
          if (cnt === 0) break;
        }
      }
    }
    return [best, bestMask, bestCount];
  }

  function bt(): void {
    if (count >= limit) return;
    const [i, mask, cnt] = pickCell();
    if (i === -1) {
      count++;
      return;
    }
    if (cnt === 0) return;

    const r = Math.floor(i / 9);
    const c = i % 9;
    const b = boxOf(r, c);

    for (const d of DIGITS) {
      const bit = 1 << (d - 1);
      if (mask & bit) {
        g[i] = d;
        rows[r] |= bit;
        cols[c] |= bit;
        boxes[b] |= bit;

        bt();

        g[i] = 0;
        rows[r] &= ~bit;
        cols[c] &= ~bit;
        boxes[b] &= ~bit;

        if (count >= limit) return;
      }
    }
  }

  bt();
  return count;
}

export function digHoles(solved: number[], rng: () => number, targetClues: number): number[] {
  const g = solved.slice();
  const positions = shuffledArr(Array.from({ length: 81 }, (_, i) => i), rng);
  let clues = 81;

  for (const pos of positions) {
    if (clues <= targetClues) break;
    const backup = g[pos];
    if (backup === 0) continue;

    g[pos] = 0;
    const solCount = countSolutions(g, 2);
    if (solCount === 1) {
      clues--;
    } else {
      g[pos] = backup;
    }
  }
  return g;
}

export function buildPuzzle(seedNum: number, difficultyKey: DifficultyKey): { solved: number[]; puzzle: number[] } {
  const rng = mulberry32(seedNum);
  const solved = generateSolved(rng);
  const target = DIFFICULTIES[difficultyKey].clues;
  const puzzle = digHoles(solved, rng, target);
  return { solved, puzzle };
}
