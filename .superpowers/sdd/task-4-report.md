# Task 4 Report: Main View Controller, History & Checkpoints

## What Was Implemented

1. **Main View Controller (`packages/lights-out/src/main.ts`):**
   - Bindings for start menu and gameplay interface DOM elements.
   - Seed parsing (`parseSeed`) and random generation (`randomSeed`) bindings.
   - Dynamic difficulty selector matching UI vertical buttons.
   - Dynamic grid rendering and cell-toggling logic including orth neighbors.
   - Deep copy game history states stack supporting up to 100 moves.
   - Multi-slot checkpoint persistence using LocalStorage (up to 3 slots), checkpoint deletion/loading, and list visualization.
   - Keyboard shortcuts (`Ctrl+Z` to undo, `Ctrl+Y` to redo).
   - Re-runs, resets, confirms, win-screen triggers showing moves vs optimal solver steps, and main menu exits.

## Verification Steps and Outputs

1. **Tested with core solver mathematical checks:**
   ```bash
   npx tsx packages/lights-out/src/test-solver.ts
   ```
   **Output:**
   ```
   Running solver mathematical checks...
   - Difficulty facil (N=4): optimal moves = 4
   - Difficulty medio (N=5): optimal moves = 9
   - Difficulty dificil (N=7): optimal moves = 21
   - Difficulty experto (N=9): optimal moves = 27
   ALL MATHEMATICAL TESTS PASSED!
   ```

2. **Verified production build using Vite:**
   ```bash
   npm run build --workspace=@sourceplay/lights-out
   ```
   **Output:**
   ```
   vite v5.4.21 building for production...
   ✓ built in 254ms
   ```

3. **Verified monorepo build:**
   ```bash
   npm run build:all
   ```
   **Output:**
   ```
   Ensamblando despliegue final de SourcePlay...
   Copiando build de Apaga las Luces de C:\Users\Fraci\Desktop\typescript projects\sourceplay\packages\lights-out\dist a C:\Users\Fraci\Desktop\typescript projects\sourceplay\apps\selector\dist\games\lights-out...
   ¡Apaga las Luces copiado con éxito!
   Ensamblado completado con éxito.
   ```

## Files Changed

- **Modified:**
   - [packages/lights-out/src/main.ts](file:///c:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/lights-out/src/main.ts)

## Self-Review Findings

- **Completeness:** Implemented all functionality requested in the spec including keyboard events, history limits, checkpoints, confirmations, and toast/modal feedback.
- **Quality:** Code is clear and well-structured, referencing imported elements properly.
- **Testing:** The production build succeeded, and the math solver tests passed successfully.
- **Linter Checks:** Removed the unused `SIZES` import to resolve the TypeScript compile error.

## Issues/Concerns
None.

## Reviewer Findings and Fixes

In response to the reviewer findings, the following fixes were successfully applied to [packages/lights-out/src/main.ts](file:///c:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/lights-out/src/main.ts):

1. **Unsafe HTML Insertion (Stored XSS):**
   - Added `escapeHtml(str: string): string` helper function.
   - Escaped `cp.name` inside `openLoadCheckpointModal` before injecting it into the HTML card layout.

2. **Global Keyboard Shortcuts during Modal Overlays:**
   - Updated the global `keydown` shortcut listener to return early if `document.querySelector('.overlay.show') !== null`.

3. **Strict Timer ID Check:**
   - Replaced truthiness checks of `timerInterval` with strict `timerInterval !== null` comparisons in `startTimer` and `stopTimer`.

### Post-Fix Verification

1. **Test Solver Execution:**
   - Command: `npx tsx packages/lights-out/src/test-solver.ts`
   - Output: `ALL MATHEMATICAL TESTS PASSED!`

2. **Vite Workspace Build:**
   - Command: `npm run build --workspace=@sourceplay/lights-out`
   - Output: Successful build (`dist/index.html`, assets compilation complete).

## Re-Review Findings and Fixes

In response to the re-review findings, the following fixes were successfully applied to [packages/lights-out/src/main.ts](file:///c:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/lights-out/src/main.ts):

1. **Stuck Confirm Modal on Load:**
   - Modified `handleCheckpointAction()` under `action === 'load'` so that the confirmation overlay callback invokes `hideConfirmModal()` immediately before calling `performLoad(id)`.

2. **Move Counter Stale on Undo/Redo:**
   - Updated `undoMove()` and `redoMove()` to set `state.moveCount = state.historyIndex` and updated the UI label: `movesLabelEl.textContent = "Movimientos: " + state.moveCount;` so that it matches the current position in the history stack.

3. **Stale Modal on Last Checkpoint Deletion:**
   - Modified `openLoadCheckpointModal()` to call `loadCheckpointOverlayEl.classList.remove('show');` to close the overlay if the checkpoint list becomes empty.

### Verification of Re-Review Fixes

1. **Test Solver Execution:**
   - Command: `npx tsx packages/lights-out/src/test-solver.ts`
   - Output: `ALL MATHEMATICAL TESTS PASSED!`

2. **Vite Workspace Build:**
   - Command: `npm run build --workspace=@sourceplay/lights-out`
   - Output: Successful build (`dist/index.html`, assets compilation complete).


## Additional Re-Review Findings and Fixes (Move Counter and Toast)

In response to the latest task 4 re-review findings, the following fixes and clarifications were successfully implemented:

1. **Move Counter Logic on Undo/Redo:**
   - Updated `undoMove()` to decrement the move counter via `state.moveCount--` and updated the UI label, rather than setting it to `state.historyIndex`.
   - Updated `redoMove()` to increment the move counter via `state.moveCount++` and updated the UI label, rather than setting it to `state.historyIndex`.
   - This resolves bugs where loading checkpoints resets `state.historyIndex` but retains `state.moveCount`, and avoids incorrect moves counting when the history stack shifts (exceeds 100 elements).

2. **Toast Timer Overlap Resolution:**
   - Introduced a global `toastTimeout: number | null = null;` variable.
   - Modified `showToast()` to clear the active timeout using `clearTimeout(toastTimeout)` if a previous toast timer exists before scheduling a new timeout. This prevents rapidly triggered toasts from hiding prematurely.

3. **Checkpoints Lifecycle Clarification:**
   - Added code comments to [packages/lights-out/src/main.ts](file:///c:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/lights-out/src/main.ts) clarifying that clearing checkpoints in `handleStartGame()` and `goToMainMenu()` is plan-mandated.
   - This session-level lifecycle aligns with the sliding-puzzle behavior, preventing cross-seed checkpoint corruption and matching the design specification exactly.

### Verification of Latest Fixes

1. **Test Solver Execution:**
   - Command: `npx tsx packages/lights-out/src/test-solver.ts`
   - Output:
     ```
     Running solver mathematical checks...
     - Difficulty facil (N=4): optimal moves = 4
     - Difficulty medio (N=5): optimal moves = 9
     - Difficulty dificil (N=7): optimal moves = 21
     - Difficulty experto (N=9): optimal moves = 27
     ALL MATHEMATICAL TESTS PASSED!
     ```

2. **Vite Workspace Build:**
   - Command: `npm run build --workspace=@sourceplay/lights-out`
   - Output: Successful build with Vite (`dist/index.html` and compilation complete).

