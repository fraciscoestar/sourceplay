# Sopa de letras (Word Search) — Design Specification

This document specifies the design and architecture for adding a new "Sopa de letras" (Word Search) game to the SourcePlay monorepo.

---

## 1. Requirements

- **Start Menu**: Select difficulty (Fácil, Medio, Difícil, Experto) and specify an optional seed.
- **Difficulties**:
  - **Fácil**: 10x10 grid, 6-8 words (word length 4-10)
  - **Medio**: 13x13 grid, 8-12 words (word length 4-13)
  - **Difícil**: 16x16 grid, 12-16 words (word length 4-16)
  - **Experto**: 20x20 grid, 16-22 words (word length 4-20)
- **Seeded Generation**: A text seed deterministically configures word selection, placements, and grid fill. If no seed is provided, a random one is generated.
- **Directions**: Words can be placed horizontally, vertically, and diagonally in both forward and backward directions (8 directions total).
- **Word List**: Over 5000 distinct Spanish words of varying lengths stored in a static file.
- **Accidental Word Prevention**: Ensure that no selected target word appears in the grid more than once (either voluntarily placed or randomly formed).
- **Styling**: Must match the existing Sudoku style, supporting light and dark themes, using shared design variables (paper, ink, typography).
- **Simplified Controls**: Within the game view, only "Reiniciar" and "Salir al menú" buttons are available.
- **Accent Handling**: Accents and diaereses are stripped (e.g. `á` $\rightarrow$ `A`, `ü` $\rightarrow$ `U`), but `Ñ` is preserved as a distinct letter.

---

## 2. Architecture & File Structure

We will create a new workspace package `@sourceplay/wordsearch` under `packages/wordsearch`.

### New Directory Structure
```
packages/wordsearch/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.ts         # View management, drag/click event handlers, game state
    ├── core.ts         # Seeded board generation, word selection, path finding
    ├── rng.ts          # Mulberry32 PRNG and seed hash helpers
    ├── words.ts        # Bundled module containing the 5000+ Spanish words
    └── style.css       # Core layout styling matching Sudoku's aesthetics
```

### Monorepo Updates
1.  **`package.json` (Root)**: Add scripts to run and compile the wordsearch package (`dev:wordsearch`), and update `dev` to run it concurrently.
2.  **`apps/selector/src/main.ts`**: Register the "Sopa de letras" game in `GAMES_REGISTRY`.
3.  **`scripts/assemble-build.js`**: Add steps to copy the compiled `packages/wordsearch/dist` output to `apps/selector/dist/games/wordsearch`.

---

## 3. Core Algorithms

### 3.1 Seeded Board Generation
1.  **Hash Seed**: Hash the seed string to a 32-bit unsigned integer to initialize the `mulberry32` PRNG.
2.  **Select Words**:
    - Filter `words.ts` dictionary to words with length $\le$ grid size.
    - Deterministically shuffle and select $N$ words (based on difficulty settings).
    - Strip accents from selected words (preserving `Ñ`) and convert to uppercase.
3.  **Place Words**:
    - Initialize a grid of size $G \times G$ with empty spaces.
    - For each word, generate random starting coordinates $(x, y)$ and a direction (one of 8 directions).
    - If the word fits without conflicting with already written letters, place it.
    - If a collision occurs, try another position/direction (up to 500 attempts).
    - If placement fails after 500 attempts, increment a generation attempt count and retry the entire grid layout.
4.  **Fill Grid**:
    - Fill remaining empty cells with random letters `A-Z` (and `Ñ` randomly injected with Spanish letter frequency).
5.  **Verify Duplicates**:
    - Search the completed grid for all chosen words in all 8 directions.
    - If any target word is found $\ge 2$ times, discard the grid, increment the generation attempt count, and restart.

### 3.2 UI Selection Engine (Dual Mechanic)
- We listen to pointer events (`pointerdown`, `pointermove`, `pointerup`) on the board cells.
- **Active Selection State**:
  - `startCell`: `{ x, y }` or null.
  - `currentCell`: `{ x, y }` or null.
  - `isDragging`: boolean.
- **Line Validation**:
  - Let $dx = x_{current} - x_{start}$ and $dy = y_{current} - y_{start}$.
  - A path is valid if:
    - $dx = 0$ (vertical)
    - $dy = 0$ (horizontal)
    - $|dx| = |dy|$ (diagonal)
  - If valid, collect all cells along the line.
- **Pointer Handlers**:
  - `pointerdown` on a cell: Set `startCell` and `currentCell`. Set `isDragging = true`. Highlight the starting cell.
  - `pointermove`: If `isDragging`, update `currentCell`. If path is valid, temporarily highlight all intermediate cells.
  - `pointerup`: If `isDragging`, set `isDragging = false`. If a valid path is selected, commit the selection. If not dragging (simple tap) and `startCell` was already set from a previous tap, check the path from `startCell` to the tapped cell, then reset.
- **Word Verification**:
  - Extract the string formed by letters in the committed path (and its reverse).
  - If it matches a word in the target list that hasn't been found:
    - Add to `foundWords`.
    - Permanently highlight the cell indices (color-coded highlights).
    - Cross out the word in the list.
    - If all words are found, trigger the win screen.

---

## 4. Visual Styles

- **Theme Variable Sharing**: Inherit all CSS variables from `@sourceplay/shared/style.css` (`--paper`, `--ink`, `--teal`, etc.) to maintain consistency with the Sudoku design system.
- **Highlighter Design**: Found words will be visually marked on the board with rounded highlighted capsules.
- **Responsiveness**: The board aspect-ratio is locked at $1:1$ and scaled based on viewport size using `max-width: min(100%, 39vh)`, matching the Sudoku container logic.

---

## 5. Verification Plan

### Automated Verification
- Run TypeScript compilation on all packages (`npm run build:all`).
- Check that the assembly script `node scripts/assemble-build.js` builds selector, sudoku, nonogram, and wordsearch, and copies everything to selector dist.

### Manual Verification
- Open the dev server and test:
  1.  **Menu**: Check difficulty selection and seed input. Verify that grid size adjusts correctly.
  2.  **Gameplay**: Check word list display. Verify dual-selection interaction (clicking start + end, and dragging).
  3.  **Accidental words**: Verify word counts match, and target words are struck off exactly once.
  4.  **Reset & Exit**: Verify "Reiniciar" resets the timer and grid, and "Salir al menú" returns to difficulty selection.
  5.  **Themes**: Toggle Light/Dark mode and verify readability.
