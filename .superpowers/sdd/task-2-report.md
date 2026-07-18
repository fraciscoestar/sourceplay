# Task 2 Report: RNG and Core Mathematical Solver (TDD)

## 1. What was Implemented

We implemented:
1. **Deterministic PRNG (`packages/lights-out/src/rng.ts`)**:
   - `mulberry32`: A 32-bit generator function for generating repeatable, pseudo-random float sequences.
   - `hashSeed`: Generates a numeric seed from a string (FNV-1a 32-bit hash).
   - `randomSeed`: Generates a high-entropy numeric seed using time and math.random.
   - `parseSeed`: Normalizes seed input (either strings or digits).

2. **Core Lights Out Linear Algebra Solver and Board Generator (`packages/lights-out/src/lights-out-core.ts`)**:
   - `solveLightsOut`: Solves Lights Out using Gaussian elimination and nullspace search over GF(2). Minimizes click count (Hamming weight) across all combinations of nullspace vectors.
   - `buildPuzzle`: Generates a guaranteed-solvable board configuration using random clicks based on the deterministic seed and chosen difficulty.

3. **Automated Verification Test Script (`packages/lights-out/src/test-solver.ts`)**:
   - Asserts mathematical correctness of the solver on solvable/unsolvable 2x2 edge cases.
   - Verifies optimal moves calculation and checks that applying optimal moves indeed turns off all lights across all difficulty levels (4x4, 5x5, 7x7, 9x9).

---

## 2. What was Tested and Test Results

We ran verification tests using the script `packages/lights-out/src/test-solver.ts` with `npx tsx`.
All test assertions succeeded:
- Verified that an empty board takes 0 clicks.
- Verified that a 2x2 single cell ON configuration is solvable.
- Verified that the board is cleared for all difficulties:
  - `facil` (4x4, optimal moves = 4)
  - `medio` (5x5, optimal moves = 9)
  - `dificil` (7x7, optimal moves = 21)
  - `experto` (9x9, optimal moves = 27)

---

## 3. TDD Evidence

### RED Phase
- **Command Run**: `npx tsx packages/lights-out/src/test-solver.ts`
- **Why Failure was Expected**: The solver was stubbed to return `null` and the generator returned empty defaults, so checking that an empty board took 0 clicks failed because it expected `clicks` to not be `null`.
- **Failing Output**:
```
Running solver mathematical checks...
C:\Users\Fraci\Desktop\typescript projects\sourceplay\packages\lights-out\src\test-solver.ts:5
    throw new Error(`Assertion failed: ${msg}`);
          ^

Error: Assertion failed: Empty board should take 0 clicks
    at assert (C:\Users\Fraci\Desktop\typescript projects\sourceplay\packages\lights-out\src\test-solver.ts:5:11)
    at <anonymous> (C:\Users\Fraci\Desktop\typescript projects\sourceplay\packages\lights-out\src\test-solver.ts:21:1)
```

### GREEN Phase
- **Command Run**: `npx tsx packages/lights-out/src/test-solver.ts`
- **Passing Output**:
```
Running solver mathematical checks...
- Difficulty facil (N=4): optimal moves = 4
- Difficulty medio (N=5): optimal moves = 9
- Difficulty dificil (N=7): optimal moves = 21
- Difficulty experto (N=9): optimal moves = 27
ALL MATHEMATICAL TESTS PASSED!
```

---

## 4. Files Changed

The following files were created and committed:
- `packages/lights-out/src/rng.ts`
- `packages/lights-out/src/lights-out-core.ts`
- `packages/lights-out/src/test-solver.ts`

---

## 5. Self-Review Findings

- **Completeness**: All required interfaces and behavior from the spec have been completely implemented.
- **Quality**: Variable names are clear and functions are well-structured.
- **Discipline**: Followed TDD correctly by introducing stubs, executing and watching the tests fail (RED), implementing the features, and then ensuring they pass (GREEN).
- **Testing**: The mathematical tests cover grid sizes up to 9x9 and simulate applying the optimal click solution to confirm it results in all lights being off.

---

## 6. Issues or Concerns

None. The mathematical solver performs perfectly and efficiently.
