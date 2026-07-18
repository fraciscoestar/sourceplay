# Task 3 Report: Seeded Generation Logic & Duplicate Prevention

## What Was Implemented

1. **Created mulberry32 Seeded PRNG (`packages/wordsearch/src/rng.ts`):**
   - Implemented `mulberry32` as the deterministic 32-bit random number generator.
   - Implemented `hashSeed` using the FNV-1a algorithm to convert non-numeric string seeds into 32-bit integers.
   - Implemented `parseSeed` to handle both numeric string seeds and non-numeric string seeds.
   - Implemented `randomSeed` as a fallback using `Date.now()`.

2. **Implemented Grid Generation & Validation (`packages/wordsearch/src/core.ts`):**
   - Configured grid size and word count based on difficulty level:
     - `facil`: 10x10 grid, 7 words
     - `medio`: 13x13 grid, 10 words
     - `dificil`: 16x16 grid, 14 words
     - `experto`: 20x20 grid, 19 words
   - Implemented deterministic word selection from `SPANISH_WORDS` using the seeded generator.
   - Implemented word placement in 8 directions (horizontal, vertical, diagonal, forwards, backwards) with collision checks.
   - Added logic to retry word placements up to 500 times per word and fallback to a new seed offset (up to 1000 attempts) on failures.
   - Filled empty cells using letters from the Spanish alphabet.
   - Added duplicate word prevention via `countWordOccurrences` to ensure target words are not accidentally formed more than once.

3. **Created Generator Verification Script (`packages/wordsearch/src/test-gen.ts`):**
   - Added checks for determinism (verifying same seed produces the exact same grid).
   - Added checks for variety (verifying distinct seeds produce different word lists).
   - Added assertions to verify grid sizes and word counts for all 4 difficulty levels.

## Verification Steps and Outputs

1. **Run the generator test script:**
   ```bash
   npx vite-node packages/wordsearch/src/test-gen.ts
   ```

2. **Command execution output:**
   ```
   Testing board generator...
   Difficulty 'facil' checked: grid 10x10, words: 7
   Difficulty 'medio' checked: grid 13x13, words: 10
   Difficulty 'dificil' checked: grid 16x16, words: 14
   Difficulty 'experto' checked: grid 20x20, words: 19
   Generator test PASSED. Words chosen for medio: SINDICATO, PRESENTE, SALVARAN, HABREIS, BABYLON, ACUARIO, DRACULA, JUNIOR, CLAVA, PUES
   ```

## Files Changed

- **Created:**
  - [packages/wordsearch/src/rng.ts](file:///c:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/wordsearch/src/rng.ts)
  - [packages/wordsearch/src/test-gen.ts](file:///c:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/wordsearch/src/test-gen.ts)
- **Modified:**
  - [packages/wordsearch/src/core.ts](file:///c:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/wordsearch/src/core.ts)

## Self-Review Findings

- **Grid Size vs. Difficulty:** Matches requirements perfectly (10, 13, 16, 20).
- **Word Counts vs. Difficulty:** Matches requirements perfectly (7, 10, 14, 19).
- **Determinism:** Verified successfully using stringified grid comparison.
- **Duplicate Prevention:** Verification scans all 8 directions and checks that every selected word has exactly 1 occurrence. Any board with duplicate/accidental matches is discarded and regenerated.

## Issues/Concerns
None. The generator is fully deterministic, behaves correctly, and passes the validation tests cleanly.

## Palindrome Word Duplicate Rejection Fix

### Problem
When `tryGenerateBoard` checks occurrences of selected words using `countWordOccurrences`, it searches in all 8 directions. For palindrome words (e.g. `RADAR`, `ELLE`), the word matches both forward and backward, resulting in 2 occurrences instead of 1. This caused `occurrences !== 1` to reject the board, making the generator discard otherwise valid attempts.

### Solution
1. Modified `tryGenerateBoard` in [core.ts](file:///c:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/wordsearch/src/core.ts) to detect if the word is a palindrome and set the expected occurrence count to 2 if it is, and 1 otherwise.
2. Updated generator tests in [test-gen.ts](file:///c:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/wordsearch/src/test-gen.ts) to include a validation test with palindrome words.
3. Successfully ran tests.

### Verification Output
```
Testing board generator...
Difficulty 'facil' checked: grid 10x10, words: 7
Difficulty 'medio' checked: grid 13x13, words: 10
Difficulty 'dificil' checked: grid 16x16, words: 14
Difficulty 'experto' checked: grid 20x20, words: 19
Testing palindrome support...
Palindrome board generated successfully with words: RADAR, PISO, LUNA, CASA, ELLE, BOLA, CENA, ROPA, TEMA, MESA
Generator test PASSED. Words chosen for medio: SINDICATO, PRESENTE, SALVARAN, HABREIS, BABYLON, ACUARIO, DRACULA, JUNIOR, CLAVA, PUES
```

## Word Selection & Pool Normalization Fix

### Problem
1. **Accent Normalization:** Words inside the Spanish word pool were not mapped and cleaned with `cleanWord` before filtering, which could lead to words retaining accents/diacritics in core wordsearch checks.
2. **Substring Duplicate Conflict:** The generator could select words that are substrings of each other (e.g., "PARA" and "PARAR"). When placed in the grid, they would conflict, causing either incorrect occurrence counts or overlapping word generation issues.

### Solution
1. In `tryGenerateBoard` inside [core.ts](file:///c:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/wordsearch/src/core.ts), updated pool generation to run `cleanWord(w)` on all Spanish words, mapping and filtering them based on size restrictions.
2. Implemented a substring conflict check during deterministic word selection in `tryGenerateBoard`. When picking random candidate words, any candidate that is a substring of an already selected word, or contains an already selected word as a substring, is skipped.
3. Added maximum loop protection (`pickAttempts < 2000`) and verification in [test-gen.ts](file:///c:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/wordsearch/src/test-gen.ts) to check all generated boards for substring conflicts.
4. Successfully verified tests.

### Verification Output
```
Testing board generator...
Difficulty 'facil' checked: grid 10x10, words: 7
Difficulty 'medio' checked: grid 13x13, words: 10
Difficulty 'dificil' checked: grid 16x16, words: 14
Difficulty 'experto' checked: grid 20x20, words: 19
Testing palindrome support...
Palindrome board generated successfully with words: RADAR, PISO, LUNA, CASA, ELLE, BOLA, CENA, ROPA, TEMA, MESA
Generator test PASSED. Words chosen for medio: SINDICATO, PRESENTE, SALVARAN, HABREIS, BABYLON, ACUARIO, DRACULA, JUNIOR, CLAVA, PUES
```

