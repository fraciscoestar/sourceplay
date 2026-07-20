# Design Spec: Palabra del Día (Wordle Clone) v2 Improvements

## 1. Overview & Goals
Upgrade the Palabra del Día game to address dictionary limitations, improve keyboard interaction, fix tile animation rendering bugs, and introduce tile-level focus selection in normal mode.

---

## 2. Expanded Dictionary & Hybrid Word Pool
- **Validation Dictionary (`VALIDATION_SET`)**:
  - Incorporates the complete RAE Spanish dictionary list (**57,017 words** between 4 and 10 letters).
  - Any valid word in this set will be accepted when submitted as a guess.
- **Secret Word Pool (`SECRET_POOL`)**:
  - A hybrid curated list of **~20,000 common and intermediate Spanish words** (lengths 4–10).
  - Obscure archaic terms, suffixes, and uncommon conjugated forms are excluded from secret word selection so players receive fair, recognizable words.
- **Short Word Toast Validation**:
  - If player hits `Enter` with fewer than 4 characters, guess submission is blocked and toast is displayed: `"Palabra demasiado corta (mínimo 4 letras)"`.

---

## 3. On-Screen Virtual Keyboard & Tildes Mode
- **Layout**:
  - Row 1: `Q W E R T Y U I O P`
  - Row 2: `A S D F G H J K L Ñ`
  - Row 3: `[ENTER] Z X C V B N M [BACKSPACE]`
  - Row 4 (Only visible when `tildesMode` is enabled): `Á É Í Ó Ú`
- **Interactive Clues (Key Coloring)**:
  - Keys dynamically update status classes based on revealed clues:
    - `.key.correct` (Green)
    - `.key.present` (Yellow)
    - `.key.absent` (Darkened / Grayed out)
- **Input Sync**:
  - Tapping/clicking any virtual key triggers character entry, Backspace, or Enter submission.
  - Keyboard colors reset on new game or next word in Time Trial.

---

## 4. Normal Mode: Tile Selection & Free Gap Filling
- **Tile Focus Selection**:
  - Active attempt row renders `L` tiles (where `L` is secret word length).
  - Clicking any tile in the active row selects it (`selectedIndex`), adding a `.selected` outline style.
  - Typing a letter replaces/fills the character at `selectedIndex` and advances focus to the next empty tile.
  - Allows players to fill known clues first (e.g. 1st and 4th position) and fill remaining blank slots afterwards.
- **Backspace & Delete Behavior**:
  - Backspace clears character at `selectedIndex` (or previous tile if current tile is blank) and moves focus backwards.

---

## 5. Letroso Mode & Tile Animation Fixes
- **Letroso Zero-Tile Initial State**:
  - Active attempt row in Letroso mode starts with **0 tiles** (no empty placeholder boxes).
  - Tiles appear dynamically one by one as characters are typed (1, 2, 3...).
- **Tile Animation Pop Overflow Fix**:
  - Adjust `.tile.pop` keyframes animation transform scale from `1.15` down to `1.05` with `box-shadow` inset emphasis.
  - Add `overflow-y: auto; overflow-x: hidden;` and padded borders on `.attempts-container` to prevent popped tile borders from clipping under container boundaries.

---

## 6. Verification & Test Plan
1. **Dictionary Test**: Verify common and rare words (e.g., "ZANGANO", "ECOLOGIA") are validated successfully, while non-words are rejected.
2. **Keyboard Test**: Verify keys update colors (correct/present/absent) and Tildes row `Á É Í Ó Ú` toggles with `tildesMode`.
3. **Tile Selection Test**: Click 3rd box in normal mode, type letter, confirm only 3rd box fills and focus moves to 4th.
4. **Short Word Test**: Type 2 letters, hit Enter, confirm toast appears and guess is not submitted.
5. **Build Test**: Run `npx tsc` and `npm run build:all` to ensure zero compilation errors across monorepo.
