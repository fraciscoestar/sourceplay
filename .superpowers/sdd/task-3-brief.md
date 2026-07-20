### Task 3: Normal Mode Tile Selection & Out-of-Order Gap Filling

**Files:**
- Modify: `packages/wordle/src/style.css`
- Modify: `packages/wordle/src/main.ts`

**Interfaces:**
- Consumes: `currentGuess: string`, `secretWord: string`, `hiddenLengthMode: boolean`
- Produces: `selectedIndex: number`, `.tile.selected` focus styling, out-of-order character replacement logic.

- [ ] **Step 1: Add `.tile.selected` CSS in `packages/wordle/src/style.css`**

```css
.tile.selected {
  border-color: #2196f3 !important;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.4);
  transform: scale(1.03);
}
```

- [ ] **Step 2: Add `selectedIndex` state and tile click focus in `packages/wordle/src/main.ts`**

```typescript
let selectedIndex = 0;

function renderBoard(): void {
  // Render historical guesses...
  // Render active row:
  const activeRow = document.createElement('div');
  activeRow.className = 'row active-row';
  
  const targetLen = hiddenLengthMode ? Math.max(currentGuess.length, 0) : secretWord.length;
  
  // Pad currentGuess array representation
  const chars = currentGuess.split('');
  while (!hiddenLengthMode && chars.length < targetLen) {
    chars.push('');
  }
  
  chars.forEach((ch, idx) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    if (ch) tile.classList.add('pop');
    if (idx === selectedIndex) tile.classList.add('selected');
    tile.textContent = ch;
    tile.addEventListener('click', () => {
      selectedIndex = idx;
      renderBoard();
    });
    activeRow.appendChild(tile);
  });
  
  attemptsContainer.appendChild(activeRow);
}
```

- [ ] **Step 3: Update character entry & Backspace handling for `selectedIndex`**

```typescript
function insertCharacter(char: string): void {
  const maxLen = hiddenLengthMode ? 10 : secretWord.length;
  let chars = currentGuess.split('');
  
  if (hiddenLengthMode) {
    if (selectedIndex < chars.length) {
      chars[selectedIndex] = char;
    } else if (chars.length < maxLen) {
      chars.push(char);
      selectedIndex = chars.length;
    }
  } else {
    while (chars.length < maxLen) chars.push('');
    chars[selectedIndex] = char;
    // Advance selectedIndex to next empty tile
    let nextEmpty = chars.findIndex((c, i) => i > selectedIndex && c === '');
    if (nextEmpty !== -1) {
      selectedIndex = nextEmpty;
    } else if (selectedIndex < maxLen - 1) {
      selectedIndex++;
    }
  }
  currentGuess = chars.join('').trimEnd();
  renderBoard();
}
```

- [ ] **Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit -p packages/wordle/tsconfig.json`
Expected: PASS (0 errors)

- [ ] **Step 5: Commit**

```bash
git add packages/wordle/src/style.css packages/wordle/src/main.ts
git commit -m "feat(wordle): add tile selection and out-of-order gap filling in normal mode"
```

---

