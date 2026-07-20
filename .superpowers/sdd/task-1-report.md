# Task 1 Report: Full RAE Dictionary Data & Hybrid Word Pool

## Executive Summary
Successfully updated `packages/wordle/src/words.ts` and `packages/wordle/src/main.ts` to integrate the complete 57,018 RAE Spanish dictionary dataset (`packages/wordle/src/raeWords.ts`) along with `SPANISH_WORDS` from `@sourceplay/wordsearch`.

## Key Deliverables
- **Data Module**: Downloaded and bundled 57,018 filtered RAE dictionary words (4-10 characters) into `packages/wordle/src/raeWords.ts`.
- **Validation Set**: Exported `RAW_DICTIONARY_SET` and `VALIDATION_SET` (Set<string>) containing 61,802 total entries (original accented + normalized uppercase forms).
- **Secret Word Pool**: Constructed hybrid `SECRET_POOL` of 20,000 common Spanish words (prioritizing `SPANISH_WORDS` then RAE entries with uniform alphabetical sampling across A-Z).
- **Word Validation & Helpers**:
  - `isValidWord(word: string): boolean`: Validates against full dictionary dataset.
  - `isTooShort(word: string): boolean`: Returns `true` if `word.length < 4`.
  - `getSeededWord(prng: () => number, tildesMode: boolean): string`: Selects seeded secret word directly from `SECRET_POOL` taking tildes mode into account.
  - `removeAccents(str: string): string`: Normalizes accented vowels while preserving `Ñ`.
- **UI Integration**: Updated `packages/wordle/src/main.ts` to check `isTooShort` during guess submission.

## Review Fixes Applied
1. **Alphabetical Sampling Bias in SECRET_POOL**:
   - Fixed sampling loop by introducing stride step calculation (`const step = Math.max(1, Math.floor(RAE_WORDS.length / remainingCount))`) to sample uniformly across the entire alphabet A-Z instead of stopping after letters A and B.
2. **Dead Array Allocation Fallback**:
   - Removed dead `Array.from(RAW_DICTIONARY_SET)` fallback inside `getSeededWord`.

## Verification
- Ran TypeScript typecheck:
  `npx tsc --noEmit -p packages/wordle/tsconfig.json`
  **Result**: PASS (0 errors)

## Commits
- `759f71b` feat(wordle): integrate 57k RAE Spanish dictionary validation and short word check
- `b85aeaf` fix(wordle): balance secret word pool sampling across full alphabet
