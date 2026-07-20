# Task 3 Report: Normal Mode Tile Selection & Out-of-Order Gap Filling

## Summary of Changes

1. **CSS Focus Highlight (`packages/wordle/src/style.css`)**:
   - Added `.tile.selected` rule with blue outline (`#2196f3`), box shadow glow, and slight scale transform (`scale(1.03)`).

2. **Tile Selection & Out-of-Order Gap Filling (`packages/wordle/src/main.ts`)**:
   - Introduced `selectedIndex` state to track active focused tile.
   - Rendered active row tiles with click event listeners, setting `selectedIndex` and re-focusing `hiddenInput`.
   - Applied `.tile.selected` CSS class to the active tile.
   - Refactored character input (`insertCharacter`) to handle out-of-order gap filling in normal mode:
     - Allows setting characters at any tile slot via `selectedIndex`.
     - Automatically advances `selectedIndex` to the next empty tile slot.
     - Preserves existing letters while filling gaps.
   - Implemented `handleBackspace` to clear current tile if filled, or step backward and clear the preceding tile if current tile is empty.
   - Added keyboard left/right arrow key navigation (`ArrowLeft` / `ArrowRight`) to jump between active row tiles.
   - Integrated input handlers for physical keyboard, virtual keyboard, and hidden mobile input.
   - Reset `selectedIndex` to 0 on new game, next word, or guess submission.

## Verification

- **TypeScript Compilation**:
  - Ran `npx tsc --noEmit -p packages/wordle/tsconfig.json`.
  - Output: 0 errors (Exit code 0).

## Commit

- `5140956 feat(wordle): add tile selection and out-of-order gap filling in normal mode`
