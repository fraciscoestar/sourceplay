### Task 4: Submit Button Relocation, Surrender Flag Icon Button, & Surrender Modal

**Files:**
- Modify: `packages/wordle/index.html`
- Modify: `packages/wordle/src/style.css`
- Modify: `packages/wordle/src/main.ts`

**Interfaces:**
- Consumes: Virtual keyboard layout array, action buttons container DOM
- Produces: Relocated Enviar button, small surrender flag button (`#revealWordBtn`), modal dialog `#surrenderModal`

- [ ] **Step 1: Remove `ENTER` key from virtual keyboard layout array**

In `packages/wordle/src/main.ts`, update `renderKeyboard()` rows array so Row 3 is `['Z','X','C','V','B','N','M','⌫']`.

- [ ] **Step 2: Update HTML structure in `index.html`**

In `packages/wordle/index.html`, place `#submitGuessBtn` ("Enviar") prominently in the controls bar. Next to it, render `#revealWordBtn` with a Lucide `flag` SVG icon, `title="Rendirse / Revelar palabra"`, and add `#surrenderModal` dialog HTML.

- [ ] **Step 3: Update CSS for action bar buttons & modal**

In `packages/wordle/src/style.css`, add styles for `#submitGuessBtn`, `#revealWordBtn` (icon-only button), and `#surrenderModal`.

- [ ] **Step 4: Implement surrender modal confirmation in `main.ts`**

In `packages/wordle/src/main.ts`, bind `#revealWordBtn` to open `#surrenderModal`. On modal confirmation, execute `revealWord()`.

- [ ] **Step 5: Verify monorepo build**

Run: `npm run build:all`
Expected: PASS across all packages.

- [ ] **Step 6: Commit**

```bash
git add packages/wordle/index.html packages/wordle/src/style.css packages/wordle/src/main.ts
git commit -m "feat(wordle): relocate Enviar button, add surrender flag button and confirmation modal"
```
