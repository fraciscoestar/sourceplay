# Task 4 Report: Submit Button Relocation, Surrender Flag Icon Button, & Surrender Modal

## Status
DONE

## Summary of Changes
1. **Virtual Keyboard Layout (`packages/wordle/src/main.ts`)**:
   - Removed `'ENTER'` key from Row 3 of the virtual keyboard array in `renderKeyboard()`.
2. **HTML Structure (`packages/wordle/index.html`)**:
   - Relocated `#submitGuessBtn` ("Enviar") to `gameplayButtonsRow`.
   - Rendered small outline `#revealWordBtn` with Lucide flag SVG icon and `title="Rendirse / Revelar palabra"`.
   - Added `#surrenderModal` confirmation overlay HTML with Cancelar/Confirmar options.
3. **CSS Styling (`packages/wordle/src/style.css`)**:
   - Styled `#revealWordBtn.icon-btn` as a warning/amber icon-only button with hover feedback.
4. **Surrender Modal Handler (`packages/wordle/src/main.ts`)**:
   - Bound `#submitGuessBtn` to `submitGuess()`.
   - Bound `#revealWordBtn` to show `#surrenderModal`.
   - Bound `#surrenderCancelBtn` and `#surrenderConfirmBtn` to hide modal and invoke `handleRevealWord()`.

## Verification
- Ran `npm run build:all` and `npm run build --workspace=@sourceplay/wordle` successfully with zero TypeScript or build errors.

## Commits Created
- `59db939` feat(wordle): relocate Enviar button, add surrender flag button and confirmation modal
