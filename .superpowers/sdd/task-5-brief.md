### Task 5: Tile Animation Overflow Fixes & Full Monorepo Assembly Check

**Files:**
- Modify: `packages/wordle/src/style.css`

**Interfaces:**
- Consumes: `.tile.pop` animation keyframes, `.attempts-container` CSS properties
- Produces: Clean non-overflowing pop animation and container bounds.

- [ ] **Step 1: Update `.tile.pop` and `.attempts-container` in `packages/wordle/src/style.css`**

```css
.attempts-container {
  flex: 1;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
}

@keyframes tilePop {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.tile.pop {
  animation: tilePop 0.15s ease-in-out forwards;
}
```

- [ ] **Step 2: Run full monorepo compilation and assembly test**

Run: `npm run build:all`
Expected: PASS (all workspace packages and selector assemble cleanly)

- [ ] **Step 3: Commit**

```bash
git add packages/wordle/src/style.css
git commit -m "fix(wordle): fix tile pop animation overflow and container clipping bounds"
```
