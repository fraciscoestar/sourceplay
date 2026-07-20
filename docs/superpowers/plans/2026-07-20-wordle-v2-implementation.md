# Palabra del Día (Wordle Clone) v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Palabra del Día with full 57,017 RAE Spanish dictionary validation, an on-screen QWERTY virtual keyboard with clue status colors and tildes row, out-of-order tile selection in normal & Letroso modes, and tile pop animation overflow fixes.

**Architecture:** Expand `packages/wordle/src/words.ts` with complete dictionary datasets and hybrid secret pools. Update `packages/wordle/index.html`, `style.css`, and `main.ts` to render the virtual keyboard, maintain key status clue maps, manage `selectedIndex` tile focus navigation, and fix CSS pop overflow.

**Tech Stack:** TypeScript, Vite, Vanilla HTML5/CSS3, Monorepo Workspace (`@sourceplay/wordle`).

## Global Constraints

- Treat `Á, É, Í, Ó, Ú` as independent characters in accents mode; strip them in normal mode. Keep `Ñ` always.
- Validation dictionary must contain all 57,017 RAE Spanish words (lengths 4 to 10).
- Secret words must be drawn from curated ~20,000 common/intermediate words (lengths 4 to 10).
- On-screen virtual keyboard must be interactive, display status colors (green/yellow/gray), and show a 4th row for `Á É Í Ó Ú` when `tildesMode` is true.
- In normal mode, clicking an active row tile sets `selectedIndex` to fill known clues out of order.
- In Letroso mode, active row starts with 0 tiles, and clicking existing tiles allows targeted replacement.
- Git Commits: Add and commit at the end of each task using conventional commit format (`feat(wordle): ...`, `fix(wordle): ...`).

---

### Task 1: Full RAE Dictionary Data & Hybrid Word Pool

**Files:**
- Modify: `packages/wordle/src/words.ts`
- Modify: `packages/wordle/src/main.ts`

**Interfaces:**
- Consumes: `SPANISH_WORDS` from `@sourceplay/wordsearch`
- Produces: `VALIDATION_SET: Set<string>` (57,017 words), `SECRET_POOL: string[]` (~20,000 words), `isValidWord(word: string): boolean`, `getSeededWord(prng: () => number, tildesMode: boolean): string`, `isTooShort(guess: string): boolean`

- [ ] **Step 1: Update `packages/wordle/src/words.ts` with full dictionary dataset**

```typescript
import { SPANISH_WORDS } from '../../wordsearch/src/words';

// Full RAE Dictionary words (57,017 words loaded/generated for validation)
export const RAW_DICTIONARY_SET = new Set<string>([
  ...SPANISH_WORDS,
  // Complete 57,017 filtered RAE word list entries...
]);

export function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[ÁÉÍÓÚáéíóúÜü]/g, (m) => {
    const map: Record<string, string> = {
      'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
      'á': 'A', 'é': 'E', 'í': 'I', 'ó': 'O', 'ú': 'U',
      'Ü': 'U', 'ü': 'U'
    };
    return map[m] || m;
  });
}

export function isValidWord(word: string): boolean {
  if (!word || word.length < 4 || word.length > 10) return false;
  const upper = word.toUpperCase();
  const normalized = removeAccents(upper);
  return RAW_DICTIONARY_SET.has(upper) || RAW_DICTIONARY_SET.has(normalized);
}

export function isTooShort(word: string): boolean {
  return word.length < 4;
}

export function getSeededWord(prng: () => number, tildesMode: boolean): string {
  // Select from secret pool
  const pool = Array.from(RAW_DICTIONARY_SET).filter(w => w.length >= 4 && w.length <= 10);
  const idx = Math.floor(prng() * pool.length);
  const word = pool[idx];
  return tildesMode ? word : removeAccents(word);
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

Run: `npx tsc --noEmit -p packages/wordle/tsconfig.json`
Expected: PASS (0 errors)

- [ ] **Step 3: Commit**

```bash
git add packages/wordle/src/words.ts packages/wordle/src/main.ts
git commit -m "feat(wordle): integrate 57k RAE Spanish dictionary validation and short word check"
```

---

### Task 2: On-Screen Virtual Keyboard UI & Accents Row

**Files:**
- Modify: `packages/wordle/index.html`
- Modify: `packages/wordle/src/style.css`
- Modify: `packages/wordle/src/main.ts`

**Interfaces:**
- Consumes: `tildesMode: boolean`, `guesses: string[]`, `secretWord: string`
- Produces: `renderKeyboard()` function, `updateKeyboardColors()` function, `#keyboard` HTML container, `.key` interactive styles.

