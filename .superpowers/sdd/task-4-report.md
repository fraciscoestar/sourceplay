# Task 4 Report: Letroso Mode Starting State & Tile Selection / Editing

## Summary of Implementation

1. **Zero-Tile Initial Active Row Rendering (`packages/wordle/src/main.ts`)**:
   - Refactored `renderBoard()` in Letroso mode (`hiddenLengthMode = true`) to render only the tiles present in `currentGuess`.
   - When `currentGuess` is empty (`""`), 0 tiles are rendered for the active row (no initial placeholder boxes).

2. **Tile Selection & Targeted Editing**:
   - Clicking any existing tile in the active row updates `selectedIndex` to target that tile for replacement.
   - Typing when `selectedIndex` points to an existing tile replaces the character at `selectedIndex`.
   - Typing when focused after the last tile (`selectedIndex >= chars.length`) appends a new tile (up to max 10 characters).

3. **Backspace Handling in Letroso Mode**:
   - `handleBackspace()` removes/splices the letter at `selectedIndex` if an existing tile is selected.
   - Adjusts `selectedIndex` gracefully when splicing the last tile or when deleting from the end of the word.
   - Safely returns without action when `currentGuess` is already empty (`""`).

4. **Keyboard Arrow Navigation**:
   - Supports `ArrowLeft` and `ArrowRight` navigation in Letroso mode across active tiles and focus-after-end position (`0..currentGuess.length`).

5. **Short Word & Dictionary Toast Validation**:
   - Evaluates `isTooShort(cleanGuess)` (< 4 letters) and displays toast `"Palabra demasiado corta (mínimo 4 letras)"`.
   - Evaluates `!isValidWord(currentGuess)` and displays toast `"Palabra no encontrada en el diccionario"`.

## Verification

- **TypeScript Compilation**:
  - Command: `npx tsc --noEmit -p packages/wordle/tsconfig.json`
  - Result: Exit code 0, 0 errors.

## Commit

- `114fdae feat(wordle): add Letroso zero-tile initial start, tile editing, and short word toast validation`
