### Task 2: RNG and Core Mathematical Solver (TDD)

**Files:**
- Create: `packages/lights-out/src/rng.ts`
- Create: `packages/lights-out/src/lights-out-core.ts`
- Create: `packages/lights-out/src/test-solver.ts`

**Interfaces:**
- Consumes: None
- Produces:
  - `buildPuzzle(seedNum: number, difficultyKey: 'facil' | 'medio' | 'dificil' | 'experto'): LightsOutPuzzle`
  - `solveLightsOut(N: number, state: number[]): number[] | null`

- [ ] **Step 1: Create deterministic random generator module**
  Create `packages/lights-out/src/rng.ts`:
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

- [ ] **Step 2: Create Lights Out Core Solver**
  Create `packages/lights-out/src/lights-out-core.ts`:
  ```typescript
  import { mulberry32 } from './rng';

  export type DifficultyKey = 'facil' | 'medio' | 'dificil' | 'experto';

  export interface LightsOutPuzzle {
    initialState: number[]; // 1 = on, 0 = off
    optimalMoves: number;
    initialClicks: number[]; // Click configurations used during generation
    N: number;
  }

  export const SIZES = {
    facil: 4,
    medio: 5,
    dificil: 7,
    experto: 9
  };

  export const SIZES_LABELS: Record<DifficultyKey, string> = {
    facil: 'Fácil (4×4)',
    medio: 'Medio (5×5)',
    dificil: 'Difícil (7×7)',
    experto: 'Experto (9×9)'
  };

  /**
   * Solves Lights Out using Gaussian elimination and nullspace search over GF(2).
   * Returns binary click vector representing the optimal buttons to press.
   */
  export function solveLightsOut(N: number, state: number[]): number[] | null {
    const M = N * N;
    // Build augmented matrix M x (M + 1)
    const matrix: number[][] = Array.from({ length: M }, () => new Array(M + 1).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const idx = r * N + c;
        matrix[idx][idx] = 1;
        if (r > 0) matrix[idx][(r - 1) * N + c] = 1;
        if (r < N - 1) matrix[idx][(r + 1) * N + c] = 1;
        if (c > 0) matrix[idx][r * N + (c - 1)] = 1;
        if (c < N - 1) matrix[idx][r * N + (c + 1)] = 1;
        matrix[idx][M] = state[idx];
      }
    }

    // Gaussian Elimination
    const pivots = new Array(M).fill(-1);
    let rank = 0;
    for (let col = 0; col < M; col++) {
      let pivotRow = -1;
      for (let row = rank; row < M; row++) {
        if (matrix[row][col] === 1) {
          pivotRow = row;
          break;
        }
      }
      if (pivotRow === -1) continue;

      if (pivotRow !== rank) {
        const temp = matrix[rank];
        matrix[rank] = matrix[pivotRow];
        matrix[pivotRow] = temp;
      }

      pivots[col] = rank;

      for (let row = 0; row < M; row++) {
        if (row !== rank && matrix[row][col] === 1) {
          for (let c = col; c <= M; c++) {
            matrix[row][c] ^= matrix[rank][c];
          }
        }
      }
      rank++;
    }

    // Check Solvability
    for (let row = rank; row < M; row++) {
      if (matrix[row][M] === 1) {
        return null; // Unsolvable
      }
    }

    // Particular Solution
    const y0 = new Array(M).fill(0);
    for (let col = 0; col < M; col++) {
      const pRow = pivots[col];
      if (pRow !== -1) {
        y0[col] = matrix[pRow][M];
      }
    }

    // Identify free variables to build nullspace basis
    const freeVars: number[] = [];
    for (let col = 0; col < M; col++) {
      if (pivots[col] === -1) {
        freeVars.push(col);
      }
    }

    const basis: number[][] = [];
    for (const freeCol of freeVars) {
      const vec = new Array(M).fill(0);
      vec[freeCol] = 1;
      for (let col = 0; col < M; col++) {
        const pRow = pivots[col];
        if (pRow !== -1) {
          vec[col] = matrix[pRow][freeCol];
        }
      }
      basis.push(vec);
    }

    // Find combination of nullspace vectors that minimizes click count (Hamming weight)
    let bestSolution = [...y0];
    let minWeight = y0.reduce((sum, val) => sum + val, 0);

    const numCombinations = 1 << basis.length;
    for (let i = 1; i < numCombinations; i++) {
      const current = [...y0];
      for (let j = 0; j < basis.length; j++) {
        if ((i >> j) & 1) {
          for (let idx = 0; idx < M; idx++) {
            current[idx] ^= basis[j][idx];
          }
        }
      }
      const weight = current.reduce((sum, val) => sum + val, 0);
      if (weight < minWeight) {
        minWeight = weight;
        bestSolution = current;
      }
    }

    return bestSolution;
  }

  /**
   * Generates a guaranteed solvable Lights Out board using random clicks.
   */
  export function buildPuzzle(seedNum: number, difficultyKey: DifficultyKey): LightsOutPuzzle {
    const N = SIZES[difficultyKey];
    const M = N * N;
    const rng = mulberry32(seedNum);

    let initialState = new Array(M).fill(0);
    let initialClicks = new Array(M).fill(0);

    let attempts = 0;
    while (attempts < 100) {
      initialClicks = new Array(M).fill(0);
      initialState = new Array(M).fill(0);

      for (let i = 0; i < M; i++) {
        initialClicks[i] = rng() < 0.5 ? 1 : 0;
      }

      for (let i = 0; i < M; i++) {
        if (initialClicks[i] === 1) {
          const r = Math.floor(i / N);
          const c = i % N;
          initialState[i] ^= 1;
          if (r > 0) initialState[(r - 1) * N + c] ^= 1;
          if (r < N - 1) initialState[(r + 1) * N + c] ^= 1;
          if (c > 0) initialState[r * N + (c - 1)] ^= 1;
          if (c < N - 1) initialState[r * N + (c + 1)] ^= 1;
        }
      }

      const activeCount = initialState.reduce((sum, val) => sum + val, 0);
      if (activeCount > 0) {
        break;
      }
      attempts++;
    }

    const optimalSol = solveLightsOut(N, initialState);
    const optimalMoves = optimalSol ? optimalSol.reduce((sum, val) => sum + val, 0) : 0;

    return { initialState, optimalMoves, initialClicks, N };
  }
  ```