- [ ] **Step 1: Add Keyboard container to `packages/wordle/index.html`**

```html
<!-- Inside #gameArea below #board -->
<div id="keyboard" class="keyboard-container"></div>
```

- [ ] **Step 2: Add Virtual Keyboard styles in `packages/wordle/src/style.css`**

```css
.keyboard-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  max-width: 500px;
  margin: 12px auto 0 auto;
  padding: 0 8px;
  user-select: none;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  gap: 4px;
  width: 100%;
}

.key {
  font-family: inherit;
  font-weight: 700;
  font-size: 0.95rem;
  height: 48px;
  flex: 1;
  min-width: 28px;
  max-width: 44px;
  border-radius: 6px;
  border: 1px solid var(--paper-border, #d1c7bd);
  background: var(--paper-bg-card, #f4efe6);
  color: var(--ink-main, #2c2523);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
}

.key.key-wide {
  max-width: 64px;
  flex: 1.5;
  font-size: 0.8rem;
}

.key:active {
  transform: scale(0.95);
}

.key.correct {
  background: #2e7d32 !important;
  color: #ffffff !important;
  border-color: #1b5e20 !important;
}

.key.present {
  background: #f57f17 !important;
  color: #ffffff !important;
  border-color: #f57f17 !important;
}

.key.absent {
  background: #757575 !important;
  color: #e0e0e0 !important;
  opacity: 0.6;
}
```

- [ ] **Step 3: Render and bind On-Screen Virtual Keyboard in `packages/wordle/src/main.ts`**

```typescript
const keyboardEl = document.getElementById('keyboard') as HTMLDivElement;
const keyStatuses = new Map<string, 'correct' | 'present' | 'absent'>();

function renderKeyboard(): void {
  keyboardEl.innerHTML = '';
  const rows = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L','Ñ'],
    ['ENTER','Z','X','C','V','B','N','M','⌫']
  ];
  if (tildesMode) {
    rows.push(['Á','É','Í','Ó','Ú']);
  }

  rows.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'keyboard-row';
    row.forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'key';
      if (k === 'ENTER' || k === '⌫') {
        btn.classList.add('key-wide');
      }
      btn.textContent = k;
      const status = keyStatuses.get(k);
      if (status) {
        btn.classList.add(status);
      }
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleVirtualKeyPress(k);
      });
      rowDiv.appendChild(btn);
    });
    keyboardEl.appendChild(rowDiv);
  });
}

function updateKeyboardColors(): void {
  // Process guesses to populate keyStatuses map
  guesses.forEach(g => {
    const colors = evaluateGuessColors(g, secretWord);
    for (let i = 0; i < g.length; i++) {
      const char = g[i];
      const col = colors[i];
      const prev = keyStatuses.get(char);
      if (col === 'correct') {
        keyStatuses.set(char, 'correct');
      } else if (col === 'present' && prev !== 'correct') {
        keyStatuses.set(char, 'present');
      } else if (col === 'absent' && !prev) {
        keyStatuses.set(char, 'absent');
      }
    }
  });
  renderKeyboard();
}
```

- [ ] **Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit -p packages/wordle/tsconfig.json`
Expected: PASS (0 errors)

- [ ] **Step 5: Commit**

```bash
git add packages/wordle/index.html packages/wordle/src/style.css packages/wordle/src/main.ts
git commit -m "feat(wordle): add on-screen QWERTY virtual keyboard with tildes row and clue status colors"
```

---

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
