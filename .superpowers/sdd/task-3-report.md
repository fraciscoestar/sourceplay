# Task 3 Report: PRNG Seed Progression on New Game

## Summary
Updated `packages/wordle/src/main.ts` so that when a seed (custom or generated) is set, starting subsequent games ("Nueva Partida" or "Jugar de nuevo") increments a `gameCount` offset on the seed (`(customSeed + gameCount) >>> 0`). This ensures that each subsequent game yields a new random word from the deterministic sequence instead of repeating the exact same word.

## Changes Made
- Added `customSeed` and `gameCount` to module state in `packages/wordle/src/main.ts`.
- Introduced `startNewGame(fromMenu: boolean)` helper:
  - When called from main menu (`fromMenu = true`), `gameCount` is reset to 0 and `customSeed` is parsed from the seed input (or random seed).
  - When called for subsequent games (`fromMenu = false`), `gameCount` is incremented.
  - Recreates `prng = mulberry32((customSeed + gameCount) >>> 0)`.
- Updated `restartGameBtn` and `modalReplayBtn` listeners to call `startNewGame(false)`.

## Verification
- TypeScript compilation: `npx tsc --noEmit -p packages/wordle/tsconfig.json` passed with 0 errors.

## Commits
- `04b346c fix(wordle): advance PRNG seed sequence on new game with custom seed`
