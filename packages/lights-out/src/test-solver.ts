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
