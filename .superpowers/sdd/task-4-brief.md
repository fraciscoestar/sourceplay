### Task 4: Letroso Mode Starting State & Tile Selection / Editing

**Files:**
- Modify: `packages/wordle/src/main.ts`

**Interfaces:**
- Consumes: `hiddenLengthMode = true`, `currentGuess: string`
- Produces: 0-tile initial active row rendering, tile selection & replace logic for Letroso mode.

- [ ] **Step 1: Implement 0-tile initial state and tile selection for Letroso mode in `main.ts`**

```typescript
function handleLetrosoInput(char: string): void {
  if (!hiddenLengthMode) return;
  
  let chars = currentGuess.split('');
  if (selectedIndex < chars.length) {
    chars[selectedIndex] = char;
  } else if (chars.length < 10) {
    chars.push(char);
    selectedIndex = chars.length;
  }
  currentGuess = chars.join('');
  renderBoard();
}
```

- [ ] **Step 2: Handle Backspace deletion at `selectedIndex` in Letroso mode**

```typescript
function handleBackspace(): void {
  if (currentGuess.length === 0) return;
  let chars = currentGuess.split('');
  if (hiddenLengthMode) {
    if (selectedIndex < chars.length) {
      chars.splice(selectedIndex, 1);
      if (selectedIndex > 0 && selectedIndex >= chars.length) {
        selectedIndex = chars.length - 1;
      }
    } else {
      chars.pop();
      selectedIndex = Math.max(0, chars.length);
    }
  } else {
    chars[selectedIndex] = '';
    if (selectedIndex > 0) selectedIndex--;
  }
  currentGuess = chars.join('');
  renderBoard();
}
```

- [ ] **Step 3: Add short word check (`< 4` characters) in `submitGuess()`**

```typescript
function submitGuess(): void {
  if (isTooShort(currentGuess)) {
    showToast('Palabra demasiado corta (mínimo 4 letras)');
    return;
  }
  if (!isValidWord(currentGuess)) {
    showToast('Palabra no encontrada en el diccionario');
    return;
  }
  // Proceed with guess evaluation...
}
```

- [ ] **Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit -p packages/wordle/tsconfig.json`
Expected: PASS (0 errors)

- [ ] **Step 5: Commit**

```bash
git add packages/wordle/src/main.ts
git commit -m "feat(wordle): add Letroso zero-tile initial start, tile editing, and short word toast validation"
```

---

