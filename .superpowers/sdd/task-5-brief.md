### Task 5: Monorepo Integration & End-to-End Build Verification

**Files:**
- Modify: `packages/lights-out/tsconfig.json` (Verify compilation output)

**Interfaces:**
- Consumes: All files
- Produces: Integrated build ready for selector homepage assembly

- [ ] **Step 1: Run complete build**
  Run: `npm run build:all`
  Expected: All packages compiled successfully and selector workspace assembled.

- [ ] **Step 2: Start workspace dev servers**
  Run: `npm run dev`
  Expected: Output showing all dev servers (selector, sudoku, nonogram, wordsearch, sliding-puzzle, lights-out) starting up correctly.

- [ ] **Step 3: Verification of homepage selection**
  - Load the dev selector homepage (port 5173).
  - Verify that "Apaga las Luces" card appears.
  - Click the card and verify redirection to Lights Out page (port 5178) passing the theme parameter.
  - Perform manual verification of difficulty layouts (4x4, 5x5, 7x7, 9x9), seed determinism, undo/redo, checkpoint slot boundaries, and hint animations.
