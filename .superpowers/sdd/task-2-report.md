# Task 2 Report: On-Screen Virtual Keyboard UI & Accents Row

## Summary
Successfully implemented Task 2: On-Screen Virtual Keyboard UI & Accents Row for the Wordle game package (`packages/wordle`).

## Changes Made
- **`packages/wordle/index.html`**: Added `#keyboard.keyboard-container` element below `#board`.
- **`packages/wordle/src/style.css`**: Added styling for `.keyboard-container`, `.keyboard-row`, `.key`, `.key.key-wide`, `.key:active`, and clue states `.key.correct`, `.key.present`, `.key.absent`.
- **`packages/wordle/src/main.ts`**:
  - Initialized `keyboardEl` and `keyStatuses` Map.
  - Added `renderKeyboard()` function to render QWERTY layout + optional `Á É Í Ó Ú` 4th row when `tildesMode` is enabled.
  - Added `updateKeyboardColors()` function to compute green/yellow/gray statuses per key based on past guesses.
  - Added `handleVirtualKeyPress()` event handler supporting letter key presses, Backspace (`⌫`), and Enter (`ENTER`).
  - Updated `loadNextWord()` and `submitGuess()` to trigger key status updates and re-renders cleanly.

## Verification
- Ran TypeScript type check: `npx tsc --noEmit -p packages/wordle/tsconfig.json` -> 0 errors (PASS).
- Verified git status and committed changes.

## Commit
- `eadf76a` `feat(wordle): add on-screen QWERTY virtual keyboard with tildes row and clue status colors`