- [ ] **Step 3: Create automated verification test script**
  Create `packages/lights-out/src/test-solver.ts`:
  ```typescript
  import { solveLightsOut, buildPuzzle } from './lights-out-core';

  function assert(condition: boolean, msg: string) {
    if (!condition) {
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  console.log("Running solver mathematical checks...");

  // 1. Solve basic unsolvable/solvable cases
  // A simple 2x2 grid (N=2) which toggle cell and neighbors.
  // Click matrix A for 2x2:
  // [ 1 1 1 0 ]
  // [ 1 1 0 1 ]
  // [ 1 0 1 1 ]
  // [ 0 1 1 1 ]
  // All rows sum to 1 + 1 + 1 = 3 = 1.
  const solvedState = [0, 0, 0, 0];
  const clicks = solveLightsOut(2, solvedState);
  assert(clicks !== null && clicks.reduce((s, v) => s + v, 0) === 0, "Empty board should take 0 clicks");

  const singleOn = [1, 0, 0, 0];
  const singleClicks = solveLightsOut(2, singleOn);
  assert(singleClicks !== null, "2x2 single cell ON is solvable");

  // 2. Verification of optimal move calculations for all sizes
  const sizes: ('facil' | 'medio' | 'dificil' | 'experto')[] = ['facil', 'medio', 'dificil', 'experto'];
  for (const sz of sizes) {
    const puzzle = buildPuzzle(12345, sz);
    console.log(`- Difficulty ${sz} (N=${puzzle.N}): optimal moves = ${puzzle.optimalMoves}`);
    
    // Verify that applying the optimal clicks to initial state clears the board
    const N = puzzle.N;
    const current = [...puzzle.initialState];
    const optClicks = solveLightsOut(N, current);
    assert(optClicks !== null, `Puzzle of size ${N} must be solvable`);

    // Simulate clicking the solved output
    for (let i = 0; i < optClicks!.length; i++) {
      if (optClicks![i] === 1) {
        const r = Math.floor(i / N);
        const c = i % N;
        current[i] ^= 1;
        if (r > 0) current[(r - 1) * N + c] ^= 1;
        if (r < N - 1) current[(r + 1) * N + c] ^= 1;
        if (c > 0) current[r * N + (c - 1)] ^= 1;
        if (c < N - 1) current[r * N + (c + 1)] ^= 1;
      }
    }
    const sum = current.reduce((s, v) => s + v, 0);
    assert(sum === 0, `Applying optimal clicks should completely turn off all lights for size ${N}`);
  }

  console.log("ALL MATHEMATICAL TESTS PASSED!");
  ```

- [ ] **Step 4: Execute TDD Tests**
  Run: `npx tsx packages/lights-out/src/test-solver.ts`
  Expected: "ALL MATHEMATICAL TESTS PASSED!" output.

- [ ] **Step 5: Commit TDD Core**
  Run:
  ```bash
  git add packages/lights-out/src/rng.ts packages/lights-out/src/lights-out-core.ts packages/lights-out/src/test-solver.ts
  git commit -m "feat: add RNG, linear algebra solver, and verification tests for Lights Out"
  ```

---
