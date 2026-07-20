### Task 3: PRNG Seed Progression on New Game

**Files:**
- Modify: `packages/wordle/src/main.ts:340-370`

**Interfaces:**
- Consumes: `customSeed`, `gameCount`
- Produces: `prng` instance for next secret word

- [ ] **Step 1: Update `loadNextWord()` and `startNewGame()` PRNG seed logic**

In `packages/wordle/src/main.ts`, maintain a `gameCount` offset when a custom seed is set so each "Nueva Partida" advances the PRNG sequence (`createPrng(customSeed + gameCount)`).

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit -p packages/wordle/tsconfig.json`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/wordle/src/main.ts
git commit -m "fix(wordle): advance PRNG seed sequence on new game with custom seed"
```

---

