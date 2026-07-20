### Task 2: On-Screen Virtual Keyboard Dark Theme Styling

**Files:**
- Modify: `packages/wordle/src/style.css:210-280`

**Interfaces:**
- Consumes: CSS theme variables `--paper-bg-light`, `--paper-bg-dark`, `--paper-text`, `--paper-border`
- Produces: Dark-mode responsive keyboard styles (`.key`, `.key.correct`, `.key.present`, `.key.absent`)

- [ ] **Step 1: Add dark theme CSS rules for keyboard keys**

In `packages/wordle/src/style.css`, add `[data-theme="dark"] .key`, `[data-theme="dark"] .key.absent`, and theme-aware styling for keyboard container.

- [ ] **Step 2: Verify CSS styles**

Run: `npx tsc --noEmit -p packages/wordle/tsconfig.json`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/wordle/src/style.css
git commit -m "fix(wordle): support dark mode styling for on-screen virtual keyboard"
```

---

