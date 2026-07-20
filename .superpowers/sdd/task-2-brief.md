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

